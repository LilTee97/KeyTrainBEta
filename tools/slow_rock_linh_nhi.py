# -*- coding: utf-8 -*-
"""Cau solo Linh Nhi (dao / giang / ket) — do va sinh bang nguon cho bo soan Slow Rock.

    python tools/slow_rock_linh_nhi.py --do            # in so do, tach truong / thu
    python tools/slow_rock_linh_nhi.py --sinh > src/reharm/style/slowRockLinhNhiNguon.ts

MOI BAI DO TREN DUNG LUOI CUA NO — day la cho da sap mot lan:
  * La Thu Tran The GHI 4/4 nhung nhac la 12/8: bass roi cung pha chu ky 6 moc don o
    75/98 lan (xem SO-TAY 24/9/2026). O o day la 6 moc don = 3 not den, bat dau o
    not den thu 1 (pha 2 moc don).
  * Mot Coi Di Ve ghi DUNG 6/8 (bass dau o 72/113 lan): o sheet = o 6 moc don.
  * Bolero ghi 4/4: o sheet. Noi buon hoa phuong ghi o 8 phach -> tach hai o 4.

Chat hop am doc bang don_hop_am.tap_not / chu (da va bay degree, kind khong text,
bass). O khong co ky hieu thi dien bang hop am DANG VANG — do so vong theo tung o.
Not doc bang mxl.notes (da va bay <chord> va tie); bo not hoa my (dur 0), bo duoi not noi.
"""
from __future__ import annotations

import collections
import json
import os
import sys

BRAIN = os.environ.get('PIANOBRAIN_ROOT') or os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'PianoBrain'))
sys.path.insert(0, os.path.join(BRAIN, 'tools', 'sheet'))

import bac_not as B  # noqa: E402
import don_hop_am  # noqa: E402
import mxl  # noqa: E402

DOAN = ('intro', 'interlude', 'outro')
TEN_BAC = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7']
LA_MA = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII']
TEN_DEP = {'La Thư Tran The': 'Lá Thư Trần Thế', 'Mot Coi Di Ve': 'Một Cõi Đi Về',
           'Biển Tình': 'Biển Tình', 'Dung Xa Em Dem Nay': 'Đừng Xa Em Đêm Nay',
           'Duong Xua Loi Cu': 'Đường Xưa Lối Cũ', 'Mua xuan dau tien': 'Mùa Xuân Đầu Tiên',
           'Rung La Thap': 'Rừng Lá Thấp', 'Noi buon hoa phuong': 'Nỗi Buồn Hoa Phượng'}
# Luoi o: (so not den moi o, pha — not den dau tien cua o 0)
LUOI = {'La Thư Tran The': (3.0, 1.0), 'Mot Coi Di Ve': (3.0, 0.0)}
EPS = 1e-6

# HOP AM HAI BAI SLOW ROCK — DOC BANG TAY THEO NOT TAY TRAI, KHONG theo ky hieu sheet.
# Ky hieu tren hai sheet nay khop not qua it: goc dung 6/12 (La Thu), 4/13 (Mot Coi) —
# thua va lech (Mot Coi dao o1 ghi Gm, tay trai C3/C4-G3-C4). Bolero thi ky hieu dang tin
# (Bien Tinh 24/24, Duong Xua 15/17) nen giu ky hieu. Moi o: (phach trong o, goc so voi
# chu am, hau to, bass so voi chu am | None). Bang chung = not tay trai o do.
HOP_AM_TAY = {
    ('La Thư Tran The', 'intro'): [
        [(0, 0, 'm', None)],                    # c0  D4 ngan tu o lay da
        [(0, 10, '', None)],                    # c1  C4 ngan
        [(0, 0, 'm', None)],                    # c2  D4 · D4
        [(0, 3, '', None), (2.0, 5, 'm', None)],  # c3  F3 C4 | G3 tu moc don 4
        [(0, 5, 'm', None)],                    # c4  D4 tren G3 con ngan
        [(0, 8, '', None)],                     # c5  Bb3 D4
        [(0, 2, 'dim', None)],                  # c6  E3 G3 Bb3
        [(0, 7, '7', None)],                    # c7  A2/A3 · G2/G3 · E2/E3; tay phai C#5 E5 A5
    ],
    ('La Thư Tran The', 'interlude'): [
        [(0, 0, 'm', None)],                    # c73 D4 ngan
        [(0, 10, '', None)],                    # c74 C4 — ky hieu thieu, keo nham Dm
        [(0, 0, 'm', None)],                    # c75 D4 · D4
        [(0, 3, '', None)],                     # c76 F3 C4 (khong co G3 nhu c3)
        [(0, 5, 'm', None)],                    # c77 G3 D4
        [(0, 8, '', None)],                     # c78 Bb3 D4
        [(0, 2, 'dim', None)],                  # c79 E3 G3 Bb3
        [(0, 7, '7', None)],                    # c80 A2/A3 · G2/G3 · E2/E3
    ],
    ('La Thư Tran The', 'outro'): [
        [(0, 0, 'sus4', None)],                 # c140 D3 G3 A3 D4 G4 — khong co bac ba
        [(0, 0, 'sus4', None)],                 # c141 D4 ngan; tay phai G4 A4 D5
        [(0, 0, '', None)],                     # c142 F#4/G4 — bac ba TRUONG vao
        [(0, 0, '', None)],                     # c143 F#4; tay phai D5 F#5 A5 D6 F#6 A6
    ],
    ('Mot Coi Di Ve', 'intro'): [
        [(0, 0, 'm', None)], [(0, 5, 'm', None)], [(0, 8, '', None)], [(0, 7, '7', None)],
        [(0, 0, 'm', None)], [(0, 8, '', None)], [(0, 5, 'm', None)], [(0, 2, 'm7b5', None)],
        [(0, 7, '7', None)], [(0, 7, '', None)],
        # o0 G3 · o1 C3/C4 G3 C4 · o2 Eb3 Bb3 · o3 D3/D4 A3 (tay phai D F# A C) · o4 G2 D3 G3
        # o5 Eb3 Bb2 · o6 C3 G3 · o7 A2 Eb3 G3 · o8 D3 A3 (tay phai D F# A C) · o9 A3, tay phai D F# A
    ],
    ('Mot Coi Di Ve', 'interlude'): [
        [(0, 0, 'm', None)], [(0, 5, 'm', None)], [(0, 8, '', None)], [(0, 7, '7', None)],
        [(0, 0, 'm', None)], [(0, 8, '', None)], [(0, 5, 'm', None)], [(0, 2, 'm7b5', None)],
        [(0, 7, '7', None)], [(0, 7, '', None)],
        # o4 sheet ghi G (Picardy) nhung tay phai co Bb5 Bb4 — van la Gm
    ],
    ('Mot Coi Di Ve', 'outro'): [
        [(0, 0, 'm', 3)],                       # o0 Bb2/Bb3; tay phai G Bb D A
        [(0, 8, 'maj7', None)],                 # o1 Eb3 Bb3; tay phai Eb G Bb D (A)
        [(0, 5, 'm', None)],                    # o2 C3 G3 C4
        [(0, 2, 'm7b5', None)],                 # o3 A2 Eb3 G3 C4
        [(0, 7, '7', None)],                    # o4 D2/D3 A2 D3 F#3 A3 C4
        [(0, 7, '7', 5)],                       # o5 C4 A3 F#4
        [(0, 0, 'm', None)], [(0, 0, 'm', None)], [(0, 0, 'm', None)],  # o6-o8 Bb D G
    ],
}


def slug(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return '-'.join(''.join(c if c.isalnum() else ' ' for c in s).split())


def doc(song):
    path = B.tim_file(song)
    root = mxl.load(path)
    ns, meta = mxl.notes(root)
    starts = meta['bar_start']
    # ky hieu hop am, moc not den tuyet doi
    hops, div = [], 1
    part = root.findall('part')[0]
    for m in part.findall('measure'):
        at = starts[int(m.get('number'))]
        for el in m:
            if el.tag == 'attributes' and el.findtext('divisions'):
                div = int(el.findtext('divisions'))
            elif el.tag == 'backup':
                at -= float(el.findtext('duration') or 0) / div
            elif el.tag == 'forward':
                at += float(el.findtext('duration') or 0) / div
            elif el.tag == 'harmony':
                if not don_hop_am.la_hoi(el) and el.find('root') is not None:
                    off = float(el.findtext('offset') or 0) / div
                    hops.append((round(at + off, 4), el))
            elif el.tag == 'note' and el.find('chord') is None and el.find('grace') is None:
                at += float(el.findtext('duration') or 0) / div
    hops.sort(key=lambda h: h[0])
    return ns, meta, hops


def hop_am(el, chu_am):
    """(goc so voi chu am, hau to chat, bass so voi chu am hoac None, nhom chat)."""
    rp = don_hop_am._pc(el.find('root'), 'root')
    ten = don_hop_am.chu(el)
    # hau to = phan sau ten goc, bo phan /bass
    goc_ten = el.findtext('root/root-step') + {'-1': 'b', '1': '#'}.get((el.findtext('root/root-alter') or '').strip(), '')
    hau = ten[len(goc_ten):].split('/')[0]
    bass = el.find('bass')
    bpc = don_hop_am._pc(bass, 'bass') if bass is not None else None
    tap = don_hop_am.tap_not(el, gom_bass=False)
    rel = {(p - rp) % 12 for p in tap}
    if 3 in rel and 6 in rel and 7 not in rel:
        nhom = 'dim'
    elif 3 in rel:
        nhom = 'm'
    elif 4 in rel and 10 in rel:
        nhom = '7'
    elif 4 in rel and 8 in rel and 7 not in rel:
        nhom = 'aug'
    elif 4 in rel:
        nhom = 'M'
    else:
        nhom = 'sus'
    return (rp - chu_am) % 12, hau, (None if bpc is None else (bpc - chu_am) % 12), nhom, sorted((p - chu_am) % 12 for p in tap)


def la_ma(goc, nhom):
    s = LA_MA[goc]
    if nhom in ('m', 'dim'):
        s = s.replace('I', 'i').replace('V', 'v')
    return s + ('°' if nhom == 'dim' else '7' if nhom == '7' else '+' if nhom == 'aug' else 'sus' if nhom == 'sus' else '')


def o_cua_doan(song, meta, doan):
    """Danh sach (dau, dai) cac o cua doan, theo luoi dung cua bai."""
    a, b = song['sections'][doan]['bars']
    starts, bl = meta['bar_start'], meta['barlens']
    t0, t1 = starts[a], starts[b] + bl[b]
    if song['name'] in LUOI:
        dai, pha = LUOI[song['name']]
        k = int((t0 - pha) // dai) - 1
        ra = []
        while True:
            dau = pha + k * dai
            if dau + dai / 2 >= t1:
                break
            if dau + dai / 2 >= t0:
                ra.append((dau, dai))
            k += 1
        return ra
    ra = []
    for o in range(a, b + 1):
        if bl[o] == 8.0:
            ra += [(starts[o], 4.0), (starts[o] + 4, 4.0)]
        else:
            ra.append((starts[o], bl[o]))
    return ra


def go(ns, hand, t0, t1):
    """Cu go cua mot tay trong [t0,t1): [(phach trong o, truong do, [midi...])].

    Not bat dau TRUOC t0 ma con ngan qua t0 thi dua vao dau o (chi o dau doan dung).
    """
    nhom = collections.defaultdict(list)
    for n in ns:
        if n['hand'] != hand or n['tie_stop'] or n['dur'] <= EPS:
            continue
        if t0 - EPS <= n['beat'] < t1 - EPS:
            nhom[round(n['beat'] - t0, 3)].append(n)
    return [(p, round(max(x['dur'] for x in v), 3), sorted(x['midi'] for x in v)) for p, v in sorted(nhom.items())]


def keo_vao(ns, hand, t0):
    """Not con ngan qua dau doan (bat dau truoc t0)."""
    v = [n for n in ns if n['hand'] == hand and not n['tie_stop'] and n['dur'] > EPS
         and n['beat'] < t0 - EPS and n['beat'] + n['dur'] > t0 + 0.25]
    if not v:
        return []
    return [(0.0, round(max(n['beat'] + n['dur'] - t0 for n in v), 3), sorted(n['midi'] for n in v))]


def doan_bai(song, doan):
    if doan not in (song.get('sections') or {}):
        return None
    g = B.giong_ra_so(song.get('giong'))
    chu_am, the = g
    ns, meta, hops = doc(song)
    cells = o_cua_doan(song, meta, doan)
    out = []
    for i, (t0, dai) in enumerate(cells):
        t1 = t0 + dai
        truoc = [h for h in hops if h[0] < t0 + EPS]
        trong = [h for h in hops if t0 + EPS <= h[0] < t1 - EPS]
        hs = []
        if truoc:
            hs.append((0.0,) + hop_am(truoc[-1][1], chu_am) + (truoc[-1][0] < t0 - EPS,))
        for at, el in trong:
            hs.append((round(at - t0, 3),) + hop_am(el, chu_am) + (False,))
        # bo ky hieu trung lien tiep
        gon = []
        for h in hs:
            if gon and gon[-1][1:6] == h[1:6]:
                continue
            gon.append(h)
        r = go(ns, 1, t0, t1)
        l = go(ns, 2, t0, t1)
        if i == 0:
            r = keo_vao(ns, 1, t0) + r
            l = keo_vao(ns, 2, t0) + l
        # h: (phach, goc so voi chu am, hau to, bass | None)
        out.append({'dai': dai, 'h': [(h[0], h[1], h[2], h[3]) for h in gon], 'r': r, 'l': l})
    tay = HOP_AM_TAY.get((song['name'], doan))
    if doan == 'outro':
        while out and not out[-1]['r'] and not out[-1]['l']:
            out.pop()
    if tay is not None:
        assert len(tay) == len(out), (song['name'], doan, len(tay), len(out))
        for o, h in zip(out, tay):
            o['h'] = [tuple(x) for x in h]
    return {'song': song, 'doan': doan, 'chu': chu_am, 'thu': the == 'thu', 'o': out,
            'dieu': song['genre'], 'oPhach': cells[0][1] if cells else 4.0}


def tat_ca():
    corp = json.load(open(os.path.join(BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    ra = []
    for s in corp['songs']:
        if s.get('teacher') != 'linh-nhi':
            continue
        for d in DOAN:
            x = doan_bai(s, d)
            if x:
                ra.append(x)
    return ra


# ---------------------------------------------------------------- doc hop am tu not
MAU = {  # chat -> bac so voi goc
    '': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'm7': (0, 3, 7, 10),
    'dim': (0, 3, 6), 'm7b5': (0, 3, 6, 10), 'sus4': (0, 5, 7), 'aug': (0, 4, 8),
}
NHOM_MAU = {'': 'M', 'm': 'm', '7': '7', 'm7': 'm', 'dim': 'dim', 'm7b5': 'dim', 'sus4': 'sus', 'aug': 'aug'}


def vang(ns, a, b):
    """Not dang VANG trong [a,b), ca not bat dau truoc a: [(midi, tay, thoi luong chong)]."""
    ra = []
    for n in ns:
        if n['dur'] <= EPS:
            continue
        s, e = n['beat'], n['beat'] + n['dur']
        chong = min(e, b) - max(s, a)
        if chong > EPS:
            ra.append((n['midi'], n['hand'], chong))
    return ra


def doan_hop_am(ns, a, b):
    """Hop am doc tu NOT trong [a,b): (goc pc, chat) hoac None.

    Goc uu tien BASS tay trai (not thap nhat dang vang o dau khoang). Tay trai nang
    gap ruoi — o doan solo tay phai la giai dieu, nhieu not ngoai hop am (Linh Nhi
    bam hop am long nhat ba thay: 63,6%).
    """
    v = vang(ns, a, b)
    if not v:
        return None
    w = collections.Counter()
    for m, tay, d in v:
        w[m % 12] += d * (1.5 if tay == 2 else 1.0)
    trai = [m for m, tay, d in v if tay == 2]
    bass = min(trai) % 12 if trai else None
    tong = sum(w.values())
    tot = None
    for r in range(12):
        for chat, bac in MAU.items():
            tap = {(r + x) % 12 for x in bac}
            diem = sum(w[p] for p in tap) - 0.6 * sum(w[p] for p in w if p not in tap)
            if r == bass:
                diem += 0.25 * tong
            if len(bac) == 4 and w[(r + bac[3]) % 12] < 0.12 * tong:
                diem -= 0.2 * tong
            if chat in ('aug', 'sus4'):
                diem -= 0.05 * tong
            if tot is None or diem > tot[0] + EPS:
                tot = (diem, r, chat)
    return tot[1], tot[2]


# ---------------------------------------------------------------- do
GAM = {True: {0, 2, 3, 5, 7, 8, 9, 10, 11}, False: {0, 2, 4, 5, 7, 9, 11}}
TAP_CHAT = {'': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'm7': (0, 3, 7, 10), 'maj7': (0, 4, 7, 11),
            'dim': (0, 3, 6), 'm7b5': (0, 3, 6, 10), 'sus4': (0, 5, 7), 'aug': (0, 4, 8)}


def nhom_hau(hau):
    h = hau.replace('(', '').replace(')', '')
    if 'm7b5' in h or 'ø' in h:
        return 'm7b5'
    if h.startswith('dim') or '°' in h:
        return 'dim'
    if h.startswith('maj') or h.startswith('M7'):
        return 'maj7'
    if h.startswith('m') and not h.startswith('maj'):
        return 'm7' if ('7' in h or '9' in h or '11' in h) else 'm'
    if 'sus' in h:
        return 'sus4'
    if h.startswith(('7', '9', '13', '11')) or h.startswith('dom'):
        return '7'
    if 'aug' in h or '+' in h:
        return 'aug'
    return ''


def ten_la_ma(goc, hau):
    c = nhom_hau(hau)
    nhom = {'m': 'm', 'm7': 'm', 'dim': 'dim', 'm7b5': 'dim', '7': '7', 'aug': 'aug', 'sus4': 'sus'}.get(c, 'M')
    return la_ma(goc, nhom)


def hop_tai(o, p):
    h = [x for x in o['h'] if x[0] <= p + EPS]
    return h[-1] if h else (o['h'][0] if o['h'] else None)


def buoc_ten(st):
    if st == 0:
        return '0 lap'
    if st <= 2:
        return '1 lien bac'
    if st <= 4:
        return '2 quang ba'
    if st <= 7:
        return '3 quang 4-5'
    if st < 12:
        return '4 xa 8-11'
    return '5 >=8ve'


def doi_ten(iv):
    if iv == 12:
        return 'quang 8'
    if iv in (3, 4):
        return 'quang 3'
    if iv in (8, 9):
        return 'quang 6'
    if iv == 1:
        return 'nua cung (lay)'
    if iv == 2:
        return 'quang 2'
    if iv in (5, 7):
        return 'quang 4-5'
    if iv > 12:
        return 'rong >8ve'
    return 'khac'


def nhip_ten(p):
    f = round((p % 1) * 12) / 12
    if f == 0:
        return 'phach'
    if abs(f - .5) < .01:
        return 'moc don'
    if abs(f - 1 / 3) < .02 or abs(f - 2 / 3) < .02:
        return 'chum ba'
    return 'moc kep'


def do(ra):
    bao = collections.defaultdict(collections.Counter)
    prog = collections.defaultdict(list)
    for x in ra:
        thu = x['thu']
        dieu = 'slow rock' if x['song']['name'] in LUOI else 'bolero'
        k_md = ('thu' if thu else 'truong', x['doan'])
        k_kt = ('thu' if thu else 'truong', dieu)
        seq = ['→'.join(ten_la_ma(h[1], h[2]) for h in o['h']) or '·' for o in x['o']]
        prog[k_md].append((TEN_DEP.get(x['song']['name']), dieu, seq))
        H = bao[('H',) + k_md]
        H['nguon'] += 1
        H['o'] += len(x['o'])
        H['hop_am'] += sum(len(o['h']) for o in x['o'])
        romans = [r for c in seq for r in c.split('→') if r != '·']
        for r in romans:
            H['r:' + r] += 1
        for r1, r2 in zip(romans, romans[1:]):
            if r1 != r2:
                H['t:' + r1 + '>' + r2] += 1
        if romans:
            H['mo:' + romans[0]] += 1
            H['dong:' + romans[-1]] += 1
        M = bao[('M',) + k_md]
        T = bao[('T',) + k_kt]
        truoc = None
        tops = []
        for oi, o in enumerate(x['o']):
            for p, d, ps in o['r']:
                top = ps[-1]
                tops.append((oi, p, d, top, ps))
                deg = (top - (60 + x['chu'])) % 12
                M['bac:' + TEN_BAC[deg]] += 1
                M['n'] += 1
                if deg not in GAM[thu]:
                    M['ngoai_gam'] += 1
                h = hop_tai(o, p)
                if h is not None:
                    tap = {(h[1] + t) % 12 for t in TAP_CHAT.get(nhom_hau(h[2]), (0, 4, 7))}
                    M['not_hop_am'] += deg in tap
                if truoc is not None:
                    M['buoc:' + buoc_ten(abs(top - truoc))] += 1
                truoc = top
        if tops:
            M['doan_di_xuong'] += tops[-1][3] < tops[0][3]
            M['doan'] += 1
        for oi, p, d, top, ps in tops:
            T['rh_go'] += 1
            T['rh_%d_not' % min(len(ps), 4)] += 1
            if len(ps) == 2:
                T['doi:' + doi_ten(ps[1] - ps[0])] += 1
            if len(ps) >= 3:
                T['chong3+'] += 1
                T['chong3+_tam:' + ('<8ve' if ps[-1] - ps[0] < 12 else '8ve' if ps[-1] - ps[0] == 12 else '>8ve')] += 1
            T['nhip:' + nhip_ten(p)] += 1
        abs_t = [(oi * 100 + p, top) for oi, p, d, top, ps in tops]
        i = 0
        while i < len(abs_t) - 3:
            j = i
            dir_ = 0
            while j + 1 < len(abs_t) and abs_t[j + 1][0] - abs_t[j][0] <= 0.5 + EPS:
                st = abs_t[j + 1][1] - abs_t[j][1]
                sg = (st > 0) - (st < 0)
                if st == 0 or (dir_ and sg != dir_) or abs(st) > 5:
                    break
                dir_ = sg
                j += 1
            if j - i + 1 >= 4:
                steps = [abs(abs_t[k + 1][1] - abs_t[k][1]) for k in range(i, j)]
                T['chay:' + ('lien bac' if max(steps) <= 2 else 'rai' if min(steps) >= 3 else 'tron')] += 1
                i = j
            i += 1
        for k in range(len(tops) - 2):
            a_, b_, c_ = tops[k][4], tops[k + 1][4], tops[k + 2][4]
            if len(a_) >= 3 and a_ == b_ == c_:
                T['dap_cung_hop_am_3_lan'] += 1
        for o in x['o']:
            T['o'] += 1
            T['phach'] += o['dai']
            T['lh_go'] += len(o['l'])
            if not o['l']:
                T['lh_o_im'] += 1
            for p, d, ps in o['l']:
                if d >= o['dai'] / 2 - EPS:
                    T['lh_ngan_nua_o+'] += 1
                if len(ps) == 2 and ps[1] - ps[0] == 12:
                    T['lh_quang8'] += 1
    return bao, prog


def in_do(ra):
    bao, prog = do(ra)
    for k in sorted(prog):
        print(f"\n## VONG HOP AM — {k[0]} · {k[1]}")
        for ten, dieu, seq in prog[k]:
            print(f"  {ten:20s} {dieu:9s} {' | '.join(seq)}")
    for k in sorted(bao):
        c = bao[k]
        print(f"\n## {k}")
        items = sorted(c.items(), key=lambda kv: (kv[0].split(':')[0], -kv[1]))
        print('  ' + ' · '.join(f"{a}={b}" for a, b in items))


# ---------------------------------------------------------------- sinh
def js(v):
    return json.dumps(v, ensure_ascii=False)


def sinh(ra):
    out = []
    w = out.append
    w('/**')
    w(' * NGUON CAU SOLO LINH NHI cho bo soan Slow Rock — SINH BANG SCRIPT, KHONG SUA TAY:')
    w(' *')
    w(' *     python tools/slow_rock_linh_nhi.py --sinh > src/reharm/style/slowRockLinhNhiNguon.ts')
    w(' *')
    w(' * Moi nguon la MOT doan solo that (dao / giang / ket) cua mot ban ky am Linh Nhi.')
    w(' * - Slow rock (La Thu, Mot Coi): o = 6 moc don chum ba = 3 not den, dung luoi that')
    w(' *   (La Thu ghi sai 4/4, da cat lai theo pha bass). Hop am doc tay theo not tay trai.')
    w(' * - Bolero: o = o 4/4 cua sheet, hop am theo ky hieu sheet.')
    w(' * Cao do tinh theo nua cung so voi MIDI 60 + chuGoc. Not hoa my va duoi not noi da bo.')
    w(' */')
    w('')
    w('export type OSR = {')
    w('  /** Do dai o nguon, not den (Dung Xa ket co mot o 6 phach). */')
    w('  d: number')
    w('  /** [phach trong o, goc so voi chu am, hau to, bass so voi chu am | null] */')
    w('  h: readonly (readonly [number, number, string, number | null])[]')
    w('  /** Tay phai: [phach trong o, truong do, cao do so voi MIDI 60+chuGoc] */')
    w('  r: readonly (readonly [number, number, readonly number[]])[]')
    w('  /** Tay trai, cung dang. */')
    w('  l: readonly (readonly [number, number, readonly number[]])[]')
    w('}')
    w('')
    w('export type NguonSR = {')
    w('  id: string')
    w('  bai: string')
    w("  doan: 'intro' | 'interlude' | 'outro'")
    w('  thu: boolean')
    w("  dieu: 'slow rock' | 'bolero'")
    w('  /** Chu am ban goc, 0-11. */')
    w('  chuGoc: number')
    w('  /** So not den moi o nguon: 3 (o 6/8 slow rock) hoac 4 (o bolero). */')
    w('  oPhach: number')
    w('  o: readonly OSR[]')
    w('}')
    w('')
    w('export const NGUON_SOLO_SR: readonly NguonSR[] = [')
    for x in ra:
        s = x['song']
        base = 60 + x['chu']
        dieu = 'slow rock' if s['name'] in LUOI else 'bolero'
        w('  {')
        w(f"    id: {js(slug(s['name']) + '-' + x['doan'])}, bai: {js(TEN_DEP.get(s['name'], s['name']))},")
        w(f"    doan: {js(x['doan'])}, thu: {'true' if x['thu'] else 'false'}, dieu: {js(dieu)}, chuGoc: {x['chu']}, oPhach: {x['oPhach']:g},")
        w('    o: [')
        for o in x['o']:
            h = [[round(a, 3), g, hau, b] for a, g, hau, b in o['h']]
            r = [[round(p, 3), round(d, 3), [m - base for m in ps]] for p, d, ps in o['r']]
            l = [[round(p, 3), round(d, 3), [m - base for m in ps]] for p, d, ps in o['l']]
            w(f"      {{ d: {o['dai']:g}, h: {js(h)}, r: {js(r)}, l: {js(l)} }},")
        w('    ],')
        w('  },')
    w(']')
    return '\n'.join(out).replace('None', 'null') + '\n'


if __name__ == '__main__':
    ra = tat_ca()
    if '--do' in sys.argv:
        in_do(ra)
    elif '--sinh' in sys.argv:
        sys.stdout.reconfigure(encoding='utf-8', newline=chr(10))
        sys.stdout.write(sinh(ra))
    elif '--json' in sys.argv:
        print(json.dumps([{'bai': x['song']['name'], 'doan': x['doan'], 'thu': x['thu'], 'chu': x['chu'],
                           'dieu': x['dieu'], 'o': x['o']} for x in ra], ensure_ascii=False))
