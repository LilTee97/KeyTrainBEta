import { afterEach, describe, expect, it, vi } from 'vitest'

const audio = vi.hoisted(() => ({
  scheduled: [] as { callback: (time: number) => void; beat: number }[],
  parts: [] as { events: { time: { '4n': number }; notes: number[] }[]; dispose: () => void }[],
  attack: vi.fn(),
}))
vi.mock('tone', () => {
  const transport = {
    bpm: { value: 100 }, ticks: 0, PPQ: 192, position: 0, state: 'stopped',
    start() { this.state = 'started' }, stop() { this.state = 'stopped' },
    scheduleOnce(callback: (time: number) => void, time: { '4n': number }) {
      audio.scheduled.push({ callback, beat: time['4n'] })
      return audio.scheduled.length
    }, clear: vi.fn(),
  }
  return {
    start: async () => {}, now: () => 0, getTransport: () => transport,
    Frequency: (note: number) => ({ toFrequency: () => note }),
    Synth: class {},
    PolySynth: class {
      volume = { value: 0 }
      triggerAttackRelease = audio.attack
      releaseAll() {}
      toDestination() { return this }
    },
    Part: class {
      dispose = vi.fn()
      constructor(_fire: unknown, public events: (typeof audio.parts)[number]['events']) {
        audio.parts.push(this)
      }
      start() {}
      stop() {}
    },
    Loop: class { start() {} stop() {} dispose() {} },
    getDraw: () => ({ schedule: (callback: () => void) => callback() }),
  }
})

import { startAudio, startTimelineLoop, stopTimelineLoop, useAudioStore } from '../audioEngine'

afterEach(() => {
  stopTimelineLoop()
  audio.scheduled.length = 0
  audio.parts.length = 0
  audio.attack.mockClear()
})

describe('lượt phát tự động nằm đúng trên đồng hồ Transport', () => {
  it('đổi câu qua bốn vòng; onset đầu không mất, nốt sau không bị đặt vào quá khứ', async () => {
    useAudioStore.setState({ instrument: 'synth' })
    await startAudio()
    const takes: number[] = []
    startTimelineLoop((pass) => {
      takes.push(pass)
      return [0, 1].map((startBeat) => ({ startBeat, notes: [60 + pass + startBeat],
        durationBeats: 0.5, velocity: 80, hand: 'right' as const }))
    }, 100, 4)
    expect(audio.parts[0]!.events.map((e) => e.time['4n'])).toEqual([0, 1])
    for (let pass = 1; pass <= 4; pass += 1) {
      const boundary = audio.scheduled[pass - 1]!
      expect(boundary.beat).toBe(pass * 4)
      boundary.callback(100 + pass) // AudioContext time không phải số phách
      expect(audio.parts[pass]!.events.map((e) => e.time['4n'])).toEqual([pass * 4 + 1])
      expect(audio.attack).toHaveBeenLastCalledWith([60 + pass], { '4n': 0.5 }, 100 + pass, 80 / 127)
      expect(audio.parts[pass - 1]!.dispose).toHaveBeenCalledOnce()
    }
    expect(takes).toEqual([0, 1, 2, 3, 4])
  })
  it('phát một lần để nghe câu đã lưu không gọi soạn vòng mới', async () => {
    useAudioStore.setState({ instrument: 'synth' })
    await startAudio()
    const source = vi.fn(() => [{ startBeat: 0, notes: [60], durationBeats: 1, velocity: 80 }])
    startTimelineLoop(source, 100, 4, 0, true)
    audio.scheduled[0]!.callback(8)
    expect(source).toHaveBeenCalledTimes(1)
  })
})
