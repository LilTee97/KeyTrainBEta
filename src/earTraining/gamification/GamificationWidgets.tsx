import type { BadgeStatus, BadgeTier } from './gamificationEngine'
import {
  BADGE_TIER_LABELS,
  comboMultiplier,
  levelProgress,
} from './gamificationEngine'

/** Thanh điểm và cấp hiện tại. */
export function XpBar({ xp }: { xp: number }) {
  const progress = levelProgress(xp)

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-key font-mono text-sm font-bold text-ink">
        {progress.level}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
            Cấp {progress.level}
          </span>
          <span className="font-mono text-[10px] text-dim">
            {progress.xpIntoLevel}/{progress.xpForNextLevel} điểm
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-amber-key transition-all"
            style={{ width: `${Math.min(1, progress.ratio) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/** Chuỗi ngày luyện liên tiếp. */
export function StreakFlame({ days }: { days: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs ${
        days > 0
          ? 'bg-amber-key/15 text-amber-key'
          : 'bg-white/5 text-dim'
      }`}
      title="Số ngày luyện liên tiếp"
    >
      🔥 {days} ngày
    </span>
  )
}

/** Đồng hồ combo, chỉ hiện khi đang có chuỗi đúng. */
export function ComboMeter({ streak }: { streak: number }) {
  if (streak < 2) return null

  const multiplier = comboMultiplier(streak)

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs ${
        multiplier > 1
          ? 'bg-teal-key/20 text-teal-key'
          : 'bg-white/5 text-dim'
      }`}
    >
      <span className="font-bold">{streak} liên tiếp</span>
      {multiplier > 1 && <span>×{multiplier}</span>}
    </span>
  )
}

const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: 'border-amber-700/60 bg-amber-700/15 text-amber-500',
  silver: 'border-slate-400/60 bg-slate-400/15 text-slate-300',
  gold: 'border-amber-key bg-amber-key/20 text-amber-key',
}

/** Bảng huy hiệu theo nhóm hợp âm. */
export function BadgeCase({ badges }: { badges: BadgeStatus[] }) {
  const earned = badges.filter((badge) => badge.tier !== null)
  const pending = badges.filter((badge) => badge.tier === null)

  return (
    <div className="flex flex-col gap-4">
      {earned.length === 0 ? (
        <p className="text-sm leading-relaxed text-dim">
          Chưa có huy hiệu nào. Luyện đủ mười lần một nhóm với tỉ lệ đúng từ
          60% là có huy hiệu Đồng.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {earned.map((badge) => (
            <span
              key={badge.id}
              className={`rounded-lg border px-3 py-2 ${TIER_STYLES[badge.tier!]}`}
              title={`${badge.totalReps} lần luyện · ${Math.round(badge.accuracy * 100)}% đúng`}
            >
              <span className="block text-xs font-semibold">{badge.label}</span>
              <span className="block font-mono text-[10px] opacity-80">
                {BADGE_TIER_LABELS[badge.tier!]}
              </span>
            </span>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h4 className="mb-2 font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
            Chưa đạt
          </h4>
          <div className="flex flex-wrap gap-2">
            {pending.map((badge) => (
              <span
                key={badge.id}
                className="rounded-lg border border-line bg-white/3 px-3 py-2 text-xs text-dim"
              >
                {badge.label}
                {badge.repsToNextTier !== null && badge.repsToNextTier > 0 && (
                  <span className="ml-2 font-mono text-[10px] opacity-70">
                    còn {badge.repsToNextTier} lần
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
