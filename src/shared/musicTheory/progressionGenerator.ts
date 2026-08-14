import { normalizePitchClass } from './pitch'
import type { Chord, ScaleType } from './scales'
import { chordAtDegree, degreesOf } from './scales'
import type { AccidentalStyle, PitchClass } from './types'

/**
 * Vòng hợp âm dựng sẵn và cách sinh vòng ngẫu nhiên.
 *
 * Danh sách thiên về jazz và pop, lấy cả các vòng mà tài liệu phong cách
 * (Reference/phongcachdemhatkhabu.md) nhắc tới trực tiếp.
 */

export interface ProgressionStep {
  /** Bậc trong giọng, đếm từ 1. */
  degree: number
  /**
   * Ghi đè tính chất hợp âm mặc định của bậc.
   * Ví dụ bậc V trong giọng thứ thường đổi thành hợp âm bảy át.
   */
  qualityOverride?: string
}

export interface ProgressionTemplate {
  id: string
  name: string
  scale: ScaleType
  steps: readonly ProgressionStep[]
  /** Vì sao vòng này đáng học. */
  note?: string
}

export const PROGRESSION_TEMPLATES: readonly ProgressionTemplate[] = [
  {
    id: 'ii-V-I',
    name: 'ii–V–I',
    scale: 'major',
    steps: [{ degree: 2 }, { degree: 5 }, { degree: 1 }],
    note: 'Vòng nền tảng của jazz, cũng là khuôn của mọi vòng 2-5-1 lướt.',
  },
  {
    id: 'ii-V-I-vi',
    name: 'ii–V–I–vi',
    scale: 'major',
    steps: [{ degree: 2 }, { degree: 5 }, { degree: 1 }, { degree: 6 }],
    note: 'Dùng làm vòng chủ đạo cho cả bài thay cho I–V–vi–IV quen thuộc.',
  },
  {
    id: 'I-V-vi-IV',
    name: 'I–V–vi–IV',
    scale: 'major',
    steps: [{ degree: 1 }, { degree: 5 }, { degree: 6 }, { degree: 4 }],
    note: 'Vòng pop phổ biến nhất, gặp ở vô số bài nhạc trẻ.',
  },
  {
    id: 'vi-IV-I-V',
    name: 'vi–IV–I–V',
    scale: 'major',
    steps: [{ degree: 6 }, { degree: 4 }, { degree: 1 }, { degree: 5 }],
    note: 'Chính là vòng pop trên nhưng bắt đầu từ bậc sáu, nghe man mác hơn.',
  },
  {
    id: 'I-vi-ii-V',
    name: 'I–vi–ii–V',
    scale: 'major',
    steps: [{ degree: 1 }, { degree: 6 }, { degree: 2 }, { degree: 5 }],
    note: 'Vòng quay đầu kinh điển, dùng để nối cuối câu về đầu câu.',
  },
  {
    id: 'I-vi-IV-V',
    name: 'I–vi–IV–V',
    scale: 'major',
    steps: [{ degree: 1 }, { degree: 6 }, { degree: 4 }, { degree: 5 }],
    note: 'Vòng doo-wop của nhạc thập niên 50-60.',
  },
  {
    id: 'I-IV-V',
    name: 'I–IV–V',
    scale: 'major',
    steps: [{ degree: 1 }, { degree: 4 }, { degree: 5 }],
    note: 'Ba hợp âm chính của giọng, nền của nhạc dân gian và blues.',
  },
  {
    id: 'canon',
    name: 'Vòng Canon',
    scale: 'major',
    steps: [
      { degree: 1 },
      { degree: 5 },
      { degree: 6 },
      { degree: 3 },
      { degree: 4 },
      { degree: 1 },
      { degree: 4 },
      { degree: 5 },
    ],
    note: 'Vòng dùng để minh hoạ kỹ thuật dẫn bè bằng thế đảo.',
  },
  {
    id: 'ii-V-i-minor',
    name: 'iiø–V7–i (giọng thứ)',
    scale: 'minor',
    steps: [
      { degree: 2 },
      { degree: 5, qualityOverride: '7' },
      { degree: 1 },
    ],
    note: 'Bậc hai nửa giảm và bậc năm đổi thành bảy át để kéo mạnh về chủ âm.',
  },
  {
    id: 'i-VI-III-VII',
    name: 'i–VI–III–VII',
    scale: 'minor',
    steps: [
      { degree: 1 },
      { degree: 6 },
      { degree: 3 },
      { degree: 7 },
    ],
    note: 'Vòng thứ hay gặp trong ballad Việt Nam.',
  },
  {
    id: 'i-iv-V',
    name: 'i–iv–V7 (giọng thứ)',
    scale: 'minor',
    steps: [
      { degree: 1 },
      { degree: 4 },
      { degree: 5, qualityOverride: '7' },
    ],
    note: 'Ba hợp âm chính của giọng thứ.',
  },
]

export function getProgressionTemplate(
  id: string,
): ProgressionTemplate | undefined {
  return PROGRESSION_TEMPLATES.find((template) => template.id === id)
}

/** Dựng vòng hợp âm cụ thể trong một giọng. */
export function buildProgression(
  template: ProgressionTemplate,
  tonic: PitchClass,
  options: {
    useSevenths?: boolean
    accidentalStyle?: AccidentalStyle
  } = {},
): Chord[] {
  return template.steps
    .map((step) =>
      chordAtDegree(tonic, template.scale, step.degree, {
        ...options,
        qualityOverride: step.qualityOverride,
      }),
    )
    .filter((chord): chord is Chord => chord !== null)
}

/**
 * Cách chọn giọng cho lượt luyện kế tiếp.
 *
 * Đi theo vòng quãng bốn hoặc quãng năm là cách luyện kinh điển: sau mười hai
 * lượt sẽ đi hết cả mười hai giọng, không sót giọng nào như khi chọn ngẫu nhiên.
 */
export type KeyFlow =
  | 'random'
  | 'circleOfFourths'
  | 'circleOfFifths'
  | 'chromatic'
  | 'wholeStep'
  | 'minorThird'

export interface KeyFlowOption {
  id: KeyFlow
  label: string
  description: string
}

export const KEY_FLOW_OPTIONS: readonly KeyFlowOption[] = [
  {
    id: 'random',
    label: 'Ngẫu nhiên',
    description: 'Mỗi lượt một giọng bất kỳ.',
  },
  {
    id: 'circleOfFourths',
    label: 'Vòng quãng bốn',
    description: 'C → F → Bb → Eb… đi hết mười hai giọng.',
  },
  {
    id: 'circleOfFifths',
    label: 'Vòng quãng năm',
    description: 'C → G → D → A… đi hết mười hai giọng.',
  },
  {
    id: 'chromatic',
    label: 'Nửa cung',
    description: 'Lên từng nửa cung một.',
  },
  {
    id: 'wholeStep',
    label: 'Nguyên cung',
    description: 'Lên từng cung, sáu lượt là quay lại.',
  },
  {
    id: 'minorThird',
    label: 'Quãng ba thứ',
    description: 'Lên từng quãng ba thứ, bốn lượt là quay lại.',
  },
]

/** Khoảng cách nửa cung mỗi lượt, cho các cách đi có quy luật. */
const FLOW_STEPS: Record<Exclude<KeyFlow, 'random'>, number> = {
  circleOfFourths: 5,
  circleOfFifths: 7,
  chromatic: 1,
  wholeStep: 2,
  minorThird: 3,
}

/** Giọng của lượt kế tiếp. */
export function nextTonic(
  current: PitchClass,
  flow: KeyFlow,
  random: () => number = Math.random,
): PitchClass {
  if (flow === 'random') {
    // Tránh lặp lại đúng giọng vừa luyện, vì lặp ngay không luyện được gì.
    const offset = 1 + Math.floor(random() * 11)
    return normalizePitchClass(current + offset)
  }

  return normalizePitchClass(current + FLOW_STEPS[flow])
}

/**
 * Sinh một vòng hợp âm ngẫu nhiên trong giọng.
 *
 * Không sinh hoàn toàn tuỳ tiện: luôn mở đầu bằng bậc chủ âm và kết bằng bậc
 * năm hoặc bậc chủ âm, để vòng nghe ra vòng chứ không như chuỗi hợp âm rời rạc.
 */
export function randomProgressionSteps(
  length: number,
  scale: ScaleType,
  random: () => number = Math.random,
): ProgressionStep[] {
  const safeLength = Math.max(2, Math.floor(length))
  const availableDegrees = degreesOf(scale).map((entry) => entry.degree)

  const steps: ProgressionStep[] = [{ degree: 1 }]

  for (let index = 1; index < safeLength - 1; index += 1) {
    const previous = steps[steps.length - 1].degree
    // Không lặp lại ngay hợp âm vừa dùng.
    const candidates = availableDegrees.filter(
      (degree) => degree !== previous,
    )
    steps.push({
      degree: candidates[Math.floor(random() * candidates.length)],
    })
  }

  if (safeLength > 1) {
    const last = steps[steps.length - 1].degree
    steps.push({ degree: last === 5 ? 1 : 5 })
  }

  return steps
}

/** Bọc một chuỗi bậc ngẫu nhiên thành khuôn vòng hợp âm dùng được. */
export function randomProgressionTemplate(
  length: number,
  scale: ScaleType,
  random: () => number = Math.random,
): ProgressionTemplate {
  return {
    id: 'random',
    name: 'Vòng ngẫu nhiên',
    scale,
    steps: randomProgressionSteps(length, scale, random),
  }
}
