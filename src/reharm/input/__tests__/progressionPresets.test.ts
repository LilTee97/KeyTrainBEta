import { describe, expect, it } from 'vitest'
import { analyzeInKey } from '../../reharmEngine/degreeAnalysis'
import { PROGRESSION_PRESETS } from '../progressionPresets'
import { parseSongText } from '../songTextParser'

/**
 * Vòng dựng sẵn chỉ lấy từ tài liệu.
 *
 * Bước 29 ban đầu định **tự đổi** vòng hợp âm của bài sang ii-V-I-vi, nhưng
 * `phongcachdemhatkhabu.md` phần 9 chỉ nói Khá Bự *dùng* vòng ấy làm vòng chủ
 * đạo, không đưa luật đổi từ vòng này sang vòng kia. Nên KeyTrain bày sẵn chính
 * những vòng tài liệu nêu tên, thay vì đổi hộ theo một bảng ánh xạ tự bịa.
 */

const preset = (id: string) =>
  PROGRESSION_PRESETS.find((entry) => entry.id === id)!

describe('vòng dựng sẵn', () => {
  it('mỗi vòng đọc được thành hợp âm', () => {
    for (const entry of PROGRESSION_PRESETS) {
      const song = parseSongText(entry.chords)

      expect(song.chords.length).toBeGreaterThan(0)
      expect(song.warnings).toEqual([])
    }
  })

  it('dòng chỉ có hợp âm thì bộ đọc nhận đúng là không lời', () => {
    // Nhờ vậy vòng dựng sẵn đi chung một đường với việc dán lời
    expect(parseSongText(preset('ii-V-I-vi').chords).format).toBe('chords-only')
  })

  it('ii-V-I-vi đúng là bậc hai, năm, một, sáu', () => {
    const song = parseSongText(preset('ii-V-I-vi').chords)
    const degrees = analyzeInKey(song.chords, 0, 'major').map(
      (entry) => entry.degree,
    )

    expect(degrees).toEqual([2, 5, 1, 6])
  })

  it('I-V-vi-IV đúng là vòng quen thuộc mà tài liệu nói ii-V-I-vi thay thế', () => {
    const song = parseSongText(preset('I-V-vi-IV').chords)
    const degrees = analyzeInKey(song.chords, 0, 'major').map(
      (entry) => entry.degree,
    )

    expect(degrees).toEqual([1, 5, 6, 4])
  })

  it('vòng Canon đúng tám hợp âm như tài liệu ghi', () => {
    expect(parseSongText(preset('canon').chords).chords).toHaveLength(8)
  })

  it('mọi vòng đều ở giọng Đô, để nhìn ra bậc ngay', () => {
    // Muốn tone khác thì dùng nút Tone, không sửa vòng dựng sẵn
    for (const entry of PROGRESSION_PRESETS) {
      const song = parseSongText(entry.chords)
      const degrees = analyzeInKey(song.chords, 0, 'major')

      for (const chord of degrees) expect(chord.degree).not.toBeNull()
    }
  })

  it('mỗi vòng ghi rõ nó lấy từ phần nào của tài liệu', () => {
    /*
      Không thêm vòng nào ngoài tài liệu, dù có quen tai tới đâu — đó là lý do
      bước 29 dừng lại ở đây thay vì đổi vòng tự động.
    */
    for (const entry of PROGRESSION_PRESETS) {
      expect(entry.note).toMatch(/Phần \d+/)
    }
  })

  it('không trùng khoá', () => {
    const ids = PROGRESSION_PRESETS.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
