import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'
import { chayBluesClaude, chayBlueSun, datNuaO, KHO_O, KHO_SUN, nhuongTayPhai } from '../boSoanBlues'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { buildPhraseSection } from '../phraseSection'
import { renderPattern } from '../patternRenderer'
import { getStyle } from '../styleLibrary'

const chord = (s: string) => parseChordInput(s).chords[0]!
const pc = (n: number) => ((n % 12) + 12) % 12

describe('Blues Claude — kho nửa ô Rockhouse (một ô 6/8 = một hợp âm)', () => {
  it('mọi nửa ô có nguồn (ô · phách 1/3), chức năng I/IV/V, nằm trong 6 móc đơn, trên lưới ¼ móc đơn', () => {
    expect(KHO_O.length).toBe(212)
    for (const o of KHO_O) {
      expect(o.id).toMatch(/^Rockhouse:o\d+:phach[13]$/)
      expect([0, 5, 7]).toContain(o.ham)
      for (const [t, d, ns] of o.su) {
        expect(t).toBeGreaterThanOrEqual(0)
        expect(t).toBeLessThan(6)
        expect(d).toBeGreaterThan(0)
        expect(Math.abs(t * 4 - Math.round(t * 4))).toBeLessThan(1e-6)
        expect(ns).toEqual([...ns].sort((a, b) => a - b))
      }
    }
    // riff hợp âm — thứ kho lick lượt 1 đã cắt bỏ — có mặt
    expect(KHO_O.filter(o => o.tex === 'riff').length).toBe(73)
  })

  it('dựng ngược về đúng giọng nguồn (Sol, cùng gốc) ra lại đúng từng nốt sheet', () => {
    for (const o of KHO_O) {
      const dat = datNuaO(o, o.goc, false)!
      expect(dat.map(s => s.notes)).toEqual(o.su.map(s => [...new Set(s[2])]))
    }
  })

  it('đặt lên hợp âm thứ: không còn bậc 3 trưởng / 7 trưởng; mọi giọng vừa tầm 45–88', () => {
    for (const o of KHO_O) for (let g = 0; g < 12; g++) {
      const dat = datNuaO(o, g, true)
      if (!dat) continue
      for (const s of dat) for (const n of s.notes) {
        expect([4, 11]).not.toContain(pc(n - g))
        expect(n).toBeGreaterThanOrEqual(45)
        expect(n).toBeLessThanOrEqual(88)
      }
    }
  })

  it('câu chèn chỗ fill: giữ vị trí phách trong ô 6/8, trong cửa sổ fill, không quá vạch ô, hợp âm thứ không bậc 3 trưởng', () => {
    const keys = [{ tonic: 9, scale: 'minor' }, { tonic: 0, scale: 'major' }]
    for (const key of keys) for (const ten of ['Am', 'Dm', 'E7', 'F', 'G', 'C', 'G7', 'Em']) for (let take = 0; take < 6; take++) {
      const c = chord(ten)
      const ra = chayBluesClaude({ chord: c, next: chord('Am'), endBeat: 9, beats: 3, take, key, mocDon: .5 })
      expect(ra, `${ten} ${key.scale} ${take}`).not.toBeNull()
      for (const n of ra!) {
        expect(n.startBeat).toBeGreaterThanOrEqual(6 - 1e-9)
        expect(n.startBeat + n.durationBeats).toBeLessThanOrEqual(9 + 1e-9)
        if (ten.endsWith('m')) expect(pc(n.note - c.root)).not.toBe(4)
      }
    }
  })

  it('cửa sổ fill ngắn: chỉ nhận nửa ô vào muộn; không vừa thì null — không dồn câu', () => {
    const ra = chayBluesClaude({ chord: chord('C'), next: chord('F'), endBeat: 3, beats: 1.5, take: 0,
      key: { tonic: 0, scale: 'major' }, mocDon: .5 })
    for (const n of ra ?? []) expect(n.startBeat).toBeGreaterThanOrEqual(1.5 - 1e-9)
    expect(chayBluesClaude({ chord: chord('C'), next: chord('F'), endBeat: 3, beats: .1, take: 0,
      key: { tonic: 0, scale: 'major' }, mocDon: .5 })).toBeNull()
  })
})

describe('Lick Blues (ô tick họ slow rock)', () => {
  it('bộ sinh fill: chỗ fill ra câu tay phải', () => {
    const chords = parseChordInput('Am Dm E7 Am').chords
    const lick = (yc: Parameters<NonNullable<Parameters<typeof generateFillLine>[1]['autoFillRun']>>[0]) =>
      chayBluesClaude({ ...yc, key: { tonic: 9, scale: 'minor' }, mocDon: .5 })
    const line = generateFillLine(chords, { beatsPerChord: 3, fillBeats: 3, fillBassChance: 0, density: 'dense',
      autoFillRun: lick, take: 0 })
    expect(line.length).toBeGreaterThan(0)
    expect(line.every(n => n.hand === 'right')).toBe(true)
  })
})

describe('Slow Blues — dạo · giang · kết (bluesClaudeSolo)', () => {
  const style = getStyle('blue-sun')!
  const soan = (kind: 'intro' | 'interlude' | 'outro', key: { tonic: number; scale: string }, take = 0) =>
    buildPhraseSection({ kind, key: key as never, style, beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take })!

  it('vòng hợp âm: khung Rockhouse / khung Robert (IV ở ô 2) đổi theo lượt; giọng thứ i · bVI7 · V7; mỗi hợp âm 6 phách', () => {
    const G = { tonic: 7, scale: 'major' }
    expect(soan('interlude', G, 0).chords).toEqual(['G7', 'G7', 'G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7'])
    expect(soan('interlude', G, 9).chords).toEqual(['G7', 'C7', 'G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7'])
    expect(soan('intro', G).chords).toEqual(['C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7'])
    expect(soan('outro', G).chords).toEqual(['D7', 'C7', 'G7', 'G7', 'C7', 'D7', 'Ab7', 'G13'])
    const Am = { tonic: 9, scale: 'minor' }
    expect(soan('interlude', Am).chords).toEqual(['Am7', 'Am7', 'Am7', 'Am7', 'Dm7', 'Dm7', 'Am7', 'Am7', 'F7', 'E7', 'Am7', 'E7'])
    expect(soan('outro', Am).chords).toEqual(['F7', 'E7', 'Am7', 'Am7', 'Dm7', 'E7', 'Bb7', 'Am6/9'])
    for (const kind of ['intro', 'interlude'] as const) expect(soan(kind, Am).beatsEach.every(b => b === 3)).toBe(true)
    expect(soan('outro', Am).beatsEach).toEqual([3, 3, 3, 3, 3, 1.5, 1.5, 6])
  })

  it('mọi ô thân: tay phải có câu (chép nửa ô), tay trái bass ở phách 1 và 4; mọi giọng · mọi đoạn · nhiều lượt', () => {
    for (let tonic = 0; tonic < 12; tonic++) for (const scale of ['major', 'minor']) for (const kind of ['intro', 'interlude', 'outro'] as const) {
      for (const take of [0, 4, 9, 13]) {
        const s = soan(kind, { tonic, scale }, take)
        const ten = `${tonic}${scale} ${kind} lượt ${take}`
        expect(s.unavailableReason, ten).toBeUndefined()
        const soO = kind === 'outro' ? 5 : s.chords.length - 1
        for (let o = 0; o < soO; o++) {
          const trong = s.events.filter(e => e.startBeat >= o * 3 - 1e-9 && e.startBeat < o * 3 + 3 - 1e-9)
          expect(trong.some(e => e.hand === 'right'), `${ten} ô ${o + 1}`).toBe(true)
          if (kind !== 'outro' || o < 4) for (const p of [0, 1.5]) {
            const bass = trong.find(e => e.hand === 'left' && Math.abs(e.startBeat - o * 3 - p) < 1e-9)
            expect(bass, `${ten} ô ${o + 1} phách ${p * 2 + 1}`).toBeDefined()
          }
        }
        // Slow Blues: tay phải là câu chạy Rising Sun, tầm 55–96 (`chayBlueSun`). Cũ (Blues Claude, nửa ô Ray): ≤ 88.
        for (const e of s.events.filter(e => e.hand === 'right')) expect(Math.max(...e.notes)).toBeLessThanOrEqual(96)
      }
    }
  })

  it('ô báo cuối dạo / giang: MỘT cú mỗi tay, có bậc 3 của V7, tắt trước phách 6', () => {
    for (const kind of ['intro', 'interlude'] as const) {
      const s = soan(kind, { tonic: 9, scale: 'minor' })
      const dau = s.lengthBeats - 3
      const bao = s.events.filter(e => e.startBeat >= dau - 1e-9)
      expect(bao.map(e => e.hand).sort()).toEqual(['left', 'right'])
      for (const e of bao) expect(e.startBeat + e.durationBeats).toBeLessThanOrEqual(s.lengthBeats - .5 + 1e-9)
      expect(bao.find(e => e.hand === 'right')!.notes.some(n => pc(n) === 8)).toBe(true) // G# = bậc 3 của E7
    }
  })

  it('đuôi kết chép Rockhouse ô 114: bass V · bVI · bII (quãng tám) · I, tay phải bII7 rồi I13(#11)', () => {
    const s = soan('outro', { tonic: 7, scale: 'major' })
    const duoi = s.events.filter(e => e.startBeat >= 15 - 1e-9)
    expect(duoi.filter(e => e.hand === 'left').map(e => [e.startBeat, e.notes])).toEqual(
      [[15, [38]], [16, [39]], [16.5, [32, 44]], [18, [31, 43]], [21, [31, 43]]])
    expect(duoi.filter(e => e.hand === 'right').map(e => e.notes)).toEqual([[55], [54, 60, 63], [49, 53, 59, 64]])
    expect(s.lengthBeats).toBe(24)
  })

  it('mỗi lượt một câu khác (9 lượt → ít nhất 7 dãy nửa ô khác nhau)', () => {
    const day = new Set(Array.from({ length: 9 }, (_, t) => soan('interlude', { tonic: 0, scale: 'major' }, t).adaptationNote))
    expect(day.size).toBeGreaterThanOrEqual(7)
  })
})

describe('nhuongTayPhai', () => {
  it('bỏ hợp âm đệm tay phải bắt đầu trong câu, cắt hợp âm ngân vào câu, giữ tay trái', () => {
    const e = (hand: 'left' | 'right', startBeat: number, durationBeats: number) => ({ hand, startBeat, durationBeats })
    const ra = nhuongTayPhai([e('right', 0, 2), e('right', 2.5, .5), e('left', 2, 1), e('right', 4, .5)], [e('right', 1, 2)])
    expect(ra).toEqual([e('right', 0, 1), e('left', 2, 1), e('right', 4, .5)])
  })
})

describe('Blue Sun — The House of the Rising Sun: tay trái lo khung 6/8, tay phải chạy ngón', () => {
  const T = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  const nm = (m: number) => T[m % 12]! + String(Math.floor(m / 12) - 1)
  const pc = (n: number) => ((n % 12) + 12) % 12
  const VONG = 'Em G7 A7 C7 Em G7 B7 Em'
  const dung = (id: string, vong: string) => {
    const chords = parseChordInput(vong).chords
    return renderPattern(voiceLeadTwoHands(chords), getStyle(id)!, { beatsPerChord: 3 })
  }

  it('nút riêng: họ blue-sun, 6/8, ♩ = 92 (tốc độ thật của tiếng thu); tay trái gõ phách 1 · 4 · 6 (mạnh → nhẹ), tay phải của cell trống', () => {
    for (const id of ['blue-sun', 'blue-sun-chorus']) {
      const s = getStyle(id)!
      expect(s.family).toBe('blue-sun')
      expect(s.timeSignature).toBe('6/8')
      expect(s.bpm).toBe(92)
      expect(s.cell!.right).toEqual([])
      expect(s.cell!.left.map(h => h.beat)).toEqual([0, 3, 5])
      const [p1, p4, p6] = s.cell!.left.map(h => h.velocityScale!)
      expect(p1!).toBeGreaterThan(p4!)
      expect(p4!).toBeGreaterThan(p6!)
    }
    expect(getStyle('blues-claude-rs')).toBeUndefined()
  })

  it('tay trái trên vòng Rising Sun ra đúng nốt sheet: hợp âm phách 4 trong tay trái, bass dẫn nửa cung phách 6', () => {
    const ev = dung('blue-sun', VONG)
    expect(ev.filter(e => e.hand === 'right')).toEqual([])
    const tai = (phach: number) => ev.filter(e => e.hand === 'left' && Math.abs((e.startBeat % 3) - phach * .5) < 1e-6)
    expect(tai(5).map(e => nm(e.notes[0]!))).toEqual(['Gb2', 'Ab2', 'B2', 'Eb2', 'Gb2', 'Bb2', 'Eb2'])
    expect(tai(3)[2]!.notes.map(nm)).toEqual(['G3', 'A3', 'Db4', 'E4'])
    expect(tai(3)[0]!.notes.map(nm)).toEqual(['E3', 'G3', 'B3'])
    expect(tai(0).map(e => e.notes.map(nm).join('+')).slice(0, 3)).toEqual(['E2', 'G2+F3', 'A2+G3'])
  })

  // Lớp cao độ của một ô, dời về Mi thứ để so với kho Rising Sun.
  const veMi = (n: number, key: { tonic: number; scale: string }) => pc(n - key.tonic + 4 - (key.scale === 'major' ? 9 : 0))
  const BAI = [[VONG, { tonic: 4, scale: 'minor' }], ['Am Dm E7 Am F G C E7', { tonic: 9, scale: 'minor' }],
    ['C Am F G7 C Am Dm G7', { tonic: 0, scale: 'major' }]] as const

  // Ô của Rising Sun mà ô o của câu chép trọn (cùng dãy lớp cao độ, cùng số cú).
  const oNguon = (ev: { startBeat: number; notes: number[] }[], o: number, key: { tonic: number; scale: string }) => {
    const trong = ev.filter(e => e.startBeat >= o * 3 - 1e-9 && e.startBeat < o * 3 + 3 - 1e-9)
    const day = trong.map(e => e.notes.map(n => veMi(n, key)).join('+')).join(' ')
    return { trong, day, x: KHO_SUN.find(x => x.su.map(s => s[2].map(pc).join('+')).join(' ') === day) }
  }

  it('mỗi ô có giai điệu: TRỌN tay phải một ô Rising Sun (không cắt nửa ô, không để trống)', () => {
    for (const [vong, key] of BAI) {
      const chords = parseChordInput(vong).chords
      for (let take = 0; take < 6; take++) {
        const ev = chayBlueSun(chords, { key, beatsPerChord: 3, take })
        for (let o = 0; o < chords.length; o++) {
          const { trong, day, x } = oNguon(ev, o, key)
          expect(trong.length, `${vong} lượt ${take} ô ${o + 1}`).toBeGreaterThan(0)
          expect(x, `${vong} lượt ${take} ô ${o + 1}: ${day}`).toBeDefined()
        }
      }
    }
  })

  it('mật độ: ô dày (câu chạy / riff) ở khoảng 1/4 số ô, ô khác là câu thưa; trung vị 5–10 cú mỗi ô', () => {
    // Số đo (bản căn âm thanh): Rising Sun trung vị 9 cú mỗi ô, 10/16 ô dày; Rockhouse 25% ô có câu chạy (thước nửa ô).
    // Lượt 2 (trung vị 3) bị bác: "bạn đã bớt quá nhiều nốt tay phải".
    const cu: number[] = []
    let day = 0
    for (const [vong, key] of BAI) {
      const chords = parseChordInput(vong).chords
      for (let take = 0; take < 6; take++) {
        const ev = chayBlueSun(chords, { key, beatsPerChord: 3, take })
        for (let o = 0; o < chords.length; o++) {
          const { trong, x } = oNguon(ev, o, key)
          cu.push(trong.length)
          if (x!.kieu !== 'thua') day++
        }
      }
    }
    cu.sort((x, y) => x - y)
    console.log(`Blue Sun: ô dày ${day}/${cu.length} · cú mỗi ô trung vị ${cu[cu.length >> 1]}`)
    expect(day / cu.length).toBeGreaterThan(.15)
    expect(day / cu.length).toBeLessThan(.35)
    expect(cu[cu.length >> 1]!).toBeGreaterThanOrEqual(5)
    expect(cu[cu.length >> 1]!).toBeLessThanOrEqual(10)
  })

  it('có lời: ô dày đặt ở ô ca sĩ hết câu (giọng hỏi, đàn đáp); ô khác là câu thưa', () => {
    const key = { tonic: 4, scale: 'minor' }
    const chords = parseChordInput('Em G7 A7 C7').chords
    for (let take = 0; take < 6; take++) {
      const ev = chayBlueSun(chords, { key, beatsPerChord: 3, take, breaths: new Set([1, 3]) })
      expect([0, 1, 2, 3].map(o => oNguon(ev, o, key).x!.kieu !== 'thua'), `lượt ${take}`).toEqual([false, true, false, true])
    }
  })

  it('có riff (hình lặp) như sheet — ô riff Rising Sun (5/16 ô) có mặt trong ô dày', () => {
    let riff = 0, tong = 0
    for (const [vong, key] of BAI) {
      const chords = parseChordInput(vong).chords
      for (let take = 0; take < 6; take++) {
        const ev = chayBlueSun(chords, { key, beatsPerChord: 3, take })
        for (let o = 0; o < chords.length; o++) {
          const k = oNguon(ev, o, key).x!.kieu
          if (k === 'thua') continue
          tong++
          if (k === 'riff') riff++
        }
      }
    }
    console.log(`Blue Sun: ô dày lấy từ ô riff ${riff}/${tong}`)
    expect(riff).toBeGreaterThan(0)
  })

  it('không phô: bài giọng thứ và trưởng — 0 nốt lạc giọng (trừ nốt láy ở giọng trưởng)', () => {
    for (const [vong, key] of [['Am Dm E7 Am F G C E7', { tonic: 9, scale: 'minor' }], ['C Am F G7 C Am Dm G7', { tonic: 0, scale: 'major' }],
      ['Em Am B7 Em C D G B7', { tonic: 4, scale: 'minor' }]] as const) {
      for (let take = 0; take < 6; take++) {
        const ev = chayBlueSun(parseChordInput(vong).chords, { key, beatsPerChord: 3, take })
        ev.forEach((e, i) => {
          for (const n of e.notes) {
            // Nốt LƯỚT NỬA CUNG của sheet được miễn: Rising Sun ô 12 đi E → F → F# → G (dời sang La thứ: A → Bb → B).
            const ke = [...(ev[i - 1]?.notes ?? []), ...(ev[i + 1]?.notes ?? [])]
            if (ke.includes(n - 1) || ke.includes(n + 1)) continue
            const p = pc(n - key.tonic)
            if (key.scale === 'minor') expect([1, 4, 9].includes(p), `${vong} ${nm(n)}`).toBe(false)
          }
        })
      }
    }
  })

  it('dạo · giang · kết của Blue Sun: tay phải là câu chạy ngón Rising Sun, tay trái có hợp âm phách 4', () => {
    const style = getStyle('blue-sun')!
    for (const scale of ['major', 'minor']) for (const kind of ['intro', 'interlude', 'outro'] as const) {
      const s = buildPhraseSection({ kind, key: { tonic: 7, scale } as never, style, beatsPerChord: 3, dropRoot: false, opening: null, solo: () => [], take: 0 })!
      expect(s.unavailableReason).toBeUndefined()
      expect(s.events.some(e => e.hand === 'right')).toBe(true)
      expect(s.events.some(e => e.hand === 'left' && e.notes.length >= 3 && Math.abs((e.startBeat % 3) - 1.5) < 1e-6)).toBe(true)
    }
  })
})
