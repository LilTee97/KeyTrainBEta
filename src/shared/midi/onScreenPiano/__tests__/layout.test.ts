import { describe, expect, it } from 'vitest'
import { isBlackKey } from '../../../musicTheory/pitch'
import { buildKeyboardLayout, keyPlacement } from '../layout'

describe('buildKeyboardLayout', () => {
  it('một quãng tám có 7 phím trắng và 5 phím đen', () => {
    // C4 tới B4
    const { whiteKeys, blackKeys } = buildKeyboardLayout(60, 71)
    expect(whiteKeys).toHaveLength(7)
    expect(blackKeys).toHaveLength(5)
  })

  it('đánh số phím trắng liên tục từ 0', () => {
    const { whiteKeys } = buildKeyboardLayout(60, 71)
    expect(whiteKeys.map((key) => key.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('phím trắng đúng là các nốt trắng của quãng tám', () => {
    const { whiteKeys } = buildKeyboardLayout(60, 71)
    expect(whiteKeys.map((key) => key.note)).toEqual([
      60, 62, 64, 65, 67, 69, 71,
    ])
  })

  it('phân loại trắng đen khớp với isBlackKey', () => {
    const { whiteKeys, blackKeys } = buildKeyboardLayout(48, 84)
    for (const key of whiteKeys) expect(isBlackKey(key.note)).toBe(false)
    for (const key of blackKeys) expect(isBlackKey(key.note)).toBe(true)
  })

  it('không bỏ sót nốt nào trong dải', () => {
    const low = 48
    const high = 84
    const { whiteKeys, blackKeys } = buildKeyboardLayout(low, high)

    const covered = new Set([
      ...whiteKeys.map((key) => key.note),
      ...blackKeys.map((key) => key.note),
    ])
    for (let note = low; note <= high; note += 1) {
      expect(covered.has(note)).toBe(true)
    }
  })

  it('vị trí phím đen nằm trong khoảng 0 tới 1', () => {
    const { blackKeys } = buildKeyboardLayout(48, 84)
    for (const key of blackKeys) {
      expect(key.position).toBeGreaterThan(0)
      expect(key.position).toBeLessThan(1)
    }
  })

  it('phím đen nằm đúng khe giữa hai phím trắng kề nó', () => {
    const { whiteKeys, blackKeys } = buildKeyboardLayout(60, 71)
    const width = 1 / whiteKeys.length

    // C#4 nằm giữa C4 (phím trắng 0) và D4 (phím trắng 1)
    const cSharp = blackKeys.find((key) => key.note === 61)
    expect(cSharp?.position).toBeCloseTo(width)

    // A#4 nằm giữa A4 (phím trắng 5) và B4 (phím trắng 6)
    const aSharp = blackKeys.find((key) => key.note === 70)
    expect(aSharp?.position).toBeCloseTo(width * 6)
  })

  it('bỏ phím đen ở rìa phải vì không có phím trắng bên phải để kê', () => {
    // C4 tới A#4: A#4 là nốt cuối, phím trắng cuối là A4
    const { blackKeys } = buildKeyboardLayout(60, 70)
    expect(blackKeys.map((key) => key.note)).not.toContain(70)
  })

  it('bỏ phím đen ở rìa trái vì không có phím trắng bên trái để kê', () => {
    // Bắt đầu ngay từ C#4
    const { blackKeys } = buildKeyboardLayout(61, 71)
    expect(blackKeys.map((key) => key.note)).not.toContain(61)
  })

  it('trả về bố cục rỗng khi dải nốt không hợp lệ', () => {
    const { whiteKeys, blackKeys } = buildKeyboardLayout(72, 60)
    expect(whiteKeys).toEqual([])
    expect(blackKeys).toEqual([])
  })

  it('dải mặc định của bàn phím ảo là ba quãng tám', () => {
    // C3 tới C6
    const { whiteKeys } = buildKeyboardLayout(48, 84)
    expect(whiteKeys).toHaveLength(22)
  })
})

describe('keyPlacement', () => {
  /*
    Nốt rơi phải đáp xuống đúng phím của nó. Sai chỗ đứng ngang là nốt rơi nói
    dối người tập — họ nhìn thấy nốt đang rơi về một phím rồi bấm phím đó.
  */
  const layout = buildKeyboardLayout(48, 84)

  it('phím trắng chiếm trọn ô của nó, không chừa khe', () => {
    const width = 100 / layout.whiteKeys.length

    const c4 = keyPlacement(layout, 60)
    expect(c4?.width).toBeCloseTo(width)
    // C4 là phím trắng thứ 7 tính từ C3
    expect(c4?.left).toBeCloseTo(width * 7)
  })

  it('phím trắng xếp liền nhau không hở không chồng', () => {
    for (let i = 0; i < layout.whiteKeys.length - 1; i += 1) {
      const here = keyPlacement(layout, layout.whiteKeys[i]!.note)!
      const next = keyPlacement(layout, layout.whiteKeys[i + 1]!.note)!
      expect(here.left + here.width).toBeCloseTo(next.left)
    }
  })

  it('phím đen hẹp hơn phím trắng', () => {
    const white = keyPlacement(layout, 60)!
    const black = keyPlacement(layout, 61)!
    expect(black.width).toBeLessThan(white.width)
  })

  it('tâm phím đen nằm đúng khe giữa hai phím trắng kề nó', () => {
    const c4 = keyPlacement(layout, 60)!
    const cSharp = keyPlacement(layout, 61)!

    // Khe là chỗ C4 kết thúc và D4 bắt đầu
    expect(cSharp.left + cSharp.width / 2).toBeCloseTo(c4.left + c4.width)
  })

  it('nốt ngoài dải không có chỗ đứng', () => {
    expect(keyPlacement(layout, 36)).toBeNull()
    expect(keyPlacement(layout, 96)).toBeNull()
  })

  it('bàn phím rỗng thì không nốt nào có chỗ đứng', () => {
    expect(keyPlacement(buildKeyboardLayout(72, 60), 60)).toBeNull()
  })

  it('mọi nốt trong dải đều nằm gọn trong bề ngang bàn phím', () => {
    for (let note = 48; note <= 84; note += 1) {
      const place = keyPlacement(layout, note)
      if (!place) continue

      expect(place.left).toBeGreaterThanOrEqual(0)
      expect(place.left + place.width).toBeLessThanOrEqual(100.001)
    }
  })
})
