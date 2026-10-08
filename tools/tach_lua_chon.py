# -*- coding: utf-8 -*-
"""TÁCH LỰA CHỌN của thầy khỏi hòa âm phổ biến của bài (7/10/2026).

    python tools/tach_lua_chon.py              # Linh Nhi: bảng so từng bài + tóm tắt
    python tools/tach_lua_chon.py --chi-tiet   # thêm từng chỗ chị khác bản phổ biến
    python tools/tach_lua_chon.py --kiem       # tự kiểm các số trích vào app / md

MỐC: hợp âm phổ biến của bài (`tools/du_lieu/hop_am_pho_bien.json`, 4–8 bản cộng đồng mỗi bài, `lay_hop_am_pho_bien.py`).
KHÔNG phải hòa âm gốc của nhạc sĩ (nhạc sĩ hiếm khi in hòa âm) — là "người ta thường đệm bài này thế nào". Lựa chọn của thầy =
chỗ thầy KHÁC mốc ấy, cộng mọi thứ mốc không ghi (thế bấm, hình rải, nốt màu).

Từng bản: dịch giọng theo cách khớp sheet nhất — thử 12 giọng, KHÔNG tin nhãn giọng của trang (có bản ghi "E7", "Esus2"); bản
trùng y nhau sau khi dịch thì gộp. Bản MẶC ĐỊNH = bản đầu trang (bản được xem nhiều nhất).

CĂN HÀNG: mỗi đoạn hát của sheet (chuỗi hợp âm, gộp hợp âm liền nhau giống nhau) căn vào chuỗi hợp âm của bản: đoạn của thầy phải
căn trọn, chuỗi của bản được bỏ đầu bỏ cuối (căn bán toàn cục). Mỗi hợp âm của thầy ra MỘT loại so với bản mặc định:
  giong — cùng gốc, cùng loại ba nốt (trưởng · thứ · giảm · tăng · treo)
  doi   — cùng gốc, khác loại ba nốt (vd bản ghi Em, thầy bấm E)
  thay  — khác gốc
  chen  — không có hợp âm tương ứng: thầy chèn thêm
  cung_not — khác gốc hay khác loại nhưng CÙNG BỐN NỐT (vd bản ghi Am6, thầy bấm F#m7b5 — đổi bass, giữ âm thanh)
và một cờ: có bản NÀO (trong mọi bản) cùng gốc + loại ở chỗ ấy không.

ĐÃ THỬ, KHÔNG KẾT LUẬN ĐƯỢC (7/10/2026): đếm âm tiết lời của bản phổ biến giữa hai hợp âm căn được rồi so với số mốc nốt cao nhất
tay phải của thầy — tỉ lệ 0,69 – 1,52 tùy bài, bốn bài dưới 1: khúc lời căn theo HỢP ÂM còn quá rộng, và bản piano hay gộp các âm tiết
cùng cao độ thành một nốt ngân. Bỏ.
"""
from __future__ import annotations

import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hop_am_linh_nhi as H  # noqa: E402
import ly_do_hop_am_linh_nhi as L  # noqa: E402

S = H.S
EPS = 1e-6
DU_LIEU = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'du_lieu', 'hop_am_pho_bien.json')
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
LA_MA = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII']


# ---------------- Đọc ký hiệu hợp âm của bản phổ biến ----------------

def doc_ky_hieu(ten: str):
    """'F#m7b5/A' → (gốc, loại ba nốt, {màu}, bass) — loại: M m dim aug sus. Không đọc được thì None."""
    m = re.match(r'^\s*([A-G])([#b]?)(.*)$', ten.replace('♯', '#').replace('♭', 'b'))
    if not m:
        return None
    goc = (PC[m.group(1)] + {'#': 1, 'b': -1, '': 0}[m.group(2)]) % 12
    rest, bass = m.group(3), None
    if '/' in rest:
        rest, b = rest.split('/', 1)
        mb = re.match(r'([A-G])([#b]?)', b)
        if mb:
            bass = (PC[mb.group(1)] + {'#': 1, 'b': -1, '': 0}[mb.group(2)]) % 12
    r = rest.strip()
    tri = 'M'
    if re.match(r'^(m(?!aj)|min|-)', r):
        tri = 'm'
    if 'dim' in r or '°' in r or re.search(r'm7b5|ø', r):
        tri = 'dim'
    if 'aug' in r or r.startswith('+') or re.match(r'^\(?#5', r):
        tri = 'aug'
    if 'sus' in r:
        tri = 'sus'
    mau = set()
    if re.search(r'(maj|Maj|M|Δ)(7|9|13)', r) or (tri == 'm' and re.search(r'mmaj|mMaj|mM7', r)):
        mau.add('maj7')
    elif re.search(r'(?<![#b\d])(7|9|11|13)', r) and not (tri == 'dim' and 'dim' in r and '7' not in r):
        mau.add('7')
    if re.search(r'(?<!1)6', r):
        mau.add('6')
    if re.search(r'(?<![#b\d])9|add9|add2|sus2', r):
        mau.add('9')
    for k in ('b9', '#9', '#11', 'b13', 'b5'):
        if k in r:
            mau.add(k)
    return goc, tri, mau, bass


# ---------------- Hợp âm phần hát của Linh Nhi ----------------

TRI = {'M': 'M', 'm': 'm', 'dim': 'dim', 'aug': 'aug', 'sus4': 'sus', 'sus2': 'sus'}
MAU_IV = {10: '7', 11: 'maj7', 2: '9', 9: '6', 1: 'b9', 8: 'b13', 6: '#11'}


# Giọng của bài kho CHƯA ghi (corpus `giong: null`) — suy từ bản phổ biến: giọng của bản + độ dịch khớp sheet nhất (7/10/2026).
# CHƯA người dùng xác nhận. Không suy bằng dấu hóa (corpus `_doc_giong`: thử trên 7 bài đã biết thì sai 5).
GIONG_SUY = {'Để Em Rời Xa': 'Re thu', 'Chúng Ta Không Thuộc Về Nhau': 'La thu', 'Chưa Bao Giờ (Trung Quân)': 'Fa thu'}


def doan_cua_bai(song):
    """{tên đoạn hát: [hợp âm]} — mỗi hợp âm: dict(bac, tri, mau, o, a, b, gd) — bac so với chủ âm."""
    if not song.get('giong') and song['name'] in GIONG_SUY:
        song = dict(song, giong=GIONG_SUY[song['name']])
    chu, thu, meta, segs = H.doan_hat(song)
    ns, _, _ = S.doc(song)
    o_cua = lambda t: max((b for b, st in meta['bar_start'].items() if st <= t + EPS), default=0)  # noqa: E731
    ra = collections.OrderedDict()
    for x in segs:
        dm = L.not_dem(ns, x['a'], x['b'])
        tong = sum(d for _, d in dm) or 1
        w = collections.Counter()
        for n, d in dm:
            w[(n['midi'] - x['goc']) % 12] += d
        mau = {MAU_IV[iv] for iv, v in w.items() if iv in MAU_IV and v >= 0.08 * tong}
        if x['q'] == 'dim':
            mau.discard('#11')
        gd = collections.Counter()
        for m, d in L.giai_dieu(ns, x['a'], x['b']):
            gd[(m - chu) % 12] += d
        ra.setdefault(x['doan'], []).append(dict(bac=x['bac'], tri=TRI.get(x['q'], x['q']), mau=mau, o=o_cua(x['a']),
                                                 a=x['a'], b=x['b'], gd=dict(gd)))
    return chu, thu, ra, ns


def gop(ds, khoa=lambda h: (h['bac'], h['tri'])):
    """Gộp hợp âm liền nhau cùng gốc + loại: [(khoá, [phần tử])]."""
    ra = []
    for h in ds:
        if ra and ra[-1][0] == khoa(h):
            ra[-1][1].append(h)
        else:
            ra.append((khoa(h), [h]))
    return ra


# ---------------- Căn hàng ----------------

def diem(a, b):
    if a[0] == b[0]:
        return 3.0 if a[1] == b[1] else 1.0
    return -2.0


GAP_THAY, GAP_BAN = -1.5, -1.0


def can(thay, ban):
    """Căn bán toàn cục: `thay` căn trọn, `ban` bỏ đầu bỏ cuối tự do. → (điểm, [(i thầy | None, j bản | None)])."""
    n, m = len(thay), len(ban)
    D = [[0.0] * (m + 1) for _ in range(n + 1)]
    T = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        D[i][0], T[i][0] = D[i - 1][0] + GAP_THAY, 1
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = [(D[i - 1][j - 1] + diem(thay[i - 1], ban[j - 1]), 0), (D[i - 1][j] + GAP_THAY, 1), (D[i][j - 1] + GAP_BAN, 2)]
            D[i][j], T[i][j] = max(c)
    j = max(range(m + 1), key=lambda k: D[n][k])
    best, i, cap = D[n][j], n, []
    while i > 0:
        t = T[i][j]
        if j == 0 or t == 1:
            cap.append((i - 1, None))
            i -= 1
        elif t == 0:
            cap.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        else:
            cap.append((None, j - 1))
            j -= 1
    return best, cap[::-1]


def chuoi_ban(ban, chu_thay, dich):
    """Hợp âm của một bản → [(bac, tri, mau, âm tiết thứ mấy của bài)] đã dịch `dich` nửa cung, bậc theo chủ âm của sheet."""
    ra, truoc = [], 0
    for so_am, hs in ban['dong']:
        for vi_tri, ten in hs:
            k = doc_ky_hieu(ten)
            if k:
                ra.append(((k[0] + dich - chu_thay) % 12, k[1], k[2], truoc + vi_tri))
        truoc += so_am
    return ra


def phan_tich(song, ky_ban):
    chu, thu, doan, ns = doan_cua_bai(song)
    # Đoạn CHUYỂN GIỌNG ('*_mod') bỏ: kho không ghi giọng mới của đoạn, tính bậc theo giọng cũ thì ra ♭II, ♯IV vô nghĩa (Cà Pháo).
    cac_doan = {k: gop(v) for k, v in doan.items() if not k.endswith('_mod')}
    # Dịch giọng từng bản: thử 12, lấy tổng điểm căn các đoạn cao nhất
    ban_dich, da_co = [], set()
    for b in ky_ban['ban']:
        thu_12 = []
        for d in range(12):
            seq = gop(chuoi_ban(b, chu, d), khoa=lambda h: (h[0], h[1]))
            ks = [k for k, _ in seq]
            thu_12.append((sum(can([k for k, _ in g], ks)[0] for g in cac_doan.values()), d, seq))
        diem_tot, d, seq = max(thu_12)
        khoa = tuple(k for k, _ in seq)
        if khoa in da_co:
            continue
        da_co.add(khoa)
        ban_dich.append(dict(url=b['url'], dich=d, seq=seq, diem=diem_tot))
    mac_dinh = ban_dich[0]
    hang = []
    for ten_doan, g in cac_doan.items():
        ks = [k for k, _ in g]
        _, cap = can(ks, [k for k, _ in mac_dinh['seq']])
        khop_moi = [can(ks, [k for k, _ in bd['seq']])[1] for bd in ban_dich]
        for i, j in cap:
            if i is None:
                continue
            k_thay, phan = g[i]
            k_ban = mac_dinh['seq'][j] if j is not None else None
            loai = 'chen' if k_ban is None else 'giong' if k_ban[0] == k_thay else 'doi' if k_ban[0][0] == k_thay[0] else 'thay'
            co_ban = sum(1 for bd, cp in zip(ban_dich, khop_moi)
                         if any(ii == i and jj is not None and bd['seq'][jj][0] == k_thay for ii, jj in cp))
            mau_thay = set().union(*(h['mau'] for h in phan))
            mau_ban = set().union(*(x[2] for x in k_ban[1])) if k_ban else set()
            mau_thay0 = set().union(*(h['mau'] for h in phan))
            if loai in ('doi', 'thay') and loi(k_thay[0], k_thay[1], mau_thay0) == loi(k_ban[0][0], k_ban[0][1], mau_ban):
                loai = 'cung_not'
            hang.append(dict(doan=ten_doan, o=phan[0]['o'], bac=k_thay[0], tri=k_thay[1], mau=mau_thay, loai=loai, j=j,
                             ban=(k_ban[0] if k_ban else None), mau_ban=mau_ban, co_ban=co_ban, so_ban=len(ban_dich),
                             gd=sum((collections.Counter(h['gd']) for h in phan), collections.Counter())))
    return dict(chu=chu, thu=thu, ban=ban_dich, hang=hang)


BA_IV = {'M': (0, 4, 7), 'm': (0, 3, 7), 'dim': (0, 3, 6), 'aug': (0, 4, 8), 'sus': (0, 5, 7)}
MAU_TU = {'7': 10, 'maj7': 11, '9': 2, '6': 9, 'b9': 1, 'b13': 8, '#11': 6}


def not_hop(bac, tri, mau):
    """Lớp cao độ (so với chủ âm) của một hợp âm — để so với giai điệu."""
    s = {(bac + i) % 12 for i in BA_IV.get(tri, (0, 4, 7))}
    if tri == 'dim' and '7' in mau:
        s.add((bac + 10) % 12)
    return s | {(bac + MAU_TU[m]) % 12 for m in mau if m in MAU_TU}


def loi(bac, tri, mau):
    """LÕI bốn nốt của hợp âm: ba nốt + 7 / maj7 / 6 nếu có — để nhận "cùng nốt, khác tên / khác bass"."""
    return frozenset(not_hop(bac, tri, {m for m in mau if m in ('7', 'maj7', '6')}))


def hop_giai_dieu(gd, nots):
    """Phần thời lượng giai điệu rơi vào nốt của hợp âm."""
    tong = sum(gd.values())
    return sum(v for p, v in gd.items() if p in nots) / tong if tong else None


def tong_ket(ra):
    """Gom theo (giọng, la mã thầy): bao nhiêu chỗ giống bản phổ biến, khớp ≥ 1 bản, màu thầy thêm; đổi gốc thì giai điệu cho phép
    hợp âm của bản không; chỗ thầy đổi hợp âm giữa các lần lặp."""
    nhom = collections.defaultdict(collections.Counter)
    thay_cap = collections.defaultdict(collections.Counter)
    lap = collections.Counter()
    for ten, r in ra.items():
        g = 'thu' if r['thu'] else 'truong'
        for h in r['hang']:
            k = (g, la_ma(h['bac'], h['tri']))
            c = nhom[k]
            c['n'] += 1
            c['giong' if h['loai'] == 'giong' else h['loai']] += 1
            c['co_ban'] += h['co_ban'] > 0
            c['bai:' + ten] += 1
            for m in h['mau']:
                c['mau:' + m] += 1
                c[('mau_ban_co:' if m in h['mau_ban'] else 'mau_rieng:') + m] += 1
            if h['loai'] == 'thay' and h['ban']:
                cap = (g, la_ma(h['bac'], h['tri']), la_ma(*h['ban']))
                t = thay_cap[cap]
                t['n'] += 1
                t['bai:' + ten] += 1
                t['khong_ban_nao'] += h['co_ban'] == 0
                hg_thay = hop_giai_dieu(h['gd'], not_hop(h['bac'], h['tri'], h['mau']))
                hg_ban = hop_giai_dieu(h['gd'], not_hop(h['ban'][0], h['ban'][1], h['mau_ban']))
                if hg_thay is not None and hg_ban is not None:
                    t['gd_cho_ban'] += hg_ban >= 0.5
                    t['gd_do'] += 1
        # thầy đổi hợp âm giữa các lần lặp: các hợp âm của nhiều đoạn căn vào CÙNG một chỗ của bản mặc định
        cho = collections.defaultdict(set)
        for h in r['hang']:
            if h.get('j') is not None:
                cho[h['j']].add((h['doan'], h['bac'], h['tri']))
        for j, ds in cho.items():
            if len({d for d, _, _ in ds}) >= 2:
                lap['cho_lap'] += 1
                lap['doi_khi_lap'] += len({(b, t) for _, b, t in ds}) >= 2
    return nhom, thay_cap, lap


def la_ma(bac, tri, thu=None):
    s = LA_MA[bac]
    if tri in ('m', 'dim'):
        s = s.replace('I', 'i').replace('V', 'v')
    return s + {'dim': '°', 'aug': '+', 'sus': 'sus'}.get(tri, '')


def chay(teacher='linh-nhi'):
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    ky = json.load(open(DU_LIEU, encoding='utf-8'))
    ra = {}
    for s in corp['songs']:
        if s.get('teacher') != teacher or s['name'] not in ky:
            continue
        ra[S.TEN_DEP.get(s['name'], s['name'])] = phan_tich(s, ky[s['name']]) | {'tac_gia': ky[s['name']]['tac_gia']}
    return ra


def in_ra(ra, chi_tiet=False):
    tong = collections.Counter()
    for ten, r in ra.items():
        c = collections.Counter(h['loai'] for h in r['hang'])
        tong.update(c)
        n = sum(c.values())
        it_nhat = sum(1 for h in r['hang'] if h['co_ban'] > 0)
        print(f"{ten:22s} {', '.join(r['tac_gia']):18s} bản {len(r['ban'])} (dịch {[b['dich'] for b in r['ban']]}) · {n} hợp âm: "
              f"giống {c['giong']} · cùng nốt khác bass {c['cung_not']} · đổi loại {c['doi']} · đổi gốc {c['thay']} · chèn {c['chen']}"
              f" · khớp ≥1 bản {it_nhat}")
        if chi_tiet:
            for h in r['hang']:
                if h['loai'] != 'giong':
                    b = la_ma(*h['ban']) if h['ban'] else '—'
                    print(f"     {h['doan']:10s} ô{h['o']:<4d} chị {la_ma(h['bac'], h['tri']):6s} bản {b:6s} {h['loai']:5s} "
                          f"khớp {h['co_ban']}/{h['so_ban']} bản · màu chị {sorted(h['mau'])} bản {sorted(h['mau_ban'])}")
    print('TỔNG', dict(tong))
    nhom, thay_cap, lap = tong_ket(ra)
    print('\n— Theo hợp âm của thầy (≥ 4 chỗ): giống bản phổ biến · khớp ≥ 1 bản · màu của thầy mà bản phổ biến KHÔNG ghi ở chỗ ấy')
    for k in sorted(nhom, key=lambda k: (k[0], -nhom[k]['n'])):
        c = nhom[k]
        if c['n'] < 4:
            continue
        bai = sum(1 for z in c if z.startswith('bai:'))
        rieng = ' '.join(f"{z[10:]}={v}/{c['mau:' + z[10:]]}" for z, v in c.most_common() if z.startswith('mau_rieng:'))
        print(f"  {k[0]:6s} {k[1]:6s} {c['n']:3d} chỗ {bai} bài · giống {c['giong']} · cùng nốt {c['cung_not']} · đổi loại {c['doi']}"
              f" · đổi gốc {c['thay']} · chèn {c['chen']} · khớp ≥1 bản {c['co_ban']} · màu bản không ghi {rieng}")
    print('\n— Chỗ thầy ĐỔI GỐC (≥ 2 chỗ): thầy ← bản · không bản nào giống · giai điệu cho phép hợp âm của bản')
    for k in sorted(thay_cap, key=lambda k: -thay_cap[k]['n']):
        t = thay_cap[k]
        if t['n'] < 2:
            continue
        bai = sum(1 for z in t if z.startswith('bai:'))
        print(f"  {k[0]:6s} chị {k[1]:6s} ← bản {k[2]:6s} {t['n']:2d} chỗ {bai} bài · không bản nào {t['khong_ban_nao']}"
              f" · giai điệu hợp hợp âm của bản {t['gd_cho_ban']}/{t['gd_do']}")
    print('\n— Lặp đoạn:', dict(lap))


if __name__ == '__main__' and '--kiem' not in sys.argv:
    in_ra(chay(sys.argv[sys.argv.index('--thay') + 1] if '--thay' in sys.argv else 'linh-nhi'), chi_tiet='--chi-tiet' in sys.argv)


def kiem(ra):
    """Các số trích vào app (`giaiThich.ts`) và md Linh Nhi mục 13l — đổi số đo thì sửa cả hai nơi."""
    tong = collections.Counter(h['loai'] for r in ra.values() for h in r['hang'])
    assert (sum(tong.values()), tong['giong'], tong['chen'], tong['thay'], tong['doi']) == (616, 422, 96, 67, 31), dict(tong)
    assert sorted(set(a for r in ra.values() for a in r['tac_gia'])) == sorted(
        ['Lam Phương', 'Đức Huy', 'Hoài Linh', 'Trịnh Công Sơn', 'Hoàng Thi Thơ', 'Tuấn Khanh', 'Trần Thiện Thanh', 'Thanh Sơn'])
    nhom, thay_cap, lap = tong_ket(ra)
    g = lambda giong, lm: nhom[(giong, lm)]  # noqa: E731
    assert (g('thu', 'i')['n'], g('thu', 'i')['giong'], g('thu', 'i')['mau_rieng:9'], g('thu', 'i')['mau:9'],
            g('thu', 'i')['mau_rieng:7'], g('thu', 'i')['mau:7']) == (100, 93, 40, 40, 22, 22)
    assert (g('thu', 'iv')['n'], g('thu', 'iv')['giong'], g('thu', 'iv')['mau_rieng:9'], g('thu', 'iv')['mau:9']) == (52, 34, 23, 23)
    assert (g('thu', 'bVI')['n'], g('thu', 'bVI')['giong'], g('thu', 'bVI')['mau_rieng:maj7'], g('thu', 'bVI')['mau:maj7']) == (42, 21, 19, 19)
    v = g('thu', 'V')
    assert (v['n'], v['giong'], v['mau_rieng:b9'] + v['mau_rieng:b13'], v['mau:b9'] + v['mau:b13'], v['mau_ban_co:7'], v['mau:7']) == (38, 33, 8, 8, 16, 20)
    assert (g('thu', 'ii°')['n'], g('thu', 'ii°')['giong'], g('thu', 'ii°')['co_ban'], sum(1 for z in g('thu', 'ii°') if z.startswith('bai:'))) == (12, 0, 1, 4)
    assert (g('thu', 'I')['n'], g('thu', 'I')['giong']) == (10, 8)
    assert (g('thu', 'bVII')['n'], g('thu', 'bVII')['giong'], g('thu', 'bVII')['chen']) == (28, 8, 11)
    assert (g('thu', 'bIII')['n'], g('thu', 'bIII')['giong'], g('thu', 'bIII')['chen']) == (42, 26, 12)
    assert (g('truong', 'I')['n'], g('truong', 'I')['giong'], g('truong', 'I')['mau_rieng:maj7'], g('truong', 'I')['mau:maj7'],
            g('truong', 'I')['mau_rieng:9'], g('truong', 'I')['mau:9']) == (58, 51, 13, 13, 14, 14)
    assert (g('truong', 'ii')['n'], g('truong', 'ii')['giong'], g('truong', 'ii')['mau_rieng:7'], g('truong', 'ii')['mau:7']) == (30, 28, 11, 11)
    assert (g('truong', 'V')['n'], g('truong', 'V')['giong']) == (41, 37)
    assert (g('truong', 'II')['n'], g('truong', 'II')['giong'], g('truong', 'II')['doi']) == (12, 3, 5)
    assert thay_cap[('thu', 'vi°', 'bIII')]['n'] == 4 and thay_cap[('truong', '#iv°', 'V')]['khong_ban_nao'] == 3
    assert (lap['cho_lap'], lap['doi_khi_lap']) == (152, 45)
    print('kiem: dung het')


# Cà Pháo — soát tay từng nốt (7/10/2026, in hai tay từng ô) 41/60 chỗ máy báo khác bản phổ biến. Khóa: (bài, ô, hợp âm anh theo máy,
# hợp âm của bản). 'that' = sheet bấm đúng như máy đọc — anh đổi thật (co_ban chia ra "chỉ anh bấm" / "có trong bản khác");
# 'doc_lech' = máy đọc lệch ký hiệu ("Am" mà tay trái bấm Fa ở phách 1 = Fmaj7; "Csus4/G" = G7sus4; ký hiệu đặt ngược thứ tự);
# 'ban_lech' = hợp âm của bản chỏi với giai điệu (giai điệu có Đô♯ chỗ bản ghi C). 19 chỗ còn lại chưa soát.
_DE, _CBG, _CT, _NHQ, _HK = 'Để Em Rời Xa', 'Chưa Bao Giờ (Trung Quân)', 'Chúng Ta Không Thuộc Về Nhau', 'Người hãy quên em đi', 'Hồng Kông 1'
SOAT_TAY_CA_PHAO = {
    **{(b, o, 'iv', 'bVI'): 'that' for b, o in [(_DE, 10), (_DE, 12), (_DE, 38), (_DE, 40), (_CBG, 55), (_CT, 21), (_CT, 53), (_CT, 61)]},
    **{(_CT, o, 'v', 'bVII'): 'that' for o in (12, 20, 22, 28, 52, 54, 60)},
    **{(b, o, 'I', 'i'): 'that' for b, o in [(_DE, 11), (_DE, 39), (_CBG, 17), (_CBG, 54), (_CT, 64)]},
    **{(_NHQ, o, 'II', 'ii°'): 'that' for o in (23, 36, 55)},
    (_DE, 11, 'v', 'V'): 'that',
    **{('Ngay mai em di', o, 'II', 'I'): 'that' for o in (25, 61)},
    **{(_HK, o, 'vi', 'IV'): 'doc_lech' for o in (26, 33, 82, 90)},
    (_HK, 41, 'vi', 'iii'): 'doc_lech',
    **{(_HK, o, 'Isus', ban): 'doc_lech' for o, ban in [(30, 'iii'), (40, 'IV'), (45, 'ii'), (99, 'I')]},
    (_DE, 47, 'v', 'V'): 'doc_lech',
    **{('Co Em Cho', o, 'V', 'vi'): 'doc_lech' for o in (19, 27)},
    **{(_NHQ, o, 'V', 'bVII'): 'ban_lech' for o in (28, 68, 83)},
}


def kiem_ca_phao(ra):
    """Các số trích vào app (`giaiThich.ts`, khối Cà Pháo) và md Cà Pháo mục "Ai chọn" — đổi số đo thì sửa cả hai nơi."""
    tong = collections.Counter(h['loai'] for r in ra.values() for h in r['hang'])
    assert (sum(tong.values()), tong['giong'], tong['chen'], tong['thay'], tong['doi']) == (400, 309, 31, 39, 21), dict(tong)
    assert sorted(set(a for r in ra.values() for a in r['tac_gia'])) == sorted(
        ['Nguyễn Trọng Tài', 'Khắc Hưng', 'Kai Đinh', 'Thái Thịnh', 'FB Boiz', 'Tiên Tiên', 'Sơn Tùng M-TP'])
    nhom, thay_cap, lap = tong_ket(ra)
    g = lambda giong, lm: nhom[(giong, lm)]  # noqa: E731
    mau = lambda x, *ks: tuple(v for k in ks for v in (x[f'mau_rieng:{k}'], x[f'mau:{k}']))  # noqa: E731
    assert (g('thu', 'i')['n'], g('thu', 'i')['giong'], *mau(g('thu', 'i'), '7', '9')) == (55, 53, 28, 28, 24, 24)
    assert (g('thu', 'bVI')['n'], g('thu', 'bVI')['giong'], *mau(g('thu', 'bVI'), 'maj7', '9', '6', '#11')) == (45, 45, 23, 23, 19, 19, 14, 14, 8, 8)
    assert (g('thu', 'bVII')['n'], g('thu', 'bVII')['giong'], *mau(g('thu', 'bVII'), '7', '9')) == (35, 35, 13, 13, 11, 11)
    assert (g('thu', 'iv')['n'], g('thu', 'iv')['giong']) == (27, 17)
    v = g('thu', 'V')
    assert (v['n'], v['giong'], *mau(v, '9', 'b13'), v['mau_ban_co:7'], v['mau:7']) == (20, 15, 7, 7, 7, 7, 7, 13)
    assert (g('thu', 'bIII')['n'], g('thu', 'bIII')['giong'], *mau(g('thu', 'bIII'), 'maj7')) == (11, 8, 6, 6)
    assert (g('truong', 'I')['n'], g('truong', 'I')['giong'], *mau(g('truong', 'I'), '9', 'maj7', '7')) == (33, 29, 15, 15, 5, 5, 10, 12)
    assert (g('truong', 'V')['n'], g('truong', 'V')['giong'], *mau(g('truong', 'V'), '9', '6')) == (32, 27, 12, 12, 6, 6)
    assert (g('truong', 'IV')['n'], g('truong', 'IV')['giong'], g('truong', 'IV')['mau_ban_co:maj7'], g('truong', 'IV')['mau:maj7']) == (20, 20, 5, 8)
    assert (g('truong', 'ii')['n'], g('truong', 'ii')['giong'], g('truong', 'ii')['mau_ban_co:7'], g('truong', 'ii')['mau:7']) == (17, 17, 7, 11)
    assert (g('truong', 'iii')['n'], g('truong', 'iii')['giong'], *mau(g('truong', 'iii'), '7')) == (16, 14, 12, 12)
    assert (g('truong', 'vi')['n'], g('truong', 'vi')['giong']) == (18, 12)
    assert (thay_cap[('thu', 'iv', 'bVI')]['n'], thay_cap[('thu', 'iv', 'bVI')]['khong_ban_nao']) == (8, 8)
    assert (thay_cap[('thu', 'v', 'bVII')]['n'], thay_cap[('thu', 'v', 'bVII')]['khong_ban_nao']) == (7, 0)
    assert (thay_cap[('truong', 'II', 'I')]['n'], thay_cap[('truong', 'II', 'I')]['khong_ban_nao']) == (2, 2)
    assert (lap['cho_lap'], lap['doi_khi_lap']) == (105, 27)
    # Soát tay: mọi chỗ đã ghi phải còn trong kết quả máy (máy đọc đổi thì phải soát lại), và chia đúng như lời trên thẻ.
    hang = {(bai, h['o'], la_ma(h['bac'], h['tri']), la_ma(*h['ban'])): h for bai, r in ra.items() for h in r['hang']
            if h['loai'] in ('thay', 'doi') and h['ban']}
    assert sum(1 for h in hang.values()) == 60, len(hang)
    thieu = [k for k in SOAT_TAY_CA_PHAO if k not in hang]
    assert not thieu, thieu
    loai = collections.Counter(
        ('chi_anh' if hang[k]['co_ban'] == 0 else 'ban_khac') if v == 'that' else v for k, v in SOAT_TAY_CA_PHAO.items())
    assert (loai['chi_anh'], loai['ban_khac'], loai['doc_lech'], loai['ban_lech']) == (16, 10, 12, 3), dict(loai)
    truong = collections.Counter(SOAT_TAY_CA_PHAO[k] for k in SOAT_TAY_CA_PHAO if not ra[k[0]]['thu'])
    assert (sum(1 for k in hang if not ra[k[0]]['thu']), truong['doc_lech'], truong['that']) == (22, 11, 2)
    print('kiem ca-phao: dung het')


if __name__ == '__main__' and '--kiem' in sys.argv:
    kiem(chay())
    kiem_ca_phao(chay('ca-phao'))
