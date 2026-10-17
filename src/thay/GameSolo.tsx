import { useEffect, useMemo, useRef, useState } from 'react'
import { NoteGatedPractice } from '../reharm/playback/NoteGatedPractice'
import { ChonNhip } from './GameChong'
import { TimedPractice } from '../reharm/playback/TimedPractice'
import { playChordSequence, startAudio, stopTimelineLoop } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import {
  baiChayDon,
  baiChayVong,
  baiTapNgon,
  cauScale,
  KIEU_CHAY,
  lapLai,
  NHOM_SCALE,
  ngonArp,
  ngonGam,
  notDung,
  saoChoDung,
  saoTheoNhip,
  tenNot,
  VONG_5_THU,
  VONG_5_TRUONG,
  type KieuChay,
  type NhomScale,
  type Tay,
} from './hocSolo/gamNgon'
import { baiCauThay, loiBoSoan, THAY_CHAY, type ThayChay } from './hocSolo/cauThay'
import { LUAT_SINH, sinhSolo, type CauSinh, type LuatSinh } from './hocSolo/sinhSolo'
import { doanGiong } from './soanCau/doTaiHoaAm'
import { nguCanh, type Hop } from './soanCau/giaiThich'
import { docHop, docVong, vongLyThuyetHop } from './soanCau/thayTrongVong'
import { GOC } from './vongThay'

/*
  Hai game của trang Học Solo — người dùng 11/10/2026: "Hãy thêm Game chạy ngón và Game Scale". NGOẠI LỆ thứ hai của quyết định "không lớp
  game" (KE-HOACH mục 4c; ngoại lệ đầu là Mưa hợp âm, 9/10/2026) — người dùng tự xin. Bấm bằng đàn MIDI, phím máy tính hay bàn phím trên
  màn hình. App không biết ngón nào bấm — số ngón trên phím là hướng dẫn, chấm chỉ theo nốt và thời điểm.
*/

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const pc = (x: number) => ((x % 12) + 12) % 12
const sao = (k: number, tren = 3) => '★'.repeat(k) + '☆'.repeat(Math.max(0, tren - k))

/** Mỗi cú bấm xuống (đàn MIDI, phím máy tính, bàn phím trên màn hình) — kèm thời điểm của chính sự kiện. */
function useNotBam(onNot: (note: number, time: number) => void) {
  /* Nghe thẳng kho MIDI, mỗi cú bấm một lần (như `useNotXuong`). Cũ (tới 17/10/2026): đọc `lastEvent` qua lần vẽ của React — cú bấm và
     cú nhả đến cùng lúc (đàn gửi dồn, chạm rất nhanh) thì chỉ thấy cú nhả, cú bấm mất, phải bấm lại. */
  const goi = useRef(onNot)
  goi.current = onNot
  useEffect(
    () =>
      useMidiStore.subscribe((state, truoc) => {
        const ev = state.lastEvent
        if (ev && ev !== truoc.lastEvent && ev.velocity > 0) goi.current(ev.note, ev.time)
      }),
    [],
  )
}

/** Bộ nhớ trình duyệt cho kỷ lục — chỉ là tiện, không có vẫn chơi được. */
function docKho<T>(khoa: string, macDinh: T): T {
  try {
    const x = JSON.parse(localStorage.getItem(khoa) ?? 'null') as T | null
    return x ?? macDinh
  } catch {
    return macDinh
  }
}
function ghiKho(khoa: string, x: unknown) {
  try {
    localStorage.setItem(khoa, JSON.stringify(x))
  } catch {
    /* bỏ qua */
  }
}

const nghe = async (notes: readonly number[], giay: number) => {
  await startAudio()
  playChordSequence(
    notes.map((m) => [m]),
    giay,
  )
}

/* ---------------- Game chạy ngón ---------------- */

const KHO_NGON = 'keytrain.chay-ngon.v2'
const NHIP = [50, 60, 80, 100] as const
/** "Đổi câu" thử tối đa chừng này lượt để ra câu KHÁC câu đang tập — vốn ô Blues ít, nhiều lượt trùng câu (đo 11/10: 18/36). */
const THU_DOI_CAU = 12

type LoaiDon = 'truong' | 'thu' | '7'
/**
 * Một hợp âm lẻ cho câu thầy → vòng 2 ô cùng hợp âm, kèm giọng để bộ soạn chọn ô theo bậc: trưởng = I của giọng trưởng · thứ = i của
 * giọng thứ · 7 = V7 của giọng trưởng (Cà Pháo, Linh Nhi) hay I7 (Blues — hợp âm chủ của blues là hợp âm 7). Cách hiểu của Claude.
 */
function hopDon(goc: number, loai: LoaiDon, thay: ThayChay): { tonic: number; thu: boolean; hop: Hop[] } {
  if (loai === '7' && thay !== 'blues') return { tonic: pc(goc - 7), thu: false, hop: [{ goc: 7, chat: '7' }, { goc: 7, chat: '7' }] }
  const chat = loai === 'thu' ? 'm' : loai === '7' ? '7' : ''
  return { tonic: goc, thu: loai === 'thu', hop: [{ goc: 0, chat }, { goc: 0, chat }] }
}

/** Dấu vân tay tay phải — để "Đổi câu" bỏ qua lượt ra đúng câu cũ. */
const vanTay = (bai: { timeline: readonly { hand: string; startBeat: number; notes: readonly number[] }[] } | null) =>
  bai ? bai.timeline.filter((e) => e.hand === 'right').map((e) => `${e.startBeat}:${e.notes.join('.')}`).join(' ') : ''

/**
 * GAME CHẠY NGÓN — khung nốt rơi của app (như tab Điệu): nốt rơi xuống bàn phím; máy chơi tay kia làm backing.
 * Hai phần (người dùng 11/10/2026): HỢP ÂM RIÊNG LẺ · THEO VÒNG HỢP ÂM. Hai chế độ: chờ đánh đúng · theo nhịp (chấm trúng nốt và lệch mili
 * giây — lượt ghi vào LuyenTap.json như mọi lượt tập theo nhịp). Sao lưu ở bộ nhớ trình duyệt.
 * Lượt 2 (người dùng 11/10/2026): nút ba thầy — không chọn = chạy ngón cơ bản (năm ngón · gam · rải, có số ngón); chọn thầy = câu solo do
 * bộ soạn của thầy soạn trên hợp âm / vòng đang chọn (`cauThay.ts`), câu giữ nguyên cho tới khi bấm "Đổi câu". Vòng tự nhập.
 */
export function GameNotRoi() {
  const [phan, setPhan] = useState<'don' | 'vong'>('don')
  const [cheDo, setCheDo] = useState<'cho' | 'nhip'>('cho')
  const [bpm, setBpm] = useState<number>(60)
  const [thay, setThay] = useState<ThayChay | null>(null)
  const [take, setTake] = useState(0)
  /** Lần dựng lại khung tập: mọi thay đổi ở hàng chọn (`doi`) dựng lại; đổi ♩ trong thanh toàn màn hình thì không (giữ toàn màn hình). */
  const [lamMoi, setLamMoi] = useState(0)
  const [hetCau, setHetCau] = useState(false)
  const [tay, setTay] = useState<Tay>('phai')
  const ds = useMemo(() => baiTapNgon(tay), [tay])
  const [chiSo, setChiSo] = useState(0)
  const [gocDon, setGocDon] = useState(0)
  const [loaiDon, setLoaiDon] = useState<LoaiDon>('truong')
  const [tonic, setTonic] = useState(0)
  const [thu, setThu] = useState(false)
  const vongs = useMemo(() => vongLyThuyetHop(tonic, thu), [tonic, thu])
  const [vongId, setVongId] = useState<string | null>(null)
  /** Chữ đang gõ trong ô điền vòng; `null` = chưa gõ — ô hiện hợp âm của vòng đang dùng. */
  const [tuDien, setTuDien] = useState<string | null>(null)
  const [vongTu, setVongTu] = useState<string | null>(null)
  const [baoDien, setBaoDien] = useState<{ loi: boolean; chu: string } | null>(null)
  const [kieu, setKieu] = useState<KieuChay | 'sinh'>('nam-ngon')
  const [kyLuc, setKyLuc] = useState<Record<string, number>>(() => docKho(KHO_NGON, {}))
  /** Phách của chặng đang chờ bấm (khung chờ đúng nốt báo ra) — Sinh nốt Solo hiện lý do của nốt ấy. */
  const [dangCho, setDangCho] = useState<number | null>(null)

  const tuNhap = vongId === 'tu-nhap' && vongTu !== null
  const vong = vongs.find((x) => x.id === vongId) ?? vongs[0]!
  const hopVong = useMemo(() => (tuNhap ? (docVong(vongTu, tonic) ?? []) : vong.hop), [tuNhap, vongTu, tonic, vong])
  const idVong = tuNhap ? `tu:${vongTu}` : vong.id
  /* Ô điền vòng LUÔN HIỆN (người dùng 11/10/2026: "chưa có tính năng tự điền vòng hợp âm … chỉ thấy có vòng mặc định" — bản trước giấu ô
     sau nút "Tự nhập"): chưa gõ thì ô ghi sẵn hợp âm của vòng đang dùng để sửa thẳng; Enter là dùng. */
  const chuVong = tuDien ?? (tuNhap ? vongTu : vong.hop.map((x) => nguCanh(tonic, thu).h(x.goc, x.chat, x.bass)).join(' '))
  /** Câu thầy: vòng · giọng · mã — phần hợp âm lẻ thì vòng 2 ô của một hợp âm. */
  const nenThay = useMemo(
    () =>
      thay === null
        ? null
        : phan === 'don'
          ? { ...hopDon(gocDon, loaiDon, thay), id: `don-${gocDon}-${loaiDon}` }
          : { tonic, thu, hop: hopVong, id: idVong },
    [thay, phan, gocDon, loaiDon, tonic, thu, hopVong, idVong],
  )
  /** Sinh nốt Solo (chạy ngón cơ bản, phần theo vòng): bộ soạn gia sư soạn câu và ghi lý do từng nốt — `hocSolo/sinhSolo.ts`. */
  const sinh = !thay && phan === 'vong' && kieu === 'sinh'
  const cauSinh = useMemo(() => (sinh && hopVong.length ? sinhSolo(hopVong, tonic, thu, take, idVong) : null), [sinh, hopVong, tonic, thu, take, idVong])
  const bai = useMemo(
    () =>
      nenThay && thay
        ? baiCauThay(thay, nenThay.hop, nenThay.tonic, nenThay.thu, take, nenThay.id)
        : phan === 'don'
          ? baiChayDon(ds[Math.min(chiSo, ds.length - 1)]!)
          : sinh
            ? (cauSinh?.bai ?? null)
            : hopVong.length && kieu !== 'sinh'
              ? baiChayVong(hopVong, tonic, thu, kieu, idVong)
              : null,
    [nenThay, thay, take, phan, ds, chiSo, sinh, cauSinh, hopVong, tonic, thu, kieu, idVong],
  )
  const khoa = `${bai?.id ?? 'trong'}|${cheDo}`
  const timelineNhip = useMemo(
    () => (!bai ? [] : phan === 'vong' || thay ? lapLai(bai.timeline, bai.perBeat.length, 2) : bai.timeline),
    [bai, phan, thay],
  )
  const ghiSao = (s: number) => {
    setKyLuc((cu) => {
      if (s <= (cu[khoa] ?? 0)) return cu
      const moi = { ...cu, [khoa]: s }
      ghiKho(KHO_NGON, moi)
      return moi
    })
  }
  /** Mọi thay đổi dừng phát trước; `moiCau` = đổi bài (thầy · hợp âm · vòng · giọng) thì câu thầy về lượt đầu — đổi nhịp, chế độ thì giữ câu. */
  const doi = (f: () => void, moiCau = false) => {
    stopTimelineLoop()
    setLamMoi((k) => k + 1)
    if (moiCau) {
      setTake(0)
      setHetCau(false)
    }
    f()
  }
  /** Câu số `t` của bộ soạn đang dùng — câu thầy hay câu sinh của gia sư. */
  const taoCau = (t: number) =>
    thay && nenThay
      ? baiCauThay(thay, nenThay.hop, nenThay.tonic, nenThay.thu, t, nenThay.id)
      : sinh
        ? (sinhSolo(hopVong, tonic, thu, t, idVong)?.bai ?? null)
        : null
  /* Đổi ♩ từ thanh toàn màn hình (khung chưa chơi): không dựng lại khung — dựng lại là mất toàn màn hình (16/10/2026). Nốt rơi theo nhịp
     chỉ hiện nút này lúc chưa chơi, nên không đổi nhịp giữa lượt đang chấm. */
  const nhipToanMan = (
    <ChonNhip
      bpm={bpm}
      ds={NHIP}
      doi={(x) => {
        stopTimelineLoop()
        setBpm(x)
      }}
    />
  )
  const doiCau = () => {
    if (!thay && !sinh) return
    const cu = vanTay(bai)
    for (let t = take + 1; t <= take + THU_DOI_CAU; t += 1) {
      const moi = taoCau(t)
      if (moi && vanTay(moi) !== cu) return doi(() => setTake(t))
    }
    setHetCau(true)
  }
  const dungVongTu = () => {
    const chu = chuVong.trim()
    const dsHop = docHop(chu)
    if (!dsHop) {
      setBaoDien({ loi: true, chu: 'Không đọc được — gõ tên hợp âm cách nhau bằng dấu cách, vd "Am F C G" hay "Dm7 G7 Cmaj7".' })
      return
    }
    const g = doanGiong(dsHop)[0]
    doi(() => {
      setVongId('tu-nhap')
      setVongTu(chu)
      setTuDien(null)
      if (g) {
        setTonic(g.tonic)
        setThu(g.thu)
      }
      setBaoDien({ loi: false, chu: g ? `App đoán giọng ${GOC[g.tonic]} ${g.thu ? 'thứ' : 'trưởng'} — sai thì đổi ở ô Giọng.` : 'Chưa đoán được giọng — chọn ở ô Giọng.' })
    }, true)
  }
  const saoCua = (id: string) => kyLuc[`${id}|${cheDo}`]
  const nhom = [...new Set(ds.map((x) => x.nhom))]
  const tenThay = THAY_CHAY.find((x) => x.id === thay)?.ten

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-1 font-semibold text-cream">Nốt rơi cũ — đánh theo câu thầy</h3>
        <p className="mb-1 text-xs text-amber-key">
          Lối cũ của Game chạy ngón (trước 15/10/2026) — nay game dạy tự chọn nốt theo khung ở tab Game chạy ngón; đây giữ lại câu các thầy đã
          duyệt.
        </p>
        <p className="text-xs text-dim">
          Nốt rơi xuống bàn phím, máy chơi tay kia làm backing. Không chọn thầy: chạy ngón cơ bản, số trên khối nốt là ngón (ngón chuẩn sách
          piano — app không thấy ngón tay, nhìn số mà bấm cho đúng thói quen). Chọn thầy: câu solo do bộ soạn của thầy soạn trên hợp âm / vòng
          của bạn, khối nốt ghi tên nốt; câu giữ nguyên cho tới khi bấm <b>Đổi câu</b>. <b>Chờ đúng nốt</b>: mọi thứ đứng chờ tới khi bạn bấm
          đúng — bấm đúng nốt nào thì máy đánh luôn phần đệm của chỗ ấy. <b>Theo nhịp</b>: có đếm vào, backing chạy liên tục, hết lượt chấm
          trúng bao nhiêu nốt và lệch bao nhiêu mili giây. Ngưỡng sao là Claude đặt, chưa đo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {(
          [
            ['don', 'Hợp âm riêng lẻ'],
            ['vong', 'Theo vòng hợp âm'],
          ] as const
        ).map(([v, ten]) => (
          <button key={v} type="button" onClick={() => doi(() => setPhan(v), true)} className={nut(phan === v)}>
            {ten}
          </button>
        ))}
        <span className="ml-3 text-dim">Chế độ:</span>
        {(
          [
            ['cho', 'Chờ đúng nốt'],
            ['nhip', 'Theo nhịp'],
          ] as const
        ).map(([v, ten]) => (
          <button key={v} type="button" onClick={() => doi(() => setCheDo(v))} className={nut(cheDo === v)}>
            {ten}
          </button>
        ))}
        <span className="ml-3 text-dim">♩ =</span>
        {NHIP.map((x) => (
          <button key={x} type="button" onClick={() => doi(() => setBpm(x))} className={nut(bpm === x)} title={`móc đơn ${(x / 30).toFixed(1).replace('.', ',')} nốt/giây`}>
            {x}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="w-24 text-dim">Thầy</span>
        {THAY_CHAY.map((x) => (
          <button key={x.id} type="button" onClick={() => doi(() => setThay(thay === x.id ? null : x.id), true)} className={nut(thay === x.id)}>
            {x.ten}
          </button>
        ))}
        <span className="text-dim">{thay ? 'bấm lại để về chạy ngón cơ bản' : 'không chọn thầy = chạy ngón cơ bản'}</span>
      </div>

      {phan === 'don' ? (
        thay ? (
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 text-dim">Hợp âm</span>
              <select
                value={gocDon}
                onChange={(event) => doi(() => setGocDon(Number(event.target.value)), true)}
                className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
                aria-label="Gốc hợp âm"
              >
                {GOC.map((ten, k) => (
                  <option key={ten} value={k}>
                    {ten}
                  </option>
                ))}
              </select>
              {(
                [
                  ['truong', 'trưởng'],
                  ['thu', 'thứ'],
                  ['7', '7'],
                ] as const
              ).map(([v, ten]) => (
                <button key={v} type="button" onClick={() => doi(() => setLoaiDon(v), true)} className={nut(loaiDon === v)}>
                  {ten}
                </button>
              ))}
              <span className="text-dim">
                {thay === 'ca-phao' ? 'bốn' : 'hai'} ô cùng một hợp âm · {loaiDon === '7' ? (thay === 'blues' ? 'hợp âm 7 là hợp âm chủ của blues' : 'hợp âm 7 hiểu là V7 của giọng trưởng') : loaiDon === 'thu' ? 'hợp âm chủ giọng thứ' : 'hợp âm chủ giọng trưởng'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 text-dim">Tay</span>
              {(['phai', 'trai'] as const).map((t) => (
                <button key={t} type="button" onClick={() => doi(() => setTay(t), true)} className={nut(tay === t)}>
                  {t === 'phai' ? 'Tay phải' : 'Tay trái'}
                </button>
              ))}
            </div>
            {nhom.map((nh) => (
              <div key={nh} className="flex flex-wrap items-center gap-1.5">
                <span className="w-24 text-dim">{nh}</span>
                {ds.map((x, k) =>
                  x.nhom === nh ? (
                    <button key={x.id} type="button" onClick={() => doi(() => setChiSo(k), true)} className={nut(k === chiSo)}>
                      {x.ten.replace(/^(Năm ngón|Gam|Rải) /, '')}
                      {saoCua(`don-${x.id}`) ? <span className="ml-1 text-amber-key">{sao(saoCua(`don-${x.id}`)!)}</span> : null}
                    </button>
                  ) : null,
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">Giọng</span>
            <select
              value={tonic}
              onChange={(event) => doi(() => setTonic(Number(event.target.value)), true)}
              className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
              aria-label="Giọng của vòng"
            >
              {GOC.map((ten, k) => (
                <option key={ten} value={k}>
                  {ten}
                </option>
              ))}
            </select>
            {[false, true].map((v) => (
              <button key={String(v)} type="button" onClick={() => doi(() => setThu(v), true)} className={nut(thu === v)}>
                {v ? 'thứ' : 'trưởng'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">Vòng</span>
            {vongs.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() =>
                  doi(() => {
                    setVongId(x.id)
                    setTuDien(null)
                    setBaoDien(null)
                  }, true)
                }
                className={nut(!tuNhap && x.id === vong.id)}
                title={x.ghiChu}
              >
                {x.ten}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              dungVongTu()
            }}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="w-24 text-dim">Tự điền vòng</span>
            <input
              value={chuVong}
              onChange={(event) => setTuDien(event.target.value)}
              placeholder="vd Am F C G · Dm7 G7 Cmaj7"
              aria-label="Nhập vòng hợp âm"
              className="w-72 max-w-full rounded border border-amber-key/50 bg-white/6 px-2 py-1 font-mono text-sm text-cream placeholder:text-dim"
            />
            <button type="submit" className={nut(tuNhap)}>
              {tuNhap ? 'Đang dùng vòng tự điền' : 'Dùng vòng này'}
            </button>
            {baoDien ? (
              <span className={baoDien.loi ? 'text-rose-300' : 'text-dim'}>{baoDien.chu}</span>
            ) : (
              <span className="text-dim">gõ hợp âm cách nhau bằng dấu cách, Enter để dùng — mỗi hợp âm một ô, như ô nhập của Tái hòa âm</span>
            )}
          </form>
          {!thay && (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-24 text-dim">Kiểu chạy</span>
                {KIEU_CHAY.map((x) => (
                  <button key={x.id} type="button" onClick={() => doi(() => setKieu(x.id))} className={nut(kieu === x.id)}>
                    {x.ten}
                    {saoCua(`vong-${idVong}-${tonic}-${thu ? 'thu' : 'truong'}-${x.id}`) ? (
                      <span className="ml-1 text-amber-key">{sao(saoCua(`vong-${idVong}-${tonic}-${thu ? 'thu' : 'truong'}-${x.id}`)!)}</span>
                    ) : null}
                  </button>
                ))}
                <button type="button" onClick={() => doi(() => setKieu('sinh'), true)} className={nut(kieu === 'sinh')}>
                  ✦ Sinh nốt Solo
                </button>
              </div>
              <p className="text-cream/80">
                {kieu === 'sinh'
                  ? 'Bộ soạn gia sư (Claude) soạn một câu solo mới trên vòng — mỗi nốt chọn bằng một luật nói ra được, luật lấy từ số đo câu solo của các thầy. Giải thích từng nốt và các quy luật ở dưới khung tập'
                  : KIEU_CHAY.find((x) => x.id === kieu)?.mo}
                . Mỗi hợp âm một ô 4 phách; tay trái máy đệm "bùm – chát" (bass phách 1 · 3, chồng phách 2 · 4)
                {cheDo === 'nhip' ? ', vòng chơi hai lượt' : ''}.
              </p>
            </>
          )}
        </div>
      )}

      {(thay || sinh) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button type="button" onClick={doiCau} disabled={!bai} className={nut(false)}>
            {thay ? '↻ Đổi câu' : '↻ Sinh câu mới'}
          </button>
          <span className="text-dim">câu số {take + 1}</span>
          {hetCau && <span className="text-rose-300">Bộ soạn chưa ra câu nào khác cho {phan === 'don' ? 'hợp âm' : 'vòng'} này (thử {THU_DOI_CAU} lượt).</span>}
          {thay && (
            <p className="w-full text-cream/80">
              {loiBoSoan(thay, nenThay?.thu ?? thu)}
              {cheDo === 'nhip' ? ' Theo nhịp: câu chơi hai lượt.' : ''}
            </p>
          )}
        </div>
      )}

      {bai ? (
        <p className="text-xs text-cream/85">
          Đang chạy: <b className="text-amber-key">{bai.ten}</b> · {bai.tay === 'right' ? 'tay phải' : 'tay trái'} · ♩ = {bpm}
          {kyLuc[khoa] ? <span className="ml-2 text-amber-key">kỷ lục {sao(kyLuc[khoa]!)}</span> : null}
        </p>
      ) : (
        <p className="text-xs text-rose-300">
          {thay ? `${tenThay} chưa có ô nào cho ${phan === 'don' ? 'hợp âm' : 'vòng'} này — thử hợp âm / vòng / giọng khác.` : 'Chưa có vòng — nhập vòng rồi bấm "Dùng vòng này".'}
        </p>
      )}

      {cauSinh && <GiaiThichSinh cau={cauSinh} dangCho={cheDo === 'cho' ? dangCho : null} />}

      {!bai ? null : cheDo === 'cho' ? (
        <NoteGatedPractice
          key={`${khoa}|${lamMoi}|${take}`}
          timeline={bai.timeline}
          voicings={bai.voicings}
          beatsPerChord={bai.beatsPerChord}
          perBeat={bai.perBeat}
          vongBpm={bpm}
          nenTayKia
          onChang={setDangCho}
          thanhNhip={nhipToanMan}
          bac={{
            tay: bai.tay,
            onXong: (k) => {
              const s = saoChoDung(k)
              ghiSao(s)
              return { dat: s >= 2, tomTat: `${sao(s)} — ${k.chang - k.vap}/${k.chang} chặng không vấp` }
            },
          }}
        />
      ) : (
        <TimedPractice
          key={`${khoa}|${lamMoi}|${take}`}
          title={`Chạy ngón · ${bai.ten}`}
          timeline={timelineNhip}
          voicings={bai.voicings}
          beatsPerChord={bai.beatsPerChord}
          perBeat={bai.perBeat}
          meter={bai.meter ?? 4}
          vongBpm={bpm}
          anTempo
          thanhNhip={nhipToanMan}
          bac={{
            tay: bai.tay,
            tempo: 100,
            boQuaQuangTam: false,
            anNotRoi: false,
            theoHopAm: false,
            onXong: (score) => {
              const s = saoTheoNhip(score)
              ghiSao(s)
              return {
                dat: s >= 2,
                tomTat: `${sao(s)} — trúng ${score.hit}/${score.total} nốt, lệch trung vị ${score.medianAbsMs === null ? '—' : `${Math.round(score.medianAbsMs)} ms`}`,
              }
            },
          }}
        />
      )}
    </div>
  )
}

const THE = 'rounded-xl border border-line bg-black/25 p-4'

/** Bảy nốt gam trên một hợp âm, tô theo vai: trụ (nốt hợp âm) · màu · tránh (chỉ lướt). */
function NotGam({ g }: { g: CauSinh['gamO'][number] }) {
  return (
    <>
      {g.not.map((x) => (
        <span
          key={x.ten}
          title={x.vai === 'tru' ? 'trụ — nốt của hợp âm' : x.vai === 'mau' ? 'màu — đi qua ở phách nhẹ' : 'tránh — chỉ lướt qua'}
          className={`mr-1.5 font-mono text-sm ${x.vai === 'tru' ? 'font-bold text-teal-key' : x.vai === 'mau' ? 'text-amber-key' : 'text-dim italic'}`}
        >
          {x.ten}
        </span>
      ))}
    </>
  )
}
const phanTram = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} % (${a}/${b})` : '—')

/**
 * GIẢI THÍCH & DẠY CHỌN NỐT cho câu Sinh nốt Solo — NGAY TRÊN khung tập (người dùng 11/10/2026: "phần giải thích và dạy cách chọn nốt
 * đâu" — bản đầu đặt dưới khung tập, phải cuộn xa mới thấy). Ba mục: vì sao từng nốt (lý do bộ soạn ghi lúc chọn) · câu này so với số
 * đo các thầy · cách chọn nốt — quy luật chung (mỗi luật kèm số lần câu này dùng). Đang luyện chờ đúng nốt thì lý do của nốt ĐANG CHỜ
 * hiện to ở đầu thẻ và được tô sáng trong danh sách.
 */
function GiaiThichSinh({ cau, dangCho }: { cau: CauSinh; dangCho: number | null }) {
  const [muc, setMuc] = useState<'not' | 'gam' | 'so' | 'luat'>('not')
  const hop = useRef<HTMLDivElement>(null)
  const notCho = dangCho === null ? null : (cau.not.find((x) => Math.abs(x.t - dangCho) < 1e-6) ?? null)
  useEffect(() => {
    // Cuộn TRONG hộp tới nốt đang chờ — không cuộn cả trang (khung tập ở ngay dưới).
    const box = hop.current
    const el = box?.querySelector<HTMLElement>('[data-dang-cho="1"]')
    if (box && el) box.scrollTop = Math.max(0, el.offsetTop - box.clientHeight / 3)
  }, [dangCho, muc])
  const s = cau.soDo
  const dem = (id: LuatSinh) => cau.not.filter((x) => x.luat.includes(id)).length
  const so: readonly [string, string, string][] = [
    ['Nốt của hợp âm đang vang', phanTram(s.notHop, s.n), 'khoảng 60–75 % — Linh Nhi 63,6 % · Cà Pháo 70,8 % · Tôn Hùng 73,0 %'],
    ['Phách mạnh (1, 3) là nốt hợp âm', phanTram(s.phachManhHop, s.phachManh), 'Linh Nhi 64–83 % — bộ soạn gia sư đặt 100 % cho dễ thấy khung; thầy thật để vài phách mạnh cho nốt màu'],
    ['Bước nhỏ (lặp hay liền bậc, ≤ 2 nửa cung)', phanTram(s.lapLien, s.buoc), '45 % (13 bản ký âm) — câu gia sư mượt hơn thầy, dễ tập hơn'],
    ['Bước không quá quãng ba (≤ 4 nửa cung)', phanTram(s.duoi4, s.buoc), '66 % (13 bản ký âm)'],
    ['Nhảy ≥ 5 nửa cung rồi quay đầu', phanTram(s.quay, s.nhay), '62 % (13 bản ký âm)'],
    ['Câu dừng ở bậc 1 hay 5', phanTram(s.ketDong, s.soCau), 'đoạn kết Linh Nhi co về 1 + 5 (47–51 % nốt); Ray kết gốc 19 · bậc 5 15 trên 74 câu'],
  ]
  const chip = 'mr-1.5 rounded bg-ink px-1 py-0.5 font-mono font-bold text-yellow-300'
  return (
    <div className={`${THE} text-xs`}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-sm font-semibold text-cream">Giải thích &amp; dạy chọn nốt</span>
        {(
          [
            ['not', 'Vì sao từng nốt'],
            ['gam', 'Gam trên từng hợp âm'],
            ['so', 'So với các thầy'],
            ['luat', 'Cách chọn nốt — quy luật chung'],
          ] as const
        ).map(([v, ten]) => (
          <button key={v} type="button" onClick={() => setMuc(v)} className={nut(muc === v)}>
            {ten}
          </button>
        ))}
      </div>
      {notCho ? (
        <p className="mb-2 rounded-lg border border-amber-key/60 bg-amber-key/10 p-2 text-sm text-cream">
          <span className={chip}>{notCho.ten}</span>
          <span className="mr-1 font-semibold text-amber-key">
            Nốt đang chờ bấm · ô {notCho.o + 1} ({cau.hopO[notCho.o]}) · phách {notCho.phach}:
          </span>
          {notCho.ly}
        </p>
      ) : (
        <p className="mb-2 text-dim">Bấm "Bắt đầu luyện" ở khung tập dưới (chế độ chờ đúng nốt): lý do của nốt đang chờ bấm hiện ngay đây.</p>
      )}
      {muc === 'not' && (
        <div ref={hop} className="relative max-h-72 overflow-y-auto pr-1">
          {cau.hopO.map((ten, o) => (
            <div key={o} className="mb-2">
              <p className="font-semibold text-amber-key">
                Ô {o + 1} · {ten}
                <span className="ml-2 font-normal text-cream/75">
                  gam {cau.gamO[o]!.ten}: <NotGam g={cau.gamO[o]!} />
                </span>
              </p>
              <ol className="mt-1 flex flex-col gap-1">
                {cau.not
                  .filter((x) => x.o === o)
                  .map((x) => (
                    <li
                      key={x.t}
                      data-dang-cho={x === notCho ? '1' : undefined}
                      className={`rounded px-1 py-0.5 text-cream/85 ${x === notCho ? 'bg-amber-key/15 ring-1 ring-amber-key' : ''}`}
                    >
                      <span className={chip}>{x.ten}</span>
                      <span className="mr-1 text-dim">phách {x.phach}</span>
                      {x.ly}
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      )}
      {muc === 'gam' && (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          <div className="text-cream/85">
            <p className="font-semibold text-cream">Mỗi hợp âm một gam — lấy gam của bài rồi chỉnh cho khớp hợp âm đang vang</p>
            <p>
              Bộ soạn lấy gam của bài; hợp âm nào có nốt ngoài gam thì đổi ĐÚNG nốt cùng tên chữ (bài Đô trưởng gặp A7: Đô → Đô♯). Đọc gam ấy
              từ gốc hợp âm ra một <i>mode</i>. Trích nốt từ gam theo VAI:
            </p>
            <ul className="mt-1 ml-4 list-disc">
              <li>
                <b className="text-teal-key">Trụ</b> — nốt của hợp âm (rải hợp âm, arpeggio): phách mạnh 1 và 3, nốt đáp đầu ô, nốt kết câu.
              </li>
              <li>
                <b className="text-amber-key">Màu</b> — nốt gam cách nốt trụ một bậc (9 · 11 · 13): đi qua ở phách nhẹ, làm câu "sang".
              </li>
              <li>
                <b className="text-dim">Tránh</b> — nốt gam đứng nửa cung trên một nốt trụ (Fa trên C): chỉ lướt ở phách nhẹ, nốt sau đi tiếp. Hợp
                âm át thì ♭9, ♭13 là màu (nốt căng biến âm), chỉ bậc 4 là tránh.
              </li>
              <li>
                <b className="text-rose-300">Ngoài gam (chromatic)</b> — chỉ một chỗ: nốt dẫn NỬA CUNG ngay trước vạch đổi hợp âm, rồi rơi vào nốt
                hợp âm mới.
              </li>
            </ul>
            <p className="mt-1">
              Ngoài gam còn bốn cách lấy nốt: <b>rải hợp âm</b> (nhảy quãng 3 sang nốt trụ kế) · <b>dẫn giọng</b> (đầu ô mới chọn nốt hợp âm gần
              nốt trước nhất, đáp đúng vạch) · <b>hình câu</b> (lên đỉnh sớm rồi thả; nhảy xa thì quay đầu; câu 2 ô, kết bậc 1 / 5, nghỉ thở) ·{' '}
              <b>nốt nhà trên V</b> (đánh sớm chủ âm rồi giữ sang hợp âm chủ).
            </p>
            <p className="mt-1 text-dim">
              Chưa có trong bộ soạn gia sư (các thầy có dùng): nốt blue ♭3 · ♭5 · ♭7 trên hợp âm trưởng (Cà Pháo 4,7 % nốt ngoài gam, n=828),
              ngũ cung của chủ (Ray 81 % nốt câu lick, n=503), màu altered trên V7 (Cà Pháo ♭13 9 %, n=66). Muốn nghe màu ấy: chọn nút thầy.
            </p>
          </div>
          {cau.gamO.map((g, o) => (
            <div key={o} className="rounded border border-line/60 p-2">
              <p className="font-semibold text-amber-key">
                Ô {o + 1} · {g.hop} — gam {g.ten}
              </p>
              <p className="text-cream/85">
                <NotGam g={g} />
              </p>
              <p className="text-dim">{g.doi.length ? `Đổi so với gam của bài: ${g.doi.join('; ')}.` : 'Đúng gam của bài, không đổi nốt nào.'}</p>
            </div>
          ))}
        </div>
      )}
      {muc === 'so' && (
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[minmax(10rem,16rem)_8rem_1fr]">
          {so.map(([ten, cauNay, thay]) => (
            <div key={ten} className="contents">
              <span className="font-semibold text-teal-key">{ten}</span>
              <span className="font-mono text-cream">{cauNay}</span>
              <span className="text-dim">{thay}</span>
            </div>
          ))}
        </div>
      )}
      {muc === 'luat' && (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {LUAT_SINH.map((l) => (
            <li key={l.id}>
              <p className="font-semibold text-amber-key">
                {l.ten}
                <span className="ml-2 font-normal text-teal-key">{dem(l.id) ? `câu này dùng ${dem(l.id)} lần` : 'câu này chưa dùng'}</span>
              </p>
              <p className="text-cream/85">{l.cau}</p>
              <p className="text-dim">
                {l.doDuoc ? 'Cơ sở' : 'Ghi chú'}: {l.coSo}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------- Game Scale ---------------- */

const KHO_SCALE = 'keytrain.game-scale.v1'
const SO_CAU = 10

/** Xáo 12 gốc — mỗi lượt chơi một thứ tự. */
const xao = () => {
  const x = Array.from({ length: 12 }, (_, k) => k)
  for (let k = x.length - 1; k > 0; k -= 1) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[x[k], x[j]] = [x[j]!, x[k]!]
  }
  return x
}

/**
 * GAME SCALE — đố gam: app gọi tên một gam (hay hợp âm rải), bạn bấm đi lên một quãng tám, từ nốt gốc ở quãng tám nào cũng được. Mười câu
 * một lượt; gợi ý hiện nốt, hiện ngón, nghe mẫu — bật khi cần. Sao mỗi câu: 3★ không sai và trong khoảng 1,2 giây mỗi nốt; 2★ sai ≤ 1;
 * còn lại 1★ (ngưỡng Claude đặt, chưa đo).
 */
export function GameScale() {
  useLiveSound()
  useComputerKeyboard(60)
  const [nhom, setNhom] = useState<NhomScale>('truong')
  const [ngauNhien, setNgauNhien] = useState(false)
  const [thuTu, setThuTu] = useState<number[]>(() => xao())
  const [cau, setCau] = useState(0)
  const [daBam, setDaBam] = useState<number[]>([])
  const [sai, setSai] = useState(0)
  const [batDau, setBatDau] = useState<number | null>(null)
  const [saiNot, setSaiNot] = useState<number | null>(null)
  const [ketQua, setKetQua] = useState<{ ten: string; sao: number; giay: number; sai: number }[]>([])
  const [hienNot, setHienNot] = useState(false)
  const [hienNgon, setHienNgon] = useState(false)
  const [kyLuc, setKyLuc] = useState<Record<string, number>>(() => docKho(KHO_SCALE, {}))

  const vong = nhom === 'thu' || nhom === 'thu-hoa-thanh' || nhom === 'ngu-cung-thu' || nhom === 'blues' || nhom === 'arp-thu' ? VONG_5_THU : VONG_5_TRUONG
  const het = cau >= SO_CAU
  const goc = (ngauNhien ? thuTu : vong)[cau % 12]!
  const c = cauScale(nhom, goc)
  const tongSao = ketQua.reduce((a, x) => a + x.sao, 0)

  const choiLai = (n: NhomScale = nhom) => {
    setNhom(n)
    setThuTu(xao())
    setCau(0)
    setDaBam([])
    setSai(0)
    setBatDau(null)
    setSaiNot(null)
    setKetQua([])
  }

  useNotBam((not, t) => {
    if (het) return
    if (notDung(c, daBam, not)) {
      const moi = [...daBam, not]
      const bd = batDau ?? t
      if (batDau === null) setBatDau(t)
      setSaiNot(null)
      if (moi.length < c.iv.length) {
        setDaBam(moi)
        return
      }
      const giay = (t - bd) / 1000
      const s = sai === 0 && giay <= 1.2 * c.iv.length ? 3 : sai <= 1 ? 2 : 1
      const kq = [...ketQua, { ten: c.ten, sao: s, giay, sai }]
      setKetQua(kq)
      setCau(cau + 1)
      setDaBam([])
      setSai(0)
      setBatDau(null)
      if (cau + 1 >= SO_CAU) {
        const tong = kq.reduce((a, x) => a + x.sao, 0)
        if (tong > (kyLuc[nhom] ?? 0)) {
          const moi = { ...kyLuc, [nhom]: tong }
          setKyLuc(moi)
          ghiKho(KHO_SCALE, moi)
        }
      }
    } else if (daBam.length > 0 || pc(not) !== c.goc) {
      setSai((x) => x + 1)
      setSaiNot(not)
    }
  })

  const dau = daBam[0] ?? 60 + c.goc
  const notMau = c.iv.map((x) => dau + x)
  const ngon = !hienNgon
    ? null
    : nhom === 'arp-truong' || nhom === 'arp-thu'
      ? ngonArp(nhom === 'arp-thu' ? 'thu' : 'truong', c.goc, 'phai')
      : ngonGam(nhom, c.goc, 'phai')
  const ngonCua: Record<number, number> = {}
  if (ngon) notMau.forEach((m, k) => (ngonCua[m] = ngon[k]!))

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-1 font-semibold text-cream">Game Scale — đố gam</h3>
        <p className="text-xs text-dim">
          App gọi tên một gam (hay một hợp âm rải), bạn bấm đi lên một quãng tám — từ nốt gốc ở quãng tám nào cũng được. Mười câu một lượt,
          gốc đi theo vòng quãng năm (ít dấu hóa trước) hay ngẫu nhiên. Bí thì bật gợi ý. Sao mỗi câu: 3★ không sai và trong khoảng 1,2 giây
          mỗi nốt · 2★ sai một lần · 1★ còn lại — ngưỡng Claude đặt, chưa đo.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {NHOM_SCALE.map((x) => (
          <button key={x.id} type="button" onClick={() => choiLai(x.id)} className={nut(nhom === x.id)}>
            {x.ten}
            {kyLuc[x.id] ? <span className="ml-1 text-amber-key">{kyLuc[x.id]}★</span> : null}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setNgauNhien((x) => !x)
            choiLai()
          }}
          className={nut(ngauNhien)}
        >
          {ngauNhien ? 'Gốc ngẫu nhiên' : 'Gốc theo vòng quãng năm'}
        </button>
        <button type="button" onClick={() => setHienNot((x) => !x)} className={nut(hienNot)}>
          Gợi ý: hiện nốt
        </button>
        <button type="button" onClick={() => setHienNgon((x) => !x)} className={nut(hienNgon)}>
          Gợi ý: hiện ngón (tay phải)
        </button>
        <button type="button" onClick={() => void nghe(notMau, 0.35)} className={nut(false)} disabled={het}>
          ▶ Nghe mẫu
        </button>
        <MidiConnect />
      </div>

      <div className="rounded-xl border border-line bg-black/25 p-3">
        {het ? (
          <div>
            <p className="text-lg text-amber-key">
              Xong lượt: {tongSao}/{SO_CAU * 3} ★
            </p>
            <ul className="mt-1 text-xs text-cream/80">
              {ketQua.map((x, k) => (
                <li key={k}>
                  {k + 1}. {x.ten} — {sao(x.sao)} · {x.giay.toFixed(1).replace('.', ',')} giây{x.sai ? ` · sai ${x.sai}` : ''}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => choiLai()} className={`${nut(false)} mt-2`}>
              Chơi lại
            </button>
          </div>
        ) : (
          <>
            <p className="mb-1 text-xs text-dim">
              Câu {cau + 1}/{SO_CAU} · {tongSao} ★
            </p>
            <p className="mb-2 text-lg text-cream">
              Bấm: <b className="text-amber-key">{c.ten}</b> <span className="text-sm text-dim">— đi lên {c.iv.length} nốt</span>
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {c.iv.map((_, k) => (
                <span
                  key={k}
                  className={`rounded border px-2 py-0.5 font-mono text-xs ${k < daBam.length ? 'border-teal-key/60 text-teal-key' : 'border-line text-dim'}`}
                >
                  {k < daBam.length ? tenNot(daBam[k]!, c.goc, c.thu) : k + 1}
                </span>
              ))}
            </div>
            {saiNot !== null && (
              <p className="mb-2 text-xs text-rose-300">
                {tenNot(saiNot, c.goc, c.thu)} chưa đúng{daBam.length === 0 ? ` — gam bắt đầu từ ${tenNot(c.goc, c.goc, c.thu)}` : ''}.
              </p>
            )}
            {hienNgon && !ngon && <p className="mb-2 text-xs text-dim">Gam này chưa có ngón chuẩn trong app — giữ ngón cái ở phím trắng.</p>}
            <OnScreenPiano
              lowNote={48}
              highNote={84}
              highlightNotes={hienNot ? notMau : []}
              fingerLabels={ngon ? ngonCua : undefined}
              accidentalStyle={c.ten.includes('♭') || notMau.some((m) => tenNot(m, c.goc, c.thu).includes('♭')) ? 'flat' : 'sharp'}
            />
          </>
        )}
      </div>
    </div>
  )
}
