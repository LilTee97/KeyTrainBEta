import { SongLibrary } from './persistence/SongLibrary'
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
 *
 * Danh sách bài đã lưu có mặt ở cả hai tab, và đó là chủ ý: ngồi vào tập thì
 * việc đầu tiên là chọn bài, bắt sang tab kia mở rồi quay lại là bắt đi vòng.
 */

export function PracticeHome() {
  const song = usePracticeStore((state) => state.song)
  const requestOpen = usePracticeStore((state) => state.requestOpen)

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Luyện đệm</h2>
        {song && song.timeline.length > 0 ? (
          <p className="text-sm leading-relaxed text-dim">
            Đang tập <span className="text-amber-key">{song.title}</span> — đánh
            sai thì bài đứng lại chờ.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-dim">
            Tập đàn theo đúng phần đệm, câu fill và câu solo mà KeyTrain đã dựng
            — đánh sai thì bài đứng lại chờ.
          </p>
        )}
      </div>

      {/*
        Chọn bài ngay tại đây. Bài mở ra được dựng lại bởi tab Tái hoà âm rồi
        đăng ngược về kho dùng chung, nên phần đệm và câu fill đem tập đúng là
        thứ nghe được ở bên kia, không phải một bản dựng riêng.
      */}
      <SongLibrary
        currentId={song?.id ?? null}
        reloadKey={0}
        onOpen={(snapshot, id, title) => requestOpen({ snapshot, id, title })}
      />

      {song && song.timeline.length > 0 ? (
        <NoteGatedPractice
          timeline={song.timeline}
          voicings={song.voicings}
          beatsPerChord={song.beatsPerChord}
        />
      ) : (
        <div className="rounded-xl border border-line bg-black/25 p-4">
          <p className="text-sm text-dim">
            Chưa có bài nào để tập. Mở một bài đã lưu ở trên, hoặc sang tab{' '}
            <span className="text-cream">Tái hòa âm</span> dán lời bài hát rồi
            quay lại đây.
          </p>
        </div>
      )}
    </section>
  )
}
