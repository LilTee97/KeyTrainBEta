# -*- coding: utf-8 -*-
"""VI SAO Linh Nhi dat hop am ay — do tren phan hat 8 ban ky am (4/10/2026, md Linh Nhi muc 13k).

    python tools/ly_do_hop_am_linh_nhi.py           # in so do
    python tools/ly_do_hop_am_linh_nhi.py --kiem    # tu kiem cac so ghi trong src/thay/soanCau/giaiThich.ts

Doan hop am lay tu hop_am_linh_nhi.doan_hat (bolero theo ky hieu duoc tay trai ung ho; slow rock doc tu tay trai).
  * GIAI DIEU = not CAO NHAT tay phai moi moc go. Kiem o Bien Tinh (sheet duy nhat co loi): 66/70 not mang loi la not ay.
  * NOT DEM = tay trai + not duoi dinh tay phai, BO not tay phai cung ten voi not dinh (nhan quang tam giai dieu — bay
    do cu: tinh ca not nhan quang tam thi "mau" chi la giai dieu danh hai lan).
  * Mot not MAU "co" trong doan khi chiem >= 8% thoi luong not dem (nhu ham mau cua hop_am_linh_nhi).
Ly do cua tung not mau, xet theo thu tu:
  giu   — cung cao do ay vang o PHACH CUOI hop am truoc VA phach dau hop am nay (mang qua cho doi hop am)
  gd    — giai dieu dung tren dung ten not ay (>= 25% thoi luong giai dieu, hoac not giai dieu dau doan)
  luot  — not ay chi o tay trai, ngan (<= 0,5 phach), hai not tay trai ke no cach <= 2 nua cung
  ngang — not ay di lien bac (<= 2 nua cung) vao hop am sau
  them  — khong thuoc bon loi tren
"""
from __future__ import annotations

import collections
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hop_am_linh_nhi as H  # noqa: E402

S = H.S
EPS = 1e-6
TEN_MAU = {10: 'b7', 11: '7', 2: '9', 5: '11', 9: '6', 1: 'b9', 8: 'b13', 6: '#11'}
BAC = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7']
# Cho may doc SAI hop am I trong bai thu — soat tay tung not 4/10/2026 (in_o), bo khoi "I7 -> iv":
#   Rung La o16: tay trai Si2 Mi3, giai dieu Si3 Re4 — khong phai hop am La.
#   Rung La o45: tay trai La2 Si2 Mi2 La3 Mi3 Sol3 Do4 — Am7 (Do TU NHIEN), khong phai La truong.
#   La Thu o8:  giai dieu Fa#4 nhung tay trai Fa3 tu nhien, va di toi bVII chu khong toi iv.
DOC_SAI_I7 = {('Rừng Lá Thấp', 16), ('Rừng Lá Thấp', 45), ('Lá Thư Trần Thế', 8)}
# Hop am SAU I7 may doc "Isus", soat tay la iv (Sol thu): o 47 -> phach 4 tay trai Sol2 Re3 Sol3 Sib3; o 93 -> o 94 nhu vay.
SAU_LA_IV = {('Lá Thư Trần Thế', 47), ('Lá Thư Trần Thế', 93)}


def giai_dieu(ns, a, b):
    moc = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 1 and n['dur'] > EPS and n['beat'] < b - EPS and n['beat'] + n['dur'] > a + EPS:
            moc[round(n['beat'], 3)].append(n)
    ra = []
    for at in sorted(moc):
        top = max(moc[at], key=lambda n: n['midi'])
        d = min(top['beat'] + top['dur'], b) - max(top['beat'], a)
        if d > EPS:
            ra.append((top['midi'], d))
    return ra


def not_dem(ns, a, b):
    moc = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 1 and n['dur'] > EPS and n['beat'] < b - EPS and n['beat'] + n['dur'] > a + EPS:
            moc[round(n['beat'], 3)].append(n)
    ra = []
    for v in moc.values():
        top = max(v, key=lambda n: n['midi'])
        for n in v:
            if n is top or (top['midi'] - n['midi']) % 12 == 0:
                continue
            d = min(n['beat'] + n['dur'], b) - max(n['beat'], a)
            if d > EPS:
                ra.append((n, d))
    return ra + H.not_vang(ns, a, b, 2)


def kiem_loi_bien_tinh():
    """Not mang loi co phai not cao nhat tay phai o moc ay — (dung, tong)."""
    path = os.path.join(S.BRAIN, 'video', 'Linh_Nhi', 'bien-tinh-linh-nhi-piano.mxl')
    z = zipfile.ZipFile(path)
    ten = [x for x in z.namelist() if x.endswith(('.xml', '.musicxml')) and not x.startswith('META')][0]
    root = ET.fromstring(z.read(ten))
    step = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    notes, cursor, div = [], 0.0, 1
    for m in root.find('part').findall('measure'):
        at, last, dai = cursor, cursor, 0.0
        for el in m:
            if el.tag == 'attributes' and el.findtext('divisions'):
                div = int(el.findtext('divisions'))
            elif el.tag == 'backup':
                at -= float(el.findtext('duration')) / div
            elif el.tag == 'forward':
                at += float(el.findtext('duration')) / div
                dai = max(dai, at - cursor)
            elif el.tag == 'note' and el.find('grace') is None:
                d = float(el.findtext('duration') or 0) / div
                on = last if el.find('chord') is not None else at
                p = el.find('pitch')
                if p is not None:
                    notes.append(dict(on=on, dur=d, staff=el.findtext('staff') or '1', loi=bool(el.findall('lyric')),
                                      midi=12 * (int(p.findtext('octave')) + 1) + step[p.findtext('step')] + int(float(p.findtext('alter') or 0))))
                if el.find('chord') is None:
                    last, at = at, at + d
                    dai = max(dai, at - cursor)
        cursor += dai
    loi = [n for n in notes if n['loi']]
    dung = sum(1 for n in loi if n['midi'] >= max(x['midi'] for x in notes
                                                 if x['staff'] == n['staff'] and x['on'] <= n['on'] + EPS < x['on'] + x['dur'] - EPS))
    return dung, len(loi)


def do():
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    mau = collections.defaultdict(collections.Counter)      # (giong, la ma, mau) -> dem
    huong = collections.defaultdict(collections.Counter)    # (giong, la ma, mau) -> huong not mau vao hop am sau
    bac_n = collections.Counter()
    hoa = collections.defaultdict(collections.Counter)      # not hoa cua V (thu), II (truong): o dau
    i7 = []                                                 # I truong trong bai thu: (bai, o, giai dieu hat b3?, hop am sau)
    rai = collections.defaultdict(collections.Counter)      # buoc 8 -> 9 tay trai
    for s in corp['songs']:
        if s.get('teacher') != 'linh-nhi':
            continue
        chu, thu, meta, segs = H.doan_hat(s)
        ns, _, _ = S.doc(s)
        ten = S.TEN_DEP.get(s['name'], s['name'])
        g_ = 'thu' if thu else 'truong'
        o_cua = lambda t: max((b for b, st in meta['bar_start'].items() if st <= t + EPS), default=0)  # noqa: E731
        for i, x in enumerate(segs):
            r = H.la_ma(x['bac'], x['q'])
            bac_n[(g_, r)] += 1
            truoc = segs[i - 1] if i and segs[i - 1]['b'] >= x['a'] - 0.01 else None
            sau = segs[i + 1] if i + 1 < len(segs) and segs[i + 1]['a'] <= x['b'] + 0.01 else None
            gd = giai_dieu(ns, x['a'], x['b'])
            tong_g = sum(d for _, d in gd) or 1
            w_gd = collections.Counter()
            for m, d in gd:
                w_gd[(m - x['goc']) % 12] += d
            dm = not_dem(ns, x['a'], x['b'])
            tong_d = sum(d for _, d in dm) or 1
            w_d = collections.Counter()
            for n, d in dm:
                w_d[(n['midi'] - x['goc']) % 12] += d
            trai = sorted((n for n in ns if n['hand'] == 2 and x['a'] - EPS <= n['beat'] < x['b'] - EPS and n['dur'] > EPS),
                          key=lambda n: (n['beat'], n['midi']))
            vs = {n['midi'] for n, d in H.not_vang(ns, sau['a'], min(sau['b'], sau['a'] + 1.0))} if sau else set()
            r_sau = H.la_ma(sau['bac'], sau['q']) if sau else '-'
            for iv, w in w_d.items():
                if iv not in TEN_MAU or w < 0.08 * tong_d or (iv == 5 and x['q'].startswith('sus')) \
                        or (iv == 6 and x['q'] == 'dim') or (iv == 8 and x['q'] == 'aug'):
                    continue
                k = (g_, r, TEN_MAU[iv])
                cao = sorted({n['midi'] for n, d in dm if (n['midi'] - x['goc']) % 12 == iv})
                cuoi = {n['midi'] for n, d in H.not_vang(ns, max(truoc['a'], truoc['b'] - 1.0), truoc['b'])} if truoc else set()
                dau = {n['midi'] for n, d in H.not_vang(ns, x['a'], min(x['b'], x['a'] + 1.0))}
                giu = any(c in cuoi and c in dau for c in cao)
                tren_gd = w_gd[iv] / tong_g >= 0.25 or bool(gd and (gd[0][0] - x['goc']) % 12 == iv)
                luot = any(n['midi'] in cao and n['dur'] <= 0.5 + EPS and 0 < j < len(trai) - 1
                           and abs(trai[j - 1]['midi'] - n['midi']) <= 2 and abs(trai[j + 1]['midi'] - n['midi']) <= 2
                           for j, n in enumerate(trai))
                ngang = sau is not None and not any(c in vs for c in cao) and any(c + d in vs for c in cao for d in (-2, -1, 1, 2))
                ly = 'giu' if giu else 'gd' if tren_gd else 'luot' if luot else 'ngang' if ngang else 'them'
                mau[k]['n'] += 1
                mau[k][ly] += 1
                mau[k]['bai:' + ten] += 1
                mau[k]['truoc:' + (H.la_ma(truoc['bac'], truoc['q']) if truoc else '-')] += 1
                mau[k]['bac_giong:' + BAC[(x['goc'] + iv - chu) % 12]] += 1
                if sau:
                    hg = 'giu' if any(c in vs for c in cao) else 'xuong1' if any(c - 1 in vs for c in cao) else \
                        'xuong2' if any(c - 2 in vs for c in cao) else 'len1' if any(c + 1 in vs for c in cao) else \
                        'len2' if any(c + 2 in vs for c in cao) else 'bo'
                    huong[k][hg] += 1
                    huong[k]['sau:' + r_sau] += 1
                    huong[k]['n'] += 1
            # not hoa: V cua bai thu (bac 7 thang), II cua bai truong (bac 4 thang)
            for kk, hoa_pc, gam_pc in ((('thu', 'V'), 11, 10), (('truong', 'II'), 6, 5)):
                if (g_, r) != kk:
                    continue
                o_gd = any((m - chu) % 12 == hoa_pc for m, d in gd)
                o_dem = any((n['midi'] - chu) % 12 == hoa_pc for n, d in dm)
                hoa[kk]['n'] += 1
                hoa[kk]['gd' if o_gd else 'chi_dem' if o_dem else 'khong'] += 1
                hoa[kk]['sau:' + r_sau] += 1
                hoa[kk]['bai:' + ten] += 1
            if thu and r == 'I':
                hat_b3 = any((m - chu) % 12 == 3 for m, d in gd)
                ba_o_bass = bool(trai) and (min(trai, key=lambda n: (n['beat'], n['midi']))['midi'] - chu) % 12 == 4
                i7.append((ten, o_cua(x['a']), hat_b3, r_sau, ba_o_bass))
            # buoc 8 -> 9 o tay trai tren i, iv (thu) va I (truong)
            if r in (('i', 'iv') if thu else ('I',)):
                chin = [n for n in trai if (n['midi'] - x['goc']) % 12 == 2]
                if chin:
                    moc = collections.OrderedDict()
                    for n in trai:
                        moc.setdefault(round(n['beat'], 2), []).append(n['midi'])
                    ds = list(moc.values())
                    buoc = any(any((m - x['goc']) % 12 == 2 and m - 2 in ds[k - 1] for m in ds[k]) for k in range(1, len(ds)))
                    rai[(g_, r)]['co9'] += 1
                    rai[(g_, r)]['8>9'] += buoc
                    if buoc:
                        rai[(g_, r)]['bai:' + ten] += 1
    return dict(mau=mau, huong=huong, bac_n=bac_n, hoa=hoa, i7=i7, rai=rai)


def so_bai(c):
    return sum(1 for k in c if k.startswith('bai:'))


def in_do(d):
    print('Bien Tinh — not mang loi la not cao nhat tay phai: %d/%d' % kiem_loi_bien_tinh())
    for k in sorted(d['mau'], key=lambda k: (k[0], k[1], -d['mau'][k]['n'])):
        c = d['mau'][k]
        if c['n'] < 5:
            continue
        hg = d['huong'][k]
        print(f"{k[0]:6s} {k[1]:5s} {k[2]:4s} {c['n']:3d}/{d['bac_n'][k[:2]]:3d} {so_bai(c)}b | giu {c['giu']} gd {c['gd']} luot {c['luot']}"
              f" ngang {c['ngang']} them {c['them']} | bac giong {[(z[9:], v) for z, v in c.most_common() if z.startswith('bac_giong:')][:2]}"
              f" | truoc {[(z[6:], v) for z, v in c.most_common() if z.startswith('truoc:')][:3]}"
              f" | huong {dict((z, v) for z, v in hg.items() if not z.startswith('sau:'))}")
    for k, c in d['hoa'].items():
        print('not hoa', k, dict(c))
    print('I trong bai thu:', d['i7'])
    for k, c in d['rai'].items():
        print('rai tay trai', k, dict(c))


def kiem(d):
    """Cac so ghi trong src/thay/soanCau/giaiThich.ts — doi so do thi sua ca hai noi."""
    assert kiem_loi_bien_tinh() == (66, 70)
    m, hg = d['mau'], d['huong']
    vi = m[('thu', 'bVI', '7')]
    assert (vi['n'], so_bai(vi), vi['truoc:i'], vi['giu'], vi['gd'], vi['bac_giong:5']) == (21, 3, 15, 9, 5, 21), dict(vi)
    iv9 = m[('thu', 'iv', '9')]
    assert (iv9['n'], iv9['bac_giong:5']) == (22, 22), dict(iv9)
    v7 = m[('thu', 'V', 'b7')]
    assert (v7['n'], v7['them'], hg[('thu', 'V', 'b7')]['xuong1'] + hg[('thu', 'V', 'b7')]['xuong2'], hg[('thu', 'V', 'b7')]['n']) == (17, 10, 0, 16), \
        (dict(v7), dict(hg[('thu', 'V', 'b7')]))
    imaj = hg[('truong', 'I', '7')]
    assert (imaj['n'], imaj['xuong2'], imaj['sau:vi']) == (13, 12, 11), dict(imaj)
    V = d['hoa'][('thu', 'V')]
    assert (V['n'], so_bai(V), V['gd'], V['chi_dem'], V['khong']) == (24, 5, 8, 10, 6), dict(V)
    II = d['hoa'][('truong', 'II')]
    assert (II['n'], so_bai(II), II['gd'] + II['chi_dem'], II['sau:V'], II['sau:I']) == (10, 3, 5, 3, 4), dict(II)
    b7 = m[('truong', 'II', 'b7')]
    assert b7['n'] == 9, dict(b7)
    sach = [x for x in d['i7'] if (x[0], x[1]) not in DOC_SAI_I7]
    vao_iv = sum(x[3] == 'iv' or (x[0], x[1]) in SAU_LA_IV for x in sach)
    assert (len(sach), len({x[0] for x in sach}), sum(x[2] for x in sach), vao_iv, sum(x[4] for x in sach)) == (7, 3, 0, 7, 1), sach
    ri, rv = d['rai'][('thu', 'i')], d['rai'][('thu', 'iv')]
    assert (ri['co9'], ri['8>9'], so_bai(ri), rv['co9'], rv['8>9'], so_bai(rv)) == (36, 15, 4, 22, 11, 2), (dict(ri), dict(rv))
    print('kiem: dung het')


if __name__ == '__main__':
    d = do()
    if '--kiem' in sys.argv:
        kiem(d)
    else:
        in_do(d)
