import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { generateSolo } from '../soloGenerator'
import {
  LICKS,
  fallbackLick,
  licksFor,
  type LickRole,
} from '../soloVocabulary'

/**
 * Vốn từ vựng phải tự mô tả đủ về mình.
 *
 * Bản trước giữ hai danh sách `OPENERS`/`MIDDLES` viết tay ở `soloGenerator.ts`,
 * tách rời khỏi chỗ định nghĩa mẫu. Thêm mẫu mà quên thêm vào danh sách thì mẫu
 * đó không bao giờ được chọn — và chuyện đó đã xảy ra thật: có lúc **nửa vốn từ
 * vựng nằm chết** mà chỉ phát hiện được khi in kết quả ra đọc.
 *
 * Nay vai trò khai ngay trong mẫu, danh sách suy ra từ đó. Nhóm test này giữ
 * cho việc thêm mẫu mới về sau chỉ cần sửa đúng một chỗ.
 */

const ROLES: LickRole[] = ['opener', 'middle', 'ending', 'rest']

describe('khai báo của từng mẫu câu', () => {
  it('mẫu nào cũng khai vai trò, nguồn và nhãn', () => {
    for (const lick of LICKS) {
      expect(lick.roles.length, lick.id).toBeGreaterThan(0)
      expect(lick.source.length, lick.id).toBeGreaterThan(0)
      expect(lick.label.length, lick.id).toBeGreaterThan(0)
    }
  })

  it('mọi vai trò khai ra đều hợp lệ', () => {
    for (const lick of LICKS) {
      for (const role of lick.roles) expect(ROLES).toContain(role)
    }
  })

  it('định danh không trùng nhau', () => {
    const ids = LICKS.map((lick) => lick.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('danh sách xoay suy ra từ vốn từ vựng', () => {
  it('mọi vai trò đều có ít nhất một mẫu đang dùng', () => {
    // Thiếu một vai trò là bộ sinh sẽ lùi về mẫu nền tảng ở chỗ đó
    for (const role of ROLES) {
      expect(licksFor(role).length, role).toBeGreaterThan(0)
    }
  })

  it('chỉ lấy mẫu đã bật, đúng thứ tự khai trong vốn từ vựng', () => {
    for (const role of ROLES) {
      const derived = licksFor(role).map((lick) => lick.id)
      const expected = LICKS.filter(
        (lick) => lick.inRotation && lick.roles.includes(role),
      ).map((lick) => lick.id)

      expect(derived).toEqual(expected)
    }
  })

  it('mẫu chưa bật không lọt vào danh sách nào', () => {
    /*
      Không đòi danh sách chờ phải còn mẫu. Cả vốn từ vựng đã nghe duyệt xong
      thì danh sách rỗng là đúng, và bắt nó luôn khác rỗng chỉ làm test đỏ ở
      đúng lúc mọi thứ đã ổn.
    */
    const waiting = LICKS.filter((lick) => !lick.inRotation)

    for (const role of ROLES) {
      const ids = licksFor(role).map((lick) => lick.id)
      for (const lick of waiting) expect(ids).not.toContain(lick.id)
    }
  })

  it('mẫu lùi về là mẫu kết câu, vì nó luôn kết ở nốt ổn định', () => {
    expect(fallbackLick().roles).toContain('ending')
    expect(fallbackLick().inRotation).toBe(true)
  })

  it('thứ tự xoay hiện tại đúng như đã nghe duyệt', () => {
    /*
      Khoá lại **cả bốn vai trò**, để lần sắp xếp sau không đổi âm thanh mà
      không ai biết.

      Bản đầu chỉ khoá `opener` và `middle`, nên khi bật mẫu `guide-tone` vào
      vai `ending` thì test vẫn xanh — đúng chỗ lưới an toàn này sinh ra để bắt
      lại lọt qua. Bật một mẫu là đổi tiếng đàn, và phải nghe duyệt từng cái
      một; không khoá thì không có gì buộc người sửa dừng lại mà nghe.
    */
    expect(licksFor('opener').map((lick) => lick.id)).toEqual([
      'arpeggio',
      'chord-tone',
      'sweep',
      'triplet',
    ])
    expect(licksFor('middle').map((lick) => lick.id)).toEqual([
      'turn',
      'approach',
      'echo',
      'enclosure',
      'triplet',
    ])
    expect(licksFor('ending').map((lick) => lick.id)).toEqual([
      'chord-tone',
      'guide-tone',
    ])
    expect(licksFor('rest').map((lick) => lick.id)).toEqual(['breath'])
  })
})

describe('số câu giang tấu khác nhau', () => {
  /*
    Người dùng yêu cầu "mỗi lần giang tấu là một cái gì mới khác nhau". Chỗ
    quyết định điều đó là cách xoay mẫu câu theo lượt.
  */
  const CHORDS = 'Cadd9 Am9 Fadd9 G7'

  const shapeOfTake = (take: number) =>
    generateSolo(parseChordInput(CHORDS).chords, {
      beatsPerChord: 4,
      density: 'medium',
      graceDensity: 'none',
      key: { tonic: 0, scale: 'major' },
      take,
    })
      .map((note) => note.note)
      .join(' ')

  it('mở câu và kết câu quay như hai bánh xe, không cùng tốc độ', () => {
    /*
      Cộng thẳng cùng một số vào cả hai chỗ thì hai bánh quay cùng nhịp và chu
      kỳ co lại còn bằng danh sách dài hơn. Quay lệch nhau thì số câu khác nhau
      bằng **tích** hai danh sách.
    */
    const shapes = new Set(
      Array.from({ length: 12 }, (_, take) => shapeOfTake(take)),
    )

    const expected = licksFor('opener').length * licksFor('ending').length
    expect(shapes.size).toBe(Math.min(12, expected))
  })

  it('hai lượt liên tiếp không bao giờ giống nhau', () => {
    for (let take = 0; take < 8; take += 1) {
      expect(shapeOfTake(take)).not.toBe(shapeOfTake(take + 1))
    }
  })
})
