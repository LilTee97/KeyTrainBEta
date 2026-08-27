import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { placeLick } from '../generate'
import { generateFillLine } from '../../fillSoloGenerator/soloGenerator'

/*
  Câu chạy bass của slow rock.

  Khác hẳn câu lót giai điệu. Câu lót lấy một hình interval trong sổ Licky, xáo
  chỗ bắt đầu, rồi cho nốt cuối hạ cánh vào bậc ba hợp âm sau — nghe hay vì bất
  ngờ. Câu chạy bass thì ngược lại: người nghe phải nhận ra nó **đang bò từ đâu
  tới đâu**, nên chỗ xuất phát và chỗ kết đều phải chắc, không được xáo.

  Hai nốt, mỗi nốt một ô lưới, đặt ở **phách 5 và phách 6**, và cả hai là nốt
  MỚI — không phải nốt gốc hợp âm đang chơi, cũng không phải nốt đích.

  Bản đầu nội suy từ nốt gốc này tới nốt gốc kia; với hai nốt thì nó suy biến
  thành đúng hai nốt mà mẫu đệm vừa đánh, nên một ô nhịp có bốn tiếng bass mà chỉ
  hai cao độ. Nghe ra một cụm dày chứ không ra một đường dẫn.

  Khai `maxNotes` thì nốt giãn đều trên cả khung, không theo lưới `FILL_GRID` cố
  định nữa — lưới ấy dày, hợp câu lót giai điệu chứ không hợp hai nốt bass.
*/

const BASS = { low: 36, high: 55 }

/*
  Câu chạy bass đi theo **bậc của giọng**, nên test phải nói giọng.

  Thang dựng từ nốt hợp âm chỉ có ba tới bốn cao độ; dưới nốt đích thường không
  còn đủ hai bậc để dẫn vào, và bản trước bỏ cuộc ở đó rồi lặng lẽ rơi về bộ vẽ
  câu lót giai điệu — hai nốt "bass" phát ra cao hơn cả tay phải.
*/
const KEY = { tonic: 9 as const, scale: 'minor' as const }

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
    key: KEY,
  })
}

const pc = (note: number) => ((note % 12) + 12) % 12

describe('câu chạy bass slow rock', () => {
  it('mang nốt MỚI — không lặp lại nốt mẫu đệm vừa đánh', () => {
    for (const [from, to] of [
      ['Am', 'Dm'],
      ['Dm', 'E7'],
      ['E7', 'Am'],
      ['C', 'F'],
      ['G', 'C'],
    ] as const) {
      const [chord, next] = parseChordInput(`${from} ${to}`).chords
      for (const note of walk(from, to)) {
        expect(pc(note.note), `${from}->${to} lặp nốt gốc`).not.toBe(pc(chord.root))
        expect(pc(note.note), `${from}->${to} đánh trước nốt đích`).not.toBe(pc(next.root))
      }
    }
  })

  /*
    Nốt đích thuộc về **phách 1 ô sau**, không thuộc câu dẫn. Câu dẫn chỉ hút về
    nó. Đánh luôn nốt đích ở phách 6 là nói trước phần của nhịp mạnh, và ô sau
    còn lại chẳng gì để đóng.

    Bản trước đòi câu dẫn **luôn đi lên**. Kỳ vọng ấy sai chứ không phải mã sai:
    nốt đích neo ở sàn tầm trầm cộng bậc, nên giọng nào có nốt đích nằm sát sàn
    thì phía dưới không còn bậc để bò lên — Sol sang Đô là một ca như vậy. Đi
    xuống vào nốt đích vẫn là câu dẫn đàng hoàng. Thứ phải giữ là **đi liền bậc
    và kết sát nốt đích**, không phải hướng.
  */
  it('đi liền bậc và kết ngay cạnh nốt đích', () => {
    for (const [from, to] of [
      ['E7', 'Am'],
      ['G', 'C'],
      ['C', 'F'],
      ['Am', 'Dm'],
      ['Dm', 'E7'],
    ] as const) {
      const notes = walk(from, to)
      const [first, second] = notes.map((note) => note.note)
      const target = BASS.low + ((((pc(parseChordInput(to).chords[0]!.root) - (BASS.low % 12)) % 12) + 12) % 12)

      // Bước giữa hai nốt: liền bậc, nhiều nhất một quãng hai trưởng.
      expect(Math.abs(second! - first!), `${from}->${to} bước`).toBeLessThanOrEqual(2)
      // Nốt cuối đứng ngay cạnh nốt đích, cùng phía với hướng đang đi.
      expect(Math.abs(target - second!), `${from}->${to} tới đích`).toBeLessThanOrEqual(2)
      // Không nhảy ngược: hai bước cùng một hướng.
      expect(
        Math.sign(second! - first!) === Math.sign(target - second!),
        `${from}->${to} đổi hướng giữa chừng`,
      ).toBe(true)
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

/*
  **Hợp âm chia đôi không chạy bass.**

  Ô nhịp mang hai hợp âm thì mỗi hợp âm chỉ được nửa ô. Nhét thêm hai nốt bass
  dẫn vào nửa ấy là bè trầm gõ bốn lần trong nửa ô nhịp — ra một cụm dồn, không
  ra một đường dẫn, và nó giẫm lên đúng chỗ hợp âm thứ hai vừa vào. Nửa ô nhịp
  tự nó đã là một cú chuyển rồi.

  Chỉ chặn ở điệu **có** chạy bass; điệu không khai `fillBassChance` không đi
  qua cửa này và giữ nguyên câu lót như cũ.
*/
describe('hợp âm chia đôi', () => {
  const bar = 3
  const run = (beats: number[], chance: number) => {
    const chords = parseChordInput('Am Dm E7 Am').chords.map((chord, at) => ({
      ...chord,
      ...(beats[at] !== undefined ? { beats: beats[at]! } : {}),
    }))
    return generateFillLine(chords, {
      beatsPerChord: bar,
      fillBeats: 1,
      fillMaxNotes: 2,
      fillBassChance: chance,
      density: 'dense',
      key: KEY,
      extraFills: new Set(chords.map((_, at) => at)),
    })
  }

  it('ô chia đôi không sinh nốt chạy bass nào', () => {
    const half = [bar / 2, bar / 2, bar, bar]
    const notes = run(half, 1)
    // Hai hợp âm đầu chiếm nửa ô: không nốt nào rơi trong khoảng của chúng.
    for (const note of notes) {
      expect(note.startBeat, `nốt ở ${note.startBeat}`).toBeGreaterThanOrEqual(bar)
    }
  })

  it('ô nguyên vẫn chạy bass như thường', () => {
    expect(run([bar, bar, bar, bar], 1).length).toBeGreaterThan(0)
  })

  it('điệu không chạy bass thì ô chia đôi vẫn có câu lót', () => {
    const half = [bar / 2, bar / 2, bar, bar]
    expect(run(half, 0).some((note) => note.startBeat < bar)).toBe(true)
  })
})
