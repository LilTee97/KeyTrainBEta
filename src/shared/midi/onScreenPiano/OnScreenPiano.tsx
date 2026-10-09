import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { midiToName, octaveOf, pitchClassName, pitchClassOf } from '../../musicTheory/pitch'
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
 * Màu nền phím theo trạng thái. Nốt gợi ý và nốt bấm trúng dùng **cùng một màu**
 * (xanh ngọc) — gợi ý là nền nhạt, bấm trúng là lớp phủ đậm theo lực nhấn
 * (`pressOpacity`) — để người học vừa thấy chỗ cần đặt tay vừa thấy mình đã bấm
 * được tới đâu, nhẹ hay mạnh.
 */
const WHITE_KEY_STYLES = {
  suggested: 'bg-teal-key/45 text-ink/60',
  leftHand: 'bg-left-hand/70 text-ink/70',
  rightHand: 'bg-right-hand/70 text-ink/70',
  reveal: 'bg-amber-key/30 ring-2 ring-inset ring-amber-key text-ink/70',
  // Cũ: text-ink/35 — lúc chỉ phím Đô có tên. Nay mọi phím có tên (2/10/2026) nên đậm hơn cho đọc được.
  idle: 'bg-cream text-ink/55 hover:bg-white',
} as const

const BLACK_KEY_STYLES = {
  suggested: 'bg-teal-key/60 text-ink/80',
  leftHand: 'bg-left-hand text-ink/80',
  rightHand: 'bg-right-hand text-ink/80',
  reveal: 'bg-amber-key/70 ring-2 ring-inset ring-amber-key text-ink/80',
  idle: 'bg-neutral-900 text-cream/70 hover:bg-neutral-800',
} as const

/*
  Phím ĐANG BẤM phủ một lớp màu đậm theo LỰC NHẤN — người dùng 2/10/2026: đàn có cảm ứng lực, "khi chạm nhẹ thì phím
  hiển thị mờ và rõ dần khi mạnh hơn". Tuyến tính theo velocity MIDI 1–127; chạm nhẹ nhất vẫn còn thấy. Màu lớp phủ
  giữ nghĩa cũ: xanh ngọc = trúng nốt hợp âm, cam = không. Đàn tắt cảm ứng lực (Touch Response: Off) thì mọi cú bấm gửi
  cùng một lực → đậm như nhau. Cũ (trước 2/10): phím đang bấm tô màu đặc, không theo lực.

  Lần 2 (2/10/2026): người dùng *"chạm nhẹ quá mờ, chạm mạnh cũng mờ"*. Cũ: sàn 0,15, đặc hẳn ở velocity 127. Nay sàn
  0,45, đặc hẳn từ velocity 96. ĐOÁN — chưa đo lực đàn người dùng gửi ra (cột `phim` của `LuyenTap.json` sẽ có). Lùi
  khi: nhẹ với mạnh trông như nhau → hạ `PRESS_MIN_OPACITY` hay nâng `PRESS_FULL_VELOCITY`.

  Lần 3 (2/10/2026): *"hãy cho lực mạnh màu đậm hơn nữa"* — lực mạnh đã đặc rồi nên phải SẪM màu: từ velocity 64 pha dần
  sang tông sẫm (cam → nâu cam, xanh ngọc → xanh rêu), sẫm nhất 55 % ở velocity ≥ 120; đặc hẳn từ velocity 80. Cũ (lần
  2): đặc từ 96, không sẫm. Lùi khi: lực vừa đã sẫm quá → nâng `DEEP_FROM_VELOCITY`.
*/
const PRESS_MIN_OPACITY = 0.45
const PRESS_FULL_VELOCITY = 80
const DEEP_FROM_VELOCITY = 64
const DEEP_FULL_VELOCITY = 120
const DEEP_MAX = 0.55
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const pressOpacity = (velocity: number) =>
  PRESS_MIN_OPACITY + (1 - PRESS_MIN_OPACITY) * clamp01(velocity / PRESS_FULL_VELOCITY)
/** Phần tông sẫm pha vào màu phím đang bấm, 0 … DEEP_MAX. */
const pressDepth = (velocity: number) =>
  DEEP_MAX * clamp01((velocity - DEEP_FROM_VELOCITY) / (DEEP_FULL_VELOCITY - DEEP_FROM_VELOCITY))
/** Đã sẫm tới mức này thì chữ trên phím đổi sang sáng cho đọc được. */
const LIGHT_TEXT_DEPTH = 0.2

/*
  Tên nốt trên phím — người dùng 2/10/2026: "Các phím trên app cũng nên để tên nốt", rồi "các phím C đã có đánh số, hãy
  cho các phím còn lại cũng đánh số". MỌI phím ghi tên kèm quãng tám: phím trắng rộng ≥ 20 px ghi một dòng (D4), hẹp hơn
  thì chữ trên số dưới cho lọt; phím đen rộng ≥ 9 px ghi chữ trên số dưới (C# / 4), hẹp hơn chữ tràn ra ngoài phím.
  Cũ: lần 1 phím trắng hẹp chỉ ghi chữ cái, phím đen ≥ 13 px chỉ ghi C#; trước nữa chỉ phím Đô.
*/
const ONE_LINE_MIN_PX = 20
const BLACK_NAME_MIN_PX = 9

/**
 * Chiều cao bàn phím theo bề ngang phím trắng (phím thật ~6,4 : 1, ở đây 4,2 : 1 cho đỡ chiếm chỗ), kẹp 110–240 px.
 * Cũ: cố định 150 px — người dùng 2/10/2026 *"khung phím đàn còn quá bé"*.
 */
const KEY_HEIGHT_PER_WIDTH = 4.2
const MIN_KEYBOARD_PX = 110
const MAX_KEYBOARD_PX = 240

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
  /** Đáp án đang hé lộ (game Mưa hợp âm) — viền cam như viên đang đố, khác màu hai tay và khác lớp phủ phím đang bấm. */
  revealNotes?: readonly MidiNote[]
  /**
   * Chiều cao bàn phím. Bỏ trống thì tự theo bề ngang phím trắng (`KEY_HEIGHT_PER_WIDTH`); `'100%'` thì lấp khung cha
   * — chế độ toàn màn hình.
   */
  height?: number | string
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
  revealNotes,
  height,
}: OnScreenPianoProps) {
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const velocities = useMidiStore((state) => state.velocities)
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
  const autoHeight =
    width > 0
      ? Math.round(Math.min(MAX_KEYBOARD_PX, Math.max(MIN_KEYBOARD_PX, whiteWidth * KEY_HEIGHT_PER_WIDTH)))
      : 150

  /** Tên nốt kèm quãng tám: một dòng (D4) khi đủ rộng, không thì chữ trên số dưới. */
  const label = (note: MidiNote, oneLine: boolean) => {
    const name = pitchClassName(pitchClassOf(note), accidentalStyle)
    return oneLine ? (
      `${name}${octaveOf(note)}`
    ) : (
      <>
        <span>{name}</span>
        <span>{octaveOf(note)}</span>
      </>
    )
  }
  const blackNamed = showNoteNames && whiteWidth * 0.62 >= BLACK_NAME_MIN_PX
  // Chữ to theo bề ngang phím: phím to (toàn màn hình, màn rộng) thì chữ to, điện thoại thì nhỏ cho lọt. Cũ: 9 · 8 px.
  const whiteFontPx = Math.round(Math.min(14, Math.max(8, whiteWidth * 0.3)))
  const blackFontPx = Math.round(Math.min(12, Math.max(7, whiteWidth * 0.62 * 0.42)))

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
  const reveal = new Set(revealNotes ?? [])

  /** Nốt thuộc hợp âm — so lớp cao độ, dùng để xác nhận bấm đúng. */
  const chordToneClasses = new Set(chordTones ?? [])
  const isChordTone = (note: MidiNote) =>
    chordToneClasses.has(pitchClassOf(note))

  /**
   * Màu nền của phím, chưa tính lúc đang bấm (đang bấm thì phủ thêm lớp theo lực — `pressLayer`):
   * tay trái / tay phải / thế bấm gợi ý / thường.
   */
  const keyStateOf = (
    note: MidiNote,
  ): keyof typeof WHITE_KEY_STYLES => {
    // Chỉ rõ tay nào bấm nốt nào, ưu tiên hơn cách tô một màu chung.
    if (leftHand.has(note)) return 'leftHand'
    if (rightHand.has(note)) return 'rightHand'
    if (reveal.has(note)) return 'reveal'
    if (suggested.has(note)) return 'suggested'
    return 'idle'
  }

  /** Lớp phủ phím đang bấm: xanh ngọc nếu trúng nốt hợp âm, cam nếu không; đậm theo lực nhấn. */
  const velocityOf = (note: MidiNote) => velocities[note] ?? POINTER_VELOCITY
  /** Đang bấm mạnh tới mức màu đã sẫm — chữ trên phím phải đổi sang sáng. */
  const pressedDark = (note: MidiNote) => isHeld(note) && pressDepth(velocityOf(note)) >= LIGHT_TEXT_DEPTH

  const pressLayer = (note: MidiNote) => {
    if (!isHeld(note)) return null
    const velocity = velocityOf(note)
    const [base, dark] = isChordTone(note)
      ? ['var(--color-teal-key)', '#134e4a']
      : ['var(--color-amber-key)', '#7c2d12']
    const deep = Math.round(pressDepth(velocity) * 100)
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-b-md"
        style={{
          opacity: pressOpacity(velocity),
          backgroundColor: `color-mix(in srgb, ${base} ${100 - deep}%, ${dark} ${deep}%)`,
        }}
      />
    )
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
      style={{ height: height ?? autoHeight }}
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
            className={`relative flex flex-1 items-end justify-center rounded-b-md pb-2 font-mono text-[9px] transition-colors ${
              WHITE_KEY_STYLES[keyStateOf(note)]
            }`}
          >
            {pressLayer(note)}
            {showNoteNames ? (
              <span
                className={`relative flex flex-col items-center leading-none ${pressedDark(note) ? 'text-cream' : ''}`}
                style={{ fontSize: whiteFontPx }}
              >
                {label(note, whiteWidth >= ONE_LINE_MIN_PX)}
              </span>
            ) : null}
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
          {pressLayer(note)}
          {blackNamed ? (
            // Đang bấm thì lớp phủ sáng màu — chữ sáng trên phím đen khó đọc, đổi sang chữ tối.
            <span
              className={`relative flex flex-col items-center leading-none ${
                pressedDark(note) ? 'text-cream' : isHeld(note) ? 'text-ink/80' : ''
              }`}
              style={{ fontSize: blackFontPx }}
            >
              {label(note, false)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
