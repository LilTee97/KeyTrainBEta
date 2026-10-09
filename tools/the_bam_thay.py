"""Thế bấm hợp âm của từng thầy — đo trên sheet: tay trái, tay phải, thế đảo / slash chord, chuyển hợp âm.

Người dùng 9/10/2026: "Hãy phân tích cách các thầy xếp ngón khi bấm các hợp âm và khi chuyển hợp âm thì từng thầy đã xếp ngón thế nào …
Nhớ phân tích luôn cách các thầy dùng các thế đảo và slash chord hoặc bất cứ kỹ thuật bấm hợp âm nào". Sheet KHÔNG ghi số ngón (0 dấu
<fingering> trong 21 sheet Cà Pháo · Linh Nhi · Blues) — nên đo THẾ BẤM (nốt nào, tay nào); số ngón ở KeyTrain là Claude gợi ý.

Khung khúc hợp âm: Linh Nhi, Cà Pháo — `hop_am_linh_nhi.doan_hat` (phần hát, bỏ `_mod`); Blues — ký hiệu in (`phan_tich_blues_ba_sheet.nhan`).
Trong mỗi khúc: tay trái = các cú bắt đầu trong khúc (bass = nốt thấp nhất của cú đầu → bậc của bass so với gốc = thế đảo / slash);
tay phải = các cụm ≥ 3 nốt cùng lúc; CỤM TIÊU BIỂU = cụm nhiều nốt thuộc hợp âm nhất (cụm đầu có khi là nốt giai điệu lướt — vd Người
Hãy Quên Em Đi ô ♭III cụm đầu C–F♯–G). Chuyển hợp âm: cụm cuối khúc trước → cụm đầu khúc sau (cùng đoạn, liền nhau).
Đoạn để ĐÁNH THEO chỉ lấy khúc có ký hiệu in được tay trái xác nhận, tay trái và cụm tay phải đều sạch (xem `sach`, `lh_sach`).

    python tools/the_bam_thay.py          # ghi src/thay/soanCau/theBamThay.json
    python tools/the_bam_thay.py --kiem   # tự kiểm
"""
import collections
import json
import os
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS)
sys.path.insert(0, os.path.join(TOOLS, '..', 'scripts'))
import hop_am_linh_nhi as H  # noqa: E402
import tach_lua_chon as T  # noqa: E402

S = H.S
EPS = 1e-6
RA = os.path.join(TOOLS, '..', 'src', 'thay', 'soanCau', 'theBamThay.json')
TEN = {0: '1', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7'}
LA = {0: 'I', 1: '♭II', 2: 'II', 3: '♭III', 4: 'III', 5: 'IV', 6: '♯IV', 7: 'V', 8: '♭VI', 9: 'VI', 10: '♭VII', 11: 'VII'}
CHAT = {'M': '', 'm': 'm', 'sus4': 'sus4', 'dim': 'dim', 'aug': 'aug'}
TEN_GIONG = ['Đô', 'Đô♯', 'Rê', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si']
# Bậc (so với gốc) coi là "thuộc hợp âm" khi chọn cụm tiêu biểu: ba nốt + 6, 7, ♭7, 9, 4. Blues nhận mọi bậc (nốt blue là màu).
BA = {'M': {0, 4, 7}, 'm': {0, 3, 7}, 'dim': {0, 3, 6}, 'aug': {0, 4, 8}, 'sus4': {0, 5, 7}}
MAU = {2, 5, 9, 10, 11}


def cum(ns, a, b, tay, it):
    g = collections.defaultdict(set)
    for n in ns:
        if n['hand'] == tay and n['dur'] > EPS and not n['tie_stop'] and a - EPS <= n['beat'] < b - EPS:
            g[round(n['beat'], 3)].add(n['midi'])
    return [sorted(v) for _, v in sorted(g.items()) if len(v) >= it]


def sach(ms, goc, q, blues):
    """Cụm tay phải sạch: mọi nốt thuộc hợp âm (ba nốt + màu). Blues: nốt blue là màu nên nhận mọi bậc, nhưng cụm phải có nốt định chất
    (3, ♭3 hay ♭7 của gốc ký hiệu) — Rockhouse có chỗ ký hiệu Dm7 mà tay phải bấm hợp âm Sol (ký hiệu lệch nốt)."""
    if blues:
        return any((m - goc) % 12 in (3, 4, 10) for m in ms)
    return all((m - goc) % 12 in BA[q] | MAU for m in ms)


def do_khuc(ns, segs, blues=False):
    ra = []
    for s in segs:
        a, b, goc, q = s['a'], s['b'], s['goc'], s['q']
        x = dict(doan=s['doan'], a=a, b=b, goc=goc, q=q, chat=s.get('chat', CHAT.get(q, '')), bac=s['bac'], nguon=s.get('nguon', 'ky hieu'))
        lh = cum(ns, a, b, 2, 1)
        if lh:
            bass = lh[0][0]
            x.update(bass=bass, bass_bac=(bass - goc) % 12, lh_dau=lh[0], lh_mau=sorted({m - bass for c in lh for m in c if 0 <= m - bass <= 28}),
                     lh_so=len(lh),
                     # tay trái sạch: bass là nốt hợp âm (Blues) / các nốt trên bass thuộc hợp âm — Có Em Chờ có chỗ E♭/D mà tay trái có B3
                     lh_sach=(blues and (bass - goc) % 12 in (0, 3, 4, 7, 10)) or (not blues and all((m - goc) % 12 in BA[q] | MAU for m in lh[0][1:])))
        rh = cum(ns, a, b, 1, 3)
        if rh:
            diem = lambda c: sum(1 if blues or (m - goc) % 12 in BA[q] | MAU else -2 for m in c)
            tb = max(rh, key=diem)  # max lấy cụm đầu tiên khi hòa
            x.update(rh=tb, rh_dau=rh[0], rh_cuoi=rh[-1], rh_sach=sach(tb, goc, q, blues))
        ra.append(x)
    return ra


def thay_hat(thay):
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    tat = []
    for s in corp['songs']:
        if s.get('teacher') != thay:
            continue
        if not s.get('giong') and s['name'] in T.GIONG_SUY:
            s = dict(s, giong=T.GIONG_SUY[s['name']])
        try:
            chu, thu, meta, segs = H.doan_hat(s)
        except KeyError:  # Kém duyên, Yêu xa chưa có giọng
            continue
        ns, _, _ = S.doc(s)
        tat.append(dict(bai=s['name'], tonic=chu, thu=thu, khuc=do_khuc(ns, [x for x in segs if not x['doan'].endswith('_mod')])))
    return tat


def blues():
    import phan_tich_blues_ba_sheet as B
    import mxl
    CH = {'': ('M', ''), '7': ('M', '7'), 'maj7': ('M', 'maj7'), 'm7': ('m', 'm7'), 'm': ('m', 'm'), '°': ('dim', 'dim'),
          'major-minor': ('m', 'm'), 'sus': ('sus4', 'sus4')}
    tat = []
    for ten, f, tonic, thu in (('Rockhouse (Ray Charles)', 'Rockhouse-Ray-da-sua.mxl', 7, False),
                               ('Slow Blues Impromptu (Robert Van)', 'Robert-Ray-chia-doan-C-Blues.mxl', 0, False),
                               ('The House of the Rising Sun', 'The-House-of-the-Rising-Sun.mxl', 4, True)):
        kh = sorted(B.nhan(B.BLUES + f))
        ns, _ = mxl.notes(mxl.load(B.BLUES + f))
        het = max(n['beat'] + n['dur'] for n in ns)
        segs = []
        for i, (t, g, k) in enumerate(kh):
            den = kh[i + 1][0] if i + 1 < len(kh) else het
            if den - t < 0.5:
                continue
            q, chat = CH.get(B.loai(k), ('M', ''))
            segs.append(dict(doan='cả bài', a=t, b=den, goc=g, q=q, chat=chat, bac=(g - tonic) % 12))
        tat.append(dict(bai=ten, tonic=tonic, thu=thu, khuc=do_khuc(ns, segs, blues=True)))
    return tat


def ten_hop(x):
    r = LA[x['bac']]
    return (r.lower() if x['q'] in ('m', 'dim') else r) + ('°' if x['q'] == 'dim' else '+' if x['q'] == 'aug' else 'sus' if x['q'] == 'sus4' else '')


def lien(p, q):
    return p['doan'] == q['doan'] and abs(p['b'] - q['a']) < 0.01


def so_do(tat):
    ds = [x for b in tat for x in b['khuc']]
    lh = [x for x in ds if 'bass' in x]
    rh = [x for x in ds if 'rh' in x]
    dem = lambda it: [[k, v] for k, v in collections.Counter(it).most_common()]
    slash, vd = collections.Counter(), {}
    for b in tat:
        for x in b['khuc']:
            if 'bass' in x and x['bass_bac']:
                k = f"{ten_hop(x)}/{TEN[x['bass_bac']]}"
                slash[k] += 1
                vd.setdefault(k, f"{b['bai']} · {x['doan']}")
    duong = []  # bass đi liền bậc một chiều ≥ 3 hợp âm, có ít nhất một thế đảo
    for b in tat:
        d, i = b['khuc'], 0
        while i < len(d) - 2:
            j = i
            while (j + 1 < len(d) and 'bass' in d[j] and 'bass' in d[j + 1] and lien(d[j], d[j + 1]) and 0 < abs(d[j + 1]['bass'] - d[j]['bass']) <= 2
                   and (j == i or (d[j + 1]['bass'] - d[j]['bass']) * (d[j]['bass'] - d[j - 1]['bass']) > 0)):
                j += 1
            if j - i >= 2 and any(d[k]['bass_bac'] for k in range(i, j + 1)):
                duong.append(f"{b['bai']} · {d[i]['doan']}: " + ' – '.join(ten_hop(d[k]) + (f"/{TEN[d[k]['bass_bac']]}" if d[k]['bass_bac'] else '') for k in range(i, j + 1)))
                i = j
            else:
                i += 1
    chuyen, bass_d = [], []
    for b in tat:
        for p, q in zip(b['khuc'], b['khuc'][1:]):
            if not lien(p, q):
                continue
            if 'rh_cuoi' in p and 'rh_dau' in q:
                A, B = p['rh_cuoi'], q['rh_dau']
                doi = [min(abs(y - x) for x in A) for y in B]
                chuyen.append((len(set(A) & set(B)) > 0, all(v <= 2 for v in doi), sum(doi), len(B)))
            if 'bass' in p and 'bass' in q:
                bass_d.append(abs(q['bass'] - p['bass']))
    return dict(
        khuc=len(ds), co_trai=len(lh), co_phai=len(rh),
        bass_bac=dem(TEN[x['bass_bac']] for x in lh),
        trai_dau=dem('-'.join(str(m - x['lh_dau'][0]) for m in x['lh_dau']) for x in lh)[:6],
        trai_mau=dem('-'.join(map(str, x['lh_mau'])) for x in lh)[:8],
        phai_hinh=dem('-'.join(TEN[(m - x['goc']) % 12] for m in x['rh']) for x in rh)[:10],
        phai_day=dem(TEN[(x['rh'][0] - x['goc']) % 12] for x in rh),
        phai_kep=sum(1 for x in rh if x['rh'][-1] - x['rh'][0] == 12),
        slash=[[k, v, vd[k]] for k, v in slash.most_common(10)],
        duong_bass=duong,
        chuyen=dict(n=len(chuyen), giu=sum(c[0] for c in chuyen), lien=sum(c[1] for c in chuyen),
                    doi_tb=round(sum(c[2] for c in chuyen) / max(1, sum(c[3] for c in chuyen)), 1)),
        bass_chuyen=dict(n=len(bass_d), dung=sum(d == 0 for d in bass_d), lien=sum(0 < d <= 2 for d in bass_d),
                         ba=sum(3 <= d <= 4 for d in bass_d), bon_nam=sum(5 <= d <= 7 for d in bass_d), xa=sum(d > 7 for d in bass_d)),
    )


def doan_danh(tat, toi_thieu, toi_da=8):
    """Đoạn đánh theo: khúc liền nhau (cùng đoạn) khúc nào cũng có tay trái + cụm tay phải sạch; dài toi_thieu..toi_da (cắt khúc dài)."""
    ra = []
    for b in tat:
        d, i = b['khuc'], 0
        while i < len(d):
            j = i
            # chỉ khúc mà KÝ HIỆU in được nốt tay trái xác nhận — khúc máy tự suy từ tay trái có chỗ đọc sai gốc (Để Em Rời Xa: "Dm/E" thật
            # ra là E–G–C♯ = A7/E)
            while j < len(d) and d[j]['nguon'] == 'ky hieu' and d[j].get('lh_sach') and d[j].get('rh_sach') and (j == i or lien(d[j - 1], d[j])):
                j += 1
            for k in range(i, j - toi_thieu + 1, toi_da):
                phan = d[k:min(j, k + toi_da)]
                if len(phan) >= toi_thieu:
                    ra.append(dict(bai=b['bai'], doan=phan[0]['doan'], tonic=b['tonic'], thu=b['thu'],
                                   giong=f"{TEN_GIONG[b['tonic']]} {'thứ' if b['thu'] else 'trưởng'}",
                                   hop=[[(x['goc'] - b['tonic']) % 12, x['chat'], (x['bass'] - b['tonic']) % 12 if x['bass_bac'] else None] for x in phan],
                                   the=[dict(trai=x['lh_dau'], phai=x['rh']) for x in phan]))
            i = max(j, i + 1)
    # bỏ đoạn trùng (cùng bài · đoạn · chuỗi hợp âm), tối đa 3 đoạn mỗi bài, đoạn nhiều hợp âm khác nhau trước
    gap, theo_bai, loc = set(), collections.Counter(), []
    for x in sorted(ra, key=lambda x: (-len({tuple(h) for h in x['hop']}), -len(x['hop']))):
        k = (x['bai'], x['doan'], json.dumps(x['hop']))
        if k in gap or theo_bai[x['bai']] >= 3:
            continue
        gap.add(k)
        theo_bai[x['bai']] += 1
        loc.append(x)
    return loc


def chay():
    ra = {}
    for thay, tat, it in (('linh-nhi', thay_hat('linh-nhi'), 3), ('ca-phao', thay_hat('ca-phao'), 4), ('blues', blues(), 4)):
        # Đoạn tay trái riêng cho Linh Nhi đã thử rồi bỏ (9/10/2026): Rừng Lá Thấp có ký hiệu "Am" mà tay trái bấm E–B–E, "G" mà tay
        # trái A–E–A — tên hợp âm lệch nốt, dạy theo thì sai tên. Tay trái rải của chị đã có ở tab Điệu (nút đã duyệt bằng tai).
        ra[thay] = dict(so=so_do(tat), doan=doan_danh(tat, it))
    return ra


def kiem(ra):
    # Số đo 9/10/2026: khúc có tay trái / có cụm tay phải; bass là gốc; quãng tám kẹp giữa (đếm trên CỤM TIÊU BIỂU — bản nháp đếm
    # trên cụm đầu ra 40 / 109 / 16).
    so = {k: v['so'] for k, v in ra.items()}
    assert [(s['khuc'], s['co_trai'], s['co_phai']) for s in so.values()] == [(676, 672, 139), (438, 430, 254), (229, 224, 113)], \
        [(s['khuc'], s['co_trai'], s['co_phai']) for s in so.values()]
    assert [dict(map(tuple, s['bass_bac']))['1'] for s in so.values()] == [485, 271, 135]
    assert [s['phai_kep'] for s in so.values()] == [43, 116, 24], [s['phai_kep'] for s in so.values()]
    for k, v in ra.items():
        assert v['doan'], k
        for d in v['doan']:
            assert len(d['hop']) == len(d['the']) and all(t['trai'] and len(t['phai']) >= 3 for t in d['the']), (k, d['bai'])
    print('kiem: dung het —', {k: len(v['doan']) for k, v in ra.items()}, 'đoạn đánh theo')


if __name__ == '__main__':
    ra = chay()
    if '--kiem' in sys.argv:
        kiem(ra)
    else:
        json.dump(ra, open(RA, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, separators=(',', ':'))
        for k, v in ra.items():
            s = v['so']
            print(k, f"{s['khuc']} khúc · {len(v['doan'])} đoạn đánh theo ·", 'chuyển', s['chuyen'], '· slash', s['slash'][:4])
