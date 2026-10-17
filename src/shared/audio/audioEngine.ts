import * as Tone from 'tone'
import { create } from 'zustand'
import { useMidiStore } from '../midi/midiStore'
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
  /** Tắt tiếng phím bấm — `useLiveSound` không đánh nốt; đổi bằng `setTatTiengPhim`. */
  tatTiengPhim: boolean
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
  tatTiengPhim: readSetting('tatTiengPhim'),
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

function applyVolume<T extends Voice>(instrument: T): T {
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

/*
  BỘ TRỐNG — nền beat (người dùng 15/10/2026: "backing track ko cần chơi giai điệu nhiều mà chỉ có beat … tạo ra dạng backing track bằng beat
  tương tự vậy"). Mẫu trống của Tone.js (cùng nơi app tải mẫu piano), chọn theo số đo trên bè trống của video D:\PianoBrain\video\Beat (tách
  bằng demucs; 5 kick · 9 snare · 15 hi-hat của video so với 10 bộ — `tools/do_beat_video.py`): tỉ lệ năng lượng 4 dải 0 – 100 ms sau
  tiếng (dưới 120 · 150 – 400 · 400 – 5 k · trên 5 kHz, lệch tính tổng trị tuyệt đối), độ tắt −20 dB phân xử khi gần nhau:
  - kick CR78 — mọi bộ gần như cùng dải (lệch 0,01 – 0,09); tắt 67 ms, video 64 ms;
  - snare Kit8 — lệch dải 0,41, tắt 84 ms; snare video mỏng (thân 150 – 400 Hz 11 %, tắt 38 ms). Cũ (bản đầu cùng ngày): Kit3 — chọn theo
    hình phổ mel, nhưng thân 150 – 400 Hz tới 56 % (lệch dải 0,91). Stark lệch dải ít nhất (0,29) mà tắt 168 ms, dài hơn một móc kép ở ♩ 100.
    Lùi về Kit3 nếu người dùng thấy snare mỏng, rè quá;
  - hi-hat acoustic-kit — lệch dải 0,10, ít nhất trong 10 bộ; tắt 171 ms (video 75 ms);
  - gõ vành (GM 37 — cross-stick của Bossa, nền theo điệu 16/10/2026): mẫu snare CR78 — giòn, ngắn (tắt 46 ms, gần như không có thân
    150 – 400 Hz), khác hẳn snare Kit8. Chọn là của Claude; Tone.js không có mẫu gõ vành riêng.
  Nốt trống theo số GM: 36 kick · 37 gõ vành · 38 snare · 42 hi-hat. Mất mạng thì trống tổng hợp (MembraneSynth · NoiseSynth) để nền không câm.
*/
const TRONG_MAU: Readonly<Record<number, string>> = { 36: 'CR78/kick.mp3', 37: 'CR78/snare.mp3', 38: 'Kit8/snare.mp3', 42: 'acoustic-kit/hihat.mp3' }
/** Trống nhỏ hơn piano 3 dB — tiếng bạn đánh nổi trên nền (Claude chọn, chưa nghe thử; nền nhỏ quá thì lùi về 0). */
const TRONG_DB = -3

interface BoTrong {
  loai: 'mau' | 'tong-hop'
  danh: (midi: number, time: number, velocity: number) => void
  amLuong: (db: number) => void
  dispose: () => void
}
let boTrong: BoTrong | null = null
let napTrong: Promise<void> | null = null

function trongMau(): Promise<BoTrong> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), 15000)
    const s = new Tone.Sampler({
      urls: Object.fromEntries(Object.entries(TRONG_MAU).map(([m, tep]) => [Tone.Frequency(Number(m), 'midi').toNote(), tep])),
      baseUrl: 'https://tonejs.github.io/audio/drum-samples/',
      onload: () => {
        window.clearTimeout(timer)
        resolve({
          loai: 'mau',
          // Không nhả: mẫu trống tự tắt hết đuôi.
          danh: (m, t, v) => s.triggerAttack(toFrequency(m), t, v),
          amLuong: (db) => {
            s.volume.value = db
          },
          dispose: () => s.dispose(),
        })
      },
      onerror: (error) => {
        window.clearTimeout(timer)
        s.dispose()
        reject(error)
      },
    }).toDestination()
  })
}

function trongTongHop(): BoTrong {
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 } }).toDestination()
  const locSnare = new Tone.Filter(1500, 'highpass').toDestination()
  const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.09, sustain: 0 } }).connect(locSnare)
  const locHat = new Tone.Filter(8000, 'highpass').toDestination()
  const hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).connect(locHat)
  return {
    loai: 'tong-hop',
    danh: (m, t, v) => {
      if (m === 36) kick.triggerAttackRelease('C1', 0.2, t, v)
      else if (m === 38 || m === 37) snare.triggerAttackRelease(m === 37 ? 0.04 : 0.1, t, v)
      else hat.triggerAttackRelease(0.05, t, v)
    },
    amLuong: (db) => {
      kick.volume.value = db
      snare.volume.value = db
      hat.volume.value = db
    },
    dispose: () => [kick, snare, hat, locSnare, locHat].forEach((x) => x.dispose()),
  }
}

/** Nạp bộ trống — gọi sau `startAudio`, trước khi phát nền có tiếng trống (`ScheduledHit.trong`). */
export function chuanBiTrong(): Promise<void> {
  napTrong ??= (async () => {
    let b: BoTrong
    try {
      b = await trongMau()
    } catch {
      b = trongTongHop()
    }
    b.amLuong(useAudioStore.getState().volumeDb + TRONG_DB)
    boTrong = b
  })()
  return napTrong
}

/** Bộ trống đang dùng: mẫu thu sẵn, trống tổng hợp (mất mạng), hay chưa nạp. */
export const loaiTrong = (): BoTrong['loai'] | null => boTrong?.loai ?? null


/** Lời hứa TẠO GIỌNG ĐÀN — giữ một lần. Việc mở ngữ cảnh tiếng (resume) không nằm trong này: mỗi lần `startAudio` đều thử lại. */
let boot: Promise<void> | null = null
/**
 * Chờ lời mở tiếng bao lâu thì thôi. Trình duyệt chặn lời mở (chưa có thao tác hợp lệ) thì lời hứa của nó treo mãi — người chơi vẫn phải
 * vào được game, tiếng mở ở thao tác kế tiếp. Claude chọn, chưa đo; trong thao tác hợp lệ lời mở xong sau vài mili giây.
 */
const RESUME_CHO_MS = 300
/**
 * Sự kiện có quyền mở tiếng (HTML: "activation-triggering input events"). Chạm cảm ứng chỉ có quyền lúc NHẤC ngón (pointerup · touchend),
 * chuột thì lúc nhấn xuống (mousedown), bàn phím lúc keydown.
 */
const SU_KIEN_MO_TIENG = ['pointerup', 'touchend', 'mousedown', 'keydown'] as const

/** Đổi nốt MIDI sang tần số để đưa vào Tone.js. */
function toFrequency(note: MidiNote): number {
  return Tone.Frequency(note, 'midi').toFrequency()
}

/**
 * Mở khoá âm thanh. Bắt buộc gọi từ một thao tác thật của người dùng
 * (bấm chuột, chạm màn hình) — trình duyệt chặn phát tiếng tự động.
 *
 * Android (16/10/2026, chạy thử giả lập máy Android trước khi đưa lên điện thoại): với chạm cảm ứng, quyền phát tiếng chỉ có lúc NHẤC
 * ngón. Bản cũ gọi `Tone.start()` ngay ở cú chạm XUỐNG đầu tiên (`pointerdown`) — trình duyệt chặn, lời hứa treo mãi, mà lời hứa ấy được
 * giữ lại (`boot`) nên mọi lần gọi sau cùng chờ nó: không có tiếng cả buổi, và game nào `await startAudio()` trước khi vào cũng kẹt ở màn
 * chọn (12/75 bước hỏng). Nay mỗi lần gọi đều thử mở lại ngữ cảnh (gọi đồng bộ, trước mọi await); chỉ việc tạo giọng đàn được giữ một lần;
 * lời mở bị chặn thì chờ tối đa `RESUME_CHO_MS` rồi cho đi tiếp.
 */
export function startAudio(): Promise<void> {
  const chay = Tone.getContext().state === 'running'
  if (voice && useAudioStore.getState().ready && chay) return Promise.resolve()
  const mo = chay ? Promise.resolve() : Tone.start().catch(() => undefined)
  boot ??= (async () => {
    if (!voice) {
      voice = await createVoice(useAudioStore.getState().instrument)
    }
    useAudioStore.getState().setReady(true)
  })()
  const cho = new Promise<void>((xong) => setTimeout(xong, RESUME_CHO_MS))
  return Promise.all([boot, Promise.race([mo, cho])]).then(() => undefined)
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
  /* Nghe mọi thao tác có quyền mở tiếng, và KHÔNG gỡ sau lần đầu: ngữ cảnh tiếng có thể bị treo lại (điện thoại có cuộc gọi, app chạy nền) —
     thao tác kế tiếp mở lại. Ngữ cảnh đang chạy thì `open` không làm gì. Cũ (tới 16/10/2026): nghe `pointerdown` một lần rồi gỡ — trên
     điện thoại cú chạm xuống chưa có quyền nên tiếng không bao giờ mở (xem `startAudio`). */
  function open() {
    if (Tone.getContext().state !== 'running' || !useAudioStore.getState().ready) void startAudio()
  }

  function remove() {
    for (const loai of SU_KIEN_MO_TIENG) window.removeEventListener(loai, open, true)
  }

  for (const loai of SU_KIEN_MO_TIENG) window.addEventListener(loai, open, true)

  return remove
}

export function isAudioReady(): boolean {
  return useAudioStore.getState().ready
}

/*
  Phím người chơi bấm phát NGAY (`Tone.immediate()` = `currentTime`), không qua khoảng đệm lookAhead.

  Cũ (tới 2/10/2026): `Tone.now()` = `currentTime + lookAhead`, mà lookAhead mặc định của Tone là 0,1 s (app không
  chỉnh) — mỗi phím bấm kêu muộn thêm 100 ms, cộng dồn lên trễ loa/tai nghe. Người dùng đeo Galaxy Buds 2 thấy
  "độ trễ âm thanh quá lớn". Khoảng đệm ấy cần cho nốt XẾP LỊCH trước (nhạc nền trên đồng hồ vận chuyển), không cần
  cho phím vừa bấm.

  Lùi khi: tiếng phím bấm nứt, mất hay bị cắt lúc nhạc nền đang phát — Tone khuyên không trộn `now` với `immediate`
  cho những tiếng cần khớp nhau; phím bấm thì không xếp lịch cùng nhạc nền.
*/

/** Bấm và giữ một nốt. `velocity` theo thang MIDI 0-127. */
/** Lực của tiếng phím bấm — như nhau mọi cú bấm (bỏ cảm ứng lực 17/10/2026), bằng lực phím ảo. */
const LUC_TIENG_PHIM = 90

/**
 * Đánh một nốt PHÍM BẤM (đàn MIDI · phím ảo · phím máy tính — chỉ `useLiveSound` gọi). Nút "Tiếng phím" tắt (`tatTiengPhim`, 16/10/2026)
 * thì im: đánh trên đàn thật chỉ nghe tiếng đàn, app còn phát nền. Nhả (`releaseNote`) vẫn chạy — tắt giữa lúc giữ phím thì nốt đang
 * kêu không bị treo.
 *
 * Người dùng 17/10/2026: "hãy bỏ phần cảm ứng lực khi nhấn phím đàn. Đảm bảo rằng app cho Android chỉ cần nhấn phím 1 lần là nhận":
 * - lực nhấn không đổi tiếng (`LUC_TIENG_PHIM`). Cũ: velocity / 127 — chạm nhẹ trên đàn thật kêu rất nhỏ, như chưa nhận;
 * - tiếng chưa mở (cú chạm đầu sau khi mở app — Android chỉ cho mở lúc NHẤC ngón —, hay Android treo tiếng khi app chạy nền) thì mở
 *   rồi đánh chính nốt ấy ngay khi mở xong: ngón còn giữ thì đánh tiếp, đã nhấc thì một tiếng ngắn. Cũ: cú bấm ấy câm, phải bấm lại.
 */
export function attackNote(note: MidiNote): void {
  if (useAudioStore.getState().tatTiengPhim) return
  if (isAudioReady() && Tone.getContext().state === 'running') {
    getSynth().triggerAttack(toFrequency(note), Tone.immediate(), LUC_TIENG_PHIM / 127)
    return
  }
  void startAudio().then(() => {
    if (Tone.getContext().state !== 'running' || useAudioStore.getState().tatTiengPhim) return
    if (useMidiStore.getState().heldNotes.includes(note)) getSynth().triggerAttack(toFrequency(note), Tone.immediate(), LUC_TIENG_PHIM / 127)
    else playChord([note], '8n', LUC_TIENG_PHIM)
  })
}

/** Nhả một nốt đang giữ. */
export function releaseNote(note: MidiNote): void {
  if (!isAudioReady()) return
  getSynth().triggerRelease(toFrequency(note), Tone.immediate())
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
  /** Gõ bằng bộ trống (`chuanBiTrong`) — nốt là số GM: 36 kick · 37 gõ vành · 38 snare · 42 hi-hat. */
  trong?: boolean
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

/*
  Bù lệch giữa **tiếng nghe được** và **hình vẽ ra**.

  Đồng hồ của Tone không phải đồng hồ của tai. `Clock.ticks` đọc vị trí tại
  `currentTime + lookAhead` — mặc định sớm hơn 0,1 giây — vì đó là chỗ Tone
  đang *xếp lịch*, không phải chỗ loa đang *kêu*. Cộng thêm `outputLatency` của
  chính máy: quãng đường từ lúc mẫu tiếng rời trình duyệt tới lúc màng loa
  động. Trên Windows con số ấy thường 100–250 ms và không hằng số nào trong app
  từng bù nó.

  Hệ quả là nốt rơi chạm lằn kẻ ở một lúc, tiếng đàn kêu ở một lúc khác — và
  lệch bao nhiêu thì tuỳ máy, tuỳ trình duyệt, tuỳ tai nghe hay loa ngoài.

  Nên có hai thứ ở đây: một con số **mặc định tính từ chính máy đang chạy**, và
  một con số **người chơi tự dò**. Người chỉnh A/V sync bao giờ cũng dò bằng tai
  chứ không tính ra, vì thứ cần khớp nằm trong đầu người nghe.

  Dấu: **dương** nghĩa là hình đang chạy trước, kéo hình chậm lại. **Âm** nghĩa
  là tiếng đang chạy trước, kéo hình nhanh lên.
*/
/** Không nhận quá nửa giây mỗi chiều: quá đó là hỏng chỗ khác, không phải lệch. */
export const SYNC_LIMIT_MS = 500

/**
 * Bù mặc định, đo từ chính máy đang chạy.
 *
 * Đã đo độ trễ ở chế độ Theo nhịp (`latencyMs` — gõ theo click: trễ loa/tai nghe + trễ đàn + thói quen tay) thì lấy
 * lookAhead + số đo ấy. Lý do: tai nghe Bluetooth thì `outputLatency` trình duyệt báo thiếu — người dùng đeo Galaxy
 * Buds 2 đo ra 251–278 ms (2/10/2026) mà máy báo ~0, hình chạy trước tiếng cả phần tư giây. Số đo lẫn thói quen tay
 * (người gõ theo click hay đón sớm vài chục ms) nên hình có thể sớm chừng ấy; thanh trượt vẫn chỉnh tay được.
 * Chưa đo thì như cũ: lookAhead + `outputLatency`.
 */
export function defaultSyncOffsetMs(): number {
  try {
    const context = Tone.getContext()
    const measured = readSetting('latencyMs')
    if (measured !== null) {
      const ms = Math.round(context.lookAhead * 1000 + measured)
      return Math.max(-SYNC_LIMIT_MS, Math.min(SYNC_LIMIT_MS, ms))
    }
    const raw = context.rawContext as unknown as { outputLatency?: number }
    const output =
      typeof raw.outputLatency === 'number' && Number.isFinite(raw.outputLatency)
        ? raw.outputLatency
        : 0
    return Math.round((context.lookAhead + output) * 1000)
  } catch {
    // Chưa có AudioContext — lúc chạy test, hoặc trước khi người dùng bấm phát.
    return 100
  }
}

let syncOffsetMs: number | null = null

export function getSyncOffsetMs(): number {
  return syncOffsetMs ?? defaultSyncOffsetMs()
}

/**
 * Đặt mức bù. Việc **nhớ** con số này là của giao diện, không phải của đây:
 * `shared/persistence/localSettings` đã là chỗ cất cài đặt của cả app, và một
 * cái kho thứ hai nằm trong bộ máy âm thanh là một chỗ nữa để hai bên lệch nhau.
 */
export function setSyncOffsetMs(ms: number | null): void {
  // `null` = chưa dò tay: `getSyncOffsetMs` tính mặc định mỗi lần đọc, đo độ trễ xong là theo ngay.
  syncOffsetMs = ms === null ? null : Math.max(-SYNC_LIMIT_MS, Math.min(SYNC_LIMIT_MS, Math.round(ms)))
}

/**
 * Phách đang phát, đọc thẳng từ đồng hồ — dùng cho nốt rơi 60fps.
 *
 * Đã trừ phần bù lệch, nên con số này là **chỗ tai đang nghe**, không phải chỗ
 * Tone đang xếp lịch. Mọi thứ vẽ theo nó — nốt rơi và phím sáng — vì thế khớp
 * với nhau và khớp với tiếng.
 */
export function getPlaybackBeats(): number {
  const transport = Tone.getTransport()
  const raw = transport.ticks / transport.PPQ
  const beatsPerSecond = transport.bpm.value / 60
  return raw - (getSyncOffsetMs() / 1000) * beatsPerSecond
}

/**
 * Phách của đồng hồ phát nhạc tại một mốc `performance.now()` — để chấm phím bấm ở chế độ chơi theo nhịp.
 *
 * Là phách ở giờ của đồng hồ thẻ âm thanh, CHƯA trừ trễ ra loa và chưa trừ bù lệch hình–tiếng. Trễ loa, trễ
 * đàn và thói quen đánh sớm/muộn của người chơi gộp vào MỘT con số đo bằng lượt gõ theo click
 * (`latencyFromTaps`) — tách từng phần thì phải đo từng phần, mà trễ đàn thì trình duyệt không đo được.
 *
 * ponytail: `currentTime` nhảy theo khối âm thanh (vài–10 ms) nên mỗi tiếng nhiễu cỡ ấy. Cần mịn hơn thì dùng
 * `getOutputTimestamp` của AudioContext gốc — Tone bọc qua standardized-audio-context, lớp ấy không lộ hàm này.
 */
export function beatAtPerformanceTime(performanceMs: number): number {
  const at = Tone.getContext().currentTime + (performanceMs - performance.now()) / 1000
  const transport = Tone.getTransport()
  return transport.getTicksAtTime(at) / transport.PPQ
}

/** Đồng hồ báo vị trí cho giao diện, chạy song song với vòng lặp phần đệm. */
let positionTicker: Tone.Loop | null = null

/** Một sự kiện đã xếp lịch cho vòng lặp. */
interface LoopEvent {
  time: Tone.Unit.Time
  notes: number[]
  duration: Tone.Unit.Time
  velocity: number
  /** Số GM của tiếng trống (bộ trống thay cho đàn). */
  trong?: number[]
}

let loopPart: Tone.Part<LoopEvent> | null = null
let loopFollowUp: number | null = null

function clearLoopFollowUp(): void {
  if (loopFollowUp === null) return
  Tone.getTransport().clear(loopFollowUp)
  loopFollowUp = null
}

/**
 * Bước đếm còn dùng ở đường đổi điệu cũ trong ReharmHome.
 * Không phải số câu dựng sẵn của bộ phát: startTimelineLoop gọi source(pass)
 * lại ở mỗi vòng. Giang thứ Tuấn dùng bộ đếm riêng phraseTakes.
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

  const fire = (time: number, value: LoopEvent) => {
    if (value.trong) {
      for (const m of value.trong) boTrong?.danh(m, time, value.velocity)
      return
    }
    fireNotes(synthInstance, value.notes, value.duration, time, value.velocity)
  }

  const attach = (hits: readonly ScheduledHit[], atBeat: number, boundaryTime?: number) => {
    const events: LoopEvent[] = []
    for (const hit of hits) {
      if (hit.notes.length === 0) continue
      const event: LoopEvent = {
        time: { '4n': atBeat + hit.startBeat },
        notes: hit.notes.map(toFrequency),
        duration: { '4n': Math.max(0.05, hit.durationBeats) },
        velocity: hit.velocity / 127,
        ...(hit.trong ? { trong: [...hit.notes] } : {}),
      }
      // Transport đang duyệt tick đầu của lượt mới: Part thêm trong callback
      // không nhận lại tick đó. Phát onset 0 bằng giờ AudioContext callback;
      // mọi onset sau vẫn xếp bằng phách Transport, không lẫn hai đồng hồ.
      if (boundaryTime !== undefined && hit.startBeat === 0) fire(boundaryTime, event)
      else events.push(event)
    }
    const part = new Tone.Part<LoopEvent>(fire, events)
    part.loop = false
    part.start(0)
    const prev = loopPart
    loopPart = part
    if (prev) {
      prev.stop()
      prev.dispose()
    }
  }

  attach(first, 0)

  if (once) {
    loopFollowUp = Tone.getTransport().scheduleOnce(() => {
      Tone.getDraw().schedule(() => stopTimelineLoop(), Tone.now())
    }, { '4n': passLength + 4 })
  } else {
    let gen = 0
    const arm = (atBeat: number) => {
      loopFollowUp = Tone.getTransport().scheduleOnce((time) => {
        gen += 1
        // Callback ở đầu lượt KẾ; đặt nốt tại vạch này, không lùi một lượt vào quá khứ.
        attach(build(gen), atBeat + passLength, time)
        arm(atBeat + passLength)
      }, { '4n': atBeat + passLength })
    }
    arm(0)
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
  clearLoopFollowUp()
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
  boTrong?.amLuong(volumeDb + TRONG_DB)
}

/** Bật / tắt tiếng phím bấm (nhớ qua các lần mở app). Tắt giữa lúc đang giữ phím: nốt đang kêu vẫn nhả như thường. */
export function setTatTiengPhim(tat: boolean): void {
  useAudioStore.setState({ tatTiengPhim: tat })
  writeSetting('tatTiengPhim', tat)
}

/**
 * Đổi nhịp độ của vòng phát đang chạy (`startTimelineLoop`) — giữa chừng, không ngắt: lịch ghi theo phách nên nền co giãn theo, và
 * `getPlaybackBeats` vẫn liền mạch. Game rơi đổi tốc độ khi đang chơi (người dùng 16/10/2026: "cho các game có thể chọn tốc độ phát").
 */
export function setTimelineBpm(bpm: number): void {
  Tone.getTransport().bpm.value = Math.max(1, bpm)
}

/** Dọn dẹp khi thoát. */
export function disposeAudio(): void {
  voice?.dispose()
  voice = null
  boTrong?.dispose()
  boTrong = null
  napTrong = null
  boot = null
  useAudioStore.getState().setReady(false)
}
