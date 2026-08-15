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
  /**
   * Vị trí đang phát, tính bằng phách kể từ lúc bắt đầu vòng lặp.
   *
   * Có để giao diện tô sáng đúng hợp âm đang vang. Cập nhật qua
   * `Tone.getDraw()` chứ không qua đồng hồ JavaScript: `getDraw` xếp lịch vẽ
   * theo đúng đồng hồ thẻ âm thanh, nên chữ sáng lên khớp với tiếng đàn thay
   * vì trôi dần.
   */
  positionBeats: number
}

export const usePlaybackStore = create<PlaybackState>(() => ({
  looping: false,
  positionBeats: 0,
}))

/** Đồng hồ báo vị trí cho giao diện, chạy song song với vòng lặp phần đệm. */
let positionTicker: Tone.Loop | null = null

/** Một sự kiện đã xếp lịch cho vòng lặp. */
interface LoopEvent {
  time: Tone.Unit.Time
  notes: number[]
  duration: Tone.Unit.Time
  velocity: number
}

let loopPart: Tone.Part<LoopEvent> | null = null

/**
 * Số lượt được dựng sẵn và nối vào một vòng lặp.
 *
 * Đoạn giang tấu phải mỗi lượt một khác, nhưng `Tone.Part` khi lặp thì phát
 * lại đúng bộ sự kiện cũ. Cách giải quyết: **nối sẵn nhiều lượt khác nhau
 * thành một vòng dài** rồi cho nó lặp.
 *
 * Ba lượt, vì bộ sinh xoay danh sách mẫu câu theo chu kỳ ba — lượt thứ tư
 * quay lại đúng lượt đầu, nối thêm chỉ tổ làm vòng dài ra mà không thêm gì mới.
 *
 * Cách này thay cho bản dùng `Tone.Loop` dựng lại lịch ở đầu mỗi lượt. Bản đó
 * hỏng vì lẫn hai đồng hồ: callback của `Tone.Loop` nhận thời gian của
 * **AudioContext** (để đưa thẳng cho `triggerAttackRelease`), nhưng
 * `Part.start()` lại nhận thời gian của **Transport**. Truyền nhầm giữa hai hệ
 * thì Part bị xếp lịch ở một chỗ vô nghĩa và không nốt nào kêu.
 */
const LOOP_PASSES = 3

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
  source: readonly ScheduledHit[] | ((pass: number) => readonly ScheduledHit[]),
  bpm: number,
  loopLengthBeats?: number,
  /**
   * Bắt đầu phát từ phách thứ mấy thay vì từ đầu vòng.
   *
   * Có để người dùng bấm vào một hợp âm trên bản nhạc rồi nghe từ đúng chỗ đó.
   * Cách làm là **tua đồng hồ vận chuyển**, không phải cắt bớt sự kiện: `Part`
   * đã nằm trên dòng thời gian của đồng hồ, nên tua đồng hồ là tua luôn phần
   * đệm, và những gì đứng trước mốc vẫn còn nguyên cho vòng lặp sau.
   */
  startAtBeat = 0,
): void {
  if (!isAudioReady()) return

  const build = typeof source === 'function' ? source : () => source
  const first = build(0)
  if (first.length === 0) return

  stopTimelineLoop()

  Tone.getTransport().bpm.value = Math.max(1, bpm)
  const synthInstance = getSynth()

  const passLength = Math.max(
    1,
    loopLengthBeats ??
      Math.ceil(
        Math.max(...first.map((hit) => hit.startBeat + hit.durationBeats)),
      ),
  )

  // Dựng sẵn từng lượt rồi dời sang vị trí của nó trên vòng lặp dài.
  const events: LoopEvent[] = []
  for (let pass = 0; pass < LOOP_PASSES; pass += 1) {
    const offset = pass * passLength
    const hits = pass === 0 ? first : build(pass)

    for (const hit of hits) {
      if (hit.notes.length === 0) continue
      events.push({
        time: { '4n': hit.startBeat + offset },
        notes: hit.notes.map(toFrequency),
        duration: { '4n': Math.max(0.05, hit.durationBeats) },
        velocity: hit.velocity / 127,
      })
    }
  }

  const part = new Tone.Part<LoopEvent>((time, value) => {
    synthInstance.triggerAttackRelease(
      value.notes,
      value.duration,
      time,
      value.velocity,
    )
  }, events)

  part.loop = true
  part.loopEnd = { '4n': passLength * LOOP_PASSES }
  part.start(0)
  loopPart = part

  /*
    Báo vị trí cho giao diện ở độ phân giải móc kép. Dày hơn nữa cũng không
    thấy được bằng mắt, mà lại bắt React vẽ lại liên tục.
  */
  const ticker = new Tone.Loop((time) => {
    const transport = Tone.getTransport()
    const beats = transport.ticks / transport.PPQ

    Tone.getDraw().schedule(() => {
      usePlaybackStore.setState({ positionBeats: beats })
    }, time)
  }, '16n')

  ticker.start(0)
  positionTicker = ticker

  acquireTransport('timeline-loop')

  const transport = Tone.getTransport()
  const from = Math.max(0, startAtBeat)
  if (from > 0) transport.ticks = Math.round(from * transport.PPQ)

  usePlaybackStore.setState({ looping: true, positionBeats: from })
}

/** Dừng vòng lặp phần đệm. */
export function stopTimelineLoop(): void {
  /*
    Huỷ `Part` là huỷ luôn lịch của nó, nên bấm dừng là im ngay. Đây là lý do
    phải để `Part` tự giữ lịch thay vì gọi thẳng `triggerAttackRelease`: lệnh
    đó đẩy nốt xuống tận đồng hồ thẻ âm thanh, dừng rồi vẫn kêu tới hết lượt.
  */
  loopPart?.stop()
  loopPart?.dispose()
  loopPart = null

  positionTicker?.stop()
  positionTicker?.dispose()
  positionTicker = null

  releaseTransport('timeline-loop')
  releaseAllNotes()
  usePlaybackStore.setState({ looping: false, positionBeats: 0 })
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
