import { describe, expect, it } from 'vitest'
import { CHORUS_PAIRS } from '../../reharm/style/sectionStyles'
import { TEACHERS } from '../teachers'
import type { BaiTap } from '../baiTap'

/* Đọc thẳng các tệp đã sinh (tools/sinhBaiTap.mjs) — sinh lại hỏng thì đỏ ở đây trước khi tới tay người dùng. */
const files = import.meta.glob<BaiTap>('../baiTap/*.json', { eager: true, import: 'default' })
const bai = new Map(Object.values(files).map((one) => [one.styleId, one]))

describe('bài tập điệu — bản đóng băng', () => {
  it('mọi điệu của bốn thầy đều có bài tập', () => {
    for (const teacher of TEACHERS) {
      for (const id of teacher.styleIds) expect(bai.has(id), `${teacher.label}: ${id}`).toBe(true)
    }
  })

  it('vòng tập 4 ô, vòng kiểm dài hơn, mọi tiếng nằm trong vòng', () => {
    for (const one of bai.values()) {
      expect(one.tap.phach.reduce((a, b) => a + b, 0), one.styleId).toBe(one.tap.doDai)
      expect(one.kiem.doDai, one.styleId).toBeGreaterThan(one.tap.doDai)
      for (const vong of [one.tap, one.kiem]) {
        expect(vong.timeline.length, one.styleId).toBeGreaterThan(0)
        for (const event of vong.timeline) {
          expect(event.startBeat, one.styleId).toBeGreaterThanOrEqual(0)
          expect(event.startBeat, one.styleId).toBeLessThan(vong.doDai)
        }
      }
    }
  })

  it('bài điệp khúc chơi tiết tấu điệp, khác bài phiên (cũ: dựng không đánh dấu đoạn → giống hệt bài phiên từng byte)', () => {
    let soCap = 0
    for (const [phien, diep] of Object.entries(CHORUS_PAIRS)) {
      const a = bai.get(phien)
      const b = bai.get(diep)
      if (!a || !b) continue
      soCap += 1
      expect(JSON.stringify(b.tap.timeline), diep).not.toBe(JSON.stringify(a.tap.timeline))
    }
    expect(soCap).toBe(2)
  })

  /*
    Luật "nốt đệm phải đánh được bằng tay người": hai cú liền nhau của một tay mà phủ quá quãng tám thì tay phải dời thế — không
    kịp trong dưới 100 ms (ĐOÁN, chưa đo). Gặp ở Slow Blues 2/10/2026 (nốt cuối câu chạy ô trước dính đầu câu ô sau: D6 → A4 27 ms,
    C6 → A4 82 ms; 3 chỗ vòng tập, 5 chỗ vòng kiểm) → người dùng duyệt coi nốt trước là nốt láy (`grace`): tiếng giữ nguyên, không
    chấm. Sinh lại mà đỏ ở đây thì làm y như vậy.
  */
  it('không cú chấm điểm nào bắt một tay dời thế quá quãng tám trong dưới 100 ms', () => {
    for (const one of bai.values()) {
      const msMoiPhach = 60000 / one.bpm
      for (const vong of [one.tap, one.kiem]) {
        for (const hand of ['left', 'right'] as const) {
          const theoLuc = new Map<number, number[]>()
          for (const event of vong.timeline) {
            if (event.hand !== hand || event.grace) continue
            const t = Math.round(event.startBeat * 1e5) / 1e5
            theoLuc.set(t, [...(theoLuc.get(t) ?? []), ...event.notes])
          }
          const cu = [...theoLuc.entries()].sort((a, b) => a[0] - b[0])
          const nhanh = cu.flatMap(([t, notes], i) => {
            const [t2, notes2] = cu[(i + 1) % cu.length]!
            const ms = (((t2 - t + vong.doDai) % vong.doDai) || vong.doDai) * msMoiPhach
            const hai = [...notes, ...notes2]
            return Math.max(...hai) - Math.min(...hai) > 12 && ms < 100 ? [`phách ${t} → ${t2}: ${Math.round(ms)} ms`] : []
          })
          expect(nhanh, `${one.styleId} ${hand}`).toEqual([])
        }
      }
    }
  })

  it('giọng tập: Đô trưởng hoặc La thứ (người dùng 2/10/2026)', () => {
    for (const one of bai.values()) expect(['Đô trưởng', 'La thứ']).toContain(one.giong)
  })
})
