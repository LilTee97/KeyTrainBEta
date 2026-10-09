import { useEffect, useRef, useState } from 'react'
import { playChord, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import { pitchClassName } from '../shared/musicTheory/pitch'
import { MeoCongGoc } from './BangCongThuc'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { tenMotTay, vn } from './soanCau/chongHopAm'
import {
  chonCau,
  DAT_THI,
  diemCau,
  DONG_CHO,
  dungHaiTay,
  dungTayPhai,
  GOC_CHOI,
  LO_TU,
  MAN,
  MOC_MAC_DINH,
  MOC_ROI,
  SO_CAU_THI,
  soCanCham,
  soNotLo,
  thoiGianRoi,
  type Ben,
  type CachNhap,
  type CauGame,
  type GocChoi,
  type LuaChon,
} from './soanCau/gameChong'
import { kieuGoc } from './soanCau/meoChong'

interface Vien extends CauGame {
  khoa: number
  /** Lúc sinh, theo đồng hồ game (mili giây, trừ lúc dừng). */
  sinh: number
  roi: number
  lan: number
}
type Pha = 'chuan-bi' | 'choi' | 'dung' | 'het'

const pc = (x: number) => ((x % 12) + 12) % 12
/** Màn chỉ có câu slash — luôn bấm hai tay, nên kỷ lục không tách "hai tay". */
const manSlash = (k: number) => MAN[k]!.ids.every((id) => id.startsWith('slash:'))
/* Kỷ lục bên thi theo màn — bộ nhớ trình duyệt, chỉ là tiện (không có thì vẫn chơi được). v1 (có khóa màn) bỏ 9/10/2026. */
const KHO = 'keytrain.mua-hop-am.v2'
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
const nutNho = (on: boolean) =>
  `rounded border px-1.5 py-0.5 font-mono text-[11px] ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/75 hover:bg-white/8'}`
const GOC_TEN: readonly { id: GocChoi; ten: string }[] = [
  { id: 'do', ten: 'Chỉ gốc Đô' },
  { id: 'trang', ten: 'Gốc phím trắng' },
  { id: 'tat', ten: 'Cả 12 gốc' },
]
const NHAP: readonly { id: CachNhap; ten: string; mo: string }[] = [
  { id: 'giu', ten: 'Giữ hợp âm', mo: 'đàn MIDI · phím máy tính · nhiều ngón cùng lúc' },
  { id: 'cham', ten: 'Chạm từng nốt', mo: 'chuột · cảm ứng — chạm đủ nốt là chấm' },
  { id: 'chon', ten: 'Chọn tên', mo: 'bốn nút to — bấm nút là bấm hợp âm ấy trên đàn và nghe; hợp điện thoại' },
]

/** Hàng nút mốc tốc độ rơi. */
function ChonMoc({ giay, doi }: { giay: number; doi: (s: number) => void }) {
  return (
    <span className="flex flex-wrap items-center gap-1 text-xs text-dim">
      Rơi trong
      {MOC_ROI.map((s) => (
        <button key={s} type="button" onClick={() => doi(s)} className={nutNho(giay === s)}>
          {s} s
        </button>
      ))}
    </span>
  )
}

/**
 * GAME "MƯA HỢP ÂM" — học thuộc 26 công thức chồng và hợp âm slash bằng tay (người dùng 9/10/2026: "hãy phá lệ làm game cho phần học
 * thuộc công thức chồng hợp âm này"; rồi "mở khóa các level hợp âm nhưng chia làm hai bên. Một bên có các gợi ý và các mẹo để tôi dựa vào
 * đó và suy ra các hợp âm cần tìm để chồng lên. Một bên là chơi ko mẹo nhưng có chấm điểm đạt cho từng level").
 * Bên MẸO: viên rơi ghi tay trái + gợi ý cộng gốc; quá 60% quãng rơi thì đáp án hiện dần (tên trên viên, viền cam trên phím); bật "chờ
 * đúng nốt" thì viên dừng ở vạch 90% đợi bấm đúng; không mất mạng; đổi mốc tốc độ ngay khi chơi.
 * Bên THI: chỉ tên hợp âm, 20 viên một lượt, sai lần đầu là tính sai, đúng từ 16 là Đạt; kỷ lục từng màn theo mốc tốc độ. Không hiện
 * đáp án, không chờ — Claude quyết (9/10/2026): bên thi mà hiện đáp án hay chờ thì "Đạt" không còn đo gì.
 * Bàn phím: tay nào đang sáng phím thì ghi tên hợp âm của tay ấy (người dùng 9/10/2026). Chọn tên: bấm nút là bấm hợp âm ấy và nghe.
 */
export function GameChong() {
  useLiveSound()
  useComputerKeyboard(60)
  const held = useMidiStore((state) => state.heldNotes)
  const suKien = useMidiStore((state) => state.lastEvent)
  const [kyLuc, setKyLuc] = useState(docKyLuc)
  const [ben, setBen] = useState<Ben>('meo')
  const [man, setMan] = useState(0)
  const [haiTay, setHaiTay] = useState(false)
  const [gocChoi, setGocChoi] = useState<GocChoi>('trang')
  const [nhap, setNhap] = useState<CachNhap>(() => (useMidiStore.getState().devices.length > 0 ? 'giu' : 'cham'))
  const [moc, setMoc] = useState<Record<Ben, number>>({ ...MOC_MAC_DINH })
  const [choNot, setChoNot] = useState(false)
  const [, setVe] = useState(0)
  const ve = () => setVe((k) => k + 1)
  /* Trạng thái game giữ trong ref: vòng khung hình (requestAnimationFrame) đọc bản mới nhất, không dính giá trị cũ của state. */
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
    saiCau: [] as CauGame[],
    chon: [] as number[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    dongHo: { goc: 0, dung: 0, dungLuc: null as number | null },
    /** Viên đích đang dừng ở vạch chờ (chế độ chờ đúng nốt). */
    cho: false,
    /** Số nốt đáp án đã hé lộ ở lần vẽ trước — đổi thì vẽ lại bàn phím. */
    lo: 0,
    /** Nút chọn tên vừa bấm: hiện hợp âm ấy trên đàn một lúc. */
    daBam: null as null | { lc: LuaChon; het: number },
  }).current
  const thi = ben === 'thi'
  const haiTayThi = thi && haiTay
  const dich = g.vien.reduce<Vien | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)

  function bayGio() {
    return (g.dongHo.dungLuc ?? performance.now()) - g.dongHo.goc - g.dongHo.dung
  }
  function dangDich() {
    return g.vien.reduce<Vien | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)
  }
  /** Viên này chấm hai tay: câu slash luôn vậy; câu chồng khi bên thi bật "hai tay". */
  function can(v: CauGame) {
    return v.haiTayBuoc || haiTayThi
  }
  function khoaKyLuc(k: number) {
    return `${k}${haiTay && !manSlash(k) ? '|2' : ''}${moc.thi !== MOC_MAC_DINH.thi ? `|${moc.thi}s` : ''}`
  }
  /** Đồng hồ game đứng khi tạm dừng hay khi viên đang chờ đúng nốt; chạy lại khi hết cả hai. */
  function capDongHo() {
    const dung = g.pha === 'dung' || g.cho
    const now = performance.now()
    if (dung && g.dongHo.dungLuc === null) g.dongHo.dungLuc = now
    if (!dung && g.dongHo.dungLuc !== null) {
      g.dongHo.dung += now - g.dongHo.dungLuc
      g.dongHo.dungLuc = null
    }
  }
  /** Số nốt đáp án đã hé lộ của viên `v` — chỉ bên mẹo. */
  function loCua(v: Vien | null) {
    return thi || !v ? 0 : soNotLo(Math.min(1, (bayGio() - v.sinh) / v.roi), v.phai.length)
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
      chon: [],
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
    const cau = chonCau(MAN[man]!.ids, GOC_CHOI[gocChoi], g.saiDem, g.truoc)
    const dangDung = new Set(g.vien.map((v) => v.lan))
    const trong = [0, 1, 2, 3].filter((l) => !dangDung.has(l))
    const lan = trong[Math.floor(Math.random() * trong.length)] ?? 0
    g.vien = [...g.vien, { ...cau, khoa: ++g.khoa, sinh: t, roi: thoiGianRoi(moc[ben], can(cau)), lan }]
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
    g.chon = []
    g.bao = { loai: 'dung', chu: `Đúng +${cong} — ${v.loi} (${v.nho})` }
    playChord([...v.trai, ...v.phai], '2n')
    boCho()
    xongThi()
    ve()
  }
  /** Viên tính sai: trượt đáy, hay (bên thi) chọn sai lần đầu. */
  function tinhSai(v: Vien, loai: 'truot' | 'sai') {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    g.combo = 0
    g.sai += 1
    g.chon = []
    g.saiDem.set(v.id, (g.saiDem.get(v.id) ?? 0) + 1)
    g.saiCau.push(v)
    g.bao = { loai: 'truot', chu: `${loai === 'truot' ? 'Trượt' : 'Sai'} — ${v.loi}. ${v.meo}` }
    xongThi()
    ve()
  }
  function saiLan(v: Vien) {
    if (thi) return tinhSai(v, 'sai')
    g.combo = 0
    g.chon = []
    g.bao = { loai: 'sai', chu: `Chưa đúng — ${v.meo}` }
    ve()
  }
  function tick() {
    if (g.pha !== 'choi' || g.cho) return
    const t = bayGio()
    const d = dangDich()
    if (!thi && choNot && d && (t - d.sinh) / d.roi >= DONG_CHO) {
      g.cho = true
      capDongHo()
      g.bao = { loai: 'sai', chu: `Viên ${d.ten} đang chờ — bấm đúng ${d.haiTayBuoc ? 'bass + hợp âm' : 'tay phải'} để mưa rơi tiếp.` }
      ve()
      return
    }
    for (const v of [...g.vien]) {
      if (t - v.sinh >= v.roi) tinhSai(v, 'truot')
      if (g.pha !== 'choi') return
    }
    const conSinh = !thi || g.soSinh < SO_CAU_THI
    if (conSinh && g.vien.length < 4 && (g.vien.length === 0 || t - g.sinhCuoi >= thoiGianRoi(moc[ben]) * 0.6)) sinh()
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
  /** Đổi mốc tốc độ giữa chừng (bên mẹo): viên đang rơi giữ nguyên chỗ, chỉ đổi nhịp rơi. */
  function doiMoc(s: number) {
    const t = bayGio()
    if (g.pha === 'choi' || g.pha === 'dung')
      for (const v of g.vien) {
        const p = (t - v.sinh) / v.roi
        v.roi = thoiGianRoi(s, can(v))
        v.sinh = t - p * v.roi
      }
    setMoc((m) => ({ ...m, [ben]: s }))
  }
  function doiCho() {
    if (choNot) boCho()
    setChoNot((x) => !x)
  }
  /** Chọn tên: bấm nút là bấm hợp âm ấy trên đàn (hiện 1,5 giây) và nghe; đúng thì ăn điểm. */
  function chonTen(lc: LuaChon) {
    const v = dangDich()
    if (g.pha !== 'choi' || !v) return
    const daBam = { lc, het: performance.now() + 1500 }
    g.daBam = daBam
    setTimeout(() => {
      if (g.daBam !== daBam) return
      g.daBam = null
      ve()
    }, 1500)
    if (lc.ten === v.dapAnTen) return giai(v)
    playChord([...lc.trai, ...lc.phai], '2n')
    saiLan(v)
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

  /* Giữ hợp âm: đàn MIDI, phím máy tính, nhiều ngón trên cảm ứng — đúng là ăn ngay (giữ sai không bị trừ: còn đang dò). */
  const xuLyGiu = useRef<(ns: readonly number[]) => void>(() => {})
  xuLyGiu.current = (ns) => {
    const v = dangDich()
    if (nhap !== 'giu' || g.pha !== 'choi' || !v) return
    if ((can(v) ? dungHaiTay : dungTayPhai)(ns, v)) giai(v)
  }
  useEffect(() => xuLyGiu.current(held), [held])

  /* Chạm từng nốt: mỗi cú chạm (chuột, cảm ứng, phím máy tính) bật / tắt một nốt; chạm đủ số nốt mà chưa đúng là sai. */
  const xuLyCham = useRef<(note: number) => void>(() => {})
  xuLyCham.current = (note) => {
    const v = dangDich()
    if (nhap !== 'cham' || g.pha !== 'choi' || !v) return
    g.chon = g.chon.includes(note) ? g.chon.filter((m) => m !== note) : [...g.chon, note]
    if ((can(v) ? dungHaiTay : dungTayPhai)(g.chon, v)) giai(v)
    else if (new Set(g.chon.map(pc)).size >= soCanCham(v, can(v))) saiLan(v)
    else ve()
  }
  useEffect(() => {
    if (suKien && suKien.velocity > 0 && suKien.source === 'onscreen') xuLyCham.current(suKien.note)
  }, [suKien])

  const hep = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84
  const kl = (k: number) => kyLuc[khoaKyLuc(k)]

  if (g.pha === 'chuan-bi' || g.pha === 'het')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h4 className="text-lg font-semibold text-cream">Mưa hợp âm — game học thuộc công thức chồng</h4>
        {g.pha === 'het' && (
          <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
            {thi && g.dung + g.sai >= SO_CAU_THI ? (
              <p className="text-base text-cream">
                Màn {man + 1} · {MAN[man]!.ten}
                {haiTay && !manSlash(man) ? ' · hai tay' : ''} · rơi {moc.thi} s:{' '}
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
                <p className="mb-1 text-dim">Công thức cần ôn:</p>
                <ul className="flex flex-col gap-1">
                  {[...new Map(g.saiCau.map((v) => [`${v.id}${v.g}`, v])).values()].map((v) => (
                    <li key={`${v.id}${v.g}`}>
                      <b className="font-mono text-cream">{v.loi}</b>
                      <span className="block text-dim">{v.meo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-dim">
          Tên hợp âm rơi xuống. Viên viền cam là viên đang đố: bàn phím sáng tay trái (xanh, có ghi tên) — bấm tay phải đúng công thức trước khi
          viên chạm đáy. Màn slash (X/Y): tay trái bấm bass Y, tay phải hợp âm X. Mọi màn đều mở. Bảng công thức và mẹo đầy đủ ở tab Chồng hợp âm.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              Viên rơi ghi tay trái và mẹo cộng gốc (vd B6/9: tay trái Si – Fa♯, "+ treo 4 · lùi 3 phím" — Si lùi 3 phím là Sol♯ → G♯sus4). Rơi
              quá 60% thì đáp án hiện dần. Không mất mạng — dừng lúc nào cũng được.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.meo} doi={(s) => setMoc((m) => ({ ...m, meo: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={choNot} onChange={() => setChoNot((x) => !x)} />
                Chờ đúng nốt — viên dừng ở gần đáy, đợi bạn bấm đúng mới rơi tiếp
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              {MAN.map((m, k) => (
                <button key={m.ten} type="button" onClick={() => void batDau('meo', k)} className={nut(false)} title={m.goiY}>
                  {k + 1}. {m.ten} <span className="text-[11px] text-dim">· {m.goiY}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-key/40 p-3">
            <p className="font-semibold text-amber-key">Thi không mẹo — chấm đạt</p>
            <p className="mb-2 text-xs text-dim">
              Chỉ tên hợp âm, không hiện đáp án. {SO_CAU_THI} viên một lượt, sai lần đầu là tính sai; đúng từ {DAT_THI} là Đạt màn. Kỷ lục ghi
              riêng theo mốc tốc độ.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.thi} doi={(s) => setMoc((m) => ({ ...m, thi: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={haiTay} onChange={() => setHaiTay((x) => !x)} />
                Bấm cả hai tay (khó hơn — không sáng tay trái, nốt thấp nhất là gốc)
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              {MAN.map((m, k) => {
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

  /* Bàn phím: tay nào đang sáng phím thì ghi tên hợp âm của tay ấy. Nốt của đáp án dời theo quãng tám cho vừa bàn phím đang hiện
     (điện thoại chỉ hai quãng tám); nốt người chơi bấm thì để nguyên chỗ. */
  const vua = (ns: readonly number[]) =>
    ns.map((m) => {
      let x = m
      while (x < thap) x += 12
      while (x > cao) x -= 12
      return x
    })
  const kieu = dich ? kieuGoc(dich.g) : 'flat'
  const tenNot = (ns: readonly number[]) => [...new Set([...ns].sort((a, b) => a - b).map((m) => vn(pitchClassName(pc(m), kieu))))].join(' – ')
  const daBam = g.daBam && performance.now() < g.daBam.het ? g.daBam.lc : null
  const traiDich = dich && (dich.haiTayBuoc ? !thi : !haiTayThi) ? dich.trai : []
  const loN = loCua(dich)
  let banTrai = vua(traiDich)
  let banPhai: number[] = []
  let banLo: number[] = []
  let nhan = { trai: '', traiPhu: '', phai: '', phaiPhu: '', tong: '' }
  if (daBam) {
    banTrai = vua(daBam.trai)
    banPhai = vua(daBam.phai)
    nhan = { ...daBam.nhan, tong: '' }
  } else {
    banPhai = (nhap === 'cham' ? g.chon : nhap === 'giu' ? [...held] : []).filter((m) => !banTrai.includes(m))
    banLo = dich && loN > 0 ? vua([...dich.phai].sort((a, b) => a - b).slice(0, loN)) : []
    const tenBam = banPhai.length ? tenMotTay(banPhai, kieu) : null
    const loDu = !!dich && loN >= dich.phai.length
    nhan = {
      trai: dich && traiDich.length ? dich.nhan.trai : '',
      traiPhu: dich && traiDich.length ? dich.nhan.traiPhu : '',
      phai: tenBam ? tenBam.ten : loDu ? dich.nhan.phai : '',
      phaiPhu: tenBam ? (tenBam.laHop ? tenNot(banPhai) : '') : loDu ? dich.nhan.phaiPhu : '',
      tong: '',
    }
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
          Màn {man + 1} · {MAN[man]!.ten}
          {haiTayThi ? ' · hai tay' : ''}
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
        {g.pha === 'dung'
          ? 'Đang tạm dừng.'
          : (g.bao?.chu ?? (dich?.haiTayBuoc ? 'Viên viền cam đang đố — bấm bass tay trái + hợp âm tay phải.' : 'Viên viền cam đang đố — bấm tay phải của nó.'))}
      </p>

      {nhap === 'chon' && dich && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dich.luaChon.map((lc) => (
            <button
              key={lc.ten}
              type="button"
              onClick={() => chonTen(lc)}
              className="min-h-12 rounded-xl border border-line bg-white/6 font-mono text-lg text-cream hover:bg-white/12 active:bg-amber-key/20"
            >
              {lc.ten}
            </button>
          ))}
        </div>
      )}
      <BanPhimHaiTay trai={banTrai} phai={banPhai} lo={banLo} nhan={nhan} lowNote={thap} highNote={cao} />
      <p className="text-xs text-dim">
        {nhap === 'giu'
          ? 'Giữ cả hợp âm cùng lúc (đàn MIDI, phím máy tính) — quãng tám nào, thế đảo nào cũng được.'
          : nhap === 'cham'
            ? `Chạm từng nốt (sáng hồng là đã chọn, chạm lại để bỏ) — đủ ${dich ? soCanCham(dich, can(dich)) : 3} nốt là chấm.`
            : dich?.haiTayBuoc
              ? 'Chọn NGHĨA của hợp âm slash ở bốn nút trên: thế đảo, hay hợp âm màu nào của bass. Bấm nút là nghe hợp âm ấy.'
              : 'Chọn tên hợp âm tay phải ở bốn nút trên — bấm nút là bấm hợp âm ấy lên đàn và nghe.'}
        {dich?.haiTayBuoc ? nhap !== 'chon' && ' Slash: bass là nốt thấp nhất.' : haiTayThi && ' Bấm cả hai tay, nốt thấp nhất là gốc.'}
        {!thi && ' Viền cam trên phím là đáp án đang hiện dần.'}
      </p>
      {!thi && (
        <details className="rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85" open={!hep}>
          <summary className="cursor-pointer text-teal-key">{MAN[man]!.meo ? 'Quy luật của màn này' : 'Mẹo cộng gốc của màn này — gốc nào cộng gốc nào'}</summary>
          {MAN[man]!.meo ? (
            <ul className="mt-1 flex flex-col gap-0.5">
              {MAN[man]!.meo!.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <MeoCongGoc ids={MAN[man]!.ids} gocs={GOC_CHOI[gocChoi]} />
          )}
        </details>
      )}
      <MidiConnect />
    </div>
  )
}

/** Vùng mưa: tự vẽ lại mỗi khung hình (chỉ vùng này), gọi `tick` để game xét trượt / sinh viên mới / dừng chờ. */
function VungRoi({ vien, dich, bayGio, tick, chay, meo }: { vien: readonly Vien[]; dich: Vien | null; bayGio: () => number; tick: () => void; chay: boolean; meo: boolean }) {
  const [, setKhung] = useState(0)
  const tickRef = useRef(tick)
  tickRef.current = tick
  useEffect(() => {
    if (!chay) return
    let id = 0
    const vong = () => {
      tickRef.current()
      setKhung((k) => (k + 1) % 1_000_000)
      id = requestAnimationFrame(vong)
    }
    id = requestAnimationFrame(vong)
    return () => cancelAnimationFrame(id)
  }, [chay])
  const t = bayGio()
  return (
    <div className="relative h-[42vh] min-h-64 overflow-hidden rounded-xl border border-line bg-black/40">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-rose-500/25 to-transparent" />
      {vien.map((v) => {
        const p = Math.min(1, Math.max(0, (t - v.sinh) / v.roi))
        const laDich = v === dich
        const lo = meo ? Math.min(1, Math.max(0, (p - LO_TU) / (DONG_CHO - LO_TU))) : 0
        return (
          <div
            key={v.khoa}
            className={`absolute w-[23%] rounded-lg border px-1 py-1.5 text-center ${laDich ? 'border-amber-key bg-amber-key/20 shadow-[0_0_14px_rgba(245,166,35,0.35)]' : 'border-line bg-white/6 opacity-80'}`}
            style={{ left: `${v.lan * 25 + 1}%`, top: `calc(${p * 100}% - ${p * (meo ? 112 : 48)}px)` }}
          >
            <p className={`font-mono font-bold text-cream ${v.ten.length > 6 ? 'text-sm sm:text-2xl' : 'text-lg sm:text-2xl'}`}>{v.ten}</p>
            {meo && (
              <>
                <p className="text-[10px] leading-tight text-cream/75 sm:text-[11px]">{v.khungTen}</p>
                <p className="text-[10px] leading-tight text-teal-key sm:text-[11px]">{v.goiY}</p>
                {lo > 0 && (
                  <p className="text-xs leading-tight font-semibold text-amber-key sm:text-sm" style={{ opacity: lo }}>
                    {v.lo}
                  </p>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
