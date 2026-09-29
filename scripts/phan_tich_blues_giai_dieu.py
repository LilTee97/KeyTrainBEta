# -*- coding: utf-8 -*-
"""Âm giai và giai điệu Blues trong hai sheet — cho Bộ Soạn Blues (lượt 5, 28/9/2026).

    python -X utf8 scripts/phan_tich_blues_giai_dieu.py

Câu hỏi: nốt giai điệu blues bám CHỦ ÂM hay bám HỢP ÂM? Trên từng chức năng I · IV · V, nốt nào dùng, nốt nào tránh?
Nốt blue (b3, b5, b7) đi về đâu? Người dùng chê câu solo lượt 4 "còn phô".

Rockhouse: tay phải, chức năng mỗi nửa ô lấy từ kho nửa ô (gốc theo bass, `bluesClaudeO.json`).
Robert: tay phải, chức năng theo ký hiệu in (Robert không có kho nửa ô; nhịp chẵn — chỉ lấy cao độ).
"""
import collections
import json
import os
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mxl  # noqa: E402
from phan_tich_blues_lick import ky_hieu  # noqa: E402

GOC = 'C:/Users/Tin PC/Downloads/Documents/Linh Nhi/'
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
HAM = {0: 'I', 5: 'IV', 7: 'V'}
EPS = 1e-6


def dem(ten, cu, tonic):
    """cu: [(hàm, phách mạnh?, midi, dài phách)] → in phân bố bậc so CHỦ ÂM theo chức năng."""
    print(f'\n== {ten}: bậc so CHỦ ÂM, theo chức năng (n = số nốt; "mạnh" = phách 1 hoặc 4 của ô 6/8)')
    for h in (0, 5, 7):
        for manh in (None, True):
            c = collections.Counter(BAC[(m - tonic) % 12] for f, mn, m, d in cu if f == h and (manh is None or mn == manh))
            n = sum(c.values())
            if not n:
                continue
            nhan = 'mọi nốt' if manh is None else 'phách mạnh'
            print(f'  {HAM[h]:>2} {nhan:10} n={n:4}: ' + ' '.join(f'{k}:{v * 100 // n}%' for k, v in c.most_common(9)))
    for h in (0, 5, 7):
        c = collections.Counter(BAC[(m - tonic) % 12] for f, mn, m, d in cu if f == h)
        print(f'  {HAM[h]:>2}: 3 trưởng (so chủ) {c["3"]} · b3 {c["b3"]} · 7 {c["7"]} · b7 {c["b7"]} · 6 {c["6"]} · b6 {c["b6"]}'
              f' · 4 {c["4"]} · b5 {c["b5"]}')


def blue(ten, day, tonic):
    """day: dãy nốt đỉnh (midi) liên tiếp trong câu → nốt blue đi về đâu."""
    ra = collections.defaultdict(collections.Counter)
    for a, b in zip(day, day[1:]):
        if a is None or b is None:
            continue
        ba = BAC[(a - tonic) % 12]
        if ba in ('b3', 'b5', 'b7', 'b6'):
            ra[ba][f'{BAC[(b - tonic) % 12]}({"+" if b > a else "-" if b < a else "="}{abs(b - a)})'] += 1
    print(f'\n== {ten}: nốt blue (so chủ) đi tiếp về đâu')
    for k in ('b3', 'b5', 'b7', 'b6'):
        n = sum(ra[k].values())
        if n:
            print(f'  {k} n={n}: ' + ' '.join(f'{x}:{v}' for x, v in ra[k].most_common(6)))


def rockhouse():
    ns, meta = mxl.notes(mxl.load(GOC + 'Blues/Rockhouse-Ray-da-sua.mxl'))
    kho = {o['gi']: o for o in json.load(open('D:/KeyTrain/src/reharm/style/bluesClaudeO.json', encoding='utf8'))['o']}
    cu, day = [], []
    theo = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 1 and n['dur'] > EPS and not n['tie_stop']:
            theo[round(n['beat'], 4)].append(n)
    truoc = None
    for t in sorted(theo):
        gi = int(t // 2)
        if gi not in kho:
            continue
        f = (kho[gi]['goc'] - 7) % 12
        m = round((t - gi * 2) * 3, 3)
        manh = abs(m) < .2 or abs(m - 3) < .2
        top = max(x['midi'] for x in theo[t])
        cu.append((f, manh, top, max(x['dur'] for x in theo[t])))
        # dãy câu: đứt khi nghỉ > 1 phách
        if truoc is not None and t - truoc > 1 + EPS:
            day.append(None)
        day.append(top)
        truoc = t
    dem('Rockhouse (Sol, nốt đỉnh tay phải, 212 nửa ô)', cu, 7)
    blue('Rockhouse', day, 7)
    return cu


def robert():
    ns, meta = mxl.notes(mxl.load(GOC + 'Blues/Robert-Ray-chia-doan-C-Blues.mxl'))
    kh = ky_hieu(GOC + 'Blues/Robert-Ray-chia-doan-C-Blues.mxl')
    goc = lambda t: ([g for a, g in kh if a <= t + EPS] or [None])[-1]
    theo = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 1 and n['dur'] > EPS and not n['tie_stop']:
            theo[round(n['beat'], 4)].append(n)
    cu, day, truoc = [], [], None
    for t in sorted(theo):
        g = goc(t)
        if g is None:
            continue
        f = g % 12
        top = max(x['midi'] for x in theo[t])
        cu.append((f if f in (0, 5, 7) else -1, (t % 2) < EPS, top, 0))
        if truoc is not None and t - truoc > 2 + EPS:
            day.append(None)
        day.append(top)
        truoc = t
    dem('Robert (Đô, nốt đỉnh tay phải; "mạnh" = đầu phách thật)', cu, 0)
    blue('Robert', day, 0)


if __name__ == '__main__':
    rockhouse()
    robert()
