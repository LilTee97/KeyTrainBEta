import type { StylePattern } from '../types'

// Đo từ bản thu "Kim" (Y Vũ) — Công Thành & Lynn, ASIA 1 (YouTube fjG-uQVhPqI), 29/9/2026. Tách bè demucs,
// chép nốt bè "khác" (bass nằm trong bè này, bè bass của demucs gần như im). Số đo: Reference/KIM.md.
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
// Tay trái: 1 1 3 3 5 5 6 5 móc đơn thẳng — 34/44 ô đủ 8 nốt (6/44 ô đi 1 1 5 5 ♭7 ♭7 8 8, chưa dựng).
const bass = [tone(0), tone(0), tone(1), tone(1), tone(2), tone(2), tone(0, 9), tone(2)]
// Nhấn tay phải = chỗ trống snare nhấn (2 · 2& · 4 = 0,91 · 1,00 · 0,90; móc khác ≤ 0,36; 98 ô). Tay đệm của ban nhạc
// gõ đều (lực 57–64) — dời nhấn trống sang tay phải là chuyển dụng của Claude để piano một mình còn phách 2–4.
const NHAN = new Set([2, 3, 6])
// Nốt ngắt: trường độ đo trung vị 0,17 phách tay trái (tứ phân vị 0,14–0,25), 0,18 tay phải — lấy ¼ phách (tứ phân vị trên).
const NGAT = 1 / 4

export const KIM: StylePattern = {
  id: 'kim', name: 'Kim', family: 'kim', familyName: 'Kim', variant: 1,
  timeSignature: '4/4', beatsPerMeasure: 4, bpm: 152, feel: 'straight-block-chord',
  verified: true, releaseRatio: 1, leftHandTop: 60, autoFills: false,
  sourceVideos: ['fjG-uQVhPqI · Kim (Y Vũ) · Công Thành & Lynn, ASIA 1 · 98 ô đệm đủ mẫu'],
  note: 'Kim · rock\'n\'roll móc đơn thẳng: tay trái 1 1 3 3 5 5 6 5, tay phải chặn hợp âm cả 8 móc đơn, nhấn 2 · 2& · 4. Đo từ bản thu ASIA, ♩ 152. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 4,
    left: bass.map((t, i) => ({ beat: i / 2, durationBeats: NGAT, tones: [t] })),
    right: bass.map((_, i) => ({ beat: i / 2, durationBeats: NGAT, velocityScale: NHAN.has(i) ? 1.15 : 0.9 })),
  },
}
