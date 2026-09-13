import { afterEach, describe, expect, it, vi } from 'vitest'

const audio = vi.hoisted(() => ({
  scheduled: [] as { callback: (time: number) => void; beat: number }[],
  parts: [] as { events: { time: { '4n': number }; notes: number[] }[]; fire: (time: number, value: unknown) => void; dispose: () => void }[],
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
      constructor(public fire: (time: number, value: unknown) => void, public events: (typeof audio.parts)[number]['events']) {
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
import { parseChordInput } from '../../../reharm/input/chordInputParser'
import { voiceLeadTwoHands } from '../../../reharm/voicingGenerator/handSplitVoicing'
import { renderPattern } from '../../../reharm/style/patternRenderer'
import { CA_PHAO_BOSSA_IMPROVED } from '../../../reharm/style/styleLibrary/caPhaoBossa'
import { buildBossaRhythmOnly } from '../../../reharm/playback/bossaRhythmOnly'

afterEach(() => {
  stopTimelineLoop()
  audio.scheduled.length = 0
  audio.parts.length = 0
  audio.attack.mockClear()
})

describe('lượt phát tự động nằm đúng trên đồng hồ Transport', () => {
  it('Bossa CP: tiếng 2, 3, 6 tới nhạc cụ; Bùm 3 rõ hơn bum 4, không đổi nhịp', async () => {
    useAudioStore.setState({ instrument: 'synth' })
    await startAudio()
    const hands = voiceLeadTwoHands(parseChordInput('Am9 Dm11 E7 Am9').chords)
    const backing = renderPattern(hands, CA_PHAO_BOSSA_IMPROVED)
    const song = buildBossaRhythmOnly(backing, 16, null, [])
    startTimelineLoop(song.events, 110, song.totalBeats)
    const part = audio.parts[0]!
    for (const [beat, velocity] of [[1, 68], [1.5, 58], [2, 51], [3.5, 44]]) {
      const event = part.events.find(e => e.time['4n'] === beat)!
      expect(event.notes.length).toBeGreaterThan(0)
      part.fire(10 + beat * 60 / 110, event)
      expect(audio.attack).toHaveBeenLastCalledWith(event.notes,
        { '4n': .5 }, 10 + beat * 60 / 110, velocity / 127)
    }
    const third = backing.find(e => e.startBeat === 1.5)!
    const fourth = backing.find(e => e.startBeat === 2)!
    expect(third.velocity).toBeGreaterThan(fourth.velocity)
    expect(third.notes[0]).toBe(fourth.notes[0] - 1)
    expect(third.startBeat + third.durationBeats).toBe(fourth.startBeat)
    const fifth = part.events.filter(e => e.time['4n'] === 2.5)
    expect(fifth).toHaveLength(2)
    const fifthBass = fifth.find(e => e.notes.length === 1)!
    part.fire(12, fifthBass)
    expect(audio.attack).toHaveBeenLastCalledWith(fifthBass.notes, { '4n': 1.5 }, 12, 34 / 127)
  })
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
