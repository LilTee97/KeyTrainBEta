import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { SectionMark, SheetAnchor, SheetLine, SongSheet } from './songSheet'
import { isPaired } from '../chordTiming'
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
  /**
   * Chuột phải vào một hợp âm rồi chọn nó chiếm cả ô nhịp hay chia đôi với
   * hợp âm ngay sau.
   *
   * Nhiều bài có ô nhịp hai hợp âm mà bản ghi lời không thể hiện được — chỉ
   * nhìn dòng hợp âm thì không biết hai hợp âm cạnh nhau nằm chung một ô hay
   * hai ô riêng.
   */
  onSetChordSpan?: (chordIndex: number, span: 'full' | 'half') => void
  /** Các hợp âm mở đầu một ô nhịp dùng chung với hợp âm sau nó. */
  pairedChords?: ReadonlySet<number>
}

/** Menu chuột phải đang mở trên hợp âm nào, ở đâu trên màn hình. */
interface ChordMenu {
  chordIndex: number
  x: number
  y: number
}

export function SongSheetView({
  sheet,
  activeIndex,
  onSeek,
  onMark,
  onClearMarks,
  hasMarks = false,
  onSetChordSpan,
  pairedChords,
}: SongSheetViewProps) {
  const container = useRef<HTMLDivElement>(null)
  /** Khoảng dòng đang được bôi đen, chờ chọn loại đoạn. */
  const [pending, setPending] = useState<{ from: number; to: number } | null>(
    null,
  )
  const [menu, setMenu] = useState<ChordMenu | null>(null)

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

  // Bấm ra ngoài hoặc nhấn Esc thì đóng menu chuột phải.
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
                      onContextMenu={
                        onSetChordSpan
                          ? (chordIndex, event) => {
                              event.preventDefault()
                              setMenu({
                                chordIndex,
                                x: event.clientX,
                                y: event.clientY,
                              })
                            }
                          : undefined
                      }
                    />
                    <div className="text-cream">{line.lyric || ' '}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {menu && onSetChordSpan && (
        <ChordContextMenu
          menu={menu}
          paired={
            pairedChords ? isPaired(pairedChords, menu.chordIndex) : false
          }
          isLast={menu.chordIndex >= sheet.chordCount - 1}
          onPick={(span) => {
            onSetChordSpan(menu.chordIndex, span)
            setMenu(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Menu chuột phải trên một hợp âm.
 *
 * Đặt theo toạ độ con trỏ bằng `position: fixed`, vì khung bản nhạc cuộn ngang
 * được — neo vào trong khung thì menu trôi theo lúc cuộn.
 */
function ChordContextMenu({
  menu,
  paired,
  isLast,
  onPick,
}: {
  menu: ChordMenu
  paired: boolean
  /** Hợp âm cuối bài thì không có hợp âm nào phía sau để chia đôi cùng. */
  isLast: boolean
  onPick: (span: 'full' | 'half') => void
}) {
  const options: {
    span: 'full' | 'half'
    label: string
    hint: string
    disabled?: boolean
  }[] = [
    { span: 'full', label: 'Chơi đủ nhịp', hint: 'Chiếm trọn ô nhịp' },
    {
      span: 'half',
      label: 'Chia đôi nhịp với hợp âm sau',
      hint: 'Hai hợp âm chung một ô',
      disabled: isLast && !paired,
    },
  ]

  return (
    <div
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(event) => event.stopPropagation()}
      className="fixed z-50 min-w-44 rounded-lg border border-line bg-ink p-1 shadow-xl"
    >
      {options.map((option) => {
        const active = option.span === (paired ? 'half' : 'full')

        return (
          <button
            key={option.span}
            type="button"
            disabled={option.disabled}
            onClick={() => onPick(option.span)}
            className={`flex w-full items-center justify-between gap-3 rounded px-2.5 py-1.5 text-left text-xs disabled:opacity-30 ${
              active ? 'text-amber-key' : 'text-cream hover:bg-white/8'
            }`}
          >
            <span>{option.label}</span>
            <span className="text-[10px] text-dim">
              {active ? '✓' : option.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function AnchorRow({
  line,
  activeIndex,
  onSeek,
  onContextMenu,
}: {
  line: SheetLine
  activeIndex: number | null
  onSeek?: (chordIndex: number) => void
  onContextMenu?: (chordIndex: number, event: React.MouseEvent) => void
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
              onContextMenu={onContextMenu}
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
  onContextMenu,
}: {
  anchor: SheetAnchor
  active: boolean
  onSeek?: (chordIndex: number) => void
  onContextMenu?: (chordIndex: number, event: React.MouseEvent) => void
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
      onContextMenu={(event) => onContextMenu?.(index, event)}
      title="Bấm để phát từ đây, chuột phải để đổi thời lượng"
      className={`${style} cursor-pointer hover:underline`}
    >
      {anchor.symbol}
    </button>
  )
}
