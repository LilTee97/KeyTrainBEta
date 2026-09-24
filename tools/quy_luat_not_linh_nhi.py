# -*- coding: utf-8 -*-
"""Quy luat Linh Nhi SOAN NOT o cau solo — do tren 23 doan solo cua 8 ban ky am.

    python tools/quy_luat_not_linh_nhi.py

Tach DIEU (slow rock / bolero) va GIONG (truong / thu). Giai dieu = not cao nhat moi cu go tay
phai. Phach manh: bolero = 4 phach cua o; slow rock = dau hai chum ba cua o 6/8 (not den 0 va 1,5).
Hop am: slow rock theo bang doc tay (HOP_AM_TAY), bolero theo ky hieu sheet.
"""
from __future__ import annotations

import collections
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slow_rock_linh_nhi as S  # noqa: E402

EPS = 1e-6
TAP = S.TAP_CHAT


def tap_hop_am(h):
    return {(h[1] + x) % 12 for x in TAP.get(S.nhom_hau(h[2]), (0, 4, 7))}


def hop_luc(o, p):
    h = [x for x in o['h'] if x[0] <= p + EPS]
    return h[-1] if h else (o['h'][0] if o['h'] else None)


def dang(tops):
    """Dang o: len / xuong / vom / long chao / phang, theo not dau-giua-cuoi."""
    if len(tops) < 3:
        return 'it not'
    a, m, b = tops[0], max(tops[1:-1]), tops[-1]
    lo = min(tops[1:-1])
    if b - a >= 3 and m <= b + 1:
        return 'di len'
    if a - b >= 3 and lo >= b - 1:
        return 'di xuong'
    if m >= max(a, b) + 3:
        return 'vom'
    if lo <= min(a, b) - 3:
        return 'long chao'
    return 'phang'


def do():
    ra = S.tat_ca()
    D = collections.defaultdict(collections.Counter)
    for x in ra:
        dieu = 'slow rock' if x['song']['name'] in S.LUOI else 'bolero'
        k = (dieu, 'thu' if x['thu'] else 'truong')
        C = D[k]
        chu = x['chu']
        manh = (0.0, 1.5) if dieu == 'slow rock' else (0.0, 1.0, 2.0, 3.0)
        C['doan'] += 1
        tops_all = []      # (thoi diem tuyet doi, midi, o, p, dur, co 2 not quang 8)
        t0 = 0.0
        prev_sig = None
        for oi, o in enumerate(x['o']):
            C['o'] += 1
            tops = []
            for p, d, ps in o['r']:
                tops_all.append((t0 + p, ps[-1], oi, p, d))
                tops.append(ps[-1])
                h = hop_luc(o, p)
                if h is None:
                    continue
                trong = (ps[-1] % 12 - chu) % 12 in {(g) % 12 for g in tap_hop_am(h)}
                if any(abs(p - m) < EPS for m in manh):
                    C['manh_n'] += 1
                    C['manh_hop_am'] += trong
                else:
                    C['nhe_n'] += 1
                    C['nhe_hop_am'] += trong
            C['dang:' + dang(tops)] += 1
            # nghi trong o: khoang lang dai nhat cua tay phai
            am = sorted((p, p + d) for p, d, ps in o['r'])
            lang, cuoi = 0.0, 0.0
            for a, b in am:
                lang = max(lang, a - cuoi)
                cuoi = max(cuoi, b)
            lang = max(lang, o['dai'] - cuoi)
            if not o['r']:
                lang = o['dai']
            nua = o['dai'] / 2
            vt = 'cuoi doan' if oi == len(x['o']) - 1 else ('giua doan')
            if lang >= nua - EPS:
                C[f'o nghi >= nua o ({vt})'] += 1
            # lap: hinh cao do (buoc) giong het o truoc
            sig = tuple(b - a for a, b in zip(tops, tops[1:]))
            if prev_sig is not None and len(sig) >= 2 and sig == prev_sig:
                C['o lap hinh o truoc'] += 1
            prev_sig = sig
            t0 += o['dai']
        # buoc va hoi phuc sau buoc nhay
        for (ta, a, *_), (tb, b, *_), (tc, c, *_) in zip(tops_all, tops_all[1:], tops_all[2:]):
            s1, s2 = b - a, c - b
            if 5 <= abs(s1) < 12:
                C['nhay'] += 1
                if s2 * s1 < 0 and abs(s2) <= 4:
                    C['nhay roi buoc nguoc'] += 1
        # noi o: not dau o so voi not cuoi o truoc
        by_o = collections.defaultdict(list)
        for t, m, oi, p, d in tops_all:
            by_o[oi].append(m)
        for oi in range(1, len(x['o'])):
            if by_o.get(oi - 1) and by_o.get(oi):
                st = abs(by_o[oi][0] - by_o[oi - 1][-1])
                C['noi o: ' + ('0-2' if st <= 2 else '3-4' if st <= 4 else '5-7' if st <= 7 else '8ve' if st == 12 else '8-11' if st < 12 else '>8ve')] += 1
        # tam cao theo vi tri doan
        n = len(tops_all)
        if n >= 6:
            ba = [tops_all[: n // 3], tops_all[n // 3: 2 * n // 3], tops_all[2 * n // 3:]]
            for ten, v in zip(('dau', 'giua', 'cuoi'), ba):
                C['tam_' + ten] += sum(m for *_, m, oi, p, d in [(t, m, oi, p, d) for t, m, oi, p, d in v]) / len(v)
        # cau chay: >=4 not lien tiep, moi buoc <= 0,5 phach, cung chieu, buoc <= 5
        i = 0
        while i < n - 3:
            j = i
            dir_ = 0
            while j + 1 < n and tops_all[j + 1][0] - tops_all[j][0] <= 0.5 + EPS:
                st = tops_all[j + 1][1] - tops_all[j][1]
                sg = (st > 0) - (st < 0)
                if st == 0 or (dir_ and sg != dir_) or abs(st) > 5:
                    break
                dir_ = sg
                j += 1
            if j - i + 1 >= 4:
                C['chay'] += 1
                C['chay ' + ('len' if dir_ > 0 else 'xuong')] += 1
                vi = tops_all[i][2] / max(1, len(x['o']) - 1)
                C['chay o ' + ('nua dau doan' if vi < 0.5 else 'nua sau doan')] += 1
                # dap: not sau chuoi
                if j + 1 < n:
                    t, m, oi, p, d = tops_all[j + 1]
                    h = hop_luc(x['o'][oi], p)
                    if h is not None:
                        C['chay dap not hop am'] += (m % 12 - chu) % 12 in tap_hop_am(h)
                        C['chay co not dap'] += 1
                i = j
            i += 1
        # not ket doan
        if tops_all:
            t, m, oi, p, d = tops_all[-1]
            deg = (m - (60 + chu)) % 12
            C['ket bac ' + S.TEN_BAC[deg]] += 1
    return D


def in_do():
    D = do()
    for k in sorted(D):
        C = D[k]
        print(f"\n=== {k[0]} · {k[1]}  ({C['doan']} doan, {C['o']} o)")
        mn, nn = C['manh_n'] or 1, C['nhe_n'] or 1
        print(f"  not hop am: phach manh {C['manh_hop_am']}/{C['manh_n']} ({100*C['manh_hop_am']/mn:.0f}%) · phach nhe {C['nhe_hop_am']}/{C['nhe_n']} ({100*C['nhe_hop_am']/nn:.0f}%)")
        print(f"  nhay 5-11 roi buoc nguoc <=4: {C['nhay roi buoc nguoc']}/{C['nhay']}")
        print('  noi o:', ' · '.join(f"{a[6:]} {b}" for a, b in sorted(C.items()) if a.startswith('noi o: ')))
        print('  dang o:', ' · '.join(f"{a[5:]} {b}" for a, b in sorted(C.items(), key=lambda kv: -kv[1]) if a.startswith('dang:')))
        print('  nghi:', ' · '.join(f"{a} {b}" for a, b in C.items() if a.startswith('o nghi')), f"· o lap hinh o truoc {C['o lap hinh o truoc']}")
        d = C['doan'] or 1
        print(f"  tam cao TB (midi): dau {C['tam_dau']/d:.1f} · giua {C['tam_giua']/d:.1f} · cuoi {C['tam_cuoi']/d:.1f}")
        print(f"  chay: {C['chay']} (len {C['chay len']} · xuong {C['chay xuong']} · nua dau {C['chay o nua dau doan']} · nua sau {C['chay o nua sau doan']}) · dap not hop am {C['chay dap not hop am']}/{C['chay co not dap']}")
        print('  not ket doan:', ' · '.join(f"{a[4:]} {b}" for a, b in sorted(C.items(), key=lambda kv: -kv[1]) if a.startswith('ket ')))


if __name__ == '__main__':
    in_do()
