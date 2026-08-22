import { useEffect, useRef, useState } from 'react'
import { ask, brainReady, brainSummary } from './index'

/**
 * Tab *Mr Hải* — hỏi bộ não PianoBrain bằng tiếng Việt.
 *
 * Chạy hẳn trong máy: kho kiến thức đã gói sẵn lúc dựng, không gọi mô hình
 * đám mây, không cần mạng. Câu trả lời in **nguyên văn** thứ não trả về, kể cả
 * nhãn nguồn `[hai-joseph]` / `[kingsley]` và dòng `[kiểm kê]` — giao diện
 * không được sửa chữ, vì nhãn thầy là thứ giữ cho app khỏi nhận vơ.
 */
const GOI_Y = [
  'fill sus2 sang 3 ballad',
  'câu lót C G Am F',
  'bossa nova tay trái',
  'thầy Hải dạy lick ii-V-I chưa',
] as const

interface Turn {
  from: 'em' | 'thay'
  lines: string[]
}

export function MrHaiPanel() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [summary, setSummary] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  /*
    Ô hỏi để trình duyệt tự giữ chữ, React không cầm.

    Bộ gõ tiếng Việt dựng một chữ qua nhiều phím: "c" rồi "aa" thành "câ" rồi
    "u" thành "câu". Nếu React giữ giá trị ô và ghi đè lại sau mỗi phím thì nó
    cắt ngang lúc bộ gõ đang dựng dở, gõ tiếng Việt hỏng hẳn. Ở đây không cần
    React biết từng phím — chỉ cần đọc câu hỏi đúng một lần lúc bấm Hỏi.
  */
  const box = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSummary(brainReady() ? brainSummary() : 'chưa nạp được kho')
  }, [])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  function send(question: string) {
    const q = question.trim()
    if (!q) return
    setTurns((prev) => [...prev, { from: 'em', lines: [q] }, { from: 'thay', lines: ask(q) }])
    if (box.current) box.current.value = ''
  }

  /*
    `min-w-0` rải khắp bên dưới không phải để cho đẹp.

    Một ô con của flexbox mặc định mang `min-width: auto`, nghĩa là nó **không co
    xuống nhỏ hơn nội dung** bên trong. Não in ra những dòng dài không có khoảng
    trắng để ngắt — id kiểu `tap-01-bai-02-hai-piano-001-bai-02-004` — nên khung
    chat nở rộng hơn khung cha và kéo cả cột theo. Lúc đó `flex-1` của ô nhập
    tính trên bề rộng đã tràn, và ô nhập bị đẩy ra ngoài màn hình hoặc ép còn gần
    như không có bề ngang: nhìn thì thấy, bấm vào thì không trúng.
  */
  return (
    <section className="flex w-full min-w-0 flex-col gap-3">
      <header className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-lg font-semibold">Mr Hải</h2>
        <p className="font-mono text-[11px] text-dim">{summary}</p>
      </header>

      <p className="text-xs text-dim">
        Hỏi bằng tiếng Việt. Đưa vòng hợp âm (<code>C Am F G</code>, <code>1 6 4 5 giọng C</code>), nói
        chỗ ca sĩ nghỉ (<code>ô 3 nghỉ</code>, <code>hát kín</code>), hoặc hỏi kho có gì chưa. Chạy
        trong máy, không cần mạng.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {GOI_Y.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            className="rounded-md border border-line bg-white/3 px-2 py-1 font-mono text-[11px] text-dim hover:bg-white/8"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex max-h-[26rem] min-w-0 flex-col gap-2 overflow-y-auto rounded-lg border border-line bg-black/20 p-3">
        {turns.length === 0 && <p className="text-xs text-dim">Chưa hỏi gì. Bấm một gợi ý ở trên cũng được.</p>}
        {turns.map((turn, index) => (
          <div key={index} className="flex flex-col gap-0.5">
            <p className="font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
              {turn.from === 'em' ? 'Em' : 'Thầy'}
            </p>
            {/* Giữ nguyên khoảng trắng: não canh cột bằng dấu cách. */}
            {/* `break-words` để id dài không kéo giãn cả cột. */}
            <pre className="min-w-0 break-words whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-current">
              {turn.lines.join('\n')}
            </pre>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <form
        className="flex w-full min-w-0 gap-2"
        // Bấm vào khoảng trống quanh ô cũng nhảy vào ô, khỏi phải nhắm đúng.
        onClick={() => box.current?.focus()}
        onSubmit={(event) => {
          event.preventDefault()
          send(box.current?.value ?? '')
        }}
      >
        <input
          ref={box}
          type="text"
          defaultValue=""
          placeholder="Em: câu lót C G Am F ô 3 nghỉ"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white/4 px-3 py-2 text-sm text-cream outline-none focus:border-amber-key"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink"
        >
          Hỏi
        </button>
      </form>
    </section>
  )
}
