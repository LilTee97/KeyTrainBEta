import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { placeLick } from '../generate'

/*
  Câu chạy bass của slow rock.

  Khác hẳn câu lót giai điệu. Câu lót lấy một hình interval trong sổ Licky, xáo
  chỗ bắt đầu, rồi cho nốt cuối hạ cánh vào bậc ba hợp âm sau — nghe hay vì bất
  ngờ. Câu chạy bass thì ngược lại: người nghe phải nhận ra nó **đang bò từ đâu
  tới đâu**, nên chỗ xuất phát và chỗ kết đều phải chắc, không được xáo.

  Hai nốt, mỗi nốt một ô lưới, đặt ở **phách 5 và phách 6**. Nốt thứ hai đã là
  nốt gốc hợp âm kế: bè trầm đón trước nhịp mạnh, rồi phách 1 xác nhận lại. Đó là
  cú hút vào vạch nhịp.

  Khai `maxNotes` thì nốt giãn đều trên cả khung, không theo lưới `FILL_GRID` cố
  định nữa — lưới ấy dày, hợp câu lót giai điệu chứ không hợp hai nốt bass.
*/

const BASS = { low: 36, high: 55 }

function walk(from: string, to: string) {
  const [chord, next] = parseChordInput(`${from} ${to}`).chords
  return placeLick({
    chord,
    next,
    startBeat: 0,
    beats: 1,
    kind: 'fill',
    maxNotes: 2,
    register: BASS,
    bassWalk: true,
  })
}

const pc = (note: number) => ((note % 12) + 12) % 12

describe('câu chạy bass slow rock', () => {
  it('xuất phát ở nốt gốc hợp âm đang chơi, kết ở nốt gốc hợp âm kế', () => {
    for (const [from, to] of [
      ['Am', 'Dm'],
      ['Dm', 'E7'],
      ['E7', 'Am'],
      ['C', 'F'],
    ] as const) {
      const notes = walk(from, to)
      const [chord, next] = parseChordInput(`${from} ${to}`).chords
      expect(pc(notes[0]!.note), `${from}->${to} nốt đầu`).toBe(pc(chord.root))
      expect(pc(notes.at(-1)!.note), `${from}->${to} nốt cuối`).toBe(pc(next.root))
    }
  })

  it('đúng hai nốt, mỗi ô lưới một nốt — phách 5 rồi phách 6', () => {
    const notes = walk('Am', 'Dm')
    expect(notes).toHaveLength(2)
    expect(notes.map((n) => n.startBeat)).toEqual([0, 0.5])
  })

  it('nằm trong tầm tay trái, và được gán đúng tay', () => {
    for (const [from, to] of [['Am', 'Dm'], ['E7', 'Am']] as const) {
      for (const note of walk(from, to)) {
        expect(note.note).toBeGreaterThanOrEqual(BASS.low)
        expect(note.note).toBeLessThanOrEqual(BASS.high)
        expect(note.hand).toBe('left')
      }
    }
  })

  /*
    Không xáo: cùng một cặp hợp âm phải ra cùng một đường, bất kể `take`. Câu lót
    giai điệu thì ngược lại — `take` chính là chỗ nó lấy sự đa dạng.
  */
  it('không đổi theo take — đường dẫn phải nhận ra được', () => {
    const [chord, next] = parseChordInput('Am Dm').chords
    const of = (take: number) =>
      placeLick({
        chord,
        next,
        startBeat: 0,
        beats: 1,
        kind: 'fill',
        maxNotes: 2,
        register: BASS,
        bassWalk: true,
        take,
      }).map((n) => n.note)
    expect(of(0)).toEqual(of(7))
    expect(of(0)).toEqual(of(31))
  })
})
