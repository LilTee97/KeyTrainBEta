# -*- coding: utf-8 -*-
"""Kho NỬA Ô Rockhouse cho bộ soạn Blues Claude lượt 2 — mỗi nửa ô 4/4 swing = 6 móc đơn = MỘT ô 6/8 của người dùng.

    python -X utf8 scripts/phan_tich_blues_nua_o.py              # in số đo
    python -X utf8 scripts/phan_tich_blues_nua_o.py --kho FILE   # ghi kho (src/reharm/style/bluesClaudeO.json)

Người dùng 27/9/2026: "Hướng tiết tấu đệm về nhịp 6/8, phách 1 và 4 là phách chính … Đánh 6 phách là chuyển hợp âm" —
nên đơn vị soạn là một ô 6/8 = một hợp âm. Một ô Rockhouse (12 móc đơn) = HAI ô như thế.

Kho giữ TAY PHẢI nguyên của từng nửa ô (riff hợp âm, bè đôi, nốt đơn, câu chạy) — không cắt cụm ≥ 3 nốt như kho lick lượt
1. Tay trái không lưu: bộ soạn dùng cell đệm (bass 1 · 1 · 3 ở phách 1 · 4 · 6, số đo ở `main`).

Nắn nhịp theo TỪNG PHÁCH (1 phách Rockhouse = 3 móc đơn): phách ≤ 3 cú xếp theo thứ tự vào 0 · ⅓ · ⅔, mỗi cú dời ≤ ⅙
phách; không xếp được, hoặc phách 4 cú (câu chạy móc kép thật, 18/390 phách), thì giữ nguyên. Bằng chứng: ô 105 ghi một
mô-típ 0 · ⅓ · ⅔, ô 106 ghi cùng mô-típ 0 · ¼ · ¾ — ¼/¾ là máy chép lệch của chùm ba.
"""
import collections
import json
import os
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mxl  # noqa: E402
from phan_tich_blues_lick import ky_hieu  # noqa: E402

FILE = 'C:/Users/Tin PC/Downloads/Documents/Linh Nhi/Blues/Rockhouse-Ray-da-sua.mxl'
TONIC = 7
# Vòng Blues Codex chia (ô, phách 0-based); vòng 9 kết ô 114 phách 3 (đuôi kết dựng riêng trong bluesClaudeSolo.ts).
VONG = [(8, 2), (20, 2), (32, 0), (44, 0), (56, 0), (67, 2), (79, 2), (91, 0), (103, 0), (114, 2)]
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
EPS = 1e-6
pc = lambda x: x % 12


def nan_phach(ts):
    """ts: vị trí (phách, trong [0,1)) các cú của một phách → vị trí đã nắn (cùng thứ tự)."""
    if len(ts) >= 4:
        return list(ts)
    slots = [0, 1 / 3, 2 / 3]
    best = None

    def di(i, k, acc):
        nonlocal best
        if i == len(ts):
            if best is None or acc[1] < best[1]:
                best = acc
            return
        for s in range(k, 3):
            d = abs(ts[i] - slots[s])
            if d <= 1 / 6 + EPS:
                di(i + 1, s + 1, (acc[0] + [slots[s]], acc[1] + d))
    di(0, 0, ([], 0))
    return best[0] if best else list(ts)


def main():
    ns, meta = mxl.notes(mxl.load(FILE))
    kh = ky_hieu(FILE)
    bs = meta['bar_start']
    goc = lambda t: ([g for a, g in kh if a <= t + EPS] or [None])[-1]
    dau_vong = [bs[b] + p for b, p in VONG]
    lh = [n for n in ns if n['hand'] == 2 and n['dur'] > EPS and not n['tie_stop']]

    def goc_bass(t0, g_in):
        """Gốc theo BASS, chấm trên CẢ Ô 4/4 (nửa ô sau Rockhouse đi 5 · 3 · 5 — chấm riêng nửa ô thì bậc 5 thắng gốc: bẫy đã
        sập ở lượt 1). Ký hiệu in chỉ khớp bass đầu ô 57/82 ô (ô 113 in C mà bass đi G1 → B1). Thử gốc in và I · IV · V; điểm =
        số nốt tay trái thuộc hợp âm ba 1 · 3 · 5 của gốc + 2 nếu bass phách đầu là gốc + 1 nếu là gốc in. Ký hiệu in đổi đúng
        giữa ô thì chấm riêng từng nửa ô."""
        b = max(k for k in bs if bs[k] <= t0 + EPS)
        giua = any(r != g_in and abs(a - (bs[b] + 2)) < EPS for a, r in kh) or any(abs(a - (bs[b] + 2)) < EPS for a, r in kh)
        tu, den = (t0, t0 + 2) if giua else (bs[b], bs[b] + 4)
        ns_ = sorted((n for n in lh if tu - EPS <= n['beat'] < den - EPS), key=lambda n: (n['beat'], n['midi']))
        if not ns_:
            return g_in
        dau = [n['midi'] for n in ns_ if abs(n['beat'] - tu) < EPS]

        def diem(r):
            return (sum(pc(n['midi'] - r) in (0, 4, 7) for n in ns_) + 2 * bool(dau and pc(min(dau) - r) == 0)
                    + (r == g_in))
        ung = [g_in] + [pc(TONIC + k) for k in (0, 5, 7) if pc(TONIC + k) != g_in]
        return max(ung, key=diem)
    rh = [n for n in ns if n['hand'] == 1 and n['dur'] > EPS and not n['tie_stop']]
    # gom cú, nắn theo phách
    cu = collections.defaultdict(list)
    for n in rh:
        cu[round(n['beat'], 4)].append(n)
    theo_phach = collections.defaultdict(list)
    for t in sorted(cu):
        theo_phach[int(t + EPS)].append(t)
    nan = {}
    so_giu = 0
    for b, ts in theo_phach.items():
        ra = nan_phach([t - b for t in ts])
        if len(ts) >= 4 or ra == [t - b for t in ts] and any(abs((t - b) * 3 - round((t - b) * 3)) > EPS for t in ts):
            so_giu += 1
        for t, r in zip(ts, ra):
            nan[t] = b + r
    starts = sorted(nan.values())

    o = []
    for gi in range(int(dau_vong[0] / 2), int(dau_vong[-1] / 2)):
        t0 = gi * 2.0
        vong = max(k for k in range(9) if dau_vong[k] <= t0 + EPS) + 1
        g_in = goc(t0)
        g = goc_bass(t0, g_in)
        doi = [a for a, r in kh if t0 + EPS < a < t0 + 2 - EPS and r != g_in]
        su = []
        for t in sorted(cu):
            q = nan[t]
            if not (t0 - EPS <= q < t0 + 2 - EPS):
                continue
            ke = next((s for s in starts if s > q + EPS), q + 4)
            notes = sorted({n['midi'] for n in cu[t]})
            ngan = max(n['dur'] for n in cu[t])
            # Độ ngân KHÔNG cắt ở vạch nửa ô (Ray hay ngân một nốt vắt qua vạch); bộ soạn cắt khi nửa ô kế không liền nguồn.
            het = min(q + ngan, ke)
            su.append([round((q - t0) * 3, 3), round(max(het - q, 1 / 6) * 3, 3), notes])
        vao = any(n['beat'] < t0 - EPS and n['beat'] + n['dur'] > t0 + 1 / 6 for n in rh)
        top = [s[2][-1] for s in su]
        so3 = sum(1 for s in su if len(s[2]) >= 3)
        so2 = sum(1 for s in su if len(s[2]) == 2)
        so1 = sum(1 for s in su if len(s[2]) == 1)
        tex = 'nghi' if not su else 'riff' if so3 >= 2 and so3 >= so1 else 'don' if so1 >= so2 + so3 else 'doi'
        o.append({
            'id': f'Rockhouse:o{int(t0 // 4) + 1}:{"phach1" if t0 % 4 < EPS else "phach3"}', 'gi': gi, 'vong': vong,
            'goc': g, **({'gocIn': g_in} if g != g_in else {}), 'ham': pc(g - TONIC), 'doi': bool(doi), 'tex': tex, 'su': su, 'vao': vao,
            'hoDau': su[0][0] if su else 6, 'hoCuoi': round(max(0, 6 - (su[-1][0] + su[-1][1])), 3) if su else 6,
            'dau': top[0] if top else None, 'cuoi': top[-1] if top else None,
        })
    return o, so_giu, len(theo_phach)


def in_so_do(o, so_giu, so_phach):
    print(f'{len(o)} nửa ô (vòng 1–9); phách giữ nguyên nhịp {so_giu}/{so_phach}')
    print('kết cấu:', dict(collections.Counter(x['tex'] for x in o)))
    for h in (0, 5, 7):
        print(f'  bậc {BAC[h]:>2}:', dict(collections.Counter(x['tex'] for x in o if x['ham'] == h and not x['doi'])))
    print('gốc theo bass khác ký hiệu in:', sum('gocIn' in x for x in o), '/', len(o))
    print('khác (bậc):', collections.Counter(BAC[x['ham']] for x in o if x['ham'] not in (0, 5, 7)), '· đổi hợp âm giữa nửa ô:',
          sum(x['doi'] for x in o))
    tr = collections.Counter((a['tex'], b['tex']) for a, b in zip(o, o[1:]))
    print('chuyển kết cấu nửa ô → nửa ô kế:', tr.most_common(10))
    for v in range(1, 10):
        print(f'  vòng {v}:', ' '.join({'riff': 'R', 'don': '·', 'doi': ':', 'nghi': '_'}[x['tex']] for x in o if x['vong'] == v))
    # chỗ ngắt tự nhiên: tay phải nghỉ ≥ 1 móc đơn quanh vạch nửa ô
    ngat = sum(1 for a, b in zip(o, o[1:]) if a['hoCuoi'] + b['hoDau'] >= 1)
    print(f'vạch nửa ô có khoảng nghỉ ≥ 1 móc đơn: {ngat}/{len(o) - 1}')


if __name__ == '__main__':
    o, so_giu, so_phach = main()
    in_so_do(o, so_giu, so_phach)
    if '--kho' in sys.argv:
        out = sys.argv[sys.argv.index('--kho') + 1]
        with open(out, 'w', encoding='utf-8') as f:
            json.dump({'nguon': 'scripts/phan_tich_blues_nua_o.py --kho', 'don_vi': 'móc đơn (1 phách Rockhouse = 3)',
                       'tonic': TONIC, 'o': o}, f, ensure_ascii=False, separators=(',', ':'))
        print('ghi', out)
