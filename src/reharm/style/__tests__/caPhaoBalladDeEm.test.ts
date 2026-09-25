import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle, isCodexStyle } from '../styleLibrary'
import { BALLAD_DERX } from '../styleLibrary/balladDerx'
import { hoCuaDieu } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { resolveStyleForSection } from '../sectionStyles'
import { autoFillSkip } from '../../fillSoloGenerator/soloGenerator'

// MIDI đo từ `PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl` trên cửa sổ k = [ô XML k phách 2,
// ô k+1 phách 2), xem Reference/CA-PHAO-BALLAD-DE-EM.md. Hợp âm và độ dài đúng như sheet.
const VERSE = 'ca-phao-ballad-de-em-roi-xa', CHORUS = 'ca-phao-ballad-de-em-roi-xa-chorus'
const SHEET = { [VERSE]: ['Bbmaj7 C Dm7', [1.75, 2.25, 4]], [CHORUS]: ['Bb C A Dm7', [2, 2, 1.75, 2.25]] } as const
const render = (id: keyof typeof SHEET) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(SHEET[id][0]).chords), getStyle(id)!, { beatsEach: [...SHEET[id][1]] })
const onsets = (id: keyof typeof SHEET, hand: 'left' | 'right') => [...new Map(render(id)
  .filter(e => e.hand === hand).map(e => [+e.startBeat.toFixed(3), e])).values()]
  .map(e => [+e.startBeat.toFixed(3), [...new Set(render(id).filter(x => x.hand === hand && Math.abs(x.startBeat - e.startBeat) < 1e-6)
    .flatMap(x => x.notes))].sort((a, b) => a - b)])

describe('Ballad Để em — điệp mốc DERX, phiên theo khung người dùng', () => {
  it('điệp giữ mốc gõ DERX; phiên theo khung người dùng: 1Bùm 2chát 3bùm 4chát 5bùm 6chát 7bùm 8bum 9chát(×3) 10bum → chạy', () => {
    const beats = (hits: readonly { beat: number }[]) => [...new Set(hits.map(h => +h.beat.toFixed(4)))].sort((a, b) => a - b)
    for (const hand of ['left', 'right'] as const)
      expect(beats(getStyle(CHORUS)!.cell![hand]), hand).toEqual(beats(BALLAD_DERX[1].cell![hand]))
    // Khung người dùng 10 tiếng, tiếng 9 là 3 cú chát liền → 12 cú + câu chạy 7 nốt.
    const verse = getStyle(VERSE)!.cell!
    const run = [6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75]
    expect(beats([...verse.left, ...verse.right])).toEqual([0, 1, 1.75, 2.25, 2.5, 3, 4, 4.5, 5, 5.25, 5.75, 6, ...run])
    expect(beats(verse.left)).toEqual([0, 1.75, 2.5, 4, 4.5, 6, ...run])  // Bùm 1 · bùm 3 · 5 · 7 · bum 8 · 10 · câu chạy
    expect(beats(verse.right)).toEqual([0, 1, 1.75, 2.25, 3, 5, 5.25, 5.75]) // chát 2 · 4 · 6 · 9 (3 cú)
    // 4 chát giật nảy: ngắn và nhấn hơn các chát khác, rồi bùm 5 vào ngay sau ¼ phách.
    const chat4 = verse.right.find(h => h.beat === 2.25)!
    expect(chat4.durationBeats).toBeLessThanOrEqual(.25)
    expect(chat4.velocityScale!).toBeGreaterThan(.65)
    expect(getStyle(VERSE)!.autoFills).toBe(false)
  })

  it('không móc kép nào dưới hai nốt vang trên vòng của sheet — hết chỗ đứt của DERX', () => {
    for (const id of [VERSE, CHORUS] as const) {
      const events = render(id)
      for (let s = 0; s < 32; s += 1) {
        const t = s / 4 + .01
        const sounding = events.filter(e => e.startBeat <= t && t < e.startBeat + e.durationBeats).flatMap(e => e.notes)
        expect(sounding.length, `${id} phách ${s / 4}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('cao độ phiên trên vòng sheet: tay trái ô 1 = cửa sổ 4, ô 2 = cửa sổ 5 + bum D2, kèm câu chạy', () => {
    expect(onsets(VERSE, 'right')).toEqual([
      [0, [62, 65]], [1, [65, 70]], [1.75, [64, 72]], [2.25, [67, 72]], [3, [67, 72]],
      [5, [65, 72]], [5.25, [65, 72]], [5.75, [65, 72]]])
    expect(onsets(VERSE, 'left')).toEqual([[0, [46, 53, 57]], [1.75, [48, 55]], [2.5, [55]],
      [4, [48, 50, 57]], [4.5, [38]], [6, [50]],
      [6.25, [45]], [6.5, [50]], [6.75, [52]], [7, [53]], [7.25, [52]], [7.5, [50]], [7.75, [48]]])
    const f4 = render(VERSE).find(e => e.hand === 'right' && e.startBeat === 5.75 && e.notes.includes(65))!
    expect(f4.startBeat + f4.durationBeats).toBe(8)
  })

  it('cao độ điệp khớp sheet cửa sổ 24–25 (bỏ nốt trên 74)', () => {
    expect(onsets(CHORUS, 'right')).toEqual([
      [0, [65, 74]], [.75, [65, 74]], [1.333, [65, 70]], [2, [64, 72]],
      [2.75, [60]], [3, [62, 67]], [3.25, [64]], [3.5, [60]],
      [4, [69, 73]], [4.5, [69]], [4.75, [69]], [5, [64]], [5.25, [73]], [5.75, [65, 69]], [7.25, [60]]])
  })

  it('hai tay không trùng phím, tay trái không quá 59', () => {
    for (const [id, chords] of [[VERSE, 'Bb Dm7 C F'], [CHORUS, 'Bb C A7 Dm7'], [CHORUS, 'B E7 F#m G']] as const) {
      const events = renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(id)!, { beatsPerChord: 4 })
      expect(Math.max(...events.filter(e => e.hand === 'left').flatMap(e => e.notes)), id).toBeLessThanOrEqual(59)
      for (const l of events.filter(e => e.hand === 'left'))
        for (const r of events.filter(e => e.hand === 'right' && Math.abs(e.startBeat - l.startBeat) < 1e-6))
          expect(l.notes.filter(n => r.notes.includes(n)), `${id} ${l.startBeat}`).toEqual([])
    }
  })

  it('hợp âm ba không gõ trùng phím; hợp âm bảy vẫn giữ bậc 7 của sheet', () => {
    const left = (chords: string) => renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(VERSE)!, { beatsPerChord: 4 })
      .filter(e => e.hand === 'left' && (e.startBeat === 0 || e.startBeat === 4)).map(e => [...e.notes].sort((a, b) => a - b))
    expect(left('Bb Dm')).toEqual([[46, 53], [50, 57]])
    expect(left('Bbmaj7 Dm7')).toEqual([[46, 53, 57], [48, 50, 57]])
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
      for (const quality of ['', 'm', '7', 'maj7', 'm7'])
        for (const id of [VERSE, CHORUS])
          for (const e of renderPattern(voiceLeadTwoHands(parseChordInput(`${root}${quality} ${root}${quality}`).chords), getStyle(id)!))
            expect(new Set(e.notes).size, `${id} ${root}${quality} ${e.hand} ${e.startBeat}`).toBe(e.notes.length)
  })

  it('câu lót tự động tắt, ô người dùng chọn và chỗ chuyển đoạn vẫn chêm, ô đã tắt vẫn tắt', () => {
    expect([...autoFillSkip(6, new Set([4]), new Set([1, 4]))]).toEqual([0, 2, 3, 4, 5])
  })

  it('là một nút Ballad riêng, tự đổi sang điệp, không mang màu Codex', () => {
    expect(hoCuaDieu(VERSE)).toBe('ballad')
    expect(isBalladStyle(VERSE)).toBe(true)
    expect(resolveStyleForSection(VERSE, 'chorus')).toBe(CHORUS)
    expect(resolveStyleForSection(CHORUS, 'verse')).toBe(VERSE)
    expect(isCodexStyle(VERSE) || isCodexStyle(CHORUS)).toBe(false)
    expect(getStyle(VERSE)!.bpm).toBe(85)
  })
})
