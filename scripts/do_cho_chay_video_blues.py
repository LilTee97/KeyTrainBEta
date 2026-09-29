# -*- coding: utf-8 -*-
"""Thầy Đức Thịnh đặt CHỖ CHẠY NGÓN ở đâu khi đệm hát *Vậy là mình xa nhau* (video KN9JEiQXAHs) — cho Blue Sun lượt 10.

    python -X utf8 scripts/do_cho_chay_video_blues.py chep     # một lần: chép nốt phần ĐỆM đã tách giọng
    python -X utf8 scripts/do_cho_chay_video_blues.py [--in]   # đo

Người dùng 29/9/2026: *"bạn làm tick Blues Sun lượt 8 thì tôi thấy các chỗ chạy nốt lại hơi quá thưa. Hãy phân tích và học từ
video của Đức Thịnh xem thầy sắp xếp các chỗ chạy ngón như thế nào để đệm hát cho bài Vậy là mình xa nhau"*.

NGUỒN (thư mục tạm `%TEMP%/yt_blues/`, tải 27/9 bằng `PianoBrain/tools/sheet/tu-video.py`):
  · đoạn bài hát 300–660 s cắt ra `bai-hat-300-660.wav`, TÁCH GIỌNG bằng demucs:
        python -m demucs --two-stems=vocals -n htdemucs -o tach bai-hat-300-660.wav
    → `tach/htdemucs/bai-hat-300-660/vocals.wav` · `no_vocals.wav`.
    Bẫy đã sập: bản chép MIDI từ tiếng video gốc lẫn giọng hát — lúc hát nốt dồn ở quãng tám 3–4, có chùm 6–7 nốt cao vọt
    cùng lúc (phụ âm / hoạ âm giọng bị nghe thành nốt đàn); đo chỗ chạy trên đó ra 9 chỗ trong ≈ 4 phút hát — không tin được.
  · CHỖ ĐANG HÁT = độ lớn (RMS 50 ms) của `vocals.wav` trên ngưỡng — thấy cả nốt ngân cuối câu (phụ đề chỉ có mốc đầu chữ).
  · TIẾNG ĐÀN = `no_vocals.mid`, máy chép (piano_transcription_inference) từ `no_vocals.wav`. Chỉ tin chỗ gõ.
  · lời: phụ đề tự động `blues.vi.json3` (mốc giờ từng chữ) — chỉ để in đối chiếu.
Thời gian trong script tính theo GIÂY CỦA VIDEO (cộng 300 s cho file cắt).
"""
import collections
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from do_video_blues_duc_thinh import doc, nm  # noqa: E402

D = os.path.join(os.environ.get('TEMP', 'C:/Users/Tin PC/AppData/Local/Temp'), 'yt_blues')
TACH = os.path.join(D, 'tach', 'htdemucs', 'bai-hat-300-660')
LECH = 300.0                  # file cắt bắt đầu ở giây 300 của video
GIANG = (435, 474)            # giang tấu 07:15–07:54 (phụ đề "[âm nhạc]")
HET_HAT = 596                 # chữ hát cuối ≈ 09:55; sau đó là đoạn kết


def chep():
    """Chép nốt phần đệm đã tách giọng — cùng đường nạp tiếng với `tu-video.py` (`do_not`)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('tu_video', 'D:/PianoBrain/tools/sheet/tu-video.py')
    tv = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tv)
    tv.do_not(os.path.join(TACH, 'no_vocals.wav'), os.path.join(TACH, 'no_vocals.mid'))


def dang_hat(nguong_db=-32, hop=.05):
    """[(t0, t1)] các đoạn giọng hát vang (giây video): RMS 50 ms của `vocals.wav` > ngưỡng (dB so đỉnh), lấp lỗ < 0,25 s,
    bỏ đoạn < 0,2 s."""
    import soundfile as sf
    y, sr = sf.read(os.path.join(TACH, 'vocals.wav'), dtype='float32', always_2d=True)
    y = y.mean(axis=1)
    n = int(sr * hop)
    rms = np.sqrt(np.array([np.mean(y[i:i + n] ** 2) for i in range(0, len(y) - n, n)]) + 1e-12)
    db = 20 * np.log10(rms / rms.max())
    on = db > nguong_db
    out = []
    for i, v in enumerate(on):
        t = LECH + i * hop
        if v:
            if out and t - out[-1][1] < .25:
                out[-1][1] = t + hop
            else:
                out.append([t, t + hop])
    return [(a, b) for a, b in out if b - a >= .2]


def am_tiet(hat):
    """Mốc bắt đầu từng chữ (âm tiết) hát, giây video: dò điểm vào (librosa onset) trên `vocals.wav`, chỉ giữ điểm nằm trong đoạn
    giọng vang `hat`."""
    import librosa
    import soundfile as sf
    y, sr = sf.read(os.path.join(TACH, 'vocals.wav'), dtype='float32', always_2d=True)
    y = y.mean(axis=1)
    on = librosa.onset.onset_detect(y=y, sr=sr, units='time', hop_length=512, backtrack=False)
    return [LECH + t for t in on if any(a - .05 <= LECH + t < b for a, b in hat)]


def cu_dan():
    """Cú đàn (nốt trong 50 ms) từ bản chép phần đệm: [(giây video, [midi])]."""
    ns = doc(os.path.join(TACH, 'no_vocals.mid'))
    cu = []
    for t, _, p, _ in ns:
        t += LECH
        (cu[-1][1].append(p) if cu and t - cu[-1][0] <= .05 else cu.append([t, [p]]))
    return cu


def cho_chay(cu, nhanh=.4, it=3, day=60):
    """Chỗ chạy / câu fill tay phải: ≥ `it` cú liền mà nốt đỉnh ≥ `day` (C4) và KHÔNG phải hợp âm (≤ 2 nốt ≥ C4 trong cú),
    cú cách cú ≤ `nhanh` giây (móc đơn ≈ 0,33 s → bắt cả câu móc đơn lẫn câu móc kép)."""
    don = [(t, max(p)) for t, p in cu if max(p) >= day and sum(1 for x in p if x >= day) <= 2]
    out, lien = [], []
    for c in don:
        if lien and c[0] - lien[-1][0] <= nhanh:
            lien.append(c)
        else:
            if len(lien) >= it:
                out.append(lien)
            lien = [c]
    if len(lien) >= it:
        out.append(lien)
    return out


def pt(c, k=8):
    n = sum(c.values())
    return ' · '.join(f'{x} {v * 100 / n:.0f}%' for x, v in c.most_common(k)) + f' (n={n})'


def main():
    if 'chep' in sys.argv:
        return chep()
    # −22 dB: −32 gộp hai câu làm một (05:20–05:39, 18,8 s); −22 cho đoạn giọng trung vị 2,1 s ≈ một ô, khe lấy hơi 0,75 s.
    hat = [h for h in dang_hat(-22) if not (GIANG[0] <= h[0] < GIANG[1]) and h[0] < HET_HAT + 3]
    at = am_tiet(hat)
    cu = cu_dan()
    ch = cho_chay(cu)
    trong_hat = lambda t: any(a <= t < b for a, b in hat)
    doan_hat = [(305, GIANG[0]), (GIANG[1], HET_HAT + 3)]
    o_hat = lambda t: any(a <= t < b for a, b in doan_hat)
    ch_hat = [r for r in ch if o_hat(r[0][0])]
    tong_s = sum(b - a for a, b in doan_hat)
    print(f'đoạn hát {tong_s:.0f} s (≈ {tong_s / 2:.0f} ô 6/8) · giọng vang {sum(b - a for a, b in hat):.0f} s · '
          f'{len(ch)} chỗ chạy/fill cả bài, {len(ch_hat)} trong đoạn hát '
          f'(≈ 1 chỗ mỗi {tong_s / max(1, len(ch_hat)):.1f} s = {tong_s / max(1, len(ch_hat)) / 2:.1f} ô)')

    # 1. Chỗ chạy rơi lúc giọng đang vang hay lúc giọng nghỉ (tính theo từng cú của chỗ chạy)?
    vang = sum(1 for r in ch_hat for t, _ in r if trong_hat(t))
    tong = sum(len(r) for r in ch_hat)
    print(f'  cú của chỗ chạy rơi lúc giọng đang vang: {vang}/{tong} ({vang * 100 // max(1, tong)}%)')
    # Chữ đang hát hay chữ đang NGÂN: cú đàn rơi khi giọng vang mà chữ gần nhất đã vào ≥ 0,6 s → đàn chạy dưới nốt ngân.
    def cho(t):
        if not trong_hat(t):
            return 'khe lấy hơi'
        truoc = [x for x in at if x <= t + .05]
        return 'lúc ngân chữ' if not truoc or t - truoc[-1] >= .6 else 'đè lên chữ đang hát'
    loai = collections.Counter(cho(t) for r in ch_hat for t, _ in r)
    print(f'  {len(at)} chữ hát (điểm vào dò trên giọng tách) · cú của chỗ chạy rơi vào: {pt(loai)}')
    dau = collections.Counter(cho(r[0][0]) for r in ch_hat)
    print(f'  chỗ chạy BẮT ĐẦU ở: {pt(dau)}')
    # Chỗ trống lời = từ chữ này tới chữ sau ≥ 1,2 s (ngân hoặc nghỉ — hơn nửa ô 6/8): bao nhiêu chỗ trống có chạy/fill?
    trong_loi = [(a, b) for a, b in zip(at, at[1:]) if b - a >= 1.2 and o_hat(a)]
    co = [(a, b) for a, b in trong_loi if any(a < r[0][0] < b for r in ch_hat)]
    print(f'  chỗ trống lời ≥ 1,2 s: {len(trong_loi)} · có chạy/fill {len(co)} ({len(co) * 100 // max(1, len(trong_loi))}%)')
    for lo, hi in ((1.2, 2), (2, 3), (3, 99)):
        v = [x for x in trong_loi if lo <= x[1] - x[0] < hi]
        if v:
            c = [x for x in v if any(x[0] < r[0][0] < x[1] for r in ch_hat)]
            print(f'    trống {lo}–{hi} s: {len(v)} · có chạy {len(c)} ({len(c) * 100 // len(v)}%)')
    vao_chu = sorted(r[0][0] - max([x for x in at if x <= r[0][0]] or [r[0][0]]) for r in ch_hat)
    print(f'  chỗ chạy vào sau chữ cuối (s): trung vị {np.median(vao_chu):.2f} (tứ phân {np.percentile(vao_chu, 25):.2f}–'
          f'{np.percentile(vao_chu, 75):.2f})')
    # 2. Khe giọng nghỉ (giữa hai đoạn giọng vang): khe nào có chạy, dài bao nhiêu
    khe = [(a[1], b[0]) for a, b in zip(hat, hat[1:]) if o_hat(a[1]) and b[0] - a[1] >= .4]
    print(f'  khe giọng nghỉ ≥ 0,4 s: {len(khe)}')
    for lo, hi in ((.4, 1), (1, 2), (2, 3.5), (3.5, 99)):
        v = [k for k in khe if lo <= k[1] - k[0] < hi]
        if not v:
            continue
        co = [k for k in v if any(k[0] - .3 <= r[0][0] < k[1] for r in ch_hat)]
        print(f'    khe {lo}–{hi} s: {len(v)} khe · có chạy/fill {len(co)} ({len(co) * 100 // len(v)}%)')
    # 3. Chỗ chạy: vào sau khi giọng tắt bao lâu, dài bao nhiêu, bao nhiêu cú, tốc độ
    vao, dai, so, toc = [], [], [], []
    for r in ch_hat:
        truoc = [b for a, b in hat if b <= r[0][0] + .3]
        if truoc:
            vao.append(r[0][0] - truoc[-1])
        dai.append(r[-1][0] - r[0][0])
        so.append(len(r))
        toc.append((len(r) - 1) / max(.01, r[-1][0] - r[0][0]))
    q = lambda x: f'trung vị {np.median(x):.2f} (tứ phân {np.percentile(x, 25):.2f}–{np.percentile(x, 75):.2f})'
    print(f'  vào sau lúc giọng tắt (s): {q(vao)} · dài (s): {q(dai)} · số cú: {q(so)} · tốc độ (cú/s): {q(toc)}')
    # 4. Theo ô 6/8 (2 s) trong đoạn hát: bao nhiêu ô có chạy / fill
    o = collections.Counter(int((r[0][0] - 305) // 2) for r in ch_hat)
    so_o = int(tong_s // 2)
    print(f'  ô 6/8 (≈ 2 s) có chỗ chạy/fill: {len(o)}/{so_o} ({len(o) * 100 // max(1, so_o)}%)')
    # 5. Mật độ tay phải (cú ≥ C4, nốt đơn/bè đôi) lúc giọng vang và lúc giọng nghỉ — cú mỗi giây
    phai = [t for t, p in cu if max(p) >= 60 and o_hat(t)]
    s_vang = sum(b - a for a, b in hat)
    n_vang = sum(1 for t in phai if trong_hat(t))
    print(f'  cú tay phải (≥ C4) mỗi giây: lúc giọng vang {n_vang / s_vang:.2f} · lúc giọng nghỉ '
          f'{(len(phai) - n_vang) / max(1, tong_s - s_vang):.2f}')

    if '--in' in sys.argv:
        d = json.load(open(os.path.join(D, 'blues.vi.json3'), encoding='utf8'))
        chu = sorted(((e['tStartMs'] + (s.get('tOffsetMs') or 0)) / 1000, (s.get('utf8') or '').strip())
                     for e in d['events'] for s in e.get('segs', []) if (s.get('utf8') or '').strip())
        for a, b in hat:
            loi = ' '.join(w for t, w in chu if a - .3 <= t < b and not w.startswith('['))
            print(f'  giọng {int(a // 60):02d}:{a % 60:05.2f}–{b % 60:05.2f}  {loi}')
            for r in [r for r in ch if b <= r[0][0] + .3 and r[0][0] < next((x for x, _ in hat if x > a), 999)]:
                print(f'        chạy {r[0][0] % 60:05.2f}–{r[-1][0] % 60:05.2f} ({len(r)} cú, sau giọng tắt {r[0][0] - b:+.2f}s): '
                      + ' '.join(nm(p) for _, p in r))


if __name__ == '__main__':
    main()
