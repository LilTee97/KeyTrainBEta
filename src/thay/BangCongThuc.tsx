import { useState } from 'react'
import { playChord, startAudio } from '../shared/audio/audioEngine'
import { pitchClassName } from '../shared/musicTheory/pitch'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { CONG_THUC, vn } from './soanCau/chongHopAm'
import { bacCua, bangCongLoai, bangTheoDuoi, QUY_TAC_DUOI } from './soanCau/meoChong'
import { QUY_LUAT_SLASH, SLASH_DAO, SLASH_MAU, SLASH_THAY, theSlash, type SlashMau, type ViDuSlash } from './soanCau/slashChong'

const nutThu = 'rounded border border-line bg-white/4 px-2 py-0.5 text-[11px] text-dim hover:bg-white/8'
const nutSlash = (on: boolean) =>
  `rounded-lg border px-2.5 py-1 font-mono text-xs ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/85 hover:bg-white/8'}`
const not = (m: number) => vn(pitchClassName(((m % 12) + 12) % 12, 'flat'))

/**
 * Mẹo cộng loại — người dùng 9–10/2026: "loại nào cộng loại nào thì sẽ ra loại tổng" (chữ "gốc" trong lời người dùng là LOẠI), không đếm
 * phím từ nốt. Mỗi dạng tay trái một thẻ; mỗi hàng là một phép cộng đọc thẳng: tay trái + tay phải (loại) = hợp âm, ví dụ gốc Đô. Trình bày
 * lại 11/10/2026 (người dùng: "cách trình bày cần rõ ràng dễ hiểu hơn") — bản cũ "+ thứ → maj7 (Đô + Em)" khó đọc.
 */
export function MeoCongLoai({ ids }: { ids: readonly string[] }) {
  return (
    <div className="mt-1 grid gap-2 sm:grid-cols-2">
      {bangCongLoai(ids).map((d) => (
        <div key={d.dang} className="rounded border border-line/60 p-2">
          <p>
            <span className="text-dim">Tay trái giữ </span>
            <b className="font-mono text-teal-key">{d.viDu}</b>
            {d.not && <span className="text-dim"> ({d.not})</span>}
            <span className="text-dim"> · {d.dang}</span>
          </p>
          <table className="mt-1">
            <tbody>
              {d.hang.map((h) => (
                <tr key={h.tong}>
                  <td className="pr-1 font-mono text-teal-key">{d.viDu}</td>
                  <td className="px-1 text-dim">+</td>
                  <td className="pr-1 font-mono text-amber-key">{h.phai}</td>
                  <td className="pr-2 text-dim">({h.chat})</td>
                  <td className="px-1 text-dim">=</td>
                  <td className="font-mono font-bold text-cream">{h.tong}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.trung.map((t) => (
            <p key={t.chat} className="mt-1 text-cream/70">
              Cùng tay phải {t.chat} mà ra hợp âm khác: nhìn tên — {t.phai.join(' hay ')}.
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Thẻ một nhóm đuôi: đuôi mang lại nốt nào, cách chồng, từng hợp âm (tên hai tay, gợi nhớ), điểm chung. Dùng ở bảng và ở game. */
export function TheNhomDuoi({ n, onThu }: { n: ReturnType<typeof bangTheoDuoi>[number]; onThu?: (id: string) => void }) {
  return (
    <div className="mt-2 rounded border border-line/60 p-2">
      <p>
        <b className="text-base text-amber-key">{n.ten}</b> <span className="font-mono text-cream/85">{n.duoi}</span>
      </p>
      <p>
        <span className="text-dim">Đuôi thêm / đổi nốt (so với Đô – Mi – Sol): </span>
        {n.dauHieu}
      </p>
      <p>
        <span className="text-dim">Cách chồng: </span>
        {n.cach}
      </p>
      <ul className="mt-1 ml-1 flex flex-col gap-0.5">
        {n.dong.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-x-2">
            {onThu && (
              <button type="button" onClick={() => onThu(d.id)} className={nutThu}>
                Thử
              </button>
            )}
            <b className="w-24 font-mono text-cream">{d.tong}</b>
            <span>
              = <span className="text-dim">tay trái</span> <b className="font-mono text-teal-key">{d.trai}</b> + <span className="text-dim">tay phải</span>{' '}
              <b className="font-mono text-amber-key">{d.phai}</b>{' '}
              <span className="text-dim">({d.phaiPhu})</span>
            </span>
            {d.goiNho && <span className="text-cream/70">— {d.goiNho}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-cream/75">
        <span className="text-dim">Điểm chung: </span>
        {n.chung}
      </p>
    </div>
  )
}

/**
 * BẢNG CÔNG THỨC CHỒNG — CHIA THEO ĐUÔI. Người dùng 10/10/2026: "sao bạn ko chia theo kiểu Maj7 là một loại, Add9 là một loại, rồi dim rồi
 * sus rồi 7b5 ... Sau đó thì hãy chia công thức và quy tắc theo kiểu làm sao để chồng ra Maj7, hoặc dim7, hoặc Trưởng, hoặc 13". Thứ tự:
 * muốn chồng ra loại nào (16 nhóm đuôi — 26 công thức + 6 hợp âm ba cơ bản, "Thử" đưa lên bàn phím), quy tắc chung giữa các đuôi, mẹo
 * cộng loại (gom theo tay trái), vì sao chồng được (4 bước), hợp âm slash. Bỏ 10/10/2026: bảng theo họ, quy luật con số, mẹo vàng — đã gộp
 * vào các nhóm đuôi. Dữ liệu và test ở meoChong.ts, slashChong.ts.
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
      <summary className="cursor-pointer font-semibold text-amber-key">Công thức chồng — muốn chồng ra loại nào (ví dụ gốc Đô)</summary>

      <p className="mt-2 font-semibold text-cream">Muốn chồng ra loại nào — chia theo đuôi</p>
      <p className="text-dim">
        Tên hợp âm = gốc + đuôi (Cmaj7 = gốc C + đuôi maj7). Gốc cho hợp âm ba Đô – Mi – Sol; đuôi thêm hay đổi vài nốt — dòng "Đuôi thêm / đổi
        nốt" ghi đúng mấy nốt ấy. Chữ xanh là tay trái, chữ cam là tay phải. "Thử" đưa hợp âm lên bàn phím ở gốc Đô.
      </p>
      {bangTheoDuoi().map((n) => (
        <TheNhomDuoi key={n.ten} n={n} onThu={onThu} />
      ))}

      <p className="mt-3 font-semibold text-cream">Quy tắc chung giữa các đuôi</p>
      <ol className="ml-5 list-decimal">
        {QUY_TAC_DUOI.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>

      <p className="mt-3 font-semibold text-cream">Mẹo cộng loại — giữ tay trái, đổi tay phải là ra hợp âm khác</p>
      <p className="text-dim">
        26 công thức chỉ có 8 cách bấm tay trái. Mỗi thẻ là một cách: giữ nguyên tay trái, đổi hợp âm tay phải thì ra hợp âm khác. Đọc mỗi hàng
        như phép cộng — hàng đầu: tay trái Đô + tay phải Em (hợp âm thứ) = Cmaj7. Ví dụ ở gốc Đô.
      </p>
      <MeoCongLoai ids={CONG_THUC.map((c) => c.id)} />

      <p className="mt-3 font-semibold text-cream">Vì sao chồng được — 4 bước cho mọi loại</p>
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

      <p className="mt-2 text-dim">
        Lời quy luật và mẹo là của Claude (gia sư), rút từ 26 công thức chồng — 3 theo video Jeff Schneider, còn lại Claude suy ra cùng nguyên tắc;
        hợp âm ba cơ bản (trưởng, thứ, giảm, tăng, sus) bấm thẳng một tay. Mỗi quy tắc có test đối chiếu công thức thật. Các loại khác của app
        (7sus4, 7♯9, maj13…) chưa có công thức riêng — xem ở ô "tự chọn". Luyện tay ở tab Game công thức.
      </p>
    </details>
  )
}
