import * as Tone from 'tone'
import { create } from 'zustand'
import { readSetting, writeSetting } from '../persistence/localSettings'

/**
 * Máy đếm nhịp.
 *
 * Dùng đồng hồ vận chuyển (Transport) của Tone.js chứ không dùng setInterval:
 * hẹn giờ của JavaScript trôi nhịp rõ rệt sau vài chục giây, còn Transport lên
 * lịch trước theo đồng hồ của thẻ âm thanh nên giữ nhịp chính xác.
 *
 * Lưu ý cho các bước sau: Transport là tài nguyên dùng chung của cả ứng dụng.
 * Khi làm phần đệm theo điệu, backing track sẽ chạy trên cùng đồng hồ này thay
 * vì tự dựng đồng hồ riêng.
 */

export const MIN_BPM = 30
export const MAX_BPM = 240

/** Cao độ tiếng gõ, tính bằng Hz. Phách mạnh cao hơn để nghe rõ đầu ô nhịp. */
const ACCENT_PITCH = 1400
const NORMAL_PITCH = 900

export interface BeatPosition {
  /** Phách trong ô nhịp, đếm từ 0. */
  beat: number
  /** Số thứ tự ô nhịp, đếm từ 0. */
  measure: number
  /** Có phải phách mạnh đầu ô nhịp không. */
  isAccent: boolean
}

/** Ép nhịp độ về khoảng cho phép. */
export function clampBpm(bpm: number): number {
  if (Number.isNaN(bpm)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/**
 * Vị trí của tiếng gõ thứ `tickIndex` trong bài, đếm từ 0.
 * Hàm thuần, tách riêng để test được mà không cần chạy âm thanh.
 */
export function beatPositionOf(
  tickIndex: number,
  beatsPerMeasure: number,
): BeatPosition {
  const safeBeats = Math.max(1, Math.floor(beatsPerMeasure))
  const beat = ((tickIndex % safeBeats) + safeBeats) % safeBeats

  return {
    beat,
    measure: Math.floor(tickIndex / safeBeats),
    isAccent: beat === 0,
  }
}

export interface MetronomeState {
  running: boolean
  bpm: number
  beatsPerMeasure: number
  /** Phách đang vang, đếm từ 0. Bằng -1 khi đang dừng. */
  currentBeat: number
  /** Số ô nhịp đã đi qua kể từ lúc bắt đầu. */
  currentMeasure: number
}

export const useMetronomeStore = create<MetronomeState>(() => ({
  running: false,
  bpm: clampBpm(readSetting('bpm')),
  beatsPerMeasure: readSetting('beatsPerMeasure'),
  currentBeat: -1,
  currentMeasure: 0,
}))

let clickSynth: Tone.Synth | null = null
let loop: Tone.Loop | null = null
let tickIndex = 0

function getClickSynth(): Tone.Synth {
  clickSynth ??= new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: {
      attack: 0.001,
      decay: 0.04,
      sustain: 0,
      release: 0.01,
    },
    volume: -12,
  }).toDestination()

  return clickSynth
}

function handleTick(time: number): void {
  const { beatsPerMeasure } = useMetronomeStore.getState()
  const position = beatPositionOf(tickIndex, beatsPerMeasure)
  tickIndex += 1

  getClickSynth().triggerAttackRelease(
    position.isAccent ? ACCENT_PITCH : NORMAL_PITCH,
    '32n',
    time,
  )

  // Cập nhật giao diện đúng lúc tiếng gõ vang lên. Gọi thẳng setState ở đây
  // sẽ lệch, vì callback chạy sớm hơn âm thanh để kịp lên lịch.
  Tone.getDraw().schedule(() => {
    useMetronomeStore.setState({
      currentBeat: position.beat,
      currentMeasure: position.measure,
    })
  }, time)
}

/**
 * Bắt đầu đếm nhịp. Phải gọi từ một thao tác thật của người dùng vì trình
 * duyệt chặn phát tiếng tự động.
 */
export async function startMetronome(): Promise<void> {
  if (useMetronomeStore.getState().running) return

  await Tone.start()

  const transport = Tone.getTransport()
  transport.bpm.value = useMetronomeStore.getState().bpm

  tickIndex = 0
  loop ??= new Tone.Loop(handleTick, '4n')
  loop.start(0)

  transport.start()
  useMetronomeStore.setState({ running: true })
}

export function stopMetronome(): void {
  loop?.stop()
  Tone.getTransport().stop()
  tickIndex = 0

  useMetronomeStore.setState({
    running: false,
    currentBeat: -1,
    currentMeasure: 0,
  })
}

export function toggleMetronome(): void {
  if (useMetronomeStore.getState().running) stopMetronome()
  else void startMetronome()
}

/** Đổi nhịp độ. Đổi được cả khi đang chạy, nhịp không bị ngắt quãng. */
export function setBpm(bpm: number): void {
  const clamped = clampBpm(bpm)
  useMetronomeStore.setState({ bpm: clamped })
  writeSetting('bpm', clamped)
  Tone.getTransport().bpm.value = clamped
}

/** Đổi số phách mỗi ô nhịp, đồng thời quay lại đầu ô nhịp. */
export function setBeatsPerMeasure(beats: number): void {
  const safeBeats = Math.max(1, Math.floor(beats))
  useMetronomeStore.setState({ beatsPerMeasure: safeBeats })
  writeSetting('beatsPerMeasure', safeBeats)
  tickIndex = 0
}

/** Dọn dẹp khi thoát. */
export function disposeMetronome(): void {
  stopMetronome()
  loop?.dispose()
  loop = null
  clickSynth?.dispose()
  clickSynth = null
}
