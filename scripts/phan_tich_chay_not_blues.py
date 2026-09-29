# -*- coding: utf-8 -*-
"""Số nốt chạy và kỹ thuật chạy nốt trong Rockhouse · Robert (so với The House of the Rising Sun) — cho mật độ câu chạy của
nút Blue Sun. Người dùng 28/9/2026: *"nên bớt số nốt chạy lại … hãy tham khảo 2 sheet Rockhouse và Robert để xem số lượng nốt
chạy và các kỹ thuật chạy nốt trong 2 sheet đó"*.

    python -X utf8 scripts/phan_tich_chay_not_blues.py

ĐƠN VỊ CHUNG = một ô 6/8 của người dùng = 2 phách thật = 6 móc đơn:
  Rockhouse (4/4 swing, ♩ = 88) → nửa ô 4/4 · Robert (ghi 4/4 ♩ = 162, 2 phách ghi = 1 phách thật) → một ô ghi ·
  Rising Sun (6/8) → một ô.
CÂU CHẠY = ≥ 4 cú tay phải liền, mỗi cú cách cú trước ≤ 1 móc đơn (⅓ phách thật). Tốc độ đo bằng số cú mỗi móc đơn.
"""
import collections
import statistics as st
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402

# tên: (file, số phách ghi của một PHÁCH THẬT, số phách ghi của một ĐƠN VỊ, ô đầu, ô cuối)
NGUON = {
    'Rockhouse': ('C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues/Rockhouse-Ray-da-sua.mxl', 1, 2, 8, 114),
    'Robert': ('C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues/Robert-Ray-chia-doan-C-Blues.mxl', 2, 4, 10, 131),
    'Rising Sun': ('D:/PianoBrain/exports/songscription/The-House-of-the-Rising-Sun.mxl', 1.5, 3, 1, 15),
}
EPS = 1e-6


def do(ten, f, phach, don_vi, tu, den):
    ns, meta = mxl.notes(mxl.load(f))
    moc = phach / 3
    cu = collections.defaultdict(list)
    for n in ns:
        if n['hand'] == 1 and n['dur'] > EPS and not n['tie_stop'] and tu <= n['bar'] <= den:
            cu[round(n['beat'], 4)].append(n['midi'])
    ts = sorted(cu)
    t0, t1 = min(ts), max(ts)
    so_dv = int((t1 - t0) // don_vi) + 1
    moi_dv = collections.Counter(int((t - t0) // don_vi) for t in ts)
    dem = [moi_dv.get(i, 0) for i in range(so_dv)]
    # câu chạy
    chay, lien = [], [ts[0]]
    for a, b in zip(ts, ts[1:]):
        if b - a <= moc + EPS:
            lien.append(b)
        else:
            if len(lien) >= 4:
                chay.append(lien)
            lien = [b]
    if len(lien) >= 4:
        chay.append(lien)
    dv_chay = {int((t - t0) // don_vi) for c in chay for t in c}
    dai = [len(c) for c in chay]
    toc = [(len(c) - 1) / ((c[-1] - c[0]) / moc) for c in chay if c[-1] > c[0]]
    # kỹ thuật trong câu chạy (theo nốt đỉnh)
    buoc = collections.Counter()
    hai, lap, crush, doi_chieu = 0, 0, 0, 0
    tong_not = 0
    for c in chay:
        top = [max(cu[t]) for t in c]
        tong_not += len(c)
        hai += sum(1 for t in c if len(set(cu[t])) >= 2)
        crush += sum(1 for t in c if any(p + 1 in cu[t] for p in cu[t]))
        for x, y in zip(top, top[1:]):
            k = abs(y - x)
            buoc['lặp' if k == 0 else 'nửa cung' if k == 1 else 'liền bậc (2–3)' if k <= 3 else 'quãng 4–5' if k <= 7 else 'nhảy > 5'] += 1
        huong = [(y > x) - (y < x) for x, y in zip(top, top[1:]) if y != x]
        doi_chieu += sum(1 for a, b in zip(huong, huong[1:]) if a != b)
    tb = sum(buoc.values())
    print(f'\n== {ten}: {so_dv} đơn vị (ô 6/8)')
    print(f'  cú tay phải mỗi ô: trung vị {st.median(dem):g} · trung bình {st.mean(dem):.1f} · ô trống {sum(1 for d in dem if d == 0)}/{so_dv}')
    print(f'  câu chạy: {len(chay)} câu · {len(chay) * 100 / so_dv:.0f} câu/100 ô · ô có câu chạy {len(dv_chay)}/{so_dv} ({len(dv_chay) * 100 // so_dv}%)')
    if chay:
        print(f'  dài (số nốt): trung vị {st.median(dai):g} · phân bố {sorted(collections.Counter(dai).items())}')
        print(f'  tốc độ (cú mỗi móc đơn): trung vị {st.median(toc):.2f} (1 = móc đơn chùm ba · 1,5 = móc kép · 3 = móc kép chùm ba)')
        print('  bước giữa hai nốt đỉnh:', ' · '.join(f'{k} {v * 100 // tb}%' for k, v in buoc.most_common()))
        print(f'  bè đôi / hợp âm trong câu chạy {hai}/{tong_not} cú · láy chồng nửa cung {crush} cú · đổi chiều {doi_chieu} lần'
              f' ({doi_chieu / len(chay):.1f} lần mỗi câu)')


def main():
    for ten, args in NGUON.items():
        do(ten, *args)


if __name__ == '__main__':
    main()
