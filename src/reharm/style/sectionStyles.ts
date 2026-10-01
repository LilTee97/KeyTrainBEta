import { laBossaCP } from './styleLibrary/caPhaoBossa'
import { ALL_STYLES, getStyle } from './styleLibrary'
import type { SectionKind } from './songStructure'
import { transitionRunNotes, type TransitionRun } from '../fillSoloGenerator/soloGenerator'
import type { ParsedChord } from '../types'
import type { StylePattern } from './types'

/**
 * Điệu nào có **bản riêng cho đoạn điệp khúc**.
 *
 * Người đệm thật không chơi điệp khúc y như phiên khúc: vào cao trào thì dày
 * lên, rải dồn hơn, bass giật hơn. Trước đây muốn vậy phải tự bấm đổi điệu giữa
 * bài — làm được nhưng không ai làm kịp lúc đang chơi. Bảng này cho phần đệm tự
 * đổi khi chạy qua ranh giới đoạn.
 *
 * Chỉ **hai** thứ được đổi: id điệu và ô nhịp lấy từ nó. Câu fill, hợp âm lướt,
 * tái hòa âm của anh Khá và mọi thứ bộ não đưa vào đều chạy nguyên như cũ — đổi
 * điệu không được kéo theo đổi cách phối.
 *
 * Điệu không có tên trong bảng thì giữ nguyên cả bài, kể cả ở điệp khúc. Không
 * có bản điệp khúc mà tự ghép bừa một điệu khác vào là đổi bài của người ta.
 */
export const CHORUS_PAIRS: Readonly<Record<string, string>> = {
  'ca-phao-ballad-co-em-cho': 'ca-phao-ballad-co-em-cho-chorus',
  'ca-phao-ballad-de-em-roi-xa': 'ca-phao-ballad-de-em-roi-xa-chorus',
  'slow-rock-la-thu-hai-tay': 'slow-rock-la-thu-hai-tay-chorus',
  // Slow Blues (id `blue-sun`, The House of the Rising Sun): tay trái lo trọn đệm; điệp thêm quãng tám ở bass phách 1.
  'blue-sun': 'blue-sun-chorus',
  /*
    Bolero rải: vòm thấp cho phiên khúc, vòm cao cho điệp khúc.

    ĐÂY LÀ LỰA CHỌN KHI DỰNG, KHÔNG PHẢI SỐ ĐO. Đếm trên bản ký âm gốc thì vòm
    thấp thắng ở MỌI đoạn — dạo đầu 5/2, phiên khúc 10/5, điệp khúc 12/6, giang
    tấu 8/1. Vòm cao không phải dấu hiệu đoạn nào cả.

    Cái thật sự gọi vòm cao ra là HOÀ ÂM: 12 trên 19 ô vòm cao rơi vào hợp âm
    Rê, tức chủ âm của bài, còn vòm thấp thì dồn vào Fa thăng thứ và Si thứ.
    Người soạn mở rộng tay trái đúng chỗ hoà âm vững nhất. Không phải chuyện
    tầm tay: nốt gốc trung bình của hai vòm gần như nhau, 39,4 so với 42,1.

    Ghép theo đoạn ở đây là để người dùng phối hai kiểu bolero trong một bài —
    việc nhạc công vẫn làm, và người dùng đã yêu cầu. Nhưng nó là ý người dùng
    chứ không phải thói quen đo được của người soạn, nên ghi rõ ra.
  */
  'bolero-linh-nhi-2': 'bolero-linh-nhi-2-chorus',
  'ton-hung-ballad': 'ton-hung-ballad-chorus',
}

/**
 * Điệu nào **mở vòm rộng trên CHỦ ÂM** — đổi theo hoà âm, không theo đoạn.
 *
 * Hai phép đổi trong file này khác hẳn nhau về bản chất, và trộn chúng là mất
 * đúng chỗ đáng học:
 *
 * - `CHORUS_PAIRS` đổi theo ĐOẠN. Đó là quyết định phối khí của người dùng:
 *   phiên khúc chơi kiểu này, điệp khúc chơi kiểu kia. Nhạc công vẫn làm vậy.
 * - Bảng này đổi theo HOÀ ÂM. Đó là thói quen ĐO ĐƯỢC của người soạn.
 *
 * Số đo trên bản ký âm Linh Nhi, 70 ô có tay trái: 12 trên 19 ô dùng vòm cao
 * rơi vào hợp âm Rê — chủ âm của bài. Vòm thấp thì dồn vào Fa thăng thứ (13 ô)
 * và Si thứ (11 ô). Không phải chuyện tầm tay: nốt gốc trung bình của hai vòm
 * gần như nhau, 39,4 so với 42,1.
 *
 * Và đếm theo ĐOẠN thì vòm thấp thắng ở mọi đoạn — dạo đầu 5/2, phiên khúc
 * 10/5, điệp khúc 12/6, giang tấu 8/1. Nên phép đổi theo đoạn KHÔNG phải thứ
 * người soạn làm; nó là thứ người dùng muốn. Giữ cả hai, ghi rõ cái nào là gì.
 */
const TONIC_PAIRS: Readonly<Record<string, string>> = {
  'bolero-linh-nhi-2': 'bolero-linh-nhi-2-chorus',
}

/** Điệu này có mở vòm theo chủ âm không. */
export function hasTonicVariant(styleId: string): boolean {
  return canonical(styleId) in TONIC_PAIRS
}

/**
 * Điệu nên dùng cho MỘT hợp âm, theo thói quen của người soạn.
 *
 * Hợp âm đang vang là chủ âm thì mở vòm rộng, không thì giữ vòm thấp. Điệu
 * không có trong `TONIC_PAIRS` thì trả về chính nó — không đổi gì.
 */
export function resolveStyleForChord(
  styleId: string,
  chordRoot: number,
  tonic: number,
): string {
  const id = canonical(styleId)
  const goc = TONIC_PAIRS[id]
  if (!goc) return id
  return ((chordRoot % 12) + 12) % 12 === ((tonic % 12) + 12) % 12 ? goc : id
}

/** Bản điệp khúc trỏ ngược về bản phiên khúc, để rời điệp khúc thì quay lại. */
const VERSE_OF: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(CHORUS_PAIRS).map(([verse, chorus]) => [chorus, verse]),
)

/** Hidden section buttons still supply the internal cell of a visible style. */
export function getSectionPlaybackStyle(styleId: string) {
  return getStyle(styleId) ?? (styleId in VERSE_OF
    ? ALL_STYLES.find(style => style.id === styleId) : undefined)
}

/** Tên chính thức của điệu: alias (`ballad`, `hai-pop-ballad-1`…) quy về một mối. */
function canonical(styleId: string): string {
  return getStyle(styleId)?.id ?? styleId
}

/** Điệu này có bản điệp khúc riêng không — dùng để bày ghi chú trên giao diện. */
export function hasChorusVariant(styleId: string): boolean {
  const id = canonical(styleId)
  return id in CHORUS_PAIRS || id in VERSE_OF
}

/** Chỗ đệm im nhường câu chạy ở mốc chuyển đoạn. */
export function transitionMuteWindows(
  spans: readonly { start: number; beats: number; chord?: ParsedChord }[],
  transitions: ReadonlyMap<number, TransitionRun>,
): { from: number; to: number }[] {
  const windows: { from: number; to: number }[] = []
  for (const [main, run] of transitions) {
    const span = spans[main]
    if (!span || run.octaves <= 0) continue
    // Đệm tới đúng lúc câu chạy vào (xem `transitionRunNotes`), không tới `delay` rồi bỏ lặng.
    const dau = span.chord ? transitionRunNotes(span.chord, run, span.start, span.beats)[0]?.startBeat : undefined
    const from = dau ?? span.start + (run.delayBeats ?? 0)
    const to = span.start + span.beats
    if (from < to) windows.push({ from, to })
  }
  return windows
}

/*
  NÚT "MẶC ĐỊNH" Ở MỐC CHUYỂN ĐOẠN — người dùng 26/9/2026: *"tuân theo cách mà trong sheet đã làm ở mốc chuyển đoạn"*, rồi
  *"hãy áp dụng cho mọi điệu"*. Im bấy nhiêu phách của điệu.
  Số đo 26/9/2026, 18 sheet có chia đoạn trong kho (Hồng Kông 1 không đọc được), lặng trước vạch đầu đoạn mới, nốt đen:
  cả hai tay — Cà Pháo ballad 40/40 mốc lặng 0 · Cà Pháo bossa 6/6 · Tôn Hùng ballad 14/14 · Linh Nhi bolero 29/36 (4 mốc
  ≤ 0,5 · 3 mốc 1–3¼) · Linh Nhi slow rock 11/16 (3 ≤ 0,5 · 2 mốc ¾–⅞); riêng tay trái (tiếng đệm) trung vị 0 ở mọi thầy
  (slow rock 0,19 — nhả nốt). Thầy nào cũng chơi tới sát vạch rồi vào thẳng đoạn mới → "Mặc định" = im 0 ở MỌI điệu (điệu
  không có sheet riêng lấy mức chung 112 mốc). Cũ: 2 phách, đo trên `reference/nguoi ay.mxl` (khoảng lặng của GIỌNG HÁT
  trước đoạn mới, không phải của người đệm).
*/
export const NGHI_MAC_DINH = 0

/** Số phách của điệu im trước vạch ở một mốc (nút "Mặc định" → theo sheet). */
export const nghiCuaMoc = (run: TransitionRun) => run.restTheoSheet ? NGHI_MAC_DINH : run.restBeats

/*
  NGHỈ Ở MỐC CHUYỂN ĐOẠN ĐƯỢC ĐÔN RA — số nốt đen cộng thêm vào hợp âm ở mỗi mốc, MỌI điệu. Người dùng 26/9/2026: *"đừng dồn
  câu chạy lại chơi nhanh hơn. Nghỉ bao nhiêu phách thì đôn ra bấy nhiêu phách"*, rồi *"nút nghỉ phách mặc định và cơ chế
  đôn phách mà vẫn giữ gìn tiết tấu hãy áp dụng cho mọi điệu"*. Câu chạy giữ tốc độ, kết ở vạch cũ, rồi lặng N phách
  (`transitionRunNotes`; màu Cà Pháo: `planCpLicks` · `transitionRests`). Ô đệm / ô fill mở lại sau hợp âm dài lẻ để giữ tiết
  tấu (`ReharmHome`). Không đôn ra: mốc không chạy ngón (0 quãng tám — ô đệm thường). Cũ: nghỉ nằm trong ô, cắt vào chỗ chạy; màu Cà Pháo bỏ qua số phách nghỉ.
*/
export function nghiDonRaTheoMoc(
  transitions: ReadonlyMap<number, TransitionRun>,
  style: Pick<StylePattern, 'gridUnit'>,
): Record<number, number> {
  const out: Record<number, number> = {}
  for (const [index, run] of transitions) {
    const rest = nghiCuaMoc(run) * (style.gridUnit ?? 1)
    if (run.octaves > 0 && rest > 0) out[index] = rest
  }
  return out
}

/** Các đầu đoạn cần mở lại mẫu đệm; độc lập với việc chọn biến thể điệu. */
export function sectionCellBreaks(
  styleId: string,
  sections: readonly { startBeat: number }[] | null,
): number[] {
  // CP cải tiến có câu hai ô A–B nhưng không có biến thể điệp khúc.
  // Sau đoạn dài số ô lẻ phải mở lại A, không lấy nửa B của chu kỳ toàn bài.
  const restart = hasChorusVariant(styleId) || hasTonicVariant(styleId)
    || laBossaCP(canonical(styleId))
  return restart ? sections?.map(section => section.startBeat) ?? [] : []
}

/**
 * Điệu nên dùng cho một đoạn.
 *
 * Nhận cả ID phiên lẫn ID điệp của bài lưu cũ. Bảng chọn chỉ bày điệu chính;
 * mẫu điệp là biến thể nội bộ, rời điệp thì tự quay về phiên.
 *
 * Đoạn giang tấu tính như phiên khúc: nó là chỗ nghỉ giữa hai lần cao trào,
 * chứ không phải cao trào. (Cũ: `INTERLUDE_AS_CHORUS` cho Bolero trữ tình Linh
 * Nhi — điệu ấy đã xoá 30/9/2026.)
 */
export function resolveStyleForSection(
  styleId: string,
  section: SectionKind,
): string {
  const id = canonical(styleId)
  const verse = VERSE_OF[id] ?? id
  if (section !== 'chorus') return verse
  return CHORUS_PAIRS[verse] ?? verse
}
