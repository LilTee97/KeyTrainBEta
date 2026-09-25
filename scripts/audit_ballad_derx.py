"""Read-only two-hand DERX analysis; optional evidence JSON, never edits the score.

python -X utf8 -B scripts/audit_ballad_derx.py --output Reference/BALLAD-DERX-EVIDENCE.json
"""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

from audit_ca_phao import audit, load
from audit_cp_acdd import joined_attacks

SOURCE = Path('D:/PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl')
EXPECTED_SHA = 'c4d780b7b37c89b1e7891daca40bc13fbca5ffba8c5600cf25ea04350aaaba4b'
# Manual inner-voice selection: not an automatic "highest note = melody" rule.
RIGHT = {
    4: {0: ['D4'], 1.75: ['E4'], 2.25: ['G4'], 2.75: ['G4']},
    5: {1: ['F4'], 1.25: ['F4'], 1.75: ['F4']},
    24: {0: ['F4'], .75: ['F4'], 1.333333: ['F4', 'Bb4'], 2: ['E4', 'C5'],
         2.75: ['C4'], 3: ['D4', 'G4'], 3.25: ['E4'], 3.5: ['C4']},
    25: {0: ['A4', 'C#5'], .5: ['A4'], .75: ['A4'], 1: ['E4'], 1.25: ['C#5'],
         1.75: ['F4', 'A4'], 3.25: ['C4']},
}


def analyze():
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    assert digest == EXPECTED_SHA, 'Score changed: re-audit the manual selections'
    data = audit(SOURCE, dynamics=True, actual_pickups=True)
    starts, raw, cursor = {}, [], 0
    for bar, info in data.items():
        starts[int(bar)] = cursor
        raw.extend(dict(n, at=round(cursor + n['at'], 6), bar=int(bar), xmlOffset=n['at'])
                   for n in info['attacks'])
        cursor += info['length']
    # Absolute onsets let the existing tie joiner follow ties across XML barlines.
    notes = joined_attacks({'attacks': raw})

    def window(bar):
        begin, end = starts[bar] + 1, starts[bar + 1] + 1
        return [dict(n, at=round(n['at'] - begin, 6)) for n in notes if begin <= n['at'] < end]

    def groups(records, hand):
        result = defaultdict(list)
        for n in records:
            if n['hand'] == hand:
                result[n['at']].append(n)
        return result

    sections = {}
    ranges = {'verse1': range(4, 20), 'verse2': range(32, 48),
              'chorus1': range(20, 28), 'chorus2': range(48, 56), 'chorusRaised': range(56, 64)}
    for name, bars in ranges.items():
        totals = dict(bars=0, leftAttacks=0, rightAttacks=0, simultaneous=0,
                      rightOnlyOnsets=0, rightOverHeldLeft=0, leftOverHeldRight=0, rightClusters=0)
        for bar in bars:
            if data[str(bar)]['length'] != 4:
                continue
            records = window(bar)
            left, right = groups(records, 2), groups(records, 1)
            totals['bars'] += 1
            totals['leftAttacks'] += len(left)
            totals['rightAttacks'] += len(right)
            totals['simultaneous'] += len(left.keys() & right.keys())
            totals['rightOnlyOnsets'] += len(right.keys() - left.keys())
            totals['rightClusters'] += sum(len(g) > 1 for g in right.values())
            begin = starts[bar] + 1
            for active, held, key in [(right, 2, 'rightOverHeldLeft'), (left, 1, 'leftOverHeldRight')]:
                totals[key] += sum(any(n['hand'] == held and n['at'] < begin + at - 1e-5
                    and n['at'] + n['dur'] > begin + at + 1e-5 for n in notes) for at in active)
        sections[name] = totals

    selected = {}
    for bar in [4, 5, 24, 25, 32, 33, 52, 53]:
        records = window(bar)
        kept = [n for n in records if n['hand'] == 1
                and any(abs(n['at'] - at) < 1e-5 and n['pitch'] in pitches
                        for at, pitches in RIGHT.get(bar, {}).items())]
        for at, pitches in RIGHT.get(bar, {}).items():
            assert sorted(n['pitch'] for n in kept if abs(n['at'] - at) < 1e-5) == sorted(pitches)
        selected[str(bar)] = dict(xmlStart=[bar, 1], length=data[str(bar)]['length'],
                                 notes=records, retainedRight=kept)
    assert any(n['pitch'] == 'F4' and n['at'] == 1.75 and n['dur'] == 2
               for n in selected['5']['retainedRight']), 'RH hold must span the LH run'
    assert [n['at'] for n in window(5) if n['hand'] == 2 and n['at'] >= 2.25] == [2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75]
    return dict(file=str(SOURCE), sha256=digest,
                units='Zero-based quarter notes; window k starts at XML k offset 1. Durations include contiguous ties, not pedal.',
                caveat='All-RH statistics include vocal melody. Retained inner voices are manual arrangement decisions, not an automatic melody detector.',
                tempos=sorted({float(s.get('tempo')) for s in load(SOURCE).iter('sound') if s.get('tempo')}),
                irregularBars={b: d['length'] for b, d in data.items() if d['length'] != 4},
                excludedTieContinuations=sum('stop' in n['ties'] for n in raw),
                sections=sections, selected=selected)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = analyze()
    if args.output:
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k != 'selected'}, ensure_ascii=False, indent=2))
