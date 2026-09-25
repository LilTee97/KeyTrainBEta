import type { RhythmHit, StylePattern } from '../types'

// Independent reduction of the two staves, not Claude's Ballad De em variant.
// Measured attacks, cross-bar ties and editorial choices: Reference/BALLAD-DERX.md.
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, tones: RhythmHit['tones'],
  velocityScale = .65): RhythmHit => ({ beat, durationBeats, tones, velocityScale })
const bass = (beat: number, duration: number) => hit(beat, duration, [tone(0)], .85)
const common = {
  family: 'ballad-derx', familyName: 'Ballad DERX', bpm: 85,
  timeSignature: '4/4', beatsPerMeasure: 4, feel: 'straight-block-chord' as const,
  verified: true, releaseRatio: 1, leftHandTop: 59,
  rightHandRegister: { rootFloor: 55, low: 60, high: 74 },
}

const verse: StylePattern = {
  ...common, id: 'ballad-derx', name: 'Ballad DERX · Phiên khúc', variant: 1,
  sourceVideos: ['Cà Pháo · Để Em Rời Xa · cửa sổ 4–5 (XML 4:2–6:2), đối chiếu 32–33'],
  note: 'DERX · 85 BPM · hai tay đối đáp; tay phải ngân, tay trái chạy nối. Phiên 4–5, điệp 24–25. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      hit(0, 1.5, [tone(0), tone(2), tone(3)], .85),
      hit(1.75, .75, [tone(0, 12), tone(2, 12)]),
      hit(2.5, .5, [tone(2, 12)]), hit(3, 1, [tone(0, 24)]),
      hit(4, 2, [tone(0, 12), tone(2, 12), tone(3, 12)], .8),
      // A2-D3-E3-F3-E3-D3-C3 under the sustained F4; third/seventh follow input harmony.
      hit(6.25, .25, [tone(2)]), hit(6.5, .25, [tone(0, 12)]),
      hit(6.75, .25, [tone(0, 14)]), hit(7, .25, [tone(1, 12)]),
      hit(7.25, .25, [tone(0, 14)]), hit(7.5, .25, [tone(0, 12)]), hit(7.75, .25, [tone(3)]),
    ],
    right: [
      hit(0, .5, [tone(1)]), hit(1.75, .5, [tone(1)]),
      hit(2.25, .5, [tone(2)]), hit(2.75, .5, [tone(2)]),
      hit(5, .25, [tone(1)]), hit(5.25, .5, [tone(1)]), hit(5.75, 2, [tone(1)]),
    ],
  },
}

const chorus: StylePattern = {
  ...common, id: 'ballad-derx-chorus', name: 'Ballad DERX · Điệp khúc', variant: 2,
  sourceVideos: ['Cà Pháo · Để Em Rời Xa · cửa sổ 24–25 (XML 24:2–26:2), đối chiếu 52–53'],
  note: 'DERX điệp · bass móc đơn; bè trong chêm lệch và đồng thời, giữ chùm ba. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      // The 1-5-8 opening is the playable counterpart measured in window 52.
      bass(0, .5), hit(.5, .5, [tone(2)]), hit(1, 1, [tone(0, 12)]),
      bass(2, .5), hit(2.5, .5, [tone(0, 12), tone(2, 12)]), hit(3, 1, [tone(0, 12), tone(2, 12)]),
      bass(4, .5), hit(4.5, 1, [tone(0, 12)]), bass(5.75, .25), bass(6, 1), bass(7, .75),
    ],
    right: [
      hit(0, .5, [tone(2)]), hit(.75, .5, [tone(2)]), hit(4 / 3, 2 / 3, [tone(2), tone(0, 12)]),
      hit(2, .75, [tone(1), tone(0, 12)]), hit(2.75, .25, [tone(0)]),
      hit(3, .25, [tone(0, 2), tone(2)]), hit(3.25, .25, [tone(1)]), hit(3.5, .5, [tone(0)]),
      hit(4, .5, [tone(0, 12), tone(1, 12)]), hit(4.5, .25, [tone(0, 12)]),
      hit(4.75, .25, [tone(0, 12)]), hit(5, .25, [tone(2)]), hit(5.25, .5, [tone(1, 12)]),
      hit(5.75, .5, [tone(1), tone(2)]), hit(7.25, .25, [tone(3, -12)]),
    ],
  },
}

export const BALLAD_DERX: readonly StylePattern[] = [verse, chorus]
