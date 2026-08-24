import { useEffect, useState } from 'react'
import type { ArrangementStep, SourceSection } from './arrangement'
import {
  DEFAULT_INTRO_REST,
  DEFAULT_REST_AFTER,
  stepLabel,
} from './arrangement'
import type { EndingMode } from './endingChord'
import { useFlipIntoView } from '../../shared/ui/useFlipIntoView'
import { useLongPress } from '../../shared/ui/useLongPress'

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
  /** Bước nào đang mở menu chuột phải, và mở ở đâu trên màn hình. */
  const [menu, setMenu] = useState<{
    index: number
    x: number
    y: number
  } | null>(null)

  // Trên điện thoại không có chuột phải; nhấn giữ mở đúng bảng lựa chọn đó.
  const bindPress = useLongPress()

  // Bấm ra ngoài hoặc nhấn Esc thì đóng menu.
  useEffect(() => {
    if (!menu) return

    const close = () => setMenu(null)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null)
    }

    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

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

  const setEnding = (index: number, mode: EndingMode | undefined) =>
    onChange(
      steps.map((step, position) =>
        position === index && step.type === 'section'
          ? { ...step, ending: mode }
          : step,
      ),
    )

  /** Chỗ nghỉ sau đoạn dạo đầu, trước khi bài hát vào. */
  const setIntroRest = (index: number, restAfter: number) =>
    onChange(
      steps.map((step, position) =>
        position === index && step.type === 'intro'
          ? { ...step, restAfter }
          : step,
      ),
    )

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
        để nó chơi hai lần, hoặc chèn giang tấu vào giữa.{' '}
        <span className="text-cream">Chuột phải</span> — hoặc{' '}
        <span className="text-cream">nhấn giữ</span> nếu dùng cảm ứng — vào một
        đoạn để đánh dấu nó là đoạn kết bài.
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
              {...(step.type === 'section'
                ? bindPress((point) =>
                    setMenu({ index, x: point.x, y: point.y }),
                  )
                : {})}
              className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 select-none ${
                step.type === 'section' && step.ending
                  ? 'border-amber-key/50 bg-amber-key/10'
                  : 'border-line bg-black/20'
              }`}
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

              {step.type === 'section' && step.ending && (
                <span
                  title={
                    step.ending === 'colored'
                      ? 'Hợp âm cuối đổi sang màu kết bài'
                      : 'Hợp âm cuối trả về hợp âm ba trơn'
                  }
                  className="rounded border border-amber-key/40 px-1.5 py-0.5 font-mono text-[10px] text-amber-key"
                >
                  {step.ending === 'colored' ? 'kết · có màu' : 'kết · trơn'}
                </span>
              )}

              {step.type === 'intro' && (
                /*
                  Đặt ngay cạnh bước, không giấu trong menu chuột phải.

                  Bản trước để trong menu, nhưng hàng này không gắn xử lý chuột
                  phải nên bấm vào chỉ ra menu của trình duyệt — lựa chọn có mà
                  không ai với tới được. Ô chọn tại chỗ thì thấy ngay, và giống
                  đúng cách bước giang tấu đang làm.
                */
                <select
                  value={step.restAfter ?? DEFAULT_INTRO_REST}
                  onChange={(event) =>
                    setIntroRest(index, Number(event.target.value))
                  }
                  title="Hết dạo đầu thì vào bài ngay hay chừa cho ca sĩ một nhịp lấy hơi"
                  className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream"
                >
                  {/*
                    Nghỉ bốn phách là **một ô nhịp**: ca sĩ lấy hơi rồi vào.
                  */}
                  {[0, 1, 2, 4].map((beats) => (
                    <option key={beats} value={beats}>
                      {beats === 0 ? 'xong vào ngay' : `xong nghỉ ${beats} phách`}
                    </option>
                  ))}
                </select>
              )}

              {step.type === 'interlude' && (
                <>
                  <select
                    value={step.over}
                    onChange={(event) => setOver(index, Number(event.target.value))}
                    title="Giang tấu chơi trên vòng hợp âm của đoạn nào"
                    className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream"
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
                    className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream"
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
                    className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream"
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
                  aria-label={`Đưa bước ${index + 1} lên trên`}
                  title="Lên trên"
                  className="rounded px-1.5 py-0.5 text-xs text-dim hover:bg-white/10 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === steps.length - 1}
                  aria-label={`Đưa bước ${index + 1} xuống dưới`}
                  title="Xuống dưới"
                  className="rounded px-1.5 py-0.5 text-xs text-dim hover:bg-white/10 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Bỏ bước ${index + 1}`}
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

      {menu && (
        <StepMenu
          menu={menu}
          steps={steps}
          onPickEnding={(mode) => {
            setEnding(menu.index, mode)
            setMenu(null)
          }}
        />
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
              restAfter: DEFAULT_REST_AFTER,
            })
          }
          className="rounded-lg border border-teal-key/50 bg-teal-key/10 px-2.5 py-1 text-xs text-teal-key hover:bg-teal-key/20"
        >
          + Giang tấu
        </button>

        {/*
          Dạo đầu luôn đứng trước cả bài, kết bài luôn đứng cuối — không có chỗ
          nào khác cho chúng, nên hai nút này tự đặt đúng chỗ thay vì bắt người
          dùng kéo thả. Nốt do bộ não soạn; não không có luật nào cho phép thì
          bước này im tiếng và bài chạy như không có nó.
        */}
        <button
          type="button"
          onClick={() =>
            onChange([{ type: 'intro', restAfter: DEFAULT_INTRO_REST }, ...steps])
          }
          title="Chèn đoạn dạo đầu vào trước bài. Bộ não chọn vòng và nốt theo luật thầy Kingsley: sus2 hoặc sus4 giải về bậc ba."
          className="rounded-lg border border-amber-key/50 bg-amber-key/10 px-2.5 py-1 text-xs text-amber-key hover:bg-amber-key/20"
        >
          + Dạo đầu
        </button>

        <button
          type="button"
          onClick={() => onChange([...steps, { type: 'outro' }])}
          title="Chèn đoạn kết vào cuối bài. Bộ não rải ngược add2 theo luật thầy Kingsley."
          className="rounded-lg border border-amber-key/50 bg-amber-key/10 px-2.5 py-1 text-xs text-amber-key hover:bg-amber-key/20"
        >
          + Kết bài
        </button>
      </div>
    </div>
  )
}

/**
 * Menu chuột phải của một bước trong danh sách.
 *
 * Tách thành component riêng vì nó cần `useFlipIntoView` — hook không gọi được
 * bên trong nhánh điều kiện của component cha.
 */
function StepMenu({
  menu,
  steps,
  onPickEnding,
}: {
  menu: { index: number; x: number; y: number }
  steps: readonly ArrangementStep[]
  onPickEnding: (mode: EndingMode | undefined) => void
}) {
  const { ref, style } = useFlipIntoView<HTMLDivElement>(menu.x, menu.y)
  const current = steps[menu.index]

  return (
    <div
      ref={ref}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      role="menu"
      aria-label="Tuỳ chọn"
      className="fixed z-50 min-w-52 rounded-lg border border-line bg-ink p-1 shadow-xl"
    >
      <p className="px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
        Đoạn kết bài
      </p>

      {/*
        Ba lựa chọn thay vì một nút bật tắt: kết có màu và kết trơn là hai cách
        kết khác nhau, không phải hai mức của cùng một thứ.
      */}
      {(
        [
          ['colored', 'Kết có màu', 'Hợp âm cuối đổi sang 6/9 hoặc m6'],
          ['plain', 'Kết trơn', 'Gỡ hết màu, còn hợp âm ba'],
          [undefined, 'Không phải đoạn kết', 'Chơi như mọi đoạn khác'],
        ] as const
      ).map(([mode, label, hint]) => {
        const active = current.type === 'section' && current.ending === mode

        return (
          <button
            key={label}
            type="button"
            onClick={() => onPickEnding(mode)}
            className="flex w-full flex-col gap-0.5 rounded px-2.5 py-1.5 text-left text-xs hover:bg-white/8"
          >
            <span className={active ? 'text-amber-key' : 'text-cream'}>
              {active ? `✓ ${label}` : label}
            </span>
            <span className="text-[10px] text-dim">{hint}</span>
          </button>
        )
      })}
    </div>
  )
}
