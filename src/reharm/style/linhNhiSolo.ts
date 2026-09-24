import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { parseChordInput } from '../input/chordInputParser'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import type { ParsedChord } from '../types'
import { renderPattern } from './patternRenderer'
import type { PhraseSection } from './phraseSection'
import type { StylePattern, TimelineEvent } from './types'
import { NGUON_SOLO_SR, type NguonSR, type OSR } from './slowRockLinhNhiNguon'

/*
  BỘ SOẠN CÂU SOLO LINH NHI — dạo · giang · kết, cho ĐIỆU ĐANG CHƠI, tách trưởng / thứ.
  Chạy khi chọn màu hợp âm Linh Nhi. Số đo: PianoBrain `linh-nhi-piano.md` mục 13c.

  Phương pháp (Codex, `Reference/PHUONG-PHAP-SOAN-OUTRO.md`): mỗi đoạn lấy MỘT đoạn solo
  thật của Linh Nhi, cùng giọng (trưởng/thứ), cùng loại đoạn; chuyển giọng NGUYÊN KHỐI —
  hoà âm, giai điệu, kỹ thuật tay phải giữ nguyên. Không nắn từng nốt; chỉ được dời cả tay
  phải một quãng tám để vào tầm, không vào được thì báo `unavailableReason`.

  Chọn nguồn: nguồn CÙNG NHỊP với điệu (slow rock cho điệu 6/8 · 12/8, bolero cho 4/4) khớp
  ≥ nửa vốn hợp âm bài đứng trước; không có thì nguồn khớp vốn bài nhất — số đo md: 16/20 đoạn
  solo của chị chỉ dùng bậc có sẵn trong bài. Xoay theo `take` trong nhóm được chọn.

  ĐỔI NHỊP khi nguồn khác nhịp điệu — BIÊN SOẠN, không phải số đo:
    · bolero 4/4 → 12/8: phách giữ chỗ, móc đơn thẳng thành dài–ngắn chùm ba (`chumBa`);
    · slow rock 12/8 → 4/4: một ô 12/8 thành một ô 4/4, giữ nguyên chùm ba (không mất gì).
  Nguồn cùng nhịp thì lấy cả tay trái của chị; nguồn đổi nhịp thì tay trái theo mẫu của điệu.
  Linh Nhi không có sheet slow rock trưởng nào: điệu 6/8 giọng trưởng luôn đi đường đổi nhịp.
*/

type Doan = 'intro' | 'interlude' | 'outro'
type Go = readonly [number, number, readonly number[]]
type Nhip = { kep: boolean; o: number }

const VELO_PHAI = 76
const VELO_TRAI = 62

const nhom = (quang: readonly number[]): string => {
  const q = new Set(quang.map((x) => ((x % 12) + 12) % 12))
  if (q.has(3) && q.has(6) && !q.has(7)) return 'dim'
  if (q.has(3)) return 'm'
  if (q.has(4) && q.has(10)) return '7'
  if (q.has(4)) return 'M'
  return 'sus'
}

/** Chất trong bảng nguồn → nhóm, cùng thang với `nhom`. */
const nhomHau = (hau: string): string => {
  if (/m7\(?b5|dim|°/.test(hau)) return 'dim'
  if (/^m(?!aj)/.test(hau)) return 'm'
  if (/^(7|9|13|11)/.test(hau)) return '7'
  if (/sus/.test(hau)) return 'sus'
  return 'M'
}

/** Hậu tố nguồn → hậu tố bộ đọc hợp âm của app hiểu. */
const hauApp = (hau: string) =>
  hau === 'm7(b5)' ? 'm7b5' : hau === 'sus' ? 'sus4' : hau === 'mMaj7' ? 'm(maj7)' : hau

const dungDauGiang = (tonic: PitchClass, thu: boolean) =>
  (thu ? [2, 7, 0, 5, 10, 3] : [5, 10, 3, 8, 1, 6]).includes(tonic) ? 'flat' : 'sharp'

/** Móc đơn thẳng của ô 4/4 → vị trí trong ô 12/8, tính bằng nốt đen (ô 12/8 dài 6). */
export function chumBa(p: number): number {
  const b = Math.floor(p + 1e-6)
  const f = p - b
  const m =
    f < 0.01 ? 0
    : Math.abs(f - 0.25) < 0.01 || Math.abs(f - 1 / 3) < 0.02 ? 0.5
    : Math.abs(f - 0.5) < 0.01 || Math.abs(f - 2 / 3) < 0.02 ? 1
    : Math.abs(f - 0.75) < 0.01 ? 1.25
    : Math.min(1.4, f * 2)
  return b * 1.5 + m
}

/**
 * Nhịp của điệu: `kep` = nhịp kép (6/8, 12/8), `o` = một ô 6 móc đơn dài mấy nốt đen trong
 * điệu. `null` = nhịp chưa có nguồn Linh Nhi (3/4, 2/4…).
 */
export function nhipCuaDieu(style: StylePattern): Nhip | null {
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  if (style.timeSignature.endsWith('/8')) return { kep: true, o: bar / Math.max(1, style.beatsPerMeasure / 6) }
  if (style.beatsPerMeasure === 4 && Math.abs(bar - 4) < 1e-6) return { kep: false, o: 4 }
  return null
}

const cungNhip = (src: NguonSR, nhip: Nhip) => (src.dieu === 'slow rock') === nhip.kep

/** Mốc của nguồn → mốc trong điệu (nốt đen từ đầu đoạn), và độ dài cả đoạn. */
function trucThoiGian(src: NguonSR, nhip: Nhip): { t: (i: number, p: number) => number; dai: number } {
  const dau: number[] = []
  let tong = 0
  for (const o of src.o) { dau.push(tong); tong += o.d }
  if (src.dieu === 'slow rock') {
    // Ô nguồn 3 nốt đen = 6 móc đơn chùm ba.
    const k = nhip.kep ? nhip.o / 3 : 2 / 3
    return { t: (i, p) => (dau[i]! + p) * k, dai: tong * k }
  }
  if (!nhip.kep) return { t: (i, p) => dau[i]! + p, dai: tong }
  const k = nhip.o / 3
  return { t: (i, p) => (dau[i]! * 1.5 + chumBa(p)) * k, dai: tong * 1.5 * k }
}

const vonBai = (tonic: PitchClass, chords: readonly ParsedChord[]) =>
  new Set(chords.map((c) => `${((c.root - tonic) % 12 + 12) % 12}${nhom(c.quality.intervals)}`))

const vonNguon = (src: NguonSR) =>
  new Set(src.o.flatMap((o) => o.h.map((x) => `${x[1]}${nhomHau(x[2])}`)))

/** Các nguồn dùng được cho bài này, khớp vốn nhất đứng trước. */
export function nguonChoBai(doan: Doan, thu: boolean, tonic: PitchClass,
  songChords: readonly ParsedChord[]): { src: NguonSR; khop: number }[] {
  const bai = vonBai(tonic, songChords)
  return NGUON_SOLO_SR
    .filter((s) => s.thu === thu && s.doan === doan)
    .map((src) => {
      const von = [...vonNguon(src)]
      const khop = bai.size === 0 || von.length === 0 ? 0 : von.filter((v) => bai.has(v)).length / von.length
      return { src, khop }
    })
    .sort((a, b) => b.khop - a.khop
      || (a.src.dieu === 'slow rock' ? 0 : 1) - (b.src.dieu === 'slow rock' ? 0 : 1)
      || a.src.id.localeCompare(b.src.id))
}

export function linhNhiSolo(options: {
  kind: Doan
  key: { tonic: PitchClass; scale: 'major' | 'minor' | string }
  style: StylePattern
  songChords?: readonly ParsedChord[]
  take?: number
  range?: { low: MidiNote; high: MidiNote }
}): PhraseSection {
  const { kind, key, style } = options
  const thu = key.scale === 'minor'
  const rong = (unavailableReason: string): PhraseSection =>
    ({ events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason })
  const nhip = nhipCuaDieu(style)
  if (!nhip) return rong(`Chưa có câu solo Linh Nhi cho nhịp ${style.timeSignature} — chị chỉ có sheet 4/4 và 6/8.`)
  const ungVien = nguonChoBai(kind, thu, key.tonic, options.songChords ?? [])
  if (ungVien.length === 0) return rong(`Chưa có đoạn solo ${thu ? 'thứ' : 'trưởng'} nào của Linh Nhi cho loại đoạn này.`)
  const goc = ungVien.filter((u) => cungNhip(u.src, nhip) && u.khop >= 0.5)
  const tot = goc.length > 0 ? goc : ungVien.filter((u) => u.khop >= ungVien[0]!.khop - 1e-9)
  const { src } = tot[(((options.take ?? 0) % tot.length) + tot.length) % tot.length]!

  const { t, dai } = trucThoiGian(src, nhip)
  const oDieu = style.beatsPerMeasure * (style.gridUnit ?? 1)
  const lengthBeats = Math.ceil(dai / oDieu - 1e-6) * oDieu
  const doiGiong = ((((key.tonic - src.chuGoc) % 12) + 18) % 12) - 6
  const moc = 60 + src.chuGoc + doiGiong
  const dau = dungDauGiang(key.tonic, thu)
  const ten = (rel: number) => pitchClassName(((key.tonic + rel) % 12 + 12) % 12 as PitchClass, dau)
  const kyHieu = (h: OSR['h'][number]) =>
    `${ten(h[1])}${hauApp(h[2])}${h[3] === null ? '' : `/${ten(h[3])}`}`

  // Vòng hợp âm: ô chưa có ký hiệu mang hợp âm đang vang (ô đầu: hợp âm đầu tiên của đoạn).
  const moc0 = src.o.flatMap((o, i) => o.h.map((h) => [t(i, h[0]), kyHieu(h)] as const))
  if (moc0.length === 0) return rong(`Nguồn ${src.bai} không có hợp âm.`)
  const chords: string[] = []
  const tu: number[] = []
  for (const [at, sym] of [[0, moc0[0]![1]] as const, ...moc0]) {
    if (chords[chords.length - 1] === sym) continue
    if (tu.length > 0 && Math.abs(tu[tu.length - 1]! - at) < 1e-6) { chords[chords.length - 1] = sym; continue }
    chords.push(sym)
    tu.push(at)
  }
  const beatsEach = tu.map((a, i) => (i + 1 < tu.length ? tu[i + 1]! : lengthBeats) - a)
  const parsed = parseChordInput(chords.join(' ')).chords
  if (parsed.length !== chords.length) return rong(`Không đọc được vòng hợp âm của ${src.bai}: ${chords.join(' ')}`)

  const dat = (i: number, g: Go) => {
    const a = t(i, g[0])
    return { at: a, dur: Math.max(0.2, t(i, g[0] + g[1]) - a), notes: g[2].map((n) => n + moc) }
  }
  // Tay phải: chuyển giọng nguyên khối; chỉ được dời cả khối một quãng tám cho vào tầm.
  const phai = src.o.flatMap((o, i) => o.r.map((g) => dat(i, g)))
  const range = options.range ?? { low: 21 as MidiNote, high: 108 as MidiNote }
  const tat = phai.flatMap((e) => e.notes)
  const lech = [0, -12, 12].find((d) => tat.every((n) => n + d >= range.low && n + d <= range.high))
  if (lech === undefined) {
    return rong(`Câu ${src.bai} (${src.doan}) không lọt tầm ${range.low}–${range.high} ở giọng này, kể cả khi dời một quãng tám. Không nắn nốt.`)
  }
  const events: TimelineEvent[] = phai.map((e) => ({
    notes: e.notes.map((n) => (n + lech) as MidiNote), startBeat: e.at, durationBeats: e.dur,
    hand: 'right', velocity: VELO_PHAI,
  }))
  const cung = cungNhip(src, nhip)
  if (cung) {
    src.o.forEach((o, i) => o.l.forEach((g) => {
      const e = dat(i, g)
      events.push({ notes: e.notes as MidiNote[], startBeat: e.at, durationBeats: e.dur, hand: 'left', velocity: VELO_TRAI })
    }))
  } else {
    const trai = renderPattern(voiceLeadTwoHands(parsed), style, { beatsPerChord: oDieu, beatsEach })
    events.push(...trai.filter((e) => e.hand === 'left'))
  }
  events.sort((a, b) => a.startBeat - b.startBeat)

  return {
    events,
    lengthBeats,
    chords,
    beatsEach,
    sourcePhrase: { id: src.id, fromBar: 1, barCount: src.o.length, song: src.bai,
      method: cung ? 'full-sheet' : 'source-variation' },
    adaptationNote: cung
      ? `Chuyển giọng nguyên khối đoạn ${src.doan} ${src.bai} (hai tay).`
      : `Đoạn ${src.doan} ${src.dieu} ${src.bai} đổi sang ${nhip.kep ? '12/8: móc đơn thẳng thành dài–ngắn chùm ba' : '4/4: giữ chùm ba'}, tay trái theo mẫu của điệu — biên soạn, chưa có sheet ${src.dieu === 'slow rock' ? 'bolero' : 'slow rock'} ${thu ? 'thứ' : 'trưởng'} tương ứng.`,
  }
}
