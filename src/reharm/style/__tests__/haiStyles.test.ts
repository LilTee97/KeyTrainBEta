import { describe, expect, it } from 'vitest'
import { HAI_BORROWED_CELLS, HAI_STYLES } from '../styleLibrary/haiStyles'
import { resolveStyleForSection } from '../sectionStyles'
import { ALL_STYLES, getStyle, isPlayable } from '../styleLibrary'
import { ONEMOTION_STYLES } from '../styleLibrary/onemotion'
import { brain } from '../../brain'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../patternRenderer'

/**
 * Mười lăm tiết điệu Tập 6 của thầy Hải là thứ **thêm vào**: bấm phát được, và
 * không đá điệu OneMotion nào ra khỏi bảng chọn.
 */
const TAP_6 = [
  'hai-16-beat',
  'hai-pop-ballad',
  'hai-slow-rock',
  'hai-fox',
  'hai-boston',
  'hai-bossa-nova',
  'hai-rumba',
  'hai-swing',
  'hai-waltz',
  'hai-ballad-dan-ca',
  'hai-pop-rock',
  'hai-tango',
  'hai-cha-cha',
  'hai-reggae',
  'hai-march',
] as const

describe('15 tiết điệu Tập 6 của thầy Hải', () => {
  it('đủ 15 điệu, tra được theo id', () => {
    expect(TAP_6).toHaveLength(15)
    for (const id of TAP_6) {
      expect(getStyle(id)?.id, id).toBe(id)
    }
  })

  it('điệu nào cũng bấm phát được', () => {
    for (const style of HAI_STYLES) {
      expect(style.cell, style.id).not.toBeNull()
      expect(isPlayable(style), style.id).toBe(true)
      expect(style.cell?.right.length ?? 0, style.id).toBeGreaterThan(0)
      expect(style.cell?.left.length ?? 0, style.id).toBeGreaterThan(0)
    }
  })

  it('điệu nào cũng mang nhãn (Hải) để khỏi lẫn với OneMotion', () => {
    for (const style of HAI_STYLES) {
      // Dấu sao đánh dấu biến tấu KeyTrain, không phải bản ghi lại thầy chơi.
      expect(style.name, style.id).toMatch(/\(Hải\*?\)/)
    }
  })

  it('điệu mượn ô nhịp thì mượn đúng ô nhịp của điệu OneMotion đó', () => {
    expect(Object.keys(HAI_BORROWED_CELLS).length).toBeGreaterThan(0)
    for (const [haiId, oneMotionId] of Object.entries(HAI_BORROWED_CELLS)) {
      const borrowed = ONEMOTION_STYLES.find((s) => s.id === oneMotionId)
      expect(borrowed, oneMotionId).toBeTruthy()
      expect(getStyle(haiId)?.cell).toBe(borrowed?.cell)
    }
  })

  it('không đá điệu OneMotion nào ra ngoài, mặc định vẫn là Pop 1', () => {
    for (const style of ONEMOTION_STYLES) {
      expect(
        ALL_STYLES.some((s) => s.id === style.id),
        style.id,
      ).toBe(true)
    }
    expect(getStyle('pop-1')?.name).toBe('Pop 1')
    expect(getStyle('slow-rock-2')?.familyName).toBe('Slow Rock')
    expect(getStyle('waltz-1')?.familyName).toBe('Waltz')
  })

  it('id cũ của hai mẫu ballad vẫn tra ra được', () => {
    expect(getStyle('hai-pop-ballad-1')?.id).toBe('hai-pop-ballad')
    expect(getStyle('hai-pop-ballad-3')?.id).toBe('hai-pop-ballad-chorus')
  })

  it('id nguồn trỏ đúng item CÓ THẬT trong kho, không bịa', () => {
    const kb = brain()
    for (const style of HAI_STYLES) {
      for (const ref of style.sourceVideos ?? []) {
        // Dòng "KeyTrain:" là biến tấu tự soạn, không dẫn item nào — kiểm riêng.
        if (!ref.startsWith('PianoBrain: ')) continue
        const id = ref.replace('PianoBrain: ', '')
        const item = kb.byId.get(id)
        expect(item, `${style.id} -> ${id}`).toBeTruthy()
        // Chỉ được dán tên thầy Hải lên thứ đã rút từ bài giảng thật của thầy.
        expect(item?.origin, id).toBe('extracted')
        expect(item?.source?.teacher_id, id).toBe('hai-joseph')
      }
    }
  })

  it('biến tấu KeyTrain không được mượn id item của thầy', () => {
    const variations = HAI_STYLES.filter((style) => style.name.includes('(Hải*)'))
    expect(variations.length).toBeGreaterThan(0)

    for (const style of variations) {
      const refs = style.sourceVideos ?? []
      expect(refs.length, style.id).toBeGreaterThan(0)
      // Dẫn một id PianoBrain ở đây nghĩa là "thầy dạy đúng như vậy" — đó là bịa.
      expect(refs.some((ref) => ref.startsWith('PianoBrain: ')), style.id).toBe(false)
      expect(style.note, style.id).toMatch(/KHÔNG phải sheet thầy Hải/)
    }
  })

  it('Boston chậm hơn Waltz, đúng chỗ kho bảo phải phân biệt', () => {
    expect(getStyle('hai-boston')!.bpm).toBeLessThan(getStyle('hai-waltz')!.bpm)
    expect(getStyle('hai-boston')!.timeSignature).toBe('3/4')
    expect(getStyle('hai-waltz')!.timeSignature).toBe('3/4')
  })

  it('Slow Rock phiên khúc rải tay trái 1-5-8-9-10-9, không quạt hai tay', () => {
    const style = getStyle('hai-slow-rock')!
    expect(style.timeSignature).toBe('6/8')
    expect(HAI_BORROWED_CELLS['hai-slow-rock']).toBeUndefined()
    expect(style.cell!.left).toHaveLength(6)
    expect(style.cell!.right).toHaveLength(1)

    const chords = parseChordInput('Cmaj7 Am7 Fmaj7 G7').chords
    const events = renderPattern(voiceLeadTwoHands(chords), style, {
      beatsPerChord: 6,
    })
    const left = events
      .filter((event) => event.hand === 'left' && event.startBeat < 6)
      .sort((a, b) => a.startBeat - b.startBeat)
      .map((event) => ((event.notes[0]! % 12) + 12) % 12)
    expect(left).toEqual([0, 7, 0, 2, 4, 2])

    const am = events
      .filter((event) => event.hand === 'left' && event.startBeat >= 6 && event.startBeat < 12)
      .sort((a, b) => a.startBeat - b.startBeat)
      .map((event) => ((event.notes[0]! % 12) + 12) % 12)
    expect(am).toEqual([9, 4, 9, 11, 0, 11])
  })

  it('nhịp của Fox, Slow Rock, March đúng như kho ghi', () => {
    expect(getStyle('hai-fox')!.timeSignature).toBe('2/4')
    expect(getStyle('hai-slow-rock')!.timeSignature).toBe('6/8')
    // Chùm ba ở phách cuối: có nốt rơi đúng vào một phần ba phách.
    const march = getStyle('hai-march')!.cell!
    expect(
      march.right.some((hit) => Math.abs(hit.beat - (3 + 1 / 3)) < 1e-9),
    ).toBe(true)
  })

  it('mẫu đệm đổi theo đoạn ở chỗ kho đã pin, chỗ khác giữ nguyên', () => {
    expect(resolveStyleForSection('hai-pop-ballad', 'verse')).toBe('hai-pop-ballad')
    expect(resolveStyleForSection('hai-pop-ballad', 'chorus')).toBe(
      'hai-pop-ballad-chorus',
    )
    // Kho chưa tách mẫu theo đoạn cho Rumba: không đổi hộ người học.
    expect(resolveStyleForSection('hai-rumba', 'chorus')).toBe('hai-rumba')
    expect(resolveStyleForSection('pop-1', 'chorus')).toBe('pop-1')
    expect(resolveStyleForSection('hai-slow-rock', 'chorus')).toBe('hai-slow-rock-chorus')
    expect(resolveStyleForSection('hai-slow-rock-chorus', 'verse')).toBe('hai-slow-rock')
  })
})
