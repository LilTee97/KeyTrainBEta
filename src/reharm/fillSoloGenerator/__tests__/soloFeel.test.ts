import { describe, expect, it } from 'vitest'
import { applyFeel, soloFeelFor } from '../soloFeel'
import { generateSolo } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'

/**
 * Câu chạy phải **mang danh tính của điệu**.
 *
 * Trước đây `soloGenerator.ts` không import một module điệu nào, nên câu giang
 * tấu của bossa nova, slow rock, swing và ballad giống hệt nhau từng nốt — chỉ
 * phần đệm đổi. Nghe ra ngay là một câu vô danh tính đặt trên một nền có danh
 * tính.
 *
 * Feel **không đổi một nốt nào**, chỉ đổi chỗ nốt rơi. Cao độ là việc của hoà
 * âm; chia nhịp là việc của điệu.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }

const line = (feel: 'straight' | 'swing' | 'bossa') =>
  generateSolo(parseChordInput('Dm7 G7 Cmaj7 Cmaj7').chords, {
    beatsPerChord: 4,
    // Mật độ vừa cho ra móc đơn — chỗ cái nảy của swing sống. Móc kép thì người
    // chơi jazz đánh đều, nên `dense` cố tình không nảy.
    density: 'medium',
    key: KEY,
    take: 2,
    noteSource: 'storeScale',
    interlude: true,
    storeScale: scaleForChord,
    feel,
  })

describe('điệu nào thì chia nhịp nấy', () => {
  it('jazz và swing thì nảy', () => {
    expect(soloFeelFor('swing-1')).toBe('swing')
  })

  it('bossa và samba thì đảo phách, KHÔNG nảy', () => {
    // Nhạc Brazil chơi móc đơn đều; trộn cái nảy của jazz vào là lỗi nghe ra ngay.
    expect(soloFeelFor('bossa-nova-1')).toBe('bossa')
    expect(soloFeelFor('bossa-nova-2')).toBe('bossa')
    expect(soloFeelFor('samba-1')).toBe('bossa')
  })

  it('ballad, slow rock, pop thì đều', () => {
    expect(soloFeelFor('pop-1')).toBe('straight')
    expect(soloFeelFor('slow-rock-2')).toBe('straight')
    expect(soloFeelFor('hai-pop-ballad')).toBe('straight')
  })

  it('không biết điệu thì đều, không đoán', () => {
    expect(soloFeelFor(null)).toBe('straight')
    expect(soloFeelFor('điệu-không-có-thật')).toBe('straight')
  })
})

describe('lưới thời gian đổi theo feel, cao độ thì không', () => {
  it('cùng nốt, khác chỗ rơi', () => {
    const straight = line('straight')
    const swing = line('swing')
    const bossa = line('bossa')

    expect(swing.map((n) => n.note)).toEqual(straight.map((n) => n.note))
    expect(swing.map((n) => n.startBeat)).not.toEqual(straight.map((n) => n.startBeat))
    expect(bossa.map((n) => n.startBeat)).not.toEqual(straight.map((n) => n.startBeat))
  })

  it('bossa giang tấu dày nốt hơn ballad', () => {
    const opts = {
      beatsPerChord: 4,
      chordsPerPhrase: 4 as const,
      density: 'medium' as const,
      key: KEY,
      take: 0,
      interlude: true,
      storeScale: scaleForChord,
      noteSource: 'storeScale' as const,
    }
    const chords = parseChordInput('Dm7 G7 Cmaj7 Cmaj7').chords
    const bossa = generateSolo(chords, { ...opts, feel: 'bossa' }).filter((n) => !n.isGrace)
    const straight = generateSolo(chords, { ...opts, feel: 'straight' }).filter((n) => !n.isGrace)
    expect(bossa.length).toBeGreaterThan(straight.length)
  })

  it('swing đẩy nốt lệch về hai phần ba phách', () => {
    const straight = applyFeel(
      [
        { startBeat: 0, durationBeats: 0.5 },
        { startBeat: 0.5, durationBeats: 0.5 },
        { startBeat: 1, durationBeats: 0.5 },
      ],
      'swing',
    )
    expect(straight.map((n) => Number(n.startBeat.toFixed(3)))).toEqual([0, 0.667, 1])
    // Nốt chính đứng trước dài ra đúng phần trượt — đó chính là cái nảy 2:1.
    expect(straight[0].durationBeats).toBeCloseTo(2 / 3, 3)
  })

  it('swing không đụng nốt rơi đúng phách', () => {
    const kept = applyFeel(
      [
        { startBeat: 0, durationBeats: 1 },
        { startBeat: 1, durationBeats: 1 },
        { startBeat: 2, durationBeats: 1 },
      ],
      'swing',
    )
    expect(kept.map((n) => n.startBeat)).toEqual([0, 1, 2])
  })

  it('bossa kéo nửa sau ô nhịp tới sớm một móc đơn', () => {
    const moved = applyFeel(
      [
        { startBeat: 0, durationBeats: 1 },
        { startBeat: 2, durationBeats: 1 },
        { startBeat: 4, durationBeats: 1 },
        { startBeat: 6, durationBeats: 1 },
      ],
      'bossa',
    )
    // Phách 3 của mỗi ô (2 và 6) dời lên chỗ "và của phách 2".
    expect(moved.map((n) => n.startBeat)).toEqual([0, 1.5, 4, 5.5])
  })

  it('bossa không dời khi chỗ tới đã có nốt', () => {
    // Dời vào chỗ đã có tiếng là mất luôn một tiếng.
    const moved = applyFeel(
      [
        { startBeat: 1.5, durationBeats: 0.5 },
        { startBeat: 2, durationBeats: 1 },
      ],
      'bossa',
    )
    // Nốt ở phách 3 đứng nguyên chỗ; nốt ở "và của phách 2" chỉ nghiêng sớm chút.
    expect(moved[1].startBeat).toBe(2)
    expect(moved[0].startBeat).toBeLessThan(1.5)
  })

  it('bossa nghiêng về phía TRƯỚC, ngược hẳn cái nảy của jazz', () => {
    const eighths = applyFeel(
      [
        { startBeat: 0, durationBeats: 0.5 },
        { startBeat: 0.5, durationBeats: 0.5 },
      ],
      'bossa',
    )
    // Nốt lệch tới sớm, không trượt về sau như swing.
    expect(eighths[1].startBeat).toBeLessThan(0.5)
    expect(eighths[1].startBeat).toBeGreaterThan(0.4)
  })

  it('câu chạy dày kín thì bossa vẫn khác lưới của đều và của swing', () => {
    /*
      Cú đảo phách cần một khe trống để dời tới. Câu chạy kín móc kép thì không
      còn khe nào — lúc ấy chỉ còn phần nghiêng về phía trước, và đó vẫn đủ để
      bossa không lẫn với hai feel kia.
    */
    const dense = Array.from({ length: 8 }, (_, at) => ({
      startBeat: at * 0.25,
      durationBeats: 0.25,
    }))
    const bossa = applyFeel(dense, 'bossa').map((n) => Number(n.startBeat.toFixed(3)))
    const swing = applyFeel(dense, 'swing').map((n) => Number(n.startBeat.toFixed(3)))
    expect(bossa).not.toEqual(dense.map((n) => n.startBeat))
    expect(bossa).not.toEqual(swing)
  })

  it('đều thì không đụng gì', () => {
    const same = [
      { startBeat: 0, durationBeats: 0.5 },
      { startBeat: 0.5, durationBeats: 0.5 },
      { startBeat: 2, durationBeats: 1 },
    ]
    expect(applyFeel(same, 'straight')).toEqual(same)
  })

  it('không nốt nào đè lên nốt sau sau khi dời', () => {
    for (const feel of ['swing', 'bossa'] as const) {
      const notes = line(feel).sort((a, b) => a.startBeat - b.startBeat)
      for (let at = 1; at < notes.length; at += 1) {
        if (notes[at].startBeat === notes[at - 1].startBeat) continue
        expect(
          notes[at - 1].startBeat + notes[at - 1].durationBeats,
          `${feel} @ phách ${notes[at - 1].startBeat}`,
        ).toBeLessThanOrEqual(notes[at].startBeat + 1e-6)
      }
    }
  })
})
