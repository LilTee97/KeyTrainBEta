import { describe, expect, it } from 'vitest'
import { getChordQuality } from '../../../shared/musicTheory/chordDefinitions'
import type { ReviewItem } from '../../../shared/persistence/db'
import { createReviewItem } from '../../srs/srsEngine'
import type { StreakState } from '../gamificationEngine'
import {
  comboMultiplier,
  difficultyMultiplier,
  evaluateBadges,
  levelForXp,
  levelProgress,
  previousDay,
  tierFor,
  updateStreak,
  xpForAnswer,
  xpNeededForLevel,
} from '../gamificationEngine'

const NOW = new Date(2026, 0, 1).getTime()

describe('difficultyMultiplier', () => {
  it('hợp âm ba là mức cơ bản', () => {
    expect(difficultyMultiplier(getChordQuality('maj')!)).toBe(1)
    expect(difficultyMultiplier(getChordQuality('sus4')!)).toBe(1)
  })

  it('hợp âm bảy khó hơn một chút', () => {
    expect(difficultyMultiplier(getChordQuality('maj7')!)).toBe(1.2)
    expect(difficultyMultiplier(getChordQuality('m7b5')!)).toBe(1.2)
  })

  it('hợp âm mở rộng khó nhất', () => {
    expect(difficultyMultiplier(getChordQuality('m11')!)).toBe(1.5)
    expect(difficultyMultiplier(getChordQuality('9sus4')!)).toBe(1.5)
    expect(difficultyMultiplier(getChordQuality('13b9')!)).toBe(1.5)
  })

  it('hợp âm càng nhiều nốt hệ số càng cao', () => {
    const triad = difficultyMultiplier(getChordQuality('maj')!)
    const seventh = difficultyMultiplier(getChordQuality('maj7')!)
    const extended = difficultyMultiplier(getChordQuality('maj9')!)

    expect(seventh).toBeGreaterThan(triad)
    expect(extended).toBeGreaterThan(seventh)
  })
})

describe('comboMultiplier', () => {
  it('chuỗi ngắn chưa được nhân', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(2)).toBe(1)
  })

  it('tăng dần theo các mốc', () => {
    expect(comboMultiplier(3)).toBe(1.5)
    expect(comboMultiplier(6)).toBe(2)
    expect(comboMultiplier(10)).toBe(3)
  })

  it('không tăng thêm sau mốc cao nhất', () => {
    expect(comboMultiplier(50)).toBe(3)
  })

  it('không bao giờ giảm khi chuỗi dài ra', () => {
    for (let streak = 1; streak < 30; streak += 1) {
      expect(comboMultiplier(streak)).toBeGreaterThanOrEqual(
        comboMultiplier(streak - 1),
      )
    }
  })
})

describe('xpForAnswer', () => {
  it('trả lời sai không được điểm', () => {
    expect(xpForAnswer({ correct: false, difficulty: 1.5, responseMs: 100 })).toBe(0)
  })

  it('câu đúng cơ bản được mười điểm', () => {
    expect(xpForAnswer({ correct: true, responseMs: 5000 })).toBe(10)
  })

  it('thưởng thêm khi trả lời nhanh', () => {
    expect(xpForAnswer({ correct: true, responseMs: 1000 })).toBe(15)
  })

  it('trả lời chậm mà đúng thì không bị trừ', () => {
    // Chậm chỉ mất phần thưởng, không mất điểm cơ bản
    expect(xpForAnswer({ correct: true, responseMs: 60_000 })).toBe(10)
  })

  it('nhân theo độ khó hợp âm', () => {
    expect(
      xpForAnswer({ correct: true, difficulty: 1.5, responseMs: 5000 }),
    ).toBe(15)
  })

  it('nhân theo combo đang có', () => {
    // Chuỗi 10 câu đúng trước đó cho hệ số ba
    expect(
      xpForAnswer({ correct: true, comboStreak: 10, responseMs: 5000 }),
    ).toBe(30)
  })

  it('cộng gộp cả độ khó, thưởng nhanh và combo', () => {
    // (10 × 1.5 + 5) × 2 = 40
    expect(
      xpForAnswer({
        correct: true,
        difficulty: 1.5,
        comboStreak: 6,
        responseMs: 500,
      }),
    ).toBe(40)
  })

  it('câu đúng đầu tiên chưa được nhân combo', () => {
    expect(
      xpForAnswer({ correct: true, comboStreak: 0, responseMs: 5000 }),
    ).toBe(10)
  })

  it('luôn trả về số nguyên', () => {
    for (const difficulty of [1, 1.2, 1.5]) {
      for (const streak of [0, 3, 6, 10]) {
        const xp = xpForAnswer({ correct: true, difficulty, comboStreak: streak })
        expect(Number.isInteger(xp)).toBe(true)
      }
    }
  })
})

describe('cấp độ', () => {
  it('người mới bắt đầu ở cấp một', () => {
    expect(levelForXp(0)).toBe(1)
    expect(xpNeededForLevel(1)).toBe(0)
  })

  it('cần một trăm điểm để lên cấp hai', () => {
    expect(xpNeededForLevel(2)).toBe(100)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
  })

  it('khoảng cách giữa các cấp giãn dần', () => {
    const gaps: number[] = []
    for (let level = 2; level <= 8; level += 1) {
      gaps.push(xpNeededForLevel(level + 1) - xpNeededForLevel(level))
    }

    for (let index = 1; index < gaps.length; index += 1) {
      expect(gaps[index]).toBeGreaterThan(gaps[index - 1])
    }
  })

  it('điểm càng cao cấp càng cao', () => {
    let previousLevel = 1
    for (let xp = 0; xp < 20_000; xp += 250) {
      const level = levelForXp(xp)
      expect(level).toBeGreaterThanOrEqual(previousLevel)
      previousLevel = level
    }
  })

  it('tiến độ trong cấp nằm trong khoảng 0 tới 1', () => {
    for (const xp of [0, 50, 100, 500, 5000]) {
      const progress = levelProgress(xp)
      expect(progress.ratio).toBeGreaterThanOrEqual(0)
      expect(progress.ratio).toBeLessThan(1)
    }
  })

  it('vừa lên cấp thì tiến độ về gần không', () => {
    expect(levelProgress(100).ratio).toBe(0)
    expect(levelProgress(100).level).toBe(2)
  })
})

describe('previousDay', () => {
  it('lùi một ngày trong cùng tháng', () => {
    expect(previousDay('2026-08-14')).toBe('2026-08-13')
  })

  it('lùi qua đầu tháng', () => {
    expect(previousDay('2026-08-01')).toBe('2026-07-31')
  })

  it('lùi qua đầu năm', () => {
    expect(previousDay('2026-01-01')).toBe('2025-12-31')
  })

  it('xử lý đúng năm nhuận', () => {
    expect(previousDay('2028-03-01')).toBe('2028-02-29')
  })
})

describe('updateStreak', () => {
  const fresh: StreakState = {
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastActiveDay: null,
  }

  it('ngày đầu tiên bắt đầu chuỗi từ một', () => {
    const after = updateStreak(fresh, '2026-08-14')
    expect(after.currentStreakDays).toBe(1)
    expect(after.lastActiveDay).toBe('2026-08-14')
  })

  it('luyện tiếp ngày hôm sau thì chuỗi dài thêm', () => {
    const after = updateStreak(
      { currentStreakDays: 3, longestStreakDays: 3, lastActiveDay: '2026-08-13' },
      '2026-08-14',
    )
    expect(after.currentStreakDays).toBe(4)
  })

  it('luyện nhiều lần trong cùng ngày không cộng thêm', () => {
    const state = {
      currentStreakDays: 5,
      longestStreakDays: 5,
      lastActiveDay: '2026-08-14',
    }
    expect(updateStreak(state, '2026-08-14')).toBe(state)
  })

  it('bỏ một ngày là chuỗi đứt và bắt đầu lại', () => {
    const after = updateStreak(
      { currentStreakDays: 9, longestStreakDays: 9, lastActiveDay: '2026-08-12' },
      '2026-08-14',
    )
    expect(after.currentStreakDays).toBe(1)
  })

  it('giữ lại kỷ lục dài nhất kể cả khi chuỗi đứt', () => {
    const after = updateStreak(
      { currentStreakDays: 9, longestStreakDays: 12, lastActiveDay: '2026-08-01' },
      '2026-08-14',
    )
    expect(after.currentStreakDays).toBe(1)
    expect(after.longestStreakDays).toBe(12)
  })

  it('cập nhật kỷ lục khi chuỗi hiện tại vượt qua', () => {
    const after = updateStreak(
      { currentStreakDays: 7, longestStreakDays: 7, lastActiveDay: '2026-08-13' },
      '2026-08-14',
    )
    expect(after.longestStreakDays).toBe(8)
  })

  it('luyện đều nhiều ngày liên tiếp thì chuỗi tăng đúng', () => {
    let state = fresh
    for (let day = 1; day <= 10; day += 1) {
      state = updateStreak(state, `2026-08-${String(day).padStart(2, '0')}`)
    }
    expect(state.currentStreakDays).toBe(10)
  })
})

describe('huy hiệu', () => {
  function item(category: string, reps: number, correct: number): ReviewItem {
    return {
      ...createReviewItem(`chord:${category}-${reps}`, 'chord', category, NOW),
      totalReps: reps,
      totalCorrect: correct,
    }
  }

  it('luyện ít thì chưa có huy hiệu', () => {
    expect(tierFor(5, 1)).toBeNull()
  })

  it('đúng nhiều nhưng luyện ít vẫn chưa có huy hiệu', () => {
    // Chống trường hợp hai câu đúng liên tiếp đã ra vàng
    expect(tierFor(2, 1)).toBeNull()
  })

  it('luyện nhiều nhưng sai nhiều cũng chưa có huy hiệu', () => {
    expect(tierFor(100, 0.4)).toBeNull()
  })

  it('đạt đúng bậc theo số lần luyện và tỉ lệ đúng', () => {
    expect(tierFor(10, 0.6)).toBe('bronze')
    expect(tierFor(25, 0.8)).toBe('silver')
    expect(tierFor(50, 0.9)).toBe('gold')
  })

  it('bậc cao đòi cả hai điều kiện đều đạt', () => {
    // Đủ số lần cho vàng nhưng tỉ lệ chỉ ở mức bạc
    expect(tierFor(50, 0.82)).toBe('silver')
  })

  it('gộp số liệu của mọi mục trong cùng nhóm', () => {
    const badges = evaluateBadges([
      item('Hợp âm bảy', 6, 6),
      item('Hợp âm bảy', 6, 5),
    ])

    const seventh = badges.find((badge) => badge.label === 'Hợp âm bảy')
    expect(seventh?.totalReps).toBe(12)
    expect(seventh?.tier).toBe('bronze')
  })

  it('liệt kê cả nhóm chưa đạt để người học biết còn thiếu bao nhiêu', () => {
    const badges = evaluateBadges([item('Hợp âm ba', 4, 4)])
    const triads = badges.find((badge) => badge.label === 'Hợp âm ba')

    expect(triads?.tier).toBeNull()
    expect(triads?.repsToNextTier).toBe(6)
    expect(triads?.nextTier).toBe('bronze')
  })

  it('gồm cả những nhóm chưa luyện lần nào', () => {
    const badges = evaluateBadges([])
    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) {
      expect(badge.tier).toBeNull()
      expect(badge.totalReps).toBe(0)
    }
  })

  it('gồm cả nhóm ngoài danh sách chuẩn, ví dụ vòng hợp âm', () => {
    const badges = evaluateBadges([item('ii–V–I', 30, 28)])
    const progression = badges.find((badge) => badge.label === 'ii–V–I')

    expect(progression).toBeDefined()
    expect(progression?.tier).toBe('silver')
  })
})
