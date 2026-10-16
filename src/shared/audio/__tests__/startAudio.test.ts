import { describe, expect, it, vi } from 'vitest'

/** Ngữ cảnh tiếng giả: đang treo, và lời mở (`Tone.start`) không bao giờ xong — đúng như trình duyệt điện thoại chặn khi chưa có quyền. */
const tone = vi.hoisted(() => ({
  ctx: { state: 'suspended' },
  start: vi.fn(() => new Promise<void>(() => {})),
}))

vi.mock('tone', () => ({
  getContext: () => tone.ctx,
  start: tone.start,
  Synth: class {},
  PolySynth: class {
    volume = { value: 0 }
    toDestination() { return this }
  },
}))

import { startAudio, useAudioStore } from '../audioEngine'

describe('mở tiếng trên điện thoại', () => {
  it('lời mở bị chặn thì vẫn vào được game; lần gọi sau thử mở lại; tiếng đã chạy thì không gọi mở nữa', async () => {
    /* Lỗi 16/10/2026 (giả lập Android): lời mở đầu tiên treo, mọi lần gọi sau chờ chính nó — game kẹt ở màn chọn, cả buổi không tiếng. */
    vi.useFakeTimers()
    useAudioStore.getState().setInstrument('synth')
    let xong = false
    void startAudio().then(() => { xong = true })
    await vi.advanceTimersByTimeAsync(299)
    expect(xong).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(xong).toBe(true)
    expect(useAudioStore.getState().ready).toBe(true)

    void startAudio()
    expect(tone.start).toHaveBeenCalledTimes(2)

    tone.ctx.state = 'running'
    await startAudio()
    expect(tone.start).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
