import { getStyle } from './styleLibrary'
import type { SectionKind } from './songStructure'

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
  'hai-pop-ballad': 'hai-pop-ballad-chorus',
  'hai-pop-ballad-free': 'hai-pop-ballad-free-chorus',
  'hai-slow-rock': 'hai-slow-rock-chorus',
  'bolero-linh-nhi': 'bolero-linh-nhi-chorus',
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
 * Điệu nào dùng bản CAO TRÀO cho cả **giang tấu**, không chỉ điệp khúc.
 *
 * Mặc định giang tấu tính như phiên khúc — nó là chỗ nghỉ giữa hai lần cao
 * trào. Bảng này là chỗ nói ngược lại, và phải khai báo từng điệu một.
 *
 * Bolero trữ tình vào đây vì đặc tả gộp điệp khúc và giang tấu làm một kết cấu
 * (arpeggio tám móc đơn). Không cho cả bảng `CHORUS_PAIRS` cùng đổi: ballad và
 * slow rock của thầy Hải chưa ai bảo giang tấu phải lên cao trào.
 */
const INTERLUDE_AS_CHORUS: readonly string[] = ['bolero-linh-nhi']

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

/** Tên chính thức của điệu: alias (`ballad`, `hai-pop-ballad-1`…) quy về một mối. */
const canonical = (styleId: string): string => getStyle(styleId)?.id ?? styleId

/** Điệu này có bản điệp khúc riêng không — dùng để bày ghi chú trên giao diện. */
export function hasChorusVariant(styleId: string): boolean {
  const id = canonical(styleId)
  return id in CHORUS_PAIRS || id in VERSE_OF
}

/**
 * Điệu nên dùng cho một đoạn.
 *
 * Nhận cả bản phiên khúc lẫn bản điệp khúc làm đầu vào, nên người dùng bấm bản
 * nào trên bảng chọn cũng ra kết quả như nhau — bấm "điệp khúc" rồi nghe cả bài
 * thì phiên khúc vẫn tự lùi về bản phiên khúc.
 *
 * Đoạn giang tấu MẶC ĐỊNH tính như phiên khúc: nó là chỗ nghỉ giữa hai lần cao
 * trào, chứ không phải cao trào. Điệu nào muốn ngược lại thì khai báo trong
 * `INTERLUDE_AS_CHORUS` — từng điệu một, không đổi cả bảng.
 */
export function resolveStyleForSection(
  styleId: string,
  section: SectionKind,
): string {
  const id = canonical(styleId)
  const verse = VERSE_OF[id] ?? id
  const wantsChorus =
    section === 'chorus' ||
    (section === 'interlude' && INTERLUDE_AS_CHORUS.includes(verse))
  if (!wantsChorus) return verse
  return CHORUS_PAIRS[verse] ?? verse
}

/**
 * Điệu nào phải **mở lại ô nhịp ở giữa ô khi hợp âm chia đôi**.
 *
 * Ô ballad thường dài trọn một ô nhịp: bass mạnh ở đầu, nhẹ ở giữa. Nhưng khi
 * một ô mang **hai hợp âm**, cái mốc "nhẹ ở giữa" rơi đúng vào lúc hợp âm thứ
 * hai vừa vào — nghe thành hợp âm mới bị đánh bằng nhịp yếu của hợp âm cũ, còn
 * nốt gốc của nó thì không được nhấn lần nào.
 *
 * Mỗi nửa ô mở một ô nhịp riêng: hợp âm nào cũng có phách mạnh của chính nó.
 * Bolero Linh Nhi: nửa ô chỉ chơi 1-5 (verse) hoặc 1-5-8-10 (chorus).
 */
const SPLIT_AWARE = new Set([
  'hai-pop-ballad-free',
  'hai-pop-ballad-free-chorus',
  'bolero-linh-nhi',
  'bolero-linh-nhi-chorus',
])

export function isSplitAwareStyle(styleId: string): boolean {
  return SPLIT_AWARE.has(canonical(styleId))
}
