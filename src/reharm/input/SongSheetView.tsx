import { useState } from 'react'
import type {
  FlatLine,
  SectionMark,
  SheetAnchor,
  SheetLine,
  SongSheet,
} from './songSheet'
import { SECTION_KIND_LABELS, flattenLines, layoutAnchors } from './songSheet'
import type { SongSectionKind } from './songTextParser'

/**
 * Bản nhạc: lời bài hát với hợp âm **đã tái hoà âm** ghi trên đầu, hợp âm đang
 * vang thì sáng lên, và người dùng **quét chuột để tự chia đoạn**.
 *
 * Trình bày bằng phông đều và khoảng trắng thật, đúng cách các trang hợp âm
 * làm — nhờ vậy cột hợp âm khớp với chữ, và người dùng copy ra chỗ khác vẫn
 * giữ được canh cột.
 */

/** Các loại đoạn cho người dùng chọn, xếp theo thứ tự hay dùng. */
const MARKABLE: readonly SongSectionKind[] = [
  'verse',
  'chorus',
  'interlude',
  'prechorus',
  'bridge',
  'intro',
  'outro',
]

interface SongSheetViewProps {
  sheet: SongSheet
  /** Hợp âm đang vang, đếm từ 0. Rỗng nghĩa là đang không phát. */
  activeIndex: number | null
  /** Bấm vào một hợp âm thì phát lại từ đúng chỗ đó. */
  onSeek?: (chordIndex: number) => void
  /** Người dùng vừa đánh dấu một khoảng dòng là đoạn gì. */
  onMark?: (mark: SectionMark) => void
  /** Xoá hết đánh dấu, trả về cách chia đoạn mà bộ đọc tự nhận. */
  onClearMarks?: () => void
  /** Đang có đánh dấu nào không, để biết có cần nút xoá hay không. */
  hasMarks?: boolean
}

export function SongSheetView({
  sheet,
  activeIndex,
  onSeek,
  onMark,
  onClearMarks,
  hasMarks = false,
}: SongSheetViewProps) {
  /** Khoảng dòng đang quét: mốc bắt đầu và mốc hiện tại của con trỏ. */
  const [anchorLine, setAnchorLine] = useState<number | null>(null)
  const [hoverLine, setHoverLine] = useState<number | null>(null)
  /** Đã nhả chuột, đang chờ chọn loại đoạn. */
  const [pending, setPending] = useState<{ from: number; to: number } | null>(
    null,
  )

  const flat = flattenLines(sheet)
  if (flat.length === 0) return null

  const canMark = onMark !== undefined

  /** Khoảng đang được tô, dù đang kéo hay đã nhả chờ chọn. */
  const range =
    pending ??
    (anchorLine !== null && hoverLine !== null
      ? { from: Math.min(anchorLine, hoverLine), to: Math.max(anchorLine, hoverLine) }
      : null)

  const inRange = (index: number) =>
    range !== null && index >= range.from && index <= range.to

  const finishSweep = () => {
    if (anchorLine === null || hoverLine === null) return

    setPending({
      from: Math.min(anchorLine, hoverLine),
      to: Math.max(anchorLine, hoverLine),
    })
    setAnchorLine(null)
    setHoverLine(null)
  }

  const apply = (kind: SongSectionKind) => {
    if (pending && onMark) onMark({ ...pending, kind })
    setPending(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {canMark && (
        <div className="flex flex-wrap items-center gap-2">
          {pending ? (
            <>
              <span className="font-mono text-[11px] text-dim">
                Đánh dấu {pending.to - pending.from + 1} dòng là:
              </span>
              {MARKABLE.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => apply(kind)}
                  className="rounded-lg border border-amber-key/50 bg-amber-key/10 px-2.5 py-1 text-xs text-amber-key hover:bg-amber-key/20"
                >
                  {SECTION_KIND_LABELS[kind]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg border border-line px-2.5 py-1 text-xs text-dim hover:bg-white/8"
              >
                Thôi
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-dim">
                Quét chuột qua các dòng lời để tự chia phiên khúc, điệp khúc,
                giang tấu.
              </span>
              {hasMarks && onClearMarks && (
                <button
                  type="button"
                  onClick={onClearMarks}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-dim hover:bg-white/8"
                >
                  Xoá đánh dấu
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div
        className="flex flex-col gap-4 overflow-x-auto rounded-lg border border-line bg-black/25 p-4 font-mono text-xs leading-relaxed"
        onMouseUp={finishSweep}
        onMouseLeave={finishSweep}
      >
        {sheet.sections.map((section, index) => (
          <SectionBlock
            key={`${section.name}-${index}`}
            name={section.name}
            lines={section.lines}
            flat={flat}
            activeIndex={activeIndex}
            onSeek={onSeek}
            canMark={canMark}
            inRange={inRange}
            onSweepStart={(line) => {
              setPending(null)
              setAnchorLine(line)
              setHoverLine(line)
            }}
            onSweepOver={(line) => {
              if (anchorLine !== null) setHoverLine(line)
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface SectionBlockProps {
  name: string
  lines: readonly SheetLine[]
  flat: readonly FlatLine[]
  activeIndex: number | null
  onSeek?: (chordIndex: number) => void
  canMark: boolean
  inRange: (index: number) => boolean
  onSweepStart: (index: number) => void
  onSweepOver: (index: number) => void
}

function SectionBlock({
  name,
  lines,
  flat,
  activeIndex,
  onSeek,
  canMark,
  inRange,
  onSweepStart,
  onSweepOver,
}: SectionBlockProps) {
  return (
    <div>
      {name && (
        <h4 className="mb-1.5 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
          {name}
        </h4>
      )}

      <div className="flex flex-col gap-2">
        {lines.map((line, position) => {
          // Số thứ tự toàn bài, để đánh dấu đoạn không phụ thuộc cách chia hiện tại.
          const index = flat.findIndex((entry) => entry.line === line)
          const selected = inRange(index)

          return (
            <div
              key={position}
              onMouseDown={canMark ? () => onSweepStart(index) : undefined}
              onMouseEnter={canMark ? () => onSweepOver(index) : undefined}
              className={`${canMark ? 'cursor-text' : ''} ${
                selected ? 'rounded bg-amber-key/15' : ''
              }`}
            >
              <AnchorRow
                line={line}
                activeIndex={activeIndex}
                onSeek={onSeek}
              />
              <div className="text-cream">{line.lyric || ' '}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnchorRow({
  line,
  activeIndex,
  onSeek,
}: {
  line: SheetLine
  activeIndex: number | null
  onSeek?: (chordIndex: number) => void
}) {
  const placed = layoutAnchors(line.anchors)

  return (
    <div className="whitespace-pre">
      {placed.map(({ anchor, column }, index) => {
        const gap = column - previousEnd(placed, index)

        return (
          <span key={index}>
            {' '.repeat(Math.max(0, gap))}
            <ChordLabel
              anchor={anchor}
              active={anchor.chordIndex === activeIndex}
              onSeek={onSeek}
            />
          </span>
        )
      })}
    </div>
  )
}

/** Cột kết thúc của ký hiệu đứng trước, để tính khoảng trắng cần chèn. */
function previousEnd(
  placed: readonly { anchor: SheetAnchor; column: number }[],
  index: number,
): number {
  if (index === 0) return 0
  const previous = placed[index - 1]
  return previous.column + previous.anchor.symbol.length
}

function ChordLabel({
  anchor,
  active,
  onSeek,
}: {
  anchor: SheetAnchor
  active: boolean
  onSeek?: (chordIndex: number) => void
}) {
  if (anchor.broken) {
    return <span className="text-red-400">{anchor.symbol}</span>
  }

  const style = active
    ? 'rounded bg-amber-key px-0.5 font-semibold text-black'
    : 'text-amber-key'

  if (!onSeek || anchor.chordIndex === null) {
    return <span className={style}>{anchor.symbol}</span>
  }

  const index = anchor.chordIndex

  return (
    <button
      type="button"
      // Quét chuột chia đoạn bắt đầu từ chỗ nhấn, nên đừng để nút nuốt mất.
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => onSeek(index)}
      title="Phát lại từ hợp âm này"
      className={`${style} cursor-pointer hover:underline`}
    >
      {anchor.symbol}
    </button>
  )
}
