import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import { parseChordInput } from '../input/chordInputParser'
import type { ParsedChord } from '../types'
import { hoCuaDieu } from './hoDieu'
import type { PhraseSection } from './phraseSection'
import type { StylePattern, TimelineEvent } from './types'
import type { OSR } from './slowRockLinhNhiNguon'
import { dauGiang, hauApp, nguonChoBai, soanSlowRockLinhNhi } from './soanSlowRockLinhNhi'

export { nguonChoBai }

/*
  CÂU SOLO LINH NHI — dạo · giang · kết cho ĐIỆU ĐANG CHƠI, tách trưởng / thứ. Chạy khi chọn
  màu hợp âm Linh Nhi. Số đo: PianoBrain `linh-nhi-piano.md` mục 13c, 13e.

  Người dùng 24/9/2026: vật liệu chỉ lấy từ sheet CÙNG ĐIỆU — *"đừng lấy những phần từ câu solo
  của điệu khác rồi dồn ép vào"*. Nên:
    · họ Slow Rock → `soanSlowRockLinhNhi` soạn câu mới từ ô slow rock của chị;
    · họ Bolero → một đoạn solo bolero thật, chuyển giọng nguyên khối (phương pháp Codex);
    · họ khác → báo chưa có sheet, không mượn.
  Bỏ (24/9/2026): đổi câu bolero 4/4 sang 12/8 bằng `chumBa` và câu slow rock sang 4/4 — nghe
  "quá tệ". Lùi: commit 71de0c5.
*/

type Doan = 'intro' | 'interlude' | 'outro'
type Nhip = { kep: boolean; o: number }

const VELO_PHAI = 76
const VELO_TRAI = 62

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

/**
 * Điệu họ Slow Rock có soạn câu solo bằng bộ soạn Linh Nhi không: chọn màu Linh Nhi, chọn thầy
 * Linh Nhi cho câu solo, hoặc điệu Slow Rock Lá thư (rút từ sheet của chị) khi chưa chọn thầy nào.
 * Chọn thầy khác thì nhường thầy ấy.
 */
export function slowRockSoanLinhNhi(style: StylePattern, mauLinhNhi: boolean, thay: string | null): boolean {
  return hoCuaDieu(style.id) === 'slow-rock'
    && (mauLinhNhi || thay === 'linh-nhi'
      || (thay == null && ['slow-rock-la-thu', 'slow-rock-lt'].includes(style.family)))
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
  const ho = hoCuaDieu(style.id)
  const nhip = nhipCuaDieu(style)
  if (ho === 'slow-rock' && nhip?.kep) {
    return soanSlowRockLinhNhi({ kind, key, songChords: options.songChords, take: options.take, oDieu: nhip.o })
  }
  if (ho !== 'bolero' || !nhip || nhip.kep) {
    return rong(`Linh Nhi chưa có sheet điệu ${style.name} — câu solo chỉ lấy từ sheet cùng điệu (slow rock, bolero).`)
  }
  const ungVien = nguonChoBai(kind, thu, key.tonic, options.songChords ?? []).filter((u) => u.src.dieu === 'bolero')
  if (ungVien.length === 0) return rong(`Chưa có đoạn solo bolero ${thu ? 'thứ' : 'trưởng'} nào của Linh Nhi cho loại đoạn này.`)
  const tot = ungVien.filter((u) => u.khop >= ungVien[0]!.khop - 1e-9)
  const { src } = tot[(((options.take ?? 0) % tot.length) + tot.length) % tot.length]!

  const dauO: number[] = []
  let dai = 0
  for (const o of src.o) { dauO.push(dai); dai += o.d }
  const t = (i: number, p: number) => dauO[i]! + p
  const lengthBeats = Math.ceil(dai / 4 - 1e-6) * 4
  const doiGiong = ((((key.tonic - src.chuGoc) % 12) + 18) % 12) - 6
  const moc = 60 + src.chuGoc + doiGiong
  const dau = dauGiang(key.tonic, thu)
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
  if (parseChordInput(chords.join(' ')).chords.length !== chords.length) {
    return rong(`Không đọc được vòng hợp âm của ${src.bai}: ${chords.join(' ')}`)
  }

  // Tay phải: chuyển giọng nguyên khối; chỉ được dời cả khối một quãng tám cho vào tầm.
  const range = options.range ?? { low: 21 as MidiNote, high: 108 as MidiNote }
  const tat = src.o.flatMap((o) => o.r.flatMap((g) => g[2].map((n) => n + moc)))
  const lech = [0, -12, 12].find((d) => tat.every((n) => n + d >= range.low && n + d <= range.high))
  if (lech === undefined) {
    return rong(`Câu ${src.bai} (${src.doan}) không lọt tầm ${range.low}–${range.high} ở giọng này, kể cả khi dời một quãng tám. Không nắn nốt.`)
  }
  const events: TimelineEvent[] = []
  src.o.forEach((o, i) => {
    for (const [tay, gs, them, velocity] of [['right', o.r, lech, VELO_PHAI], ['left', o.l, 0, VELO_TRAI]] as const) {
      for (const g of gs) {
        events.push({ notes: g[2].map((n) => (n + moc + them) as MidiNote), startBeat: t(i, g[0]),
          durationBeats: g[1], hand: tay, velocity })
      }
    }
  })
  events.sort((a, b) => a.startBeat - b.startBeat)

  return {
    events,
    lengthBeats,
    chords,
    beatsEach,
    sourcePhrase: { id: src.id, fromBar: 1, barCount: src.o.length, song: src.bai, method: 'full-sheet' },
    adaptationNote: `Chuyển giọng nguyên khối đoạn ${src.doan} ${src.bai} (hai tay).`,
  }
}
