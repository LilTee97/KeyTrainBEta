import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { clearPracticeData } from '../../../shared/persistence/db'
import {
  allReviewItems,
  buildReviewSession,
  qualityIdFromItemId,
  recordChordResult,
  recordProgressionResult,
  templateIdFromItemId,
} from '../reviewQueue'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DAY_ZERO = new Date(2026, 0, 1).getTime()
const days = (count: number) => DAY_ZERO + count * MS_PER_DAY

afterEach(async () => {
  await clearPracticeData()
})

describe('recordChordResult', () => {
  it('tự tạo mục mới ở lần luyện đầu tiên', async () => {
    const item = await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)

    expect(item.id).toBe('chord:maj7')
    expect(item.totalReps).toBe(1)
    expect(item.boxLevel).toBe(1)
  })

  it('cập nhật mục đã có thay vì tạo trùng', async () => {
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)
    await recordChordResult('maj7', 'Hợp âm bảy', true, days(1))

    const items = await allReviewItems()
    expect(items).toHaveLength(1)
    expect(items[0].totalReps).toBe(2)
    expect(items[0].boxLevel).toBe(2)
  })

  it('hàng đợi tự hình thành từ việc luyện bình thường', async () => {
    // Người học không phải khai báo gì, cứ luyện là mục được theo dõi
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)
    await recordChordResult('m7', 'Hợp âm bảy', false, DAY_ZERO)
    await recordChordResult('dim7', 'Nửa giảm & bảy giảm', true, DAY_ZERO)

    expect(await allReviewItems()).toHaveLength(3)
  })

  it('trả lời sai đưa mục về hộp đầu', async () => {
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)
    await recordChordResult('maj7', 'Hợp âm bảy', true, days(1))
    const after = await recordChordResult('maj7', 'Hợp âm bảy', false, days(4))

    expect(after.boxLevel).toBe(0)
    expect(after.totalReps).toBe(3)
  })

  it('cập nhật tên nhóm theo lần luyện gần nhất', async () => {
    await recordChordResult('maj7', 'Tên cũ', true, DAY_ZERO)
    const after = await recordChordResult('maj7', 'Tên mới', true, days(1))

    expect(after.category).toBe('Tên mới')
  })
})

describe('recordProgressionResult', () => {
  it('lưu vòng hợp âm tách khỏi hợp âm rời', async () => {
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)
    await recordProgressionResult('ii-V-I', 'ii–V–I', true, DAY_ZERO)

    const items = await allReviewItems()
    const kinds = items.map((item) => item.kind).sort()
    expect(kinds).toEqual(['chord', 'progression'])
  })
})

describe('buildReviewSession', () => {
  it('chỉ lấy mục đã đến hạn', async () => {
    // Mục này đúng nên hạn ôn đẩy sang một ngày sau
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)
    // Mục này sai nên đến hạn ngay
    await recordChordResult('m7', 'Hợp âm bảy', false, DAY_ZERO)

    const session = await buildReviewSession({ now: DAY_ZERO })
    expect(session.map((item) => item.id)).toEqual(['chord:m7'])
  })

  it('sang ngày hôm sau thì mục đã ôn lại đến hạn', async () => {
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)

    expect(await buildReviewSession({ now: DAY_ZERO })).toHaveLength(0)
    expect(await buildReviewSession({ now: days(1) })).toHaveLength(1)
  })

  it('xếp mục yếu nhất lên đầu buổi', async () => {
    // Mục mạnh: đúng hai lần, đang ở hộp 2
    await recordChordResult('maj7', 'Hợp âm bảy', true, DAY_ZERO)
    await recordChordResult('maj7', 'Hợp âm bảy', true, days(1))
    // Mục yếu: vừa sai, đang ở hộp 0
    await recordChordResult('m7b5', 'Nửa giảm', false, days(3))

    const session = await buildReviewSession({ now: days(5) })
    expect(session[0].id).toBe('chord:m7b5')
  })

  it('giới hạn số mục mỗi buổi', async () => {
    for (const id of ['maj7', 'm7', '7', 'dim7', 'm7b5', '6', '9', 'm9']) {
      await recordChordResult(id, 'Nhóm', false, DAY_ZERO)
    }

    expect(await buildReviewSession({ now: DAY_ZERO, limit: 3 })).toHaveLength(3)
  })

  it('chưa luyện gì thì buổi ôn rỗng', async () => {
    expect(await buildReviewSession({ now: DAY_ZERO })).toEqual([])
  })
})

describe('đọc lại định danh', () => {
  it('rút được loại hợp âm', () => {
    expect(qualityIdFromItemId('chord:maj7')).toBe('maj7')
    expect(qualityIdFromItemId('progression:ii-V-I')).toBeNull()
  })

  it('rút được định danh vòng hợp âm', () => {
    expect(templateIdFromItemId('progression:ii-V-I')).toBe('ii-V-I')
    expect(templateIdFromItemId('chord:maj7')).toBeNull()
  })

  it('đi vòng qua rồi quay lại vẫn ra định danh cũ', async () => {
    const item = await recordChordResult('9sus4', 'Treo mở rộng', true, DAY_ZERO)
    expect(qualityIdFromItemId(item.id)).toBe('9sus4')
  })
})
