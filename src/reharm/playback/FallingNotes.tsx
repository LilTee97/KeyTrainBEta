import { useEffect, useRef, useState } from 'react'
import type { MidiNote } from '../../shared/musicTheory/types'
import { buildKeyboardLayout, keyPlacement } from '../../shared/midi/onScreenPiano/layout'
import { midiToName } from '../../shared/musicTheory/pitch'
import { getPlaybackBeats } from '../../shared/audio/audioEngine'
import { scaleLabelForSymbol } from '../brain/chordScale'
import type { GatedStep } from './noteGatedPlaybackEngine'

/**
 * Nốt rơi xuống bàn phím, kiểu Synthesia.
 *
 * Tên hợp âm / gam nằm **dưới** khung (không overlay). Overlay + overflow-hidden
 * + textContent từ rAF bị React ghi đè mỗi phách — Android mất chữ.
 */

const LOOK_AHEAD_BEATS = 8
const HEIGHT = 180
const NOTE_H = 20

function noteY(away: number): number {
  return (1 - away / LOOK_AHEAD_BEATS) * (HEIGHT - NOTE_H)
}

function inWindow(away: number): boolean {
  return away >= -0.5 && away <= LOOK_AHEAD_BEATS + 1
}

function symbolAtBeat(steps: readonly GatedStep[], beat: number): string {
  if (steps.length === 0) return ''
  for (let at = steps.length - 1; at >= 0; at -= 1) {
    if (steps[at]!.startBeat <= beat + 1e-6) return steps[at]!.symbol
  }
  return steps[0]!.symbol
}

interface FallingNotesProps {
  steps: readonly GatedStep[]
  index: number
  live?: boolean
  lowNote: MidiNote
  highNote: MidiNote
}

export function FallingNotes({
  steps,
  index,
  live = false,
  lowNote,
  highNote,
}: FallingNotesProps) {
  const layer = useRef<HTMLDivElement>(null)
  const bucketRef = useRef(0)
  const [bucket, setBucket] = useState(0)
  const layout = buildKeyboardLayout(lowNote, highNote)
  const parked = steps[index]?.startBeat
  if (parked === undefined && !live) return null

  useEffect(() => {
    if (!live) return
    const root = layer.current
    if (!root) return
    const start = Math.max(0, Math.floor(getPlaybackBeats()))
    bucketRef.current = start
    setBucket(start)

    let frame = 0
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
        el.style.transform = `translate3d(0,${noteY(away)}px,0)`
        el.hidden = !inWindow(away)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [live, steps])

  const origin = live ? bucket : (parked ?? 0)
  const upcoming = steps.filter((step) => inWindow(step.startBeat - origin))
  const symbol = live ? symbolAtBeat(steps, origin) : (steps[index]?.symbol ?? '')
  const gam = symbol ? scaleLabelForSymbol(symbol) : null

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-t-lg border border-b-0 border-line bg-black/40"
        style={{ height: HEIGHT }}
        role="img"
        aria-label={symbol ? `Hợp âm ${symbol}` : 'Nốt sắp tới'}
      >
        <div ref={layer} className="absolute inset-0">
          {upcoming.map((step) =>
            step.notes.map((note) => {
              const place = keyPlacement(layout, note)
              if (!place) return null
              const away = step.startBeat - origin
              const isLeft = step.leftNotes.includes(note)
              return (
                <div
                  key={`${step.startBeat}-${note}`}
                  data-start={step.startBeat}
                  hidden={!inWindow(away)}
                  style={{
                    left: `${place.left}%`,
                    width: `${place.width}%`,
                    height: NOTE_H,
                    transform: `translate3d(0,${noteY(away)}px,0)`,
                  }}
                  className={`absolute top-0 flex items-center justify-center rounded text-[9px] font-semibold ${
                    isLeft ? 'bg-left-hand text-ink' : 'bg-right-hand text-ink'
                  } ${!live && step.startBeat === parked ? 'ring-2 ring-cream' : 'opacity-70'}`}
                >
                  {midiToName(note)}
                </div>
              )
            }),
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-cream/50" />
      </div>
      <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 rounded-b-lg border border-t-0 border-line bg-black/50 px-2 py-1 text-center">
        <span className="font-sans text-lg font-bold text-amber-key">{symbol || '—'}</span>
        {gam ? <span className="font-sans text-xs text-cream/80">Gam: {gam}</span> : null}
      </div>
    </div>
  )
}
