import type { AccidentalStyle, MidiNote, PitchClass } from './types'

/** Đô giữa. KeyTrain dùng quy ước C4 = 60, giống Tone.js và đa số phần mềm nhạc. */
export const MIDDLE_C: MidiNote = 60

export const SEMITONES_PER_OCTAVE = 12

/** Giới hạn của giao thức MIDI. */
export const MIN_MIDI_NOTE: MidiNote = 0
export const MAX_MIDI_NOTE: MidiNote = 127

const SHARP_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

const FLAT_NAMES = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const

/** Vị trí nửa cung của 7 nốt tự nhiên trong quãng tám, tính từ C. */
const NATURAL_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/** Các phím đen trong một quãng tám, theo lớp cao độ. */
const BLACK_KEY_CLASSES = new Set<PitchClass>([1, 3, 6, 8, 10])

/**
 * Chuẩn hoá một số bất kỳ về lớp cao độ 0-11.
 * Xử lý được cả số âm (JavaScript trả về số âm cho phép % với số âm).
 */
export function normalizePitchClass(value: number): PitchClass {
  return ((value % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) %
    SEMITONES_PER_OCTAVE
}

/** Lấy lớp cao độ của một nốt MIDI. */
export function pitchClassOf(note: MidiNote): PitchClass {
  return normalizePitchClass(note)
}

/** Lấy số quãng tám của một nốt MIDI theo ký hiệu cao độ khoa học (C4 = 60). */
export function octaveOf(note: MidiNote): number {
  return Math.floor(note / SEMITONES_PER_OCTAVE) - 1
}

/** Nốt này có rơi vào phím đen của đàn piano không. */
export function isBlackKey(note: MidiNote): boolean {
  return BLACK_KEY_CLASSES.has(pitchClassOf(note))
}

/** Tên nốt không kèm quãng tám, ví dụ 'C#' hoặc 'Db'. */
export function pitchClassName(
  pitchClass: PitchClass,
  style: AccidentalStyle = 'sharp',
): string {
  const names = style === 'flat' ? FLAT_NAMES : SHARP_NAMES
  return names[normalizePitchClass(pitchClass)]
}

/** Tên nốt kèm quãng tám, ví dụ 'C4' hoặc 'Eb3'. */
export function midiToName(
  note: MidiNote,
  style: AccidentalStyle = 'sharp',
): string {
  return `${pitchClassName(pitchClassOf(note), style)}${octaveOf(note)}`
}

export interface ParsedNoteName {
  pitchClass: PitchClass
  /** Bằng null khi chuỗi chỉ ghi tên nốt mà không ghi quãng tám, ví dụ 'F#'. */
  octave: number | null
}

/**
 * Chấp nhận: chữ cái nốt (hoa hoặc thường), số dấu hoá bất kỳ (# b ♯ ♭),
 * và quãng tám tuỳ chọn (cho phép số âm, ví dụ 'C-1').
 */
const NOTE_NAME_PATTERN = /^([A-Ga-g])([#b♯♭]*)(-?\d+)?$/

/**
 * Đọc tên nốt thành lớp cao độ và quãng tám.
 * Trả về null nếu chuỗi không phải tên nốt hợp lệ.
 */
export function parseNoteName(name: string): ParsedNoteName | null {
  const match = NOTE_NAME_PATTERN.exec(name.trim())
  if (!match) return null

  const [, letter, accidentals, octaveText] = match
  const base = NATURAL_OFFSETS[letter.toUpperCase()]

  let offset = 0
  for (const character of accidentals) {
    if (character === '#' || character === '♯') offset += 1
    else offset -= 1
  }

  return {
    pitchClass: normalizePitchClass(base + offset),
    octave: octaveText === undefined ? null : Number(octaveText),
  }
}

/**
 * Đổi tên nốt thành số hiệu MIDI.
 * Chuỗi không ghi quãng tám thì dùng `defaultOctave`.
 * Trả về null nếu tên nốt sai hoặc kết quả nằm ngoài dải MIDI.
 */
export function nameToMidi(
  name: string,
  defaultOctave = 4,
): MidiNote | null {
  const parsed = parseNoteName(name)
  if (!parsed) return null

  const octave = parsed.octave ?? defaultOctave
  const note = (octave + 1) * SEMITONES_PER_OCTAVE + parsed.pitchClass

  return note >= MIN_MIDI_NOTE && note <= MAX_MIDI_NOTE ? note : null
}

/** Dịch giọng một nốt đi `semitones` nửa cung. */
export function transpose(note: MidiNote, semitones: number): MidiNote {
  return note + semitones
}

/** Nốt có nằm trong dải MIDI hợp lệ không. */
export function isValidMidiNote(note: number): boolean {
  return Number.isInteger(note) && note >= MIN_MIDI_NOTE && note <= MAX_MIDI_NOTE
}

/**
 * Khoảng cách nhỏ nhất giữa hai lớp cao độ, tính bằng nửa cung (0-6).
 * Dùng khi so sánh độ gần của hai nốt mà không quan tâm quãng tám —
 * nền tảng cho việc tính dẫn bè (voice leading) ở phần tái hòa âm.
 */
export function pitchClassDistance(a: PitchClass, b: PitchClass): number {
  const raw = Math.abs(normalizePitchClass(a) - normalizePitchClass(b))
  return Math.min(raw, SEMITONES_PER_OCTAVE - raw)
}
