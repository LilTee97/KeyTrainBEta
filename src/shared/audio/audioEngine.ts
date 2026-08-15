import * as Tone from 'tone'
import { create } from 'zustand'
import type { MidiNote } from '../musicTheory/types'
import { readSetting, writeSetting } from '../persistence/localSettings'

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
  volumeDb: readSetting('volumeDb'),
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

/**
 * Phát lần lượt một chuỗi hợp âm, mỗi hợp âm kéo dài `secondsEach` giây.
 *
 * Lên lịch trước toàn bộ chuỗi theo đồng hồ của thẻ âm thanh, thay vì hẹn
 * giờ bằng JavaScript — nếu không thì các hợp âm sau sẽ lệch nhịp dần.
 */
export function playChordSequence(
  chords: readonly (readonly MidiNote[])[],
  secondsEach: number,
  velocity = 90,
): void {
  if (!isAudioReady()) return

  const startAt = Tone.now()
  const synthInstance = getSynth()

  chords.forEach((notes, index) => {
    if (notes.length === 0) return

    synthInstance.triggerAttackRelease(
      notes.map(toFrequency),
      // Ngắt sớm một chút để hai hợp âm liền nhau không chồng tiếng.
      Math.max(0.05, secondsEach * 0.9),
      startAt + index * secondsEach,
      velocity / 127,
    )
  })
}

/** Một tiếng đàn đã xếp vào dòng thời gian, đo bằng phách. */
export interface ScheduledHit {
  notes: readonly MidiNote[]
  startBeat: number
  durationBeats: number
  velocity: number
}

/**
 * Phát cả một dòng thời gian theo nhịp độ cho trước.
 *
 * Lên lịch trước toàn bộ theo đồng hồ thẻ âm thanh, nên phần đệm giữ nhịp
 * chính xác thay vì trôi dần như khi hẹn giờ bằng JavaScript.
 */
export function playTimeline(
  hits: readonly ScheduledHit[],
  bpm: number,
  startOffsetSeconds = 0.1,
): void {
  if (!isAudioReady() || hits.length === 0) return

  const secondsPerBeat = 60 / Math.max(1, bpm)
  const startAt = Tone.now() + startOffsetSeconds
  const synthInstance = getSynth()

  for (const hit of hits) {
    if (hit.notes.length === 0) continue

    synthInstance.triggerAttackRelease(
      hit.notes.map(toFrequency),
      Math.max(0.05, hit.durationBeats * secondsPerBeat),
      startAt + hit.startBeat * secondsPerBeat,
      hit.velocity / 127,
    )
  }
}

/**
 * Danh sách những thứ đang dùng đồng hồ vận chuyển.
 *
 * Máy đếm nhịp và vòng lặp phần đệm chạy trên **cùng một** đồng hồ. Nếu ai
 * cũng tự tiện dừng đồng hồ khi mình xong thì sẽ tắt luôn phần của người kia —
 * nên phải đếm xem còn ai đang dùng không rồi mới dừng.
 */
const transportUsers = new Set<string>()

/** Xin dùng đồng hồ. Đồng hồ chưa chạy thì khởi động. */
export function acquireTransport(userId: string): void {
  transportUsers.add(userId)

  const transport = Tone.getTransport()
  if (transport.state !== 'started') transport.start()
}

/** Trả lại đồng hồ. Chỉ dừng khi không còn ai dùng. */
export function releaseTransport(userId: string): void {
  transportUsers.delete(userId)

  if (transportUsers.size === 0) {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
  }
}

export interface PlaybackState {
  /** Vòng lặp phần đệm có đang chạy không. */
  looping: boolean
}

export const usePlaybackStore = create<PlaybackState>(() => ({
  looping: false,
}))

/** Một sự kiện đã xếp lịch cho vòng lặp. */
interface LoopEvent {
  time: Tone.Unit.Time
  notes: number[]
  duration: Tone.Unit.Time
  velocity: number
}

let loopPart: Tone.Part<LoopEvent> | null = null

/**
 * Phát phần đệm **lặp đi lặp lại** cho tới khi bị dừng.
 *
 * Nghe một lượt rồi tắt thì không ra bài hát, và cũng không đánh giá được câu
 * giang tấu — câu nhạc cần lặp mới thấy nó ăn khớp với vòng hợp âm hay không.
 *
 * Thời điểm ghi theo **số phách** chứ không theo giây, nên đổi nhịp độ giữa
 * chừng thì phần đệm co giãn theo chứ không lệch.
 */
export function startTimelineLoop(
  hits: readonly ScheduledHit[],
  bpm: number,
  loopLengthBeats?: number,
): void {
  if (!isAudioReady() || hits.length === 0) return

  stopTimelineLoop()

  Tone.getTransport().bpm.value = Math.max(1, bpm)
  const synthInstance = getSynth()

  const events: LoopEvent[] = hits
    .filter((hit) => hit.notes.length > 0)
    .map((hit) => ({
      time: { '4n': hit.startBeat },
      notes: hit.notes.map(toFrequency),
      duration: { '4n': Math.max(0.05, hit.durationBeats) },
      velocity: hit.velocity / 127,
    }))

  const part = new Tone.Part<LoopEvent>((time, value) => {
    synthInstance.triggerAttackRelease(
      value.notes,
      value.duration,
      time,
      value.velocity,
    )
  }, events)

  const length =
    loopLengthBeats ??
    Math.ceil(
      Math.max(...hits.map((hit) => hit.startBeat + hit.durationBeats)),
    )

  part.loop = true
  part.loopEnd = { '4n': Math.max(1, length) }
  part.start(0)
  loopPart = part

  acquireTransport('timeline-loop')
  usePlaybackStore.setState({ looping: true })
}

/** Dừng vòng lặp phần đệm. */
export function stopTimelineLoop(): void {
  loopPart?.stop()
  loopPart?.dispose()
  loopPart = null

  releaseTransport('timeline-loop')
  releaseAllNotes()
  usePlaybackStore.setState({ looping: false })
}

/** Nhả toàn bộ nốt đang vang. */
export function releaseAllNotes(): void {
  if (!synth) return
  synth.releaseAll(Tone.now())
}

/** Chỉnh âm lượng, tính bằng decibel. */
export function setVolumeDb(volumeDb: number): void {
  useAudioStore.getState().setVolumeDb(volumeDb)
  writeSetting('volumeDb', volumeDb)
  if (synth) synth.volume.value = volumeDb
}

/** Dọn dẹp khi thoát. */
export function disposeAudio(): void {
  synth?.dispose()
  synth = null
  useAudioStore.getState().setReady(false)
}
