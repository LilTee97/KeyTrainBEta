import { useEffect, useState } from 'react'
import { dayKeyOf, docLuotTap, type LuotTap } from '../shared/persistence/db'
import { HOC_TOI_DA, keHoachHomNay, tenBai, thayCua } from './homNay'
import { BAC, tienDoBai, type TienDoBai } from './loTrinh'
import { TEACHERS, THU_TU_TAP, type TeacherId } from './teachers'

const tenThay = (id: TeacherId) => TEACHERS.find((teacher) => teacher.id === id)?.label ?? id
const soQua = (tienDo: TienDoBai) => tienDo.trangThai.filter((tt) => tt === 'qua' || tt === 'thuoc').length
const nut = 'rounded-lg bg-amber-key px-3 py-1.5 text-xs font-semibold text-ink hover:brightness-110'
const khung = 'rounded-xl border border-line bg-black/25 p-4'

/**
 * Trang Hôm nay — trang mở đầu (người dùng 2/10/2026, câu A; `Reference/KE-HOACH-LUYEN-TAP.md` mục 1.7, GĐ 1 bước 8).
 *
 * Gom mọi thầy lên một danh sách theo lời gia sư (`homNay.ts`): lượt nguội trước tiên → bài đang học → bài mới (tối đa
 * `HOC_TOI_DA` bài chưa tới tempo thật) → toàn bộ lộ trình 9 bài. Bấm "Tập" là mở thẳng trang thầy, đúng bài, đúng bậc.
 */
export function TodayPage({ onTap }: { onTap: (teacher: TeacherId, styleId: string, bac?: number) => void }) {
  const [luot, setLuot] = useState<LuotTap[] | null>(null)
  useEffect(() => {
    let alive = true
    docLuotTap()
      .then((all) => {
        if (alive) setLuot(all)
      })
      .catch(() => {
        if (alive) setLuot([])
      })
    return () => {
      alive = false
    }
  }, [])

  if (luot === null) return <p className="text-sm text-dim">Đang tải tiến độ…</p>

  const homNay = dayKeyOf(new Date())
  const ke = keHoachHomNay(luot, homNay)
  const ngay = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold">Hôm nay</h2>
        <span className="text-sm text-dim">{ngay}</span>
      </div>

      <div className={ke.nguoi.length > 0 ? 'rounded-xl border border-amber-key/60 bg-amber-key/10 p-4' : khung}>
        <h3 className="mb-1 font-semibold text-amber-key">1. Lượt nguội — làm trước tiên</h3>
        <p className="mb-3 text-xs text-dim">
          Mỗi bài một lượt, chưa khởi động bài ấy. Tập bậc khác của bài trước thì tay đã nóng — không còn biết là đã thuộc hay
          chưa.
        </p>
        {ke.nguoi.length === 0 ? (
          <p className="text-sm text-dim">Hôm nay không có lượt nguội nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ke.nguoi.map((muc) => (
              <li key={muc.styleId} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-cream">{tenBai(muc.styleId)}</span>
                <span className="text-xs text-dim">{tenThay(muc.thay)}</span>
                <span className="text-xs text-cream/85">
                  bậc {muc.bac} · {muc.viec === 'xac-nhan' ? 'xác nhận Đã thuộc' : `kiểm lại (hộp ${muc.tienDo.hop}/5)`}
                </span>
                <button type="button" onClick={() => onTap(muc.thay, muc.styleId, muc.bac)} className={nut}>
                  Tập →
                </button>
              </li>
            ))}
          </ul>
        )}
        {ke.daNguoi.length > 0 && (
          <p className="mt-3 text-xs text-dim">
            Đã làm hôm nay:{' '}
            {ke.daNguoi.map((muc, i) => (
              <span key={muc.styleId}>
                {i > 0 ? ' · ' : ''}
                {tenBai(muc.styleId)} bậc {muc.bac} —{' '}
                <span className={muc.dat ? 'text-teal-key' : 'text-rose-300'}>{muc.dat ? 'Đạt' : 'Chưa đạt'}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className={khung}>
        <h3 className="mb-3 font-semibold text-cream">2. Đang học</h3>
        {ke.dangHoc.length === 0 ? (
          <p className="text-sm text-dim">Chưa bắt đầu bài nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ke.dangHoc.map((muc) => {
              const choNguoi = ke.nguoi.some((one) => one.styleId === muc.styleId)
              return (
                <li key={muc.styleId} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-cream">{tenBai(muc.styleId)}</span>
                  <span className="text-xs text-dim">{tenThay(muc.thay)}</span>
                  <span className="text-xs text-cream/85">
                    bậc {muc.bac} — {BAC[muc.bac - 1]?.ten}
                  </span>
                  <span className="font-mono text-xs text-dim">
                    {soQua(muc.tienDo)}/7{muc.tienDo.thuocCaoNhat > 0 ? ` · ★${muc.tienDo.thuocCaoNhat}` : ''}
                  </span>
                  {choNguoi ? (
                    <span className="text-[11px] text-amber-key">làm lượt nguội trước</span>
                  ) : (
                    <button type="button" onClick={() => onTap(muc.thay, muc.styleId, muc.bac)} className={nut}>
                      Tập →
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={khung}>
        <h3 className="mb-3 font-semibold text-cream">3. Bài mới</h3>
        {ke.baiMoi ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-cream">{tenBai(ke.baiMoi)}</span>
            <span className="text-xs text-dim">{tenThay(thayCua(ke.baiMoi))}</span>
            <span className="text-xs text-dim">bài dễ nhất chưa tập (theo đo độ khó)</span>
            <button type="button" onClick={() => onTap(thayCua(ke.baiMoi!), ke.baiMoi!, 1)} className={nut}>
              Bắt đầu bậc 1 →
            </button>
          </div>
        ) : ke.dangHocDuoi6 >= HOC_TOI_DA ? (
          <p className="text-sm text-dim">
            Đang học {ke.dangHocDuoi6} bài chưa tới tempo thật — đưa một bài qua bậc 6 rồi hãy mở bài mới. Học dồn nhiều bài một
            lúc thì bài nào cũng chậm thuộc.
          </p>
        ) : (
          <p className="text-sm text-dim">Đã mở hết các bài.</p>
        )}
      </div>

      <div className={khung}>
        <h3 className="mb-3 font-semibold text-cream">Toàn bộ lộ trình — {THU_TU_TAP.length} bài, dễ trước</h3>
        <ol className="flex flex-col gap-1.5 text-sm">
          {THU_TU_TAP.map((styleId, i) => {
            const tienDo = tienDoBai(luot, styleId, homNay)
            const thay = thayCua(styleId)
            return (
              <li key={styleId} className="flex flex-wrap items-baseline gap-x-3">
                <span className="w-5 font-mono text-xs text-dim">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => onTap(thay, styleId)}
                  className="text-left font-semibold text-cream hover:text-amber-key"
                >
                  {tenBai(styleId)}
                </button>
                <span className="text-xs text-dim">{tenThay(thay)}</span>
                <span className="font-mono text-xs text-dim">
                  {soQua(tienDo)}/7{tienDo.thuocCaoNhat > 0 ? ` · ★${tienDo.thuocCaoNhat}` : ''}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
