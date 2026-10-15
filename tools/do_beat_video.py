"""Đo nền beat của video "Lick Em/Am" (D:\\PianoBrain\\video\\Beat) và chọn mẫu trống Tone.js gần nhất — số đo của `src/thay/hocSolo/beatNen.ts`
và bộ trống trong `src/shared/audio/audioEngine.ts` (15/10/2026).

Chuẩn bị (thư mục làm việc tuỳ ý, truyền vào làm đối số):
    ffmpeg -i "<video>.mp4" -vn -ac 2 -ar 44100 wave.wav
    python -m demucs -n htdemucs -o sep wave.wav            # → sep/htdemucs/wave/drums.wav
    mẫu trống: tải https://tonejs.github.io/audio/drum-samples/<bộ>/{kick,snare,hihat}.mp3 về kit/<bộ>_<tiếng>.mp3,
    đổi sang kit/<bộ>_<tiếng>.wav (mono 44,1 kHz)
Chạy:  python -I tools/do_beat_video.py <thư mục làm việc>

Bè trống và bè bass của bản tách tắt ở giây 12 (piano chơi tiếp tới 24 s) — chỉ đo 12 giây đầu.
"""
import glob
import os
import sys

import librosa
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
W = sys.argv[1]
SR, HOP = 44100, 128
drums = librosa.load(os.path.join(W, 'sep/htdemucs/wave/drums.wav'), sr=SR, mono=True)[0]

# Nhịp độ: theo dõi phách trên bè trống; pha móc đơn khớp tiếng hi-hat.
env = librosa.onset.onset_strength(y=drums, sr=SR, hop_length=HOP)
_, beats = librosa.beat.beat_track(onset_envelope=env, sr=SR, hop_length=HOP, start_bpm=100)
T = float(np.median(np.diff(librosa.frames_to_time(beats, sr=SR, hop_length=HOP))))
S = np.abs(librosa.stft(drums, n_fft=2048, hop_length=HOP))
f = librosa.fft_frequencies(sr=SR, n_fft=2048)
def flux(lo, hi):
    e = np.log1p(S[(f >= lo) & (f < hi)] * 20)
    return np.concatenate([[0], np.maximum(0, np.diff(e, axis=1)).sum(0)])
h = flux(7000, 16000)
pk = librosa.util.peak_pick(h, pre_max=6, post_max=6, pre_avg=40, post_avg=40, delta=np.percentile(h, 90) * 0.5, wait=12)
th = librosa.frames_to_time(pk, sr=SR, hop_length=HOP)
ph = min(np.linspace(0, T / 2, 60, endpoint=False), key=lambda p: np.mean(np.abs((th - p) / (T / 2) - np.round((th - p) / (T / 2)))))
DAU = ph + T  # phách 1 ô đầu: kick mạnh ở phách thứ 1, 5, 9 … của lưới
print(f'♩ {60 / T:.1f} (phách {T:.3f} s) · phách 1 ô đầu {DAU:.3f} s')

# Gộp 5 ô 4/4 — độ vọt mỗi móc kép, chuẩn 0–9 theo móc mạnh nhất của dải.
NO = 5
grid = DAU + np.arange(NO * 16) * T / 4
fr = librosa.time_to_frames(grid, sr=SR, hop_length=HOP)
print('               ' + ' '.join(f'{c:>2}' for c in '1e&a2e&a3e&a4e&a'))
for ten, lo, hi in (('kick 30–120', 30, 120), ('rè 1,5–5k', 1500, 5000), ('hi-hat 7–16k', 7000, 16000)):
    x = flux(lo, hi)
    m = np.array([x[max(0, q - 3):q + 4].max() for q in fr]).reshape(NO, 16).mean(0)
    print(f'{ten:15s}' + ' '.join(f'{int(round(9 * a / m.max())):>2}' for a in m))

# Tiếng sạch của từng loại: kick móc kép cuối phách 2; snare phách 2 · 4; hi-hat móc đơn sau phách 1 · 3 · 4.
oc = lambda o, buoc: DAU + (o * 16 + buoc) * T / 4
CU = {
    'kick': [oc(o, 7) for o in range(NO)],
    'snare': [oc(o, b) for o in range(NO) for b in (4, 12)][:9],
    'hihat': [oc(o, b) for o in range(NO) for b in (2, 10, 14)],
}
DAI = [(0, 120), (150, 400), (400, 5000), (5000, 22050)]
def dai(y):
    seg = y[: int(0.1 * SR)]
    P = np.abs(librosa.stft(np.pad(seg, (0, max(0, 2048 - len(seg)))), n_fft=2048, hop_length=256)) ** 2
    tong = P.sum() + 1e-12
    return np.array([P[(f >= a) & (f < b)].sum() / tong for a, b in DAI])
def tat(y):
    e = librosa.feature.rms(y=y[: int(0.6 * SR)], frame_length=512, hop_length=128)[0]
    p = int(np.argmax(e))
    return (next((i for i in range(p, len(e)) if e[i] < e[p] * 0.1), len(e)) - p) * 128 / SR * 1000
def tim_tieng(t):
    """Đỉnh onset trong ±40 ms quanh lưới, lùi 10 ms."""
    a, b = librosa.time_to_frames([t - 0.04, t + 0.04], sr=SR, hop_length=HOP)
    q = a + int(np.argmax(env[a:b]))
    return int((librosa.frames_to_time(q, sr=SR, hop_length=HOP) - 0.01) * SR)
for loai, ts in CU.items():
    v = np.median([dai(drums[tim_tieng(t):]) for t in ts], axis=0)
    vt = np.median([tat(drums[tim_tieng(t):]) for t in ts])
    print(f'\n{loai} video ({len(ts)} tiếng): ' + ' · '.join(f'{x:.2f}' for x in v) + f' (dưới 120 · 150–400 · 400–5k · trên 5k Hz) · tắt −20 dB {vt:.0f} ms')
    kq = []
    for w in sorted(glob.glob(os.path.join(W, 'kit', f'*_{loai}.wav'))):
        y = librosa.load(w, sr=SR, mono=True)[0]
        on = librosa.onset.onset_detect(y=y, sr=SR, units='samples', backtrack=True)
        y = y[int(on[0]) if len(on) else 0:]
        kq.append((float(np.abs(dai(y) - v).sum()), os.path.basename(w).rsplit('_', 1)[0], tat(y)))
    for l1, bo, ms in sorted(kq)[:5]:
        print(f'   {bo:13s} lệch dải {l1:.2f} · tắt {ms:.0f} ms')
