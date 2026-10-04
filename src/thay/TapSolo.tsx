import { useEffect, useMemo, useRef, useState } from 'react'
import { PracticeStage } from '../reharm/playback/PracticeStage'
import { getStyle } from '../reharm/style/styleLibrary'
import {
  beatAtPerformanceTime,
  startAudio,
  startTimelineLoop,
  stopTimelineLoop,
  usePlaybackStore,
} from '../shared/audio/audioEngine'
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
  hopAmTaiPhach,
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

/**
 * Tập solo trên backing. MẶC ĐỊNH solo tự do (người dùng 4/10/2026, ý 2: "đánh tự do trước, khi nào tôi tick vào ô Vào Tập Luyện thì
 * mới mở chế độ chấm đạt và level"); tick "Vào tập luyện" thì chờ đúng nốt, bậc 1–3 (theo nhịp và bậc 4–7 là bước sau).
 */
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
  const [tapLuyen, setTapLuyen] = useState(false)
  const styleId = BACKING[teacher.id]
  if (!v || !styleId) return <p className="text-sm text-dim">Chưa có vòng ở giọng này.</p>
  const thongTin = BAC_SOLO.find((one) => one.so === bac)!

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-line bg-black/25 p-4 text-sm">
        <p className="mb-2 text-xs text-dim">
          Backing: điệu Slow Rock Lá thư hai tay đã duyệt (tắt câu fill) — đệm rải ở quãng tám thấp, câu solo của bạn đi phía trên.{' '}
          {tapLuyen
            ? 'Mỗi hợp âm, ô đệm lặp lại tới khi bạn đánh đủ số nốt khác nhau thuộc tập được nhận; mỗi lần bấm app báo nốt ấy chị dùng bao nhiêu phần trăm. Không có nốt sai — nốt ngoài tập chỉ là "khác chị", và tính vào tỉ lệ.'
            : 'Solo tự do: backing chạy liên tục cả vòng, bạn đánh tuỳ ý; mỗi lần bấm app báo nốt ấy so với hợp âm đang vang — chị dùng bao nhiêu phần trăm. Không chấm đạt, không lưu tiến độ.'}
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
        <label className="mb-2 flex w-fit cursor-pointer items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            checked={tapLuyen}
            onChange={(event) => {
              stopTimelineLoop()
              setTapLuyen(event.target.checked)
            }}
          />
          Vào tập luyện — chờ đúng nốt theo bậc, chấm đạt, lưu tiến độ
        </label>
        <div className={`flex flex-wrap items-center gap-2 text-xs ${tapLuyen ? '' : 'hidden'}`}>
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
        {tapLuyen && (
          <p className="mt-2 text-xs text-cream/85">
            {thongTin.viSao} Qua bậc khi ≥ {Math.round(DAT_SOLO * 100)} % lần bấm thuộc tập được nhận (mốc Claude chọn, chưa đo).
          </p>
        )}
      </div>

      {!tapLuyen && (
        <SoloTuDo
          key={`${v.id}:${tonic}:${thu}`}
          buoc={buocSolo(du, v.vong, tonic, 3)}
          vong={v.hopAm}
          yeuCau={{ styleId, o: v.hopAm.map((h) => [h]), giong: `${tonic}:${thu ? 'minor' : 'major'}` }}
          tenNot={(goc, rel, chat) => tenNotBac(goc, rel, chat, tonic, thu)}
        />
      )}

      {tapLuyen && (
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
      )}
    </div>
  )
}

/**
 * Solo TỰ DO trên backing: lặp cả vòng ở BPM tuỳ chọn; mỗi lần bấm, so nốt với hợp âm ĐANG VANG lúc bấm (`hopAmTaiPhach` theo đồng
 * hồ phát) — chị dùng bao nhiêu phần trăm. Gợi ý: sáng nhóm chị hay dùng trên hợp âm đang vang. Không chấm đạt, không lưu.
 */
function SoloTuDo({
  buoc,
  vong,
  yeuCau,
  tenNot,
}: {
  buoc: BuocSolo[]
  vong: readonly string[]
  yeuCau: Parameters<typeof dungVong>[0]
  tenNot: (goc: number, rel: number, chat: string) => string
}) {
  const nhipDieu = getStyle(yeuCau.styleId)?.bpm ?? 80
  const [backing, setBacking] = useState<VongBaiTap | null>(null)
  const [dang, setDang] = useState<'cho' | 'dung' | 'dang'>('cho')
  const [loi, setLoi] = useState('')
  const [bpm, setBpm] = useState(() => Math.round(nhipDieu * 0.6))
  const [goiY, setGoiY] = useState(true)
  const [phanHoi, setPhanHoi] = useState<PhanHoi | null>(null)
  const viTri = usePlaybackStore((state) => state.positionBeats)
  useEffect(() => () => stopTimelineLoop(), [])

  const phat = (vongDem: VongBaiTap, nhip: number) =>
    startTimelineLoop(
      vongDem.timeline.map((e) => ({ notes: e.notes, startBeat: e.startBeat, durationBeats: e.durationBeats, velocity: e.velocity })),
      nhip,
      vongDem.doDai,
    )

  const batDau = async () => {
    setLoi('')
    await startAudio()
    let vongDem = backing
    if (!vongDem) {
      setDang('dung')
      try {
        vongDem = await dungVong(yeuCau)
        setBacking(vongDem)
      } catch (error) {
        setLoi(error instanceof Error ? error.message : String(error))
        setDang('cho')
        return
      }
    }
    setPhanHoi(null)
    phat(vongDem, bpm)
    setDang('dang')
  }
  const doiNhip = (nhip: number) => {
    setBpm(nhip)
    if (dang === 'dang' && backing) phat(backing, nhip)
  }

  useEffect(() => {
    if (dang !== 'dang' || !backing) return
    return useMidiStore.subscribe((state, previous) => {
      const event = state.lastEvent
      if (!event || event === previous.lastEvent || event.velocity === 0) return
      const step = buoc[hopAmTaiPhach(backing.phach, backing.doDai, beatAtPerformanceTime(event.time))] ?? buoc[0]!
      const pc = event.note % 12
      const rel = (pc - step.goc + 12) % 12
      const m = xepNot(step.pb).find((x) => x.rel === rel)!
      setPhanHoi({
        ten: `${step.hopAm} · ${tenNot(step.goc, rel, step.chat)} — ${tenBac(rel, step.chat)}`,
        loi:
          m.dem === 0
            ? `chưa gặp trong sheet (0/${step.pb.n})`
            : `chị dùng ${Math.round(m.phanTram * 100)} % (${m.muc === 'hay' ? 'hay dùng' : 'có dùng'})`,
        muc: m.dem === 0 ? 'chua' : m.muc === 'hay' ? 'nhan' : 'co',
      })
    })
  }, [dang, backing, buoc, tenNot])

  const k = dang === 'dang' && backing ? hopAmTaiPhach(backing.phach, backing.doDai, viTri) : 0
  const step = buoc[k] ?? buoc[0]!
  const sang = dang === 'dang' && goiY ? step.nhan.flatMap((pc) => [60 + pc, 72 + pc]) : []
  const mauPhanHoi = phanHoi?.muc === 'nhan' ? 'text-teal-key' : phanHoi?.muc === 'chua' ? 'text-rose-300' : 'text-amber-key'
  const thanh = (
    <>
      <span className="font-mono text-lg font-bold text-amber-key">{dang === 'dang' ? step.hopAm : '—'}</span>
      {phanHoi && (
        <span className={mauPhanHoi}>
          {phanHoi.ten}: {phanHoi.loi}
        </span>
      )}
    </>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {vong.map((h, i) => (
          <span
            key={i}
            className={`rounded-lg border px-3 py-1.5 font-mono ${
              dang === 'dang' && i === k ? 'border-amber-key text-amber-key' : 'border-line text-cream'
            }`}
          >
            {h}
          </span>
        ))}
        <button
          type="button"
          disabled={dang === 'dung'}
          onClick={() => void batDau()}
          className="ml-2 rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {dang === 'dung' ? 'Đang dựng backing…' : dang === 'dang' ? 'Phát lại từ đầu' : 'Bắt đầu'}
        </button>
        {dang === 'dang' && (
          <button
            type="button"
            onClick={() => {
              stopTimelineLoop()
              setDang('cho')
            }}
            className={nut(false)}
          >
            Dừng
          </button>
        )}
        {loi && <span className="text-xs text-rose-300">{loi}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-dim">
        <label className="flex items-center gap-2">
          Nhịp độ
          <input
            type="range"
            min={30}
            max={Math.max(60, Math.round(nhipDieu * 1.5))}
            value={bpm}
            onChange={(event) => doiNhip(Number(event.target.value))}
            className="accent-amber-key"
          />
          <b className="w-16 font-mono text-cream">{bpm} BPM</b>
        </label>
        {[60, 80, 100].map((phan) => (
          <button
            key={phan}
            type="button"
            onClick={() => doiNhip(Math.round((nhipDieu * phan) / 100))}
            className={nut(bpm === Math.round((nhipDieu * phan) / 100))}
          >
            {phan} %
          </button>
        ))}
        <label className="flex cursor-pointer items-center gap-2 text-cream">
          <input type="checkbox" checked={goiY} onChange={(event) => setGoiY(event.target.checked)} />
          Gợi ý: sáng các nốt chị hay dùng trên hợp âm đang vang
        </label>
      </div>

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
                chordTones={dang === 'dang' && goiY ? step.nhan : []}
                height={full ? '100%' : undefined}
              />
            </div>
          </>
        )}
      </PracticeStage>
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
