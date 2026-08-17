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
export type InstrumentId = 'piano' | 'epiano' | 'synth' | 'guitar'

export const INSTRUMENTS: readonly { id: InstrumentId; label: string }[] = [
  { id: 'piano', label: 'Piano' },
  { id: 'guitar', label: 'Guitar' },
  { id: 'epiano', label: 'E-Piano' },
  { id: 'synth', label: 'Synth' },
]

export interface AudioState {
  ready: boolean
  /** Âm lượng tính bằng decibel; 0 là mức gốc. */
  volumeDb: number
  instrument: InstrumentId
  setReady: (ready: boolean) => void
  setVolumeDb: (volumeDb: number) => void
  setInstrument: (instrument: InstrumentId) => void
}

function readInstrument(): InstrumentId {
  const saved = readSetting('instrument')
  return saved === 'epiano' || saved === 'synth' || saved === 'guitar' || saved === 'piano'
    ? saved
    : 'piano'
}

export const useAudioStore = create<AudioState>((set) => ({
  ready: false,
  volumeDb: readSetting('volumeDb'),
  instrument: readInstrument(),
  setReady: (ready) => set({ ready }),
  setVolumeDb: (volumeDb) => set({ volumeDb }),
  setInstrument: (instrument) => set({ instrument }),
}))

type Voice = Tone.PolySynth | Tone.Sampler

let voice: Voice | null = null

const PIANO_NOTES = [
  'A1',
  'C2',
  'Ds2',
  'Fs2',
  'A2',
  'C3',
  'Ds3',
  'Fs3',
  'A3',
  'C4',
  'Ds4',
  'Fs4',
  'A4',
  'C5',
  'Ds5',
  'Fs5',
  'A5',
  'C6',
] as const

function applyVolume(instrument: Voice): Voice {
  instrument.volume.value = useAudioStore.getState().volumeDb
  return instrument
}

function createSynth(): Tone.PolySynth {
  return applyVolume(
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.7,
        sustain: 0.18,
        release: 1.1,
      },
    }).toDestination(),
  )
}

function createPianoFallback(): Tone.PolySynth {
  return applyVolume(
    new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.4,
      envelope: { attack: 0.004, decay: 1.4, sustain: 0.12, release: 1.6 },
      modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.4 },
    }).toDestination(),
  )
}

function loadSampler(
  baseUrl: string,
  notes: readonly string[],
): Promise<Tone.Sampler> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), 15000)
    const sampler = new Tone.Sampler({
      urls: Object.fromEntries(notes.map((note) => [note, `${note}.mp3`])),
      baseUrl,
      onload: () => {
        window.clearTimeout(timer)
        resolve(sampler)
      },
      onerror: (error) => {
        window.clearTimeout(timer)
        sampler.dispose()
        reject(error)
      },
    })
    sampler.toDestination()
  })
}

function createEPiano(): Tone.PolySynth {
  return applyVolume(
    new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.2,
      modulationIndex: 12,
      envelope: { attack: 0.01, decay: 0.35, sustain: 0.15, release: 0.7 },
    }).toDestination(),
  )
}

const GUITAR_NOTES = ['A2', 'C3', 'A3', 'C4', 'A4', 'C5'] as const

async function createVoice(id: InstrumentId): Promise<Voice> {
  if (id === 'synth') return createSynth()
  if (id === 'epiano') return createEPiano()
  try {
    if (id === 'guitar') {
      return applyVolume(
        await loadSampler(
          'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/',
          GUITAR_NOTES,
        ),
      )
    }
    return applyVolume(await loadPiano())
  } catch {
    return id === 'piano' ? createPianoFallback() : createSynth()
  }
}

const STRUM_GAP = 0.014

function fireNotes(
  instrument: Voice,
  notes: number[],
  duration: Tone.Unit.Time,
  time: number,
  velocity: number,
): void {
  const strum =
    useAudioStore.getState().instrument === 'guitar' && notes.length > 1
  if (!strum) {
    instrument.triggerAttackRelease(notes, duration, time, velocity)
    return
  }
  notes.forEach((freq, index) => {
    instrument.triggerAttackRelease(
      freq,
      duration,
      time + index * STRUM_GAP,
      velocity * (1 - index * 0.04),
    )
  })
}

function softenPiano(sampler: Tone.Sampler): Tone.Sampler {
  sampler.disconnect()
  const filter = new Tone.Filter({
    frequency: 2000,
    type: 'lowpass',
    rolloff: -24,
  })
  sampler.chain(filter, Tone.getDestination())
  const dispose = sampler.dispose.bind(sampler)
  sampler.dispose = () => {
    filter.dispose()
    return dispose()
  }
  return sampler
}

async function loadPiano(): Promise<Tone.Sampler> {
  try {
    return softenPiano(
      await loadSampler(
        'https://nbrosowsky.github.io/tonejs-instruments/samples/piano/',
        ['A2', 'C3', 'A3', 'C4', 'A4', 'C5'],
      ),
    )
  } catch {
    return softenPiano(
      await loadSampler(
        'https://tonejs.github.io/audio/salamander/',
        PIANO_NOTES,
      ),
    )
  }
}

function getSynth(): Voice {
  if (!voice) throw new Error('audio not started')
  return voice
}

let boot: Promise<void> | null = null

/** Đổi nốt MIDI sang tần số để đưa vào Tone.js. */
function toFrequency(note: MidiNote): number {
  return Tone.Frequency(note, 'midi').toFrequency()
}

/**
 * Mở khoá âm thanh. Bắt buộc gọi từ một thao tác thật của người dùng
 * (bấm chuột, chạm màn hình) — trình duyệt chặn phát tiếng tự động.
 */
export function startAudio(): Promise<void> {
  if (voice && useAudioStore.getState().ready) return Promise.resolve()
  boot ??= (async () => {
    await Tone.start()
    if (!voice) {
      voice = await createVoice(useAudioStore.getState().instrument)
    }
    useAudioStore.getState().setReady(true)
  })()
  return boot
}

export async function setInstrument(id: InstrumentId): Promise<void> {
  writeSetting('instrument', id)
  useAudioStore.getState().setInstrument(id)
  if (boot) await boot
  if (!useAudioStore.getState().ready) return
  const next = await createVoice(id)
  voice?.dispose()
  voice = next
}

/**
 * Tự mở khoá âm thanh ở **thao tác đầu tiên** của người dùng, dù là thao tác gì.
 *
 * Trình duyệt chặn phát tiếng khi trang chưa được chạm vào, nên không thể bật
 * sẵn từ lúc tải trang. Nhưng cái chặn ấy chỉ đòi *một thao tác thật* — không
 * đòi phải là một nút riêng. Bắt luôn cú bấm đầu tiên thì người dùng không bao
 * giờ phải bấm "Bật âm thanh" nữa, mà vẫn đúng luật của trình duyệt.
 *
 * Trả về hàm gỡ, để React dọn được khi rời trang.
 */
export function armAudioOnFirstGesture(): () => void {
  if (useAudioStore.getState().ready) return () => {}

  function open() {
    void startAudio()
    remove()
  }

  function remove() {
    window.removeEventListener('pointerdown', open)
    window.removeEventListener('keydown', open)
  }

  window.addEventListener('pointerdown', open)
  window.addEventListener('keydown', open)

  return remove
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

    fireNotes(
      synthInstance,
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

/** Phách đang phát, đọc thẳng từ đồng hồ — dùng cho nốt rơi 60fps. */
export function getPlaybackBeats(): number {
  const transport = Tone.getTransport()
  return transport.ticks / transport.PPQ
}

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
export const LOOP_PASSES = 3

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
  /**
   * Phát **một lượt rồi dừng** thay vì lặp mãi.
   *
   * Bài đã có đoạn kết bài thì lặp lại là phá luôn cái kết: vừa nghe hợp âm
   * kết đọng xuống thì bài đã bắt đầu lại từ đầu. Bài chưa đánh dấu kết thì
   * vẫn lặp, vì lúc đó nó là vòng để tập chứ không phải một bài trọn vẹn.
   */
  once = false,
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

  /*
    Phát một lượt thì chỉ dựng **một** lượt. Dựng đủ ba như khi lặp thì nó phát
    cả bài ba lần rồi mới dừng.
  */
  const passes = once ? 1 : LOOP_PASSES

  // Dựng sẵn từng lượt rồi dời sang vị trí của nó trên vòng lặp dài.
  const events: LoopEvent[] = []
  for (let pass = 0; pass < passes; pass += 1) {
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
    fireNotes(synthInstance, value.notes, value.duration, time, value.velocity)
  }, events)

  const totalBeats = passLength * passes

  part.loop = !once
  part.loopEnd = { '4n': totalBeats }
  part.start(0)
  loopPart = part

  /*
    Hết một lượt thì tự dừng, và dừng bằng chính `stopTimelineLoop` để giao
    diện biết mà đổi nút về "phát" — tắt tiếng thôi thì nút vẫn hiện "dừng".

    Chờ thêm một ô nhịp trước khi dừng: nốt cuối cùng vẫn đang ngân, huỷ `Part`
    ngay lúc nó vừa gõ là cắt cụt tiếng đàn.
  */
  if (once) {
    Tone.getTransport().scheduleOnce(
      () => {
        Tone.getDraw().schedule(() => stopTimelineLoop(), Tone.now())
      },
      // Chờ thêm một ô nhịp cho nốt cuối ngân hết.
      { '4n': totalBeats + 4 },
    )
  }

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

  const transport = Tone.getTransport()
  const from = Math.max(0, startAtBeat)
  transport.ticks = Math.round(from * transport.PPQ)
  acquireTransport('timeline-loop')

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
  if (!voice) return
  voice.releaseAll(Tone.now())
}

/** Chỉnh âm lượng, tính bằng decibel. */
export function setVolumeDb(volumeDb: number): void {
  useAudioStore.getState().setVolumeDb(volumeDb)
  writeSetting('volumeDb', volumeDb)
  if (voice) voice.volume.value = volumeDb
}

/** Dọn dẹp khi thoát. */
export function disposeAudio(): void {
  voice?.dispose()
  voice = null
  boot = null
  useAudioStore.getState().setReady(false)
}
