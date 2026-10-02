import { useEffect, useMemo, useState } from 'react'
import { stopTimelineLoop, usePlaybackStore } from '../shared/audio/audioEngine'
import { useMetronomeStore } from '../shared/audio/metronome'
import { NoteGatedPractice } from '../reharm/playback/NoteGatedPractice'
import { TimedPractice } from '../reharm/playback/TimedPractice'
import { taiBaiTap, type BaiTap, type VongBaiTap } from './baiTap'
import { dungVong } from './dungVong'
import type { Teacher } from './teachers'
import { GOC, LOAI, soanVong, vongMau } from './vongThay'

/** Theo nhịp chấm trên hai lượt vòng — đoán, chưa đo: một lượt 4 ô (~13 giây ở ♩72) ít tiếng quá để chấm. */
const LUOT_THEO_NHIP = 2

/** Thứ đang tập ở khung dưới: vòng tập / vòng kiểm của một bài, hoặc vòng tự tạo. */
interface Muc {
  ten: string
  vong: VongBaiTap
}

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`

const chonClass = 'rounded border border-line bg-white/6 px-1.5 py-1 text-cream'

const laThu = (one: BaiTap) => one.giong.includes('thứ')

/**
 * Trang một thầy — tab Điệu · Kỹ thuật đánh · Học cách soạn câu (`Reference/KE-HOACH-LUYEN-TAP.md` mục 4c).
 *
 * Tab chưa có nội dung thì ẩn (người dùng 2/10/2026, câu E) — hiện chỉ tab Điệu. Chọn một vòng (vòng tập, vòng kiểm của
 * bài, hoặc vòng tự tạo) rồi tập ở khung dưới bằng Chờ đúng nốt hay Theo nhịp — cùng hai khung của tab Luyện đệm, chạy
 * vòng riêng (`vongBpm`) chứ không qua bài đang mở ở tab Tái hòa âm.
 */
export function TeacherPage({ teacher }: { teacher: Teacher }) {
  const [bai, setBai] = useState<BaiTap[] | null>(null)
  useEffect(() => {
    let alive = true
    void Promise.all(teacher.styleIds.map(taiBaiTap)).then((list) => {
      if (alive) setBai(list.filter((one): one is BaiTap => one !== null))
    })
    return () => {
      alive = false
    }
  }, [teacher])

  const [chon, setChon] = useState<Muc | null>(null)
  const [cheDo, setCheDo] = useState<'gated' | 'timed'>('gated')
  // Rời trang đang phát thì tắt tiếng.
  useEffect(() => () => stopTimelineLoop(), [])

  const muc = chon ?? (bai?.[0] ? { ten: `${bai[0].ten} · vòng tập`, vong: bai[0].tap } : null)
  const vong = muc?.vong ?? null
  /* Lưới hợp âm của MỘT vòng — lưới tab Tái hòa âm dựng còn kèm ô nối vòng. */
  const motVong = useMemo(() => vong?.perBeat.slice(0, vong.doDai) ?? [], [vong])
  const nhieuLuot = useMemo(
    () =>
      vong
        ? Array.from({ length: LUOT_THEO_NHIP }, (_, luot) =>
            vong.timeline.map((event) => ({ ...event, startBeat: event.startBeat + luot * vong.doDai })),
          ).flat()
        : [],
    [vong],
  )

  const tap = (next: Muc) => {
    stopTimelineLoop()
    setChon(next)
  }

  if (bai === null) return <p className="text-sm text-dim">Đang tải bài tập…</p>

  if (bai.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{teacher.label}</h2>
        <p className="text-sm text-dim">Chưa có bài tập nào cho thầy này.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold">{teacher.label}</h2>
        {/* Chỉ tab có nội dung — Kỹ thuật đánh, Học cách soạn câu hiện ra khi có bài (câu E). */}
        <span className="rounded-lg border border-amber-key bg-amber-key/15 px-3 py-1 text-xs font-semibold text-amber-key">
          Điệu
        </span>
      </div>

      <p className="text-xs text-dim">
        Chọn vòng rồi tập ở khung dưới: vòng tập 4 ô (bậc 1–6), vòng kiểm chưa gặp (bậc 7), hoặc vòng tự tạo. Khung đệm
        không có câu chèn; Slow Blues giữ tay phải của Bộ Soạn Blues.
      </p>

      <ul className="flex flex-col gap-2">
        {bai.map((one) => (
          <li key={one.styleId} className="rounded-xl border border-line bg-black/25 p-3">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-semibold text-cream">{one.ten}</span>
              <span className="text-xs text-dim">
                {one.giong} · ♩ {one.bpm}
              </span>
            </div>
            <p className="mb-2 font-mono text-xs text-cream/80">
              Vòng tập: {one.tap.hopAm.join(' · ')}
              <span className="text-dim"> — vòng kiểm {one.kiem.hopAm.length} hợp âm</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(['tap', 'kiem'] as const).map((loai) => (
                <button
                  key={loai}
                  type="button"
                  onClick={() => tap({ ten: `${one.ten} · vòng ${loai === 'tap' ? 'tập' : 'kiểm'}`, vong: one[loai] })}
                  className={nut(vong === one[loai])}
                >
                  Tập vòng {loai === 'tap' ? 'tập' : 'kiểm'}
                </button>
              ))}
              <span className="text-[11px] text-dim/80">nguồn: {one.nguon.tap}</span>
            </div>
          </li>
        ))}
      </ul>

      <VongTuTao teacher={teacher} bai={bai} onXong={tap} />

      {muc && vong && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xs text-dim">Đang tập:</span>
            <span className="font-semibold text-amber-key">{muc.ten}</span>
            <span className="font-mono text-xs text-cream/80">{vong.hopAm.join(' · ')}</span>
            <span className="text-xs text-dim">♩ {vong.bpm}</span>
          </div>
          <div className="flex gap-1">
            {(
              [
                ['gated', 'Chờ đúng nốt'],
                ['timed', 'Theo nhịp'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  stopTimelineLoop()
                  setCheDo(value)
                }}
                className={nut(cheDo === value)}
              >
                {label}
              </button>
            ))}
          </div>
          {cheDo === 'gated' ? (
            <NoteGatedPractice
              key={muc.ten}
              timeline={vong.timeline}
              voicings={vong.voicings}
              beatsPerChord={vong.beatsPerChord}
              perBeat={motVong}
              vongBpm={vong.bpm}
            />
          ) : (
            <TimedPractice
              key={muc.ten}
              title={muc.ten}
              timeline={nhieuLuot}
              voicings={vong.voicings}
              beatsPerChord={vong.beatsPerChord}
              perBeat={motVong}
              meter={vong.meter}
              vongBpm={vong.bpm}
            />
          )}
        </div>
      )}
    </section>
  )
}

/**
 * Vòng tự tạo để tập đệm (người dùng 2/10/2026), hai cách:
 * - Tự soạn từ hợp âm chủ: một vòng 4 ô trong kho của chính thầy (`vongThay.ts` — câu "đã ổn"; Tuấn mượn Linh Nhi, Blues
 *   lấy khung Bộ Soạn Blues), dịch sang giọng chọn. Soạn lại thì ra vòng kế của kho.
 * - Chọn từng hợp âm: nốt gốc + loại, mỗi hợp âm một ô; giọng để app tự dò như khi dán bài ở tab Tái hòa âm.
 * Dựng bằng `dungVong`: chính tab Tái hòa âm dựng khung đệm của điệu chọn, như 11 bài đóng băng.
 */
function VongTuTao({
  teacher,
  bai,
  onXong,
}: {
  teacher: Teacher
  bai: readonly BaiTap[]
  onXong: (muc: Muc) => void
}) {
  const looping = usePlaybackStore((state) => state.looping)
  const clicking = useMetronomeStore((state) => state.running)
  const [styleId, setStyleId] = useState(bai[0]!.styleId)
  const [cach, setCach] = useState<'chu' | 'tung'>('chu')
  const [chu, setChu] = useState(() => (laThu(bai[0]!) ? 9 : 0))
  const [thu, setThu] = useState(() => laThu(bai[0]!))
  const [lan, setLan] = useState(0)
  const [goc, setGoc] = useState<string>('C')
  const [loai, setLoai] = useState<string>('')
  const [chon, setChon] = useState<string[]>([])
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')

  const dieu = bai.find((one) => one.styleId === styleId) ?? bai[0]!
  const soan = soanVong(teacher.id, chu, thu, lan)
  const soVong = vongMau(teacher.id, thu).length
  const hopAm = cach === 'chu' ? (soan?.hopAm ?? []) : chon
  // Dựng là mở bài khác ở tab Tái hòa âm (đổi BPM chung) — đang phát hay đang đo thì nhịp sẽ nhảy giữa chừng.
  const ban = looping || clicking

  const dung = async () => {
    setDang(true)
    setLoi('')
    try {
      const vong = await dungVong({
        styleId: dieu.styleId,
        o: hopAm.map((symbol) => [symbol]),
        giong: cach === 'chu' ? `${chu}:${thu ? 'minor' : 'major'}` : '',
      })
      onXong({ ten: `Vòng tự tạo · ${dieu.ten} · ${hopAm.join(' ')}`, vong })
    } catch (error) {
      setLoi(error instanceof Error ? error.message : String(error))
    } finally {
      setDang(false)
    }
  }

  return (
    <div className="rounded-xl border border-line bg-black/25 p-3">
      <h3 className="mb-2 font-semibold text-cream">Vòng tự tạo</h3>

      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 text-dim">
          Điệu
          <select
            value={dieu.styleId}
            onChange={(event) => {
              const next = bai.find((one) => one.styleId === event.target.value)
              if (!next) return
              setStyleId(next.styleId)
              setThu(laThu(next))
            }}
            className={chonClass}
          >
            {bai.map((one) => (
              <option key={one.styleId} value={one.styleId}>
                {one.ten}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setCach('chu')} className={nut(cach === 'chu')}>
          Tự soạn từ hợp âm chủ
        </button>
        <button type="button" onClick={() => setCach('tung')} className={nut(cach === 'tung')}>
          Chọn từng hợp âm
        </button>
      </div>

      {cach === 'chu' ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-dim">
            Hợp âm chủ
            <select value={chu} onChange={(event) => setChu(Number(event.target.value))} className={chonClass}>
              {GOC.map((name, tonic) => (
                <option key={name} value={tonic}>
                  {name}
                  {thu ? 'm' : ''}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setThu(false)} className={nut(!thu)}>
            Trưởng
          </button>
          <button type="button" onClick={() => setThu(true)} className={nut(thu)}>
            Thứ
          </button>
          <button type="button" disabled={soVong < 2} onClick={() => setLan((n) => n + 1)} className={nut(false)}>
            ↻ Soạn vòng khác
          </button>
          {soan && (
            <span className="text-[11px] text-dim/80">
              vòng {(lan % soVong) + 1}/{soVong} của {teacher.label} · {soan.nguon}
            </span>
          )}
        </div>
      ) : (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <select value={goc} onChange={(event) => setGoc(event.target.value)} className={chonClass}>
            {GOC.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select value={loai} onChange={(event) => setLoai(event.target.value)} className={chonClass}>
            {LOAI.map((one) => (
              <option key={one.kyHieu} value={one.kyHieu}>
                {one.ten}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setChon((list) => [...list, goc + loai])} className={nut(false)}>
            + Thêm {goc + loai}
          </button>
          {chon.length > 0 && (
            <button type="button" onClick={() => setChon([])} className={nut(false)}>
              Xoá hết
            </button>
          )}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-1.5 font-mono text-sm">
        {hopAm.length === 0 ? (
          <span className="font-sans text-xs text-dim">
            Chưa có hợp âm — chọn nốt gốc, loại rồi bấm Thêm. Mỗi hợp âm một ô.
          </span>
        ) : (
          hopAm.map((symbol, index) => (
            <span
              key={index}
              className="flex items-center gap-1 rounded-md border border-line bg-white/6 px-2 py-0.5 text-cream"
            >
              {symbol}
              {cach === 'tung' && (
                <button
                  type="button"
                  aria-label={`Bỏ ${symbol}`}
                  onClick={() => setChon((list) => list.filter((_, at) => at !== index))}
                  className="text-dim hover:text-rose-300"
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          disabled={dang || ban || hopAm.length === 0}
          onClick={() => void dung()}
          className="rounded-lg bg-amber-key px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
        >
          {dang ? 'Đang dựng…' : 'Dựng phần đệm để tập'}
        </button>
        {ban && !dang && <span className="text-dim">Dừng phát trước khi dựng.</span>}
        {loi && <span className="text-rose-300">{loi}</span>}
      </div>
    </div>
  )
}
