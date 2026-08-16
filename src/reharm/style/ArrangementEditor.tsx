import type { ArrangementStep, SourceSection } from './arrangement'
import { DEFAULT_REST_AFTER, stepLabel } from './arrangement'

/**
 * Danh sách thứ tự chơi: đoạn nào trước, đoạn nào lặp lại, kết ở đâu.
 *
 * Tách khỏi bản nhạc vì hai thứ trả lời hai câu hỏi khác nhau. Bản nhạc nói
 * **mỗi đoạn có hợp âm gì**; danh sách này nói **chơi chúng theo thứ tự nào**.
 * Gộp lại thì không diễn tả nổi đoạn điệp khúc chơi hai lần, vì trên lời nó
 * chỉ được viết một lần.
 */

interface ArrangementEditorProps {
  sources: readonly SourceSection[]
  steps: readonly ArrangementStep[]
  onChange: (steps: ArrangementStep[]) => void
}

export function ArrangementEditor({
  sources,
  steps,
  onChange,
}: ArrangementEditorProps) {
  if (sources.length === 0) return null

  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return

    const next = [...steps]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const remove = (index: number) =>
    onChange(steps.filter((_, position) => position !== index))

  const add = (step: ArrangementStep) => onChange([...steps, step])

  const setRestAfter = (index: number, restAfter: number) =>
    onChange(
      steps.map((step, position) =>
        position === index && step.type === 'interlude'
          ? { ...step, restAfter }
          : step,
      ),
    )

  const setLoops = (index: number, loops: number) =>
    onChange(
      steps.map((step, position) =>
        position === index && step.type === 'interlude'
          ? { ...step, loops }
          : step,
      ),
    )

  const setOver = (index: number, over: number) =>
    onChange(
      steps.map((step, position) =>
        position === index && step.type === 'interlude'
          ? { ...step, over }
          : step,
      ),
    )

  return (
    <div className="rounded-xl border border-line bg-white/3 p-4">
      <h3 className="mb-1 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        Thứ tự chơi
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-dim">
        Bài chơi theo đúng danh sách này rồi{' '}
        <span className="text-cream">dừng ở bước cuối</span>. Thêm lại một đoạn
        để nó chơi hai lần, hoặc chèn giang tấu vào giữa.
      </p>

      {steps.length === 0 ? (
        <p className="mb-3 rounded-lg border border-line bg-black/20 px-3 py-2 text-xs text-dim">
          Chưa có bước nào — thêm ít nhất một đoạn thì mới có gì để phát.
        </p>
      ) : (
        <ol className="mb-3 flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-black/20 px-3 py-2"
            >
              <span className="w-5 font-mono text-[11px] text-dim">
                {index + 1}.
              </span>

              <span
                className={`text-xs ${
                  step.type === 'interlude' ? 'text-teal-key' : 'text-cream'
                }`}
              >
                {stepLabel(step, sources)}
              </span>

              {step.type === 'interlude' && (
                <>
                  <select
                    value={step.over}
                    onChange={(event) => setOver(index, Number(event.target.value))}
                    title="Giang tấu chơi trên vòng hợp âm của đoạn nào"
                    className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream outline-none"
                  >
                    {sources.map((source, position) => (
                      <option key={position} value={position}>
                        vòng {source.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={step.loops}
                    onChange={(event) =>
                      setLoops(index, Number(event.target.value))
                    }
                    title="Lặp mấy lượt"
                    className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream outline-none"
                  >
                    {[1, 2, 3, 4].map((count) => (
                      <option key={count} value={count}>
                        ×{count}
                      </option>
                    ))}
                  </select>

                  {/*
                    Nghỉ trọn ô nhịp thì câu quay đầu bị bỏ, vì nó chẳng còn
                    dẫn vào đâu. Nghỉ ngắn hơn thì giữ — một hai phách chỉ là
                    chỗ lấy hơi, tai vẫn nối được câu dẫn với hợp âm đến sau.
                  */}
                  <select
                    value={step.restAfter ?? DEFAULT_REST_AFTER}
                    onChange={(event) =>
                      setRestAfter(index, Number(event.target.value))
                    }
                    title="Im mấy phách sau khi hết ngẫu hứng, trước khi vào đoạn sau"
                    className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream outline-none"
                  >
                    {[0, 1, 2, 4].map((beats) => (
                      <option key={beats} value={beats}>
                        {beats === 0
                          ? 'xong vào ngay'
                          : `xong nghỉ ${beats} phách`}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  title="Lên trên"
                  className="rounded px-1.5 py-0.5 text-xs text-dim hover:bg-white/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === steps.length - 1}
                  title="Xuống dưới"
                  className="rounded px-1.5 py-0.5 text-xs text-dim hover:bg-white/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  title="Bỏ bước này"
                  className="rounded px-1.5 py-0.5 text-xs text-dim hover:bg-white/10"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
          <li className="px-3 py-1 font-mono text-[11px] text-amber-key">
            ── Kết bài ──
          </li>
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
          Thêm
        </span>

        {sources.map((source, index) => (
          <button
            key={index}
            type="button"
            onClick={() => add({ type: 'section', source: index })}
            className="rounded-lg border border-line bg-white/4 px-2.5 py-1 text-xs text-dim hover:bg-white/8"
          >
            {source.name}
          </button>
        ))}

        <button
          type="button"
          onClick={() =>
            add({
              type: 'interlude',
              // Giang tấu hay chạy trên vòng điệp khúc, nên đoán đoạn cuối trước.
              over: Math.max(0, sources.length - 1),
              /*
                Hai lượt là mặc định vì đó là độ dài thường gặp: một lượt trôi
                qua trước khi người nghe kịp bắt được câu, ba lượt trở lên thì
                bài đứng lại chờ phần ngẫu hứng.
              */
              loops: 2,
            })
          }
          className="rounded-lg border border-teal-key/50 bg-teal-key/10 px-2.5 py-1 text-xs text-teal-key hover:bg-teal-key/20"
        >
          + Giang tấu
        </button>
      </div>
    </div>
  )
}
