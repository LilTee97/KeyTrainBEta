import { useEffect, useRef, useState } from 'react'
import { playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiNote } from '../shared/musicTheory/types'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { ChonMoc, VungRoi } from './GameChong'
import { chonCauKhung, duKhung, MAN_KHUNG, ngoaiKhung, type CauKhung, type LuaChonKhung } from './hocSolo/mauKhung'
import { tenPhim } from './hocSolo/khungNot'
import { DAT_THI, diemCau, DONG_CHO, GOC_CHOI, SO_CAU_THI, soNotLo, thoiGianRoi, type Ben, type GocChoi } from './soanCau/gameChong'

/*
  MƯA KHUNG NỐT — game rơi kiểu Game công thức (Mưa hợp âm) cho khung nốt: tên hợp âm rơi, bấm đủ các nốt khung của nó (hay chọn đúng tên
  khung) trước khi chạm đáy. Màn theo QUY TẮC nối các nhóm đuôi (`hocSolo/mauKhung.ts`): bên luyện, viên ghi quy tắc so với loại cha ("từ
  Cmaj7: B → B♭") và tên khung, quá 60 % quãng rơi thì phím khung sáng dần; bên thi chỉ tên hợp âm, 20 viên, đúng từ 16 là Đạt. Khung
  dài 6–8 nốt nên rơi lâu hơn Mưa hợp âm: mặc định bên luyện 20 s, bên thi 14 s (Claude chọn, chưa đo — lùi nếu người dùng thấy chậm).
  Người dùng 15/10/2026: "thiết kế rơi như game công thức … khi nhấn vào thì mở hẳn ra một phần game và có bàn phím dài".
*/

interface Vien extends CauKhung {
  khoa: number
  sinh: number
  roi: number
  lan: number
  khungTen: string
}
type Pha = 'chuan-bi' | 'choi' | 'dung' | 'het'
type CachNhap = 'chay' | 'chon'

const pc = (x: number) => ((x % 12) + 12) % 12
const KHO = 'keytrain.mua-khung.v1'
const MOC_MAC_DINH: Readonly<Record<Ben, number>> = { meo: 20, thi: 14 }
type KyLuc = Record<string, { tot: number; diem: number }>
const docKyLuc = (): KyLuc => {
  try {
    const x = JSON.parse(localStorage.getItem(KHO) ?? 'null') as KyLuc | null
    if (x && typeof x === 'object') return x
  } catch {
    /* không có bộ nhớ trình duyệt */
  }
  return {}
}
const ghiKyLuc = (x: KyLuc) => {
  try {
    localStorage.setItem(KHO, JSON.stringify(x))
  } catch {
    /* bỏ qua */
  }
}
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
  const [kyLuc, setKyLuc] = useState(docKyLuc)
  const [ben, setBen] = useState<Ben>('meo')
  const [man, setMan] = useState(0)
  const [gocChoi, setGocChoi] = useState<GocChoi>('do')
  const [nhap, setNhap] = useState<CachNhap>('chay')
  const [moc, setMoc] = useState<Record<Ben, number>>({ ...MOC_MAC_DINH })
  const [choNot, setChoNot] = useState(false)
  const [, setVe] = useState(0)
  const ve = () => setVe((k) => k + 1)
  /* Trạng thái game trong ref — vòng khung hình đọc bản mới nhất (như Mưa hợp âm). */
  const g = useRef({
    pha: 'chuan-bi' as Pha,
    vien: [] as Vien[],
    diem: 0,
    combo: 0,
    dung: 0,
    sai: 0,
    soSinh: 0,
    khoa: 0,
    sinhCuoi: -1e9,
    truoc: null as string | null,
    saiDem: new Map<string, number>(),
    saiCau: [] as CauKhung[],
    /** Nốt đã chạy đúng của viên đích (cao độ thật, để sáng phím). */
    daChay: [] as number[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    dongHo: { goc: 0, dung: 0, dungLuc: null as number | null },
    cho: false,
    lo: 0,
    /** Nút tên khung vừa bấm: hiện khung ấy trên đàn một lúc. */
    daBam: null as null | { lc: LuaChonKhung; het: number },
  }).current
  const thi = ben === 'thi'
  const dich = g.vien.reduce<Vien | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)

  function bayGio() {
    return (g.dongHo.dungLuc ?? performance.now()) - g.dongHo.goc - g.dongHo.dung
  }
  function dangDich() {
    return g.vien.reduce<Vien | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)
  }
  const khoaKyLuc = (k: number) => `${k}${moc.thi !== MOC_MAC_DINH.thi ? `|${moc.thi}s` : ''}`
  function capDongHo() {
    const dung = g.pha === 'dung' || g.cho
    const now = performance.now()
    if (dung && g.dongHo.dungLuc === null) g.dongHo.dungLuc = now
    if (!dung && g.dongHo.dungLuc !== null) {
      g.dongHo.dung += now - g.dongHo.dungLuc
      g.dongHo.dungLuc = null
    }
  }
  function loCua(v: Vien | null) {
    return thi || !v ? 0 : soNotLo(Math.min(1, (bayGio() - v.sinh) / v.roi), v.k.not.length)
  }
  async function batDau(b: Ben, k: number) {
    setBen(b)
    setMan(k)
    await startAudio()
    Object.assign(g, {
      pha: 'choi',
      vien: [],
      diem: 0,
      combo: 0,
      dung: 0,
      sai: 0,
      soSinh: 0,
      sinhCuoi: -1e9,
      truoc: null,
      saiDem: new Map(),
      saiCau: [],
      daChay: [],
      bao: null,
      dongHo: { goc: performance.now(), dung: 0, dungLuc: null },
      cho: false,
      lo: 0,
      daBam: null,
    })
    ve()
  }
  function sinh() {
    const t = bayGio()
    const cau = chonCauKhung(man, GOC_CHOI[gocChoi], g.saiDem, g.truoc)
    const dangDung = new Set(g.vien.map((v) => v.lan))
    const trong = [0, 1, 2, 3].filter((l) => !dangDung.has(l))
    const lan = trong[Math.floor(Math.random() * trong.length)] ?? 0
    g.vien = [...g.vien, { ...cau, khungTen: cau.quyTac, khoa: ++g.khoa, sinh: t, roi: thoiGianRoi(moc[ben]), lan }]
    g.soSinh += 1
    g.truoc = cau.id
    g.sinhCuoi = t
    ve()
  }
  function ketThuc() {
    g.pha = 'het'
    if (thi && g.dung + g.sai >= SO_CAU_THI)
      setKyLuc((cu) => {
        const k = khoaKyLuc(man)
        const moi = { ...cu, [k]: { tot: Math.max(cu[k]?.tot ?? 0, g.dung), diem: Math.max(cu[k]?.diem ?? 0, g.diem) } }
        ghiKyLuc(moi)
        return moi
      })
    ve()
  }
  function xongThi() {
    if (thi && g.dung + g.sai >= SO_CAU_THI) ketThuc()
  }
  function boCho() {
    if (!g.cho) return
    g.cho = false
    capDongHo()
  }
  function giai(v: Vien) {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    const cong = diemCau(g.combo)
    g.diem += cong
    g.combo += 1
    g.dung += 1
    g.daChay = []
    g.bao = { loai: 'dung', chu: `Đúng +${cong} — ${v.loi}` }
    void ngheKhung(v.g, v.k.not.map((n) => n.p))
    boCho()
    xongThi()
    ve()
  }
  function tinhSai(v: Vien, loai: 'truot' | 'sai') {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    g.combo = 0
    g.sai += 1
    g.daChay = []
    g.saiDem.set(v.id, (g.saiDem.get(v.id) ?? 0) + 1)
    g.saiCau.push(v)
    g.bao = { loai: 'truot', chu: `${loai === 'truot' ? 'Trượt' : 'Sai'} — ${v.ten}. ${v.meo}` }
    xongThi()
    ve()
  }
  function saiLan(v: Vien, chu: string) {
    if (thi) return tinhSai(v, 'sai')
    g.combo = 0
    g.bao = { loai: 'sai', chu }
    ve()
  }
  function tick() {
    if (g.pha !== 'choi' || g.cho) return
    const t = bayGio()
    const d = dangDich()
    if (!thi && choNot && d && (t - d.sinh) / d.roi >= DONG_CHO) {
      g.cho = true
      capDongHo()
      g.bao = { loai: 'sai', chu: `Viên ${d.ten} đang chờ — chạy đủ khung (${d.goiY.replace(/^khung /, '')}) để mưa rơi tiếp.` }
      ve()
      return
    }
    for (const v of [...g.vien]) {
      if (t - v.sinh >= v.roi) tinhSai(v, 'truot')
      if (g.pha !== 'choi') return
    }
    const conSinh = !thi || g.soSinh < SO_CAU_THI
    if (conSinh && g.vien.length < 3 && (g.vien.length === 0 || t - g.sinhCuoi >= thoiGianRoi(moc[ben]) * 0.6)) sinh()
    const lo = loCua(dangDich())
    if (lo !== g.lo) {
      g.lo = lo
      ve()
    }
  }
  function tamDung() {
    if (g.pha === 'choi') g.pha = 'dung'
    else if (g.pha === 'dung') g.pha = 'choi'
    capDongHo()
    ve()
  }
  function doiMoc(s: number) {
    const t = bayGio()
    if (g.pha === 'choi' || g.pha === 'dung')
      for (const v of g.vien) {
        const p = (t - v.sinh) / v.roi
        v.roi = thoiGianRoi(s)
        v.sinh = t - p * v.roi
      }
    setMoc((m) => ({ ...m, [ben]: s }))
  }
  function doiCho() {
    if (choNot) boCho()
    setChoNot((x) => !x)
  }
  function chonTen(lc: LuaChonKhung) {
    const v = dangDich()
    if (g.pha !== 'choi' || !v) return
    const daBam = { lc, het: performance.now() + 1800 }
    g.daBam = daBam
    setTimeout(() => {
      if (g.daBam !== daBam) return
      g.daBam = null
      ve()
    }, 1800)
    if (lc.ten === v.dapAnTen) return giai(v)
    void ngheKhung(v.g, lc.pcs)
    saiLan(v, `Chưa đúng — ${lc.ten} không phải khung của ${v.ten}. ${v.quyTac}.`)
  }

  /* Rời tab / ẩn trang thì tự tạm dừng. */
  const tamDungRef = useRef(tamDung)
  tamDungRef.current = tamDung
  useEffect(() => {
    const f = () => {
      if (document.hidden && g.pha === 'choi') tamDungRef.current()
    }
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [g])

  /* Chạy nốt: mỗi cú bấm xuống (mọi nguồn) — nghe thẳng kho MIDI, mỗi cú một lần (bấm nhiều nốt cùng lúc vẫn đếm đủ). */
  const xuLyNot = useRef<(note: number) => void>(() => {})
  xuLyNot.current = (note) => {
    const v = dangDich()
    if (nhap !== 'chay' || g.pha !== 'choi' || !v) return
    if (ngoaiKhung(note, v)) return saiLan(v, `Chưa đúng — ${tenPhim(v.k, note)} không thuộc khung ${v.goiY.replace(/^khung /, '')} của ${v.ten}. ${v.quyTac}.`)
    if (!g.daChay.some((m) => pc(m) === pc(note))) g.daChay = [...g.daChay, note]
    if (duKhung(new Set(g.daChay.map(pc)), v)) giai(v)
    else ve()
  }
  useEffect(
    () =>
      useMidiStore.subscribe((s, truoc) => {
        const ev = s.lastEvent
        if (ev && ev !== truoc.lastEvent && ev.velocity > 0) xuLyNot.current(ev.note)
      }),
    [],
  )

  const hep = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84
  const kl = (k: number) => kyLuc[khoaKyLuc(k)]

  if (g.pha === 'chuan-bi' || g.pha === 'het')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h4 className="text-lg font-semibold text-cream">Mưa khung nốt — học khung theo quy tắc nối các nhóm đuôi</h4>
        {g.pha === 'het' && (
          <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
            {thi && g.dung + g.sai >= SO_CAU_THI ? (
              <p className="text-base text-cream">
                Màn {man + 1} · {MAN_KHUNG[man]!.ten} · rơi {moc.thi} s:{' '}
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
                <p className="mb-1 text-dim">Khung cần ôn:</p>
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
        <p className="text-xs text-dim">
          Tên hợp âm rơi xuống. Viên viền cam là viên đang đố: bấm đủ các nốt KHUNG của nó (thứ tự nào, quãng tám nào cũng được) trước khi viên
          chạm đáy — hay chọn đúng tên khung. Mỗi màn là một quy tắc nối các nhóm đuôi: học loại cha rồi suy ra loại con bằng một thay đổi nhỏ.
          Khung nốt từng loại xem kỹ ở tab Game chạy ngón.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              Viên ghi quy tắc so với loại cha ("từ Cmaj7: B → B♭") và tên khung. Rơi quá 60 % thì phím khung sáng dần. Không mất mạng.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.meo} doi={(s) => setMoc((m) => ({ ...m, meo: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={choNot} onChange={() => setChoNot((x) => !x)} />
                Chờ đúng nốt — viên dừng ở gần đáy, đợi bạn chạy đủ khung mới rơi tiếp
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              {MAN_KHUNG.map((m, k) => (
                <button key={m.ten} type="button" onClick={() => void batDau('meo', k)} className={nut(false)} title={m.goiY}>
                  {k + 1}. {m.ten} <span className="text-[11px] text-dim">· {m.goiY}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-key/40 p-3">
            <p className="font-semibold text-amber-key">Thi không mẹo — chấm đạt</p>
            <p className="mb-2 text-xs text-dim">
              Chỉ tên hợp âm, không hiện khung. {SO_CAU_THI} viên một lượt, sai lần đầu là tính sai; đúng từ {DAT_THI} là Đạt màn. Kỷ lục ghi
              riêng theo mốc tốc độ.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.thi} doi={(s) => setMoc((m) => ({ ...m, thi: s }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              {MAN_KHUNG.map((m, k) => {
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
            <p className="mb-1 text-xs text-dim">Gốc</p>
            <div className="flex flex-wrap gap-1.5">
              {GOC_TEN.map((x) => (
                <button key={x.id} type="button" onClick={() => setGocChoi(x.id)} className={nut(gocChoi === x.id)}>
                  {x.ten}
                </button>
              ))}
            </div>
          </div>
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
  const daBam = g.daBam && performance.now() < g.daBam.het ? g.daBam.lc : null
  const loN = loCua(dich)
  const banTrai = dich ? vua([48 + dich.g]) : []
  const banPhai = daBam && dich ? vua(khungLen(dich.g, daBam.pcs)) : vua(g.daChay)
  const banLo = dich && loN > 0 && !daBam ? vua(khungLen(dich.g, dich.k.not.map((n) => n.p)).slice(0, loN)) : []
  const nhan = {
    trai: dich ? dich.ten.replace(/ · .*$/, '').match(/^[A-G][♭♯]?/)?.[0] ?? '' : '',
    traiPhu: dich ? 'gốc' : '',
    phai: daBam ? daBam.ten : dich && g.daChay.length ? `${new Set(g.daChay.map(pc)).size}/${dich.k.not.length}` : '',
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
          Màn {man + 1} · {MAN_KHUNG[man]!.ten}
          {thi ? ` · rơi ${moc.thi} s` : ''}
        </span>
        <span className="ml-auto flex gap-1.5">
          <button type="button" onClick={tamDung} className={nut(false)}>
            {g.pha === 'dung' ? 'Tiếp tục' : 'Tạm dừng'}
          </button>
          <button type="button" onClick={ketThuc} className={nut(false)}>
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

      <VungRoi vien={g.vien} dich={dich} bayGio={bayGio} tick={tick} chay={g.pha === 'choi'} meo={!thi} />

      <p
        className={`min-h-10 text-sm ${g.bao?.loai === 'dung' ? 'text-teal-key' : g.bao?.loai === 'truot' ? 'text-rose-300' : 'text-amber-key'}`}
        aria-live="polite"
      >
        {g.pha === 'dung' ? 'Đang tạm dừng.' : (g.bao?.chu ?? 'Viên viền cam đang đố — bấm đủ các nốt khung của nó.')}
      </p>

      {nhap === 'chon' && dich && (
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
        {nhap === 'chay'
          ? 'Bấm từng nốt của khung (đàn MIDI, phím máy tính hay chạm phím) — đủ mọi nốt là ăn; bấm nốt ngoài khung là sai.'
          : 'Chọn tên khung ở bốn nút trên — bấm nút là nghe và thấy khung ấy trên đàn.'}
        {!thi && ' Viền cam trên phím là khung đang hiện dần.'}
      </p>
      {!thi && (
        <details className="rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85" open={!hep}>
          <summary className="cursor-pointer text-teal-key">Quy tắc của màn này</summary>
          <ul className="mt-1 ml-4 flex list-disc flex-col gap-0.5">
            {MAN_KHUNG[man]!.quyTac.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      )}
      <MidiConnect />
    </div>
  )
}
