# -*- coding: utf-8 -*-
"""Tách CÂU LICK trong hai sheet Slow Blues (Rockhouse · Robert) — kho vật liệu cho nút Blues Claude.

    python -X utf8 scripts/phan_tich_blues_lick.py                 # báo cáo
    python -X utf8 scripts/phan_tich_blues_lick.py --json FILE     # ghi kho câu lick

Câu lick = chuỗi ≥ 3 cú tay phải MỘT hoặc HAI nốt, cú sau cách cú trước ≤ ¾ nốt đen; cắt ở cú dặm (≥ 3 nốt) hay chỗ nghỉ.
Mỗi nốt ghi bậc so với GỐC HỢP ÂM đang vang (bass tay trái) và so với CHỦ ÂM. Nốt láy blues trong sheet được ghi thành
cặp nốt cách NỬA CUNG đánh cùng lúc (Bb+B trên G = b3+3) — đếm là "láy chồng".
Lưới: nốt đen chia 0 · ⅓ · ⅔ (chùm ba = móc đơn của 6/8) và 0 · ¼ · ½ · ¾. Câu "chùm ba" = mọi cú rơi trên 0 · ⅓ · ½ · ⅔
(½ đọc là móc đơn swing ⅔) — chuyển sang lưới 6/8 slow rock không méo nhịp.
"""
import collections
import json
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402

GOC = 'C:/Users/Tin PC/Downloads/Documents/Linh Nhi/'
SHEETS = {
    'Rockhouse': ('Blues/Rockhouse-Ray-da-sua.mxl', 7, 88,
                  [(8, 2), (20, 2), (32, 0), (44, 0), (56, 0), (67, 2), (79, 2), (91, 0), (103, 0)], 4.0),
    'Robert': ('Blues/Robert-Ray-chia-doan-C-Blues.mxl', 0, 162, [(56, 0), (80, 0), (104, 0)], 8.0),
}
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
EPS = 1e-6
TEN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
nm = lambda m: TEN[m % 12] + str(m // 12 - 1)


def tri(p):
    f = round(p % 1, 3)
    return min((abs(f - v), k) for k, v in (('0', 0), ('1/3', 1 / 3), ('1/2', .5), ('2/3', 2 / 3), ('1', 1)))[1] \
        if min(abs(f - v) for v in (0, 1 / 3, .5, 2 / 3, 1)) < .02 else ('1/4' if abs(f - .25) < .02 else '3/4' if abs(f - .75) < .02 else 'khac')


def ky_hieu(path):
    """Ký hiệu hợp âm in trên sheet: [(phách từ đầu bài, gốc pc)]. Vị trí theo con trỏ nốt (backup/forward) + offset."""
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
                off = float(el.findtext('offset') or 0) / div
                out.append((round(at + off, 4), (STEP[r.findtext('root-step')] + int(r.findtext('root-alter') or 0)) % 12))
            elif el.tag == 'note' and el.find('chord') is None and el.find('grace') is None:
                at += float(el.findtext('duration') or 0) / div
        cursor += barlen
    return sorted(out)


def lay(ten, file, tonic, bpm, vong, dv):
    ns, meta = mxl.notes(mxl.load(GOC + file))
    bs = meta['bar_start']
    real = [n for n in ns if n['dur'] > EPS]
    go = collections.defaultdict(list)
    for n in real:
        if not n['tie_stop']:
            go[(n['hand'], n['beat'])].append(n)

    def bass_tuc(t):
        v = [n['midi'] for n in real if n['hand'] == 2 and n['beat'] <= t + EPS and n['beat'] + n['dur'] > t + EPS]
        return min(v) if v else None

    KH = ky_hieu(GOC + file)

    def bass(t):
        """Gốc hợp âm tại t = KÝ HIỆU in gần nhất phía trước (trả MIDI giả: gốc pc + 36). Bản trước lấy bass đầu nửa ô —
        tay trái đi 1-1-3-5-3-5 nên đầu nửa ô sau là BẬC 5, đọc nhầm thành đổi hợp âm (41/74 câu "đổi hợp âm" oan).
        Rockhouse: ký hiệu khớp bass đầu ô 57/82 ô (ô 32–55: 24/24); 34/116 ký hiệu đặt giữa ô."""
        v = [r for at, r in KH if at <= t + EPS]
        if v:
            return v[-1] + 36
        b0 = bass_tuc(t)
        return b0

    starts = [bs[b] + p for b, p in vong]

    def o12(t):
        for k, s in enumerate(starts):
            if s - EPS <= t < s + 12 * dv - EPS:
                return k + 1, int((t - s) // dv) + 1
        return None, None

    rh = sorted(((b, sorted({n['midi'] for n in v}), max(n['dur'] for n in v)) for (h, b), v in go.items() if h == 1))
    lh_at = sorted({b for h, b in go if h == 2})
    out, cur = [], []

    def dong():
        if len(cur) >= 3:
            out.append(list(cur))
        cur.clear()

    for i, (b, notes, dur) in enumerate(rh):
        if len(notes) >= 3:
            dong(); continue
        if cur and b - cur[-1][0] > .75 + EPS:
            dong()
        cur.append((b, notes, dur))
    dong()

    licks = []
    for c in out:
        a = c[0][0]
        end = c[-1][0] + c[-1][2]
        g0 = bass(a)
        if g0 is None:
            continue
        luoi = [tri(x[0]) for x in c]
        k, o = o12(a)
        bar = max(bb for bb, s in bs.items() if s <= a + EPS)
        # đổi hợp âm giữa câu?
        doi_ha = len({(bass(x[0]) - tonic) % 12 for x in c if bass(x[0]) is not None}) > 1
        # chỗ đổi hợp âm (đầu nửa ô có gốc mới) và gốc mới — cho câu DẪN vào hợp âm sau
        moc = []
        for x in c:
            r = bass(x[0])
            if r is None:
                continue
            if not moc or r % 12 != moc[-1][1]:
                luc = max([at for at, rr in KH if at <= x[0] + EPS] or [a])
                moc.append((luc, r % 12))
        doi_luc = round(moc[1][0] - a, 4) if len(moc) >= 2 else None
        buoc = (moc[1][1] - moc[0][1]) % 12 if len(moc) >= 2 else None
        notes = []
        for x in c:
            gb = bass(x[0])
            notes.append(dict(t=round(x[0] - a, 4), d=round(x[2], 4), m=x[1],
                              bh=[(m - gb) % 12 for m in x[1]] if gb is not None else None,
                              bk=[(m - tonic) % 12 for m in x[1]]))
        tops = [max(x[1]) for x in c]
        licks.append(dict(
            id=f'{ten}:o{bar}:{round(a - bs[bar], 3)}', sheet=ten, bar=bar, trong_o=round(a - bs[bar], 4),
            vong=k, o12=o, ham=(g0 - tonic) % 12, doi_ha=doi_ha, len=round(end - a, 4), so_cu=len(c),
            so_doi=max(0, len(moc) - 1), doi_luc=doi_luc, buoc=buoc,
            chum_ba=all(l in ('0', '1/3', '1/2', '2/3', '1') for l in luoi), luoi=luoi,
            lay_chong=sum(1 for x in c if len(x[1]) == 2 and x[1][1] - x[1][0] == 1),
            be_doi=[x[1][1] - x[1][0] for x in c if len(x[1]) == 2],
            nhac=sum(1 for i in range(1, len(tops)) if tops[i] == tops[i - 1]),
            tam=max(tops) - min(tops), notes=notes,
            lh_trong=sum(1 for b in lh_at if a - EPS <= b < end - EPS),
        ))
    return licks, meta


def main():
    kho = {}
    for ten, (file, tonic, bpm, vong, dv) in SHEETS.items():
        L, meta = lay(ten, file, tonic, bpm, vong, dv)
        kho[ten] = L
        print(f'\n===== {ten} (chủ {TEN[tonic]}, ♩={bpm}) — {len(L)} câu lick')
        ln = sorted(x['len'] for x in L)
        print('độ dài (nốt đen): tứ phân', ln[len(ln) // 4], '· trung vị', ln[len(ln) // 2], '· tứ phân trên', ln[3 * len(ln) // 4])
        print('số cú: trung vị', sorted(x['so_cu'] for x in L)[len(L) // 2])
        print('câu nằm trọn lưới chùm ba (chuyển được sang 6/8):', sum(x['chum_ba'] for x in L), '/', len(L))
        print('hợp âm lúc vào câu (bậc gốc so chủ):', dict(collections.Counter(BAC[x['ham']] for x in L).most_common()))
        print('ô trong vòng 12 lúc vào câu:', dict(sorted(collections.Counter(x['o12'] for x in L if x['o12']).items())))
        print('vào câu ở vị trí trong ô (nốt đen):', dict(collections.Counter(round(x['trong_o'] * 3) / 3 for x in L).most_common(8)))
        print('đổi hợp âm giữa câu:', sum(x['doi_ha'] for x in L), '/', len(L))
        print('câu có láy chồng (nửa cung cùng lúc):', sum(1 for x in L if x['lay_chong']), '/', len(L),
              '· tổng', sum(x['lay_chong'] for x in L))
        be = collections.Counter(d for x in L for d in x['be_doi'])
        print('bè đôi (nửa cung):', dict(be.most_common()))
        # bậc nốt đỉnh so gốc hợp âm & so chủ âm
        bh = collections.Counter(BAC[max(n['bh'])] if False else BAC[n['bh'][-1]] for x in L for n in x['notes'] if n['bh'])
        bk = collections.Counter(BAC[n['bk'][-1]] for x in L for n in x['notes'])
        tot = sum(bh.values())
        print(f'bậc nốt đỉnh so GỐC HỢP ÂM (n={tot}):', ' · '.join(f'{k} {v * 100 // tot}%' for k, v in bh.most_common()))
        tot = sum(bk.values())
        print(f'bậc nốt đỉnh so CHỦ ÂM (n={tot}):', ' · '.join(f'{k} {v * 100 // tot}%' for k, v in bk.most_common()))
        cuoi = collections.Counter(BAC[x['notes'][-1]['bh'][-1]] for x in L if x['notes'][-1]['bh'])
        print('nốt KẾT câu so gốc hợp âm:', dict(cuoi.most_common()))
        dau = collections.Counter(BAC[x['notes'][0]['bh'][-1]] for x in L if x['notes'][0]['bh'])
        print('nốt MỞ câu so gốc hợp âm:', dict(dau.most_common()))
        print('tay trái gõ trong lúc câu lick (cú/câu) trung vị', sorted(x['lh_trong'] for x in L)[len(L) // 2])
        print('--- các câu (ô · ô12 · hợp âm · dài · [thời điểm:nốt(bậc so hợp âm)]):')
        for x in L:
            print(f"  ô{x['bar']}+{x['trong_o']} o12={x['o12']} {BAC[x['ham']]} len={x['len']} {'3' if x['chum_ba'] else '4'}: " +
                  ' '.join(f"{n['t']}:{'+'.join(nm(m) for m in n['m'])}({'+'.join(BAC[b] for b in n['bh']) if n['bh'] else '?'})" for n in x['notes']))
    if '--json' in sys.argv:
        f = sys.argv[sys.argv.index('--json') + 1]
        json.dump(kho, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('ghi', f)


if __name__ == '__main__':
    main()


def kho_lick(licks, tonic):
    """Kho cho bộ soạn: câu nằm gọn MỘT hợp âm, nắn về lưới chùm ba (1 phách swing = 3 móc đơn).

    Nắn: mỗi cú về móc đơn gần nhất (¼ → ⅓, ¾ → ⅔; ½ → ⅔ nếu trống, không thì ⅓) — Rockhouse chép từ MIDI, cùng một mô-típ
    ô 105 ghi 0·⅓·⅔ còn ô 106 ghi 0·¼·¾ (lỗi làm tròn). Hai cú rơi cùng móc đơn → đẩy cú sau lên móc kế nếu trống, không thì bỏ câu.
    Cao độ lưu theo GỐC HỢP ÂM: `rel` = nửa cung so với gốc (gốc đặt ở quãng tám ngay dưới nốt đỉnh đầu câu).
    `thu` = dùng được trên hợp âm thứ: không có bậc 3 trưởng (4) và bậc 7 trưởng (11) so gốc.
    """
    out = []
    for x in licks:
        if not x['notes'][0]['bh']:
            continue
        doi = None
        if x['doi_ha']:
            if x['so_doi'] != 1 or x['doi_luc'] is None or x['doi_luc'] <= 0:
                continue
            doi = round(x['doi_luc'] * 3)
            if sum(1 for n in x['notes'] if n['t'] * 3 < doi - .5) < 2:
                continue
        chiem, ok, notes = set(), True, []
        for n in x['notes']:
            p = n['t'] * 3
            # móc đơn trống gần nhất; đúng giữa hai móc (½ phách) thì chọn móc SAU (swing)
            cho = sorted((abs(k - p) - (1e-3 if k > p else 0), k) for k in range(int(p) - 1, int(p) + 3) if k >= 0)
            k = next((k for d, k in cho if k not in chiem and d <= .75), None)
            if k is None or (notes and k < notes[-1][0]):
                ok = False
                break
            chiem.add(k)
            notes.append((k, n))
        if not ok:
            continue
        goc_pc = (x['notes'][0]['m'][-1] - x['notes'][0]['bh'][-1]) % 12
        top0 = x['notes'][0]['m'][-1]
        goc_midi = top0 - ((top0 - goc_pc) % 12)
        rel = [[m - goc_midi for m in n['m']] for _, n in notes]
        pcs = {r % 12 for rr in rel for r in rr}
        ks = [k for k, _ in notes]
        dai = max(ks[-1] + max(1, round(notes[-1][1]['d'] * 3)), 1)
        if doi is not None and (dai - doi > 3 or doi >= dai or doi <= ks[0]):
            continue
        out.append(dict(id=x['id'], ham=x['ham'], o12=x['o12'], k=ks, rel=rel, dai=dai,
                        thu=4 not in pcs and 11 not in pcs, lay=x['lay_chong'],
                        doi=doi, buoc=x['buoc'] if doi is not None else None))
    return out


if __name__ == '__main__' and '--kho' in sys.argv:
    f = sys.argv[sys.argv.index('--kho') + 1]
    tat_ca = {}
    for ten, (file, tonic, bpm, vong, dv) in SHEETS.items():
        if ten != 'Rockhouse':
            continue  # Robert: ♩=162, đơn vị phách chưa rõ (nửa nhịp cảm?) — chưa đưa vào kho
        L, _ = lay(ten, file, tonic, bpm, vong, dv)
        kho = kho_lick(L, tonic)
        tat_ca[ten] = kho
        print(ten, 'câu nắn được:', len(kho), '(gọn một hợp âm', sum(1 for x in kho if x['doi'] is None), '· câu dẫn',
              sum(1 for x in kho if x['doi'] is not None), 'bước gốc', dict(__import__('collections').Counter(x['buoc'] for x in kho if x['doi'] is not None)), ')',
              '· dùng được trên hợp âm thứ:', sum(x['thu'] for x in kho),
              '· độ dài (móc đơn):', sorted(x['dai'] for x in kho))
    json.dump(dict(nguon='scripts/phan_tich_blues_lick.py --kho', don_vi='móc đơn chùm ba (1 phách swing = 3)',
                   cau=[c for v in tat_ca.values() for c in v]), open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('ghi', f)
