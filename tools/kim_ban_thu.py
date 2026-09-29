"""Đo tiết tấu đệm nút Kim từ bản thu "Kim" (Công Thành & Lynn, ASIA 1 — YouTube fjG-uQVhPqI).

Chuẩn bị (thư mục làm việc tuỳ ý, truyền vào làm đối số):
    yt-dlp -x --audio-format wav -o kim.%(ext)s https://www.youtube.com/watch?v=fjG-uQVhPqI
    python -m demucs -n htdemucs -o sep kim.wav
    chép nốt sep/htdemucs/kim/other.wav thành kim_other.mid bằng piano_transcription_inference
    (cách nạp tiếng như PianoBrain/tools/sheet/tu-video.py)
Chạy:  python tools/kim_ban_thu.py <thư mục làm việc>

Bè bass của demucs gần như im (RMS 0,0–0,4 so với bè "khác" 1,5–4,1): bass bản này nằm trong bè "khác",
nên nốt dưới MIDI 50 của bản chép bè "khác" được coi là tay trái.
"""
import collections, json, os, sys
import librosa, mido, numpy as np

sys.stdout.reconfigure(encoding='utf-8')
W = sys.argv[1]; SR, HOP = 22050, 256
ld = lambda n: librosa.load(os.path.join(W, 'sep/htdemucs/kim', n + '.wav'), sr=SR, mono=True)[0]
drums, bass, other, voc = ld('drums'), ld('bass'), ld('other'), ld('vocals')
env = librosa.onset.onset_strength(y=drums + bass + other, sr=SR, hop_length=HOP)
_, beats = librosa.beat.beat_track(onset_envelope=env, sr=SR, hop_length=HOP, start_bpm=150)
bt = librosa.frames_to_time(beats, sr=SR, hop_length=HOP)
grid = np.array([a + (b - a) * k / 4 for a, b in zip(bt[:-1], bt[1:]) for k in range(4)])  # lưới móc kép
fr = librosa.time_to_frames(grid, sr=SR, hop_length=HOP)
print(f'phách {len(bt)}, ♩ trung vị {60 / np.median(np.diff(bt)):.1f}')

def band(sig, lo, hi):
    S = np.abs(librosa.stft(sig, n_fft=2048, hop_length=HOP)); f = librosa.fft_frequencies(sr=SR, n_fft=2048)
    e = np.concatenate([[0], np.maximum(0, np.diff(np.log1p(S[(f >= lo) & (f < hi)] * 10), axis=1)).sum(0)])
    return np.array([e[max(0, q - 2):q + 3].max() for q in fr])

# Pha ô nhịp: snare nổi ở phách lẻ → phách 1 ở phách chẵn; nốt bass phách 1 chọn pha 2 (Si 34 lần, pha 0 ra Fa#).
P = 2; NB = len(grid) // 4
t = 0; on = {}; notes = []
for m in mido.MidiFile(os.path.join(W, 'kim_other.mid')):
    t += m.time
    if m.type == 'note_on' and m.velocity > 0: on[m.note] = (t, m.velocity)
    elif m.type in ('note_off', 'note_on') and m.note in on:
        s, v = on.pop(m.note); notes.append((s, t, m.note, v))
rows = collections.defaultdict(list); step = np.median(np.diff(grid))
for s, e, p, v in notes:
    i = int(np.argmin(np.abs(grid - s)))
    if abs(grid[i] - s) <= 0.06: rows[(i - P * 4) // 16].append(((i - P * 4) % 16, p, v, (e - s) / step))

# Tay trái: hình 8 móc đơn so với nốt phách 1.
pats = collections.Counter(); full = 0
for b, ev in rows.items():
    lh = [min([p for pos, p, v, d in ev if pos == 2 * k and p < 50], default=None) for k in range(8)]
    if None not in lh: full += 1; pats[tuple((x - lh[0]) % 12 for x in lh)] += 1
print(f'tay trái đủ 8 nốt: {full} ô'); [print(f'  {c:3d}  {p}') for p, c in pats.most_common(4)]

# Ô đệm đủ mẫu (≥ 6 móc đơn có nốt tay trái): trường độ, lực, nhấn trống.
day = [b for b, ev in rows.items() if len({pos for pos, p, v, d in ev if p < 50 and pos % 2 == 0}) >= 6]
q = lambda a: np.percentile(a, [25, 50, 75]).round(2)
for ten, giu in (('trái', lambda p: p < 50), ('phải', lambda p: p >= 50)):
    ds = [d / 4 for b in day for pos, p, v, d in rows[b] if giu(p) and pos % 2 == 0]
    vs = [np.mean([v for b in day for pos, p, v, d in rows[b] if giu(p) and pos == 2 * k] or [0]) for k in range(8)]
    print(f'tay {ten}: trường độ (phách) {q(ds)}, lực theo móc đơn {np.round(vs).astype(int)}')
for ten, lo, hi in (('snare', 150, 4000), ('kick', 30, 150)):
    a = band(drums, lo, hi); M = np.array([a[(P + b * 4) * 4:(P + b * 4) * 4 + 16] for b in day]).mean(0)[::2]
    print(f'{ten} 1 1& 2 2& 3 3& 4 4&:', ' '.join(f'{x:.2f}' for x in M / M.max()), f'({len(day)} ô)')
