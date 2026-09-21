"""Reproduce ACDD evidence without modifying the source or the PianoBrain corpus.

python -B scripts/audit_cp_acdd.py --output Reference/CA-PHAO-BALLAD-ACDD.json
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

from audit_ca_phao import audit, load, self_check

SOURCE = Path('D:/PianoBrain/video/Ca_Phao/Anh Cu Di Di- Ca Phao.mxl')
SELECTED = [1, 2, 3, 4, *range(9, 33), 33, 37, *range(38, 63)]
SECTIONS = {'verse1': (1, 16), 'chorus1': (17, 32),
            'verseMain': (9, 16), 'verse2': (38, 45), 'chorus2': (46, 61)}
VERSE_PATTERNS = ['main', 'main', 'eight', 'main', 'main', 'eight', 'main', 'main']
CHORUS_BARS = [17, 18, 19, 20]
# Keep complete gestures, not only the bottom pitch of each RH chord.
# Empty pitch lists mean keep every written pitch at that onset.
RIGHT_SELECTIONS = {
    40: {0: [], 1: [], 1.5: [], 2: [], 2.5: ['Bb4'], 2.75: []},
    17: {3: ['A4']},
    18: {0: [], .75: ['Db5'], 1: [], 1.5: ['Db5'], 2.5: ['Db5'], 3: ['F4'], 3.25: []},
    19: {0: ['Db5'], 1: ['Eb4', 'Bb4'], 1.5: ['G4', 'Bb4'], 2: ['Bb4'], 3: ['Bb4']},
    20: {0: [], .75: ['C5'], 1: [], 1.5: ['C5'], 2.5: [], 2.75: [], 3: [], 3.5: ['C4', 'G4']},
}


def selected_right(notes, bar):
    choices = RIGHT_SELECTIONS[bar]
    return [note for note in notes if note['hand'] == 1 and note['at'] in choices
            and (not choices[note['at']] or note['pitch'] in choices[note['at']])]


def joined_attacks(info):
    """Join within-measure ties; incoming ties are not new attacks.

    Durations are cropped to this measure, NOT pedal lengths. Source records
    remain alongside the joined records so decisions can be checked.
    """
    result, active = [], {}
    for note in sorted(info['attacks'], key=lambda note: note['at']):
        if note['grace']:
            continue
        key = (note['hand'], note['voice'], note['midi'])
        previous = active.get(key)
        if 'stop' in note['ties']:
            if previous is not None and abs(previous['at'] + previous['dur'] - note['at']) < 1e-6:
                previous['dur'] += note['dur']
            else:
                previous = None
        else:
            previous = {key: value for key, value in note.items() if key not in ('ties', 'grace')}
            result.append(previous)
        if 'start' in note['ties'] and previous is not None:
            active[key] = previous
        else:
            active.pop(key, None)
    return result


def stats(data, first, last, hand):
    groups = collections.defaultdict(list)
    for bar in range(first, last + 1):
        for note in joined_attacks(data[str(bar)]):
            if note['hand'] == hand:
                groups[bar, note['at']].append(note)
    return dict(bars=last - first + 1, attacks=len(groups),
                clusters=sum(len(notes) > 1 for notes in groups.values()),
                offbeats=sum(at % 1 != 0 for _, at in groups),
                sixteenthGrid=sum(at % .5 != 0 for _, at in groups))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    self_check()
    data = audit(args.source)
    assert len(data) == 69, 'Unexpected score revision'
    joined = {bar: joined_attacks(info) for bar, info in data.items()}
    singing = [*range(9, 33), *range(38, 62)]
    grids = {bar: sorted({n['at'] for n in joined[str(bar)] if n['hand'] == 2}) for bar in singing}
    comparisons = {
        str(bar): dict(
            grid=grids[bar],
            exactGrid=[other for other in singing if other != bar and grids[other] == grids[bar]],
            sameOpening=[other for other in singing if other != bar
                         and [at for at in grids[other] if at <= 1] == [at for at in grids[bar] if at <= 1]],
        ) for bar in range(9, 17)
    }
    joint = {}
    for bar in singing:
        groups = collections.defaultdict(list)
        for note in joined[str(bar)]:
            groups[note['at']].append(note)
        joint[str(bar)] = [dict(at=at, left=[n['pitch'] for n in notes if n['hand'] == 2],
                               right=[n['pitch'] for n in notes if n['hand'] == 1])
                           for at, notes in sorted(groups.items())]
    selections = {str(bar): selected_right(joined[str(bar)], bar) for bar in RIGHT_SELECTIONS}
    for bar, choices in RIGHT_SELECTIONS.items():
        assert {n['at'] for n in selections[str(bar)]} == set(choices), bar
    for bar, hand, at, pitch, duration in [(1, 2, 1.5, 'Ab3', 2), (2, 2, .5, 'F3', 3),
                                           (3, 2, .75, 'Bb3', 1), (4, 1, .75, 'C4', 1),
                                           (18, 2, 1.75, 'Bb2', .5), (18, 2, 2.75, 'Bb3', 1)]:
        assert any(n['hand'] == hand and n['at'] == at and n['pitch'] == pitch
                   and n['dur'] == duration for n in joined[str(bar)]), (bar, at, pitch)
    result = dict(
        file=args.source.name, sha256=hashlib.sha256(args.source.read_bytes()).hexdigest(),
        units='Zero-based quarter-note offsets; written durations, not audio or pedal.',
        method='Count onset groups excluding grace/incoming ties. RH includes melody. '
               'Join contiguous same-pitch/voice/staff ties inside each measure only.',
        tempos=sorted({float(el.get('tempo')) for el in load(args.source).iter('sound') if el.get('tempo')}),
        formStatus='Working verse/chorus form; only three solo boundaries explicitly approved.',
        approvedBoundaries={'interludeStart': [33, 1.5], 'verse2Pickup': [37, 2.5], 'outroStart': [62, .75]},
        comparisonScope='Singing bars 9-32, 38-61; exclude solos, partial boundaries, opening 1-8.',
        leftHandComparisons=comparisons,
        jointAttacks=joint,
        arrangement=dict(versePatternOrder=VERSE_PATTERNS, mainSourceBar=40,
                         eightRhythmSourceBar=10, chorusBars=CHORUS_BARS,
                         method='Main: bar 40 LH and selected RH. Eight: two-hand sixteenth '
                                'grid from bar 10, generic chord tones instead of its melody; '
                                'user-requested accents 1/5/8 and legato. Six main / two eight '
                                'bars is an editorial arrangement, not a measured source ratio.',
                         selectedRight=selections),
        sections={name: dict(range=[first, last], left=stats(data, first, last, 2),
                             right=stats(data, first, last, 1))
                  for name, (first, last) in SECTIONS.items()},
        representatives={str(bar): dict(**data[str(bar)], joinedAttacks=joined[str(bar)]) for bar in SELECTED},
    )
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('file', 'sha256', 'tempos', 'sections')}, ensure_ascii=True))


if __name__ == '__main__':
    main()
