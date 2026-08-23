import { describe, expect, it } from 'vitest'
import { brain } from '../index'
import { scaleForChord, scaleGaps } from '../chordScale'
import { parseChordInput } from '../../input/chordInputParser'

/**
 * Kho mà app đang đọc phải là kho **hiện tại**, không phải bản chụp lúc khởi động.
 *
 * Plugin nạp kho vào một module ảo và Vite giữ nó trong bộ nhớ. Rà xong 28 item
 * gam thành `validated`, test bên terminal xanh hết, mà app vẫn báo "kho chưa có
 * gam cho Cmaj7, Am7, Fmaj7, G7" — vì trong trình duyệt chúng vẫn đang là
 * `draft`. Test này đứng đây để chuyện ấy có chỗ bám mà kiểm.
 */
describe('kho app đọc được là kho hiện tại', () => {
  it('có item gam đã rà', () => {
    const reviewed = brain().items.filter(
      (item) =>
        item.source?.teacher_id === 'jazz-scales' &&
        item.status === 'validated' &&
        ((item.output as { scale?: { for_qualities?: string[] } }).scale?.for_qualities?.length ?? 0) > 0,
    )
    /*
      Khoá **sàn**, không khoá con số: số item đã rà chỉ có tăng, và mỗi lần
      người rà xong một bài mà test đỏ thì lưới an toàn quay ra chặn đúng việc
      nó muốn khuyến khích. Bằng 0 mới là dấu hiệu app đang đọc kho cũ.
    */
    expect(reviewed.length, 'không thấy item gam nào đã rà — kho app đọc là bản cũ?').toBeGreaterThanOrEqual(28)
  })

  it('vòng hợp âm quen thuộc KHÔNG bị báo là thiếu gam', () => {
    // Đúng vòng người dùng chụp màn hình: cả bốn hợp âm đều có gam trong kho.
    const chords = parseChordInput('Cmaj7 Am7 Fmaj7 G7').chords
    expect(scaleGaps(chords)).toEqual([])
    for (const chord of chords) {
      expect(scaleForChord(chord)).not.toBeNull()
    }
  })
})
