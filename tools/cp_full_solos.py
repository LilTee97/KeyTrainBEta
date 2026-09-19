"""Complete CP instrumental sections, measured from raw XML (not the stale ledger).

Read-only toward PianoBrain. --write regenerates the bundled data; --check compares it.
No CP Lick data or old solo is changed. Pitches stay relative to the section's tonic.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import cp_lick_corpus as cp

sys.path.insert(0, str(cp.ROOT / 'scripts'))
import audit_ca_phao as audit

OUT = cp.ROOT / 'src/reharm/style/caPhaoFullSolos.json'
KINDS = {
    'major': '', 'minor': 'm', 'dominant': '7', 'minor-seventh': 'm7',
    'major-seventh': 'maj7', 'minor-11th': 'm11', 'minor-ninth': 'm9',
    'dominant-11th': '11', 'dominant-13th': '13', 'dominant-ninth': '9',
    'major-ninth': 'maj9', 'half-diminished': 'm7b5', 'diminished-seventh': 'dim7',
    'suspended-fourth': 'sus4', 'major-sixth': '6', 'major-minor': 'mMaj7',
    'augmented': 'aug',
}


def pc(name):
    return (audit.STEP[name[0]] + name.count('#') - name.count('b')) % 12


def harmony(h, tonic):
    suffix = KINDS.get(h['kind'], h['text'] or '?')
    # Superscript 1/2 is the score's inversion label, not a chord quality.
    # The explicit bass already preserves that inversion.
    if suffix in ('¹', '²') and h['bass'] is not None: suffix = ''
    for degree, alter, action in h['degrees']:
        if degree == '5' and alter == '1': suffix = 'aug'
        elif degree == '7' and suffix == 'sus4': suffix = '7sus4'
        elif degree == '9' and suffix in ('', 'm'): suffix += 'add9'
        else: suffix += ('b' if alter == '-1' else '#' if alter == '1' else 'add') + degree
    return dict(root=(pc(h['root']) - tonic) % 12, suffix=suffix,
                bass=None if h['bass'] is None else (pc(h['bass']) - tonic) % 12)


def analyze():
    corpus = json.loads((cp.BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf8'))
    sections, inventory = [], []
    for song in corpus['songs']:
        if song.get('teacher') != 'ca-phao': continue
        path = cp.bac_not.tim_file(song)
        data = audit.audit(path)
        starts, cursor = {}, 0
        for bar, info in data.items():
            starts[int(bar)] = cursor
            cursor += info['length']
        raw = [dict(n, beat=starts[int(bar)] + n['at'], bar=int(bar),
                    tie_start='start' in n['ties'], tie_stop='stop' in n['ties'])
               for bar, info in data.items() for n in info['attacks']]
        groups = cp.groups_of(raw)
        row = dict(song=song['name'], file=Path(path).name, genre=song['genre'],
                   sha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(), sections=[])
        inventory.append(row)
        for kind, bounds in song.get('sections', {}).items():
            if kind not in ('intro', 'interlude', 'outro'): continue
            lo, declared_hi = bounds['bars']
            hi = min(declared_hi, max(starts))
            key = cp.key_at(song['file'], lo)
            bossa_outro = song['file'].startswith('nguoihay') and kind == 'outro'
            if bossa_outro: key = (2, 'minor')
            begin, end = starts[lo], starts[hi] + data[str(hi)]['length']
            report = dict(kind=kind, bars=[lo, hi], declaredBars=[lo, declared_hi], beats=end-begin)
            row['sections'].append(report)
            if not key:
                report['status'] = 'needs-key-confirmation'
                continue
            tonic, mode = key
            chosen = [g for g in groups if g['at'] < end and g['at'] + g['dur'] > begin]
            events = []
            for g in chosen:
                # At a cut boundary the source tie is re-articulated once, never discarded.
                at = max(begin, g['at'])
                pitches, gates = [], []
                for pitch, gate in zip(g['pitches'], g['gates']):
                    finish = min(end, g['at'] + gate)
                    if finish <= at: continue
                    pitches.append(pitch-tonic)
                    gates.append(round(finish-at, 6))
                if not pitches: continue
                ornaments = [n for n in raw if n['hand'] == g['hand'] and abs(n['beat']-g['at']) < 1e-5 and not n['grace']]
                events.append(dict(at=round(at-begin, 6), tones=pitches, gates=gates,
                    hand='right' if g['hand'] == 1 else 'left',
                    arpeggiate=any(n['arpeggiate'] for n in ornaments),
                    articulations=sorted({a for n in ornaments for a in n['articulations']}),
                    carry=g['at'] < begin,
                    parallelMajor=bossa_outro and g['bar'] >= 100))
            graces = [dict(at=round(n['beat']-begin, 6), tone=n['midi']-tonic,
                           hand='right' if n['hand'] == 1 else 'left',
                           parallelMajor=bossa_outro and n['bar'] >= 100)
                      for n in raw if n['grace'] and begin <= n['beat'] < end]
            changes = []
            for bar, info in data.items():
                for h in info['harmony']:
                    at = starts[int(bar)] + h['at']
                    if at >= end: continue
                    changes.append(dict(at=at, **harmony(h, tonic)))
            changes.sort(key=lambda h: h['at'])
            before = [h for h in changes if h['at'] <= begin]
            harmony_events = ([dict(before[-1], at=0)] if before else [dict(at=0, root=0, suffix='m' if mode=='minor' else '', bass=None)])
            harmony_events += [dict(h, at=round(h['at']-begin, 6)) for h in changes if begin < h['at'] < end]
            # XML's F#aug/Eb in bar 42 conflicts with sounding Db-F-A/Eb,
            # followed by A-C#-G over A. Describe the measured bII -> V instead.
            if song['file'].startswith('nguoihay'):
                if kind == 'interlude':
                    harmony_events = [h for h in harmony_events if not 4 <= h['at'] < 8]
                    harmony_events += [dict(at=4, root=1, suffix='9', bass=None), dict(at=6, root=7, suffix='7', bass=None)]
                if bossa_outro:
                    written_harmony = [dict(h) for h in harmony_events]
                    for h in harmony_events:
                        if h['at'] >= starts[100]-begin and h['root'] == 0: h['suffix'] = 'm9'
                harmony_events.sort(key=lambda h: h['at'])
            rh = [g for g in chosen if g['hand'] == 1]
            report.update(status='exported', rightAttacks=len(rh), rightNotes=sum(len(g['pitches']) for g in rh),
                          techniques=cp.tags_of(rh), graces=len(graces))
            sections.append(dict(id=f"{song['file'].rsplit('.',1)[0]}:{kind}", song=song['name'],
                genre=song['genre'], mode=mode, tonic=tonic, kind=kind, fromBar=lo,
                vocalPickupAt=30.5 if song['file'].startswith('nguoihay') and kind in ('intro', 'interlude') else None,
                barLengths=[data[str(b)]['length'] for b in range(lo,hi+1)], lengthBeats=end-begin,
                events=events, graces=graces, harmony=harmony_events,
                writtenHarmony=written_harmony if bossa_outro else harmony_events,
                techniques=report['techniques']))
    return dict(version=1, inventory=inventory, sections=sections)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    cp.self_check()
    result = analyze()
    assert len(result['inventory']) == 9
    assert len(result['sections']) == 21
    bossa = next(s for s in result['sections'] if s['genre'] == 'bossa nova' and s['kind'] == 'interlude')
    assert bossa['fromBar'] == 41 and bossa['lengthBeats'] == 32
    assert any(e['carry'] for e in bossa['events'])
    assert any(abs(e['at']-22-1/3) < 1e-4 for e in bossa['events'])  # bar 46, actual triplet
    for s in result['sections']:
        assert sum(s['barLengths']) == s['lengthBeats']
        assert all(0 <= e['at'] < s['lengthBeats'] and all(0 < gate <= s['lengthBeats']-e['at']+1e-5 for gate in e['gates']) for e in s['events'])
    encoded = json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n'
    if args.write: OUT.write_text(encoded, encoding='utf8')
    if args.check: assert json.loads(OUT.read_text(encoding='utf8')) == result, 'Bundled full solos differ from source'
    print(f"CP full: {len(result['inventory'])} sheets measured; {len(result['sections'])} complete sections from 7 confirmed sheets")
    for row in result['inventory']:
        print(row['song'], [(s['kind'], s['bars'], s['beats'], s['status']) for s in row['sections']])
