import type { TuyenSolo } from './tuyenSolo'
import { TUYEN_SOLO } from './tuyenSolo'
import { parseChordInput } from '../input/chordInputParser'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/** Một kế hoạch dùng CHUNG cho hoà âm và giai điệu, không chọn nguồn hai lần. */
export interface MinorOutroPlan {
  sourceId: string
  fromBar: number
  bars: TuyenSolo['o']
  chords: ParsedChord[]
  beatsEach: number[]
  pitchBase: number
  /** Có mặt khi phát triển mô-típ, không phải chép một lát ô nguồn. */
  method?: 'motif-development'
  /** Đường hòa âm KT chuyển soạn; nguồn mô-típ đi cùng sourceId, không chọn riêng. */
  harmonyId?: string
}

/**
 * Phát triển đường nối từ nốt mô-típ tới nốt đầu ô kế, không dán run lạ lên câu.
 * Học kỹ thuật ở Cà Pháo / Người Hãy Quên Em Đi, ô 47→48: móc kép, rải xen
 * bước liền và chromatic áp sát đích. Không chép cao độ hay cell bossa vào Tuấn.
 * Tìm cả đường trước khi phát, không gập nốt/đảo chiều vì đụng trần giữa chừng.
 */
function interludeRun(start: number, end: number, count: number, from: number,
  chord: ParsedChord, tonic: number, range: { low: number; high: number }, take: number,
): number[] | undefined {
  const pc = (n: number) => ((n % 12) + 12) % 12
  const tones = new Set(chord.quality.intervals.map((n) => pc(chord.root + n)))
  const dominant = pc(chord.root - tonic) === 7 && chord.quality.intervals.includes(4)
  const scale = new Set((dominant ? [0, 2, 3, 5, 7, 8, 11] : [0, 2, 3, 5, 7, 8, 10])
    .map((n) => pc(tonic + n)))
  const pitches = Array.from({ length: Math.max(0, range.high - range.low + 1) }, (_, n) => range.low + n)
  const crest = take % 2 === 0 ? Math.min(range.high, Math.max(start, end) + 5)
    : Math.max(range.low, Math.min(start, end) - 5)
  let paths = [{ notes: [start], score: 0 }]
  for (let step = 1; step < count; step += 1) {
    const last = step === count - 1
    const phase = step / (count - 1)
    const ideal = phase < 0.5 ? start + (crest - start) * phase * 2
      : crest + (end - crest) * (phase - 0.5) * 2
    const choices = last ? [end] : pitches
    const next: typeof paths = []
    for (const path of paths) {
      const previous = path.notes.at(-1)!
      for (const note of choices) {
        const distance = Math.abs(note - previous)
        const stable = last || tones.has(pc(note))
        const previousStable = tones.has(pc(previous))
        const chromaticApproach = step === count - 2 && Math.abs(note - end) === 1
        if (note < range.low || note > range.high || !distance || distance > 7) continue
        if (!last && !scale.has(pc(note)) && !tones.has(pc(note)) && !chromaticApproach) continue
        if (Number.isInteger(from + step * 0.25) && !stable) continue
        // Nốt ngoài hợp âm ngắn phải giải bằng bước hẹp ngay sau đó.
        if ((!stable || !previousStable) && distance > 2) continue
        if (!previousStable && !stable) continue
        const oldDirection = path.notes.length > 1 ? Math.sign(previous - path.notes.at(-2)!) : 0
        const turn = oldDirection && oldDirection !== Math.sign(note - previous)
        next.push({ notes: [...path.notes, note], score: path.score +
          Math.abs(note - ideal) * 0.18 + Math.max(0, distance - 2) * 0.35 +
          (turn ? 0.6 : 0) + path.notes.slice(-4).filter((p) => p === note).length * 0.8 })
      }
    }
    // ponytail: beam 32 cho cửa sổ tối đa 13 nốt; không giải tối ưu toàn bài.
    paths = next.sort((a, b) => a.score - b.score).slice(0, 32)
    if (!paths.length) return undefined
  }
  return paths[0]?.notes
}

/**
 * Giang tấu thứ Tuấn: mỗi câu chọn một nguồn hòa âm + mô-típ, không ghép từng ô.
 * Hoa Phượng ô 38 nửa sau: 5–1–3–#4–5 trên VI, móc đơn, lặp hai lần.
 * Rút vai trò 5–1–3 + nốt nối về 5; KT tự phát triển thành tám ô.
 * Nhịp giai điệu được giãn/thu và có nghỉ, KHÔNG ép lên các cú Pắp của đệm.
 * Đường Đừng Xa học chuỗi hòa âm ô 1–6 và mô-típ 5–3–1 ở ô đầu cùng nguồn.
 * ponytail: hai nguồn Linh Nhi/Bolero đã đối chiếu XML; chưa học tự động mọi sheet.
 */
export function planMinorInterlude(options: {
  tonic: PitchClass
  take: number
  range: { low: number; high: number }
  songChords: readonly ParsedChord[]
  opening: ParsedChord | null
}): MinorOutroPlan | undefined {
  const pc = (n: number) => ((n % 12) + 12) % 12
  const requestedTake = Math.max(0, Math.floor(options.take))
  const chord = (degree: number, quality: string) =>
    parseChordInput(pitchClassName(pc(options.tonic + degree) as PitchClass) + quality).chords[0]!
  const sameFunction = (s: ParsedChord, c: ParsedChord) => s.root === c.root &&
    c.quality.intervals.slice(0, 3).every((n) => s.quality.intervals.includes(n))
  // Giữ add2/add9/m9 mà bài đã chọn khi chứa đúng bộ ba, không tự tẩy màu.
  const fromPalette = (c: ParsedChord) => options.songChords.find((s) => sameFunction(s, c)) ?? c
  const i = fromPalette(chord(0, 'm')), iv = fromPalette(chord(5, 'm')),
    vi = fromPalette(chord(8, '')), v = chord(7, '7')
  const available = (c: ParsedChord) => !options.songChords.length || options.songChords.some((s) =>
    sameFunction(s, c) || (c.root === v.root && s.root === v.root &&
      s.quality.intervals.includes(5) && s.quality.intervals.includes(7) &&
      s.quality.intervals.includes(10) && !s.quality.intervals.includes(3)))
  // V treo của phần hát được giải thành V7 trong solo; không biến v thứ thành V.
  if (![i, iv, v].every(available)) return undefined
  // Rút gọn màu VI nếu vốn bài thiếu nó: kéo dài iv, không đổi VI sang "bậc gần nhất".
  // Đây là vòng KT tự soạn theo chức năng, KHÔNG khai là vòng chép nguyên sheet.
  const target = options.opening
  const returnChord = target
    ? parseChordInput(pitchClassName(pc(target.root + 7) as PitchClass) + '7').chords[0]!
    : i
  const hoa = TUYEN_SOLO.find((s) => s.id === 'noi-buon-hoa-phuong-interlude')
  const dung = TUYEN_SOLO.find((s) => s.id === 'dung-xa-em-dem-nay-intro')
  // Chọn NGUYÊN đường + mô-típ cùng nguồn, trước khi dựng một nốt nào.
  // Hoa Phượng: mở rộng i–iv–VI–V–i ở ô 37–41 thành tám ô Tuấn; hai cách phân câu.
  // Đừng Xa: giữ chuỗi ô 1–6 i–VII–VI–III–iv–i; hai ô cuối là KT nối cadence,
  // không khai là chép ô 7 có ii°/V hoặc lấy giai điệu Hoa Phượng đắp lên vòng này.
  const routes = [
    { id: 'hoa-phuong-reprise', source: hoa, fromBar: 3, seed: hoa?.o4?.[3],
      chords: [i, i, iv, available(vi) ? vi : iv, iv, v, i, returnChord] },
    { id: 'hoa-phuong-cadence', source: hoa, fromBar: 3, seed: hoa?.o4?.[3],
      chords: [i, iv, vi, vi, v, v, i, returnChord] },
    { id: 'dung-xa-descent', source: dung, fromBar: 0, seed: dung?.o[0],
      chords: [i, fromPalette(chord(10, '')), vi, fromPalette(chord(3, '')), iv, i, v, returnChord] },
  ].filter((r) => r.source?.thay === 'linh-nhi' && r.source.dieu === 'bolero' && r.source.thu &&
    r.seed && r.chords.slice(0, -1).every(available))
  if (!routes.length) return undefined
  const route = routes[requestedTake % routes.length]!
  const { source, seed, chords } = route
  if (!source || !seed || seed.bac === null) return undefined
  // Chỉ học ba vai trò ổn định theo thứ tự nguồn; bỏ nốt lặp/tension khi rút mô-típ.
  const triad = [0, seed.chat === 'm' ? 3 : 4, 7]
  const roles = [...new Set(seed.n.map((n) => triad.indexOf(pc(n[1] - seed.bac!)))
    .filter((role) => role >= 0))].slice(0, 3)
  if (roles.length !== 3) return undefined
  const pulse = seed.n.slice(0, 4).map((n) => n[0])
  // Xoay hết vòng phù hợp rồi tiến biến thể, tránh khóa mỗi nguồn vào một kiểu nốt.
  const take = Math.floor(requestedTake / routes.length)
  const rotation = take % roles.length
  const rotated = [...roles.slice(rotation), ...roles.slice(0, rotation)]
  // ponytail: 48 biến thể mỗi đường hòa âm, vẫn là tập hữu hạn đang chờ nghe duyệt.
  const motif = Math.floor(take / 24) % 2 ? rotated.slice().reverse() : rotated
  const phrasing = Math.floor(take / 6) % 4
  const bars: TuyenSolo['o'][number][] = []
  let previous: number | undefined
  for (let bar = 0; bar < chords.length; bar += 1) {
    const c = chords[bar]!
    const intervals = [0, c.quality.intervals.includes(3) ? 3 : 4, 7]
    const stable = motif.map((role) => intervals[role]!)
    // Ở ô dẫn về hợp âm kế, dùng gam của đích để không kéo sai dấu hoá.
    const localTonic = bar === 7 && target ? target.root : options.tonic
    const localMinor = bar === 7 && target ? target.quality.intervals.includes(3) : true
    const scale = (localMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11])
      .map((n) => pc(localTonic + n))
    // Nốt nối áp sát nốt đầu của lần nhắc lại, giải quyết ngay trong cùng ô.
    const from = stable[2]!, to = stable[0]!
    const direction = Math.sign(to - from) || 1
    const approach = [to - direction, to - 2 * direction]
      .find((n) => scale.includes(pc(c.root + n))) ?? to
    const cell = [...stable, approach]
    let rhythm: number[], tones: number[]
    if (bar === 0 || bar === 4) {
      const upbeat = bar === 4 && Math.floor(take / 3) % 2 === 1 ? 0.5 : 0
      // Cùng ba vai trò, đổi cách nói: đều / ngắn–dài / lấy đà / đảo phách.
      const openings = [pulse.slice(0, 3).map((at) => at * 2), [0, 0.5, 2],
        [0.5, 1.5, 2.5], [0, 1.5, 2.5]]
      rhythm = openings[phrasing]!.map((at) => at + upbeat)
      tones = stable
    } else if (bar === 3) {
      rhythm = [pulse.map((at) => at * 2), [0, 0.5, 2, 3],
        [0.5, 1, 2, 3], [0, 1.5, 2, 3]][phrasing]!
      tones = [...stable, stable[0]!]
    } else if (bar === 7) {
      rhythm = [...pulse, 2]
      // V/đích: nốt 3 là âm dẫn, chờ giải vào phần hát. Hết bài thì đậu chủ âm.
      tones = [...cell, target ? 4 : 0]
      // Nốt nối thứ tư phải giải về nốt chốt, không hướng về mô-típ đã ngừng.
      tones[3] = target ? 5 : 2
    } else {
      rhythm = [...pulse, ...pulse.map((at) => at + 2)]
      tones = [...cell, ...stable, stable[0]!]
    }
    // Chọn quãng tám cho TOÀN mô-típ trước khi phát; không gập từng nốt.
    const roots = Array.from({ length: 9 }, (_, octave) => c.root + octave * 12)
      .filter((root) => tones.every((n) => root + n >= options.range.low && root + n <= options.range.high))
      .sort((a, b) => {
        const anchor = previous ?? (options.range.low + options.range.high) / 2
        return Math.abs(a + tones[0]! - anchor) - Math.abs(b + tones[0]! - anchor)
      })
    const root = roots[0]
    if (root === undefined) return undefined
    const end = bar === 7 || bar === 0 || bar === 4 ? 3.25 : 3.85
    const notes: TuyenSolo['o'][number]['n'] = rhythm.map((at, n) => [
      at, root + tones[n]!, Math.max(0.1, Math.min((rhythm[n + 1] ?? end) - at, 1.25)),
    ])
    previous = notes.at(-1)![1]
    bars.push({ bac: pc(c.root - options.tonic), chat: c.quality.intervals.includes(3) ? 'm' : c.quality.intervals.includes(10) ? '7' : '',
      bac2: null, chia: null, n: notes })
  }
  // Hai cửa sổ phát triển ngay trong bản thiết kế giai điệu: ô 3 (vừa), ô 6 (dài).
  // Nốt đáp là nốt đầu ô tiếp theo ĐÃ soạn, nên không sửa hoà âm/mô-típ để ép run.
  for (const [bar, from] of [[2, 2], [5, 1]] as const) {
    const original = bars[bar]!.n
    const start = original.find((n) => n[0] === from)?.[1]
    const end = bars[bar + 1]!.n[0]![1]
    if (start === undefined) return undefined
    const count = (4 - from) * 4 + 1
    const run = interludeRun(start, end, count, from, chords[bar]!, options.tonic, options.range, take)
    if (!run) return undefined
    bars[bar] = { ...bars[bar]!, n: [
      ...original.filter((n) => n[0] < from).map(([at, pitch, duration]) =>
        [at, pitch, Math.min(duration, from - at)] as const),
      // Điểm cuối trùng nốt đầu ô kế: chỉ giữ một lần đánh, không gõ đôi ở vạch.
      ...run.slice(0, -1).map((pitch, n) => [from + n * 0.25, pitch, 0.25] as const),
    ] }
  }
  return { sourceId: source.id, fromBar: route.fromBar, harmonyId: route.id, bars, chords, beatsEach: chords.map(() => 4),
    pitchBase: 0, method: 'motif-development' }
}

/**
 * Vòng kiểm chứng outro: lấy một tiểu cú liên tiếp đã về i, không quay vòng nguồn.
 * Đây là chuyển soạn một câu nguồn, CHƯA phải bộ sáng tác tổng quát.
 * Giữ nghỉ, thứ tự nốt và chia nhỏ phách; chỉ dịch quãng tám cả tiểu cú.
 */
export function planMinorOutro(options: {
  tonic: PitchClass
  take: number
  range: { low: number; high: number }
  songChords: readonly ParsedChord[]
}): MinorOutroPlan | undefined {
  const plans: MinorOutroPlan[] = []
  for (const source of TUYEN_SOLO) {
    if (!source.thu || source.thay !== 'linh-nhi' || source.dieu !== 'bolero' || source.doan !== 'outro') continue
    // Đừng Xa ô 82 dài 6 phách nhưng bảng o khai 4 và cắt nốt; Edim còn mất b5.
    // Không dùng bảng này làm chuẩn trước khi sửa bộ trích xuất (không sửa PianoBrain).
    if (source.id === 'dung-xa-em-dem-nay-outro') continue
    const bars = source.o4 ?? (source.phach === 4 ? source.o : [])
    for (let end = 3; end <= bars.length; end += 1) {
      const last = bars[end - 1]!
      const lastNote = last.n.at(-1)
      if (last.bac !== 0 || last.chat !== 'm' || last.bac2 !== null || !lastNote) continue
      if (![0, 3, 7].includes(((lastNote[1] % 12) + 12) % 12)) continue
      for (let start = Math.max(0, end - 8); start <= end - 3; start += 1) {
        const phrase = bars.slice(start, end)
        // Không bắt đầu giữa khoảng ngân của tiểu cú trước.
        if (!phrase[0]!.n.length || phrase[0]!.n[0]![0] > 0.5) continue
        const chords: ParsedChord[] = []
        const beatsEach: number[] = []
        let compatible = true
        const add = (degree: number | null, quality: string | undefined, beats: number) => {
          if (degree === null || quality === undefined || beats <= 0) { compatible = false; return }
          const root = ((options.tonic + degree) % 12) as PitchClass
          const chord = parseChordInput(pitchClassName(root) + quality).chords[0]
          if (!chord || (options.songChords.length > 0 && !options.songChords.some((c) =>
            c.root === root && chord.quality.intervals.every((i) => c.quality.intervals.includes(i)) &&
            (quality === 'm' ? !c.quality.intervals.includes(4) : !c.quality.intervals.includes(3)),
          ))) { compatible = false; return }
          chords.push(chord)
          beatsEach.push(beats)
        }
        for (const bar of phrase) {
          const split = bar.bac2 !== null && bar.chia !== null
          add(bar.bac, bar.chat, split ? bar.chia! : 4)
          if (split) {
            // Bảng cũ không ghi chất hợp âm thứ hai. Chỉ nhận khi chính nguồn
            // có đúng một chất cho bậc đó; không đoán trưởng/thứ từ vốn bài đích.
            const qualities = [...new Set(bars.filter((b) => b.bac === bar.bac2).map((b) => b.chat))]
            add(bar.bac2, qualities.length === 1 ? qualities[0] : undefined, 4 - bar.chia!)
          }
        }
        if (!compatible) continue
        const pitches = phrase.flatMap((bar) => bar.n.map((n) => n[1]))
        const low = Math.min(...pitches), high = Math.max(...pitches)
        const bases = Array.from({ length: 9 }, (_, i) => 60 + options.tonic + (i - 4) * 12)
          .filter((base) => low + base >= options.range.low && high + base <= options.range.high)
          .sort((a, b) => Math.abs(a + (low + high) / 2 - (options.range.low + options.range.high) / 2) -
            Math.abs(b + (low + high) / 2 - (options.range.low + options.range.high) / 2))
        if (bases.length) plans.push({ sourceId: source.id, fromBar: start, bars: phrase,
          chords, beatsEach, pitchBase: bases[0]! })
      }
    }
  }
  if (plans.length === 0) return undefined
  return plans[Math.max(0, Math.floor(options.take)) % plans.length]
}

const THAY = ['linh-nhi', 'ca-phao', 'ton-hung'] as const

/**
 * Khoá nguồn của một câu solo: **thầy + điệu + loại đoạn + màu giọng**.
 *
 * `LUAT-SOAN-NOT.md` Luật 14.2 — một lần học và một câu sinh ra phải có khoá
 * `(thầy, điệu nguồn, bài nguồn, loại đoạn)`, không đổi khoá giữa các ô.
 */
export interface KhoaNguon {
  take: number
  thay: (typeof THAY)[number]
  /** Thể loại bản gốc, khớp đúng chữ trong `TUYEN_SOLO.dieu` — ví dụ `'bolero'`. */
  dieu: string
  doan: 'intro' | 'interlude' | 'outro'
  thu: boolean
}

/**
 * Chọn một câu solo **có thật** khớp đủ bốn điều kiện của khoá.
 *
 * ## Vì sao phải lọc `dieu`
 *
 * Trước 10/9/2026 bộ chọn chỉ lọc `thầy + loại đoạn + giọng thứ`. Trong tám đoạn kết của
 * Linh Nhi, **hai đoạn là `slow rock`** — *Lá Thư Trần Thế* và *Một Cõi Đi Về* — mà chúng
 * vẫn lọt vào vòng train Bolero, mang theo cú pháp của một điệu khác.
 *
 * Lọc đủ bốn điều kiện cho `linh-nhi + bolero + outro + thứ` đúng **ba** tuyến: *Đừng Xa Em
 * Đêm Nay* (Rê thứ) · *Rừng Lá Thấp* (La thứ) · *Nỗi Buồn Hoa Phượng* (Rê thứ).
 *
 * ## Không có nguồn thì trả `undefined`, KHÔNG rơi sang thầy khác
 *
 * Rơi ngầm sang thầy hay điệu khác là cách cũ, và nó chính là chỗ câu nhạc mất cú pháp mà
 * không ai thấy — vì sai lệch không bao giờ nổi lên thành lỗi.
 *
 * `take` chỉ xoay **trong tập đã khớp khoá**, không dùng để đổi thầy hay đổi điệu.
 */
export function nguonTheoKhoa(khoa: KhoaNguon): TuyenSolo | undefined {
  const n = Math.max(0, Math.floor(khoa.take))
  const hop = TUYEN_SOLO.filter(
    (t) =>
      t.thay === khoa.thay &&
      t.dieu === khoa.dieu &&
      t.doan === khoa.doan &&
      t.thu === khoa.thu,
  )
  if (hop.length === 0) return undefined
  return hop[n % hop.length]
}

/**
 * Đoạn kết giọng thứ điệu Bolero — vòng train ngày 10/9/2026.
 *
 * Khoá cứng `linh-nhi + bolero`: thầy Tuấn có **0 sheet solo**, và trong vốn đoạn kết giọng
 * thứ chỉ Linh Nhi có đúng điệu Bolero. Cà Pháo đang là bossa nova, Tôn Hùng là ballad —
 * cả hai sai điệu cho vòng này.
 */
export function nguonKetThuBolero(take: number): TuyenSolo | undefined {
  return nguonTheoKhoa({ take, thay: 'linh-nhi', dieu: 'bolero', doan: 'outro', thu: true })
}

/**
 * Đường CŨ cho đoạn dạo và giang tấu — xoay thầy theo lượt, **chưa lọc điệu**.
 *
 * Giữ nguyên vì vòng train 10/9/2026 chỉ nhận sửa đoạn kết giọng thứ điệu Bolero; đổi đường
 * này là đổi cả đoạn dạo, ngoài phạm vi cho phép. Khi tới lượt đoạn dạo thì chuyển nó sang
 * `nguonTheoKhoa` với `dieu` của điệu đang phát.
 */
export function minorSoloSourceForTake(
  take: number,
  doan: 'intro' | 'interlude' | 'outro' = 'intro',
): TuyenSolo | undefined {
  const n = Math.max(0, Math.floor(take))
  const thay = THAY[n % THAY.length]!
  const sources = TUYEN_SOLO.filter((t) => t.thu && t.doan === doan && t.thay === thay)
  if (sources.length === 0) return undefined
  return sources[Math.floor(n / THAY.length) % sources.length]
}

/** Giữ tên cũ cho các chỗ chỉ cần đoạn dạo. */
export function minorIntroSourceForTake(take: number): TuyenSolo | undefined {
  return minorSoloSourceForTake(take, 'intro')
}
