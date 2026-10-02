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

  it('giọng tập: Đô trưởng hoặc La thứ (người dùng 2/10/2026)', () => {
    for (const one of bai.values()) expect(['Đô trưởng', 'La thứ']).toContain(one.giong)
  })
})
