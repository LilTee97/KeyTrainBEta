# -*- coding: utf-8 -*-
"""Cau chay ngon (run) cua Linh Nhi trong hai sheet slow rock — do tren CA BAI, hai tay.

    python tools/chay_ngon_slow_rock.py          # bang tong + tung cau
    python tools/chay_ngon_slow_rock.py --json   # du lieu tung cau (cho bo soan)

Cau chay = >= 4 cu go lien cua MOT tay, cach nhau <= mot moc don (0,5 not den), cung chieu,
buoc 1..7 nua cung (liet ke ca buoc lien bac lan hop am rai). Not cua cau = not DINH moi cu go
(tay phai) hoac not DAY (tay trai). Luoi o 6/8 dung cua tung bai (LUOI trong slow_rock_linh_nhi):
"tieng" 1..6 = moc don trong o, tieng 1 va 4 la phach manh.
Hop am tai cho chay: doc tu not dang vang trong o (doan_hop_am) — hai sheet slow rock ky hieu
khong dang tin (goc khop not 6/12 va 4/13, xem md 13c).
"""
from __future__ import annotations

import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slow_rock_linh_nhi as S  # noqa: E402

EPS = 1e-6
TEN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
BAC = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7']


def bai_slow_rock():
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    items = corp if isinstance(corp, list) else corp.get('songs') or list(corp.values())
    return [s for s in items if isinstance(s, dict) and s.get('name') in S.LUOI]


def doan_cua(song, meta, beat):
    starts = meta['bar_start']
    bar = max(k for k in starts if starts[k] <= beat + EPS)
    for ten, v in song['sections'].items():
        a, b = v['bars']
        if a <= bar <= b:
            return ten, bar
    return '?', bar


def chay(tops):
    """Cac doan chay (i, j) trong day (beat, midi)."""
    ra, a = [], 0
    for b in range(1, len(tops) + 1):
        ok = (b < len(tops) and tops[b][0] - tops[b - 1][0] <= 0.5 + EPS
              and 1 <= abs(tops[b][1] - tops[b - 1][1]) <= 7
              and (b - a < 2 or (tops[b][1] - tops[b - 1][1]) * (tops[a + 1][1] - tops[a][1]) > 0))
        if not ok:
            if b - a >= 4:
                ra.append((a, b - 1))
            a = b
    return ra


def do():
    ds = []
    for song in bai_slow_rock():
        chu, the = S.B.giong_ra_so(song.get('giong'))
        ns, meta, _ = S.doc(song)
        dai, pha = S.LUOI[song['name']]
        o_cua = lambda t: pha + ((t - pha) // dai) * dai  # noqa: E731
        for hand in (1, 2):
            g = collections.defaultdict(list)
            for n in ns:
                if n['hand'] == hand and not n['tie_stop'] and n['dur'] > EPS:
                    g[round(n['beat'], 4)].append(n)
            tops = sorted((t, (max if hand == 1 else min)(x['midi'] for x in v), max(x['dur'] for x in v), len(v))
                          for t, v in g.items())
            for i, j in chay([(t, m) for t, m, _, _ in tops]):
                seg = tops[i:j + 1]
                t0, t1 = seg[0][0], seg[-1][0]
                o0 = o_cua(t0)
                hop = S.doan_hop_am(ns, o0, o0 + dai)
                goc, chat = hop if hop else (None, None)
                tap = {(goc + x) % 12 for x in S.MAU[chat]} if hop else set()
                gam = {(chu + x) % 12 for x in (S.GAM[the == 'thu'])}
                mids = [m for _, m, _, _ in seg]
                sau = next((x for x in tops[j + 1:] if x[0] - t1 <= 1.0 + EPS), None)
                hop_sau = S.doan_hop_am(ns, o_cua(sau[0]), o_cua(sau[0]) + dai) if sau else None
                kia = [n for n in ns if n['hand'] != hand and n['dur'] > EPS and not n['tie_stop']
                       and t0 - EPS <= n['beat'] <= t1 + EPS]
                ngan = [n for n in ns if n['hand'] != hand and n['dur'] > EPS and n['beat'] < t0 - EPS
                        and n['beat'] + n['dur'] > t0 + EPS]
                doan, bar = doan_cua(song, meta, t0)
                ds.append({
                    'bai': S.TEN_DEP.get(song['name'], song['name']), 'doan': doan, 'o_xml': bar,
                    'tay': 'phai' if hand == 1 else 'trai',
                    'tieng_dau': round((t0 - o0) * 2 + 1, 2), 'tieng_cuoi': round((t1 - o0) * 2 + 1, 2),
                    'qua_o': o_cua(t1) > o0 + EPS,
                    'ioi': sorted({round(b[0] - a[0], 3) for a, b in zip(seg, seg[1:])}),
                    'so_not': len(seg), 'chieu': 'len' if mids[-1] > mids[0] else 'xuong',
                    'tam': mids[-1] - mids[0], 'buoc': [b - a for a, b in zip(mids, mids[1:])],
                    'not': [f"{TEN[m % 12]}{m // 12 - 1}" for m in mids],
                    'hop_am': f"{TEN[goc]}{chat}" if hop else '?',
                    'bac_not': [BAC[(m - goc) % 12] for m in mids] if hop else [],
                    'not_hop_am': sum(1 for m in mids if m % 12 in tap),
                    'not_gam': sum(1 for m in mids if m % 12 in gam),
                    'dap': None if not sau else {
                        'cach': round(sau[0] - t1, 3), 'tieng': round((sau[0] - o_cua(sau[0])) * 2 + 1, 2),
                        'o_moi': o_cua(sau[0]) > o_cua(t1) + EPS, 'buoc': sau[1] - mids[-1],
                        'hop_am': f"{TEN[hop_sau[0]]}{hop_sau[1]}" if hop_sau else '?',
                        'bac': BAC[(sau[1] - hop_sau[0]) % 12] if hop_sau else '?',
                        'la_hop_am': bool(hop_sau) and sau[1] % 12 in {(hop_sau[0] + x) % 12 for x in S.MAU[hop_sau[1]]},
                    },
                    'tay_kia_go': len(kia), 'tay_kia_ngan': len(ngan) > 0,
                    '_tho': {'chu': chu, 'thu': the == 'thu', 'vach': o0 + dai, 'seg': [(t, m) for t, m, _, _ in seg],
                             'sau': (sau[0], sau[1]) if sau else None, 'hop': hop,
                             'hop_sau': S.doan_hop_am(ns, o0 + dai, o0 + 2 * dai)},
                })
    return ds


def la_dem(d):
    """Hinh RAI DEM tay trai (1-5-8-10 tu tieng 1-2, moc don deu, khong vat o) — khong phai cau chay."""
    return (d['tay'] == 'trai' and d['ioi'] == [0.5] and d['tieng_dau'] <= 2.0 and not d['qua_o']
            and d['chieu'] == 'len' and abs(d['buoc'][0]) >= 5)


def loai(d):
    lien = sum(1 for b in d['buoc'] if abs(b) <= 2)
    kep = any(x <= 0.25 + EPS for x in d['ioi'])
    return ('moc kep' if kep else 'moc don') + (' · lien bac' if lien * 2 >= len(d['buoc']) else ' · rai')


def in_bang(ds):
    C = collections.Counter
    dem = [d for d in ds if la_dem(d)]
    ds = [d for d in ds if not la_dem(d)]
    print(f"BO {len(dem)} hinh rai dem tay trai (tieng 1-2, moc don, 1-5-...)")
    print('  loai cau:', dict(C(loai(d) for d in ds).most_common()))
    print('  tay x doan:', dict(C((d['tay'], 'solo' if d['doan'] in ('intro', 'interlude', 'outro') else 'hat') for d in ds).most_common()))
    print(f"TONG {len(ds)} cau chay")
    for k in ('bai', 'doan', 'tay', 'chieu', 'so_not'):
        print(f"  {k}:", dict(C(d[k] for d in ds).most_common()))
    print('  nhom doan (hat/solo):', dict(C('solo' if d['doan'] in ('intro', 'interlude', 'outro') else 'hat' for d in ds)))
    print('  ioi:', dict(C(tuple(d['ioi']) for d in ds).most_common()))
    print('  tieng dau:', dict(C(d['tieng_dau'] for d in ds).most_common()))
    print('  tieng cuoi:', dict(C(d['tieng_cuoi'] for d in ds).most_common()))
    print('  tam (nua cung):', dict(C(d['tam'] for d in ds).most_common()))
    print('  buoc:', dict(C(abs(b) for d in ds for b in d['buoc']).most_common()))
    nh = sum(d['not_hop_am'] for d in ds); ng = sum(d['not_gam'] for d in ds); nt = sum(d['so_not'] for d in ds)
    print(f"  not hop am {nh}/{nt} · not trong gam {ng}/{nt}")
    print('  bac not dau:', dict(C(d['bac_not'][0] for d in ds if d['bac_not']).most_common()))
    print('  bac not cuoi:', dict(C(d['bac_not'][-1] for d in ds if d['bac_not']).most_common()))
    dap = [d['dap'] for d in ds if d['dap']]
    print(f"  co not dap {len(dap)}/{len(ds)} · sang o moi {sum(x['o_moi'] for x in dap)} · dap tieng",
          dict(C(x['tieng'] for x in dap).most_common()))
    print('  dap la not hop am:', sum(x['la_hop_am'] for x in dap), '/', len(dap), '· bac dap', dict(C(x['bac'] for x in dap).most_common()))
    print('  buoc vao not dap:', dict(C(x['buoc'] for x in dap).most_common()))
    print('  tay kia: go trong luc chay', dict(C(min(d['tay_kia_go'], 4) for d in ds).most_common()),
          '· dang ngan luc bat dau', sum(d['tay_kia_ngan'] for d in ds))
    print()
    for d in ds:
        dp = d['dap']
        print(f"{d['bai'][:8]:8} {d['doan']:14} o{d['o_xml']:<3} {d['tay']:5} t{d['tieng_dau']}->{d['tieng_cuoi']} "
              f"ioi{d['ioi']} {d['chieu']:4} {d['hop_am']:6} {' '.join(d['not'])} [{' '.join(d['bac_not'])}]"
              + (f" => {dp['bac']}@t{dp['tieng']}{'(o moi)' if dp['o_moi'] else ''} {dp['hop_am']}" if dp else ''))


def khuon(ds):
    """Cau chay DAN VAO HOP AM SAU: cac not truoc vach + not dap o vach (<= nua phach sau vach).

    Tra ve danh sach khuon: (tay, [(lech so voi vach, cao do so voi chu am)], not dap (lech, cao do),
    hop am hien tai (goc, chat), hop am sau (goc, chat), thu, nguon).
    """
    ra = []
    for d in ds:
        if la_dem(d):
            continue
        t = d['_tho']
        vach, seg = t['vach'], t['seg']
        truoc = [(x, m) for x, m in seg if x < vach - EPS]
        sau_vach = [(x, m) for x, m in seg if x >= vach - EPS]
        if sau_vach:
            dap = sau_vach[0]
        elif t['sau'] and vach - EPS <= t['sau'][0] <= vach + 0.5 + EPS:
            dap = t['sau']
        else:
            continue
        if len(truoc) < 3 or not t['hop'] or not t['hop_sau']:
            continue
        chu = t['chu']
        ra.append({
            'tay': d['tay'], 'thu': t['thu'], 'nguon': f"{d['bai']} o{d['o_xml']} ({d['doan']})",
            'not': [(round(x - vach, 3), m - 60 - chu) for x, m in truoc],
            'dap': (round(dap[0] - vach, 3), dap[1] - 60 - chu),
            'hop': ((t['hop'][0] - chu) % 12, t['hop'][1]), 'hopSau': ((t['hop_sau'][0] - chu) % 12, t['hop_sau'][1]),
        })
    return ra


def sinh_ts(ds):
    k = khuon(ds)
    print('/**')
    print(' * CAU CHAY DAN VAO HOP AM SAU cua Linh Nhi trong hai sheet slow rock — SINH BANG SCRIPT:')
    print(' *')
    print(' *     python tools/chay_ngon_slow_rock.py --sinh > src/reharm/style/slowRockChayNgon.ts')
    print(' *')
    print(' * Moi khuon: cac not truoc vach nhip (lech so voi vach, not den; cao do so voi MIDI 60 + chu am)')
    print(' * va not dap o vach. Hop am doc tu not dang vang: [goc so voi chu am, chat].')
    print(' */')
    print('export type KhuonChay = {')
    print("  tay: 'phai' | 'trai'; thu: boolean; nguon: string")
    print('  not: readonly (readonly [number, number])[]; dap: readonly [number, number]')
    print('  hop: readonly [number, string]; hopSau: readonly [number, string]')
    print('}')
    print()
    print('export const KHUON_CHAY_SR: readonly KhuonChay[] = [')
    for x in k:
        print(f"  {{ tay: '{x['tay']}', thu: {'true' if x['thu'] else 'false'}, nguon: {json.dumps(x['nguon'], ensure_ascii=False)},")
        print(f"    not: {json.dumps(x['not'])}, dap: {json.dumps(list(x['dap']))},")
        print(f"    hop: [{x['hop'][0]}, '{x['hop'][1]}'], hopSau: [{x['hopSau'][0]}, '{x['hopSau'][1]}'] }},")
    print(']')


if __name__ == '__main__':
    ds = do()
    if '--json' in sys.argv:
        print(json.dumps([{k: v for k, v in d.items() if k != '_tho'} for d in ds], ensure_ascii=False, indent=1))
    elif '--sinh' in sys.argv:
        sinh_ts(ds)
    else:
        in_bang(ds)
