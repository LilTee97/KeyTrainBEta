import { useEffect, useRef, useState } from 'react'
import { playChord, playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import { pitchClassName } from '../shared/musicTheory/pitch'
import { TheNhomDuoi } from './BangCongThuc'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { tenMotTay, vn } from './soanCau/chongHopAm'
import { GOC, kieuDau } from './vongThay'
import {
  bacDoRo,
  chonCau,
  DAT_THI,
  diemCau,
  DONG_CHO,
  doRoGoiY,
  dungHaiTay,
  dungTayPhai,
  GOC_CHOI,
  MAN,
  MAN_QUY_TAC,
  MOC_MAC_DINH,
  MOC_ROI,
  SO_CAU_THI,
  soCanCham,
  thoiGianRoi,
  type Ben,
  type CachNhap,
  type CauGame,
  type GocChoi,
  type LuaChon,
  type Man,
} from './soanCau/gameChong'
import { BAI_251, BAI_LUOT, MAN_251, MAN_LUOT, type DoanBai } from './soanCau/hopAmLuot'
import { BAI_SSA, MAN_HOP_SSA } from './soanCau/hopAmSsa'
import { bangTheoDuoi, kieuGoc } from './soanCau/meoChong'

interface Vien extends CauGame {
  khoa: number
  /** Lúc sinh, theo đồng hồ game (mili giây, trừ lúc dừng). */
  sinh: number
  roi: number
  lan: number
  /** Số bước đã đúng (câu nhiều bước — vòng 2-5-1). */
  da: number
}
type Pha = 'chuan-bi' | 'choi' | 'dung' | 'het'

const pc = (x: number) => ((x % 12) + 12) % 12
/**
 * Bốn mục (người dùng 16/10/2026: "hãy làm theo lối của Quy tắc nhóm đuôi … làm thêm mục dạy tôi về các Passing Chord và dạy tôi tìm hợp âm
 * cho vòng 2-5-1"): 18 màn nhóm đuôi đã duyệt giữ nguyên; ba mục mới duyệt cùng ngày ("Quy tắc nhóm đuôi, passing chord và 2-5-1 đã
 * đạt") — bỏ chữ "(thử)".
 */
type Bo = 'nhom' | 'quy-tac' | 'luot' | '251' | 'ssa'
const BO: readonly { id: Bo; ten: string; tieuDe: string; man: readonly Man[] }[] = [
  { id: 'nhom', ten: 'Màn nhóm đuôi', tieuDe: 'Mưa hợp âm — game học thuộc công thức chồng', man: MAN },
  { id: 'quy-tac', ten: 'Quy tắc nhóm đuôi', tieuDe: 'Mưa hợp âm · quy tắc nhóm đuôi — học hợp âm cha rồi suy ra con', man: MAN_QUY_TAC },
  { id: 'luot', ten: 'Passing chord', tieuDe: 'Passing chord — hợp âm lướt nối hai hợp âm', man: MAN_LUOT },
  { id: '251', ten: 'Vòng 2-5-1', tieuDe: 'Vòng 2-5-1 — tìm bậc 2 và bậc 5 của hợp âm đích', man: MAN_251 },
  /* Người dùng 16/10/2026: "có đưa các hợp âm mới mà bạn học được từ các Video SSA vào KT để dạy tôi chưa" → "làm đi". Duyệt đạt thì bỏ "(thử)". */
  { id: 'ssa', ten: 'Hợp âm SSA (thử)', tieuDe: 'Hợp âm SSA — thế chồng anh SSA bấm trong ba clip "Rải Ngón" (thử)', man: MAN_HOP_SSA },
]
/** Mục mà câu là cả hợp âm (không tay trái) — không có lựa chọn "hai tay". */
const laNoi = (bo: Bo) => bo === 'luot' || bo === '251'
/** Bước đang đố của viên — câu nhiều bước đi lần lượt. */
const buocCua = (v: Vien): CauGame => v.buoc?.[v.da] ?? v
/** Viên nhiều bước rơi lâu hơn: thêm 50 % mỗi bước sau bước đầu (Claude chọn, chưa đo — lùi nếu người dùng thấy chậm). */
const heSoRoi = (c: CauGame) => 1 + 0.5 * ((c.buoc?.length ?? 1) - 1)
/** Câu là cả hợp âm, không sáng tay trái (hợp âm lướt, 2-5-1) — gốc là điều phải tìm. */
const caHop = (c: CauGame) => !c.haiTayBuoc && c.trai.length === 0
const canBam = (c: CauGame) => c.hoi ?? (c.haiTayBuoc ? 'bass + hợp âm' : caHop(c) ? 'hợp âm ở chỗ dấu ?' : 'tay phải')
/* Kỷ lục bên thi theo màn — bộ nhớ trình duyệt, chỉ là tiện (không có thì vẫn chơi được). v1 (có khóa màn) bỏ 9/10/2026; v2 (màn theo
   họ, khóa là số thứ tự màn) bỏ 11/10/2026 khi màn chia theo nhóm đuôi — số thứ tự cũ không còn đúng màn. */
const KHO = 'keytrain.mua-hop-am.v3'
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
/**
 * Gốc (giọng) của câu: một nhóm gốc, hay MỘT gốc bất kỳ (số 0–11) — người dùng 16/10/2026: "trong ảnh có mục chỉ nhóm C nhưng tôi muốn tập
 * cho từng nhóm khác nên hãy thêm các lựa chọn nhóm khác". Nút "Chỉ gốc Đô" cũ nay là nút Đô trong hàng 12 gốc.
 */
type ChonGoc = Exclude<GocChoi, 'do'> | number
const GOC_TEN: readonly { id: ChonGoc; ten: string }[] = [
  { id: 'trang', ten: 'Gốc phím trắng' },
  { id: 'tat', ten: 'Cả 12 gốc' },
]
const dsGoc = (x: ChonGoc) => (typeof x === 'number' ? [x] : GOC_CHOI[x])
const NHAP: readonly { id: CachNhap; ten: string; mo: string }[] = [
  { id: 'giu', ten: 'Giữ hợp âm', mo: 'đàn MIDI · phím máy tính · nhiều ngón cùng lúc' },
  { id: 'cham', ten: 'Chạm từng nốt', mo: 'chuột · cảm ứng — chạm đủ nốt là chấm' },
  { id: 'chon', ten: 'Chọn tên', mo: 'bốn nút to — bấm nút là bấm hợp âm ấy trên đàn và nghe; hợp điện thoại' },
]

/** Hàng nút mốc tốc độ rơi — dùng chung với Mưa khung nốt (trang Học Solo). */
export function ChonMoc({ giay, doi }: { giay: number; doi: (s: number) => void }) {
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

/** Bài học của mục Passing chord / 2-5-1: lời gia sư, mỗi đoạn có nút ▶ nghe ví dụ ở Đô. */
function BaiHoc({ bai }: { bai: readonly DoanBai[] }) {
  return (
    <details className="rounded-lg border border-teal-key/40 p-3 text-xs text-cream/85" open>
      <summary className="cursor-pointer font-semibold text-teal-key">Bài học — đọc trước, bấm ▶ để nghe</summary>
      {bai.map((d) => (
        <div key={d.tieuDe} className="mt-2">
          <p className="font-semibold text-cream">{d.tieuDe}</p>
          <ul className="mt-0.5 ml-4 flex list-disc flex-col gap-0.5">
            {d.loi.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {d.nghe.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {d.nghe.map((n) => (
                <button key={n.ten} type="button" onClick={() => void startAudio().then(() => playChordSequence(n.hop, 1))} className={nutNho(false)}>
                  ▶ {n.ten}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </details>
  )
}

/**
 * GAME "MƯA HỢP ÂM" — học thuộc 26 công thức chồng và hợp âm slash bằng tay (người dùng 9/10/2026: "hãy phá lệ làm game cho phần học
 * thuộc công thức chồng hợp âm này"; rồi "mở khóa các level hợp âm nhưng chia làm hai bên. Một bên có các gợi ý và các mẹo để tôi dựa vào
 * đó và suy ra các hợp âm cần tìm để chồng lên. Một bên là chơi ko mẹo nhưng có chấm điểm đạt cho từng level").
 * Bên MẸO: viên rơi ghi tên hai tay và phép cộng loại ("A + G♯m · trưởng + thứ" — người dùng chọn 10/10/2026); phím đáp án (viền cam)
 * hiện ngay từ đầu, mờ rồi rõ dần khi viên gần phím đàn (người dùng 16/10/2026 — `doRoGoiY`; cũ: từ 60 % quãng rơi mới sáng dần từng nốt);
 * bật "chờ đúng nốt" thì viên dừng ở vạch 90% đợi bấm đúng; không mất mạng; đổi mốc tốc độ ngay khi chơi.
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
  const [bo, setBo] = useState<Bo>('nhom')
  const DS = BO.find((x) => x.id === bo)!.man
  const [ben, setBen] = useState<Ben>('meo')
  const [man, setMan] = useState(0)
  const [haiTay, setHaiTay] = useState(false)
  const [gocChoi, setGocChoi] = useState<ChonGoc>('trang')
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
    /** Hệ số rơi của viên vừa sinh — viên nhiều bước giãn cả khoảng cách sinh. */
    heSoCuoi: 1,
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
  /** Câu này chấm hai tay: câu slash luôn vậy; câu chồng khi bên thi bật "hai tay" (câu cả hợp âm thì không). */
  function can(c: CauGame) {
    return c.haiTayBuoc || (haiTayThi && c.trai.length > 0)
  }
  /** Màn không có lựa chọn "hai tay": màn slash (luôn hai tay), mục hợp âm lướt · 2-5-1 (cả hợp âm). */
  function khongHaiTay(k: number) {
    return laNoi(bo) || DS[k]!.ids.every((id) => id.startsWith('slash:') || id.startsWith('ssa:doi:'))
  }
  /** Khóa kỷ lục: mục nhóm đuôi giữ khóa cũ (số màn), mục mới thêm tên mục. */
  function khoaKyLuc(k: number) {
    return `${bo === 'nhom' ? '' : `${bo}:`}${k}${haiTay && !khongHaiTay(k) ? '|2' : ''}${moc.thi !== MOC_MAC_DINH.thi ? `|${moc.thi}s` : ''}`
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
  /** Số nốt đáp án đang gợi ý của viên `v` — chỉ bên mẹo, hiện đủ ngay từ đầu. */
  function loCua(v: Vien | null) {
    return thi || !v ? 0 : buocCua(v).phai.length
  }
  /** Độ rõ của gợi ý: mờ lúc viên mới rơi, rõ hẳn ở vạch chờ (90 %). */
  function doRoCua(v: Vien | null) {
    return thi || !v ? undefined : doRoGoiY((bayGio() - v.sinh) / v.roi)
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
      heSoCuoi: 1,
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
    const cau = chonCau(DS[man]!.ids, dsGoc(gocChoi), g.saiDem, g.truoc)
    const dangDung = new Set(g.vien.map((v) => v.lan))
    const trong = [0, 1, 2, 3].filter((l) => !dangDung.has(l))
    const lan = trong[Math.floor(Math.random() * trong.length)] ?? 0
    const he = heSoRoi(cau)
    g.vien = [...g.vien, { ...cau, khoa: ++g.khoa, sinh: t, roi: thoiGianRoi(moc[ben], can(cau)) * he, lan, da: 0 }]
    g.heSoCuoi = he
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
    if (v.nghe) playChordSequence(v.nghe, 0.9)
    else playChord([...v.trai, ...v.phai], '2n')
    boCho()
    xongThi()
    ve()
  }
  /** Đúng bước đang đố: câu nhiều bước thì sang bước sau (viên vẫn rơi), bước cuối thì xong viên. */
  function dung(v: Vien) {
    if (!v.buoc || v.da >= v.buoc.length - 1) return giai(v)
    const b = buocCua(v)
    v.da += 1
    const n = buocCua(v)
    Object.assign(v, { ten: n.ten, khungTen: n.khungTen, goiY: n.goiY })
    g.chon = []
    g.bao = { loai: 'dung', chu: `Đúng — ${b.loi}. Tiếp: ${n.khungTen}.` }
    playChord([...b.trai, ...b.phai], '2n')
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
    g.bao = { loai: 'sai', chu: `Chưa đúng — ${buocCua(v).meo}` }
    ve()
  }
  function tick() {
    if (g.pha !== 'choi' || g.cho) return
    const t = bayGio()
    const d = dangDich()
    if (!thi && choNot && d && (t - d.sinh) / d.roi >= DONG_CHO) {
      g.cho = true
      capDongHo()
      g.bao = { loai: 'sai', chu: `Viên ${d.ten} đang chờ — bấm đúng ${canBam(buocCua(d))} để mưa rơi tiếp.` }
      ve()
      return
    }
    for (const v of [...g.vien]) {
      if (t - v.sinh >= v.roi) tinhSai(v, 'truot')
      if (g.pha !== 'choi') return
    }
    const conSinh = !thi || g.soSinh < SO_CAU_THI
    if (conSinh && g.vien.length < 4 && (g.vien.length === 0 || t - g.sinhCuoi >= thoiGianRoi(moc[ben]) * 0.6 * g.heSoCuoi)) sinh()
    // Vẽ lại bàn phím khi độ rõ gợi ý của viên đích lên một bậc (20 bậc), hay đổi viên / đổi bước.
    const d2 = dangDich()
    const lo = thi || !d2 ? -1 : d2.khoa * 1000 + d2.da * 100 + bacDoRo((t - d2.sinh) / d2.roi)
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
        v.roi = thoiGianRoi(s, can(v)) * heSoRoi(v)
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
    if (lc.ten === buocCua(v).dapAnTen) return dung(v)
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
    const b = buocCua(v)
    if ((can(b) ? dungHaiTay : dungTayPhai)(ns, b)) dung(v)
  }
  useEffect(() => xuLyGiu.current(held), [held])

  /* Chạm từng nốt: mỗi cú chạm (chuột, cảm ứng, phím máy tính) bật / tắt một nốt; chạm đủ số nốt mà chưa đúng là sai. */
  const xuLyCham = useRef<(note: number) => void>(() => {})
  xuLyCham.current = (note) => {
    const v = dangDich()
    if (nhap !== 'cham' || g.pha !== 'choi' || !v) return
    g.chon = g.chon.includes(note) ? g.chon.filter((m) => m !== note) : [...g.chon, note]
    const b = buocCua(v)
    if ((can(b) ? dungHaiTay : dungTayPhai)(g.chon, b)) dung(v)
    else if (new Set(g.chon.map(pc)).size >= soCanCham(b, can(b))) saiLan(v)
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
        <h4 className="text-lg font-semibold text-cream">
          {BO.find((x) => x.id === bo)!.tieuDe}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {BO.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                g.pha = 'chuan-bi'
                setBo(x.id)
              }}
              className={nut(bo === x.id)}
              aria-pressed={bo === x.id}
            >
              {x.ten}
            </button>
          ))}
        </div>
        {g.pha === 'het' && (
          <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
            {thi && g.dung + g.sai >= SO_CAU_THI ? (
              <p className="text-base text-cream">
                Màn {man + 1} · {DS[man]!.ten}
                {haiTay && !khongHaiTay(man) ? ' · hai tay' : ''} · rơi {moc.thi} s:{' '}
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
                <p className="mb-1 text-dim">{laNoi(bo) ? 'Câu cần ôn' : 'Công thức cần ôn'}:</p>
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
        {bo === 'nhom' && (
          <p className="text-xs text-dim">
            Tên hợp âm rơi xuống. Viên viền cam là viên đang đố: bàn phím sáng tay trái (xanh, có ghi tên) — bấm tay phải đúng công thức trước
            khi viên chạm đáy. Màn slash (X/Y): tay trái bấm bass Y, tay phải hợp âm X. Mọi màn đều mở. Bảng công thức và mẹo đầy đủ ở tab Chồng
            hợp âm.
          </p>
        )}
        {bo === 'quy-tac' && (
          <div className="flex flex-col gap-1.5 text-xs text-dim">
            <p>
              Học theo cây cha – con của các nhóm đuôi (lối màn quy tắc ở Mưa khung nốt): mỗi hợp âm có một hợp âm CHA đã học trước. Viên rơi ghi
              cha cùng thế chồng của nó và chỗ thay đổi — <b className="text-cream">C7 · từ Cmaj7: Đô + Em · Si → Si♭</b> — bạn tự suy ra thế
              chồng của con (Em hạ Si → Si♭ = Edim). Thuộc một nhóm thì nhóm liên quan chỉ còn là một thay đổi nhỏ. Màn đi từ hợp âm ba → ba hợp
              âm bảy gốc → giảm → 6 · add9 → cầu thang 9 · 11 · 13 → át có nốt căng. Chấm, mốc rơi, bốn nút như màn nhóm đuôi; trong bốn nút luôn
              có tay phải của cha (lỗi quên đổi nốt).
            </p>
            <details className="rounded-lg border border-teal-key/30 p-2 text-cream/85">
              <summary className="cursor-pointer text-teal-key">Cây cha – con của 32 hợp âm (gốc Đô)</summary>
              {MAN_QUY_TAC.slice(0, -1).map((m, k) => (
                <div key={m.ten} className="mt-1.5">
                  <p className="font-semibold text-cream">
                    Màn {k + 1} · {m.ten}
                  </p>
                  <ul className="ml-4 flex list-disc flex-col gap-0.5">
                    {m.meo!.map((x) => (
                      <li key={x} className="font-mono">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          </div>
        )}
        {laNoi(bo) && (
          <p className="text-xs text-dim">
            {bo === 'luot'
              ? 'Viên rơi ghi hai hợp âm chính và chỗ trống — "Cmaj7 → ? → Dm7" — bấm hợp âm chen giữa (gốc + các nốt, thế đảo nào cũng được; thêm nốt màu 9 · 13 cũng tính) hay chọn tên ở bốn nút. Nhãn trên viên cho biết loại: át phụ · giảm lướt · ♭II7. Xong viên là nghe cả ba hợp âm.'
              : 'Viên rơi ghi hợp âm đích — "? → ? → Cmaj7": bấm bậc 2 rồi bậc 5 (đúng bước 1 thì viên đợi bước 2), hay chọn tên ở bốn nút. Xong viên là nghe cả vòng. Giọng lấy theo hàng "Giọng" bên dưới.'}{' '}
            Không sáng tay trái — gốc chính là điều phải tìm. Bên luyện, phím đáp án hiện ngay từ đầu — mờ, rõ dần khi viên gần phím đàn.
          </p>
        )}
        {bo === 'ssa' && (
          <p className="text-xs text-dim">
            Thế chồng đo bằng hình trong ba clip "Rải Ngón" của anh SSA (111 hợp âm, một người chơi): ba thế gốc trùng công thức của bảng; maj9 ·
            13sus4 là tay phải bốn nốt — thế 7 thêm một nốt trên đỉnh; rồi giữ tay phải, đổi bass. Bên luyện, viên rơi ghi thẳng tay trái · tay
            phải của hợp âm đang rơi và quy tắc của anh (<b className="text-cream">Cmaj9 · tay trái Đô · tay phải Em7 · Cmaj7 thêm Rê trên đỉnh</b>);
            câu đổi bass ghi tay phải giữ nguyên (<b className="text-cream">giữ tay phải F · Dm7 → G9sus4</b>) — bấm bass mới ở dưới tay phải
            ấy, bass là nốt thấp nhất. Bên thi chỉ còn tên. Chơi bằng đàn hay chọn tên ở bốn nút. Hợp âm chưa đủ số đo (m6 · m9 · bốn loại mới
            của thư viện) chỉ có trong bài học.
          </p>
        )}
        {bo === 'ssa' && <BaiHoc bai={BAI_SSA} />}
        {bo === 'luot' && <BaiHoc bai={BAI_LUOT} />}
        {bo === '251' && <BaiHoc bai={BAI_251} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              Viên rơi ghi tên hai tay và đuôi mang lại nốt nào (vd Amaj7: "La + C♯m · maj7 → Sol♯"). Phím đáp án hiện ngay từ đầu — mờ, càng gần
              phím đàn càng rõ — chỉ chỗ đặt tay. Không mất mạng — dừng lúc nào cũng được.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.meo} doi={(s) => setMoc((m) => ({ ...m, meo: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={choNot} onChange={() => setChoNot((x) => !x)} />
                Chờ đúng nốt — viên dừng ở gần đáy, đợi bạn bấm đúng mới rơi tiếp
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
              Chỉ tên hợp âm, không hiện đáp án. {SO_CAU_THI} viên một lượt, sai lần đầu là tính sai; đúng từ {DAT_THI} là Đạt màn. Kỷ lục ghi
              riêng theo mốc tốc độ.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.thi} doi={(s) => setMoc((m) => ({ ...m, thi: s }))} />
              {!laNoi(bo) && (
                <label className="flex items-center gap-2 text-xs text-cream/85">
                  <input type="checkbox" checked={haiTay} onChange={() => setHaiTay((x) => !x)} />
                  Bấm cả hai tay (khó hơn — không sáng tay trái, nốt thấp nhất là gốc)
                </label>
              )}
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
            <p className="mb-1 text-xs text-dim">{laNoi(bo) ? 'Giọng (chủ âm)' : 'Gốc'}</p>
            <div className="flex flex-wrap gap-1.5">
              {GOC_TEN.map((x) => (
                <button key={x.id} type="button" onClick={() => setGocChoi(x.id)} className={nut(gocChoi === x.id)}>
                  {x.ten}
                </button>
              ))}
            </div>
            {/* Một gốc: tên theo cách ghi của mục — gốc hợp âm như GOC (Đô♯), giọng trưởng như hóa biểu (Rê♭). */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="text-xs text-dim">Chỉ một {laNoi(bo) ? 'giọng' : 'gốc'}:</span>
              {GOC.map((ten, k) => (
                <button key={ten} type="button" onClick={() => setGocChoi(k)} className={nut(gocChoi === k)} aria-pressed={gocChoi === k}>
                  {vn(laNoi(bo) ? pitchClassName(k, kieuDau(k, false)) : ten)}
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
  /** Bước đang đố của viên đích (câu nhiều bước đi lần lượt). */
  const cd = dich ? buocCua(dich) : null
  const kieu = cd?.kieu ?? (dich ? kieuGoc(dich.g) : 'flat')
  const tenNot = (ns: readonly number[]) => [...new Set([...ns].sort((a, b) => a - b).map((m) => vn(pitchClassName(pc(m), kieu))))].join(' – ')
  const daBam = g.daBam && performance.now() < g.daBam.het ? g.daBam.lc : null
  const traiDich = cd && (cd.haiTayBuoc ? !thi : !haiTayThi) ? cd.trai : []
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
    banLo = cd && loN > 0 ? vua([...cd.phai].sort((a, b) => a - b).slice(0, loN)) : []
    const tenBam = banPhai.length ? tenMotTay(banPhai, kieu) : null
    const loDu = !!cd && loN >= cd.phai.length
    nhan = {
      trai: cd && traiDich.length ? cd.nhan.trai : '',
      traiPhu: cd && traiDich.length ? cd.nhan.traiPhu : '',
      phai: tenBam ? tenBam.ten : loDu ? cd.nhan.phai : '',
      phaiPhu: tenBam ? (tenBam.laHop ? tenNot(banPhai) : '') : loDu ? cd.nhan.phaiPhu : '',
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
          {bo !== 'nhom' ? `${BO.find((x) => x.id === bo)!.ten} · ` : ''}Màn {man + 1} · {DS[man]!.ten}
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
          : (g.bao?.chu ??
            (cd?.haiTayBuoc
              ? 'Viên viền cam đang đố — bấm bass tay trái + hợp âm tay phải.'
              : cd?.hoi
                ? `Viên viền cam đang đố — bấm ${cd.hoi}.`
                : cd && caHop(cd)
                  ? `Viên viền cam đang đố — tìm hợp âm ở chỗ dấu ? (${cd.khungTen}).`
                : 'Viên viền cam đang đố — bấm tay phải của nó.'))}
      </p>

      {nhap === 'chon' && cd && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cd.luaChon.map((lc) => (
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
      <BanPhimHaiTay trai={banTrai} phai={banPhai} lo={banLo} nhan={nhan} lowNote={thap} highNote={cao} doRo={daBam ? undefined : doRoCua(dich)} />
      <p className="text-xs text-dim">
        {nhap === 'giu'
          ? cd && caHop(cd)
            ? `Giữ cả hợp âm cùng lúc — ${cd.bass !== undefined ? 'bass mới là nốt thấp nhất, tay phải quãng tám nào cũng được' : 'gốc + các nốt, quãng tám nào, thế đảo nào cũng được'}${cd.chuc?.duoc.length ? '; thêm nốt màu (9 · 11 · 13) cũng tính' : ''}.`
            : 'Giữ cả hợp âm cùng lúc (đàn MIDI, phím máy tính) — quãng tám nào, thế đảo nào cũng được.'
          : nhap === 'cham'
            ? `Chạm từng nốt (sáng hồng là đã chọn, chạm lại để bỏ) — đủ ${cd ? soCanCham(cd, can(cd)) : 3} nốt là chấm.`
            : cd?.haiTayBuoc
              ? 'Chọn NGHĨA của hợp âm slash ở bốn nút trên: thế đảo, hay hợp âm màu nào của bass. Bấm nút là nghe hợp âm ấy.'
              : cd && caHop(cd)
                ? 'Chọn tên hợp âm ở bốn nút trên — bấm nút là bấm hợp âm ấy lên đàn và nghe.'
                : 'Chọn tên hợp âm tay phải ở bốn nút trên — bấm nút là bấm hợp âm ấy lên đàn và nghe.'}
        {cd?.haiTayBuoc ? nhap !== 'chon' && ' Slash: bass là nốt thấp nhất.' : haiTayThi && !(cd && caHop(cd)) && ' Bấm cả hai tay, nốt thấp nhất là gốc.'}
        {!thi && ' Viền cam trên phím là đáp án — mờ lúc viên mới rơi, rõ dần khi gần phím đàn.'}
      </p>
      {!thi && (
        <details className="rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85" open={!hep}>
          <summary className="cursor-pointer text-teal-key">
            {DS[man]!.nhom ? `Mẹo nhóm đuôi ${DS[man]!.nhom}` : DS[man]!.meo ? 'Quy luật của màn này' : 'Quy tắc chung giữa các đuôi'}
          </summary>
          {DS[man]!.nhom && <TheNhomDuoi n={bangTheoDuoi().find((n) => n.ten === DS[man]!.nhom)!} />}
          {(DS[man]!.meo ?? DS[man]!.quyTac) && (
            <ul className="mt-1 ml-4 flex list-disc flex-col gap-0.5">
              {(DS[man]!.meo ?? DS[man]!.quyTac)!.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </details>
      )}
      <MidiConnect />
    </div>
  )
}

/** Một viên đang rơi — đủ cho `VungRoi` vẽ (Mưa hợp âm · Mưa khung nốt). */
export interface VienRoi {
  khoa: number
  sinh: number
  roi: number
  lan: number
  ten: string
  khungTen: string
  goiY: string
  /** Nhãn loại câu, hiện cả bên thi ("át phụ", "2-5-1 thứ"). */
  the?: string
}

/** Vùng mưa: tự vẽ lại mỗi khung hình (chỉ vùng này), gọi `tick` để game xét trượt / sinh viên mới / dừng chờ. */
export function VungRoi({
  vien,
  dich,
  bayGio,
  tick,
  chay,
  meo,
}: {
  vien: readonly VienRoi[]
  dich: VienRoi | null
  bayGio: () => number
  tick: () => void
  chay: boolean
  meo: boolean
}) {
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
        return (
          <div
            key={v.khoa}
            className={`absolute w-[23%] rounded-lg border px-1 py-1.5 text-center ${laDich ? 'border-amber-key bg-amber-key/20 shadow-[0_0_14px_rgba(245,166,35,0.35)]' : 'border-line bg-white/6 opacity-80'}`}
            style={
              /* Viên có nhãn loại (hợp âm lướt, 2-5-1) cao tùy chữ — dời theo chiều cao thật của viên để chạm đáy đúng lúc; viên cũ giữ cách cũ. */
              v.the
                ? { left: `${v.lan * 25 + 1}%`, top: `${p * 100}%`, transform: `translateY(-${p * 100}%)` }
                : { left: `${v.lan * 25 + 1}%`, top: `calc(${p * 100}% - ${p * (meo ? 92 : 48)}px)` }
            }
          >
            {v.the && <p className="text-[10px] leading-tight text-amber-key sm:text-xs">{v.the}</p>}
            <p className={`font-mono font-bold text-cream ${v.ten.length > 6 ? 'text-sm sm:text-2xl' : 'text-lg sm:text-2xl'}`}>{v.ten}</p>
            {meo && (
              <>
                <p className="text-xs leading-tight font-semibold text-cream sm:text-sm">{v.khungTen}</p>
                <p className="text-[10px] leading-tight text-teal-key sm:text-[11px]">{v.goiY}</p>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
