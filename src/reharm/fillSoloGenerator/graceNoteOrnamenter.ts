import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'

/**
 * Nốt láy — kỹ thuật 4 của phong cách.
 *
 * Tài liệu mô tả đây **không phải** chạy gam tự do như solo jazz, mà là một
 * thao tác có hệ thống: trước mỗi nốt chính, chèn một nốt phụ rất ngắn cách
 * nó **một bậc** (quãng hai trưởng hoặc thứ) ở trên hoặc dưới. Ba kiểu tiếp
 * cận, và càng dày thì càng nghe "mượt tay".
 *
 * Lưu ý về mức độ tin cậy: tài liệu cho **nguyên lý** chứ không cho công thức
 * đầy đủ — không nói rõ chọn nốt nào để láy, mật độ bao nhiêu là vừa. Phần
 * dưới đây là cách hiện thực hoá nguyên lý đó, tức là **mô phỏng gần đúng**,
 * không phải chép lại. Giao diện phải nói rõ điều này.
 */

export type ApproachDirection =
  /** Láy từ nốt dưới lên. */
  | 'below'
  /** Láy từ nốt trên xuống. */
  | 'above'
  /** Xen kẽ trên dưới, nghe linh hoạt nhất. */
  | 'mixed'

/** Ba mức mật độ, đúng như tài liệu mô tả. */
export type OrnamentDensity = 'sparse' | 'medium' | 'dense'

export interface DensityOption {
  id: OrnamentDensity
  label: string
  description: string
  /** Cứ mấy nốt thì láy một nốt. */
  everyNth: number
}

export const DENSITY_OPTIONS: readonly DensityOption[] = [
  {
    id: 'sparse',
    label: 'Thưa',
    description: 'Chỉ láy ở nốt đầu mỗi hợp âm, giữ câu nhạc gọn.',
    everyNth: 4,
  },
  {
    id: 'medium',
    label: 'Vừa',
    description: 'Láy cách nốt, nghe có chuyển động mà không rối.',
    everyNth: 2,
  },
  {
    id: 'dense',
    label: 'Dày',
    description: 'Láy gần như mọi nốt, tạo cảm giác mượt tay nhất.',
    everyNth: 1,
  },
]

export const PHRASE_DENSITY_OPTIONS = DENSITY_OPTIONS.filter(
  (option) => option.id !== 'sparse',
)

export function densityOption(density: OrnamentDensity): DensityOption {
  return (
    DENSITY_OPTIONS.find((option) => option.id === density) ??
    DENSITY_OPTIONS[1]
  )
}

/**
 * Nốt liền bậc trên hoặc dưới, **trong gam**.
 *
 * Dùng bậc của gam chứ không phải nửa cung cố định: tài liệu ghi là "một bậc",
 * mà trong gam thì bậc lúc là một cung lúc là nửa cung. Lấy cố định nửa cung
 * sẽ sinh ra nốt ngoài giọng ở nửa số trường hợp.
 */
export function stepInScale(
  note: MidiNote,
  direction: 'up' | 'down',
  scaleTones: ReadonlySet<PitchClass>,
): MidiNote {
  if (scaleTones.size === 0) return note + (direction === 'up' ? 2 : -2)

  const delta = direction === 'up' ? 1 : -1
  for (let step = 1; step <= 3; step += 1) {
    const candidate = note + delta * step
    if (scaleTones.has(((candidate % 12) + 12) % 12)) return candidate
  }

  // Gam lạ tới mức không có nốt nào trong ba nửa cung thì lùi về một cung.
  return note + delta * 2
}

export interface OrnamentedNote {
  /** Nốt láy vang trước, hoặc null nếu nốt này không được láy. */
  grace: MidiNote | null
  main: MidiNote
}

export interface OrnamentOptions {
  direction?: ApproachDirection
  density?: OrnamentDensity
  /** Các lớp cao độ của gam, để nốt láy không rơi ra ngoài giọng. */
  scaleTones?: ReadonlySet<PitchClass>
}

/**
 * Gắn nốt láy cho một câu nhạc.
 *
 * Kiểu xen kẽ đổi chiều sau **mỗi nốt được láy**, không phải mỗi nốt — nếu
 * đổi theo mọi nốt thì ở mật độ thưa sẽ luôn ra cùng một chiều.
 */
export function ornamentLine(
  notes: readonly MidiNote[],
  options: OrnamentOptions = {},
): OrnamentedNote[] {
  const {
    direction = 'mixed',
    density = 'medium',
    scaleTones = new Set<PitchClass>(),
  } = options

  const { everyNth } = densityOption(density)
  let ornamentCount = 0

  return notes.map((main, index) => {
    if (index % everyNth !== 0) return { grace: null, main }

    const way =
      direction === 'mixed'
        ? ornamentCount % 2 === 0
          ? 'down'
          : 'up'
        : direction === 'below'
          ? 'down'
          : 'up'

    ornamentCount += 1
    return { grace: stepInScale(main, way, scaleTones), main }
  })
}
