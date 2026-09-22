"""Compare sung LH cells first; report reviewed RH separately, never infer vocal roles.

python -X utf8 -B scripts/audit_cp_ballad_compatibility.py --output Reference/CP-BALLAD-COMPATIBILITY.json
"""
import argparse
import collections
import hashlib
import itertools
import json
from pathlib import Path

from audit_ca_phao import audit, load, self_check
from audit_cp_acdd import SOURCE, joined_attacks, RIGHT_SELECTIONS, selected_right
from audit_cp_ballad import BRAIN, tim_file

# Editorial accompaniment selections already reviewed in CA-PHAO-BALLAD-SONGS.md.
# All other RH notes are UNKNOWN here, not automatically melody or accompaniment.
RIGHT = {
    'Co Em Cho': {
        9: {0: ['G4', 'C5'], 1: ['C4', 'Eb4', 'G4'], 1.25: ['C5'], 1.75: ['G4', 'C5'], 3: ['C4', 'Eb4', 'G4']},
        10: {0: ['F4', 'Bb4'], .5: ['F4'], .75: ['F4'], 1.25: ['D4'], 1.75: ['F4']},
        25: {.75: ['C5'], 1.25: ['C5'], 1.75: ['C5'], 3: ['Eb4']},
        26: {1.75: ['F4', 'Bb4'], 2.25: ['F4']},
    },
    'Ngay mai em di': {
        21: {1: ['Bb4'], 1.5: ['Eb4'], 2: ['G4']}, 22: {2.5: ['Eb4', 'G4']},
        35: {1: ['Bb4'], 1.5: ['G4'], 2: ['Bb4'], 2.5: ['Eb5']},
        36: {.5: ['Bb4'], 1: ['F4', 'Bb4']},
    },
}


def signature(info, detailed=False):
    groups = collections.defaultdict(list)
    for n in joined_attacks(info):
        if n['hand'] == 2:
            groups[n['at']].append(n)
    if not detailed:
        return tuple(sorted(groups))
    return tuple((at, tuple(sorted(n['dur'] for n in notes)),
                  tuple(sorted({a for n in notes for a in n['articulations']})))
                 for at, notes in sorted(groups.items()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    self_check()
    corpus = json.loads((BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf8'))
    sources = [s for s in corpus['songs'] if s['teacher'] == 'ca-phao' and s['genre'] == 'ballad']
    sources.append(dict(name='Anh Cu Di Di', file=SOURCE.name, sections={
        'verse': {'bars': [9, 16]}, 'chorus': {'bars': [17, 32]},
        'verse_2': {'bars': [38, 45]}, 'chorus_2': {'bars': [46, 61]},
    }))
    rows, indexes = [], []
    for song in sources:
        path = SOURCE if song['name'] == 'Anh Cu Di Di' else Path(tim_file(song))
        data = audit(path)
        singing = {b for name, section in song['sections'].items()
                   if name.startswith(('verse', 'chorus', 'prechorus')) or name in ('coda', 'tag')
                   for b in range(section['bars'][0], section['bars'][1] + 1)}
        confirmed = bool(singing)
        if not confirmed:
            solos = {b for s in song['sections'].values() for b in range(s['bars'][0], s['bars'][1] + 1)}
            singing = {int(b) for b in data} - solos
        # Partial vocal/instrumental measures are not whole sung accompaniment cells.
        singing -= {'Co Em Cho': {56}}.get(song['name'], set())
        if song['file'].startswith('Chua Bao Gio'):
            singing -= {9, 51, 68, 76}
        bars = {b: data[str(b)] for b in sorted(singing) if str(b) in data and data[str(b)]['length'] == 4}
        patterns = collections.defaultdict(list)
        details = collections.defaultdict(list)
        for bar, info in bars.items():
            patterns[signature(info)].append(bar)
            details[signature(info, True)].append(bar)
        reviewed = {}
        for bar, choices in RIGHT.get(song['name'], {}).items():
            notes = joined_attacks(data[str(bar)])
            selected = [n for n in notes if n['hand'] == 1 and n['pitch'] in choices.get(n['at'], [])]
            assert len(selected) == sum(map(len, choices.values())), (song['name'], bar)
            reviewed[str(bar)] = selected
        if song['name'] == 'Anh Cu Di Di':
            reviewed = {str(b): selected_right(joined_attacks(data[str(b)]), b) for b in RIGHT_SELECTIONS}
        top = sorted(patterns.items(), key=lambda p: -len(p[1]))[:4]
        rows.append(dict(song=song['name'], file=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
            scope=('provisional ACDD form' if song['name'] == 'Anh Cu Di Di' else 'annotated singing') if confirmed else 'outside solos; provisional',
            bars=len(bars), tempos=sorted({float(e.get('tempo')) for e in load(path).iter('sound') if e.get('tempo')}),
            topLeftCells=[dict(onsets=p, bars=bs,
                notes=[n for n in joined_attacks(bars[bs[0]]) if n['hand'] == 2]) for p, bs in top],
            reviewedRight=reviewed, unreviewedRightPolicy='Not used in comparison or training',
            soloReview={str(b): data[str(b)] for b in [5, 7, 8, 48, 53, 55, 56, 66, 67, 69]}
                       if song['name'] == 'Co Em Cho' else {}))
        indexes.append((patterns, details))
    comparisons = []
    for a, b in itertools.combinations(range(len(rows)), 2):
        matches = []
        for pattern in indexes[a][0].keys() & indexes[b][0].keys():
            # One sustained note is too generic to be evidence of a shared groove.
            if len(pattern) < 3:
                continue
            matches.append(dict(onsets=pattern, firstBars=indexes[a][0][pattern], secondBars=indexes[b][0][pattern]))
        exact = indexes[a][1].keys() & indexes[b][1].keys()
        comparisons.append(dict(songs=[rows[a]['song'], rows[b]['song']],
            onsetMatches=sorted(matches, key=lambda m: (-min(len(m['firstBars']), len(m['secondBars'])), m['onsets'])),
            durationAndClusterMatches=[dict(firstBars=indexes[a][1][p], secondBars=indexes[b][1][p])
                                       for p in sorted(exact) if len(p) >= 3],
            permitsSoloBorrowing=False))
    result = dict(units='Zero-based quarter notes; written gates, not pedal/audio.',
        method='LH candidate screening only; exclude grace/tie-stop; join within-bar ties. RH only editorial selections.',
        decision='No cross-sheet donor admitted for Co Em Cho. Similar LH onsets alone cannot establish joint-hand compatibility.',
        songs=rows, comparisons=comparisons)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    for row in rows:
        print(json.dumps({k: v for k, v in row.items() if k not in ('reviewedRight', 'topLeftCells', 'soloReview')}, ensure_ascii=True))
        print([(cell['onsets'], cell['bars']) for cell in row['topLeftCells']])
    for c in comparisons:
        if c['onsetMatches']:
            print(json.dumps(c, ensure_ascii=True))


if __name__ == '__main__':
    main()
