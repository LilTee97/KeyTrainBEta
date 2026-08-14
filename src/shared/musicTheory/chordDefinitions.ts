import { normalizePitchClass } from './pitch'
import type { ChordQuality, MidiNote, PitchClass } from './types'

/**
 * Từ vựng hợp âm của KeyTrain — giới hạn trong phạm vi jazz và pop.
 *
 * Chọn lọc theo nhu cầu thực tế của phong cách đệm hát được mô hình hoá
 * trong Reference/phongcachdemhatkhabu.md: nhiều hợp âm treo (sus), hợp âm
 * mở rộng (9, 11, 13), hợp âm giảm dùng làm hợp âm lướt, và các hợp âm
 * bậc V biến âm (7b9, 7#5, 13b9, 7b13) dùng để tạo lực kéo về hợp âm đích.
 *
 * Các quãng vượt quá 11 nửa cung là nốt mở rộng nằm ở quãng tám trên:
 * 14 = quãng 9, 17 = quãng 11, 21 = quãng 13.
 */
export const CHORD_QUALITIES: readonly ChordQuality[] = [
  // ── Hợp âm ba ──────────────────────────────────────────────────────────
  {
    id: 'maj',
    symbol: '',
    aliases: ['M', 'maj', 'major'],
    intervals: [0, 4, 7],
    label: 'Trưởng',
    family: 'triad',
  },
  {
    id: 'min',
    symbol: 'm',
    aliases: ['min', 'minor', '-'],
    intervals: [0, 3, 7],
    label: 'Thứ',
    family: 'triad',
  },
  {
    id: 'dim',
    symbol: 'dim',
    aliases: ['o', '°'],
    intervals: [0, 3, 6],
    label: 'Giảm',
    family: 'triad',
  },
  {
    id: 'aug',
    symbol: 'aug',
    aliases: ['+', '#5'],
    intervals: [0, 4, 8],
    label: 'Tăng',
    family: 'triad',
  },

  // ── Hợp âm treo ────────────────────────────────────────────────────────
  // Thay nốt bậc 3 bằng bậc 2 hoặc bậc 4, tạo màu lơ lửng chưa giải quyết.
  {
    id: 'sus2',
    symbol: 'sus2',
    aliases: ['2'],
    intervals: [0, 2, 7],
    label: 'Treo quãng 2',
    family: 'suspended',
  },
  {
    id: 'sus4',
    symbol: 'sus4',
    aliases: ['sus', '4'],
    intervals: [0, 5, 7],
    label: 'Treo quãng 4',
    family: 'suspended',
  },
  {
    id: '7sus4',
    symbol: '7sus4',
    aliases: ['7sus'],
    intervals: [0, 5, 7, 10],
    label: 'Bảy treo quãng 4',
    family: 'suspended',
  },
  {
    id: '9sus4',
    symbol: '9sus4',
    aliases: ['9sus'],
    intervals: [0, 5, 7, 10, 14],
    label: 'Chín treo quãng 4',
    family: 'suspended',
  },
  {
    id: '13sus4',
    symbol: '13sus4',
    aliases: ['13sus'],
    intervals: [0, 5, 7, 10, 14, 21],
    label: 'Mười ba treo quãng 4',
    family: 'suspended',
  },
  {
    id: '7b9sus4',
    symbol: '7b9sus4',
    aliases: ['7b9sus'],
    intervals: [0, 5, 7, 10, 13],
    label: 'Bảy giáng chín treo quãng 4',
    family: 'suspended',
  },

  // ── Hợp âm thêm nốt ────────────────────────────────────────────────────
  // Thêm nốt màu mà không thêm bậc 7 — cách làm dày hợp âm rất phổ biến
  // trong phong cách này, thường viết là add2.
  {
    id: 'add9',
    symbol: 'add9',
    aliases: ['add2'],
    intervals: [0, 4, 7, 14],
    label: 'Trưởng thêm quãng 9',
    family: 'triad',
  },
  {
    id: 'madd9',
    symbol: 'm(add9)',
    aliases: ['madd9', 'madd2'],
    intervals: [0, 3, 7, 14],
    label: 'Thứ thêm quãng 9',
    family: 'triad',
  },

  // ── Hợp âm sáu ─────────────────────────────────────────────────────────
  {
    id: '6',
    symbol: '6',
    aliases: ['maj6', 'M6'],
    intervals: [0, 4, 7, 9],
    label: 'Sáu trưởng',
    family: 'sixth',
  },
  {
    id: 'm6',
    symbol: 'm6',
    aliases: ['min6', '-6'],
    intervals: [0, 3, 7, 9],
    label: 'Sáu thứ',
    family: 'sixth',
  },
  {
    id: '69',
    symbol: '6/9',
    aliases: ['69', '6add9'],
    intervals: [0, 4, 7, 9, 14],
    label: 'Sáu chín',
    family: 'sixth',
  },

  // ── Hợp âm bảy ─────────────────────────────────────────────────────────
  {
    id: 'maj7',
    symbol: 'maj7',
    aliases: ['M7', 'ma7', 'Δ', 'Δ7'],
    intervals: [0, 4, 7, 11],
    label: 'Bảy trưởng',
    family: 'seventh',
  },
  {
    id: '7',
    symbol: '7',
    aliases: ['dom7'],
    intervals: [0, 4, 7, 10],
    label: 'Bảy át',
    family: 'seventh',
  },
  {
    id: 'm7',
    symbol: 'm7',
    aliases: ['min7', '-7'],
    intervals: [0, 3, 7, 10],
    label: 'Bảy thứ',
    family: 'seventh',
  },
  {
    id: 'mMaj7',
    symbol: 'm(maj7)',
    aliases: ['mMaj7', 'mM7', '-Δ7'],
    intervals: [0, 3, 7, 11],
    label: 'Thứ bảy trưởng',
    family: 'seventh',
  },
  {
    id: 'm7b5',
    symbol: 'm7b5',
    aliases: ['ø', 'ø7', 'halfdim', 'min7b5'],
    intervals: [0, 3, 6, 10],
    label: 'Nửa giảm',
    family: 'seventh',
  },
  {
    id: 'dim7',
    symbol: 'dim7',
    aliases: ['o7', '°7'],
    intervals: [0, 3, 6, 9],
    label: 'Bảy giảm',
    family: 'seventh',
  },

  // ── Hợp âm chín ────────────────────────────────────────────────────────
  {
    id: 'maj9',
    symbol: 'maj9',
    aliases: ['M9', 'Δ9'],
    intervals: [0, 4, 7, 11, 14],
    label: 'Chín trưởng',
    family: 'extended',
  },
  {
    id: '9',
    symbol: '9',
    aliases: ['dom9'],
    intervals: [0, 4, 7, 10, 14],
    label: 'Chín át',
    family: 'extended',
  },
  {
    id: 'm9',
    symbol: 'm9',
    aliases: ['min9', '-9'],
    intervals: [0, 3, 7, 10, 14],
    label: 'Chín thứ',
    family: 'extended',
  },

  // ── Hợp âm mười một ────────────────────────────────────────────────────
  // Hợp âm 11 át thường bỏ bậc 3 vì bậc 3 và bậc 11 cách nhau nửa cung,
  // vang lên cùng nhau sẽ nghịch.
  {
    id: '11',
    symbol: '11',
    aliases: ['dom11'],
    intervals: [0, 7, 10, 14, 17],
    label: 'Mười một át',
    family: 'extended',
  },
  {
    id: 'm11',
    symbol: 'm11',
    aliases: ['min11', '-11'],
    intervals: [0, 3, 7, 10, 14, 17],
    label: 'Mười một thứ',
    family: 'extended',
  },
  {
    id: 'maj7#11',
    symbol: 'maj7#11',
    aliases: ['M7#11', 'Δ7#11'],
    intervals: [0, 4, 7, 11, 18],
    label: 'Bảy trưởng thăng mười một',
    family: 'extended',
  },

  // ── Hợp âm mười ba ─────────────────────────────────────────────────────
  {
    id: 'maj13',
    symbol: 'maj13',
    aliases: ['M13', 'Δ13'],
    intervals: [0, 4, 7, 11, 14, 21],
    label: 'Mười ba trưởng',
    family: 'extended',
  },
  {
    id: '13',
    symbol: '13',
    aliases: ['dom13'],
    intervals: [0, 4, 7, 10, 14, 21],
    label: 'Mười ba át',
    family: 'extended',
  },
  {
    id: 'm13',
    symbol: 'm13',
    aliases: ['min13', '-13'],
    intervals: [0, 3, 7, 10, 14, 21],
    label: 'Mười ba thứ',
    family: 'extended',
  },

  // ── Hợp âm át biến âm ──────────────────────────────────────────────────
  // Dùng để tăng lực kéo về hợp âm đích, hoặc để đổi màu hợp âm kết
  // mỗi lượt lặp câu nhạc.
  {
    id: '7b5',
    symbol: '7b5',
    aliases: [],
    intervals: [0, 4, 6, 10],
    label: 'Bảy giáng năm',
    family: 'altered',
  },
  {
    id: '7#5',
    symbol: '7#5',
    aliases: ['7+5', 'aug7', '7aug'],
    intervals: [0, 4, 8, 10],
    label: 'Bảy thăng năm',
    family: 'altered',
  },
  {
    id: '7b9',
    symbol: '7b9',
    aliases: [],
    intervals: [0, 4, 7, 10, 13],
    label: 'Bảy giáng chín',
    family: 'altered',
  },
  {
    id: '7#9',
    symbol: '7#9',
    aliases: [],
    intervals: [0, 4, 7, 10, 15],
    label: 'Bảy thăng chín',
    family: 'altered',
  },
  {
    id: '7#11',
    symbol: '7#11',
    aliases: [],
    intervals: [0, 4, 7, 10, 18],
    label: 'Bảy thăng mười một',
    family: 'altered',
  },
  {
    id: '7b13',
    symbol: '7b13',
    aliases: [],
    intervals: [0, 4, 7, 10, 20],
    label: 'Bảy giáng mười ba',
    family: 'altered',
  },
  {
    id: '13b9',
    symbol: '13b9',
    aliases: [],
    intervals: [0, 4, 7, 10, 13, 21],
    label: 'Mười ba giáng chín',
    family: 'altered',
  },
]

const QUALITIES_BY_ID = new Map<string, ChordQuality>(
  CHORD_QUALITIES.map((quality) => [quality.id, quality]),
)

/**
 * Bảng tra hậu tố → tính chất hợp âm, giữ nguyên hoa thường.
 *
 * Trong ký hiệu hợp âm, hoa thường mang nghĩa: 'CM7' là bảy trưởng còn
 * 'Cm7' là bảy thứ. Vì vậy phải tra khớp chính xác trước.
 */
const QUALITIES_BY_EXACT_SYMBOL = new Map<string, ChordQuality>()

/**
 * Bảng tra dự phòng, viết thường tất cả, dùng khi người dùng gõ sai kiểu
 * hoa thường (ví dụ 'MAJ7' hay 'Min7'). Khi nhiều hậu tố cùng gập về một
 * khoá thì hậu tố chuẩn thắng — nên khoá 'm7' trỏ về hợp âm bảy thứ,
 * cách hiểu an toàn hơn cho chuỗi viết thường.
 */
const QUALITIES_BY_LOWERCASE_SYMBOL = new Map<string, ChordQuality>()

for (const quality of CHORD_QUALITIES) {
  for (const candidate of [quality.symbol, ...quality.aliases]) {
    const isCanonical = candidate === quality.symbol

    if (isCanonical || !QUALITIES_BY_EXACT_SYMBOL.has(candidate)) {
      QUALITIES_BY_EXACT_SYMBOL.set(candidate, quality)
    }

    const lowercased = candidate.toLowerCase()
    if (isCanonical || !QUALITIES_BY_LOWERCASE_SYMBOL.has(lowercased)) {
      QUALITIES_BY_LOWERCASE_SYMBOL.set(lowercased, quality)
    }
  }
}

/** Tra tính chất hợp âm theo định danh nội bộ. */
export function getChordQuality(id: string): ChordQuality | undefined {
  return QUALITIES_BY_ID.get(id)
}

/**
 * Tra tính chất hợp âm theo hậu tố người dùng viết, ví dụ 'm7', 'Δ7', '-7'.
 * Chuỗi rỗng trả về hợp âm ba trưởng, đúng quy ước ký hiệu hợp âm.
 *
 * Khớp chính xác hoa thường trước để giữ phân biệt 'M7' (bảy trưởng) với
 * 'm7' (bảy thứ); chỉ khi không khớp mới thử lại bỏ qua hoa thường.
 */
export function findQualityBySymbol(
  symbol: string,
): ChordQuality | undefined {
  const trimmed = symbol.trim()
  return (
    QUALITIES_BY_EXACT_SYMBOL.get(trimmed) ??
    QUALITIES_BY_LOWERCASE_SYMBOL.get(trimmed.toLowerCase())
  )
}

/** Lọc từ vựng theo nhóm, dùng khi người dùng chọn phạm vi luyện tập. */
export function qualitiesByFamily(
  family: ChordQuality['family'],
): ChordQuality[] {
  return CHORD_QUALITIES.filter((quality) => quality.family === family)
}

/**
 * Các lớp cao độ tạo nên hợp âm, đã bỏ trùng lặp.
 * Bỏ quãng tám nên nốt mở rộng gập về cùng quãng tám với nốt gốc —
 * dùng khi so khớp hợp âm, không dùng để phát tiếng.
 */
export function chordPitchClasses(
  root: PitchClass,
  quality: ChordQuality,
): PitchClass[] {
  const seen = new Set<PitchClass>()
  for (const interval of quality.intervals) {
    seen.add(normalizePitchClass(root + interval))
  }
  return [...seen]
}

/**
 * Các nốt MIDI của hợp âm, xếp chồng từ nốt gốc lên theo đúng quãng đã
 * định nghĩa — nốt mở rộng do đó nằm ở quãng tám trên. Đây là thế bấm
 * gốc (thế nguyên vị) mộc mạc, chưa qua xử lý dẫn bè.
 */
export function chordNotes(
  rootNote: MidiNote,
  quality: ChordQuality,
): MidiNote[] {
  return quality.intervals.map((interval) => rootNote + interval)
}
