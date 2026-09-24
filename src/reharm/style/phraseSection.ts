import { laBossaCP } from './styleLibrary/caPhaoBossa'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { holdUntilStruckAgain, renderPattern } from './patternRenderer'
import { khongTiaTayTrai, laBoleroTuan, thienVeCuaHo } from './hoDieu'
import { soloTeacherOf } from '../fillSoloGenerator/soloTeacher'
import { caPhaoSolo, caPhaoBossaMinorIntro, caPhaoBossaMinorSolo, caPhaoFullSolo } from './caPhaoSolo'
import { composeCpSolo } from './cpComposition'
import { giaiDieuDaoLinhNhi, vonO } from './giaiDieuDaoLinhNhi'
import { nhipVong, vonHopAmLinhNhi } from './vonHopAmLinhNhi'
import { avoidMelodyClash, interlockHands, soloLeftHand } from './soloLeftHand'
import { cueChord, phraseChords } from './phraseChords'
import { cueStrike, slowClose, tamBao } from './phraseCue'
import { chiecLaMotif } from './chiecLaMotif'
import { arcDungXa, hutDungXa } from './daoDungXa'
import { turnaroundInto } from './turnaround'
import { minorSoloSourceForTake, nguonKetThuBolero, planMinorOutro, planMinorInterlude } from './minorSoloSource'

/**
 * Ráp một đoạn dạo đầu hoặc một đoạn kết.
 *
 * Trước đây phần ráp này nằm trong thân một component React, nên không có cách
 * nào gọi nó từ test — và chính chỗ ấy sinh ra lỗi đè nốt ở đoạn kết mà không
 * lưới nào bắt được: bộ test cũ chỉ kiểm **phần đệm**, còn thứ tai nghe là phần
 * đệm cộng câu ngẫu hứng cộng hợp âm báo, sau khi đã ráp. Tách ra đây để lưới
 * bắt được đúng thứ người ta nghe.
 */
export interface PhraseSectionOptions {
  /** Color Cà Pháo: recompose harmony, rhythm and melody, not archive playback. */
  caPhaoCompose?: boolean
  /** Whole-source simulation: no development or cadence substitution. */
  caPhaoSimulate?: boolean
  /** Opt-in complete CP sheet sections; false/absent leaves the existing solo untouched. */
  caPhaoFull?: boolean
  caPhaoFullSource?: string
  /** Actual available keys for full CP solos, independent of the short-solo range. */
  caPhaoKeyboardRange?: { low: MidiNote; high: MidiNote }
  kind: 'intro' | 'outro' | 'interlude'
  key: { tonic: PitchClass; scale: ScaleType } | null
  style: StylePattern
  beatsPerChord: number
  /** Actual playback tempo, used to reject unplayably compressed source runs. */
  bpm?: number
  dropRoot: boolean
  /** Hợp âm mở bài — hợp âm báo cuối dạo đầu hút về chính nó. */
  opening: ParsedChord | null
  /** Câu ngẫu hứng cho một vòng hợp âm; cùng bộ soạn nốt với đoạn giang tấu. */
  solo: (chords: readonly ParsedChord[]) => readonly TimelineEvent[]
  /**
   * Gam để dựng câu, nếu điệu này dùng lối bám tay trái.
   *
   * Bỏ trống thì `solo` chạy như cũ — mọi điệu không thuộc họ có khai lối ấy
   * đều đi đường cũ, không đổi gì.
   */
  scale?: readonly PitchClass[]
  /**
   * Số lượt, để mỗi lần chơi ra một câu khác — Y NHƯ GIANG TẤU.
   *
   * Thiếu nó thì lối bám tay trái nhận `take` mặc định 0, và dạo đầu với kết
   * bài phát lại đúng một câu mỗi lần trong khi giang tấu thì đổi. Đường
   * `solo` cũ đã tự xoay theo lượt từ trước, nên chỉ nhánh này bị kẹt.
   */
  take?: number
  /**
   * Tầm nốt tay phải. Bỏ trống thì dùng tầm rộng cũ của hai đoạn này.
   *
   * Có mặt ở đây để dạo đầu và kết bài nhận ĐÚNG tầm mà giang tấu đang dùng:
   * bản trước đóng cứng đáy 57 trong khi giang tấu đi từ 62, nên cùng một bài
   * cùng một điệu mà hai đoạn với xuống thấp hơn hẳn.
   */
  range?: { low: MidiNote; high: MidiNote }
  /**
   * Vòng hợp âm thật của bài — đoạn dạo mượn hợp âm từ đây thay vì dựng theo bậc.
   *
   * Xem `phraseChords.ts`. Bỏ trống thì vẫn dựng theo bậc như cũ, đúng cho
   * luồng gõ vòng hợp âm trơn: ở đó không có bài nào để mượn.
   */
  songChords?: readonly ParsedChord[]
  /** Thầy cho vòng dạo/kết — không đổi điệu đệm. */
  thay?: import('../fillSoloGenerator/soloTeacher').SoloTeacher
  vongPhienKhuc?: readonly ParsedChord[]
  /** Tỉ lệ ô chia đôi của ĐOẠN HÁT — đoạn dạo Linh Nhi chia theo nó, hệ số 0,45. */
  tiLeChiaHat?: number
  songIntro?: readonly ParsedChord[]
/** Ostinato Bb–A–D Chiếc Lá — chỉ dạo. */
  motif?: 'chiec-la'
  /** Ô tick nghe thử: siết mức bám hợp âm về đúng bản ký âm. */
  siet?: boolean
  /** Ô tick nghe thử: vòng dạo giống sheet trưởng. */
  daoTruong?: boolean
  /** Ô tick nghe thử: vòng dạo giống sheet thứ. */
  daoThu?: boolean
  /** Ô tick nghe thử: vòng giang giống sheet thứ. */
  giangThu?: boolean
  /** Giang thứ Tuấn: ii–V dặm hoặc V ngân; đích nằm ở đầu đoạn hát kế. */
  interludeCadence?: 'dominant' | 'ii-v'
  /** Ô tick: câu chạy tự soạn 4/6. Tắt = chép sheet thứ. */
  chayNgan?: boolean
}

export interface PhraseSection {
  events: TimelineEvent[]
  lengthBeats: number
  /**
   * Ký hiệu hợp âm của chính đoạn này, đúng thứ tự chơi.
   *
   * Có mặt ở đây để bảng hợp âm đoạn dạo / đoạn kết **sáng theo chỗ đang chơi và bấm
   * vào được**. Đoạn dạo không mượn vòng của đoạn nào nên nó không đẩy `segments` nào
   * cả — thiếu chỗ này thì không có cách nào biết đang chơi tới hợp âm thứ mấy.
   */
  chords: readonly string[]
  /** Mỗi hợp âm dài mấy phách, cùng độ dài với `chords`. */
  beatsEach: readonly number[]
  /** Dấu vết của vòng outro kiểm chứng, không suy nguồn từ số lượt phát. */
  sourcePhrase?: { id: string; fromBar: number; barCount: number; method?: 'motif-development' | 'full-sheet' | 'cp-composition' | 'source-variation'; song?: string }
  developmentSources?: { id: string; song: string; genre: string; mode: string;
    sourceBar: number; targetBar: number; method: 'contour-on-bossa-rhythm' }[]
  unavailableReason?: string
  adaptationNote?: string
  compositionSources?: { bar: number; start: number; end: number; harmony: string; melody: string; rhythm: string;
    donorGenre: string; mode: string; sourceKind: string }[]
  compositionTechniques?: { source: string; startBeat: number; kind: 'neighbor-cluster' | 'octave-line' | 'left-answer' | 'third-dyad' | 'sixth-dyad' | 'semitone-approach' | 'written-grace' }[]
}

/**
 * Thưa bớt tay phải ở ĐOẠN KẾT cho về đúng mật độ bản ký âm.
 *
 * Đo bảy bản ký âm, mốc gõ tay phải mỗi ô ở đoạn kết: **5,7 giọng thứ · 5,0 giọng
 * trưởng**. App ra **6,8 và 6,1** — dày hơn khoảng một phần năm.
 *
 * Cần gạt `density` KHÔNG dùng được: đo `'medium'` và `'dense'` ra số y hệt nhau, đúng
 * như chú thích sẵn có trong `ReharmHome` ("density hiện chưa có tác dụng"). Nên phải
 * hãm thẳng sau khi đã dựng.
 *
 * Bỏ nốt nào: mỗi lượt lấy ô ĐANG DÀY NHẤT, rồi trong ô ấy bỏ nốt **chen nhất** — nốt
 * có khoảng cách tới hai nốt kề nhỏ nhất. Không bao giờ bỏ nốt đầu ô (chỗ câu vào) và
 * không đụng ô cuối (câu chạy kết là chủ ý, xem `endWithRun`).
 */
function thuaTayPhai(
  melody: readonly TimelineEvent[],
  dich: number,
  barBeats: number,
  soO: number,
  /**
   * Chênh số nốt mỗi ô giữa ô ĐẦU và ô CUỐI. `0` là mật độ phẳng như trước.
   *
   * Đoạn kết của bản ký âm **thưa dần**: đo 9 đoạn kết giọng thứ ba thầy
   * (`PianoBrain/tools/sheet/ket_thu.py`), số nốt tay phải mỗi ô giảm **−3,4** từ
   * nửa đầu sang nửa cuối. Hãm phẳng không ra dốc ấy — nó chỉ gỡ ô dày nhất, mà
   * ô dày nhất có thể nằm ở đầu, giữa hay cuối.
   */
  doc = 0,
): TimelineEvent[] {
  if (soO <= 1 || melody.length <= dich * soO) return [...melody]
  const o = (e: TimelineEvent) => Math.floor(e.startBeat / barBeats)
  const cuoi = soO - 1
  /* Hạn mức riêng cho từng ô: cao ở đầu, thấp ở cuối, trung bình vẫn là `dich`. */
  const hanMuc = (bar: number) => dich + doc / 2 - (doc * bar) / Math.max(1, soO - 1)
  const con = [...melody]
  while (con.length > dich * soO) {
    const theoO = new Map<number, TimelineEvent[]>()
    for (const e of con) {
      /*
        Hãm phẳng thì chừa ô chót ra — nó là chỗ câu đáp xuống, gỡ vào là cụt.
        Hãm DỐC thì phải động tới ô chót, vì chính nó cần thưa nhất; chặn dưới ở
        hai nốt bên dưới đã giữ cho ô không bị bỏ trắng.
      */
      if (doc === 0 && o(e) === cuoi) continue
      theoO.set(o(e), [...(theoO.get(o(e)) ?? []), e])
    }
    /* Gỡ ở ô VƯỢT HẠN MỨC CỦA CHÍNH NÓ nhiều nhất, không phải ô đông nhất. */
    const day = [...theoO.entries()].sort(
      (a, b) => b[1].length - hanMuc(b[0]) - (a[1].length - hanMuc(a[0])),
    )[0]
    if (!day || day[1].length <= 2) break
    const xep = day[1].slice().sort((a, b) => a.startBeat - b.startBeat)
    let bo = xep[1]!
    let hep = Infinity
    for (let i = 1; i < xep.length - 1; i += 1) {
      const khe = xep[i + 1]!.startBeat - xep[i - 1]!.startBeat
      if (khe < hep) {
        hep = khe
        bo = xep[i]!
      }
    }
    const at = con.indexOf(bo)
    if (at < 0) break
    con.splice(at, 1)
  }
  return con
}

/**
 * Đoạn kết **dâng lên** ở nửa sau — dời cả cụm một quãng tám, không gập từng nốt.
 *
 * Đo 9 đoạn kết giọng thứ của ba thầy (`PianoBrain/tools/sheet/ket_thu.py`): cao độ
 * tay phải nửa sau cao hơn nửa đầu **+8,2** nửa cung, **7 trên 9 bài đi lên**. Hai
 * bài đi xuống đều là Tôn Hùng (n=2, quá mỏng để thành lối riêng).
 *
 * Chỗ này **ngược với trực giác**: đoạn kết không lắng xuống mà vọt lên rồi mới
 * đóng. *Nỗi Buồn Hoa Phượng* +25,9 · *Có Em Chờ* +22,4. Người dùng giải thích khi
 * trả lời phiếu chia đoạn: *"vì đó là kết bài nên chị Nhi muốn kéo dài câu hát ra
 * giống như các ca sĩ vẫn hay làm khi biểu diễn."*
 *
 * Không mâu thuẫn với `slowClose`: hàm ấy giãn trường độ và bớt lực ở bốn phách
 * cuối, không đụng cao độ. Đoạn dâng qua cả đoạn, ô chót mới chậm lại.
 *
 * Dời **cả cụm** đúng một quãng tám — luật chuyển giọng đã chốt: chỉnh quãng thì
 * dời cả câu, gập từng nốt làm gãy đường nét. Không vừa tầm thì để nguyên.
 */
function dangCuoi(
  melody: readonly TimelineEvent[],
  barBeats: number,
  soO: number,
  high: number,
  low: number,
): TimelineEvent[] {
  if (soO < 4) return [...melody]
  const tuO = Math.ceil(soO / 2)
  const nuaSau = (e: TimelineEvent) => Math.floor(e.startBeat / barBeats) >= tuO
  const sau = melody.filter(nuaSau)
  const truoc = melody.filter((e) => !nuaSau(e))
  if (sau.length === 0 || truoc.length === 0) return [...melody]

  const doi = (loc: (e: TimelineEvent) => boolean, d: number) =>
    melody.map((e) =>
      loc(e)
        ? { ...e, notes: e.notes.map((n) => (n + d) as (typeof e.notes)[number]) }
        : e,
    )

  /* Nâng nửa sau lên một quãng tám nếu còn vừa trần. */
  if (Math.max(...sau.flatMap((e) => e.notes)) + 12 <= high) return doi(nuaSau, 12)

  /*
    Không nâng được thì **hạ nửa đầu** xuống một quãng tám — nửa sau vẫn cao hơn nửa
    đầu, mà vẫn là dời cả cụm theo bội số 12 chứ không gập từng nốt.
    Chỗ này cần từ khi câu đoạn kết dày lên: nốt cao hơn nên cộng 12 hay vượt trần.
  */
  if (Math.min(...truoc.flatMap((e) => e.notes)) - 12 >= low) return doi((e) => !nuaSau(e), -12)

  /*
    Cả hai đường trên chạm trần thì thử một cụm NHỎ HƠN: một phần tư cuối.

    Câu đoạn kết của nhánh Linh Nhi vốn đã cao, nên nửa sau cộng 12 vượt trần 95 mà nửa
    đầu trừ 12 lại xuống dưới sàn 57. Cụm một phần tư thường còn chỗ. Vẫn là dời cả cụm
    theo bội số 12 — không gập từng nốt.
  */
  const tuBa = Math.max(tuO, soO - Math.max(1, Math.round(soO / 4)))
  const cuoi = (e: TimelineEvent) => Math.floor(e.startBeat / barBeats) >= tuBa
  const phanTu = melody.filter(cuoi)
  if (phanTu.length > 0 && Math.max(...phanTu.flatMap((e) => e.notes)) + 12 <= high) {
    return doi(cuoi, 12)
  }
  return [...melody]
}

/**
 * Nốt tay phải **chót** của đoạn kết đáp xuống bậc 1 hoặc bậc 5.
 *
 * Đo 9 đoạn kết giọng thứ của ba thầy (`PianoBrain/tools/sheet/ket_thu.py`), bậc của
 * nốt chót so với chủ âm: **5 ×4 · 1 ×2 · 2 ×1 · ♭7 ×1 · ♭3 ×1**. Sáu trên chín đáp
 * xuống bậc 1 hoặc 5.
 *
 * App thì đáp **♭7 ở cả 24 lượt** — bậc mà bản ký âm chỉ dùng đúng một lần. Nốt chót là
 * tiếng cuối cùng người nghe nghe được, nên chỗ này lệch là nghe ra ngay: câu treo lơ
 * lửng thay vì đóng lại.
 *
 * **Đây là NẮN NỐT, và nó được cho phép riêng ở đây.** Người dùng chốt 9/9/2026: *"thấy
 * cần nắn nốt thì nắn đi."* Ghi rõ ranh giới để đừng nới rộng: chỉ **một** nốt cuối cùng
 * của **đoạn kết**, dời **tối thiểu** về bậc gần nhất. Mọi nốt khác vẫn phải đến từ một ô
 * có thật của bản ký âm — luật "soạn chứ không sinh" không đổi.
 *
 * Chỗ đơn giản hoá, nói thẳng: bản ký âm còn 3/9 đoạn đáp ở bậc 2 · ♭7 · ♭3, app sẽ
 * không có những màu ấy. Đổi lại nó không còn treo ở ♭7 mọi lượt. Triệu chứng để lùi:
 * đoạn kết nghe quá "đóng", thiếu chỗ lửng.
 */
function dapChot(
  melody: readonly TimelineEvent[],
  tonic: number,
  low: number,
  high: number,
): TimelineEvent[] {
  if (melody.length === 0) return []
  /*
    Chạy SAU khi đã ráp cụm rải kết, vì nốt cuối cùng người nghe nghe thường nằm trong
    cụm ấy chứ không nằm trong giai điệu: đo một lượt thật thì ba tiếng chót là
    `C4 E4 G4` — cụm rải của hợp âm `C`, và `G` chính là ♭7 của La thứ.

    Nắn nốt TRÊN CÙNG của cụm rải cũng là đổi thế bấm chứ không phá hợp âm: `C4 E4 G4`
    thành `C4 E4 A4` là `Am/C`, vẫn nằm trong vốn hợp âm của bài.
  */
  const phai = melody.filter((e) => e.hand === 'right')
  if (phai.length === 0) return [...melody]
  let chot = phai[0]!
  for (const e of phai) {
    if (e.startBeat > chot.startBeat) chot = e
    else if (e.startBeat === chot.startBeat && (e.notes[0] ?? 0) > (chot.notes[0] ?? 0)) chot = e
  }
  const cao = chot.notes[0]
  if (cao === undefined) return [...melody]

  const bac = (((cao - tonic) % 12) + 12) % 12
  if (bac === 0 || bac === 7) return [...melody]

  /* Dời tối thiểu: thử ±1, ±2 … cho tới khi chạm bậc 1 hoặc 5, và còn trong tầm. */
  for (let d = 1; d <= 6; d += 1) {
    for (const moi of [cao - d, cao + d]) {
      const b = (((moi - tonic) % 12) + 12) % 12
      if ((b === 0 || b === 7) && moi >= low && moi <= high) {
        return melody.map((e) =>
          e === chot
            ? { ...e, notes: [moi as (typeof e.notes)[number], ...e.notes.slice(1)] }
            : e,
        )
      }
    }
  }
  return [...melody]
}

/**
 * Intro Tuấn: 2 câu chạy Cà Pháo. Giang: 5 câu. Hồng Kông 1: cụm 4–5 và 10–11.
 * Bass thưa trong cửa sổ chạy (ý người dùng; Linh Nhi ô 71 LH=0).
 */
function bacChay(minor: boolean, _len: boolean, isV: boolean): number[] {
  if (!minor) return [0, 2, 4, 5, 7, 9, 11]
  /* Thứ: gam tự nhiên (♭6 ♭7). Nâng 7 chỉ khi V — kéo. Cấm giai điệu lên (6+7) = tươi. */
  if (isV) return [0, 2, 3, 5, 7, 8, 11]
  return [0, 2, 3, 5, 7, 8, 10]
}

/** Khung #472/#484: một ô Pùng-Pắp xen hai ô giai điệu, cả trưởng lẫn thứ. */
function laOPap(o: number, take: number, nhieu: boolean): boolean {
  /* #426: ô1 intro thứ không Pùng-Pắp — sheet 7/8 gõ phách 0. */
  if (nhieu && o === 0) return false
  /* #540 + mẫu Đã ổn #544: sau ô mở, vào Pùng-Pắp ngay thay vì để hai ô đầu trôi. */
  if (nhieu && o === 1) return true
  return (o + take) % 3 === 2
}

function oChayCac(soO: number, take: number, soCau: number, nhieuPap = false): number[] {
  const b: number[] = []
  for (let o = 0; o < soO - 1; o += 1) {
    if (!laOPap(o, take, nhieuPap)) b.push(o)
  }
  if (b.length === 0 || soCau <= 0) return []
  if (soCau === 1) return [b[0]!]
  if (soCau === 2) {
    const sau = b.find((o) => o >= b[0]! + 2)
    return sau === undefined ? [b[0]!] : [b[0]!, sau]
  }
  if (b.length <= soCau) return b
  const out: number[] = []
  for (let i = 0; i < soCau; i += 1) {
    out.push(b[Math.round((i * (b.length - 1)) / (soCau - 1))]!)
  }
  return [...new Set(out)].sort((a, c) => a - c)
}

/** Nốt cách hợp âm 1 nửa cung — tai nghe phô. */
const phoPc = (pc: number, tones: ReadonlySet<number>) => {
  const p = ((pc % 12) + 12) % 12
  if (tones.size === 0 || tones.has(p)) return false
  for (const t of tones) {
    const d = Math.min((p - t + 12) % 12, (t - p + 12) % 12)
    if (d === 1) return true
  }
  return false
}

/** Ngũ cung — hình ô 51 Hồng Kông 1 (10–11 nốt móc ba, nhảy). Thứ: ngũ cung thứ. */
function motCauChayDai(
  melody: readonly TimelineEvent[],
  left: readonly TimelineEvent[],
  oChay: number,
  barBeats: number,
  tonic: number,
  minor: boolean,
  isV: boolean,
  len: boolean,
  tones: ReadonlySet<number>,
): { melody: TimelineEvent[]; left: TimelineEvent[] } {
  const pent = minor ? (isV ? [0, 3, 5, 7, 11] : [0, 3, 5, 7, 10]) : [0, 2, 4, 7, 9]
  const t0 = oChay * barBeats + 1.625
  const trongO = melody
    .filter((e) => Math.floor(e.startBeat / barBeats + 1e-9) === oChay)
    .sort((a, b) => a.startBeat - b.startBeat)
  const truoc = trongO.filter((e) => e.startBeat < t0 - 1e-9)
  let midi = truoc[truoc.length - 1]?.notes[0] ?? trongO[0]?.notes[0] ?? tonic + 67
  while (midi < 62) midi += 12
  while (midi > 79) midi -= 12
  let dir = len ? 1 : -1
  const run: TimelineEvent[] = []
  for (let k = 0; k < 10; k += 1) {
    const nextPent = (d: number) => {
      for (let s = 1; s < 24; s += 1) {
        const m = midi + d * s
        const pc = (((m - tonic) % 12) + 12) % 12
        if (pent.includes(pc) && !phoPc(m, tones)) return m
      }
      return null
    }
    let next = nextPent(dir)
    if (next === null || next > 79 || next < 62) {
      dir *= -1
      next = nextPent(dir)
    }
    if (next === null || next > 79 || next < 62) break
    midi = next
    run.push({
      notes: [midi as MidiNote],
      startBeat: t0 + k * 0.125,
      durationBeats: 0.11,
      hand: 'right',
      velocity: 66,
    })
  }
  const tEnd = t0 + run.length * 0.125
  const trong = (e: TimelineEvent) => e.startBeat >= t0 - 1e-9 && e.startBeat < tEnd - 1e-9
  return {
    melody: [...melody.filter((e) => !trong(e)), ...run],
    left: left.filter((e) => !trong(e)),
  }
}

function datChaySheet(
  melody: readonly TimelineEvent[],
  left: readonly TimelineEvent[],
  oChay: number,
  barBeats: number,
  tonic: number,
  tones: ReadonlySet<number>,
  take: number,
  later: boolean,
  doan: 'intro' | 'outro' = 'intro',
): { melody: TimelineEvent[]; left: TimelineEvent[] } {
  // Lấy nguyên bốn nốt liền nhau của sheet thứ, cùng hoà âm; không dán một arpeggio i lên mọi ô.
  const pc = (n: number) => ((n % 12) + 12) % 12
  /*
    Đoạn kết: khoá đủ bốn điều kiện (thầy + điệu + đoạn + thứ), và fragment lấy theo ĐÚNG
    `source.id` chứ không phải cùng thầy.

    Lọc theo `t.thay` là cách cũ: nó gom mọi bài của thầy ấy, kể cả bài khác điệu và khác
    bài, rồi cắt bốn nốt liền ở đâu cũng được — đúng nghĩa vá câu từ nhiều nguồn.
  */
  const source = doan === 'outro' ? nguonKetThuBolero(take) : minorSoloSourceForTake(take, doan)
  const fragments = (source ? vonO(source.thay, doan, true).filter((t) => t.id === source.id) : [])
    .filter((t) => t.thu && t.phach === 4)
    .flatMap((t) => t.o).filter((o) => o.bac !== null && o.bac2 === null &&
      [0, o.chat === 'm' ? 3 : 4, 7, ...(o.chat === '7' ? [10] : [])]
        .every((d) => tones.has(pc(tonic + o.bac! + d))))
    .flatMap((o) => o.n.map((_, i) => o.n.slice(i, i + 4)))
    .filter((n) => n.length === 4 && n.every(([, , du]) => du <= 0.5) &&
      new Set(n.map(([, pitch]) => pc(pitch))).size >= 3 &&
      n.slice(1).every(([at], i) => at - n[i]![0] > 0 && at - n[i]![0] <= 0.5) &&
      tones.has(pc(tonic + n[3]![1])))
  const previous = [...melody].filter((e) => e.startBeat < oChay * barBeats + 1.5)
    .sort((a, b) => a.startBeat - b.startBeat).at(-1)?.notes[0] ?? 72
  const candidates = fragments.flatMap((n) => [-24, -12, 0, 12].map((octave) =>
    n.map(([at, pitch, dur]) => [at - n[0]![0], tonic + 60 + pitch + octave, dur] as const)))
    .filter((n) => n.every(([, pitch]) => pitch >= 62 && pitch <= 79))
    .sort((a, b) => Math.abs(a[0]![1] - previous) - Math.abs(b[0]![1] - previous))
  const mau = candidates[take % Math.min(4, candidates.length)]
  if (!mau) return { melody: [...melody], left: [...left] }
  const length = mau[3]![0] + mau[3]![2]
  const t0 = oChay * barBeats + (later ? Math.min(2.75, barBeats - length) : 1.5)
  const run: TimelineEvent[] = mau.map(([at, midi, dur]) => ({
      notes: [midi as MidiNote],
      startBeat: t0 + at,
      durationBeats: dur * 0.9,
      hand: 'right' as const,
      velocity: 68,
  }))
  const tEnd = t0 + length
  const trong = (e: TimelineEvent) => e.startBeat >= t0 - 1e-9 && e.startBeat < tEnd - 1e-9
  return {
    melody: [...melody.filter((e) => !trong(e)).map((e) => e.startBeat < t0 && e.startBeat + e.durationBeats > t0
      ? { ...e, durationBeats: t0 - e.startBeat } : e), ...run],
    left: left.filter((e) => !trong(e)).map((e) => e.startBeat < t0 && e.startBeat + e.durationBeats > t0
      ? { ...e, durationBeats: t0 - e.startBeat } : e),
  }
}

function motCauChay(
  melody: readonly TimelineEvent[],
  left: readonly TimelineEvent[],
  oChay: number,
  barBeats: number,
  tonic: number,
  minor: boolean,
  isV: boolean,
  len: boolean,
  soNot: number,
  vao: number,
  tones: ReadonlySet<number>,
): { melody: TimelineEvent[]; left: TimelineEvent[] } {
  const t0 = oChay * barBeats + vao
  const trongO = melody
    .filter((e) => Math.floor(e.startBeat / barBeats + 1e-9) === oChay)
    .sort((a, b) => a.startBeat - b.startBeat)
  const truoc = trongO.filter((e) => e.startBeat < t0 - 1e-9)
  let midi = truoc[truoc.length - 1]?.notes[0] ?? trongO[0]?.notes[0] ?? tonic + 67
  while (midi < 62) midi += 12
  while (midi > 79) midi -= 12
  const gam = new Set(bacChay(minor, len, isV))
  let dir = len ? 1 : -1
  const run: TimelineEvent[] = []
  for (let k = 0; k < soNot; k += 1) {
    const buoc = (d: number) => {
      const pc = (((midi - tonic) % 12) + 12) % 12
      for (let step = 1; step < 12; step += 1) {
        const m = midi + d * step
        if (gam.has((pc + d * step + 12) % 12) && !phoPc(m, tones)) return m
      }
      return null
    }
    let next = buoc(dir)
    if (next === null || next > 79 || next < 62) {
      dir *= -1
      next = buoc(dir)
    }
    if (next === null || next > 79 || next < 62) break
    midi = next
    run.push({
      notes: [midi as MidiNote],
      startBeat: t0 + k * 0.25,
      durationBeats: 0.22,
      hand: 'right',
      velocity: 68,
    })
  }
  const tEnd = t0 + run.length * 0.25
  const trong = (e: TimelineEvent) => e.startBeat >= t0 - 1e-9 && e.startBeat < tEnd - 1e-9
  return {
    melody: [...melody.filter((e) => !trong(e)), ...run],
    left: left.filter((e) => !trong(e)),
  }
}

function chenChay(
  melody: readonly TimelineEvent[],
  left: readonly TimelineEvent[],
  soO: number,
  barBeats: number,
  take: number,
  tonic: number,
  minor: boolean,
  isVTai: (o: number) => boolean,
  soCau: number,
  giang: boolean,
  tonesTai: (o: number) => ReadonlySet<number>,
  nhieuPap = false,
  chayNgan = false,
  doanChay: 'intro' | 'outro' = 'intro',
): { melody: TimelineEvent[]; left: TimelineEvent[] } {
  const os = oChayCac(soO, take, soCau, nhieuPap)
  const len = take % 8 < 3
  let m = [...melody]
  let t = [...left]
  os.forEach((o, i) => {
    if (!chayNgan && !giang && minor) {
      const r = datChaySheet(
        m,
        t,
        o,
        barBeats,
        tonic,
        tonesTai(o),
        take,
        i > 0,
        doanChay,
      )
      m = r.melody
      t = r.left
      return
    }
    const dai = giang && i % 2 === 0
    const tones = tonesTai(o)
    const r = dai
      ? motCauChayDai(m, t, o, barBeats, tonic, minor, isVTai(o), len, tones)
      : motCauChay(
          m,
          t,
          o,
          barBeats,
          tonic,
          minor,
          isVTai(o),
          minor ? false : i === 0 ? len : !len,
          chayNgan ? (i % 2 === 0 ? 6 : 4) : 4,
          chayNgan || i === 0 ? 1.5 : 2.75,
          tones,
        )
    m = r.melody
    t = r.left
  })
  return { melody: m, left: t }
}

/** Ô B từ ô 3: mọi ô giai điệu có LH Pắp. Sheet: 65/69 ô gd có LH đảo (94%). */
function oXenPap(soO: number, take: number, nhieuPap = false): Set<number> {
  const b = new Set<number>()
  for (let o = 2; o < soO; o += 1) {
    if (!laOPap(o, take, nhieuPap)) b.add(o)
  }
  return b
}

export function buildPhraseSection(
  options: PhraseSectionOptions,
): PhraseSection | null {
  if (options.thay === 'ca-phao' && options.caPhaoSimulate) return caPhaoFullSolo({...options,take:0})
  if (options.caPhaoCompose && options.thay === 'ca-phao') return composeCpSolo(options)
  if (options.caPhaoFull && options.thay === 'ca-phao') return caPhaoFullSolo(options)
  if (options.key?.scale === 'minor' &&
    laBossaCP(options.style) &&
    (!options.thay || options.thay === 'ca-phao') && !options.motif) {
    return options.kind === 'intro' ? caPhaoBossaMinorIntro(options) : caPhaoBossaMinorSolo(options)
  }
  const {
    kind,
    key,
    style,
    beatsPerChord,
    dropRoot,
    opening,
    solo,
    take,
    songChords,
    thay,
    vongPhienKhuc,
    tiLeChiaHat,
    songIntro,
    daoTruong,
    daoThu,
    giangThu,
    chayNgan,
  } = options

  const tuan = laBoleroTuan(style)
  const giangMoi = kind === 'interlude' && key?.scale === 'minor' && tuan
  const interludePlan = giangMoi && key ? planMinorInterlude({
    tonic: key.tonic, take: take ?? 0, range: options.range ?? { low: 57, high: 95 },
    songChords: songChords ?? vongPhienKhuc ?? [], opening: options.opening,
  }) : undefined
  if (giangMoi && !interludePlan) {
    return { events: [], lengthBeats: 0, chords: [], beatsEach: [],
      unavailableReason: 'Chưa soạn được giang tấu thứ trong vốn hợp âm/tầm nốt này; cần i, iv và V trưởng. Không phát câu ghép cũ thay thế.',
    }
  }
  const ketMotNguon = kind === 'outro' && key?.scale === 'minor' && tuan
  const outroPlan = ketMotNguon && key ? planMinorOutro({
    tonic: key.tonic, take: take ?? 0, range: options.range ?? { low: 57, high: 95 },
    songChords: songChords ?? [],
  }) : undefined
  if (ketMotNguon && !outroPlan) {
    return { events: [], lengthBeats: 0, chords: [], beatsEach: [],
      unavailableReason: 'Chưa có outro thứ khớp vốn hợp âm và tầm nốt này. Có thể thử mở trần 84. Lượt này bỏ qua outro, không ghép nguồn khác hoặc gập nốt để cố phát.',
    }
  }
  const coherentPlan = outroPlan ?? interludePlan
  const chords =
    coherentPlan ? coherentPlan.chords : kind === 'interlude' && key
      ? (() => {
          const v = vonHopAmLinhNhi({
            kind: 'interlude',
            key,
            songChords: vongPhienKhuc ?? songChords ?? [],
            ...(tuan ? { soO: 12 } : {}),
            ...(giangThu ? { giangThu: true } : {}),
            ...(tiLeChiaHat === undefined ? {} : { tiLeChiaHat }),
          })
          return v.length > 0 ? v : [...(songChords ?? [])]
        })()
      : phraseChords(kind === 'outro' ? 'outro' : 'intro', key, {
          ...(songChords ? { songChords } : {}),
          ...(thay ? { thay } : {}),
          ...(vongPhienKhuc ? { vongPhienKhuc } : {}),
          ...(tiLeChiaHat === undefined ? {} : { tiLeChiaHat }),
          ...(songIntro ? { songIntro } : {}),
          ...(daoTruong ? { daoTruong: true } : {}),
          ...(daoThu || (tuan && key?.scale === 'minor') ? { daoThu: true } : {}),
          take: take ?? 0,
        })
  if (chords.length === 0) return null

  /*
    Ô CHIA ĐÔI dài nửa ô, không dài bằng các ô khác.

    `vonHopAmLinhNhi` chèn hợp âm nửa ô sau và đánh dấu cả hai nửa; `nhipVong` đọc dấu
    ấy ra. Không có bước này thì ô chia đôi kéo dài bằng một ô trọn và cả đoạn dạo dôi
    ra đúng bằng số ô đã chia.
  */
  const beatsEach = coherentPlan?.beatsEach ?? nhipVong(chords, beatsPerChord)
  /*
    KHUNG BOLERO TUẤN — mở cho ĐOẠN KẾT ngày 9/9/2026.

    Cờ này gác cả khối dựng khung của Codex: ô Pùng-Pắp, ô chạy, `datChaySheet` lấy bốn nốt
    liền của sheet. Trước đó nó chỉ nhận `intro` và `interlude`, nên **đoạn kết chưa bao giờ
    đi qua phương pháp mới** — nó chạy đường ghép ô cũ từ đầu tới cuối.

    Người dùng nói thẳng: *"Có phải bạn vẫn luôn dùng phương pháp cũ của bạn để cho bộ soạn
    tạo câu không? Những phương pháp mới được codex đưa ra và ghi vào bàn giao bạn phải làm
    theo, không được mãi giữ cái của bạn nữa."*

    Triệu chứng để lùi: đoạn kết mất chỗ lắng, Pùng-Pắp dồn dày như đoạn dạo.
  */
  const daoTuan = tuan && (kind === 'intro' || kind === 'interlude' || kind === 'outro')

  /*
    Đoạn kết: tay phải **chỉ ngẫu hứng**, không quạt đệm nữa.

    Trước đây đoạn kết phát đồng thời phần đệm tay phải và câu ngẫu hứng cũng của
    tay phải. Trên piano roll thấy rõ: Đô quãng 4 bị gõ bốn lần trong khi nó còn
    đang ngân, Mi và Sol cũng vậy — ba cụm chồng nhau, mà cùng lúc câu chạy vẫn
    đi qua. Không bàn tay nào làm được việc đó, và tai nghe ra là tiếng đục.

    Tay trái **giữ nguyên**. Đoạn kết là thứ cuối cùng người ta nghe; tay trái
    mỏng đi cùng lúc tay phải rút về một dòng đơn thì cả kết cấu sụp một lượt, và
    nó không nghe ra là "bài hết" mà nghe ra là "máy dừng". Tay trái mới là thứ
    dắt bass về chủ âm, và `slowClose` đã cho cả hai tay chậm lại — bấy nhiêu là
    đủ tín hiệu kết bài. Tay phải thưa đi chính là lúc bass ngân legato của thầy
    Hải lộ ra.

    Dạo đầu thì vẫn quạt cả hai tay: ở đó câu ngẫu hứng đi cùng phần đệm để dựng
    khí thế, chứ không phải để tiễn bài đi.
  */
  /*
    Tay phải giai điệu, tay trái mẫu đệm — nhưng CÀI VÀO NHAU, không cùng nói.

    Trước đây đoạn dạo quạt cả hai tay rồi chồng câu ngẫu hứng lên trên — ba
    tầng cùng lúc, mà tầng quạt tay phải giẫm đúng chỗ câu solo đang chạy. Sửa
    lượt một: bỏ tầng quạt, tay trái gánh trọn mẫu đệm. Người dùng nghe rồi bác
    tiếp — để tay trái đảm nhiệm toàn bộ pattern điệu đệm trong lúc solo là
    không đúng.

    Nay tay trái vẫn dựng từ mẫu đệm của chính điệu đang chọn, nhưng bao nhiêu
    phần trong đó thực sự kêu lên thì tuỳ tay phải đang bận tới đâu — xem
    `interlockHands`. Luật "đoạn không lời chơi đúng điệu" còn nguyên.
  */
  /**
   * Câu dạo này có do BỘ GHÉP TUYẾN dựng không.
   *
   * Dùng ở hai chỗ nên tách ra một cờ: chọn bộ soạn, và quyết có áp vòng cung mật độ
   * `arcDungXa` lên tay phải hay không. Hai chỗ ấy phải luôn cùng một câu trả lời.
   */
  const thaySolo = thay ?? soloTeacherOf(style.id)
  /*
    BẢNG TUYẾN MỚI PHỦ CẢ BA THẦY VÀ CẢ ĐOẠN KẾT.

    Bảng cũ chỉ có câu dạo Linh Nhi nên bộ ghép cũng chỉ chạy ở đó; mọi chỗ khác rơi về
    bộ SINH (`caPhaoSolo`, `chiecLaMotif`, `raiLinhNhi`). `tuyenSolo.ts` có 38 tuyến cho
    cả ba thầy ở cả dạo · giang · kết, nên khi ô tick bật thì bộ ghép nhận hết.

    MỘT CHỖ KHÔNG PHỦ: Tôn Hùng không có bản ký âm giọng trưởng nào (0 ô), nên bài giọng
    trưởng chọn Tôn Hùng thì bộ ghép không có gì để ghép. Nút của anh bị khoá ở bài giọng
    trưởng — mượn ô của thầy khác là lấy luật thầy A áp cho thầy B.
  */
  const tuyenGhep =
    thaySolo !== null &&
    (kind === 'intro' || kind === 'outro' || (kind === 'interlude' && tuan))
  /*
    TAY TRÁI MỎNG ĐI Ở ĐOẠN KHÔNG LỜI — đo bảy bản ký âm, mốc gõ tay trái mỗi ô:

    | | phần hát | dạo | tỉ lệ | kết | tỉ lệ |
    |---|---|---|---|---|---|
    | giọng thứ | 6,5 | 4,6 | 0,71 | 4,9 | 0,75 |
    | giọng trưởng | 7,7 | 6,8 | 0,88 | 3,2 | 0,42 |

    ĐẶT THEO TỈ LỆ chứ không theo số mốc tuyệt đối. Bản trước dùng trần tuyệt đối, chỉnh
    trên `bolero-linh-nhi-3` ra đúng 4,4 mốc/ô, nhưng áp sang `bolero-linh-nhi-2` thì ra
    **3,7** — và người dùng nghe ra: *"các câu intro giờ lại mất hẳn kết hợp giữa hai tay
    trái phải."* Tay trái mỏng quá thì không còn mốc nào gõ một mình để đối đáp.

    BA TỈ LỆ DƯỚI ĐÂY HIỆU CHỈNH THEO KẾT QUẢ THẬT, không lấy thẳng tỉ lệ dạo/hát ở bảng
    trên. Lý do: mẫu đệm có 9 cú gõ một ô, còn đoạn hát trong bản ký âm chỉ 6,5 mốc — nhân
    tỉ lệ 0,75 vào 9 cú thì ra 7 mốc, trong khi đích là 4,9. Nhân vào số cú gõ của mẫu chứ
    không nhân vào mật độ bản ký âm, nên phải chỉnh lại cho khớp đầu ra.

    Đo được sau khi chỉnh: dạo thứ **4,4** (đích 4,6) · kết thứ **~5,0** (đích 4,9) · kết
    trưởng **~3,0** (đích 3,2).
  */
  /*
    CHẶN THEO HỌ ĐIỆU, KHÔNG CHẶN THEO `thaySolo`.

    `soloTeacherOf('bossa-nova-1')` trả về `'linh-nhi'` — mọi điệu bám tay trái đều nhận
    thầy ấy. Chặn bằng `thaySolo` thì phép hãm ăn luôn sang bossa và `phraseKeepsStyle`
    đỏ: tay trái bossa mất cú gõ ở phách 2 và 3,5, tức mất chất điệu.

    Số đo mật độ này rút từ sheet bolero của Linh Nhi, nên nó chỉ đúng cho điệu của chị.
    Đây là lần thứ hai vấp đúng cái bẫy `thaySolo` trong cùng một dự án.
  */
  const laLinhNhi = (style.family ?? '').includes('linh-nhi')
  const tiLeTrai =
    laLinhNhi
      ? kind === 'outro'
        ? key?.scale === 'minor'
          ? 0.55
          : 0.33
        : key?.scale === 'minor'
        ? 0.71
        : /*
            ĐOẠN DẠO GIỌNG TRƯỞNG KHÔNG HÃM. Bản ký âm 6,8 mốc/ô, mà không hãm gì thì
            app cũng ra đúng 6,8 — hãm vào là hỏng chỗ đang đúng. Đặt tỉ lệ 0,88 theo
            số đo thì ra 6,2, thiếu mất nửa mốc.
          */
          undefined
      : undefined
  // renderPattern giữ pha cell trên toàn đoạn; soloLeftHand cũ khởi động lại
  // mẫu ở MỖI hợp âm, sai pulse khi Hoa Phượng đổi hợp âm tại phách 2,5.
  const outroComping = coherentPlan ? renderPattern(
    voiceLeadTwoHands(chords, { dropRootFromRightHand: dropRoot }),
    style, { beatsPerChord, beatsEach },
  ) : undefined
  const backing = outroComping?.filter((e) => e.hand === 'left') ?? soloLeftHand({
    chords,
    beatsEach,
    style,
    chiPhach1: thaySolo === 'ton-hung',
    ...(tiLeTrai === undefined ? {} : { tiLeGiuTrai: tiLeTrai }),
  })

  /*
    DẠO ĐẦU VÀ KẾT BÀI cũng dựng như giang tấu, theo yêu cầu người dùng.

    Trước đây chỉ giang tấu dùng lối bám tay trái; dạo đầu và kết bài vẫn sinh
    câu độc lập rồi mới cài vào. Hai đoạn ấy nghe khác hẳn giang tấu dù cùng
    một bài, cùng một điệu.

    Đường cũ vẫn còn nguyên cho mọi điệu không khai lối này — `raiTheoTayTrai`
    trả `false` thì `solo` chạy y như trước.
  */
  const voiced =
    /*
      MÔ-TÍP CHIẾC LÁ đứng trước cả bộ ghép: nó là một Ô TICK người dùng bật có ý, không
      phải đường mặc định. Bật lên mà vẫn ra câu ghép thì ô tick ấy thành vô nghĩa.
    */
    kind === 'intro' && options.motif === 'chiec-la' && key
    ? chiecLaMotif({
        chords,
        beatsPerChord,
        tonic: key.tonic,
        scale: key.scale,
      })
    : /* Bộ ghép ô thật đứng trước mọi bộ SINH. */
      coherentPlan || (tuyenGhep && thaySolo)
    ? giaiDieuDaoLinhNhi({
        ...(outroPlan ? { outroPlan } : {}),
        ...(interludePlan ? { interludePlan } : {}),
        thay: thaySolo ?? 'linh-nhi',
        doan: kind === 'outro' ? 'outro' : kind === 'interlude' ? 'interlude' : 'intro',
        ...(options.siet ? { siet: true } : {}),
        left: backing,
        chords,
        beatsPerChord,
        barBeats: style.beatsPerMeasure * (style.gridUnit ?? 1),
        range: options.range ?? { low: 57, high: 95 },
        take: take ?? 0,
        minor: key?.scale === 'minor',
        beatsEach,
        ...(key ? { tonic: key.tonic } : {}),
        ...(tuan ? { gopThay: true } : {}),
      })
    : thaySolo === 'ca-phao'
    ? caPhaoSolo({
        chords,
        beatsPerChord,
        barBeats: style.beatsPerMeasure * (style.gridUnit ?? 1),
        range: options.range ?? { low: 57, high: 95 },
        take: take ?? 0,
        ...(thienVeCuaHo(style.id) ? { thienVe: thienVeCuaHo(style.id)! } : {}),
        left: backing,
      })
    : tuyenGhep
    ? giaiDieuDaoLinhNhi({
        left: backing,
        chords,
        beatsPerChord,
        barBeats: style.beatsPerMeasure * (style.gridUnit ?? 1),
        range: options.range ?? { low: 57, high: 95 },
        take: take ?? 0,
        minor: key?.scale === 'minor',
        /* Bài có ô chia đôi thì hợp âm không dài bằng nhau — bộ ghép phải biết. */
        beatsEach,
        /* Cả câu neo vào chủ âm của bài, không neo vào từng hợp âm. */
        tonic: key?.tonic,
        ...(tuan ? { gopThay: true } : {}),
      })
    /*
      NHÁNH `raiLinhNhi` ĐÃ BỎ — nó là mã chết.

      Nó đứng sau `tuyenGhep && thaySolo`, mà `tuyenGhep = thaySolo !== null && (intro |
      outro)` và hàm này chỉ được gọi với intro/outro. Nên nhánh `thaySolo === 'linh-nhi'`
      chỉ tới được khi `thaySolo` là `null` — mâu thuẫn, không bao giờ chạy.
    */
    : solo(chords)
  /*
    Độ dài lấy TỔNG `beatsEach`, không lấy `chords.length * beatsPerChord`.

    Ô chia đôi dài nửa ô, nên đếm theo số hợp âm thì mỗi ô chia làm đoạn dạo dôi thêm
    một ô trọn — đo được 36 phách thành 40. Bài kiểm từng hàm lẻ không bắt được chỗ này
    vì nó nằm giữa dây nối; `chiaOXuyenSuot.test.ts` canh nó.
  */
  const roundBeats = beatsEach.reduce((a, b) => a + b, 0)
  const barBeats = style.beatsPerMeasure * (style.gridUnit ?? 1)

  /*
    Vòng cung mật độ Đừng Xa — nắn lại thứ vừa dựng, không soạn nốt mới.

    Đặt SAU `voiced` để cả hai tay đã có đủ nốt rồi mới bàn tới mật độ; đặt
    trước `interlockHands` để phép cài — nếu điệu này còn dùng — nhìn thấy đúng
    mật độ đã nắn chứ không phải mật độ cũ.
  */
  /*
    `thay` chứ KHÔNG phải `thaySolo`.

    `thaySolo` lui về `soloTeacherOf(style.id)`, mà hàm ấy trả 'linh-nhi' cho
    MỌI điệu bật cờ rải-theo-tay-trái — bossa nova nằm trong đó. Lượt sửa đầu
    dùng `thaySolo` nên câu dạo bolero Đừng Xa bị đắp lên `bossa-nova-1`, và ba
    lưới `phraseAssembled` bắt được: đoạn dạo dài 20 phách thay vì 16.

    Vòng cung mật độ và ô hút là của MỘT bản ký âm bolero cụ thể, nên chỉ chạy
    khi người dùng chọn thẳng thầy Linh Nhi.
  */
  const arc =
    kind === 'intro' && thay === 'linh-nhi' && key && !daoTuan
      ? arcDungXa({
          left: backing,
          melody: voiced,
          barBeats,
          bars: Math.max(1, Math.round(roundBeats / barBeats)),
          chords,
          beatsPerChord,
        })
      : null
  const traiCuoi = arc?.left ?? backing
  /*
    CHỈ LẤY TAY TRÁI CỦA VÒNG CUNG, KHÔNG LẤY TAY PHẢI — khi câu dạo do bộ ghép tuyến
    dựng.

    `arcDungXa` sinh ra hồi tay phải còn do bộ soạn nốt cũ tạo: nó rút tay phải còn 4 nốt
    ở ô dồn và chồng thêm nốt ở ô thưa, tức **áp một vòng cung mật độ lên câu**. Nay tay
    phải chính là ô nhịp chép từ bản ký âm, và nó đã mang sẵn vòng cung của chính nó —
    áp thêm lần nữa là chồng hai vòng cung.

    Đo được: bộ ghép trả 62 nốt cho 9 ô (**6,9 nốt/ô**, đúng bản ký âm), nhưng ráp xong
    chỉ còn 50 (**5,6**) — **mất 12 nốt**, và chỉ mất ở giọng thứ.

    Tay TRÁI thì vẫn lấy: vòng cung thưa/dày của tay trái không có trong bảng tuyến, nó
    là số đo riêng và vẫn đúng.
  */
  const phaiGhep = tuyenGhep ? voiced : (arc?.melody ?? voiced)
  /*
    Intro Tuấn: giai điệu (ô sheet) lên lưới RH Pùng-Pắp — LH bass 1+3, RH nốt
    đơn đảo phách. Không dập hợp âm (tầng 3), không arc/hút Linh Nhi.
  */
  /*
    Ô B: giữ nguyên nốt bộ soạn (đừng tỉa còn 4 cú Pắp). Sheet trưởng dạo ~5,6 nốt
    tuyến/ô. Ô A vẫn Pùng-Pắp đủ hai tay.
  */
  const phaiGd = phaiGhep
  /*
    Xen ô đệm đủ / ô giai điệu — đo intro sheet:

      Linh Nhi n=59 ô 7 bài: C(gd+rải) 49% · B(gd+bass) 25% · A(đệm đủ) 17%
      Cà Pháo n=34 ô 3 bài (thiếu Hồng Kông 1): A 38% · C 29% · B 15%

    Tuấn không có rải (C). Còn A = Pùng-Pắp hai tay, B = LH bass + RH giai điệu.
    ~1/3 ô A; intro thứ 2/3. Lệch theo `take`.
  */
  let traiCuoiX = traiCuoi
  /*
    Ô NÀO ĐANG QUẠT PÙNG-PẮP — ghi lại để `melodyGoc` đừng rút chùm của nó.

    Xem chú thích ở `melodyGoc`: luật cũ rút mọi chùm nốt của đoạn kết còn một nốt, mà
    **Pắp chính là cú gõ hợp âm tay phải**. Đo trước khi sửa (take 0–2, La thứ, nhánh
    Linh Nhi): đoạn dạo 9–13 cú gõ chùm, đoạn kết **0**.
  */
  const oPapChum = new Set<number>()
  let phaiCuoi = phaiGd
  if (coherentPlan && style.cell) {
    // Cú Pắp chỉ trả lời trong khoảng nghỉ thật, không thay cả ô giai điệu
    // theo lịch A/B của intro. Không chồng hợp âm lên câu đang chạy/ngân.
    const replies = outroComping!.filter((e) => e.hand === 'right' &&
      e.startBeat < roundBeats - barBeats &&
      !phaiGd.some((m) => m.startBeat < e.startBeat + e.durationBeats &&
        m.startBeat + m.durationBeats > e.startBeat))
    phaiCuoi = [...phaiGd, ...replies].sort((a, b) => a.startBeat - b.startBeat)
  }
  if (daoTuan && style.cell && !coherentPlan) {
    const full = renderPattern(
      voiceLeadTwoHands(chords, { dropRootFromRightHand: dropRoot }),
      style,
      { beatsPerChord, beatsEach },
    )
    const soO = Math.max(1, Math.round(roundBeats / barBeats))
    /*
      KHUNG BOLERO TUẤN GIỌNG THỨ — mở cho ĐOẠN KẾT ngày 9/9/2026.

      Cờ này bật toàn bộ phương pháp Codex dựng cho câu thứ: `laOPap` chọn ô Pùng-Pắp
      (#426 ô1 không Pắp, #540 ô2 vào Pắp ngay), `oChayCac` chọn ô chạy, số câu chạy, và
      `datChaySheet` lấy bốn nốt liền của sheet thay vì dán arpeggio.

      Trước đó nó khoá cứng `kind === 'intro'`, nên đoạn kết chạy đường ghép ô cũ từ đầu
      tới cuối — người dùng nói thẳng: *"Có phải bạn vẫn luôn dùng phương pháp cũ của bạn
      để cho bộ soạn tạo câu không? Những phương pháp mới được codex đưa ra và ghi vào bàn
      giao bạn phải làm theo."*

      Triệu chứng để lùi: đoạn kết mất chỗ lắng, Pùng-Pắp dồn quá dày.
    */
    const nhieuPap = (kind === 'intro' || kind === 'outro') && key?.scale === 'minor'
    const papO = oXenPap(soO, take ?? 0, nhieuPap)
    const t: TimelineEvent[] = []
    const p: TimelineEvent[] = []
    for (let o = 0; o < soO; o += 1) {
      const inO = (e: TimelineEvent) => Math.floor(e.startBeat / barBeats + 1e-9) === o
      if (laOPap(o, take ?? 0, nhieuPap) && (nhieuPap || !daoThu) && !(nhieuPap && o === soO - 1)) {
        t.push(...full.filter((e) => e.hand === 'left' && inO(e)))
        p.push(...full.filter((e) => e.hand === 'right' && inO(e)))
        oPapChum.add(o)
      } else {
        t.push(...traiCuoi.filter(inO))
        if (papO.has(o)) {
          t.push(
            ...full
              .filter((e) => e.hand === 'right' && inO(e))
              .map((e) => ({
                ...e,
                hand: 'left' as const,
                notes: [((Math.max(...e.notes) - 12) as MidiNote)],
              })),
          )
        }
        p.push(...phaiGd.filter(inO))
      }
    }
    traiCuoiX = t
    if (key) {
      const take0 = take ?? 0
      const hopTai = (o: number) => {
        let acc = 0
        const at = o * barBeats + 1.5
        for (let i = 0; i < chords.length; i += 1) {
          acc += beatsEach[i] ?? beatsPerChord
          if (acc > at) return chords[i]!
        }
        return chords[chords.length - 1]!
      }
      const isVTai = (o: number) =>
        (((hopTai(o).root - key.tonic) % 12) + 12) % 12 === 7
      const tonesTai = (o: number) => {
        const c = hopTai(o)
        return new Set(c.quality.intervals.map((iv) => (((c.root + iv) % 12) + 12) % 12))
      }
      const r = chenChay(
        p,
        t,
        soO,
        barBeats,
        take0,
        key.tonic,
        key.scale === 'minor',
        isVTai,
        kind === 'interlude' ? 5 : nhieuPap ? (chayNgan ? 3 : 2) : key.scale === 'minor' ? 1 : 2,
        kind === 'interlude',
        tonesTai,
        nhieuPap,
        Boolean(chayNgan && nhieuPap),
        kind === 'outro' ? 'outro' : 'intro',
      )
      phaiCuoi = r.melody.filter((e) => {
        // Giữ nốt lướt/treo của ô sheet đã chọn theo hoà âm; xoá từng nốt làm thủng câu (#412/#426).
        if (nhieuPap) return true
        const o = Math.floor(e.startBeat / barBeats + 1e-9)
        return !phoPc(e.notes[0]!, tonesTai(o))
      })
      traiCuoiX = r.left
    } else {
      phaiCuoi = p
    }
  }

  /*
    HỢP ÂM BÁO NẰM TRONG VÒNG, KHÔNG ĐÈO THÊM MỘT PHÁCH.

    Bản trước cộng một phách vào sau vòng dạo đầu để dặm hợp âm báo. Người dùng
    nghe ra ngay: "ở intro có một nhịp dặm hợp âm trước khi kết đoạn nghe có vẻ
    bị dư". Đúng — vòng bốn ô vốn đã trọn vẹn, cộng thêm một phách thì đoạn dạo
    dài bốn ô lẻ một phách, và cái lẻ ấy nghe ra là một cú gõ thừa chứ không
    phải một tiếng báo.

    Nay hợp âm báo rơi vào phách CUỐI của chính vòng ấy. Vẫn báo được giờ vì nó
    vẫn là tiếng cuối cùng trước khi người hát vào, mà đoạn dạo giữ đúng số ô.

    Đoạn kết giữ nguyên một phách cộng thêm: ở đó cái đuôi ấy chính là chỗ bài
    đậu xuống, không phải thứ chen vào giữa hai đoạn.
  */
  const cueOf = kind === 'intro' && thay !== 'linh-nhi' ? cueChord(opening) : null
  const lengthBeats = roundBeats + (kind === 'outro' ? 1 : 0)

  const cueVoicing = tamBao(
    voiceLeadTwoHands([cueOf ?? opening ?? chords[0]], {
      dropRootFromRightHand: dropRoot,
    })[0].right,
  )

  const lastChord = chords[chords.length - 1]!
  const rollVoicing = tamBao(
    voiceLeadTwoHands([lastChord], { dropRootFromRightHand: dropRoot })[0]!.right,
  )

  /*
    Intro và outro cùng một kiểu kết: một phách sau vòng, nốt hợp âm rơi lần
    lượt từ dưới lên (roll), nốt trên cùng đúng vạch.
  */
  /*
    HỢP ÂM BÁO CUỐI DẠO ĐẦU RẢI, KHÔNG DẶM — MỌI ĐIỆU.

    Trước đây chỉ ballad mới rải, điệu khác dặm cả hợp âm một lượt. Đo trên
    `pop-1`: một khối ba nốt rơi đúng phách áp chót rồi đoạn còn chạy tiếp một
    phách, nên nó nghe ra một cú gõ chen vào giữa chứ không phải một tiếng báo
    hết đoạn. Người dùng bảo "chỉ dặm hợp âm khi báo hết đoạn và dặm kiểu
    outro", tức lấy đúng lối rải của đoạn kết cho mọi điệu.

    `rollCue` mất chỗ dùng cuối cùng ở đây nên xoá hẳn: đoạn kết vốn đã luôn
    rải, giờ đoạn dạo cũng vậy.
  */
  const cue =
    kind === 'intro' && cueOf
      ? cueStrike(cueVoicing, roundBeats - 1, { roll: true })
      : kind === 'outro'
        ? cueStrike(rollVoicing, roundBeats, { roll: true, beats: 1 })
        : []

  /*
    Tay trái nhường phím khi trùng với giai điệu — xem `avoidMelodyClash`.
    Chồng TẦM thì được, chồng PHÍM cùng lúc thì không.
  */
  /*
    ĐƯỜNG NÀO DỰNG TỪ TAY TRÁI THÌ ĐỪNG ĐỂ `interlockHands` NẮN LẠI TAY TRÁI.

    `interlockHands` dựng theo Cà Pháo: tay phải cài vào KHE tay trái, nên nó
    vừa tỉa bớt cú gõ khi tay phải dày, vừa CHÈN thêm nốt rải khi tay phải
    nghỉ. Lối bám tay trái làm ngược — tay phải suy ra TỪ mốc gõ tay trái — nên
    chồng hai phép lên nhau là nắn lại chính cái vừa dùng làm gốc.

    `arrangement.ts` đã bỏ qua `interlockHands` cho họ bật cờ này ở đoạn giang
    tấu, nhưng đoạn dạo đầu và kết bài đi qua đây thì chưa. Bolero không lộ vì
    đường của nó DÀY (8,8 nốt mỗi ô) nên không để lại khe nào cho luật 2 chèn
    vào; bossa thưa hơn (7,0 nốt trên một tay trái 4 mốc mỗi ô) nên lộ ngay —
    tay trái bossa `[0, 1,5, 2, 3,5]` bị chèn thành `[0, 1,5, 2, 2,167, 2,667,
    3,333, 3,5]`, tức thôi chơi bossa. Đó đúng là ca người dùng cấm: đoạn không
    lời phải chơi đúng điệu đã chọn.

    Cờ `khongTiaTayTrai` KHÔNG cứu được, và tôi thử rồi: nó chỉ tắt luật 1
    (tỉa), còn luật 2 (chèn nốt lấp khe) chạy bất kể cờ. Nên phải bỏ hẳn phép
    cài, đúng như `arrangement.ts` làm, chứ không phải chỉnh cờ.
  */
  const woven =
    daoTuan || thaySolo === 'linh-nhi' || thaySolo === 'ca-phao' || thaySolo === 'ton-hung'
    ? { left: traiCuoiX, melody: phaiCuoi }
    : interlockHands(
        traiCuoiX,
        phaiCuoi,
        barBeats,
        khongTiaTayTrai(style.id),
      )
  /*
    Ô CHÓT ĐOẠN DẠO PHẢI SẠCH CHÙM NỐT, để tiếng báo đứng một mình.

    Người dùng: "intro vẫn bị dặm hợp âm trước báo, hãy sửa để chỉ báo mới dặm
    hợp âm." Lối solo tự do Cà Pháo có chùm ba nốt, và đo trên bản ký âm thì
    chùm ấy CÓ mặt trong đoạn dạo thật — Bèo dạt 0,6 chùm mỗi ô, Yêu xa 0,6, Mơ
    0,7, ngang với giang tấu của chính chúng. Nên không cấm chùm cả đoạn.

    Chỉ dọn Ô CHÓT: đó là chỗ tiếng báo đứng, và một khối hợp âm ngay cạnh nó
    là đúng thứ người dùng nghe ra thành "hai lần thông báo".
  */
  const melodyGoc =
    coherentPlan ? woven.melody : kind === 'intro'
      ? woven.melody.filter(
          (e) => e.notes.length < 2 || e.startBeat < roundBeats - beatsPerChord + 1e-6,
        )
      : /*
          ĐOẠN KẾT: rút chùm nốt còn MỘT nốt, giữ nguyên câu chạy.

          Luật cũ ở đây có gốc từ một lỗi thật người dùng nghe ra: tay phải vừa
          quạt hợp âm vừa chạy giai điệu, "không ai chơi vậy được, và nghe cũng
          đục". Lối solo tự do có chùm ba nốt, và bản ký âm CÓ chùm ấy trong
          đoạn kết thật (Bèo dạt 0,6 chùm mỗi ô, Kém duyên 0,7) — nhưng ở đây
          nó rơi đúng vào chỗ luật cũ cấm.

          Giữ luật cũ vì nó đến từ tai người dùng, và giữ đường nét bằng cách
          rút chùm còn nốt trên cùng thay vì xoá cả cú gõ. Câu chạy — thứ làm
          nên lối tự do — không đụng tới.

          CHỪA Ô PÙNG-PẮP RA — sửa 10/9/2026.

          Luật cũ chặn cả **Pắp**, vì Pắp chính là cú gõ hợp âm tay phải ở phách
          0,5 · 1,5 · 2,5 · 3,5. Người dùng nghe ra: *"outro vẫn không hề có tiết
          tấu Pùng Pắp của bolero Tuấn trong khi intro có và đánh rất đúng."*

          Đo trước khi sửa (La thứ, nhánh Linh Nhi, take 0–2): đoạn dạo **13 · 9 ·
          13** cú gõ chùm, đoạn kết **0 · 0 · 0**. Sau khi sửa: **12 · 8 · 12**,
          đúng bốn phách Pắp, ở đúng những ô `laOPap` chọn.

          Lo ngại cũ — tay phải vừa quạt vừa chạy câu — KHÔNG xảy ra ở đây: vòng
          lặp `daoTuan` đã chia ô thành hai loại, ô Pùng-Pắp lấy tay phải từ mẫu
          đệm còn ô kia lấy từ giai điệu, nên hai thứ không bao giờ chung một ô.
          `oPapChum` giữ đúng danh sách ô loại một; mọi ô khác vẫn rút chùm như cũ.

          Triệu chứng để lùi: đoạn kết nghe đục, hợp âm quạt đè lên câu chạy.
        */
        woven.melody
          /*
            PHÁCH CHÓT ĐOẠN KẾT ĐỂ TRỐNG cho cú rải hợp âm chủ.

            Đo bản sinh ra: thang ngũ cung chạy tới phách 11,875 trong khi cú
            rải kết đáp ở 11,84 tới 12 — hai cử chỉ đâm vào nhau, và mốc gõ
            trùng nhau đúng chỗ tai chờ nghe bài đóng lại. Cùng lý do với ô chót
            đoạn dạo: cử chỉ báo hiệu phải đứng một mình.
          */
          .filter((e) => e.startBeat < roundBeats - 1 - 1e-6)
          .map((e) =>
            e.notes.length > 1 &&
            !oPapChum.has(Math.floor(e.startBeat / barBeats + 1e-9))
              ? { ...e, notes: [Math.max(...e.notes) as (typeof e.notes)[number]] }
              : e,
          )
  /*
    Đoạn kết: hãm tay phải về mật độ bản ký âm — xem `thuaTayPhai`.

    TRƯỚC 9/9/2026 chỉ Linh Nhi được hãm (`thaySolo === 'linh-nhi'`). Đo 9 đoạn
    kết giọng thứ của **cả ba thầy** (`PianoBrain/tools/sheet/ket_thu.py`): số nốt
    tay phải mỗi ô giảm **−3,4** từ nửa đầu sang nửa cuối, tức thưa dần là lối
    chung chứ không riêng chị. App khi chưa hãm đi **ngược**: +0,6 nốt mỗi ô.
    Triệu chứng để lùi: đoạn kết dày lên về cuối, nghe như chưa muốn dừng.
  */
  /*
    ĐOẠN KẾT THỨ ĐIỆU BOLERO — KHÔNG chạy chuỗi hậu xử lý.

    Codex chốt 10/9/2026: nhánh mới *"không được đồng thời xóa nốt bằng `thuaTayPhai`, nâng
    nửa câu bằng `dangCuoi`, chèn run ngoài câu, đổi nốt cuối bằng `dapChot`, gập từng nốt về
    tầm"*. Chỉ hai biến đổi được phép: **chuyển chủ âm/chức năng**, và **dời toàn phrase ±12**.

    Lý do nghe được: từ khi đoạn kết lấy **một dải ô liên tiếp có thật** của một bài Linh Nhi,
    câu ấy đã có sẵn motif, lấy đà, cao trào và chỗ nghỉ. Ba lớp hậu xử lý chồng lên chính là
    thứ phá những nét ấy — mỗi lớp chữa một triệu chứng, cộng lại làm câu rời rạc. Người dùng
    nghe ra: *"vẫn còn lủng củng"*.

    Cả ba lớp giữ nguyên cho đoạn dạo, giang tấu và đoạn kết giọng trưởng.

    Triệu chứng để lùi: đoạn kết dày đều, không thưa về cuối, hoặc trôi khỏi tầm.
  */

  // Mốc Pùng-Pắp là của phần đệm, không phải lưới cấm mọi onset khác của solo.
  const melody = melodyGoc

  const melodyCuoi =
    kind === 'outro' && !ketMotNguon
      ? thuaTayPhai(
          melody,
          key?.scale === 'minor' ? 5.7 : 5.0,
          barBeats,
          Math.max(1, Math.round(roundBeats / barBeats)),
          /* Dốc −3,4 nốt mỗi ô, đúng số đo 9 đoạn kết giọng thứ. */
          3.4,
        )
      : melody
  const melodyDang =
    kind === 'outro' && !ketMotNguon
      ? dangCuoi(
          melodyCuoi,
          barBeats,
          Math.max(1, Math.round(roundBeats / barBeats)),
          options.range?.high ?? 95,
          options.range?.low ?? 57,
        )
      : melodyCuoi
  const whole = [...avoidMelodyClash(woven.left, melodyDang), ...melodyDang]
  const ghep =
    kind === 'outro' && !ketMotNguon
      ? dapChot(
          [...slowClose(whole, roundBeats), ...cue],
          key?.tonic ?? 0,
          options.range?.low ?? 57,
          options.range?.high ?? 95,
        )
      : [...(outroPlan ? slowClose(whole, roundBeats) : whole), ...cue]

  /*
    Cắt đuôi nốt đang ngân **sau khi đã ráp**, không chỉ trong từng tầng.

    `renderPattern` đã cắt trong phạm vi mẫu đệm của nó, và `slowClose` cắt phần
    nó giãn ra. Nhưng chỗ chồng thật nằm **giữa hai tầng**: đệm tay phải giữ nốt
    Mi quãng 4 từ phách 0, rồi câu ngẫu hứng gõ lại đúng Mi ấy ở phách 0,25.
    Không tầng nào thấy tầng kia, nên không tầng nào cắt được.

    Chỉ cắt khi **cùng một tay** và **trùng cao độ**: hai tay chồng nhau là hoà
    âm, hai cao độ khác nhau chồng nhau là legato — cả hai đều đúng.
  */
  const events = holdUntilStruckAgain(ghep).map((e) => interludePlan
    // Tránh hai voice bass sau đổi tầm cùng rơi vào một phím và gõ đôi.
    ? { ...e, notes: [...new Set(e.notes)] }
    : e)

  /*
    Ô HÚT nối vào SAU vòng, không nằm trong vòng.

    Bản ký âm có chín ô mà vòng hợp âm chỉ tám: ô 9 là một ô THÊM, đứng trên
    bậc V, và nó không quạt mẫu đệm nào cả. Nhét nó vào trong vòng thì mất một
    ô của chính vòng ấy; nối vào sau thì đoạn dạo dài thêm đúng một ô, đúng như
    bản gốc.

    Chỗ này từng có một cú nhấc bốn phách đóng cứng cho mọi câu dạo Linh Nhi —
    hình 1-3-5 đi lên trước ô 1. Đã XOÁ: bản ký âm Đừng Xa vào thẳng hợp âm chủ
    ở ô 1, không có cú nhấc nào. (Cú nhấc D–F#–A là của Biển Tình; muốn dựng lại
    thì phải gắn theo BÀI, không gắn theo thầy — xem phiếu KHUNG-HOI-THAY §3.a.)
  */
  const kyHieu = chords.map((chord) => chord.symbol)

  if (interludePlan && opening) {
    // Ô hút riêng như intro, nhưng hút về HỢP ÂM SẮP HÁT, không mặc định về i.
    // Hai phách ngân + hai phách im nằm trọn trong ô này, không cộng nghỉ lẻ.
    let pull = hutDungXa({ at: roundBeats, hut: chords.at(-1)!.root, barBeats })
      .map((e) => ({ ...e, durationBeats: barBeats / 2 }))
    let pullSymbols = [pitchClassName(chords.at(-1)!.root)]
    let pullBeats = [barBeats]
    if (options.interludeCadence === 'ii-v') {
      // Chỉ mượn chức năng ii–V từ turnaround. I/i do đoạn HÁT chơi ở vạch kế,
      // không chốt sớm rồi hút lần hai. Nhịp dặm là KT chuyển soạn, không chép sheet.
      const cadence = turnaroundInto(opening, 2, chords.at(-1))?.chords.slice(0, 2)
      if (cadence?.length === 2) {
        const beat = barBeats / 4
        pull = voiceLeadTwoHands(cadence, { dropRootFromRightHand: dropRoot }).flatMap((v, i) => {
          const startBeat = roundBeats + i * beat
          return [
            { notes: v.left, startBeat, durationBeats: beat * 0.95,
              hand: 'left' as const, velocity: 78, grace: false },
            ...cueStrike(v.right, startBeat, { roll: false, beats: beat }),
          ]
        })
        pullSymbols = cadence.map((c) => c.symbol)
        // Ký hiệu V còn hiện trong khoảng nghỉ, nhưng hai tay đã nhả trước phách 3.
        pullBeats = [beat, barBeats - beat]
      }
    }
    return { events: [...events, ...pull], lengthBeats: roundBeats + barBeats,
      chords: [...kyHieu, ...pullSymbols], beatsEach: [...beatsEach, ...pullBeats],
      sourcePhrase: { id: interludePlan.sourceId, fromBar: interludePlan.fromBar,
        barCount: interludePlan.bars.length, method: 'motif-development' } }
  }

  if (
    key &&
    ((kind === 'intro' && (thay === 'linh-nhi' || daoTuan || daoTruong || daoThu)) ||
      (kind === 'interlude' && !interludePlan && (tuan || giangThu)))
  ) {
    return {
      chords: kyHieu,
      beatsEach,
      events: [
        ...events,
        ...hutDungXa({
          at: roundBeats,
          hut: ((key.tonic + 7) % 12) as PitchClass,
          barBeats,
        }),
      ],
      lengthBeats: roundBeats + barBeats,
    }
  }


  return { events, lengthBeats, chords: kyHieu, beatsEach,
    ...(coherentPlan ? { sourcePhrase: { id: coherentPlan.sourceId, fromBar: coherentPlan.fromBar,
      barCount: coherentPlan.bars.length, ...(coherentPlan.method ? { method: coherentPlan.method } : {}) } } : {}),
  }
}
