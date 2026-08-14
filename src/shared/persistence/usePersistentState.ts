import { useCallback, useState } from 'react'
import type { Settings } from './localSettings'
import { readSetting, writeSetting } from './localSettings'

/**
 * Giống `useState` nhưng nhớ giá trị giữa các lần mở app.
 *
 * Đọc giá trị đã lưu ngay ở lần dựng đầu tiên, nên giao diện không nhấp nháy
 * từ mặc định sang giá trị cũ.
 */
export function usePersistentState<K extends keyof Settings>(
  key: K,
): [Settings[K], (value: Settings[K]) => void] {
  const [value, setValue] = useState<Settings[K]>(() => readSetting(key))

  const update = useCallback(
    (next: Settings[K]) => {
      setValue(next)
      writeSetting(key, next)
    },
    [key],
  )

  return [value, update]
}
