import { describe, expect, it } from 'vitest'
import { generateSolo } from '../soloGenerator'
import { interludeMaterial } from '../soloVocabulary'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord, scaleGaps } from '../../brain/chordScale'
import { chordPitchClasses } from '../../../shared/musicTheory/chordDefinitions'
import type { PitchClass } from '../../../shared/musicTheory/types'

/**
 * Hợp âm kho chưa có gam thì **lùi về nốt hợp âm**, và nói ra là thiếu.
 *
 * Danh sách "chưa có" đã ngắn đi nhiều: hợp âm ba nốt trưởng và thứ giờ chạy
 * ngũ cung của thầy Hải, qua `rule-hai-triad-pentatonic` (Tập 2 bài 2, đã rà).
 * `sus2`, `6`, `add9` mượn cùng ngũ cung ấy.
 *
 * Còn trắng ở đường phát tiếng: `sus4` và `m6` (ngũ cung không chứa nốt làm nên
 * tính cách của chúng), `dim`, và cả `sus2` / `6` / `add9` — mấy chất này chỉ
 * được nối bằng một luật `derived`, mà `derived` thì theo luật kho **không bao
 * giờ được `validated`**, nên cửa siết bên KeyTrain không cho qua.
 *
 * Chỗ đúng để làm với chúng là **không làm gì** — không mượn Mixolydian hay
 * Lydian rồi gắn cho một thầy chưa từng dạy nó.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const chord = (symbol: string) => parseChordInput(symbol).chords[0]

/** Chất hợp âm kho vẫn chưa có gam nào. */
const GAPS = ['Csus4', 'Cm6', 'Cdim', 'Csus2', 'C6', 'Cadd9']

/** Chất hợp âm giờ ĐÃ có gam, qua ngũ cung của thầy Hải. */
const COVERED = ['C', 'Am', 'F', 'G', 'Dm', 'Em']

describe('kho không có gam thì nói không có', () => {
  it('sus4, m6, dim, sus2, 6, add9 vẫn trả null qua cửa siết', () => {
    for (const symbol of GAPS) {
      expect(scaleForChord(chord(symbol)), `${symbol} không được có gam`).toBeNull()
    }
  })

  it('hợp âm ba nốt trưởng và thứ giờ có ngũ cung của thầy Hải', () => {
    for (const symbol of COVERED) {
      const scale = scaleForChord(chord(symbol))
      expect(scale, `${symbol} phải có gam`).not.toBeNull()
      expect(scale!.length, `${symbol} phải là ngũ cung 5 nốt`).toBe(5)
    }
  })

  it('không lấy gam của chất gần giống', () => {
    /*
      Cám dỗ ở đây là lấy Mixolydian cho `Csus4` (cùng nốt gốc, gần chất) hay
      Lydian cho hợp âm ba nốt trưởng. Cả hai đều là gán một bài giảng cho chỗ
      nó không nói tới — đúng thứ luật chống bịa của kho lập ra để chặn.
    */
    expect(scaleForChord(chord('C7'))).not.toBeNull()
    expect(scaleForChord(chord('Cmaj7'))).not.toBeNull()
    // Cùng nốt gốc, gần chất, nhưng thầy không nói tới — không mượn sang.
    expect(scaleForChord(chord('Csus4'))).toBeNull()
    expect(scaleForChord(chord('Cm6'))).toBeNull()
  })

  it('kể ra được hợp âm nào trong bài đang thiếu', () => {
    const gaps = scaleGaps(parseChordInput('Csus4 Cm6 C G7').chords)
    expect(gaps).toContain('Csus4')
    expect(gaps).toContain('Cm6')
    // Hợp âm ba nốt và hợp âm bảy đều có gam rồi, không được kể là thiếu.
    expect(gaps).not.toContain('C')
    expect(gaps).not.toContain('G7')
  })

  it('không kể trùng một hợp âm hai lần', () => {
    expect(scaleGaps(parseChordInput('Csus4 Csus4 Csus4 Cm6').chords)).toEqual(['Csus4', 'Cm6'])
  })
})

describe('lùi về nốt hợp âm, không nốt jazz giả', () => {
  it('chất liệu đúng bằng nốt của chính hợp âm', () => {
    for (const symbol of GAPS) {
      const parsed = chord(symbol)
      const material = interludeMaterial(parsed, KEY, scaleForChord(parsed) ?? undefined)
      const own = new Set(chordPitchClasses(parsed.root, parsed.quality))
      expect(
        [...material].sort((a, b) => a - b),
        `${symbol}: ${material.join(',')}`,
      ).toEqual([...own].sort((a, b) => a - b))
    }
  })

  it('vòng toàn hợp âm sus4 — kho không có gam — thì bật hay tắt đều như nhau', () => {
    /*
      Vòng này cố tình không có hợp âm ba nốt **thứ**: bài 2 của nguồn Jazz
      Scales có kể `Cm` trong danh sách hợp âm của gam Dorian, nên hợp âm ba
      nốt thứ *có* gam — còn hợp âm ba nốt trưởng thì không video nào kể tới.
      Bất đối xứng ấy đến từ dữ liệu nguồn chứ không phải một quyết định, và
      giữ nguyên là đúng: có nguồn thì dùng, không có thì thôi.
    */
    const chords = parseChordInput('Csus4 Fsus4 Gsus4 Csus4').chords
    const args = {
      beatsPerChord: 4,
      density: 'dense' as const,
      key: KEY,
      take: 5,
      interlude: true,
      storeScale: scaleForChord,
    }
    const plain = generateSolo(chords, { ...args, noteSource: 'chordTone' as const })
    const jazz = generateSolo(chords, { ...args, noteSource: 'storeScale' as const })
    expect(jazz.map((n) => n.note)).toEqual(plain.map((n) => n.note))
  })

  it('câu trên hợp âm sus4 chỉ dùng nốt của chính hợp âm', () => {
    /*
      Đo trên nốt chính của từng ô: nốt phải thuộc hợp âm đang vang hoặc thuộc
      giọng của bài. Nốt tô điểm và nốt láy được miễn — chúng là nốt lướt nửa
      cung, có từ trước và không dính gì tới gam.
    */
    /*
      Không đo theo giọng của bài: `Fsus4` có nốt Si giáng, nằm ngoài giọng Đô mà
      vẫn là nốt của chính hợp âm ấy. Đo theo **nốt hợp âm đang vang** mới đúng.
    */
    const allowed = new Set<PitchClass>(
      parseChordInput('Csus4 Fsus4 Gsus4')
        .chords.flatMap((c) => chordPitchClasses(c.root, c.quality)),
    )
    for (let take = 0; take < 8; take += 1) {
      const solo = generateSolo(parseChordInput('Csus4 Fsus4 Gsus4 Csus4').chords, {
        beatsPerChord: 4,
        density: 'dense',
        key: KEY,
        take,
        noteSource: 'storeScale',
        interlude: true,
        storeScale: scaleForChord,
      })
      for (const note of solo) {
        if (note.isGrace || note.ornament) continue
        const pc = (((note.note % 12) + 12) % 12) as PitchClass
        expect(allowed.has(pc), `lượt ${take} @ phách ${note.startBeat}: nốt ${pc}`).toBe(true)
      }
    }
  })
})
