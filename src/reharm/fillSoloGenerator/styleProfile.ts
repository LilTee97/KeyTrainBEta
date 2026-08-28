import { chordTonesStrict } from './soloVocabulary'
import type { ParsedChord } from '../types'

/**
 * Đo một dòng nốt và trả về **hình dạng thống kê** của nó.
 *
 * Đây là cái thước, không phải bộ sinh câu. Nó tồn tại để câu hỏi "bộ sinh mới
 * có hay hơn không" trả lời được bằng số thay vì bằng ý kiến — và để so được
 * với một người chơi thật thay vì với cảm giác của người viết mã.
 *
 * Ba chỉ số, chọn vì cả ba đo được thứ tai nghe ra:
 *
 * - **Hình câu chạy**: một câu là gam thuần, rải hợp âm thuần, hay pha trộn.
 *   Chỗ này bắt được lỗi nặng nhất của bản Licky: câu chạy chỉ gồm nốt hợp âm
 *   thì BẮT BUỘC là rải, vì nốt hợp âm cách nhau quãng ba và không còn gì ở
 *   giữa để bước vào.
 * - **Tỉ lệ nốt hợp âm**, tách theo nốt rơi đúng mạch và nốt rơi ngoài mạch.
 *   Người thật để khoảng một nửa số nốt nằm ngoài hợp âm; đặt nốt hợp âm ở mọi
 *   chỗ thì không còn chỗ nào để nó nổi bật lên.
 * - **Độ dài một hơi**: mấy nốt liền nhau trước khi có khoảng nghỉ.
 */

export interface LineProfile {
  /** Số câu chạy tìm được (từ 4 nốt liền nhau trở lên). */
  runs: number
  /** Tỉ lệ câu **gam thuần** — phần lớn bước là liền bậc. */
  scale: number
  /** Tỉ lệ câu **rải hợp âm thuần** — phần lớn bước là quãng ba. */
  arpeggio: number
  /** Tỉ lệ câu **pha trộn** — không nghiêng hẳn về bên nào. */
  mixed: number
  /** Độ dài trung vị của một câu chạy, tính bằng nốt. */
  medianRunLength: number
  /** Tỉ lệ nốt hợp âm trong những nốt rơi ĐÚNG mạch. */
  chordToneOnPulse: number
  /** Tỉ lệ nốt hợp âm trong những nốt rơi NGOÀI mạch. */
  chordToneOffPulse: number
  /**
   * Bao nhiêu **cỡ nhịp khác nhau** xuất hiện trong câu.
   *
   * Chỉ số này thêm sau, vì thiếu nó mà cả một bản dựng hỏng lọt lưới: bộ sinh
   * cọc-và-nối đạt 16 trên 24 chỉ số cũ rồi bị tai bác thẳng là "loạn". Đo lại
   * mới thấy nó chỉ có BA cỡ nhịp, còn người thật dùng bảy tới hai mươi hai.
   * Thước không đo nhịp thì nhịp tự do hỏng.
   */
  rhythmSizes: number
  /** Tỉ lệ nốt là móc đơn — cỡ nhịp trụ cột của người thật, quanh 53%. */
  eighthShare: number
  /** Tỉ lệ thời gian KHÔNG có nốt nào vào. */
  silence: number
  /**
   * Tỉ lệ chỗ dùng lại một hình đã xuất hiện, tính trên **cao độ VÀ nhịp**.
   *
   * Bản trước chỉ đếm trùng hình mà không nhìn nhịp, nên nó **nói dối**: bộ sinh
   * cọc-và-nối đo ra 60% — nằm trong khoảng người thật — nhưng con số ấy bị
   * thổi phồng chính vì nhịp đơn điệu. Ba cỡ nhịp thì trùng hình là đương nhiên,
   * và đó là sự ĐỀU ĐẶN chứ không phải motif.
   */
  motifReuse: number
}

export interface ProfileInput {
  notes: readonly { startBeat: number; note: number }[]
  chords: readonly ParsedChord[]
  beatsPerChord: number
  /** Chỗ mẫu đệm gõ trong một ô nhịp. Bỏ trống thì lấy phách chẵn của ô. */
  pulse?: readonly number[]
  beatsPerBar?: number
}

/** Hai nốt cách nhau không quá ngần này thì còn coi là cùng một hơi. */
const BREATH = 0.5
/** Bước rộng hơn ngần này thì hai nốt không còn thuộc cùng một câu. */
const LEAP = 12
/** Câu ngắn hơn ngần này thì không đủ để nói nó có hình gì. */
const MIN_RUN = 4
/** Khe từ ngần này trở lên là chỗ NGHỈ, không tính vào thời gian đang kêu. */
const BREATH_GAP = 1.5

/** Cắt dòng nốt thành từng hơi. */
function breaths(
  notes: readonly { startBeat: number; note: number }[],
): number[][] {
  const sorted = [...notes].sort((a, b) => a.startBeat - b.startBeat)
  const out: number[][] = []
  let current: typeof sorted = []

  for (const note of sorted) {
    const previous = current[current.length - 1]
    const joins =
      previous !== undefined &&
      note.startBeat - previous.startBeat <= BREATH + 1e-6 &&
      Math.abs(note.note - previous.note) <= LEAP
    if (previous === undefined || joins) {
      current.push(note)
      continue
    }
    if (current.length >= MIN_RUN) out.push(current.map((n) => n.note))
    current = [note]
  }
  if (current.length >= MIN_RUN) out.push(current.map((n) => n.note))
  return out
}

/**
 * Một câu là gam, là rải, hay pha trộn.
 *
 * Ngưỡng 60%: nghiêng hẳn về một bên thì mới gọi tên bên đó, còn lại là pha
 * trộn. Nốt lặp không tính — nó không phải một bước.
 */
function kindOf(run: readonly number[]): 'scale' | 'arpeggio' | 'mixed' | null {
  const steps = run
    .slice(1)
    .map((note, at) => Math.abs(note - run[at]!))
    .filter((step) => step !== 0)
  if (steps.length === 0) return null
  const stepwise = steps.filter((step) => step <= 2).length / steps.length
  const thirds = steps.filter((step) => step >= 3 && step <= 4).length / steps.length
  if (stepwise >= 0.6) return 'scale'
  if (thirds >= 0.6) return 'arpeggio'
  return 'mixed'
}

const median = (xs: readonly number[]) => {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

export function profileLine(input: ProfileInput): LineProfile {
  const { notes, chords, beatsPerChord } = input
  const bar = input.beatsPerBar ?? beatsPerChord
  const pulse = input.pulse?.length
    ? input.pulse
    : Array.from({ length: Math.max(1, Math.ceil(bar / 2)) }, (_, at) => at * 2)

  const runs = breaths(notes)
  const kinds = runs.map(kindOf).filter((k): k is NonNullable<typeof k> => k !== null)
  const total = kinds.length || 1

  let onPulse = 0
  let onPulseIn = 0
  let offPulse = 0
  let offPulseIn = 0

  for (const note of notes) {
    const chord = chords[Math.min(chords.length - 1, Math.floor(note.startBeat / beatsPerChord))]
    if (!chord) continue
    const inChord = chordTonesStrict(chord).includes(
      (((note.note % 12) + 12) % 12) as never,
    )
    const inBar = ((note.startBeat % bar) + bar) % bar
    if (pulse.some((step) => Math.abs(step - inBar) < 0.02)) {
      onPulse += 1
      if (inChord) onPulseIn += 1
    } else {
      offPulse += 1
      if (inChord) offPulseIn += 1
    }
  }

  /* Nhịp: khoảng cách giữa hai nốt liền nhau, làm tròn về lưới quen thuộc. */
  const sorted = [...notes].sort((a, b) => a.startBeat - b.startBeat)
  const gaps: number[] = []
  for (let at = 1; at < sorted.length; at += 1) {
    const gap = sorted[at]!.startBeat - sorted[at - 1]!.startBeat
    // Làm tròn về 1/12 nốt đen: đủ mịn cho cả chùm ba lẫn móc kép.
    if (gap > 0 && gap <= 4) gaps.push(Math.round(gap * 12) / 12)
  }
  const eighths = gaps.filter((gap) => Math.abs(gap - 0.5) < 1e-6).length
  const span = sorted.length > 1 ? sorted[sorted.length - 1]!.startBeat - sorted[0]!.startBeat : 0
  const sounding = gaps.reduce((sum, gap) => sum + Math.min(gap, BREATH_GAP), 0)

  /* Hình lặp: đếm theo CẢ cao độ lẫn nhịp — xem chú thích ở `motifReuse`. */
  const shapes = new Map<string, number>()
  for (let at = 0; at + 3 < sorted.length; at += 1) {
    const key = [0, 1, 2]
      .map((step) => {
        const from = sorted[at + step]!
        const to = sorted[at + step + 1]!
        return `${to.note - from.note}@${(to.startBeat - from.startBeat).toFixed(2)}`
      })
      .join('|')
    shapes.set(key, (shapes.get(key) ?? 0) + 1)
  }
  const shapeTotal = [...shapes.values()].reduce((sum, count) => sum + count, 0) || 1
  const reused = [...shapes.values()]
    .filter((count) => count > 1)
    .reduce((sum, count) => sum + count, 0)

  return {
    rhythmSizes: new Set(gaps).size,
    eighthShare: gaps.length === 0 ? 0 : eighths / gaps.length,
    silence: span <= 0 ? 0 : Math.max(0, 1 - sounding / span),
    motifReuse: reused / shapeTotal,
    runs: kinds.length,
    scale: kinds.filter((k) => k === 'scale').length / total,
    arpeggio: kinds.filter((k) => k === 'arpeggio').length / total,
    mixed: kinds.filter((k) => k === 'mixed').length / total,
    medianRunLength: median(runs.map((r) => r.length)),
    chordToneOnPulse: onPulse === 0 ? 0 : onPulseIn / onPulse,
    chordToneOffPulse: offPulse === 0 ? 0 : offPulseIn / offPulse,
  }
}

/**
 * Khoảng đo được trên corpus Cà Pháo — **7 bản ký âm, 350 câu chạy**.
 *
 * Nguồn `ca-phao-piano-covers`, item `ca-phao-cau-solo-tren-vong-hop-am` bên
 * PianoBrain. Thể loại: 2 bossa nova, 4 ballad, 1 slow rock 4/4.
 *
 * Ghi thành **KHOẢNG chứ không phải điểm**, cố ý. Trong cùng phiên làm việc này
 * đã có ba phát hiện trông sạch ở hai ba bài rồi tan khi thêm bài — nên mọi con
 * số ở đây phải mang theo bề rộng của nó, và phải đo lại mỗi khi corpus lớn thêm.
 *
 * Đây là **mục tiêu để so**, không phải điểm đỗ. Giống Cà Pháo không đồng nghĩa
 * với hay; nó nghĩa là giống một người đệm mà người dùng chọn để học.
 */
export const CA_PHAO_RANGE = {
  /**
   * Cỡ nhịp khác nhau: đo được 7 tới 22 tuỳ bài.
   *
   * Đây là chỉ số bắt được lỗi mà 24 chỉ số cũ để lọt. Lấy mép dưới làm sàn —
   * dưới bảy cỡ thì câu nghe ra một dòng đều tăm tắp, không tách được câu.
   */
  rhythmSizes: [7, 22],
  /** Móc đơn là cỡ trụ cột: 53% trên cả bảy bài, từng bài 25-74%. */
  eighthShare: [0.25, 0.74],
  scale: [0.06, 0.22],
  arpeggio: [0.02, 0.11],
  mixed: [0.68, 0.82],
  medianRunLength: [4, 8],
  chordToneOnPulse: [0.41, 0.69],
  chordToneOffPulse: [0.49, 0.62],
} as const

/** Con số này nằm trong khoảng đo được của Cà Pháo không. */
export const within = (value: number, range: readonly [number, number]) =>
  value >= range[0] - 1e-9 && value <= range[1] + 1e-9

/** Một dòng báo cáo gọn, để in ra khi so hai bộ sinh câu. */
export function describeProfile(profile: LineProfile): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`
  return (
    `${profile.rhythmSizes} cỡ nhịp · móc đơn ${pct(profile.eighthShare)} · ` +
    `lặng ${pct(profile.silence)} · lặp ${pct(profile.motifReuse)} · ` +
    `gam ${pct(profile.scale)} · rải ${pct(profile.arpeggio)} · trộn ${pct(profile.mixed)} · ` +
    `dài ${profile.medianRunLength} · hợp âm ${pct(profile.chordToneOnPulse)}/${pct(profile.chordToneOffPulse)}`
  )
}
