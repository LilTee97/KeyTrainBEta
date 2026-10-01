import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { soloTeacherOf } from '../../fillSoloGenerator/soloTeacher'
import { hoCuaDieu, kieuTrongHo } from '../hoDieu'
import { giveCompingToLeft, renderPattern, yieldToFill } from '../patternRenderer'
import { getStyle, getVisibleStyles, styleFamilies } from '../styleLibrary'
import { bossaFillsInGaps, CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED } from '../styleLibrary/caPhaoBossa'

const render = (text = 'Dm7 Gm7 C7 Fmaj7', beatsEach?: number[]) =>
  renderPattern(voiceLeadTwoHands(parseChordInput(text).chords), CA_PHAO_BOSSA, { beatsPerChord: 4, beatsEach })

describe('Bossa CP cải tiến: chát-bum chát CHÁT', () => {
  it('fill không chuyển chát sang tay trái hoặc xóa bass ở đường phát', () => {
    for (const chords of ['Dm7 Gm7 C7 Fmaj7', 'Cmaj7 Am7 Dm7 G7']) {
      const backing = renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), CA_PHAO_BOSSA_IMPROVED)
      const comp = backing.find(e => e.startBeat === 4.5 && e.hand === 'right')!
      const bass = backing.find(e => e.startBeat === 5.5 && e.hand === 'left')!
      const fills = [
        { ...comp, startBeat: 4.75, durationBeats: .25 },
        { ...bass, durationBeats: .25 },
      ]
      const mix = (line: typeof fills) => yieldToFill(giveCompingToLeft(backing, line), line)
      // Tái hiện lỗi của bước nhường đệm cho fill, không chỉ kiểm bảng cell.
      expect(mix(fills)).not.toEqual(backing)
      const safe = bossaFillsInGaps(fills, backing)
      expect(safe).toEqual([])
      expect(mix(safe)).toEqual(backing)
    }
  })

  it('giữ nguyên câu fill vừa khe, bỏ cả câu bị đụng chát thay vì cắt thủng câu', () => {
    const backing = renderPattern(voiceLeadTwoHands(parseChordInput('Dm7 Gm7').chords), CA_PHAO_BOSSA_IMPROVED)
    const note = backing.find(e => e.hand === 'right')!
    const safe = [0, .25].map(startBeat => ({ ...note, startBeat, durationBeats: .25 }))
    const colliding = [.875, 1.125].map(startBeat => ({ ...note, startBeat, durationBeats: .125 }))
    const fills = [...safe, ...colliding]
    expect(bossaFillsInGaps(fills, backing)).toEqual(safe)
    expect(fills).toEqual([...safe, ...colliding])
    expect(bossaFillsInGaps([], backing)).toEqual([])
  })

  it('tiếng 8 nối ngay bùm 9 rồi chát 10–11 và bass dẫn, giữ trường độ', () => {
    for (const chords of ['Dm7 Gm7 C7 Fmaj7 Dm7', 'Am7 Dm7 G7 Cmaj7 Am7']) {
      const events = renderPattern(voiceLeadTwoHands(parseChordInput(chords).chords), CA_PHAO_BOSSA_IMPROVED, { beatsPerChord: 4 })
      const original = render(chords)
      for (const offset of [0, 8]) {
        // Ngoài bè bass thêm ở chát 5, giữ tiếng 3–6; bum 4 nhả khi bass được gõ lại.
        expect(events.filter(e => e.startBeat > offset + 1 && e.startBeat < offset + 4 &&
          !(e.hand === 'left' && e.startBeat === offset + 2.5)))
          .toEqual(original.filter(e => e.startBeat > offset + 1 && e.startBeat < offset + 4)
            .map(e => e.hand === 'left' && e.startBeat === offset + 1.5 ? { ...e, velocity: 58 }
              : e.hand === 'left' && e.startBeat === offset + 2 ? { ...e, durationBeats: .5 } : e))
        const tail = events.filter(e => e.startBeat >= offset + 4 && e.startBeat < offset + 8)
        expect([...new Set(tail.map(e => e.startBeat - offset))]).toEqual([4, 4.5, 5.5, 6, 7, 7.5])
        expect(tail.filter(e => e.startBeat === offset + 4).map(e => e.hand)).toEqual(['left'])
        const bass = tail.find(e => e.startBeat === offset + 4)!
        expect(bass.durationBeats).toBe(.5)
        const comp = tail.filter(e => e.hand === 'right')
        expect(comp.map(e => e.startBeat - offset)).toEqual([4.5, 6, 7])
        expect(comp.map(e => e.durationBeats)).toEqual([1, 1, .5])
        const addedBass = tail.find(e => e.startBeat === offset + 5.5 && e.hand === 'left')!
        expect(addedBass).toEqual({ ...bass, startBeat: offset + 5.5 })
        expect(tail.filter(e => e.startBeat === offset + 5.5)).toHaveLength(1)
        expect(comp[1]).toEqual({ ...comp[0], startBeat: offset + 6 })
        const sustainedComp = tail.find(e => e.startBeat === offset + 4.5 && e.hand === 'left')!
        expect(sustainedComp.durationBeats).toBe(1)
        expect(bass.startBeat + bass.durationBeats).toBe(comp[0].startBeat)
        expect(addedBass.startBeat).toBe(comp[0].startBeat + comp[0].durationBeats)
        expect(addedBass.startBeat).toBe(sustainedComp.startBeat + sustainedComp.durationBeats)
        expect(comp[1].startBeat).toBe(addedBass.startBeat + addedBass.durationBeats)
        expect(tail.find(e => e.hand === 'left' && e.startBeat === offset + 6))
          .toEqual({ ...sustainedComp, startBeat: offset + 6 })
        expect(comp[2].startBeat).toBe(comp[1].startBeat + comp[1].durationBeats)
        const pickup = tail.find(e => e.startBeat === offset + 7.5 && e.hand === 'left')!
        expect(pickup.startBeat).toBe(comp[2].startBeat + comp[2].durationBeats)
        expect(pickup.hand).toBe('left')
        expect(pickup.durationBeats).toBe(.5)
        expect(pickup.velocity).toBe(31)
        expect(pickup.velocity).toBeLessThan(bass.velocity)
        expect(pickup.velocity).toBeLessThan(comp[2].velocity / 2)
        expect(pickup.startBeat + pickup.durationBeats).toBe(offset + 8)
        const nextBass = events.find(e => e.startBeat === offset + 8 && e.hand === 'left')!
        expect(pickup.notes).toHaveLength(1)
        expect(pickup.notes[0] - nextBass.notes[0]).toBe(1)
        expect(comp[2].velocity).toBeGreaterThan(comp[1].velocity)
        expect(tail.every(e => e.startBeat + e.durationBeats <= offset + 8)).toBe(true)
        expect(comp.every(e => !e.som)).toBe(true)
      }
    }
    // Không sửa cell của nút đã được nghe tương đối ổn.
    expect(CA_PHAO_BOSSA_IMPROVED.cell!.right.find(h => h.beat === 4.5)?.durationBeats).toBe(1)
    expect(CA_PHAO_BOSSA.cell!.left.find(h => h.beat === 4)?.durationBeats).toBe(1.5)
    expect(CA_PHAO_BOSSA.cell!.right.some(h => h.beat === 4)).toBe(true)
    expect(CA_PHAO_BOSSA_IMPROVED.cell!.lengthBeats).toBe(CA_PHAO_BOSSA.cell!.lengthBeats)
    expect(CA_PHAO_BOSSA_IMPROVED.bpm).toBe(CA_PHAO_BOSSA.bpm)
  })

  it('không chèn bass dẫn khi hết bài hoặc hợp âm đích còn cách xa', () => {
    const voicings = voiceLeadTwoHands(parseChordInput('Dm7 Gm7 C7').chords)
    for (const [hands, beatsEach] of [
      [voicings.slice(0, 2), [4, 4]],
      [voicings, [4, 8, 4]],
    ] as const) {
      const events = renderPattern(hands, CA_PHAO_BOSSA_IMPROVED, { beatsEach })
      expect(events.some(e => e.startBeat === 7.5 && e.hand === 'left')).toBe(false)
      expect(events.find(e => e.startBeat === 7 && e.hand === 'right')?.durationBeats).toBe(.5)
    }
  })

  it('hiện nút riêng trong 4/4, vẫn thuộc Bossa và thầy Cà Pháo', () => {
    const style = getStyle('ca-phao-bossa-improved')!
    const family = styleFamilies(getVisibleStyles()).find(f => f.family === style.family)!
    expect(family.familyName).toBe('Bossa CP cải tiến')
    expect(family.styles[0].id).toBe(style.id)
    expect(style.timeSignature).toBe('4/4')
    expect(hoCuaDieu(style.id)).toBe('bossa')
    expect(soloTeacherOf(style.id)).toBe('ca-phao')
    expect(kieuTrongHo('bossa').map(s => s.id)).toContain(style.id)
  })
})

describe('Bossa Cà Pháo: rút gọn ô 9–10, kiểm cả timeline thật', () => {
  it('lặp đúng cặp ô, không gộp histogram hoặc phát lại tie-stop', () => {
    const events = render()
    for (const offset of [0, 8]) {
      const within = events.filter(e => e.startBeat >= offset && e.startBeat < offset + 8)
      expect(within.filter(e => e.hand === 'left').map(e => e.startBeat - offset))
        .toEqual([0, 1.5, 2, 4, 5.5, 7])
      expect(within.filter(e => e.hand === 'right').map(e => e.startBeat - offset))
        .toEqual([1, 2.5, 3.5, 4, 5.5, 6.5])
    }
    expect(events.find(e => e.hand === 'left' && e.startBeat === 5.5)?.durationBeats).toBe(1.5)
    expect(events.find(e => e.hand === 'right' && e.startBeat === 5.5)?.durationBeats).toBe(1)
  })

  it('bass ô 9 là gốc – tiếp cận nửa cung – bậc 5, không rải lên bậc 8', () => {
    for (const chord of ['Dm7', 'Am7', 'Cmaj7', 'Fmaj7', 'Bm7', 'Bb7']) {
      const left = render(`${chord} Gm7`).filter(e => e.hand === 'left' && e.startBeat < 4)
      const [root, approach, fifth] = left.map(e => e.notes[0])
      expect(fifth - approach, chord).toBe(1)
      expect(fifth - root, chord).toBe(7)
    }
    expect(render().find(e => e.startBeat === 5.5 && e.hand === 'left')?.notes).toEqual([50, 55, 58])
  })

  it('4& ô đầu vẫn là hợp âm hiện tại, không tự ứng trước hợp âm bất kỳ', () => {
    const right = render().filter(e => e.hand === 'right')
    expect(right.find(e => e.startBeat === 3.5)?.notes).toEqual(right.find(e => e.startBeat === 1)?.notes)
    expect(right.every(e => !e.som)).toBe(true)
  })

  it('đổi hợp âm giữa ô vẫn có tiếng, không ngân hợp âm cũ qua ranh giới', () => {
    const beats = [2, 2, 1, 3]
    const events = render('Dm7 Gm7 C7 Fmaj7', beats)
    const starts = [0, 2, 4, 5]
    for (const [i, start] of starts.entries()) {
      expect(events.some(e => e.startBeat >= start && e.startBeat < start + beats[i])).toBe(true)
    }
    for (const event of events) {
      const end = starts.find(b => b > event.startBeat) ?? 8
      expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(end)
    }
  })

  // 30/9/2026: người dùng bỏ nút này (chỉ giữ Bossa CP cải tiến) — thành khuôn ngầm cho nút thầy Cà Pháo.
  it('khuôn ngầm không nút, vẫn nhận họ Bossa và thầy Cà Pháo; bản cũ đã xoá', () => {
    const style = getStyle(CA_PHAO_BOSSA.id)!
    expect(getVisibleStyles().some(s => s.id === style.id)).toBe(false)
    expect(hoCuaDieu(style.id)).toBe('bossa')
    expect(kieuTrongHo('bossa').map(s => s.id)).toContain(style.id)
    expect(soloTeacherOf(style.id)).toBe('ca-phao')
    expect(getStyle('bossa-ca-phao-som')).toBeUndefined()
  })
})
