import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { chayBlueDucThinh, gamBlues } from '../blueDucThinhLicks'
import { hoCuaDieu } from '../hoDieu'
import { getStyle, isCodexStyle } from '../styleLibrary'

const style = getStyle('blues-duc-thinh')!
const mau3 = getStyle('slow-rock-duc-thinh-3')!

describe('Blues Đức Thịnh — nút riêng, tách khỏi Blues ĐT của Codex', () => {
  it('tiết tấu y hệt Slow Rock mẫu 3 của thầy Đức Thịnh — không đổi một cú gõ', () => {
    // Thầy nói nguyên văn: mẫu này ĐÃ LÀ Blues, chỉ thiếu nốt bậc 5 giáng. Nên phần đệm không đổi.
    expect(style.cell).toEqual(mau3.cell)
    expect(style.timeSignature).toBe(mau3.timeSignature)
    expect(style.gridUnit).toBe(mau3.gridUnit)
    expect(style.bpm).toBe(mau3.bpm)
  })

  it('id · family · tên tách biệt hoàn toàn khỏi mẫu Slow Rock (Đức Thịnh) và khỏi Codex', () => {
    expect(style.id).not.toBe(mau3.id)
    expect(style.family).not.toBe(mau3.family)
    expect(style.family).toBe('blues-duc-thinh')
    expect(style.name).toBe('Blues Đức Thịnh')
    expect(isCodexStyle(style.id)).toBe(false)
  })

  it('đứng ngoài mọi họ điệu (hoDieu) — không dính cổng màu/solo Linh Nhi của họ Slow Rock', () => {
    expect(hoCuaDieu(style.id)).toBeNull()
  })
})

describe('câu lick Blues Đức Thịnh — biên soạn theo lý thuyết, không đo từ sheet', () => {
  const chord = parseChordInput('C7').chords[0]!
  const next = parseChordInput('F7').chords[0]!

  it('mọi lượt: nốt nằm gọn trong ô, tay phải, tầm đàn hợp lý', () => {
    for (let take = 0; take < 12; take += 1) {
      const r = chayBlueDucThinh({ chord, next, endBeat: 3, beats: 3, take })!
      expect(r.length, `take ${take}`).toBeGreaterThan(0)
      const sorted = [...r].sort((a, b) => a.startBeat - b.startBeat)
      for (const x of r) {
        expect(x.hand).toBe('right')
        expect(x.startBeat).toBeGreaterThanOrEqual(0)
        // Mọi nốt bắt đầu trước hoặc đúng vạch nhịp; chỉ nốt HẠ CÁNH cuối câu (nối sang hợp âm sau,
        // như `chayLinhNhi`) được phép ngân qua vạch — nó khởi ở đúng vạch rồi kéo dài sang ô sau.
        expect(x.startBeat, `take ${take}`).toBeLessThanOrEqual(3 + 1e-6)
        if (x !== sorted[sorted.length - 1]) {
          expect(x.startBeat + x.durationBeats, `take ${take}`).toBeLessThanOrEqual(3 + 1e-6)
        }
        expect(x.note).toBeGreaterThanOrEqual(55)
        expect(x.note).toBeLessThanOrEqual(96)
      }
      // Câu liền mạch: nốt sau nối đúng chỗ nốt trước dứt, không chồng, không hở.
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i]!.startBeat, `take ${take}`).toBeCloseTo(sorted[i - 1]!.startBeat + sorted[i - 1]!.durationBeats, 6)
      }
    }
  })

  it('ô quá ngắn (< lick ngắn nhất) thì trả null, không cắt cụt câu', () => {
    expect(chayBlueDucThinh({ chord, next, endBeat: 3, beats: 0.2, take: 0 })).toBeNull()
  })

  it('nốt là nốt gam Blues của hợp âm đang vang/hợp âm sau, hoặc nốt bậc ba của chính hợp âm ấy (chord-tone soloing)', () => {
    for (let take = 0; take < 12; take += 1) {
      const r = chayBlueDucThinh({ chord, next, endBeat: 3, beats: 3, take })!
      const gam = new Set([...gamBlues(chord.root), ...gamBlues(next.root),
        (chord.root + 4) % 12, (next.root + 4) % 12])
      for (const x of r) expect(gam.has(x.note % 12), `take ${take} note ${x.note}`).toBe(true)
    }
  })

  it('đổi hợp âm thì câu lick đổi theo — không phải một hình cố định dịch nguyên khối', () => {
    const g7 = parseChordInput('G7').chords[0]!
    const notesFor = (c: typeof chord, n: typeof next, take: number) =>
      chayBlueDucThinh({ chord: c, next: n, endBeat: 3, beats: 3, take })!.map((x) => x.note % 12).join(',')
    let doi = 0
    for (let take = 0; take < 12; take += 1) if (notesFor(chord, next, take) !== notesFor(g7, next, take)) doi += 1
    expect(doi).toBeGreaterThan(0)
  })

  it('nhiều lượt ra nhiều câu khác nhau — không phải một câu lặp lại', () => {
    const cau = new Set(Array.from({ length: 12 }, (_, take) =>
      chayBlueDucThinh({ chord, next, endBeat: 3, beats: 3, take })!.map((x) => `${x.startBeat}:${x.note}`).join('|')))
    expect(cau.size).toBeGreaterThanOrEqual(4)
  })
})
