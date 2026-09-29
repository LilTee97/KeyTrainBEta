# -*- coding: utf-8 -*-
"""Video Đức Thịnh *Vậy là mình xa nhau* (KN9JEiQXAHs) — TAY TRÁI nối sang hợp âm sau, câu fill tay phải so với câu hát và chỗ đổi
gốc bass, nốt nhẹ trong câu hát. Cho Blue Sun lượt 12 (29/9/2026).

    python -X utf8 scripts/do_noi_hop_am_video_blues.py

Cần sẵn phần tách giọng + bản chép phần đệm (xem `do_cho_chay_video_blues.py`). Gốc bass = cú tay trái có nốt < B2; chỗ đổi gốc =
gốc khác gốc trước và cú gốc kế giữ gốc mới. MÁY CHÉP — chỉ báo: đoạn giọng máy tách chẻ câu hát, phụ đề rải đều mốc chữ nên không
thấy chỗ ngân cuối câu (chỉ 19 chỗ chữ ↔ chữ ≥ 1,2 s cả bài).
"""
import sys, collections, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from do_cho_chay_video_blues import dang_hat, D, GIANG, HET_HAT, TACH, LECH
from do_video_blues_duc_thinh import nm, doc

TEN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
DOAN = [(302, GIANG[0]), (GIANG[1], HET_HAT + 3)]
trong_doan = lambda t: any(a <= t < b for a, b in DOAN)
hat = [h for h in dang_hat(-22) if trong_doan(h[0])]
ns = sorted((t + LECH, p, v) for t, _, p, v in doc(os.path.join(TACH, 'no_vocals.mid')))
cu = []
for t, p, v in ns:
    (cu[-1][1].append((p, v)) if cu and t - cu[-1][0] <= .05 else cu.append([t, [(p, v)]]))
trai = [(t, sorted(p for p, v in x if p < 60)) for t, x in cu if any(p < 60 for p, v in x)]
phai = [(t, sorted((p, v) for p, v in x if p >= 60)) for t, x in cu if any(p >= 60 for p, v in x)]

# 1. GỐC BASS: cú tay trái có nốt < B2 (47) → gốc = nốt thấp nhất. Chỗ đổi gốc = gốc khác gốc trước, và cú gốc kế tiếp giữ gốc mới
goc = [(t, min(p) % 12, min(p)) for t, p in trai if min(p) < 47 and trong_doan(t)]
doi = [goc[k] for k in range(1, len(goc) - 1) if goc[k][1] != goc[k - 1][1] and (goc[k + 1][1] == goc[k][1] or goc[k + 1][0] - goc[k][0] > 1.5)]
print(f'{len(goc)} cú gốc bass · {len(doi)} chỗ đổi gốc trong đoạn hát')

# 2. TAY TRÁI NỐI: các nốt tay trái (nốt thấp nhất mỗi cú) trong 1,3 s (≈ 4 móc) trước chỗ đổi, sau cú gốc cũ cuối cùng
kieu = collections.Counter()
cach = collections.Counter()
vi_du = []
for t, g, p0 in doi:
    cu_goc = [x for x in goc if x[0] < t - .05]
    t_cu = cu_goc[-1][0] if cu_goc else t - 2
    di = [(tt, min(p)) for tt, p in trai if max(t_cu + .05, t - 1.3) <= tt < t - .05]
    if not di:
        kieu['không có nốt nối (chỉ gốc cũ)'] += 1
        continue
    last = di[-1][1]
    k = (last - p0) % 12
    k = k - 12 if k > 6 else k
    cach[{-1: 'nửa cung dưới', 1: 'nửa cung trên', -2: 'một cung dưới', 2: 'một cung trên', 0: 'gốc mới (vào sớm)',
          -5: 'bậc 5 (quãng 4 dưới)', 5: 'quãng 4 trên', 3: 'quãng 3 thứ trên', 4: 'quãng 3 trưởng trên', -3: 'quãng 3 thứ dưới',
          -4: 'quãng 3 trưởng dưới', 6: 'tam cung', -6: 'tam cung'}.get(k, str(k))] += 1
    cao = [m % 12 for _, m in di[-3:]]
    buoc = [((b - a + 6) % 12) - 6 for a, b in zip(cao, cao[1:] + [g])]
    if len(di) >= 2 and all(abs(x) <= 2 and x != 0 for x in buoc):
        kieu['đi liền bậc / nửa cung vào gốc mới (≥ 2 nốt)'] += 1
    elif abs(k) <= 2 and k != 0:
        kieu['một nốt dẫn cách gốc mới ≤ 1 cung'] += 1
    else:
        kieu['nốt hợp âm cũ rồi nhảy vào gốc mới'] += 1
    if len(vi_du) < 14:
        vi_du.append(f'{int(t // 60):02d}:{t % 60:05.2f} {TEN[cu_goc[-1][1]] if cu_goc else "?"}→{TEN[g]}: ' + ' '.join(nm(m) for _, m in di) + f' → {nm(p0)}')
n = sum(kieu.values())
print('TAY TRÁI trước chỗ đổi gốc:', ' · '.join(f'{x} {v} ({v * 100 // n}%)' for x, v in kieu.most_common()))
n = sum(cach.values())
print('  nốt tay trái cuối trước gốc mới, cách gốc mới:', ' · '.join(f'{x} {v}' for x, v in cach.most_common()), f'(n={n})')
for x in vi_du:
    print('   ', x)

# 3. TAY PHẢI: câu fill (≥ 3 cú đơn, cách ≤ 0,4 s, lực ≥ 45) — ở cuối câu hát hay giữa câu; nốt cuối trùng cú gốc mới?
fill, cur = [], []
for t, x in phai:
    if len(x) > 2 or max(v for p, v in x) < 45 or not trong_doan(t):
        continue
    if cur and t - cur[-1][0] <= .4:
        cur.append((t, max(p for p, v in x)))
    else:
        if len(cur) >= 3:
            fill.append(cur)
        cur = [(t, max(p for p, v in x))]
if len(cur) >= 3:
    fill.append(cur)
loai = collections.Counter()
roi = collections.Counter()
for f in fill:
    t0, t1 = f[0][0], f[-1][0]
    seg = next((h for h in hat if h[0] <= t0 < h[1]), None)
    if seg is None:
        loai['khe lấy hơi'] += 1
    elif seg[1] - t0 <= 1.3:
        loai['cuối câu (≤ 1,3 s trước khi giọng tắt, lúc ngân chữ cuối)'] += 1
    else:
        loai['giữa câu'] += 1
    sau = [x for x in doi if x[0] >= t0 - .05]
    if sau:
        dt = sau[0][0] - t1
        roi['nốt cuối TRÙNG cú gốc mới (±0,2 s)' if abs(dt) <= .2 else 'kết trước chỗ đổi (> 0,2 s)' if dt > .2 else 'chạy qua chỗ đổi'] += 1
n = sum(loai.values())
print(f'TAY PHẢI — {len(fill)} câu fill (lực ≥ 45): ' + ' · '.join(f'{x} {v} ({v * 100 // n}%)' for x, v in loai.most_common()))
n = sum(roi.values())
print('  so với chỗ đổi gốc kế tiếp: ' + ' · '.join(f'{x} {v} ({v * 100 // n}%)' for x, v in roi.most_common()))
print(f'  số cú mỗi câu fill: trung vị {np.median([len(f) for f in fill]):.0f} (tứ phân {np.percentile([len(f) for f in fill], 25):.0f}–'
      f'{np.percentile([len(f) for f in fill], 75):.0f})')
# 4. Nốt NHẸ tay phải lúc đang hát (lực < 45): mỗi giây bao nhiêu, cách nhau bao lâu, cao độ
nhe = [(t, max(p for p, v in x)) for t, x in phai if max(v for p, v in x) < 45 and trong_doan(t)]
nh_hat = [x for x in nhe if any(a <= x[0] < b for a, b in hat)]
s_hat = sum(b - a for a, b in hat)
ioi = np.diff([t for t, _ in nh_hat])
ioi = ioi[ioi < 1.5]
print(f'NỐT NHẸ tay phải (lực < 45): {len(nhe)} · lúc giọng vang {len(nh_hat)} ({len(nh_hat) / s_hat:.2f}/s) · cách nhau trung vị '
      f'{np.median(ioi):.2f} s = {np.median(ioi) / .325:.1f} móc · cao độ: ' +
      ' '.join(f'{nm(p)}:{c}' for p, c in collections.Counter(p for _, p in nh_hat).most_common(6)))

import json
d = json.load(open(os.path.join(D, 'blues.vi.json3'), encoding='utf8'))
chu = sorted(((e['tStartMs'] + (s.get('tOffsetMs') or 0)) / 1000, (s.get('utf8') or '').strip()) for e in d['events']
             for s in e.get('segs', []) if (s.get('utf8') or '').strip() and not (s.get('utf8') or '').strip().startswith('['))
chu = [c for c in chu if trong_doan(c[0])]
lp = collections.Counter()
vd = []
for f in fill:
    t0 = f[0][0]
    truoc = [c for c in chu if c[0] <= t0 + .05]
    sau = [c for c in chu if c[0] > t0 + .05]
    dw = t0 - truoc[-1][0] if truoc else 9
    nw = sau[0][0] - f[-1][0] if sau else 9
    k = 'sau chữ ≥ 0,8 s (ngân / dứt câu)' if dw >= .8 else 'ngay sau chữ (< 0,8 s)'
    lp[k] += 1
    if dw < .8 and len(vd) < 12:
        vd.append(f'  {int(t0 // 60):02d}:{t0 % 60:05.2f} {len(f)} cú {" ".join(nm(p) for _, p in f)} · chữ trước "{truoc[-1][1] if truoc else ""}" −{dw:.2f}s · chữ sau "{sau[0][1] if sau else ""}" +{nw:.2f}s')
print('TAY PHẢI theo mốc chữ phụ đề:', dict(lp))
print('\n'.join(vd))

print()
lp2 = collections.Counter()
roi2 = collections.Counter()
cao2 = collections.defaultdict(list)
for f in fill:
    t0, t1 = f[0][0], f[-1][0]
    truoc = [c for c in chu if c[0] <= t0 + .05]
    sau = [c for c in chu if c[0] > t0 + .05]
    if not truoc or not sau:
        continue
    k = 'CUỐI CÂU (chữ trước ↔ chữ sau cách ≥ 1,2 s)' if sau[0][0] - truoc[-1][0] >= 1.2 else 'GIỮA CÂU (chữ liền nhau)'
    lp2[k] += 1
    cao2[k].append(max(p for _, p in f))
    dx = [x for x in doi if x[0] >= t0 - .05]
    if dx and k.startswith('CUỐI'):
        dt = dx[0][0] - t1
        roi2['nốt cuối trùng cú gốc mới (±0,2 s)' if abs(dt) <= .2 else 'kết trước chỗ đổi' if dt > .2 else 'chạy qua chỗ đổi'] += 1
print('TAY PHẢI (chữ trước ↔ chữ sau):', dict(lp2))
for k, v in cao2.items():
    print(f'   {k}: nốt đỉnh trung vị {nm(int(np.median(v)))} · số câu có đỉnh ≥ C5: {sum(1 for x in v if x >= 72)}/{len(v)}')
print('   câu CUỐI CÂU so với chỗ đổi gốc kế tiếp:', dict(roi2))
# Mỗi chỗ nghỉ cuối câu (chữ ↔ chữ ≥ 1,2 s): có câu fill không?
khe = [(a[0], b[0]) for a, b in zip(chu, chu[1:]) if b[0] - a[0] >= 1.2 and b[0] - a[0] < 8]
co = [k for k in khe if any(k[0] - .1 <= f[0][0] < k[1] for f in fill)]
print(f'chỗ cuối câu (chữ ↔ chữ ≥ 1,2 s): {len(khe)} · có câu fill {len(co)} ({len(co) * 100 // len(khe)}%)')
