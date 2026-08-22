import { describe, expect, it } from 'vitest'
import { resolveStyleForSection } from '../sectionStyles'
import { getStyle, isPlayable } from '../styleLibrary'
import { isBalladStyle } from '../balladFamily'
import { renderPattern } from '../patternRenderer'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import type { RhythmCell } from '../types'

/**
 * Cặp biến tấu Pop Ballad do **KeyTrain soạn**, đứng cạnh bản của thầy Hải chứ
 * không thay nó.
 *
 * Bài kiểm canh hai thứ: nhạc có đúng ý đồ không (phiên khúc thưa, điệp khúc
 * dày, không chép 16 Beat), và nguồn gốc có bị nhận vơ sang thầy không.
 */
const VERSE = 'hai-pop-ballad-free'
const CHORUS = 'hai-pop-ballad-free-chorus'

/** Số tiếng đàn trên mỗi phách — thước đo "dày hay thưa" công bằng giữa hai ô nhịp dài khác nhau. */
function density(cell: RhythmCell): number {
  return (cell.right.length + cell.left.length) / cell.lengthBeats
}

/** Số tiếng tay phải của từng ô trong chu kỳ, theo đúng thứ tự ô. */
function rightHandPerBar(id: string): number[] {
  const style = getStyle(id)!
  const cell = style.cell!
  const perBar = style.beatsPerMeasure
  const bars = Math.round(cell.lengthBeats / perBar)

  return Array.from({ length: bars }, (_, bar) =>
    cell.right.filter(
      (hit) => hit.beat >= bar * perBar && hit.beat < (bar + 1) * perBar,
    ).length,
  )
}

describe('biến tấu Pop Ballad của KeyTrain', () => {
  it('cả hai đều tra được và bấm phát được', () => {
    for (const id of [VERSE, CHORUS]) {
      const style = getStyle(id)
      expect(style?.id, id).toBe(id)
      expect(style!.cell, id).not.toBeNull()
      expect(isPlayable(style!), id).toBe(true)
      expect(style!.cell!.right.length, id).toBeGreaterThan(0)
      expect(style!.cell!.left.length, id).toBeGreaterThan(0)
    }
  })

  it('thuộc họ ballad, nên được bày công tắc walking và câu lót', () => {
    expect(isBalladStyle(VERSE)).toBe(true)
    expect(isBalladStyle(CHORUS)).toBe(true)
  })

  it('bản của thầy Hải vẫn còn nguyên, không bị thay', () => {
    expect(getStyle('hai-pop-ballad')?.name).toBe('Pop Ballad (Hải) — phiên khúc')
    expect(getStyle('hai-pop-ballad-chorus')?.id).toBe('hai-pop-ballad-chorus')
    expect(getStyle('pop-1')?.name).toBe('Pop 1')
  })

  it('MỌI ô đều có bass ở phách mạnh và phách nhẹ', () => {
    /*
      Luật khung ballad: tay trái phải chạm cả hai mốc trong từng ô — phách mạnh
      ở đầu ô, phách nhẹ ở giữa ô. Ô nào chỉ đánh một tiếng bass rồi im thì nửa
      sau ô mất điểm tựa, người hát hết chỗ bám nhịp.
    */
    for (const id of [VERSE, CHORUS]) {
      const cell = getStyle(id)!.cell!
      const perBar = getStyle(id)!.beatsPerMeasure
      const bars = Math.round(cell.lengthBeats / perBar)
      expect(bars, id).toBeGreaterThanOrEqual(1)

      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * perBar
        const inBar = cell.left
          .map((hit) => hit.beat - start)
          .filter((beat) => beat >= 0 && beat < perBar)

        expect(inBar.length, `${id} ô ${bar + 1}: bass đánh một tiếng rồi im`).toBeGreaterThanOrEqual(2)
        // Phách mạnh: đầu ô. Cho phép lệch sớm/muộn nửa phách theo luật nối ô.
        expect(
          inBar.some((beat) => beat <= 1.5),
          `${id} ô ${bar + 1}: thiếu bass phách mạnh`,
        ).toBe(true)
        // Phách nhẹ: giữa ô.
        expect(
          inBar.some((beat) => beat >= perBar / 2 && beat < perBar),
          `${id} ô ${bar + 1}: thiếu bass phách nhẹ`,
        ).toBe(true)
      }
    }
  })

  it('sau phách nhẹ: phiên khúc buông, điệp khúc dậm tiếp', () => {
    const afterWeak = (id: string) => {
      const style = getStyle(id)!
      const perBar = style.beatsPerMeasure
      return style.cell!.right.filter(
        (hit) => (hit.beat % perBar) >= perBar / 2,
      ).length
    }
    // Cùng đo trên một ô để so công bằng: phiên khúc dài hai ô.
    expect(afterWeak(VERSE) / 2).toBeLessThan(afterWeak(CHORUS))
  })

  it('mọi tiếng rải đều là nốt của hợp âm đang vang', () => {
    /*
      Luật gốc của phần rải: không nốt nào ngoài hợp âm đang phát. Kiểm trên cả
      vòng ba nốt lẫn vòng hợp âm bảy, vì thế bấm bảy có bốn nốt nên chỉ số nốt
      trong ô nhịp trỏ sang chỗ khác.
    */
    for (const text of ['C Am F G', 'Cmaj7 Am7 Dm7 G7']) {
      const chords = parseChordInput(text).chords
      const voicings = voiceLeadTwoHands(chords)

      for (const id of [VERSE, CHORUS]) {
        const events = renderPattern(voicings, getStyle(id)!, { beatsPerChord: 4 })

        for (const event of events) {
          const at = Math.min(chords.length - 1, Math.floor(event.startBeat / 4))
          const chord = chords[at]
          const allowed = new Set(
            chord.quality.intervals.map((step) => (chord.root + step) % 12),
          )
          for (const note of event.notes) {
            expect(
              allowed.has(((note % 12) + 12) % 12),
              `${id} @ ${event.startBeat} trên ${chord.source}: nốt lạ`,
            ).toBe(true)
          }
        }
      }
    }
  })

  it('không đập trúng một nốt quá nhiều, không lặp hai tiếng liền nhau', () => {
    /*
      Đây là chỗ làm câu rải nghe chói: bản trước dồn chín tiếng vào quãng sáu
      và đánh trúng G4 tới sáu lần trong một ô.
    */
    const voicings = voiceLeadTwoHands(parseChordInput('C Am F G').chords)

    for (const id of [VERSE, CHORUS]) {
      const right = renderPattern(voicings, getStyle(id)!, { beatsPerChord: 4 })
        .filter((event) => event.hand === 'right' && event.startBeat < 4)
        .sort((a, b) => a.startBeat - b.startBeat)

      for (let at = 1; at < right.length; at += 1) {
        expect(
          right[at].notes.join(),
          `${id} @ ${right[at].startBeat}: trùng tiếng ngay trước`,
        ).not.toBe(right[at - 1].notes.join())
      }

      const counts = new Map<number, number>()
      const pitches = right.flatMap((event) => event.notes)
      for (const note of pitches) counts.set(note, (counts.get(note) ?? 0) + 1)
      // Không nốt nào được chiếm quá nửa số tiếng trong ô.
      expect(Math.max(...counts.values()), id).toBeLessThanOrEqual(pitches.length / 2)
      // Trải ít nhất một quãng tám, đừng dồn vào một dải hẹp.
      expect(Math.max(...pitches) - Math.min(...pitches), id).toBeGreaterThanOrEqual(12)
    }
  })

  it('không ô nào rải dưới 5 tiếng', () => {
    /*
      Rải hai ba tiếng rồi bỏ trống cả ô thì tay phải hết vai trò giữ dòng chảy,
      phần đệm rơi lại thành hợp âm rời.
    */
    for (const id of [VERSE, CHORUS]) {
      rightHandPerBar(id).forEach((hits, bar) => {
        expect(hits, `${id} ô ${bar + 1}`).toBeGreaterThanOrEqual(5)
      })
    }
  })

  it('ô rải đủ khung 8 chiếm đa số trong chu kỳ', () => {
    const bars = rightHandPerBar(VERSE)
    const full = bars.filter((hits) => hits >= 8).length
    expect(full).toBeGreaterThan(bars.length - full)
  })

  it('ô 4 tiếng chỉ được đứng sau một ô đã rải đủ, và không mở đầu chu kỳ', () => {
    for (const id of [VERSE, CHORUS]) {
      const bars = rightHandPerBar(id)
      bars.forEach((hits, bar) => {
        if (hits > 4) return
        expect(bar, `${id}: ô 4 tiếng không được mở đầu chu kỳ`).toBeGreaterThan(0)
        expect(
          bars[bar - 1],
          `${id} ô ${bar + 1}: ô trước phải rải từ 5 tiếng trở lên`,
        ).toBeGreaterThanOrEqual(5)
      })
    }
  })

  it('điệp khúc rải dày hơn phiên khúc ở từng ô', () => {
    const verse = rightHandPerBar(VERSE)
    const chorus = rightHandPerBar(CHORUS)
    expect(Math.min(...chorus)).toBeGreaterThanOrEqual(Math.max(...verse))
  })

  it('tính cả hai tay, phiên khúc vẫn thưa hơn điệp khúc', () => {
    const verse = getStyle(VERSE)!.cell!
    const chorus = getStyle(CHORUS)!.cell!
    expect(density(verse)).toBeLessThan(density(chorus))
  })

  it('phiên khúc có một ô thở, không phải ô nào cũng rải đủ', () => {
    const bars = rightHandPerBar(VERSE)
    // Đủ tám tiếng suốt bốn ô thì thành máy đánh; phải có chỗ hụt hơi giữa câu.
    expect(Math.min(...bars)).toBeLessThan(8)
    expect(bars).toContain(8)
  })

  it('tay phải rơi lần lượt, không dậm cả hợp âm cùng lúc', () => {
    for (const id of [VERSE, CHORUS]) {
      const cell = getStyle(id)!.cell!
      /*
        `tones` bỏ trống nghĩa là gõ nguyên hợp âm một phát. Cả ý đồ của biến
        tấu này là các nốt rơi lần lượt, nên không tiếng nào được để trống.
      */
      for (const hit of cell.right) {
        expect(hit.tones ?? hit.toneIndex !== undefined, `${id} @ ${hit.beat}`).toBeTruthy()
      }
    }
  })

  it('điệp khúc nhanh hơn phiên khúc, nhưng chậm hơn 16 Beat', () => {
    const verse = getStyle(VERSE)!.bpm
    const chorus = getStyle(CHORUS)!.bpm
    expect(chorus).toBeGreaterThan(verse)
    expect(chorus).toBeLessThan(getStyle('hai-16-beat')!.bpm)
    // Vẫn nằm trong khung ballad mà kho ghi cho phiên khúc.
    expect(verse).toBeGreaterThanOrEqual(65)
    expect(verse).toBeLessThanOrEqual(75)
  })

  it('điệp khúc không chép ô nhịp của 16 Beat', () => {
    const chorus = getStyle(CHORUS)!.cell!
    for (const id of ['hai-16-beat', 'pop-1']) {
      const other = getStyle(id)!.cell!
      const beatsOf = (cell: RhythmCell) =>
        cell.right.map((hit) => hit.beat).join(',')
      expect(beatsOf(chorus), id).not.toBe(beatsOf(other))
    }
  })

  it('đổi mẫu theo đoạn: phiên khúc ra bản rải, điệp khúc ra bản dậm', () => {
    expect(resolveStyleForSection(VERSE, 'verse')).toBe(VERSE)
    expect(resolveStyleForSection(VERSE, 'chorus')).toBe(CHORUS)
    expect(resolveStyleForSection(CHORUS, 'verse')).toBe(VERSE)
    // Không đụng cặp của thầy Hải.
    expect(resolveStyleForSection('hai-pop-ballad', 'chorus')).toBe('hai-pop-ballad-chorus')
  })

  it('nói thẳng đây không phải sheet thầy Hải', () => {
    for (const id of [VERSE, CHORUS]) {
      const style = getStyle(id)!
      expect(style.name, id).toContain('(Hải*)')
      expect(style.note, id).toMatch(/KHÔNG phải sheet thầy Hải/)
      expect(style.sourceVideos?.[0], id).toMatch(/^KeyTrain:/)
    }
  })
})
