import { describe, expect, it } from 'vitest'
import { ask, brain, brainReady, brainSummary } from '../index'

/**
 * Kiểm cái cầu nối sang PianoBrain, không kiểm lại luật nhạc — luật đã có
 * 199 bài kiểm bên repo não. Ở đây chỉ cần chắc ba việc: kho nạp được trong
 * trình duyệt, nhãn thầy giữ nguyên, và thầy Hải không bị nguồn mới che.
 */
describe('cầu nối PianoBrain', () => {
  it('nạp được kho mà không cần đọc đĩa lúc chạy', () => {
    expect(brainReady()).toBe(true)
    const kb = brain()
    expect(kb.items.length).toBeGreaterThan(700)
    expect(kb.sources.length).toBeGreaterThan(50)
    expect(kb.byId.get('kingsley-sus2-to-3')).toBeTruthy()
  })

  it('tóm tắt kho đếm đủ số thầy', () => {
    expect(brainSummary()).toMatch(/item · \d+ nguồn · [3-9] thầy/)
  })

  it('hỏi fill sus2 sang 3 thì ra Kingsley, không ra thầy Hải', () => {
    const out = ask('fill sus2 sang 3 ballad').join('\n')
    expect(out).toMatch(/kingsley-sus2-to-3/)
    expect(out).not.toMatch(/hai-joseph/)
  })

  it('câu lót C G Am F không dùng 1-7-5-3 vào Am, và thầy Hải đứng trước', () => {
    const lines = ask('câu lót C G Am F')
    const out = lines.join('\n')
    expect(out).toMatch(/preceding 3-2-1/)
    expect(out).not.toMatch(/C5 - B4 - G4 - E4/)

    const hai = lines.findIndex((l) => l.includes('[hai-joseph]'))
    const kingsley = lines.findIndex((l) => l.includes('suy từ kingsley'))
    expect(hai).toBeGreaterThanOrEqual(0)
    expect(hai).toBeLessThan(kingsley)
  })

  it('câu lót C Am F G thì mới được 1-7-5-3', () => {
    expect(ask('câu lót C Am F G').join('\n')).toMatch(/C5 - B4 - G4 - E4/)
  })

  it('hỏi chung về bossa thì liệt kê cả hai trường phái, không giấu thầy Hải', () => {
    const out = ask('bossa nova tay trái').join('\n')
    expect(out).toMatch(/hai-joseph/)
    expect(out).toMatch(/peter-martin/)
    expect(out).toMatch(/trường phái/)
  })

  it('hỏi đích danh thầy Hải về lick thì nói CHƯA, không mượn nguồn khác', () => {
    const out = ask('thầy Hải dạy lick ii-V-I chưa').join('\n')
    expect(out).toMatch(/CHƯA CÓ/)
    expect(out).toMatch(/hỏi riêng về hai-joseph/)
  })

  it('đọc được chỗ ca sĩ nghỉ gõ ngay trong câu', () => {
    expect(ask('câu lót C G Am F ô 3 nghỉ').join('\n')).toMatch(/đúng ô ca sĩ nghỉ/)
    expect(ask('câu lót C G Am F hát kín').join('\n')).toMatch(/không lót/)
  })

  it('vòng lạ thì báo thiếu chứ không bịa', () => {
    const out = ask('phối Db Gb Abm Cb').join('\n')
    expect(out).toMatch(/Kho chưa có bảng màu nào/)
    expect(out).not.toMatch(/\[hai-joseph\]|\[kingsley\]/)
  })
})
