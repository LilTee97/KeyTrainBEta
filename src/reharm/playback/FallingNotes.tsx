import type { MidiNote } from '../../shared/musicTheory/types'
import { buildKeyboardLayout, keyPlacement } from '../../shared/midi/onScreenPiano/layout'
import { midiToName } from '../../shared/musicTheory/pitch'
import type { GatedStep } from './noteGatedPlaybackEngine'

/**
 * Nốt rơi xuống bàn phím, kiểu Synthesia.
 *
 * Danh sách tên nốt cho biết **phải bấm gì**, nhưng không cho biết **còn bao
 * lâu nữa** và **nốt nào đi cùng nốt nào**. Nốt rơi trả lời cả hai bằng hình:
 * càng gần vạch đáy càng sắp tới, và những nốt vang cùng lúc nằm cùng một hàng
 * ngang.
 *
 * ## Rơi theo chặng, không theo đồng hồ
 *
 * Ở chế độ chờ đánh đúng nốt, bài **đứng lại** cho tới khi bấm đúng — nên độ
 * cao của mỗi nốt tính theo *khoảng cách phách tới chặng đang chờ*, không tính
 * theo thời gian thật. Chặng đang chờ luôn nằm đúng vạch đáy, và cả khối trượt
 * xuống một nấc mỗi khi qua được một chặng.
 */

/** Nhìn trước bao nhiêu phách. Xa hơn nữa thì nốt chồng lên nhau, đọc không kịp. */
const LOOK_AHEAD_BEATS = 8

/** Chiều cao khung vẽ, tính bằng điểm ảnh. */
const HEIGHT = 160

interface FallingNotesProps {
  steps: readonly GatedStep[]
  /** Chặng đang chờ; các chặng trước đó đã bấm xong. */
  index: number
  /** Phách đang phát — nếu có thì nốt rơi theo đồng hồ, không chờ. */
  nowBeat?: number | null
  lowNote: MidiNote
  highNote: MidiNote
}

export function FallingNotes({
  steps,
  index,
  nowBeat,
  lowNote,
  highNote,
}: FallingNotesProps) {
  const layout = buildKeyboardLayout(lowNote, highNote)
  const origin =
    nowBeat !== undefined && nowBeat !== null
      ? nowBeat
      : steps[index]?.startBeat
  if (origin === undefined) return null

  const upcoming = steps.filter((step) => {
    const away = step.startBeat - origin
    return away >= -0.05 && away <= LOOK_AHEAD_BEATS
  })

  return (
    <div
      className="relative w-full overflow-hidden rounded-t-lg border border-b-0 border-line bg-black/40"
      style={{ height: HEIGHT }}
      role="img"
      aria-label={`Nốt sắp tới: ${upcoming[0]?.notes
        .map((note) => midiToName(note))
        .join(' ')}`}
    >
      {upcoming.map((step, position) =>
        step.notes.map((note) => {
          const place = keyPlacement(layout, note)
          if (!place) return null

          const away = step.startBeat - origin
          /*
            Vạch đáy là chỗ nốt được bấm, nên chặng đang chờ có `away` bằng 0 và
            nằm sát đáy. Nốt xa hơn bị đẩy lên trên theo đúng tỉ lệ phách.
          */
          const bottom = (away / LOOK_AHEAD_BEATS) * HEIGHT

          const isLeft = step.leftNotes.includes(note)
          const waiting = position === 0

          return (
            <div
              key={`${step.startBeat}-${note}`}
              style={{
                left: `${place.left}%`,
                width: `${place.width}%`,
                bottom: `${bottom}px`,
              }}
              className={`absolute flex h-5 items-center justify-center rounded text-[9px] font-semibold ${
                isLeft
                  ? 'bg-left-hand text-ink'
                  : 'bg-right-hand text-ink'
              } ${waiting ? 'ring-2 ring-cream' : 'opacity-70'}`}
            >
              {midiToName(note)}
            </div>
          )
        }),
      )}

      {/*
        Vạch đáy — chỗ nốt chạm tới là lúc phải bấm. Không có nó thì không biết
        nốt đã "tới" hay chưa.
      */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-cream/50" />
    </div>
  )
}
