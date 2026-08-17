import { useEffect, useRef, useState } from 'react'
import {
  getSourceCurrentTime,
  hasSourceFile,
  isSourcePlaying,
  pauseSource,
  playSourceFrom,
  setSourceVolume,
  stopSource,
} from '../../shared/audio/sourceAudio'
import { useLongPress } from '../../shared/ui/useLongPress'
import { isPaired } from '../chordTiming'
import { transposeSymbol } from '../transpose'
import type { SongSectionKind } from './songTextParser'
import {
  SECTION_KIND_COLORS,
  SECTION_KIND_LABELS,
} from './songSheet'
import {
  ChordContextMenu,
  type PassingOption,
  type TransitionOption,
} from './SongSheetView'

const MARKABLE: readonly SongSectionKind[] = [
  'verse',
  'chorus',
  'interlude',
  'prechorus',
  'bridge',
  'intro',
  'outro',
]

const BARS_PER_ROW = 4

interface BeatMark {
  from: number
  to: number
  kind: SongSectionKind
}

interface ChordOverviewProps {
  perBeat: readonly string[]
  meter: 3 | 4
  bpm: number
  onBpm?: (bpm: number) => void
  onApply?: (beats: readonly string[]) => void
  applyCount?: number
  /** Phách đang phát — nếu có thì không tự đọc file gốc. */
  activeBeat?: number | null
  onSeekBeat?: (beat: number) => void
  showToolbar?: boolean
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  playEnabled?: boolean
  onTone?: (delta: number) => void
  toneLabel?: string
  /** Chuột phải / nhấn giữ — cùng menu với bản lời. */
  chordIndexAt?: (beat: number) => number | null
  chordCount?: number
  pairedChords?: ReadonlySet<number>
  pairPlacesAt?: (chordIndex: number) => number
  passingOptionsFor?: (chordIndex: number) => PassingOption[]
  onSetChordSpan?: (
    chordIndex: number,
    span: 'full' | 'half',
    scope: 'here' | 'all',
  ) => void
  onTogglePassing?: (id: string) => void
  onAddPassingHere?: (slotId: string) => void
  onRemovePassingHere?: (slotId: string) => void
  fillAt?: (chordIndex: number) => boolean | null
  onToggleFill?: (chordIndex: number) => void
  transitionAt?: (chordIndex: number) => TransitionOption | null
  onToggleTransition?: (chordIndex: number) => void
  onSetTransition?: (chordIndex: number, run: TransitionOption) => void
}

export function ChordOverview({
  perBeat,
  meter,
  bpm,
  onBpm,
  onApply,
  applyCount = 0,
  activeBeat,
  onSeekBeat,
  showToolbar = true,
  onPlay,
  onPause,
  onStop,
  playEnabled,
  onTone,
  toneLabel,
  chordIndexAt,
  chordCount = 0,
  pairedChords,
  pairPlacesAt,
  passingOptionsFor,
  onSetChordSpan,
  onTogglePassing,
  onAddPassingHere,
  onRemovePassingHere,
  fillAt,
  onToggleFill,
  transitionAt,
  onToggleTransition,
  onSetTransition,
}: ChordOverviewProps) {
  const [shift, setShift] = useState(0)
  const [volume, setVolume] = useState(45)
  const [playing, setPlaying] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const [pending, setPending] = useState<{ from: number; to: number } | null>(
    null,
  )
  const [marks, setMarks] = useState<BeatMark[]>([])
  const dragging = useRef(false)
  const moved = useRef(false)
  const [menu, setMenu] = useState<{
    chordIndex: number
    x: number
    y: number
  } | null>(null)
  const bindPress = useLongPress()

  const shown = onTone
    ? [...perBeat]
    : perBeat.map((symbol) => transposeSymbol(symbol, shift))
  const canPlay = playEnabled ?? hasSourceFile()
  const cellsPerRow = meter * BARS_PER_ROW

  useEffect(() => {
    if (!playing) return
    let frame = 0
    const tick = () => {
      if (!isSourcePlaying()) {
        setPlaying(false)
        setCursor(null)
        return
      }
      const beat = Math.floor((getSourceCurrentTime() * bpm) / 60)
      setCursor(beat >= 0 && beat < perBeat.length ? beat : null)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, bpm, perBeat.length])

  const playFrom = (beat: number) => {
    playSourceFrom((beat * 60) / Math.max(1, bpm), bpm)
    setPlaying(true)
    setCursor(beat)
  }

  const markKind = (beat: number): SongSectionKind | null => {
    const hit = marks.find((mark) => beat >= mark.from && beat <= mark.to)
    return hit?.kind ?? null
  }

  const selected =
    pending ??
    (drag
      ? {
          from: Math.min(drag.from, drag.to),
          to: Math.max(drag.from, drag.to),
        }
      : null)
  const active = activeBeat !== undefined ? activeBeat : cursor

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null)
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  return (
    <div className="flex flex-col gap-2">
      {showToolbar && (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canPlay}
          onClick={() => (onPlay ? onPlay() : playFrom(active ?? 0))}
          className="rounded-md border border-line bg-white/6 px-2 py-1 text-xs text-cream disabled:opacity-30"
        >
          ▶
        </button>
        <button
          type="button"
          disabled={!canPlay}
          onClick={() => {
            if (onPause) onPause()
            else pauseSource()
            setPlaying(false)
          }}
          className="rounded-md border border-line bg-white/6 px-2 py-1 text-xs text-cream disabled:opacity-30"
        >
          ❚❚
        </button>
        <button
          type="button"
          disabled={!canPlay}
          onClick={() => {
            if (onStop) onStop()
            else stopSource()
            setPlaying(false)
            setCursor(null)
          }}
          className="rounded-md border border-line bg-white/6 px-2 py-1 text-xs text-cream disabled:opacity-30"
        >
          ■
        </button>

        <span className="font-mono text-[10px] text-dim">Tone</span>
        <button
          type="button"
          onClick={() => (onTone ? onTone(-1) : setShift((value) => value - 1))}
          className="rounded-md border border-line px-2 py-1 text-xs text-cream"
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-[11px] text-amber-key">
          {toneLabel ?? (shift === 0 ? '0' : shift > 0 ? `+${shift}` : String(shift))}
        </span>
        <button
          type="button"
          onClick={() => (onTone ? onTone(1) : setShift((value) => value + 1))}
          className="rounded-md border border-line px-2 py-1 text-xs text-cream"
        >
          +
        </button>

        <label className="flex items-center gap-1.5 text-xs text-dim">
          BPM
          <input
            type="range"
            min={40}
            max={160}
            value={bpm}
            onChange={(event) => onBpm?.(Number(event.target.value))}
            className="w-24 accent-amber-key"
          />
          <span className="w-8 font-mono text-cream">{bpm}</span>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-dim">
          Vol
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            disabled={!canPlay}
            onChange={(event) => {
              const value = Number(event.target.value)
              setVolume(value)
              setSourceVolume(value / 100)
            }}
            className="w-16 accent-amber-key"
          />
        </label>
      </div>
      )}

      {pending ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] text-amber-key">
            {pending.to - pending.from + 1} phách — đánh dấu:
          </span>
          {MARKABLE.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setMarks((list) => [...list, { ...pending, kind }])
                setPending(null)
              }}
              className={`rounded-md border px-2 py-0.5 text-[11px] ${SECTION_KIND_COLORS[kind].border} ${SECTION_KIND_COLORS[kind].text}`}
            >
              {SECTION_KIND_LABELS[kind]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPending(null)}
            className="rounded-md border border-line px-2 py-0.5 text-[11px] text-dim"
          >
            Thôi
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-dim">
          Kéo chuột trái trên lưới để đánh dấu phiên khúc / điệp khúc.
          {marks.length > 0 && (
            <button
              type="button"
              onClick={() => setMarks([])}
              className="ml-2 underline"
            >
              Xoá đánh dấu
            </button>
          )}
        </p>
      )}

      <div
        className="overflow-auto rounded-lg border border-line bg-black/30 p-1"
        onPointerUp={() => {
          if (!dragging.current || !drag) return
          dragging.current = false
          const from = Math.min(drag.from, drag.to)
          const to = Math.max(drag.from, drag.to)
          setDrag(null)
          if (to > from) setPending({ from, to })
        }}
        onPointerLeave={() => {
          if (!dragging.current) return
        }}
      >
        {Array.from(
          { length: Math.ceil(shown.length / cellsPerRow) },
          (_, row) => (
            <div
              key={row}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cellsPerRow}, minmax(2.4rem, 1fr))`,
              }}
            >
              {shown
                .slice(row * cellsPerRow, (row + 1) * cellsPerRow)
                .map((symbol, offset) => {
                  const beat = row * cellsPerRow + offset
                  const start =
                    beat === 0 || shown[beat] !== shown[beat - 1]
                  const barStart = beat % meter === 0
                  const kind = markKind(beat)
                  const inSel =
                    selected !== null &&
                    beat >= selected.from &&
                    beat <= selected.to
                  const chordIndex = chordIndexAt?.(beat) ?? null
                  const press =
                    chordIndex !== null
                      ? bindPress((point) => {
                          setMenu({
                            chordIndex,
                            x: point.x,
                            y: point.y,
                          })
                        })
                      : null
                  return (
                    <button
                      key={beat}
                      type="button"
                      data-beat={beat}
                      {...press}
                      onPointerDown={(event) => {
                        press?.onPointerDown(event)
                        if (event.button === 2) return
                        dragging.current = true
                        moved.current = false
                        setDrag({ from: beat, to: beat })
                        setPending(null)
                      }}
                      onPointerEnter={() => {
                        if (dragging.current) {
                          moved.current = true
                          setDrag((current) =>
                            current ? { ...current, to: beat } : current,
                          )
                        }
                      }}
                      onClick={() => {
                        if (moved.current) return
                        if (onSeekBeat) onSeekBeat(beat)
                        else if (canPlay) playFrom(beat)
                      }}
                      className={`min-h-9 border-b border-r border-white/10 px-0.5 py-1 text-center font-mono text-[11px] ${
                        barStart ? 'border-l-2 border-l-white/35' : ''
                      } ${
                        beat === active
                          ? 'bg-amber-key/35 text-amber-key'
                          : inSel
                            ? 'bg-white/15 text-cream'
                            : kind
                              ? `${SECTION_KIND_COLORS[kind].text} bg-white/6`
                              : 'text-cream'
                      }`}
                    >
                      {start ? symbol : ''}
                    </button>
                  )
                })}
            </div>
          ),
        )}
      </div>

      {menu && chordIndexAt && (
        <ChordContextMenu
          menu={menu}
          paired={
            pairedChords ? isPaired(pairedChords, menu.chordIndex) : false
          }
          isLast={menu.chordIndex >= chordCount - 1}
          pairPlaces={pairPlacesAt?.(menu.chordIndex) ?? 1}
          passing={passingOptionsFor?.(menu.chordIndex) ?? []}
          onPick={
            onSetChordSpan
              ? (span, scope) => {
                  onSetChordSpan(menu.chordIndex, span, scope)
                  setMenu(null)
                }
              : undefined
          }
          onTogglePassing={
            onTogglePassing
              ? (id) => {
                  onTogglePassing(id)
                  setMenu(null)
                }
              : undefined
          }
          onAddHere={
            onAddPassingHere
              ? (slotId) => {
                  onAddPassingHere(slotId)
                  setMenu(null)
                }
              : undefined
          }
          onRemoveHere={
            onRemovePassingHere
              ? (slotId) => {
                  onRemovePassingHere(slotId)
                  setMenu(null)
                }
              : undefined
          }
          transition={transitionAt?.(menu.chordIndex) ?? null}
          canMarkTransition={onToggleTransition !== undefined}
          onToggleTransition={
            onToggleTransition
              ? () => {
                  onToggleTransition(menu.chordIndex)
                  setMenu(null)
                }
              : undefined
          }
          onSetTransition={
            onSetTransition
              ? (run) => onSetTransition(menu.chordIndex, run)
              : undefined
          }
          fill={fillAt?.(menu.chordIndex) ?? null}
          onToggleFill={
            onToggleFill
              ? () => {
                  onToggleFill(menu.chordIndex)
                  setMenu(null)
                }
              : undefined
          }
        />
      )}

      {onApply && (
        <button
          type="button"
          disabled={applyCount === 0}
          onClick={() => onApply(shown)}
          className="self-start rounded-lg bg-amber-key px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
        >
          Dùng {applyCount} hợp âm này
        </button>
      )}
    </div>
  )
}
