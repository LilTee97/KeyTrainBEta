# -*- coding: utf-8 -*-
"""MẸO CHUNG giữa các thầy — số đo cho bảng mẹo của "Đố tái hòa âm" (11/10/2026).

    PYTHONIOENCODING=utf-8 python tools/meo_chung_thay.py

Đo PHẦN HÁT (verse/chorus/prechorus) của Cà Pháo và Linh Nhi trong kho PianoBrain. Hợp âm mỗi đoạn: `hop_am_linh_nhi.doan_hat`;
màu: nốt đệm (tay trái + nốt dưới giai điệu tay phải) vang ≥ 8 % thời lượng hợp âm, như `tach_lua_chon.doan_cua_bai`. Hợp âm liền
nhau cùng gốc + loại gộp làm một (màu = hợp các màu). Cách đếm này khác cách đếm "đoạn" trong lời thầy — không so hai loại số.
Blues không có trong kho này (số Blues lấy từ md Blues).
Mỗi dòng in ra ứng với một con số trong `MEO_CHUNG` (src/thay/soanCau/doTaiHoaAm.ts).
"""
from __future__ import annotations

import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hop_am_linh_nhi as H  # noqa: E402
import ly_do_hop_am_linh_nhi as L  # noqa: E402
import slow_rock_linh_nhi as S  # noqa: E402
import tach_lua_chon as T  # noqa: E402


def hop_cua_bai(song):
    """(thứ?, [đoạn: [hợp âm đã gộp]]) — hợp âm: dict(bac, tri, mau, bass, bass_cuoi)."""
    if not song.get('giong') and song['name'] in T.GIONG_SUY:
        song = dict(song, giong=T.GIONG_SUY[song['name']])
    chu, thu, _meta, segs = H.doan_hat(song)
    ns, _, _ = S.doc(song)
    doan = collections.OrderedDict()
    for x in segs:
        dm = L.not_dem(ns, x['a'], x['b'])
        tong = sum(d for _, d in dm) or 1
        w = collections.Counter()
        for n, d in dm:
            w[(n['midi'] - x['goc']) % 12] += d
        mau = {T.MAU_IV[iv] for iv, v in w.items() if iv in T.MAU_IV and v >= 0.08 * tong}
        if x['q'] == 'dim':
            mau.discard('#11')
        doan.setdefault(x['doan'], []).append(dict(bac=x['bac'], tri=T.TRI.get(x['q'], x['q']), mau=mau, bass=(x['bass'] - chu) % 12))
    ra = []
    for ds in doan.values():
        g = []
        for h in ds:
            if g and (g[-1]['bac'], g[-1]['tri']) == (h['bac'], h['tri']):
                g[-1]['mau'] |= h['mau']
                g[-1]['bass_cuoi'] = h['bass']
            else:
                g.append(dict(h, mau=set(h['mau']), bass_cuoi=h['bass']))
        ra.append(g)
    return thu, ra


def doc_kho():
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    data = {}
    for s in corp['songs']:
        t = s.get('teacher')
        if t not in ('ca-phao', 'linh-nhi') or not any(k.startswith(H.HAT) for k in s['sections']):
            continue
        if not s.get('giong') and s['name'] not in T.GIONG_SUY:
            continue
        data.setdefault(t, []).append(hop_cua_bai(s))
    return data


def cap(bai):
    """(thứ?, hợp âm, hợp âm sau trong cùng đoạn | None)."""
    for thu, doan in bai:
        for g in doan:
            for i, h in enumerate(g):
                yield thu, h, (g[i + 1] if i + 1 < len(g) else None)


def ti(a, b):
    return f'{a}/{b}'


def la(h):
    return T.la_ma(h['bac'], h['tri'])


def do(data):
    for t, bai in data.items():
        ds = list(cap(bai))
        print(f'\n== {t}: {len(bai)} bài, {len(ds)} hợp âm (đã gộp)')
        hs = [h for th, h, _ in ds if not th and h['bac'] == 0 and h['tri'] == 'M']
        print('nha     I có 9 · maj7 · 6:', ti(sum(1 for h in hs if h['mau'] & {'9', 'maj7', '6'}), len(hs)), '| I có ♭7:', ti(sum('7' in h['mau'] for h in hs), len(hs)))
        hs = [h for th, h, _ in ds if th and h['bac'] == 0 and h['tri'] == 'm']
        print('nha     i có 9 · 7:', ti(sum(1 for h in hs if h['mau'] & {'9', '7'}), len(hs)))
        for thu in (False, True):
            c = collections.Counter(la(h) for th, h, s in ds if th == thu and s and s['bac'] == 7 and s['tri'] in ('M', 'sus') and h['bac'] != 7)
            chuan = ('ii', 'IV', 'II') if not thu else ('iv', 'ii°', 'II')
            print('truoc-v', 'thứ' if thu else 'trưởng', 'hợp âm trước V là', '·'.join(chuan) + ':', ti(sum(c[k] for k in chuan), sum(c.values())))
        hs = [h for th, h, s in ds if not th and s and s['bac'] == 7 and s['tri'] in ('M', 'sus') and la(h) == 'ii']
        print('truoc-v ii trước V có ♭7:', ti(sum('7' in h['mau'] for h in hs), len(hs)))
        hs = [h for th, h, s in ds if th and s and s['bac'] == 7 and s['tri'] in ('M', 'sus') and la(h) == 'ii°']
        print('truoc-v ii° trước V có ♭7:', ti(sum('7' in h['mau'] for h in hs), len(hs)))
        for thu in (False, True):
            hs = [h for th, h, _ in ds if th == thu and h['bac'] == 7 and h['tri'] in ('M', 'sus')]
            print('v-cang  V', 'thứ' if thu else 'trưởng', 'có 9 · 13:', ti(sum(1 for h in hs if h['mau'] & {'9', '6'}), len(hs)),
                  '| có ♭9 · ♭13:', ti(sum(1 for h in hs if h['mau'] & {'b9', 'b13'}), len(hs)), '| có ♭7:', ti(sum('7' in h['mau'] for h in hs), len(hs)),
                  '| có 13:', ti(sum('6' in h['mau'] for h in hs), len(hs)))
        c = collections.Counter(f'{la(h)}7 → {la(s)}' for _, h, s in ds
                                if s and h['tri'] == 'M' and '7' in h['mau'] and (s['bac'] - h['bac']) % 12 == 5 and not (h['bac'] == 7 and s['bac'] == 0))
        print('at-phu  át phụ (trừ V → I):', sum(c.values()), dict(c.most_common(6)))
        d = collections.Counter()
        for _, h, s in ds:
            if s:
                k = min((s['bass'] - h['bass_cuoi']) % 12, (h['bass_cuoi'] - s['bass']) % 12)
                d['nhảy' if k > 2 else 'liền bậc' if k else 'đứng yên'] += 1
        print('bass-buoc bass nhảy ở chỗ đổi hợp âm:', ti(d['nhảy'], sum(d.values())))
        mj = [(th, h) for th, h, _ in ds if h['tri'] == 'M' and 'maj7' in h['mau']]
        print('maj7    maj7 ở I · IV (trưởng) / ♭III · ♭VI (thứ):', ti(sum(1 for th, h in mj if h['bac'] in ((3, 8) if th else (0, 5))), len(mj)), '| trên V:', sum(1 for _, h in mj if h['bac'] == 7))
        hs = [h for th, h, _ in ds if th and h['bac'] == 8 and h['tri'] == 'M']
        print('maj7    ♭VI có maj7:', ti(sum('maj7' in h['mau'] for h in hs), len(hs)))
        s11 = [(th, h) for th, h, _ in ds if '#11' in h['mau']]
        print('maj7    ♯11 ở ♭VI bài thứ:', ti(sum(1 for th, h in s11 if th and h['bac'] == 8 and h['tri'] == 'M'), len(s11)))
        g = collections.Counter((s['bac'] - h['bac']) % 12 for _, h, s in ds if s and h['tri'] == 'dim')
        print('giam    hợp âm giảm → hợp âm sau, cách (nửa cung):', dict(g.most_common()), 'trên', sum(g.values()))
        hs = [h for _, h, _ in ds if h['tri'] == 'm']
        print('thay    hợp âm thứ có ♭7:', ti(sum('7' in h['mau'] for h in hs), len(hs)))
        for b, ten in ((2, 'ii'), (5, 'IV'), (9, 'vi'), (4, 'iii')):
            tri = 'M' if b == 5 else 'm'
            hs = [h for th, h, _ in ds if not th and h['bac'] == b and h['tri'] == tri]
            print(f'not-nha {ten} (bài trưởng) màu:', dict(collections.Counter(m for h in hs for m in h['mau']).most_common(4)), 'trên', len(hs))
        for b, ten in ((8, '♭VI'), (10, '♭VII')):
            hs = [h for th, h, _ in ds if th and h['bac'] == b and h['tri'] == 'M']
            print(f'not-nha {ten} (bài thứ) màu:', dict(collections.Counter(m for h in hs for m in h['mau']).most_common(4)), 'trên', len(hs))


if __name__ == '__main__':
    do(doc_kho())
