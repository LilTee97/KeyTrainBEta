import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearPracticeData,
  deleteSong,
  getSong,
  listSongs,
  putSong,
} from '../db'

/**
 * Kho bài hát: lưu lại và mở lại những gì người dùng đã dựng.
 *
 * Dựng một bài mất hàng chục phút — chia đoạn, thứ tự chơi, hợp âm lướt, mốc
 * chuyển đoạn — nên mất sạch khi tải lại trang là chỗ đau nhất lúc dùng thật.
 */

afterEach(async () => {
  for (const song of await listSongs()) await deleteSong(song.id)
  await clearPracticeData()
})

const song = (id: string, title: string, updatedAt: number) => ({
  id,
  title,
  sourceText: `[Phiên khúc]\nC G\n${title}`,
  updatedAt,
  snapshot: { version: 1 as const, sourceText: title },
})

describe('lưu và mở bài', () => {
  it('lưu rồi đọc lại được nguyên vẹn', async () => {
    await putSong(song('a', 'Người ấy', 1000))

    const saved = await getSong('a')
    expect(saved?.title).toBe('Người ấy')
    expect(saved?.snapshot).toEqual({ version: 1, sourceText: 'Người ấy' })
  })

  it('lưu lại cùng một khoá thì ghi đè, không đẻ thêm bản', async () => {
    /*
      Bấm Lưu trong lúc đang chỉnh một bài nghĩa là **lưu bài này**, không phải
      tạo bản thứ hai.
    */
    await putSong(song('a', 'Tên cũ', 1000))
    await putSong(song('a', 'Tên mới', 2000))

    expect(await listSongs()).toHaveLength(1)
    expect((await getSong('a'))?.title).toBe('Tên mới')
  })

  it('danh sách xếp bài mới sửa gần nhất lên đầu', async () => {
    await putSong(song('a', 'Cũ', 1000))
    await putSong(song('b', 'Mới', 3000))
    await putSong(song('c', 'Giữa', 2000))

    expect((await listSongs()).map((entry) => entry.title)).toEqual([
      'Mới',
      'Giữa',
      'Cũ',
    ])
  })

  it('xoá một bài không đụng tới bài khác', async () => {
    await putSong(song('a', 'Giữ lại', 1000))
    await putSong(song('b', 'Bỏ đi', 2000))

    await deleteSong('b')

    expect((await listSongs()).map((entry) => entry.title)).toEqual(['Giữ lại'])
  })

  it('chưa lưu gì thì danh sách rỗng, không ném lỗi', async () => {
    expect(await listSongs()).toEqual([])
  })

  it('hỏi bài không có thì trả về rỗng', async () => {
    expect(await getSong('không có')).toBeUndefined()
  })

  it('xoá dữ liệu luyện tập không xoá bài đã lưu', async () => {
    // Bài hát là thứ người dùng soạn ra, không phải số liệu luyện tập
    await putSong(song('a', 'Người ấy', 1000))
    await clearPracticeData()

    expect(await listSongs()).toHaveLength(1)
  })
})
