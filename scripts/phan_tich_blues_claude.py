# -*- coding: utf-8 -*-
"""Phân tích hai sheet Slow Blues (Rockhouse · Robert) cho nút Blues Claude — hoà âm, câu lick, kỹ thuật, hai tay.

    python -X utf8 scripts/phan_tich_blues_claude.py            # in báo cáo
    python -X utf8 scripts/phan_tich_blues_claude.py --json F   # ghi dữ liệu câu lick (cho bộ soạn)

Nguồn: bản Codex đã sửa ký hiệu + chia đoạn trong `Downloads/Documents/Linh Nhi/` (xem Reference/BLUES-ROCKHOUSE-ROBERT.md).
Đơn vị nốt đen; vị trí trong phách 0 · ⅓ · ½ · ⅔ … Nốt láy (grace) có trường độ 0 trong bộ đọc — tách riêng.
"""
import collections
import json
import os
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402

GOC = 'C:/Users/Tin PC/Downloads/Documents/Linh Nhi/'
SHEETS = {
    # tên: (file, chủ âm, các vòng 12 đơn vị (phách đầu vòng tính theo ô, phách-trong-ô), số nốt đen mỗi đơn vị)
    'Rockhouse': ('Blues/Rockhouse-Ray-da-sua.mxl', 7,
                  [(8, 2), (20, 2), (32, 0), (44, 0), (56, 0), (67, 2), (79, 2), (91, 0), (103, 0)], 4.0),
    'Robert': ('Blues/Robert-Ray-chia-doan-C-Blues.mxl', 0, [(56, 0), (80, 0), (104, 0)], 8.0),
}
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
EPS = 1e-6
TEN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
nm = lambda m: TEN[m % 12] + str(m // 12 - 1)


def luoi(p):
    """Vị trí trong phách: 0 · ⅓ · ½ · ⅔ · ¼ · ¾ · khác."""
    f = p % 1
    for ten, v in (('0', 0), ('1/3', 1 / 3), ('2/3', 2 / 3), ('1/2', .5), ('1/4', .25), ('3/4', .75)):
        if abs(f - v) < .02 or abs(f - v - 1) < .02:
            return ten
    return 'khac'


def phan_tich(ten, file, tonic, vong, don_vi):
    ns, meta = mxl.notes(mxl.load(GOC + file))
    bs = meta['bar_start']
    grace = [n for n in ns if n['dur'] <= EPS]
    real = [n for n in ns if n['dur'] > EPS]
    go = collections.defaultdict(list)          # (tay, phách) -> nốt (gõ mới)
    for n in real:
        if not n['tie_stop']:
            go[(n['hand'], n['beat'])].append(n)
    lh_at = sorted({b for h, b in go if h == 2})

    def bass_luc(t):
        """Nốt trầm nhất tay trái đang vang lúc t (kể cả ngân)."""
        v = [n['midi'] for n in real if n['hand'] == 2 and n['beat'] <= t + EPS and n['beat'] + n['dur'] > t + EPS]
        return min(v) if v else None

    starts = [bs[b] + p for b, p in vong]
    def vi_tri_vong(t):
        for k, s in enumerate(starts):
            if s - EPS <= t < s + 12 * don_vi - EPS:
                return k, int((t - s) // don_vi) + 1
        return None, None

    # ---- tay phải: cú gõ ----
    rh = sorted(((b, sorted({n['midi'] for n in v})) for (h, b), v in go.items() if h == 1), key=lambda x: x[0])
    # ---- câu (phrase): tách theo nghỉ > 1 phách ----
    cau, cur = [], []
    for i, (b, notes) in enumerate(rh):
        if cur:
            prev_end = max(n['beat'] + n['dur'] for n in go[(1, cur[-1][0])])
            if b - prev_end > 1.0 + EPS:
                cau.append(cur); cur = []
        cur.append((b, notes))
    if cur:
        cau.append(cur)

    licks = []
    for c in cau:
        loai = [('don' if len(x[1]) == 1 else 'doi' if len(x[1]) == 2 else 'cum') for x in c]
        n_line = sum(1 for l in loai if l != 'cum')
        if len(c) < 3 or n_line / len(c) < .6:
            continue
        a, z = c[0][0], c[-1][0]
        end = max(n['beat'] + n['dur'] for n in go[(1, z)])
        bass = bass_luc(a)
        goc_ha = (bass - tonic) % 12 if bass is not None else None
        k, o = vi_tri_vong(a)
        tops = [max(x[1]) for x in c]
        bac_key = [BAC[(t - tonic) % 12] for t in tops]
        bac_ha = [BAC[(t - bass_luc(x[0])) % 12] if bass_luc(x[0]) is not None else '?' for x, t in zip(c, tops)]
        gr = [g for g in grace if g['hand'] == 1 and a - EPS <= g['beat'] <= end + EPS]
        lay = []
        for g in gr:
            chinh = [x for x in c if abs(x[0] - g['beat']) < EPS]
            if chinh:
                lay.append(max(chinh[0][1]) - g['midi'])
        doi = [x[1][-1] - x[1][0] for x in c if len(x[1]) == 2]
        lh_trong = [b for b in lh_at if a - EPS <= b < end - EPS]
        licks.append(dict(
            sheet=ten, bar=max(bb for bb, s in bs.items() if s <= a + EPS), at=round(a, 3), len=round(end - a, 3),
            vong=k, o=o, ham=BAC[goc_ha] if goc_ha is not None else '?', so_cu=len(c),
            cu_moi_phach=round(len(c) / max(end - a, EPS), 2),
            luoi=collections.Counter(luoi(x[0]) for x in c),
            bac_key=bac_key, bac_ha=bac_ha,
            nhip=[round(x[0] - a, 3) for x in c], cao=[x[1] for x in c], loai=loai,
            lay=lay, doi=doi, lh_go_trong=len(lh_trong), tam=max(tops) - min(tops),
            dau=bac_ha[0], cuoi=bac_ha[-1],
        ))

    # ---- hoà âm theo đơn vị vòng ----
    ham_vong = []
    for k, s in enumerate(starts):
        row = []
        for u in range(12):
            b = bass_luc(s + u * don_vi + .01)
            row.append(BAC[(b - tonic) % 12] if b is not None else '-')
        ham_vong.append(row)

    # ---- tay trái: hình mỗi ô ----
    hinh_lh = collections.Counter()
    for bar, s in bs.items():
        L = meta['barlens'][bar]
        ev = [(b - s, v) for (h, b), v in go.items() if h == 2 and s - EPS <= b < s + L - EPS]
        if not ev:
            continue
        ev.sort(key=lambda x: x[0])
        goc = min(n['midi'] for n in ev[0][1])
        sig = tuple((luoi(p) if p % 1 else str(int(p)), '+'.join(BAC[(n['midi'] - goc) % 12] for n in sorted(v, key=lambda n: n['midi'])))
                    for p, v in ev)
        hinh_lh[sig] += 1

    # ---- phân bố bậc tay phải (mọi nốt đỉnh của cú một/hai nốt) ----
    bac_rh_key = collections.Counter()
    bac_rh_ha = collections.Counter()
    for b, notes in rh:
        if len(notes) > 2:
            continue
        bb = bass_luc(b)
        bac_rh_key[BAC[(notes[-1] - tonic) % 12]] += 1
        if bb is not None:
            bac_rh_ha[BAC[(notes[-1] - bb) % 12]] += 1

    # ---- cụm tay phải (đệm): quãng so với gốc bass ----
    cum = collections.Counter()
    vi_cum = collections.Counter()
    for b, notes in rh:
        if len(notes) < 3:
            continue
        bb = bass_luc(b)
        if bb is None:
            continue
        cum['+'.join(sorted({BAC[(n - bb) % 12] for n in notes}, key=BAC.index))] += 1
        vi_cum[luoi(b)] += 1

    return dict(licks=licks, ham_vong=ham_vong, hinh_lh=hinh_lh, bac_rh_key=bac_rh_key, bac_rh_ha=bac_rh_ha,
                cum=cum, vi_cum=vi_cum, grace=len([g for g in grace if g['hand'] == 1]), so_cau=len(cau),
                so_cu_rh=len(rh), tempo=None)


def pct(c, total):
    return ' · '.join(f'{k} {v * 100 // max(total, 1)}%' for k, v in c.most_common())


def main():
    out = {}
    for ten, (file, tonic, vong, dv) in SHEETS.items():
        r = phan_tich(ten, file, tonic, vong, dv)
        out[ten] = r
        L = r['licks']
        print(f'\n===== {ten} (chủ âm {TEN[tonic]}) — {len(L)} câu lick / {r["so_cau"]} câu tay phải · {r["so_cu_rh"]} cú · {r["grace"]} nốt láy')
        print('Hoà âm theo đơn vị vòng (bậc bass so với chủ âm):')
        for k, row in enumerate(r['ham_vong']):
            print(f'  vòng {k + 1}: ' + ' | '.join(row))
        n = sum(r['bac_rh_key'].values())
        print(f'Bậc tay phải (cú 1–2 nốt, nốt đỉnh) so CHỦ ÂM (n={n}):', pct(r['bac_rh_key'], n))
        n2 = sum(r['bac_rh_ha'].values())
        print(f'Bậc tay phải so GỐC BASS đang vang (n={n2}):', pct(r['bac_rh_ha'], n2))
        nc = sum(r['cum'].values())
        print(f'Cụm tay phải (≥3 nốt) — bậc so gốc bass, 10 loại nhiều nhất (n={nc}):')
        for k, v in r['cum'].most_common(10):
            print(f'   {v:3} {k}')
        print('   vị trí cụm trong phách:', pct(r['vi_cum'], nc))
        nl = sum(r['hinh_lh'].values())
        print(f'Hình tay trái mỗi ô, 8 hình nhiều nhất (n={nl} ô):')
        for k, v in r['hinh_lh'].most_common(8):
            print(f'   {v:3} ' + '  '.join(f'{p}:{d}' for p, d in k))
        if L:
            print('Câu lick:')
            print('  độ dài (nốt đen) trung vị', sorted(x['len'] for x in L)[len(L) // 2],
                  '· số cú trung vị', sorted(x['so_cu'] for x in L)[len(L) // 2],
                  '· cú/phách trung vị', sorted(x['cu_moi_phach'] for x in L)[len(L) // 2])
            g = collections.Counter()
            for x in L:
                g.update(x['luoi'])
            print('  lưới nhịp của cú trong lick:', pct(g, sum(g.values())))
            print('  hợp âm lúc vào lick (bậc bass):', pct(collections.Counter(x['ham'] for x in L), len(L)))
            print('  ô trong vòng 12 lúc vào lick:', pct(collections.Counter(x['o'] for x in L if x['o']), sum(1 for x in L if x['o'])))
            print('  vào lick ở vị trí trong ô:', pct(collections.Counter(luoi(x['at']) if x['at'] % 1 else f'phách {int(x["at"] % 4) + 1}' for x in L), len(L)))
            print('  nốt KẾT (bậc so hợp âm):', pct(collections.Counter(x['cuoi'] for x in L), len(L)))
            print('  nốt MỞ (bậc so hợp âm):', pct(collections.Counter(x['dau'] for x in L), len(L)))
            lay = collections.Counter(d for x in L for d in x['lay'])
            print('  nốt láy → nốt chính (nửa cung, + = láy dưới lên):', dict(lay.most_common()))
            doi = collections.Counter(d for x in L for d in x['doi'])
            print('  bè đôi — quãng (nửa cung):', dict(doi.most_common()))
            print('  tay trái trong lúc lick (cú / lick) trung vị', sorted(x['lh_go_trong'] for x in L)[len(L) // 2],
                  '· tầm câu (nửa cung) trung vị', sorted(x['tam'] for x in L)[len(L) // 2])
            print('  vài câu lick (ô · vòng/ô12 · hợp âm · nhịp · bậc so hợp âm):')
            for x in L[:14]:
                print(f"   ô{x['bar']} v{x['vong']}/o{x['o']} {x['ham']}: " + ' '.join(
                    f"{t}:{'+'.join(nm(m) for m in c)}({b})" for t, c, b in zip(x['nhip'], x['cao'], x['bac_ha'])))
    if '--json' in sys.argv:
        f = sys.argv[sys.argv.index('--json') + 1]
        json.dump({k: dict(licks=[{kk: (dict(vv) if isinstance(vv, collections.Counter) else vv) for kk, vv in x.items()}
                                  for x in v['licks']], ham_vong=v['ham_vong']) for k, v in out.items()},
                  open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
