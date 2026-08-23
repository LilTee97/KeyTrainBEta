import { afterEach, describe, expect, it } from 'vitest'
import {
  SYNC_LIMIT_MS,
  defaultSyncOffsetMs,
  getSyncOffsetMs,
  setSyncOffsetMs,
} from '../audioEngine'
import { DEFAULT_SETTINGS } from '../../persistence/localSettings'

/**
 * Bù lệch giữa **tiếng nghe được** và **hình vẽ ra**.
 *
 * Đồng hồ của Tone đọc vị trí ở chỗ nó đang *xếp lịch* — sớm hơn chỗ loa đang
 * *kêu* đúng bằng `lookAhead`, mặc định 0,1 giây — rồi còn quãng đường từ trình
 * duyệt tới màng loa (`outputLatency`), trên Windows thường 100–250 ms. Trước
 * đây không hằng số nào trong app bù hai thứ ấy, nên nốt rơi chạm lằn kẻ ở một
 * lúc còn tiếng đàn kêu ở một lúc khác.
 */
afterEach(() => setSyncOffsetMs(defaultSyncOffsetMs()))

describe('bù lệch tiếng và hình', () => {
  it('chưa dò tay thì cài đặt để trống, không phải để 0', () => {
    /*
      `null` nghĩa là **chưa ai dò**, khác hẳn với dò ra đúng 0. Phân biệt được
      hai thứ ấy thì nút "Trả về mặc định" mới làm được việc của nó: quên con số
      cũ và bám lại theo máy.
    */
    expect(DEFAULT_SETTINGS.syncOffsetMs).toBeNull()
  })

  it('mặc định là một con số hữu hạn, không âm', () => {
    const mac = defaultSyncOffsetMs()
    expect(Number.isFinite(mac)).toBe(true)
    // lookAhead cộng outputLatency đều là quãng dương; hình luôn chạy trước.
    expect(mac).toBeGreaterThanOrEqual(0)
  })

  it('nhận cả hai chiều — tiếng sớm hay hình sớm đều dò được', () => {
    setSyncOffsetMs(-80)
    expect(getSyncOffsetMs()).toBe(-80)
    setSyncOffsetMs(120)
    expect(getSyncOffsetMs()).toBe(120)
  })

  it('chặn ở nửa giây mỗi chiều', () => {
    // Quá nửa giây thì đó là hỏng chỗ khác, không phải lệch tiếng hình.
    setSyncOffsetMs(9999)
    expect(getSyncOffsetMs()).toBe(SYNC_LIMIT_MS)
    setSyncOffsetMs(-9999)
    expect(getSyncOffsetMs()).toBe(-SYNC_LIMIT_MS)
  })

  it('làm tròn về mili giây nguyên', () => {
    setSyncOffsetMs(42.7)
    expect(getSyncOffsetMs()).toBe(43)
  })
})
