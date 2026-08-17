import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'

interface NetKey {
  root: number
  minor: boolean
}

export const NET_QUALITIES = ['maj', 'min', '7', 'm7', 'dim', 'sus4'] as const

const CLASS_COUNT = 12 * NET_QUALITIES.length
const FEATURES = 12

export interface ChordNetWeights {
  weights: number[][]
  bias: number[]
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let next = Math.imul(state ^ (state >>> 15), 1 | state)
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function l2(values: readonly number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))
}

export function unitChroma(values: readonly number[]): number[] {
  const norm = l2(values)
  if (norm < 1e-9) return Array.from({ length: FEATURES }, () => 0)
  return values.map((value) => value / norm)
}

function templateOf(qualityId: string): number[] {
  const quality = getChordQuality(qualityId)
  const bins = Array.from({ length: FEATURES }, () => 0)
  if (!quality) return bins
  for (const interval of quality.intervals) {
    const pc = interval % 12
    bins[pc] = pc === 0 ? 1.3 : pc === 3 || pc === 4 ? 1.15 : 1
  }
  return bins
}

function rotate(bins: readonly number[], root: number): number[] {
  return bins.map((_, index) => bins[(index - root + 12) % 12])
}

function classOf(root: number, qualityIndex: number): number {
  return root * NET_QUALITIES.length + qualityIndex
}

export function decodeClass(index: number): { root: number; qualityId: string } {
  return {
    root: Math.floor(index / NET_QUALITIES.length),
    qualityId: NET_QUALITIES[index % NET_QUALITIES.length],
  }
}

/** Một mẫu gán nhãn: biết hợp âm vì tự dựng chroma, rồi thêm nhiễu như nhạc thật. */
function labeledChroma(
  root: number,
  qualityId: string,
  rng: () => number,
): number[] {
  const bins = rotate(templateOf(qualityId), root)
  for (let bin = 0; bin < FEATURES; bin += 1) {
    bins[bin] += (rng() - 0.5) * 0.35
    if (bins[bin] < 0) bins[bin] = 0
  }
  if (rng() < 0.25) {
    const drop = Math.floor(rng() * FEATURES)
    bins[drop] *= 0.15
  }
  if (rng() < 0.35) {
    bins[Math.floor(rng() * FEATURES)] += 0.4 + rng() * 0.4
  }
  return unitChroma(bins)
}

function softmax(logits: number[]): number[] {
  const peak = Math.max(...logits)
  const exps = logits.map((value) => Math.exp(value - peak))
  const sum = exps.reduce((total, value) => total + value, 0)
  return exps.map((value) => value / sum)
}

function logitsOf(
  chroma: readonly number[],
  model: ChordNetWeights,
): number[] {
  return model.weights.map((row, index) => {
    let score = model.bias[index]
    for (let bin = 0; bin < FEATURES; bin += 1) score += row[bin] * chroma[bin]
    return score
  })
}

const SCALE_MAJOR = new Set([0, 2, 4, 5, 7, 9, 11])
const SCALE_MINOR = new Set([0, 2, 3, 5, 7, 8, 10])

/** Softmax một lớp, train SGD trên chroma tự gán nhãn. */
export function trainChordNet(seed = 2026): ChordNetWeights {
  const rng = mulberry32(seed)
  const samples: { x: number[]; y: number }[] = []
  for (let root = 0; root < 12; root += 1) {
    NET_QUALITIES.forEach((qualityId, qualityIndex) => {
      const label = classOf(root, qualityIndex)
      for (let copy = 0; copy < 28; copy += 1) {
        samples.push({ x: labeledChroma(root, qualityId, rng), y: label })
      }
    })
  }

  const weights = Array.from({ length: CLASS_COUNT }, () =>
    Array.from({ length: FEATURES }, () => (rng() - 0.5) * 0.04),
  )
  const bias = Array.from({ length: CLASS_COUNT }, () => 0)
  const rate = 0.18

  for (let epoch = 0; epoch < 18; epoch += 1) {
    for (let index = samples.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1))
      const temp = samples[index]
      samples[index] = samples[swap]
      samples[swap] = temp
    }
    for (const sample of samples) {
      const probs = softmax(logitsOf(sample.x, { weights, bias }))
      for (let klass = 0; klass < CLASS_COUNT; klass += 1) {
        const grad = probs[klass] - (klass === sample.y ? 1 : 0)
        for (let bin = 0; bin < FEATURES; bin += 1) {
          weights[klass][bin] -= rate * grad * sample.x[bin]
        }
        bias[klass] -= rate * grad
      }
    }
  }

  return { weights, bias }
}

let cached: ChordNetWeights | null = null

export function getChordNet(): ChordNetWeights {
  cached ??= trainChordNet()
  return cached
}

export function inferChordNet(
  chroma: readonly number[],
  key?: NetKey | null,
): { symbol: string; root: number; score: number } | null {
  const features = unitChroma(chroma)
  if (l2(features) < 1e-6) return null

  const scores = logitsOf(features, getChordNet())
  if (key) {
    const scale = key.minor ? SCALE_MINOR : SCALE_MAJOR
    for (let klass = 0; klass < CLASS_COUNT; klass += 1) {
      const degree = (decodeClass(klass).root - key.root + 12) % 12
      if (scale.has(degree)) scores[klass] += 0.35
    }
  }

  const probs = softmax(scores)
  let best = 0
  for (let klass = 1; klass < CLASS_COUNT; klass += 1) {
    if (probs[klass] > probs[best]) best = klass
  }
  if (probs[best] < 0.12) return null

  const { root, qualityId } = decodeClass(best)
  const quality = getChordQuality(qualityId)
  return {
    symbol: `${pitchClassName(root)}${quality?.symbol ?? ''}`,
    root,
    score: probs[best],
  }
}

/** Độ đúng trên tập gán nhãn mới (cùng cách sinh, seed khác). */
export function chordNetAccuracy(holdoutSeed = 99): number {
  const rng = mulberry32(holdoutSeed)
  let hit = 0
  let total = 0
  for (let root = 0; root < 12; root += 1) {
    for (const qualityId of NET_QUALITIES) {
      const quality = getChordQuality(qualityId)
      const expected = `${pitchClassName(root)}${quality?.symbol ?? ''}`
      for (let copy = 0; copy < 8; copy += 1) {
        const guess = inferChordNet(labeledChroma(root, qualityId, rng))
        if (guess?.symbol === expected) hit += 1
        total += 1
      }
    }
  }
  return hit / total
}
