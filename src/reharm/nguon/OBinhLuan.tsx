import { useEffect, useState } from 'react'
import { chamCauDao, luuBinhLuan, type CauDaoLuu } from './nguon'

/**
 * Ô bình luận về câu dạo vừa nghe.
 *
 * Người dùng đặt: ô nằm **phía trên nút phát cả bài**, ý kiến gắn vào **đúng câu dạo vừa
 * tạo**, và câu ấy có **số thứ tự** để lần lại trong `Nguon.json`.
 *
 * Ô chỉ hiện sau khi đã phát ít nhất một lần — chưa phát thì chưa có câu nào để nói tới,
 * mà hiện một ô trống không gắn vào đâu chỉ tổ gây hiểu nhầm.
 *
 * ## Hai ô tick, và ô viết chỉ mở khi CHƯA ỔN
 *
 * *"Trong ô bình luận hãy để cho tôi có lựa chọn để tick: 1 là 'Đã ổn' thì intro này sẽ
 * được giữ lại. 2 là 'Chưa ổn' thì sẽ cho tôi bình luận ý kiến."*
 *
 * Nên **Đã ổn** chấm xong là xong, không bắt viết gì; **Chưa ổn** mới mở ô viết. Chấm
 * gửi đi ngay lúc tick — nó là một cú bấm dứt khoát, không phải thứ gõ dở.
 *
 * ## GÕ DỞ MÀ BẤM PHÁT THÌ MẤT — CÓ CHỦ Ý
 *
 * Ô dọn mình mỗi khi đổi sang câu khác, mà mỗi lần bấm phát lại sinh một câu dạo mới.
 * Nên gõ xong chưa bấm "Lưu ý kiến" rồi bấm phát là mất trắng.
 *
 * Đã dựng phép tự cứu ý kiến gõ dở, gửi nó cho câu CŨ trước khi dọn ô. Người dùng bảo
 * bỏ: *"thôi không cần sửa lỗi mất trắng đó, mỗi lần bình luận xong bắt buộc tôi phải
 * bấm lưu ý kiến nếu không là mất luôn."*
 *
 * Đừng dựng lại nếu không được yêu cầu. Cứu tự động nghĩa là mọi chữ gõ nháp đều chui
 * vào sổ, kể cả chữ người dùng đang định xoá đi viết lại.
 */
function tenKhung(dieu?: string): string | null {
  if (!dieu) return null
  if (dieu === 'bolero-1' || dieu.startsWith('bolero-tu-n')) return 'Bolero Tuấn'
  if (dieu.includes('linh-nhi-3')) return 'Bolero Linh Nhi 3'
  if (dieu.includes('linh-nhi-2')) return 'Bolero Linh Nhi 2'
  if (dieu.includes('linh-nhi')) return 'Bolero Linh Nhi'
  if (dieu.includes('ca-phao') || dieu.startsWith('bossa-ca-phao')) return 'Cà Pháo'
  if (dieu.includes('ton-hung')) return 'Tôn Hùng'
  return dieu
}

export function OBinhLuan({
  cau,
  nhan = 'Câu dạo',
}: {
  cau: CauDaoLuu | null
  nhan?: string
}) {
  const [chu, setChu] = useState('')
  const [cham, setCham] = useState<'on' | 'chua-on' | null>(null)
  const [trangThai, setTrangThai] = useState<'nghi' | 'dang-gui' | 'xong' | 'hong'>('nghi')

  /* Đổi sang câu khác thì dọn hết. Chưa bấm lưu là mất — xem chú thích đầu file. */
  useEffect(() => {
    setChu('')
    setCham(null)
    setTrangThai('nghi')
  }, [cau?.stt])

  if (!cau) return null
  if (cau.stt <= 0) {
    return (
      <div className="mb-3 rounded-lg border border-line bg-black/20 p-3 text-xs text-rose-300">
        Không ghi được — sổ chỉ chạy khi mở bằng npm run dev
      </div>
    )
  }

  const tick = (gia: 'on' | 'chua-on') => {
    setCham(gia)
    setTrangThai('nghi')
    void chamCauDao(cau.stt, gia).then((duoc) => {
      if (!duoc) setTrangThai('hong')
      else if (gia === 'on') setTrangThai('xong')
    })
  }

  const gui = () => {
    if (chu.trim() === '' || trangThai === 'dang-gui') return
    setTrangThai('dang-gui')
    void luuBinhLuan(cau.stt, chu).then((duoc) => {
      setTrangThai(duoc ? 'xong' : 'hong')
      if (duoc) setChu('')
    })
  }

  const nutTick = (gia: 'on' | 'chua-on', nhan: string, mau: string) => (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
        cham === gia ? mau : 'border-line text-white/75 hover:border-amber-key hover:text-white'
      }`}
    >
      <input
        type="checkbox"
        checked={cham === gia}
        onChange={() => tick(gia)}
        className="accent-amber-key"
      />
      {nhan}
    </label>
  )

  return (
    <div className="mb-3 rounded-lg border border-line bg-black/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
        <span className="rounded bg-amber-key/20 px-2 py-0.5 font-semibold text-amber-key">
          {nhan} #{cau.stt}
        </span>
        {tenKhung(cau.dieu) ? (
          <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-cream">
            {tenKhung(cau.dieu)}
          </span>
        ) : null}
        {cau.giong ? (
          <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-cream">
            {cau.giong}
          </span>
        ) : null}
        <span>{cau.moi ? 'câu mới' : `câu cũ, đã phát ${cau.lanPhat} lần`}</span>
        <span className="text-white/50">· lưu trong Nguon.json</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {nutTick('on', '✓ Đã ổn', 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200')}
        {nutTick('chua-on', '✗ Chưa ổn', 'border-rose-400/60 bg-rose-500/15 text-rose-200')}
        {cham === 'on' && <span className="text-xs text-emerald-300">Đã giữ lại câu này</span>}
      </div>

      {/* Ô viết chỉ mở khi tick "Chưa ổn" — Đã ổn thì không bắt viết gì. */}
      {cham === 'chua-on' && (
        <>
          <textarea
            value={chu}
            onChange={(e) => setChu(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) gui()
            }}
            rows={2}
            placeholder={`${nhan} #${cau.stt}${cau.giong ? ` · ${cau.giong}` : ''} chưa ổn ở chỗ nào? (Ctrl+Enter để gửi)`}
            className="mt-2 w-full resize-y rounded-md border border-line bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:border-amber-key focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={gui}
              disabled={chu.trim() === '' || trangThai === 'dang-gui'}
              className="rounded-md bg-amber-key px-3 py-1.5 text-xs font-bold text-ink hover:brightness-110 disabled:bg-white/10 disabled:text-white/50"
            >
              {trangThai === 'dang-gui' ? 'Đang lưu…' : 'Lưu ý kiến'}
            </button>
            <span className="text-xs font-medium text-amber-200/90">Chưa bấm lưu mà bấm phát là mất</span>
          </div>
        </>
      )}

      {trangThai === 'xong' && (
        <div className="mt-2 text-xs text-emerald-300">Đã ghi vào Nguon.json</div>
      )}
      {trangThai === 'hong' && (
        <div className="mt-2 text-xs text-rose-300">
          Không ghi được — sổ chỉ chạy khi mở bằng npm run dev
        </div>
      )}
    </div>
  )
}
