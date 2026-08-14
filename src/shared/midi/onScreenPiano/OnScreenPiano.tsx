import { useCallback, useEffect, useRef } from 'react'
import { midiToName, pitchClassOf } from '../../musicTheory/pitch'
import type { AccidentalStyle, MidiNote } from '../../musicTheory/types'
import { useMidiStore } from '../midiStore'
import { buildKeyboardLayout } from './layout'

/** Lực nhấn cố định cho nốt bấm bằng chuột hoặc cảm ứng. */
const POINTER_VELOCITY = 90

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
   * Nốt cần chỉ cho người học, ví dụ đáp án của một câu luyện tập.
   * Nốt đang bấm vẫn được tô đè lên, để thấy rõ mình bấm trúng chỗ nào.
   */
  highlightNotes?: readonly MidiNote[]
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
}: OnScreenPianoProps) {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const noteOn = useMidiStore((state) => state.noteOn)
  const noteOff = useMidiStore((state) => state.noteOff)

  const { whiteKeys, blackKeys } = buildKeyboardLayout(lowNote, highNote)

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

  // Chỉ so lớp cao độ, không so quãng tám: người học bấm đúng hợp âm ở
  // quãng tám khác vẫn phải thấy phím của mình sáng lên.
  const highlightClasses = new Set(
    (highlightNotes ?? []).map((note) => pitchClassOf(note)),
  )
  const isHighlighted = (note: MidiNote) =>
    highlightClasses.has(pitchClassOf(note))

  const keyHandlers = (note: MidiNote) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) =>
      handlePointerDown(event, note),
    onPointerEnter: () => handlePointerEnter(note),
    onPointerLeave: () => handlePointerLeave(note),
  })

  return (
    <div
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
              isHeld(note)
                ? 'bg-amber-key text-ink'
                : isHighlighted(note)
                  ? 'bg-teal-key text-ink'
                  : 'bg-cream text-ink/35 hover:bg-white'
            }`}
          >
            {showNoteNames && pitchClassOf(note) === 0
              ? midiToName(note, accidentalStyle)
              : ''}
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
          className={`absolute top-0 h-[62%] -translate-x-1/2 rounded-b-md border border-black/60 transition-colors ${
            isHeld(note)
              ? 'bg-amber-key'
              : isHighlighted(note)
                ? 'bg-teal-key'
                : 'bg-neutral-900 hover:bg-neutral-800'
          }`}
        />
      ))}
    </div>
  )
}
