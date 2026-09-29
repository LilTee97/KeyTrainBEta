# -*- coding: utf-8 -*-
"""Dò nhịp TỪ ÂM THANH video Blues Đức Thịnh (librosa), rồi gắn nốt MIDI (máy chép) vào lưới móc đơn chùm ba.

    python -X utf8 scripts/do_nhip_video_blues.py WAV MIDI TU DEN [--in N]

Bám nhịp theo từng móc đơn (~180/phút) nên theo được chỗ co giãn. Pha ô 6/8 chọn sao cho bass (< G3) dồn vào tiếng 1.
Đếm theo tiếng 1..6 của ô: bass · hợp âm tay phải (≥ 2 nốt ≥ G3 cùng lúc — giọng hát lẫn vào bản chép thường là nốt đơn).
"""
import collections
import os
import sys

import librosa
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from do_video_blues_duc_thinh import doc, nm  # noqa: E402


def luoi(wav, tu, den):
    y, sr = librosa.load(wav, sr=22050, mono=True, offset=tu, duration=den - tu)
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
    tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=256, start_bpm=180, tightness=400, units='time')
    return float(np.atleast_1d(tempo)[0]), [tu + b for b in beats]


def main():
    wav, mid, tu, den = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
    tempo, bt = luoi(wav, tu, den)
    d = np.diff(bt)
    print(f'[{tu}, {den}) s: {len(bt)} móc đơn · nhịp dò {tempo:.0f}/phút · khoảng móc đơn trung vị {np.median(d):.3f}s '
          f'(tứ phân {np.percentile(d, 25):.3f}–{np.percentile(d, 75):.3f}) → ♩. ≈ {60 / (3 * np.median(d)):.0f}')
    ns = [n for n in doc(mid) if tu <= n[0] < den]
    bt = np.array(bt)
    # gom nốt thành cú (≤ 50 ms), gắn vào móc đơn gần nhất
    cu = []
    for n in ns:
        if cu and n[0] - cu[-1][0] <= .05:
            cu[-1][1].append(n)
        else:
            cu.append([n[0], [n]])
    gan = []
    lech = []
    for t, v in cu:
        i = int(np.argmin(np.abs(bt - t)))
        buoc = (bt[min(i + 1, len(bt) - 1)] - bt[max(i - 1, 0)]) / 2 or .33
        lech.append(abs(t - bt[i]) / buoc)
        gan.append((i, v))
    print(f'lệch lưới trung vị {np.median(lech):.2f} móc đơn · cú lệch ≤ ¼ móc: {np.mean(np.array(lech) <= .25) * 100:.0f}%')
    tram = collections.Counter(i % 6 for i, v in gan if any(n[2] < 55 for n in v))
    p0 = max(range(6), key=lambda k: tram[k])
    so_o = (len(bt) + 5) // 6
    dem = collections.Counter()
    hinh = collections.Counter()
    o = collections.defaultdict(lambda: [set(), set(), set()])
    for i, v in gan:
        k, b = (i - p0) % 6, (i - p0) // 6
        if any(n[2] < 55 for n in v):
            dem[('bass', k)] += 1; o[b][0].add(k)
        cao = [n for n in v if n[2] >= 55]
        if len({n[2] for n in cao}) >= 2:
            dem[('hop', k)] += 1; o[b][1].add(k)
        elif cao:
            dem[('don', k)] += 1; o[b][2].add(k)
    for loai, ten in (('bass', 'bass (< G3)'), ('hop', 'hợp âm tay phải ≥2 nốt'), ('don', 'nốt đơn ≥ G3')):
        print(f'{ten:24}: ' + ' · '.join(f'tiếng {k + 1} {dem[(loai, k)] * 100 // max(so_o, 1):3}%' for k in range(6)))
    for (b, h, _), c in [((tuple(sorted(x[0])), tuple(sorted(x[1])), 0), 1) for x in o.values()]:
        hinh[(b, h)] += c
    print(f'{so_o} ô 6/8 — hình (bass | hợp âm) nhiều nhất:')
    for (b, h), c in hinh.most_common(10):
        print(f'  {c:3}  bass {[k + 1 for k in b]}  hợp âm {[k + 1 for k in h]}')
    if '--in' in sys.argv:
        m = int(sys.argv[sys.argv.index('--in') + 1])
        for i, v in gan[:m]:
            k = (i - p0) % 6
            print(f'  ô{(i - p0) // 6:3} tiếng {k + 1}  ' + ' '.join(nm(n[2]) for n in sorted(v, key=lambda n: n[2])))


if __name__ == '__main__':
    main()
