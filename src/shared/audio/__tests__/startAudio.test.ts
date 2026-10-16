import { describe, expect, it, vi } from 'vitest'

/** Ngữ cảnh tiếng giả: đang treo, và lời mở (`Tone.start`) không bao giờ xong — đúng như trình duyệt điện thoại chặn khi chưa có quyền. */
const tone = vi.hoisted(() => ({
  ctx: { state: 'suspended' },
  start: vi.fn(() => new Promise<void>(() => {})),
  danh: vi.fn(),
}))

vi.mock('tone', () => ({
  getContext: () => tone.ctx,
  start: tone.start,
  immediate: () => 0,
  Frequency: (note: number) => ({ toFrequency: () => note }),
  Synth: class {},
  PolySynth: class {
    volume = { value: 0 }
    triggerAttack = tone.danh
    toDestination() { return this }
  },
}))

import { attackNote, setTatTiengPhim, startAudio, useAudioStore } from '../audioEngine'

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

describe('nút tắt tiếng phím bấm', () => {
  it('tắt thì phím bấm không ra tiếng; bật lại thì kêu như cũ', async () => {
    /* Người dùng 16/10/2026: "làm nút tắt tiếng đàn để thiết bị Android ko phát ra tiếng đàn khi bấm phím trên đàn, chỉ phát các backing track". */
    tone.ctx.state = 'running'
    useAudioStore.getState().setInstrument('synth')
    await startAudio()
    tone.danh.mockClear()
    setTatTiengPhim(true)
    attackNote(60)
    expect(tone.danh).not.toHaveBeenCalled()
    setTatTiengPhim(false)
    attackNote(60)
    expect(tone.danh).toHaveBeenCalledTimes(1)
  })
})
