"""Reproducible per-song evidence; never changes the source corpus.

python -B scripts/audit_cp_ballad_songs.py --output Reference/CA-PHAO-BALLAD-SONGS.json
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import sys

from audit_ca_phao import audit, load, self_check
from audit_cp_ballad import BRAIN, tim_file

SELECTED = {
    'Co Em Cho-Ca Phao.mxl': [9, 10, 17, 18, 25, 26, 41, 42],
    'Ngay mai em di-Ca Phao.mxl': [19, 20, 21, 22, 29, 30, 35, 36, 43, 44, 65, 71, 72],
}


def groups(info, hand):
    result = collections.defaultdict(list)
    for note in info['attacks']:
        if note['hand'] == hand and not note['grace'] and 'stop' not in note['ties']:
            result[note['at']].append(note)
    return result


def stats(data, bars, hand):
    attacks = [groups(data[str(bar)], hand) for bar in bars]
    return dict(bars=len(bars), attacks=sum(map(len, attacks)),
                notes=sum(len(notes) for group in attacks for notes in group.values()),
                clusters=sum(len(notes) > 1 for group in attacks for notes in group.values()),
                offbeats=sum(at != int(at) for group in attacks for at in group),
                shortAttacks=sum(max(n['dur'] for n in notes) <= .25
                                 for group in attacks for notes in group.values()))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    self_check()
    corpus = json.loads((BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf-8'))
    songs, comparisons = [], []
    grids = {'ngay-verse': [0, .5, 1], 'ngay-chorus': [0, 1, 1.5, 2.5, 3],
             'co-em-verse-b': [0, 1, 1.75, 2.25, 2.5, 2.75, 3],
             'co-em-chorus-a': [0, .25, .75, 1.25, 1.5, 2, 2.25, 2.75, 3.5]}
    for song in corpus['songs']:
        if song['teacher'] != 'ca-phao' or song['genre'] != 'ballad':
            continue
        path = Path(tim_file(song))
        data = audit(path)
        sections = {}
        for name, section in song['sections'].items():
            if not name.startswith(('verse', 'chorus', 'prechorus')):
                continue
            bars = list(range(section['bars'][0], section['bars'][1] + 1))
            bars = [bar for bar in bars if str(bar) in data and data[str(bar)]['length'] == 4]
            sections[name] = dict(range=section['bars'], left=stats(data, bars, 2), right=stats(data, bars, 1))
        singing = {bar for section in sections.values()
                   for bar in range(section['range'][0], section['range'][1] + 1)}
        confirmed = bool(singing)
        if not confirmed:
            solos = {bar for section in song['sections'].values()
                     for bar in range(section['bars'][0], section['bars'][1] + 1)}
            singing = {int(bar) for bar in data} - solos
        matches = {name: [bar for bar in sorted(singing) if str(bar) in data
                         and data[str(bar)]['length'] == 4
                         and sorted(groups(data[str(bar)], 2)) == grid]
                   for name, grid in grids.items()}
        comparisons.append(dict(song=song['name'], file=str(path),
                                scope='annotated singing' if confirmed else 'outside solos; tentative',
                                matches=matches))
        if song['file'] in SELECTED:
            songs.append(dict(file=song['file'], song=song['name'], path=str(path),
                              sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                              tempos=sorted({float(el.get('tempo')) for el in load(path).iter('sound')
                                             if el.get('tempo')}),
                              sections=sections,
                              representatives={str(bar): data[str(bar)] for bar in SELECTED[song['file']]}))
    assert len(songs) == 2
    result = dict(units='quarter-note offsets from zero; durations are notation, not audio/pedal',
                  method='Exclude grace and tie-stop from attacks; RH includes melody, NOT comping-only.',
                  grids=grids, songs=songs, comparisons=comparisons)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for song in songs:
        print(json.dumps({k: v for k, v in song.items() if k != 'representatives'}, ensure_ascii=False))
    print(json.dumps(comparisons, ensure_ascii=False))


if __name__ == '__main__':
    main()
