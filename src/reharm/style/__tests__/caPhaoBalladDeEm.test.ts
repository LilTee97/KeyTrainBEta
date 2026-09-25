import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle, isCodexStyle } from '../styleLibrary'
import { BALLAD_DERX } from '../styleLibrary/balladDerx'
import { hoCuaDieu } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { resolveStyleForSection } from '../sectionStyles'

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

describe('Ballad Để em — soạn lại trên mốc gõ DERX', () => {
  it('mốc gõ = DERX, cộng hai tiếng chát lấp khoảng trống phiên (phải phách 2, trái ô 2 phách 1&)', () => {
    const added = { [`${VERSE} right`]: [1], [`${VERSE} left`]: [4.5] } as Record<string, number[]>
    for (const [mine, derx] of [[VERSE, BALLAD_DERX[0]], [CHORUS, BALLAD_DERX[1]]] as const)
      for (const hand of ['left', 'right'] as const) {
        const beats = (hits: readonly { beat: number }[]) => [...new Set(hits.map(h => +h.beat.toFixed(4)))].sort((a, b) => a - b)
        expect(beats(getStyle(mine)!.cell![hand]), `${mine} ${hand}`)
          .toEqual([...beats(derx.cell![hand]), ...(added[`${mine} ${hand}`] ?? [])].sort((a, b) => a - b))
      }
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

  it('cao độ phiên khớp sheet cửa sổ 4–5: quãng đôi tay phải, câu chạy tay trái', () => {
    expect(onsets(VERSE, 'right')).toEqual([
      [0, [62, 65]], [1, [65, 70]], [1.75, [64, 72]], [2.25, [67, 72]], [2.75, [67, 72]],
      [5, [65, 72]], [5.25, [65, 72]], [5.75, [65, 72]]])
    expect(onsets(VERSE, 'left').find(([b]) => b === 4.5)).toEqual([4.5, [48, 50]])
    expect(onsets(VERSE, 'left').filter(([b]) => (b as number) >= 6.25).map(([, n]) => n))
      .toEqual([[45], [50], [52], [53], [52], [50], [48]])
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

  it('là một nút Ballad riêng, tự đổi sang điệp, không mang màu Codex', () => {
    expect(hoCuaDieu(VERSE)).toBe('ballad')
    expect(isBalladStyle(VERSE)).toBe(true)
    expect(resolveStyleForSection(VERSE, 'chorus')).toBe(CHORUS)
    expect(resolveStyleForSection(CHORUS, 'verse')).toBe(VERSE)
    expect(isCodexStyle(VERSE) || isCodexStyle(CHORUS)).toBe(false)
    expect(getStyle(VERSE)!.bpm).toBe(85)
  })
})
