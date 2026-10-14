import { useEffect, useMemo, useRef, useState } from 'react'
import { playChord, playChordSequence, startAudio, startTimelineLoop, stopTimelineLoop, usePlaybackStore } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiNote } from '../shared/musicTheory/types'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { BanPhimMau } from './hocSolo/BanPhimMau'
import {
  chongDuoi,
  congThucCua,
  goiYDinh,
  khungCua,
  khungLoai,
  LOAI_KHUNG,
  mucCua,
  nenVong,
  NHOM_KHUNG,
  notCua,
  SSA,
  tenPhim,
  VONG_KHUNG,
  type Khung,
  type MucKhung,
  type NhomKhung,
} from './hocSolo/khungNot'
import type { Muc } from './hocSolo/mauPhim'
import { chongCongThuc, soThe, tenBam } from './soanCau/chongHopAm'
import { doanGiong } from './soanCau/doTaiHoaAm'
import { kieuGoc } from './soanCau/meoChong'
import { docHop } from './soanCau/thayTrongVong'
import { GOC } from './vongThay'

/*
  GAME CHẠY NGÓN — làm lại 15/10/2026 theo người dùng: không còn nốt rơi sẵn để đánh theo, mà dạy nhận ra KHUNG NỐT của từng loại hợp âm
  rồi tự chọn nốt. Hai kiểu: (1) làm quen từng loại — khung, nốt chính / phụ, nốt đỉnh nên chọn, chồng hai tay; (2) solo trên vòng có
  nền, kiểu clip "Rải Ngón" của SSA — khung đổi theo hợp âm đang vang, gợi ý nốt đỉnh và thế chồng tay phải dưới nó. Dữ liệu và số đo:
  `hocSolo/khungNot.ts`. Lối nốt rơi cũ (câu thầy đã duyệt) dời sang tab "Nốt rơi cũ (câu thầy)" (`GameSolo.tsx`), chưa xoá. Game rơi
  kiểu Game công thức cho khung nốt: tab "Game nốt rơi" (`GameKhungRoi.tsx`).
*/

const pc = (x: number) => ((x % 12) + 12) % 12
const THE = 'rounded-xl border border-line bg-black/25 p-4'
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const MUC: Readonly<Record<MucKhung, Muc>> = { chinh: 'dam', phu: 'mo', khong: 'khong' }
const TEN_MUC: Readonly<Record<MucKhung, string>> = { chinh: 'chính', phu: 'phụ', khong: 'không màu' }
const CHU_MUC: Readonly<Record<MucKhung, string>> = { chinh: 'text-teal-key', phu: 'text-amber-key', khong: 'text-dim' }

/* Các thầy trong app nói gì về mỗi nhóm — số lấy từ md đã chốt (Học Solo · Chọn nốt theo thầy). */
const THAY_NHOM: Readonly<Partial<Record<NhomKhung, string>>> = {
  'Trưởng màu': 'Cà Pháo: trên hợp âm trưởng, 9 và 13 chiếm một phần tư số nốt (828 nốt). Linh Nhi: bài trưởng bám chặt ba nốt trụ (70,2 % nốt hợp âm, n=406).',
  'Thứ màu': 'Cà Pháo đánh thẳng ♭7 và 11 trên hợp âm thứ. Linh Nhi: bài thứ rải rộng sang 9 · ♭7 · 11 (59,9 % nốt hợp âm, n=601).',
  Át: 'Blues: phách 1 · 4 là nốt hợp âm 69–77 % (3 sheet) — nốt khung đứng ở phách mạnh.',
  'Át có nốt căng': 'Cà Pháo: trên V7 có thêm ♭13 (9 % số nốt, n=66) — nốt căng đi qua rồi rơi về nốt hợp âm sau.',
}

const ngheChuoi = async (ds: readonly number[], giay = 0.3) => {
  await startAudio()
  playChordSequence(
    ds.map((m) => [m as MidiNote]),
    giay,
  )
}
const ngheHop = async (ds: readonly number[]) => {
  await startAudio()
  playChord(ds as MidiNote[], '1n', 80)
}

/**
 * Mỗi cú bấm xuống (đàn MIDI, phím máy tính, bàn phím trên màn hình) — nghe thẳng kho MIDI, mỗi cú một lần. Bản đầu đọc `lastEvent` qua
 * React: bấm bốn nốt cùng lúc thì React gộp lần vẽ, chỉ đếm được nốt cuối (chạy thử 15/10: "4 nốt" ra "1 nốt").
 */
function useNotBam(onNot: (note: number) => void) {
  const goi = useRef(onNot)
  goi.current = onNot
  useEffect(
    () =>
      useMidiStore.subscribe((s, truoc) => {
        const ev = s.lastEvent
        if (ev && ev !== truoc.lastEvent && ev.velocity > 0) goi.current(ev.note)
      }),
    [],
  )
}

/** Bàn phím khung: tô ba mức, tên + bậc trên phím khung, vòng vàng phím đang giữ, ★ phím gợi ý; bấm phím là đánh nốt. */
function BanPhimKhung({ k, giu, sao = [], thap = 48, cao = 84 }: { k: Khung; giu: readonly number[]; sao?: readonly number[]; thap?: number; cao?: number }) {
  // Ba quãng tám trên điện thoại (390 px) thì phím trắng chỉ ~16 px, chữ không đọc được — giữ tối thiểu 640 px, vuốt ngang trong khung.
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <BanPhimKhungRong k={k} giu={giu} sao={sao} thap={thap} cao={cao} />
      </div>
    </div>
  )
}
function BanPhimKhungRong({ k, giu, sao, thap, cao }: { k: Khung; giu: readonly number[]; sao: readonly number[]; thap: number; cao: number }) {
  return (
    <BanPhimMau
      thap={thap}
      cao={cao}
      muc={(m) => MUC[mucCua(k, m)]}
      nhan={(m) => {
        const n = notCua(k, m)
        if (!n && !giu.includes(m)) return null
        return { ten: tenPhim(k, m), phu: n ? <span className="font-bold">{n.bac}</span> : <span>ngoài</span> }
      }}
      dangBam={giu}
      sao={sao}
      danh
    />
  )
}

/** Tên hợp âm hai tay đang bấm — như nhãn trên clip SSA. Tách tay ở Đô giữa (đoán của Claude, app không thấy tay thật). */
function TenDangBam({ giu }: { giu: readonly number[] }) {
  if (!giu.length) return <p className="text-xs text-dim">Bấm thử — tên hợp âm hai tay hiện ở đây, như nhãn trong clip của anh SSA.</p>
  const trai = giu.filter((m) => m < 60)
  const phai = giu.filter((m) => m >= 60)
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {trai.length > 0 && (
        <span className="text-xs text-dim">
          Tay trái <b className="font-mono text-lg text-teal-key">{tenBam(trai).ten}</b>
        </span>
      )}
      {phai.length > 0 && (
        <span className="text-xs text-dim">
          Tay phải <b className="font-mono text-lg text-amber-key">{tenBam(phai, false).ten}</b>
        </span>
      )}
      <span className="text-xs text-dim">
        Hai tay <b className="font-mono text-2xl text-cream">{tenBam(giu).ten}</b>
      </span>
    </div>
  )
}

/** Vai từng nốt đang giữ trong khung. */
function VaiDangBam({ k, giu }: { k: Khung; giu: readonly number[] }) {
  if (!giu.length) return null
  return (
    <p className="flex flex-wrap gap-1.5 text-xs">
      {giu.map((m) => {
        const muc = mucCua(k, m)
        return (
          <span key={m} className={`rounded border border-line px-1.5 py-0.5 ${CHU_MUC[muc]}`}>
            {tenPhim(k, m)} · {notCua(k, m)?.bac ?? 'ngoài khung'} · {TEN_MUC[muc]}
          </span>
        )
      })}
    </p>
  )
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

/* ---------------- Kiểu 1 — làm quen từng loại ---------------- */

function LamQuen() {
  const [id, setId] = useState('maj7')
  const [goc, setGoc] = useState(0)
  const [dao, setDao] = useState(0)
  const loai = LOAI_KHUNG.find((l) => l.id === id)!
  const k = useMemo(() => khungLoai(loai, goc), [loai, goc])
  const ct = congThucCua(loai)
  const soDao = ct ? soThe(ct) : 1
  const chong = ct ? chongCongThuc(ct, goc, GOC[goc]!, kieuGoc(goc), 0, dao % soDao) : null
  const dinhDauTien = k.dinh[0] ?? 0
  const giu = useMidiStore((s) => s.heldNotes)
  const [viec, setViec] = useState({ chong: false, dinh: [] as number[], chay: 0, chayXong: false })
  const kRef = useRef(k)
  kRef.current = k
  useEffect(() => {
    setViec({ chong: false, dinh: [], chay: 0, chayXong: false })
    setDao(0)
  }, [id, goc])
  useEffect(() => {
    if (giu.length < 3) return
    const lop = new Set(giu.map(pc))
    // Bỏ được bậc 5, và bậc 9 của hợp âm 13 — như công thức chồng (C13 = 1 – 3 – ♭7 + Am) và như `tenBam` gọi tên.
    const can = k.quang.filter((iv) => iv !== 7 && !(iv === 2 && k.quang.includes(9) && k.quang.includes(10))).map((iv) => pc(k.goc + iv))
    const du = pc(Math.min(...giu)) === k.goc && can.every((p) => lop.has(p))
    const dinh = Math.max(...giu)
    setViec((v) => ({
      ...v,
      chong: v.chong || du,
      dinh: dinh >= 60 && mucCua(k, dinh) !== 'khong' && !v.dinh.includes(pc(dinh)) ? [...v.dinh, pc(dinh)] : v.dinh,
    }))
  }, [giu, k])
  useNotBam((note) => {
    const ok = mucCua(kRef.current, note) !== 'khong'
    setViec((v) => {
      const chay = ok ? v.chay + 1 : 0
      return { ...v, chay, chayXong: v.chayXong || chay >= 7 }
    })
  })
  const ho = loai.ssa ? SSA[loai.ssa] : null
  const ngauNhien = () => {
    setId(LOAI_KHUNG[Math.floor(Math.random() * LOAI_KHUNG.length)]!.id)
    setGoc(Math.floor(Math.random() * 12))
  }
  const ram = k.not.map((n) => 60 + pc(n.p - k.goc) + k.goc - (k.goc >= 6 ? 12 : 0)).sort((a, b) => a - b)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 text-xs">
        {NHOM_KHUNG.map((nh) => (
          <div key={nh} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 text-dim">{nh}</span>
            {LOAI_KHUNG.filter((l) => l.nhom === nh).map((l) => (
              <button key={l.id} type="button" onClick={() => setId(l.id)} className={nut(id === l.id)}>
                {l.ten}
              </button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-28 text-dim">Gốc</span>
          <select value={goc} onChange={(e) => setGoc(Number(e.target.value))} aria-label="Gốc hợp âm" className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream">
            {GOC.map((ten, g) => (
              <option key={ten} value={g}>
                {ten}
              </option>
            ))}
          </select>
          <button type="button" onClick={ngauNhien} className={nut(false)}>
            🎲 Ngẫu nhiên
          </button>
        </div>
      </div>

      <div className={THE}>
        <h4 className="font-semibold text-cream">
          <span className="font-mono text-2xl text-amber-key">{k.ten}</span> — khung <b>{k.gam}</b>
        </h4>
        <p className="mb-2 text-xs text-cream/85">
          {loai.nghe} Chỗ hay gặp: <b>{loai.nha.laMa}</b> — khung lấy gam của chỗ ấy, nốt hợp âm thay đúng nốt cùng tên chữ.
        </p>
        <BanPhimKhung k={k} giu={giu} sao={k.dinh.slice(0, 1).flatMap((iv) => [60, 72].map((o) => o + pc(k.goc + iv)))} />
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <button type="button" className={nut(false)} onClick={() => void ngheHop([36 + k.goc, ...k.quang.filter((x) => x !== 0).map((x) => 60 + pc(k.goc + x))])}>
            ▶ Nghe hợp âm
          </button>
          <button type="button" className={nut(false)} onClick={() => void ngheChuoi([...ram, ram[0]! + 12])}>
            ▶ Nghe khung (gam)
          </button>
        </div>
        <div className="mt-2">
          <DongKhung k={k} />
        </div>
      </div>

      <div className={THE}>
        <h4 className="mb-1 font-semibold text-cream">Chọn nốt đỉnh — nốt giai điệu</h4>
        <ol className="ml-4 list-decimal text-xs text-cream/85">
          {k.dinh.slice(0, 4).map((iv) => {
            const n = k.not.find((x) => x.iv === iv)!
            return (
              <li key={iv}>
                <b className="font-mono">{n.ten}</b> ({n.bac}) {n.dau ? '— nốt đuôi mang lại màu' : n.muc === 'chinh' ? '— nốt hợp âm' : '— nốt phụ, thêm màu'}
              </li>
            )
          })}
        </ol>
        <p className="mt-1 text-xs text-cream/80">
          {ho
            ? `Anh SSA trên ${ho.ten} (${ho.n} nốt giai điệu, 3 clip): ${ho.giaiDieu.map(([b, d]) => `${b} ${d}`).join(' · ')}. ${ho.vd}.`
            : 'Chưa có số đo SSA cho loại này — thứ tự trên là lý thuyết của Claude: nốt dẫn 3 · 7 và nốt đuôi mang lại.'}
        </p>
        {THAY_NHOM[loai.nhom] && <p className="mt-1 text-xs text-dim">Các thầy trong app: {THAY_NHOM[loai.nhom]}</p>}
      </div>

      <div className={THE}>
        <h4 className="mb-1 font-semibold text-cream">Chồng hai tay như anh SSA — tay trái bass, tay phải khung, giai điệu trên đỉnh</h4>
        {chong ? (
          <>
            <p className="mb-1 text-xs text-cream/85">
              {k.ten} = tay trái <b>{chong.nhan.trai}</b> + tay phải <b>{chong.nhan.phai}</b> — {ct!.quanHe}.{' '}
              {ho ? `Clip SSA: tay phải ${ho.khungPhai}.` : ''}
            </p>
            <BanPhimHaiTay trai={chong.trai} phai={chong.phai} nhan={chong.nhan} lowNote={36} highNote={84} />
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button type="button" className={nut(false)} onClick={() => void ngheHop([...chong.trai, ...chong.phai])}>
                ▶ Nghe thế chồng
              </button>
              {soDao > 1 && (
                <button type="button" className={nut(false)} onClick={() => setDao((d) => d + 1)}>
                  ↻ Đổi đỉnh (đang: {tenPhim(k, Math.max(...chong.phai))} · {notCua(k, Math.max(...chong.phai))?.bac})
                </button>
              )}
              <span className="text-dim">Xoay tay phải là đổi nốt giai điệu mà màu hợp âm vẫn giữ.</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-cream/85">
            Chưa có công thức chồng riêng cho {loai.ten} — dùng nốt chính: tay trái gốc, tay phải{' '}
            {chongDuoi(k, 72 + pc(k.goc + dinhDauTien) - (pc(k.goc + dinhDauTien) > 7 ? 12 : 0))
              .map((m) => tenPhim(k, m))
              .join(' – ')}{' '}
            (đỉnh là nốt nên chọn nhất).
          </p>
        )}
      </div>

      <div className={THE}>
        <h4 className="mb-1 font-semibold text-cream">Tự đánh</h4>
        <TenDangBam giu={giu} />
        <div className="mt-1">
          <VaiDangBam k={k} giu={giu} />
        </div>
        <ul className="mt-2 flex flex-col gap-0.5 text-xs">
          <li className={viec.chong ? 'text-teal-key' : 'text-cream/85'}>
            {viec.chong ? '✓' : '○'} Chồng ra {k.ten}: bass {GOC[k.goc]} thấp nhất, đủ các nốt của hợp âm (bỏ được bậc 5; hợp âm 13 bỏ được 9).
          </li>
          <li className={viec.dinh.length >= 3 ? 'text-teal-key' : 'text-cream/85'}>
            {viec.dinh.length >= 3 ? '✓' : '○'} Giữ hợp âm, đổi nốt đỉnh 3 lần trong khung ({Math.min(3, viec.dinh.length)}/3).
          </li>
          <li className={viec.chayXong ? 'text-teal-key' : 'text-cream/85'}>
            {viec.chayXong ? '✓' : '○'} Chạy 7 nốt liền trong khung, không đụng nốt không màu ({Math.min(7, viec.chay)}/7).
          </li>
        </ul>
      </div>
    </div>
  )
}

/* ---------------- Kiểu 2 — solo trên vòng có nền ---------------- */

const NHIP_DO = [50, 60, 70, 80] as const

function SoloVong() {
  const [vongId, setVongId] = useState<string>(VONG_KHUNG[0]!.id)
  const [tu, setTu] = useState<{ chu: string; tonic: number; thu: boolean } | null>(null)
  const [go, setGo] = useState('')
  const [bao, setBao] = useState('')
  const [bpm, setBpm] = useState<number>(60)
  const [nhip, setNhip] = useState(4)
  const [day, setDay] = useState(false)
  const [chay, setChay] = useState(false)
  const [chon, setChon] = useState(0)
  const [truoc, setTruoc] = useState<number | null>(null)
  const [dem, setDem] = useState<Record<MucKhung, number>>({ chinh: 0, phu: 0, khong: 0 })
  const v = vongId === 'tu-nhap' && tu ? { chu: tu.chu, tonic: tu.tonic, thu: tu.thu, ten: `Vòng tự điền · ${tu.chu}`, ghiChu: '' } : VONG_KHUNG.find((x) => x.id === vongId)!
  const ks = useMemo(() => {
    const ds = docHop(v.chu) ?? []
    return ds.map((c) =>
      khungCua(v.tonic, v.thu, {
        goc: pc(c.root - v.tonic),
        chat: c.quality.symbol,
        ...(c.bass !== undefined && c.bass !== c.root ? { bass: pc(c.bass - v.tonic) } : {}),
      }),
    )
  }, [v.chu, v.tonic, v.thu])
  const dai = ks.length * nhip
  const vitri = usePlaybackStore((s) => s.positionBeats)
  const dangLap = usePlaybackStore((s) => s.looping)
  const dang = chay && dangLap && dai > 0 ? Math.floor((((vitri % dai) + dai) % dai) / nhip) % ks.length : Math.min(chon, ks.length - 1)
  const k = ks[dang]
  const sau = ks.length ? ks[(dang + 1) % ks.length]! : null
  const giu = useMidiStore((s) => s.heldNotes)
  const kRef = useRef(k)
  kRef.current = k
  const dung = () => {
    stopTimelineLoop()
    setChay(false)
  }
  useEffect(() => () => stopTimelineLoop(), [])
  /** Đổi vòng · nhịp · nền khi nền đang chạy thì dừng trước — bấm chạy lại cho khớp. */
  const doi = (f: () => void) => {
    if (chay) dung()
    f()
  }
  const batDau = async () => {
    if (!ks.length) return
    await startAudio()
    startTimelineLoop(nenVong(ks, nhip, day), bpm, dai)
    setChay(true)
    setDem({ chinh: 0, phu: 0, khong: 0 })
  }
  useNotBam((note) => {
    const kk = kRef.current
    if (!kk) return
    const muc = mucCua(kk, note)
    setDem((d) => ({ ...d, [muc]: d[muc] + 1 }))
    const phai = useMidiStore.getState().heldNotes.filter((m) => m >= 60)
    if (note >= 60 && note >= Math.max(note, ...phai)) setTruoc(note)
  })
  const goiY = k ? goiYDinh(k, truoc, ks.length > 1 ? sau : null) : []
  const chung = k && sau && ks.length > 1 ? k.not.filter((n) => n.muc === 'chinh' && sau.not.some((x) => x.muc === 'chinh' && x.p === n.p)) : []
  const dungVong = () => {
    const ds = docHop(go)
    if (!ds?.length) {
      setBao('Không đọc được — gõ tên hợp âm cách nhau bằng dấu cách, vd "Dbmaj9 Ab13sus4 Fm7 Bbm9".')
      return
    }
    const g = doanGiong(ds)[0]
    setTu({ chu: go.trim(), tonic: g?.tonic ?? ds[0]!.root, thu: g?.thu ?? false })
    setVongId('tu-nhap')
    setChon(0)
    setBao(g ? `App đoán giọng ${GOC[g.tonic]} ${g.thu ? 'thứ' : 'trưởng'} — khung đọc theo giọng ấy.` : 'Chưa đoán được giọng — tạm lấy gốc hợp âm đầu làm chủ âm.')
  }
  const tong = dem.chinh + dem.phu + dem.khong
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-20 text-dim">Vòng</span>
          {VONG_KHUNG.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() =>
                doi(() => {
                  setVongId(x.id)
                  setChon(0)
                })
              }
              className={nut(vongId === x.id)}
            >
              {x.ten}
            </button>
          ))}
        </div>
        <form
          className="flex flex-wrap items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            doi(dungVong)
          }}
        >
          <span className="w-20 text-dim">Tự điền</span>
          <input
            value={go}
            onChange={(e) => setGo(e.target.value)}
            placeholder="vd Dbmaj9 Ab13sus4 Fm7 Bbm9"
            aria-label="Nhập vòng hợp âm"
            className="min-w-0 flex-1 rounded border border-line bg-white/6 px-2 py-1 font-mono text-cream"
          />
          <button type="submit" className={nut(vongId === 'tu-nhap')}>
            Dùng vòng này
          </button>
          {bao && <span className="w-full text-dim">{bao}</span>}
        </form>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-20 text-dim">♩ =</span>
          {NHIP_DO.map((x) => (
            <button key={x} type="button" onClick={() => doi(() => setBpm(x))} className={nut(bpm === x)}>
              {x}
            </button>
          ))}
          <span className="ml-2 text-dim">phách mỗi hợp âm</span>
          {[2, 4].map((x) => (
            <button key={x} type="button" onClick={() => doi(() => setNhip(x))} className={nut(nhip === x)}>
              {x}
            </button>
          ))}
          <span className="ml-2 text-dim">Nền</span>
          <button type="button" onClick={() => doi(() => setDay(false))} className={nut(!day)}>
            Chỉ bass — bạn chồng tay phải
          </button>
          <button type="button" onClick={() => doi(() => setDay(true))} className={nut(day)}>
            Bass + hợp âm — bạn chỉ đánh giai điệu
          </button>
        </div>
      </div>

      <div className={THE}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {chay ? (
            <button type="button" onClick={dung} className={nut(true)}>
              ■ Dừng nền
            </button>
          ) : (
            <button type="button" onClick={() => void batDau()} disabled={!ks.length} className={nut(false)}>
              ▶ Chạy nền
            </button>
          )}
          <span className="text-xs text-dim">{v.ten}</span>
        </div>
        <div className="mb-2 flex flex-wrap gap-1">
          {ks.map((x, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !chay && setChon(i)}
              aria-current={i === dang}
              className={`rounded border px-2 py-1 font-mono text-sm ${i === dang ? 'border-amber-key bg-amber-key/20 text-amber-key' : 'border-line text-cream/80'}`}
            >
              {x.ten}
            </button>
          ))}
        </div>
        {v.ghiChu && <p className="mb-2 text-xs text-dim">{v.ghiChu}</p>}
        {k && (
          <>
            <h4 className="font-semibold text-cream">
              <span className="font-mono text-3xl text-amber-key">{k.ten}</span> <span className="text-sm">khung {k.gam}</span>
              {sau && ks.length > 1 && <span className="ml-3 text-sm text-dim">→ sau: {sau.ten}</span>}
            </h4>
            {k.loai && <p className="mb-1 text-xs text-cream/80">{k.loai.nghe}</p>}
            <BanPhimKhung k={k} giu={giu} sao={goiY.map((g) => g.m)} />
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
              {goiY.map((g) => {
                const chongTay = chongDuoi(k, g.m)
                return (
                  <div key={g.m} className="rounded border border-line/70 p-2">
                    <p>
                      <b className="font-mono text-base text-yellow-300">★ {g.ten}</b> <span className="text-cream/80">({g.bac})</span>
                    </p>
                    {g.ly.length > 0 && <p className="text-cream/75">{g.ly.join(' · ')}</p>}
                    <p className="text-cream/85">
                      Chồng tay phải: <span className="font-mono">{chongTay.map((m) => tenPhim(k, m)).join(' – ')}</span>{' '}
                      <button type="button" className="ml-1 text-amber-key underline" onClick={() => void ngheHop([36 + (k.bass ?? k.goc), ...chongTay])}>
                        ▶
                      </button>
                    </p>
                  </div>
                )
              })}
            </div>
            {chung.length > 0 && (
              <p className="mt-2 text-xs text-cream/85">
                Nốt chung với {sau!.ten}: <b className="font-mono">{chung.map((n) => n.ten).join(' · ')}</b> — giữ nguyên trên tay phải khi đổi hợp âm,
                chỉ đổi bass (anh SSA giữ ≥ 2 nốt tay phải ở 32/94 chỗ đổi bass).
              </p>
            )}
            <div className="mt-2">
              <DongKhung k={k} />
            </div>
          </>
        )}
      </div>

      <div className={THE}>
        <h4 className="mb-1 font-semibold text-cream">Bạn đang đánh</h4>
        <TenDangBam giu={giu} />
        {k && (
          <div className="mt-1">
            <VaiDangBam k={k} giu={giu} />
          </div>
        )}
        <p className="mt-2 text-xs text-cream/85">
          {tong
            ? `Từ lúc chạy nền: ${tong} nốt — chính ${dem.chinh} · phụ ${dem.phu} · không màu ${dem.khong}. Câu hay thường có phần lớn nốt chính và nốt phụ; nốt không màu chỉ lướt.`
            : 'Chưa bấm nốt nào — chạy nền rồi đánh tay phải: chọn một nốt ★, chồng 2–3 nốt khung dưới nó, đi liền bậc sang nốt ★ của hợp âm sau.'}
        </p>
      </div>
    </div>
  )
}

export function GameChayNgon() {
  const [kieu, setKieu] = useState<'lam-quen' | 'solo'>('lam-quen')
  useLiveSound()
  useComputerKeyboard(60)
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className={THE}>
        <h3 className="mb-1 font-semibold text-cream">Game chạy ngón — tự chọn nốt theo khung</h3>
        <p className="text-xs text-cream/85">
          Mỗi loại hợp âm có một <b>khung nốt</b> — gam trên hợp âm ấy. <b className="text-teal-key">Xanh</b> là nốt chính (nốt của hợp âm: đặt
          ở phách mạnh, nốt ngân, nốt đỉnh), <b className="text-amber-key">cam</b> là nốt phụ (đi qua), không màu thì đừng ngân. Nhận ra khung là
          tự chọn được nốt — không cần nốt rơi sẵn.
        </p>
        <details className="mt-2 text-xs text-cream/85">
          <summary className="cursor-pointer font-semibold text-amber-key">Bí quyết rải ngón của anh SSA — vừa giai điệu vừa hợp âm màu</summary>
          <ul className="mt-1 ml-4 list-disc">
            <li>
              Tay trái chỉ giữ <b>bass</b> (thường một nốt, đôi khi rải 1 – 5 – 8). Màu của hợp âm do <b>bass</b> quyết định.
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
          </ul>
          <p className="mt-1 text-dim">
            Cơ sở (3 clip, 111 đoạn hợp âm, nốt chép máy, 98,7 % nằm trong nhãn hợp âm của clip): tay trái trung vị 1 nốt mỗi hợp âm; nốt giai
            điệu là nốt hợp âm 175/241, nốt căng có trong tên 63/241; đổi bass giữ ≥ 2 nốt tay phải 32/94. Lời giải thích là của Claude.
          </p>
        </details>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button type="button" onClick={() => setKieu('lam-quen')} className={nut(kieu === 'lam-quen')}>
          1 · Làm quen loại hợp âm
        </button>
        <button type="button" onClick={() => setKieu('solo')} className={nut(kieu === 'solo')}>
          2 · Solo trên vòng kiểu SSA
        </button>
        <MidiConnect />
      </div>
      {kieu === 'lam-quen' ? <LamQuen /> : <SoloVong />}
    </div>
  )
}
