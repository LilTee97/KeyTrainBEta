import type { RhythmHit, StylePattern } from '../types'

// Onsets/truong do tu sheet; giam giai dieu RH de dung cho dem hat.
// Quang am va luc danh la bien soan KT, chua phai moc duyet bang tai.
// Nguon va tung phep rut gon: Reference/CA-PHAO-BALLAD.md.
const common = {
  variant: 1,
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  bpm: 76,
  feel: 'straight-block-chord' as const,
  verified: true,
  releaseRatio: 1,
  leftHandTop: 67,
}

const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, toneIndex: number, semitones = 0,
  velocityScale = .65): RhythmHit => ({ beat, durationBeats, velocityScale, tones: [tone(toneIndex, semitones)] })

const shortArp: StylePattern = {
  ...common,
  id: 'ca-phao-ballad-short-arp',
  name: 'Ballad CP · Rải ngắn',
  family: 'ca-phao-ballad-short-arp',
  familyName: 'Ballad CP · Rải ngắn',
  sourceVideos: ['Ngày mai em đi · ô XML 21, 29, 65'],
  cell: {
    lengthBeats: 4,
    left: [hit(0, .5, 0, 0, .9), hit(.5, .5, 2), hit(1, 3, 0, 12)],
    right: [hit(1.5, .5, 1, 0, .55), hit(2, .5, 2, 0, .5)],
  },
  note: 'Ngày mai em đi: rải 1–5–8 rồi ngân. Bè trong tay phải rút gọn; chờ nghe duyệt.',
}

const syncopated: StylePattern = {
  ...common,
  id: 'ca-phao-ballad-syncopated',
  name: 'Ballad CP · Nhấn lệch',
  family: 'ca-phao-ballad-syncopated',
  familyName: 'Ballad CP · Nhấn lệch',
  sourceVideos: ['Ngày mai em đi · ô XML 35, 43; cùng lưới trong Hồng Kông 1'],
  cell: {
    lengthBeats: 4,
    left: [
      hit(0, 1, 0, 0, .95),
      { beat: 1, durationBeats: .5, velocityScale: .65, tones: [tone(2), tone(0, 12)] },
      hit(1.5, 1, 0, 0, .8),
      hit(2.5, .25, 0, 12, .55),
      { beat: 3, durationBeats: 1, velocityScale: .7, tones: [tone(2), tone(0, 12)] },
    ],
    right: [hit(1, .5, 2), hit(1.5, .5, 1), hit(2, .5, 2), hit(2.5, 1, 0, 0, .55)],
  },
  note: 'Bass xen cụm hợp âm ở 1 · 2 · 2& · 3& · 4. Giữ khoảng nhả sau 3&; chờ nghe duyệt.',
}

const sparse: StylePattern = {
  ...common,
  id: 'ca-phao-ballad-sparse',
  name: 'Ballad CP · Thưa đảo phách',
  family: 'ca-phao-ballad-sparse',
  familyName: 'Ballad CP · Thưa đảo phách',
  sourceVideos: ['Chúng ta không thuộc về nhau · ô XML 27, 59; đối chiếu 15, 31, 60, 63'],
  cell: {
    lengthBeats: 4,
    left: [hit(0, 1.5, 0, 0, .9), hit(1.5, 1, 0, 0, .7), hit(2.5, 1.5, 2, 0, .6)],
    right: [
      hit(0, .75, 2), hit(.75, .25, 3, 0, .5), hit(1, .5, 1, 0, .5),
      hit(1.5, .5, 2, 0, .55),
      { beat: 3, durationBeats: .5, velocityScale: .6, tones: [tone(1), tone(3)] },
    ],
  },
  note: 'Bass 1 · 2& · 3&, ngân dài; bè trong đáp lại. Lưới lặp 7 ô phần hát; chờ nghe duyệt.',
}

const sixteenths: StylePattern = {
  ...common,
  id: 'ca-phao-ballad-sixteenths',
  name: 'Ballad CP · Móc kép',
  family: 'ca-phao-ballad-sixteenths',
  familyName: 'Ballad CP · Móc kép',
  sourceVideos: ['Có Em Chờ · ô XML 10, đối chiếu ô 18'],
  cell: {
    lengthBeats: 4,
    left: [
      hit(0, 1, 0, 0, .9), hit(1, .75, 1, 12), hit(1.75, .5, 0, 0, .8),
      hit(2.25, .25, 1, 12, .55), hit(2.5, .25, 0, 0, .6),
      hit(2.75, .25, 2, 0, .55), hit(3, 1, 0, 12, .65),
    ],
    right: [
      { beat: 0, durationBeats: .5, velocityScale: .6, tones: [tone(3), tone(1)] },
      hit(.5, .25, 3, 0, .5), hit(.75, .5, 3, 0, .55),
      hit(1.25, .5, 2, 0, .5), hit(1.75, 1.5, 3, 0, .6),
    ],
  },
  note: 'Có Em Chờ: đảo phách móc kép, bass rải ngắn về quãng tám. Giữ nhịp ô 10, bỏ giai điệu; chờ nghe duyệt.',
}

const lateArp: StylePattern = {
  ...common,
  id: 'ca-phao-ballad-late-arp',
  name: 'Ballad CP · Ngân rồi rải',
  family: 'ca-phao-ballad-late-arp',
  familyName: 'Ballad CP · Ngân rồi rải',
  sourceVideos: ['Chưa Bao Giờ · ô XML 69, đối chiếu lưới ô 68, 74'],
  cell: {
    lengthBeats: 4,
    left: [
      hit(0, .5, 0, 12, .7), hit(.5, 1.5, 0, 12, .6),
      hit(2, .5, 0, 0, .9), hit(2.5, .5, 2), hit(3, 1, 3),
    ],
    right: [
      { beat: 2, durationBeats: .75, velocityScale: .6, tones: [tone(3), tone(1)] },
      hit(2.75, .5, 2, 0, .5), hit(3.25, .75, 1, 0, .5),
    ],
  },
  note: 'Chưa Bao Giờ: giữ nửa đầu ô, bass rải ở phách 3–4. Nốt nối qua phách 4 không đánh lại; chờ nghe duyệt.',
}

const signature: StylePattern = {
  ...common,
  id: 'ca-phao-ballad-signature',
  name: 'Ballad nét CP',
  family: 'ca-phao-ballad-signature',
  familyName: 'Ballad nét CP',
  sourceVideos: ['Biên soạn KT từ 6 sheet ballad CP có phân đoạn hát; xem CA-PHAO-BALLAD.md'],
  cell: {
    lengthBeats: 8,
    left: [...shortArp.cell!.left, ...syncopated.cell!.left.map(note => ({ ...note, beat: note.beat + 4 }))],
    right: [...shortArp.cell!.right, ...syncopated.cell!.right.map(note => ({ ...note, beat: note.beat + 4 }))],
  },
  note: 'Câu hai ô: rải–ngân rồi bass–hợp âm nhấn lệch; bè trong thưa. Bản tổng hợp của KeyTrain, chờ nghe duyệt.',
}

export const CA_PHAO_BALLAD: readonly StylePattern[] = [shortArp, syncopated, sparse, sixteenths, lateArp, signature]
export const CP_BALLAD_IDS: readonly string[] = CA_PHAO_BALLAD.map(style => style.id)
