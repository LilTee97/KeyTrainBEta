import { brain } from './index'
import type { KnowledgeItem } from './index'

/**
 * Cửa chặn: **thứ gì của não được phép thành tiếng đàn**.
 *
 * Đây là luật chống bịa của PianoBrain kéo dài sang tới loa. Kho phân biệt ba
 * mức nguồn gốc: `extracted` là rút từ bài giảng có thật, `derived` là suy từ
 * lý thuyết chung, `invented` là tự soạn. Hai mức sau **không được** phát ra
 * tiếng ở chế độ mặc định — người học nghe một câu nhạc thì mặc nhiên tin đó là
 * thầy dạy, nên chỉ thứ có thầy thật đứng sau mới được vang lên.
 *
 * Mức `derived` và `invented` vẫn hiện trong tab chat và trong danh sách gợi ý,
 * kèm nhãn "chờ rà" — đọc thì được, nghe thì không.
 *
 * ## Vì sao mặc định vẫn là `extracted` chứ không phải `validated`
 *
 * Tình trạng rà soát bên PianoBrain, tính theo thầy:
 *
 * | nguồn | đã rà | còn draft |
 * |---|---|---|
 * | hai-joseph | 634 | 103 |
 * | jazz-scales | 28 | 76 |
 * | kingsley | **0** | 11 |
 * | pianote | **0** | 27 |
 * | charlie-tran | **0** | 16 |
 * | mack-grout | **0** | 13 |
 * | peter-martin | **0** | 3 |
 *
 * Siết hằng số này xuống `validated` là tắt tiếng **toàn bộ** câu lót của thầy
 * Kingsley, walking bass của Pianote và mấy nguồn còn lại — những thứ đang chạy
 * tốt. Nên chỗ phân biệt đáng giá vẫn là `origin` (có thầy thật hay không).
 *
 * ## Cách siết đúng: siết tới đâu rà tới đó
 *
 * Bộ gam jazz đã rà xong 28 item mà bộ chọn gam dùng tới, nên **nó tự siết lấy
 * mình**: `brain/chordScale.ts` gọi `scaleFor` với `requireValidated: true`, và
 * gam nào thêm sau mà chưa rà thì tự im. Không phải đợi cả kho.
 *
 * Muốn siết hằng số này thì rà nốt Kingsley và Pianote trước —
 * `npm run review:jazz` bên PianoBrain là khuôn để làm chuyện đó.
 */
export type SoundMode =
  /** Mặc định: phải rút từ bài giảng có thật. */
  | 'extracted'
  /** Siết thêm: phải rút từ bài giảng **và** đã được rà lại. */
  | 'validated'

export const DEFAULT_SOUND_MODE: SoundMode = 'extracted'

/** Item này có được phép thành tiếng không. */
export function itemMaySound(
  item: KnowledgeItem | undefined,
  mode: SoundMode = DEFAULT_SOUND_MODE,
): boolean {
  if (!item) return false
  if (item.origin !== 'extracted') return false
  if (item.status === 'rejected') return false
  return mode === 'validated' ? item.status === 'validated' : true
}

/**
 * Cả nhóm item cho phép một câu nhạc có đủ tư cách phát ra tiếng không.
 *
 * Đòi **mọi** item đều qua cửa, không phải chỉ một cái: một câu dựng trên hai
 * luật mà một luật là tự nghĩ ra thì cả câu vẫn có phần tự nghĩ ra.
 *
 * Danh sách rỗng cũng là không qua cửa — không có ai đứng sau thì không phát.
 */
export function maySound(
  itemIds: readonly string[],
  mode: SoundMode = DEFAULT_SOUND_MODE,
): boolean {
  if (itemIds.length === 0) return false
  const kb = brain()
  return itemIds.every((id) => itemMaySound(kb.byId.get(id), mode))
}

/**
 * Tên thầy đứng sau một nhóm item, để gắn huy hiệu trên giao diện.
 *
 * Nhiều thầy thì trả về cả danh sách — kho có nhiều thầy rồi, gộp thành "của
 * thầy" trống không là sai. Item `derived` / `invented` không có thầy nào, và
 * đó chính là điều cần hiện ra: nó là suy luận chung, không phải ai dạy.
 */
export function teachersOf(itemIds: readonly string[]): string[] {
  const kb = brain()
  const names = itemIds
    .map((id) => kb.byId.get(id)?.source?.teacher_id)
    .filter((name): name is string => Boolean(name))
  return [...new Set(names)]
}
