import { describe, expect, it } from 'vitest'
import type { ReviewItem } from '../../../shared/persistence/db'
import { createReviewItem } from '../srsEngine'
import {
  answerCurrent,
  currentItem,
  isFinished,
  progressOf,
  sessionAccuracy,
  startSession,
} from '../reviewSession'

const NOW = new Date(2026, 0, 1).getTime()

function item(id: string): ReviewItem {
  return createReviewItem(id, 'chord', 'Nhóm', NOW)
}

/** Trả lời liên tiếp, mỗi phần tử là đúng hay sai. */
function answerAll(items: string[], answers: boolean[]) {
  let state = startSession(items.map(item))
  for (const correct of answers) {
    state = answerCurrent(state, correct)
  }
  return state
}

describe('startSession', () => {
  it('đưa toàn bộ mục vào hàng đợi', () => {
    const state = startSession([item('a'), item('b'), item('c')])

    expect(state.pending).toHaveLength(3)
    expect(state.totalItems).toBe(3)
    expect(state.answered).toBe(0)
  })

  it('buổi rỗng thì coi như đã xong ngay', () => {
    expect(isFinished(startSession([]))).toBe(true)
    expect(currentItem(startSession([]))).toBeNull()
  })

  it('mục đầu tiên là câu đang hỏi', () => {
    expect(currentItem(startSession([item('a'), item('b')]))?.id).toBe('a')
  })
})

describe('trả lời đúng', () => {
  it('mục rời hàng đợi và chuyển sang câu kế tiếp', () => {
    const state = answerCurrent(startSession([item('a'), item('b')]), true)

    expect(currentItem(state)?.id).toBe('b')
    expect(state.finished).toEqual(['a'])
    expect(state.pending).toHaveLength(1)
  })

  it('đúng hết thì buổi kết thúc', () => {
    const state = answerAll(['a', 'b'], [true, true])

    expect(isFinished(state)).toBe(true)
    expect(state.finished).toEqual(['a', 'b'])
  })

  it('đếm đúng số lần trả lời', () => {
    const state = answerAll(['a', 'b'], [true, true])
    expect(state.answered).toBe(2)
    expect(state.correct).toBe(2)
  })
})

describe('trả lời sai', () => {
  it('mục sai được chèn lại vào hàng đợi để gặp lại trong buổi', () => {
    const state = answerCurrent(
      startSession([item('a'), item('b'), item('c'), item('d'), item('e')]),
      false,
    )

    expect(state.pending.map((entry) => entry.id)).toEqual([
      'b',
      'c',
      'd',
      'a',
      'e',
    ])
  })

  it('không chèn lại ngay câu kế tiếp, để đáp án kịp trôi khỏi trí nhớ', () => {
    const state = answerCurrent(
      startSession([item('a'), item('b'), item('c'), item('d')]),
      false,
    )

    expect(currentItem(state)?.id).not.toBe('a')
  })

  it('hàng đợi ngắn thì đưa mục sai xuống cuối', () => {
    const state = answerCurrent(startSession([item('a'), item('b')]), false)

    expect(state.pending.map((entry) => entry.id)).toEqual(['b', 'a'])
  })

  it('chỉ còn một mục thì hỏi lại chính nó', () => {
    const state = answerCurrent(startSession([item('a')]), false)

    expect(isFinished(state)).toBe(false)
    expect(currentItem(state)?.id).toBe('a')
  })

  it('ghi lại mục từng sai, không ghi trùng khi sai nhiều lần', () => {
    let state = startSession([item('a'), item('b')])
    state = answerCurrent(state, false)
    // Trả lời b đúng, rồi gặp lại a và sai tiếp
    state = answerCurrent(state, true)
    state = answerCurrent(state, false)

    expect(state.missed).toEqual(['a'])
  })

  it('sai rồi đúng thì mục vẫn được coi là xong', () => {
    let state = startSession([item('a'), item('b')])
    state = answerCurrent(state, false)
    state = answerCurrent(state, true)
    state = answerCurrent(state, true)

    expect(isFinished(state)).toBe(true)
    expect(state.finished.sort()).toEqual(['a', 'b'])
  })

  it('buổi chỉ kết thúc khi mọi mục đều đã trả lời đúng', () => {
    let state = startSession([item('a'), item('b')])

    // Sai liên tục thì buổi không bao giờ tự kết thúc
    for (let round = 0; round < 10; round += 1) {
      state = answerCurrent(state, false)
      expect(isFinished(state)).toBe(false)
    }
  })
})

describe('progressOf', () => {
  it('đếm theo số mục đã xong, không theo số lần trả lời', () => {
    let state = startSession([item('a'), item('b'), item('c')])

    // Sai hai lần rồi mới đúng: tiến độ vẫn chỉ nhích một nấc
    state = answerCurrent(state, false)
    state = answerCurrent(state, false)
    state = answerCurrent(state, true)

    expect(progressOf(state).done).toBe(1)
    expect(progressOf(state).total).toBe(3)
  })

  it('tỉ lệ tiến độ nằm trong khoảng 0 tới 1', () => {
    const state = answerAll(['a', 'b'], [true])
    expect(progressOf(state).ratio).toBe(0.5)
  })

  it('buổi rỗng coi như đã hoàn thành', () => {
    expect(progressOf(startSession([])).ratio).toBe(1)
  })
})

describe('sessionAccuracy', () => {
  it('chưa trả lời câu nào thì bằng không', () => {
    expect(sessionAccuracy(startSession([item('a')]))).toBe(0)
  })

  it('tính theo tổng số lần trả lời, kể cả lần hỏi lại', () => {
    // Sai một lần rồi đúng hai lần: 2 đúng trên 3 lần
    const state = answerAll(['a', 'b'], [false, true, true])
    expect(sessionAccuracy(state)).toBeCloseTo(2 / 3)
  })
})

describe('không sửa vào trạng thái cũ', () => {
  it('mỗi lần trả lời trả về trạng thái mới', () => {
    const before = startSession([item('a'), item('b')])
    const snapshot = JSON.stringify(before)

    answerCurrent(before, true)

    expect(JSON.stringify(before)).toBe(snapshot)
  })
})
