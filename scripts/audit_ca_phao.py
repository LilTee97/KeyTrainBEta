"""Read-only MusicXML audit. Usage: python -B scripts/audit_ca_phao.py SHEET [BAR ...].

Outputs written harmony, RH/LH note records and ties. Never infers vocal/fill roles.
The legacy 'attacks' key includes tie continuations: exclude tie-stop records when counting attacks.
Offsets are quarter notes from measure start (zero-based), not displayed beat numbers.
Scope: the piano score-partwise sheets in this audit, not transposing instruments.
Pitch already carries the sounding octave; do not apply octave-shift again.
"""
import collections
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

STEP = dict(C=0, D=2, E=4, F=5, G=7, A=9, B=11)


def load(path):
    if not zipfile.is_zipfile(path):
        return ET.parse(path).getroot()
    with zipfile.ZipFile(path) as z:
        container = ET.fromstring(z.read('META-INF/container.xml'))
        source = next(e.get('full-path') for e in container.iter() if e.tag.endswith('rootfile'))
        return ET.fromstring(z.read(source))


def pitch(el):
    step, alt, octv = el.findtext('step'), int(el.findtext('alter') or 0), int(el.findtext('octave'))
    name = step + ('#' * alt if alt > 0 else 'b' * -alt) + str(octv)
    return name, (octv + 1) * 12 + STEP[step] + alt


def audit(path, *, dynamics=False, actual_pickups=False):
    root = load(path)
    result = {}
    parts = root.findall('part')
    for part_index, part in enumerate(parts):
        div, barlen = 1, 4
        for measure in part.findall('measure'):
            bar = measure.get('number')
            info = result.setdefault(bar, dict(harmony=[], attacks=[], length=barlen))
            previous_part_length = info['length'] if part_index else 0
            cursor, previous, extent = 0, 0, 0
            for el in measure:
                if el.tag == 'attributes':
                    div = int(el.findtext('divisions') or div)
                    time = el.find('time')
                    if time is not None:
                        barlen = int(time.findtext('beats')) * 4 / int(time.findtext('beat-type'))
                    info['length'] = barlen
                elif el.tag in ('backup', 'forward'):
                    cursor += (-1 if el.tag == 'backup' else 1) * float(el.findtext('duration') or 0) / div
                    extent = max(extent, cursor)
                elif el.tag == 'harmony':
                    r, b = el.find('root'), el.find('bass')
                    if r is None:
                        continue
                    def spell(node, prefix):
                        alt = int(node.findtext(prefix+'-alter') or 0)
                        return node.findtext(prefix+'-step') + ('#'*alt if alt>0 else 'b'*-alt)
                    info['harmony'].append(dict(at=round(cursor + float(el.findtext('offset') or 0)/div,6),
                        root=spell(r,'root'), kind=el.findtext('kind'), text=el.find('kind').get('text'),
                        bass=spell(b,'bass') if b is not None else None,
                        degrees=[(d.findtext('degree-value'),d.findtext('degree-alter'),d.findtext('degree-type')) for d in el.findall('degree')]))
                elif el.tag == 'note':
                    duration = float(el.findtext('duration') or 0)/div
                    chord = el.find('chord') is not None
                    grace = el.find('grace') is not None
                    onset = previous if chord else cursor
                    extent = max(extent, onset + duration)
                    p = el.find('pitch')
                    if p is not None:
                        name, midi = pitch(p)
                        info['attacks'].append(dict(at=round(onset,6),dur=round(duration,6),pitch=name,midi=midi,
                            hand=int(el.findtext('staff') or 1) if len(parts)==1 else part_index+1,
                            voice=el.findtext('voice') or '1',grace=grace,
                            articulations=[a.tag for a in el.findall('notations/articulations/*')],
                            arpeggiate=el.find('notations/arpeggiate') is not None,
                            ties=[t.get('type') for t in el.findall('tie')]))
                        if dynamics and el.get('dynamics') is not None:
                            # MusicXML note dynamics is a percentage of MIDI forte 90.
                            info['attacks'][-1]['velocity'] = max(0, min(127, round(float(el.get('dynamics')) * .9)))
                    if not chord:
                        previous=onset
                        if not grace:
                            cursor+=duration
            if actual_pickups and measure.get('implicit') == 'yes' and extent > 0:
                # An incomplete pickup is not a full bar plus invented silence.
                info['length'] = max(previous_part_length, round(extent, 6))
    return result


def compact(info):
    groups=collections.defaultdict(list)
    for n in info['attacks']:
        groups[n['hand'],n['at']].append(n)
    return dict(length=info['length'], harmony=info['harmony'], hands={
        str(hand): ['%g:%s' % (at, '/'.join(n['pitch']+'('+str(n['dur'])+(' tie' if 'stop' in n['ties'] else '')+')' for n in notes))
            for (h,at),notes in sorted(groups.items()) if h==hand] for hand in [1,2]})


def self_check():
    from unittest.mock import patch
    root = ET.fromstring('''<score-partwise><part id="P1"><measure number="1">
      <attributes><divisions>4</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <harmony><root><root-step>D</root-step></root><kind text="m9">minor-ninth</kind></harmony>
      <note><grace/><pitch><step>C</step><alter>1</alter><octave>5</octave></pitch><staff>1</staff></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><staff>1</staff></note>
      <note><chord/><pitch><step>F</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
      <forward><duration>10</duration></forward>
      <harmony><root><root-step>G</root-step></root><kind>minor-seventh</kind></harmony>
      <note><pitch><step>B</step><alter>-1</alter><octave>3</octave></pitch><duration>2</duration><tie type="start"/><staff>1</staff></note>
      <backup><duration>16</duration></backup>
      <note><pitch><step>D</step><octave>2</octave></pitch><duration>16</duration><staff>2</staff></note>
      </measure><measure number="2"><note><pitch><step>B</step><alter>-1</alter><octave>3</octave></pitch>
      <duration>4</duration><tie type="stop"/><staff>1</staff></note></measure></part></score-partwise>''')
    with patch(__name__ + '.load', return_value=root):
        data = audit('in-memory')
    assert [n['at'] for n in data['1']['attacks']] == [0, 0, 0, 3.5, 0]
    assert data['1']['attacks'][0]['grace'] and data['1']['attacks'][0]['midi'] == 73
    assert data['1']['attacks'][-1]['hand'] == 2
    assert data['1']['harmony'][1]['at'] == 3.5
    assert data['2']['attacks'][0]['ties'] == ['stop']
    assert data['2']['attacks'][0]['dur'] == 1
    pickup = ET.fromstring('''<score-partwise><part id="P1"><measure number="0" implicit="yes">
      <attributes><divisions>4</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note dynamics="80"><pitch><step>C</step><octave>4</octave></pitch><duration>13</duration></note>
      <backup><duration>13</duration></backup><note><rest/><duration>8</duration><staff>2</staff></note>
      </measure><measure number="1"><note><rest/><duration>16</duration></note></measure></part></score-partwise>''')
    with patch(__name__ + '.load', return_value=pickup):
        measured = audit('in-memory', dynamics=True, actual_pickups=True)
        assert measured['0']['length'] == 3.25 and measured['1']['length'] == 4
        assert measured['0']['attacks'][0]['velocity'] == 72
        assert audit('in-memory')['0']['length'] == 4  # legacy/Bossa callers unchanged
    pickup.append(ET.fromstring('''<part id="P2"><measure number="0" implicit="yes">
      <attributes><divisions>4</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><rest/><duration>8</duration></note></measure></part>'''))
    with patch(__name__ + '.load', return_value=pickup):
        assert audit('in-memory', actual_pickups=True)['0']['length'] == 3.25
    print('MusicXML audit self-check OK')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if sys.argv[1:] == ['--self-check']:
        self_check()
        sys.exit(0)
    data=audit(sys.argv[1])
    if len(sys.argv)>2:
        output={bar:compact(data[bar]) for bar in sys.argv[2:] if bar in data}
    else:
        output={'file':str(Path(sys.argv[1]).name),'bars':len(data),'harmonyCounts':dict(collections.Counter(
            h['root']+':'+str(h['kind'])+('/'+h['bass'] if h['bass'] else '') for b in data.values() for h in b['harmony'])),
            'harmonyByBar':{bar:[f"{h['at']:g} {h['root']}:{h['kind']}"+('/'+h['bass'] if h['bass'] else '') for h in b['harmony']] for bar,b in data.items() if b['harmony']}}
    print(json.dumps(output,ensure_ascii=False,indent=2))
