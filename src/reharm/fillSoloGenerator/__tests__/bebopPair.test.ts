import { describe, expect, it } from 'vitest'
import { LICKS } from '../soloVocabulary'
import { parseChordInput } from '../../input/chordInputParser'
import { jazzScaleFor } from '../../brain/jazzScale'
import type { MidiNote, PitchClass } from '../../../shared/musicTheory/types'

/**
 * Hình câu bài 6 của nguồn Jazz Scales, từ chữ thành máy.
 *
 * > *"Type 1: rải bốn nốt đi lên (từ bậc 3, 5 hoặc 7) rồi bốn nốt gam Dominant
 * > Bebop đi xuống."* — `02:25-03:42`
 * > *"Type 2: đảo chiều — bốn nốt gam đi xuống trước, đậu vào một nốt hợp âm,
 * > rồi rải bốn nốt đi lên."* — `03:43-04:46`
 *
 * Bài giảng còn cho sẵn ba cụm rải trên G7: từ bậc 3 là `B-D-F-A`, từ bậc 5 là
 * `D-F-A-C`, từ bậc 7 là `F-A-C-E` (`00:41-02:24`). Test dưới đối chiếu thẳng
 * với mấy cụm ấy.
 */
const lick = LICKS.find((entry) => entry.id === 'bebop-pair')

const build = (symbol: string, from: number) => {
  const chord = parseChordInput(symbol).chords[0]
  return lick!.build({
    chord,
    next: null,
    startBeat: 0,
    beats: 4,
    from: from as MidiNote,
    low: 55 as MidiNote,
    high: 81 as MidiNote,
    scaleTones: new Set<PitchClass>([0, 2, 4, 5, 7, 9, 11] as PitchClass[]),
    previousShape: [],
    notesPerBeat: 2,
    material: (jazzScaleFor(chord) ?? []) as PitchClass[],
  }).notes.map((note) => note.note)
}

const pcs = (notes: readonly number[]) => notes.map((note) => ((note % 12) + 12) % 12)

describe('rải lên — gam xuống', () => {
  it('có trong vốn từ vựng, dùng được cả chỗ mở câu lẫn giữa câu', () => {
    expect(lick, 'chưa có mẫu bebop-pair').toBeDefined()
    expect(lick!.inRotation).toBe(true)
    expect(lick!.roles).toEqual(expect.arrayContaining(['opener', 'middle']))
  })

  it('Type 1: bốn nốt rải lên rồi bốn nốt gam xuống, đủ tám nốt', () => {
    const line = build('C7', 60)
    expect(line).toHaveLength(8)

    const up = line.slice(0, 4)
    const down = line.slice(3)
    // Bốn nốt đầu là chồng quãng ba: mỗi bước ba hoặc bốn nửa cung.
    for (let at = 1; at < up.length; at += 1) {
      const gap = up[at] - up[at - 1]
      expect(gap, `cụm rải bước ${gap}`).toBeGreaterThanOrEqual(3)
      expect(gap).toBeLessThanOrEqual(4)
    }
    // Bốn nốt sau đi xuống từng bậc gam.
    for (let at = 1; at < down.length; at += 1) {
      const gap = down[at] - down[at - 1]
      expect(gap, `đoạn gam bước ${gap}`).toBeLessThan(0)
      expect(Math.abs(gap)).toBeLessThanOrEqual(2)
    }
  })

  it('Type 2: gam xuống trước, đậu vào nốt hợp âm, rồi rải lên', () => {
    const line = build('C7', 76)
    expect(line).toHaveLength(8)

    const down = line.slice(0, 5)
    for (let at = 1; at < down.length; at += 1) {
      expect(down[at] - down[at - 1], `bước ${down[at] - down[at - 1]}`).toBeLessThan(0)
    }
    // Nốt đậu — nốt thứ năm — phải là một nốt của hợp âm C7.
    expect([0, 4, 7, 10]).toContain(((down[4] % 12) + 12) % 12)

    const up = line.slice(4)
    for (let at = 1; at < up.length; at += 1) {
      expect(up[at] - up[at - 1]).toBeGreaterThanOrEqual(3)
    }
  })

  it('cụm rải trên G7 đúng như bài giảng in ra', () => {
    /*
      Bài giảng nêu ba cụm: B-D-F-A (từ bậc 3), D-F-A-C (từ bậc 5), F-A-C-E (từ
      bậc 7). Mẫu chọn cụm gần nốt vừa chơi nhất, nên đưa nốt mở khác nhau thì
      phải ra cụm khác nhau — và cụm nào cũng phải nằm trong ba cụm ấy.
    */
    const known = [
      [11, 2, 5, 9], // B D F A
      [2, 5, 9, 0], // D F A C
      [5, 9, 0, 4], // F A C E
    ]
    for (const from of [59, 62, 65]) {
      const shape = pcs(build('G7', from).slice(0, 4))
      expect(known, `mở từ ${from}: ${shape.join('-')}`).toContainEqual(shape)
    }
  })

  it('hợp âm không phải át thì mẫu tự rút lui', () => {
    // Chồng quãng ba của hình này dựng trên hợp âm át, không mượn sang chỗ khác.
    expect(build('Cmaj7', 64)).toHaveLength(0)
    expect(build('Cm7', 64)).toHaveLength(0)
  })

  it('không có gam thì cũng rút lui, không tự dựng gam', () => {
    const chord = parseChordInput('C7').chords[0]
    const notes = lick!.build({
      chord,
      next: null,
      startBeat: 0,
      beats: 4,
      from: 60 as MidiNote,
      low: 55 as MidiNote,
      high: 81 as MidiNote,
      scaleTones: new Set<PitchClass>(),
      previousShape: [],
      notesPerBeat: 2,
      // Chỉ nốt hợp âm: không phải một thang âm để đi xuống từng bậc.
      material: [0, 4, 7, 10] as PitchClass[],
    }).notes
    expect(notes).toHaveLength(0)
  })
})
