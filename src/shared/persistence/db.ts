import type { DBSchema, IDBPDatabase } from 'idb'
import { openDB } from 'idb'

/**
 * Kho dữ liệu lớn dần theo thời gian.
 *
 * Dùng IndexedDB thay vì localStorage cho lịch sử luyện tập, hàng đợi ôn tập
 * và thư viện bài hát: localStorage đọc ghi đồng bộ, giới hạn vài megabyte, và
 * không truy vấn theo chỉ mục được — trong khi ta cần hỏi những câu như
 * "item nào đến hạn ôn hôm nay".
 *
 * Các kho dữ liệu ở đây được dựng sẵn từ bước lưu trữ, dù phần dùng tới chúng
 * (thống kê, ôn tập, game hoá) làm ở các bước sau. Dựng sẵn để không phải nâng
 * phiên bản cơ sở dữ liệu nhiều lần trên máy người dùng.
 */

const DB_NAME = 'keytrain'
const DB_VERSION = 1

/** Một lần trả lời của người học. Kho này chỉ ghi thêm, không sửa. */
export interface StatsEvent {
  id?: number
  /** Mốc thời gian theo `Date.now()`. */
  timestamp: number
  /** Ngày theo giờ địa phương, dạng 'YYYY-MM-DD', để tổng hợp theo ngày. */
  day: string
  /** Luyện tự do hay đang trong buổi ôn tập. */
  mode: 'practice' | 'review'
  itemKind: 'chord' | 'progression'
  /** Nhóm hợp âm hoặc tên vòng, dùng để thống kê theo nhóm. */
  category: string
  correct: boolean
  /** Thời gian trả lời tính bằng mili giây. */
  responseMs: number
}

/** Trạng thái ôn tập của một mục, theo mô hình hộp Leitner. */
export interface ReviewItem {
  /** Khoá tự đặt, ví dụ 'chord:0:maj7'. */
  id: string
  kind: 'chord' | 'progression'
  category: string
  /** Mức hộp Leitner, càng cao càng thuộc. */
  boxLevel: number
  lastReviewedAt: number
  /** Mốc thời gian đến hạn ôn lại. */
  nextDueAt: number
  correctStreak: number
  totalReps: number
  totalCorrect: number
}

/** Tiến trình game hoá, mỗi hệ một bản ghi. */
export interface ProgressRecord {
  /** 'ear' cho phần luyện tai, 'comp' cho phần đệm hát. */
  id: 'ear' | 'comp'
  xp: number
  level: number
  currentStreakDays: number
  longestStreakDays: number
  /** Ngày hoạt động gần nhất, dạng 'YYYY-MM-DD'. */
  lastActiveDay: string | null
  badges: { id: string; tier?: string; unlockedAt: number }[]
}

/** Bài hát người dùng nhập vào phần tái hòa âm. */
export interface StoredSong {
  id: string
  title: string
  /** Văn bản gốc người dùng dán vào, giữ nguyên để có thể phân tích lại. */
  sourceText: string
  updatedAt: number
}

interface KeyTrainDB extends DBSchema {
  statsEvents: {
    key: number
    value: StatsEvent
    indexes: { 'by-day': string; 'by-timestamp': number }
  }
  reviewItems: {
    key: string
    value: ReviewItem
    indexes: { 'by-due': number; 'by-category': string }
  }
  progress: {
    key: string
    value: ProgressRecord
  }
  songs: {
    key: string
    value: StoredSong
    indexes: { 'by-updated': number }
  }
}

let dbPromise: Promise<IDBPDatabase<KeyTrainDB>> | null = null

/** Mở cơ sở dữ liệu, dựng các kho ở lần đầu. */
export function getDb(): Promise<IDBPDatabase<KeyTrainDB>> {
  dbPromise ??= openDB<KeyTrainDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('statsEvents')) {
        const store = db.createObjectStore('statsEvents', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('by-day', 'day')
        store.createIndex('by-timestamp', 'timestamp')
      }

      if (!db.objectStoreNames.contains('reviewItems')) {
        const store = db.createObjectStore('reviewItems', { keyPath: 'id' })
        // Chỉ mục theo hạn ôn để hỏi nhanh những mục đến hạn hôm nay.
        store.createIndex('by-due', 'nextDueAt')
        store.createIndex('by-category', 'category')
      }

      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('songs')) {
        const store = db.createObjectStore('songs', { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      }
    },
  })

  return dbPromise
}

/** Ngày hiện tại theo giờ địa phương, dạng 'YYYY-MM-DD'. */
export function dayKeyOf(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Ghi lại một lần trả lời. */
export async function addStatsEvent(
  event: Omit<StatsEvent, 'id' | 'day'> & { day?: string },
): Promise<void> {
  const db = await getDb()
  await db.add('statsEvents', {
    ...event,
    day: event.day ?? dayKeyOf(new Date(event.timestamp)),
  })
}

/** Mọi lần trả lời trong một ngày. */
export async function statsEventsForDay(day: string): Promise<StatsEvent[]> {
  const db = await getDb()
  return db.getAllFromIndex('statsEvents', 'by-day', day)
}

/** Các mục ôn tập đã đến hạn tính tới thời điểm `now`. */
export async function dueReviewItems(
  now: number = Date.now(),
): Promise<ReviewItem[]> {
  const db = await getDb()
  return db.getAllFromIndex(
    'reviewItems',
    'by-due',
    IDBKeyRange.upperBound(now),
  )
}

export async function putReviewItem(item: ReviewItem): Promise<void> {
  const db = await getDb()
  await db.put('reviewItems', item)
}

export async function getReviewItem(
  id: string,
): Promise<ReviewItem | undefined> {
  const db = await getDb()
  return db.get('reviewItems', id)
}

export async function getProgress(
  id: ProgressRecord['id'],
): Promise<ProgressRecord | undefined> {
  const db = await getDb()
  return db.get('progress', id)
}

export async function putProgress(record: ProgressRecord): Promise<void> {
  const db = await getDb()
  await db.put('progress', record)
}

/** Xoá sạch dữ liệu luyện tập. Dùng cho nút đặt lại thống kê. */
export async function clearPracticeData(): Promise<void> {
  const db = await getDb()
  await Promise.all([
    db.clear('statsEvents'),
    db.clear('reviewItems'),
    db.clear('progress'),
  ])
}

/** Đóng kết nối, dùng khi dọn dẹp hoặc khi test. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return
  const db = await dbPromise
  db.close()
  dbPromise = null
}
