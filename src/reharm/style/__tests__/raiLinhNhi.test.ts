import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { raiLinhNhi } from '../raiLinhNhi'
import { soloLeftHand } from '../soloLeftHand'
import { getStyle } from '../styleLibrary'
import type { TimelineEvent } from '../types'

/*
  TAY PHẢI GIANG TẤU BÁM VÀO TAY TRÁI.

  Bộ sinh trước cho tay phải bốc nốt từ thang gam mà KHÔNG hề biết tay trái đang
  giữ nốt gì ở thời điểm ấy, rồi mới để `interlockHands` xen vào tỉa bớt. Hai
  luồng xa lạ ghép lại, và người dùng nghe ra ngay: "tay phải quá rời rạc với
  tay trái".

  Đo mười ô giang tấu bản ký âm Linh Nhi:

    mốc gõ có CẢ HAI tay   55%   (phiên khúc chỉ 45% — vào giang tấu thì hai
                                  tay gõ cùng nhau NHIỀU HƠN, không ít hơn)
    nốt trùng lớp cao độ   47%   (phiên khúc 31%)
    khe hai tay            24 nửa cung, hẹp nhất 9
    tay phải xuống dưới     0%
    hai tay cùng hướng     52%   — tức đường nét ĐỘC LẬP

  Hai tay khoá nhau ở NHỊP và LỚP CAO ĐỘ; đường nét thì tự do.

  CỠ MẪU: một bài, một người soạn, một đoạn mười ô, và là bản độc tấu.
*/

const CHORDS = parseChordInput('Bm F#m Em D Bm Em F#m D A').chords
const STYLE = getStyle('bolero-linh-nhi-2')!
const BAR = STYLE.beatsPerMeasure

function dung(take: number) {
  const left = soloLeftHand({ chords: CHORDS, beatsEach: CHORDS.map(() => BAR), style: STYLE })
  const right = raiLinhNhi({
    left,
    chords: CHORDS,
    beatsPerChord: BAR,
    range: { low: 57, high: 95 },
    take,
  })
  return { left, right }
}

/** Gom hai tay theo mốc gõ. */
function mocGo(left: readonly TimelineEvent[], right: readonly TimelineEvent[]) {
  const at = new Map<number, { l: number[]; r: number[] }>()
  const bo = (list: readonly TimelineEvent[], tay: 'l' | 'r') => {
    for (const event of list) {
      const key = Number(event.startBeat.toFixed(3))
      const o = at.get(key) ?? { l: [], r: [] }
      o[tay].push(...event.notes)
      at.set(key, o)
    }
  }
  bo(left, 'l')
  bo(right, 'r')
  return [...at.values()]
}

const trungBinh = (f: (take: number) => number) =>
  Array.from({ length: 12 }, (_, take) => f(take)).reduce((a, b) => a + b, 0) / 12

describe('tay phải giang tấu bám vào tay trái', () => {
  it('quá nửa số mốc gõ có CẢ HAI tay', () => {
    const ti = trungBinh((take) => {
      const { left, right } = dung(take)
      const moc = mocGo(left, right)
      return moc.filter((v) => v.l.length && v.r.length).length / moc.length
    })
    expect(ti).toBeGreaterThan(0.45)
    expect(ti).toBeLessThan(0.65)
  })

  /*
    Đây là chỗ hai tay dính vào nhau: tay phải chơi lại chính lớp cao độ tay
    trái đang giữ, nâng lên cao. Không có nó thì hai tay lại thành hai luồng.
  */
  it('gần một nửa số mốc chung có nốt trùng lớp cao độ', () => {
    const ti = trungBinh((take) => {
      const { left, right } = dung(take)
      const ca = mocGo(left, right).filter((v) => v.l.length && v.r.length)
      return ca.filter((v) => v.r.some((x) => v.l.some((y) => (x - y) % 12 === 0))).length / ca.length
    })
    expect(ti).toBeGreaterThan(0.35)
    expect(ti).toBeLessThan(0.65)
  })

  /*
    LUẬT CỨNG, không phải xu hướng: số đo cho đúng 0% số mốc tay phải xuống dưới
    tay trái. Bắt chéo tay là thứ bản gốc không làm lần nào.
  */
  it('tay phải KHÔNG BAO GIỜ xuống dưới tay trái', () => {
    for (let take = 0; take < 12; take += 1) {
      const { left, right } = dung(take)
      for (const v of mocGo(left, right)) {
        if (!v.l.length || !v.r.length) continue
        expect(Math.min(...v.r)).toBeGreaterThan(Math.max(...v.l))
      }
    }
  })

  it('khe giữa hai tay quanh hai quãng tám', () => {
    const khe: number[] = []
    for (let take = 0; take < 12; take += 1) {
      const { left, right } = dung(take)
      for (const v of mocGo(left, right)) {
        if (v.l.length && v.r.length) khe.push(Math.min(...v.r) - Math.max(...v.l))
      }
    }
    khe.sort((a, b) => a - b)
    const giua = khe[Math.floor(khe.length / 2)]!
    expect(giua).toBeGreaterThanOrEqual(17)
    expect(giua).toBeLessThanOrEqual(30)
    expect(Math.min(...khe)).toBeGreaterThanOrEqual(9)
  })

  it('chồng nốt đúng khoảng đo được', () => {
    const ti = trungBinh((take) => {
      const { right } = dung(take)
      const at = new Map<number, number>()
      for (const e of right) {
        const k = Number(e.startBeat.toFixed(3))
        at.set(k, (at.get(k) ?? 0) + e.notes.length)
      }
      return [...at.values()].filter((v) => v > 1).length / at.size
    })
    expect(ti).toBeGreaterThan(0.25)
    expect(ti).toBeLessThan(0.5)
  })

  it('mật độ tay phải gần bản gốc', () => {
    const moiO = trungBinh((take) => dung(take).right.length / CHORDS.length)
    expect(moiO).toBeGreaterThan(7)
    expect(moiO).toBeLessThan(11)
  })

  it('không có tay trái thì không sinh gì', () => {
    expect(raiLinhNhi({ left: [], chords: CHORDS, beatsPerChord: BAR, range: { low: 57, high: 95 } }))
      .toEqual([])
  })

  it('mỗi lượt cho một đường khác nhau', () => {
    const cua = (take: number) => dung(take).right.map((e) => e.notes.join()).join('|')
    expect(cua(0)).not.toBe(cua(1))
    expect(cua(3)).toBe(cua(3))
  })
})
