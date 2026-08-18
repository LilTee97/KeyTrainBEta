import { useEffect, useRef } from 'react'
import type { MidiNote } from '../../shared/musicTheory/types'
import { buildKeyboardLayout, keyPlacement } from '../../shared/midi/onScreenPiano/layout'
import { midiToName } from '../../shared/musicTheory/pitch'
import { getPlaybackBeats } from '../../shared/audio/audioEngine'
import type { GatedStep } from './noteGatedPlaybackEngine'

/**
 * Nốt rơi xuống bàn phím, kiểu Synthesia.
 *
 * Khi đang phát theo đồng hồ: `requestAnimationFrame` đọc phách từ Transport
 * rồi chỉ sửa `transform` — không render lại React mỗi khung. 60fps trên
 * Chrome PC và Android.
 *
 * Chế độ chờ nốt: đứng yên theo chặng, không cần đồng hồ.
 */

const LOOK_AHEAD_BEATS = 8
const HEIGHT = 180
const NOTE_H = 20

function noteY(away: number): number {
  return (1 - away / LOOK_AHEAD_BEATS) * (HEIGHT - NOTE_H)
}

function inWindow(away: number): boolean {
  return away >= -0.2 && away <= LOOK_AHEAD_BEATS + 0.2
}

interface FallingNotesProps {
  steps: readonly GatedStep[]
  index: number
  nowBeat?: number | null
  lowNote: MidiNote
  highNote: MidiNote
  chord?: string
}

export function FallingNotes({
  steps,
  index,
  nowBeat,
  lowNote,
  highNote,
  chord,
}: FallingNotesProps) {
  const live = nowBeat !== undefined && nowBeat !== null
  const layer = useRef<HTMLDivElement>(null)
  const layout = buildKeyboardLayout(lowNote, highNote)
  const origin = live ? nowBeat : steps[index]?.startBeat
  if (origin === undefined) return null

  const upcoming = steps.filter((step) => inWindow(step.startBeat - origin))

  useEffect(() => {
    if (!live) return
    const root = layer.current
    if (!root) return

    let frame = 0
    const tick = () => {
      const now = getPlaybackBeats()
      for (const el of root.children) {
        if (!(el instanceof HTMLElement) || el.dataset.start === undefined) continue
        const away = Number(el.dataset.start) - now
        el.style.transform = `translate3d(0,${noteY(away)}px,0)`
        el.hidden = !inWindow(away)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [live, upcoming])

  return (
    <div
      className="relative w-full overflow-hidden rounded-t-lg border border-b-0 border-line bg-black/40"
      style={{ height: HEIGHT }}
      role="img"
      aria-label={`Nốt sắp tới: ${upcoming[0]?.notes
        .map((note) => midiToName(note))
        .join(' ')}`}
    >
      {chord && (
        <div className="pointer-events-none absolute top-2 right-3 z-10 font-serif text-4xl font-bold tracking-wide text-amber-key drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          {chord}
        </div>
      )}
      <div ref={layer} className="absolute inset-0">
        {upcoming.map((step, position) =>
          step.notes.map((note) => {
            const place = keyPlacement(layout, note)
            if (!place) return null
            const away = step.startBeat - origin
            const isLeft = step.leftNotes.includes(note)
            return (
              <div
                key={`${step.startBeat}-${note}`}
                data-start={step.startBeat}
                style={{
                  left: `${place.left}%`,
                  width: `${place.width}%`,
                  height: NOTE_H,
                  transform: `translate3d(0,${noteY(away)}px,0)`,
                  willChange: live ? 'transform' : undefined,
                }}
                className={`absolute top-0 flex items-center justify-center rounded text-[9px] font-semibold ${
                  isLeft ? 'bg-left-hand text-ink' : 'bg-right-hand text-ink'
                } ${position === 0 ? 'ring-2 ring-cream' : 'opacity-70'}`}
              >
                {midiToName(note)}
              </div>
            )
          }),
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-cream/50" />
    </div>
  )
}
