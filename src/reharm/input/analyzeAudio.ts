import { estimateKey, matchChroma, smoothBeatChords } from './chromaMatch'
import type { MatchKey } from './chromaMatch'
import {
  estimateBpmFromSamples,
  mixToMono,
} from './estimateBpm'
import type { ImportedChord } from './importedTrack'

/**
 * Đọc BPM + hợp âm theo phách từ file audio người dùng chọn.
 *
 * Chromagram + khớp template (maj/min/7/m7…), dò giọng trước rồi khớp theo —
 * cùng hướng Chordify bản đầu (chroma + mô hình hòa thanh), kém ML của họ.
 * Sai thì sửa trên lưới. Không phát file gốc.
 */

const TARGET_RATE = 11025
const FRAME = 2048
const HOP = 1024
const MIDI_LOW = 48
const MIDI_HIGH = 84

export interface AudioAnalysis {
  bpm: number
  perBeat: string[]
  chords: ImportedChord[]
}

function downsample(mix: Float32Array, fromRate: number): {
  samples: Float32Array
  sampleRate: number
} {
  if (fromRate <= TARGET_RATE * 1.1) {
    return { samples: mix, sampleRate: fromRate }
  }
  const step = fromRate / TARGET_RATE
  const length = Math.floor(mix.length / step)
  const samples = new Float32Array(length)
  for (let index = 0; index < length; index += 1) {
    samples[index] = mix[Math.floor(index * step)]
  }
  return { samples, sampleRate: TARGET_RATE }
}

function goertzel(frame: Float32Array, sampleRate: number, freq: number): number {
  const size = frame.length
  const k = Math.round((freq * size) / sampleRate)
  const coeff = 2 * Math.cos((2 * Math.PI * k) / size)
  let prev = 0
  let prev2 = 0
  for (let index = 0; index < size; index += 1) {
    const next = frame[index] + coeff * prev - prev2
    prev2 = prev
    prev = next
  }
  return prev * prev + prev2 * prev2 - coeff * prev * prev2
}

function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function chromaOf(frame: Float32Array, sampleRate: number): number[] {
  const bins = Array.from({ length: 12 }, () => 0)
  for (let midi = MIDI_LOW; midi <= MIDI_HIGH; midi += 1) {
    bins[midi % 12] += goertzel(frame, sampleRate, midiToHz(midi))
  }
  return bins
}

/** Chroma trung bình cả bài — dùng để dò giọng. */
function chromaAverage(
  samples: Float32Array,
  sampleRate: number,
): number[] {
  const bins = Array.from({ length: 12 }, () => 0)
  let frames = 0
  for (let start = 0; start + FRAME < samples.length; start += HOP) {
    const frame = samples.subarray(start, start + FRAME)
    const chroma = chromaOf(frame, sampleRate)
    for (let bin = 0; bin < 12; bin += 1) bins[bin] += chroma[bin]
    frames += 1
  }
  if (frames === 0) return bins
  return bins.map((value) => value / frames)
}

function firstOnset(samples: Float32Array, hop: number): number {
  let previous = 0
  for (let start = 0; start + hop < samples.length; start += hop) {
    let energy = 0
    for (let index = start; index < start + hop; index += 1) {
      energy += samples[index] * samples[index]
    }
    if (energy > previous * 3 && energy > 1e-4) return start
    previous = energy
  }
  return 0
}

export function detectBeatsFromSamples(
  samples: Float32Array,
  sampleRate: number,
  bpm: number,
  key?: MatchKey | null,
): string[] {
  const hopSamples = Math.round((60 / Math.max(40, bpm)) * sampleRate)
  if (hopSamples < FRAME) return []

  const startAt = firstOnset(samples, HOP)
  const endAt = samples.length
  const perBeat: string[] = []
  let previous: { symbol: string; root: number } | null = null

  for (
    let cursor = startAt;
    cursor + hopSamples <= endAt;
    cursor += hopSamples
  ) {
    const mid = cursor + Math.floor((hopSamples - FRAME) / 2)
    const frame = samples.subarray(mid, mid + FRAME)
    const matched = matchChroma(chromaOf(frame, sampleRate), key)

    // Giữ hợp âm trước khi nhạc không rõ; không nhấp nháy C→Cmaj7 cùng gốc.
    if (!matched || !previous) {
      if (matched) previous = { symbol: matched.symbol, root: matched.root }
      perBeat.push(previous?.symbol ?? 'C')
      continue
    }

    if (matched.root !== previous.root || matched.score >= 0.85) {
      previous = { symbol: matched.symbol, root: matched.root }
    }
    perBeat.push(previous.symbol)
  }

  return perBeat
}

export function analyzeBuffer(
  buffer: AudioBuffer,
  meter: 3 | 4 = 4,
): AudioAnalysis | null {
  const mixed = mixToMono(buffer)
  const { samples, sampleRate } = downsample(mixed, buffer.sampleRate)
  const bpm = estimateBpmFromSamples(samples, sampleRate)
  if (!bpm) return null

  const key = estimateKey(chromaAverage(samples, sampleRate))
  const raw = detectBeatsFromSamples(samples, sampleRate, bpm, key)
  if (raw.length === 0) return null
  const perBeat = smoothBeatChords(raw, meter)

  const chords: ImportedChord[] = []
  for (let start = 0; start < perBeat.length; start += meter) {
    const slice = perBeat.slice(start, start + meter)
    const same = slice.every((symbol) => symbol === slice[0])
    if (same) {
      chords.push({ symbol: slice[0], beats: slice.length })
      continue
    }
    for (const symbol of slice) chords.push({ symbol, beats: 1 })
  }

  return { bpm, perBeat, chords }
}

export async function analyzeAudioFile(
  file: File,
  meter: 3 | 4 = 4,
): Promise<AudioAnalysis | null> {
  const Context =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Context) return null

  const context = new Context()
  try {
    const raw = await file.arrayBuffer()
    const buffer = await context.decodeAudioData(raw.slice(0))
    return analyzeBuffer(buffer, meter)
  } catch {
    return null
  } finally {
    void context.close()
  }
}
