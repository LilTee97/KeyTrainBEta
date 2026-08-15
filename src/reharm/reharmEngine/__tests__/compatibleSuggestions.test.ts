import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import {
  compatibleSuggestions,
  suggestPassingChords,
} from '../passingChordRules'
import { reharmonize } from '../reharmPipeline'

const chords = (text: string) => parseChordInput(text).chords

/** Giọng Đô trưởng, giọng hay dùng nhất trong các test khác. */
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }

describe('lọc gợi ý theo giọng của bài', () => {
  /*
    Vòng hai-năm phụ là để mượn sức hút vào một bậc **có sẵn trong giọng**.
    Mượn vào một hợp âm vốn đã ngoài giọng thì nghe như lạc sang bài khác.
  */
  it('bỏ gợi ý dẫn vào hợp âm ngoài giọng', () => {
    const list = chords('C Ab F G')
    const all = suggestPassingChords(list, {})

    const kept = compatibleSuggestions(all, list, [], C_MAJOR)

    // Lab không thuộc giọng Đô trưởng nên không được nhận hợp âm lướt
    expect(all.some((s) => list[s.insertBeforeIndex].root === 8)).toBe(true)
    expect(kept.some((s) => list[s.insertBeforeIndex].root === 8)).toBe(false)
  })

  it('giữ gợi ý dẫn vào hợp âm trong giọng', () => {
    const list = chords('C Am F G')
    const kept = compatibleSuggestions(
      suggestPassingChords(list, {}),
      list,
      [],
      C_MAJOR,
    )

    expect(kept.length).toBeGreaterThan(0)
    for (const suggestion of kept) {
      expect([0, 2, 4, 5, 7, 9, 11]).toContain(
        list[suggestion.insertBeforeIndex].root,
      )
    }
  })

  it('bản thân hợp âm lướt vẫn được phép ngoài giọng', () => {
    // Đó chính là chỗ hay của nó — chỉ hợp âm đích mới phải trong giọng
    const list = chords('C Am F G')
    const kept = compatibleSuggestions(
      suggestPassingChords(list, {}),
      list,
      [],
      C_MAJOR,
    )

    const outside = kept.flatMap((s) => s.chords).filter((c) => {
      return ![0, 2, 4, 5, 7, 9, 11].includes(c.root)
    })
    expect(outside.length).toBeGreaterThan(0)
  })

  it('chưa dò được giọng thì không lọc theo giọng', () => {
    const list = chords('C Ab F G')
    const all = suggestPassingChords(list, {})

    expect(compatibleSuggestions(all, list, [], null)).toHaveLength(all.length)
  })
})

describe('lọc gợi ý theo những gì đã chèn', () => {
  const list = chords('C Am F G Em Dm G7 C')
  const all = suggestPassingChords(list, {})

  it('khe đã chèn thì không hiện gợi ý nào nữa', () => {
    const accepted = all.filter((s) => s.insertBeforeIndex === 4)
    const kept = compatibleSuggestions(all, list, [accepted[0]], C_MAJOR)

    expect(kept.some((s) => s.insertBeforeIndex === 4)).toBe(false)
  })

  it('hai khe sát bên khe đã chèn cũng biến mất', () => {
    /*
      Hợp âm lướt mượn nửa ô nhịp của hợp âm đứng trước, nên chèn ở hai khe
      liền nhau sẽ làm hợp âm ở giữa vừa bị cắt còn nửa ô vừa bị kẹp giữa hai
      cụm hợp âm lướt.
    */
    const accepted = all.filter((s) => s.insertBeforeIndex === 4)
    const kept = compatibleSuggestions(all, list, [accepted[0]], C_MAJOR)

    expect(kept.some((s) => s.insertBeforeIndex === 3)).toBe(false)
    expect(kept.some((s) => s.insertBeforeIndex === 5)).toBe(false)
  })

  it('khe xa hơn vẫn còn dùng được', () => {
    const accepted = all.filter((s) => s.insertBeforeIndex === 4)
    const kept = compatibleSuggestions(all, list, [accepted[0]], C_MAJOR)

    expect(kept.some((s) => s.insertBeforeIndex >= 6)).toBe(true)
  })

  it('danh sách co lại dần sau mỗi lần chèn', () => {
    const first = compatibleSuggestions(all, list, [], C_MAJOR)
    const second = compatibleSuggestions(all, list, [first[0]], C_MAJOR)
    const third = compatibleSuggestions(
      all,
      list,
      [first[0], second[0]],
      C_MAJOR,
    )

    expect(second.length).toBeLessThan(first.length)
    expect(third.length).toBeLessThan(second.length)
  })
})

describe('đường ống trả về danh sách đã lọc', () => {
  it('chấp nhận một gợi ý thì các khe sát bên biến mất khỏi kết quả', () => {
    const list = chords('C Am F G Em Dm G7 C')

    const before = reharmonize(list, { key: C_MAJOR })
    const target = before.passingSuggestions.find(
      (suggestion) => suggestion.insertBeforeIndex === 4,
    )!

    const after = reharmonize(list, {
      key: C_MAJOR,
      acceptedPassing: [target],
    })

    for (const slot of [3, 4, 5]) {
      expect(
        after.passingSuggestions.some((s) => s.insertBeforeIndex === slot),
      ).toBe(false)
    }
    expect(after.passingSuggestions.length).toBeLessThan(
      before.passingSuggestions.length,
    )
  })
})
