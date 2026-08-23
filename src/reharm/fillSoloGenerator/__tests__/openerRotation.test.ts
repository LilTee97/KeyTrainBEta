import { describe, expect, it } from 'vitest'
import { generateSolo } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'

/**
 * Mẫu câu mới phải **thật sự được chọn**, không chỉ nằm trong danh sách.
 *
 * Đo ra mới thấy: `chooseLick` chỉ được gọi tới ở ô kết câu, còn ô mở câu bị
 * viết cứng đúng hai mẫu — nên `scale-run` và `bebop-pair` nằm trong vòng xoay
 * mà không lần nào chạy. Bài học: có mặt trong `LICKS` không có nghĩa là được
 * dùng; phải đo chỗ gọi.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }

/** Hình dạng một ô: khoảng cách giữa các nốt chính, đủ để nhận ra ngón nào. */
const shapeOfBar = (prog: string, take: number, bar: number) => {
  const notes = generateSolo(parseChordInput(prog).chords, {
    beatsPerChord: 4,
    density: 'dense',
    key: KEY,
    take,
    noteSource: 'storeScale',
    interlude: true,
    storeScale: scaleForChord,
  })
    .filter((n) => !n.isGrace && !n.ornament && n.startBeat >= bar * 4 && n.startBeat < (bar + 1) * 4)
    .map((n) => n.note)
  return notes.slice(1).map((note, at) => note - notes[at])
}

describe('ô mở câu xoay đủ bốn ngón', () => {
  it('lượt đầu giữ nguyên thứ tự đã nghe duyệt', () => {
    // Quét ngũ cung ở ô 1, cụm bao vây ở ô 3 — không đổi tiếng của lượt đầu.
    const bar1 = shapeOfBar('Dm7 G7 Cmaj7 Cmaj7', 0, 0)
    expect(bar1.length).toBeGreaterThan(4)
  })

  it('lượt sau đổi ngón, không lặp lại lượt trước', () => {
    const takes = [0, 1, 2, 3].map((take) => shapeOfBar('Dm7 G7 Cmaj7 Cmaj7', take, 0).join(','))
    expect(new Set(takes).size, `bốn lượt ra ${new Set(takes).size} hình`).toBeGreaterThan(2)
  })

  it('có lượt ra câu chạy dọc gam thật: liền bậc suốt một ô', () => {
    /*
      Câu chạy dọc gam nhận ra bằng chính đặc điểm của nó: mọi bước không quá
      một cung, và không quá một lần quay đầu trong ô.
    */
    const found = [0, 1, 2, 3, 4, 5, 6, 7].some((take) => {
      const steps = shapeOfBar('G7 G7 G7 G7', take, 0)
      if (steps.length < 4) return false
      const stepwise = steps.every((gap) => Math.abs(gap) <= 2)
      const turns = steps.filter((gap, at) => at > 0 && Math.sign(gap) !== Math.sign(steps[at - 1]))
      return stepwise && turns.length <= 1
    })
    expect(found, 'không lượt nào ra câu chạy dọc gam').toBe(true)
  })

  it('có lượt ra hình rải-lên-gam-xuống trên hợp âm át', () => {
    /*
      Nhận ra bằng **hai cụm ngược chiều**: một cụm chồng quãng ba (mỗi bước ba
      hoặc bốn nửa cung) đứng cạnh một cụm đi từng bậc gam. Bài giảng có cả hai
      chiều — Type 1 rải trước, Type 2 gam trước — nên chấp cả hai.
    */
    const isArp = (gaps: number[]) => gaps.length >= 2 && gaps.every((g) => Math.abs(g) >= 3 && Math.abs(g) <= 5)
    const isScale = (gaps: number[]) => gaps.length >= 3 && gaps.every((g) => Math.abs(g) <= 2)

    const found = [0, 1, 2, 3, 4, 5, 6, 7].some((take) => {
      const steps = shapeOfBar('G7 G7 G7 G7', take, 0)
      if (steps.length < 6) return false
      for (let cut = 3; cut <= steps.length - 2; cut += 1) {
        const head = steps.slice(0, cut)
        const tail = steps.slice(cut)
        if (isArp(head) && isScale(tail)) return true
        if (isScale(head) && isArp(tail)) return true
      }
      return false
    })
    expect(found, 'không lượt nào ra hình rải-lên-gam-xuống').toBe(true)
  })
})
