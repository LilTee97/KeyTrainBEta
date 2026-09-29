# -*- coding: utf-8 -*-
"""Dựng lưới móc đơn (12/8) cho đoạn bài hát trong video Blues Đức Thịnh, rồi đếm tiếng gõ theo vị trí trong ô 6 móc đơn.

    python -X utf8 scripts/do_luoi_video_blues.py MIDI TU DEN

Mỗi khung 20 giây: tìm chu kỳ móc đơn T ∈ [0,30; 0,37] s và pha φ khớp các cú gõ nhất; đặt vị trí trong ô 6 móc đơn sao cho
bè trầm (< G3) dồn nhiều nhất vào tiếng 1. MIDI chép bằng tai máy — chỉ tin CHỖ GÕ; tay đoán theo cao độ (trầm < 55).
"""
import collections
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from do_video_blues_duc_thinh import doc, nm  # noqa: E402


def cum_go(ns, a, b):
    out = []
    for n in ns:
        if not (a <= n[0] < b):
            continue
        if out and n[0] - out[-1][0] <= .05:
            out[-1][1].append(n)
        else:
            out.append([n[0], [n]])
    return out


def khop(ts):
    best = (-9, None, None)
    for ms in range(300, 371):
        T = ms / 1000
        c = sum(math.cos(2 * math.pi * t / T) for t in ts)
        s = sum(math.sin(2 * math.pi * t / T) for t in ts)
        r = math.hypot(c, s) / len(ts)
        if r > best[0]:
            best = (r, T, (math.atan2(s, c) / (2 * math.pi)) * T)
    return best


def main():
    path, tu, den = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    ns = doc(path)
    tong = collections.Counter()
    hinh = collections.Counter()
    lech = []
    for a in range(int(tu), int(den), 20):
        cu = cum_go(ns, a, a + 20)
        if len(cu) < 20:
            continue
        r, T, phi = khop([c[0] for c in cu])
        idx = [(round((c[0] - phi) / T), (c[0] - phi) / T - round((c[0] - phi) / T), c[1]) for c in cu]
        lech += [abs(e) for _, e, _ in idx]
        # pha ô: dồn bè trầm vào tiếng 0 của chu kỳ 6
        tram = collections.Counter(i % 6 for i, _, v in idx if any(n[2] < 55 for n in v))
        p0 = max(range(6), key=lambda k: tram[k])
        o = collections.defaultdict(lambda: [set(), set()])
        for i, _, v in idx:
            k = (i - p0) % 6
            b = (i - p0) // 6
            if any(n[2] < 55 for n in v):
                tong[('T', k)] += 1; o[b][0].add(k)
            if sum(1 for n in v if n[2] >= 55) >= 2:
                tong[('P', k)] += 1; o[b][1].add(k)
        for b, (t, p) in o.items():
            hinh[(tuple(sorted(t)), tuple(sorted(p)))] += 1
        print(f'  khung {a:4}s: T={T:.3f}s (♩.={60 / (3 * T):.0f}) · độ khớp {r:.2f} · pha bè trầm {p0}')
    so_o = sum(hinh.values())
    print(f'\nsố ô 6 móc đơn: {so_o} · lệch lưới trung vị {sorted(lech)[len(lech) // 2]:.3f} chu kỳ')
    for tay, ten in (('T', 'bè trầm (< G3)'), ('P', 'hợp âm tay phải (≥ 2 nốt ≥ G3)')):
        print(f'{ten}: ' + ' · '.join(f'tiếng {k + 1}: {tong[(tay, k)] * 100 // max(so_o, 1)}% ô' for k in range(6)))
    print('hình ô (bè trầm | tay phải) nhiều nhất:')
    for (t, p), v in hinh.most_common(12):
        print(f'  {v:3}  trầm {[k + 1 for k in t]}  phải {[k + 1 for k in p]}')


if __name__ == '__main__':
    main()
