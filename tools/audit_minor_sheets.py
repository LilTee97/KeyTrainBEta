"""Read-only comparison of the minor solo sheets; uses the same reader as TUYEN_SOLO."""
import collections
import json
import xml.etree.ElementTree as ET

import tuyen_o as source


def audit():
    for song in source.khung.nap_corpus()['songs']:
        for section in source.DOAN:
            phrase = source.tuyen_bai(song, section)
            if not phrase or not phrase['thu']:
                continue
            notes, harmonies, _, _ = source.doc_bai(song)
            lo, hi = song['sections'][section]['bars']
            ns = [n for bar in phrase['o'] for n in bar['n']]
            steps = [b[1] - a[1] for bar in phrase['o'] for a, b in zip(bar['n'], bar['n'][1:])]
            kinds = collections.Counter(el.findtext('kind') for _, bar, el in harmonies if lo <= bar <= hi)
            path = source.B.tim_file(song)
            root = source.mxl.load(path) if path.lower().endswith('.mxl') else ET.parse(path).getroot()
            measures = [m for part in root.findall('part') for m in part.findall('measure')
                        if lo <= int(m.get('number') or 0) <= hi]
            techniques = {tag: sum(len(m.findall('.//' + tag)) for m in measures)
                          for tag in ['grace', 'slur', 'tied', 'staccato', 'arpeggiate', 'tuplet', 'fingering', 'pedal']}
            print(json.dumps({
                'teacher': song['teacher'], 'song': song['name'], 'section': section,
                'genre': song['genre'], 'key': source.giong_chu(song, section),
                'bars': [lo, hi], 'beats': phrase['phach'], 'rhOnsets': len(ns),
                'steps': dict(collections.Counter('repeat' if d == 0 else 'octave' if abs(d) == 12
                            else 'step' if abs(d) <= 2 else 'third' if abs(d) <= 4 else 'leap' for d in steps)),
                'harmonyKinds': dict(kinds), 'notationTags': {k: v for k, v in techniques.items() if v},
                'opening': phrase['o'][0]['n'],
                'harmony': [(bar, at, el.findtext('root/root-step'), el.findtext('root/root-alter'),
                             el.findtext('kind')) for at, bar, el in harmonies if lo <= bar <= hi],
            }, ensure_ascii=False))


if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    audit()
