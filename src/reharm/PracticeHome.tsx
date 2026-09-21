import { ChordOverview } from './input/ChordOverview'
import { SongLibrary } from './persistence/SongLibrary'
import { NoteGatedPractice } from './playback/NoteGatedPractice'
import { usePracticeStore } from './playback/practiceStore'
import { setBpm, useMetronomeStore } from '../shared/audio/metronome'
import { usePlaybackStore } from '../shared/audio/audioEngine'

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
  const grid = usePracticeStore((state) => state.grid)
  const transport = usePracticeStore((state) => state.transport)
  const requestOpen = usePracticeStore((state) => state.requestOpen)
  const bpm = useMetronomeStore((state) => state.bpm)
  const looping = usePlaybackStore((state) => state.looping)
  const positionBeats = usePlaybackStore((state) => state.positionBeats)

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
        <>
          {/*
            NÚT PHÁT CẢ BÀI.

            Tab này trước chỉ có lối tập chờ-đánh-đúng-nốt (`NoteGatedPractice`), không
            có cách nào nghe trọn bài — `showToolbar={false}` tắt luôn thanh phát của
            lưới hợp âm. Muốn nghe thì phải sang tab Tái hoà âm, tức đi vòng đúng thứ
            mà tab này lập ra để khỏi phải làm.

            Gọi `playAll` chứ KHÔNG gọi `playFrom(0)`: `playFrom` tra qua `segments`,
            mà đoạn dạo không đẩy `segments` nào cả nên mốc 0 rơi vào chỗ bài hát vào —
            bỏ mất đoạn dạo.
          */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!transport}
              onClick={() =>
                looping ? transport?.pause() : transport?.playAll()
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
                looping
                  ? 'border border-rose-400/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-amber-key text-ink hover:brightness-110'
              }`}
            >
              {looping ? '■ Dừng' : '▶ Phát cả bài'}
            </button>
            <span className="text-xs text-dim">
              Chơi trọn bài đúng thứ tự đã sắp — có cả dạo đầu, giang tấu và kết.
            </span>
          </div>

          {song.perBeat.length > 0 && (
            <ChordOverview
              perBeat={song.perBeat}
              meter={song.meter}
              bpm={bpm}
              onBpm={setBpm}
              showToolbar={false}
              playEnabled={!!transport}
              onTone={transport?.onTone}
              toneLabel={transport?.toneLabel}
              activeBeat={
                looping
                  ? (transport?.sourceBeat?.(positionBeats) ??
                    Math.floor(
                      positionBeats % Math.max(1, song.perBeat.length),
                    ))
                  : null
              }
              onSeekBeat={transport?.playFrom}
              chordIndexAt={grid?.chordIndexAt}
              chordCount={grid?.chordCount ?? 0}
              pairedChords={grid?.pairedChords}
              pairPlacesAt={grid?.pairPlacesAt}
              passingOptionsFor={grid?.passingOptionsFor}
              onSetChordSpan={grid?.onSetChordSpan}
              onTogglePassing={grid?.onTogglePassing}
              onAddPassingHere={grid?.onAddPassingHere}
              onRemovePassingHere={grid?.onRemovePassingHere}
              fillAt={grid?.fillAt}
              onToggleFill={grid?.onToggleFill}
              cpLick={grid?.cpLick}
              runAt={grid?.runAt}
              onToggleRun={grid?.onToggleRun}
              fillRestAt={grid?.fillRestAt}
              onSetFillRest={grid?.onSetFillRest}
              colorHintAt={grid?.colorHintAt}
              onCycleColor={grid?.onCycleColor}
              slashHintAt={grid?.slashHintAt}
              onToggleSlash={grid?.onToggleSlash}
              leadIn={song.leadIn}
              interlude={song.interlude}
              leadOut={song.leadOut}
              transitionAt={grid?.transitionAt}
              cpBalladTransition={grid?.cpBalladTransition}
              onToggleTransition={grid?.onToggleTransition}
              onSetTransition={grid?.onSetTransition}
              onRemoveChord={grid?.onRemoveChord}
              onDuplicateChord={grid?.onDuplicateChord}
            />
          )}
          <NoteGatedPractice
            timeline={song.timeline}
            voicings={song.voicings}
            beatsPerChord={song.beatsPerChord}
            perBeat={song.perBeat}
          />
        </>
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
