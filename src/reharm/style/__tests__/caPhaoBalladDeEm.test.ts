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
  it('điệp giữ mốc gõ DERX; phiên: Bùm chát bùm → Chát-bùm bum chát bùm chát bùm bum | bùm–bum chát bùm (chát×3) → câu chạy', () => {
    const beats = (hits: readonly { beat: number }[]) => [...new Set(hits.map(h => +h.beat.toFixed(4)))].sort((a, b) => a - b)
    for (const hand of ['left', 'right'] as const)
      expect(beats(getStyle(CHORUS)!.cell![hand]), hand).toEqual(beats(BALLAD_DERX[1].cell![hand]))
    const verse = getStyle(VERSE)!.cell!
    const run1 = [2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75], run2 = run1.map(b => b + 4)
    expect(beats([...verse.left, ...verse.right])).toEqual([0, 1, 1.75, ...run1, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.75, ...run2])
    // Câu chạy một theo khung "Chát-bùm bum chát bùm chát bùm bum" (cách 1: Chát-bùm cùng một cú, hai tay).
    const at = (hits: readonly { beat: number }[], b: number) => hits.some(h => h.beat === b)
    expect(run1.map(b => (at(verse.left, b) ? 'T' : '') + (at(verse.right, b) ? 'P' : ''))).toEqual(['TP', 'T', 'P', 'TP', 'P', 'TP', 'T'])
    // Câu chạy một: chát = hai nốt hợp âm đổi đỉnh theo sheet; bùm = giai điệu + bass; bum = MỘT nốt walking bass.
    for (const b of [2.25, 2.75, 3.25]) expect(verse.right.find(h => h.beat === b)!.tones!.length, `chát ${b}`).toBe(2)
    for (const b of [2.5, 3.75]) expect(verse.left.find(h => h.beat === b)!.tones!.length, `bum ${b}`).toBe(1)
    // Câu chạy ô 2 tay trái một mình (cửa sổ 5).
    expect(run2.every(b => at(verse.left, b) && !at(verse.right, b))).toBe(true)
    // Bùm = bass + hợp âm tay phải; bum = chỉ bass (dẫn); chát = chỉ tay phải.
    for (const b of [0, 1.75, 4, 4.75]) expect([at(verse.left, b), at(verse.right, b)], `bùm ${b}`).toEqual([true, true])
    expect([at(verse.left, 4.25), at(verse.right, 4.25)], 'bum').toEqual([true, false])
    for (const b of [1, 4.5, 5, 5.25, 5.75]) expect([at(verse.left, b), at(verse.right, b)], `chát ${b}`).toEqual([false, true])
    for (const h of verse.right) expect(h.velocityScale!, `phải ${h.beat}`).toBeGreaterThanOrEqual(.7)
    expect(getStyle(VERSE)!.autoFills).toBe(false)
  })

  it('không móc kép nào dưới hai nốt vang trên vòng của sheet — hết chỗ đứt của DERX', () => {
    for (const id of [VERSE, CHORUS] as const) {
      const events = render(id)
      for (let s = 0; s < 32; s += 1) {
        const t = s / 4 + .01
        const sounding = events.filter(e => e.startBeat <= t && t < e.startBeat + e.durationBeats).flatMap(e => e.notes)
        // Hai tiếng bum (walking bass) của câu chạy một vang MỘT MÌNH: hợp âm đè lên thì bum chìm (bản 17).
        const alone = id === VERSE && [2.5, 3.75].includes(s / 4)
        expect(sounding.length, `${id} phách ${s / 4}`).toBeGreaterThanOrEqual(alone ? 1 : 2)
      }
    }
  })

  it('cao độ phiên trên vòng sheet: câu chạy một Chát-bùm bum chát bùm chát bùm bum; ô 2 D3 E3 F3 rồi câu chạy từ A2', () => {
    expect(onsets(VERSE, 'right')).toEqual([
      // Câu chạy một, tay phải: chát E4+G4 · G4+C5 · C4+E4 (đỉnh G4 → C5 → E4 như sheet A4 → C5 → E4); bùm C4 · G4.
      [0, [62, 65]], [1, [65, 70]], [1.75, [64, 72]], [2.25, [64, 67]], [2.75, [67, 72]], [3, [60]],
      [3.25, [60, 64]], [3.5, [67]],
      [4, [65, 69]], [4.5, [65, 72]], [4.75, [65, 69]], [5, [65, 72]], [5.25, [65, 72]], [5.75, [65, 72]]])
    // Giai điệu thấp G3 → C3 → D3 → E3 → F3 rồi câu chạy A2…: không nốt nào xuống vùng C2–G2 đục.
    // Tay trái câu chạy một (walking bass): C3 · bum F3 → G3 · G3 · bum E3 → D3 đầu ô 2.
    expect(onsets(VERSE, 'left')).toEqual([[0, [46, 53, 57]], [1.75, [48, 55]], [2.25, [48]], [2.5, [53]], [3, [55]], [3.5, [55]], [3.75, [52]],
      [4, [50]], [4.25, [52]], [4.75, [53]],
      [6.25, [45]], [6.5, [50]], [6.75, [52]], [7, [53]], [7.25, [52]], [7.5, [50]], [7.75, [48]]])
    const f4 = render(VERSE).find(e => e.hand === 'right' && e.startBeat === 5.75 && e.notes.includes(65))!
    expect(f4.startBeat + f4.durationBeats).toBe(8)
  })

  it('bum là walking bass: một nốt tay trái, bước liền bậc vào bass tiếng kế, đi tiếp chiều bè trầm, không tay phải', () => {
    const hand = (h: 'left' | 'right') => (chords: string, at: number) => [...new Set(renderPattern(
      voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(VERSE)!, { beatsPerChord: 4 })
      .filter(e => e.hand === h && Math.abs(e.startBeat - at) < 1e-6).flatMap(e => e.notes))].sort((a, b) => a - b)
    const lh = hand('left'), rh = hand('right')
    // Bài người dùng (Fadd2 → G9): F3 → D3 → C3 (đi xuống) · C3 → F3 → G3 (đi lên). Cũ (bản 25): Bb2+Bb3 + Bb4, F2+F3 + A4.
    expect([lh('Fadd2 G9', 2.5), lh('Fadd2 G9', 3.75)]).toEqual([[50], [53]])
    // Suy đoán theo gam + chiều bè: C → Dm dẫn E (từ trên), G → C dẫn B (D trùng nốt trước nên đổi phía), C → F dẫn E,
    // A → Dm dẫn C#, C → G dẫn F.
    for (const [chords, pc] of [['C Dm7', 4], ['G C', 11], ['C F', 4], ['A Dm', 1], ['C G', 5]] as const)
      expect(lh(chords, 3.75).map(n => n % 12), chords).toEqual([pc])
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
      for (const chords of [`${root} ${root}`, `${root}m F`, `${root}7 Am`, `${root}maj7 G`, `${root}add9 D9sus4`, `${root}m Bm`])
        for (const [bum, prev, next] of [[2.5, 2.25, 3], [3.75, 3.5, 4]]) {
          const [n, ...more] = lh(chords, bum), target = Math.min(...lh(chords, next)), truoc = Math.max(...lh(chords, prev))
          const at = `${chords} phách ${bum}: ${truoc} → ${n} → ${target}`
          expect(more, at).toEqual([])
          expect(rh(chords, bum), at).toEqual([])
          expect(Math.abs(target - n!), at).toBeGreaterThanOrEqual(1)
          expect(Math.abs(target - n!), at).toBeLessThanOrEqual(2)
          expect(n, at).not.toBe(truoc)
        }
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
    const left = (chords: string) => [0, 4].map(at => renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords),
      getStyle(VERSE)!, { beatsPerChord: 4 }).filter(e => e.hand === 'left' && e.startBeat === at)
      .flatMap(e => e.notes).sort((a, b) => a - b))
    expect(left('Bb Dm')).toEqual([[46, 53], [50]])            // ô 2 phách 1: bùm 8 là nốt đơn D3 của giai điệu thấp
    expect(left('Bbmaj7 Dm7')).toEqual([[46, 53, 57], [50]])
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
      for (const quality of ['', 'm', '7', 'maj7', 'm7', 'sus4', '9sus4'])
        for (const id of [VERSE, CHORUS])
          for (const e of renderPattern(voiceLeadTwoHands(parseChordInput(`${root}${quality} ${root}${quality}`).chords), getStyle(id)!))
            expect(new Set(e.notes).size, `${id} ${root}${quality} ${e.hand} ${e.startBeat}`).toBe(e.notes.length)
  })

  it('hợp âm treo (D9sus4 — màu át 9sus4 của người dùng): chát ô 2 đủ hai nốt, lấy nốt treo thay bậc 3', () => {
    const events = renderPattern(voiceLeadTwoHands(parseChordInput('G D9sus4').chords), getStyle(VERSE)!, { beatsPerChord: 4 })
    for (const beat of [5, 5.25, 5.75]) {
      const notes = [...new Set(events.filter(e => e.hand === 'right' && e.startBeat === beat).flatMap(e => e.notes))]
      expect(notes.length, `phách ${beat}`).toBe(2)
      expect(notes.some(n => n % 12 === 7), `phách ${beat} có G (nốt treo)`).toBe(true)
    }
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
