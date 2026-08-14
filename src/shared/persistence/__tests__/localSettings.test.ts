import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Bản localStorage giả, đủ dùng cho các test ở đây. */
class MemoryStorage {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }
}

vi.stubGlobal('localStorage', new MemoryStorage())

const {
  DEFAULT_SETTINGS,
  clearSettings,
  readAllSettings,
  readSetting,
  writeSetting,
} = await import('../localSettings')

beforeEach(() => {
  clearSettings()
})

describe('giá trị mặc định', () => {
  it('trả về mặc định khi chưa lưu gì', () => {
    expect(readSetting('bpm')).toBe(DEFAULT_SETTINGS.bpm)
    expect(readSetting('drillVoicing')).toBe(DEFAULT_SETTINGS.drillVoicing)
  })

  it('mọi cài đặt đều có mặc định', () => {
    const settings = readAllSettings()
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      expect(settings[key as keyof typeof settings]).toBeDefined()
    }
  })
})

describe('ghi và đọc', () => {
  it('nhớ giá trị số', () => {
    writeSetting('bpm', 140)
    expect(readSetting('bpm')).toBe(140)
  })

  it('nhớ giá trị chuỗi', () => {
    writeSetting('drillVoicing', 'shell')
    expect(readSetting('drillVoicing')).toBe('shell')
  })

  it('nhớ giá trị đúng sai', () => {
    writeSetting('progressionUseSevenths', false)
    expect(readSetting('progressionUseSevenths')).toBe(false)
  })

  it('nhớ danh sách', () => {
    writeSetting('drillGroups', ['Treo', 'Mở rộng'])
    expect(readSetting('drillGroups')).toEqual(['Treo', 'Mở rộng'])
  })

  it('đọc lại toàn bộ cùng lúc', () => {
    writeSetting('bpm', 90)
    writeSetting('drillVoicing', 'drop2')

    const settings = readAllSettings()
    expect(settings.bpm).toBe(90)
    expect(settings.drillVoicing).toBe('drop2')
    // Các khoá chưa ghi vẫn giữ mặc định
    expect(settings.beatsPerMeasure).toBe(DEFAULT_SETTINGS.beatsPerMeasure)
  })
})

describe('chịu được dữ liệu hỏng', () => {
  it('bỏ qua giá trị không đọc được, dùng mặc định', () => {
    localStorage.setItem('keytrain:bpm', 'không phải JSON')
    expect(readSetting('bpm')).toBe(DEFAULT_SETTINGS.bpm)
  })

  it('bỏ qua giá trị sai kiểu', () => {
    // Ai đó sửa tay thành chuỗi trong khi app mong đợi số
    localStorage.setItem('keytrain:bpm', '"nhanh"')
    expect(readSetting('bpm')).toBe(DEFAULT_SETTINGS.bpm)
  })

  it('bỏ qua khi mong đợi danh sách mà nhận được thứ khác', () => {
    localStorage.setItem('keytrain:drillGroups', '{"a":1}')
    expect(readSetting('drillGroups')).toEqual(DEFAULT_SETTINGS.drillGroups)
  })

  it('bỏ qua khi mong đợi thứ khác mà nhận được danh sách', () => {
    localStorage.setItem('keytrain:drillVoicing', '["shell"]')
    expect(readSetting('drillVoicing')).toBe(DEFAULT_SETTINGS.drillVoicing)
  })
})

describe('clearSettings', () => {
  it('đưa mọi cài đặt về mặc định', () => {
    writeSetting('bpm', 200)
    writeSetting('drillGroups', ['Treo'])

    clearSettings()

    expect(readSetting('bpm')).toBe(DEFAULT_SETTINGS.bpm)
    expect(readSetting('drillGroups')).toEqual(DEFAULT_SETTINGS.drillGroups)
  })
})
