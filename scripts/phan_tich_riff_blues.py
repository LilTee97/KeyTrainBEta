# -*- coding: utf-8 -*-
"""Riff trong ba sheet Blues — có được dùng nhiều không (người dùng 28/9/2026: "riff có được dùng nhiều trong các sheet Blues
ko, nếu có hãy thêm vào điệu Blues Sun").

    python -X utf8 scripts/phan_tich_riff_blues.py

RIFF = một hình ngắn LẶP liền: trong một ô, dãy nốt đỉnh tay phải có một hình 2–4 nốt (≥ 2 cao độ khác nhau) lặp liền ≥ 3
lần. Đo trên nốt đỉnh (bè đôi / hợp âm tính theo nốt trên cùng). Ô = ô ghi trong sheet (Rockhouse, Robert 4/4; Rising Sun 6/8).
"""
import collections
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402

T = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
NGUON = {
    'Rockhouse (Sol)': ('C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues/Rockhouse-Ray-da-sua.mxl', 7, 8, 114),
    'Robert (Đô)': ('C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues/Robert-Ray-chia-doan-C-Blues.mxl', 0, 10, 131),
    'Rising Sun (Mi thứ)': ('D:/PianoBrain/exports/songscription/The-House-of-the-Rising-Sun.mxl', 4, 0, 15),
}


def tim_riff(day):
    for chu_ky in (2, 3, 4):
        for dau in range(0, len(day) - chu_ky * 3 + 1):
            hinh = day[dau:dau + chu_ky]
            if len(set(hinh)) < 2:
                continue
            lap = 1
            while day[dau + lap * chu_ky:dau + (lap + 1) * chu_ky] == hinh:
                lap += 1
            if lap >= 3:
                return chu_ky, lap, hinh
    return None


def main():
    for ten, (f, tonic, tu, den) in NGUON.items():
        ns, meta = mxl.notes(mxl.load(f))
        cu = collections.defaultdict(dict)
        for n in ns:
            if n['hand'] == 1 and n['dur'] > 1e-6 and not n['tie_stop'] and tu <= n['bar'] <= den:
                t = round(n['beat'], 4)
                cu[n['bar']][t] = max(cu[n['bar']].get(t, 0), n['midi'])
        o_co = [b for b in cu if len(cu[b]) >= 2]
        riff = {}
        for b in sorted(o_co):
            r = tim_riff([cu[b][t] for t in sorted(cu[b])])
            if r:
                riff[b] = r
        hinh = collections.Counter('-'.join(BAC[(p - tonic) % 12] for p in r[2]) for r in riff.values())
        print(f'\n== {ten}: ô có riff {len(riff)}/{len(o_co)} ({len(riff) * 100 // max(1, len(o_co))}%)')
        print('  hình (bậc so chủ âm) hay gặp:', hinh.most_common(8))
        print('  ví dụ:', ' · '.join(f'ô {b}: {"-".join(T[p % 12] for p in r[2])} ×{r[1]}' for b, r in list(riff.items())[:8]))
        # RIFF QUA Ô: ô liền nhau cùng NHỊP tay phải (vị trí cú gõ trong ô) và cùng nốt đỉnh — hoặc cùng hình dời nguyên
        # (khoảng cách giữa các nốt đỉnh như nhau, vd riff G13 của Ray dời lên IV). Chuỗi ≥ 2 ô liền tính là một riff.
        bs = meta['bar_start']
        ky = {}
        for b in sorted(o_co):
            vt = tuple(round(t - bs[b], 3) for t in sorted(cu[b]))
            do = [cu[b][t] for t in sorted(cu[b])]
            ky[b] = (vt, tuple(y - x for x, y in zip(do, do[1:])), tuple(do))
        chuoi, lien = [], []
        for b in sorted(ky):
            if lien and b == lien[-1] + 1 and ky[b][0] == ky[lien[-1]][0] and ky[b][1] == ky[lien[-1]][1]:
                lien.append(b)
            else:
                if len(lien) >= 2:
                    chuoi.append(lien)
                lien = [b]
        if len(lien) >= 2:
            chuoi.append(lien)
        so = sum(len(c) for c in chuoi)
        print(f'  riff QUA Ô (ô liền cùng nhịp + cùng hình): {len(chuoi)} chuỗi, {so}/{len(ky)} ô ({so * 100 // max(1, len(ky))}%) —',
              ' · '.join(f'ô {c[0]}–{c[-1]} ({"cùng nốt" if ky[c[0]][2] == ky[c[1]][2] else "dời"})' for c in chuoi[:10]))


if __name__ == '__main__':
    main()
