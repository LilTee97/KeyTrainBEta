import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { getStyle } from '../../style/styleLibrary'
import { generateSolo, type SoloNoteSource } from '../soloGenerator'
import { pulseForStyle, soloFeelFor } from '../soloFeel'
import {
  CA_PHAO_RANGE,
  describeProfile,
  profileLine,
  within,
  type LineProfile,
} from '../styleProfile'

/*
  CÁI THƯỚC.

  Chấm một bộ sinh câu bằng cách so hình dạng thống kê của nó với **một người
  chơi thật** — corpus 7 bản ký âm của Cà Pháo, nguồn `ca-phao-piano-covers` bên
  PianoBrain. Trước khi có nó, câu hỏi "bộ sinh mới có hay hơn không" chỉ trả
  lời được bằng ý kiến.

  Test này KHÔNG khẳng định giống Cà Pháo là hay. Nó khẳng định hai chuyện đo
  được, và cả hai đều là lý do một thay đổi đã làm trong app:

  1. Nguồn nốt `chordTone` nằm NGOÀI khoảng người thật, rất xa.
  2. Nguồn theo gam kéo nó về gần hẳn.

  Ai đổi mặc định ngược lại thì lưới này đỏ.
*/

const KEY = { tonic: 9 as const, scale: 'minor' as const }
const SONG = 'Am Dm E7 Am F G C E7 Am F Dm E7 Am C G Am'
const STYLES = ['slow-rock-duc-thinh-3', 'bossa-nova-1', 'bolero-1', 'pop-1'] as const
/** Gộp nhiều lượt để mẫu đủ lớn: một lượt chỉ cho vài câu, số nhảy loạn. */
const TAKES = 16

function profileOf(styleId: string, noteSource: SoloNoteSource): LineProfile {
  const style = getStyle(styleId)!
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  const pulse = pulseForStyle(styleId)
  const chords = parseChordInput(SONG).chords
  const notes: { startBeat: number; note: number }[] = []

  for (let take = 0; take < TAKES; take += 1) {
    const offset = take * chords.length * bar
    for (const note of generateSolo(chords, {
      beatsPerChord: bar,
      density: 'medium',
      key: KEY,
      take,
      interlude: true,
      noteSource,
      feel: soloFeelFor(styleId),
      ...(pulse.length > 0 ? { pulse, pulseBar: bar } : {}),
    })) {
      notes.push({ startBeat: note.startBeat + offset, note: note.note })
    }
  }

  return profileLine({
    notes,
    chords: Array.from({ length: TAKES }, () => chords).flat(),
    beatsPerChord: bar,
    ...(pulse.length > 0 ? { pulse } : {}),
    beatsPerBar: bar,
  })
}

describe('cái thước tự nó có đo đúng không', () => {
  const line = (notes: number[]) =>
    profileLine({
      notes: notes.map((note, at) => ({ startBeat: at * 0.25, note })),
      chords: parseChordInput('C').chords,
      beatsPerChord: 4,
    })

  it('câu đi liền bậc bị gọi là gam', () => {
    expect(line([60, 62, 64, 65, 67, 69]).scale).toBe(1)
  })

  it('câu đi quãng ba bị gọi là rải hợp âm', () => {
    expect(line([60, 64, 67, 72, 76, 79]).arpeggio).toBe(1)
  })

  /*
    Pha trộn nghĩa là KHÔNG bên nào chiếm 60%. Dãy dưới đây có bước
    2-4-2-4-7 nửa cung: liền bậc 40%, quãng ba 40%, còn lại một bước rộng.
  */
  it('câu vừa bước vừa nhảy bị gọi là pha trộn', () => {
    expect(line([60, 62, 66, 68, 72, 79]).mixed).toBe(1)
  })

  /* Đúng 60% liền bậc thì vẫn tính là gam — ngưỡng nằm ở chỗ này. */
  it('ngưỡng 60% tính về phía gam', () => {
    expect(line([60, 62, 65, 67, 71, 72]).scale).toBe(1)
  })

  /* Khoảng nghỉ cắt câu: hai hơi rời nhau không phải một câu dài. */
  it('nghỉ giữa chừng thì tách thành hai câu', () => {
    const notes = [60, 62, 64, 65].map((note, at) => ({ startBeat: at * 0.25, note }))
    const more = [67, 69, 71, 72].map((note, at) => ({ startBeat: 4 + at * 0.25, note }))
    const profile = profileLine({
      notes: [...notes, ...more],
      chords: parseChordInput('C').chords,
      beatsPerChord: 8,
    })
    expect(profile.runs).toBe(2)
  })

  it('câu ngắn hơn bốn nốt thì không đếm', () => {
    expect(line([60, 62, 64]).runs).toBe(0)
  })

  it('nốt lặp không phải một bước', () => {
    expect(line([60, 60, 62, 62, 64, 65]).scale).toBe(1)
  })
})

describe('chấm bộ sinh câu hiện tại so với người thật', () => {
  /*
    Đây là lý do mặc định của bốn họ điệu đã đổi sang nguồn theo gam. Nguồn
    `chordTone` chỉ lấy nốt hợp âm, mà nốt hợp âm cách nhau quãng ba — nên câu
    chạy BẮT BUỘC thành rải. Không phải lựa chọn tồi, mà là vật liệu ép.
  */
  it.each(STYLES)('%s: chordTone rải hợp âm nhiều hơn người thật rất xa', (styleId) => {
    const profile = profileOf(styleId, 'chordTone')
    // Chặn mẫu quá nhỏ, không phải một khẳng định về nhạc.
    expect(profile.runs, 'phải có đủ câu để chấm').toBeGreaterThan(12)
    expect(profile.arpeggio, describeProfile(profile)).toBeGreaterThan(
      CA_PHAO_RANGE.arpeggio[1],
    )
  })

  it.each(STYLES)('%s: chordTone khoá cứng vào nốt hợp âm', (styleId) => {
    const profile = profileOf(styleId, 'chordTone')
    expect(profile.chordToneOnPulse, describeProfile(profile)).toBeGreaterThan(
      CA_PHAO_RANGE.chordToneOnPulse[1],
    )
  })

  it.each(STYLES)('%s: nguồn theo gam cắt rải hợp âm xuống ít nhất một nửa', (styleId) => {
    const chordTone = profileOf(styleId, 'chordTone')
    const scaled = profileOf(styleId, 'keyPentatonic')
    expect(scaled.arpeggio, `${describeProfile(scaled)}`).toBeLessThanOrEqual(
      chordTone.arpeggio / 2,
    )
  })

  it.each(STYLES)('%s: nguồn theo gam đặt nốt hợp âm đúng khoảng người thật', (styleId) => {
    const profile = profileOf(styleId, 'keyPentatonic')
    expect(
      within(profile.chordToneOnPulse, CA_PHAO_RANGE.chordToneOnPulse),
      describeProfile(profile),
    ).toBe(true)
  })
})

/*
  Khoảng còn hở, ghi lại để bước sau có đích.

  Nguồn theo gam đã kéo phần HOÀ ÂM về đúng khoảng, nhưng HÌNH CÂU thì chưa:
  đo ra 83-93% câu pha trộn (người thật 68-82%) và 2-10% câu gam thuần (người
  thật 6-22%). Nghĩa là câu chạy của app hiếm khi đi liền bậc một mạch — nó cứ
  lượn lờ giữa hai lối.

  Đây là chỗ bộ sinh mới phải thắng, và test này là nơi chứng minh.
*/
describe('khoảng còn hở, chưa đóng được', () => {
  it('ghi lại: hình câu của nguồn theo gam còn lệch khoảng người thật', () => {
    const off = STYLES.map((styleId) => profileOf(styleId, 'keyPentatonic')).filter(
      (profile) => !within(profile.mixed, CA_PHAO_RANGE.mixed),
    )
    expect(off.length, 'nếu chỗ này hết lệch thì bỏ test và cập nhật ghi chú').toBeGreaterThan(0)
  })
})

/*
  BA CHỈ SỐ NHỊP, thêm sau khi một bản dựng hỏng lọt lưới.

  Bộ sinh cọc-và-nối đạt 16 trên 24 chỉ số cũ rồi bị tai người dùng bác thẳng
  là "loạn". Sáu chỉ số cũ đều đo CHẤT LIỆU — cỡ bước, tỉ lệ nốt hợp âm, độ dài
  hơi — không cái nào đo NHỊP. Đo lại mới thấy:

  |               | cỡ nhịp | móc đơn | im lặng |
  |---------------|---------|---------|---------|
  | người thật    | 7-22    | 25-74%  | có      |
  | sổ mẫu Licky  | 6-10    | 0-38%   | 6-8%    |
  | cọc-và-nối    | 3-4     | 14-39%  | **0%**  |

  Không một chỗ nghỉ nào trong cả đoạn: chỗ "thở" của bộ ấy chỉ bỏ nốt nối, còn
  cọc vẫn gõ đều nên khe không bao giờ đủ rộng.
*/
describe('thước phải đo được cả nhịp', () => {
  const line = (gaps: number[]) => {
    let at = 0
    const notes = [{ startBeat: 0, note: 60 }]
    for (const gap of gaps) {
      at += gap
      notes.push({ startBeat: at, note: 60 + notes.length })
    }
    return profileLine({ notes, chords: parseChordInput('C').chords, beatsPerChord: 64 })
  }

  it('đếm đúng số cỡ nhịp khác nhau', () => {
    expect(line([0.5, 0.5, 0.5]).rhythmSizes).toBe(1)
    expect(line([0.5, 1, 0.25, 0.5]).rhythmSizes).toBe(3)
  })

  it('đo đúng tỉ lệ móc đơn', () => {
    expect(line([0.5, 0.5, 1, 1]).eighthShare).toBeCloseTo(0.5, 5)
  })

  it('khe rộng tính là im lặng', () => {
    expect(line([0.5, 0.5, 0.5]).silence).toBeCloseTo(0, 5)
    expect(line([0.5, 4, 0.5]).silence).toBeGreaterThan(0.4)
  })

  /*
    Chỉ số lặp hình phải nhìn CẢ NHỊP. Bản trước chỉ đếm trùng cao độ nên nó nói
    dối: bộ cọc-và-nối đo ra 60% — trong khoảng người thật — mà con số ấy bị
    thổi phồng vì chỉ có ba cỡ nhịp. Ba cỡ nhịp thì trùng hình là đương nhiên,
    và đó là ĐỀU ĐẶN chứ không phải motif.
  */
  it('lặp hình đếm cả nhịp, không chỉ cao độ', () => {
    const sameNotes = [60, 62, 64, 66, 60, 62, 64, 66]
    const even = profileLine({
      notes: sameNotes.map((note, at) => ({ startBeat: at * 0.5, note })),
      chords: parseChordInput('C').chords,
      beatsPerChord: 64,
    })
    const varied = profileLine({
      notes: sameNotes.map((note, at) => ({
        startBeat: at < 4 ? at * 0.5 : 2 + (at - 4) * 0.25,
        note,
      })),
      chords: parseChordInput('C').chords,
      beatsPerChord: 64,
    })
    // Cùng dãy cao độ; bản nhịp đều lặp nhiều hơn hẳn bản nhịp đổi.
    expect(even.motifReuse).toBeGreaterThan(varied.motifReuse)
  })
})
