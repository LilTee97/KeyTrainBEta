"""Đệm RẢI HAI TAY trong Anh Cứ Đi Đi (Cà Pháo), từ ô 9 — số đo cho nút "Ballad cứ đi".

python -B scripts/audit_cp_acdd_rai.py            # bảng theo ô + tổng theo đoạn
python -B scripts/audit_cp_acdd_rai.py --o 9 16   # chỉ in chi tiết các ô 9–16

Đo trên lưới MÓC KÉP (16 vị trí / ô 4/4), nối dấu nối trong ô, bỏ nốt láy (`joined_attacks`).
- CHUỖI RẢI: các vị trí móc kép LIỀN nhau đều có tiếng gõ, cao độ tăng dần (tay trái: nốt của cú; tay phải: nốt THẤP NHẤT
  của cú), dài ≥ 4. "Hai tay" = chuỗi có cả tiếng tay trái lẫn tay phải.
- BẬC so với GỐC hợp âm in trên sheet (<harmony>) đang vang ở vị trí ấy.
- PHA: bass (nốt thấp nhất tay trái ở vị trí 0) là gốc hợp âm in → vạch nhịp đúng pha.
"""
import argparse
import collections
from pathlib import Path

from audit_ca_phao import audit, load
from audit_cp_acdd import joined_attacks

SOURCE = Path('D:/PianoBrain/video/Ca_Phao/Anh Cu Di Di- Ca Phao.mxl')
# Đoạn theo phiếu chia đoạn đã chốt cửa lời (Reference/ANH-CU-DI-DI-CP-PHAN-DOAN.md); ô 33 · 37 · 62 là ô chứa ranh giới — bỏ.
DOAN = {'phiên 1a (1–8)': range(1, 9), 'phiên 1b (9–16)': range(9, 17), 'điệp 1 (17–32)': range(17, 33),
        'phiên 2 (38–45)': range(38, 46), 'điệp 2 (46–61)': range(46, 62)}
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
TEN_BAC = {0: '1', 1: 'b9', 2: '9', 3: 'b3', 4: '3', 5: '11', 6: 'b5', 7: '5', 8: 'b13', 9: '6', 10: 'b7', 11: '7'}


def pc_ten(ten):
    return (PC[ten[0]] + ten.count('#') - ten.count('b')) % 12


def goc_tai(info, at):
    hs = [h for h in info['harmony'] if h['at'] <= at + 1e-6]
    return pc_ten(hs[-1]['root']) if hs else None


def cu_go(info):
    """{(tay, vị trí móc kép): [nốt]} — tay 2 = trái, 1 = phải. Vị trí ngoài lưới móc kép bị đếm riêng."""
    g, le = collections.defaultdict(list), 0
    for n in joined_attacks(info):
        s = n['at'] * 4
        if abs(s - round(s)) > 1e-6:
            le += 1
            continue
        g[n['hand'], round(s)].append(n)
    return g, le


def chuoi(g):
    """Chuỗi rải: vị trí liền nhau, nốt đại diện tăng dần, dài ≥ 4. Trả [(đầu, [(vị trí, tay, midi)])]."""
    dai = {}
    for s in range(16):
        ung = []
        if (2, s) in g:
            ung.append((2, max(n['midi'] for n in g[2, s])))
        if (1, s) in g:
            ung.append((1, min(n['midi'] for n in g[1, s])))
        if ung:
            dai[s] = ung
    out, s = [], 0
    while s < 16:
        if s not in dai:
            s += 1
            continue
        best = []
        # thử bắt đầu bằng từng tay có mặt ở vị trí s
        for tay, m in dai[s]:
            run, cur = [(s, tay, m)], m
            t = s + 1
            while t in dai:
                nxt = [x for x in dai[t] if x[1] > cur]
                if not nxt:
                    break
                tay2, m2 = min(nxt, key=lambda x: x[1])
                run.append((t, tay2, m2))
                cur, t = m2, t + 1
            if len(run) > len(best):
                best = run
        if len(best) >= 4:
            out.append((s, best))
            s = best[-1][0] + 1
        else:
            s += 1
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--o', nargs=2, type=int)
    a = ap.parse_args()
    d = audit(SOURCE)
    root = load(SOURCE)
    print('fifths:', [e.text for e in root.iter() if e.tag == 'fifths'][:1])
    hop = collections.Counter()
    dai = collections.Counter()
    for bar, info in d.items():
        if not bar.isdigit():
            continue
        hs = info['harmony']
        for i, h in enumerate(hs):
            hop[h['root'] + (h['text'] or h['kind'])] += 1
            den = hs[i + 1]['at'] if i + 1 < len(hs) else info['length']
            dai[h['root'] + (h['text'] or h['kind'])] += den - h['at']
    so = sorted((int(b) for b in d if b.isdigit()))
    cuoi = next(h for b in reversed(so) for h in reversed(d[str(b)]['harmony']))
    print('hợp âm cuối:', cuoi['root'], cuoi['kind'], '· hay gặp nhất:', hop.most_common(3), '· giữ dài nhất (phách):', dai.most_common(3))

    if a.o:
        for bar in range(a.o[0], a.o[1] + 1):
            info = d[str(bar)]
            g, le = cu_go(info)
            print(f'ô {bar}', [f"{h['at']}:{h['root']}{h['text'] or h['kind']}" for h in info['harmony']], 'lệch lưới', le)
            for s0, run in chuoi(g):
                r = goc_tai(info, s0 / 4)
                print('   chuỗi từ', s0 / 4, ' '.join(f"{'T' if t == 2 else 'P'}{TEN_BAC[(m - r) % 12]}" for _, t, m in run))
        return

    for ten, bars in DOAN.items():
        pha = lech = 0
        slotT, slotP = collections.Counter(), collections.Counter()
        o_hai_tay = 0
        dau = collections.Counter()
        do_dai = collections.Counter()
        chuyen = collections.Counter()
        bacT = collections.Counter()
        bacP = collections.Counter()
        giat_trai = 0
        for bar in bars:
            info = d[str(bar)]
            g, le = cu_go(info)
            lech += le
            r0 = goc_tai(info, 0)
            if (2, 0) in g and r0 is not None and min(n['midi'] for n in g[2, 0]) % 12 == r0:
                pha += 1
            for (t, s) in g:
                (slotT if t == 2 else slotP)[s] += 1
            runs = chuoi(g)
            co = False
            for s0, run in runs:
                tays = {t for _, t, _ in run}
                if tays == {1, 2}:
                    co = True
                    dau[s0] += 1
                    do_dai[len(run)] += 1
                    for (s, t, m), (s2, t2, _) in zip(run, run[1:]):
                        if t == 2 and t2 == 1:
                            chuyen[s2] += 1
                    for s, t, m in run:
                        r = goc_tai(info, s / 4)
                        (bacT if t == 2 else bacP)[TEN_BAC[(m - r) % 12]] += 1
            o_hai_tay += co
        n = len(bars)
        print(f'\n== {ten}: {n} ô · bass đầu ô là gốc in {pha}/{n} · cú lệch lưới móc kép {lech}')
        print('  ô có chuỗi rải HAI TAY:', f'{o_hai_tay}/{n}', '· chuỗi bắt đầu ở (phách):',
              {f'{s / 4 + 1:g}': c for s, c in sorted(dau.items())}, '· độ dài:', dict(sorted(do_dai.items())))
        print('  chỗ chuyển tay trái → phải (phách):', {f'{s / 4 + 1:g}': c for s, c in sorted(chuyen.items())})
        print('  bậc trong chuỗi — tay trái:', dict(bacT.most_common()), '· tay phải:', dict(bacP.most_common()))
        print('  tay trái gõ theo vị trí (phách):', ' '.join(f'{s / 4 + 1:g}:{slotT[s]}' for s in range(16) if slotT[s]))
        print('  tay phải gõ theo vị trí (phách):', ' '.join(f'{s / 4 + 1:g}:{slotP[s]}' for s in range(16) if slotP[s]))


if __name__ == '__main__':
    main()
