import { BA, bangCongThuc, cachTimTayPhai, CONG_THUC, hauDep, KHUNG_TRAI, khungTrai, QUY_LUAT_CHAT } from './soanCau/chongHopAm'
import { MEO_VANG, meoTheoKhung } from './soanCau/meoChong'

const nutThu = 'rounded border border-line bg-white/4 px-2 py-0.5 text-[11px] text-dim hover:bg-white/8'

/**
 * BẢNG CÔNG THỨC CHỒNG — người dùng 9/10/2026: "hãy đưa ra công thức và quy luật chồng hợp âm như thế nào để tạo ra các hợp âm màu …
 * Tôi là người mới học … nếu có công thức đơn giản hóa và quy luật để ghép hợp âm từ 2 tay thì tôi có thể học thuộc". Ba bước dựng, ba
 * quy luật, mọi dòng sinh từ 26 công thức chồng (`bangCongThuc`) — bảng và phần đố không lệch nhau. "Thử" đưa công thức lên bàn phím.
 */
export function BangCongThuc({ onThu }: { onThu: (id: string) => void }) {
  const { theoViTri, chum } = bangCongThuc()
  const dong = (d: ReturnType<typeof bangCongThuc>['chum'][number]) => (
    <li key={d.ct.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <button type="button" onClick={() => onThu(d.ct.id)} className={nutThu}>
        Thử
      </button>
      <b className="w-24 font-mono text-cream">{d.nhan.tong}</b>
      <span>
        = tay trái <b className="font-mono text-teal-key">{d.nhan.trai}</b>
        {d.nhan.trai.includes('–') ? '' : <span className="text-dim"> ({d.nhan.traiPhu})</span>} + tay phải{' '}
        <b className="font-mono text-amber-key">{d.nhan.phai}</b>
        {'iv' in d.ct.tren ? '' : <span className="text-dim"> {BA[d.ct.tren.loai].ten}</span>}
      </span>
      <span className="text-dim">→ tay phải chứa {d.bacPhai.join(' · ')}</span>
    </li>
  )
  const viDu = CONG_THUC.find((c) => c.id === '13b9')!
  return (
    <details open className="mb-3 rounded-lg border border-amber-key/40 p-3 text-xs text-cream/85">
      <summary className="cursor-pointer font-semibold text-amber-key">Công thức chồng — quy luật để học thuộc (ví dụ gốc Đô)</summary>

      <p className="mt-2 font-semibold text-cream">Ba bước dựng một hợp âm màu</p>
      <ol className="ml-5 list-decimal">
        <li>
          <b className="text-cream">Tay trái bấm KHUNG</b> — cho biết hợp âm là trưởng, thứ hay át (bốn loại khung ở quy luật 3).
        </li>
        <li>
          <b className="text-cream">Đếm lên bậc</b> cần dùng trong gam trưởng của gốc (♭ là hạ nửa cung).
        </li>
        <li>
          <b className="text-cream">Tay phải bấm một hợp âm ba</b> dựng trên nốt ấy — các nốt của nó chính là màu (9, 11, 13 …).
        </li>
      </ol>
      <p className="mt-1 text-dim">
        Học thuộc QUAN HỆ (tay phải đứng bậc mấy, trưởng hay thứ), không học tên nốt — đổi sang gốc khác chỉ việc đếm lại. Ví dụ: {cachTimTayPhai(viDu, 'F#', 'sharp')} Tay trái giữ
        khung Fa♯ – La♯ – Mi → ra F♯13♭9.
      </p>

      <div className="mt-3 rounded-lg border border-teal-key/40 p-2">
        <p className="font-semibold text-teal-key">Mẹo của gia sư — đếm phím từ gốc tay trái (cả phím đen)</p>
        <ol className="mt-1 ml-5 list-decimal">
          {MEO_VANG.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
        {meoTheoKhung().map((k) => (
          <div key={k.khung} className="mt-2">
            <p className="text-cream">
              Tay trái đã giữ <b className="text-teal-key">{k.ten}</b>:
            </p>
            <ul className="ml-3 flex flex-col gap-0.5">
              {k.ds.map((d) => (
                <li key={d.ct.id}>
                  <b className="font-mono text-cream">C{hauDep(d.ct.kyHieu)}</b> — {d.meo}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-1 text-dim">Mẹo là lời gia sư (Claude) rút từ 26 công thức; mỗi câu có test kiểm trên công thức thật. Luyện mẹo ở tab Game công thức, bên "Luyện có mẹo".</p>
      </div>

      <p className="mt-3 font-semibold text-cream">Quy luật 1 — tay phải đứng ở đâu thì thêm màu ấy</p>
      {theoViTri.map((v) => (
        <div key={v.ten} className="mt-1.5">
          <p>
            Tay phải <b className="text-amber-key">{v.ten}</b> → <b className="text-cream">{v.mau}</b>
          </p>
          <ul className="mt-0.5 ml-3 flex flex-col gap-0.5">{v.dong.map(dong)}</ul>
        </div>
      ))}

      <p className="mt-3 font-semibold text-cream">Quy luật 2 — cùng chỗ, đổi trưởng / thứ là đổi màu</p>
      <ul className="ml-5 list-disc">
        {QUY_LUAT_CHAT.map((q) => (
          <li key={q.viTri}>
            Tay phải {q.viTri}: {q.doi.map((x) => `${BA[x.loai].ten.toUpperCase()} → C${hauDep(x.ra)}`).join(' · ')}
          </li>
        ))}
      </ul>

      <p className="mt-3 font-semibold text-cream">Quy luật 3 — bốn khung tay trái</p>
      <ul className="ml-5 list-disc">
        {(Object.keys(KHUNG_TRAI) as (keyof typeof KHUNG_TRAI)[]).map((k) => (
          <li key={k}>
            <b className="text-teal-key">{KHUNG_TRAI[k].ten}</b> — khi {KHUNG_TRAI[k].khi}:{' '}
            {CONG_THUC.filter((c) => khungTrai(c) === k)
              .map((c) => `C${hauDep(c.kyHieu)}`)
              .join(' · ')}
          </li>
        ))}
      </ul>

      <p className="mt-3 font-semibold text-cream">Chùm nốt rời — tay phải không phải hợp âm ba</p>
      <ul className="mt-0.5 ml-3 flex flex-col gap-0.5">{chum.map(dong)}</ul>
      <p className="mt-2 text-dim">
        26 công thức: 3 theo video Jeff Schneider, còn lại Claude suy ra cùng nguyên tắc (mỗi công thức có test kiểm nốt khớp đúng hợp âm). Bấm
        "Thử" để xem hai tay trên bàn phím ở gốc Đô; đổi gốc ở ô "gốc" bên dưới.
      </p>
    </details>
  )
}
