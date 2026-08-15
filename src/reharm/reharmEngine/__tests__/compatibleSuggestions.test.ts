import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import {
  compatibleSuggestions,
  groupPassingSuggestions,
  groupsAtSlot,
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

  it('khe đã chèn chỉ còn đúng gợi ý đang dùng, để gỡ ra được', () => {
    /*
      Ẩn luôn cả khe đã chèn thì người dùng không còn đường nào để bỏ nó ra.
      Chỉ các kỹ thuật khác ở cùng khe mới bị ẩn, vì một khe chỉ chèn một thứ.
    */
    const accepted = all.find((s) => s.insertBeforeIndex === 4)!
    const kept = compatibleSuggestions(all, list, [accepted], C_MAJOR)
    const atSlot = kept.filter((s) => s.insertBeforeIndex === 4)

    expect(atSlot).toHaveLength(1)
    expect(atSlot[0].technique).toBe(accepted.technique)
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
    const seed = first.find((s) => s.insertBeforeIndex === 4)!
    const second = compatibleSuggestions(all, list, [seed], C_MAJOR)

    expect(second.length).toBeLessThan(first.length)
  })
})

describe('gom hợp âm lướt thành nhóm', () => {
  /*
    Bày mỗi khe một thẻ thì cùng một hợp âm lướt hiện lên bốn năm lần, mà bấm
    thẻ nào cũng ra cùng một kết quả — vừa rối vừa vô nghĩa. Đơn vị thao tác
    đúng là **nhóm**: một hợp âm lướt và mọi chỗ đặt được nó.
  */
  const list = chords('C Am7 F G C Am7 F G')
  const all = suggestPassingChords(list, {})
  const groups = groupPassingSuggestions(all, list)

  it('mỗi hợp âm lướt chỉ còn một mục', () => {
    const ids = groups.map((group) => group.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mục đó gom đủ mọi chỗ đặt được', () => {
    const iiVIntoAm = groups.find(
      (group) =>
        group.technique === 'secondary-ii-V' &&
        group.chords[0].symbol.startsWith('B'),
    )!

    expect(iiVIntoAm.slots).toEqual([1, 5])
  })

  it('số mục ít hơn hẳn số gợi ý thô', () => {
    expect(groups.length).toBeLessThan(all.length)
  })

  it('hợp âm khác tính chất thì tách nhóm riêng', () => {
    const other = chords('C Am7 F G C Am9 F G')
    const split = groupPassingSuggestions(
      suggestPassingChords(other, {}),
      other,
    )

    const intoMinor = split.filter(
      (group) =>
        group.technique === 'secondary-ii-V' &&
        group.chords[0].symbol.startsWith('B'),
    )
    expect(intoMinor.length).toBe(2)
  })

  it('bỏ khe sát ngay khe đã có trong nhóm', () => {
    const repeated = chords('C Am7 Am7 F')
    const built = groupPassingSuggestions(
      suggestPassingChords(repeated, {}),
      repeated,
    )

    for (const group of built) {
      for (let index = 1; index < group.slots.length; index += 1) {
        expect(group.slots[index] - group.slots[index - 1]).toBeGreaterThan(1)
      }
    }
  })

  it('nhóm không còn khe nào thì biến mất', () => {
    // Đây chính là những hợp âm lướt đã xung đột với chỗ vừa chèn
    const accepted = all.filter((s) => s.insertBeforeIndex === 1)
    const kept = compatibleSuggestions(all, list, [accepted[0]], C_MAJOR)
    const after = groupPassingSuggestions(kept, list)

    for (const group of after) {
      expect(group.slots.length).toBeGreaterThan(0)
    }
    expect(after.length).toBeLessThanOrEqual(groups.length)
  })

  it('tra được nhóm nào đặt được ở một khe', () => {
    const atOne = groupsAtSlot(groups, 1)

    expect(atOne.length).toBeGreaterThan(0)
    for (const group of atOne) expect(group.slots).toContain(1)
  })

  it('khe không đặt được gì thì không có nhóm nào', () => {
    expect(groupsAtSlot(groups, 999)).toEqual([])
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

    for (const slot of [3, 5]) {
      expect(
        after.passingSuggestions.some((s) => s.insertBeforeIndex === slot),
      ).toBe(false)
    }

    // Khe đã chèn vẫn còn, nhưng chỉ còn đúng gợi ý đang dùng
    const atSlot = after.passingSuggestions.filter(
      (s) => s.insertBeforeIndex === 4,
    )
    expect(atSlot).toHaveLength(1)

    expect(after.passingSuggestions.length).toBeLessThan(
      before.passingSuggestions.length,
    )
  })
})
