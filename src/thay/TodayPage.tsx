import { TEACHERS, type TeacherId } from './teachers'

/**
 * Trang Hôm nay — trang mở đầu (người dùng 2/10/2026, câu A).
 *
 * Sẽ gom lượt nguội + bậc đến hạn kiểm lại + bậc đang học của MỌI thầy (`KE-HOACH-LUYEN-TAP.md` mục 1.7, 4c). Lượt nguội phải
 * đi trước khi tập bậc khác, nếu không tay đã nóng. Chưa có lộ trình (GĐ 1 bước 3) thì chỉ mở đường sang trang thầy.
 */
export function TodayPage({ onOpen }: { onOpen: (teacher: TeacherId) => void }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Hôm nay</h2>
      <div className="rounded-xl border border-line bg-black/25 p-4 text-sm text-dim">
        <p className="mb-3">
          Chưa có lượt tập nào. Khi tab Điệu của các thầy có lộ trình, đây sẽ là danh sách tập trong ngày: lượt nguội và bậc
          đến hạn kiểm lại đi trước, rồi tới bậc đang học.
        </p>
        <div className="flex flex-wrap gap-2">
          {TEACHERS.map((teacher) => (
            <button
              key={teacher.id}
              type="button"
              onClick={() => onOpen(teacher.id)}
              className="rounded-lg border border-line bg-white/6 px-3 py-1.5 text-xs text-cream hover:bg-white/12"
            >
              {teacher.label} →
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
