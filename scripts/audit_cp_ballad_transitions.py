"""Audit CP ballad boundaries read-only; source RH still includes the vocal melody."""
import argparse
import hashlib
import json
from pathlib import Path

from audit_ca_phao import audit, compact
from audit_cp_ballad import BRAIN, tim_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    corpus = json.loads((BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf-8'))
    songs = [s for s in corpus['songs'] if s['teacher'] == 'ca-phao' and s['genre'] == 'ballad']
    songs.append(dict(name='Anh Cu Di Di', file='Anh Cu Di Di- Ca Phao.mxl',
                      sections={'chorus': {'bars': [17, 32]}, 'chorus_2': {'bars': [46, 61]}}))
    result = []
    for song in songs:
        path = BRAIN / 'video/Ca_Phao' / song['file'] if song['name'] == 'Anh Cu Di Di' else Path(tim_file(song))
        data = audit(path)
        sections = song['sections']
        targets = {name: value for name, value in sections.items() if name.startswith(('chorus', 'prechorus'))}
        status = 'annotated verse/chorus; vocal pickups may cross the barline'
        if song['name'] == 'Anh Cu Di Di':
            status = 'working verse/chorus form from ACDD analysis, not newly approved'
        if not targets:
            targets = {name: value for name, value in sections.items() if name in ('interlude', 'outro')}
            status = 'no verse/chorus boundaries: solo entrances are comparison only'
        boundaries = []
        for name, section in targets.items():
            bar = section['bars'][0]
            selected = {str(b): compact(data[str(b)]) for b in range(bar - 1, bar + 1) if str(b) in data}
            boundaries.append(dict(section=name, firstBar=bar, vocalNote=section.get('cua_loi'), bars=selected))
            before = selected.get(str(bar - 1))
            if before:
                print(json.dumps(dict(song=song['name'], into=name, before=bar - 1,
                                      harmony=before['harmony'], left=before['hands']['2']), ensure_ascii=True))
        result.append(dict(song=song['name'], path=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                           status=status, boundaries=boundaries))
    args.output.write_text(json.dumps(dict(
        units='quarter-note offsets from zero; tie labels are continuations, not new attacks',
        limits='RH includes melody. Do not infer vocal-free windows from pitch or density alone. No corpus changes.',
        songs=result), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
