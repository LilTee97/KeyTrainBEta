import { BanPhimHaiTay } from './BanPhimHaiTay'
import { tenPhim } from './hocSolo/khungNot'
import { CHIA_TAY, xongChong, type CauSsa } from './hocSolo/loiSsa'

/*
  BÀN PHÍM LỐI CHỒNG + CHẠY — dùng chung cho Mưa khung nốt (rơi tự do) và Mưa khung nốt có backing track (`MuaKhungNen`). Tách từ
  GameKhungRoi 15/10/2026 khi thêm backing track (người dùng: "Cho Mục lối SSA và các thầy khác có nhạc backing track để solo trên đó").
  Hai tay hai màu (người dùng 15/10/2026: "phân biệt cho tôi đâu là tay trái đâu là tay phải chơi"): phím bấm — tay trái là nốt bass thấp
  nhất bạn đã bấm và mọi nốt dưới Mi3 (`CHIA_TAY`, chỗ rải 5 – 8), tay phải là các nốt còn lại; gợi ý — tay trái viền xanh, tay phải viền
  cam, sáng theo thứ tự `lo` (`loN` phím đầu); khi gợi ý đã hiện mà tay chưa bấm thì tên hai tay đứng trên phần gợi ý của tay ấy.
  Nốt NÊN CHƠI (viên của vòng backing — `ssa.nen`; người dùng 15/10/2026: "làm nổi bật nó lên so với các nốt còn lại trong khung"): trước
  khi chồng xong, phím của nốt ★ trong tầm tay phải ghi "★ bậc" trên đầu phím (chồng sao cho nốt trên cùng là một nốt ★); chồng xong thì
  vùng chạy ngay trên thế (tới quãng 9 trên nốt cao nhất) sáng: vàng là nốt nên chơi, xanh nhạt là các nốt còn lại của khung (nốt chạy
  được tính); viền gợi ý các chỗ đặt thế VẪN GIỮ (người dùng 16/10/2026: "Các phím gợi ý sau khi được đánh rồi vẫn sẽ ko mất mà vẫn tiếp
  tục gợi ý" — chồng lại thế giữa câu chạy vẫn thấy chỗ). Cũ (tới 16/10/2026): chồng xong thì viền các chỗ đặt thế tắt đi.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export function BanPhimChong({
  c,
  daChay,
  loN,
  thi,
  thap,
  cao,
  tenThay = '',
  doRo,
}: {
  c: CauSsa
  daChay: readonly number[]
  /** Số phím gợi ý đã hiện (theo thứ tự `c.ssa.lo`). */
  loN: number
  thi: boolean
  thap: number
  cao: number
  tenThay?: string
  /** Độ rõ của gợi ý (0–1) — hiện ngay từ đầu, rõ dần khi viên gần phím đàn. */
  doRo?: number
}) {
  const ssa = c.ssa
  const vua = (ns: readonly number[]) =>
    ns.map((m) => {
      let x = m
      while (x < thap) x += 12
      while (x > cao) x -= 12
      return x
    })
  const goc8 = ssa.bass !== null ? daChay.filter((m) => pc(m) === ssa.bass) : []
  const bassM = goc8.length ? Math.min(...goc8) : null
  const xong = xongChong(c, daChay)
  const tenN = (m: number) => tenPhim(c.k, m).replace(/-?\d+$/, '')
  const laTrai = (m: number) => m === bassM || m < CHIA_TAY
  const ssaTrai = daChay.filter(laTrai)
  const ssaPhai = daChay.filter((m) => !laTrai(m))
  const loSsa = loN > 0 ? ssa.lo.slice(0, loN) : []
  const nhuAnh = ssa.loai === 'nhu-anh'
  const sao = thi ? [] : (ssa.nen ?? [])
  const saoP = sao.map((x) => x.p)
  const tren = sao.length && xong >= 0 ? Math.max(...daChay.slice(0, xong + 1)) : null
  // Vùng chạy: ngay trên nốt cao nhất của thế, tới quãng 9; thế đã sát đầu bàn phím thì lùi xuống cho đủ một quãng tám.
  const den = tren === null ? cao : Math.min(cao, tren + 14)
  const tu = tren === null ? CHIA_TAY : den - tren >= 7 ? tren + 1 : Math.max(CHIA_TAY, den - 14)
  const vung = Array.from({ length: Math.max(0, den - tu + 1) }, (_, i) => tu + i)
  const saoPhim = vung.filter((m) => saoP.includes(pc(m)))
  const moPhim = tren === null ? [] : vung.filter((m) => !saoP.includes(pc(m)) && ssa.dinh.includes(pc(m)))
  const nhanPhim = Object.fromEntries(saoPhim.map((m) => [m, `★${sao.find((x) => x.p === pc(m))!.bac}`]))
  // Chồng xong: viền thế vẫn giữ, trừ phím nốt ★ của vùng chạy — vàng ★ là nốt nên chơi lúc chạy, không để viền thế đè mất.
  const banLo = vua(loSsa.filter((m) => !ssa.loTrai.includes(m))).filter((m) => tren === null || !saoPhim.includes(m))
  // Điện thoại (Đô3 – Đô5): phím tay trái gập lên trùng thế tay phải (Sol2 → Sol3) thì để cho tay phải — chỗ ấy là vùng tay phải.
  const banLoTrai = vua(loSsa.filter((m) => ssa.loTrai.includes(m))).filter((m) => !banLo.includes(m))
  const nhan = {
    trai: bassM !== null ? tenN(bassM) : banLoTrai.length ? (ssa.bass !== null ? tenN(ssa.bass) : tenN(banLoTrai[0]!)) : '',
    traiPhu:
      bassM !== null
        ? ssaTrai.length > 1
          ? ssaTrai.map(tenN).join(' ')
          : 'bass'
        : nhuAnh
          ? `anh gõ ${ssa.loTrai.map(tenN).join(' ')}`
          : ssa.loTrai.length > 1 && ssa.loTrai.every((m) => [c.g, pc(c.g + 7)].includes(pc(m)))
            ? 'bass · rải 5 – 8'
            : ssa.loTrai.length > 1
              ? `bass · ${ssa.loTrai.map(tenN).join(' ')}`
              : 'bass',
    // Dòng to ngắn (tên thế / số nốt chạy) — điện thoại: nhãn dài "Em7 2/4" đè lên nhãn bass (chạy thử 15/10/2026).
    phai: xong >= 0 ? `${daChay.length - xong - 1}/${ssa.soChay}` : ssaPhai.length || banLo.length ? ssa.tenChong : '',
    phaiPhu:
      xong >= 0
        ? `chạy · ${daChay.slice(xong + 1).map(tenN).join(' ')}`
        : ssaPhai.length
          ? `${ssa.chong.filter((p) => ssaPhai.some((m) => pc(m) === p)).length}/${ssa.chong.length} · ${ssaPhai.map(tenN).join(' ')}`
          : nhuAnh
            ? 'thế anh bấm'
            : 'thế chồng · chỗ nào cũng được',
    tong: '',
  }

  return (
    <>
      <BanPhimHaiTay
        trai={vua(ssaTrai)}
        phai={vua(ssaPhai)}
        lo={banLo}
        loTrai={banLoTrai}
        sao={tren === null ? [] : saoPhim}
        mo={moPhim}
        nhanPhim={nhanPhim}
        nhan={nhan}
        lowNote={thap}
        highNote={cao}
        giang={nhuAnh || (ssa.loai === 'vong' && [1, 3, 5, 6, 8, 10].includes(c.k.tonic))}
        doRo={doRo}
      />
      {!thi && nhuAnh && (
        <div className="flex flex-col gap-0.5 text-xs text-cream/85">
          <p>
            <b className="text-cream">{c.ten}</b> · {ssa.nguon} — đúng phím anh bấm (đo bằng hình), quãng tám nào cũng được:
          </p>
          <p>
            <b className="text-teal-key">Tay trái</b> (viền xanh):{' '}
            {ssa.loTrai.length ? <span className="font-mono">{ssa.loTrai.map((m) => tenPhim(c.k, m)).join(' – ')}</span> : 'anh không đánh ở hợp âm này'}
            {ssa.bass !== null ? ` — bass ${tenN(60 + ssa.bass)} thấp nhất.` : '.'}
          </p>
          <p>
            <b className="text-amber-key">Tay phải</b> (viền cam): <span className="font-mono">{ssa.the[0]!.map((m) => tenPhim(c.k, m)).join('–')}</span>{' '}
            ({ssa.tenChong} — các nốt cùng vang, anh rải rồi giữ pedal)
            {ssa.chay.length ? (
              <>
                {' '}
                rồi chạy <span className="font-mono">{ssa.chay.map((m) => tenPhim(c.k, m)).join(' ')}</span> — đủ {ssa.soChay} nốt khác nhau.
              </>
            ) : (
              ' — anh không chạy thêm, chồng xong là đúng.'
            )}
          </p>
        </div>
      )}
      {!thi && !nhuAnh && (
        <div className="flex flex-col gap-0.5 text-xs text-cream/85">
          <p>
            <b className="text-teal-key">Tay trái</b> (viền xanh): bass <span className="font-mono">{tenN(ssa.bass ?? c.g)}</span> thấp nhất —{' '}
            <span className="font-mono">{ssa.loTrai.map((m) => tenPhim(c.k, m)).join(' – ')}</span>
            {ssa.loTrai.length > 1 ? ' (rải thêm nếu muốn — ít nhất là bass)' : ''}.
          </p>
          <p>
            <b className="text-amber-key">Tay phải</b> (viền cam): thế {ssa.tenChong} — {ssa.nguonThe} — ở chỗ nào cũng được, trên bass:{' '}
            <span className="font-mono">{ssa.the.map((t) => t.map((m) => tenPhim(c.k, m)).join('–')).join(' · ')}</span>. Rồi chạy{' '}
            {ssa.soChay} nốt trên đỉnh{tenThay ? ` — nốt chính của ${tenThay}` : ''}:{' '}
            <span className="font-mono">{ssa.dinh.slice(0, 6).map((p) => tenN(60 + p)).join(' ')}</span>.
          </p>
          {sao.length > 0 && (
            <p>
              <b className="text-yellow-300">★ Nên chơi khi vào {c.ten}</b>:{' '}
              {sao.map((x, i) => (
                <span key={x.p}>
                  {i ? ' · ' : ''}
                  <b className="font-mono text-yellow-300">{x.ten}</b> ({x.bac}) — {x.ly}
                </span>
              ))}
              .{' '}
              {tren === null
                ? 'Chồng sao cho nốt trên cùng của thế là một nốt ★ — nốt trên cùng là giai điệu, như anh SSA; chồng xong thì vùng chạy sáng lên.'
                : 'Vùng chạy ngay trên thế: phím vàng ★ là nốt nên chơi, phím xanh nhạt là các nốt còn lại của khung.'}
            </p>
          )}
        </div>
      )}
    </>
  )
}
