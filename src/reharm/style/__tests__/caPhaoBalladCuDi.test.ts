import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'
import { kieuTrongHo } from '../hoDieu'
import { fixHandByRegister } from '../songStructure'
import { CU_DI_MOT_LUOT_CELL, CU_DI_NOI_CELL, CU_DI_SOLO_LEFT } from '../styleLibrary/caPhaoBalladSongs'
import { buildPhraseSection } from '../phraseSection'
import { planCpLicks } from '../../licky/cpLick'
import { texture, type Hit } from './cpSoloTexture.probe'
import type { TimelineEvent } from '../types'
import { chonHopAmLuot, cuDiFillTheoThu, danFillVaoSong, fillCuDi, KIEU_FILL, soanKieu } from '../cuDiFill'
import { generateFillLine, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'

/*
  Nút "Ballad cứ đi" — đệm rải hai tay của Cà Pháo, Anh Cứ Đi Đi từ ô 9 (số đo: `scripts/audit_cp_acdd_rai.py`).
*/
const T = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const style = getStyle('ca-phao-ballad-cu-di')!
const render = (vong: string, beatsPerChord = 4) => renderPattern(voiceLeadTwoHands(parseChordInput(vong).chords), style, { beatsPerChord })
// Chuỗi rải nửa đầu ô — bỏ hai tiếng nhấn tay phải (phách 1 · 2) nhân quãng tám / giai điệu nhô lên.
const nuaDau = (vong: string) => render(vong).filter(e => e.startBeat < 2 - 1e-6 && !(e.hand === 'right' && e.startBeat % 1 === 0))
  .sort((a, b) => a.startBeat - b.startBeat)

describe('Ballad cứ đi — rải hai tay (Cà Pháo, Anh Cứ Đi Đi ô 9)', () => {
  it('mặc định 30/9 (người dùng: "2 chỗ tôi chọn hãy đặt làm mặc định"): một lượt 8 tiếng mỗi hợp âm; solo · lick · run Cà Pháo; câu fill Cà Pháo', () => {
    expect(style.cell).toBe(CU_DI_MOT_LUOT_CELL)
    expect([style.soloCell, style.cpSoloOwnRhythm, style.cpSoloSheetTexture, style.cpDanSong]).toEqual([CU_DI_SOLO_LEFT, true, true, true])
    // Câu fill Cà Pháo mặc định 30/9 ("hãy biến ô tick câu fill Cà Pháo làm mặc định"): điệu tự lót fill — cũ `autoFills: false`.
    expect(style.autoFills).toBeUndefined()
  })

  it('nửa đầu ô trên Fm = đúng từng nốt ô 9: tay trái F2 C3 F3 G3 Ab3, tay phải bắt tiếp C4 F4 C5', () => {
    const e = nuaDau('Fm')
    expect(e.map(x => x.hand)).toEqual(['left', 'left', 'left', 'left', 'left', 'right', 'right', 'right'])
    expect(e.map(x => x.notes)).toEqual([[41], [48], [53], [55], [56], [60], [65], [72]])
    expect(e.map(x => x.startBeat)).toEqual([0, .25, .5, .75, 1, 1.25, 1.5, 1.75])
  })

  it('12 gốc × 6 loại hợp âm: chuỗi 8 móc kép đi lên liền qua hai tay; gốc tay trái C2–B2; tay phải ≤ C6', () => {
    for (let r = 0; r < 12; r++) for (const q of ['m', '', '7', 'm7', 'maj7', 'm7b5']) {
      const ten = `${T[r]}${q}`
      const e = nuaDau(ten)
      expect(e.length, ten).toBe(8)
      const song = e.map(x => (x.hand === 'left' ? Math.max(...x.notes) : Math.min(...x.notes)))
      song.forEach((m, i) => { if (i) expect(m, `${ten}: tiếng ${i + 1}`).toBeGreaterThan(song[i - 1]!) })
      expect(e[0]!.notes[0]! >= 36 && e[0]!.notes[0]! <= 47, ten).toBe(true)
      for (const x of render(ten)) if (x.hand === 'right') for (const n of x.notes) expect(n, ten).toBeLessThanOrEqual(84)
    }
  })

  describe('khuôn chêm tiếng nối hợp âm sau (CU_DI_NOI_CELL — mặc định 29/9, giữ để lùi)', () => {
    const noi = { ...style, cell: CU_DI_NOI_CELL }
    const renderNoi = (vong: string, beatsPerChord = 4) =>
      renderPattern(voiceLeadTwoHands(parseChordInput(vong).chords), noi, { beatsPerChord })

    it('Fm → Bbm: nửa sau F2 C3 F3 G3 Ab3 · walking G3 Eb3 C3 → Bb2; tay phải F4 · Ab4+C5 · C5 → Bb4 ô sau', () => {
      const e = renderNoi('Fm Bbm').sort((a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand))
      const sau = e.filter(x => x.startBeat >= 2 - 1e-6 && x.startBeat < 4 - 1e-6)
      expect(sau.map(x => [x.startBeat, x.hand[0], x.notes])).toEqual([
        [2, 'l', [41]], [2, 'r', [65]], [2.25, 'l', [48]], [2.5, 'l', [53]], [2.75, 'l', [55]],
        [3, 'l', [56]], [3, 'r', [68, 72]], [3.25, 'l', [55]], [3.5, 'l', [51]], [3.75, 'l', [48]], [3.75, 'r', [72]],
      ])
      expect(e.find(x => x.hand === 'left' && x.startBeat === 4)!.notes).toEqual([46])
      // Nửa đầu = khuôn gốc (cao độ), cộng hai nốt tay phải nhân tiếng nhấn ở phách 1 · 2.
      const dau = (ev: typeof e) => ev.filter(x => x.startBeat < 2 - 1e-6 && !(x.hand === 'right' && x.startBeat % 1 === 0))
        .map(x => [x.startBeat, x.notes])
      expect(dau(e)).toEqual(dau(render('Fm Bbm').sort((a, b) => a.startBeat - b.startBeat)))
    })

    it('mọi chỗ đổi hợp âm (12 gốc × 5 bước): đủ 16 móc kép liền trong ô; nốt 4¾ cách bass ô sau 1–2 nửa cung', () => {
      for (let r = 0; r < 12; r++) for (const buoc of [5, 7, 2, 10, 9]) for (const [q1, q2] of [['m', '7'], ['', 'm'], ['7', '']]) {
        const vong = `${T[r]}${q1} ${T[(r + buoc) % 12]}${q2}`
        const e = renderNoi(vong)
        const o1 = e.filter(x => x.startBeat < 4 - 1e-6)
        const moc = new Set(o1.map(x => Math.round(x.startBeat * 4)))
        expect(moc.size, vong).toBe(16)
        const dan = o1.find(x => x.hand === 'left' && Math.abs(x.startBeat - 3.75) < 1e-6)!.notes[0]!
        const bass = e.find(x => x.hand === 'left' && Math.abs(x.startBeat - 4) < 1e-6)!.notes[0]!
        const cach = Math.abs(((dan - bass) % 12 + 18) % 12 - 6)
        expect(cach >= 1 && cach <= 2, `${vong}: ${dan} → ${bass}`).toBe(true)
        // Tay phải tiếng 8 nhóm 2 cũng dẫn: cách gốc hợp âm sau 1–2 nửa cung.
        const phai = e.find(x => x.hand === 'right' && Math.abs(x.startBeat - 3.75) < 1e-6)!.notes[0]!
        const cachP = Math.abs(((phai - bass) % 12 + 18) % 12 - 6)
        expect(cachP >= 1 && cachP <= 2, `${vong}: tay phải ${phai} → gốc ${bass}`).toBe(true)
      }
    })

    it('nhấn tiếng 1 · 5 · 8 của CẢ HAI nhóm 8 tiếng (người dùng: "phách mạnh hãy đánh rõ"); tiếng khác nhẹ hẳn', () => {
      for (const vong of ['Fm Bbm', 'Eb7 Ab', 'C Am', 'G7 C']) {
        const e = renderNoi(vong).filter(x => x.startBeat < 4 - 1e-6)
        const nhan = new Set([0, 1, 1.75, 2, 3, 3.75])
        for (const x of e) {
          if (nhan.has(x.startBeat)) expect(x.velocity, `${vong} ${x.startBeat}`).toBeGreaterThanOrEqual(68)
          else expect(x.velocity, `${vong} ${x.startBeat}`).toBeLessThanOrEqual(44)
        }
        // Tiếng 5 hai nhóm: DÀY ("phách 5 đánh dày hơn nữa") — tay trái bậc 10 + tay phải bậc 10 · 12.
        for (const t of [1, 3]) {
          const n = e.filter(x => Math.abs(x.startBeat - t) < 1e-6).flatMap(x => x.notes)
          expect(new Set(n).size, `${vong} ${t}`).toBe(3)
          const p = e.filter(x => x.hand === 'right' && Math.abs(x.startBeat - t) < 1e-6).flatMap(x => x.notes)
          expect(Math.max(...p) - Math.min(...p), `${vong} ${t}`).toBeLessThanOrEqual(7)
        }
        // Mọi tiếng nhấn có tay phải (người dùng: "sao ko thêm nốt bên tay phải").
        for (const t of nhan) expect(e.some(x => x.hand === 'right' && x.startBeat === t), `${vong} ${t}`).toBe(true)
      }
    })

    it('tiếng 5 là GIAI ĐIỆU NHÔ LÊN (người dùng chọn cách 1): đỉnh tiếng 5 cao hơn tiếng 1 và hai nốt rải tay phải liền sau', () => {
      for (let r = 0; r < 12; r++) for (const q of ['m', '', '7', 'm7', 'maj7', 'm7b5', 'sus4', '9sus4', 'add9', 'm9']) {
        const vong = `${T[r]}${q}`
        const p = renderNoi(vong).filter(x => x.hand === 'right' && x.startBeat < 2 - 1e-6).sort((a, b) => a.startBeat - b.startBeat)
        const dinh = Math.max(...p.find(x => x.startBeat === 1)!.notes)
        for (const t of [0, 1.25, 1.5]) expect(dinh, `${vong}: tiếng 5 so phách ${t + 1}`).toBeGreaterThan(Math.max(...p.find(x => x.startBeat === t)!.notes))
      }
    })

    it('hợp âm ngân 8 phách: ô đầu vẫn đủ tiếng (dòng đi về chính gốc); cuối bài: nốt theo khuôn, không mất tiếng', () => {
      const e = renderNoi('Fm Bbm', 8)
      expect(e.some(x => x.hand === 'left' && Math.abs(x.startBeat - 3.75) < 1e-6)).toBe(true)
      const cuoi = renderNoi('Fm')
      expect(cuoi.filter(x => x.hand === 'left' && x.startBeat >= 3.25 - 1e-6).length).toBe(3)
    })
  })

  it('ĐÁNH ĐƯỢC BẰNG TAY NGƯỜI (gốc · nối · dẫn, 180 chỗ đổi hợp âm): mọi nốt cùng tay gõ trong ½ phách nằm trong một quãng tám', () => {
    // Người dùng 29/9: "sao tay phải đánh phách 5 mà các nốt xa nhau vậy, tay người sao mà đánh được" — bản quãng tám kép Ab4+Ab5 rồi
    // móc kép liền sau xuống C4 (20 nửa cung trong ¼ phách).
    // Gồm hợp âm treo · add9 · m9 · m7b5 · maj7 — bài người dùng có B9sus4 (bản trước: A5+Gb5 rồi Gb4, 15 nửa cung).
    for (const cell of [style.cell!, CU_DI_NOI_CELL]) {
      for (let r = 0; r < 12; r++) for (const buoc of [5, 7, 2, 10, 9]) for (const [q1, q2] of [['m', '7'], ['', 'm'], ['7', ''],
        ['9sus4', 'add9'], ['m9', 'm7b5'], ['maj7', 'sus4']]) {
        const vong = `${T[r]}${q1} ${T[(r + buoc) % 12]}${q2}`
        const ev = renderPattern(voiceLeadTwoHands(parseChordInput(vong).chords), { ...style, cell }, { beatsPerChord: 4 })
        for (const hand of ['right', 'left'] as const) {
          const p = ev.filter(x => x.hand === hand && x.startBeat < 4 - 1e-6)
          for (const x of p) {
            const cum = p.filter(y => y.startBeat >= x.startBeat - 1e-6 && y.startBeat < x.startBeat + .5 - 1e-6).flatMap(y => y.notes)
            expect(Math.max(...cum) - Math.min(...cum), `${vong} ${hand} ${x.startBeat}`).toBeLessThanOrEqual(12)
          }
        }
      }
    }
  })

  it('ĐÁNH ĐƯỢC BẰNG TAY NGƯỜI trên vòng dài, hợp âm dài ngắn khác nhau (2 · 4 · 6 · 8 phách, ô hai hợp âm): tay phải trong ½ phách ≤ quãng tám', () => {
    // Người dùng 29/9 (ảnh Aadd2): "vẫn còn sót chỗ mà tầm nốt xa". Trước khi giữ tầm tay: 71/3538 cú (tiếng 8 cuối ô → tiếng 1 ô sau;
    // ô hai hợp âm 2 phách: đỉnh sóng Bm F#5 → tiếng 1 E E4 = 14 nửa cung / ¼ phách).
    // Đo SAU bước đổi nhãn tay của app (`fixHandByRegister`, chỗ mọi tầng đổ về) — ảnh thứ hai của người dùng: C#4 (bậc 10 tay trái
    // trên Aadd2) bị dán nhãn tay phải, cùng lúc C#5+E5. Test cũ đo thẳng đầu ra bộ dựng nên báo "0 chỗ".
    const vongs = ['Aadd2 E F#m C#m D A Bm E', 'A E/G# F#m D Bm7 E7 A', 'Aadd2 C#m7 D E F#m Bm E7sus4 E', 'Em(add9) Am9 D9 Gadd2 Cadd2 Am9 F#m7b5 B9sus4',
      'B E F#7 B G#m C#m F#7 B', 'Bb Eb F Gm Cm F7 Bb Bb']
    for (const cell of [style.cell!, CU_DI_NOI_CELL]) for (const vong of vongs) for (const lens of [[4], [8], [2, 2, 4], [4, 2, 2], [6, 2], [8, 4]]) {
      const chords = parseChordInput(vong).chords
      const ev = fixHandByRegister(renderPattern(voiceLeadTwoHands(chords), { ...style, cell }, { beatsPerChord: 4, beatsEach: chords.map((_, i) => lens[i % lens.length]!) }))
      const p = ev.filter(x => x.hand === 'right')
      for (const x of p) {
        const cum = p.filter(y => y.startBeat >= x.startBeat - 1e-6 && y.startBeat < x.startBeat + .5 - 1e-6).flatMap(y => y.notes)
        expect(Math.max(...cum) - Math.min(...cum), `${vong} ${JSON.stringify(lens)} phách ${x.startBeat}`).toBeLessThanOrEqual(12)
      }
    }
  })

  describe('mỗi hợp âm 8 phách rồi chuyển (CU_DI_MOT_LUOT_CELL — một lượt 8 tiếng mỗi hợp âm, mặc định 30/9)', () => {
    const mot = { ...style, cell: CU_DI_MOT_LUOT_CELL }
    it('Fm Bbm Eb Ab, mỗi hợp âm 2 nốt đen: đúng 8 móc kép mỗi hợp âm, tay trái 5 tiếng lên rồi tay phải 3 tiếng lên; nhấn 1 · 5 · 8', () => {
      const ev = renderPattern(voiceLeadTwoHands(parseChordInput('Fm Bbm Eb Ab').chords), mot, { beatsPerChord: 2 })
      expect(Math.max(...ev.map(e => e.startBeat))).toBeLessThan(8)
      for (let c = 0; c < 4; c++) {
        const o = ev.filter(e => e.startBeat >= c * 2 - 1e-6 && e.startBeat < c * 2 + 2 - 1e-6)
        expect([...new Set(o.map(e => e.startBeat - c * 2))].sort((a, b) => a - b), `hợp âm ${c + 1}`).toEqual([0, .25, .5, .75, 1, 1.25, 1.5, 1.75])
        // Sóng: tay trái nốt cao nhất, tay phải nốt thấp nhất (bỏ hai tiếng nhấn tay phải ở phách nguyên).
        const song = o.filter(e => !(e.hand === 'right' && e.startBeat % 1 === 0)).sort((a, b) => a.startBeat - b.startBeat)
        expect(song.map(e => e.hand), `hợp âm ${c + 1}`).toEqual(['left', 'left', 'left', 'left', 'left', 'right', 'right', 'right'])
        const m = song.map(e => e.hand === 'left' ? Math.max(...e.notes) : Math.min(...e.notes))
        m.forEach((n, i) => { if (i) expect(n, `hợp âm ${c + 1} tiếng ${i + 1}`).toBeGreaterThan(m[i - 1]!) })
        const luc = (at: number) => Math.max(...o.filter(e => Math.abs(e.startBeat - c * 2 - at) < 1e-6).map(e => e.velocity))
        for (const manh of [0, 1, 1.75]) for (const nhe of [.25, .5, .75, 1.25, 1.5])
          expect(luc(manh), `hợp âm ${c + 1}: tiếng ở ${manh} mạnh hơn ${nhe}`).toBeGreaterThan(luc(nhe))
      }
      expect(ev.filter(e => e.startBeat < 2).map(e => [e.startBeat, e.hand, e.notes]).filter(([, h]) => h === 'left').map(([, , n]) => n))
        .toEqual([[41], [48], [53], [55], [56]])   // Fm: F2 C3 F3 G3 Ab3, như lượt đầu khuôn mặc định (ô 9)
    })

    it('đánh được bằng tay người trên vòng dài (2 · 4 phách, sau fixHandByRegister): mỗi tay trong ½ phách ≤ quãng tám', () => {
      const vongs = ['Aadd2 E F#m C#m D A Bm E', 'Em(add9) Am9 D9 Gadd2 Cadd2 Am9 F#m7b5 B9sus4', 'B E F#7 B G#m C#m F#7 B',
        'Bb Eb F Gm Cm F7 Bb Bb', 'Fm Bbm Eb7 Ab Db Bbm C7 Fm']
      for (const vong of vongs) for (const lens of [[2], [2, 2, 4], [4]]) {
        const chords = parseChordInput(vong).chords
        const ev = fixHandByRegister(renderPattern(voiceLeadTwoHands(chords), mot, { beatsPerChord: 2, beatsEach: chords.map((_, i) => lens[i % lens.length]!) }))
        for (const hand of ['right', 'left'] as const) {
          const p = ev.filter(x => x.hand === hand)
          for (const x of p) {
            const cum = p.filter(y => y.startBeat >= x.startBeat - 1e-6 && y.startBeat < x.startBeat + .5 - 1e-6).flatMap(y => y.notes)
            expect(Math.max(...cum) - Math.min(...cum), `${vong} ${JSON.stringify(lens)} ${hand} phách ${x.startBeat}`).toBeLessThanOrEqual(12)
          }
        }
      }
    })
  })

  it('nút riêng trong nhóm Ballad', () => {
    expect(kieuTrongHo('ballad').some(s => s.family === 'ca-phao-ballad-cu-di')).toBe(true)
    expect(style.name).toBe('Ballad cứ đi')
    expect(style.bpm).toBe(63)
  })
})

/*
  Ô tick "Ballad cứ đi: solo · lick · run Cà Pháo khớp sóng rải" (`CU_DI_SOLO`, 29/9/2026, nghe thử). Người dùng: "phải soạn cho khớp
  với tiết tấu điệu ballad anh cứ sau khi đã đặt ô tick chêm tiếng nối hợp âm sau".
*/
describe('Ballad cứ đi — solo · lick · run Cà Pháo khớp sóng rải (mặc định 30/9)', () => {
  const thu = style
  const SONG = [0, .25, .5, .75, 1, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75]
  const cheo = (events: readonly TimelineEvent[]) => {
    const L = events.filter(e => e.hand === 'left'), R = events.filter(e => e.hand === 'right' && !e.grace)
    return L.filter(l => R.some(r => r.startBeat < l.startBeat + l.durationBeats - 1e-6 &&
      l.startBeat < r.startBeat + r.durationBeats - 1e-6 && Math.max(...l.notes) >= Math.min(...r.notes))).length
  }

  it('dạo · giang · kết: tiết tấu solo chính bài; tay trái giữ sóng 13 tiếng (bậc 9 không lặp gốc); không chéo tay; chất liệu gần sheet', () => {
    for (const [tonic, scale] of [[5, 'minor'], [9, 'minor'], [0, 'major']] as const)
      for (const kind of ['intro', 'interlude', 'outro'] as const) {
        const hits: Hit[] = []
        let beats = 0, bars = 0, duSong = 0, khongLap = 0, vuot = 0, cu = 0
        for (let take = 0; take < 12; take++) {
          const m = buildPhraseSection({ kind, key: { tonic, scale }, style: thu, caPhaoCompose: true, cpBalladThu: true,
            caPhaoFull: take % 2 === 1, thay: 'ca-phao', beatsPerChord: 4, dropRoot: true, opening: null, solo: () => [], take })!
          const at = `${tonic}${scale} ${kind} take ${take}`
          expect(m.unavailableReason, at).toBeUndefined()
          for (const t of m.compositionSources ?? []) expect(String(t.rhythm), at).toMatch(/^Anh Cu Di Di/)
          const ev = fixHandByRegister(m.events)
          expect(cheo(ev), `${at}: hai tay chéo / trùng phím khi đang vang`).toBe(0)
          for (const e of ev) if (e.hand === 'left') for (const n of e.notes) expect(n, at).toBeLessThanOrEqual(67)
          for (let bar = 0; bar < m.lengthBeats; bar += 4) {
            const left = ev.filter(e => e.hand === 'left' && e.startBeat >= bar - 1e-6 && e.startBeat < bar + 4 - 1e-6)
            bars++
            if (SONG.every(p => left.some(e => Math.abs(e.startBeat - bar - p) < 1e-6))) duSong++
            const n = (p: number) => left.find(e => Math.abs(e.startBeat - bar - p) < 1e-6)?.notes.at(-1)
            if (n(.5) !== undefined && n(.5) !== n(.75)) khongLap++
          }
          const right = ev.filter(e => e.hand === 'right' && !e.grace)
          for (const e of right) {
            const gan = right.filter(o => o.startBeat >= e.startBeat - 1e-6 && o.startBeat < e.startBeat + .5 - 1e-6).flatMap(o => o.notes)
            cu++
            if (Math.max(...gan) - Math.min(...gan) > 12) vuot++
          }
          for (const t of [...new Set(right.map(e => e.startBeat))].sort((a, b) => a - b)) {
            const e2 = right.filter(e => e.startBeat === t)
            hits.push({ at: t + beats, tones: [...new Set(e2.flatMap(e => e.notes))], gate: Math.max(...e2.map(e => e.durationBeats)), left: false })
          }
          beats += m.lengthBeats
        }
        const at = `${tonic}${scale} ${kind}`
        expect(duSong / bars, `${at}: ô đủ 13 tiếng sóng tay trái`).toBeGreaterThanOrEqual(.95)
        expect(khongLap / bars, `${at}: tiếng 3 → 4 của sóng không lặp nốt (bậc 9)`).toBeGreaterThanOrEqual(.95)
        // Trước khi giữ tầm tay phải: Đô trưởng giang 33/1330 (2,5%); sau: 0 ở cả ba giọng.
        expect(vuot / cu, `${at}: tay phải vượt quãng tám trong ½ phách`).toBeLessThanOrEqual(.005)
        // Sheet Anh Cứ Đi Đi (`cpSoloTexture.probe.ts`): giang dặm 19% · nốt chạy 31%; kết 6% · 50%. Thân dạo/giang ít dặm (người dùng
        // chê Để em 26/9: "quá nhiều dặm hợp âm, ít chạy nốt"). Đo lúc dựng (Fa thứ · La thứ · Đô trưởng, 12 lượt mỗi loại): dặm
        // dạo 14 · 14 · 17%, giang 13 · 13 · 12%, kết 15 · 15 · 18%; nốt chạy dạo 23 · 27 · 31%, giang 30 · 34 · 32%, kết 47 · 42 · 27%.
        const t = texture(hits, beats)
        if (kind !== 'outro') expect(t.dam, `${at} dặm`).toBeLessThanOrEqual(.2)
        expect(t.runNotes, `${at} nốt chạy`).toBeGreaterThanOrEqual(.2)
      }
  }, 60_000)

  const VONG = parseChordInput('Fm Db Eb Cm Fm Db Bbm C7 Fm Db Eb Cm Bbm Eb Ab C7 Fm').chords
  const lick = (take: number) => {
    // Mỗi hợp âm 2 phách — độ dài mặc định của điệu từ 30/9 (một lượt 8 tiếng).
    const backing = renderPattern(voiceLeadTwoHands(VONG), thu, { beatsPerChord: 2 })
    return { backing, plan: planCpLicks({ chords: VONG, style: thu, key: { tonic: 5, scale: 'minor' }, backing, beatsPerChord: 2,
      sectionEnds: new Set([7, 15]), fullTransitions: true, take, keyboard: { low: 36, high: 96 } }) }
  }

  it('lick lúc hát: chỉ thay tay phải; tay trái giữ tiếng ngân dài, nhường tiếng câu gõ; khung câu không im móc kép nào; không chéo tay', () => {
    let fills = 0
    for (let take = 0; take < 8; take++) {
      const { backing, plan } = lick(take)
      const all = fixHandByRegister([...plan.backing, ...plan.events])
      expect(cheo(all), `take ${take}`).toBe(0)
      for (const p of plan.placements.filter(p => p.kind === 'fill')) {
        fills++
        const at = `take ${take} @${p.start}`
        expect(p.events.every(e => e.hand === 'right'), `${at}: câu chỉ tay phải, bỏ bè trầm nguồn`).toBe(true)
        for (const b of backing.filter(b => b.hand === 'left' && b.durationBeats >= 1 && b.startBeat >= p.start - 1e-6 && b.startBeat < p.end))
          expect(plan.backing.some(e => e.hand === 'left' && e.startBeat === b.startBeat && e.notes.join() === b.notes.join()), `${at}: giữ ${b.startBeat}`).toBe(true)
        for (const e of p.events) expect(plan.backing.some(l => l.hand === 'left' && Math.abs(l.startBeat - e.startBeat) < 1e-6 &&
          l.durationBeats < 1), `${at}: tay trái nhường tiếng ${e.startBeat}`).toBe(false)
        // Khuôn một lượt (30/9): tay phải sóng nhường trọn khung câu, nên chỗ câu nghỉ không có tiếng gõ mới — nhưng không im (bass ngân).
        for (let s = p.start; s < p.end - 1e-6; s += .25)
          expect(all.some(e => e.startBeat < s + 1e-6 && e.startBeat + e.durationBeats > s + 1e-6), `${at}: móc kép ${s} không im`).toBe(true)
      }
    }
    expect(fills).toBeGreaterThan(8)
  })

  it('mốc chuyển đoạn: tay trái chạy 8 móc kép như ô 16 sheet (C7 → Fm: Db3 F3 Ab3 B3 Bb3 G3 E3 C3), tay phải giữ, không gõ thêm', () => {
    for (let take = 0; take < 4; take++) {
      const { plan } = lick(take)
      for (const end of [16, 32]) {
        const p = plan.placements.find(p => p.end === end)!
        expect(p.kind).toBe('run')
        expect(p.events.map(e => [e.hand, e.startBeat - end + 4, e.notes[0]])).toEqual(
          [49, 53, 56, 59, 58, 55, 52, 48].map((n, i) => ['left', 2 + i * .25, n]))
        expect(plan.backing.some(e => e.startBeat > end - 2 + 1e-6 && e.startBeat < end - 1e-6), `take ${take}: im đệm dưới câu chạy`).toBe(false)
      }
    }
    // Nghỉ đôn ra 2 phách ở mốc 7 (C7 thành 6 phách): câu chạy kết ở vạch cũ, im cả hai tay suốt chỗ nghỉ.
    const vong = VONG.map((c, i) => i === 7 ? { ...c, beats: 6 } : c)
    const backing = renderPattern(voiceLeadTwoHands(vong), thu, { beatsPerChord: 4 })
    const plan = planCpLicks({ chords: vong, style: thu, key: { tonic: 5, scale: 'minor' }, backing, beatsPerChord: 4,
      sectionEnds: new Set([7]), fullTransitions: true, transitionRests: new Map([[7, 2]]), take: 0 })
    const p = plan.placements.find(p => p.mainIndex === 7)!
    expect([p.start, p.exit, p.end]).toEqual([30, 32, 34])
    expect(plan.backing.some(e => e.startBeat < 34 - 1e-6 && e.startBeat + e.durationBeats > 32 + 1e-6)).toBe(false)
  })
})

/*
  Ô tick "Ballad cứ đi: câu fill Cà Pháo" (`fillCuDi`, 30/9/2026, nghe thử). Nhịp hai hình lấy từ hai cửa fill người dùng đã xác nhận:
  "leo" = Chưa Bao Giờ 50→51 (3 móc kép cuối hợp âm + cú rơi phách 1), "mở" = Để Em 40 (phách 1: nốt đơn → thế bấm → đỉnh ngân ½).
*/
describe('Ballad cứ đi — câu fill Cà Pháo (fillCuDi)', () => {
  const HOP = (s: string) => parseChordInput(s).chords[0]!
  const tones = (c: ReturnType<typeof HOP>) => c.quality.intervals.map(i => (c.root + i) % 12)
  const tamTay = (ev: readonly { note: number; startBeat: number }[]) => ev.every(e => {
    const gan = ev.filter(o => o.startBeat >= e.startBeat - 1e-6 && o.startBeat < e.startBeat + .5 - 1e-6).map(o => o.note)
    return Math.max(...gan) - Math.min(...gan) <= 12
  })

  it('luật chọn hợp âm lướt khớp 10/11 chỗ đo trên sheet Cà Pháo (lệch: Có Em Chờ 44→45)', () => {
    const dung: [string, string, string, string][] = [
      ['G7', 'C7', 'bII7', 'Db'], ['Abmaj7', 'C7', 'bII7', 'Db'],                       // Anh Cứ Đi Đi 15 · Có Em Chờ 29→30
      ['Em7', 'Dm7', 'bII7', 'Eb'], ['Gm7', 'Fm7', 'bII7', 'Gb'],                       // Chúng Ta 20→21 · 52→53 · Có Em Chờ 34→35
      ['C7', 'Fm', 'bII7 hàng xóm', 'Db'],                                            // Anh Cứ Đi Đi 45 · 53
      ['Fm', 'Bbm', 'át 7 bass cảm âm', 'A'], ['G', 'Am7', 'át 7 bass cảm âm', 'Ab'],   // Anh Cứ Đi Đi 17→18 · 46→47 · Chúng Ta 50→51
      ['Fm7', 'Eb', 'át 7 bass cảm âm', 'D'], ['Bbm7', 'Ab', 'át 7 bass cảm âm', 'G']]  // Có Em Chờ 19→20 · Ngày mai 46→47
    for (const [a, b, ten, bass] of dung) {
      const l = chonHopAmLuot(HOP(a), HOP(b))!
      expect([l.ten, T[l.doan[0]!.bass]], `${a} → ${b}`).toEqual([ten, bass])
    }
    expect(chonHopAmLuot(HOP('Eb'), HOP('Abmaj7'))!.ten).toBe('át 7 bass cảm âm')   // sheet: A7 (bII7) — chỗ lệch đã biết
    expect(chonHopAmLuot(HOP('C'), HOP('C'))).toBeNull()
    expect(chonHopAmLuot(HOP('Db'), HOP('C'))).toBeNull()
  })

  it('Fm → Bbm: phách 4 = F7/A (tay trái A2+Eb3, tay phải A4+Eb5+A5 như Anh Cứ Đi Đi ô 17→18); "leo" 3 cặp nốt F7 rồi rơi Bbm; "mở" trên Bbm', () => {
    const leo = soanKieu('leo', { chord: HOP('Fm'), next: HOP('Bbm'), endBeat: 4, beats: 2, take: 0 })
    const o = (f: typeof leo, t: number, tay: string) => f.filter(n => n.startBeat === t && n.hand === tay).map(n => n.note).sort((x, y) => x - y)
    expect(o(leo, 3, 'left')).toEqual([45, 51])
    expect(o(leo, 3, 'right')).toEqual([69, 75, 81])
    expect([...new Set(leo.filter(n => n.hand === 'right').map(n => n.startBeat))]).toEqual([3, 3.25, 3.5, 3.75, 4])
    for (const n of leo.filter(n => n.startBeat > 3 && n.startBeat < 4)) expect([5, 9, 0, 3].includes(n.note % 12)).toBe(true)
    for (const n of leo.filter(n => n.startBeat === 4)) expect([10, 1, 5].includes(n.note % 12)).toBe(true)
    const mo = soanKieu('mở', { chord: HOP('Fm'), next: HOP('Bbm'), endBeat: 4, beats: 2, take: 1 })
    expect(o(mo, 3, 'right')).toEqual([69, 75, 81])
    expect(mo.filter(n => n.hand === 'right').map(n => [n.startBeat, n.durationBeats])).toEqual(
      [[3, 1], [3, 1], [3, 1], [4, .25], [4.25, .25], [4.25, .25], [4.25, .25], [4.5, .5]])
  })

  it('C7 → Fm: Db7 hàng xóm rồi về C7 (Anh Cứ Đi Đi ô 53: tay trái Db+B → C+Bb, tay phải F4+B4+F5)', () => {
    const f = soanKieu('leo', { chord: HOP('C7'), next: HOP('Fm'), endBeat: 4, beats: 2, take: 0 })
    expect(f.filter(n => n.hand === 'left').map(n => [n.startBeat, n.note % 12])).toEqual([[3, 1], [3, 11], [3.5, 0], [3.5, 10]])
    expect(f.filter(n => n.hand === 'right' && n.startBeat === 3).map(n => n.note)).toEqual([65, 71, 77])
  })

  it('leo · mở — 12 gốc × 4 bước × 6 cặp loại: nốt đúng hợp âm từng đoạn, tay trái dưới tay phải, đỉnh leo lên, trong ½ phách ≤ quãng tám', () => {
    for (let r = 0; r < 12; r++) for (const buoc of [5, 7, 2, 10]) for (const [q1, q2] of [['m', '7'], ['', 'm'], ['7', ''], ['sus4', 'maj7'],
      ['m7b5', '7'], ['9sus4', 'add9']]) for (const take of [0, 1]) {
      const chord = HOP(`${T[r]}${q1}`), next = HOP(`${T[(r + buoc) % 12]}${q2}`), at = `${chord.symbol} → ${next.symbol} take ${take}`
      const f = soanKieu(take === 0 ? 'leo' : 'mở', { chord, next, endBeat: 8, beats: 4, take })
      const l = chonHopAmLuot(chord, next)
      expect(f.length, at).toBeGreaterThanOrEqual(5)
      const hopAmLuc = (t: number) => t >= 8 - 1e-6 ? tones(next) : l
        ? (d => [0, 4, 7, 10].map(i => (d.goc + i) % 12))(l.doan.findLast(d => 8 + d.tu <= t + 1e-6)!) : tones(chord)
      for (const n of f) expect(hopAmLuc(n.startBeat).includes(n.note % 12), `${at} ${n.hand} ${n.startBeat} ${n.note}`).toBe(true)
      const R = f.filter(n => n.hand === 'right'), Lh = f.filter(n => n.hand === 'left')
      if (l) {
        expect(Lh.length, at).toBe(2 * l.doan.length)
        const d = ((Lh[0]!.note - ((next.bass ?? next.root))) % 12 + 12) % 12
        if (l.ten !== 'bII7 hàng xóm') expect([1, 11].includes(d), `${at}: bass lướt cách gốc sau nửa cung`).toBe(true)
        expect(Math.max(...Lh.map(n => n.note)) < Math.min(...R.map(n => n.note)), at).toBe(true)
      } else expect(Lh, at).toEqual([])
      if (take === 0) {
        const leo = [...new Set(R.filter(n => n.startBeat > 7 - 1e-6 + (l ? .25 : 0)).map(n => n.startBeat))]
          .map(t => Math.max(...R.filter(n => n.startBeat === t).map(n => n.note)))
        leo.forEach((d, i) => { if (i) expect(d, at).toBeGreaterThan(leo[i - 1]!) })
      }
      expect(Math.min(...R.map(n => n.note)), at).toBeGreaterThanOrEqual(60)
      const dinh = Math.max(...R.filter(n => n.startBeat >= 8).map(n => n.note))
      expect(dinh >= 78 && dinh <= 94, `${at}: đỉnh ${dinh}`).toBe(true)
      expect(tamTay(R), at).toBe(true)
      expect(tamTay(Lh), at).toBe(true)
    }
  })

  it('bảy kỹ thuật × 12 gốc × 4 bước × 6 cặp loại: nằm trong [phách trước, phách sau); nốt đúng hợp âm; tay trái dưới tay phải; ½ phách ≤ quãng tám', () => {
    const vang = (c: ReturnType<typeof HOP>) => new Set([...tones(c), (c.root + 2) % 12])
    const lamDuoc: Record<string, number> = {}
    for (const kieu of KIEU_FILL) for (let r = 0; r < 12; r++) for (const buoc of [5, 7, 2, 10]) for (const [q1, q2] of [['m', '7'], ['', 'm'],
      ['7', ''], ['sus4', 'maj7'], ['m7b5', '7'], ['9sus4', 'add9']]) {
      const chord = HOP(`${T[r]}${q1}`), next = HOP(`${T[(r + buoc) % 12]}${q2}`), at = `${kieu}: ${chord.symbol} → ${next.symbol}`
      const f = soanKieu(kieu, { chord, next, endBeat: 8, beats: 2, take: 0 })
      if (!f.length) continue
      lamDuoc[kieu] = (lamDuoc[kieu] ?? 0) + 1
      const R = f.filter(n => n.hand === 'right'), Lh = f.filter(n => n.hand === 'left')
      for (const n of f) expect(n.startBeat >= 7 - 1e-6 && n.startBeat < 9 - 1e-6, `${at} @${n.startBeat}`).toBe(true)
      for (const n of f.filter(n => n.startBeat >= 8 - 1e-6)) expect(tones(next).includes(n.note % 12), `${at} ${n.note}`).toBe(true)
      if (kieu !== 'leo' && kieu !== 'mở') for (const n of f.filter(n => n.startBeat < 8 - 1e-6)) {
        if (kieu === 'bass đi' && n.hand === 'left') continue                    // bass đi nửa cung — nốt lướt là chủ ý
        if (kieu === 'câu đơn' && n.startBeat === 7.75) continue                   // nốt dẫn nửa cung vào bậc 3 hợp âm sau
        expect(vang(chord).has(n.note % 12), `${at} ${n.hand} @${n.startBeat} ${n.note}`).toBe(true)
      }
      for (const l of Lh) for (const x of R) if (l.startBeat < x.startBeat + x.durationBeats - 1e-6 && x.startBeat < l.startBeat + l.durationBeats - 1e-6)
        expect(l.note < x.note, `${at}: tay trái ${l.note} dưới tay phải ${x.note}`).toBe(true)
      expect(Math.min(...R.map(n => n.note)), at).toBeGreaterThanOrEqual(60)
      expect(tamTay(R), at).toBe(true)
      expect(tamTay(Lh), at).toBe(true)
    }
    // Mọi kỹ thuật đều ra câu trên hầu hết chỗ; riêng "bass đi" cần bass cách ≥ 3 nửa cung (bước 2 · 10 ra quá gần).
    for (const kieu of KIEU_FILL) expect(lamDuoc[kieu] ?? 0, kieu).toBeGreaterThanOrEqual(kieu === 'bass đi' ? 100 : 250)
  })

  it('đa dạng: các chỗ fill KẾ NHAU trong một lượt dùng kỹ thuật khác nhau; lượt phát sau lệch điểm xuất phát', () => {
    const yc = { chord: HOP('Fm'), next: HOP('Bbm'), endBeat: 8, beats: 2, take: 0 }
    const ky = (f: ReturnType<typeof fillCuDi>) => JSON.stringify(f)
    const luot = (lech: number) => { const d = cuDiFillTheoThu(lech); return KIEU_FILL.map(() => ky(d(yc))) }
    const mot = luot(0)
    expect(new Set(mot).size, '7 chỗ fill liền nhau → 7 câu khác nhau').toBe(7)
    mot.forEach((c, i) => { if (i) expect(c).not.toBe(mot[i - 1]) })
    expect(luot(1)[0]).toBe(mot[1])
    expect(luot(1)[0]).not.toBe(mot[0])
    // Người dùng: "fill là phải chơi đa dạng các kỹ thuật mình có chứ ko phải lặp lại đúng 1 kiểu".
    for (let k = 0; k < KIEU_FILL.length; k++) expect(mot[k]).toBe(ky(soanKieu(KIEU_FILL[k]!, yc)))
  })

  it('đệm hát (màu thường): câu fill chỗ ca sĩ nghỉ đan vào sóng rải — tay trái giữ bass phách 1, tay phải sóng nhường, không chéo tay', () => {
    const vong = parseChordInput('Fm Db Eb Cm Fm Db Bbm C7 Fm Db Eb Cm Bbm Eb Ab C7').chords
    for (const [cell, bpc] of [[CU_DI_NOI_CELL, 4], [CU_DI_MOT_LUOT_CELL, 2]] as const) for (let take = 0; take < 4; take++) {
      const backing = renderPattern(voiceLeadTwoHands(vong), { ...style, cell }, { beatsPerChord: bpc })
      const fill = soloToTimeline(generateFillLine(vong, { beatsPerChord: bpc, key: { tonic: 5, scale: 'minor' }, autoFillRun: cuDiFillTheoThu(take), take }))
      expect(fill.length, `ô ${bpc} phách take ${take}`).toBeGreaterThan(8)
      const dem = danFillVaoSong(backing, fill)
      const all = fixHandByRegister([...dem, ...fill])
      const L = all.filter(e => e.hand === 'left'), R = all.filter(e => e.hand === 'right')
      for (const l of L) for (const r of R) if (l.startBeat < r.startBeat + r.durationBeats - 1e-6 && r.startBeat < l.startBeat + l.durationBeats - 1e-6)
        expect(Math.max(...l.notes) < Math.min(...r.notes), `ô ${bpc} take ${take}: tay trái ${l.startBeat} dưới tay phải ${r.startBeat}`).toBe(true)
      for (const f of fill) {
        // Tay phải sóng không gõ trong lúc câu đang vang; phách chẵn (đầu hợp âm) vẫn có bass tay trái.
        expect(dem.some(e => e.hand === 'right' && e.startBeat > f.startBeat - 1e-6 && e.startBeat < f.startBeat + f.durationBeats - 1e-6),
          `take ${take} @${f.startBeat}`).toBe(false)
        if (Math.abs(f.startBeat % bpc) < 1e-6) expect(dem.some(e => e.hand === 'left' && Math.abs(e.startBeat - f.startBeat) < 1e-6)).toBe(true)
      }
      expect(tamTay(R.filter(e => fill.includes(e)).flatMap(e => e.notes.map(note => ({ note, startBeat: e.startBeat })))), `take ${take}`).toBe(true)
    }
  })

  it('màu Cà Pháo (CP Lick): chỗ fill hỏi câu điệu trước kho câu; câu ấy đan vào sóng — tay trái không bị cắt như câu kho', () => {
    const vong = parseChordInput('Fm Db Eb Cm Fm Db Bbm C7 Fm').chords
    const backing = renderPattern(voiceLeadTwoHands(vong), style, { beatsPerChord: 4 })
    const plan = planCpLicks({ chords: vong, style, key: { tonic: 5, scale: 'minor' }, backing, beatsPerChord: 4, take: 0, datFill: cuDiFillTheoThu(0) })
    const fills = plan.placements.filter(p => p.kind === 'fill')
    expect(fills.length).toBeGreaterThan(0)
    for (const p of fills) {
      expect(p.source.id).toBe('dieu-tu-soan-fill')
      // Tay trái giữ nốt ngân của sóng, trừ phách hợp âm lướt — ở đó "vỏ" tay trái của câu thay vào (không chồng hai bass).
      const trai = p.events.filter(e => e.hand === 'left')
      const tu = trai.length ? Math.min(...trai.map(e => e.startBeat)) : Infinity
      for (const b of backing.filter(b => b.hand === 'left' && b.durationBeats >= 1 && b.startBeat >= p.start - 1e-6 && b.startBeat < p.end))
        expect(plan.backing.some(e => e.hand === 'left' && e.startBeat === b.startBeat) || b.startBeat >= tu - 1e-6,
          `giữ tay trái ${b.startBeat}`).toBe(true)
      expect(plan.backing.some(e => e.hand === 'left' && e.startBeat < tu - 1e-6 && e.startBeat + e.durationBeats > tu + 1e-6),
        'nốt tay trái cũ không ngân vào phách hợp âm lướt').toBe(false)
    }
  })
})
