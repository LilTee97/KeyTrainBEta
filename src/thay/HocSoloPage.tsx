import { useState } from 'react'
import { playChord, playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { GameChayNgonRoi } from './GameChayNgonRoi'
import { GameKhungRoi } from './GameKhungRoi'
import { GameNotRoi, GameScale } from './GameSolo'
import { BanPhimMau } from './hocSolo/BanPhimMau'
import { NEN, type Muc } from './hocSolo/mauPhim'
import { giangHop, HOI_DAP_SCALE, hopAmHoc, MEO_SOLO, notTrenHop, phanBo, tenChu, THAY_HOC, VAI, type NotHoc, type ThayHoc, type VaiNot } from './hocSolo/chonNot'
import { PHAN_TICH_THAY, type MucThay, type PhanTichThay } from './hocSolo/meoThay'
import { ARP, GAM, ngonArp, ngonGam, tenNot, type LoaiArp, type LoaiGam, type Tay } from './hocSolo/gamNgon'
import { nguCanh } from './soanCau/giaiThich'
import { GOC } from './vongThay'

/*
  Trang HỌC SOLO — người dùng 11/10/2026: "Hãy làm thêm một tab Học Solo để: Bạn trong vai gia sư piano dạy cho tôi cách chọn nốt từ mỗi
  hợp âm để chạy nốt trên đàn Piano · Phân tích cách chọn nốt của 3 thầy … làm thành 4 lựa chọn để học theo từng thầy · Có phải Scales và
  Apreggios là cơ sở để chọn nốt ko, nếu đúng thì hãy dạy tôi về chúng luôn · tổng hợp ra các quy luật rồi làm thành mẹo · Game chạy ngón
  và Game Scale". Số đo ở `hocSolo/chonNot.ts`; ngón ở `hocSolo/gamNgon.ts`.
*/

const TAB = [
  { id: 'chon-not', ten: 'Chọn nốt theo thầy' },
  { id: 'scale', ten: 'Scale & Arpeggio' },
  { id: 'meo', ten: 'Mẹo & quy tắc' },
  // Game chạy ngón rơi như Game công thức — người dùng duyệt đạt 15/10/2026, thay hẳn bản không rơi (đã xoá).
  { id: 'game-ngon', ten: 'Game chạy ngón' },
  { id: 'mua-khung', ten: 'Game nốt rơi' },
  { id: 'game-scale', ten: 'Game Scale' },
  { id: 'not-roi', ten: 'Nốt rơi cũ (câu thầy)' },
] as const

const nutTab = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const the = 'rounded-xl border border-line bg-black/25 p-4 text-sm'
const pc = (x: number) => ((x % 12) + 12) % 12

const mucCua = (x: NotHoc): Muc =>
  x.vai === 'khung' || (x.pct ?? 0) >= 10 ? 'dam' : (x.vai === 'tranh' || x.vai === 'ngoai') && !x.pct ? 'khong' : 'mo'

const ngheNot = async (ds: readonly number[], giay = 0.32) => {
  await startAudio()
  playChordSequence(
    ds.map((m) => [m]),
    giay,
  )
}

function ChonGiong({ tonic, thu, doi }: { tonic: number; thu: boolean; doi: (tonic: number, thu: boolean) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
      <span>Giọng:</span>
      <select
        value={tonic}
        onChange={(event) => doi(Number(event.target.value), thu)}
        className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
        aria-label="Giọng"
      >
        {GOC.map((ten, k) => (
          <option key={ten} value={k}>
            {ten}
          </option>
        ))}
      </select>
      {[false, true].map((v) => (
        <button key={String(v)} type="button" onClick={() => doi(tonic, v)} className={nut(thu === v)}>
          {v ? 'thứ' : 'trưởng'}
        </button>
      ))}
    </div>
  )
}

const THU_TU_VAI: readonly VaiNot[] = ['khung', 'mau', 'nha', 'gam', 'blue', 'tranh', 'ngoai']

/** Tab CHỌN NỐT THEO THẦY — 4 lựa chọn; mỗi hợp âm: nốt nào, vai gì, thầy chọn bao nhiêu phần trăm, lời gia sư. */
function ChonNotTab() {
  const [thay, setThay] = useState<ThayHoc>('gia-su')
  const [tonic, setTonic] = useState(0)
  const [thu, setThu] = useState(false)
  const [k, setK] = useState(0)
  const hops = hopAmHoc(thay, thu)
  const hop = hops[Math.min(k, hops.length - 1)]!
  const nots = notTrenHop(thay, hop, thu)
  const p = phanBo(thay, hop, thu)
  const tt = THAY_HOC.find((x) => x.id === thay)!
  const { h, n } = nguCanh(tonic, thu)
  const goc = pc(tonic + hop.goc)
  const ivCua = (m: number) => pc(m - goc)
  const notCua = (m: number) => nots[ivCua(m)]!
  /* Tên nốt theo giọng (Mi♭ chứ không Rê♯ ở Đô trưởng) — như lời giảng; nốt blue ♭5 ghi giáng. */
  const tenPhim = (m: number) => n(pc(m - tonic), notCua(m).vai === 'blue' && pc(m - tonic) === 6 ? 5 : undefined)
  /* Trên phím: ký hiệu chữ theo bậc ghi dưới phím (`tenChu`) — bậc Blues tính từ chủ âm, thầy khác từ gốc hợp âm. */
  const chuGoc = thay === 'blues' ? h(0, '') : h(hop.goc, '')
  const chuPhim = (m: number) => tenChu(m, chuGoc, notCua(m).bac) ?? `${h(pc(m - tonic), '')}${Math.floor(m / 12) - 1}`
  const ten = h(hop.goc, hop.chat)
  const KHUNG_IV = hop.loai === 'truong' ? [0, 4, 7] : hop.loai === 'thu' ? [0, 3, 7] : hop.loai === 'at' ? [0, 4, 7, 10] : [0, 3, 6]
  const hopAm = KHUNG_IV.map((x) => 48 + goc + x)
  const gamBai =
    thay === 'blues' ? (thu ? [0, 3, 5, 6, 7, 10] : [0, 2, 3, 4, 7, 9]) : thu ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]

  const bamNghe = async (m: number) => {
    await startAudio()
    playChord(hopAm, '2n', 70)
    playChord([m], '4n', 100)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {THAY_HOC.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setThay(x.id)
              setK(0)
            }}
            className={nut(thay === x.id)}
          >
            {x.ten}
          </button>
        ))}
      </div>
      <div className={the}>
        <p className="text-cream/90">{tt.tom}</p>
        <p className="mt-1 text-xs text-dim">Cơ sở: {tt.coSo}</p>
      </div>
      <ChonGiong
        tonic={tonic}
        thu={thu}
        doi={(t, v) => {
          setTonic(t)
          setThu(v)
          setK(0)
        }}
      />
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-dim">Hợp âm:</span>
        {hops.map((x, j) => (
          <button key={x.laMa} type="button" onClick={() => setK(j)} className={nut(j === Math.min(k, hops.length - 1))}>
            {h(x.goc, x.chat)} <span className="text-dim">({x.laMa})</span>
          </button>
        ))}
      </div>

      <div className={the}>
        <p className="mb-2 font-semibold text-cream">
          Trên {ten} ({hop.laMa}) — {tt.ten} chọn nốt nào?
        </p>
        <BanPhimMau
          thap={60}
          cao={84}
          muc={(m) => mucCua(notCua(m))}
          nhan={(m) => ({
            ten: chuPhim(m),
            phu: (
              <>
                <span>{notCua(m).bac}</span>
                {notCua(m).pct !== null && <b>{notCua(m).pct}%</b>}
              </>
            ),
          })}
          onBam={(m) => void bamNghe(m)}
        />
        <p className="mt-1 text-[11px] text-dim">
          Bấm một phím: nghe hợp âm {ten} cùng nốt ấy — tai nhận ra nốt khung, nốt màu, nốt tránh.{' '}
          {thay === 'blues' ? 'Bậc ghi theo CHỦ ÂM (Blues nghĩ theo chủ âm).' : 'Bậc ghi theo gốc hợp âm.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cream/85">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={NEN.dam.trang} />
            Xanh — nốt chính: nốt của hợp âm, và nốt thầy dùng từ 10 % trở lên
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={NEN.mo.trang} />
            Cam — dùng được, thêm đẹp: nốt màu, nốt đi qua, nốt thầy có lướt qua
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-line" style={NEN.khong.trang} />
            Không màu — nên tránh, thầy không đánh
          </span>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-x-4 text-xs sm:grid-cols-2">
          {[...nots]
            .filter((x) => x.vai !== 'ngoai' || x.pct !== null)
            .sort(
              (a, b) =>
                ['dam', 'mo', 'khong'].indexOf(mucCua(a)) - ['dam', 'mo', 'khong'].indexOf(mucCua(b)) ||
                (b.pct ?? -1) - (a.pct ?? -1) ||
                THU_TU_VAI.indexOf(a.vai) - THU_TU_VAI.indexOf(b.vai),
            )
            .map((x) => (
              <li key={x.iv} className={NEN[mucCua(x)].chu}>
                {chuPhim(60 + goc + x.iv).replace(/-?\d+$/, '')} <span className="text-dim">({tenPhim(60 + goc + x.iv)}) bậc {x.bac}</span> — {VAI[x.vai].ten}
                {x.pct !== null && <b className="ml-1">{x.pct} %</b>}
              </li>
            ))}
        </ul>
        <p className="mt-3 text-cream/90">
          <span className="text-teal-key">Gia sư giảng: </span>
          {giangHop(thay, hop, tonic, thu)}
        </p>
        <p className="mt-1 text-xs text-dim">
          Cơ sở: {p ? `${p.nguon} · n=${p.n}${Object.values(p.pct).reduce((a, b) => a + b, 0) < 90 ? ' · các bậc còn lại rải rác, md không ghi' : ''}` : 'lý thuyết — lời gia sư của Claude.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={() => void ngheNot([...KHUNG_IV, 12].map((x) => 60 + goc + x))} className={nut(false)}>
            ▶ Rải hợp âm (arpeggio)
          </button>
          <button
            type="button"
            onClick={() => {
              const len = [...gamBai, 12].map((x) => 60 + pc(tonic) + x)
              void ngheNot([...len, ...len.slice(0, -1).reverse()], 0.26)
            }}
            className={nut(false)}
          >
            ▶ Gam của bài ({thay === 'blues' ? (thu ? 'blues thứ' : 'ngũ cung + ♭3') : thu ? 'thứ tự nhiên' : 'trưởng'})
          </button>
        </div>
      </div>
    </div>
  )
}

type XemScale = { loai: 'gam'; id: LoaiGam } | { loai: 'arp'; id: LoaiArp }

/** Tab SCALE & ARPEGGIO — trả lời "có phải cơ sở để chọn nốt không", rồi xem từng gam / hợp âm rải với ngón. */
function ScaleTab() {
  const [xem, setXem] = useState<XemScale>({ loai: 'gam', id: 'truong' })
  const [goc, setGoc] = useState(0)
  const [tay, setTay] = useState<Tay>('phai')
  const dl = xem.loai === 'gam' ? GAM.find((g) => g.id === xem.id)! : ARP.find((a) => a.id === xem.id)!
  const day = (tay === 'phai' ? 60 : 48) + goc
  const len = [...dl.iv, 12].map((x) => day + x)
  const ngon = xem.loai === 'gam' ? ngonGam(xem.id, goc, tay) : ngonArp(xem.id, goc, tay)
  const ngonCua = (m: number) => (ngon ? ngon[len.indexOf(m)] : undefined)
  const bacCua = (m: number) => {
    const k = len.indexOf(m)
    return k < 0 ? null : dl.bac[k % dl.bac.length]!
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={the}>
        <h3 className="mb-2 font-semibold text-cream">Scale và Arpeggio có phải cơ sở để chọn nốt không?</h3>
        {HOI_DAP_SCALE.map((x) => (
          <div key={x.y} className="mb-2">
            <p className="font-semibold text-amber-key">{x.y}</p>
            <p className="text-cream/85">{x.giai}</p>
            <p className="text-xs text-dim">Cơ sở: {x.coSo}</p>
          </div>
        ))}
      </div>

      <div className={the}>
        <h3 className="mb-2 font-semibold text-cream">Xem từng gam, từng hợp âm rải — nốt và ngón</h3>
        <div className="mb-1 flex flex-wrap gap-1.5 text-xs">
          {GAM.map((g) => (
            <button key={g.id} type="button" onClick={() => setXem({ loai: 'gam', id: g.id })} className={nut(xem.loai === 'gam' && xem.id === g.id)}>
              {g.ten}
            </button>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
          {ARP.map((a) => (
            <button key={a.id} type="button" onClick={() => setXem({ loai: 'arp', id: a.id })} className={nut(xem.loai === 'arp' && xem.id === a.id)}>
              {a.ten}
            </button>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-dim">
          <span>Gốc:</span>
          <select value={goc} onChange={(event) => setGoc(Number(event.target.value))} className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream" aria-label="Gốc">
            {GOC.map((ten, k) => (
              <option key={ten} value={k}>
                {ten}
              </option>
            ))}
          </select>
          {(['phai', 'trai'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTay(t)} className={nut(tay === t)}>
              {t === 'phai' ? 'Tay phải' : 'Tay trái'}
            </button>
          ))}
        </div>
        <BanPhimMau
          thap={tay === 'phai' ? 60 : 48}
          cao={tay === 'phai' ? 84 : 72}
          muc={(m) => (len.includes(m) ? 'dam' : 'khong')}
          nhan={(m) =>
            len.includes(m)
              ? {
                  ten: tenChu(m, nguCanh(goc, dl.thu).h(0, ''), bacCua(m)) ?? tenNot(m, goc, dl.thu),
                  phu: (
                    <>
                      <span>{bacCua(m)}</span>
                      {ngonCua(m) !== undefined && <b className="rounded-full bg-ink/80 px-1 text-amber-key">{ngonCua(m)}</b>}
                    </>
                  ),
                }
              : null
          }
          onBam={(m) => void ngheNot([m])}
        />
        <p className="mt-2 text-cream/90">
          <b>{dl.ten}</b>
          {'congThuc' in dl && <span className="text-dim"> — {dl.congThuc}</span>}
        </p>
        <p className="text-cream/85">{dl.dung}</p>
        <p className="mt-1 text-xs text-dim">
          {ngon
            ? `Ngón ${tay === 'phai' ? 'tay phải' : 'tay trái'} đi lên: ${ngon.join(' ')} · đi xuống đọc ngược. Ngón chuẩn sách piano — kỹ thuật chung, không phải số đo thầy.`
            : 'Chưa có ngón chuẩn trong app cho gam / gốc này — tự chọn sao cho ngón cái không đặt lên phím đen.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={() => void ngheNot([...len, ...len.slice(0, -1).reverse()], 0.3)} className={nut(false)}>
            ▶ Đi lên – đi xuống
          </button>
        </div>
      </div>
    </div>
  )
}

function DanhSachMuc({ ds }: { ds: readonly MucThay[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {ds.map((m) => (
        <li key={m.ten}>
          <p className="font-semibold text-amber-key">{m.ten}</p>
          <p className="text-cream/85">{m.cau}</p>
          <p className="text-xs text-dim">Cơ sở: {m.coSo}</p>
        </li>
      ))}
    </ul>
  )
}

/**
 * Phân tích + quy tắc + mẹo riêng của MỘT thầy (người dùng 11/10/2026: "phân tích theo từng thầy, sau đó làm mẹo riêng để học cách soạn
 * nốt của từng thầy"). Số chép từ md của thầy — `hocSolo/meoThay.ts`.
 */
function MeoMotThay({ t }: { t: PhanTichThay }) {
  const goiThay = t.id === 'ca-phao' ? 'anh' : t.id === 'linh-nhi' ? 'chị' : 'người chơi Blues'
  return (
    <>
      <div className={the}>
        <h3 className="mb-1 font-semibold text-cream">Chân dung — {t.ten}</h3>
        <p className="text-cream/90">{t.chanDung}</p>
        <p className="mt-2 text-xs text-dim">Nguồn: {t.nguon} Lời chân dung, quy tắc, mẹo là lời gia sư của Claude viết trên các số ấy.</p>
      </div>
      <div className={the}>
        <h3 className="mb-2 font-semibold text-cream">Phân tích — số đo</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[minmax(9rem,15rem)_1fr]">
          {t.soDo.map((x) => (
            <div key={x.muc} className="contents">
              <dt className="font-semibold text-teal-key">{x.muc}</dt>
              <dd className="text-cream/85">{x.so}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={the}>
        <h3 className="mb-2 font-semibold text-cream">Quy tắc soạn nốt của {goiThay}</h3>
        <DanhSachMuc ds={t.quyTac} />
      </div>
      <div className={the}>
        <h3 className="mb-2 font-semibold text-cream">Mẹo riêng — soạn nốt như {t.ten}</h3>
        <DanhSachMuc ds={t.meo} />
        <p className="mt-3 text-xs text-dim">
          Tập ngay: tab Nốt rơi cũ (câu thầy) → nút {t.ten} → bộ soạn của {goiThay} soạn câu trên hợp âm hay vòng của bạn để bạn bấm theo.
        </p>
      </div>
    </>
  )
}

/** Tab MẸO & QUY TẮC — chung (quy luật rút từ số đo các thầy) hoặc riêng từng thầy. */
function MeoTab() {
  const [xem, setXem] = useState<'chung' | PhanTichThay['id']>('chung')
  const nhom = [...new Set(MEO_SOLO.map((m) => m.nhom))]
  const t = PHAN_TICH_THAY.find((x) => x.id === xem)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button type="button" onClick={() => setXem('chung')} className={nut(xem === 'chung')}>
          Chung — gia sư
        </button>
        {PHAN_TICH_THAY.map((x) => (
          <button key={x.id} type="button" onClick={() => setXem(x.id)} className={nut(xem === x.id)}>
            {x.ten}
          </button>
        ))}
      </div>
      {t ? <MeoMotThay t={t} /> : <MeoChung nhom={nhom} />}
    </div>
  )
}

function MeoChung({ nhom }: { nhom: readonly string[] }) {
  return (
    <>
      <div className={the}>
        <p className="text-cream/90">
          Mẹo dưới đây tổng hợp từ số đo câu solo của các thầy (Cà Pháo, Linh Nhi, Blues — và Tôn Hùng trong luật chung). Mỗi mẹo kèm cơ sở:
          số nào đo trên mấy bài. Hai mẹo ngón tay là kỹ thuật chung của sách piano, không phải số đo thầy.
        </p>
      </div>
      {nhom.map((nh) => (
        <div key={nh} className={the}>
          <h3 className="mb-2 font-semibold text-cream">{nh}</h3>
          <DanhSachMuc ds={MEO_SOLO.filter((m) => m.nhom === nh)} />
        </div>
      ))}
    </>
  )
}

/** Trang HỌC SOLO. */
export function HocSoloPage() {
  const [tab, setTab] = useState<(typeof TAB)[number]['id']>('chon-not')
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold">Học Solo</h2>
        {TAB.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={nutTab(tab === t.id)}>
            {t.ten}
          </button>
        ))}
      </div>
      {tab === 'chon-not' && <ChonNotTab />}
      {tab === 'scale' && <ScaleTab />}
      {tab === 'meo' && <MeoTab />}
      {tab === 'game-ngon' && <GameChayNgonRoi />}
      {tab === 'mua-khung' && <GameKhungRoi />}
      {tab === 'not-roi' && <GameNotRoi />}
      {tab === 'game-scale' && <GameScale />}
    </section>
  )
}
