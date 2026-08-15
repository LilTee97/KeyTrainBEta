import type { SheetAnchor, SheetLine, SongSheet } from './songSheet'
import { layoutAnchors } from './songSheet'

/**
 * Bản nhạc: lời bài hát với hợp âm **đã tái hoà âm** ghi trên đầu, và hợp âm
 * đang vang thì sáng lên.
 *
 * Trình bày bằng phông đều và khoảng trắng thật, đúng cách các trang hợp âm
 * làm — nhờ vậy cột hợp âm khớp với chữ, và người dùng copy ra chỗ khác vẫn
 * giữ được canh cột.
 */

interface SongSheetViewProps {
  sheet: SongSheet
  /** Hợp âm đang vang, đếm từ 0. Rỗng nghĩa là đang không phát. */
  activeIndex: number | null
  /** Bấm vào một hợp âm thì phát lại từ đúng chỗ đó. */
  onSeek?: (chordIndex: number) => void
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
      onClick={() => onSeek(index)}
      title="Phát lại từ hợp âm này"
      className={`${style} cursor-pointer hover:underline`}
    >
      {anchor.symbol}
    </button>
  )
}

export function SongSheetView({
  sheet,
  activeIndex,
  onSeek,
}: SongSheetViewProps) {
  if (sheet.sections.length === 0) return null

  return (
    <div className="flex flex-col gap-4 overflow-x-auto rounded-lg border border-line bg-black/25 p-4 font-mono text-xs leading-relaxed">
      {sheet.sections.map((section, index) => (
        <div key={`${section.name}-${index}`}>
          {section.name && (
            <h4 className="mb-1.5 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
              {section.name}
            </h4>
          )}

          <div className="flex flex-col gap-2">
            {section.lines.map((line, position) => (
              <div key={position}>
                <AnchorRow
                  line={line}
                  activeIndex={activeIndex}
                  onSeek={onSeek}
                />
                <div className="text-cream">{line.lyric || ' '}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
