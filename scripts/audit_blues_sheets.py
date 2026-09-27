"""Measured two-hand Blues evidence; reads sheets without changing them.

python -X utf8 -B scripts/audit_blues_sheets.py --output Reference/BLUES-SHEETS-EVIDENCE.json
"""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

from audit_ca_phao import audit, load, self_check
from audit_cp_acdd import joined_attacks

DIRECTORY = Path('C:/Users/Tin PC/Downloads/Documents/Linh Nhi')
SHEETS = {
    'Rockhouse': ('Rockhouse-Ray-chia-doan-G-Blues.mxl', [32, 33, 35, 44, 45, 47, 52, 55, 65, 88, 103, 104, 105, 107],
                 {'chordal': (32, 55), 'motivic': (103, 114)}),
    'Robert': ('Robert-Ray-chia-doan-C-Blues.mxl', [0, 31, 51, 52, 56, 57, 58, 64, 70, 71, 72, 76, 81, 82, 83, 104, 105, 124, 127, 129, 130, 141, 142],
               {'chorusC': (56, 79), 'chorusD': (80, 103), 'chorusE': (104, 127)}),
}


def groups(info, hand):
    result = defaultdict(list)
    for note in joined_attacks(info):
        if note['hand'] == hand:
            result[note['at']].append(note)
    return result


def analyze(path, selected, sections):
    root, data = load(path), audit(path, actual_pickups=True)
    stats = {}
    for name, (first, last) in sections.items():
        totals = dict(bars=last-first+1, leftAttacks=0, rightAttacks=0, simultaneous=0,
                      rightOnlyOnsets=0, rightClusters=0, rightActiveBars=0)
        for bar in range(first, last + 1):
            left, right = (groups(data[str(bar)], hand) for hand in (2, 1))
            totals['leftAttacks'] += len(left)
            totals['rightAttacks'] += len(right)
            totals['simultaneous'] += len(left.keys() & right.keys())
            totals['rightOnlyOnsets'] += len(right.keys() - left.keys())
            totals['rightClusters'] += sum(len(notes) > 1 for notes in right.values())
            totals['rightActiveBars'] += bool(right)
        stats[name] = totals
    examples = {}
    for bar in selected:
        info = data[str(bar)]
        left, right = (groups(info, hand) for hand in (2, 1))
        examples[str(bar)] = dict(length=info['length'], harmony=info['harmony'], attacks=[
            dict(at=at, left=[dict(pitch=n['pitch'], duration=n['dur']) for n in left[at]],
                 right=[dict(pitch=n['pitch'], duration=n['dur']) for n in right[at]])
            for at in sorted(left.keys() | right.keys())])
    return dict(file=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                title=root.findtext('work/work-title'), measures=len(data),
                tempos=[el.get('tempo') for el in root.iter('sound') if el.get('tempo')],
                meters={m.get('number'): m.findtext('attributes/time/beats')+'/'+m.findtext('attributes/time/beat-type')
                        for m in root.findall('.//measure') if m.find('attributes/time') is not None},
                silentMeasures=[bar for bar, info in data.items() if not info['attacks']],
                statistics=stats, examples=examples)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    self_check()
    results = {name: analyze(DIRECTORY / filename, selected, sections)
               for name, (filename, selected, sections) in SHEETS.items()}
    assert results['Rockhouse']['measures'] == 120
    assert results['Robert']['measures'] == 143
    assert results['Robert']['meters']['29'] == '6/4'
    assert results['Rockhouse']['statistics']['chordal']['rightActiveBars'] == 24
    args.output.write_text(json.dumps(dict(
        units='Zero-based quarter-note offsets; written durations, not acoustic sustain or pedal.',
        method='Staff 1 = RH, staff 2 = LH. Analyze notation-repaired copies. Count onset groups, not chord notes. Exclude grace and incoming ties; join within-bar ties. A RH onset alone does not prove melodic function.',
        sheets=results), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({name: {key: value for key, value in result.items() if key != 'examples'}
                      for name, result in results.items()}, ensure_ascii=False, indent=2))
