import type { RhythmCell, RhythmHit, StylePattern } from '../types'

// Codex: dữ liệu riêng từ sheet Lá Thư Trần Thế, không dùng ô đệm của bản Claude.
// cN bắt đầu ở 1 + 3*N nốt đen trong MXL. Nguồn và rút gọn: Reference/SLOW-ROCK-LT.md.
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, velocityScale: number,
  tones: RhythmHit['tones']): RhythmHit => ({ beat, durationBeats, velocityScale, tones })
const octave = [tone(0), tone(0, 12)]
const upperTriad = [tone(1), tone(2), tone(0, 12)]

// c22: bỏ nốt E4 giai điệu đầu ô; dùng E3 thay E2+E3 để chuyển giọng không trùng phím.
const fillCell: RhythmCell = {
  lengthBeats: 6,
  left: [
    hit(0, 1, .96, octave), hit(1, 1, .79, [tone(0)]), hit(2, 1, .86, octave),
    hit(3, 1, .96, [tone(0)]), hit(4, .5, 1.05, [tone(2)]), hit(5, .5, 1.14, octave),
  ],
  right: [
    hit(1, .5, .84, [tone(0), ...upperTriad]), hit(1.5, .5, .8, [tone(0), ...upperTriad]),
    hit(2, .5, .89, upperTriad), hit(3, 2, 1.13, upperTriad),
  ],
}

const common = {
  family: 'slow-rock-lt', familyName: 'Slow Rock LT',
  timeSignature: '6/8', beatsPerMeasure: 6, gridUnit: .5, bpm: 86,
  feel: 'straight-block-chord' as const, verified: true, releaseRatio: 1,
  leftHandTop: 67, rightHandRegister: { rootFloor: 55, low: 55, high: 79 },
  raiHopAmChiaDoi: true, fillCell,
}

const verse: StylePattern = {
  ...common, id: 'slow-rock-lt', name: 'Slow Rock LT · Phiên khúc', variant: 1,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c15 (XML 12 phách 3), lặp ở c87; fill c22'],
  note: 'Codex · Lá Thư Trần Thế: rải 1–3–5–8–5–3 mỗi hợp âm, điệp chuyển sang bass–hợp âm. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 6,
    // c15 = Bb2 D3 F3 Bb3 F3 D3; cả sáu tiếng dài một móc đơn.
    left: [
      hit(0, 1, .84, [tone(0)]), hit(1, 1, .51, [tone(1)]), hit(2, 1, .69, [tone(2)]),
      hit(3, 1, .75, [tone(0, 12)]), hit(4, 1, .7, [tone(2)]), hit(5, 1, .67, [tone(1)]),
    ],
    right: [],
  },
}

const chordPulse = [tone(2), tone(0, 12), tone(1, 12), tone(2, 12)]
const chorus: StylePattern = {
  ...common, id: 'slow-rock-lt-chorus', name: 'Slow Rock LT · Điệp khúc', variant: 2,
  sourceVideos: ['Linh Nhi · Lá Thư Trần Thế · c42 (Gm, XML 32 phách 4); fill c22'],
  note: 'Codex · Điệp: bass quãng tám, cụm hợp âm theo c42, bass trở lại tiếng 6. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 6,
    // c42: bỏ D2 của hòa âm trước; không lấy bè giai điệu RH làm tiết tấu đệm.
    left: [
      hit(0, 1, 1, octave),
      hit(1, .5, .86, [tone(2), tone(1, 12), tone(2, 12)]),
      hit(1.5, .5, .9, [tone(0), tone(2), tone(1, 12)]),
      hit(2, 1, .9, chordPulse), hit(3, 1, .95, [tone(0), ...chordPulse]),
      hit(4, 1, .79, chordPulse), hit(5, 1, .91, octave),
    ],
    right: [],
  },
}

export const SLOW_ROCK_LT: readonly StylePattern[] = [verse, chorus]
