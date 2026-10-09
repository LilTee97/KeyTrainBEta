import { useState } from 'react'
import { playChord, startAudio } from '../shared/audio/audioEngine'
import { pitchClassName } from '../shared/musicTheory/pitch'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { CONG_THUC, hauDep, vn } from './soanCau/chongHopAm'
import { bacCua, bangCongLoai, bangTheoLoai, LUAT_SO, MEO_VANG } from './soanCau/meoChong'
import { QUY_LUAT_SLASH, SLASH_DAO, SLASH_MAU, SLASH_THAY, theSlash, type SlashMau, type ViDuSlash } from './soanCau/slashChong'

const nutThu = 'rounded border border-line bg-white/4 px-2 py-0.5 text-[11px] text-dim hover:bg-white/8'
const nutSlash = (on: boolean) =>
  `rounded-lg border px-2.5 py-1 font-mono text-xs ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/85 hover:bg-white/8'}`
const tenC = (id: string) => `C${hauDep(CONG_THUC.find((c) => c.id === id)!.kyHieu)}`
const not = (m: number) => vn(pitchClassName(((m % 12) + 12) % 12, 'flat'))

/**
 * Mẹo cộng loại — người dùng 9–10/2026: "loại nào cộng loại nào thì sẽ ra loại tổng" (chữ "gốc" trong lời người dùng là LOẠI), không đếm
 * phím từ nốt. Gom theo dạng tay trái: một dạng tay trái + đổi loại tay phải = nhiều loại; ví dụ gốc Đô ghi tên hai tay. Dùng ở bảng này
 * và ở game (bên luyện có mẹo).
 */
export function MeoCongLoai({ ids }: { ids: readonly string[] }) {
  return (
    <ul className="mt-1 flex flex-col gap-1.5">
      {bangCongLoai(ids).map((d) => (
        <li key={d.dang}>
          <b className="text-teal-key">Tay trái {d.dang.toUpperCase()}</b> <span className="text-dim">(gốc Đô: {d.viDu})</span>
          {d.theoChat.map((c) => (
            <span key={c.chat} className="ml-3 block">
              + <b className="text-amber-key">{c.chat}</b> →{' '}
              {c.loai.map((l, k) => (
                <span key={l.ten}>
                  {k > 0 && ' · '}
                  <b className="font-mono text-cream">{l.ten}</b> <span className="text-dim">({l.viDu})</span>
                </span>
              ))}
            </span>
          ))}
        </li>
      ))}
    </ul>
  )
}

/**
 * BẢNG CÔNG THỨC CHỒNG — THEO LOẠI HỢP ÂM. Người dùng 9/10/2026: "tôi muốn nó tính theo loại hợp âm (ví dụ như Maj7, 7b9, dim7,
 * m11b5...) hơn là theo vị trí tay … mẹo cũng phải tính theo loại hợp âm" và "Sao tôi ko thấy các quy luật về hợp âm slash". Quy luật
 * chung 4 bước, quy luật con số (đuôi tên), bảng 26 loại theo họ (bậc hai tay, mẹo riêng, "Thử" đưa lên bàn phím), hợp âm slash (thế
 * đảo · bass lạ = hợp âm màu viết tắt · slash trong sheet các thầy), mẹo vàng. Dữ liệu và test ở meoChong.ts, slashChong.ts.
 */
export function BangCongThuc({ onThu }: { onThu: (id: string) => void }) {
  const [slash, setSlash] = useState<ViDuSlash | SlashMau | null>(null)
  const viDu = CONG_THUC.find((c) => c.id === '13b9')!
  const b = bacCua(viDu)
  const xemSlash = async (v: ViDuSlash) => {
    setSlash(v)
    const t = theSlash(v)
    await startAudio()
    playChord([...t.trai, ...t.phai], '2n')
  }
  const t = slash ? theSlash(slash) : null
  return (
    <details open className="mb-3 rounded-lg border border-amber-key/40 p-3 text-xs text-cream/85">
      <summary className="cursor-pointer font-semibold text-amber-key">Công thức chồng — quy luật theo loại hợp âm (ví dụ gốc Đô)</summary>

      <p className="mt-2 font-semibold text-cream">Mẹo cộng loại — loại tay trái + loại tay phải = loại tổng</p>
      <p className="text-dim">
        26 loại chỉ dùng 8 dạng tay trái. Giữ một dạng tay trái, đổi loại tay phải là ra loại khác — vd tay trái khung 7: + thứ → 13, + trưởng →
        13♭9. Có chỗ cùng một phép cộng ra hai loại (nốt gốc + thứ: Cmaj7 = Đô + Em, Cm7♭5 = Đô + E♭m) — khi ấy nhìn tên tay phải mà phân biệt.
      </p>
      <MeoCongLoai ids={CONG_THUC.map((c) => c.id)} />

      <p className="mt-3 font-semibold text-cream">Quy luật chung — 4 bước cho mọi loại</p>
      <ol className="ml-5 list-decimal">
        <li>
          Viết các <b className="text-cream">bậc</b> của loại hợp âm — vd C13♭9: {b.caHai.join(' · ')}.
        </li>
        <li>
          <b className="text-teal-key">Tay trái giữ NỀN</b>: gốc, cộng bậc 3 và ♭7 khi tay phải không có — C13♭9: {b.trai.join(' · ')}.
        </li>
        <li>
          <b className="text-amber-key">Tay phải gom ba nốt màu trên cùng</b> thành một hợp âm ba (bậc 5 hay được bỏ) — C13♭9: {b.phai.join(' · ')} = La – Đô♯ – Mi
          = A trưởng.
        </li>
        <li>Đọc tên hợp âm ba ấy: La – Đô♯ – Mi = A — vậy C13♭9 = C7 + A (khung 7 + trưởng).</li>
      </ol>

      <p className="mt-3 font-semibold text-cream">Quy luật con số — nhìn đuôi tên: số càng lớn, tay phải càng leo cao trên hợp âm</p>
      <ul className="ml-5 list-disc">
        {LUAT_SO.map((l) => (
          <li key={l.so}>
            Đuôi <b className="text-amber-key">{l.so}</b> — {l.luat}: {l.ids.map(tenC).join(' · ')}
          </li>
        ))}
      </ul>

      <p className="mt-3 font-semibold text-cream">Bảng 26 loại theo họ — phép cộng loại và ví dụ gốc Đô</p>
      {bangTheoLoai().map((h) => (
        <div key={h.ten} className="mt-1.5">
          <p className="text-teal-key">{h.ten}</p>
          <ul className="mt-0.5 ml-3 flex flex-col gap-1">
            {h.dong.map((d) => (
              <li key={d.ct.id}>
                <div className="flex flex-wrap items-center gap-x-2">
                  <button type="button" onClick={() => onThu(d.ct.id)} className={nutThu}>
                    Thử
                  </button>
                  <b className="w-24 font-mono text-cream">{d.nhan.tong}</b>
                  <span className="text-dim">bậc {d.bac.caHai.join(' · ')}</span>
                  <span>
                    = tay trái <b className="font-mono text-teal-key">{d.bac.trai.join('·')}</b> <span className="text-dim">({d.nhan.trai})</span> + tay phải{' '}
                    <b className="font-mono text-amber-key">{d.bac.phai.join('·')}</b> <span className="text-dim">({d.nhan.phai})</span>
                  </span>
                </div>
                <p className="ml-12 text-cream/75">Mẹo: {d.meo}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-3 rounded-lg border border-teal-key/40 p-2">
        <p className="font-semibold text-teal-key">Hợp âm slash (X/Y)</p>
        <ol className="mt-1 ml-5 list-decimal">
          {QUY_LUAT_SLASH.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p className="mt-2 text-cream">Thế đảo — bass là nốt của chính hợp âm (bấm để xem và nghe):</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SLASH_DAO.map((v) => (
            <button key={v.ten} type="button" onClick={() => void xemSlash(v)} className={nutSlash(slash === v)} title={v.nghia}>
              {v.ten}
            </button>
          ))}
        </div>
        <p className="mt-2 text-cream">Bass lạ — hợp âm màu viết tắt:</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SLASH_MAU.map((v) => (
            <button key={v.ten} type="button" onClick={() => void xemSlash(v)} className={nutSlash(slash === v)} title={v.nghia}>
              {v.ten} = {v.la.ten}
            </button>
          ))}
        </div>
        {slash && t && (
          <div className="mt-2">
            <p className="text-cream/85">
              <b className="font-mono text-cream">{slash.ten}</b>
              {'la' in slash ? ` = ${slash.la.ten}` : ''} — {slash.nghia}
            </p>
            <BanPhimHaiTay
              trai={t.trai}
              phai={t.phai}
              lowNote={36}
              highNote={84}
              nhan={{
                trai: not(t.trai[0]!),
                traiPhu: 'bass',
                phai: slash.ten.split('/')[0]!,
                phaiPhu: t.phai.map(not).join(' – '),
                tong: 'la' in slash ? `${slash.ten} = ${slash.la.ten}` : slash.ten,
              }}
            />
          </div>
        )}
        <p className="mt-2 text-cream">Slash trong sheet các thầy (đã soát tay từng nốt):</p>
        <ul className="ml-3 flex flex-col gap-0.5">
          {SLASH_THAY.map((x) => (
            <li key={x.vong}>
              <span className="text-dim">
                {x.thay} · {x.bai}:
              </span>{' '}
              <b className="font-mono text-cream">{x.vong}</b> <span className="text-dim">(bass {x.bass})</span> — {x.y}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 font-semibold text-cream">Mẹo vàng</p>
      <ol className="ml-5 list-decimal">
        {MEO_VANG.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ol>
      <p className="mt-2 text-dim">
        Lời quy luật và mẹo là của Claude (gia sư), rút từ 26 công thức chồng — 3 theo video Jeff Schneider, còn lại Claude suy ra cùng nguyên tắc;
        mỗi quy luật có test đối chiếu công thức thật. "Thử" đưa loại hợp âm lên bàn phím ở gốc Đô; luyện tay ở tab Game công thức.
      </p>
    </details>
  )
}
