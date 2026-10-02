import { useEffect, useMemo, useState } from 'react'
import {
  getPlaybackBeats,
  startAudio,
  startTimelineLoop,
  stopTimelineLoop,
  usePlaybackStore,
  type ScheduledHit,
} from '../shared/audio/audioEngine'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { getKeyboardRange } from '../shared/midi/onScreenPiano/layout'
import type { MidiNote } from '../shared/musicTheory/types'
import { readSetting } from '../shared/persistence/localSettings'
import { FallingNotes } from '../reharm/playback/FallingNotes'
import { PracticeStage } from '../reharm/playback/PracticeStage'
import { buildGatedSteps, notesSoundingAt } from '../reharm/playback/noteGatedPlaybackEngine'
import type { TimelineEvent } from '../reharm/style/types'
import { taiBaiTap, type BaiTap } from './baiTap'
import type { Teacher } from './teachers'

type Vong = 'tap' | 'kiem'

/** Nghe: phát vòng hai lượt rồi dừng — đủ để nghe khuôn lặp, nốt rơi không phải dựng vô tận. */
const LUOT_NGHE = 2

/**
 * Trang một thầy — tab Điệu · Kỹ thuật đánh · Học cách soạn câu (`Reference/KE-HOACH-LUYEN-TAP.md` mục 4c).
 *
 * Tab chưa có nội dung thì ẩn (người dùng 2/10/2026, câu E) — hiện chỉ tab Điệu có bài. Bước này (GĐ 1 bước 2–3) là NGHE DUYỆT
 * bộ bài tập: mỗi điệu một vòng tập 4 ô + một vòng kiểm, nghe kèm nốt rơi. Lộ trình 7 bậc (chờ đúng nốt · theo nhịp) gắn vào đây
 * ở bước sau, sau khi người dùng duyệt bài.
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

  const [chon, setChon] = useState<{ styleId: string; vong: Vong } | null>(null)
  const [dangNghe, setDangNghe] = useState(false)
  const looping = usePlaybackStore((state) => state.looping)
  useEffect(() => {
    if (!looping) setDangNghe(false)
  }, [looping])
  // Rời trang đang nghe thì tắt tiếng.
  useEffect(() => () => stopTimelineLoop(), [])

  const baiChon = bai?.find((one) => one.styleId === chon?.styleId) ?? bai?.[0] ?? null
  const vongChon = baiChon ? baiChon[chon?.vong ?? 'tap'] : null

  /* Vòng lặp LUOT_NGHE lượt — để phát và để nốt rơi cùng một danh sách tiếng. */
  const events = useMemo<TimelineEvent[]>(() => {
    if (!vongChon) return []
    return Array.from({ length: LUOT_NGHE }, (_, luot) =>
      vongChon.timeline.map((event) => ({ ...event, startBeat: event.startBeat + luot * vongChon.doDai })),
    ).flat()
  }, [vongChon])

  const steps = useMemo(
    () =>
      vongChon
        ? buildGatedSteps(events, vongChon.voicings, {
            beatsPerChord: vongChon.beatsPerChord,
            symbolAt: (beat) => vongChon.perBeat[Math.floor(beat % vongChon.doDai)] ?? '',
          })
        : [],
    [events, vongChon],
  )

  const range = useMemo(() => {
    let { low, high } = getKeyboardRange(readSetting('midiKeyboardKeys'))
    for (const event of events) {
      for (const note of event.notes) {
        low = Math.min(low, note) as MidiNote
        high = Math.max(high, note) as MidiNote
      }
    }
    return { low, high }
  }, [events])

  const [hitting, setHitting] = useState<{ left: MidiNote[]; right: MidiNote[] }>({ left: [], right: [] })
  useEffect(() => {
    if (!dangNghe || !looping) {
      setHitting({ left: [], right: [] })
      return
    }
    let raf = 0
    let last = ''
    const tick = () => {
      const next = notesSoundingAt(events, getPlaybackBeats())
      const key = `${next.left.join()}/${next.right.join()}`
      if (key !== last) {
        last = key
        setHitting(next)
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [dangNghe, looping, events])

  const [nowSymbol, setNowSymbol] = useState('')

  const nghe = async (one: BaiTap, vong: Vong) => {
    setChon({ styleId: one.styleId, vong })
    await startAudio()
    stopTimelineLoop()
    const v = one[vong]
    const hits: ScheduledHit[] = Array.from({ length: LUOT_NGHE }, (_, luot) =>
      v.timeline.map((event) => ({
        notes: event.notes,
        startBeat: event.startBeat + luot * v.doDai,
        durationBeats: event.durationBeats,
        velocity: event.velocity,
      })),
    ).flat()
    startTimelineLoop(hits, one.bpm, v.doDai * LUOT_NGHE, 0, true)
    // Âm thanh chưa sẵn sàng thì bộ phát không chạy — đừng báo "đang nghe" khi chẳng có tiếng.
    setDangNghe(usePlaybackStore.getState().looping)
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

  const dangChon = (one: BaiTap, vong: Vong) =>
    baiChon?.styleId === one.styleId && (chon?.vong ?? 'tap') === vong

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
        Nghe duyệt bộ bài tập: mỗi điệu một vòng tập 4 ô (bậc 1–6) và một vòng kiểm chưa gặp (bậc 7). Khung đệm không có câu
        chèn; Slow Blues giữ tay phải của Bộ Soạn Blues. Lộ trình 7 bậc gắn vào sau khi bạn duyệt.
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
              {(['tap', 'kiem'] as const).map((vong) => (
                <button
                  key={vong}
                  type="button"
                  onClick={() => void nghe(one, vong)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    dangNghe && dangChon(one, vong)
                      ? 'border-amber-key bg-amber-key/15 text-amber-key'
                      : 'border-line bg-white/6 text-cream hover:bg-white/12'
                  }`}
                >
                  ▶ Nghe vòng {vong === 'tap' ? 'tập' : 'kiểm'}
                </button>
              ))}
              {dangNghe && baiChon?.styleId === one.styleId && (
                <button
                  type="button"
                  onClick={() => stopTimelineLoop()}
                  className="rounded-lg border border-line bg-white/4 px-3 py-1.5 text-xs text-dim hover:bg-white/8"
                >
                  ■ Dừng
                </button>
              )}
              <span className="text-[11px] text-dim/80">nguồn: {one.nguon.tap}</span>
            </div>
          </li>
        ))}
      </ul>

      {vongChon && (
        <div className="rounded-xl border border-line bg-black/25 p-3">
          <p className="mb-2 text-xs text-dim">
            {baiChon?.ten} · vòng {(chon?.vong ?? 'tap') === 'tap' ? 'tập' : 'kiểm'} — bấm ▶ để nốt rơi chạy theo tiếng.
          </p>
          <PracticeStage
            bar={
              <button
                type="button"
                onClick={() => (dangNghe ? stopTimelineLoop() : baiChon && void nghe(baiChon, chon?.vong ?? 'tap'))}
                className="rounded-lg bg-amber-key px-3 py-1.5 font-semibold text-ink"
              >
                {dangNghe ? '■ Dừng' : '▶ Nghe'}
              </button>
            }
          >
            {(full) => (
              <>
                <div className={full ? 'min-h-0 flex-1' : ''}>
                  <FallingNotes
                    events={events}
                    steps={steps}
                    index={0}
                    live={dangNghe && looping}
                    lowNote={range.low}
                    highNote={range.high}
                    onSymbol={setNowSymbol}
                    fill={full}
                  />
                </div>
                <div className={full ? 'h-[38vh] max-h-80 min-h-28 shrink-0' : ''}>
                  <OnScreenPiano
                    lowNote={range.low}
                    highNote={range.high}
                    leftHandNotes={hitting.left}
                    rightHandNotes={hitting.right}
                    height={full ? '100%' : undefined}
                  />
                </div>
                <div className="shrink-0 rounded-b-lg border border-t-0 border-line bg-black/50 px-2 py-1.5 text-center">
                  <span className="font-sans text-lg font-bold text-amber-key">{nowSymbol || '—'}</span>
                </div>
              </>
            )}
          </PracticeStage>
        </div>
      )}
    </section>
  )
}
