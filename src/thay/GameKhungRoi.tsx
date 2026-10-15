import { useMemo, useRef, useState } from 'react'
import { getStyle } from '../reharm/style/styleLibrary'
import { playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiNote } from '../shared/musicTheory/types'
import { BanPhimChong } from './BanPhimChong'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { ChonMoc, VungRoi } from './GameChong'
import { chonCauKhung, duKhung, MAN_KHUNG, ngoaiKhung, type CauKhung, type LuaChonKhung } from './hocSolo/mauKhung'
import { tenPhim } from './hocSolo/khungNot'
import { cauVongSsa, chamSsa, chonCauQuyTacChong, chonCauSsa, chonCauThayChong, MAN_SSA, mauSsa, SO_NOT_CHAY, VONG_SSA, vongThay, type PhanSsa, type VongNen } from './hocSolo/loiSsa'
import { THAY_CHAY, type ThayChay } from './hocSolo/cauThay'
import { DOAN, manThay, tenThayCua, type Doan } from './hocSolo/thayNhac'
import { dungVong } from './dungVong'
import { MuaKhungNen, type KetQuaNen } from './MuaKhungNen'
import { DAT_THI, GOC_CHOI, SO_CAU_THI, type Ben, type GocChoi } from './soanCau/gameChong'
import { TEACHERS } from './teachers'
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
  Nút lối SSA (15/10/2026 — người dùng: "làm giống như cách mà SSA đã solo trong các clip … đưa ra gợi ý khắp đàn chứ ko phải 1 vị
  trí"): mỗi viên chồng bass + hợp âm ba của anh rồi chạy nốt trên đỉnh; gợi ý thế chồng khắp tầm tay phải của anh (`hocSolo/loiSsa.ts`,
  đo bằng hình — tools/do_tay_ssa.py). Duyệt cùng ngày ("game nốt rơi làm theo lối SSA tôi thấy rất ổn") — bỏ chữ "(thử)".
  Rồi người dùng: "Sao 3 thầy còn lại ko làm theo lối SSA. Chồng hợp âm rồi chạy ngón theo nhóm đuôi · Cho mục quy tắc nhóm đuôi học theo
  kiểu chồng hợp âm và chạy nốt giống SSA": ba nút thầy (chưa duyệt) đổi hẳn sang chồng + chạy — thế tay phải của thầy, chạy nốt chính của
  thầy (`loiSsa.ts` · `taoCauThayChong`; lối cũ "bấm đủ nốt chính" bỏ vì chưa được duyệt); màn quy tắc (đã duyệt) giữ nguyên, thêm nút thử
  "Quy tắc · chồng + chạy" (`chonCauQuyTacChong`) — duyệt đạt thì người dùng quyết giữ hay thay.
  Backing track (15/10/2026 — người dùng: "Cho Mục lối SSA và các thầy khác có nhạc backing track để solo trên đó"): ba thầy có khung "Solo
  trên backing track" mở `MuaKhungNen` (câu bộ soạn của thầy, đoạn · giọng chọn được, "Đổi câu"). Lối SSA: bản đầu (đúng vòng anh chơi, nền
  bass + rải 5 – 8) người dùng bác — "dở cả về nhạc backing track lẫn tính năng. Sao bạn không thêm tính năng backing track trong mục Lối SSA
  như hình. Hãy chọn vòng hợp âm trong các clip SSA rồi làm backing track theo các điệu ballad hoặc bossa của Cà Pháo"; nay khung "Solo trên
  backing track (thử)" đứng đầu màn Lối SSA: chọn vòng (`VONG_SSA`), điệu Cà Pháo (bốn nút trang Cà Pháo, dựng bằng `dungVong` như Tập solo),
  nhịp — rồi chơi thẳng (`MuaKhungNen` `ngay`), Dừng là về lại đây kèm tổng kết; nốt nên chơi khi vào hợp âm tô ★ (`nenChoiVong`). Duyệt
  đạt thì bỏ chữ "(thử)".
*/

type Vien = CauKhung & { khungTen: string; ssa?: PhanSsa }
type Bo = 'quy-tac' | 'quy-tac-chong' | 'ssa' | ThayChay
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
/** Giọng cho backing track của thầy. */
const GIONG_NEN: readonly { ten: string; tonic: number; thu: boolean }[] = [
  { ten: 'Đô trưởng', tonic: 0, thu: false },
  { ten: 'La thứ', tonic: 9, thu: true },
  { ten: 'Fa trưởng', tonic: 5, thu: false },
  { ten: 'Rê thứ', tonic: 2, thu: true },
  { ten: 'Sol trưởng', tonic: 7, thu: false },
  { ten: 'Mi thứ', tonic: 4, thu: true },
]
const TEN_DOAN: Readonly<Record<Doan, string>> = { intro: 'Dạo', interlude: 'Giang tấu', outro: 'Kết' }
/** Điệu đệm cho backing Lối SSA: bốn điệu Cà Pháo đã duyệt (nút trang Cà Pháo — `TEACHERS`). */
const DIEU_SSA = TEACHERS.find((t) => t.id === 'ca-phao')!.styleIds.map((id) => ({ id, ten: getStyle(id)?.familyName ?? id, bpm: getStyle(id)?.bpm ?? 0 }))
const NHIP_SSA = [50, 60, 70, 80, 90, 100, 110] as const
/** Tên hợp âm gõ bằng chữ (Gbmaj9 · F#m7b5) viết lại bằng dấu ♭ ♯ để đọc. */
const dauHop = (s: string) => s.replace(/(^|\/)([A-G])b/g, '$1$2♭').replace(/b(?=\d)/g, '♭').replace(/#/g, '♯')
/** Lực nền so với điệu gốc — tiếng bạn đánh nổi hơn nền (Claude chọn, chưa nghe thử; nền nhỏ quá thì lùi về 1). */
const LUC_NEN = 0.8
const NHAP: readonly { id: CachNhap; ten: string; mo: string }[] = [
  { id: 'chay', ten: 'Chạy nốt khung', mo: 'đàn MIDI · phím máy tính · chạm phím — bấm từng nốt của khung, thứ tự nào cũng được' },
  { id: 'chon', ten: 'Chọn tên khung', mo: 'bốn nút to — bấm nút là nghe và thấy khung ấy; hợp điện thoại' },
]

/** Nốt khung đặt từ gốc ở quãng tám 4, đi lên — để nghe và để hé lộ trên bàn phím. */
const khungLen = (g: number, pcs: readonly number[]) => pcs.map((p) => 60 + g + pc(p - g)).sort((a, b) => a - b)
const ngheMau = async (ds: readonly (readonly number[])[]) => {
  await startAudio()
  playChordSequence(
    ds.map((x) => x as MidiNote[]),
    0.3,
  )
}
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
  /** Backing track đang mở (Lối SSA · thầy) — null là màn mưa thường. */
  const [nen, setNen] = useState<null | { tieuDe: string; moTa: string; nap: (take: number) => VongNen | null; coDoiCau: boolean; bpm: number; ngay?: Ben }>(null)
  const [giongNen, setGiongNen] = useState(0)
  const [doanNen, setDoanNen] = useState<Doan>('interlude')
  /** Backing track Lối SSA: vòng · điệu · nhịp đang chọn, đang dựng nền, lỗi, kết quả lượt vừa rồi. */
  const [vongSsa, setVongSsa] = useState(VONG_SSA[0]!.id)
  const [dieuSsa, setDieuSsa] = useState(DIEU_SSA[0]!.id)
  const [bpmSsa, setBpmSsa] = useState(60)
  const [dungNen, setDungNen] = useState(false)
  const [loiNen, setLoiNen] = useState('')
  const [kqNen, setKqNen] = useState<null | (KetQuaNen & { ten: string })>(null)
  const thi = ben === 'thi'
  const thay: ThayChay | null = bo === 'quy-tac' || bo === 'quy-tac-chong' || bo === 'ssa' ? null : bo
  const laThay = thay !== null
  const laSsa = bo === 'ssa'
  /** Mọi bộ trừ màn quy tắc cũ chơi lối chồng + chạy. */
  const laChong = bo !== 'quy-tac'
  const tenThay = thay ? tenThayCua(thay) : ''
  const DS: readonly { ten: string; goiY: string; quyTac: readonly string[] }[] = useMemo(
    () => (bo === 'quy-tac' || bo === 'quy-tac-chong' ? MAN_KHUNG : bo === 'ssa' ? MAN_SSA : manThay(bo)),
    [bo],
  )
  /** Lối chồng + chạy chỉ chạy nốt (chưa có bốn nút chọn). */
  const cachNhap: CachNhap = laChong ? 'chay' : nhap
  // Nút thầy đổi việc (bấm đủ nốt chính → chồng + chạy) nên kỷ lục ghi khóa mới, không lẫn kỷ lục lối cũ.
  const khoaKyLuc = (k: number) => `${bo === 'quy-tac' ? '' : laThay ? `${bo}-chong|` : `${bo}|`}${k}${moc.thi !== MOC_MAC_DINH.thi ? `|${moc.thi}s` : ''}`
  /* Máy rơi chung (`useMuaRoi`) — đồng hồ, sinh viên, trượt, chờ, chấm; tách từ file này 15/10/2026, hành vi giữ nguyên. */
  const may = useMuaRoi<Vien>({
    thi,
    choNot,
    giay: moc[ben],
    tao: (sai, truoc) => {
      if (bo === 'ssa') return chonCauSsa(man, GOC_CHOI[gocChoi], sai, truoc)
      if (bo === 'quy-tac-chong') return chonCauQuyTacChong(man, GOC_CHOI[gocChoi], sai, truoc)
      if (bo !== 'quy-tac') return chonCauThayChong(bo, man, GOC_CHOI[gocChoi], sai, truoc)
      const cau = chonCauKhung(man, GOC_CHOI[gocChoi], sai, truoc)
      return { ...cau, khungTen: cau.quyTac }
    },
    soLo: (v) => (v.ssa ? v.ssa.lo.length : v.k.not.length),
    choChu: (d) =>
      d.ssa
        ? `Viên ${d.ten} đang chờ — chồng ${d.ssa.bass !== null ? 'bass + ' : ''}${d.ssa.tenChong}${d.ssa.soChay ? ` rồi chạy ${d.ssa.soChay} nốt trên đỉnh` : ''} để mưa rơi tiếp.`
        : `Viên ${d.ten} đang chờ — chạy đủ khung (${d.goiY.replace(/^khung /, '')}) để mưa rơi tiếp.`,
    khiXong: (v, dung) => {
      if (dung) void (v.ssa ? ngheMau(mauSsa({ g: v.g, ssa: v.ssa })) : ngheKhung(v.g, v.k.not.map((n) => n.p)))
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

  /* Lối SSA trên backing track: dựng đệm điệu Cà Pháo trên vòng đã chọn (tab Tái hòa âm gắn ngầm, như Tập solo) rồi chơi thẳng. */
  async function moNenSsa(b: Ben) {
    const v = VONG_SSA.find((x) => x.id === vongSsa)!
    const dieu = DIEU_SSA.find((x) => x.id === dieuSsa)!
    setLoiNen('')
    setDungNen(true)
    try {
      await startAudio()
      const cau = cauVongSsa(v)
      const dem = await dungVong({ styleId: dieu.id, o: v.o.map((h) => [h]), giong: `${v.tonic}:major` })
      if (dem.phach.length !== cau.length) throw new Error(`Điệu ${dieu.ten} dựng ra ${dem.phach.length} hợp âm, vòng có ${cau.length} — thử điệu khác.`)
      const vong: VongNen = {
        ten: `${v.ten} · ${dieu.ten}`,
        cau,
        nhip: [...dem.phach],
        nen: dem.timeline.map((e) => ({ notes: e.notes, startBeat: e.startBeat, durationBeats: e.durationBeats, velocity: Math.round(e.velocity * LUC_NEN) })),
      }
      setKqNen(null)
      setNen({ tieuDe: `Lối SSA · ${vong.ten}`, moTa: '', nap: () => vong, coDoiCau: false, bpm: bpmSsa, ngay: b })
    } catch (e) {
      setLoiNen(e instanceof Error ? e.message : String(e))
    } finally {
      setDungNen(false)
    }
  }

  /* Chạy nốt: mỗi cú bấm xuống (mọi nguồn) — nghe thẳng kho MIDI, mỗi cú một lần (bấm nhiều nốt cùng lúc vẫn đếm đủ). */
  useNotXuong((note) => {
    const v = may.dangDich()
    if (cachNhap !== 'chay' || g.pha !== 'choi' || !v) return
    if (v.ssa) {
      const r = chamSsa({ ten: v.ten, g: v.g, k: v.k, ssa: v.ssa }, g.daChay, note)
      if (r.kq === 'dung') return may.giai(v)
      if (r.kq === 'sai') return may.saiLan(v, `Chưa đúng — ${r.chu}`)
      if (r.kq === 'bo') g.bao = { loai: 'sai', chu: r.chu }
      else {
        g.daChay = r.daChay
        if (r.chu) g.bao = { loai: 'dung', chu: r.chu }
      }
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

  if (nen && (g.pha === 'chuan-bi' || g.pha === 'het'))
    return (
      <MuaKhungNen
        key={nen.tieuDe}
        tieuDe={nen.tieuDe}
        moTa={nen.moTa}
        nap={nen.nap}
        coDoiCau={nen.coDoiCau}
        bpmMacDinh={nen.bpm}
        tenThay={tenThay}
        ngay={nen.ngay}
        onThoat={(kq) => {
          if (kq && nen.ngay) setKqNen({ ...kq, ten: nen.tieuDe })
          setNen(null)
        }}
      />
    )

  if (g.pha === 'chuan-bi' || g.pha === 'het')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h4 className="text-lg font-semibold text-cream">
          {laThay
            ? `Mưa nốt ${tenThay} — chồng hợp âm rồi chạy ngón, theo nhóm đuôi của ${tenThay}`
            : laSsa
              ? 'Mưa khung nốt · lối SSA — chồng hợp âm màu rồi chạy ngón, theo nhóm đuôi'
              : bo === 'quy-tac-chong'
                ? 'Mưa khung nốt · quy tắc nhóm đuôi — chồng hợp âm rồi chạy nốt (thử)'
                : 'Mưa khung nốt — học khung theo quy tắc nối các nhóm đuôi'}
        </h4>
        {/* Nút thầy (thử, 15/10/2026): mỗi thầy một nút — duyệt đạt thì bỏ chữ "(thử)". */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setBo('quy-tac')} className={nut(bo === 'quy-tac')} aria-pressed={bo === 'quy-tac'}>
            Màn quy tắc nhóm đuôi
          </button>
          <button type="button" onClick={() => setBo('quy-tac-chong')} className={nut(bo === 'quy-tac-chong')} aria-pressed={bo === 'quy-tac-chong'}>
            Quy tắc · chồng + chạy (thử)
          </button>
          <button type="button" onClick={() => setBo('ssa')} className={nut(laSsa)} aria-pressed={laSsa}>
            Lối SSA
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
                <p className="mb-1 text-dim">{laChong ? 'Hợp âm cần ôn' : 'Khung cần ôn'}:</p>
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
        {laSsa ? (
          <p className="text-xs text-dim">
            Lối chơi đo bằng hình trong ba clip "Rải Ngón" của anh SSA: tay trái gõ bass (rải thêm 5 – 8 nếu muốn), tay phải CHỒNG một hợp âm
            ba quen lên trên bass thành hợp âm màu (Cmaj7 = Đô + Em), rồi CHẠY {SO_NOT_CHAY} nốt trên đỉnh trong lúc thế còn vang (anh giữ
            tiếng bằng pedal). Viên viền cam là viên đang đố: chồng trước (bấm cùng lúc hay rải từng nốt đều được), chạy sau. Thế chồng đặt ở
            đâu cũng được — rơi quá 60 % thì phím gợi ý sáng dần: viền xanh tay trái, viền cam tay phải. Nốt tránh / ngoài khung là sai; nốt
            khung anh ít đặt trên đỉnh không tính. Bốn màn "Như anh" là đúng hợp âm và đúng phím anh bấm trong từng clip — cả các hợp âm màu
            lạ (13sus(♭9) · maj9(13) · m7♭5(9,11) …).
          </p>
        ) : laThay ? (
          <p className="text-xs text-dim">
            Lối chồng + chạy như anh SSA, mà là của {tenThay}: hợp âm rơi theo đúng LOẠI và BẬC bộ soạn của {tenThay} hay đặt — mỗi màn một
            nhóm đuôi của {tenThay}. Viên viền cam là viên đang đố: CHỒNG bass + thế tay phải của {tenThay} (bấm cùng lúc hay rải, chỗ nào cũng
            được), rồi CHẠY {SO_NOT_CHAY} nốt CHÍNH của {tenThay} trên đỉnh — nốt hợp âm và nốt bộ soạn của thầy đánh từ 10 %. Nốt thầy không
            đánh lần nào là sai; nốt thầy đánh ít không tính. Rơi quá 60 % thì gợi ý sáng dần: viền xanh tay trái, viền cam tay phải.
          </p>
        ) : bo === 'quy-tac-chong' ? (
          <p className="text-xs text-dim">
            Chín màn quy tắc như cũ (học loại cha rồi suy ra loại con bằng một thay đổi nhỏ — viên ghi "từ Cmaj7: B → B♭"), mà chơi theo lối
            chồng + chạy của anh SSA: CHỒNG bass + thế tay phải — thế anh SSA nếu loại ấy anh có đo, không thì công thức chồng của app — rồi
            CHẠY {SO_NOT_CHAY} nốt trên đỉnh (nốt hợp âm hay nốt đỉnh nên chọn của loại). Thay đổi nhỏ của quy tắc nằm ngay trong thế chồng:
            Cmaj7 = Đô + Mi–Sol–Si, C7 = Đô + Mi–Sol–Si♭. Gợi ý: viền xanh tay trái, viền cam tay phải.
          </p>
        ) : (
          <p className="text-xs text-dim">
            Tên hợp âm rơi xuống. Viên viền cam là viên đang đố: bấm đủ các nốt KHUNG của nó (thứ tự nào, quãng tám nào cũng được) trước khi
            viên chạm đáy — hay chọn đúng tên khung. Mỗi màn là một quy tắc nối các nhóm đuôi: học loại cha rồi suy ra loại con bằng một thay
            đổi nhỏ. Khung nốt từng loại xem kỹ ở tab Game chạy ngón.
          </p>
        )}
        {laSsa && (
          <div className="rounded-lg border border-yellow-300/50 bg-yellow-300/5 p-3">
            <p className="font-semibold text-cream">Solo trên backing track (thử) — vòng của anh SSA, đệm điệu Cà Pháo</p>
            <p className="mb-2 text-xs text-dim">
              Chọn một vòng anh SSA chơi trong clip và một điệu Cà Pháo; nền phát lặp, hợp âm rơi khớp nhịp — mỗi hợp âm một ô 4 phách: chồng như
              lối SSA rồi chạy {SO_NOT_CHAY} nốt trước khi viên chạm đáy. Bên luyện, phím ghi <b className="text-yellow-300">★</b> là nốt NÊN
              CHƠI khi vào hợp âm — nốt màu của hợp âm và nốt nối êm từ hợp âm trước; chồng xong thì vùng chạy ngay trên thế sáng lên: vàng là nốt
              nên chơi, xanh nhạt là các nốt còn lại của khung.
            </p>
            {kqNen && (
              <div className="mb-2 rounded border border-amber-key/50 bg-amber-key/10 p-2 text-xs text-cream">
                <p className="text-sm">
                  {kqNen.ten}:{' '}
                  {kqNen.thi && kqNen.dung + kqNen.sai >= SO_CAU_THI ? (
                    <b className={kqNen.dung >= DAT_THI ? 'text-teal-key' : 'text-rose-300'}>
                      {kqNen.dung >= DAT_THI ? `ĐẠT ✓ ${kqNen.dung}/${SO_CAU_THI}` : `Chưa đạt ${kqNen.dung}/${SO_CAU_THI} — cần ${DAT_THI}`}
                    </b>
                  ) : (
                    'Dừng'
                  )}{' '}
                  — <b className="text-amber-key">{kqNen.diem} điểm</b> · đúng {kqNen.dung} · sai / trượt {kqNen.sai} · ♩ = {kqNen.bpm}
                </p>
                {kqNen.saiO.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-1">
                    {[...new Map(kqNen.saiO.map((x) => [x.ten, x])).values()].map((x) => (
                      <li key={x.ten}>
                        <b className="font-mono">{x.ten}</b>
                        <span className="block text-dim">{x.meo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <p className="mb-1 text-xs text-dim">Vòng</p>
            <div className="mb-1 flex flex-col gap-1.5">
              {VONG_SSA.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVongSsa(v.id)}
                  className={`${nut(vongSsa === v.id)} text-left`}
                  aria-pressed={vongSsa === v.id}
                  title={v.nguon}
                >
                  {v.ten}
                  <span className="block font-mono text-[11px] text-dim">{v.o.map(dauHop).join(' · ')}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 text-[11px] text-dim">{VONG_SSA.find((v) => v.id === vongSsa)!.nguon}</p>
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-dim">Điệu Cà Pháo</span>
              {DIEU_SSA.map((d) => (
                <button key={d.id} type="button" onClick={() => setDieuSsa(d.id)} className={nut(dieuSsa === d.id)} aria-pressed={dieuSsa === d.id}>
                  {d.ten}
                </button>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-dim">♩ =</span>
              {NHIP_SSA.map((x) => (
                <button key={x} type="button" onClick={() => setBpmSsa(x)} className={nut(bpmSsa === x)} aria-pressed={bpmSsa === x}>
                  {x}
                </button>
              ))}
              <span className="text-dim">· điệu gốc ♩ = {DIEU_SSA.find((d) => d.id === dieuSsa)!.bpm}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" disabled={dungNen} onClick={() => void moNenSsa('meo')} className={nut(false)}>
                {dungNen ? 'Đang dựng nền…' : 'Luyện có mẹo với backing'}
              </button>
              <button type="button" disabled={dungNen} onClick={() => void moNenSsa('thi')} className={nut(false)}>
                Thi không mẹo — {SO_CAU_THI} hợp âm với backing
              </button>
            </div>
            {loiNen && <p className="mt-1 text-xs text-rose-300">{loiNen}</p>}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              {laSsa
                ? 'Viên ghi thế chồng ("Đô + Em"). Rơi quá 60 % thì phím bass và thế chồng sáng dần khắp đàn. Không mất mạng.'
                : laThay
                  ? 'Viên ghi bậc và thế chồng của thầy. Rơi quá 60 % thì phím bass và thế chồng sáng dần. Không mất mạng.'
                  : bo === 'quy-tac-chong'
                    ? 'Viên ghi quy tắc so với loại cha và thế chồng. Rơi quá 60 % thì phím bass và thế chồng sáng dần. Không mất mạng.'
                    : 'Viên ghi quy tắc so với loại cha ("từ Cmaj7: B → B♭") và tên khung. Rơi quá 60 % thì phím khung sáng dần. Không mất mạng.'}
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.meo} doi={(s) => setMoc((m) => ({ ...m, meo: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={choNot} onChange={() => setChoNot((x) => !x)} />
                Chờ đúng nốt — viên dừng ở gần đáy, đợi bạn {laChong ? 'chồng và chạy xong' : 'chạy đủ khung'} mới rơi tiếp
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
              Chỉ tên hợp âm, không hiện {laChong ? 'thế chồng' : 'khung'}. {SO_CAU_THI} viên một lượt, sai lần đầu là tính sai; đúng từ {DAT_THI} là Đạt màn. Kỷ lục ghi
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
        {laThay && thay && (
          <div className="rounded-lg border border-line p-3">
            <p className="font-semibold text-cream">Solo trên backing track của {tenThay}</p>
            <p className="mb-2 text-xs text-dim">
              Bộ soạn của {tenThay} tự chọn vòng (như nghe – đáp ở Game chạy ngón); nền là tay trái của {tenThay} + thế tay phải có màu. Viên rơi
              khớp nhịp — mỗi hợp âm chồng thế của {tenThay} rồi chạy nốt chính của {tenThay} trong ô của nó. "Đổi câu" lấy vòng mới.
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-dim">Đoạn</span>
              {DOAN.map((d) => (
                <button key={d} type="button" onClick={() => setDoanNen(d)} className={nut(doanNen === d)}>
                  {TEN_DOAN[d]}
                </button>
              ))}
              <span className="ml-2 text-dim">Giọng</span>
              {GIONG_NEN.map((x, i) => (
                <button key={x.ten} type="button" onClick={() => setGiongNen(i)} className={nut(giongNen === i)}>
                  {x.ten}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={nut(false)}
              onClick={() => {
                const gi = GIONG_NEN[giongNen]!
                setNen({
                  tieuDe: `${tenThay} · ${TEN_DOAN[doanNen]} · ${gi.ten} · backing track`,
                  moTa: `Vòng và câu của bộ soạn ${tenThay} (${TEN_DOAN[doanNen].toLowerCase()}, ${gi.ten}); nền tay trái ${tenThay} + thế màu. Chồng thế của ${tenThay}, chạy nốt chính của ${tenThay} (đo trên bộ soạn).`,
                  nap: (take) => vongThay(thay, gi.tonic, gi.thu, doanNen, take),
                  coDoiCau: true,
                  bpm: 60,
                })
              }}
            >
              Solo với backing track — {TEN_DOAN[doanNen]} · {GIONG_NEN[giongNen]!.ten}
            </button>
          </div>
        )}
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
          {!laChong && (
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
  /* Viên chồng + chạy: bàn phím hai tay hai màu (`BanPhimChong`, dùng chung với backing track). Màn quy tắc cũ: tay trái sáng gốc, tay phải
     là nốt khung đã chạy, viền cam là khung đang hé lộ. */
  const ssa = dich?.ssa ?? null
  const nhuAnh = ssa?.loai === 'nhu-anh'
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
          : (g.bao?.chu ??
            (laChong
              ? `Viên viền cam đang đố — chồng bass + thế ở trên, rồi chạy nốt trên đỉnh.`
              : `Viên viền cam đang đố — bấm đủ các nốt khung của nó.`))}
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
      {ssa && dich ? (
        <BanPhimChong c={{ ...dich, ssa }} daChay={g.daChay} loN={loN} thi={thi} thap={thap} cao={cao} tenThay={tenThay} />
      ) : (
        <BanPhimHaiTay trai={banTrai} phai={banPhai} lo={banLo} nhan={nhan} lowNote={thap} highNote={cao} />
      )}
      <p className="text-xs text-dim">
        {laChong
          ? nhuAnh && ssa
            ? `Chồng: ${ssa.bass !== null ? 'bass rồi ' : ''}các nốt tay phải của anh (cùng lúc hay rải từng nốt).${ssa.soChay ? ` Chạy: ${ssa.soChay} nốt anh chạy.` : ''} Nốt ngoài hợp âm, ngoài các nốt anh đánh là sai.`
            : laThay
              ? `Chồng: bass rồi ${ssa?.tenChong ?? 'thế chồng'} ở trên (cùng lúc hay rải từng nốt). Chạy: ${SO_NOT_CHAY} nốt chính của ${tenThay} trên đỉnh; nốt thầy không đánh là sai, nốt thầy đánh ít không tính.`
              : `Chồng: bass rồi ${ssa?.tenChong ?? 'thế chồng'} ở trên (cùng lúc hay rải từng nốt). Chạy: ${SO_NOT_CHAY} nốt trên đỉnh — nốt hợp âm hay nốt nên đặt trên đỉnh; nốt tránh / ngoài khung là sai.`
          : cachNhap === 'chay'
            ? 'Bấm từng nốt của khung (đàn MIDI, phím máy tính hay chạm phím) — đủ mọi nốt là ăn; bấm nốt ngoài khung là sai.'
            : 'Chọn tên khung ở bốn nút trên — bấm nút là nghe và thấy khung ấy trên đàn.'}
        {!thi &&
          (laChong
            ? ' Gợi ý hiện dần: viền xanh là phím tay trái, viền cam là phím tay phải; phím bạn bấm sáng xanh (tay trái) hay hồng (tay phải).'
            : ' Viền cam trên phím là khung đang hiện dần.')}
      </p>
      {!thi && (
        <details className="rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85" open={!hep}>
          <summary className="cursor-pointer text-teal-key">{laSsa ? 'Lối SSA của màn này' : laThay ? 'Thầy chọn nốt thế nào' : 'Quy tắc của màn này'}</summary>
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
