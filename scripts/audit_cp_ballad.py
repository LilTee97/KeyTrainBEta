"""Measure the active CP ballad corpus. Does not train or modify PianoBrain.

python -B scripts/audit_cp_ballad.py --output Reference/CA-PHAO-BALLAD-EVIDENCE.json
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import sys

from audit_ca_phao import audit, self_check

ROOT = Path(__file__).resolve().parents[1]
BRAIN = ROOT.parent / 'PianoBrain'
sys.path.insert(0, str(BRAIN / 'tools/sheet'))
from bac_not import tim_file

REPRESENTATIVES = {
    'Ngay mai em di-Ca Phao.mxl': [21, 29, 35, 43],
    'Co Em Cho-Ca Phao.mxl': [10, 18],
    'Chung Ta Khong Thuoc Ve Nhau-Ca Phao.mxl': [15, 27, 59],
    'Chua Bao Gio Trung Quan-Ca Phao.mxl': [69, 74],
}


def summarize(song):
    path = Path(tim_file(song))
    data = audit(path)
    singing = {
        bar for name, section in song['sections'].items()
        if name.startswith(('verse', 'chorus', 'prechorus')) or name in ('coda', 'tag')
        for bar in range(section['bars'][0], section['bars'][1] + 1)
    }
    confirmed = bool(singing)
    if not confirmed:
        excluded = {bar for section in song['sections'].values()
                    for bar in range(section['bars'][0], section['bars'][1] + 1)}
        singing = {int(bar) for bar in data} - excluded
    selected = {int(bar): info for bar, info in data.items()
                if int(bar) in singing and info['length'] == 4}
    patterns = collections.defaultdict(list)
    downbeats = clusters = offbeats = attacks = ties = 0
    sections = collections.defaultdict(lambda: dict(bars=0, attacks=0, notes=0))
    for bar, info in selected.items():
        groups = collections.defaultdict(list)
        for note in info['attacks']:
            if note['hand'] != 2 or note['grace']:
                continue
            if 'stop' in note['ties']:
                ties += 1
                continue
            groups[note['at']].append(note)
        onsets = tuple(sorted(groups))
        patterns[onsets].append(bar)
        attacks += len(groups)
        downbeats += 0 in groups
        clusters += sum(len(notes) > 1 for notes in groups.values())
        offbeats += sum(abs(at - round(at)) > 1e-5 for at in groups)
        for name, section in song['sections'].items():
            if section['bars'][0] <= bar <= section['bars'][1]:
                stats = sections[name]
                stats['bars'] += 1
                stats['attacks'] += len(groups)
                stats['notes'] += sum(map(len, groups.values()))
    return dict(
        song=song['name'], file=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        scope='annotated singing' if confirmed else 'outside annotated solos; tentative',
        measuredBars=len(selected), omittedNonFourBeatBars=sorted(singing - set(selected)),
        left=dict(attacks=attacks, downbeatBars=downbeats, chordAttacks=clusters,
                  offbeatAttacks=offbeats, tieContinuationsExcluded=ties),
        sections=dict(sections),
        patterns=[dict(onsets=list(pattern), count=len(bars), bars=bars)
                  for pattern, bars in sorted(patterns.items(), key=lambda item: -len(item[1]))[:5]],
        representatives={str(bar): data[str(bar)] for bar in REPRESENTATIVES.get(song['file'], [])},
    )


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    self_check()
    corpus = json.loads((BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf-8'))
    songs = [summarize(song) for song in corpus['songs']
             if song['teacher'] == 'ca-phao' and song['genre'] == 'ballad']
    # These bars justify the five distinct rhythm buttons; a changed source needs review.
    expected = {
        ('Ngay mai em di', '21'): [0, .5, 1],
        ('Ngay mai em di', '35'): [0, 1, 1.5, 2.5, 3],
        ('Co Em Cho', '10'): [0, 1, 1.75, 2.25, 2.5, 2.75, 3],
        ('Chúng Ta Không Thuộc Về Nhau', '27'): [0, 1.5, 2.5],
        ('Chưa Bao Giờ (Trung Quân)', '69'): [0, .5, 2, 2.5, 3],
    }
    for (name, bar), onsets in expected.items():
        source = next(song for song in songs if song['song'] == name)
        actual = sorted({n['at'] for n in source['representatives'][bar]['attacks']
                         if n['hand'] == 2 and not n['grace'] and 'stop' not in n['ties']})
        assert actual == onsets, (name, bar, actual)
    result = dict(
        units='quarter notes, zero-based measure offsets; written durations, not pedal audio',
        method='LH attack groups exclude grace/tie-stop; RH is retained for manual melody/comping review.',
        excluded='Deferred sheets and non-ballad corpus entries are not analyzed.',
        songs=songs,
    )
    if args.output:
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for song in songs:
        print(json.dumps({key: value for key, value in song.items()
                          if key not in ('representatives', 'patterns', 'file', 'sha256')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
