# -*- coding: utf-8 -*-
"""The House of the Rising Sun (Slow Blues Piano Solo, Songscription) — cách hai tay phối hợp trong 6/8, mẫu cho Blues Claude.

    python -X utf8 scripts/phan_tich_rising_sun.py

Người dùng 28/9/2026: *"Hãy học tiết tấu đệm và cách tác giả đã dùng tay trái để nhấn vào các phách mạnh trong khi tay phải
thì đánh giai điệu và phối hợp với tay trái rất đúng tinh thần nhịp 6/8. Đây là cách mà tôi muốn bạn chơi trong nút Blue
Claude."* Nguồn: bản SHEET SẠCH `PianoBrain/exports/songscription/The-House-of-the-Rising-Sun.mxl` (dựng bằng
`sua_de_hoc_tu_sheet.py` ở cùng thư mục) — KHÔNG dùng bản căn âm thanh (cú gõ lệch lưới).

Đơn vị: móc đơn (6 mỗi ô 6/8; ô 11 ghi 7/8 trong sheet gốc — bỏ khỏi thống kê hình tay trái).
"""
import collections
import sys
import xml.etree.ElementTree as ET
import zipfile

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402

EPS = 1e-6
F = 'D:/PianoBrain/exports/songscription/The-House-of-the-Rising-Sun.mxl'
T = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
nm = lambda m: T[m % 12] + str(m // 12 - 1)
GOC = {'B': 11, 'Em': 4, 'G7': 7, 'A7': 9, 'C7': 0, 'B7': 11}


def dau_nhan():
    """(ô, tay, móc đơn) → tập dấu (accent/staccato/tenuto/…) — đọc thẳng XML, bộ đọc chung bỏ qua articulations."""
    z = zipfile.ZipFile(F)
    root = ET.fromstring(z.read('score.xml'))
    out = collections.defaultdict(set)
    div = 1
    for m in root.find('part').findall('measure'):
        at = 0.0
        last = 0.0
        for el in m:
            if el.tag == 'attributes' and el.findtext('divisions'):
                div = int(el.findtext('divisions'))
            elif el.tag == 'backup':
                at -= float(el.findtext('duration')) / div
            elif el.tag == 'forward':
                at += float(el.findtext('duration')) / div
            elif el.tag == 'note':
                d = float(el.findtext('duration') or 0) / div
                on = last if el.find('chord') is not None else at
                for a in el.iter('articulations'):
                    for x in a:
                        out[(int(m.get('number')), int(el.findtext('staff') or 1), round(on * 2, 3))].add(x.tag)
                if el.find('chord') is None and el.find('grace') is None:
                    last = at
                    at += d
    return out


def main():
    ns, meta = mxl.notes(mxl.load(F))
    bs, bl = meta['bar_start'], meta['barlens']
    hop = {}
    for m in mxl.load(F).find('part').findall('measure'):
        for h in m.iter('harmony'):
            r = h.find('root')
            s = r.findtext('root-step') + {'-1': 'b', '1': '#'}.get(r.findtext('root-alter') or '', '')
            k = h.find('kind')
            hop[int(m.get('number'))] = (T.index({'Bb': 'Bb', 'Db': 'C#', 'Gb': 'F#', 'Ab': 'Ab', 'Eb': 'Eb'}.get(s, s)),
                                         k.get('text') if k is not None and k.get('text') else (k.text if k is not None else ''))
    dn = dau_nhan()
    cu = collections.defaultdict(lambda: collections.defaultdict(list))
    for n in ns:
        if n['dur'] > 1e-6 and not n['tie_stop']:
            cu[(n['bar'], n['hand'])][round((n['beat'] - bs[n['bar']]) * 2, 3)].append(n)
    o6 = [b for b in sorted(bs) if abs(bl[b] * 2 - 6) < 1e-6 and b > 0 and b < max(bs)]
    print(f'{len(bs)} ô; ô 6/8 đầy đủ dùng để đo: {len(o6)} (bỏ ô 0 lấy đà, ô chót, ô 7/8)')
    print('hợp âm từng ô:', {b: f'{T[hop[b][0]]}{hop[b][1]}' for b in sorted(hop)})

    # 1. Tay trái: ở móc đơn nào, đánh gì (bass / hợp âm), ngân bao lâu, dấu nhấn
    vt, kieu, ngan, nhan = collections.Counter(), collections.Counter(), collections.defaultdict(list), collections.Counter()
    hinh = collections.Counter()
    for b in o6:
        g = hop.get(b, (None,))[0]
        tr = cu[(b, 2)]
        hinh[tuple(sorted(tr))] += 1
        for m, v in tr.items():
            vt[m] += 1
            loai = 'hợp âm' if len(v) >= 3 else 'bass+1' if len(v) == 2 else 'bass'
            kieu[(m, loai)] += 1
            ngan[m].append(max(x['dur'] for x in v) * 2)
            for a in dn.get((b, 2, m), ()):
                nhan[(m, a)] += 1
    print('\nTAY TRÁI — số ô có cú gõ ở từng móc đơn (0 = phách 1):', sorted(vt.items()))
    print('  kiểu cú:', sorted(kieu.items()))
    print('  ngân trung bình (móc đơn):', {m: round(sum(v) / len(v), 2) for m, v in sorted(ngan.items())})
    print('  dấu nhấn:', dict(nhan))
    print('  hình tay trái hay gặp:', hinh.most_common(6))

    # 2. Bậc các nốt tay trái so gốc hợp âm của ô
    bac = collections.defaultdict(collections.Counter)
    dan = collections.Counter()
    for b in o6:
        g = hop.get(b, (None,))[0]
        if g is None:
            continue
        for m, v in cu[(b, 2)].items():
            for x in v:
                bac[m][BAC[(x['midi'] - g) % 12]] += 1
            # phách 6: bass dẫn nửa cung vào gốc ô sau?
            if m >= 4.5 and b + 1 in hop:
                lo = min(x['midi'] for x in v)
                dan[((hop[b + 1][0] - lo) % 12)] += 1
    for m in sorted(bac):
        print(f'  móc {m}: ' + ' '.join(f'{k}:{c}' for k, c in bac[m].most_common(6)))
    print('  bass phách 5–6 cách gốc ô SAU (nửa cung, lên):', dict(dan))

    # 3. Tay phải và phối hợp hai tay
    ph, cung, rieng = collections.Counter(), collections.Counter(), collections.Counter()
    mat = []
    for b in o6:
        p, t = cu[(b, 1)], cu[(b, 2)]
        mat.append(len(p))
        for m in p:
            ph[int(m)] += 1
            if m in t:
                cung[m] += 1
        for m in t:
            if m not in p:
                rieng[m] += 1
    print('\nTAY PHẢI — cú gõ theo móc đơn (gộp phần lẻ):', sorted(ph.items()), f'· trung vị {sorted(mat)[len(mat) // 2]} cú/ô')
    print('  hai tay gõ CÙNG lúc ở móc:', sorted(cung.items()))
    print('  tay trái gõ mà tay phải im ở móc:', sorted(rieng.items()))
    if '--in' in sys.argv:
        for b in sorted(bs):
            print(f'  ô {b} {T[hop[b][0]] + hop[b][1] if b in hop else ""}: T ' +
                  ' '.join(f'{m:g}:' + '+'.join(nm(x['midi']) for x in v) + '/' + f"{max(x['dur'] for x in v) * 2:g}"
                           + (''.join('>' if a == 'accent' else '.' if a == 'staccato' else '-' if a == 'tenuto' else '^'
                                      for a in dn.get((b, 2, m), ()))) for m, v in sorted(cu[(b, 2)].items())))


def kho(out):
    """Kho TAY PHẢI từng ô cho nút Blue Sun (`src/reharm/style/blueSunO.json`): vị trí/độ ngân theo móc đơn, cao độ thật
    (sheet ở Mi thứ), gốc hợp âm của ô, và kiểu hình — riff (hình 2–4 nốt lặp liền ≥ 3 lần, `phan_tich_riff_blues.py`), chạy
    (≥ 6 cú, có đoạn đi một chiều ≥ 5 nốt), thưa. Ô 11 ghi 7/8 trong sheet: chỉ giữ 6 móc đơn đầu (câu chạy xuống cụt 3 nốt
    cuối). Ô 16 (nốt ngân kết) bỏ. Nốt láy (trường độ 0) bỏ."""
    import itertools
    import json
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from phan_tich_riff_blues import tim_riff
    ns, meta = mxl.notes(mxl.load(F))
    bs, bl = meta['bar_start'], meta['barlens']
    # THỜI GIAN THẬT (người dùng 28/9: bản căn âm thanh "đã được điều chỉnh lại tempo và đánh ko bị dồn nhanh"): vị trí trong ô =
    # tỉ lệ thời gian thật của ô × số móc đơn của ô, làm tròn 1/12 móc đơn. Cũ (lượt 1–2): vị trí ghi trên lưới của bản dựng từ
    # ảnh — câu chạy 3 nốt mỗi móc đơn ở ♩ 97 = 9,7 nốt/giây, nhanh hơn tiếng thu (7,8 nốt/giây) khoảng 25%.
    giay, _ = ban_do_toc_do()

    def vi_tri(b, q):
        s0, s1 = giay(bs[b]), giay(bs[b] + bl[b])
        return round(bl[b] * 2 * (giay(q) - s0) / (s1 - s0) * 12) / 12
    goc, truoc = {}, None
    for m in mxl.load(F).find('part').findall('measure'):
        for h in m.iter('harmony'):
            r = h.find('root')
            s = r.findtext('root-step')
            a = int(r.findtext('root-alter') or 0)
            k = h.find('kind')
            truoc = ((['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].index(
                {'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B'}[s]) + a) % 12,
                (k.text or '') if k is not None else '')
        goc[int(m.get('number'))] = truoc
    o = []
    for b in sorted(bs):
        if b == max(bs):
            continue
        g = collections.defaultdict(list)
        for n in ns:
            if n['bar'] == b and n['hand'] == 1 and n['dur'] > 1e-6 and not n['tie_stop']:
                t = vi_tri(b, n['beat'])
                if t < 6 - 1e-6:
                    g[t].append(n)
        su = [[round(t, 4), round(min(max(vi_tri(b, min(x['beat'] + x['dur'], bs[b] + bl[b])) for x in v) - t, 6 - t), 4),
               sorted({x['midi'] for x in v})] for t, v in sorted(g.items())]
        su = [s for s in su if s[1] > 0]
        day = [s[2][-1] for s in su]
        r = tim_riff(day)
        if r:
            kieu = 'riff'
        else:
            buoc = [(y > x) - (y < x) for x, y in zip(day, day[1:])]
            dai = max((len(list(v)) for s, v in itertools.groupby(buoc) if s), default=0)
            kieu = 'chay' if len(day) >= 6 and dai + 1 >= 5 else 'thua'
        gr, loai = goc[b]
        o.append({'id': f'RisingSun:o{b}', 'o': b, 'goc': gr, 'ham': (gr - 4) % 12, 'thu': loai.startswith('minor'),
                  'kieu': kieu, 'su': su})
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'nguon': 'scripts/phan_tich_rising_sun.py --kho', 'don_vi': 'móc đơn', 'tonic': 4, 'scale': 'minor', 'o': o},
                  f, ensure_ascii=False, separators=(',', ':'))
    print('ghi', out, '·', collections.Counter(x['kieu'] for x in o))
    for x in o:
        print(f"  ô {x['o']:2} gốc {x['goc']:2} {x['kieu']:5} {len(x['su'])} cú")


def ban_do_toc_do():
    """Bản căn âm thanh ghi TEMPO THAY ĐỔI (≈ 209 dấu `sound tempo` đặt ngay trong dòng nốt tay phải). Trả hàm phách ghi → giây
    (tích phân từng đoạn tốc độ không đổi)."""
    root = ET.fromstring(zipfile.ZipFile(F).read('score.xml'))
    div, cursor, moc = 1, 0.0, []
    for m in root.find('part').findall('measure'):
        at = cursor
        barlen = None
        for el in m:
            if el.tag == 'attributes':
                if el.findtext('divisions'):
                    div = int(el.findtext('divisions'))
                t = el.find('time')
                if t is not None:
                    ban_do_toc_do.barlen = int(t.findtext('beats')) * 4.0 / int(t.findtext('beat-type'))
            elif el.tag == 'direction':
                for s in el.iter('sound'):
                    if s.get('tempo'):
                        moc.append((at + float(el.findtext('offset') or 0) / div, float(s.get('tempo'))))
            elif el.tag == 'backup':
                at -= float(el.findtext('duration')) / div
            elif el.tag == 'forward':
                at += float(el.findtext('duration')) / div
            elif el.tag == 'note' and el.find('chord') is None and el.find('grace') is None:
                at += float(el.findtext('duration') or 0) / div
        cursor += ban_do_toc_do.barlen
    moc.sort()

    def giay(q):
        s, truoc_q, tempo = 0.0, 0.0, moc[0][1]
        for mq, mt in moc:
            if mq >= q:
                break
            s += (mq - truoc_q) * 60 / tempo
            truoc_q, tempo = mq, mt
        return s + (q - truoc_q) * 60 / tempo
    return giay, moc


def thoi_gian_that():
    """Đo theo THỜI GIAN THẬT (người dùng: bản căn âm thanh "đã được điều chỉnh lại tempo và đánh ko bị dồn nhanh"):
    vị trí cú gõ trong ô = tỉ lệ thời gian thật của ô × số móc đơn của ô; tốc độ câu chạy tính bằng nốt/giây."""
    giay, moc = ban_do_toc_do()
    ns, meta = mxl.notes(mxl.load(F))
    bs, bl = meta['bar_start'], meta['barlens']
    print(f'\n== THỜI GIAN THẬT: {len(moc)} dấu tốc độ ({min(t for _, t in moc):.0f}–{max(t for _, t in moc):.0f} ♩/phút); '
          f'bài dài {giay(bs[max(bs)] + bl[max(bs)]):.1f} s')
    dai_o = {b: giay(bs[b] + bl[b]) - giay(bs[b]) for b in bs}
    o6 = [b for b in sorted(bs) if abs(bl[b] * 2 - 6) < EPS and 0 < b < max(bs)]
    tb = sorted(dai_o[b] for b in o6)
    print(f'  một ô 6/8 dài trung vị {tb[len(tb) // 2]:.2f} s (tứ phân {tb[len(tb) // 4]:.2f}–{tb[3 * len(tb) // 4]:.2f}) → '
          f'móc đơn ≈ {tb[len(tb) // 2] / 6:.3f} s, ♩ ≈ {60 / (tb[len(tb) // 2] / 3):.0f}')
    cu = collections.defaultdict(lambda: collections.defaultdict(list))
    for n in ns:
        if n['dur'] > EPS and not n['tie_stop']:
            cu[(n['bar'], n['hand'])][round(n['beat'], 4)].append(n['midi'])
    vt = collections.defaultdict(collections.Counter)
    so_cu, ioi = [], []
    for b in o6:
        for h in (1, 2):
            for q in cu[(b, h)]:
                pos = 6 * (giay(q) - giay(bs[b])) / dai_o[b]
                vt[h][round(pos * 3) / 3] += 1
        ts = sorted(cu[(b, 1)])
        so_cu.append(len(ts))
        ioi += [giay(y) - giay(x) for x, y in zip(ts, ts[1:])]
    so_cu.sort()
    ioi.sort()
    print(f'  tay phải: cú mỗi ô trung vị {so_cu[len(so_cu) // 2]} (tứ phân {so_cu[len(so_cu) // 4]}–{so_cu[3 * len(so_cu) // 4]}) · '
          f'khoảng cách hai cú liền trung vị {ioi[len(ioi) // 2]:.3f} s (= {ioi[len(ioi) // 2] / (tb[len(tb) // 2] / 6):.2f} móc đơn)')
    for h, ten in ((2, 'tay trái'), (1, 'tay phải')):
        print(f'  {ten} theo móc đơn (thời gian thật, làm tròn ⅓):', ' '.join(f'{k:g}:{v}' for k, v in sorted(vt[h].items()) if v >= 2))
    # câu chạy theo giây: ≥ 4 cú liền, cách ≤ 1 móc đơn thật
    moc_s = tb[len(tb) // 2] / 6
    tat = sorted(giay(q) for b in o6 for q in cu[(b, 1)])
    chay, lien = [], [tat[0]]
    for x, y in zip(tat, tat[1:]):
        if y - x <= moc_s + 1e-3:
            lien.append(y)
        else:
            if len(lien) >= 4:
                chay.append(lien)
            lien = [y]
    if len(lien) >= 4:
        chay.append(lien)
    toc = sorted((len(c) - 1) / (c[-1] - c[0]) for c in chay)
    dai = sorted(len(c) for c in chay)
    print(f'  câu chạy (≥ 4 cú cách ≤ 1 móc đơn thật): {len(chay)} câu · dài trung vị {dai[len(dai) // 2]} nốt · '
          f'tốc độ trung vị {toc[len(toc) // 2]:.1f} nốt/giây (= {toc[len(toc) // 2] * moc_s:.2f} nốt mỗi móc đơn)')
    return giay


if __name__ == '__main__':
    if '--kho' in sys.argv:
        kho(sys.argv[sys.argv.index('--kho') + 1])
    elif '--that' in sys.argv:
        thoi_gian_that()
    else:
        main()
