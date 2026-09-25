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
    const run1 = [2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75], run2 = [6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75]
    expect(beats([...verse.left, ...verse.right])).toEqual([0, 1, 1.75, ...run1, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.75, ...run2])
    // Câu chạy một, cách 1: "Chát-bùm bum chát bùm chát bùm bum" — chát 4 + bùm 5 cùng một cú hai tay ở 3¼.
    const at = (hits: readonly { beat: number }[], b: number) => hits.some(h => h.beat === b)
    expect(run1.map(b => (at(verse.left, b) ? 'T' : '') + (at(verse.right, b) ? 'P' : '')))
      .toEqual(['TP', 'T', 'P', 'TP', 'P', 'TP', 'T'])
    expect(verse.right.find(h => h.beat === 1.75)!.durationBeats, 'bùm 3 ngân ½ như cũ').toBe(.5)
    // Chát 4 bình thường (.8, ¼ phách, đúng 3¼ — bản 30 lướt ⅛ trước 3¼ "lệch tiết tấu"); bùm 5 là tiếng chính: bass +
    // giai điệu tay phải lực .9.
    const cu = [...verse.left, ...verse.right].filter(h => h.beat === 2.25)
    expect(cu.map(h => [h.tones!.length, h.durationBeats, h.velocityScale]).sort()).toEqual([[1, .25, .9], [1, .25, .9], [2, .25, .8]])
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
      // Câu chạy một (cách 1), tay phải: chát 4 E4+G4 cùng bùm 5 C4 · chát G4+C5 · bùm C4 · chát C4+E4 · bùm G4.
      [0, [62, 65]], [1, [65, 70]], [1.75, [64, 72]], [2.25, [60, 64, 67]], [2.75, [67, 72]], [3, [60]],
      [3.25, [60, 64]], [3.5, [67]],
      [4, [65, 69]], [4.5, [65, 72]], [4.75, [65, 69]], [5, [65, 72]], [5.25, [65, 72]], [5.75, [65, 72]]])
    // Giai điệu thấp G3 → C3 → D3 → E3 → F3 rồi câu chạy A2…: không nốt nào xuống vùng C2–G2 đục.
    // Tay trái câu chạy một (walking bass từ C3 của bùm 5): D3 E3 F3 E3 → D3 đầu ô 2.
    expect(onsets(VERSE, 'left')).toEqual([[0, [46, 53, 57]], [1.75, [48, 55]], [2.25, [48]], [2.5, [50]], [3, [52]], [3.5, [53]], [3.75, [52]],
      [4, [50]], [4.25, [52]], [4.75, [53]],
      [6.25, [45]], [6.5, [50]], [6.75, [52]], [7, [53]], [7.25, [52]], [7.5, [50]], [7.75, [48]]])
    const f4 = render(VERSE).find(e => e.hand === 'right' && e.startBeat === 5.75 && e.notes.includes(65))!
    expect(f4.startBeat + f4.durationBeats).toBe(8)
  })

  it('3& → 4¾ là MỘT dòng walking bass tay trái từ bass bùm 5: từng bước một cung / nửa cung, bum không tay phải, bùm không chói', () => {
    const hand = (h: 'left' | 'right') => (chords: string, at: number) => [...new Set(renderPattern(
      voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(VERSE)!, { beatsPerChord: 4 })
      .filter(e => e.hand === h && Math.abs(e.startBeat - at) < 1e-6).flatMap(e => e.notes))].sort((a, b) => a - b)
    const lh = hand('left'), rh = hand('right')
    const line = (chords: string) => [2.25, 2.5, 3, 3.5, 3.75, 4].map(b => lh(chords, b))
    // Bài người dùng Fadd2 → G9: F3 → G3 A3 Bb3 A3 → G3.
    expect(line('Fadd2 G9')).toEqual([[53], [55], [57], [58], [57], [55]])
    // Gadd9 → D9sus4 đi xuống G3 F#3 E3 D3 C3 → D3.
    expect(line('Gadd9 D9sus4')).toEqual([[55], [54], [52], [50], [48], [50]])
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
      for (const chords of [`${root} ${root}`, `${root}m F`, `${root}7 Am`, `${root}maj7 G`, `${root}add9 D9sus4`, `${root}m Bm`]) {
        const l = line(chords), at = `${chords}: ${l.join(' → ')}`
        for (const notes of l) expect(notes.length, at).toBe(1)
        for (let i = 1; i < l.length; i += 1) {
          const step = Math.abs(l[i]![0]! - l[i - 1]![0]!)
          expect(step >= 1 && step <= 2, at).toBe(true)
        }
        expect([rh(chords, 2.5), rh(chords, 3.75)], at).toEqual([[], []])
        for (const b of [2.25, 3, 3.5]) for (const r of rh(chords, b))
          expect([1, 6, 11], `${at} · phách ${b} tay phải ${r}`).not.toContain(((r - lh(chords, b)[0]!) % 12 + 12) % 12)
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
