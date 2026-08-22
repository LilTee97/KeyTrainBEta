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
 * Đoạn giang tấu tính như phiên khúc: nó là chỗ nghỉ giữa hai lần cao trào, chứ
 * không phải cao trào.
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

/**
 * Điệu nào phải **mở lại ô nhịp ở giữa ô khi hợp âm chia đôi**.
 *
 * Ô ballad thường dài trọn một ô nhịp: bass mạnh ở đầu, nhẹ ở giữa. Nhưng khi
 * một ô mang **hai hợp âm**, cái mốc "nhẹ ở giữa" rơi đúng vào lúc hợp âm thứ
 * hai vừa vào — nghe thành hợp âm mới bị đánh bằng nhịp yếu của hợp âm cũ, còn
 * nốt gốc của nó thì không được nhấn lần nào.
 *
 * Với hai điệu rải tự do dưới đây, mỗi nửa ô được mở một ô nhịp riêng: hợp âm
 * nào cũng có phách mạnh của chính nó ở đầu nửa, rồi rải trong bốn nửa-phách
 * của nửa đó. Hai nửa không dính nhau.
 *
 * Chỉ hai điệu này, vì đây là cách chơi riêng của chúng. Điệu khác giữ nguyên
 * cách cũ.
 */
const SPLIT_AWARE = new Set(['hai-pop-ballad-free', 'hai-pop-ballad-free-chorus'])

export function isSplitAwareStyle(styleId: string): boolean {
  return SPLIT_AWARE.has(canonical(styleId))
}
