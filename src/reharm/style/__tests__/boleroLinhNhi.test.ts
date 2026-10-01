import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { patternOnsets, patternStrikes } from '../soloLeftHand'
import { getStyle } from '../styleLibrary'
import { buildPhraseSection } from '../phraseSection'
import { vonO } from '../giaiDieuDaoLinhNhi'
import type { PitchClass } from '../../../shared/musicTheory/types'
import { MAU_BOSSA } from './mauThu'

/*
  BOLERO — khuôn rải Linh Nhi đo từ bản ký âm (`bolero-linh-nhi-2`, khuôn ngầm cho câu solo) và intro Bolero Tuấn.

  30/9/2026: bỏ hai nhóm test "bolero trữ tình" (Gemini, video *Đừng Xa Em Đêm Nay*: phiên 1-5-8+10 · cao trào tám
  móc đơn) — điệu `bolero-linh-nhi` đã xoá.
*/

describe('bolero rải — đo từ bản ký âm', () => {
  const bac = (styleId: string, chord: string) => {
    const events = renderPattern(
      voiceLeadTwoHands(parseChordInput(chord).chords, {}),
      getStyle(styleId)!,
    )
      .filter((event) => event.hand === 'left')
      .sort((a, b) => a.startBeat - b.startBeat)
    const goc = Math.min(...events[0]!.notes)
    return events.map((event) => [event.startBeat, Math.min(...event.notes) - goc])
  }

  it('vòm thấp: 1-5-8-10 rồi về gốc, đúng mẫu đo được', () => {
    // Đo trên bản ký âm: 0 +7 +12 +15/16 +12 +7 +12 +0 +7, thấy ở 21/70 ô.
    expect(bac('bolero-linh-nhi-2', 'Bm')).toEqual([
      [0, 0], [0.5, 7], [0.75, 12], [1, 15], [1.5, 12], [2, 7], [2.5, 12], [3, 0], [3.5, 7],
    ])
    // Hợp âm trưởng thì bậc 10 rộng thêm một nửa cung, phần còn lại y nguyên.
    expect(bac('bolero-linh-nhi-2', 'D')[3]).toEqual([1, 16])
  })

  it('vòm cao: cùng ba nốt đầu, rồi trèo tới bậc 15', () => {
    // Đo trên bản ký âm: 0 +7 +12 +15/16 +19 +24 +19 +15/16 +12, thấy ở 13/70 ô.
    expect(bac('bolero-linh-nhi-2-chorus', 'Bm')).toEqual([
      [0, 0], [0.5, 7], [0.75, 12], [1, 15], [1.5, 19], [2, 24], [2.5, 19], [3, 15], [3.5, 12],
    ])
  })

  it('ba nốt đầu giống hệt nhau ở cả hai vòm', () => {
    expect(bac('bolero-linh-nhi-2', 'Bm').slice(0, 3))
      .toEqual(bac('bolero-linh-nhi-2-chorus', 'Bm').slice(0, 3))
  })

  /*
    Cặp móc kép ở phách 1& là chữ ký. Bỏ nó đi thì mẫu này thành một mẫu rải
    móc đơn đều bất kỳ — đo trên bản gốc, cặp ấy có ở 49 trên 70 ô.
  */
  it('giữ cặp móc kép ở phách 1&', () => {
    for (const id of ['bolero-linh-nhi-2', 'bolero-linh-nhi-2-chorus'] as const) {
      const cell = getStyle(id)!.cell!.left
      const kep = cell.filter((hit) => hit.durationBeats === 0.25)
      expect(kep.map((hit) => hit.beat), id).toEqual([0.5, 0.75])
    }
  })

})

/*
  ĐOẠN SOLO cũng phải giữ chữ ký của mẫu.

  Trần mặc định sáu cú gõ mỗi ô — đo trên đoạn giang tấu của Cà Pháo — cắt mất
  ba trong chín cú của mẫu này, và nó cắt đúng CẶP MÓC KÉP vì cặp ấy nhẹ nhất.
  Mất cặp ấy thì Bolero rải thành một mẫu rải móc đơn đều bất kỳ.

  Bản độc tấu thì chín cú mỗi ô là thật: tay trái gánh cả phần đệm. Nới được vì
  chỗ giai điệu đã có `interlockHands` lo theo mật độ, tinh hơn một trần cứng.
*/
describe('bolero rải giữ được chữ ký ở đoạn solo', () => {
  it.each(['bolero-linh-nhi-2', 'bolero-linh-nhi-2-chorus'] as const)(
    '%s: giữ đủ chín cú gõ',
    (styleId) => {
      expect(patternOnsets(getStyle(styleId)!, 'left')).toEqual([
        0, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5,
      ])
    },
  )

  it.each(['bolero-linh-nhi-2', 'bolero-linh-nhi-2-chorus'] as const)(
    '%s: cặp móc kép sống sót',
    (styleId) => {
      const kep = patternStrikes(getStyle(styleId)!, 'left').filter(
        (strike) => strike.durationBeats < 0.3,
      )
      expect(kep.map((strike) => strike.beat)).toEqual([0.5, 0.75])
    },
  )

  it('điệu không khai trần riêng vẫn bị cắt về sáu như cũ', () => {
    // Mẫu bossa chỉ dùng trong test (số liệu Bossa Nova 1 cũ, xoá 30/9/2026).
    expect(patternOnsets(MAU_BOSSA, 'left').length).toBeLessThanOrEqual(6)
  })
})

// Nút Bolero Tuấn (tester). Cũ: `bolero-1` (Bolero 1 Tuấn Lưu, cùng lối Pùng-Pắp — đã xoá 30/9/2026).
const BOLERO_TUAN = 'bolero-tu-n-improv-bai-04-00001'

describe('intro bolero Tuấn = Pùng-Pắp hai tay', () => {
  const moc = (hand: 'left' | 'right') => {
    const chords = parseChordInput('C Am Em G').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 0 as PitchClass, scale: 'major' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    return [
      ...new Set(
        d.events
          .filter((e) => e.hand === hand)
          .map((e) => Number((e.startBeat % 4).toFixed(3))),
      ),
    ].sort((a, b) => a - b)
  }

  it('LH bass 1+3; xen ô đệm đủ (RH chồng nốt) và ô giai điệu (RH 1 nốt)', () => {
    expect(moc('left')).toEqual(expect.arrayContaining([0, 2]))
    const chords = parseChordInput('C Am Em G C Am Em G').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 0 as PitchClass, scale: 'major' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    const rh = d.events.filter((e) => e.hand === 'right')
    expect(rh.some((e) => e.notes.length === 1)).toBe(true)
    expect(rh.some((e) => e.notes.length > 1)).toBe(true)
    const lhDao = d.events.filter(
      (e) => e.hand === 'left' && Math.abs((e.startBeat % 4) - 0.5) < 0.05,
    )
    expect(lhDao.length).toBeGreaterThan(0)
  })

  it('2 câu chạy intro (4 + 4 móc kép); bass phách 3 ô dài im', () => {
    const chords = parseChordInput('C Am Em G C Am Em G').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 0 as PitchClass, scale: 'major' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    const mocChay = [1.5, 1.75, 2, 2.25]
    const chay = mocChay.map((t) =>
      d.events.find((e) => e.hand === 'right' && Math.abs(e.startBeat - t) < 0.05),
    )
    expect(chay.every(Boolean)).toBe(true)
    const ngan = [14.75, 15, 15.25, 15.5].map((t) =>
      d.events.find((e) => e.hand === 'right' && Math.abs(e.startBeat - t) < 0.05),
    )
    expect(ngan.every(Boolean)).toBe(true)
    const lhO1 = d.events.filter((e) => e.hand === 'left' && e.startBeat >= 0 && e.startBeat < 4)
    expect(lhO1.some((e) => Math.abs(e.startBeat - 2) < 0.05)).toBe(false)
    expect(lhO1.some((e) => Math.abs(e.startBeat) < 0.05)).toBe(true)
  })

  it('giọng thứ: vòng dạo theo sheet i-♭VII-♭VI, nốt không có bậc 3 trưởng', () => {
    const chords = parseChordInput('Am Dm G C F E7 Am E7').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 9 as PitchClass, scale: 'minor' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
      // Vòng sheet thứ luôn bật cho Bolero Tuấn giọng thứ — không cần cờ (ô tick gỡ 1/10/2026).
    })!
    expect(d.chords.length).toBeGreaterThan(3)
    expect(d.chords[0]!.startsWith('A')).toBe(true)
    expect(d.chords[1]!.startsWith('G')).toBe(true)
    expect(d.chords[2]!.startsWith('F')).toBe(true)
    expect(d.chords[d.chords.length - 1]!.startsWith('E')).toBe(true)
    const rh = d.events.filter((e) => e.hand === 'right' && e.notes.length === 1)
    const bac3 = rh.filter((e) => (((e.notes[0]! - 9) % 12) + 12) % 12 === 4)
    expect(bac3.length / Math.max(1, rh.length)).toBeLessThan(0.08)
  })

  it('giọng thứ: câu chạy không có bậc 3 trưởng', () => {
    const chords = parseChordInput('Am Dm Em E7 Am Dm Em E7').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 9 as PitchClass, scale: 'minor' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    const chay = d.events.filter(
      (e) => e.hand === 'right' && e.durationBeats < 0.26 && e.startBeat >= 4,
    )
    expect(chay.length).toBeGreaterThan(0)
    const bac3 = chay.filter((e) => (((e.notes[0]! - 9) % 12) + 12) % 12 === 4)
    expect(bac3).toHaveLength(0)
  })

  it('tick chayNgan: intro thứ có câu 6 nốt móc kép, không 10 nốt móc ba', () => {
    const chords = parseChordInput('Am Dm Em E7 Am Dm Em E7').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 9 as PitchClass, scale: 'minor' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
      chayNgan: true,
    })!
    const ngan = d.events.filter((e) => e.hand === 'right' && Math.abs(e.durationBeats - 0.22) < 0.03)
    const dai = d.events.filter((e) => e.hand === 'right' && e.durationBeats < 0.13)
    expect(ngan.length).toBeGreaterThanOrEqual(6)
    expect(dai).toHaveLength(0)
  })

  it('vốn giang Tuấn chỉ ô giang, không ô intro Chiếc Lá', () => {
    const von = vonO('linh-nhi', 'interlude', true)
    expect(von.length).toBeGreaterThan(0)
    expect(von.every((t) => t.doan === 'interlude')).toBe(true)
  })

  it('giang thứ: tám ô phát triển mô-típ, giữ màu thứ và dẫn về phần hát', () => {
    const chords = parseChordInput('Am Dm G C F E7 Am E7').chords
    const opts = {
      key: { tonic: 9 as PitchClass, scale: 'minor' as const },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi' as const,
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    }
    const giang = buildPhraseSection({ ...opts, kind: 'interlude' })!
    // Yêu cầu mới: không lấy độ dài/khung A-B của intro làm chuẩn giang tấu.
    expect(giang.lengthBeats).toBe(36) // 8 ô câu + 1 ô hút/nghỉ theo phản hồi vòng 2.
    expect(giang.sourcePhrase?.method).toBe('motif-development')
    expect(giang.chords[0]!.startsWith('A')).toBe(true)
    expect(giang.chords[2]!.startsWith('D')).toBe(true)
    expect(giang.chords[giang.chords.length - 1]!.startsWith('E')).toBe(true)
    const rh = giang.events.filter((e) => e.hand === 'right' && e.notes.length === 1)
    const bac3 = rh.filter((e) => (((e.notes[0]! - 9) % 12) + 12) % 12 === 4)
    expect(bac3.length / Math.max(1, rh.length)).toBeLessThan(0.08)
    expect(rh.some((e) => e.startBeat % 4 === 0.5)).toBe(true)
    expect(giang.events.some((e) => e.startBeat >= giang.lengthBeats - 4.05)).toBe(true)
  })

  it('giang thứ giữ Fadd2 của bài, không rút thành F', () => {
    const chords = parseChordInput(
      'Am(add9) Fadd2 Dm9 G9 Cadd2 E9sus4 Am(add9) E9sus4',
    ).chords
    const giang = buildPhraseSection({
      kind: 'interlude',
      key: { tonic: 9 as PitchClass, scale: 'minor' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    expect(giang.chords).toContain('Fadd2')
    expect(giang.chords).not.toContain('F')
  })

  it('giang Fadd2: ít nốt phô (b5 / cách hợp âm 1)', () => {
    const input = parseChordInput(
      'Am(add9) Fadd2 Dm9 G9 Cadd2 E9sus4 Am(add9) E9sus4',
    ).chords
    const giang = buildPhraseSection({
      kind: 'interlude',
      key: { tonic: 9 as PitchClass, scale: 'minor' },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: input[0]!,
      solo: () => [],
      songChords: input,
    })!
    const beats = giang.beatsEach
    const pcsOf = (sym: string) => {
      const c = parseChordInput(sym).chords[0]!
      return new Set(c.quality.intervals.map((iv) => (((c.root + iv) % 12) + 12) % 12))
    }
    let n = 0
    let pho = 0
    let b5 = 0
    let faddPho = 0
    let faddN = 0
    giang.chords.forEach((sym, i) => {
      const tu = beats.slice(0, i).reduce((a, b) => a + b, 0)
      const den = tu + (beats[i] ?? 4)
      const tones = pcsOf(sym)
      const root = parseChordInput(sym).chords[0]!.root % 12
      const rh = giang.events.filter(
        (e) => e.hand === 'right' && e.startBeat >= tu - 1e-6 && e.startBeat < den - 1e-6,
      )
      for (const e of rh) {
        const p = ((e.notes[0]! % 12) + 12) % 12
        n += 1
        if (sym.includes('Fadd')) faddN += 1
        const iv = (p - root + 12) % 12
        const near = [...tones].some((t) => Math.min((p - t + 12) % 12, (t - p + 12) % 12) === 1)
        if (iv === 6) {
          b5 += 1
          pho += 1
          if (sym.includes('Fadd')) faddPho += 1
        } else if (!tones.has(p) && near) {
          pho += 1
          if (sym.includes('Fadd')) faddPho += 1
        }
      }
    })
    expect(faddN).toBeGreaterThan(0)
    expect(faddPho / faddN).toBeLessThan(0.15)
    expect(b5 / n).toBeLessThan(0.05)
  })

  it('giang tấu dài hơn intro, nhiều câu chạy hơn, có hút cuối', () => {
    const chords = parseChordInput('C Am Em G C Am Em G').chords
    const opts = {
      key: { tonic: 0 as PitchClass, scale: 'major' as const },
      style: getStyle(BOLERO_TUAN)!,
      thay: 'linh-nhi' as const,
      beatsPerChord: 4,
      dropRoot: true,
      take: 0,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    }
    const dao = buildPhraseSection({ ...opts, kind: 'intro' })!
    const giang = buildPhraseSection({ ...opts, kind: 'interlude' })!
    expect(giang.lengthBeats).toBeGreaterThan(dao.lengthBeats)
    const mocSau = [1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75]
    const dem = (d: typeof dao) =>
      d.events.filter(
        (e) =>
          e.hand === 'right' &&
          mocSau.some((x) => Math.abs((e.startBeat % 4) - x) < 0.05),
      ).length
    expect(dem(giang)).toBeGreaterThan(dem(dao))
    const hut = giang.lengthBeats - 4
    expect(giang.events.some((e) => e.startBeat >= hut - 0.05)).toBe(true)
  })

  it('nút Bolero Tuấn (bolero-tu-n) cũng Pùng-Pắp, không rải Linh Nhi', () => {
    const style = getStyle('bolero-tu-n-improv-bai-04-00001')!
    const chords = parseChordInput('C Am Em G').chords
    const d = buildPhraseSection({
      kind: 'intro',
      key: { tonic: 0 as PitchClass, scale: 'major' },
      style,
      thay: 'linh-nhi',
      beatsPerChord: 4,
      dropRoot: true,
      opening: chords[0]!,
      solo: () => [],
      songChords: chords,
    })!
    const left = [
      ...new Set(
        d.events.filter((e) => e.hand === 'left').map((e) => Number((e.startBeat % 4).toFixed(3))),
      ),
    ]
    expect(left).toContain(0)
    expect(left).toContain(2)
  })
})
