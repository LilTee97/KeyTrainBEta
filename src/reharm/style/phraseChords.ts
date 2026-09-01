import { chordAtDegree } from '../../shared/musicTheory/scales'
import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import { chooseInterludeWindow, pullStrength } from './interludeLoop'
import { plainForInterlude } from './interludeChords'
import { pullChordFor } from './turnaround'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { SoloTeacher } from '../fillSoloGenerator/soloTeacher'
import { introChordsForTeacher } from './teacherSoloChords'

/**
 * Vòng hợp âm của đoạn dạo đầu và đoạn kết.
 *
 * Bộ não soạn **nốt tay phải** cho hai đoạn này trên vòng bậc `I - V - vi - IV`
 * (dạo đầu) và `I` (kết bài). Nhưng nó chỉ trả về nốt, không trả về hợp âm — mà
 * phần đệm thì cần hợp âm thật để quạt theo điệu đang chọn.
 *
 * Không có bước này thì đoạn dạo chỉ có một dòng nốt tay phải bay lơ lửng,
 * không có bass đỡ bên dưới: nghe như ai đó tập gam chứ không như một đoạn dạo.
 *
 * Vòng phải khớp **đúng** vòng não dùng, nếu không hai tay chơi hai hợp âm khác
 * nhau — xem `DEFAULT_PROGRESSION` trong `../brain/phrase.ts`.
 */
const DEGREES: Readonly<Record<'intro' | 'outro', readonly number[]>> = {
  intro: [1, 5, 6, 4],
  /*
    Kết bài dài **ba** ô: một ô dẫn ở bậc V rồi hai ô đậu lại ở bậc I.

    Bộ não soạn câu rải ngược trên bậc I, chiếm hai ô. Ô bậc V đứng trước là
    phần của KeyTrain — nó là chỗ *dẫn về*, để câu kết không rơi đột ngột từ
    đoạn hát thẳng vào hợp âm chủ. Nốt não vì thế phải dời sang sau một ô.
  */
  outro: [5, 1, 1],
}

/** Ô đầu của đoạn kết là ô dẫn, nốt của não bắt đầu từ ô sau. */
export const OUTRO_LEAD_BARS = 1

export interface PhraseChordOptions {
  /**
   * Vòng hợp âm **thật của bài**. Có thì đoạn dạo mượn từ đây.
   *
   * Không có thì rơi về bảng bậc bên dưới — luồng gõ vòng hợp âm trơn không có
   * bài nào để mượn.
   */
  songChords?: readonly ParsedChord[]
  /**
   * Rút hợp âm về chất cơ bản trước khi dùng, như đoạn giang tấu vẫn làm.
   *
   * Đoạn dạo là chỗ ngẫu hứng: tai bám vào đường giai điệu chứ không bám vào
   * màu hợp âm, nên chồng `add9`, `9sus4`, `13` lên nền solo thì câu chạy nghe
   * lạc. Xem `interludeChords.ts`.
   */
  plain?: boolean
  /**
   * Hợp âm mở phiên khúc — đích để vòng dạo **hút vào**, không phải vòng để chép.
   *
   * Intro không lấy hết phiên khúc. Sheet: dạo 6–18 ô, phiên có khi 16–32 ô.
   */
  vongPhienKhuc?: readonly ParsedChord[]
  /** Thầy cho dạo/kết — chỉ đổi vòng hợp âm, không đổi điệu đệm. */
  thay?: SoloTeacher
  /** Đoạn dạo gốc trên lời bài, nếu có. */
  songIntro?: readonly ParsedChord[]
}

/** Bỏ hợp âm lướt: chúng mượn phách của hợp âm trước, không phải ô của vòng. */
const mainChords = (chords: readonly ParsedChord[]) =>
  chords.filter((chord) => !chord.passing)

/**
 * Hợp âm chủ của bài, nhặt trong chính vòng của bài.
 *
 * Không dựng hợp âm chủ từ giọng, vì dựng thì ra hợp âm ba nốt trơn: bài đang
 * chạy `Am(add9)` mà đoạn kết đậu xuống `Am` trần là đổi màu ngay ở chỗ người
 * nghe chú ý nhất. Lấy **hợp âm cuối bài** nếu nó đúng nốt gốc chủ âm, vì đó là
 * chỗ bài vốn đã đậu xuống; không thì lấy hợp âm đầu tiên trong vòng khớp nốt
 * gốc ấy.
 */
function tonicChordOf(
  chords: readonly ParsedChord[],
  key: { tonic: PitchClass; scale: ScaleType },
): ParsedChord | null {
  if (chords.length === 0) return null
  const last = chords[chords.length - 1]!
  if (last.root === key.tonic) return last
  return chords.find((chord) => chord.root === key.tonic) ?? null
}

/**
 * Vòng hợp âm của đoạn dạo, **mượn từ bài**.
 *
 * Dạo đầu: bốn hợp âm liên tiếp trong bài, hợp âm cuối hút vào đầu phiên.
 * Không chép hết phiên khúc. Cùng bộ chọn với giang tấu (`chooseInterludeWindow`).
 *
 * Kết bài giữ hình ba ô như cũ — một ô dẫn rồi hai ô đậu lại — nhưng cả ba ô
 * đều là hợp âm có thật trong bài: ô dẫn là hợp âm trong vòng hút mạnh nhất về
 * hợp âm chủ, hai ô sau là chính hợp âm chủ của bài, giữ nguyên màu.
 */
function pcsOf(chord: ParsedChord): Set<number> {
  return new Set(chord.quality.intervals.map((interval) => (chord.root + interval) % 12))
}

function chungNot(a: ParsedChord, b: ParsedChord): number {
  const left = pcsOf(a)
  let n = 0
  for (const pc of pcsOf(b)) if (left.has(pc)) n += 1
  return n
}

function diDuoc(
  a: ParsedChord,
  b: ParsedChord,
  key: { tonic: PitchClass; scale: ScaleType },
): boolean {
  if (key.scale === 'minor' && a.root === key.tonic) {
    const bac = (b.root - key.tonic + 12) % 12
    if (bac === 8 || bac === 3) return false
  }
  return chungNot(a, b) >= 2 || pullStrength(a, b) >= 3 || pullStrength(b, a) >= 3
}

function chacIntro(
  list: ParsedChord[],
  key: { tonic: PitchClass; scale: ScaleType },
): ParsedChord[] {
  if (list.length < 2) return list
  const out = [list[0]!]
  for (let i = 1; i < list.length; i += 1) {
    const prev = out[i - 1]!
    let next = list[i]!
    if (!diDuoc(prev, next, key)) {
      const tron = plainForInterlude(next)
      next = diDuoc(prev, tron, key)
        ? tron
        : (pullChordFor(prev, { strong: true }) ?? tron)
    }
    out.push(next)
  }
  return out
}

function borrowedChords(
  kind: 'intro' | 'outro',
  key: { tonic: PitchClass; scale: ScaleType },
  songChords: readonly ParsedChord[],
  verse: readonly ParsedChord[] = [],
  thay?: SoloTeacher,
  songIntro: readonly ParsedChord[] = [],
): ParsedChord[] {
  const main = mainChords(songChords)
  if (main.length === 0) return []

  if (kind === 'intro') {
    const xuong = verse.length > 0 ? verse : main
    const theoThay = introChordsForTeacher(thay ?? null, key, main, xuong, songIntro)
    if (theoThay.length > 0) return chacIntro(theoThay, key)
    const target = xuong[0] ?? main[0]!
    const window = chooseInterludeWindow(main, target, 4)
    const raw = window
      ? main.slice(window.from, window.to + 1)
      : main.slice(0, Math.min(4, main.length))
    return chacIntro(raw, key)
  }

  const tonic = tonicChordOf(main, key) ?? main[main.length - 1]!

  /*
    Ô dẫn: hợp âm trong bài hút mạnh nhất về hợp âm chủ.

    Loại chính hợp âm chủ ra — đứng yên một chỗ thì không có gì báo là sắp kết.
    Hoà điểm thì lấy hợp âm ĐỨNG TRƯỚC hợp âm chủ trong bài, vì đó là chỗ tai đã
    quen nghe dẫn vào chủ âm suốt cả bài.
  */
  let lead: ParsedChord | null = null
  let bestPull = -1
  main.forEach((chord, at) => {
    if (normalizePitchClass(chord.root - tonic.root) === 0) return
    const before = main[(at + 1) % main.length]
    const pull = pullStrength(chord, tonic) + (before === tonic ? 0.5 : 0)
    if (pull > bestPull) {
      bestPull = pull
      lead = chord
    }
  })

  return lead ? [lead, tonic, tonic] : [tonic, tonic, tonic]
}

/**
 * Dựng hợp âm cho đoạn dạo.
 *
 * Có vòng của bài thì **mượn từ bài**; không thì quy về bảng bậc. Bảng bậc là
 * đường lui chứ không phải đường chính: nó chỉ biết giọng, nên bài chạy
 * `Am(add9) - Dm9 - Cadd2 - Em7` mà đoạn dạo lại kêu `C - G - Am - F`, nghe ra
 * là hai bài khác nhau dán cạnh nhau.
 *
 * Giọng thứ quy về giọng trưởng song song, cùng lý do như mọi chỗ khác dùng bậc
 * của kho: các bậc `I - V - vi - IV` được đánh số theo giọng trưởng.
 */
export function phraseChords(
  kind: 'intro' | 'outro',
  key: { tonic: PitchClass; scale: ScaleType } | null,
  options: PhraseChordOptions = {},
): ParsedChord[] {
  if (!key) return []

  const borrowed = options.songChords
    ? borrowedChords(
        kind,
        key,
        options.songChords,
        kind === 'intro' ? mainChords(options.vongPhienKhuc ?? []) : [],
        options.thay,
        options.songIntro ?? [],
      )
    : []
  if (borrowed.length > 0) {
    return options.plain ? borrowed.map(plainForInterlude) : [...borrowed]
  }

  const tonic: PitchClass =
    key.scale === 'minor' ? (((key.tonic + 3) % 12) as PitchClass) : key.tonic

  const out: ParsedChord[] = []
  for (const degree of DEGREES[kind]) {
    const chord = chordAtDegree(tonic, 'major', degree)
    if (!chord) continue
    out.push({
      root: chord.root,
      quality: chord.quality,
      ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
      source: chord.symbol,
      symbol: chord.symbol,
    })
  }

  return options.plain ? out.map(plainForInterlude) : out
}

/**
 * Hợp âm **báo**: một phách hút mạnh về hợp âm mở bài, đánh sau khi vòng dạo
 * đầu đã chạy trọn.
 *
 * Vòng I - V - vi - IV kết ở bậc IV, mà bậc IV thì đưa đẩy chứ không kéo — ca
 * sĩ nghe xong không biết mình vào ở đâu. Một phách hợp âm át của **chính hợp
 * âm mở bài** thì chỗ vào rõ hẳn: tai đã quen chờ hợp âm át giải quyết.
 *
 * Một phách thôi, không phải một ô. Kéo dài cả ô thì nó thành một hợp âm của
 * vòng, và cái vòng bốn ô vốn đã trọn vẹn lại bị đèo thêm một đuôi.
 *
 * Lấy **bảng màu hút mạnh**, không lấy bảng quay đầu. Bảng quay đầu mở đầu bằng
 * `9sus4` — màu chữ ký của thầy, và ở chỗ quay đầu nó đúng, vì quay đầu là để đi
 * tiếp. Nhưng `9sus4` thay quãng ba bằng quãng bốn, tức xoá đúng nốt cảm, nốt
 * duy nhất muốn đi lên nửa cung vào chủ âm. Hợp âm báo mà mất nốt cảm thì nó
 * không hút nhẹ — nó không hút, và ca sĩ không biết mình vào ở đâu.
 */
export function cueChord(target: ParsedChord | null | undefined) {
  return target ? pullChordFor(target, { strong: true }) : null
}
