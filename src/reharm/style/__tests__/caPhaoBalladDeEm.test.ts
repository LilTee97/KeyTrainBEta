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
  it('điệp giữ mốc gõ DERX; phiên theo khung người dùng: 1Bùm 2chát 3bùm 4chát-5bùm 6bum 7chát 8bùm-9bum 10chát 11bùm (chát×3) → chạy', () => {
    const beats = (hits: readonly { beat: number }[]) => [...new Set(hits.map(h => +h.beat.toFixed(4)))].sort((a, b) => a - b)
    for (const hand of ['left', 'right'] as const)
      expect(beats(getStyle(CHORUS)!.cell![hand]), hand).toEqual(beats(BALLAD_DERX[1].cell![hand]))
    // Khung người dùng: 11 tiếng + (chát chát chát) + câu chạy 7 nốt.
    const verse = getStyle(VERSE)!.cell!
    const run = [6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75]
    expect(beats([...verse.left, ...verse.right])).toEqual([0, 1, 1.75, 2.25, 2.5, 3, 3.25, 3.5, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.75, ...run])
    expect(beats(verse.left)).toEqual([0, 1.75, 2.5, 4, 4.25, 4.75, ...run])   // Bùm 1 · bùm 3 · 5 · bùm 8 · bum 9 · bùm 11
    expect(beats(verse.right)).toEqual([0, 1, 1.75, 2.25, 2.5, 3, 3.25, 3.5, 4, 4.5, 4.75, 5, 5.25, 5.75])
    // Bùm = bass dày + hợp âm tay phải; bum = chỉ bass dày (dẫn); chát = chỉ tay phải.
    // Người dùng: "Bùm ko phải là chỉ đánh bass" · "chỗ Bum đừng đánh hợp âm kèm theo nữa".
    const at = (hits: readonly { beat: number }[], b: number) => hits.some(h => h.beat === b)
    for (const b of [0, 1.75, 2.5, 4, 4.75]) expect([at(verse.left, b), at(verse.right, b)], `bùm ${b}`).toEqual([true, true])
    expect([at(verse.left, 4.25), at(verse.right, 4.25)], 'bum 9').toEqual([true, false])
    // Bum 6 = nốt dẫn đơn từ 5 qua 7, cùng tầm bè giữa (người dùng: "tiếng Bum 6 bị đánh chìm xuống dưới").
    const bum6 = verse.right.filter(h => h.beat === 3)
    expect([bum6.length, bum6[0].tones!.length, bum6[0].velocityScale]).toEqual([1, 1, .9])
    // Bùm 5 · bum 6 · bùm 8 · bum 9 · bùm 11 là giai điệu thấp nốt đơn cùng tầm câu chạy (xem test cao độ).
    // Tiếng chính nào cũng rõ: lực tay phải ≥ .7 ở mọi cú chính.
    for (const h of verse.right) expect(h.velocityScale!, `phải ${h.beat}`).toBeGreaterThanOrEqual(.7)
    for (const b of [1, 2.25, 3.5, 4.5, 5, 5.25, 5.75]) expect([at(verse.left, b), at(verse.right, b)], `chát ${b}`).toEqual([false, true])
    // 4 chát → 5 bùm giật: chát rất ngắn và nhấn, bùm nhấn ¼ phách sau.
    const chat4 = verse.right.find(h => h.beat === 2.25)!
    expect(chat4.durationBeats).toBeLessThanOrEqual(.15)
    expect(chat4.velocityScale!).toBeGreaterThanOrEqual(.9)
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

  it('cao độ phiên trên vòng sheet: 5→6→7 bè giữa E4 F4 G4; giai điệu thấp ô 2 D3 E3 F3 rồi câu chạy từ A2', () => {
    expect(onsets(VERSE, 'right')).toEqual([
      // 5 → 6 → 7 bè giữa đi liền bậc E4 (64) → F4 (65) → G4 (67).
      [0, [62, 65]], [1, [65, 70]], [1.75, [64, 72]], [2.25, [67, 72]], [2.5, [64, 72]], [3, [65]], [3.25, [66]], [3.5, [67, 72]],
      [4, [65, 69]], [4.5, [65, 72]], [4.75, [65, 69]], [5, [65, 72]], [5.25, [65, 72]], [5.75, [65, 72]]])
    // Giai điệu thấp G3 → C3 → D3 → E3 → F3 rồi câu chạy A2…: không nốt nào xuống vùng C2–G2 đục.
    expect(onsets(VERSE, 'left')).toEqual([[0, [46, 53, 57]], [1.75, [48, 55]], [2.5, [55]],
      [4, [50]], [4.25, [52]], [4.75, [53]],
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

  it('tiếng 6 và tiếng mới dẫn liền bậc vào chát 7: một cung rồi nửa cung dưới một nốt của chát 7, ở mọi hợp âm', () => {
    for (const chord of ['C', 'G', 'Em', 'Am', 'D', 'F', 'Bb', 'B', 'Gadd2', 'Em9', 'Cmaj7', 'Am7']) {
      const rh = renderPattern(voiceLeadTwoHands(parseChordInput(`${chord} ${chord}`).chords), getStyle(VERSE)!, { beatsPerChord: 4 })
        .filter(e => e.hand === 'right')
      const six = rh.filter(e => e.startBeat === 3).flatMap(e => e.notes)
      const lead = rh.filter(e => e.startBeat === 3.25).flatMap(e => e.notes)
      const seven = rh.filter(e => e.startBeat === 3.5).flatMap(e => e.notes)
      expect([six.length, lead.length], chord).toEqual([1, 1])
      expect(lead[0] - six[0], chord).toBe(1)
      expect(seven, chord).toContain(lead[0] + 1)
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
