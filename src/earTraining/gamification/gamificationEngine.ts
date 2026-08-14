import type { ChordQuality } from '../../shared/musicTheory/types'
import type { ProgressRecord, ReviewItem } from '../../shared/persistence/db'
import { QUALITY_GROUPS } from '../shared/qualityGroups'

/**
 * Phần game hoá của buổi ôn tập.
 *
 * Chỉ luồng ôn tập được game hoá — bài luyện tự do và phần tái hòa âm thì
 * không, vì mục đích ở đây là giữ người học quay lại đều đặn với việc ghi nhớ,
 * chứ không phải biến mọi thứ thành trò chơi.
 *
 * Toàn bộ hàm ở đây đều thuần, không đụng cơ sở dữ liệu.
 */

/** Điểm cơ bản cho một câu trả lời đúng. */
const BASE_XP = 10

/** Thưởng thêm khi trả lời nhanh. Trả lời chậm mà đúng thì không bị trừ. */
const FAST_ANSWER_BONUS = 5
const FAST_ANSWER_MS = 2000

/**
 * Hệ số theo độ khó của hợp âm, tính theo số nốt.
 *
 * Dùng số nốt thay vì phân loại nhạc lý vì đây là thước đo khách quan và
 * khớp đúng với cảm nhận: hợp âm càng nhiều nốt càng khó nghe ra.
 */
export function difficultyMultiplier(quality: ChordQuality): number {
  const noteCount = quality.intervals.length
  if (noteCount >= 5) return 1.5
  if (noteCount === 4) return 1.2
  return 1
}

/**
 * Hệ số nhân khi trả lời đúng liên tiếp trong cùng một buổi.
 * Sai một câu là về lại hệ số một.
 */
export function comboMultiplier(streak: number): number {
  if (streak >= 10) return 3
  if (streak >= 6) return 2
  if (streak >= 3) return 1.5
  return 1
}

export interface XpInput {
  correct: boolean
  /** Hệ số độ khó, lấy từ `difficultyMultiplier`. */
  difficulty?: number
  /** Số câu đúng liên tiếp **trước** câu này. */
  comboStreak?: number
  responseMs?: number
}

/** Điểm nhận được cho một câu trả lời. */
export function xpForAnswer({
  correct,
  difficulty = 1,
  comboStreak = 0,
  responseMs = Number.POSITIVE_INFINITY,
}: XpInput): number {
  if (!correct) return 0

  const base = BASE_XP * difficulty
  const bonus = responseMs < FAST_ANSWER_MS ? FAST_ANSWER_BONUS : 0

  // Combo tính theo chuỗi trước câu này, nên câu đầu tiên đã đúng vẫn ở hệ số một.
  return Math.round((base + bonus) * comboMultiplier(comboStreak))
}

/**
 * Tổng điểm cần có để đạt một cấp.
 * Đường cong luỹ thừa 1.5 khiến cấp đầu lên nhanh, cấp sau chậm dần.
 */
export function xpNeededForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(100 * Math.pow(level - 1, 1.5))
}

/** Cấp hiện tại ứng với tổng điểm. Người mới bắt đầu ở cấp 1. */
export function levelForXp(xp: number): number {
  let level = 1
  while (xpNeededForLevel(level + 1) <= xp) level += 1
  return level
}

export interface LevelProgress {
  level: number
  /** Điểm đã tích trong cấp hiện tại. */
  xpIntoLevel: number
  /** Điểm cần để lên cấp kế tiếp. */
  xpForNextLevel: number
  /** Tiến độ trong cấp, 0-1. */
  ratio: number
}

/** Tiến độ lên cấp, dùng cho thanh điểm. */
export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp)
  const floor = xpNeededForLevel(level)
  const ceiling = xpNeededForLevel(level + 1)
  const span = ceiling - floor

  return {
    level,
    xpIntoLevel: xp - floor,
    xpForNextLevel: span,
    ratio: span === 0 ? 0 : (xp - floor) / span,
  }
}

/** Ngày liền trước một ngày, cùng dạng 'YYYY-MM-DD'. */
export function previousDay(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - 1)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export interface StreakState {
  currentStreakDays: number
  longestStreakDays: number
  lastActiveDay: string | null
}

/**
 * Cập nhật chuỗi ngày sau khi người học hoạt động trong ngày `today`.
 *
 * Hoạt động nhiều lần trong cùng một ngày không cộng thêm; bỏ trọn một ngày
 * là chuỗi đứt và bắt đầu lại từ một.
 */
export function updateStreak(state: StreakState, today: string): StreakState {
  if (state.lastActiveDay === today) return state

  const continued = state.lastActiveDay === previousDay(today)
  const currentStreakDays = continued ? state.currentStreakDays + 1 : 1

  return {
    currentStreakDays,
    longestStreakDays: Math.max(state.longestStreakDays, currentStreakDays),
    lastActiveDay: today,
  }
}

/** Bậc huy hiệu, từ thấp lên cao. */
export type BadgeTier = 'bronze' | 'silver' | 'gold'

export const BADGE_TIER_LABELS: Record<BadgeTier, string> = {
  bronze: 'Đồng',
  silver: 'Bạc',
  gold: 'Vàng',
}

/**
 * Điều kiện đạt từng bậc huy hiệu.
 *
 * Đòi cả số lần luyện lẫn tỉ lệ đúng: chỉ nhìn tỉ lệ thì hai câu đúng liên
 * tiếp đã ra vàng, còn chỉ nhìn số lần thì luyện nhiều mà sai nhiều vẫn lên.
 */
const BADGE_THRESHOLDS: { tier: BadgeTier; minReps: number; minAccuracy: number }[] =
  [
    { tier: 'gold', minReps: 50, minAccuracy: 0.9 },
    { tier: 'silver', minReps: 25, minAccuracy: 0.8 },
    { tier: 'bronze', minReps: 10, minAccuracy: 0.6 },
  ]

export interface BadgeStatus {
  /** Định danh nhóm, cũng là định danh huy hiệu. */
  id: string
  label: string
  tier: BadgeTier | null
  totalReps: number
  accuracy: number
  /** Còn thiếu bao nhiêu lần luyện để lên bậc kế tiếp. */
  repsToNextTier: number | null
  nextTier: BadgeTier | null
}

/** Bậc huy hiệu ứng với số liệu tích luỹ của một nhóm. */
export function tierFor(totalReps: number, accuracy: number): BadgeTier | null {
  for (const threshold of BADGE_THRESHOLDS) {
    if (totalReps >= threshold.minReps && accuracy >= threshold.minAccuracy) {
      return threshold.tier
    }
  }
  return null
}

/**
 * Tình trạng huy hiệu của mọi nhóm hợp âm.
 *
 * Gộp số liệu của tất cả các mục thuộc cùng một nhóm, vì huy hiệu trao theo
 * nhóm chứ không theo từng loại hợp âm lẻ.
 */
export function evaluateBadges(items: readonly ReviewItem[]): BadgeStatus[] {
  const totals = new Map<string, { reps: number; correct: number }>()

  for (const item of items) {
    const bucket = totals.get(item.category) ?? { reps: 0, correct: 0 }
    bucket.reps += item.totalReps
    bucket.correct += item.totalCorrect
    totals.set(item.category, bucket)
  }

  const labels = QUALITY_GROUPS.map((group) => group.label)
  // Gồm cả nhóm chưa có trong danh sách chuẩn, ví dụ vòng hợp âm.
  for (const category of totals.keys()) {
    if (!labels.includes(category)) labels.push(category)
  }

  return labels.map((label) => {
    const bucket = totals.get(label) ?? { reps: 0, correct: 0 }
    const accuracy = bucket.reps === 0 ? 0 : bucket.correct / bucket.reps
    const tier = tierFor(bucket.reps, accuracy)

    const nextThreshold = tier
      ? BADGE_THRESHOLDS[
          BADGE_THRESHOLDS.findIndex((entry) => entry.tier === tier) - 1
        ]
      : BADGE_THRESHOLDS[BADGE_THRESHOLDS.length - 1]

    return {
      id: label,
      label,
      tier,
      totalReps: bucket.reps,
      accuracy,
      nextTier: nextThreshold?.tier ?? null,
      repsToNextTier: nextThreshold
        ? Math.max(0, nextThreshold.minReps - bucket.reps)
        : null,
    }
  })
}

/** Bản ghi tiến trình rỗng cho người học mới. */
export function emptyProgress(id: ProgressRecord['id']): ProgressRecord {
  return {
    id,
    xp: 0,
    level: 1,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastActiveDay: null,
    badges: [],
  }
}
