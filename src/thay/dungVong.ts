import type { SongSnapshot } from '../reharm/persistence/songSnapshot'
import { usePracticeStore, type PracticeSong } from '../reharm/playback/practiceStore'
import { getStyle } from '../reharm/style/styleLibrary'
import type { VongBaiTap } from './baiTap'

/**
 * Dựng khung đệm của MỘT điệu trên MỘT vòng hợp âm — nhờ tab Tái hòa âm (luôn gắn ngầm) dựng như mọi bài, rồi mở lại bài
 * người dùng đang làm ở tab ấy. Dùng cho vòng tự tạo ở trang thầy và cho `tools/sinhBaiTap.mjs` (11 bài đóng băng) — một
 * đường dựng, không có bản thứ hai.
 *
 * Các luật cắt (số đo 2/10/2026, `SO-TAY.md` mục "Sinh 11 bài tập điệu"):
 * - Nối thêm một ô (lặp ô đầu) rồi chỉ giữ đúng độ dài vòng: thứ chèn ở cuối đoạn rơi vào ô thừa; ô cuối nối sang đầu vòng.
 * - Twist: hợp âm đưa vào thành MỘT dòng lời ChordPro — không có lời thì Bộ Soạn Blues coi mỗi 16 phách là hết câu
 *   (`chayTwistBlues` → `moc16`) và chèn câu chạy vào ô 4, 8 …
 * - Bossa CP, Bolero Tuấn, Slow Blues, Twist tự chèn dạo · giang · kết: cắt thân vòng bằng `transport.sourceBeat`.
 * - Tắt câu fill ở mọi hợp âm (`mutedFills`) — nút thầy ở tab Tái hòa âm (Linh Nhi bật câu fill/chạy của chị) không nằm
 *   trong ảnh chụp, tắt hết thì khung đệm không phụ thuộc nó. Trừ Slow Blues: tay phải Bộ Soạn Blues CHÍNH LÀ phần đệm.
 */
export interface YeuCauVong {
  styleId: string
  /** Các ô, mỗi ô 1–2 hợp âm, đã ở giọng muốn tập. */
  o: readonly (readonly string[])[]
  /** `'<tonic>:major'` / `'<tonic>:minor'` (vd `'9:minor'` = La thứ); rỗng thì app tự dò giọng. */
  giong: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Chờ tab Tái hòa âm đăng bài thoả `xong` rồi dòng thời gian đứng yên 5 lần đo liền. */
async function choDung(xong: (song: PracticeSong) => boolean): Promise<PracticeSong> {
  let last = ''
  let same = 0
  for (let i = 0; i < 150; i++) {
    await sleep(100)
    const song = usePracticeStore.getState().song
    if (!song || !xong(song)) continue
    const key = `${song.timeline.length}|${JSON.stringify(song.timeline[song.timeline.length - 1])}`
    same = key === last ? same + 1 : 0
    last = key
    if (same >= 5) return song
  }
  throw new Error('Tab Tái hòa âm không dựng xong vòng — thử lại')
}

/* Mỗi lần dựng một vòng — hai lời nhờ chồng nhau thì tab Tái hòa âm chỉ nhận lời sau. */
let hang: Promise<unknown> = Promise.resolve()

export function dungVong(yeuCau: YeuCauVong): Promise<VongBaiTap> {
  const run = hang.then(() => dungMot(yeuCau))
  hang = run.catch(() => undefined)
  return run
}

async function dungMot({ styleId, o, giong }: YeuCauVong): Promise<VongBaiTap> {
  const style = getStyle(styleId)
  if (!style) throw new Error(`Không có điệu ${styleId}`)
  if (o.length === 0) throw new Error('Vòng chưa có hợp âm nào')
  const store = usePracticeStore.getState()
  if (!store.chupBai) throw new Error('Tab Tái hòa âm chưa sẵn sàng — thử lại sau giây lát')

  const cu = store.chupBai()

  const bar = style.beatsPerMeasure
  const chords = o.flat()
  const durations = o.flatMap((one) => one.map(() => bar / one.length))
  const chordsNoi = [...chords, ...o[0]!]
  const durationsNoi = [...durations, ...o[0]!.map(() => bar / o[0]!.length)]
  const doDai = durations.reduce((a, b) => a + b, 0)
  const title = `vong:${styleId}:${Date.now()}`

  const snapshot: SongSnapshot = {
    ...cu.snapshot,
    sourceText: styleId === 'twist' ? chordsNoi.map((c) => `[${c}]la`).join(' ') : chordsNoi.join(' '),
    transpose: 0,
    manualKey: giong,
    sectionMarks: [],
    arrangement: null,
    transitionEdits: {},
    pairedChords: [],
    mutedFills: styleId === 'blue-sun' ? [] : chordsNoi.map((_, i) => i),
    extraFills: [],
    extraRuns: [],
    fillRests: {},
    colorEdits: {},
    slashEdits: {},
    acceptedPassing: [],
    lickyFills: false,
    lickyRuns: false,
    cpLick: false,
    caPhaoFull: false,
    slowRockMotO: true,
    twistSinglePass: true,
    bluesLickSR: false,
    bluesSoan6: false,
    bluesSoan12: false,
    bluesLuot: false,
    styleId,
    beatsPerChord: bar,
    chordDurations: durationsNoi,
    bpm: style.bpm,
    useSlashChords: false,
    varyOnRepeat: false,
    allowJazzColors: false,
    intensity: 'off',
    susDominant: false,
  }

  try {
    usePracticeStore.getState().requestOpen({ snapshot, id: null, title })
    const song = await choDung((one) => one.title === title && one.timeline.length > 0)
    const transport = usePracticeStore.getState().transport
    const total = Math.max(...song.timeline.map((e) => e.startBeat + e.durationBeats))
    let dau = 0
    for (let b = 0; b < total; b += 0.125) {
      const source = transport?.sourceBeat?.(b)
      if (source != null && Math.abs(source) < 1e-6) {
        dau = b
        break
      }
    }
    const timeline = song.timeline
      .filter((e) => e.startBeat >= dau - 1e-6 && e.startBeat < dau + doDai - 1e-6)
      .map((e) => ({ ...e, startBeat: Math.round((e.startBeat - dau) * 1e6) / 1e6 }))
    return {
      // Hợp âm app THẬT SỰ đánh (điệu có thể tô màu riêng — Slow Blues Am7 → Am9).
      hopAm: song.voicings.slice(0, chords.length).map((v) => v.symbol),
      hopAmNhap: chords,
      phach: durations,
      doDai,
      bpm: style.bpm,
      meter: song.meter,
      beatsPerChord: song.beatsPerChord,
      perBeat: song.perBeat,
      timeline,
      voicings: song.voicings,
    }
  } finally {
    // Mở lại bài người dùng đang làm ở tab Tái hòa âm — bài ấy có thể rỗng (chưa dán gì), nên chỉ chờ nó thay bài vòng.
    usePracticeStore.getState().requestOpen(cu)
    await choDung((one) => one.title !== title).catch(() => undefined)
  }
}
