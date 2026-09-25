import type { RhythmCell, RhythmHit, StylePattern } from '../types'
import { BALLAD_DERX } from './balladDerx'

// Phrase reductions, not a transcription of the melody or a universal CP groove.
// Source bars and every editorial change: Reference/CA-PHAO-BALLAD-SONGS.md.
const common = {
  timeSignature: '4/4', beatsPerMeasure: 4,
  feel: 'straight-block-chord' as const,
  verified: true, releaseRatio: 1, leftHandTop: 67,
  cpBalladChordLeads: true,
}
const tone = (toneIndex: number, semitones = 0) => ({ toneIndex, semitones, fromRoot: true })
const hit = (beat: number, durationBeats: number, tones: RhythmHit['tones'],
  velocityScale = .65): RhythmHit => ({ beat, durationBeats, tones, velocityScale })
const bass = (beat: number, duration: number) => hit(beat, duration, [tone(0)], .85)

const coEmCho: StylePattern = {
  ...common, id: 'ca-phao-ballad-co-em-cho',
  name: 'Có Em Chờ · Phiên khúc', family: 'ca-phao-ballad-co-em-cho',
  cpSoloSong: 'Co Em Cho',
  familyName: 'Ballad Có Em Chờ', variant: 1, bpm: 75,
  sourceVideos: ['Cà Pháo · Có Em Chờ · phiên ô XML 9–10; đối chiếu 17–18'],
  note: 'Phiên: bass ngân xen móc kép cuối câu. Hai ô 9–10, bè trong rút gọn; đã nghe duyệt 25/09/2026.',
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
  cpSoloSong: coEmCho.cpSoloSong,
  familyName: coEmCho.familyName, variant: 2, bpm: 75,
  sourceVideos: ['Cà Pháo · Có Em Chờ · điệp ô XML 25–26; đối chiếu 41–42'],
  note: 'Điệp: bass rải rộng, bè trong nhấn lệch móc kép. Ô 25–26, bỏ melody và pickup phụ thuộc hòa âm; đã nghe duyệt 25/09/2026.',
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
  cpSoloSong: 'Ngay mai em di',
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
  cpSoloSong: ngayMai.cpSoloSong,
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

// ACDD: bar 40 is the main gesture; the occasional eight attacks omit the vocal line.
// RH selections and harmonic substitutions: Reference/CA-PHAO-BALLAD-ACDD.md.
const acddCommon = { ...common, rightHandRegister: { rootFloor: 48, low: 55, high: 84 } }
const seventh = (semitones = 0, fallbackInterval = 10) => ({ ...tone(3, semitones), fallbackInterval })
// The bar heard on the user's 7th/15th chord (F#m7b5): keep this gesture intact.
export const ACDD_MAIN: RhythmCell = {
  lengthBeats: 4,
  left: [
    bass(0, .5), hit(.5, 1.5, [tone(0, 12)]), hit(2, .5, [tone(0, 12)]),
    hit(2.5, .5, [tone(2, 12)]), hit(3, 1, [tone(1, 12), tone(3, 12)]),
  ],
  right: [
    hit(0, 1, [tone(1, 12), tone(3, 12)]), hit(1, .5, [tone(2), tone(3), tone(1, 12)]),
    hit(1.5, .25, [tone(1, 12), tone(3, 12)]), hit(2, .5, [tone(1, 12), tone(3, 12)]),
    hit(2.5, .25, [tone(2, 12)]), hit(2.75, .75, [tone(1, 12), tone(3, 12), tone(0, 26)]),
  ],
}

// Eight attacks in the first two beats, NOT the song's vocal contour.
// Accents 1/5/8 are the user's arrangement request, not inferred meter accents.
export const ACDD_EIGHT: RhythmCell = {
  lengthBeats: 4,
  left: [
    hit(0, .27, [tone(0)], 1), hit(.25, .27, [tone(2)], .52),
    hit(.5, .27, [tone(0, 12)], .52), hit(.75, .27, [tone(1, 12)], .52),
    bass(2, .5), hit(2.5, .5, [tone(2)]), hit(3, 1, [tone(1, 12), tone(3, 12)]),
  ],
  right: [
    hit(1, .27, [tone(2)], .9), hit(1.25, .27, [tone(1)], .5),
    hit(1.5, .27, [tone(2)], .5), hit(1.75, .27, [tone(1), tone(2)], .9),
    hit(2, .75, [tone(1), tone(3)]), hit(2.75, 1.25, [tone(1), tone(3)]),
  ],
}
const acddVerseBars = [ACDD_MAIN, ACDD_MAIN, ACDD_EIGHT, ACDD_MAIN, ACDD_MAIN, ACDD_EIGHT, ACDD_MAIN, ACDD_MAIN]
const acdd: StylePattern = {
  ...acddCommon, id: 'ca-phao-ballad-acdd', name: 'Ballad ACDD',
  family: 'ca-phao-ballad-acdd', familyName: 'Ballad ACDD', variant: 1, bpm: 63,
  cpSoloSong: 'Anh Cu Di Di',
  sourceVideos: ['Cà Pháo · Anh cứ đi đi · nền dặm ô 40; xen rải từ cử chỉ ô 10, đã bỏ melody; điệp 17–20'],
  note: 'ACDD: dặm hai tay làm nền, xen rải tám tiếng nhấn 1–5–8, ngân liền; tự đổi ở điệp. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 32,
    left: acddVerseBars.flatMap((bar, index) => bar.left.map(hit => ({ ...hit, beat: hit.beat + index * 4 }))),
    right: acddVerseBars.flatMap((bar, index) => bar.right.map(hit => ({ ...hit, beat: hit.beat + index * 4 }))),
  },
}

const acddChorus: StylePattern = {
  ...acddCommon, id: 'ca-phao-ballad-acdd-chorus', name: 'ACDD · Điệp khúc',
  family: acdd.family, familyName: acdd.familyName, variant: 2, bpm: 63,
  cpSoloSong: acdd.cpSoloSong,
  sourceVideos: ['Cà Pháo · Anh cứ đi đi · điệp ô XML 17–20; đối chiếu 46–49'],
  note: 'Điệp ACDD: bass thấp/cao đan xen, bè trong đáp lệch phách. Bỏ melody nhân quãng tám; chờ nghe duyệt.',
  cell: {
    lengthBeats: 16,
    left: [
      bass(0, .25), hit(.25, .5, [tone(0, 12)]), hit(.75, .25, [tone(1, 12)]),
      hit(1, .25, [tone(2, 12)]), hit(1.25, .5, [tone(1, 12)]), hit(1.75, .25, [tone(2)]),
      bass(2, .25), hit(2.25, .5, [tone(2)]), bass(2.75, .25),
      // Source A3 leads to Bbm; use the current chord third outside that cadence.
      hit(3, 1, [tone(1, 12)]),
      bass(4, .5), hit(4.5, 1, [tone(2)]), bass(5.75, .5), bass(6.25, .5),
      hit(6.75, 1, [tone(0, 12)]),
      bass(8, .75), hit(8.75, .5, [tone(0, 12)]), hit(9.25, .5, [tone(2, 12)]),
      hit(9.75, .5, [tone(2)]), bass(10.25, .25), bass(10.5, .5),
      hit(11, .25, [tone(2, 12)]), hit(11.25, .75, [tone(1, 12)]),
      bass(12, .5), hit(12.5, 1, [tone(2)]), bass(13.75, .25), hit(14, .25, [tone(2)]),
      hit(14.25, 1, [tone(0, 14)]), hit(15.25, .75, [tone(0, 12)]),
    ],
    right: [
      // Keep the independent inner voice at 17:3, not the surrounding octave melody.
      hit(3, .5, [tone(1, 12)]),
      hit(4, .75, [tone(2), tone(1, 12)]), hit(4.75, .25, [tone(1, 12)]), hit(5, .5, [tone(1), tone(2)]),
      hit(5.5, 1, [tone(1, 12)]), hit(6.5, .5, [tone(1, 12)]), hit(7, .25, [tone(2)]),
      hit(7.25, .25, [tone(1)]),
      hit(8, .5, [seventh(12)]), hit(9, .5, [tone(0, 12), tone(2, 12)]),
      hit(9.5, .5, [tone(1, 12), tone(2, 12)]), hit(10, .5, [tone(2, 12)]), hit(11, .5, [tone(2, 12)]),
      hit(12, .75, [seventh(0, 11), tone(1, 12)]), hit(12.75, .25, [tone(1, 12)]), hit(13, .5, [tone(1), tone(2)]),
      hit(13.5, 1, [tone(1, 12)]), hit(14.5, .25, [tone(1)]), hit(14.75, .25, [tone(2)]),
      hit(15, .5, [tone(2), tone(1, 12)]), hit(15.5, .25, [tone(1), seventh(0, 11)]),
    ],
  },
}

/*
  Để Em Rời Xa — soạn lại 25/9/2026 theo cách Codex dựng Ballad DERX (Reference/BALLAD-DERX.md),
  chờ nghe duyệt. Số đo: Reference/CA-PHAO-BALLAD-DE-EM.md, `scripts/audit_cp_de_em.py`.
  Beat đếm trên "cửa sổ k" = [ô XML k phách 2, ô XML k+1 phách 2): vạch nhịp sheet lệch nhạc một phách.

  Giữ NGUYÊN mốc gõ của DERX (phiên 4–5, điệp 24–25). Người dùng nghe DERX: "bám gần tiết tấu
  sheet" nhưng "thiếu tiếng và đứt quãng". Đo trên vòng của sheet: DERX phiên 2,50 nốt vang TB,
  im hẳn ở 1.5–1.75, tay phải trống 0.5–1.75 và 3.25–5; sheet đủ hai tay 3,00 nốt, im 0–1%.
  Chỗ trống ấy trong sheet là giai điệu lời. Hai sửa, KHÔNG thêm cú gõ nào:
  1. Ngân nối: mỗi nốt ngân tới cú gõ kế của cùng tay (renderer tự cắt ở chỗ đổi hợp âm).
     Sheet không ghi pedal — độ ngân dài là biên soạn. Ghi `sheet d` cạnh từng cú để lùi.
  2. Cú tay phải vốn là cụm hai nốt trong sheet thì trả đủ hai nốt (DERX rút còn nốt dưới).
     Nốt trên là cao độ giai điệu ở chỗ ấy, nhưng chỉ ở cú có bè — không chép nhịp giai điệu.
*/
const deEmCommon = {
  timeSignature: '4/4', beatsPerMeasure: 4, feel: 'straight-block-chord' as const,
  verified: true, releaseRatio: 1, leftHandTop: 59,
  rightHandRegister: { rootFloor: 55, low: 60, high: 74 },
}
const deEm: StylePattern = {
  ...deEmCommon, id: 'ca-phao-ballad-de-em-roi-xa',
  name: 'Để Em Rời Xa · Phiên khúc', family: 'ca-phao-ballad-de-em-roi-xa',
  familyName: 'Ballad Để em', variant: 1, bpm: 85,
  sourceVideos: ['Cà Pháo · Để Em Rời Xa · cửa sổ 4–5 (XML 4:2–6:2) như DERX; đối chiếu 32–33'],
  note: 'Phiên: mốc gõ DERX (trái giữ nền, phải chêm lệch; phải ngân F4 trên câu chạy trái), ngân nối tới cú sau, tay phải đủ quãng đôi của sheet. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      hit(0, 1.75, [tone(0), tone(2), tone(3)], .85),        // Bb2+F3+A3, sheet d 1.5
      hit(1.75, .75, [tone(0, 12), tone(2, 12)]),            // C3+G3
      hit(2.5, .5, [tone(2, 12)]), hit(3, 1, [tone(0, 24)]), // G3 · C4 (gập về dưới trần 59)
      hit(4, 2.25, [tone(0, 12), tone(2, 12), tone(3, 12)], .8), // D3+A3+C4, sheet d 2
      // A2-D3-E3-F3-E3-D3-C3 dưới F4 đang ngân (DERX).
      hit(6.25, .25, [tone(2)]), hit(6.5, .25, [tone(0, 12)]),
      hit(6.75, .25, [tone(0, 14)]), hit(7, .25, [tone(1, 12)]),
      hit(7.25, .25, [tone(0, 14)]), hit(7.5, .25, [tone(0, 12)]), hit(7.75, .25, [tone(3)]),
    ],
    right: [
      // Nốt dưới (bè) ngân nối; nốt trên giữ độ ngân sheet — ngân cả hai thì dày hơn chính sheet
      // (3,72 nốt vang TB so với 3,00), vì giữa các cú sheet chỉ có MỘT nốt tay phải là giai điệu.
      hit(0, 1.75, [tone(1)]), hit(0, .5, [tone(2)]),        // D4 sheet d .5 · F4
      hit(1.75, .5, [tone(1), tone(0, 12)]),                 // E4+C5
      hit(2.25, .5, [tone(2), tone(0, 12)]),                 // G4+C5
      hit(2.75, 2.25, [tone(2)]), hit(2.75, .25, [tone(0, 12)]), // G4 sheet d .5 · C5 .25
      hit(5, .25, [tone(1), tone(3)]), hit(5.25, .5, [tone(1), tone(3)]), // F4+C5 · F4+C5
      hit(5.75, 2.25, [tone(1)]), hit(5.75, 1.25, [tone(3)]), // F4 sheet d 2 · C5 1.25
    ],
  },
}

const deEmChorus: StylePattern = {
  ...deEmCommon, id: 'ca-phao-ballad-de-em-roi-xa-chorus',
  name: 'Để Em Rời Xa · Điệp khúc', family: deEm.family,
  familyName: deEm.familyName, variant: 2, bpm: 85,
  sourceVideos: ['Cà Pháo · Để Em Rời Xa · cửa sổ 24–25 (XML 24:2–26:2) như DERX, đầu bass theo 52; đối chiếu 52–53'],
  note: 'Điệp: mốc gõ DERX (bass móc đơn, bè chêm lệch, chùm ba), ngân nối tới cú sau, F4+D5 đủ quãng đôi. Chờ nghe duyệt.',
  cell: {
    lengthBeats: 8,
    left: [
      // Bb2 F3 Bb3 theo cửa sổ 52 (24 là Bb1-Bb2-Bb3, vượt trần) · C2 · C3+G3 · C3+G3.
      bass(0, .5), hit(.5, .5, [tone(2)]), hit(1, 1, [tone(0, 12)]),
      bass(2, .5), hit(2.5, .5, [tone(0, 12), tone(2, 12)]), hit(3, 1, [tone(0, 12), tone(2, 12)]),
      // Cửa sổ 25: C#3 (A/C#, không ép thể đảo) · A3 sheet d 1 · D2 · D2 · D2 sheet d .75.
      bass(4, .5), hit(4.5, 1.25, [tone(0, 12)]), bass(5.75, .25), bass(6, 1), bass(7, 1),
    ],
    right: [
      hit(0, .75, [tone(2), tone(1, 12)]), hit(.75, 7 / 12, [tone(2), tone(1, 12)]), // F4+D5 ×2, sheet d .5
      hit(4 / 3, 2 / 3, [tone(2), tone(0, 12)]),              // F4+Bb4 chùm ba (bỏ F5: vượt trần 74)
      hit(2, .75, [tone(1), tone(0, 12)]),                    // E4+C5 (bỏ E5)
      // Khe lời: C4 · D4+G4 · E4 · C4 (52 có D4/G4 · E4 y hệt).
      hit(2.75, .25, [tone(0)]), hit(3, .25, [tone(0, 2), tone(2)]), hit(3.25, .25, [tone(1)]), hit(3.5, .5, [tone(0)]),
      hit(4, .5, [tone(0, 12), tone(1, 12)]), hit(4.5, .25, [tone(0, 12)]), hit(4.75, .25, [tone(0, 12)]),
      hit(5, .25, [tone(2)]), hit(5.25, .5, [tone(1, 12)]),
      hit(5.75, 1.5, [tone(1), tone(2)]),                     // F4+A4, sheet d .5
      hit(7.25, .75, [tone(3, -12)]),                         // C4, sheet d .25
    ],
  },
}

export const CP_BALLAD_SONG_STYLES: readonly StylePattern[] = [coEmCho, coEmChoChorus, ngayMai, ngayMaiChorus, acdd, acddChorus]
// Tách mảng riêng: nút do Claude soạn, không mang màu Codex và không đổi test sáu điệu của Codex.
export const CP_BALLAD_DE_EM_STYLES: readonly StylePattern[] = [deEm, deEmChorus]
export const CP_BALLAD_SONG_IDS = [...CP_BALLAD_SONG_STYLES, ...CP_BALLAD_DE_EM_STYLES, ...BALLAD_DERX].map(style => style.id)
export const CP_BALLAD_SONG_FAMILIES = [coEmCho.family, ngayMai.family, acdd.family]
