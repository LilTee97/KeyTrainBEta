import { teachersOf } from './gate'

/**
 * Huy hiệu **ai dạy cái này**, gắn lên gợi ý hợp âm lướt và câu lót.
 *
 * Kho có nhiều thầy rồi, nên nói trống không "của thầy" là sai. Người học phải
 * thấy ngay câu này của Kingsley hay của Pianote, và thấy được chỗ nào là do
 * chính KeyTrain nghĩ ra chứ không ai dạy cả.
 *
 * Ba loại nhãn:
 *
 * - **Tên thầy** — có item `extracted` của thầy đó đứng sau.
 * - **"Suy luận chung"** — bộ não đưa ra nhưng không item nào gắn với thầy nào;
 *   đây là mức `derived` / `invented`, đọc thì được nhưng không thành tiếng.
 * - **"KeyTrain"** — engine của chính app nghĩ ra, không đi qua kho. Luật hợp âm
 *   giảm và ii-V phụ của anh Khá nằm ở nhóm này.
 */
const TEACHER_LABELS: Record<string, string> = {
  'hai-joseph': 'Thầy Hải',
  kingsley: 'Kingsley',
  pianote: 'Pianote',
  'peter-martin': 'Peter Martin',
  'mack-grout': 'Mack Grout',
  'charlie-tran': 'Charlie Trần',
  'piano-dem-hat': 'Đức Thịnh',
}

/** Nhãn của app khi đề xuất không đi qua kho. */
export const KEYTRAIN_BADGE = 'KeyTrain'

/** Nhãn khi não nói nhưng không thầy nào đứng sau. */
export const GENERIC_BADGE = 'Suy luận chung'

const label = (teacherId: string): string =>
  TEACHER_LABELS[teacherId] ?? teacherId

/**
 * Huy hiệu cho một nhóm item.
 *
 * `undefined` nghĩa là đề xuất không tới từ kho — nhãn "KeyTrain". Nhiều thầy
 * thì ghép tên, không gộp lại thành một cái tên chung.
 */
export function teacherBadge(authorizedBy?: readonly string[]): string {
  if (!authorizedBy) return KEYTRAIN_BADGE
  const teachers = teachersOf(authorizedBy)
  if (teachers.length === 0) return GENERIC_BADGE
  return teachers.map(label).join(' + ')
}
