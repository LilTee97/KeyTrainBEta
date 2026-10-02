import { getStyle } from '../reharm/style/styleLibrary'
import type { Teacher } from './teachers'

/**
 * Trang một thầy — tab Điệu · Kỹ thuật đánh · Học cách soạn câu (`Reference/KE-HOACH-LUYEN-TAP.md` mục 4c).
 *
 * Tab chưa có nội dung thì ẩn (người dùng 2/10/2026, câu E). Bước 1 (khung điều hướng) chưa có bài tập nào, nên trang chỉ
 * nói đang dựng và kể tên các điệu sẽ có.
 */
export function TeacherPage({ teacher }: { teacher: Teacher }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{teacher.label}</h2>
      <div className="rounded-xl border border-line bg-black/25 p-4 text-sm text-dim">
        <p className="mb-2">Bài tập điệu của thầy đang được dựng — tab Điệu sẽ hiện khi có bài. Các điệu sẽ có:</p>
        <ul className="list-inside list-disc text-cream/80">
          {teacher.styleIds.map((id) => (
            <li key={id}>{getStyle(id)?.name ?? id}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
