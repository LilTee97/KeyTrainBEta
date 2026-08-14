import * as Tone from 'tone'
import { create } from 'zustand'
import type { MidiNote } from '../musicTheory/types'

/**
 * Bộ phát tiếng của KeyTrain.
 *
 * Dùng đàn tổng hợp (synth) chứ không dùng mẫu tiếng piano thu sẵn: KeyTrain
 * là app luyện tập chạy offline, mà mẫu tiếng piano thật nặng vài chục MB và
 * thường phải tải từ máy chủ ngoài. Tiếng tổng hợp nhẹ, không cần mạng, và đủ
 * rõ cao độ để luyện tai — có thể đổi sang tiếng thu sẵn về sau nếu cần.
 */

/** Trình duyệt chỉ cho phát tiếng sau khi người dùng chạm vào trang. */
export interface AudioState {
  ready: boolean
  /** Âm lượng tính bằng decibel; 0 là mức gốc. */
  volumeDb: number
  setReady: (ready: boolean) => void
  setVolumeDb: (volumeDb: number) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  ready: false,
  volumeDb: -6,
  setReady: (ready) => set({ ready }),
  setVolumeDb: (volumeDb) => set({ volumeDb }),
}))

let synth: Tone.PolySynth<Tone.Synth> | null = null

/**
 * Thông số tạo tiếng gần giống đàn phím: vào tiếng gần như tức thì, tắt dần
 * khá nhanh nhưng vẫn ngân nhẹ khi giữ phím, và buông tiếng mượt khi nhả.
 */
function createSynth(): Tone.PolySynth<Tone.Synth> {
  const instrument = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.005,
      decay: 0.7,
      sustain: 0.18,
      release: 1.1,
    },
  }).toDestination()

  instrument.volume.value = useAudioStore.getState().volumeDb
  return instrument
}

function getSynth(): Tone.PolySynth<Tone.Synth> {
  synth ??= createSynth()
  return synth
}

/** Đổi nốt MIDI sang tần số để đưa vào Tone.js. */
function toFrequency(note: MidiNote): number {
  return Tone.Frequency(note, 'midi').toFrequency()
}

/**
 * Mở khoá âm thanh. Bắt buộc gọi từ một thao tác thật của người dùng
 * (bấm chuột, chạm màn hình) — trình duyệt chặn phát tiếng tự động.
 */
export async function startAudio(): Promise<void> {
  if (useAudioStore.getState().ready) return

  await Tone.start()
  getSynth()
  useAudioStore.getState().setReady(true)
}

export function isAudioReady(): boolean {
  return useAudioStore.getState().ready
}

/** Bấm và giữ một nốt. `velocity` theo thang MIDI 0-127. */
export function attackNote(note: MidiNote, velocity = 90): void {
  if (!isAudioReady()) return
  getSynth().triggerAttack(toFrequency(note), Tone.now(), velocity / 127)
}

/** Nhả một nốt đang giữ. */
export function releaseNote(note: MidiNote): void {
  if (!isAudioReady()) return
  getSynth().triggerRelease(toFrequency(note), Tone.now())
}

/**
 * Phát một hợp âm rồi tự tắt.
 * `duration` theo ký hiệu thời gian của Tone.js: '2n' là nốt trắng,
 * '4n' là nốt đen.
 */
export function playChord(
  notes: readonly MidiNote[],
  duration: Tone.Unit.Time = '2n',
  velocity = 90,
): void {
  if (!isAudioReady() || notes.length === 0) return

  getSynth().triggerAttackRelease(
    notes.map(toFrequency),
    duration,
    Tone.now(),
    velocity / 127,
  )
}

/** Nhả toàn bộ nốt đang vang. */
export function releaseAllNotes(): void {
  if (!synth) return
  synth.releaseAll(Tone.now())
}

/** Chỉnh âm lượng, tính bằng decibel. */
export function setVolumeDb(volumeDb: number): void {
  useAudioStore.getState().setVolumeDb(volumeDb)
  if (synth) synth.volume.value = volumeDb
}

/** Dọn dẹp khi thoát. */
export function disposeAudio(): void {
  synth?.dispose()
  synth = null
  useAudioStore.getState().setReady(false)
}
