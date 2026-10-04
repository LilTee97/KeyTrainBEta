import { useEffect, useMemo, useRef, useState } from 'react'
import { PracticeStage } from '../reharm/playback/PracticeStage'
import { startAudio, startTimelineLoop, stopTimelineLoop } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { LuotTap } from '../shared/persistence/db'
import type { VongBaiTap } from './baiTap'
import { dungVong } from './dungVong'
import {
  BAC_SOLO,
  bacMoSolo,
  buocSolo,
  DAT_SOLO,
  khoaSoanCau,
  oDem,
  tenBac,
  tenNotBac,
  vongCuaThay,
  xepNot,
  type BacSolo,
  type BuocSolo,
  type DuLieuSoanCau,
} from './soanCau/soanCau'
import type { Teacher, TeacherId } from './teachers'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const chonClass = 'rounded border border-line bg-white/6 px-1.5 py-1 text-cream'

/**
 * Backing = điệu đã duyệt của chính thầy, nguyên cả hai tay (kế hoạch GĐ 3, phần 4); `dungVong` chỉ tắt câu fill. Slow Rock Lá thư
 * hai tay rải cả tay phải trong thân bài — đo 4/10/2026 trên Dm F Bdim E7: tay phải Rê3–Fa4 (24/48 tiếng), tay trái Rê2–Si3 — nên
 * câu solo đi phía trên. Không bỏ tay phải: bỏ là đổi tiếng so với bản đã duyệt.
 */
const BACKING: Partial<Record<TeacherId, string>> = { 'linh-nhi': 'slow-rock-la-thu-hai-tay' }

/** Tập solo trên backing — chờ đúng nốt, bậc 1–3 (làm thử với Linh Nhi; theo nhịp và bậc 4–7 là bước sau). */
export function TapSolo({
  teacher,
  du,
  tonic,
  thu,
  luot,
  onGhi,
}: {
  teacher: Teacher
  du: DuLieuSoanCau
  tonic: number
  thu: boolean
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  // Phím bấm phải ra tiếng (người dùng 4/10/2026: "click vào phím đàn mà ko nghe tiếng khi bật tab tập solo") — quên gắn ở bản đầu.
  useLiveSound()
  useComputerKeyboard(60)
  const ds = vongCuaThay(du, tonic, thu)
  const [vongId, setVongId] = useState<string | null>(null)
  const v = ds.find((x) => x.id === vongId) ?? ds[0]
  const khoa = v ? khoaSoanCau(teacher.id, v.id) : ''
  const { qua, mo } = bacMoSolo(luot, khoa)
  /* Bậc đang tập giữ nguyên sau lượt đạt — kết quả còn trên màn; người tập tự bấm sang bậc vừa mở. */
  const [chonBac, setChonBac] = useState<BacSolo>(mo)
  const bac = chonBac <= mo ? chonBac : mo
  const styleId = BACKING[teacher.id]
  if (!v || !styleId) return <p className="text-sm text-dim">Chưa có vòng ở giọng này.</p>
  const thongTin = BAC_SOLO.find((one) => one.so === bac)!

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-line bg-black/25 p-4 text-sm">
        <p className="mb-2 text-xs text-dim">
          Backing: điệu Slow Rock Lá thư hai tay đã duyệt (tắt câu fill) — đệm rải ở quãng tám thấp, câu solo của bạn đi phía trên. Mỗi
          hợp âm, ô đệm lặp lại tới khi bạn đánh đủ số nốt khác nhau thuộc tập được nhận; mỗi lần bấm app báo nốt ấy chị dùng bao nhiêu
          phần trăm. Không có nốt sai — nốt ngoài tập chỉ là "khác chị", và tính vào tỉ lệ.
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-dim">
          Vòng:
          <select
            value={v.id}
            onChange={(event) => {
              stopTimelineLoop()
              setVongId(event.target.value)
              setChonBac(bacMoSolo(luot, khoaSoanCau(teacher.id, event.target.value)).mo)
            }}
            className={chonClass}
          >
            {ds.map((x) => (
              <option key={x.id} value={x.id}>
                {x.ten} — {x.hopAm.join(' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-dim">Bậc:</span>
          {BAC_SOLO.map((one) => (
            <button
              key={one.so}
              type="button"
              disabled={one.so > mo}
              onClick={() => {
                stopTimelineLoop()
                setChonBac(one.so)
              }}
              className={nut(bac === one.so)}
              title={one.so > mo ? 'Qua bậc trước để mở' : undefined}
            >
              {one.so}. {one.ten}
              {qua.has(one.so) ? ' ✓' : one.so > mo ? ' 🔒' : ''}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-cream/85">
          {thongTin.viSao} Qua bậc khi ≥ {Math.round(DAT_SOLO * 100)} % lần bấm thuộc tập được nhận (mốc Claude chọn, chưa đo).
        </p>
      </div>

      <LuotSolo
        key={`${v.id}:${tonic}:${thu}:${bac}`}
        buoc={buocSolo(du, v.vong, tonic, bac)}
        vong={v.hopAm}
        yeuCau={{ styleId, o: v.hopAm.map((h) => [h]), giong: `${tonic}:${thu ? 'minor' : 'major'}` }}
        tenNot={(goc, rel, chat) => tenNotBac(goc, rel, chat, tonic, thu)}
        onXong={(bam, nhan) => {
          const dat = bam > 0 && nhan / bam >= DAT_SOLO - 1e-9
          onGhi({ timestamp: Date.now(), styleId: khoa, bac, dat, soDo: { bam, nhan } })
          return dat
        }}
      />
    </div>
  )
}

/** Lặp ô đệm của hợp âm thứ `k` cho tới khi sang hợp âm sau. */
function phatO(vongDem: VongBaiTap, k: number) {
  stopTimelineLoop()
  const o = oDem(vongDem, k)
  startTimelineLoop(o.su, vongDem.bpm, o.dai)
}

interface PhanHoi {
  ten: string
  loi: string
  muc: 'nhan' | 'hay' | 'co' | 'chua'
}

function LuotSolo({
  buoc,
  vong,
  yeuCau,
  tenNot,
  onXong,
}: {
  buoc: BuocSolo[]
  vong: readonly string[]
  yeuCau: Parameters<typeof dungVong>[0]
  tenNot: (goc: number, rel: number, chat: string) => string
  onXong: (bam: number, nhan: number) => boolean
}) {
  const [backing, setBacking] = useState<VongBaiTap | null>(null)
  const [trangThai, setTrangThai] = useState<'cho' | 'dung' | 'dang' | 'xong'>('cho')
  const [loi, setLoi] = useState('')
  const [i, setI] = useState(0)
  const [thay, setThay] = useState<number[]>([])
  const [dem, setDem] = useState({ bam: 0, nhan: 0 })
  const [phanHoi, setPhanHoi] = useState<PhanHoi | null>(null)
  const [dat, setDat] = useState<boolean | null>(null)
  const ref = useRef({ i: 0, thay: [] as number[], bam: 0, nhan: 0, dang: false })
  useEffect(() => () => stopTimelineLoop(), [])

  const batDau = async () => {
    setLoi('')
    await startAudio()
    let vongDem = backing
    if (!vongDem) {
      setTrangThai('dung')
      try {
        vongDem = await dungVong(yeuCau)
        setBacking(vongDem)
      } catch (error) {
        setLoi(error instanceof Error ? error.message : String(error))
        setTrangThai('cho')
        return
      }
    }
    ref.current = { i: 0, thay: [], bam: 0, nhan: 0, dang: true }
    setI(0)
    setThay([])
    setDem({ bam: 0, nhan: 0 })
    setPhanHoi(null)
    setDat(null)
    setTrangThai('dang')
    phatO(vongDem, 0)
  }

  useEffect(() => {
    if (trangThai !== 'dang' || !backing) return
    return useMidiStore.subscribe((state, previous) => {
      const event = state.lastEvent
      if (!event || event === previous.lastEvent || event.velocity === 0 || !ref.current.dang) return
      const r = ref.current
      const step = buoc[r.i]!
      const pc = event.note % 12
      const rel = (pc - step.goc + 12) % 12
      const m = xepNot(step.pb).find((x) => x.rel === rel)!
      const nhan = step.nhan.includes(pc)
      r.bam += 1
      if (nhan) {
        r.nhan += 1
        if (!r.thay.includes(pc)) r.thay = [...r.thay, pc]
      }
      setDem({ bam: r.bam, nhan: r.nhan })
      setPhanHoi({
        ten: `${tenNot(step.goc, rel, step.chat)} — ${tenBac(rel, step.chat)}`,
        loi:
          m.dem === 0
            ? `chưa gặp trong sheet (0/${step.pb.n})`
            : `chị dùng ${Math.round(m.phanTram * 100)} % (${m.muc === 'hay' ? 'hay dùng' : 'có dùng'})${nhan ? '' : ' — ngoài tập bậc này nhận'}`,
        muc: nhan ? 'nhan' : m.muc,
      })
      if (r.thay.length < step.can) {
        setThay(r.thay)
        return
      }
      if (r.i + 1 < buoc.length) {
        r.i += 1
        r.thay = []
        setI(r.i)
        setThay([])
        phatO(backing, r.i)
        return
      }
      r.dang = false
      stopTimelineLoop()
      setThay(r.thay)
      setDat(onXong(r.bam, r.nhan))
      setTrangThai('xong')
    })
  }, [trangThai, backing, buoc, tenNot, onXong])

  const step = buoc[i] ?? buoc[0]!
  const sang = useMemo(
    () => (trangThai === 'dang' && step.goiY ? step.nhan.flatMap((pc) => [60 + pc, 72 + pc]) : []),
    [trangThai, step],
  )
  const mauPhanHoi =
    phanHoi?.muc === 'nhan' ? 'text-teal-key' : phanHoi?.muc === 'hay' || phanHoi?.muc === 'co' ? 'text-amber-key' : 'text-rose-300'

  const thanh = (
    <>
      <span className="font-mono text-lg font-bold text-amber-key">{trangThai === 'dang' ? step.hopAm : '—'}</span>
      {trangThai === 'dang' && (
        <span className="text-dim">
          đã đánh {thay.length}/{step.can} nốt khác nhau
        </span>
      )}
      {phanHoi && <span className={mauPhanHoi}>{phanHoi.ten}: {phanHoi.loi}</span>}
    </>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {vong.map((h, k) => (
          <span
            key={k}
            className={`rounded-lg border px-3 py-1.5 font-mono ${
              trangThai === 'dang' && k === i ? 'border-amber-key text-amber-key' : k < buoc.length ? 'border-line text-cream' : 'border-line/40 text-dim'
            }`}
          >
            {h}
          </span>
        ))}
        <button
          type="button"
          disabled={trangThai === 'dung'}
          onClick={() => void batDau()}
          className="ml-2 rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {trangThai === 'dung' ? 'Đang dựng backing…' : trangThai === 'dang' ? 'Làm lại' : 'Bắt đầu'}
        </button>
        {trangThai === 'dang' && (
          <button
            type="button"
            onClick={() => {
              ref.current.dang = false
              stopTimelineLoop()
              setTrangThai('cho')
            }}
            className={nut(false)}
          >
            Dừng
          </button>
        )}
        {loi && <span className="text-xs text-rose-300">{loi}</span>}
      </div>

      {trangThai === 'xong' && (
        <p className="rounded-lg border border-line bg-black/30 p-3 text-sm">
          Lần bấm thuộc tập được nhận: <b>{dem.nhan}</b>/{dem.bam} ({dem.bam ? Math.round((dem.nhan / dem.bam) * 100) : 0} %) →{' '}
          <b className={dat ? 'text-teal-key' : 'text-rose-300'}>{dat ? 'Đạt' : 'Chưa đạt'}</b>
        </p>
      )}

      <MidiConnect />
      <PracticeStage bar={thanh}>
        {(full) => (
          <>
            <div className="mb-1 flex flex-wrap items-center gap-3 text-xs">{thanh}</div>
            <div className={full ? 'h-[38vh] max-h-80 min-h-28 shrink-0' : ''}>
              <OnScreenPiano
                lowNote={48}
                highNote={84}
                highlightNotes={sang}
                chordTones={trangThai === 'dang' ? step.nhan : []}
                height={full ? '100%' : undefined}
              />
            </div>
          </>
        )}
      </PracticeStage>
    </div>
  )
}
