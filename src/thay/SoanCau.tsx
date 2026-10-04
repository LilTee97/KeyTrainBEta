import { useEffect, useMemo, useRef, useState } from 'react'
import { playChord, playChordSequence, startAudio, stopTimelineLoop } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { LuotTap } from '../shared/persistence/db'
import {
  bacThay,
  chuyenThay,
  dungHopAm,
  GHI_CHU_THAY,
  khacLyThuyet,
  LOAI_BAC1,
  lyThuyetBac,
  phanBoNot,
  tenBac,
  tenHopAm,
  tenNotBac,
  traLoiTen,
  vongCuaThay,
  vongLyThuyet,
  xepNot,
  type DuLieuSoanCau,
} from './soanCau/soanCau'
import { TapSolo } from './TapSolo'
import type { Teacher } from './teachers'
import { GOC } from './vongThay'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const the = 'rounded-xl border border-line bg-black/25 p-4 text-sm'
const chonClass = 'rounded border border-line bg-white/6 px-1.5 py-1 text-cream'
const phanTram = (x: number) => `${Math.round(x * 100)} %`

/** Thế bấm để nghe: gốc ở quãng tám 3, các nốt hợp âm ở quãng tám 4 — mộc, chưa phải thế bấm của thầy. */
const theBam = (pcs: readonly number[]) => [48 + pcs[0]!, ...[...new Set(pcs)].map((p) => 60 + p).sort((a, b) => a - b)]

const nghe = async (pcs: readonly number[]) => {
  await startAudio()
  playChord(theBam(pcs), '2n')
}
const ngheVong = async (pcs: readonly (readonly number[])[]) => {
  await startAudio()
  playChordSequence(pcs.map(theBam), 1.2)
}

const PHAN = ['1. Hợp âm theo bậc', '2. Nhớ vòng', '3. Chọn nốt solo', '4. Tập solo'] as const

/**
 * Tab HỌC CÁCH SOẠN CÂU (GĐ 3, `Reference/KE-HOACH-LUYEN-TAP.md` mục GĐ 3) — làm thử với Linh Nhi (người dùng chọn 4/10/2026).
 * Bốn phần: hợp âm theo bậc (lý thuyết | thầy) · nhớ vòng · chọn nốt solo bám sheet · tập solo trên backing (`TapSolo`).
 */
export function SoanCau({
  teacher,
  du,
  luot,
  onGhi,
}: {
  teacher: Teacher
  du: DuLieuSoanCau
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const [thu, setThu] = useState(true)
  const [tonic, setTonic] = useState(9)
  const [loai, setLoai] = useState('m')
  const [phan, setPhan] = useState(0)
  useEffect(() => () => stopTimelineLoop(), [])

  return (
    <div className="flex flex-col gap-4">
      <div className={the}>
        <h3 className="mb-1 font-semibold text-cream">Học cách soạn câu — {teacher.label}</h3>
        <p className="text-xs text-dim">
          Hai nguồn, không trộn: <b className="text-cream">lý thuyết piano</b> và <b className="text-cream">số đo từ sheet của chị</b>.
          Chọn nốt solo bám sheet — chị đánh nốt nào bao nhiêu phần trăm; không có đúng sai tuyệt đối, nốt chị không dùng chỉ là
          "khác chị".
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
        <span>Giọng</span>
        <select value={tonic} onChange={(event) => setTonic(Number(event.target.value))} className={chonClass}>
          {GOC.map((ten, i) => (
            <option key={ten} value={i}>
              {ten}
            </option>
          ))}
        </select>
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => {
              setThu(v)
              setLoai(v ? 'm' : '')
            }}
            className={nut(thu === v)}
          >
            {v ? 'thứ' : 'trưởng'}
          </button>
        ))}
        <span className="ml-2">Hợp âm bậc 1</span>
        {LOAI_BAC1[thu ? 'thu' : 'truong'].map((one) => (
          <button key={one.id} type="button" onClick={() => setLoai(one.id)} className={nut(loai === one.id)}>
            {tenHopAm(tonic, thu, 0, one.kyHieu)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PHAN.map((ten, i) => (
          <button
            key={ten}
            type="button"
            onClick={() => {
              stopTimelineLoop()
              setPhan(i)
            }}
            className={nut(phan === i)}
          >
            {ten}
          </button>
        ))}
      </div>

      {phan === 0 && <HopAmTheoBac teacher={teacher} du={du} tonic={tonic} thu={thu} loai={loai} />}
      {phan === 1 && <NhoVong du={du} tonic={tonic} thu={thu} bay={loai === 'maj7' || loai === 'm7'} />}
      {phan === 2 && <ChonNot teacher={teacher} du={du} tonic={tonic} thu={thu} />}
      {phan === 3 && <TapSolo teacher={teacher} du={du} tonic={tonic} thu={thu} luot={luot} onGhi={onGhi} />}
    </div>
  )
}

function HopAmTheoBac({ teacher, du, tonic, thu, loai }: { teacher: Teacher; du: DuLieuSoanCau; tonic: number; thu: boolean; loai: string }) {
  const lt = lyThuyetBac(tonic, thu, loai)
  const vongLt = vongLyThuyet(tonic, thu, loai === 'maj7' || loai === 'm7')
  const thay = bacThay(du, tonic, thu)
  const khac = khacLyThuyet(du, tonic, thu)
  const chuyen = chuyenThay(du, tonic, thu)
  const vongT = vongCuaThay(du, tonic, thu)
  const ghiChu = GHI_CHU_THAY[teacher.id]?.[thu ? 'thu' : 'truong'] ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={the}>
        <h4 className="mb-1 font-semibold text-cream">Lý thuyết piano</h4>
        <p className="mb-3 text-xs text-dim">{lt.moTa}</p>
        <table className="mb-4 w-full text-left text-xs">
          <tbody>
            {lt.dong.map((d) => (
              <tr key={d.laMa} className="border-t border-line/60">
                <td className="py-1 pr-2 font-mono text-dim">{d.laMa}</td>
                <td className="py-1 pr-2">
                  <button type="button" onClick={() => void nghe(d.pcs)} className="font-semibold text-amber-key hover:underline">
                    ▶ {d.hopAm}
                  </button>
                </td>
                <td className="py-1 text-dim">{d.chucNang}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h5 className="mb-1 text-xs font-semibold text-cream">Vòng phổ biến (lý thuyết)</h5>
        <ul className="flex flex-col gap-1.5 text-xs">
          {vongLt.map((v) => (
            <li key={v.id}>
              <button type="button" onClick={() => void ngheVong(v.pcs)} className="font-semibold text-amber-key hover:underline">
                ▶ {v.ten}
              </button>{' '}
              <span className="font-mono text-cream">{v.hopAm.join(' – ')}</span>
              <span className="block text-dim">{v.ghiChu}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={the}>
        <h4 className="mb-1 font-semibold text-cream">{teacher.label} — số đo từ sheet</h4>
        <p className="mb-3 text-xs text-dim">
          Phần hát 8 bài (3 trưởng, 5 thứ), loại hợp âm lấy từ nốt đệm thật. Mỗi bậc: bao nhiêu đoạn, bao nhiêu bài, để trơn bao nhiêu;
          "có 9: 38" = 38 đoạn có nốt 9 — một hợp âm có thể mang hai màu. Chỉ bậc có ≥ 5 đoạn ở ≥ 2 bài.
        </p>
        <table className="mb-4 w-full text-left text-xs">
          <tbody>
            {thay.map((d) => (
              <tr key={d.laMa} className="border-t border-line/60 align-top">
                <td className="py-1 pr-2 font-mono text-dim">{d.laMa}</td>
                <td className="py-1 pr-2">
                  <button type="button" onClick={() => void nghe(d.pcs)} className="font-semibold text-amber-key hover:underline">
                    ▶ {d.hopAm}
                  </button>
                </td>
                <td className="py-1 pr-2 text-dim">
                  {d.n} đoạn · {d.bai} bài
                </td>
                <td className="py-1 text-cream/85">
                  trơn {d.tron}/{d.n}
                  {d.mau.length > 0 && ` · có ${d.mau.map(([m, k]) => `${m}: ${k}`).join(' · ')}`}
                  {d.nghi && <span className="block text-rose-300">{d.nghi}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h5 className="mb-1 text-xs font-semibold text-cream">Khác lý thuyết ở đâu</h5>
        <ul className="mb-4 list-disc pl-4 text-xs text-cream/85">
          {khac.length ? khac.map((s) => <li key={s}>{s}</li>) : <li className="text-dim">Các bậc chính đều đúng chất của gam.</li>}
        </ul>

        <h5 className="mb-1 text-xs font-semibold text-cream">Bước chuyển hay gặp (≥ 2 bài)</h5>
        <p className="mb-4 text-xs text-cream/85">
          {chuyen.map((c) => `${c.tu} → ${c.den}: ${c.n} lần, ${c.bai} bài`).join(' · ')}
        </p>

        <h5 className="mb-1 text-xs font-semibold text-cream">Vòng thật từ sheet</h5>
        <ul className="mb-4 flex flex-col gap-1 text-xs">
          {vongT.map((v) => (
            <li key={v.id}>
              <button type="button" onClick={() => void ngheVong(v.pcs)} className="font-semibold text-amber-key hover:underline">
                ▶ {v.ten}
              </button>{' '}
              <span className="font-mono text-cream">{v.hopAm.join(' – ')}</span> <span className="text-dim">({v.dieu})</span>
            </li>
          ))}
        </ul>

        {ghiChu.length > 0 && (
          <>
            <h5 className="mb-1 text-xs font-semibold text-cream">Ghi chú (số đo md của chị)</h5>
            <ul className="list-disc pl-4 text-xs text-dim">
              {ghiChu.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

/** Quiz điền ô trống: một ô của vòng bị ẩn, bấm hợp âm ấy trên đàn (đàn MIDI · chuột · bàn phím máy · chạm). */
function NhoVong({ du, tonic, thu, bay }: { du: DuLieuSoanCau; tonic: number; thu: boolean; bay: boolean }) {
  // Phím bấm phải ra tiếng — người dùng 4/10/2026: "click vào phím đàn mà ko nghe tiếng". Mỗi lúc chỉ một phần mở, không kêu đôi.
  useLiveSound()
  useComputerKeyboard(60)
  const [nguon, setNguon] = useState<'thay' | 'ly-thuyet'>('thay')
  const ds = useMemo(
    () => (nguon === 'thay' ? vongCuaThay(du, tonic, thu) : vongLyThuyet(tonic, thu, bay)),
    [nguon, du, tonic, thu, bay],
  )
  const [hat, setHat] = useState(0)
  const cau = useMemo(() => {
    const v = ds[hat % Math.max(1, ds.length)]
    return v ? { v, an: Math.floor(hat / ds.length) % v.hopAm.length } : null
  }, [ds, hat])
  const [ketQua, setKetQua] = useState<'dang' | 'dung' | 'xem'>('dang')
  const [sai, setSai] = useState(0)
  const [diem, setDiem] = useState({ cau: 0, dungNgay: 0 })
  const daSaiLuotBam = useRef(false)
  /* Tự do mặc định; tick "Vào tập luyện" mới đếm điểm (người dùng 4/10/2026, ý 2). Lịch ôn thẻ nhớ ở bước sau. */
  const [tapLuyen, setTapLuyen] = useState(false)
  /* Trả lời bằng TÊN — chạm chọn gốc + loại, hoặc gõ (người dùng 4/10/2026, ý 5). Loại lấy từ các vòng đang hỏi. */
  const hauTo = useMemo(() => [...new Set(ds.flatMap((v) => v.hopAm.map((h) => h.replace(/^[A-G][#b]?/, ''))))], [ds])
  const [chonGoc, setChonGoc] = useState<string | null>(null)
  const [chonHau, setChonHau] = useState<string | null>(null)
  const [go, setGo] = useState('')
  const [baoTen, setBaoTen] = useState('')
  const traLoi = (ten: string) => {
    if (!cau || ketQua !== 'dang') return
    const kq = traLoiTen(ten, cau.v.pcs[cau.an]!)
    if (kq === 'khong-doc') {
      setBaoTen(`Chưa đọc được "${ten}" — gõ như Dm7, Bb, F#m`)
      return
    }
    if (kq === 'dung') {
      setKetQua('dung')
      setDiem((d) => ({ cau: d.cau + 1, dungNgay: d.dungNgay + (sai === 0 ? 1 : 0) }))
      setBaoTen('')
      return
    }
    setSai((x) => x + 1)
    setBaoTen(`${ten} — chưa đúng`)
  }

  const held = useMidiStore((state) => state.heldNotes)
  useEffect(() => {
    if (!cau || ketQua !== 'dang') return
    if (held.length === 0) {
      daSaiLuotBam.current = false
      return
    }
    const pcs = cau.v.pcs[cau.an]!
    if (dungHopAm(held, pcs)) {
      setKetQua('dung')
      setDiem((d) => ({ cau: d.cau + 1, dungNgay: d.dungNgay + (sai === 0 ? 1 : 0) }))
      return
    }
    if (!daSaiLuotBam.current && new Set(held.map((x) => x % 12)).size >= new Set(pcs).size) {
      daSaiLuotBam.current = true
      setSai((x) => x + 1)
    }
  }, [held, cau, ketQua, sai])

  const lamMoi = () => {
    setKetQua('dang')
    setSai(0)
    setChonGoc(null)
    setChonHau(null)
    setBaoTen('')
  }
  const cauKhac = () => {
    stopTimelineLoop()
    setHat(Math.floor(Math.random() * 1000))
    lamMoi()
  }

  if (!cau) return <p className="text-sm text-dim">Chưa có vòng ở giọng này.</p>
  return (
    <div className="flex flex-col gap-3">
      <div className={the}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-dim">
          Vòng hỏi:
          {(
            [
              ['thay', 'vòng thật từ sheet của chị'],
              ['ly-thuyet', 'vòng lý thuyết'],
            ] as const
          ).map(([value, ten]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setNguon(value)
                setHat(0)
                lamMoi()
              }}
              className={nut(nguon === value)}
            >
              {ten}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-cream">
            <input type="checkbox" checked={tapLuyen} onChange={(event) => setTapLuyen(event.target.checked)} />
            Vào tập luyện — đếm điểm
          </label>
          {tapLuyen && (
            <span className="font-mono">
              đúng ngay lần đầu {diem.dungNgay}/{diem.cau} câu
            </span>
          )}
        </div>
        <p className="mb-2 text-xs text-dim">{cau.v.ten}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {cau.v.hopAm.map((h, i) => (
            <span
              key={i}
              className={`min-w-16 rounded-lg border px-3 py-2 text-center font-mono text-lg ${
                i === cau.an ? 'border-amber-key text-amber-key' : 'border-line text-cream'
              }`}
            >
              {i === cau.an && ketQua === 'dang' ? '?' : h}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void ngheVong(cau.v.pcs)} className={nut(false)}>
            ▶ Nghe vòng
          </button>
          <button
            type="button"
            disabled={ketQua !== 'dang'}
            onClick={() => {
              setKetQua('xem')
              setDiem((d) => ({ ...d, cau: d.cau + 1 }))
            }}
            className={nut(false)}
          >
            Xem đáp án
          </button>
          <button type="button" onClick={cauKhac} className={nut(false)}>
            Câu khác
          </button>
          <span className="text-xs">
            {ketQua === 'dung' && <b className="text-teal-key">Đúng — {cau.v.hopAm[cau.an]}</b>}
            {ketQua === 'xem' && <span className="text-rose-300">Đáp án: {cau.v.hopAm[cau.an]}</span>}
            {ketQua === 'dang' && (
              <span className="text-dim">
                Bấm hợp âm còn thiếu trên đàn (giữ cùng lúc mọi nốt, quãng tám nào cũng được), hoặc chọn / gõ tên ở dưới
                {sai > 0 && ` · chưa đúng ${sai} lần`}
              </span>
            )}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-line/60 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-dim">Chạm chọn tên:</span>
            {GOC.map((g) => (
              <button key={g} type="button" onClick={() => setChonGoc(g)} className={nut(chonGoc === g)}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-dim">loại:</span>
            {hauTo.map((h) => (
              <button key={h} type="button" onClick={() => setChonHau(h)} className={nut(chonHau === h)}>
                {h || 'trưởng'}
              </button>
            ))}
            <button
              type="button"
              disabled={chonGoc === null || chonHau === null || ketQua !== 'dang'}
              onClick={() => traLoi(`${chonGoc}${chonHau}`)}
              className="ml-2 rounded-lg bg-amber-key px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
            >
              Trả lời {chonGoc ?? '…'}
              {chonHau ?? ''}
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              traLoi(go)
              setGo('')
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-dim">hoặc gõ tên:</span>
            <input
              value={go}
              onChange={(event) => setGo(event.target.value)}
              placeholder="vd Dm7"
              className={`${chonClass} w-28`}
              aria-label="Gõ tên hợp âm còn thiếu"
            />
            <button type="submit" disabled={ketQua !== 'dang' || !go.trim()} className={nut(false)}>
              Trả lời
            </button>
            {baoTen && <span className="text-rose-300">{baoTen}</span>}
          </form>
        </div>
      </div>
      <MidiConnect />
      <OnScreenPiano lowNote={48} highNote={84} highlightNotes={ketQua === 'dang' ? [] : theBam(cau.v.pcs[cau.an]!)} />
    </div>
  )
}

/** Chọn nốt solo — bám sheet: trên từng hợp âm của một vòng, chị đánh nốt nào bao nhiêu phần trăm. */
function ChonNot({ teacher, du, tonic, thu }: { teacher: Teacher; du: DuLieuSoanCau; tonic: number; thu: boolean }) {
  useLiveSound()
  useComputerKeyboard(60)
  const ds = vongCuaThay(du, tonic, thu)
  const [vongId, setVongId] = useState<string | null>(null)
  const [phach, setPhach] = useState<'ca' | 'manh' | 'nhe'>('ca')
  const [chon, setChon] = useState(0)
  const v = ds.find((x) => x.id === vongId) ?? ds[0]
  if (!v) return <p className="text-sm text-dim">Chưa có vòng ở giọng này.</p>

  const cacHop = v.vong.hopAm.map((h, i) => {
    const pb = phanBoNot(du, v.dieu, thu, h.chat, phach)
    return { hopAm: v.hopAm[i]!, chat: h.chat, goc: tonic + h.goc, pcs: v.pcs[i]!, pb, xep: xepNot(pb) }
  })
  const dangChon = cacHop[chon] ?? cacHop[0]!
  const sang = dangChon.xep
    .filter((m) => m.muc === 'hay')
    .flatMap((m) => [60, 72].map((o) => o + ((dangChon.goc + m.rel) % 12)))

  return (
    <div className="flex flex-col gap-3">
      <div className={the}>
        <p className="mb-2 text-xs text-dim">
          Phần trăm = số nốt chị đánh trên loại hợp âm ấy ở đoạn solo (nốt cao nhất mỗi cú tay phải), bậc tính từ gốc hợp âm.
          "Hay dùng" là nhóm nốt gộp lại tới ~70 % số nốt của chị (Claude chọn mốc, chưa đo). {GHI_CHU_THAY[teacher.id]?.not}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
          Vòng:
          <select
            value={v.id}
            onChange={(event) => {
              setVongId(event.target.value)
              setChon(0)
            }}
            className={chonClass}
          >
            {ds.map((x) => (
              <option key={x.id} value={x.id}>
                {x.ten} — {x.hopAm.join(' ')}
              </option>
            ))}
          </select>
          {(
            [
              ['ca', 'mọi phách'],
              ['manh', 'phách mạnh'],
              ['nhe', 'phách nhẹ'],
            ] as const
          ).map(([value, ten]) => (
            <button key={value} type="button" onClick={() => setPhach(value)} className={nut(phach === value)}>
              {ten}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cacHop.map((h, i) => (
          <div key={i} className={`${the} ${i === chon ? 'ring-1 ring-amber-key' : ''}`}>
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <button
                type="button"
                onClick={() => {
                  setChon(i)
                  void nghe(h.pcs)
                }}
                className="text-lg font-semibold text-amber-key hover:underline"
              >
                ▶ {h.hopAm}
              </button>
              <span className="text-[11px] text-dim">
                {h.pb.moTa} · n = {h.pb.n}
              </span>
            </div>
            {(['hay', 'co', 'chua'] as const).map((muc) => {
              const ds_ = h.xep.filter((m) => m.muc === muc)
              if (!ds_.length) return null
              return (
                <p key={muc} className={`text-xs ${muc === 'hay' ? 'text-cream' : muc === 'co' ? 'text-cream/70' : 'text-dim'}`}>
                  <b>{muc === 'hay' ? 'Chị hay dùng' : muc === 'co' ? 'Có dùng' : 'Chưa gặp trong sheet'}:</b>{' '}
                  {ds_
                    .map((m) => `${tenBac(m.rel, h.chat)} (${tenNotBac(h.goc, m.rel, h.chat, tonic, thu)})${muc === 'chua' ? '' : ` ${phanTram(m.phanTram)}`}`)
                    .join(' · ')}
                </p>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-dim">
        Phím sáng: nhóm chị hay dùng trên <b className="text-cream">{dangChon.hopAm}</b> — bấm tên hợp âm khác để đổi.
      </p>
      <OnScreenPiano lowNote={48} highNote={84} highlightNotes={sang} />
    </div>
  )
}
