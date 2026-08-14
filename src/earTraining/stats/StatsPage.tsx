import { useCallback, useEffect, useState } from 'react'
import type { StatsEvent } from '../../shared/persistence/db'
import {
  clearPracticeData,
  dayKeyOf,
  statsEventsForDay,
} from '../../shared/persistence/db'
import type { CategorySummary, Summary } from './statsAggregation'
import {
  filterByKind,
  percentOf,
  summarizeByCategory,
  summarizeTotals,
} from './statsAggregation'
import { notifyStatsChanged, useStatsStore } from './statsStore'

/** Thanh tỉ lệ đúng, màu đổi theo mức thành thạo. */
function AccuracyBar({ accuracy }: { accuracy: number }) {
  const percent = Math.round(accuracy * 100)
  const color =
    percent >= 85
      ? 'bg-teal-key'
      : percent >= 60
        ? 'bg-amber-key'
        : 'bg-rose-400'

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function TotalsCard({ title, summary }: { title: string; summary: Summary }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-black/25 p-4">
      <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
        {title}
      </h3>

      {summary.total === 0 ? (
        <p className="text-sm text-dim">Chưa có dữ liệu.</p>
      ) : (
        <>
          <p className="mb-1">
            <span className="font-serif text-3xl font-semibold text-amber-key">
              {percentOf(summary)}%
            </span>
            <span className="ml-2 font-mono text-xs text-dim">
              {summary.correct}/{summary.total} câu
            </span>
          </p>
          <AccuracyBar accuracy={summary.accuracy} />
          <p className="mt-2 font-mono text-[11px] text-dim">
            trung bình {(summary.averageResponseMs / 1000).toFixed(1)}s mỗi câu
          </p>
        </>
      )}
    </div>
  )
}

function CategoryTable({ rows }: { rows: CategorySummary[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-dim">Chưa có dữ liệu.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.category}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-sm text-cream">{row.category}</span>
            <span className="font-mono text-[11px] text-dim">
              {percentOf(row)}% · {row.correct}/{row.total}
            </span>
          </div>
          <AccuracyBar accuracy={row.accuracy} />
        </div>
      ))}
    </div>
  )
}

export function StatsPage() {
  const revision = useStatsStore((state) => state.revision)
  const [events, setEvents] = useState<StatsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const today = dayKeyOf()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEvents(await statsEventsForDay(today))
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [today])

  // Tải lại mỗi khi có câu trả lời mới được ghi.
  useEffect(() => {
    void load()
  }, [load, revision])

  const chordEvents = filterByKind(events, 'chord')
  const progressionEvents = filterByKind(events, 'progression')

  const handleReset = async () => {
    await clearPracticeData()
    setConfirmingReset(false)
    notifyStatsChanged()
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Thống kê hôm nay</h2>
        <span className="font-mono text-xs text-dim">{today}</span>
      </div>

      {loading ? (
        <p className="text-sm text-dim">Đang tải…</p>
      ) : events.length === 0 ? (
        <p className="text-sm leading-relaxed text-dim">
          Hôm nay chưa luyện câu nào. Vào tab Luyện tai hoặc Vòng hợp âm để bắt
          đầu — mọi câu trả lời sẽ được ghi lại ở đây.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <TotalsCard title="Tất cả" summary={summarizeTotals(events)} />
            <TotalsCard
              title="Hợp âm rời"
              summary={summarizeTotals(chordEvents)}
            />
            <TotalsCard
              title="Vòng hợp âm"
              summary={summarizeTotals(progressionEvents)}
            />
          </div>

          <div>
            <h3 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
              Theo nhóm hợp âm · nhóm yếu nhất xếp đầu
            </h3>
            <CategoryTable rows={summarizeByCategory(chordEvents)} />
          </div>

          {progressionEvents.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
                Theo vòng hợp âm
              </h3>
              <CategoryTable rows={summarizeByCategory(progressionEvents)} />
            </div>
          )}
        </>
      )}

      <div className="border-t border-line pt-5">
        {confirmingReset ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-rose-300">
              Xoá sạch lịch sử luyện tập và tiến trình? Không khôi phục được.
            </span>
            <button
              type="button"
              onClick={() => void handleReset()}
              className="rounded-lg bg-rose-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Xoá thật
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
            >
              Thôi
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim hover:bg-white/6"
          >
            Đặt lại thống kê
          </button>
        )}
      </div>
    </section>
  )
}
