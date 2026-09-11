"""Read-only MusicXML rhythm audit. Run: python tools/audit_ca_phao_rhythm.py.

Unlike the legacy PianoBrain reader, chord members share the previous note's
onset, and tie stops are continuations, not new attacks. No corpus writes.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile

BRAIN = Path(__file__).resolve().parents[2] / 'PianoBrain'
sys.path.insert(0, str(BRAIN / 'tools/sheet'))
from bac_not import tim_file


def load(path):
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            container = ET.fromstring(archive.read('META-INF/container.xml'))
            name = next(e.attrib['full-path'] for e in container.iter()
                        if e.tag.split('}')[-1] == 'rootfile')
            return ET.fromstring(archive.read(name))
    return ET.parse(path).getroot()


def read(root):
    notes, harmonies, bars, warnings = [], [], {}, []
    parts = root.findall('part')
    for pi, part in enumerate(parts):
        divisions, length = 1, 4
        for measure in part.findall('measure'):
            bar = int(measure.attrib['number'])
            at, previous = 0, 0
            for el in measure:
                if el.tag == 'attributes':
                    divisions = int(el.findtext('divisions') or divisions)
                    time = el.find('time')
                    if time is not None:
                        length = int(time.findtext('beats')) * 4 / int(time.findtext('beat-type'))
                elif el.tag in ('backup', 'forward'):
                    at += (1 if el.tag == 'forward' else -1) * int(el.findtext('duration')) / divisions
                elif el.tag == 'harmony' and pi == 0:
                    harmonies.append((bar, at + float(el.findtext('offset') or 0) / divisions,
                                      el.findtext('root/root-step'), el.findtext('root/root-alter') or '0',
                                      el.findtext('kind')))
                elif el.tag == 'note':
                    dur = float(el.findtext('duration') or 0) / divisions
                    chord = el.find('chord') is not None
                    grace = el.find('grace') is not None
                    onset = previous if chord else at
                    pitch = el.find('pitch')
                    if pitch is not None and not grace:
                        ties = {t.attrib['type'] for t in el.findall('tie')}
                        midi = (int(pitch.findtext('octave')) + 1) * 12 + dict(C=0, D=2, E=4, F=5, G=7, A=9, B=11)[pitch.findtext('step')] + int(pitch.findtext('alter') or 0)
                        notes.append(dict(bar=bar, at=round(onset, 6), dur=dur, midi=midi,
                                          hand=int(el.findtext('staff') or 1) if len(parts) == 1 else pi + 1,
                                          voice=el.findtext('voice') or '1', stop='stop' in ties, tie='start' in ties))
                        if onset < -1e-6 or onset + dur > length + 1e-6:
                            warnings.append((pi, bar, onset, dur, length))
                    if not chord:
                        previous = at
                        if not grace:
                            at += dur
            bars[bar] = length
    return notes, harmonies, bars, warnings


def self_check():
    root = ET.fromstring('''<score-partwise><part id="P1"><measure number="1">
      <attributes><divisions>2</divisions></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration></note>
      <backup><duration>2</duration></backup><forward><duration>1</duration></forward>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration><staff>2</staff><tie type="stop"/></note>
      <note><grace/><pitch><step>D</step><octave>3</octave></pitch><staff>2</staff></note>
      <note><pitch><step>E</step><octave>3</octave></pitch><duration>2</duration><staff>2</staff></note>
    </measure></part></score-partwise>''')
    notes, _, _, warnings = read(root)
    assert [n['at'] for n in notes] == [0, 0, .5, 1]
    assert notes[2]['stop'] and notes[2]['hand'] == 2 and not warnings


def main():
    self_check()
    cli = argparse.ArgumentParser()
    cli.add_argument('--song', default='')
    cli.add_argument('--bars', nargs=2, type=int)
    cli.add_argument('--include-deferred', action='store_true', help='Đọc nhịp cả file để sau đang có; không nhập/train chúng')
    args = cli.parse_args()
    corpus = json.loads((BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf-8'))
    songs = list(corpus['songs'])
    if args.include_deferred:
        songs.extend(dict(s, name=s['file'], genre='chưa phân loại / để sau', sections={})
                     for s in corpus['_de_sau']['sheets']
                     if s['teacher'] == 'ca-phao' and tim_file(s))
    for song in songs:
        if song['teacher'] != 'ca-phao' or args.song.lower() not in song['file'].lower():
            continue
        path = tim_file(song)
        if not path:
            print('MISSING', song['file'])
            continue
        notes, chords, bars, warnings = read(load(path))
        print('\nSONG', song['name'], '| label:', song['genre'], '|', path)
        print('SHA256', hashlib.sha256(Path(path).read_bytes()).hexdigest())
        print('MEASURES', len(bars), 'RANGE', [min(bars), max(bars)], 'METERS', dict(Counter(bars.values())), 'WARNINGS', warnings[:12], 'TOTAL', len(warnings))
        all_patterns = defaultdict(set)
        for n in notes:
            if n['hand'] == 2 and not n['stop']:
                all_patterns[n['bar']].add(n['at'])
        print('ALL LH', Counter(tuple(sorted(v)) for v in all_patterns.values()).most_common(4))
        if song['file'] == 'nguoihayquenemdi.mxl':
            # Chứng cứ trực tiếp kiểm lại được, không phụ thuộc dữ liệu KT sinh.
            assert sorted({n['at'] for n in notes if n['bar'] == 9 and n['hand'] == 1 and not n['stop']}) == [1, 2.5, 3.5]
            assert sorted({n['at'] for n in notes if n['bar'] == 10 and n['hand'] == 2 and not n['stop']}) == [0, 1.5, 3]
            assert sorted(n['midi'] for n in notes if n['bar'] == 10 and n['hand'] == 2 and n['at'] == 1.5) == [50, 55, 58]
        for section, spec in song['sections'].items():
            bounds = spec.get('bars')
            if not bounds:
                continue
            a, b = bounds
            attacks = [n for n in notes if a <= n['bar'] <= b and n['hand'] == 2 and not n['stop']]
            grouped = defaultdict(set)
            for n in attacks:
                grouped[n['bar']].add(n['at'])
            patterns = Counter(tuple(sorted(v)) for v in grouped.values())
            print(section, bounds, 'LH attacks', sum(map(len, grouped.values())), 'patterns', patterns.most_common(3))
        if args.bars:
            for bar in range(args.bars[0], args.bars[1] + 1):
                print('BAR', bar, 'HARMONY', [c[1:] for c in chords if c[0] == bar])
                grouped = defaultdict(list)
                for n in notes:
                    if n['bar'] == bar:
                        grouped[n['hand'], n['voice'], n['at']].append(f"{n['midi']}/{n['dur']:g}" + ('~stop' if n['stop'] else '') + ('~start' if n['tie'] else ''))
                for key, value in sorted(grouped.items()):
                    print(' ', key, ' '.join(value))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
