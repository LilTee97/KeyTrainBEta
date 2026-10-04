# -*- coding: utf-8 -*-
"""Du lieu tab HOC CACH SOAN CAU cua Linh Nhi (GD 3, 4/10/2026) — xuat tu chinh cac bo do da co, khong do lai cach khac.

    python -B tools/soan_cau_linh_nhi.py          # in tom tat + kiem khop so cu
    python -B tools/soan_cau_linh_nhi.py --ghi    # ghi src/thay/soanCau/linhNhi.json

1. hopAm — chi DAT HOP AM o phan hat (tools/hop_am_linh_nhi.py, 8 bai: 3 truong, 5 thu): moi bac bao nhieu doan, bao nhieu bai,
   tron bao nhieu, co mau gi (dem "co not mau", mot hop am co the mang hai mau); buoc chuyen bac -> bac kem so bai; o co hai hop am.
2. not — chi DANH NOT GI tren tung loai hop am o doan solo (cung du lieu tools/quy_luat_not_linh_nhi.py: 23 doan, 8 bai): not cao
   nhat moi cu go tay phai, bac so voi GOC hop am dang vang, tach dieu (slow rock / bolero) · giong · nhom hop am · phach manh / nhe.
   Kiem: ti le not hop am tinh lai tu bang nay phai khop so cu (md 13e: slow rock thu 83 % · 85 %).
3. vong — vong 4 o THAT tu doan solo: o 1-4, 5-8 (bo o lay da khong co hop am), moi o dung mot hop am, >= 3 hop am khac nhau; bo trung.
   Slow rock xep truoc: backing tap solo cua chi la dieu Slow Rock La thu.
"""
from __future__ import annotations

import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hop_am_linh_nhi as H  # noqa: E402
import slow_rock_linh_nhi as S  # noqa: E402
from quy_luat_not_linh_nhi import hop_luc  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'thay', 'soanCau', 'linhNhi.json')
CHAT = {'': '', 'm': 'm', '7': '7', 'm7': 'm7', 'maj7': 'maj7', 'dim': 'dim', 'm7b5': 'm7b5', 'sus4': 'sus4', 'aug': 'aug'}
DOAN_VN = {'intro': 'dạo', 'interlude': 'giang', 'outro': 'kết'}


def doc_la_ma(r):
    """'bVI' -> (8, ''), 'iv' -> (5, 'm'), 'ii°' -> (2, 'dim'), 'Isus' -> (0, 'sus4'), 'V+' -> (7, 'aug')."""
    chat = ''
    if r.endswith('°'):
        r, chat = r[:-1], 'dim'
    elif r.endswith('+'):
        r, chat = r[:-1], 'aug'
    elif r.endswith('sus'):
        r, chat = r[:-3], 'sus4'
    dau = r[0] if r[0] in 'b#' else ''
    than = r[len(dau):]
    if not chat and than != than.upper():
        chat = 'm'
    return S.LA_MA.index(dau + than.upper()), chat


def hop_am():
    tong, bai_co, _ = H.do()
    ra = {}
    for thu in (False, True):
        T, B = tong[thu], bai_co[thu]
        bac = {}
        for r, n in T['bac'].most_common():
            goc, chat = doc_la_ma(r)
            mau = {m: T['mau:' + m][r] for m in ('b7', '7', '9', '11', '6', 'b9', 'b13', '#11') if T['mau:' + m][r]}
            bac[r] = dict(goc=goc, chat=chat, n=n, bai=len(B['bac:' + r]), tron=T['tron'][r], dao=T['dao'][r], mau=mau)
        chuyen = [[k.split('>')[0], k.split('>')[1], n, len(B['chuyen:' + k])] for k, n in T['chuyen'].most_common()]
        ra['thu' if thu else 'truong'] = dict(bac=bac, chuyen=chuyen, o=dict(T['o']))
    return ra


def not_solo(ds):
    D = collections.defaultdict(lambda: collections.defaultdict(lambda: {'manh': collections.Counter(), 'nhe': collections.Counter()}))
    bai = collections.defaultdict(set)
    doan = collections.Counter()
    kiem = collections.defaultdict(collections.Counter)
    for x in ds:
        dieu = 'slow rock' if x['song']['name'] in S.LUOI else 'bolero'
        k = f"{dieu}|{'thu' if x['thu'] else 'truong'}"
        manh = (0.0, 1.5) if dieu == 'slow rock' else (0.0, 1.0, 2.0, 3.0)
        doan[k] += 1
        bai[k].add(x['song']['name'])
        for o in x['o']:
            for p, d, ps in o['r']:
                h = hop_luc(o, p)
                if h is None:
                    continue
                nhom = S.nhom_hau(h[2])
                rel = ((ps[-1] % 12 - x['chu']) - h[1]) % 12
                phach = 'manh' if any(abs(p - m) < 1e-6 for m in manh) else 'nhe'
                D[k][nhom][phach][rel] += 1
                kiem[k][phach + '_n'] += 1
                kiem[k][phach + '_hop_am'] += rel in S.TAP_CHAT.get(nhom, (0, 4, 7))
    ra = {}
    for k in sorted(D):
        ra[k] = dict(doan=doan[k], bai=len(bai[k]), nhom={
            nhom: {ph: {str(r): n for r, n in sorted(c.items())} for ph, c in v.items()} for nhom, v in sorted(D[k].items())})
    return ra, kiem


def vong(ds):
    ra, da_co = [], set()
    for x in ds:
        dieu = 'slow rock' if x['song']['name'] in S.LUOI else 'bolero'
        o = x['o']
        dau = 1 if o and not o[0]['h'] else 0
        for a in range(dau, len(o) - 3, 4):
            cua = o[a:a + 4]
            if any(len(c['h']) != 1 for c in cua):
                continue
            hop = [(c['h'][0][1] % 12, CHAT[S.nhom_hau(c['h'][0][2])]) for c in cua]
            if len(set(hop)) < 3:
                continue
            khoa = (x['thu'], tuple(hop))
            if khoa in da_co:
                continue
            da_co.add(khoa)
            ten = S.TEN_DEP.get(x['song']['name'], x['song']['name'])
            ra.append(dict(id=f"{x['song']['name'][:6].lower().replace(' ', '')}-{x['doan']}-{a + 1}",
                           ten=f"{ten} · {DOAN_VN[x['doan']]} ô {a + 1}–{a + 4}", dieu=dieu, thu=x['thu'],
                           hopAm=[dict(goc=g, chat=c) for g, c in hop]))
    return sorted(ra, key=lambda v: v['dieu'] != 'slow rock')


def main():
    ds = S.tat_ca()
    du_lieu = dict(
        nguon=dict(hopAm='tools/hop_am_linh_nhi.py — phần hát 8 bài (3 trưởng, 5 thứ)',
                   not_='tools/quy_luat_not_linh_nhi.py — 23 đoạn solo, 8 bài', script='tools/soan_cau_linh_nhi.py'),
        hopAm=hop_am(), not_=None, vong=vong(ds))
    du_lieu['not_'], kiem = not_solo(ds)
    for k, c in sorted(kiem.items()):
        print(f"{k:18} nốt hợp âm: mạnh {c['manh_hop_am']}/{c['manh_n']} ({100 * c['manh_hop_am'] / max(1, c['manh_n']):.0f}%) · "
              f"nhẹ {c['nhe_hop_am']}/{c['nhe_n']} ({100 * c['nhe_hop_am'] / max(1, c['nhe_n']):.0f}%)")
    sr = kiem['slow rock|thu']
    assert (sr['manh_hop_am'], sr['manh_n'], sr['nhe_hop_am'], sr['nhe_n']) == (67, 81, 165, 194), 'lệch số md 13e'
    for k, v in du_lieu['not_'].items():
        print(f"  {k}: {v['doan']} đoạn · {v['bai']} bài ·",
              ' · '.join(f"{nh or 'trưởng'} {sum(sum(p.values()) for p in c.values())}" for nh, c in v['nhom'].items()))
    for v in du_lieu['vong']:
        print(f"  vòng {'thứ ' if v['thu'] else 'trưởng'} {v['dieu']:9} {v['ten']:34} {[(h['goc'], h['chat']) for h in v['hopAm']]}")
    if '--ghi' in sys.argv:
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(du_lieu, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print('đã ghi', os.path.normpath(OUT))


if __name__ == '__main__':
    main()
