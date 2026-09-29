# -*- coding: utf-8 -*-
"""Đo tiếng đàn video Blues của thầy Đức Thịnh (KN9JEiQXAHs — "CÁCH CHƠI BLUES | VẬY LÀ MÌNH XA NHAU | HOÀ ÂM ỨNG DỤNG 3
- BÀI 1") từ MIDI do máy chép (PianoBrain `tools/sheet/tu-video.py`, piano_transcription_inference).

    python -X utf8 scripts/do_video_blues_duc_thinh.py MIDI [--tu GIAY --den GIAY] [--in]

MIDI chép bằng tai máy: CHỈ TIN CHỖ GÕ, không tin trường độ (pedal làm nhoè); tay trái/phải phỏng đoán theo cao độ.
Đo: nhịp (chu kỳ gõ của bè trầm), lưới trong phách (đều hay chùm ba — "chiu chiu, xoay xoay"), hình gõ bè trầm và hợp âm.
"""
import collections
import math
import os
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import midi  # noqa: E402

TEN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
nm = lambda m: TEN[m % 12] + str(m // 12 - 1)


def doc(path):
    data = open(path, 'rb').read()
    tracks, division = midi._tracks(data)
    raw = midi._raw_notes(tracks, division)
    sec = midi._tempo_map(tracks, division)
    return sorted((sec(a), sec(b), p, v) for _, a, b, p, v in raw)


def main():
    path = sys.argv[1]
    tu = float(sys.argv[sys.argv.index('--tu') + 1]) if '--tu' in sys.argv else 0
    den = float(sys.argv[sys.argv.index('--den') + 1]) if '--den' in sys.argv else 1e9
    ns = [n for n in doc(path) if tu <= n[0] < den]
    print(f'{len(ns)} nốt trong [{tu}, {den}) giây')
    # mật độ theo 15 giây
    if '--mat-do' in sys.argv:
        c = collections.Counter(int(n[0] // 15) * 15 for n in ns)
        for k in sorted(c):
            lo = [n for n in ns if k <= n[0] < k + 15]
            print(f'  {int(k // 60):02d}:{int(k % 60):02d}  {c[k]:4} nốt · trầm<55 {sum(1 for n in lo if n[2] < 55):3} · cao độ {nm(min(n[2] for n in lo))}–{nm(max(n[2] for n in lo))}')
    # chu kỳ gõ bè trầm: tự tương quan các cú gõ (gom cú trong 60 ms)
    tram = [n for n in ns if n[2] < 55]
    go = []
    for n in tram:
        if not go or n[0] - go[-1] > .06:
            go.append(n[0])
    if len(go) > 20:
        best = []
        for ms in range(250, 1600, 5):
            T = ms / 1000
            s = sum(math.cos(2 * math.pi * (t % T) / T) for t in go) / len(go)
            best.append((s, T))
        best.sort(reverse=True)
        print('chu kỳ gõ bè trầm (giây) mạnh nhất:', [(round(T, 3), round(s, 2), round(60 / T, 1)) for s, T in best[:6]])
    if '--in' in sys.argv:
        t0 = ns[0][0]
        for n in ns[:int(sys.argv[sys.argv.index('--in') + 1]) if sys.argv.index('--in') + 1 < len(sys.argv) and sys.argv[sys.argv.index('--in') + 1].isdigit() else 200]:
            print(f'  {n[0]:8.3f}  {"T" if n[2] < 55 else "P"} {nm(n[2]):5} v{n[3]}')


if __name__ == '__main__':
    main()
