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
  BỘ SOẠN CÂU SOLO SLOW ROCK LINH NHI — dạo · giang · kết, tách giọng trưởng / thứ.

  Phương pháp (Codex, `Reference/PHUONG-PHAP-SOAN-OUTRO.md`): mỗi đoạn lấy MỘT đoạn solo
  thật của Linh Nhi, cùng giọng (trưởng/thứ), cùng loại đoạn; chuyển giọng NGUYÊN KHỐI —
  hoà âm, giai điệu, kỹ thuật tay phải giữ nguyên. Không nắn từng nốt; chỉ được dời cả tay
  phải một quãng tám để vào tầm, không vào được thì báo `unavailableReason`.

  Chọn nguồn: slow rock gốc khớp ≥ nửa vốn hợp âm bài đứng trước; không có thì nguồn khớp
  vốn bài nhất — số đo md Linh Nhi: 16/20 đoạn solo của chị chỉ dùng bậc có sẵn trong đoạn
  hát. Xoay theo `take` trong nhóm được chọn.

  GIỌNG THỨ: Lá Thư Trần Thế và Một Cõi Đi Về — slow rock thật, lấy CẢ HAI TAY.
  GIỌNG TRƯỞNG: Linh Nhi không có sheet slow rock trưởng nào trong kho. Lấy ba bài bolero
  trưởng (Biển Tình, Đường Xưa, Mùa Xuân) — BIÊN SOẠN, không phải số đo:
    · một ô 4/4 thành một ô 12/8 (hai ô 6/8 của điệu): phách giữ nguyên chỗ, móc đơn thẳng
      thành dài–ngắn chùm ba (0,5 → phách thứ ba của chùm), móc kép 0,25 → chùm thứ hai;
    · tay trái dùng mẫu rải của điệu (`style.cell`) trên đúng vòng hợp âm nguồn.
  Bolero thứ (Đừng Xa, Rừng Lá, Nỗi Buồn) cũng vào vốn giọng thứ theo cùng phép ấy, đứng
  sau slow rock gốc khi hoà điểm.
*/

type Doan = 'intro' | 'interlude' | 'outro'
type Go = readonly [number, number, readonly number[]]

/** Ô của điệu = 6 móc đơn chùm ba = 3 nốt đen. */
const O = 3
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

/** Đổi nguồn thành dãy ô 3 nốt đen. Ô slow rock giữ nguyên; ô bolero thành hai ô. */
function oCuaDieu(src: NguonSR): { o: OSR[]; traiNguon: boolean } {
  if (src.oPhach === O) return { o: [...src.o], traiNguon: true }
  const ra: OSR[] = []
  for (const o of src.o) {
    const doi = (g: Go): readonly [number, number, readonly number[]] => {
      const a = chumBa(g[0])
      return [a, Math.max(0.25, chumBa(Math.min(o.d, g[0] + g[1])) - a), g[2]]
    }
    const r = o.r.map(doi)
    const h = o.h.map((x) => [chumBa(x[0]), x[1], x[2], x[3]] as const)
    // Ô L phách thành L/2 ô 6/8: ô 4 phách → 2, ô 6 phách (Đừng Xa kết ô 82) → 3.
    for (let nua = 0; nua < Math.round(o.d / 2); nua += 1) {
      const tu = nua * O
      ra.push({
        d: O,
        h: h.filter((x) => x[0] >= tu - 1e-6 && x[0] < tu + O - 1e-6).map((x) => [x[0] - tu, x[1], x[2], x[3]] as const),
        r: r.filter((x) => x[0] >= tu - 1e-6 && x[0] < tu + O - 1e-6)
          .map((x) => [x[0] - tu, x[1], x[2]] as const),
        l: [],
      })
    }
  }
  return { o: ra, traiNguon: false }
}

const vonBai = (tonic: PitchClass, chords: readonly ParsedChord[]) =>
  new Set(chords.map((c) => `${((c.root - tonic) % 12 + 12) % 12}${nhom(c.quality.intervals)}`))

const vonNguon = (src: NguonSR) =>
  new Set(src.o.flatMap((o) => o.h.map((x) => `${x[1]}${nhomHau(x[2])}`)))

/** Các nguồn dùng được cho bài này, tốt nhất đứng trước. */
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

export function slowRockLinhNhiSolo(options: {
  kind: Doan
  key: { tonic: PitchClass; scale: 'major' | 'minor' | string }
  style: StylePattern
  songChords?: readonly ParsedChord[]
  take?: number
  range?: { low: MidiNote; high: MidiNote }
}): PhraseSection {
  const { kind, key, style } = options
  const thu = key.scale === 'minor'
  const ungVien = nguonChoBai(kind, thu, key.tonic, options.songChords ?? [])
  const rong = (unavailableReason: string): PhraseSection =>
    ({ events: [], lengthBeats: 0, chords: [], beatsEach: [], unavailableReason })
  if (ungVien.length === 0) return rong(`Chưa có đoạn solo ${thu ? 'thứ' : 'trưởng'} nào của Linh Nhi cho loại đoạn này.`)
  /*
    Slow rock gốc đứng trước: nút này là slow rock của chị, bolero chuyển nhịp chỉ để bù chỗ
    thiếu. Nguồn slow rock nào khớp ≥ nửa vốn bài thì chọn trong nhóm ấy (xoay theo take);
    không có thì lấy nguồn khớp nhất trong cả vốn. Giọng trưởng không có slow rock gốc.
  */
  const goc = ungVien.filter((u) => u.src.dieu === 'slow rock' && u.khop >= 0.5)
  const tot = goc.length > 0 ? goc : ungVien.filter((u) => u.khop >= ungVien[0]!.khop - 1e-9)
  const { src } = tot[(((options.take ?? 0) % tot.length) + tot.length) % tot.length]!

  const { o, traiNguon } = oCuaDieu(src)
  const doi = ((((key.tonic - src.chuGoc) % 12) + 18) % 12) - 6
  const moc = 60 + src.chuGoc + doi
  const dau = dungDauGiang(key.tonic, thu)
  const ten = (rel: number) => pitchClassName(((key.tonic + rel) % 12 + 12) % 12 as PitchClass, dau)

  // Hợp âm từng ô; ô chưa có ký hiệu mang hợp âm đang vang (ô đầu: hợp âm đầu tiên của đoạn).
  const dau0 = o.find((x) => x.h.length > 0)?.h[0]
  if (!dau0) return rong(`Nguồn ${src.bai} không có hợp âm.`)
  const kyHieu = (h: OSR['h'][number]) =>
    `${ten(h[1])}${hauApp(h[2])}${h[3] === null ? '' : `/${ten(h[3])}`}`
  const chords: string[] = []
  const beatsEach: number[] = []
  const them = (sym: string, beats: number) => {
    if (beats < 1e-6) return
    if (chords[chords.length - 1] === sym) beatsEach[beatsEach.length - 1]! += beats
    else { chords.push(sym); beatsEach.push(beats) }
  }
  let dangVang = kyHieu(dau0)
  for (const x of o) {
    const moc: [number, string][] = x.h.length === 0 || x.h[0]![0] > 1e-6 ? [[0, dangVang]] : []
    for (const h of x.h) moc.push([h[0], kyHieu(h)])
    moc.forEach(([tu, sym], k) => {
      them(sym, (k + 1 < moc.length ? moc[k + 1]![0] : O) - tu)
      dangVang = sym
    })
  }
  const parsed = parseChordInput(chords.join(' ')).chords
  if (parsed.length !== chords.length) return rong(`Không đọc được vòng hợp âm của ${src.bai}: ${chords.join(' ')}`)

  // Tay phải: chuyển giọng nguyên khối; chỉ được dời cả khối một quãng tám cho vào tầm.
  const phai = o.flatMap((x, i) => x.r.map((g) => ({ at: i * O + g[0], dur: g[1], notes: g[2].map((n) => n + moc) })))
  const range = options.range ?? { low: 57 as MidiNote, high: 95 as MidiNote }
  const tat = phai.flatMap((e) => e.notes)
  const lech = [0, -12, 12].find((d) => tat.every((n) => n + d >= range.low && n + d <= range.high))
  if (lech === undefined) {
    return rong(`Câu ${src.bai} (${src.doan}) không lọt tầm ${range.low}–${range.high} ở giọng này, kể cả khi dời một quãng tám. Không nắn nốt.`)
  }
  const events: TimelineEvent[] = phai.map((e) => ({
    notes: e.notes.map((n) => (n + lech) as MidiNote),
    startBeat: e.at,
    durationBeats: e.dur,
    hand: 'right',
    velocity: VELO_PHAI,
  }))

  if (traiNguon) {
    for (const [i, x] of o.entries()) {
      for (const g of x.l) {
        events.push({ notes: g[2].map((n) => (n + moc) as MidiNote), startBeat: i * O + g[0],
          durationBeats: g[1], hand: 'left', velocity: VELO_TRAI })
      }
    }
  } else {
    const trai = renderPattern(voiceLeadTwoHands(parsed), style, { beatsPerChord: O, beatsEach })
    events.push(...trai.filter((e) => e.hand === 'left'))
  }
  events.sort((a, b) => a.startBeat - b.startBeat)

  return {
    events,
    lengthBeats: o.length * O,
    chords,
    beatsEach,
    sourcePhrase: { id: src.id, fromBar: 1, barCount: src.o.length, song: src.bai,
      method: src.dieu === 'slow rock' ? 'full-sheet' : 'source-variation' },
    adaptationNote: src.dieu === 'slow rock'
      ? `Chuyển giọng nguyên khối đoạn ${src.doan} ${src.bai} (hai tay).`
      : `Đoạn ${src.doan} bolero ${src.bai} chuyển sang 12/8: móc đơn thẳng thành dài–ngắn chùm ba, tay trái theo mẫu rải của điệu — biên soạn, chưa có sheet slow rock ${thu ? 'thứ' : 'trưởng'} tương ứng.`,
  }
}
