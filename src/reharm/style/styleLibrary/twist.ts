import type { RhythmHit, StylePattern } from '../types'

// Đo ô 6–16, đối chiếu LH 22–31 của boogie woogie-Linh Nhi.mxl (21 ô).
// Sheet ghi Swing, không ghi tỷ lệ: 2:1 là cách diễn giải để nghe thử.
// Xem Reference/TWIST-BOOGIE.md: tách nốt đo từ sheet với phần chuyển dụng.
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const bass = [tone(0), tone(0), tone(1, -1), tone(1), tone(2), tone(0), tone(0, 9), tone(2)]

export const TWIST: StylePattern = {
  id: 'twist', name: 'Twist', family: 'twist', familyName: 'Twist', variant: 1,
  timeSignature: '4/4', beatsPerMeasure: 4, bpm: 180, feel: 'swing',
  verified: true, releaseRatio: 1, leftHandTop: 60, soloMaxStrikes: 8, autoFills: false,
  sourceVideos: ['boogie woogie-Linh Nhi.mxl · ô 6–16, LH 22–31 · credit trong sheet: Marco Brandt'],
  note: 'Twist · đệm hai tay: bass 1–1–♭3–3–5–1–6–5, tay phải chặn cùng bass gốc ở 1 và 3&. Theo sheet Boogie Woogie; swing 2:1, 180 BPM. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 4,
    // Hai tiếng gốc đầu ô là hai lần GÕ, không gộp ngân. Bậc ba/năm theo hợp âm;
    // hợp âm thứ dùng 2→♭3, bậc 6 vẫn là màu 6 trưởng (chuyển dụng, sheet chỉ có trưởng).
    // Encode swing ngay trong cell: `feel` không đổi thời điểm đệm trong renderer.
    left: bass.map((note, index): RhythmHit => ({
      beat: Math.floor(index / 2) + (index % 2 ? 2 / 3 : 0),
      durationBeats: index % 2 ? 1 / 3 : 2 / 3,
      tones: [note],
    })),
    // Hai cú RH trùng LH gốc (tiếng 1 và 6); RH còn ngân khi LH gõ lại ở 1&.
    // Giữ hai cú chặn + khoảng nghỉ; thế bấm theo hợp âm bài đang chơi.
    // Onset VÀ cuối tiếng thứ hai cùng được đổi sang swing: 3&→4, không tràn phách 4.
    right: [
      { beat: 0, durationBeats: 1 },
      { beat: 8 / 3, durationBeats: 1 / 3 },
    ],
  },
}
