import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle, isCodexStyle } from '../styleLibrary'
import { hoCuaDieu } from '../hoDieu'
import { isBalladStyle } from '../balladFamily'
import { resolveStyleForSection } from '../sectionStyles'
import { autoFillSkip } from '../../fillSoloGenerator/soloGenerator'
import { buildPhraseSection } from '../phraseSection'
import { texture, type Hit } from './cpSoloTexture.probe'

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
    // Mốc gõ điệp của Ballad DERX (cửa sổ 24–25) — chép số từ `balladDerx.ts` trước khi điệu ấy bị xoá 30/9/2026.
    const DERX_DIEP = {
      left: [0, 0.5, 1, 2, 2.5, 3, 4, 4.5, 5.75, 6, 7],
      right: [0, 0.75, 1.3333, 2, 2.75, 3, 3.25, 3.5, 4, 4.5, 4.75, 5, 5.25, 5.75, 7.25],
    }
    for (const hand of ['left', 'right'] as const)
      expect(beats(getStyle(CHORUS)!.cell![hand]), hand).toEqual(DERX_DIEP[hand])
    const verse = getStyle(VERSE)!.cell!
    const run1 = [2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75], lap = [5, 5.25, 5.5, 5.75, 6]
    const run2 = [6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75]
    expect(beats([...verse.left, ...verse.right])).toEqual([0, 1, 1.75, ...run1, 4, 4.25, 4.5, 4.75, ...lap, ...run2])
    const at = (hits: readonly { beat: number }[], b: number) => hits.some(h => h.beat === b)
    const vai = (bs: number[]) => bs.map(b => (at(verse.left, b) ? 'T' : '') + (at(verse.right, b) ? 'P' : ''))
    // Câu chạy một ĐAN TAY như sheet (cửa sổ 4 · 6 · 8 · 32 · 34 · 36): phải · trái · phải · HAI TAY · phải · trái · phải —
    // hai tay cùng gõ chỉ ở phách 4 (sheet: 24/30 ô phiên). Cũ (bản 32–34): bốn cú hai tay trong 1¾ phách.
    expect(vai(run1)).toEqual(['P', 'T', 'P', 'TP', 'P', 'T', 'P'])
    // Lấp chỗ ba chát đã bỏ ở ô 2: phải · trái · phải · trái · phải (đan tay như sheet ô thật 9 · 37).
    expect(vai(lap)).toEqual(['P', 'T', 'P', 'T', 'P'])
    expect(verse.right.find(h => h.beat === 1.75)!.durationBeats, 'bùm 3 ngân ½ như cũ').toBe(.5)
    // Chát: hai nốt ở 3¼ · 3¾ · ô 2 phách 2 · 3; MỘT nốt giai điệu ở 4¼ · 4¾ · ô 2 phách 2& (sheet 4¼ E4, 4¾ C4/F4).
    for (const b of [2.25, 2.75, 5, 6]) expect(verse.right.find(h => h.beat === b)!.tones!.length, `chát ${b}`).toBe(2)
    for (const b of [3, 3.25, 3.75, 5.5]) expect(verse.right.find(h => h.beat === b)!.tones!.length, `một nốt ${b}`).toBe(1)
    for (const b of [2.5, 3.5, 5.25, 5.75]) expect(verse.left.find(h => h.beat === b)!.tones!.length, `bum ${b}`).toBe(1)
    // Câu chạy ô 2 tay trái một mình (cửa sổ 5).
    expect(run2.every(b => at(verse.left, b) && !at(verse.right, b))).toBe(true)
    // Bùm = bass + hợp âm tay phải; bum = chỉ bass (dẫn); chát = chỉ tay phải.
    for (const b of [0, 1.75, 4, 4.75]) expect([at(verse.left, b), at(verse.right, b)], `bùm ${b}`).toEqual([true, true])
    expect([at(verse.left, 4.25), at(verse.right, 4.25)], 'bum').toEqual([true, false])
    for (const b of [1, 4.5]) expect([at(verse.left, b), at(verse.right, b)], `chát ${b}`).toEqual([false, true])
    for (const h of verse.right) expect(h.velocityScale!, `phải ${h.beat}`).toBeGreaterThanOrEqual(.7)
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

  it('cao độ phiên trên vòng sheet: câu chạy một Chát-bùm bum chát bùm chát bùm bum; ô 2 D3 E3 F3 rồi câu chạy từ A2', () => {
    expect(onsets(VERSE, 'right')).toEqual([
      // Câu chạy một, tay phải (sheet cửa sổ 8): chát E4+G4 · chát G4+C5 · C4 (cùng bass) · E4 · C4.
      [0, [62, 65]], [1, [65, 70]], [1.75, [64, 72]], [2.25, [64, 67]], [2.75, [67, 72]], [3, [60]], [3.25, [64]], [3.75, [60]],
      // Ô 2: bùm · chát · bùm, rồi phần lấp: chát A4+D5 · F4 · chát F4+C5 ngân suốt câu chạy.
      [4, [65, 69]], [4.5, [65, 72]], [4.75, [65, 69]], [5, [69, 74]], [5.5, [65]], [6, [65, 72]]])
    // Tay trái: walking bass từ bùm 3 — A3 · G3 · E3 → D3 đầu ô 2; ô 2 D3 E3 F3, phần lấp D3 Bb2 → câu chạy từ A2.
    expect(onsets(VERSE, 'left')).toEqual([[0, [46, 53, 57]], [1.75, [48, 55]], [2.5, [57]], [3, [55]], [3.5, [52]],
      [4, [50]], [4.25, [52]], [4.75, [53]], [5.25, [50]], [5.75, [46]],
      [6.25, [45]], [6.5, [50]], [6.75, [52]], [7, [53]], [7.25, [52]], [7.5, [50]], [7.75, [48]]])
    const f4 = render(VERSE).find(e => e.hand === 'right' && e.startBeat === 6 && e.notes.includes(65))!
    expect(f4.startBeat + f4.durationBeats).toBe(8)
  })

  it('walking bass: bum 3& · bùm 4 · bum 4& và phần lấp ô 2 đi từ tiếng trước tới đích, bước cuối liền bậc, không chói tay phải', () => {
    const hand = (h: 'left' | 'right') => (chords: string, at: number) => [...new Set(renderPattern(
      voiceLeadTwoHands(parseChordInput(chords).chords), getStyle(VERSE)!, { beatsPerChord: 4 })
      .filter(e => e.hand === h && Math.abs(e.startBeat - at) < 1e-6).flatMap(e => e.notes))].sort((a, b) => a - b)
    const lh = hand('left'), rh = hand('right')
    const line = (chords: string) => [2.5, 3, 3.5, 4].map(b => lh(chords, b))
    // Bài người dùng: Fadd2 → G9 G3 A3 F3 → G3 (A3 → F3 nhảy quãng 3: đi liền bậc thì qua E3/F#3, chói F4 tay phải);
    // Am(add9) → Fadd2 G3 F3 E3 → F3.
    expect(line('Fadd2 G9')).toEqual([[55], [57], [53], [55]])
    expect(line('Am(add9) Fadd2')).toEqual([[55], [53], [52], [53]])
    expect(line('Bbadd9 D9sus4')).toEqual([[50], [46], [48], [50]])
    for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
      for (const chords of [`${root} ${root}`, `${root}m F`, `${root}7 Am`, `${root}maj7 G`, `${root}add9 D9sus4`, `${root}m Bm`])
        for (const [truoc, dong] of [[1.75, [2.5, 3, 3.5, 4]], [4.75, [5.25, 5.75, 6.25]]] as const) {
          const l = dong.map(b => lh(chords, b)), dau = lh(chords, truoc), at = `${chords}: ${dau} | ${l.join(' → ')}`
          for (const notes of l) expect(notes.length, at).toBe(1)
          const buoc = [Math.min(...dau.map(d => Math.abs(d - l[0]![0]!))), ...l.slice(1).map((n, i) => Math.abs(n[0]! - l[i]![0]!))]
          for (const s of buoc) expect(s >= 1 && s <= 4, at).toBe(true)
          expect(buoc.at(-1)! <= 2, `${at}: bước cuối liền bậc`).toBe(true)
          for (const b of dong.slice(0, -1)) if (b !== 3) expect(rh(chords, b), `${at} · bum ${b}`).toEqual([])
          for (const r of rh(chords, 3))
            expect([1, 6, 11], `${at} · bùm 4 tay phải ${r}`).not.toContain(((r - lh(chords, 3)[0]!) % 12 + 12) % 12)
        }
  })

  it('solo CP (màu Cà Pháo, Soạn câu mới): tay trái dưới câu solo theo soloCell — thưa, không gõ lặp; có dùng vật liệu Để Em Rời Xa', () => {
    let deEm = 0
    for (const [tonic, scale] of [[9, 'minor'], [2, 'minor'], [0, 'major']] as const)
      for (const kind of ['intro', 'interlude', 'outro'] as const)
        for (let take = 0; take < 6; take++) {
          const m = buildPhraseSection({ kind, key: { tonic, scale }, style: getStyle(VERSE)!, caPhaoCompose: true, caPhaoFull: false,
            thay: 'ca-phao', beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [], take })!
          expect(m.unavailableReason, `${tonic}${scale} ${kind} ${take}`).toBeUndefined()
          if ((m.compositionSources ?? []).some(t => String(t.melody).includes('De Em'))) deEm += 1
          // Cũ (dùng ô đệm hát làm nền): ô 2 có 12 tiếng tay trái, cao độ nắn về gốc → D3 D3 F3 D3 D3 A2 D3 …
          for (let bar = 0; bar < m.lengthBeats; bar += 4) {
            const left = new Set(m.events.filter(e => e.hand === 'left' && e.startBeat >= bar && e.startBeat < bar + 4).map(e => e.startBeat))
            expect(left.size, `${tonic}${scale} ${kind} take ${take} ô ${bar / 4 + 1}`).toBeLessThanOrEqual(8)
          }
        }
    expect(deEm, 'lượt có vật liệu Để Em Rời Xa (dữ liệu đã nắn vạch nhịp)').toBeGreaterThan(0)
  })

  it('solo CP: tiết tấu mọi khung từ solo Để Em Rời Xa; chất liệu quanh mức bài gốc — ít dặm, có câu chạy, nhiều phách giật', () => {
    // Mức bài gốc (solo Để Em Rời Xa, vạch thật; `cpSoloTexture.probe.ts`): dặm dạo 3% · giang 10% · kết 28%; nốt chạy dạo 22% ·
    // giang 34% · kết 0%; phách giật giang 82% · kết 63%. Cũ: bộ soạn bốc cử chỉ bài khác kèm tiết tấu bài ấy (dặm 38 · 21 · 53%,
    // quãng tám 27 · 12 · 31%) — người dùng: "quá nhiều chỗ dặm", "rời rạc và ko khớp với tiết tấu điệu".
    const own = { intro: { dam: .03, chay: .22 }, interlude: { dam: .10, chay: .34 }, outro: { dam: .28, chay: 0 } }
    for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const hits: Hit[] = []; let beats = 0
      for (let take = 0; take < 12; take++) {
        const m = buildPhraseSection({ kind, key: { tonic: 9, scale: 'minor' }, style: getStyle(VERSE)!, caPhaoCompose: true,
          caPhaoFull: take % 2 === 1, thay: 'ca-phao', beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [], take })!
        for (const t of m.compositionSources ?? []) {
          expect(String(t.rhythm), `${kind} take ${take} ô ${t.bar}: tiết tấu bài gốc`).toMatch(/^De Em Roi Xa/)
          if (kind !== 'outro') expect(String(t.melody), `${kind} take ${take}`).not.toMatch(/:outro:/)
        }
        const right = m.events.filter(e => e.hand === 'right')
        for (const at of [...new Set(right.map(e => e.startBeat))].sort((a, b) => a - b)) {
          const ev = right.filter(e => e.startBeat === at)
          hits.push({ at: at + beats, tones: [...new Set(ev.flatMap(e => e.notes))], gate: Math.max(...ev.map(e => e.durationBeats)), left: false })
        }
        beats += m.lengthBeats
      }
      const t = texture(hits, beats)
      expect(t.dam, `${kind} dặm`).toBeLessThanOrEqual(own[kind].dam + .1)
      expect(t.octave, `${kind} quãng tám`).toBeLessThanOrEqual(.1)
      expect(t.runNotes, `${kind} nốt chạy`).toBeGreaterThanOrEqual(own[kind].chay - .12)
      expect(t.dyad36, `${kind} bè quãng 3/6 (bè quãng 4 của bài giữ nguyên, không đổi thành quãng 3)`).toBeLessThanOrEqual(.3)
    }
  })

  it('ô tick thử lượt 4: dẫn vào hát / đóng kết bằng câu đóng của bài; nốt màu trong gam, không nốt tránh; tắt ô thì như cũ', () => {
    const opening = parseChordInput('Fadd2').chords[0]
    const A_MINOR = new Set([9, 11, 0, 2, 4, 5, 7])
    let colors = 0
    for (const kind of ['intro', 'interlude', 'outro'] as const) for (let take = 0; take < 6; take++) {
      const base = { kind, key: { tonic: 9 as const, scale: 'minor' as const }, style: getStyle(VERSE)!, caPhaoCompose: true,
        caPhaoFull: take % 2 === 1, thay: 'ca-phao' as const, beatsPerChord: 4, dropRoot: true, opening, solo: () => [], take }
      const tail = (m: NonNullable<ReturnType<typeof buildPhraseSection>>) => {
        let at = 0
        return m.chords.filter((_, i) => { const from = at; at += m.beatsEach[i]; return from >= m.lengthBeats - 8 })
      }
      // Tắt ô: cú dẫn Codex (ii–V của hợp âm hát kế / V7–i) giữ nguyên.
      expect(tail(buildPhraseSection(base)!)[0], `${kind} take ${take} mặc định`).toMatch(kind === 'outro' ? /^E7/ : /^Gm7$/)
      const m = buildPhraseSection({ ...base, cpBalladThu: true })!
      expect(tail(m), `${kind} take ${take}`).toEqual(['F', 'G', 'Am7'])
      const starts = m.beatsEach.map((_, i) => m.beatsEach.slice(0, i).reduce((a, b) => a + b, 0))
      for (const t of (m.compositionTechniques ?? []).filter(t => t.kind === 'color-tone')) {
        colors++
        const top = Math.max(...m.events.filter(e => e.hand === 'right' && !e.grace &&
          e.startBeat >= t.startBeat - 1e-6 && e.startBeat < t.startBeat + .2).flatMap(e => e.notes))
        const chord = parseChordInput(m.chords[starts.findLastIndex(at => at <= t.startBeat + 1e-6)]).chords[0]
        const tones = chord.quality.intervals.map(n => (chord.root + n) % 12)
        expect(A_MINOR.has(top % 12), `${kind} take ${take} @${t.startBeat}: trong gam`).toBe(true)
        expect(tones.includes(top % 12) || tones.includes((top + 11) % 12), `${kind} take ${take} @${t.startBeat}: màu, không nốt tránh`).toBe(false)
      }
    }
    expect(colors).toBeGreaterThan(30)
  })

  it('mô phỏng câu solo full khoá đúng Để Em Rời Xa, đúng vạch nhịp thật (không lấy Chưa Bao Giờ)', () => {
    for (const id of [VERSE, CHORUS])
      for (const [kind, length] of [['intro', 16], ['interlude', 16], ['outro', 38]] as const) {
        const m = buildPhraseSection({ kind, key: { tonic: 9, scale: 'minor' }, style: getStyle(id)!, caPhaoCompose: true,
          caPhaoSimulate: true, caPhaoFull: true, thay: 'ca-phao', beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [] })!
        expect(m.unavailableReason, `${id} ${kind}`).toBeUndefined()
        expect(m.sourcePhrase?.song, `${id} ${kind}`).toBe('Để Em Rời Xa')
        expect(m.lengthBeats, `${id} ${kind}`).toBe(length)
        // Hợp âm dựng từ bass thật: bVI → bVII (phách 3 hoặc 2¾) → i — không phải bản in lệch/đảo.
        if (kind !== 'outro') expect(m.chords.slice(0, 3), `${id} ${kind}`).toEqual(['F', 'G', 'Am7'])
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

  it('hợp âm treo (D9sus4 — màu át 9sus4 của người dùng): tiếng tay phải ô 2 đủ hai nốt, lấy nốt treo thay bậc 3', () => {
    const events = renderPattern(voiceLeadTwoHands(parseChordInput('G D9sus4').chords), getStyle(VERSE)!, { beatsPerChord: 4 })
    for (const beat of [4, 4.5, 4.75]) {
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
