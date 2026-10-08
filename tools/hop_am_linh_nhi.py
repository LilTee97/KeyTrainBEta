# -*- coding: utf-8 -*-
"""Linh Nhi DAT HOP AM cho phan hat the nao — do tren 8 ban ky am, tach truong / thu.

    python tools/hop_am_linh_nhi.py            # in so do
    python tools/hop_am_linh_nhi.py --json     # so do dang JSON (cho bang mau hop am)

Do PHAN HAT (verse*, chorus*): cho chi DAT HOP AM cho bai. Phan solo da do o
slow_rock_linh_nhi.py.

HOP AM MOI DOAN doc the nao:
  * Bolero: theo KY HIEU sheet, nhung chi nhan khi not TAY TRAI dang vang ung ho no
    (>= 60% thoi luong tay trai nam trong hop am ky hieu). Khong ung ho thi doc tu tay trai.
  * Slow rock (La Thu, Mot Coi): ky hieu khop not qua it (goc dung 6/12, 4/13 o doan
    solo) nen DOC TU TAY TRAI tung o 6/8. Chi o chia doi khi bass tay trai doi goc o
    moc chum ba thu hai.
MAU (7, 9, 11, 6...) KHONG lay tu ky hieu — lay tu NOT DEM that: tay trai + cac not
duoi not dinh cua tay phai. Ky hieu co the do plugin do may sinh ra va dem ca not giai
dieu vao lam mau.
"""
from __future__ import annotations

import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slow_rock_linh_nhi as S  # noqa: E402

B = S.B
LA_MA = S.LA_MA
EPS = 1e-6
GAM = {True: {0, 2, 3, 5, 7, 8, 10}, False: {0, 2, 4, 5, 7, 9, 11}}
HAT = ('verse', 'chorus', 'prechorus')   # prechorus: kho Cà Pháo có (7/10/2026); Linh Nhi không có đoạn nào tên ấy


def tap_ba(root, q):
    return {(root + x) % 12 for x in {'M': (0, 4, 7), 'm': (0, 3, 7), 'dim': (0, 3, 6), 'aug': (0, 4, 8),
                                      'sus4': (0, 5, 7), 'sus2': (0, 2, 7)}[q]}


def not_vang(ns, a, b, hand=None):
    ra = []
    for n in ns:
        if n['dur'] <= EPS or (hand and n['hand'] != hand):
            continue
        d = min(n['beat'] + n['dur'], b) - max(n['beat'], a)
        if d > EPS:
            ra.append((n, d))
    return ra


def doc_trai(ns, a, b, chu=None, thu=None):
    """(goc, chat ba, bass): GOC tu tay trai, BAC BA tu moi not dang vang.

    Tay trai rai 1-5-8 khong co bac ba — chon chat chi tu tay trai thi hoa diem, va lan
    dau do toi de 'truong' thang: ra 54 hop am "I" trong bai thu, trong khi do bac ba moi
    doan hat cua 5 bai thu thi bac ba thu ap dao o moi doan (cao nhat 30% bac ba truong).
    """
    v = not_vang(ns, a, b, 2)
    if not v:
        return None
    w = collections.Counter()
    for n, d in v:
        w[n['midi'] % 12] += d
    dau = [n for n, d in v if n['beat'] < a + (b - a) / 2 + EPS] or [n for n, d in v]
    bass = min(n['midi'] for n in dau) % 12
    tot = None
    for r in range(12):
        for q in ('5', 'dim', 'sus4'):
            tap = {'5': {r, (r + 7) % 12}, 'dim': {r, (r + 3) % 12, (r + 6) % 12}, 'sus4': {r, (r + 5) % 12, (r + 7) % 12}}[q]
            if bass not in tap | {(r + 3) % 12, (r + 4) % 12, (r + 10) % 12, (r + 11) % 12}:
                continue
            # Điem "co bac ba" CHI cho ung vien '5' (goc - 5, khong co bac ba). Sua 7/10/2026 — cu cong cho ca 'dim' va 'sus4':
            # bac ba thu cua hop am giam da nam trong `tap` nen bi DEM HAI LAN. Trieu chung: o Re-Fa#-La doc ra Si° (Mot Coi o 38),
            # o Eb -> D doc ra Si° (o 25) — chinh la "iii°/b3 x22 chua kiem tay" cua md 13d. Lui = bo `if q == '5'`.
            ba = 0.8 * (w[(r + 3) % 12] + w[(r + 4) % 12]) if q == '5' else 0.0
            diem = (sum(w[p] for p in tap) + ba
                    - 0.7 * sum(w[p] for p in w if p not in tap and (p - r) % 12 not in (3, 4, 10, 11, 2)))
            if r == bass:
                diem += 0.3 * sum(w.values())
            if q != '5':
                diem -= 0.15 * sum(w.values())
            if tot is None or diem > tot[0] + EPS:
                tot = (diem, r, q)
    if tot is None:
        return None
    r, q = tot[1], tot[2]
    if q == '5':
        tat = collections.Counter()
        for n, d in not_vang(ns, a, b):
            tat[(n['midi'] - r) % 12] += d * (2 if n['hand'] == 2 else 1)
        if tat[3] > tat[4] * 1.2:
            q = 'm'
        elif tat[4] > tat[3] * 1.2:
            q = 'M'
        elif chu is not None:
            bac = (r - chu) % 12
            q = 'M' if bac == 7 or bac in ((3, 8, 10) if thu else (0, 5, 7)) else 'm'
        else:
            q = 'M'
    return r, q, bass


def chat_ky_hieu(el):
    import don_hop_am
    rp = don_hop_am._pc(el.find('root'), 'root')
    tap = don_hop_am.tap_not(el, gom_bass=False)
    rel = {(p - rp) % 12 for p in tap}
    q = ('dim' if 3 in rel and 6 in rel and 7 not in rel else 'm' if 3 in rel else 'aug' if 4 in rel and 8 in rel and 7 not in rel
         else 'M' if 4 in rel else 'sus4' if 5 in rel else 'sus2')
    bass = el.find('bass')
    bp = don_hop_am._pc(bass, 'bass') if bass is not None else rp
    return rp, q, bp


def mau(ns, a, b, root):
    """Bac mau co trong NOT DEM (tay trai + not duoi dinh tay phai), theo thoi luong."""
    phai = collections.defaultdict(list)
    for n, d in not_vang(ns, a, b, 1):
        phai[round(n['beat'], 3)].append((n, d))
    dem = [(n, d) for n, d in not_vang(ns, a, b, 2)]
    for at, v in phai.items():
        v.sort(key=lambda x: x[0]['midi'])
        dem += v[:-1]            # bo not dinh = giai dieu
    w = collections.Counter()
    for n, d in dem:
        w[(n['midi'] - root) % 12] += d
    tong = sum(w.values()) or 1
    co = {k for k, x in w.items() if x >= 0.08 * tong}
    return co


def doan_hat(song):
    """Tung doan hop am cua phan hat: dict(o, a, b, goc, q, bass, mau, nguon)."""
    chu, the = B.giong_ra_so(song['giong'])
    ns, meta, hops = S.doc(song)
    starts, bl = meta['bar_start'], meta['barlens']
    ra = []
    for k, v in song['sections'].items():
        if not k.startswith(HAT):
            continue
        a_bar, b_bar = v['bars']
        t0, t1 = starts[a_bar], starts[b_bar] + bl[b_bar]
        if song['name'] in S.LUOI:
            dai, pha = S.LUOI[song['name']]
            k0 = int((t0 - pha) // dai)
            o_list = [(pha + i * dai, dai) for i in range(k0, int((t1 - pha) // dai) + 1)
                      if t0 <= pha + i * dai + dai / 2 < t1]
            for oi, (a, d) in enumerate(o_list):
                # Mot hop am moi o 6/8. Do chia doi giua o bi cau rai tay trai danh lua
                # (nua sau cua 1-3-5-8-5-3 khong mo bang goc); o chia tinh theo o 12/8.
                h = doc_trai(ns, a, a + d, chu, the == 'thu')
                segs = [(a, a + d, h)] if h else []
                for s_a, s_b, h in segs:
                    ra.append(dict(doan=k, o=(a, d), a=s_a, b=s_b, goc=h[0], q=h[1], bass=h[2],
                                   mau=mau(ns, s_a, s_b, h[0]), nguon='tay trai'))
            continue
        # bolero: theo ky hieu, kiem bang tay trai
        truoc = [h for h in hops if h[0] < t0 + EPS]
        moc = ([(t0, truoc[-1][1])] if truoc else []) + [(at, el) for at, el in hops if t0 + EPS <= at < t1 - EPS]
        for i, (at, el) in enumerate(moc):
            den = moc[i + 1][0] if i + 1 < len(moc) else t1
            if den - at < 0.5:
                continue
            rp, q, bp = chat_ky_hieu(el)
            trai = not_vang(ns, at, den, 2)
            tong = sum(d for n, d in trai) or 1
            trong = sum(d for n, d in trai if n['midi'] % 12 in tap_ba(rp, q) | {(rp + 10) % 12, (rp + 11) % 12, (rp + 2) % 12})
            if trong / tong >= 0.6:
                # BẬC BA theo nốt thật (sửa 7/10/2026): ký hiệu ghi trưởng mà KHÔNG nốt nào đang vang có bậc 3 trưởng, còn tay đệm
                # có bậc 3 thứ (hay ngược lại) → theo nốt. Triệu chứng cũ: Người hãy quên em đi ô 9 ghi "D9(#11)", tay phải bấm
                # A – C – E – F (Dm9) mà đọc ra I trưởng. Lùi = bỏ khối này.
                if q in ('M', 'm'):
                    vang = {n['midi'] % 12 for n, d in not_vang(ns, at, den)}
                    dem = {n['midi'] % 12 for n, d in not_vang(ns, at, den, 2)}
                    for n, d in not_vang(ns, at, den, 1):
                        if n['midi'] < max(x['midi'] for x, _ in not_vang(ns, n['beat'], n['beat'] + EPS * 10, 1) or [(n, 0)]):
                            dem.add(n['midi'] % 12)
                    ba_dung, ba_kia = ((rp + 4) % 12, (rp + 3) % 12) if q == 'M' else ((rp + 3) % 12, (rp + 4) % 12)
                    if ba_dung not in vang and ba_kia in dem:
                        q = 'm' if q == 'M' else 'M'
                ra.append(dict(doan=k, o=None, a=at, b=den, goc=rp, q=q, bass=bp, mau=mau(ns, at, den, rp), nguon='ky hieu'))
            else:
                h = doc_trai(ns, at, den, chu, the == 'thu')
                if h:
                    ra.append(dict(doan=k, o=None, a=at, b=den, goc=h[0], q=h[1], bass=h[2], mau=mau(ns, at, den, h[0]),
                                   nguon='tay trai (ky hieu khong khop)'))
    for x in ra:
        x['bac'] = (x['goc'] - chu) % 12
        x['bass_bac'] = (x['bass'] - x['goc']) % 12
    ra.sort(key=lambda x: x['a'])
    return chu, the == 'thu', meta, ra


def la_ma(bac, q):
    s = LA_MA[bac]
    if q in ('m', 'dim'):
        s = s.replace('I', 'i').replace('V', 'v')
    return s + ('°' if q == 'dim' else '+' if q == 'aug' else 'sus' if q.startswith('sus') else '')


def do():
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    tong = {True: collections.defaultdict(collections.Counter), False: collections.defaultdict(collections.Counter)}
    bai_co = {True: collections.defaultdict(set), False: collections.defaultdict(set)}
    nguon = collections.Counter()
    for s in corp['songs']:
        if s.get('teacher') != 'linh-nhi':
            continue
        chu, thu, meta, segs = doan_hat(s)
        ten = S.TEN_DEP.get(s['name'], s['name'])
        T = tong[thu]
        # o nhip (bolero: o sheet; slow rock: o 12/8 = hai o 6/8) co may hop am
        o_of = collections.defaultdict(list)
        for x in segs:
            nguon[x['nguon']] += 1
            r = la_ma(x['bac'], x['q'])
            T['bac'][r] += 1
            bai_co[thu]['bac:' + r].add(ten)
            dai = x['b'] - x['a']
            T['phach'][r] += dai
            m = x['mau']
            third = 3 if x['q'] in ('m', 'dim') else 4
            T['co_mau'][r] += 1
            for ten_m, pc in (('b7', 10), ('7', 11), ('9', 2), ('11', 5), ('6', 9), ('b9', 1), ('b13', 8), ('#11', 6)):
                if pc in m and not (ten_m == '11' and x['q'].startswith('sus')) and not (ten_m == '#11' and x['q'] == 'dim') \
                        and not (ten_m == 'b13' and x['q'] == 'aug'):
                    T['mau:' + ten_m][r] += 1
                    bai_co[thu][f'mau:{r}:{ten_m}'].add(ten)
            if not m & {10, 11, 2, 5, 9, 1, 8}:
                T['tron'][r] += 1
            if x['bass_bac'] != 0:
                T['dao'][r] += 1
                T['dao_bass'][f'{r}/{S.TEN_BAC[x["bass_bac"]]}'] += 1
                bai_co[thu][f'dao:{r}/{S.TEN_BAC[x["bass_bac"]]}'].add(ten)
            if meta['barlens']:
                if x['o'] is not None:
                    key = (x['doan'], int((x['o'][0] - S.LUOI[s['name']][1]) // 6))   # o 12/8
                else:
                    ks = [b for b, st in meta['bar_start'].items() if st <= x['a'] + EPS]
                    key = (x['doan'], ks[-1] if ks else 0)
                o_of[key].append(x)
        # hop am chen trong o
        for key, xs in o_of.items():
            T['o']['tong'] += 1
            goc_khac = [x for i, x in enumerate(xs) if i == 0 or x['goc'] != xs[i - 1]['goc']]
            if len(goc_khac) >= 2:
                T['o']['chia'] += 1
                for i in range(1, len(goc_khac)):
                    x, truoc = goc_khac[i], goc_khac[i - 1]
                    rel = (x['goc'] - truoc['goc']) % 12
                    sau = [y for y in segs if y['a'] >= x['b'] - EPS]
                    toi = sau[0] if sau else None
                    vai = 'chen'
                    if toi and (x['goc'] - toi['goc']) % 12 == 7 and x['q'] == 'M':
                        vai = 'at phu (V/x ve hop am sau)' if x['bac'] != 7 else 'V ve I'
                    elif x['q'] == 'dim':
                        vai = 'giam'
                    T['chen'][f'{la_ma(truoc["bac"], truoc["q"])}>{la_ma(x["bac"], x["q"])} · {vai}'] += 1
                    bai_co[thu]['chen:' + vai].add(ten)
        # chuyen tiep
        for x, y in zip(segs, segs[1:]):
            r1, r2 = la_ma(x['bac'], x['q']), la_ma(y['bac'], y['q'])
            if r1 != r2:
                T['chuyen'][f'{r1}>{r2}'] += 1
                bai_co[thu][f'chuyen:{r1}>{r2}'].add(ten)
    return tong, bai_co, nguon


def in_do():
    tong, bai_co, nguon = do()
    print('nguon hop am:', dict(nguon))
    for thu in (False, True):
        T = tong[thu]
        print(f"\n=========== {'THU' if thu else 'TRUONG'}")
        bac = T['bac']
        print('bac (so doan · so bai):', ' · '.join(f"{r} {n}·{len(bai_co[thu]['bac:' + r])}b" for r, n in bac.most_common()))
        print('o chia:', dict(T['o']))
        print('chen:', ' · '.join(f"{k} {n}" for k, n in T['chen'].most_common(12)))
        for r, n in bac.most_common(10):
            mm = ' '.join(f"{m}={T['mau:' + m][r]}" for m in ('b7', '7', '9', '11', '6', 'b9', 'b13', '#11') if T['mau:' + m][r])
            print(f"  {r:6s} n={n:3d} tron={T['tron'][r]:3d} dao={T['dao'][r]:3d}  mau: {mm}")
        print('dao bass:', ' · '.join(f"{k} {n}" for k, n in T['dao_bass'].most_common(10)))
        print('chuyen:', ' · '.join(f"{k} {n}({len(bai_co[thu]['chuyen:' + k])}b)" for k, n in T['chuyen'].most_common(16)))


if __name__ == '__main__':
    if '--json' in sys.argv:
        tong, bai_co, nguon = do()
        print(json.dumps({('thu' if k else 'truong'): {a: dict(b) for a, b in v.items()} for k, v in tong.items()},
                         ensure_ascii=False))
    else:
        in_do()
