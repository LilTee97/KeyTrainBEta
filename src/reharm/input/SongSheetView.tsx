import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SectionMark, SheetAnchor, SheetLine, SongSheet } from './songSheet'
import { isPaired } from '../chordTiming'
import { useFlipIntoView } from '../../shared/ui/useFlipIntoView'
import type { LongPressHandlers } from '../../shared/ui/useLongPress'
import { useLongPress } from '../../shared/ui/useLongPress'
import {
  SECTION_KIND_COLORS,
  SECTION_KIND_LABELS,
  flattenLines,
  layoutAnchors,
} from './songSheet'
import type { SongSectionKind } from './songTextParser'
import { readSetting } from '../../shared/persistence/localSettings'
import { getKeyboardRange } from '../../shared/midi/onScreenPiano/layout'

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
  onSetChordSpan?: (
    chordIndex: number,
    span: 'full' | 'half',
    /** Chỉ chỗ vừa bấm, hay mọi chỗ có cùng cặp hợp âm. */
    scope: 'here' | 'all',
  ) => void
  /** Các hợp âm mở đầu một ô nhịp dùng chung với hợp âm sau nó. */
  pairedChords?: ReadonlySet<number>
  /** Chia đôi ở đây thì áp cho bao nhiêu chỗ có cùng cặp hợp âm. */
  pairPlacesAt?: (chordIndex: number) => number
  /**
   * Các hợp âm lướt đặt được ngay **trước** một hợp âm.
   *
   * Không phải chỗ nào cũng chèn được: hợp âm lướt chỉ có nghĩa ở những vị trí
   * hoà âm nhất định — dẫn về bậc năm, khe nửa cung giữa hai hợp âm, chỗ mượn
   * được vòng hai-năm. Menu chỉ hiện những gì thật sự đặt được ở đúng chỗ đó,
   * thay vì bày cả danh sách rồi để người dùng tự đoán.
   */
  passingOptionsFor?: (chordIndex: number) => PassingOption[]
  /** Bật tắt cả loạt: mọi chỗ trong bài có cùng hợp âm lướt này. */
  onTogglePassing?: (id: string) => void
  /** Chèn đúng chỗ vừa bấm, không đụng những chỗ khác cùng loại. */
  onAddPassingHere?: (slotId: string) => void
  /** Gỡ đúng chỗ vừa bấm, giữ nguyên những chỗ khác cùng loại. */
  onRemovePassingHere?: (slotId: string) => void
  /**
   * Chỗ này đang có câu fill không.
   *
   * Rỗng nghĩa là chỗ đó vốn không chêm fill được — mật độ không rơi vào, hoặc
   * ô nhịp đã bị chia đôi cho hợp âm lướt — nên menu không bày mục này ra.
   */
  fillAt?: (chordIndex: number) => boolean | null
  onToggleFill?: (chordIndex: number) => void
  runAt?: (chordIndex: number) => boolean | null
  onToggleRun?: (chordIndex: number) => void
  colorHintAt?: (chordIndex: number) => string | null
  onCycleColor?: (chordIndex: number) => void
  heldMutedAt?: (chordIndex: number) => boolean
  heldBusyAt?: (chordIndex: number) => boolean
  onToggleHeldMute?: (chordIndex: number) => void
  /**
   * Hợp âm này có đang là **mốc chuyển đoạn** không, và chơi ô nối thế nào.
   *
   * Rỗng nghĩa là chưa đánh dấu. Mốc chuyển đoạn được cấp thêm một ô nhịp để
   * người hát ngân cho hết câu, và ô ấy chạy ngón thay vì quạt hợp âm.
   */
  transitionAt?: (chordIndex: number) => TransitionOption | null
  onToggleTransition?: (chordIndex: number) => void
  onSetTransition?: (chordIndex: number, run: TransitionOption) => void
  slashHintAt?: (chordIndex: number) => string | null
  onToggleSlash?: (chordIndex: number) => void
  toolbar?: ReactNode
}

/** Cách chơi ô nối, hiện trên menu chuột phải. */
export interface TransitionOption {
  /**
   * Hợp âm rải chạy mấy quãng tám; `0` là không chạy ngón.
   *
   * Có chỗ chuyển đoạn không cần câu chạy — hợp âm cuối điệp khúc đi thẳng vào
   * giang tấu chẳng hạn, vì ngay sau đó đã là phần ngẫu hứng rồi. Lúc ấy vẫn
   * cần thêm một ô nhịp cho người hát ngân hết câu, nhưng ô đó **đệm bình
   * thường** thay vì nhường chỗ cho câu chạy.
   */
  octaves: number
  /** Im hẳn mấy phách trước vạch nhịp, cho người hát cất giọng. */
  restBeats: number
  delayBeats?: number
}

/** Một hợp âm lướt có thể chèn vào trước một hợp âm. */
export interface PassingOption {
  /** Khoá của cả loạt, do bên gọi tự đặt. */
  id: string
  /** Khoá của riêng chỗ đang bấm. */
  slotId: string
  /** Tên kỹ thuật, ví dụ `Vòng 2-5-1 lướt`. */
  technique: string
  /** Các hợp âm sẽ được chèn, ví dụ `Bm7b5 → E7b9`. */
  chords: string
  /** Chèn một lần là áp cho bao nhiêu chỗ trong bài. */
  places: number
  /** Cả loạt đang bật, dù có thể vài chỗ đã bị gỡ lẻ. */
  applied: boolean
  /** Riêng chỗ đang bấm có đang chèn không. */
  appliedHere: boolean
  /** Chơi sau hợp âm này (như fill), không chèn trước hợp âm sau. */
  after?: boolean
  /**
   * Ai dạy cách này: tên thầy, "Suy luận chung", hay "KeyTrain".
   *
   * Kho có nhiều thầy nên phải nói rõ từng cái của ai — xem `../brain/badge.ts`.
   */
  teacher?: string
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
  pairPlacesAt,
  passingOptionsFor,
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
  transitionAt,
  onToggleTransition,
  onSetTransition,
  slashHintAt,
  onToggleSlash,
  toolbar,
}: SongSheetViewProps) {
  const container = useRef<HTMLDivElement>(null)
  /** Khoảng dòng đang được bôi đen, chờ chọn loại đoạn. */
  const [pending, setPending] = useState<{ from: number; to: number } | null>(
    null,
  )
  const [menu, setMenu] = useState<ChordMenu | null>(null)

  // Trên điện thoại không có chuột phải; nhấn giữ mở đúng bảng lựa chọn đó.
  const bindPress = useLongPress()

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
                  className={`rounded-lg border bg-white/4 px-2.5 py-1 text-xs hover:bg-white/10 ${SECTION_KIND_COLORS[kind].border} ${SECTION_KIND_COLORS[kind].text}`}
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
        {toolbar}
        {sheet.sections.map((section, index) => {
          const tone = SECTION_KIND_COLORS[section.kind]

          return (
          <div
            key={`${section.name}-${index}`}
            className={`border-l-2 pl-3 ${tone.border}`}
          >
            {section.name && (
              <h4
                className={`mb-1.5 font-mono text-[10px] tracking-[0.08em] uppercase ${tone.text}`}
              >
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
                      lyricClass={tone.lyric}
                      activeIndex={activeIndex}
                      fillAt={fillAt}
                      runAt={runAt}
                      pairedChords={pairedChords}
                      onSeek={onSeek}
                      bindMenu={
                        onSetChordSpan
                          ? (chordIndex) =>
                              bindPress(
                                (point) =>
                                  setMenu({
                                    chordIndex,
                                    x: point.x,
                                    y: point.y,
                                  }),
                                () => onSeek?.(chordIndex),
                              )
                          : undefined
                      }
                    />
                  </div>
                )
              })}
            </div>
          </div>
          )
        })}
      </div>

      {menu && (
        <ChordContextMenu
          menu={menu}
          paired={
            pairedChords ? isPaired(pairedChords, menu.chordIndex) : false
          }
          isLast={menu.chordIndex >= sheet.chordCount - 1}
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
export function ChordContextMenu({
  menu,
  paired,
  isLast,
  pairPlaces,
  passing,
  onPick,
  onTogglePassing,
  onAddHere,
  onRemoveHere,
  fill,
  onToggleFill,
  run,
  onToggleRun,
  colorHint,
  onCycleColor,
  heldMuted,
  heldBusy,
  onToggleHeldMute,
  slashHint,
  onToggleSlash,
  transition,
  canMarkTransition,
  onToggleTransition,
  onSetTransition,
  onDelete,
}: {
  menu: ChordMenu
  paired: boolean
  /** Hợp âm cuối bài thì không có hợp âm nào phía sau để chia đôi cùng. */
  isLast: boolean
  /** Chia đôi ở đây thì áp cho bao nhiêu chỗ. */
  pairPlaces: number
  passing: readonly PassingOption[]
  onPick?: (span: 'full' | 'half', scope: 'here' | 'all') => void
  onTogglePassing?: (id: string) => void
  onAddHere?: (slotId: string) => void
  onRemoveHere?: (slotId: string) => void
  /** Chỗ này đang có fill không; rỗng nghĩa là không chêm được. */
  fill: boolean | null
  onToggleFill?: () => void
  run?: boolean | null
  onToggleRun?: () => void
  colorHint?: string | null
  onCycleColor?: () => void
  heldMuted?: boolean
  heldBusy?: boolean
  onToggleHeldMute?: () => void
  slashHint?: string | null
  onToggleSlash?: () => void
  /** Đang là mốc chuyển đoạn không, và chơi ô nối thế nào. */
  transition: TransitionOption | null
  canMarkTransition: boolean
  onToggleTransition?: () => void
  onSetTransition?: (run: TransitionOption) => void
  onDelete?: () => void
}) {
  const applied = passing.filter((option) => option.appliedHere)
  const available = passing.filter((option) => !option.appliedHere)
  const appliedAfter = applied.filter((option) => option.after)
  const appliedBefore = applied.filter((option) => !option.after)
  const availableAfter = available.filter((option) => option.after)
  const availableBefore = available.filter((option) => !option.after)

  /*
    Danh sách đổi theo trạng thái hiện tại, không bày cố định hai dòng.

    Đang chia đôi thì việc cần làm là **trả về đủ nhịp**, và cần cả hai mức:
    chỉ chỗ vừa bấm, hoặc cả loạt. Chưa chia thì chỉ có một việc là chia.
  */
  const { ref, style } = useFlipIntoView<HTMLDivElement>(menu.x, menu.y)

  const options: {
    key: string
    span: 'full' | 'half'
    scope: 'here' | 'all'
    label: string
    hint: string
    active?: boolean
    disabled?: boolean
  }[] = paired
    ? [
        {
          key: 'full-here',
          span: 'full',
          scope: 'here',
          label: 'Chơi đủ nhịp ở đây',
          hint: 'Chỉ chỗ này, các chỗ khác giữ nguyên',
        },
        ...(pairPlaces > 1
          ? [
              {
                key: 'full-all',
                span: 'full' as const,
                scope: 'all' as const,
                label: `Chơi đủ nhịp ở cả ${pairPlaces} chỗ`,
                hint: 'Mọi chỗ có cùng cặp hợp âm',
              },
            ]
          : []),
        {
          key: 'half-active',
          span: 'half',
          scope: 'here',
          label: 'Chia đôi nhịp với hợp âm sau',
          hint: '',
          active: true,
          disabled: true,
        },
      ]
    : [
        {
          key: 'full-active',
          span: 'full',
          scope: 'here',
          label: 'Chơi đủ nhịp',
          hint: '',
          active: true,
          disabled: true,
        },
        {
          key: 'half-here',
          span: 'half',
          scope: 'here',
          label: 'Chia đôi nhịp với hợp âm sau',
          hint: 'Chỉ chỗ này, hai hợp âm chung một ô',
          disabled: isLast,
        },
      ]

  return (
    <div
      ref={ref}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      role="menu"
      aria-label="Tuỳ chọn"
      className="fixed z-50 min-w-44 rounded-lg border border-line bg-ink p-1 shadow-xl"
    >
      {onPick &&
        options.map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={option.disabled}
            onClick={() => onPick(option.span, option.scope)}
            className={`flex w-full items-center justify-between gap-3 rounded px-2.5 py-1.5 text-left text-xs disabled:opacity-40 ${
              option.active ? 'text-amber-key' : 'text-cream hover:bg-white/8'
            }`}
          >
            <span>{option.label}</span>
            <span className="text-[10px] text-dim">
              {option.active ? '✓' : option.hint}
            </span>
          </button>
        ))}

      {canMarkTransition && (
        <>
          <div className="my-1 border-t border-line" />

          <button
            type="button"
            onClick={onToggleTransition}
            className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
          >
            <span className={transition ? 'text-amber-key' : 'text-cream'}>
              {transition
                ? 'Bỏ mốc chuyển đoạn ở đây'
                : 'Đánh dấu mốc chuyển đoạn'}
            </span>
            <span className="text-[10px] text-dim">
              {transition
                ? 'Trả lại một ô nhịp, chơi liền sang đoạn sau'
                : 'Thêm một ô nhịp chạy ngón trước khi sang đoạn sau'}
            </span>
          </button>

          {/*
            Hai thông số chỉ hiện khi đã đánh dấu — bày sẵn lúc chưa có mốc thì
            người dùng chỉnh mà chẳng thấy gì đổi.
          */}
          {transition && onSetTransition && (
            <>
              <p className="px-2.5 pt-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Chạy mấy quãng tám ở ô nối
              </p>
              <div className="flex gap-1 px-2.5 py-1">
                {[0, 1, 2, 3, 4].map((octaves) => {
                  const fits =
                    octaves < 1 ||
                    72 - 12 * octaves >=
                      getKeyboardRange(readSetting('midiKeyboardKeys')).low
                  return (
                    <button
                      key={octaves}
                      type="button"
                      disabled={!fits}
                      onClick={() => onSetTransition({ ...transition, octaves })}
                      className={`flex-1 rounded border px-2 py-1 text-xs ${
                        !fits
                          ? 'cursor-not-allowed opacity-30'
                          : transition.octaves === octaves
                            ? 'border-amber-key bg-amber-key/15 text-amber-key'
                            : 'border-line bg-white/4 text-dim hover:bg-white/8'
                      }`}
                    >
                      {octaves}
                    </button>
                  )
                })}
              </div>

              <p className="px-2.5 pt-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Đệm hợp âm rồi mới chạy ngón
              </p>
              <div className="flex gap-1 px-2.5 py-1">
                {(
                  [
                    [0, 'Không'],
                    [1, '1 phách'],
                    [2, '2 phách'],
                  ] as const
                ).map(([delayBeats, label]) => (
                  <button
                    key={delayBeats}
                    type="button"
                    onClick={() =>
                      onSetTransition({ ...transition, delayBeats })
                    }
                    className={`flex-1 rounded border px-2 py-1 text-xs ${
                      (transition.delayBeats ?? 0) === delayBeats
                        ? 'border-amber-key bg-amber-key/15 text-amber-key'
                        : 'border-line bg-white/4 text-dim hover:bg-white/8'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="px-2.5 pt-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Im mấy phách cuối ô nối
              </p>
              <div className="flex gap-1 px-2.5 py-1">
                {[0, 1, 2, 3, 4].map((restBeats) => (
                  <button
                    key={restBeats}
                    type="button"
                    onClick={() => onSetTransition({ ...transition, restBeats })}
                    className={`flex-1 rounded border px-2 py-1 text-xs ${
                      transition.restBeats === restBeats
                        ? 'border-amber-key bg-amber-key/15 text-amber-key'
                        : 'border-line bg-white/4 text-dim hover:bg-white/8'
                    }`}
                  >
                    {restBeats}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {onToggleHeldMute && (heldBusy || heldMuted) && (
        <>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={onToggleHeldMute}
            className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
          >
            <span className="text-amber-key">
              {heldMuted ? 'Bật lại xoay màu cùng gốc' : 'Bỏ màu xoay (chỉ hợp âm gốc)'}
            </span>
            <span className="text-[10px] text-dim">
              {heldMuted
                ? 'Cadd2 → maj7 → 6 trở lại'
                : 'Không chồng Cadd2 / maj7 trên cùng một chỗ'}
            </span>
          </button>
        </>
      )}

      {onCycleColor && (
        <>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            disabled={colorHint === null}
            onClick={onCycleColor}
            className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8 disabled:opacity-40"
          >
            <span className="text-amber-key">Đổi màu hòa âm</span>
            <span className="text-[10px] text-dim">
              {colorHint
                ? `Chỉ hợp âm này · tiếp theo ${colorHint}`
                : 'Không còn màu khác trong giọng'}
            </span>
          </button>
        </>
      )}

      {onToggleSlash && slashHint && (
        <button
          type="button"
          onClick={onToggleSlash}
          className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
        >
          <span className="text-amber-key">Đổi slash chord</span>
          <span className="text-[10px] text-dim">
            Chỉ hợp âm này · {slashHint}
          </span>
        </button>
      )}

      {(onToggleFill && fill !== null) || (onToggleRun && run !== null) ? (
        <>
          <div className="my-1 border-t border-line" />
          {onToggleFill && fill !== null && !transition && (
            <button
              type="button"
              onClick={onToggleFill}
              className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
            >
              <span className={fill ? 'text-cream' : 'text-amber-key'}>
                {fill ? 'Bỏ Licky Fills' : 'Licky Fills'}
              </span>
              <span className="text-[10px] text-dim">
                Câu lick chêm cuối ô hợp âm này
              </span>
            </button>
          )}
          {onToggleRun && run !== null && !transition && (
            <button
              type="button"
              onClick={onToggleRun}
              className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
            >
              <span className={run ? 'text-cream' : 'text-amber-key'}>
                {run ? 'Bỏ Licky Runs' : 'Licky Runs'}
              </span>
              <span className="text-[10px] text-dim">
                Câu chạy ngón từ sổ Licky
              </span>
            </button>
          )}
        </>
      ) : null}

      {onTogglePassing && passing.length > 0 && (
        <>
          <div className="my-1 border-t border-line" />

          {/*
            Chỗ đã chèn thì việc cần làm là **gỡ ra**, nên tách thành mục riêng
            với chữ nói thẳng, thay vì bắt người dùng đoán rằng bấm lại cái đang
            bật là để tắt.
          */}
          {appliedBefore.length > 0 && (
            <>
              <p className="px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Đang có hợp âm lướt
              </p>

              {appliedBefore.map((option) => (
                <div key={option.id}>
                  {onRemoveHere && (
                    <button
                      type="button"
                      onClick={() => onRemoveHere(option.slotId)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-teal-key">
                        Bỏ {option.chords} ở đây
                      </span>
                      <span className="text-[10px] text-dim">
                        Chỉ chỗ này, các chỗ khác giữ nguyên
                      </span>
                    </button>
                  )}

                  {option.places > 1 && (
                    <button
                      type="button"
                      onClick={() => onTogglePassing(option.id)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-teal-key">
                        Bỏ {option.chords} ở cả {option.places} chỗ
                      </span>
                      <span className="text-[10px] text-dim">
                        Trả lại hoà âm như trước khi chèn
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {availableBefore.length > 0 && (
            <>
              <p className="px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Chèn hợp âm lướt vào trước
              </p>

              {availableBefore.map((option) => (
                <div key={option.id}>
                  {onAddHere && (
                    <button
                      type="button"
                      onClick={() => onAddHere(option.slotId)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-cream">
                        {option.chords} ở đây
                      </span>
                      <span className="text-[10px] text-dim">
                        {option.technique} · chỉ chỗ này
                        {option.teacher && (
                          <span className="ml-1 rounded-sm border border-line px-1 py-px font-mono text-[9px] text-dim">
                            {option.teacher}
                          </span>
                        )}
                      </span>
                    </button>
                  )}

                  {option.places > 1 && (
                    <button
                      type="button"
                      onClick={() => onTogglePassing(option.id)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-cream">
                        {option.chords} ở cả {option.places} chỗ
                      </span>
                      <span className="text-[10px] text-dim">
                        {option.technique} · mọi chỗ có cùng hợp âm đích
                        {option.teacher && (
                          <span className="ml-1 rounded-sm border border-line px-1 py-px font-mono text-[9px] text-dim">
                            {option.teacher}
                          </span>
                        )}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {appliedAfter.length > 0 && (
            <>
              <p className="px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Đang chơi sau hợp âm này
              </p>
              {appliedAfter.map((option) => (
                <div key={option.id}>
                  {onRemoveHere && (
                    <button
                      type="button"
                      onClick={() => onRemoveHere(option.slotId)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-teal-key">
                        Bỏ {option.chords} sau hợp âm này
                      </span>
                      <span className="text-[10px] text-dim">
                        {option.technique} · như câu fill
                        {option.teacher && (
                          <span className="ml-1 rounded-sm border border-line px-1 py-px font-mono text-[9px] text-dim">
                            {option.teacher}
                          </span>
                        )}
                      </span>
                    </button>
                  )}
                  {option.places > 1 && (
                    <button
                      type="button"
                      onClick={() => onTogglePassing(option.id)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-teal-key">
                        Bỏ {option.chords} ở cả {option.places} chỗ
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {availableAfter.length > 0 && (
            <>
              <p className="px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
                Chơi sau hợp âm này (câu fill)
              </p>
              {availableAfter.map((option) => (
                <div key={option.id}>
                  {onAddHere && (
                    <button
                      type="button"
                      onClick={() => onAddHere(option.slotId)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-cream">{option.chords} sau hợp âm này</span>
                      <span className="text-[10px] text-dim">
                        {option.technique} · cuối ô, như câu fill
                        {option.teacher && (
                          <span className="ml-1 rounded-sm border border-line px-1 py-px font-mono text-[9px] text-dim">
                            {option.teacher}
                          </span>
                        )}
                      </span>
                    </button>
                  )}
                  {option.places > 1 && (
                    <button
                      type="button"
                      onClick={() => onTogglePassing(option.id)}
                      className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
                    >
                      <span className="text-cream">
                        {option.chords} ở cả {option.places} chỗ
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}

      {onDelete && (
        <>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
          >
            <span className="text-rose-300">Xóa hợp âm</span>
            <span className="text-[10px] text-dim">Gỡ khỏi vòng</span>
          </button>
        </>
      )}
    </div>
  )
}

function AnchorRow({
  line,
  lyricClass,
  activeIndex,
  fillAt,
  runAt,
  pairedChords,
  onSeek,
  bindMenu,
}: {
  line: SheetLine
  lyricClass: string
  activeIndex: number | null
  fillAt?: (chordIndex: number) => boolean | null
  runAt?: (chordIndex: number) => boolean | null
  pairedChords?: ReadonlySet<number>
  onSeek?: (chordIndex: number) => void
  bindMenu?: (chordIndex: number) => LongPressHandlers
}) {
  const placed = layoutAnchors(line.anchors)
  const clusters: { column: number; items: SheetAnchor[] }[] = []
  for (const { anchor, column } of placed) {
    const last = clusters.at(-1)
    if (last && last.column === column) last.items.push(anchor)
    else clusters.push({ column, items: [anchor] })
  }

  return (
    <div className="relative font-mono">
      <div className="relative min-h-[1.5em]">
        {clusters.map((cluster) => (
          <span
            key={cluster.column}
            className="absolute top-0 whitespace-nowrap"
            style={{ left: `${cluster.column}ch` }}
          >
            {cluster.items.map((anchor, index) => (
              <ChordLabel
                key={`${cluster.column}-${index}`}
                lead={index > 0}
                anchor={anchor}
                active={anchor.chordIndex === activeIndex}
                hasFill={
                  anchor.chordIndex !== null &&
                  (fillAt?.(anchor.chordIndex) ?? false) === true
                }
                hasRun={
                  anchor.chordIndex !== null &&
                  (runAt?.(anchor.chordIndex) ?? false) === true
                }
                halved={
                  anchor.chordIndex !== null &&
                  pairedChords !== undefined &&
                  isPaired(pairedChords, anchor.chordIndex)
                }
                onSeek={onSeek}
                bindMenu={bindMenu}
              />
            ))}
          </span>
        ))}
      </div>
      <div className={`whitespace-pre ${lyricClass}`}>{line.lyric || ' '}</div>
    </div>
  )
}

function ChordLabel({
  anchor,
  active,
  hasFill,
  hasRun,
  halved,
  lead,
  onSeek,
  bindMenu,
}: {
  anchor: SheetAnchor
  active: boolean
  /** Chỗ này đang có câu fill nối sang hợp âm sau. */
  hasFill: boolean
  hasRun?: boolean
  /** Hợp âm này chỉ chiếm nửa ô nhịp. */
  halved: boolean
  lead?: boolean
  onSeek?: (chordIndex: number) => void
  bindMenu?: (chordIndex: number) => LongPressHandlers
}) {
  if (anchor.broken) {
    return <span className="text-red-400">{anchor.symbol}</span>
  }

  /*
    Hợp âm lướt mang màu riêng để nhìn phát ra ngay đâu là hoà âm gốc của bài,
    đâu là phần mình vừa chèn thêm. Nó cũng không bấm được: nó không có chỗ
    riêng trong vòng hợp âm chính nên không phát từ đó được.
  */
  if (anchor.passing) {
    return (
      <span
        className="text-teal-key italic"
        title="Hợp âm lướt chèn thêm"
      >
        {anchor.symbol}
      </span>
    )
  }

  const style = active
    ? 'rounded bg-amber-key px-0.5 font-semibold text-black'
    : 'text-amber-key'

  /*
    Dấu cho biết chỗ này có câu fill: gạch chân chấm chấm.

    Cố ý **không đổi màu** — màu đã dùng hết cho ba việc khác: vàng là hợp âm
    chính, xanh ngọc nghiêng là hợp âm lướt, nền vàng là hợp âm đang vang. Thêm
    màu thứ tư nữa thì không ai nhớ nổi màu nào là gì.
    Gạch chân cũng **không chiếm chỗ ngang**, nên cột hợp âm không bị xô lệch —
    thêm một ký tự đánh dấu thì phần canh cột phải tính lại theo.
  */
  const mark = hasRun
    ? ' underline decoration-double decoration-2 underline-offset-4 text-rose-300'
    : hasFill
      ? ' underline decoration-dotted underline-offset-4'
      : ''
  const held =
    anchor.holdRun || anchor.heldLabel
      ? ' overline decoration-dashed decoration-amber-key/70'
      : ''

  /*
    Hợp âm chia đôi ô nhịp được **đóng khung**.

    Chữ ½ nhỏ phía trên thử trước đó vẫn quá kín đáo, nhìn lướt không bắt được.
    Khung viền là kênh hình ảnh còn trống duy nhất: nghiêng đã dành cho hợp âm
    lướt, gạch chân chấm cho câu fill, nền đặc cho hợp âm đang vang. Khung bao
    quanh nên nhìn phát ra ngay, không lẫn với ba dấu kia.

    Khung cũng đúng nghĩa nhạc: **cái khung là ô nhịp**, nên hai hợp âm đóng
    khung nằm cạnh nhau đọc ra ngay là hai hợp âm chung một ô.

    Dùng `outline` chứ không dùng `border`: `outline-offset` đẩy khung ra ngoài
    lấy khoảng thở mà **không chiếm chỗ ngang**, nên cột hợp âm không bị xô lệch.
  */
  const half = halved
    ? ' outline outline-1 outline-offset-2 outline-amber-key/70 rounded-sm'
    : ''

  if (!onSeek || anchor.chordIndex === null) {
    return (
      <span
        className={`${style}${mark}${held}${half}`}
        title={
          anchor.heldLabel
            ? `Xoay màu cùng gốc: ${anchor.heldLabel}`
            : undefined
        }
      >
        {anchor.symbol}
      </span>
    )
  }

  const index = anchor.chordIndex

  return (
    <button
      type="button"
      onClick={() => onSeek(index)}
      {...bindMenu?.(index)}
      title={
        anchor.heldLabel
          ? `Xoay màu cùng gốc: ${anchor.heldLabel}`
          : hasRun
            ? 'Có câu chạy ngón Licky · bấm để phát từ đây'
            : hasFill
            ? 'Có câu fill · bấm để phát từ đây, chuột phải hoặc nhấn giữ để tắt fill'
            : 'Bấm để phát từ đây, chuột phải hoặc nhấn giữ để đổi thời lượng'
      }
      className={`${lead ? 'ml-1 ' : ''}${style}${mark}${held}${half} touch-manipulation cursor-pointer select-none py-1 hover:decoration-solid`}
    >
      {anchor.symbol}
    </button>
  )
}
