import { useMemo, useState } from 'react'
import type { ParsedSong, SongLine } from './songTextParser'
import { parseSongText } from './songTextParser'

/**
 * Dán lời bài hát có gắn hợp âm, xem trước kết quả đọc, rồi mới nạp vào.
 *
 * Bước **xem trước** là bắt buộc, không phải cho đẹp. Đây là chỗ dễ đọc sai
 * nhất trong cả app: text dán từ các trang hợp âm có khoảng trắng lẫn tab, ký
 * tự lạ, dòng nhạc cụ không lời. Đọc sai mà nuốt luôn thì cả bài lệch hợp âm
 * mà người dùng không biết vì sao — nên phải bày ra cho họ soi trước khi dùng.
 */

const FORMAT_LABELS: Record<ParsedSong['format'], string> = {
  'two-line': 'Hai dòng canh cột',
  chordpro: 'ChordPro (hợp âm trong ngoặc vuông)',
  'chords-only': 'Chỉ có hợp âm, không có lời',
}

const SAMPLE = [
  '[Phiên khúc]',
  '   Am7          D9sus4',
  'Ánh nắng chiều nay rơi xuống phố',
  '   Fmaj7        G7',
  'Còn ai ngồi đó đợi chờ',
  '',
  '[Điệp khúc]',
  '   Cmaj7        Am7',
  'Thôi đừng nhắc lại ngày xưa',
].join('\n')

interface SongTextInputProps {
  /** Nạp vòng hợp âm đã đọc được vào phần tái hoà âm. */
  onUseChords: (chords: string) => void
}

/**
 * Một dòng lời với hợp âm xếp đúng cột phía trên.
 *
 * Dùng phông đều và khoảng trắng thật để cột khớp — đúng cách các trang hợp âm
 * trình bày, và cũng là giả định mà bộ đọc dựa vào.
 */
function PreviewLine({ line }: { line: SongLine }) {
  const chordRow = useMemo(() => {
    let row = ''
    for (const anchor of line.chords) {
      if (anchor.charOffset > row.length) {
        row += ' '.repeat(anchor.charOffset - row.length)
      }
      row += anchor.source + ' '
    }
    return row
  }, [line.chords])

  const broken = line.chords.filter((anchor) => anchor.chord === null)

  return (
    <div className="font-mono text-xs leading-relaxed whitespace-pre">
      <div className={broken.length > 0 ? 'text-red-400' : 'text-amber-key'}>
        {chordRow || ' '}
      </div>
      <div className="text-cream">{line.lyric || ' '}</div>
    </div>
  )
}

export function SongTextInput({ onUseChords }: SongTextInputProps) {
  const [text, setText] = useState('')
  const song = useMemo(() => parseSongText(text), [text])

  const hasContent = song.sections.length > 0

  return (
    <section className="rounded-xl border border-line bg-white/3 p-4">
      <h3 className="mb-1 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        Dán lời bài hát có hợp âm
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-dim">
        Nhận hai định dạng: <span className="text-cream">hai dòng canh cột</span>{' '}
        (dòng hợp âm nằm trên dòng lời) và{' '}
        <span className="text-cream">ChordPro</span> (hợp âm trong ngoặc vuông
        giữa dòng lời). Tên đoạn viết dạng <span className="text-cream">[Điệp khúc]</span>.
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        spellCheck={false}
        placeholder={SAMPLE}
        className="w-full rounded-lg border border-line bg-black/25 p-3 font-mono text-xs leading-relaxed text-cream placeholder:text-dim/50"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setText(SAMPLE)}
          className="rounded-lg border border-line bg-white/4 px-3 py-1.5 text-xs text-dim hover:bg-white/8"
        >
          Điền thử một đoạn mẫu
        </button>

        <button
          type="button"
          disabled={song.chords.length === 0}
          onClick={() =>
            onUseChords(song.chords.map((chord) => chord.symbol).join(' '))
          }
          className="rounded-lg bg-amber-key px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
        >
          Nạp {song.chords.length} hợp âm vào phần tái hoà âm
        </button>

        {hasContent && (
          <span className="font-mono text-[11px] text-dim">
            {FORMAT_LABELS[song.format]} · {song.sections.length} đoạn
          </span>
        )}
      </div>

      {song.warnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/5 px-3 py-2">
          <p className="mb-1 text-xs font-semibold text-red-400">
            {song.warnings.length} cụm không đọc được thành hợp âm
          </p>
          <ul className="flex flex-col gap-0.5">
            {[...new Set(song.warnings)].map((warning) => (
              <li key={warning} className="text-xs leading-relaxed text-dim">
                {warning}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            Chúng vẫn hiện ở phần xem trước nhưng không được nạp vào vòng hợp âm.
          </p>
        </div>
      )}

      {hasContent && (
        <div className="mt-3 flex flex-col gap-4 rounded-lg border border-line bg-black/20 p-3">
          {song.sections.map((section, index) => (
            <div key={`${section.name}-${index}`}>
              {section.name && (
                <h4 className="mb-1.5 font-mono text-[10px] tracking-[0.08em] text-amber-key uppercase">
                  {section.name}
                </h4>
              )}
              <div className="flex flex-col gap-2 overflow-x-auto">
                {section.lines.map((line, position) => (
                  <PreviewLine key={position} line={line} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
