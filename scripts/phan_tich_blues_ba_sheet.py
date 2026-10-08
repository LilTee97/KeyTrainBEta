# -*- coding: utf-8 -*-
"""Cách ĐẶT HỢP ÂM và SOẠN NỐT GIAI ĐIỆU Blues của ba sheet, đo CÙNG MỘT CÁCH — cho Bộ Soạn Blues lượt 6 (28/9/2026).

    python -X utf8 scripts/phan_tich_blues_ba_sheet.py

Người dùng: *"tôi đã đưa các sheet Blues vào trong thư mục này (Linh Nhi/Blues), bạn hãy phân tích kỹ cách đặt hợp âm và soạn
nốt giai điệu Blues mà các tác giả của 3 sheet đã làm"*.

ĐƠN VỊ CHUNG = một ô 6/8 = 6 móc đơn = một hợp âm (lối đếm của người dùng):
  · Rockhouse (Ray Charles, Sol trưởng, 4/4 swing): nửa ô 4/4 — tay phải lấy từ kho `bluesClaudeO.json` (đã nắn lưới chùm ba,
    gốc hợp âm theo BASS); tay trái đọc sheet.
  · Rising Sun (Songscription, Mi thứ, 6/8): một ô — tay phải lấy từ kho `blueSunO.json` (THỜI GIAN THẬT của bản căn âm thanh);
    gốc theo ký hiệu in (trùng bass 14/14 ô).
  · Robert (Robert Van, Đô, nhịp CHẴN ♩ 162): một ô ghi (2 phách thật) — vị trí đổi sang móc chỉ để so phách mạnh; gốc theo ký
    hiệu in. Nhịp chẵn nên KHÔNG dùng làm vật liệu tiết tấu, chỉ đo cao độ.
Nốt giai điệu = nốt ĐỈNH mỗi cú tay phải. "Phách mạnh" = móc 0 hoặc 3 của đơn vị (phách 1 · 4 của ô 6/8).
"""
import collections
import json
import os
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mxl  # noqa: E402

BLUES = 'C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues/'
STYLE = 'D:/KeyTrain/src/reharm/style/'
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
EPS = 1e-6


def nhan(path):
    """Ký hiệu in: [(phách từ đầu bài, gốc pc, loại)] — loại theo `kind` MusicXML."""
    import xml.etree.ElementTree as ET
    import zipfile
    STEP = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    zf = zipfile.ZipFile(path)
    name = next(n for n in zf.namelist() if n.endswith(('.xml', '.musicxml')) and 'META' not in n and 'container' not in n)
    root = ET.fromstring(zf.read(name))
    out, div, cursor, barlen = [], 1, 0.0, 4.0
    for m in root.find('part').findall('measure'):
        at = cursor
        for el in m:
            if el.tag == 'attributes':
                if el.findtext('divisions'):
                    div = int(el.findtext('divisions'))
                t = el.find('time')
                if t is not None:
                    barlen = int(t.findtext('beats')) * 4.0 / int(t.findtext('beat-type'))
            elif el.tag == 'backup':
                at -= float(el.findtext('duration') or 0) / div
            elif el.tag == 'forward':
                at += float(el.findtext('duration') or 0) / div
            elif el.tag == 'harmony' and el.find('root') is not None:
                r = el.find('root')
                k = el.find('kind')
                off = float(el.findtext('offset') or 0) / div
                out.append((round(at + off, 4), (STEP[r.findtext('root-step')] + int(r.findtext('root-alter') or 0)) % 12,
                            (k.text or '') if k is not None else ''))
            elif el.tag == 'note' and el.find('chord') is None and el.find('grace') is None:
                at += float(el.findtext('duration') or 0) / div
        cursor += barlen
    return sorted(out)


def loai(k):
    return ('m7' if 'minor-seventh' in k else 'm' if k.startswith('minor') else '°' if 'dim' in k else
            'maj7' if 'major-seventh' in k else '7' if k in ('dominant', 'dominant-ninth', 'dominant-13th', 'dominant-11th')
            else 'sus' if 'sus' in k else '' if k in ('major', '') else k)


# ---------------------------------------------------------------- đọc ba sheet về một dạng chung
def doc():
    """→ {tên: dict(tonic, thu, don_vi=[{u, goc, su=[[t, d, notes]]}], trai=[(thời điểm theo móc, midi thấp nhất)])}"""
    S = {}
    rk = json.load(open(STYLE + 'bluesClaudeO.json', encoding='utf8'))['o']
    ns, meta = mxl.notes(mxl.load(BLUES + 'Rockhouse-Ray-da-sua.mxl'))
    g0 = rk[0]['gi']
    lh = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 2 and n['dur'] > EPS and not n['tie_stop']:
            lh[round((n['beat'] / 2 - g0) * 6, 3)].append(n['midi'])
    S['Rockhouse'] = dict(tonic=7, thu=False, don_vi=[dict(u=o['gi'] - g0, goc=o['goc'], su=o['su']) for o in rk],
                          trai=sorted((t, min(v)) for t, v in lh.items() if 0 <= t < 6 * len(rk)))
    sun = json.load(open(STYLE + 'blueSunO.json', encoding='utf8'))['o']
    ns, meta = mxl.notes(mxl.load(BLUES + 'The-House-of-the-Rising-Sun.mxl'))
    bs, bl = meta['bar_start'], meta['barlens']
    lh = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 2 and n['dur'] > EPS and not n['tie_stop'] and 1 <= n['bar'] <= 15:
            lh[round((n['bar'] - 1) * 6 + (n['beat'] - bs[n['bar']]) / bl[n['bar']] * 6, 3)].append(n['midi'])
    S['Rising Sun'] = dict(tonic=4, thu=True, don_vi=[dict(u=o['o'] - 1, goc=o['goc'], su=o['su']) for o in sun if o['o'] >= 1],
                           trai=sorted((t, min(v)) for t, v in lh.items()))
    f = BLUES + 'Robert-Ray-chia-doan-C-Blues.mxl'
    ns, meta = mxl.notes(mxl.load(f))
    bs = meta['bar_start']
    kh = nhan(f)
    goc = lambda t: ([g for a, g, _ in kh if a <= t + EPS] or [None])[-1]
    cu = collections.defaultdict(lambda: collections.defaultdict(list))
    lh = collections.defaultdict(list)
    for n in ns:
        if not (10 <= n['bar'] <= 131) or n['dur'] <= EPS or n['tie_stop']:
            continue
        if n['hand'] == 1:
            cu[n['bar']][round(n['beat'] - bs[n['bar']], 4)].append(n)
        else:
            lh[round((n['bar'] - 10) * 6 + (n['beat'] - bs[n['bar']]) * 1.5, 3)].append(n['midi'])
    dv = []
    for b in range(10, 132):
        su = [[round(t * 1.5, 3), round(max(x['dur'] for x in v) * 1.5, 3), sorted({x['midi'] for x in v})]
              for t, v in sorted(cu[b].items())]
        k = ([loai(k) for a, g, k in kh if a <= bs[b] + EPS] or [''])[-1]
        dv.append(dict(u=b - 10, goc=goc(bs[b] + EPS), su=su, chat='m' if k in ('m', 'm7') else 'dim' if k == '°' else 'dom'))
    S['Robert'] = dict(tonic=0, thu=False, don_vi=dv, trai=sorted((t, min(v)) for t, v in lh.items()))
    return S


def ten_ham(f, thu):
    return ({0: 'i', 3: 'III', 5: 'IV', 7: 'V', 8: 'bVI', 10: 'bVII', 2: 'ii'} if thu else
            {0: 'I', 5: 'IV', 7: 'V', 2: 'ii', 4: 'iii', 9: 'vi', 1: 'bII', 3: 'bIII', 6: '#IV'}).get(f, f'?{f}')


def pt(c, n=None, k=9):
    n = n or sum(c.values())
    return ' · '.join(f'{x} {v * 100 / n:.0f}%' for x, v in c.most_common(k)) + f'  (n={n})'


# ---------------------------------------------------------------- A. HỢP ÂM
def hop_am(S):
    print('\n######## A. CÁCH ĐẶT HỢP ÂM')
    for ten, f in (('Rockhouse', 'Rockhouse-Ray-da-sua.mxl'), ('Robert', 'Robert-Ray-chia-doan-C-Blues.mxl'),
                   ('Rising Sun', 'The-House-of-the-Rising-Sun.mxl')):
        s = S[ten]
        kh = nhan(BLUES + f)
        c = collections.Counter(f'{ten_ham((g - s["tonic"]) % 12, s["thu"])}{loai(k)}' for _, g, k in kh)
        print(f'\n== {ten}: chất hợp âm theo ký hiệu in — {pt(c, k=14)}')
        goc = [d['goc'] for d in s['don_vi'] if d['goc'] is not None]
        chay, cu = [], None
        for g in goc:
            if g == cu:
                chay[-1] += 1
            else:
                chay.append(1)
                cu = g
        print(f'   nhịp hoà âm: một hợp âm kéo dài (đơn vị) — {pt(collections.Counter(chay), k=8)}')
        doi = collections.Counter()
        for a, b in zip(goc, goc[1:]):
            if a != b:
                doi[f'{ten_ham((a - s["tonic"]) % 12, s["thu"])}→{ten_ham((b - s["tonic"]) % 12, s["thu"])}'] += 1
        print(f'   bước hợp âm: {pt(doi, k=10)}')
        # bass dẫn: nốt thấp nhất tay trái gõ TRONG 2 móc trước chỗ đổi — cách gốc mới bao nhiêu (nửa cung, rút về −6..+5)
        dan = collections.Counter()
        for d0, d1 in zip(s['don_vi'], s['don_vi'][1:]):
            if d0['goc'] is None or d1['goc'] is None or d0['goc'] == d1['goc']:
                continue
            t = d1['u'] * 6
            tr = [m for a, m in s['trai'] if t - 2 - EPS <= a < t - EPS]
            if not tr:
                dan['(không gõ)'] += 1
                continue
            k = (tr[-1] - d1['goc']) % 12
            k = k - 12 if k > 5 else k
            dan[{-1: 'nửa cung dưới', 1: 'nửa cung trên', 0: 'gốc mới', -5: 'bậc 5 dưới', 5: 'bậc 4 dưới/5 trên', -2: 'cung dưới',
                 2: 'cung trên', -3: 'quãng 3 thứ dưới', -4: 'quãng 3 trưởng dưới', 3: 'quãng 3 thứ trên', 4: 'quãng 3 trưởng trên',
                 -6: 'tam cung'}[k]] += 1
        print(f'   bass trong 2 móc trước chỗ đổi hợp âm, so gốc MỚI: {pt(dan, k=8)}')


# ---------------------------------------------------------------- B. GIAI ĐIỆU
def cu_giai_dieu(s):
    """[(thời điểm móc toàn bài, móc trong đơn vị, độ ngân, đỉnh, số nốt, gốc hợp âm)]"""
    return [(d['u'] * 6 + t, t, dd, notes[-1], len(notes), d['goc']) for d in s['don_vi'] for t, dd, notes in d['su']]


def cau(cu, nghi=1.0):
    """Tách câu: khoảng lặng (từ lúc nốt trước tắt tới cú sau) ≥ `nghi` móc."""
    out, cur = [], []
    for x in cu:
        if cur and x[0] - (cur[-1][0] + cur[-1][2]) >= nghi - EPS:
            out.append(cur)
            cur = []
        cur.append(x)
    if cur:
        out.append(cur)
    return out


def giai_dieu(S):
    print('\n######## B. CÁCH SOẠN NỐT GIAI ĐIỆU (nốt đỉnh)')
    for ten, s in S.items():
        T, thu = s['tonic'], s['thu']
        cu = [x for x in cu_giai_dieu(s) if x[5] is not None]
        print(f'\n== {ten} ({"thứ" if thu else "trưởng"}, chủ {T}) — {len(cu)} cú, {len(s["don_vi"])} đơn vị')
        for manh in (False, True):
            by = collections.defaultdict(collections.Counter)
            for a, t, d, top, k, g in cu:
                if manh and not (abs(t) < .2 or abs(t - 3) < .2):
                    continue
                by[(g - T) % 12][BAC[(top - T) % 12]] += 1
            for f in sorted(by, key=lambda f: -sum(by[f].values()))[:5]:
                print(f'   B1 {"phách 1·4" if manh else "mọi nốt  "} trên {ten_ham(f, thu):4} so CHỦ: {pt(by[f], k=8)}')
        c = collections.Counter()
        for a, t, d, top, k, g in cu:
            if abs(t) < .2 or abs(t - 3) < .2:
                r = (top - g) % 12
                c['1' if r == 0 else '3/b3' if r in (3, 4) else '5' if r == 7 else 'b7' if r == 10 else
                  '9' if r == 2 else '6/13' if r == 9 else '4/11' if r == 5 else 'b5' if r == 6 else f'khác({BAC[r]})'] += 1
        print(f'   B2 phách 1·4 so GỐC HỢP ÂM: {pt(c)}')
        cs = cau(cu)
        ra = collections.defaultdict(collections.Counter)
        for q in cs:
            for x, y in zip(q, q[1:]):
                b = BAC[(x[3] - T) % 12]
                if b in (('b5', '4', 'b7', '6') if thu else ('b3', 'b5', 'b7', 'b6')):
                    ra[b][f'{BAC[(y[3] - T) % 12]}({"+" if y[3] > x[3] else "-" if y[3] < x[3] else "="}{abs(y[3] - x[3])})'] += 1
        for b, v in ra.items():
            print(f'   B3 {b} đi tiếp: {pt(v, k=6)}')
        dai = collections.Counter(min(len(q), 12) for q in cs)
        vao = collections.Counter(round(q[0][1] * 3) / 3 for q in cs)
        het = collections.Counter(BAC[(q[-1][3] - T) % 12] for q in cs if len(q) >= 2)
        hetH = collections.Counter(BAC[(q[-1][3] - q[-1][5]) % 12] for q in cs if len(q) >= 2)
        hetM = sum(1 for q in cs if len(q) >= 2 and (abs(q[-1][1]) < .2 or abs(q[-1][1] - 3) < .2))
        huong = collections.Counter('lên' if q[-1][3] > q[0][3] + 2 else 'xuống' if q[-1][3] < q[0][3] - 2 else 'ngang'
                                    for q in cs if len(q) >= 3)
        dinh = collections.Counter('đầu' if i < len(q) / 3 else 'giữa' if i < 2 * len(q) / 3 else 'cuối'
                                   for q in cs if len(q) >= 4 for i in [max(range(len(q)), key=lambda j: q[j][3])])
        nghi = sorted(b[0][0] - (a[-1][0] + a[-1][2]) for a, b in zip(cs, cs[1:]))
        dmoc = sorted(q[-1][0] + q[-1][2] - q[0][0] for q in cs)
        print(f'   B4 câu (tách ở lặng ≥ 1 móc): {len(cs)} câu · số cú {pt(dai, k=8)}')
        print(f'      dài trung vị {dmoc[len(dmoc) // 2]:.1f} móc (tứ phân {dmoc[len(dmoc) // 4]:.1f}–{dmoc[3 * len(dmoc) // 4]:.1f}) · '
              f'lặng giữa hai câu trung vị {nghi[len(nghi) // 2]:.1f} móc (tứ phân {nghi[len(nghi) // 4]:.1f}–{nghi[3 * len(nghi) // 4]:.1f})')
        print(f'      vào ở móc: {pt(vao, k=8)}')
        print(f'      kết ở bậc (so chủ): {pt(het, k=7)}')
        print(f'      kết ở bậc (so gốc hợp âm): {pt(hetH, k=7)} · nốt kết rơi phách 1·4: {hetM}/{sum(dai.values()) - dai[1]}')
        print(f'      hướng câu (≥ 3 cú): {pt(huong)} · đỉnh câu (≥ 4 cú) nằm ở: {pt(dinh)}')
        bu = collections.Counter()
        len_ = xuong = 0
        for q in cs:
            for x, y in zip(q, q[1:]):
                k = abs(y[3] - x[3])
                bu['lặp' if k == 0 else 'nửa cung' if k == 1 else 'liền bậc (2)' if k == 2 else 'quãng 3 (3–4)' if k <= 4 else
                   'quãng 4–5 (5–7)' if k <= 7 else 'nhảy ≥ 6 (8+)'] += 1
                len_ += y[3] > x[3]
                xuong += y[3] < x[3]
        print(f'   B5 bước nốt trong câu: {pt(bu)} · lên {len_} / xuống {xuong}')
        tops = sorted(x[3] - T for x in cu)
        print(f'   B6 tầm (đỉnh, nửa cung so chủ): {tops[0]}–{tops[-1]}, trung vị {tops[len(tops) // 2]}, tứ phân '
              f'{tops[len(tops) // 4]}–{tops[3 * len(tops) // 4]}')


# ---------------------------------------------------------------- C. NHẮC LẠI và NHÓM BA (cho bộ soạn)
def lap_lai(S):
    print('\n######## C. NHẮC LẠI (hỏi–đáp) và NỐI NHÓM BA')
    for ten, s in S.items():
        if ten == 'Robert':
            continue  # nhịp chẵn: vị trí không trên lưới móc
        T = s['tonic']
        dv = {d['u']: d for d in s['don_vi']}
        nhip = lambda d: {round(t * 3) / 3 for t, _, _ in d['su']}
        buoc = lambda d: tuple(b[2][-1] - a[2][-1] for a, b in zip(d['su'], d['su'][1:]))
        for k in (1, 2, 4):
            cap = [(dv[u], dv[u + k]) for u in dv if u + k in dv and dv[u]['su'] and dv[u + k]['su']]
            giong = [len(nhip(a) & nhip(b)) / len(nhip(a) | nhip(b)) for a, b in cap]
            trung = sum(1 for a, b in cap if nhip(a) == nhip(b))
            net = sum(1 for a, b in cap if buoc(a) == buoc(b) and len(a['su']) >= 3)
            print(f'   {ten}: đơn vị u → u+{k}: nhịp giống trung bình {sum(giong) / len(giong):.2f} · trùng hẳn nhịp {trung}/{len(cap)} · '
                  f'trùng hẳn nét (≥ 3 cú) {net}/{len(cap)}')
        # Nhóm ba = nửa đơn vị (3 móc = một phách lớn 6/8).
        nhom = []
        for d in s['don_vi']:
            for h in (0, 1):
                nhom.append([x for x in d['su'] if h * 3 - EPS <= x[0] < h * 3 + 3 - EPS])
        trong = sum(1 for n in nhom if not n)
        so = collections.Counter(min(len(n), 8) for n in nhom)
        noi = collections.Counter()
        for a, b in zip(nhom, nhom[1:]):
            if a and b:
                k = abs(b[0][2][-1] - a[-1][2][-1])
                noi['lặp' if k == 0 else '1–2' if k <= 2 else '3–4' if k <= 4 else '5–7' if k <= 7 else '8+'] += 1
        dau = collections.Counter(BAC[(n[0][2][-1] - T) % 12] for n in nhom if n and abs(n[0][0] % 3) < .2)
        print(f'   {ten}: {len(nhom)} nhóm ba · trống {trong} · số cú mỗi nhóm {pt(so, k=9)}')
        print(f'      nối hai nhóm liền (nửa cung): {pt(noi)} · nốt đầu nhóm ở phách 1·4 (so chủ): {pt(dau, k=8)}')


# ---------------------------------------------------------------- D. BÁM HỢP ÂM (lượt 7)
NOT_HOP = {'dom': {0, 4, 7, 10}, 'm': {0, 3, 7, 10}, 'dim': {0, 3, 6, 9}}
NGU_CUNG = {'dom': {0, 2, 4, 7, 9, 10}, 'm': {0, 2, 3, 5, 7, 10}, 'dim': {0, 3, 6, 9}}


def bam_hop_am(S):
    """Người dùng nghe lượt 6: *"nốt chạy vẫn chưa bám hợp âm lắm"*. Đo nốt đỉnh SO GỐC HỢP ÂM đang vang. Chất hợp âm:
    Rockhouse — bảy trưởng (I7 · IV7 · V7 chiếm đa số ký hiệu); Rising Sun — i thứ, còn lại bảy; Robert — theo ký hiệu in.
    Nốt đáp = nốt cuối câu (lặng ≥ 1 móc sau nó) hoặc nốt cuối trước chỗ đổi hợp âm. Nốt ngân = ngân ≥ 1,5 móc."""
    print()
    print('######## D. BÁM HỢP ÂM — nốt đỉnh so gốc hợp âm đang vang')
    for ten, s in S.items():
        chat = {d['u']: d.get('chat') or ('m' if ten == 'Rising Sun' and d['goc'] == s['tonic'] else 'dom') for d in s['don_vi']}
        cu = [(u, x) for u, x in ((int(x[0] // 6), x) for x in cu_giai_dieu(s)) if x[5] is not None]
        dem = collections.Counter()
        for i, (u, (a, t, d, top, k, g)) in enumerate(cu):
            r = (top - g) % 12
            ct, nc = r in NOT_HOP[chat[u]], r in NGU_CUNG[chat[u]] | NOT_HOP[chat[u]]
            dem['tong'] += 1; dem['ct'] += ct; dem['nc'] += nc
            if abs(t) < .2 or abs(t - 3) < .2:
                dem['manh'] += 1; dem['manh_ct'] += ct
            sau = cu[i + 1][1] if i + 1 < len(cu) else None
            if sau is None or sau[0] - (a + d) >= 1 - EPS or sau[5] != g:
                dem['dap'] += 1; dem['dap_ct'] += ct
            if d >= 1.5 - EPS:
                dem['ngan'] += 1; dem['ngan_ct'] += ct
        f = lambda a, b: f'{dem[a] * 100 / max(1, dem[b]):.0f}% ({dem[a]}/{dem[b]})'
        print(f'   {ten:10}: phách 1·4 là nốt hợp âm {f("manh_ct", "manh")} · mọi nốt là nốt hợp âm {f("ct", "tong")} · '
              f'trong hợp âm + ngũ cung của hợp âm {f("nc", "tong")} · nốt đáp là nốt hợp âm {f("dap_ct", "dap")} · '
              f'nốt ngân là nốt hợp âm {f("ngan_ct", "ngan")}')


# ---------------------------------------------------------------- E. NỐI HỢP ÂM (lượt 11)
def noi_hop_am(S):
    """Người dùng 29/9: *"ngoài chạy ngón ra thì trong các sheet Blues còn có các kỹ thuật đánh để nối hợp âm cho liền mạch"* ·
    *"Các câu chạy cảm giác như bị cắt cụt hoặc đứt quãng khi chuyển hợp âm"*. Ở MỖI CHỖ ĐỔI HỢP ÂM (vạch đơn vị, gốc đổi): tay phải
    làm gì trong 2 móc trước và 2 móc sau vạch; câu (tách ở lặng ≥ 1 móc) có chạy xuyên vạch không; bè trầm vào gốc mới thế nào."""
    print()
    print('######## E. NỐI HỢP ÂM — ở mỗi chỗ đổi hợp âm')
    for ten, s in S.items():
        dv = [d for d in s['don_vi'] if d['goc'] is not None]
        chat = lambda d: d.get('chat') or ('m' if ten == 'Rising Sun' and d['goc'] == s['tonic'] else 'dom')
        cu = sorted((d['u'] * 6 + t, dd, notes, d) for d in dv for t, dd, notes in d['su'])
        dem = collections.Counter()
        buoc = collections.Counter()
        cham = collections.Counter()
        for a, b in zip(dv, dv[1:]):
            if a['goc'] == b['goc'] or b['u'] != a['u'] + 1:
                continue
            T = b['u'] * 6
            dem['doi'] += 1
            truoc = [c for c in cu if T - 2 - EPS <= c[0] < T - EPS]
            sau = [c for c in cu if T - EPS <= c[0] < T + 2 - EPS]
            dung = [c for c in cu if abs(c[0] - T) < .2]
            if truoc:
                dem['truoc'] += 1
            if dung:
                dem['vao_vach'] += 1
                r = (dung[0][2][-1] - b['goc']) % 12
                dem['vao_ct'] += r in NOT_HOP[chat(b)]
            # xuyên vạch: nốt cuối trước vạch tắt/ngân tới cách cú đầu sau vạch < 1 móc
            if truoc and sau:
                x, y = truoc[-1], sau[0]
                if y[0] - min(x[0] + x[1], T) < 1 - EPS:
                    dem['xuyen'] += 1
                    k = y[2][-1] - x[2][-1]
                    buoc['giữ nốt' if k == 0 else 'nửa cung' if abs(k) == 1 else 'liền bậc' if abs(k) == 2 else
                         'quãng 3' if abs(k) <= 4 else 'nhảy'] += 1
                    r = (x[2][-1] - b['goc']) % 12
                    # nốt dẫn: nửa cung cạnh một nốt của hợp âm MỚI mà không thuộc hợp âm cũ
                    cu_ct = (x[2][-1] - a['goc']) % 12 in NOT_HOP[chat(a)]
                    moi_ct = r in NOT_HOP[chat(b)]
                    ke = any((r + e) % 12 in NOT_HOP[chat(b)] for e in (1, -1))
                    cham['nốt chung hai hợp âm' if cu_ct and moi_ct else 'nốt hợp âm mới (vào sớm)' if moi_ct else
                         'nốt dẫn nửa cung vào hợp âm mới' if ke and not cu_ct else 'nốt hợp âm cũ' if cu_ct else 'khác'] += 1
                # trượt chùm nửa cung: chùm ≥ 2 nốt trước vạch, chùm ở vạch = dời cả chùm ±1
                if len(x[2]) >= 2 and len(y[2]) == len(x[2]) and len({q - p for p, q in zip(x[2], y[2])}) == 1 \
                        and abs(y[2][0] - x[2][0]) == 1:
                    dem['truot'] += 1
        n = max(1, dem['doi'])
        print(f'\n== {ten}: {dem["doi"]} chỗ đổi hợp âm')
        print(f'   tay phải có nốt trong 2 móc trước vạch: {dem["truoc"]}/{n} · có cú đúng vạch: {dem["vao_vach"]}/{n} '
              f'(cú ở vạch là nốt hợp âm mới {dem["vao_ct"]}/{max(1, dem["vao_vach"])})')
        print(f'   câu CHẠY XUYÊN vạch (khe < 1 móc): {dem["xuyen"]}/{n} · trượt chùm nửa cung: {dem["truot"]}')
        if buoc:
            print(f'   bước qua vạch: {pt(buoc)}')
            print(f'   nốt cuối trước vạch là: {pt(cham)}')


# ---------------------------------------------------------------- F. MÀU HỢP ÂM THEO NỐT THẬT (Blue Sun: tô màu Blues)
MAU = [(1, 'b9'), (2, '9'), (3, '#9/b3'), (5, '11'), (6, '#11/b5'), (8, 'b13'), (9, '13/6'), (10, 'b7'), (11, 'maj7')]


def mau_hop_am():
    """Người dùng 29/9: *"phân tích kỹ 3 sheet Blues xem cách đặt hợp âm của Blues là như thế nào … để dạy cho bộ soạn biết chọn
    hợp âm màu Blues"*. Ký hiệu in có thể ghi "G" mà tay bấm G13 — nên đếm theo NỐT VANG: mỗi đơn vị (nửa ô Rockhouse · ô Rising Sun
    · ô Robert) gom mọi nốt hai tay, so GỐC hợp âm (Rockhouse gốc theo bass trong kho; hai bài kia theo ký hiệu in), rồi đếm đơn vị
    nào có nốt màu nào, tách theo chức năng và loại (bậc 3 trưởng / thứ)."""
    print()
    print('######## F. MÀU HỢP ÂM THEO NỐT VANG (hai tay, mỗi đơn vị có mặt nốt đó hay không)')
    rk = {o['gi']: o['goc'] for o in json.load(open(STYLE + 'bluesClaudeO.json', encoding='utf8'))['o']}
    nguon = []
    ns, _ = mxl.notes(mxl.load(BLUES + 'Rockhouse-Ray-da-sua.mxl'))
    dv = collections.defaultdict(set)
    for n in ns:
        if n['dur'] > EPS and int(n['beat'] // 2) in rk:
            dv[int(n['beat'] // 2)].add(n['midi'] % 12)
    nguon.append(('Rockhouse', 7, False, [(rk[u], None, p) for u, p in dv.items()]))
    for ten, f, T, thu, tu, den in (('Robert', 'Robert-Ray-chia-doan-C-Blues.mxl', 0, False, 10, 131),
                                    ('Rising Sun', 'The-House-of-the-Rising-Sun.mxl', 4, True, 1, 15)):
        ns, meta = mxl.notes(mxl.load(BLUES + f))
        bs = meta['bar_start']
        kh = nhan(BLUES + f)
        lay = lambda t: ([(g, loai(k)) for a, g, k in kh if a <= t + EPS] or [(None, '')])[-1]
        dv = collections.defaultdict(set)
        for n in ns:
            if n['dur'] > EPS and tu <= n['bar'] <= den:
                dv[n['bar']].add(n['midi'] % 12)
        nguon.append((ten, T, thu, [(lay(bs[b] + EPS)[0], lay(bs[b] + EPS)[1], p) for b, p in dv.items() if lay(bs[b] + EPS)[0] is not None]))
    for ten, T, thu, ds in nguon:
        print(f'\n== {ten}')
        nhom = collections.defaultdict(list)
        for g, k, p in ds:
            r = {(x - g) % 12 for x in p}
            loai3 = 'trưởng' if 4 in r and not (k or '').startswith('m') else 'thứ' if 3 in r and 4 not in r else 'khác'
            nhom[(ten_ham((g - T) % 12, thu), loai3)].append(r)
        for (h, l3), v in sorted(nhom.items(), key=lambda x: -len(x[1]))[:9]:
            if len(v) < 3:
                continue
            c = ' · '.join(f'{ten_mau} {sum(1 for r in v if k in r) * 100 // len(v)}%' for k, ten_mau in MAU
                           if sum(1 for r in v if k in r) * 100 // len(v) >= 10)
            print(f'   {h:5} ({l3}, n={len(v):3}): {c}')


def pho_bien():
    """Rising Sun: gốc hợp âm bản phối so với HỢP ÂM PHỔ BIẾN của bài (hopamchuan, `tools/lay_hop_am_pho_bien.py`) — tách gốc của bài
    khỏi lựa chọn của người phối, như `tools/tach_lua_chon.py` làm cho Linh Nhi, Cà Pháo (7/10/2026). Tự kiểm bằng assert."""
    import re
    pb = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools', 'du_lieu', 'hop_am_pho_bien.json'),
                        encoding='utf-8'))['The House of the Rising Sun']['ban']
    phoi = [(ten_ham((g - 4) % 12, True), loai(k)) for t, g, k in nhan(BLUES + 'The-House-of-the-Rising-Sun.mxl') if t > 0]  # bỏ ô đón
    STEP = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    for ban in pb:
        assert ban['giong'] == 'Am', ban['giong']  # bản ghi La thứ → dời về Mi thứ của sheet
        hop = [re.match(r'([A-G])([#b]?)(.*)', h).groups() for _, dong in ban['dong'] for _, h in dong]
        ban_bac = [(ten_ham((STEP[c] + {'#': 1, 'b': -1, '': 0}[a] + 7 - 4) % 12, True), q) for c, a, q in hop]
        print('bản phổ biến:', ' '.join(r + q for r, q in ban_bac[:len(phoi)]))
        print('bản phối    :', ' '.join(r + q for r, q in phoi))
        assert [r for r, _ in ban_bac[:len(phoi)]] == [r for r, _ in phoi], 'gốc khác'
        assert {q for _, q in ban_bac} <= {'', 'm'}, 'bản phổ biến có hợp âm bảy'
    assert all(q == '7' for r, q in phoi if r != 'i'), 'bản phối có hợp âm ngoài i không phải hợp âm bảy'
    print(f'kiem: gốc {len(phoi)}/{len(phoi)} trùng bản phổ biến ({len(pb)} bản, toàn hợp âm ba); bản phối: mọi hợp âm ngoài i là hợp âm bảy')


if __name__ == '__main__':
    if '--pho-bien' in sys.argv:
        pho_bien()
        sys.exit()
    S = doc()
    if '--mau' in sys.argv:
        mau_hop_am()
        sys.exit()
    if '--bam' in sys.argv:
        bam_hop_am(S)
        sys.exit()
    if '--noi' in sys.argv:
        noi_hop_am(S)
        sys.exit()
    hop_am(S)
    giai_dieu(S)
    lap_lai(S)
    bam_hop_am(S)
    noi_hop_am(S)
