/**
 * Cài đặt nhỏ, đọc ghi đồng bộ.
 *
 * Dùng localStorage cho những giá trị lặt vặt mà giao diện cần đọc ngay lúc
 * dựng: nhịp độ, kiểu thế bấm, phạm vi hợp âm đang luyện. Dữ liệu lớn dần
 * theo thời gian (lịch sử luyện tập, hàng đợi ôn tập, bài hát đã lưu) nằm ở
 * IndexedDB — xem `db.ts`.
 */

const STORAGE_PREFIX = 'keytrain:'

/** Toàn bộ cài đặt được lưu, kèm giá trị mặc định. */
export interface Settings {
  /** Nhịp độ dùng chung cho máy đếm nhịp và bài luyện vòng. */
  bpm: number
  beatsPerMeasure: number

  /** Bài nhận diện hợp âm. */
  drillGroups: string[]
  drillVoicing: string
  drillStrictness: string
  drillRevealAfter: number

  /** Bài luyện vòng hợp âm. */
  progressionTemplateId: string
  progressionVoicing: string
  progressionKeyFlow: string
  progressionUseSevenths: boolean

  /** Âm lượng tính bằng decibel. */
  volumeDb: number
  /** Tiếng phát: piano (sample), epiano, synth. */
  instrument: string

  /** Số phím của đàn MIDI đang dùng (44, 49, 61, 73, 76, 88...). Dùng để hiển thị bàn phím ảo đúng kích thước. */
  midiKeyboardKeys: number
}

export const DEFAULT_SETTINGS: Settings = {
  bpm: 120,
  beatsPerMeasure: 4,

  drillGroups: ['Hợp âm ba', 'Hợp âm bảy'],
  drillVoicing: 'close',
  drillStrictness: 'pitchClass',
  drillRevealAfter: 10,

  progressionTemplateId: 'ii-V-I',
  progressionVoicing: 'close',
  progressionKeyFlow: 'circleOfFourths',
  progressionUseSevenths: true,

  volumeDb: -6,
  instrument: 'piano',

  midiKeyboardKeys: 61,
}

/**
 * Có dùng được localStorage không.
 *
 * Trình duyệt ở chế độ ẩn danh, hoặc thiết lập chặn cookie, có thể làm
 * localStorage ném lỗi khi ghi — app vẫn phải chạy được, chỉ là không nhớ.
 */
function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const probe = `${STORAGE_PREFIX}__probe__`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const available = isStorageAvailable()

/** Đọc một cài đặt, trả về giá trị mặc định nếu chưa có hoặc dữ liệu hỏng. */
export function readSetting<K extends keyof Settings>(key: K): Settings[K] {
  if (!available) return DEFAULT_SETTINGS[key]

  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return DEFAULT_SETTINGS[key]

    const parsed: unknown = JSON.parse(raw)

    // Dữ liệu cũ hoặc bị sửa tay có thể sai kiểu; kiểu sai thì bỏ qua và
    // dùng mặc định, thay vì để app vỡ ở nơi khác.
    if (typeof parsed !== typeof DEFAULT_SETTINGS[key]) {
      return DEFAULT_SETTINGS[key]
    }
    if (Array.isArray(DEFAULT_SETTINGS[key]) !== Array.isArray(parsed)) {
      return DEFAULT_SETTINGS[key]
    }

    return parsed as Settings[K]
  } catch {
    return DEFAULT_SETTINGS[key]
  }
}

/** Ghi một cài đặt. Ghi hỏng thì bỏ qua, không làm app dừng. */
export function writeSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): void {
  if (!available) return

  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // Hết dung lượng hoặc bị chặn ghi — app vẫn chạy, chỉ là không nhớ.
  }
}

/** Đọc toàn bộ cài đặt cùng lúc. */
export function readAllSettings(): Settings {
  const result = { ...DEFAULT_SETTINGS }

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    // Ghi đè từng khoá để giữ đúng kiểu của từng trường.
    Object.assign(result, { [key]: readSetting(key) })
  }

  return result
}

/** Xoá mọi cài đặt đã lưu, đưa app về mặc định. */
export function clearSettings(): void {
  if (!available) return

  try {
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      localStorage.removeItem(STORAGE_PREFIX + key)
    }
  } catch {
    // Không xoá được thì thôi.
  }
}
