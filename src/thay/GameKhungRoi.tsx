import { useMemo, useRef, useState } from 'react'
import { playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiNote } from '../shared/musicTheory/types'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { ChonMoc, VungRoi } from './GameChong'
import { chonCauKhung, duKhung, MAN_KHUNG, ngoaiKhung, type CauKhung, type LuaChonKhung } from './hocSolo/mauKhung'
import { tenPhim } from './hocSolo/khungNot'
import { THAY_CHAY, type ThayChay } from './hocSolo/cauThay'
import { chamThay, chonCauThay, manThay, tenThayCua } from './hocSolo/thayNhac'
import { DAT_THI, GOC_CHOI, SO_CAU_THI, type Ben, type GocChoi } from './soanCau/gameChong'
import { capKyLuc, docKyLuc, ghiKyLuc, useMuaRoi, useNotXuong } from './useMuaRoi'

/*
  MƯA KHUNG NỐT — game rơi kiểu Game công thức (Mưa hợp âm) cho khung nốt: tên hợp âm rơi, bấm đủ các nốt khung của nó (hay chọn đúng tên
  khung) trước khi chạm đáy. Màn theo QUY TẮC nối các nhóm đuôi (`hocSolo/mauKhung.ts`): bên luyện, viên ghi quy tắc so với loại cha ("từ
  Cmaj7: B → B♭") và tên khung, quá 60 % quãng rơi thì phím khung sáng dần; bên thi chỉ tên hợp âm, 20 viên, đúng từ 16 là Đạt. Khung
  dài 6–8 nốt nên rơi lâu hơn Mưa hợp âm: mặc định bên luyện 20 s, bên thi 14 s (Claude chọn, chưa đo — lùi nếu người dùng thấy chậm).
  Người dùng 15/10/2026: "thiết kế rơi như game công thức … khi nhấn vào thì mở hẳn ra một phần game và có bàn phím dài".
  Nút thầy (thử, 15/10/2026 — người dùng: "hình thành 3 nút riêng mang phong cách của từng thầy (từ hợp âm cho đến nốt solo) … học solo
  theo từng nhóm đuôi … Bộ soạn nốt … biết khung nốt solo của từng thầy"): mỗi thầy một nút; màn là các nhóm đuôi của thầy, hợp âm đúng
  loại và bậc bộ soạn của thầy hay đặt, bấm đủ nốt CHÍNH của thầy (`hocSolo/thayNhac.ts` — đo trên bộ soạn); nốt thầy không đánh là sai,
  nốt thầy đánh ít không tính. Duyệt đạt thì bỏ chữ "(thử)". (Bản gộp ba thầy một nút trước đó — người dùng bác, đã bỏ.)
*/

type Vien = CauKhung & { khungTen: string; chinh?: number[]; tranh?: number[] }
type Bo = 'quy-tac' | ThayChay
type CachNhap = 'chay' | 'chon'

const pc = (x: number) => ((x % 12) + 12) % 12
const KHO = 'keytrain.mua-khung.v1'
const MOC_MAC_DINH: Readonly<Record<Ben, number>> = { meo: 20, thi: 14 }
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/80 hover:bg-white/8'}`
const GOC_TEN: readonly { id: GocChoi; ten: string }[] = [
  { id: 'do', ten: 'Chỉ gốc Đô' },
  { id: 'trang', ten: 'Gốc phím trắng' },
  { id: 'tat', ten: 'Cả 12 gốc' },
]
const NHAP: readonly { id: CachNhap; ten: string; mo: string }[] = [
  { id: 'chay', ten: 'Chạy nốt khung', mo: 'đàn MIDI · phím máy tính · chạm phím — bấm từng nốt của khung, thứ tự nào cũng được' },
  { id: 'chon', ten: 'Chọn tên khung', mo: 'bốn nút to — bấm nút là nghe và thấy khung ấy; hợp điện thoại' },
]

/** Nốt khung đặt từ gốc ở quãng tám 4, đi lên — để nghe và để hé lộ trên bàn phím. */
const khungLen = (g: number, pcs: readonly number[]) => pcs.map((p) => 60 + g + pc(p - g)).sort((a, b) => a - b)
const ngheKhung = async (g: number, pcs: readonly number[]) => {
  await startAudio()
  const ds = khungLen(g, pcs)
  playChordSequence(
    [...ds, ds[0]! + 12].map((m) => [m as MidiNote]),
    0.22,
  )
}

export function GameKhungRoi() {
  useLiveSound()
  useComputerKeyboard(60)
  const [kyLuc, setKyLuc] = useState(() => docKyLuc(KHO))
  const [ben, setBen] = useState<Ben>('meo')
  const [man, setMan] = useState(0)
  const [gocChoi, setGocChoi] = useState<GocChoi>('do')
  const [nhap, setNhap] = useState<CachNhap>('chay')
  const [moc, setMoc] = useState<Record<Ben, number>>({ ...MOC_MAC_DINH })
  const [choNot, setChoNot] = useState(false)
  const [bo, setBo] = useState<Bo>('quy-tac')
  const thi = ben === 'thi'
  const laThay = bo !== 'quy-tac'
  const tenThay = laThay ? tenThayCua(bo) : ''
  const DS: readonly { ten: string; goiY: string; quyTac: readonly string[] }[] = useMemo(() => (bo === 'quy-tac' ? MAN_KHUNG : manThay(bo)), [bo])
  /** Màn thầy chỉ chạy nốt (chưa có bốn nút chọn). */
  const cachNhap: CachNhap = laThay ? 'chay' : nhap
  const khoaKyLuc = (k: number) => `${laThay ? `${bo}|` : ''}${k}${moc.thi !== MOC_MAC_DINH.thi ? `|${moc.thi}s` : ''}`
  /* Máy rơi chung (`useMuaRoi`) — đồng hồ, sinh viên, trượt, chờ, chấm; tách từ file này 15/10/2026, hành vi giữ nguyên. */
  const may = useMuaRoi<Vien>({
    thi,
    choNot,
    giay: moc[ben],
    tao: (sai, truoc) => {
      if (bo !== 'quy-tac') return chonCauThay(bo, man, GOC_CHOI[gocChoi], sai, truoc)
      const cau = chonCauKhung(man, GOC_CHOI[gocChoi], sai, truoc)
      return { ...cau, khungTen: cau.quyTac }
    },
    soLo: (v) => (v.chinh ? v.chinh.length : v.k.not.length),
    choChu: (d) =>
      d.chinh
        ? `Viên ${d.ten} đang chờ — bấm đủ ${d.chinh.length} nốt chính của thầy để mưa rơi tiếp.`
        : `Viên ${d.ten} đang chờ — chạy đủ khung (${d.goiY.replace(/^khung /, '')}) để mưa rơi tiếp.`,
    khiXong: (v, dung) => {
      if (dung) void ngheKhung(v.g, v.chinh ?? v.k.not.map((n) => n.p))
    },
    khiXongThi: (dung, diem) =>
      setKyLuc((cu) => {
        const moi = capKyLuc(cu, khoaKyLuc(man), dung, diem)
        ghiKyLuc(KHO, moi)
        return moi
      }),
  })
  const { g, dich } = may
  /** Nút tên khung vừa bấm: hiện khung ấy trên đàn một lúc. */
  const phu = useRef({ daBam: null as null | { lc: LuaChonKhung; het: number } }).current

  async function batDau(b: Ben, k: number) {
    setBen(b)
    setMan(k)
    phu.daBam = null
    await may.batDau()
  }
  function doiMoc(s: number) {
    may.doiRoi(s)
    setMoc((m) => ({ ...m, [ben]: s }))
  }
  function doiCho() {
    if (choNot) may.boCho()
    setChoNot((x) => !x)
  }
  function chonTen(lc: LuaChonKhung) {
    const v = may.dangDich()
    if (g.pha !== 'choi' || !v) return
    const daBam = { lc, het: performance.now() + 1800 }
    phu.daBam = daBam
    setTimeout(() => {
      if (phu.daBam !== daBam) return
      phu.daBam = null
      may.ve()
    }, 1800)
    if (lc.ten === v.dapAnTen) return may.giai(v)
    void ngheKhung(v.g, lc.pcs)
    may.saiLan(v, `Chưa đúng — ${lc.ten} không phải khung của ${v.ten}. ${v.quyTac}.`)
  }

  /* Chạy nốt: mỗi cú bấm xuống (mọi nguồn) — nghe thẳng kho MIDI, mỗi cú một lần (bấm nhiều nốt cùng lúc vẫn đếm đủ). */
  useNotXuong((note) => {
    const v = may.dangDich()
    if (cachNhap !== 'chay' || g.pha !== 'choi' || !v) return
    if (v.chinh && v.tranh) {
      const r = chamThay({ chinh: v.chinh, tranh: v.tranh }, note, g.daChay)
      if (r.kq === 'dung') return may.giai(v)
      if (r.kq === 'sai') return may.saiLan(v, `Chưa đúng — thầy không đánh ${tenPhim(v.k, note)} trên ${v.ten}. ${v.quyTac}.`)
      if (r.kq === 'mo') g.bao = { loai: 'sai', chu: `${tenPhim(v.k, note)} dùng được nhưng không phải nốt chính của thầy trên ${v.ten} — chưa tính.` }
      else g.daChay = r.daChay
      return may.ve()
    }
    if (ngoaiKhung(note, v)) return may.saiLan(v, `Chưa đúng — ${tenPhim(v.k, note)} không thuộc khung ${v.goiY.replace(/^khung /, '')} của ${v.ten}. ${v.quyTac}.`)
    if (!g.daChay.some((m) => pc(m) === pc(note))) g.daChay = [...g.daChay, note]
    if (duKhung(new Set(g.daChay.map(pc)), v)) may.giai(v)
    else may.ve()
  })

  const hep = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84
  const kl = (k: number) => kyLuc[khoaKyLuc(k)]

  if (g.pha === 'chuan-bi' || g.pha === 'het')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h4 className="text-lg font-semibold text-cream">
          {laThay ? `Mưa nốt ${tenThay} — học theo nhóm đuôi của ${tenThay}` : 'Mưa khung nốt — học khung theo quy tắc nối các nhóm đuôi'}
        </h4>
        {/* Nút thầy (thử, 15/10/2026): mỗi thầy một nút — duyệt đạt thì bỏ chữ "(thử)". */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setBo('quy-tac')} className={nut(!laThay)} aria-pressed={!laThay}>
            Màn quy tắc nhóm đuôi
          </button>
          {THAY_CHAY.map((t) => (
            <button key={t.id} type="button" onClick={() => setBo(t.id)} className={nut(bo === t.id)} aria-pressed={bo === t.id}>
              {t.ten} (thử)
            </button>
          ))}
        </div>
        {g.pha === 'het' && (
          <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
            {thi && g.dung + g.sai >= SO_CAU_THI ? (
              <p className="text-base text-cream">
                Màn {man + 1} · {DS[man]!.ten} · rơi {moc.thi} s:{' '}
                <b className={g.dung >= DAT_THI ? 'text-teal-key' : 'text-rose-300'}>
                  {g.dung >= DAT_THI ? `ĐẠT ✓ ${g.dung}/${SO_CAU_THI}` : `Chưa đạt ${g.dung}/${SO_CAU_THI} — cần ${DAT_THI}`}
                </b>{' '}
                · {g.diem} điểm
              </p>
            ) : (
              <p className="text-base text-cream">
                Dừng — <b className="text-amber-key">{g.diem} điểm</b> · đúng {g.dung} · sai / trượt {g.sai}
              </p>
            )}
            {g.saiCau.length > 0 && (
              <div className="mt-2 text-xs text-cream/85">
                <p className="mb-1 text-dim">{laThay ? 'Hợp âm cần ôn' : 'Khung cần ôn'}:</p>
                <ul className="flex flex-col gap-1">
                  {[...new Map(g.saiCau.map((v) => [`${v.id}${v.g}`, v])).values()].map((v) => (
                    <li key={`${v.id}${v.g}`}>
                      <b className="font-mono text-cream">{v.ten}</b>
                      <span className="block text-dim">{v.meo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {laThay ? (
          <p className="text-xs text-dim">
            Hợp âm rơi theo đúng LOẠI và BẬC mà bộ soạn của {tenThay} hay đặt — mỗi màn một nhóm đuôi của {tenThay}. Viên viền cam là viên
            đang đố: bấm đủ các nốt CHÍNH của {tenThay} trên hợp âm ấy — nốt hợp âm và nốt bộ soạn của thầy đánh từ 10 % (thứ tự nào, quãng tám
            nào cũng được). Nốt thầy không đánh lần nào là sai; nốt thầy đánh ít không tính. Số đo trên bộ soạn (kèm số trên sheet để so) ở
            bảng "Thầy chọn nốt thế nào".
          </p>
        ) : (
          <p className="text-xs text-dim">
            Tên hợp âm rơi xuống. Viên viền cam là viên đang đố: bấm đủ các nốt KHUNG của nó (thứ tự nào, quãng tám nào cũng được) trước khi
            viên chạm đáy — hay chọn đúng tên khung. Mỗi màn là một quy tắc nối các nhóm đuôi: học loại cha rồi suy ra loại con bằng một thay
            đổi nhỏ. Khung nốt từng loại xem kỹ ở tab Game chạy ngón.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              {laThay
                ? 'Viên ghi bậc, giọng và số nốt chính của thầy. Rơi quá 60 % thì phím nốt chính sáng dần. Không mất mạng.'
                : 'Viên ghi quy tắc so với loại cha ("từ Cmaj7: B → B♭") và tên khung. Rơi quá 60 % thì phím khung sáng dần. Không mất mạng.'}
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.meo} doi={(s) => setMoc((m) => ({ ...m, meo: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={choNot} onChange={() => setChoNot((x) => !x)} />
                Chờ đúng nốt — viên dừng ở gần đáy, đợi bạn {laThay ? 'bấm đủ nốt chính' : 'chạy đủ khung'} mới rơi tiếp
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              {DS.map((m, k) => (
                <button key={m.ten} type="button" onClick={() => void batDau('meo', k)} className={nut(false)} title={m.goiY}>
                  {k + 1}. {m.ten} <span className="text-[11px] text-dim">· {m.goiY}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-key/40 p-3">
            <p className="font-semibold text-amber-key">Thi không mẹo — chấm đạt</p>
            <p className="mb-2 text-xs text-dim">
              Chỉ tên hợp âm, không hiện {laThay ? 'nốt thầy' : 'khung'}. {SO_CAU_THI} viên một lượt, sai lần đầu là tính sai; đúng từ {DAT_THI} là Đạt màn. Kỷ lục ghi
              riêng theo mốc tốc độ.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.thi} doi={(s) => setMoc((m) => ({ ...m, thi: s }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              {DS.map((m, k) => {
                const r = kl(k)
                return (
                  <button key={m.ten} type="button" onClick={() => void batDau('thi', k)} className={nut(false)}>
                    {k + 1}. {m.ten}{' '}
                    <span className={`text-[11px] ${r && r.tot >= DAT_THI ? 'text-teal-key' : 'text-dim'}`}>
                      · {r ? (r.tot >= DAT_THI ? `Đạt ✓ ${r.tot}/${SO_CAU_THI}` : `chưa đạt · tốt nhất ${r.tot}/${SO_CAU_THI}`) : 'chưa thi'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="mb-1 text-xs text-dim">{laThay ? 'Giọng (chủ âm)' : 'Gốc'}</p>
            <div className="flex flex-wrap gap-1.5">
              {GOC_TEN.map((x) => (
                <button key={x.id} type="button" onClick={() => setGocChoi(x.id)} className={nut(gocChoi === x.id)}>
                  {x.ten}
                </button>
              ))}
            </div>
          </div>
          {!laThay && (
          <div>
            <p className="mb-1 text-xs text-dim">Cách nhập</p>
            <div className="flex flex-wrap gap-1.5">
              {NHAP.map((x) => (
                <button key={x.id} type="button" onClick={() => setNhap(x.id)} className={nut(nhap === x.id)} title={x.mo}>
                  {x.ten}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-dim">{NHAP.find((x) => x.id === nhap)!.mo}</p>
          </div>
          )}
        </div>
        <MidiConnect />
      </div>
    )

  /* Bàn phím dài như Mưa hợp âm: tay trái sáng gốc của viên đích; tay phải là các nốt khung đã chạy; viền cam là khung đang hé lộ. */
  const vua = (ns: readonly number[]) =>
    ns.map((m) => {
      let x = m
      while (x < thap) x += 12
      while (x > cao) x -= 12
      return x
    })
  const daBam = phu.daBam && performance.now() < phu.daBam.het ? phu.daBam.lc : null
  const loN = may.loCua(dich)
  const banTrai = dich ? vua([48 + dich.g]) : []
  const banPhai = daBam && dich ? vua(khungLen(dich.g, daBam.pcs)) : vua(g.daChay)
  const banLo = dich && loN > 0 && !daBam ? vua(khungLen(dich.g, dich.chinh ?? dich.k.not.map((n) => n.p)).slice(0, loN)) : []
  const nhan = {
    trai: dich ? dich.ten.replace(/ · .*$/, '').match(/^[A-G][♭♯]?/)?.[0] ?? '' : '',
    traiPhu: dich ? 'gốc' : '',
    phai: daBam ? daBam.ten : dich && g.daChay.length ? `${new Set(g.daChay.map(pc)).size}/${dich.chinh?.length ?? dich.k.not.length}` : '',
    phaiPhu: daBam ? '' : dich && g.daChay.length ? g.daChay.map((m) => tenPhim(dich.k, m).replace(/\d+$/, '')).join(' ') : '',
    tong: '',
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/25 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={`text-xs font-semibold ${thi ? 'text-amber-key' : 'text-teal-key'}`}>{thi ? 'THI' : 'LUYỆN CÓ MẸO'}</span>
        <span className="text-cream">
          Điểm <b className="font-mono text-lg text-amber-key">{g.diem}</b>
        </span>
        <span className="text-cream">
          Combo <b className="font-mono text-lg text-teal-key">×{g.combo}</b>
        </span>
        {thi && (
          <span className="text-cream">
            Viên <b className="font-mono">{Math.min(SO_CAU_THI, g.dung + g.sai + 1)}/{SO_CAU_THI}</b> · đúng <b className="font-mono text-teal-key">{g.dung}</b>
          </span>
        )}
        <span className="text-xs text-dim">
          Màn {man + 1} · {DS[man]!.ten}
          {thi ? ` · rơi ${moc.thi} s` : ''}
        </span>
        <span className="ml-auto flex gap-1.5">
          <button type="button" onClick={may.tamDung} className={nut(false)}>
            {g.pha === 'dung' ? 'Tiếp tục' : 'Tạm dừng'}
          </button>
          <button type="button" onClick={may.ketThuc} className={nut(false)}>
            Dừng
          </button>
        </span>
      </div>
      {!thi && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ChonMoc giay={moc.meo} doi={doiMoc} />
          <label className="flex items-center gap-1.5 text-xs text-cream/85">
            <input type="checkbox" checked={choNot} onChange={doiCho} />
            Chờ đúng nốt
          </label>
        </div>
      )}

      <VungRoi vien={g.vien} dich={dich} bayGio={may.bayGio} tick={may.tick} chay={g.pha === 'choi'} meo={!thi} />

      <p
        className={`min-h-10 text-sm ${g.bao?.loai === 'dung' ? 'text-teal-key' : g.bao?.loai === 'truot' ? 'text-rose-300' : 'text-amber-key'}`}
        aria-live="polite"
      >
        {g.pha === 'dung'
          ? 'Đang tạm dừng.'
          : (g.bao?.chu ?? `Viên viền cam đang đố — bấm đủ các nốt ${laThay ? 'chính của thầy' : 'khung'} của nó.`)}
      </p>

      {cachNhap === 'chon' && dich && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dich.luaChon.map((lc) => (
            <button
              key={lc.ten}
              type="button"
              onClick={() => chonTen(lc)}
              className="min-h-12 rounded-xl border border-line bg-white/6 font-mono text-base text-cream hover:bg-white/12 active:bg-amber-key/20"
            >
              {lc.ten}
            </button>
          ))}
        </div>
      )}
      <BanPhimHaiTay trai={banTrai} phai={banPhai} lo={banLo} nhan={nhan} lowNote={thap} highNote={cao} />
      <p className="text-xs text-dim">
        {laThay
          ? 'Bấm từng nốt chính của thầy (đàn MIDI, phím máy tính hay chạm phím) — đủ là ăn; nốt thầy không đánh là sai, nốt mờ không tính.'
          : cachNhap === 'chay'
            ? 'Bấm từng nốt của khung (đàn MIDI, phím máy tính hay chạm phím) — đủ mọi nốt là ăn; bấm nốt ngoài khung là sai.'
            : 'Chọn tên khung ở bốn nút trên — bấm nút là nghe và thấy khung ấy trên đàn.'}
        {!thi && ` Viền cam trên phím là ${laThay ? 'nốt chính' : 'khung'} đang hiện dần.`}
      </p>
      {!thi && (
        <details className="rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85" open={!hep}>
          <summary className="cursor-pointer text-teal-key">{laThay ? 'Thầy chọn nốt thế nào' : 'Quy tắc của màn này'}</summary>
          <ul className="mt-1 ml-4 flex list-disc flex-col gap-0.5">
            {DS[man]!.quyTac.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      )}
      <MidiConnect />
    </div>
  )
}
