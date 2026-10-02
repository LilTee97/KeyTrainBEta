import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MidiNote } from '../../shared/musicTheory/types'
import { buildKeyboardLayout, keyPlacement } from '../../shared/midi/onScreenPiano/layout'
import { midiToName } from '../../shared/musicTheory/pitch'
import { getPlaybackBeats } from '../../shared/audio/audioEngine'
import type { TimelineEvent } from '../style/types'
import { pxPerBeatFor, type GatedStep } from './noteGatedPlaybackEngine'

/**
 * Nốt rơi xuống bàn phím, kiểu Synthesia.
 *
 * Mỗi nốt là một khối DÀI THEO THỜI GIAN: đáy khối chạm vạch đúng lúc tiếng kêu, chiều cao = độ ngân. Nốt ngân
 * dài thành thanh dài, nốt giật thành khối ngắn có khe trước nốt sau, câu chạy nhanh thành chuỗi khối rời. Người
 * dùng 2/10/2026: *"Nếu nốt nào ngân dài thì hãy kéo dài hình nốt rơi"* · *"đánh giật hay đánh nhanh thì ... các
 * nốt rơi cũng phải thể hiện thật chính xác và khớp hình với tiếng"*. Cũ: khối cao cố định 20 px, 8 phách trên
 * 180 px — móc kép cách nhau 5,6 px mà khối cao 20 px nên chồng lên nhau. Thu phóng: `pxPerBeatFor`.
 *
 * Nốt láy cũng vẽ (mờ hơn, không ghi tên) — app có phát nó, thiếu hình là hình không khớp tiếng; nó vẫn không
 * thuộc phần bị chấm.
 *
 * Tên hợp âm / gam nằm **dưới** khung (không overlay). Overlay + overflow-hidden
 * + textContent từ rAF bị React ghi đè mỗi phách — Android mất chữ.
 */

const HEIGHT = 220
/** Khối ngắn nhất vẫn nhìn thấy được. */
const MIN_BLOCK_PX = 5
/** Khe giữa hai nốt liền nhau — nốt giật và nốt nối phân biệt được bằng mắt. */
const GAP_PX = 2
/** Khối đủ cao mới ghi tên nốt. */
const LABEL_PX = 12

/** Đỉnh khối: đáy (= lúc tiếng vào) cách vạch (đáy khung, cao `frame` px) `away` phách. */
const topOf = (away: number, height: number, pxPerBeat: number, frame: number) =>
  frame - away * pxPerBeat - height
/** Còn trong khung: chưa ở quá đỉnh khung, và đuôi (hết ngân) chưa qua vạch. */
const shows = (away: number, duration: number, lookAhead: number) =>
  away <= lookAhead + 0.5 && away + duration >= 0

function symbolAtBeat(steps: readonly GatedStep[], beat: number): string {
  if (steps.length === 0) return ''
  for (let at = steps.length - 1; at >= 0; at -= 1) {
    if (steps[at]!.startBeat <= beat + 1e-6) return steps[at]!.symbol
  }
  return steps[0]!.symbol
}

interface FallingNotesProps {
  /** Tiếng để VẼ — mọi tiếng của tay đang tập, kể cả nốt láy. */
  events: readonly TimelineEvent[]
  /** Chặng — để biết hợp âm đang vang và chỗ đứng chờ ở chế độ chờ đúng nốt. */
  steps: readonly GatedStep[]
  index: number
  live?: boolean
  lowNote: MidiNote
  highNote: MidiNote
  onSymbol?: (symbol: string) => void
  /** Lấp chiều cao khung cha thay vì cao cố định — chế độ toàn màn hình. */
  fill?: boolean
}

export function FallingNotes({
  events,
  steps,
  index,
  live = false,
  lowNote,
  highNote,
  onSymbol,
  fill = false,
}: FallingNotesProps) {
  const layer = useRef<HTMLDivElement>(null)
  const bucketRef = useRef(0)
  const [bucket, setBucket] = useState(0)
  const layout = buildKeyboardLayout(lowNote, highNote)
  const parked = steps[index]?.startBeat
  const pxPerBeat = useMemo(() => pxPerBeatFor(events), [events])

  /* Lấp khung cha thì đo chiều cao thật (đổi theo xoay ngang/dọc); không thì cao cố định. */
  const [measured, setMeasured] = useState(HEIGHT)
  const frameRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !fill || typeof ResizeObserver === 'undefined') return
      const update = () => setMeasured(Math.max(60, el.clientHeight))
      update()
      const observer = new ResizeObserver(update)
      observer.observe(el)
      return () => observer.disconnect()
    },
    [fill],
  )
  const frame = fill ? measured : HEIGHT
  const lookAhead = frame / pxPerBeat

  useEffect(() => {
    if (!live) return
    const root = layer.current
    if (!root) return
    const start = Math.max(0, Math.floor(getPlaybackBeats()))
    bucketRef.current = start
    setBucket(start)

    let raf = 0
    const tick = () => {
      const now = getPlaybackBeats()
      const nextBucket = Math.max(0, Math.floor(now))
      if (nextBucket !== bucketRef.current) {
        bucketRef.current = nextBucket
        setBucket(nextBucket)
      }
      for (const el of root.children) {
        if (!(el instanceof HTMLElement) || el.dataset.start === undefined) continue
        const away = Number(el.dataset.start) - now
        el.style.transform = `translate3d(0,${topOf(away, Number(el.dataset.h), pxPerBeat, frame)}px,0)`
        el.hidden = !shows(away, Number(el.dataset.dur), lookAhead)
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [live, events, pxPerBeat, lookAhead, frame])

  const origin = live ? bucket : (parked ?? 0)
  // Dựng sẵn khối sắp vào khung trong hai phách tới — `bucket` chỉ đổi mỗi phách một lần.
  const upcoming = events
    .map((event, at) => ({ event, at }))
    .filter(({ event }) => {
      const away = event.startBeat - origin
      return away <= lookAhead + 2 && away + event.durationBeats >= -1
    })
  const symbol = live ? symbolAtBeat(steps, origin) : (steps[index]?.symbol ?? '')

  useEffect(() => {
    onSymbol?.(symbol)
  }, [symbol, onSymbol])

  // Sau mọi hook: trả `null` trước hook thì danh sách chặng đổi từ rỗng sang có (đổi tay tập) là lệch thứ tự hook.
  if (parked === undefined && !live) return null

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-t-lg border border-b-0 border-line bg-black/40"
      style={{ height: fill ? '100%' : HEIGHT }}
      role="img"
      aria-label={symbol ? `Hợp âm ${symbol}` : 'Nốt sắp tới'}
    >
      <div ref={layer} className="absolute inset-0">
        {upcoming.map(({ event, at }) =>
          event.notes.map((note) => {
            const place = keyPlacement(layout, note)
            if (!place) return null
            const away = event.startBeat - origin
            const height = Math.max(MIN_BLOCK_PX, event.durationBeats * pxPerBeat - GAP_PX)
            const waiting = !live && Math.abs(event.startBeat - (parked ?? 0)) < 1e-3
            return (
              <div
                key={`${at}-${note}`}
                data-start={event.startBeat}
                data-dur={event.durationBeats}
                data-h={height}
                hidden={!shows(away, event.durationBeats, lookAhead)}
                style={{
                  left: `${place.left}%`,
                  width: `${place.width}%`,
                  height,
                  transform: `translate3d(0,${topOf(away, height, pxPerBeat, frame)}px,0)`,
                }}
                className={`absolute top-0 flex items-end justify-center overflow-hidden rounded-sm pb-0.5 text-[9px] leading-none font-semibold ${
                  event.hand === 'left' ? 'bg-left-hand text-ink' : 'bg-right-hand text-ink'
                } ${event.grace ? 'opacity-40' : waiting ? 'ring-2 ring-cream' : 'opacity-80'}`}
              >
                {!event.grace && height >= LABEL_PX ? midiToName(note) : null}
              </div>
            )
          }),
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-cream/50" />
    </div>
  )
}
