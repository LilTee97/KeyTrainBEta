import { useEffect, useRef, useState } from 'react'
import type { SectionMark, SheetAnchor, SheetLine, SongSheet } from './songSheet'
import { SECTION_KIND_LABELS, flattenLines, layoutAnchors } from './songSheet'
import type { SongSectionKind } from './songTextParser'

/**
 * Bản nhạc: lời bài hát với hợp âm **đã tái hoà âm** ghi trên đầu, hợp âm đang
 * vang thì sáng lên, và người dùng **quét chuột để tự chia đoạn**.
 *
 * Phần quét chuột đọc thẳng **vùng bôi đen của trình duyệt** chứ không tự dựng
 * cơ chế kéo thả riêng. Bản đầu tự bắt sự kiện chuột và hỏng ngay: trình duyệt
 * vẫn bôi đen chữ như thường, hai thứ giành nhau, mà nhả chuột ngoài khung thì
 * không ai bắt được nên thanh nút chẳng bao giờ hiện. Dùng luôn vùng bôi đen
 * vừa quen tay hơn — nó là cách quét chữ ở mọi chỗ khác — vừa không phải chống
 * lại trình duyệt.
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
  /** Người dùng vừa bôi đen một khoảng dòng và chọn nó là đoạn gì. */
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
  const container = useRef<HTMLDivElement>(null)
  /** Khoảng dòng đang được bôi đen, chờ chọn loại đoạn. */
  const [pending, setPending] = useState<{ from: number; to: number } | null>(
    null,
  )

  const canMark = onMark !== undefined

  /*
    Đọc vùng bôi đen sau mỗi lần nhả chuột. Gắn trên `window` chứ không trên
    khung, vì người dùng hay quét lố ra ngoài rồi mới nhả — gắn trên khung thì
    đúng lúc đó lại không nhận được sự kiện.
  */
  useEffect(() => {
    if (!canMark) return

    const read = () => {
      const root = container.current
      const selection = window.getSelection()
      if (!root || !selection || selection.isCollapsed) return

      const range = selection.getRangeAt(0)
      const indices: number[] = []

      for (const element of root.querySelectorAll('[data-line-index]')) {
        if (range.intersectsNode(element)) {
          indices.push(Number(element.getAttribute('data-line-index')))
        }
      }

      if (indices.length === 0) return
      setPending({ from: Math.min(...indices), to: Math.max(...indices) })
    }

    window.addEventListener('pointerup', read)
    return () => window.removeEventListener('pointerup', read)
  }, [canMark])

  const flat = flattenLines(sheet)
  if (flat.length === 0) return null

  const apply = (kind: SongSectionKind) => {
    if (pending && onMark) onMark({ ...pending, kind })
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }

  const dismiss = () => {
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }

  /** Số thứ tự toàn bài của một dòng, để đánh dấu không phụ thuộc cách chia hiện tại. */
  const indexOf = (line: SheetLine) =>
    flat.findIndex((entry) => entry.line === line)

  return (
    <div className="flex flex-col gap-2">
      {canMark && (
        <div className="flex flex-wrap items-center gap-2">
          {pending ? (
            <>
              <span className="font-mono text-[11px] text-amber-key">
                Đã chọn {pending.to - pending.from + 1} dòng — đánh dấu là:
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
                onClick={dismiss}
                className="rounded-lg border border-line px-2.5 py-1 text-xs text-dim hover:bg-white/8"
              >
                Thôi
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-dim">
                Bôi đen các dòng lời để tự chia phiên khúc, điệp khúc, giang tấu.
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
        ref={container}
        className="flex flex-col gap-4 overflow-x-auto rounded-lg border border-line bg-black/25 p-4 font-mono text-xs leading-relaxed"
      >
        {sheet.sections.map((section, index) => (
          <div key={`${section.name}-${index}`}>
            {section.name && (
              <h4 className="mb-1.5 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                {section.name}
              </h4>
            )}

            <div className="flex flex-col gap-2">
              {section.lines.map((line, position) => {
                const lineIndex = indexOf(line)
                const marked =
                  pending !== null &&
                  lineIndex >= pending.from &&
                  lineIndex <= pending.to

                return (
                  <div
                    key={position}
                    data-line-index={lineIndex}
                    className={marked ? 'rounded bg-amber-key/10' : undefined}
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
        ))}
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
      onClick={() => onSeek(index)}
      title="Phát lại từ hợp âm này"
      className={`${style} cursor-pointer hover:underline`}
    >
      {anchor.symbol}
    </button>
  )
}
