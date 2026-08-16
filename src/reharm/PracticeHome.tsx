import { NoteGatedPractice } from './playback/NoteGatedPractice'
import { usePracticeStore } from './playback/practiceStore'

/**
 * Tab **Luyện đệm**: tập đàn theo bài đã dựng ở tab Tái hoà âm.
 *
 * Tách khỏi tab dựng bài vì đây là **việc khác hẳn**. Lúc dựng, người dùng
 * chỉnh màu hợp âm, sắp thứ tự, đánh dấu đoạn — mắt nhìn chữ. Lúc tập, họ nhìn
 * bàn phím và hai bàn tay. Gộp chung một trang thì lúc tập phải cuộn qua cả
 * chục khung chỉnh sửa mới tới, mà lúc dựng lại vướng một khung to chẳng dùng
 * tới.
 */

export function PracticeHome() {
  const song = usePracticeStore((state) => state.song)

  if (!song || song.timeline.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="mb-1 text-lg font-semibold">Luyện đệm</h2>
          <p className="text-sm leading-relaxed text-dim">
            Tập đàn theo đúng phần đệm, câu fill và câu solo mà KeyTrain đã dựng
            — đánh sai thì bài đứng lại chờ.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-black/25 p-4">
          <p className="text-sm text-dim">
            Chưa có bài nào để tập. Sang tab{' '}
            <span className="text-cream">Tái hòa âm</span> dán lời bài hát hoặc
            mở một bài đã lưu, rồi quay lại đây.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Luyện đệm</h2>
        <p className="text-sm leading-relaxed text-dim">
          Đang tập <span className="text-amber-key">{song.title}</span> — đánh
          sai thì bài đứng lại chờ.
        </p>
      </div>

      <NoteGatedPractice
        timeline={song.timeline}
        voicings={song.voicings}
        beatsPerChord={song.beatsPerChord}
      />
    </section>
  )
}
