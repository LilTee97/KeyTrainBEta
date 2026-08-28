import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { getStyle } from '../../style/styleLibrary'
import { generateSolo } from '../soloGenerator'
import { cellPulseOf, pulseForStyle, soloFeelFor, soloLocksToCell, snapToPulse } from '../soloFeel'

/*
  Câu solo đoạn không lời **neo vào mạch của điệu**.

  Ba khuôn nhịp có sẵn (`straight` / `swing` / `bossa`) là quy ước chung của cả
  một dòng nhạc, và với ba họ dưới đây thì chúng sai chỗ:

  - Slow rock 6/8 rơi vào `straight`, tức móc đơn đều, chạy xuyên qua một mẫu
    đệm gõ ở phách 1, 3, 4, 6 — hai bè không gặp nhau chỗ nào.
  - Bolero khai `syncopated-3-3-2` nên bị gán khuôn **bossa**, mà tiết tấu thật
    của nó là Pùng-Pắp ở 1-and, 2, 3-and, 4-and. Mượn idiom của dòng nhạc khác.
  - Bossa thì khuôn đúng nhưng chỉ nghiêng nốt lệch, không neo câu vào chỗ tay
    trái đảo phách.

  Mạch lấy từ chính `cell` của điệu, nên không có bảng thứ hai để quên cập nhật.
*/

const KEY = { tonic: 9 as const, scale: 'minor' as const }
const SONG = 'Am Dm E7 Am'

/** Ba họ người dùng chỉ đích danh. */
const LOCKED = ['slow-rock-duc-thinh-3', 'slow-rock-duc-thinh-1', 'bolero-1', 'bossa-nova-1'] as const
/** Điệu ngoài ba họ ấy: phải giữ nguyên hành vi cũ. */
const FREE = ['pop-1', 'swing-1', 'waltz-1'] as const

function onsets(styleId: string, withPulse: boolean): number[] {
  const style = getStyle(styleId)!
  const bar = style.beatsPerMeasure * (style.gridUnit ?? 1)
  // Đúng cửa mà app dùng, để test không đo một đường khác.
  const pulse = pulseForStyle(styleId)
  return generateSolo(parseChordInput(SONG).chords, {
    beatsPerChord: bar,
    density: 'medium',
    key: KEY,
    take: 2,
    interlude: true,
    feel: soloFeelFor(styleId),
    ...(withPulse && pulse.length > 0 ? { pulse, pulseBar: bar } : {}),
  }).map((note) => Number((note.startBeat % bar).toFixed(3)))
}

const onPulse = (beats: readonly number[], pulse: readonly number[]) =>
  beats.filter((beat) => pulse.some((step) => Math.abs(step - beat) < 0.02)).length

describe('câu solo neo vào mạch của điệu', () => {
  /*
    Neo vào mạch, nhưng KHÔNG neo vào mọi cú gõ.

    Bản trước đòi từ 70% số nốt trở lên rơi đúng mạch. Lúc ấy mạch là toàn bộ
    chỗ gõ của ô nhịp và tay trái chưa gánh mẫu đệm, nên đòi vậy là hợp lý.

    Từ khi tay trái gánh trọn mẫu đệm ở đoạn không lời thì mạch và cú gõ tay
    trái trùng nhau, và "phần lớn nốt rơi đúng mạch" hoá thành "mỗi nốt giai
    điệu nhân đôi một tiếng bass" — đo ra tới 99% ở bossa. Người dùng nghe ra
    là dồn nốt rối tai.

    Người thật để **32-73%** số nốt tay phải rơi trúng cú gõ tay trái; quá nửa
    còn lại rơi vào KHE giữa hai cú. Đó mới là hai tay cài vào nhau. Nên mạch
    của giai điệu giờ chỉ lấy những cú gõ MẠNH, và test đo một KHOẢNG chứ không
    đo một sàn.
  */
  it.each(LOCKED)('%s: neo vào mạch nhưng không nhân đôi bè trầm', (styleId) => {
    const pulse = cellPulseOf(styleId)
    expect(pulse.length, 'điệu phải khai được mạch').toBeGreaterThan(0)
    const beats = onsets(styleId, true)
    const rate = onPulse(beats, pulse) / beats.length
    expect(rate, 'quá thưa thì mất mạch').toBeGreaterThanOrEqual(0.25)
    expect(rate, 'quá dày thì giai điệu thành bóng của bè trầm').toBeLessThanOrEqual(0.85)
  })

  it.each(LOCKED)('%s: neo rồi thì khớp hơn lúc chưa neo', (styleId) => {
    const pulse = cellPulseOf(styleId)
    const before = onsets(styleId, false)
    const after = onsets(styleId, true)
    expect(onPulse(after, pulse) / after.length).toBeGreaterThanOrEqual(
      onPulse(before, pulse) / before.length,
    )
  })

  it.each(LOCKED)('%s: thuộc diện neo', (styleId) => {
    expect(soloLocksToCell(styleId)).toBe(true)
  })

  /*
    Không bật cho mọi điệu. Với ballad và swing thì câu chạy đi **ngược** mạch
    đệm mới là chỗ hay — bè giai điệu lấp vào chỗ tay trái để trống.
  */
  it.each(FREE)('%s: không neo, giữ nguyên hành vi cũ', (styleId) => {
    expect(soloLocksToCell(styleId)).toBe(false)
    expect(onsets(styleId, true)).toEqual(onsets(styleId, false))
  })

  /*
    Nốt nằm giữa hai chỗ gõ là **nốt nối**, và nốt nối mới là thứ làm câu nhạc
    chạy. Kéo hết mọi nốt về mạch thì câu solo thành bản sao của mẫu đệm.
  */
  it('nốt xa mạch thì để yên', () => {
    const notes = [{ startBeat: 0.5, durationBeats: 0.25 }]
    expect(snapToPulse(notes, [0, 2], 4)[0]!.startBeat).toBe(0.5)
  })

  it('không dồn hai nốt vào cùng một chỗ', () => {
    const notes = [
      { startBeat: 0.9, durationBeats: 0.25 },
      { startBeat: 1.1, durationBeats: 0.25 },
    ]
    const out = snapToPulse(notes, [1], 4)
    expect(new Set(out.map((note) => note.startBeat)).size).toBe(2)
  })

  it('kéo nốt nhưng giữ nguyên chỗ nốt kết thúc', () => {
    const out = snapToPulse([{ startBeat: 1.2, durationBeats: 0.8 }], [1], 4)[0]!
    expect(out.startBeat).toBe(1)
    expect(out.startBeat + out.durationBeats).toBeCloseTo(2, 5)
  })
})
