import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { midiToName, pitchClassName, pitchClassOf } from '../../musicTheory/pitch'
import type {
  AccidentalStyle,
  MidiNote,
  PitchClass,
} from '../../musicTheory/types'
import { useMidiStore } from '../midiStore'
import { buildKeyboardLayout } from './layout'

/** Lực nhấn cố định cho nốt bấm bằng chuột hoặc cảm ứng. */
const POINTER_VELOCITY = 90

/**
 * Màu phím theo trạng thái. Nốt gợi ý và nốt bấm trúng dùng **cùng một màu**
 * (xanh ngọc), chỉ khác độ đậm — gợi ý thì nhạt, bấm trúng thì đậm — để
 * người học vừa thấy chỗ cần đặt tay vừa thấy mình đã bấm được tới đâu.
 */
const WHITE_KEY_STYLES = {
  correct: 'bg-teal-key text-ink',
  pressed: 'bg-amber-key text-ink',
  suggested: 'bg-teal-key/45 text-ink/60',
  leftHand: 'bg-left-hand/70 text-ink/70',
  rightHand: 'bg-right-hand/70 text-ink/70',
  // Cũ: text-ink/35 — lúc chỉ phím Đô có tên. Nay mọi phím có tên (2/10/2026) nên đậm hơn cho đọc được.
  idle: 'bg-cream text-ink/55 hover:bg-white',
} as const

const BLACK_KEY_STYLES = {
  correct: 'bg-teal-key text-ink/80',
  pressed: 'bg-amber-key text-ink/80',
  suggested: 'bg-teal-key/60 text-ink/80',
  leftHand: 'bg-left-hand text-ink/80',
  rightHand: 'bg-right-hand text-ink/80',
  idle: 'bg-neutral-900 text-cream/70 hover:bg-neutral-800',
} as const

/*
  Tên nốt trên phím — người dùng 2/10/2026: "Các phím trên app cũng nên để tên nốt". Cũ: chỉ phím Đô (C3, C4 …).
  Phím trắng rộng ≥ 20 px thì ghi đủ tên kèm quãng tám (D4), hẹp hơn (điện thoại) thì chỉ chữ cái — phím Đô vẫn
  kèm quãng tám như cũ để còn mốc. Phím đen rộng ≥ 13 px mới ghi (C#); hẹp hơn thì chữ tràn ra ngoài phím.
*/
const FULL_NAME_MIN_PX = 20
const LETTER_MIN_PX = 9
const BLACK_NAME_MIN_PX = 13

export interface OnScreenPianoProps {
  /** Nốt thấp nhất hiển thị. Mặc định C3. */
  lowNote?: MidiNote
  /** Nốt cao nhất hiển thị. Mặc định C6. */
  highNote?: MidiNote
  /** Cách ghi tên nốt đen trên phím. */
  accidentalStyle?: AccidentalStyle
  /** Ghi tên nốt lên phím trắng. */
  showNoteNames?: boolean
  /**
   * Thế bấm cần chỉ cho người học, theo **nốt tuyệt đối**.
   *
   * Cố tình không so theo lớp cao độ: so lớp cao độ sẽ thắp sáng nốt đó ở
   * mọi quãng tám, khiến một hợp âm bảy sáng mười hai phím thay vì bốn và
   * người học không biết đặt tay ở đâu.
   */
  highlightNotes?: readonly MidiNote[]
  /**
   * Các lớp cao độ thuộc hợp âm đang học.
   *
   * Phím **đang bấm** mà trúng một trong các lớp này sẽ tô cùng màu với đáp
   * án, để xác nhận bấm đúng — kể cả khi bấm ở quãng tám khác với thế bấm
   * đang gợi ý.
   */
  chordTones?: readonly PitchClass[]
  /**
   * Nốt của tay trái và tay phải, tô hai màu khác nhau.
   *
   * Dùng khi cần chỉ rõ tay nào bấm nốt nào — với hợp âm trải rộng thì nhìn
   * một màu duy nhất không biết chia tay ra sao. Có hai prop này thì
   * `highlightNotes` không cần nữa.
   */
  leftHandNotes?: readonly MidiNote[]
  rightHandNotes?: readonly MidiNote[]
}

/**
 * Bàn phím piano bấm được bằng chuột hoặc cảm ứng.
 *
 * Nốt bấm ở đây đổ vào đúng kho trạng thái với đàn MIDI thật, nên mọi phần
 * phía sau không phân biệt nguồn. Ngược lại, nốt bấm trên đàn thật cũng
 * sáng lên ở đây — tiện để đối chiếu khi luyện tập.
 */
export function OnScreenPiano({
  lowNote = 48,
  highNote = 84,
  accidentalStyle = 'sharp',
  showNoteNames = true,
  highlightNotes,
  chordTones,
  leftHandNotes,
  rightHandNotes,
}: OnScreenPianoProps) {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const noteOn = useMidiStore((state) => state.noteOn)
  const noteOff = useMidiStore((state) => state.noteOff)

  const { whiteKeys, blackKeys } = buildKeyboardLayout(lowNote, highNote)

  /* Bề ngang thật của bàn phím — quyết định ghi tên nốt đủ hay gọn (xem FULL_NAME_MIN_PX). */
  const root = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined') return
    setWidth(el.clientWidth)
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const whiteWidth = width / Math.max(1, whiteKeys.length)

  /** Tên ghi trên phím trắng. */
  const whiteLabel = (note: MidiNote) => {
    if (!showNoteNames) return ''
    const isC = pitchClassOf(note) === 0
    if (whiteWidth >= FULL_NAME_MIN_PX || isC) return midiToName(note, accidentalStyle)
    return whiteWidth >= LETTER_MIN_PX ? pitchClassName(pitchClassOf(note), accidentalStyle) : ''
  }
  const blackNamed = showNoteNames && whiteWidth * 0.62 >= BLACK_NAME_MIN_PX

  /** Con trỏ đang được giữ — dùng để rê tay qua nhiều phím liền nhau. */
  const pointerDown = useRef(false)
  /** Các nốt bàn phím ảo đang giữ; không đụng tới nốt đến từ đàn thật. */
  const pressedByPointer = useRef(new Set<MidiNote>())

  const releasePointerNotes = useCallback(() => {
    for (const note of pressedByPointer.current) {
      noteOff(note, 'onscreen')
    }
    pressedByPointer.current.clear()
    pointerDown.current = false
  }, [noteOff])

  useEffect(() => {
    // Nhả chuột ngoài vùng bàn phím thì vẫn phải tắt nốt, nếu không nốt kẹt.
    window.addEventListener('pointerup', releasePointerNotes)
    window.addEventListener('pointercancel', releasePointerNotes)
    return () => {
      window.removeEventListener('pointerup', releasePointerNotes)
      window.removeEventListener('pointercancel', releasePointerNotes)
      releasePointerNotes()
    }
  }, [releasePointerNotes])

  const pressNote = useCallback(
    (note: MidiNote) => {
      if (pressedByPointer.current.has(note)) return
      pressedByPointer.current.add(note)
      noteOn(note, POINTER_VELOCITY, 'onscreen')
    },
    [noteOn],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, note: MidiNote) => {
      // Nhả quyền bắt con trỏ để sự kiện pointerenter còn bắn sang phím khác,
      // nhờ đó rê tay qua nhiều phím mới chạy được (nhất là trên cảm ứng).
      event.currentTarget.releasePointerCapture(event.pointerId)
      pointerDown.current = true
      pressNote(note)
    },
    [pressNote],
  )

  const handlePointerEnter = useCallback(
    (note: MidiNote) => {
      if (pointerDown.current) pressNote(note)
    },
    [pressNote],
  )

  const handlePointerLeave = useCallback(
    (note: MidiNote) => {
      if (!pressedByPointer.current.has(note)) return
      pressedByPointer.current.delete(note)
      noteOff(note, 'onscreen')
    },
    [noteOff],
  )

  const isHeld = (note: MidiNote) => heldNotes.includes(note)

  /** Thế bấm gợi ý — so nốt tuyệt đối, chỉ đúng những phím này. */
  const suggested = new Set(highlightNotes ?? [])
  const leftHand = new Set(leftHandNotes ?? [])
  const rightHand = new Set(rightHandNotes ?? [])

  /** Nốt thuộc hợp âm — so lớp cao độ, dùng để xác nhận bấm đúng. */
  const chordToneClasses = new Set(chordTones ?? [])
  const isChordTone = (note: MidiNote) =>
    chordToneClasses.has(pitchClassOf(note))

  /**
   * Ba trạng thái hiển thị của một phím:
   * - 'correct': đang bấm và trúng nốt của hợp âm
   * - 'pressed': đang bấm nhưng không thuộc hợp âm (hoặc chưa có hợp âm nào)
   * - 'suggested': chưa bấm, nhưng thuộc thế bấm đang được gợi ý
   */
  const keyStateOf = (
    note: MidiNote,
  ): keyof typeof WHITE_KEY_STYLES => {
    if (isHeld(note)) return isChordTone(note) ? 'correct' : 'pressed'
    // Chỉ rõ tay nào bấm nốt nào, ưu tiên hơn cách tô một màu chung.
    if (leftHand.has(note)) return 'leftHand'
    if (rightHand.has(note)) return 'rightHand'
    if (suggested.has(note)) return 'suggested'
    return 'idle'
  }

  const keyHandlers = (note: MidiNote) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) =>
      handlePointerDown(event, note),
    onPointerEnter: () => handlePointerEnter(note),
    onPointerLeave: () => handlePointerLeave(note),
  })

  return (
    <div
      ref={root}
      className="relative w-full touch-none select-none"
      style={{ height: 150 }}
      role="group"
      aria-label="Bàn phím piano ảo"
    >
      {/* Phím trắng xếp liền nhau, chia đều chiều ngang */}
      <div className="flex h-full w-full gap-px">
        {whiteKeys.map(({ note }) => (
          <button
            key={note}
            type="button"
            aria-label={midiToName(note, accidentalStyle)}
            {...keyHandlers(note)}
            className={`flex flex-1 items-end justify-center rounded-b-md pb-2 font-mono text-[9px] transition-colors ${
              WHITE_KEY_STYLES[keyStateOf(note)]
            }`}
          >
            {whiteLabel(note)}
          </button>
        ))}
      </div>

      {/* Phím đen đè lên, tâm phím nằm đúng khe giữa hai phím trắng */}
      {blackKeys.map(({ note, position }) => (
        <button
          key={note}
          type="button"
          aria-label={midiToName(note, accidentalStyle)}
          {...keyHandlers(note)}
          style={{
            left: `${position * 100}%`,
            width: `${(100 / whiteKeys.length) * 0.62}%`,
          }}
          className={`absolute top-0 flex h-[62%] -translate-x-1/2 items-end justify-center rounded-b-md border border-black/60 pb-1 font-mono text-[8px] leading-none transition-colors ${
            BLACK_KEY_STYLES[keyStateOf(note)]
          }`}
        >
          {blackNamed ? pitchClassName(pitchClassOf(note), accidentalStyle) : null}
        </button>
      ))}
    </div>
  )
}
