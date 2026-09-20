import type { RhythmHit, StylePattern } from '../types'

// Two-bar reductions, not a transcription of the melody or a universal CP groove.
// Source bars and every editorial change: Reference/CA-PHAO-BALLAD-SONGS.md.
const common = {
  timeSignature: '4/4', beatsPerMeasure: 4,
  feel: 'straight-block-chord' as const,
  verified: true, releaseRatio: 1, leftHandTop: 67,
}
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, tones: RhythmHit['tones'],
  velocityScale = .65): RhythmHit => ({ beat, durationBeats, tones, velocityScale })
const bass = (beat: number, duration: number) => hit(beat, duration, [tone(0)], .85)

const coEmCho: StylePattern = {
  ...common, id: 'ca-phao-ballad-co-em-cho',
  name: 'Có Em Chờ · Phiên khúc', family: 'ca-phao-ballad-co-em-cho',
  familyName: 'Ballad Có Em Chờ', variant: 1, bpm: 75,
  sourceVideos: ['Cà Pháo · Có Em Chờ · phiên ô XML 9–10; đối chiếu 17–18'],
  note: 'Phiên: bass ngân xen móc kép cuối câu. Hai ô 9–10, bè trong rút gọn; chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      bass(0, 1.5), bass(1.75, .5), bass(2.25, 1.5),
      bass(4, 1), hit(5, .75, [tone(1, 12)]), bass(5.75, .5),
      hit(6.25, .25, [tone(1, 12)]), bass(6.5, .25),
      hit(6.75, .25, [tone(2)]), hit(7, 1, [tone(0, 12)]),
    ],
    right: [
      hit(0, .5, [tone(3), tone(1)]), hit(1, .25, [tone(1), tone(2), tone(3)]),
      hit(1.25, .5, [tone(1)]), hit(1.75, .75, [tone(3), tone(1)]),
      hit(3, .25, [tone(1), tone(2), tone(3)]),
      hit(4, .5, [tone(3), tone(1)]), hit(4.5, .25, [tone(3)]),
      hit(4.75, .5, [tone(3)]), hit(5.25, .5, [tone(2)]),
      hit(5.75, 1.5, [tone(3)]),
    ],
  },
}

const coEmChoChorus: StylePattern = {
  ...common, id: 'ca-phao-ballad-co-em-cho-chorus',
  name: 'Có Em Chờ · Điệp khúc', family: coEmCho.family,
  familyName: coEmCho.familyName, variant: 2, bpm: 75,
  sourceVideos: ['Cà Pháo · Có Em Chờ · điệp ô XML 25–26; đối chiếu 41–42'],
  note: 'Điệp: bass rải rộng, bè trong nhấn lệch móc kép. Ô 25–26, bỏ melody và pickup phụ thuộc hòa âm; chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      bass(0, .25), hit(.25, .5, [tone(2)]), hit(.75, .5, [tone(1, 12)]),
      hit(1.25, .25, [tone(2, 12)]), hit(1.5, .5, [tone(1, 12)]),
      hit(2, .25, [tone(0), tone(1, 12)]), hit(2.25, .5, [tone(2)]),
      hit(2.75, .75, [tone(1, 12)]), hit(3.5, .5, [tone(0, 12)]),
      bass(4, .5), hit(4.5, .5, [tone(2)]), hit(5, .75, [tone(0, 12)]),
      bass(5.75, .75), bass(6.5, .25), hit(6.75, .25, [tone(3)]),
      hit(7, 1, [tone(1, 12), tone(2, 12)]),
    ],
    right: [
      hit(.75, .5, [tone(1)]), hit(1.25, .5, [tone(1)]),
      hit(1.75, .75, [tone(1)]), hit(3, .25, [tone(2)]),
      // The pickup at 25:3.75 and its tie-stop at 26:0 are omitted together.
      hit(5.75, .5, [tone(3), tone(1)]), hit(6.25, 1, [tone(3)]),
    ],
  },
}

const ngayMai: StylePattern = {
  ...common, id: 'ca-phao-ballad-ngay-mai-em-di',
  name: 'Ngày mai em đi · Phiên khúc', family: 'ca-phao-ballad-ngay-mai-em-di',
  familyName: 'Ballad Ngày mai em đi', variant: 1, bpm: 83,
  sourceVideos: ['Cà Pháo · Ngày mai em đi · phiên ô XML 21–22; đối chiếu 29–30, 65'],
  note: 'Phiên: rải 1–5–8 rồi ngân, ô sau đáp lại bằng bass cao. Ô 21–22; chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      bass(0, .5), hit(.5, .5, [tone(2)]), hit(1, 3, [tone(0, 12)]),
      bass(4, .5), hit(4.5, 1, [tone(2)]), hit(5.5, .5, [tone(0, 12)]),
      hit(6, 1, [tone(0, 12)]), hit(7, .5, [tone(2)]), hit(7.5, .5, [tone(3)]),
    ],
    right: [
      hit(1, .25, [tone(3)]), hit(1.5, .5, [tone(1)]), hit(2, .5, [tone(2)]),
      hit(6.5, 1.5, [tone(1), tone(2)]),
    ],
  },
}

const ngayMaiChorus: StylePattern = {
  ...common, id: 'ca-phao-ballad-ngay-mai-em-di-chorus',
  name: 'Ngày mai em đi · Điệp khúc', family: ngayMai.family,
  familyName: ngayMai.familyName, variant: 2, bpm: 83,
  sourceVideos: ['Cà Pháo · Ngày mai em đi · điệp ô XML 35–36; đối chiếu 43–44, 71–72'],
  note: 'Điệp: bass thấp xen cụm cao, nhấn 2& và 3&, có nhả trước phách 4. Ô 35–36; chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      bass(0, 1), hit(1, .5, [tone(2), tone(0, 12)]), bass(1.5, 1),
      hit(2.5, .25, [tone(0, 12)]), hit(3, 1, [tone(2), tone(0, 12)]),
      // Bar 36 has Bb/D: preserve its bass/chord alternation, not a mandatory inversion.
      hit(4, 1, [tone(0), tone(2)]), hit(5, .5, [tone(0, 12)]),
      hit(5.5, 1, [tone(0), tone(2)]), hit(6.5, .5, [tone(0), tone(1, 12)]),
      hit(7, 1, [tone(2), tone(0, 12)]),
    ],
    right: [
      hit(1, .5, [tone(2)]), hit(1.5, .5, [tone(1)]), hit(2, .5, [tone(2)]),
      hit(2.5, 1, [tone(0)]),
      // F4 is the lower octave of the melody at 35:3.5, not independent comping.
      hit(4.5, .5, [tone(0)]), hit(5, .5, [tone(2), tone(0)]),
    ],
  },
}

export const CP_BALLAD_SONG_STYLES: readonly StylePattern[] = [coEmCho, coEmChoChorus, ngayMai, ngayMaiChorus]
export const CP_BALLAD_SONG_IDS = CP_BALLAD_SONG_STYLES.map(style => style.id)
export const CP_BALLAD_SONG_FAMILIES = [coEmCho.family, ngayMai.family]
