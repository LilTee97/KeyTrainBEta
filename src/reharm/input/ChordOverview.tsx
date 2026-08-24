import { useEffect, useState } from 'react'
import {
  getSourceCurrentTime,
  hasSourceFile,
  isSourcePlaying,
  pauseSource,
  playSourceFrom,
  setSourceVolume,
  stopSource,
} from '../../shared/audio/sourceAudio'
import {
  INSTRUMENTS,
  setInstrument,
  useAudioStore,
} from '../../shared/audio/audioEngine'
import { useLongPress } from '../../shared/ui/useLongPress'
import { isPaired } from '../chordTiming'
import { transposeSymbol } from '../transpose'
import {
  ChordContextMenu,
  type PassingOption,
  type TransitionOption,
} from './SongSheetView'

const BARS_PER_ROW = 4

export function PlaybackToolbar({
  canPlay,
  onPlay,
  onPause,
  onStop,
  onTone,
  toneLabel,
  bpm,
  onBpm,
}: {
  canPlay: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onTone?: (delta: number) => void
  toneLabel?: string
  bpm: number
  onBpm?: (bpm: number) => void
}) {
  const [shift, setShift] = useState(0)
  const [volume, setVolume] = useState(45)
  const instrument = useAudioStore((state) => state.instrument)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!canPlay}
        onClick={onPlay}
        className="rounded-md border border-line bg-white/6 px-2 py-1 text-xs text-cream disabled:opacity-30"
      >
        ▶
      </button>
      <button
        type="button"
        disabled={!canPlay}
        onClick={onPause}
        className="rounded-md border border-line bg-white/6 px-2 py-1 text-xs text-cream disabled:opacity-30"
      >
        ❚❚
      </button>
      <button
        type="button"
        disabled={!canPlay}
        onClick={onStop}
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
        Tiếng
        <select
          value={instrument}
          onChange={(event) => {
            void setInstrument(event.target.value as (typeof INSTRUMENTS)[number]['id'])
          }}
          className="rounded border border-line bg-white/6 px-1.5 py-0.5 text-cream"
        >
          {INSTRUMENTS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
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
  )
}

interface ChordOverviewProps {
  perBeat: readonly string[]
  /** Hợp âm đoạn dạo đầu, hiện thành dải riêng phía trên lưới. */
  leadIn?: { label: string; chords: readonly string[] }
  /** Hợp âm đoạn kết, hiện thành dải riêng phía dưới lưới. */
  leadOut?: { label: string; chords: readonly string[] }
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
  onAddPassingHere?: (slotId: string, hostKeepBeats?: number) => void
  onRemovePassingHere?: (slotId: string) => void
  fillAt?: (chordIndex: number) => boolean | null
  onToggleFill?: (chordIndex: number) => void
  runAt?: (chordIndex: number) => boolean | null
  onToggleRun?: (chordIndex: number) => void
  colorHintAt?: (chordIndex: number) => string | null
  onCycleColor?: (chordIndex: number) => void
  heldMutedAt?: (chordIndex: number) => boolean
  heldBusyAt?: (chordIndex: number) => boolean
  onToggleHeldMute?: (chordIndex: number) => void
  slashHintAt?: (chordIndex: number) => string | null
  onToggleSlash?: (chordIndex: number) => void
  transitionAt?: (chordIndex: number) => TransitionOption | null
  onToggleTransition?: (chordIndex: number) => void
  onSetTransition?: (chordIndex: number, run: TransitionOption) => void
  onRemoveChord?: (index: number) => void
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
  leadIn,
  leadOut,
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
  runAt,
  onToggleRun,
  colorHintAt,
  onCycleColor,
  heldMutedAt,
  heldBusyAt,
  onToggleHeldMute,
  slashHintAt,
  onToggleSlash,
  transitionAt,
  onToggleTransition,
  onSetTransition,
  onRemoveChord,
}: ChordOverviewProps) {
  const [shift, setShift] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)
  const [menuBeat, setMenuBeat] = useState<number | null>(null)
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

  const active = activeBeat !== undefined ? activeBeat : cursor
  const playhead = active === null || active === undefined ? null : Math.floor(active)
  const activeChord =
    playhead !== null && chordIndexAt ? chordIndexAt(playhead) : null
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
        <PlaybackToolbar
          canPlay={canPlay}
          onPlay={() => (onPlay ? onPlay() : playFrom(active ?? 0))}
          onPause={() => {
            if (onPause) onPause()
            else pauseSource()
            setPlaying(false)
          }}
          onStop={() => {
            if (onStop) onStop()
            else stopSource()
            setPlaying(false)
            setCursor(null)
          }}
          onTone={onTone ?? ((delta) => setShift((value) => value + delta))}
          toneLabel={toneLabel}
          bpm={bpm}
          onBpm={onBpm}
        />
      )}

      <p className="text-[11px] text-dim">
        Chuột phải vào đúng phách để chèn 2-5-1 / fill tại phách đó.
      </p>

      {(leadIn || leadOut) && (
        <div className="mb-2 flex flex-col gap-1 text-xs">
          {leadIn && leadIn.chords.length > 0 && (
            <p className="font-mono text-amber-key">
              {leadIn.label}: {leadIn.chords.join('  ')}
            </p>
          )}
          {leadOut && leadOut.chords.length > 0 && (
            <p className="font-mono text-amber-key">
              {leadOut.label}: {leadOut.chords.join('  ')}
            </p>
          )}
        </div>
      )}

      <div className="overflow-auto rounded-lg border border-line bg-black/30 p-1">
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
                  const chordIndex = chordIndexAt?.(beat) ?? null
                  const press =
                    chordIndex !== null
                      ? bindPress((point) => {
                          setMenuBeat(beat)
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
                      onClick={() => {
                        if (onSeekBeat) onSeekBeat(beat)
                        else if (canPlay) playFrom(beat)
                      }}
                      className={`min-h-9 border-b border-r border-white/10 px-0.5 py-1 text-center font-mono text-[11px] ${
                        barStart ? 'border-l-2 border-l-white/35' : ''
                      } ${
                        (activeChord !== null
                          ? chordIndexAt?.(beat) === activeChord
                          : beat === playhead)
                          ? 'bg-amber-key/35 text-amber-key'
                          : runAt?.(chordIndex ?? -1) === true
                            ? 'bg-rose-400/20 text-rose-300 underline decoration-double'
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
                  let keep: number | undefined
                  if (menuBeat !== null) {
                    let start = menuBeat
                    while (start > 0 && shown[start] === shown[start - 1]) {
                      start -= 1
                    }
                    const offset = menuBeat - start
                    if (offset > 0) keep = offset
                  }
                  onAddPassingHere(slotId, keep)
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
          run={runAt?.(menu.chordIndex) ?? null}
          onToggleRun={
            onToggleRun
              ? () => {
                  onToggleRun(menu.chordIndex)
                  setMenu(null)
                }
              : undefined
          }
          colorHint={colorHintAt?.(menu.chordIndex) ?? null}
          onCycleColor={
            onCycleColor
              ? () => onCycleColor(menu.chordIndex)
              : undefined
          }
          heldMuted={heldMutedAt?.(menu.chordIndex) ?? false}
          heldBusy={heldBusyAt?.(menu.chordIndex) ?? false}
          onToggleHeldMute={
            onToggleHeldMute
              ? () => {
                  onToggleHeldMute(menu.chordIndex)
                  setMenu(null)
                }
              : undefined
          }
          slashHint={slashHintAt?.(menu.chordIndex) ?? null}
          onToggleSlash={
            onToggleSlash
              ? () => {
                  onToggleSlash(menu.chordIndex)
                  setMenu(null)
                }
              : undefined
          }
          onDelete={
            onRemoveChord
              ? () => {
                  onRemoveChord(menu.chordIndex)
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
