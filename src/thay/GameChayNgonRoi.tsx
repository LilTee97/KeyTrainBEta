import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getPlaybackBeats, playChord, startAudio, startTimelineLoop, stopTimelineLoop } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiNote } from '../shared/musicTheory/types'
import { BanPhimHaiTay, type NhanHaiTay } from './BanPhimHaiTay'
import { ChonMoc, VungRoi, type VienRoi } from './GameChong'
import { loiBoSoan, THAY_CHAY, type ThayChay } from './hocSolo/cauThay'
import {
  chamNot,
  chamO,
  chonCauNgon,
  chonCauNgonThay,
  khungVong,
  MAN_NGON,
  notThayVao,
  notVaoO,
  SO_NOT_CAU,
  type CachChay,
  type CauNgon,
} from './hocSolo/chayNgonRoi'
import {
  chongDuoi,
  goiYDinh,
  LOAI_KHUNG,
  mucCua,
  nenVong,
  notCua,
  SSA,
  tenBacKhung,
  tenPhim,
  VONG_KHUNG,
  type Khung,
  type MucKhung,
  type NhomKhung,
} from './hocSolo/khungNot'
import { gocDep, tenBam } from './soanCau/chongHopAm'
import { doanGiong } from './soanCau/doTaiHoaAm'
import { DAT_THI, diemCau, GOC_CHOI, SO_CAU_THI, type Ben, type GocChoi } from './soanCau/gameChong'
import { docHop } from './soanCau/thayTrongVong'
import { DOAN, manThay, soanTuDo, tenThayCua, vaiThayTrenKhung, type CauTuDo, type Doan } from './hocSolo/thayNhac'
import { capKyLuc, docKyLuc, ghiKyLuc, useMuaRoi, useNotXuong } from './useMuaRoi'
import { GOC } from './vongThay'

/*
  GAME CHẠY NGÓN — người dùng 15/10/2026: "sao game chạy ngón ko làm giống game nốt rơi luôn. Hãy thiết kế cả 2 phần của game chạy ngón
  giống kiểu game nốt rơi. Hãy làm thử thành nút để tới khi nào tôi duyệt đạt rồi mới xóa nút cũ". Làm thành nút thử; người dùng duyệt đạt
  cùng ngày ("game chạy ngón thử và game nốt rơi đã đạt hãy giữ chúng lại. Bỏ các game chạy ngón cũ") — thay hẳn bản 15/10 không rơi
  (GameKhungNot.tsx, đã xoá; ba khối hiển thị DongKhung · XemKhung · BiQuyetSsa chuyển sang đây).
  Khuôn như Mưa khung nốt: màn chọn hai bên (luyện có mẹo · thi 20 viên, đúng từ 16 là Đạt), bấm màn là mở hẳn màn chơi, vùng mưa, bàn
  phím dài. Phần 1 dùng máy rơi chung (`useMuaRoi`); phần 2 rơi theo ĐỒNG HỒ NỀN (`getPlaybackBeats` — chỗ tai đang nghe): viên chạm đáy
  đúng lúc hết hợp âm. Logic, luật chấm và cơ sở: `hocSolo/chayNgonRoi.ts`.
*/

const pc = (x: number) => ((x % 12) + 12) % 12
const KHO = 'keytrain.chay-ngon-roi.v1'
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/80 hover:bg-white/8'}`
const bo8 = (ten: string) => ten.replace(/-?\d+$/, '')
const ngan = (gam: string) => gam.replace(/ \(.*\)$/, '')
const hepManHinh = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 640px)').matches
/** Dời nốt vào tầm bàn phím đang vẽ (điện thoại C3–C5). */
const vua = (ns: readonly number[], thap: number, cao: number) =>
  ns.map((m) => {
    let x = m
    while (x < thap) x += 12
    while (x > cao) x -= 12
    return x
  })
const ngheHop = async (ds: readonly number[]) => {
  await startAudio()
  playChord(ds as MidiNote[], '1n', 80)
}
const kyLucChu = (r: { tot: number } | undefined) =>
  r ? (r.tot >= DAT_THI ? `Đạt ✓ ${r.tot}/${SO_CAU_THI}` : `chưa đạt · tốt nhất ${r.tot}/${SO_CAU_THI}`) : 'chưa thi'

type Phan = 'lam-quen' | 'solo' | ThayChay
const PHAN: readonly { id: Phan; ten: string; mo: string }[] = [
  { id: 'lam-quen', ten: '1 · Làm quen loại hợp âm', mo: 'tên hợp âm rơi — bấm nốt chính, chạy câu trong khung, hay chồng hai tay như anh SSA' },
  { id: 'solo', ten: '2 · Solo trên vòng kiểu SSA', mo: 'nền chạy theo vòng, hợp âm rơi khớp nhịp — phách 1 mỗi hợp âm đặt một nốt chính' },
]
/* Nút thầy (thử, 15/10/2026 — người dùng: "3 nút riêng mang phong cách của từng thầy (từ hợp âm cho đến nốt solo)"): mỗi thầy một nút,
   hợp âm và khung nốt đo trên bộ soạn của thầy (`hocSolo/thayNhac.ts`). Duyệt đạt thì bỏ chữ "(thử)". */
const MO_THAY: Readonly<Record<ThayChay, string>> = {
  'ca-phao': 'ballad: m7 · maj7 · sus · 13 · m7♭5 — học theo nhóm đuôi, rồi nghe – đáp trên vòng anh chọn',
  'linh-nhi': 'slow rock: hợp âm ba là chính, V7 · sus4 · ii° — học theo nhóm đuôi, rồi nghe – đáp trên vòng chị chọn',
  blues: 'hợp âm bảy có màu I13 · IV9 · V9 · V7♯9 — học theo nhóm đuôi, rồi nghe – đáp trên khung 12 ô',
}
const tenLoaiNgon = (ids: readonly string[]) => (ids.length > 8 ? `cả ${ids.length} loại` : ids.map((id) => LOAI_KHUNG.find((l) => l.id === id)!.ten).join(' · '))
const MOC_MAC_DINH: Readonly<Record<Ben, number>> = { meo: 20, thi: 14 }
const GOC_TEN: readonly { id: GocChoi; ten: string }[] = [
  { id: 'do', ten: 'Chỉ gốc Đô' },
  { id: 'trang', ten: 'Gốc phím trắng' },
  { id: 'tat', ten: 'Cả 12 gốc' },
]
const CACH: readonly { id: CachChay; ten: string; mo: string; viec: string }[] = [
  {
    id: 'chinh',
    ten: 'Nốt chính',
    mo: 'Bấm đủ các nốt chính (nốt của hợp âm, kể cả nốt màu có trong tên) — thứ tự, quãng tám nào cũng được; bấm nốt phụ hay nốt không màu là sai',
    viec: 'bấm đủ nốt chính',
  },
  {
    id: 'cau',
    ten: 'Chạy câu',
    mo: `Chạy liền từ ${SO_NOT_CAU} nốt trong khung, không đụng nốt không màu, dừng ở một nốt chính (nốt ngân) — nốt phụ dùng để đi qua`,
    viec: `chạy ${SO_NOT_CAU} nốt trong khung, dừng ở nốt chính`,
  },
  {
    id: 'chong',
    ten: 'Chồng hai tay',
    mo: 'Giữ cùng lúc: bass gốc thấp nhất + đủ nốt hợp âm (bỏ được 5; hợp âm 13 bỏ được 9), không nốt không màu — tay phải là hợp âm quen như anh SSA, nốt trên cùng là giai điệu',
    viec: 'chồng đủ hợp âm, bass gốc',
  },
]
const NHIP_DO = [50, 60, 70, 80] as const
/** Bấm sớm hơn lúc đổi hợp âm tới chừng này phách vẫn tính cho hợp âm mới (hay vào hơi sớm). Claude chọn, chưa đo — lùi nếu chấm oan. */
const SOM = 0.25

interface Vong {
  id: string
  ten: string
  chu: string
  tonic: number
  thu: boolean
  ghiChu: string
}
interface VienO extends VienRoi {
  /** Ô thứ mấy kể từ lúc nền chạy (không quay về 0 khi vòng lặp lại). */
  i: number
  k: Khung
  xong: boolean
}

/* Các thầy trong app nói gì về mỗi nhóm — số lấy từ md đã chốt (Học Solo · Chọn nốt theo thầy). */
const THAY_NHOM: Readonly<Partial<Record<NhomKhung, string>>> = {
  'Trưởng màu': 'Cà Pháo: trên hợp âm trưởng, 9 và 13 chiếm một phần tư số nốt (828 nốt). Linh Nhi: bài trưởng bám chặt ba nốt trụ (70,2 % nốt hợp âm, n=406).',
  'Thứ màu': 'Cà Pháo đánh thẳng ♭7 và 11 trên hợp âm thứ. Linh Nhi: bài thứ rải rộng sang 9 · ♭7 · 11 (59,9 % nốt hợp âm, n=601).',
  Át: 'Blues: phách 1 · 4 là nốt hợp âm 69–77 % (3 sheet) — nốt khung đứng ở phách mạnh.',
  'Át có nốt căng': 'Cà Pháo: trên V7 có thêm ♭13 (9 % số nốt, n=66) — nốt căng đi qua rồi rơi về nốt hợp âm sau.',
}

/** Ba dòng nốt chính · phụ · không màu của khung. */
function DongKhung({ k }: { k: Khung }) {
  const theo = (muc: MucKhung) => k.not.filter((n) => n.muc === muc)
  const tranh = theo('khong')
  return (
    <div className="flex flex-col gap-1 text-xs">
      <p>
        <b className="text-teal-key">Nốt chính (xanh)</b> — nốt của hợp âm, đứng ở phách mạnh, nốt ngân, nốt đỉnh:{' '}
        {theo('chinh').map((n) => (
          <span key={n.p} className="mr-1.5 font-mono">
            {n.ten}
            <sub>{n.bac}</sub>
            {n.dau ? '*' : ''}
          </span>
        ))}
        <span className="text-dim">(* nốt đuôi mang lại màu)</span>
      </p>
      <p>
        <b className="text-amber-key">Nốt phụ (cam)</b> — đi qua ở phách nhẹ, nối hai nốt chính:{' '}
        {theo('phu').map((n) => (
          <span key={n.p} className="mr-1.5 font-mono">
            {n.ten}
            <sub>{n.bac}</sub>
          </span>
        ))}
      </p>
      {tranh.length > 0 && (
        <p className="text-dim">
          <b>Đừng ngân (không màu)</b> —{' '}
          {tranh.map((n) => {
            const duoi = k.not.find((x) => x.muc === 'chinh' && pc(n.p - x.p) === 1)
            return (
              <span key={n.p} className="mr-2 font-mono">
                {n.ten}
                <sub>{n.bac}</sub>
                {duoi ? ` (sát trên ${duoi.ten} nửa cung)` : ' (chỏi nốt treo)'}
              </span>
            )
          })}
          — chỉ lướt qua rồi đi tiếp.
        </p>
      )}
    </div>
  )
}

/** Khung của một hợp âm xem kỹ — nốt chính · phụ · không màu, nốt đỉnh nên chọn, số đo SSA, lời các thầy. */
function XemKhung({ k }: { k: Khung }) {
  const ho = k.loai?.ssa ? SSA[k.loai.ssa] : null
  return (
    <div className="flex flex-col gap-1 text-xs">
      <p className="text-cream">
        <b className="font-mono text-base text-amber-key">{k.ten}</b> — khung <b>{k.gam}</b>. <span className="text-cream/80">{k.loai?.nghe}</span>
      </p>
      <DongKhung k={k} />
      <p className="text-cream/80">
        Nốt đỉnh nên chọn:{' '}
        {k.dinh
          .slice(0, 4)
          .map((iv) => k.not.find((x) => x.iv === iv)!)
          .map((n) => `${n.ten} (${n.bac})`)
          .join(' · ')}
        .{' '}
        {ho
          ? `Anh SSA trên ${ho.ten} (${ho.n} nốt giai điệu, 3 clip): ${ho.giaiDieu.map(([b, d]) => `${b} ${d}`).join(' · ')}. Tay phải: ${ho.khungPhai}.`
          : 'Chưa có số đo SSA cho loại này — thứ tự trên là lý thuyết của Claude.'}
      </p>
      {k.loai && THAY_NHOM[k.loai.nhom] && <p className="text-dim">Các thầy trong app: {THAY_NHOM[k.loai.nhom]}</p>}
    </div>
  )
}

/** Bí quyết rải ngón của anh SSA — màn chọn phần 2. */
function BiQuyetSsa() {
  return (
    <details className="mt-2 text-xs text-cream/85">
      <summary className="cursor-pointer font-semibold text-amber-key">Bí quyết rải ngón của anh SSA — vừa giai điệu vừa hợp âm màu</summary>
      <ul className="mt-1 ml-4 list-disc">
        <li>
          Tay trái gõ <b>bass</b> ở đầu ô rồi rải 5 – 8 – 10 — ít khi bấm khối (khối hai nốt là quãng 8 hay quãng 5 của bass). Màu của hợp âm
          do <b>bass</b> quyết định.
        </li>
        <li>
          Tay phải là một <b>hợp âm ba quen</b> dựng trên một bậc của hợp âm: maj7 → hợp âm thứ trên bậc 3 (D♭ + Fm = D♭maj7) · m7 →
          hợp âm trưởng trên ♭3 (C + E♭ = Cm7) · 9sus4 / 13sus → hợp âm trưởng trên ♭7 ("Cb/Db thực ra là Db9sus4") · m7♭5 → hợp âm
          thứ trên ♭3 (B + Dm = Bm7♭5).
        </li>
        <li>
          <b>Giai điệu là nốt trên cùng của tay phải.</b> Nốt ấy vừa thuộc hợp âm ba dễ bấm, vừa là nốt màu so với bass — Si trên Cmaj7 là
          bậc 7, cùng nốt Si trên Am là bậc 9. Nên cùng một câu hát, đổi bass là đổi màu ("giai điệu vẫn là E D F E").
        </li>
        <li>Đổi nốt đỉnh = xoay thế tay phải; đổi hợp âm = giữ nốt chung trên tay phải, đổi bass, rồi bước liền sang nốt đỉnh mới.</li>
        <li>
          Chạy nốt của hợp âm màu trên nền thế còn vang (anh giữ tiếng bằng pedal) — chạy ngay sau cú chồng và ở phách cuối trước khi đổi
          hợp âm (câu dẫn).
        </li>
      </ul>
      <p className="mt-1 text-dim">
        Cơ sở (3 clip, 111 đoạn hợp âm, nốt chép máy, 98,7 % nằm trong nhãn hợp âm của clip; tay nào đánh đo bằng hình camera trên cao):
        tay trái 271 cú gõ — 1 nốt 219 · 2 nốt 47 · 3+ nốt 5; nốt giai điệu là nốt hợp âm 175/241, nốt căng có trong tên 63/241; nốt đơn tay
        phải gõ khi ≥ 2 nốt tay phải khác còn vang 176/314 (phần lớn nhờ pedal — lúc tắt nốt trùng lúc nhả pedal 55–78 %); chạy ở nửa phách
        đầu ô 45/96 · phách cuối trước khi đổi 42/96 · giữa ô 9/96 (Rai 2); đổi bass giữ ≥ 2 nốt tay phải 32/94. Lời giải thích là của Claude.
      </p>
    </details>
  )
}

function DauTrang({ phan, doi }: { phan: Phan; doi: (p: Phan) => void }) {
  return (
    <>
      <h4 className="text-lg font-semibold text-cream">Game chạy ngón — rơi như Game công thức</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {PHAN.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => doi(p.id)}
            aria-pressed={phan === p.id}
            className={`rounded-xl border p-3 text-left ${phan === p.id ? 'border-amber-key bg-amber-key/15' : 'border-line bg-white/4 hover:bg-white/8'}`}
          >
            <span className={`block font-semibold ${phan === p.id ? 'text-amber-key' : 'text-cream'}`}>{p.ten}</span>
            <span className="text-xs text-dim">{p.mo}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-dim">Theo từng thầy (thử) — hợp âm và nốt solo theo bộ soạn của thầy:</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {THAY_CHAY.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => doi(t.id)}
            aria-pressed={phan === t.id}
            className={`rounded-xl border p-3 text-left ${phan === t.id ? 'border-amber-key bg-amber-key/15' : 'border-line bg-white/4 hover:bg-white/8'}`}
          >
            <span className={`block font-semibold ${phan === t.id ? 'text-amber-key' : 'text-cream'}`}>
              {i + 3} · {t.ten} (thử)
            </span>
            <span className="text-xs text-dim">{MO_THAY[t.id]}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function TongKet({
  thi,
  nhan,
  dung,
  sai,
  diem,
  on,
  them,
}: {
  thi: boolean
  nhan: string
  dung: number
  sai: number
  diem: number
  on: readonly { ten: string; meo: string }[]
  them?: string
}) {
  return (
    <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
      {thi && dung + sai >= SO_CAU_THI ? (
        <p className="text-base text-cream">
          {nhan}:{' '}
          <b className={dung >= DAT_THI ? 'text-teal-key' : 'text-rose-300'}>
            {dung >= DAT_THI ? `ĐẠT ✓ ${dung}/${SO_CAU_THI}` : `Chưa đạt ${dung}/${SO_CAU_THI} — cần ${DAT_THI}`}
          </b>{' '}
          · {diem} điểm
        </p>
      ) : (
        <p className="text-base text-cream">
          Dừng — <b className="text-amber-key">{diem} điểm</b> · đúng {dung} · sai / trượt {sai}
        </p>
      )}
      {them && <p className="mt-1 text-xs text-cream/85">{them}</p>}
      {on.length > 0 && (
        <div className="mt-2 text-xs text-cream/85">
          <p className="mb-1 text-dim">Hợp âm cần ôn:</p>
          <ul className="flex flex-col gap-1">
            {[...new Map(on.map((x) => [x.ten, x])).values()].map((x) => (
              <li key={x.ten}>
                <b className="font-mono text-cream">{x.ten}</b>
                <span className="block text-dim">{x.meo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------------- Phần 1 — làm quen loại hợp âm ---------------- */

function LamQuenRoi({ dau, thay }: { dau: ReactNode; thay?: ThayChay }) {
  const [kyLuc, setKyLuc] = useState(() => docKyLuc(KHO))
  const [ben, setBen] = useState<Ben>('meo')
  const [man, setMan] = useState(0)
  const [gocChoi, setGocChoi] = useState<GocChoi>('do')
  const [cach, setCach] = useState<CachChay>('chinh')
  const [moc, setMoc] = useState<Record<Ben, number>>({ ...MOC_MAC_DINH })
  const [choNot, setChoNot] = useState(false)
  const [vuaXong, setVuaXong] = useState<CauNgon | null>(null)
  const giu = useMidiStore((s) => s.heldNotes)
  const thi = ben === 'thi'
  const viec = CACH.find((x) => x.id === cach)!
  /** Màn: lý thuyết — mỗi nhóm đuôi một màn; nút thầy — nhóm đuôi của chính thầy (đo trên bộ soạn). */
  const MAN: readonly { ten: string; goiY: string }[] = useMemo(
    () => (thay ? manThay(thay) : MAN_NGON.map((m) => ({ ten: m.ten, goiY: tenLoaiNgon(m.loai) }))),
    [thay],
  )
  const tenThay = thay ? tenThayCua(thay) : ''
  const khoaKyLuc = (k: number) => `ngon|${thay ? `${thay}|` : ''}${cach}|${k}${moc.thi !== MOC_MAC_DINH.thi ? `|${moc.thi}s` : ''}`
  const may = useMuaRoi<CauNgon>({
    thi,
    choNot,
    giay: moc[ben],
    tao: (sai, truoc) => (thay ? chonCauNgonThay(thay, man, GOC_CHOI[gocChoi], sai, truoc, cach) : chonCauNgon(man, GOC_CHOI[gocChoi], sai, truoc, cach)),
    soLo: (c) => c.lo.length,
    choChu: (d) => `Viên ${d.ten} đang chờ — ${viec.viec} để mưa rơi tiếp.`,
    khiXong: (c, dung) => {
      setVuaXong(c)
      if (dung && cach !== 'chong') void ngheHop([36 + c.g, ...c.lo])
    },
    khiXongThi: (dung, diem) =>
      setKyLuc((cu) => {
        const moi = capKyLuc(cu, khoaKyLuc(man), dung, diem)
        ghiKyLuc(KHO, moi)
        return moi
      }),
  })
  const { g, dich } = may
  const hep = hepManHinh()
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84

  async function batDau(b: Ben, k: number) {
    setBen(b)
    setMan(k)
    setVuaXong(null)
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
  useNotXuong((note) => {
    const v = may.dangDich()
    if (g.pha !== 'choi' || !v) return
    const r = chamNot(cach, v.k, g.daChay, note, useMidiStore.getState().heldNotes, v.vai, v.thay)
    if (r.kq === 'dung') return may.giai(v)
    g.daChay = r.daChay
    if (r.kq === 'sai') return may.saiLan(v, `Chưa đúng — ${r.chu}`)
    may.ve()
  })

  if (g.pha === 'chuan-bi' || g.pha === 'het') {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        {dau}
        {g.pha === 'het' && (
          <TongKet
            thi={thi}
            nhan={`Màn ${man + 1} · ${MAN[man]!.ten} · ${viec.ten} · rơi ${moc.thi} s`}
            dung={g.dung}
            sai={g.sai}
            diem={g.diem}
            on={g.saiCau}
          />
        )}
        {thay ? (
          <p className="text-xs text-dim">
            Hợp âm rơi theo đúng LOẠI và BẬC mà bộ soạn của {tenThay} hay đặt — mỗi màn một nhóm đuôi của {tenThay}. Khung chính · phụ · không
            là của {tenThay}: chính = nốt hợp âm và nốt bộ soạn của thầy đánh từ 10 % trên hợp âm ấy; nốt thầy không đánh lần nào là sai. Số đo
            (bộ soạn, kèm số trên sheet để so) hiện ở bảng màn và mục "Xem kỹ".
          </p>
        ) : (
          <p className="text-xs text-dim">
            Tên hợp âm rơi xuống. Viên viền cam là viên đang đố — làm đúng việc của cách chơi đã chọn trước khi viên chạm đáy. Mỗi màn là một
            nhóm đuôi. Xong mỗi viên, khung của nó (nốt chính · phụ · không màu, nốt đỉnh nên chọn, số đo SSA) hiện ở mục "Xem kỹ" dưới bàn
            phím.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">Viên ghi khung và gợi ý; rơi quá 60 % thì phím đáp án sáng dần. Không mất mạng.</p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.meo} doi={(s) => setMoc((m) => ({ ...m, meo: s }))} />
              <label className="flex items-center gap-2 text-xs text-cream/85">
                <input type="checkbox" checked={choNot} onChange={() => setChoNot((x) => !x)} />
                Chờ đúng nốt — viên dừng ở gần đáy, đợi bạn làm xong mới rơi tiếp
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              {MAN.map((m, k) => (
                <button key={m.ten} type="button" onClick={() => void batDau('meo', k)} className={nut(false)}>
                  {k + 1}. {m.ten} <span className="text-[11px] text-dim">· {m.goiY}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-key/40 p-3">
            <p className="font-semibold text-amber-key">Thi không mẹo — chấm đạt</p>
            <p className="mb-2 text-xs text-dim">
              Chỉ tên hợp âm. {SO_CAU_THI} viên một lượt, sai lần đầu là tính sai; đúng từ {DAT_THI} là Đạt màn. Kỷ lục ghi riêng theo cách chơi
              và mốc tốc độ.
            </p>
            <div className="mb-2 flex flex-col gap-1.5">
              <ChonMoc giay={moc.thi} doi={(s) => setMoc((m) => ({ ...m, thi: s }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              {MAN.map((m, k) => {
                const r = kyLuc[khoaKyLuc(k)]
                return (
                  <button key={m.ten} type="button" onClick={() => void batDau('thi', k)} className={nut(false)}>
                    {k + 1}. {m.ten} <span className={`text-[11px] ${r && r.tot >= DAT_THI ? 'text-teal-key' : 'text-dim'}`}>· {kyLucChu(r)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="mb-1 text-xs text-dim">{thay ? 'Giọng (chủ âm)' : 'Gốc'}</p>
            <div className="flex flex-wrap gap-1.5">
              {GOC_TEN.map((x) => (
                <button key={x.id} type="button" onClick={() => setGocChoi(x.id)} className={nut(gocChoi === x.id)}>
                  {x.ten}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-dim">Cách chơi</p>
            <div className="flex flex-wrap gap-1.5">
              {CACH.map((x) => (
                <button key={x.id} type="button" onClick={() => setCach(x.id)} className={nut(cach === x.id)} title={x.mo}>
                  {x.ten}
                </button>
              ))}
            </div>
            <p className="mt-1 max-w-xl text-xs text-dim">{viec.mo}.</p>
          </div>
        </div>
        <MidiConnect />
      </div>
    )
  }

  /* Bàn phím dài: cách chồng hai tay thì hiện đúng hai tay đang giữ + tên hợp âm từng tay và tổng (như nhãn trong clip SSA, tách tay ở
     Đô giữa — đoán của Claude, app không thấy tay thật); hai cách kia: tay trái sáng gốc, tay phải là nốt đã bấm đúng. */
  const loN = may.loCua(dich)
  const tayTrai = giu.filter((m) => m < 60)
  const tayPhai = giu.filter((m) => m >= 60)
  const soChinh = dich
    ? dich.vai
      ? Array.from({ length: 12 }, (_, p) => p).filter((p) => dich.vai!(60 + p) === 'chinh').length
      : dich.k.not.filter((n) => n.muc === 'chinh').length
    : 0
  const ban: { trai: number[]; phai: number[]; nhan: NhanHaiTay } =
    cach === 'chong'
      ? {
          trai: vua(tayTrai, thap, cao),
          phai: vua(tayPhai, thap, cao),
          nhan: {
            trai: tayTrai.length ? tenBam(tayTrai).ten : '',
            traiPhu: '',
            phai: tayPhai.length ? tenBam(tayPhai, false).ten : '',
            phaiPhu: '',
            tong: giu.length >= 3 ? tenBam(giu).ten : '…',
          },
        }
      : {
          trai: dich ? vua([48 + dich.g], thap, cao) : [],
          phai: vua(g.daChay, thap, cao),
          nhan: {
            trai: dich ? (dich.ten.match(/^[A-G][♭♯]?/)?.[0] ?? '') : '',
            traiPhu: dich ? 'gốc' : '',
            phai: dich && g.daChay.length ? (cach === 'chinh' ? `${new Set(g.daChay.map(pc)).size}/${soChinh}` : `${g.daChay.length} nốt`) : '',
            phaiPhu: dich && g.daChay.length ? g.daChay.map((m) => bo8(tenPhim(dich.k, m))).join(' ') : '',
            tong: '',
          },
        }
  const lo = dich && loN > 0 ? vua(dich.lo.slice(0, loN), thap, cao) : []

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
          Màn {man + 1} · {MAN[man]!.ten} · {viec.ten}
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
        {g.pha === 'dung' ? 'Đang tạm dừng.' : (g.bao?.chu ?? `Viên viền cam đang đố — ${viec.viec}.`)}
      </p>
      <BanPhimHaiTay trai={ban.trai} phai={ban.phai} lo={lo} nhan={ban.nhan} lowNote={thap} highNote={cao} />
      <p className="text-xs text-dim">
        {viec.mo}.{!thi && ' Viền cam trên phím là đáp án đang hiện dần.'}
      </p>
      {vuaXong && (
        <details className="rounded-lg border border-teal-key/30 p-2" open={!hep}>
          <summary className="cursor-pointer text-xs text-teal-key">Xem kỹ viên vừa xong — {vuaXong.ten}</summary>
          <div className="mt-1">
            {vuaXong.thay ? (
              <div className="flex flex-col gap-1 text-xs">
                <p className="text-cream">{vuaXong.loi}</p>
                <p className="text-dim">{vuaXong.meo}</p>
              </div>
            ) : (
              <XemKhung k={vuaXong.k} />
            )}
          </div>
        </details>
      )}
      <MidiConnect />
    </div>
  )
}

/* ---------------- Phần 2 — solo trên vòng có nền ---------------- */

function SoloRoi({ dau }: { dau: ReactNode }) {
  const [kyLuc, setKyLuc] = useState(() => docKyLuc(KHO))
  const [ben, setBen] = useState<Ben>('meo')
  const [vongId, setVongId] = useState<string>(VONG_KHUNG[0]!.id)
  const [tu, setTu] = useState<Vong | null>(null)
  const [go, setGo] = useState('')
  const [baoGo, setBaoGo] = useState('')
  const [bpm, setBpm] = useState<number>(60)
  const [nhip, setNhip] = useState(4)
  const [day, setDay] = useState(false)
  const [, setVe] = useState(0)
  const giu = useMidiStore((s) => s.heldNotes)
  const thi = ben === 'thi'
  const cacVong: Vong[] = tu ? [...VONG_KHUNG, tu] : [...VONG_KHUNG]
  const vong = cacVong.find((x) => x.id === vongId) ?? VONG_KHUNG[0]!
  const khoaKyLuc = (v: Vong) => `solo|${v.chu}|${bpm}|${nhip}`
  /* Trạng thái lượt chơi trong ref — vòng khung hình của vùng mưa đọc bản mới nhất. */
  const s = useRef({
    pha: 'chuan-bi' as 'chuan-bi' | 'choi' | 'het',
    ks: [] as Khung[],
    /** Mốc bắt đầu đếm vào (một ô im trước khi nền vào). */
    t0: 0,
    nen: false,
    vien: [] as VienO[],
    sinhToi: -1,
    dang: -1,
    /** Nốt bấm theo ô: cao độ và phách lúc bấm. */
    bam: new Map<number, { m: number; b: number }[]>(),
    diem: 0,
    combo: 0,
    dung: 0,
    sai: 0,
    dem: { chinh: 0, phu: 0, khong: 0 } as Record<MucKhung, number>,
    saiO: [] as { ten: string; meo: string }[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    /** Nốt giai điệu vừa đánh — gợi ý nốt đi liền bậc. */
    truoc: null as number | null,
  }).current
  const ve = () => setVe((k) => k + 1)
  const hep = hepManHinh()
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84

  /** Phách đang nghe: trước khi nền vào là đồng hồ đếm vào (âm), sau đó là đồng hồ nền đã bù lệch hình – tiếng. */
  function bayGio() {
    return s.nen ? getPlaybackBeats() : (performance.now() - s.t0) / (60000 / bpm) - nhip
  }
  async function batDau(b: Ben, v: Vong) {
    const ks = khungVong(v.chu, v.tonic, v.thu)
    if (!ks.length) return
    setBen(b)
    setVongId(v.id)
    await startAudio()
    Object.assign(s, {
      pha: 'choi',
      ks,
      t0: performance.now(),
      nen: false,
      vien: [],
      sinhToi: -1,
      dang: -1,
      bam: new Map(),
      diem: 0,
      combo: 0,
      dung: 0,
      sai: 0,
      dem: { chinh: 0, phu: 0, khong: 0 },
      saiO: [],
      bao: null,
      truoc: null,
    })
    ve()
  }
  function ketThuc() {
    if (s.pha !== 'choi') return
    s.pha = 'het'
    stopTimelineLoop()
    if (thi && s.dung + s.sai >= SO_CAU_THI)
      setKyLuc((cu) => {
        const moi = capKyLuc(cu, khoaKyLuc(vong), s.dung, s.diem)
        ghiKyLuc(KHO, moi)
        return moi
      })
    ve()
  }
  /** Viên của ô `i`: rơi hai ô — nửa trên là hợp âm kế, nửa dưới là hợp âm đang vang, chạm đáy đúng lúc hết hợp âm. */
  function sinh(i: number) {
    const k = s.ks[i % s.ks.length]!
    const gy = goiYDinh(k, null, s.ks.length > 1 ? s.ks[(i + 1) % s.ks.length]! : null).slice(0, 2)
    s.vien = [
      ...s.vien,
      {
        khoa: i,
        i,
        k,
        xong: false,
        sinh: (i - 1) * nhip,
        roi: 2 * nhip,
        lan: i % 4,
        ten: k.ten,
        khungTen: `khung ${ngan(k.gam)}`,
        goiY: `★ ${gy.map((x) => `${bo8(x.ten)} (${x.bac})`).join(' · ')}`,
      },
    ]
    s.sinhToi = i
  }
  function cham(v: VienO) {
    v.xong = true
    const vao = notVaoO(s.bam.get(v.i) ?? [], useMidiStore.getState().heldNotes)
    const r = chamO(v.k, vao.m, vao.giu)
    if (r.dat) {
      const cong = diemCau(s.combo)
      s.diem += cong
      s.combo += 1
      s.dung += 1
      s.bao = { loai: 'dung', chu: `Đạt +${cong} — ${r.chu}` }
    } else {
      s.combo = 0
      s.sai += 1
      s.saiO.push({ ten: v.k.ten, meo: `Nốt chính: ${v.k.not.filter((n) => n.muc === 'chinh').map((n) => n.ten).join(' ')} · ${v.goiY}` })
      s.bao = { loai: vao.m === null ? 'truot' : 'sai', chu: r.chu }
    }
    v.khungTen = vao.m === null ? '✗ trượt' : `${r.dat ? '✓' : '✗'} ${bo8(tenPhim(v.k, vao.m))}`
    ve()
  }
  function tick() {
    if (s.pha !== 'choi') return
    let b = bayGio()
    if (!s.nen && b >= 0) {
      startTimelineLoop(nenVong(s.ks, nhip, day), bpm, s.ks.length * nhip)
      s.nen = true
      b = bayGio()
    }
    for (const v of s.vien) if (!v.xong && b >= v.i * nhip + 1) cham(v)
    if (s.vien.some((v) => b >= (v.i + 1) * nhip)) s.vien = s.vien.filter((v) => b < (v.i + 1) * nhip)
    const dang = Math.floor(b / nhip)
    for (const i of [dang, dang + 1]) if (i >= 0 && i > s.sinhToi && (!thi || i < SO_CAU_THI)) sinh(i)
    if (dang !== s.dang) {
      s.dang = dang
      ve()
    }
    if (thi && s.dung + s.sai >= SO_CAU_THI) ketThuc()
  }
  useNotXuong((note) => {
    if (s.pha !== 'choi') return
    const b = bayGio()
    const i = Math.floor((b + SOM) / nhip)
    if (i < 0) return
    s.bam.set(i, [...(s.bam.get(i) ?? []), { m: note, b }])
    for (const x of [...s.bam.keys()]) if (x < i - 1) s.bam.delete(x)
    const k = s.ks[i % s.ks.length]!
    const muc = mucCua(k, note)
    s.dem[muc] += 1
    const phai = useMidiStore.getState().heldNotes.filter((m) => m >= 60)
    if (note >= 60 && note >= Math.max(note, ...phai)) s.truoc = note
    if (muc === 'khong') {
      s.combo = 0
      s.bao = { loai: 'sai', chu: `${bo8(tenPhim(k, note))} không màu trên ${k.ten} — chỉ lướt qua, đừng ngân (combo về 0).` }
    }
    ve()
  })
  /* Ẩn trang thì dừng lượt (nền nhạc không tạm dừng giữa chừng được mà vẫn khớp ô); rời tab thì tắt nền. */
  const ketRef = useRef(ketThuc)
  ketRef.current = ketThuc
  useEffect(() => {
    const f = () => {
      if (document.hidden) ketRef.current()
    }
    document.addEventListener('visibilitychange', f)
    return () => {
      document.removeEventListener('visibilitychange', f)
      if (s.pha === 'choi') stopTimelineLoop()
    }
  }, [s])

  const dungVong = () => {
    const ds = docHop(go)
    if (!ds?.length) {
      setBaoGo('Không đọc được — gõ tên hợp âm cách nhau bằng dấu cách, vd "Dbmaj9 Ab13sus4 Fm7 Bbm9".')
      return
    }
    const gi = doanGiong(ds)[0]
    const v: Vong = { id: 'tu-nhap', ten: `Vòng tự điền · ${go.trim()}`, chu: go.trim(), tonic: gi?.tonic ?? ds[0]!.root, thu: gi?.thu ?? false, ghiChu: '' }
    setTu(v)
    setVongId(v.id)
    setBaoGo(
      gi
        ? `App đoán giọng ${GOC[gi.tonic]} ${gi.thu ? 'thứ' : 'trưởng'} — khung đọc theo giọng ấy. Vòng đã thêm vào cuối hai danh sách.`
        : 'Chưa đoán được giọng — tạm lấy gốc hợp âm đầu làm chủ âm. Vòng đã thêm vào cuối hai danh sách.',
    )
  }

  if (s.pha !== 'choi')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        {dau}
        {s.pha === 'het' && (
          <TongKet
            thi={thi}
            nhan={`${vong.ten} · ♩ = ${bpm} · ${nhip} phách`}
            dung={s.dung}
            sai={s.sai}
            diem={s.diem}
            on={s.saiO}
            them={`Nốt đã đánh: chính ${s.dem.chinh} · phụ ${s.dem.phu} · không màu ${s.dem.khong}.`}
          />
        )}
        <p className="text-xs text-dim">
          Nền chạy theo vòng (tay trái bass như anh SSA). Tên hợp âm rơi khớp nhịp: viên viền cam là hợp âm đang vang — chạm đáy đúng lúc hết
          hợp âm; viên phía trên là hợp âm kế. Phách 1 của mỗi hợp âm, nốt giai điệu (nốt cao nhất bạn bấm, hay nốt còn giữ từ hợp âm trước)
          phải là <b className="text-teal-key">nốt chính</b>; sau đó chạy tự do trong khung, nốt không màu chỉ lướt. Có một ô đếm vào trước khi
          nền vào.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              Viên ghi khung và ★ nốt đỉnh nên chọn; phím viền cam là thế chồng tay phải dưới nốt ★; dòng chữ dưới vùng mưa nói nốt chung với
              hợp âm sau. Chạy tới khi bấm Dừng.
            </p>
            <div className="flex flex-col gap-1.5">
              {cacVong.map((v) => (
                <button key={v.id} type="button" onClick={() => void batDau('meo', v)} className={`${nut(false)} text-left`} title={v.ghiChu}>
                  {v.ten}
                  <span className="block font-mono text-[11px] text-dim">{v.chu}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-key/40 p-3">
            <p className="font-semibold text-amber-key">Thi không mẹo — chấm đạt</p>
            <p className="mb-2 text-xs text-dim">
              Chỉ tên hợp âm. {SO_CAU_THI} hợp âm một lượt, đạt từ {DAT_THI}. Kỷ lục ghi riêng theo vòng, ♩ và số phách mỗi hợp âm.
            </p>
            <div className="flex flex-col gap-1.5">
              {cacVong.map((v) => {
                const r = kyLuc[khoaKyLuc(v)]
                return (
                  <button key={v.id} type="button" onClick={() => void batDau('thi', v)} className={`${nut(false)} text-left`}>
                    {v.ten} <span className={`text-[11px] ${r && r.tot >= DAT_THI ? 'text-teal-key' : 'text-dim'}`}>· {kyLucChu(r)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-dim">♩ =</span>
          {NHIP_DO.map((x) => (
            <button key={x} type="button" onClick={() => setBpm(x)} className={nut(bpm === x)}>
              {x}
            </button>
          ))}
          <span className="ml-2 text-dim">phách mỗi hợp âm</span>
          {[2, 4].map((x) => (
            <button key={x} type="button" onClick={() => setNhip(x)} className={nut(nhip === x)}>
              {x}
            </button>
          ))}
          <span className="ml-2 text-dim">Nền</span>
          <button type="button" onClick={() => setDay(false)} className={nut(!day)}>
            Chỉ bass — bạn chồng tay phải
          </button>
          <button type="button" onClick={() => setDay(true)} className={nut(day)}>
            Bass + hợp âm — bạn chỉ đánh giai điệu
          </button>
        </div>
        <form
          className="flex flex-wrap items-center gap-1.5 text-xs"
          onSubmit={(e) => {
            e.preventDefault()
            dungVong()
          }}
        >
          <span className="text-dim">Tự điền vòng</span>
          <input
            value={go}
            onChange={(e) => setGo(e.target.value)}
            placeholder="vd Dbmaj9 Ab13sus4 Fm7 Bbm9"
            aria-label="Nhập vòng hợp âm"
            className="min-w-0 flex-1 rounded border border-line bg-white/6 px-2 py-1 font-mono text-cream"
          />
          <button type="submit" className={nut(vongId === 'tu-nhap')}>
            Thêm vòng này
          </button>
          {baoGo && <span className="w-full text-dim">{baoGo}</span>}
        </form>
        <BiQuyetSsa />
        <MidiConnect />
      </div>
    )

  /* Màn chơi: hợp âm đang vang (trong ô đếm vào thì hợp âm đầu). */
  const ks = s.ks
  const dang = Math.max(0, s.dang)
  const k = ks[dang % ks.length]!
  const sau = ks[(dang + 1) % ks.length]!
  const gy = goiYDinh(k, s.truoc, ks.length > 1 ? sau : null)
  const bass = 36 + pc(k.bass ?? k.goc)
  const chung = ks.length > 1 ? k.not.filter((n) => n.muc === 'chinh' && sau.not.some((x) => x.muc === 'chinh' && x.p === n.p)) : []
  const dich = s.vien.find((v) => v.i === s.dang) ?? null
  const nhan: NhanHaiTay = {
    trai: bo8(tenPhim(k, bass)),
    traiPhu: 'bass nền',
    phai: giu.length ? tenBam(giu, false).ten : '',
    phaiPhu: '',
    tong: giu.length >= 2 ? tenBam([bass, ...giu]).ten : '…',
  }
  const lo = !thi && gy[0] ? vua(chongDuoi(k, gy[0].m), thap, cao) : []

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/25 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={`text-xs font-semibold ${thi ? 'text-amber-key' : 'text-teal-key'}`}>{thi ? 'THI' : 'LUYỆN CÓ MẸO'}</span>
        <span className="text-cream">
          Điểm <b className="font-mono text-lg text-amber-key">{s.diem}</b>
        </span>
        <span className="text-cream">
          Combo <b className="font-mono text-lg text-teal-key">×{s.combo}</b>
        </span>
        {thi && (
          <span className="text-cream">
            Hợp âm <b className="font-mono">{Math.min(SO_CAU_THI, s.dung + s.sai + 1)}/{SO_CAU_THI}</b> · đạt{' '}
            <b className="font-mono text-teal-key">{s.dung}</b>
          </span>
        )}
        <span className="text-xs text-dim">
          {vong.ten} · ♩ = {bpm} · {nhip} phách mỗi hợp âm
        </span>
        <span className="ml-auto flex gap-1.5">
          <button type="button" onClick={ketThuc} className={nut(false)}>
            Dừng
          </button>
        </span>
      </div>

      <VungRoi vien={s.vien} dich={dich} bayGio={bayGio} tick={tick} chay meo={!thi} />

      <p
        className={`min-h-10 text-sm ${s.bao?.loai === 'dung' ? 'text-teal-key' : s.bao?.loai === 'truot' ? 'text-rose-300' : 'text-amber-key'}`}
        aria-live="polite"
      >
        {s.bao?.chu ?? (s.dang < 0 ? `Đếm vào — nền vào ở ${ks[0]!.ten}; phách 1 đặt một nốt chính.` : 'Phách 1 của mỗi hợp âm đặt một nốt chính.')}
      </p>
      {!thi && (
        <p className="text-xs text-cream/85">
          {s.dang < 0 ? 'Sắp vang' : 'Đang vang'} <b className="font-mono text-amber-key">{k.ten}</b> · khung {ngan(k.gam)} · ★{' '}
          {gy.map((x) => `${bo8(x.ten)} (${x.bac})`).join(' · ')}
          {chung.length > 0 && (
            <>
              {' '}
              · nốt chung với {sau.ten}: <b className="font-mono">{chung.map((n) => n.ten).join(' · ')}</b> — giữ trên tay phải khi đổi bass
            </>
          )}
        </p>
      )}
      <BanPhimHaiTay trai={vua([bass], thap, cao)} phai={vua(giu, thap, cao)} lo={lo} nhan={nhan} lowNote={thap} highNote={cao} />
      <p className="text-xs text-dim">
        Nốt từ lúc chạy: chính {s.dem.chinh} · phụ {s.dem.phu} · không màu {s.dem.khong}.
        {!thi && ' Viền cam trên phím: thế chồng tay phải dưới nốt ★ đầu (2–3 nốt hợp âm dưới nốt giai điệu, như anh SSA).'}
      </p>
      {!thi && (
        <div className="rounded-lg border border-teal-key/30 p-2">
          <DongKhung k={k} />
        </div>
      )}
      <MidiConnect />
    </div>
  )
}

/* ---------------- Nút thầy — nghe – đáp trên vòng thầy chọn (thử) ---------------- */

interface VienDap extends VienRoi {
  i: number
  k: Khung
  xong: boolean
  /** Ô của lượt bạn (lượt lẻ) — chỉ ô này được chấm. */
  ban: boolean
}
const TEN_DOAN: Readonly<Record<Doan, string>> = { intro: 'Dạo', interlude: 'Giang tấu', outro: 'Kết' }

/*
  NGHE – ĐÁP THẦY (nút thầy, thử — người dùng 15/10/2026: "3 nút riêng mang phong cách của từng thầy (từ hợp âm cho đến nốt solo)"): bộ
  soạn của thầy TỰ CHỌN vòng và soạn câu (`soanTuDo` — không cho vòng sẵn); lượt chẵn máy đánh cả hai tay, lượt lẻ chỉ tay trái để bạn
  đáp. Ô dài ngắn theo bộ soạn (Cà Pháo 2–8 phách, Linh Nhi 3 · 6). Viên rơi khớp nhịp; ô lượt bạn chấm phách 1: nốt chính theo khung CỦA
  THẦY ở chỗ đứng ấy (`vaiThayTrenKhung`, đo trên bộ soạn), hợp âm bộ soạn chưa đo thì theo khung lý thuyết. ★ là nốt thầy vào ô. "Đổi
  câu" lấy câu kế của bộ soạn (vòng mới) và đếm vào lại, giữ điểm. Duyệt đạt thì bỏ chữ "(thử)"; khi ấy mới xoá tab Nốt rơi cũ (câu thầy).
  ponytail: máy rơi theo nền chép từ SoloRoi (thêm ô dài ngắn) — duyệt đạt thì gộp hai bản thành một hook chung.
*/
function DapThayRoi({ dau, thay }: { dau: ReactNode; thay: ThayChay }) {
  const [kyLuc, setKyLuc] = useState(() => docKyLuc(KHO))
  const [ben, setBen] = useState<Ben>('meo')
  const [tonic, setTonic] = useState(0)
  const [thu, setThu] = useState(false)
  const [doan, setDoan] = useState<Doan>('interlude')
  const [bpm, setBpm] = useState<number>(60)
  const [, setVe] = useState(0)
  const giu = useMidiStore((s) => s.heldNotes)
  const thi = ben === 'thi'
  const tenThay = tenThayCua(thay)
  const khoaKyLuc = `dap|${thay}|${tonic}|${thu ? 'thu' : 'truong'}|${doan}|${bpm}`
  /* Trạng thái lượt chơi trong ref — vòng khung hình của vùng mưa đọc bản mới nhất. */
  const s = useRef({
    pha: 'chuan-bi' as 'chuan-bi' | 'choi' | 'het',
    /** Câu bộ soạn đang chơi (vòng + nốt hai tay) và lượt của bộ soạn. */
    cau: null as CauTuDo | null,
    take: 0,
    ks: [] as Khung[],
    vai: [] as ((m: number) => MucKhung)[],
    /** Mốc đầu từng hợp âm trong một lượt (phách), thêm mốc cuối = độ dài lượt. */
    moc: [0, 4] as number[],
    /** Số phách đếm vào. */
    demVao: 4,
    t0: 0,
    nen: false,
    vien: [] as VienDap[],
    sinhToi: -1,
    dang: -1,
    luot: -1,
    bam: new Map<number, { m: number; b: number }[]>(),
    diem: 0,
    combo: 0,
    dung: 0,
    sai: 0,
    trung: 0,
    dem: { chinh: 0, phu: 0, khong: 0 } as Record<MucKhung, number>,
    saiO: [] as { ten: string; meo: string }[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    /** Nốt đang vang: tay trái nền mọi lượt, tay phải thầy ở lượt thầy — để sáng phím. */
    vangTrai: [] as number[],
    vangPhai: [] as number[],
    loi: '',
  }).current
  const ve = () => setVe((k) => k + 1)
  const hep = hepManHinh()
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84
  const tenBac = (k: Khung, m: number) => `${bo8(tenPhim(k, m))} (${notCua(k, m)?.bac ?? tenBacKhung(pc(m - k.goc), k.quang)})`
  const nC = () => Math.max(1, s.ks.length)
  const dai = () => s.moc[s.moc.length - 1]!
  /** Ô thứ `i` kể từ lúc nền vào (lượt nối lượt): phách đầu, phách cuối. */
  const dauO = (i: number) => Math.floor(i / nC()) * dai() + s.moc[i % nC()]!
  const cuoiO = (i: number) => Math.floor(i / nC()) * dai() + s.moc[(i % nC()) + 1]!
  const oTai = (b: number) => {
    if (b < 0) return -1
    const p = Math.floor(b / dai())
    const x = b - p * dai()
    let j = 0
    while (j + 1 < nC() && s.moc[j + 1]! <= x) j += 1
    return p * nC() + j
  }

  /** Phách đang nghe: trước khi nền vào là đồng hồ đếm vào (âm), sau đó là đồng hồ nền đã bù lệch hình – tiếng. */
  function bayGio() {
    return s.nen ? getPlaybackBeats() : (performance.now() - s.t0) / (60000 / bpm) - s.demVao
  }
  /** Câu bộ soạn soạn được, từ lượt `tu` trở đi (bỏ lượt bộ soạn không soạn được). */
  function timCau(tu: number) {
    for (let t = tu; t < tu + 12; t += 1) {
      const c = soanTuDo(thay, tonic, thu, doan, t)
      if (c) return { cau: c, take: t }
    }
    return null
  }
  /** Nạp một câu: khung từng hợp âm theo thầy, mốc ô; về đếm vào (giữ điểm). */
  function napCau(cau: CauTuDo) {
    const hop = docHop(cau.chords.join(' '))
    const ks = khungVong(cau.chords.join(' '), tonic, thu)
    if (!hop || ks.length !== cau.chords.length) return false
    const moc = [0]
    for (const x of cau.beatsEach) moc.push(moc[moc.length - 1]! + x)
    Object.assign(s, {
      cau,
      ks,
      vai: ks.map((k, j) => vaiThayTrenKhung(thay, hop[j]!.quality.symbol, k, tonic, thu) ?? ((m: number) => mucCua(k, m))),
      moc,
      demVao: Math.min(4, cau.beatsEach[0] ?? 4),
      t0: performance.now(),
      nen: false,
      vien: [],
      sinhToi: -1,
      dang: -1,
      luot: -1,
      bam: new Map(),
      vangTrai: [],
      vangPhai: [],
    })
    return true
  }
  /** Nguồn nền từng lượt (gọi một lần ở đầu lượt): lượt chẵn cả câu thầy, lượt lẻ chỉ tay trái. */
  function nguon(luot: number) {
    const su = s.cau?.events ?? []
    const nen = s.cau?.nen ?? []
    return luot % 2 === 0 ? [...su, ...nen] : [...su.filter((e) => e.hand === 'left'), ...nen]
  }
  async function batDau(b: Ben) {
    const c = timCau(0)
    if (!c || !napCau(c.cau)) {
      s.loi = `Bộ soạn của ${tenThay} chưa soạn được ${TEN_DOAN[doan].toLowerCase()} ở giọng này — chọn giọng hay đoạn khác.`
      return ve()
    }
    setBen(b)
    await startAudio()
    Object.assign(s, {
      pha: 'choi',
      take: c.take,
      t0: performance.now(),
      diem: 0,
      combo: 0,
      dung: 0,
      sai: 0,
      trung: 0,
      dem: { chinh: 0, phu: 0, khong: 0 },
      saiO: [],
      bao: null,
      loi: '',
    })
    ve()
  }
  function ketThuc() {
    if (s.pha !== 'choi') return
    s.pha = 'het'
    stopTimelineLoop()
    if (thi && s.dung + s.sai >= SO_CAU_THI)
      setKyLuc((cu) => {
        const moi = capKyLuc(cu, khoaKyLuc, s.dung, s.diem)
        ghiKyLuc(KHO, moi)
        return moi
      })
    ve()
  }
  function sinh(i: number) {
    const j = i % nC()
    const ban = Math.floor(i / nC()) % 2 === 1
    const k = s.ks[j]!
    const vao = s.cau ? notThayVao(s.cau.events, s.moc[j]!, s.moc[j + 1]!, SOM) : null
    const tu = i === 0 ? -s.demVao : dauO(i - 1)
    s.vien = [
      ...s.vien,
      {
        khoa: i,
        i,
        k,
        xong: false,
        ban,
        sinh: tu,
        roi: cuoiO(i) - tu,
        lan: i % 4,
        ten: k.ten,
        khungTen: ban ? 'Bạn đáp' : `${tenThay} đánh`,
        goiY: vao === null ? (ban ? '★ một nốt chính' : 'thầy nghỉ') : ban ? `★ ${tenBac(k, vao)} như thầy` : `vào ô: ${tenBac(k, vao)}`,
      },
    ]
    s.sinhToi = i
  }
  function cham(v: VienDap) {
    v.xong = true
    const j = v.i % nC()
    const vai = s.vai[j]!
    const vao = notVaoO(s.bam.get(v.i) ?? [], useMidiStore.getState().heldNotes)
    const r = chamO(v.k, vao.m, vao.giu, vai)
    const thayVao = s.cau ? notThayVao(s.cau.events, s.moc[j]!, s.moc[j + 1]!, SOM) : null
    const trung = r.dat && vao.m !== null && thayVao !== null && pc(vao.m) === pc(thayVao)
    if (r.dat) {
      const cong = diemCau(s.combo)
      s.diem += cong
      s.combo += 1
      s.dung += 1
      if (trung) s.trung += 1
      s.bao = { loai: 'dung', chu: `Đạt +${cong} — ${r.chu}${trung ? ' Trùng nốt thầy vào ô.' : ''}` }
    } else {
      s.combo = 0
      s.sai += 1
      const chinh = Array.from({ length: 12 }, (_, iv) => 60 + pc(v.k.goc + iv)).filter((x) => vai(x) === 'chinh')
      s.saiO.push({
        ten: v.k.ten,
        meo: `Nốt chính của ${tenThay}: ${chinh.map((x) => bo8(tenPhim(v.k, x))).join(' ')}${thayVao !== null ? ` · thầy vào ô bằng ${tenBac(v.k, thayVao)}` : ''}.`,
      })
      s.bao = { loai: vao.m === null ? 'truot' : 'sai', chu: r.chu }
    }
    v.khungTen = vao.m === null ? '✗ trượt' : `${r.dat ? '✓' : '✗'} ${bo8(tenPhim(v.k, vao.m))}`
    ve()
  }
  /** Cập nhật nốt đang vang ở phách `b`; true nếu đổi (cần vẽ lại bàn phím). */
  function capVang(b: number) {
    const luot = Math.floor(b / dai())
    const x = b - luot * dai()
    const dang = b < 0 || !s.cau ? [] : s.cau.events.filter((e) => e.startBeat <= x && x < e.startBeat + e.durationBeats)
    const trai = dang.filter((e) => e.hand === 'left').flatMap((e) => e.notes)
    const phai = luot % 2 === 0 ? dang.filter((e) => e.hand === 'right').flatMap((e) => e.notes) : []
    if (trai.join() === s.vangTrai.join() && phai.join() === s.vangPhai.join()) return false
    s.vangTrai = trai
    s.vangPhai = phai
    return true
  }
  function tick() {
    if (s.pha !== 'choi' || !s.cau) return
    let b = bayGio()
    if (!s.nen && b >= 0) {
      startTimelineLoop(nguon, bpm, dai())
      s.nen = true
      b = bayGio()
    }
    for (const v of s.vien) if (!v.xong && v.ban && b >= dauO(v.i) + Math.min(1, (cuoiO(v.i) - dauO(v.i)) / 2)) cham(v)
    if (s.vien.some((v) => b >= cuoiO(v.i))) s.vien = s.vien.filter((v) => b < cuoiO(v.i))
    const dang = oTai(b)
    for (const i of [dang, dang + 1]) if (i >= 0 && i > s.sinhToi && (!thi || s.dung + s.sai < SO_CAU_THI)) sinh(i)
    const luot = dang < 0 ? -1 : Math.floor(dang / nC())
    let doi = capVang(b)
    if (luot !== s.luot) {
      s.luot = luot
      s.bao = null
      doi = true
    }
    if (dang !== s.dang) {
      s.dang = dang
      doi = true
    }
    if (doi) ve()
    if (thi && s.dung + s.sai >= SO_CAU_THI) ketThuc()
  }
  useNotXuong((note) => {
    if (s.pha !== 'choi' || !s.cau) return
    const b = bayGio()
    const i = oTai(b + SOM)
    // Đếm vào và lượt thầy: bấm theo thoải mái, không chấm.
    if (i < 0 || Math.floor(i / nC()) % 2 === 0) return
    s.bam.set(i, [...(s.bam.get(i) ?? []), { m: note, b }])
    for (const x of [...s.bam.keys()]) if (x < i - 1) s.bam.delete(x)
    const j = i % nC()
    const k = s.ks[j]!
    const muc = s.vai[j]!(note)
    s.dem[muc] += 1
    if (muc === 'khong') {
      s.combo = 0
      s.bao = { loai: 'sai', chu: `${bo8(tenPhim(k, note))} trên ${k.ten} — ${tenThay} không đánh nốt này; chỉ lướt qua (combo về 0).` }
    }
    ve()
  })
  /** Câu kế của bộ soạn (vòng mới): tắt nền, nạp câu, đếm vào lại — giữ điểm. */
  function doiCau() {
    stopTimelineLoop()
    const c = timCau(s.take + 1)
    if (c && napCau(c.cau)) {
      s.take = c.take
      s.bao = { loai: 'dung', chu: `Câu mới của ${tenThay} — vòng mới, đếm vào lại.` }
    } else {
      if (s.cau) napCau(s.cau)
      s.bao = { loai: 'sai', chu: 'Bộ soạn chưa ra câu khác — chơi lại câu này.' }
    }
    ve()
  }
  /* Ẩn trang thì dừng lượt (nền không tạm dừng giữa chừng được mà vẫn khớp ô); rời tab thì tắt nền. */
  const ketRef = useRef(ketThuc)
  ketRef.current = ketThuc
  useEffect(() => {
    const f = () => {
      if (document.hidden) ketRef.current()
    }
    document.addEventListener('visibilitychange', f)
    return () => {
      document.removeEventListener('visibilitychange', f)
      if (s.pha === 'choi') stopTimelineLoop()
    }
  }, [s])

  if (s.pha !== 'choi')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        {dau}
        {s.pha === 'het' && (
          <TongKet
            thi={thi}
            nhan={`${tenThay} · ${TEN_DOAN[doan]} · ♩ = ${bpm}`}
            dung={s.dung}
            sai={s.sai}
            diem={s.diem}
            on={s.saiO}
            them={`Ô lượt bạn đạt ${s.dung}/${s.dung + s.sai} · trùng nốt thầy vào ô ${s.trung} · nốt: chính ${s.dem.chinh} · phụ ${s.dem.phu} · không đánh ${s.dem.khong}.`}
          />
        )}
        <p className="text-xs text-dim">
          Bộ soạn của {tenThay} <b>tự chọn vòng hợp âm</b> theo lối của thầy rồi soạn câu — không dùng vòng có sẵn. Một lượt{' '}
          <b className="text-amber-key">{tenThay} đánh</b> (phím sáng là tay phải thầy), một lượt <b className="text-teal-key">bạn đáp</b> trên
          nền. Viên rơi khớp nhịp, ô dài ngắn theo vòng thầy. Lượt bạn: phách 1 mỗi hợp âm đặt một nốt chính — chính theo khung CỦA {tenThay}{' '}
          (đo trên bộ soạn); ★ là nốt thầy vào ô. "Đổi câu" lấy vòng và câu mới. Có đếm vào.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-dim">Đoạn</span>
          {DOAN.map((x) => (
            <button key={x} type="button" onClick={() => setDoan(x)} className={nut(doan === x)}>
              {TEN_DOAN[x]}
            </button>
          ))}
          <span className="ml-2 text-dim">Giọng</span>
          <select
            value={tonic}
            onChange={(e) => setTonic(Number(e.target.value))}
            aria-label="Chủ âm"
            className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
          >
            {GOC.map((ten, g) => (
              <option key={ten} value={g}>
                {gocDep(ten)}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setThu(false)} className={nut(!thu)}>
            trưởng
          </button>
          <button type="button" onClick={() => setThu(true)} className={nut(thu)}>
            thứ
          </button>
          <span className="ml-2 text-dim">♩ =</span>
          {NHIP_DO.map((x) => (
            <button key={x} type="button" onClick={() => setBpm(x)} className={nut(bpm === x)}>
              {x}
            </button>
          ))}
        </div>
        {s.loi && <p className="text-sm text-rose-300">{s.loi}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-key/40 p-3">
            <p className="font-semibold text-teal-key">Luyện có mẹo</p>
            <p className="mb-2 text-xs text-dim">
              Viên lượt bạn ghi ★ nốt thầy vào ô; phím viền cam là các nốt thầy đã đánh trên hợp âm ấy. Chạy tới khi bấm Dừng.
            </p>
            <button type="button" onClick={() => void batDau('meo')} className={`${nut(false)} w-full`}>
              ▶ Bắt đầu — {tenThay} chọn vòng
            </button>
          </div>
          <div className="rounded-lg border border-amber-key/40 p-3">
            <p className="font-semibold text-amber-key">Thi không mẹo — chấm đạt</p>
            <p className="mb-2 text-xs text-dim">
              Không ★, không viền. {SO_CAU_THI} ô lượt bạn một lượt thi, đạt từ {DAT_THI}. Kỷ lục ghi riêng theo đoạn, giọng và ♩.
            </p>
            <button type="button" onClick={() => void batDau('thi')} className={`${nut(false)} w-full`}>
              ▶ Thi — {TEN_DOAN[doan]} · <span className="text-[11px]">{kyLucChu(kyLuc[khoaKyLuc])}</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-dim">{loiBoSoan(thay, thu)}</p>
        <MidiConnect />
      </div>
    )

  /* Màn chơi: hợp âm đang vang (trong ô đếm vào thì hợp âm đầu); lượt chẵn thầy, lượt lẻ bạn. */
  const dang = Math.max(0, s.dang)
  const j = dang % nC()
  const luot = Math.floor(dang / nC())
  const ban = s.dang >= 0 && luot % 2 === 1
  const dich = s.vien.find((v) => v.i === s.dang) ?? null
  const loThay =
    !thi && ban && s.cau
      ? [
          ...new Set(
            s.cau.events
              .filter((e) => e.hand === 'right' && !e.grace && e.startBeat >= s.moc[j]! - SOM && e.startBeat < s.moc[j + 1]! - SOM)
              .flatMap((e) => e.notes),
          ),
        ]
      : []
  const phai = ban ? giu : s.vangPhai
  /* Phím xanh: lượt bạn chỉ sáng MỘT phím bass của hợp âm đang vang (như phần 2) — trước sáng cả tay trái nền lẫn thế tay phải có màu, giữ
     suốt ô, chen vào vùng tay phải (người dùng 15/10/2026: "tại sao tay trái luôn có phím hiện xanh lên như đang được đánh vậy"). Lượt thầy:
     tay trái thật của thầy. Thế tay phải của nền vẫn vang, không vẽ. */
  const bass = 36 + pc(s.ks[j]!.bass ?? s.ks[j]!.goc)
  const trai = ban ? [bass] : s.vangTrai
  const ca = [...trai, ...phai]
  /* Lượt bạn, chưa bấm gì: nhãn tay phải đặt trên các phím viền cam — "Cà Pháo đã đánh: C D E G" (người dùng 15/10 hỏi "mấy phím màu
     vàng nâu đó là gì"). */
  const goiYThay = ban && !phai.length && loThay.length > 0
  const nhan: NhanHaiTay = {
    trai: ban ? s.ks[j]!.ten : s.vangTrai.length ? tenBam(s.vangTrai).ten : '',
    traiPhu: ban ? 'bass nền' : s.vangTrai.length ? `tay trái ${tenThay}` : '',
    phai: phai.length ? tenBam(phai, false).ten : goiYThay ? `${tenThay} đã đánh` : '',
    phaiPhu: phai.length
      ? ban
        ? 'bạn'
        : tenThay
      : goiYThay
        ? [...new Set([...loThay].sort((a, b) => a - b).map((m) => bo8(tenPhim(s.ks[j]!, m))))].join(' ')
        : '',
    tong: ca.length >= 3 ? tenBam(ca).ten : '…',
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/25 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={`text-xs font-semibold ${thi ? 'text-amber-key' : 'text-teal-key'}`}>{thi ? 'THI' : 'LUYỆN CÓ MẸO'}</span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${s.dang < 0 ? 'bg-white/10 text-dim' : ban ? 'bg-teal-key/20 text-teal-key' : 'bg-amber-key/20 text-amber-key'}`}
        >
          {s.dang < 0 ? 'ĐẾM VÀO' : ban ? 'LƯỢT BẠN' : `LƯỢT ${tenThay.toUpperCase()}`}
        </span>
        <span className="text-cream">
          Điểm <b className="font-mono text-lg text-amber-key">{s.diem}</b>
        </span>
        <span className="text-cream">
          Combo <b className="font-mono text-lg text-teal-key">×{s.combo}</b>
        </span>
        {thi && (
          <span className="text-cream">
            Ô bạn <b className="font-mono">{Math.min(SO_CAU_THI, s.dung + s.sai + 1)}/{SO_CAU_THI}</b> · đạt{' '}
            <b className="font-mono text-teal-key">{s.dung}</b>
          </span>
        )}
        <span className="text-xs text-dim">
          {tenThay} · {TEN_DOAN[doan]} · ♩ = {bpm}
        </span>
        <span className="ml-auto flex gap-1.5">
          <button type="button" onClick={doiCau} className={nut(false)}>
            Đổi câu
          </button>
          <button type="button" onClick={ketThuc} className={nut(false)}>
            Dừng
          </button>
        </span>
      </div>
      <p className="text-xs text-cream/85">
        Vòng {tenThay} chọn: <span className="font-mono">{s.cau?.chords.join(' · ')}</span>
      </p>

      <VungRoi vien={s.vien} dich={dich} bayGio={bayGio} tick={tick} chay meo={!thi} />

      <p
        className={`min-h-10 text-sm ${s.bao?.loai === 'dung' ? 'text-teal-key' : s.bao?.loai === 'truot' ? 'text-rose-300' : 'text-amber-key'}`}
        aria-live="polite"
      >
        {s.bao?.chu ??
          (s.dang < 0
            ? `Đếm vào — ${tenThay} đánh trước, bạn đáp lượt sau.`
            : ban
              ? `Tới bạn — phách 1 mỗi hợp âm đặt một nốt chính của ${tenThay} (★ là nốt thầy vào ô).`
              : `${tenThay} đánh — nghe và nhìn tay phải; lượt sau tới bạn.`)}
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/85">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-left-hand" />{' '}
          {ban ? 'bass của hợp âm đang vang (máy đánh — bạn không cần bấm)' : `tay trái ${tenThay} đang đánh`}
        </span>
        {ban ? (
          !thi && (
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-key/30 ring-2 ring-amber-key ring-inset" /> viền cam: nốt {tenThay} đã đánh trên hợp âm
              này ở lượt trước — gợi ý, không bắt buộc
            </span>
          )
        ) : (
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-right-hand" /> tay phải {tenThay} đang đánh
          </span>
        )}
      </p>
      <BanPhimHaiTay trai={vua(trai, thap, cao)} phai={vua(phai, thap, cao)} lo={vua(loThay, thap, cao)} nhan={nhan} lowNote={thap} highNote={cao} />
      <p className="text-xs text-dim">
        Nền máy còn một thế tay phải có màu (vd Cadd9 = Sol – Rê – Mi) — nghe được, không tô lên phím. Lượt thầy: phím sáng là hai tay thầy đang
        đánh. Lượt bạn:{' '}
        {thi ? '' : 'viền cam là các nốt thầy đã đánh trên hợp âm này; '}nốt từ lúc chạy — chính {s.dem.chinh} · phụ {s.dem.phu} · không
        đánh {s.dem.khong}.
      </p>
      <MidiConnect />
    </div>
  )
}

/** Nút thầy: hai cách học — theo nhóm đuôi của thầy (viên rơi), và nghe – đáp trên vòng thầy chọn (rơi theo nền). */
function ThayRoi({ thay, dau }: { thay: ThayChay; dau: ReactNode }) {
  const [kieu, setKieu] = useState<'nhom' | 'dap'>('nhom')
  const tenThay = tenThayCua(thay)
  const dauThay = (
    <>
      {dau}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setKieu('nhom')} className={nut(kieu === 'nhom')} aria-pressed={kieu === 'nhom'}>
          Học theo nhóm đuôi của {tenThay}
        </button>
        <button type="button" onClick={() => setKieu('dap')} className={nut(kieu === 'dap')} aria-pressed={kieu === 'dap'}>
          Nghe – đáp trên vòng {tenThay} chọn
        </button>
      </div>
    </>
  )
  return kieu === 'nhom' ? <LamQuenRoi dau={dauThay} thay={thay} /> : <DapThayRoi dau={dauThay} thay={thay} />
}

export function GameChayNgonRoi() {
  useLiveSound()
  useComputerKeyboard(60)
  const [phan, setPhan] = useState<Phan>('lam-quen')
  const dau = <DauTrang phan={phan} doi={setPhan} />
  return phan === 'lam-quen' ? <LamQuenRoi dau={dau} /> : phan === 'solo' ? <SoloRoi dau={dau} /> : <ThayRoi key={phan} thay={phan} dau={dau} />
}
