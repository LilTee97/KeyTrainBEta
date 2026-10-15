"""Đo HAI TAY của SSA trong ba clip "Rải Ngón" bằng HÌNH — camera trên cao thấy cả hai tay, nên biết mỗi nốt chép do tay nào đánh.

Dùng cho Mưa khung nốt · lối SSA (KeyTrain `src/thay/hocSolo/loiSsa.ts`) và md `knowledge/teachers/ssa-rai-ngon.md` (PianoBrain).
Chạy: `python tools/do_tay_ssa.py [--bang] [--canh] [--ve <clip> <giây> …]` — cần ffmpeg, numpy, librosa; `--ve` cần Pillow.
Nốt chép và đoạn hợp âm lấy như `do_rai_ssa.py`. Người dùng 15/10/2026: "Hãy phân tích kỹ xem anh SSA đã solo theo cách nào …".

Cách đo (15/10/2026):
1. Khung hình 10 khung/giây, cắt dải phím (đầu phím đen → mép phím trắng).
2. Da tay: ngưỡng YCrCb (clip 1–2 phím trắng ngả kem — Cr 131..138, Y ≥ 198; da Cr 157..171, Y 84..148, đo 8 điểm — nên ngưỡng chặt
   hơn); bỏ da trong 3 px quanh vạch đỏ (hình có lớp tô đỏ phím đang giữ, mép hồng pha trắng rơi vào ngưỡng da); chỉ tìm trong tầm nốt thật
   ± 60 px (mép phải clip 3 mang màu da ở ~100 % khung trong khi nốt cao nhất La♭5 ở x = 475).
3. Cột có ≥ 6 điểm da → khối (nối khe ≤ 10 px, bỏ khối hẹp); trái = tay trái. Một khối rộng gấp 1,7 tay → hai tay chạm nhau, cắt ở cột ít
   da nhất khúc giữa; một khối thường → tay gần tâm khung trước hơn.
4. x → phím: x tâm phím trắng = A·(chỉ số phím trắng) + B, khớp vạch đỏ với nốt chép đang vang (`--canh`): clip 3 121 khớp / 19 lệch →
   Đô 4 ở x = 313; clip 1–2 cùng một góc máy (phím đen trùng vị trí) → Đô 4 ở x ≈ 324, khớp cách đọc tay (bass Đô 2 sáng đỏ ở x ≈ 50).
5. Gán nốt lúc gõ: nằm trong khối một tay → tay ấy; sát mép (½ phím trắng) → tay ấy; nằm ngoài cả hai → tay gần mép hơn (thường là
   ngón cái chìa ra ngoài khối da).
Soát bằng mắt (`--ve`): 30 khung ngẫu nhiên (10 mỗi clip) + 6 khung chỗ ngờ — khớp hình, trừ nốt nằm đúng giữa hai tay (Rai 1 · 0:31 Mi3).
"""
import json
import os
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from statistics import median

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from do_rai_ssa import CLIP, LOAI, PC, TEN, THU_MUC_VIDEO, doc_not, nhom_duoi  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8')
DOAN = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'du_lieu', 'doan_hop_am_rai_ssa.json'), encoding='utf-8'))
W, FPS = 720, 10
DAI = {'rai1': (312, 140), 'rai2': (312, 140), 'rai3': (372, 100)}  # (y0, cao) dải phím trong khung 720×1280
HANG_TRANG = {'rai1': 426, 'rai2': 426, 'rai3': 456}  # hàng giữa mặt phím trắng (dưới phím đen) — cho `--canh`
AB = {'rai1': (19.6, -362.0), 'rai2': (19.6, -362.0), 'rai3': (14.1, -180.5)}  # từ `--canh`
TRANG = {0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6}
TRIAD = {(0, 4, 7): 'trưởng', (0, 3, 7): 'thứ', (0, 3, 6): 'giảm', (0, 4, 8): 'tăng', (0, 5, 7): 'sus4', (0, 2, 7): 'sus2'}
BAC = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']


def ten(m):
    return f'{TEN[m % 12]}{m // 12 - 1}'


def chi_so_trang(m):
    return (m // 12) * 7 + TRANG[m % 12] if m % 12 in TRANG else None


def x_cua(clip, m):
    a, b = AB[clip]
    if m % 12 in TRANG:
        return a * chi_so_trang(m) + b
    return a * (chi_so_trang(m - 1) + 0.5) + b


def cao_do_cua(clip, x):
    """x → cao độ liên tục (nửa cung), nội suy giữa các phím trắng."""
    a, b = AB[clip]
    q, r = divmod((x - b) / a, 7)
    st = [0, 2, 4, 5, 7, 9, 11, 12]
    i = int(r)
    return 12 * q + st[i] + (st[i + 1] - st[i]) * (r - i)


def khung(clip, fps, y0, h):
    cmd = ['ffmpeg', '-v', 'error', '-i', os.path.join(THU_MUC_VIDEO, f'{CLIP[clip]}.mp4'), '-vf', f'fps={fps},crop={W}:{h}:0:{y0}',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, W, 3)


def da(f, clip):
    x = f.astype(np.float32)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    y = 0.299 * r + 0.587 * g + 0.114 * b
    cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b
    cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b
    if clip in ('rai1', 'rai2'):
        return (cr > 145) & (cr < 185) & (cb > 80) & (cb < 125) & (y > 45) & (y < 190)
    return (cr > 135) & (cr < 178) & (cb > 80) & (cb < 128) & (y > 70)


def theo_dau(clip, notes):
    """Mỗi khung: [(x0, x1, tâm, cột ít da nhất khúc giữa)] các khối da, trái → phải."""
    y0, h = DAI[clip]
    tu = max(0, int(x_cua(clip, min(n['m'] for n in notes))) - 60)
    den = min(W, int(x_cua(clip, max(n['m'] for n in notes))) + 60)
    out = []
    for f in khung(clip, FPS, y0, h):
        r, g, b = (f[..., i].astype(int) for i in range(3))
        do = (r > 150) & (g < 110) & (b < 120)
        gan_do = do.copy()
        for d in (1, 2, 3):
            gan_do[:, d:] |= do[:, :-d]
            gan_do[:, :-d] |= do[:, d:]
        mat = da(f, clip) & ~gan_do
        mat[:, :tu] = False
        mat[:, den:] = False
        cot = mat.sum(axis=0)
        co = cot >= 6
        khoi, x = [], 0
        while x < W:
            if co[x]:
                x0 = x
                while x < W and co[x]:
                    x += 1
                if khoi and x0 - khoi[-1][1] <= 10:
                    khoi[-1][1] = x - 1
                else:
                    khoi.append([x0, x - 1])
            x += 1
        ra = []
        for k0, k1 in khoi:
            if k1 - k0 + 1 < (18 if clip == 'rai3' else 25):
                continue
            c = cot[k0:k1 + 1]
            g0, g1 = int(len(c) * 0.3), int(len(c) * 0.7)
            eo = k0 + g0 + int(np.argmin(c[g0:g1 + 1])) if g1 > g0 else (k0 + k1) // 2
            ra.append((k0, k1, float((np.arange(k0, k1 + 1) * c).sum() / max(1, c.sum())), eo))
        out.append(ra)
    return out


def tay_moi_khung(khoi_all):
    rong2 = [k[1] - k[0] for ks in khoi_all if len(ks) == 2 for k in ks]
    rong_tay = median(rong2) if rong2 else 100
    truoc = {'L': None, 'R': None}
    out = []
    for ks in khoi_all:
        ks = sorted(sorted(ks, key=lambda k: -(k[1] - k[0]))[:2], key=lambda k: k[0])
        kq = {'L': None, 'R': None, 'kieu': str(len(ks))}
        if len(ks) == 2:
            kq['L'], kq['R'] = ks
        elif len(ks) == 1:
            k = ks[0]
            if k[1] - k[0] > 1.7 * rong_tay:
                kq['L'], kq['R'], kq['kieu'] = (k[0], k[3], (k[0] + k[3]) / 2), (k[3], k[1], (k[3] + k[1]) / 2), 'dinh'
            else:
                dl = abs(k[2] - truoc['L'][2]) if truoc['L'] else 1e9
                dr = abs(k[2] - truoc['R'][2]) if truoc['R'] else 1e9
                kq['L' if dl < dr else 'R'] = k
        for t in 'LR':
            if kq[t]:
                truoc[t] = kq[t]
        out.append(kq)
    return out


def gan_tay(clip, notes, tay):
    a = AB[clip][0]
    for n in notes:
        x = x_cua(clip, n['m'])
        k = min(len(tay) - 1, int(round(n['on'] * FPS)))
        n['tay'], n['gan'] = None, 'không'
        for dk in (0, -1, 1, -2, 2):
            kk = k + dk
            if not (0 <= kk < len(tay)) or tay[kk]['kieu'] not in ('2', 'dinh'):
                continue
            L, R = tay[kk]['L'], tay[kk]['R']
            m = a / 2
            inL0, inR0 = L[0] <= x <= L[1], R[0] <= x <= R[1]
            inL, inR = L[0] - m <= x <= L[1] + m, R[0] - m <= x <= R[1] + m
            if inL0 != inR0:
                n['tay'], n['gan'] = ('L' if inL0 else 'R'), 'trong khối'
            elif inL != inR:
                n['tay'], n['gan'] = ('L' if inL else 'R'), 'sát khối'
            else:
                dL = abs(x - L[2]) if inL else min(abs(x - L[0]), abs(x - L[1]))
                dR = abs(x - R[2]) if inR else min(abs(x - R[0]), abs(x - R[1]))
                n['tay'], n['gan'] = ('L' if dL < dR else 'R'), 'gần nhất'
            break
        if n['tay'] is None and tay[k]['kieu'] == '1':
            H = 'L' if tay[k]['L'] else 'R'
            K = tay[k][H]
            inside = K[0] - a / 2 <= x <= K[1] + a / 2
            n['tay'], n['gan'] = (H, 'một tay thấy') if inside else ('R' if H == 'L' else 'L', 'tay kia (khuất)')
        if n['tay'] is None:
            n['tay'], n['gan'] = ('L' if n['m'] < 60 else 'R'), 'đoán theo C4'


def gan_doan(clip, notes):
    """Như do_rai_ssa.py: đoạn có [s − 0,5, e) chứa lúc gõ; ưu tiên đoạn có nốt ấy trong nhãn, rồi đoạn bắt đầu muộn hơn."""
    doan = DOAN[clip]['doan']
    gan = defaultdict(list)
    for n in notes:
        ung = [i for i, d in enumerate(doan) if d[0] - 0.5 <= n['on'] < d[1]]
        if not ung:
            continue

        def co(i):
            d = doan[i]
            return n['m'] % 12 in {(PC[d[2]] + x) % 12 for x in LOAI[d[3]]} | ({PC[d[4]]} if d[4] else set())
        tot = [i for i in ung if co(i)] or ung
        gan[max(tot, key=lambda i: doan[i][0])].append(n)
    return gan


def phach(clip):
    import librosa
    with tempfile.TemporaryDirectory() as tam:
        wav = os.path.join(tam, 'a.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(THU_MUC_VIDEO, f'{CLIP[clip]}.mp4'), '-ac', '1', '-ar', '22050', wav],
                       check=True)
        y, sr = librosa.load(wav, sr=22050)
    return np.asarray(librosa.beat.beat_track(y=y, sr=sr, units='time')[1])


def nhom_go(ns, cua=0.06):
    """Gom nốt gõ gần như cùng lúc (≤ 60 ms từ nốt đầu nhóm)."""
    out = []
    for n in sorted(ns, key=lambda n: (n['on'], n['m'])):
        if out and n['on'] - out[-1][0]['on'] <= cua:
            out[-1].append(n)
        else:
            out.append([n])
    return out


def tim_ba(pcs, bass):
    """Hợp âm ba trong tập pcs tay phải → 'thứ trên 3' … (gốc tính từ bass). Ưu tiên trưởng/thứ, rồi gốc khác bass."""
    pcs = sorted(set(pcs))
    out = []
    for g in pcs:
        for k, loai in TRIAD.items():
            if all((g + i) % 12 in pcs for i in k):
                out.append((loai not in ('trưởng', 'thứ'), (g - bass) % 12 == 0, loai, BAC[(g - bass) % 12]))
    return f'{min(out)[2]} trên {min(out)[3]}' if out else None


def canh():
    """Khớp vạch đỏ (phím trắng đang sáng) với nốt chép đang vang → (A, B) tốt nhất mỗi clip."""
    for clip, aa in [('rai1', np.arange(18.5, 21, 0.05)), ('rai2', np.arange(18.5, 21, 0.05)), ('rai3', np.arange(13, 15.5, 0.05))]:
        notes = doc_not(clip)
        mau = []
        for i, f in enumerate(khung(clip, 2, HANG_TRANG[clip] - 2, 4)):
            t = (i + 0.5) / 2
            r, g, b = f[1, :, 0].astype(int), f[1, :, 1].astype(int), f[1, :, 2].astype(int)
            do = (r > 150) & (g < 110) & (b < 120)
            xs, x = [], 0
            while x < W:
                if do[x]:
                    x0 = x
                    while x < W and do[x]:
                        x += 1
                    if x - x0 >= 4:
                        xs.append((x0 + x - 1) / 2)
                x += 1
            ws = sorted({chi_so_trang(n['m']) for n in notes if n['on'] <= t <= n['off'] and chi_so_trang(n['m']) is not None})
            if xs and ws:
                mau.append((xs, ws))

        def diem(a, b):
            tot = sum(1 for xs, ws in mau for x in xs if min(abs(x - (a * w + b)) for w in ws) < a * 0.4)
            return tot, sum(len(xs) for xs, _ in mau) - tot
        ung = {}
        for a in aa:
            bs = [round((x - a * w) * 2) / 2 for xs, ws in mau for x in xs for w in ws]
            vals, cnt = np.unique(bs, return_counts=True)
            for v in vals[np.argsort(-cnt)[:5]]:
                ung[(round(float(a), 2), float(v))] = diem(a, v)
        (a, b), (tot, xau) = max(ung.items(), key=lambda kv: kv[1][0] - kv[1][1])
        print(f'{clip}: {len(mau)} khung · A = {a} · B = {b} · khớp {tot} lệch {xau} → Đô 4 ở x = {a * chi_so_trang(60) + b:.0f}')


def ve(clip, gio):
    """Ảnh soát: khối tay trái (xanh) / phải (hồng) và vạch nốt gõ quanh từng lúc (màu theo tay được gán)."""
    from PIL import Image, ImageDraw
    notes = sorted(doc_not(clip), key=lambda n: (n['on'], n['m']))
    tay = tay_moi_khung(theo_dau(clip, notes))
    gan_tay(clip, notes, tay)
    y0, h = DAI[clip]
    fr = khung(clip, FPS, y0 - 20, h + 60)
    anh = []
    for t in gio:
        k = min(len(fr) - 1, int(round(t * FPS)))
        im = Image.fromarray(fr[k].copy())
        d = ImageDraw.Draw(im)
        for s, mau in (('L', (0, 160, 255)), ('R', (255, 0, 200))):
            if tay[k][s]:
                d.rectangle([tay[k][s][0], 2, tay[k][s][1], h + 57], outline=mau, width=3)
        cung = [n for n in notes if t - 0.15 <= n['on'] <= t + 0.15]
        for n in cung:
            x = x_cua(clip, n['m'])
            d.rectangle([x - 3, h + 40, x + 3, h + 58], fill=(0, 160, 255) if n['tay'] == 'L' else (255, 0, 200))
        d.text((4, 2), f'{t:.2f}s ' + ' '.join(f"{ten(n['m'])}{n['tay']}" for n in cung), fill=(0, 0, 0))
        anh.append(np.asarray(im))
    ra = os.path.join(tempfile.gettempdir(), f've_tay_{clip}.png')
    Image.fromarray(np.vstack(anh)).save(ra)
    print('ảnh soát:', ra)


def main():
    tong = defaultdict(Counter)
    ds = []
    gan_n = {}
    for clip in CLIP:
        notes = sorted(doc_not(clip), key=lambda n: (n['on'], n['m']))
        khoi = theo_dau(clip, notes)
        tay = tay_moi_khung(khoi)
        for k in tay:
            tong['khung'][(clip, k['kieu'])] += 1
        gan_tay(clip, notes, tay)
        for n in notes:
            tong['gán'][n['gan']] += 1
        gan_n[clip] = (notes, tay, phach(clip))
        gan = gan_doan(clip, notes)
        for i, (s, e, goc, loai, bass) in enumerate(DOAN[clip]['doan']):
            ns = sorted(gan[i], key=lambda n: (n['on'], n['m']))
            if not ns:
                continue
            trai = [n for n in ns if n['tay'] == 'L']
            phai = [n for n in ns if n['tay'] == 'R']
            cao = sorted({n['m'] for n in ns})
            khe = [(cao[q + 1] - cao[q], cao[q]) for q in range(len(cao) - 1) if 40 <= cao[q] and cao[q + 1] <= 76]
            tach = max(khe)[1] if khe and max(khe)[0] >= 3 else 59
            for n in ns:
                tong['so tách cũ'][('khớp' if (n['m'] <= tach) == (n['tay'] == 'L') else 'lệch')] += 1
            ds.append(dict(clip=clip, s=s, nhan=f'{goc}{loai}' + (f'/{bass}' if bass else ''), nhom=nhom_duoi(loai), trai=trai, phai=phai,
                           gt=nhom_go(trai), gp=nhom_go(phai),
                           bass_pc=PC[bass] if bass else (min(trai, key=lambda n: n['m'])['m'] % 12 if trai else PC[goc])))

    print('=== THEO DẤU ===')
    for clip in CLIP:
        c = {k[1]: v for k, v in tong['khung'].items() if k[0] == clip}
        print(f'  {clip}: {sum(c.values())} khung · hai khối {c.get("2", 0)} · hai tay chạm (cắt đôi) {c.get("dinh", 0)} · một tay {c.get("1", 0)} · '
              f'không thấy {c.get("0", 0)}')
    print('  gán nốt:', dict(tong['gán']), '/', sum(tong['gán'].values()))
    print('  so với tách theo khoảng trống cao độ (do_rai_ssa.py):', dict(tong['so tách cũ']))

    print(f'\n=== TAY TRÁI ({len(ds)} đoạn hợp âm) ===')
    co, kieu, q2 = Counter(), Counter(), Counter()
    for d in ds:
        for x in d['gt']:
            co[min(len(x), 4)] += 1
            if len(x) >= 2:
                ms = sorted(n['m'] for n in x)
                q2['+'.join(str(m - ms[0]) for m in ms[1:])] += 1
        if not d['gt']:
            continue
        don = [x[0]['m'] for x in d['gt'] if len(x) == 1]
        lien = sum(1 for a, b in zip(don, don[1:]) if 1 <= abs(b - a) <= 2)
        kieu['chạy liền bậc (≥ 2 bước ≤ 2 nửa cung)' if lien >= 2 else 'rải ≥ 3 nốt đơn' if len(don) >= 3 else
             '2 cú gõ (bass rồi 8 / 5 …)' if len(d['gt']) >= 2 else 'một cú gõ'] += 1
    print('  nốt mỗi đoạn: trung vị', median(len(d['trai']) for d in ds))
    print('  cỡ cú gõ (nốt cùng lúc ≤ 60 ms):', dict(sorted(co.items())))
    print('  quãng trong cú gõ 2+ nốt (nửa cung từ nốt thấp):', q2.most_common(6))
    print('  kiểu mỗi đoạn có tay trái:', dict(kieu), '/', sum(kieu.values()))

    print('\n=== TAY PHẢI ===')
    co, tren, ba, quang8 = Counter(), Counter(), defaultdict(Counter), Counter()
    for d in ds:
        da_ba = False
        for x in d['gp']:
            co[min(len(x), 5)] += 1
            t = x[0]['on']
            if len(x) == 1:
                giu = [n for n in d['phai'] if n['on'] < t - 0.03 and n['off'] > t + 0.03]
                tren['≥ 2 nốt đang giữ' if len(giu) >= 2 else '1 nốt đang giữ' if giu else 'không giữ'] += 1
            vang = {n['m'] for n in d['phai'] if n['on'] <= t + 0.03 and n['off'] > t + 0.03}
            if len(vang) >= 3 and not da_ba:
                tb = tim_ba([m % 12 for m in vang], d['bass_pc'])
                if tb:
                    ba[d['nhom']][tb] += 1
                    quang8[ten(min(vang))[-1]] += 1
                    da_ba = True
    print('  cỡ cú gõ:', dict(sorted(co.items())))
    print('  nốt đơn gõ khi tay phải đang giữ:', dict(tren), '/', sum(tren.values()))
    print('  hợp âm ba tay phải đầu tiên mỗi đoạn (≥ 3 nốt đang vang), gốc tính từ bass:')
    for nh in sorted(ba, key=lambda k: -sum(ba[k].values()))[:6]:
        print(f'    [{nh}] {dict(ba[nh].most_common(4))} / {sum(ba[nh].values())}')
    print('  quãng tám của nốt thấp nhất trong chồng:', dict(sorted(quang8.items())))

    print('\n=== CHẠY (≥ 3 nốt đơn liền, cùng tay, cách ≤ 0,45 s) ===')
    for t_ in 'LR':
        chuoi = []
        for clip, (notes, _, _) in gan_n.items():
            cur = []
            for x in nhom_go([n for n in notes if n['tay'] == t_]):
                if len(x) == 1 and cur and x[0]['on'] - cur[-1]['on'] <= 0.45:
                    cur.append(x[0])
                else:
                    if len(cur) >= 3:
                        chuoi.append(cur)
                    cur = [x[0]] if len(x) == 1 else []
            if len(cur) >= 3:
                chuoi.append(cur)
        buoc = Counter()
        for c in chuoi:
            for a, b in zip(c, c[1:]):
                q = abs(b['m'] - a['m'])
                buoc['liền bậc 1–2' if 1 <= q <= 2 else 'nhảy 3–5' if 3 <= q <= 5 else 'nhảy ≥ 6' if q >= 6 else 'lặp'] += 1
        print(f'  tay {"trái" if t_ == "L" else "phải"}: {len(chuoi)} chuỗi · độ dài {dict(sorted(Counter(min(len(c), 8) for c in chuoi).items()))} · '
              f'bước {dict(buoc)}')

    print('\n=== NỐT ĐƠN TAY PHẢI NẰM ĐÂU TRONG Ô HỢP ÂM ===')
    for clip, (_, _, beats) in gan_n.items():
        per = float(np.median(np.diff(beats)))
        dd = [d for d in ds if d['clip'] == clip]
        c = Counter()
        for d, sau in zip(dd, dd[1:]):
            t0 = min(n['on'] for n in d['trai'] + d['phai'])
            t1 = min(n['on'] for n in sau['trai'] + sau['phai'])
            for x in d['gp']:
                if len(x) == 1:
                    on = x[0]['on']
                    c['nửa phách đầu' if on - t0 <= 0.5 * per else 'phách cuối trước khi đổi' if t1 - on <= per else 'giữa ô'] += 1
        print(f'  {clip} (phách {per:.2f} s, librosa): {dict(c)} / {sum(c.values())}')

    print('\n=== TẦM ĐÀN ===')
    for clip, (notes, tay, _) in gan_n.items():
        for t_ in 'LR':
            cd = np.percentile([cao_do_cua(clip, k[t_][2]) for k in tay if k[t_]], [5, 50, 95])
            ms = [n['m'] for n in notes if n['tay'] == t_]
            print(f'  {clip} tay {"trái" if t_ == "L" else "phải"}: tâm (hình) p5 {ten(int(round(cd[0])))} · p50 {ten(int(round(cd[1])))} · '
                  f'p95 {ten(int(round(cd[2])))} · nốt {ten(min(ms))} – {ten(max(ms))}')
        tr = [n for n in notes if n['tay'] == 'L']
        print(f'     nốt tay trái ≥ G3: {sum(1 for n in tr if n["m"] >= 55)}/{len(tr)} · ≥ C4: {sum(1 for n in tr if n["m"] >= 60)}/{len(tr)}')
    for k_, ten_t in (('phai', 'phải'), ('trai', 'trái')):
        dd = np.asarray([abs(median(n['m'] for n in b[k_]) - median(n['m'] for n in a[k_]))
                         for a, b in zip(ds, ds[1:]) if a['clip'] == b['clip'] and a[k_] and b[k_]])
        print(f'  tay {ten_t} dời giữa hai hợp âm liền: trung vị {np.median(dd):.1f} nửa cung · ≥ 7: {(dd >= 7).sum()} · ≥ 12: {(dd >= 12).sum()} / {len(dd)}')
    cho = defaultdict(set)
    for d in ds:
        for x in d['gp']:
            if len(x) >= 2:
                cho[d['nhan']].add(ten(min(n['m'] for n in x)))
    print('  cùng hợp âm, tay phải chồng ở mấy chỗ:', [(k, len(v)) for k, v in sorted(cho.items(), key=lambda kv: -len(kv[1]))[:6]])

    if '--bang' in sys.argv:
        for clip, (_, _, beats) in gan_n.items():
            per = float(np.median(np.diff(beats)))
            print(f'\n===== {clip} (phách {per:.2f} s; số trước dấu ":" là phách tính từ nốt đầu ô) =====')
            for d in [d for d in ds if d['clip'] == clip]:
                t0 = min(n['on'] for n in d['trai'] + d['phai'])

                def chuoi(gs):
                    return ' '.join(f"{(x[0]['on'] - t0) / per:.1f}:" + '+'.join(ten(n['m']) for n in sorted(x, key=lambda n: n['m'])) for x in gs)
                print(f"{d['s']:5.1f} {d['nhan']:15} trái [{chuoi(d['gt'])}]\n{'':21} phải [{chuoi(d['gp'])}]")


if __name__ == '__main__':
    if '--canh' in sys.argv:
        canh()
    elif '--ve' in sys.argv:
        i = sys.argv.index('--ve')
        ve(sys.argv[i + 1], [float(t) for t in sys.argv[i + 2:]])
    else:
        main()
