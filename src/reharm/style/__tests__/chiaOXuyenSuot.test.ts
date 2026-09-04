import { describe, expect, it } from 'vitest'
import { buildPhraseSection } from '../phraseSection'
import { getStyle } from '../styleLibrary'
import { generateSolo, soloToTimeline } from '../../fillSoloGenerator/soloGenerator'
import { scaleForChord } from '../../brain/chordScale'
import { parseChordInput } from '../../input/chordInputParser'
import { doVongHoaThanh } from '../../reharmEngine/sectionProgression'

/*
  Ô CHIA ĐÔI — KIỂM CẢ DÂY NỐI, KHÔNG KIỂM TỪNG HÀM LẺ.

  Câu hỏi gốc: bài có PHẦN HÁT chia đôi hợp âm thì Linh Nhi có đổi cách chọn hoà thanh
  cho đoạn dạo không. Đo bảy bản ký âm: đoạn hát chia 22%, đoạn dạo chia 10%, và **7/7
  bài** đều có đoạn dạo chia thưa hơn hoặc bằng đoạn hát.

  Dây nối dài năm chặng:

      khungHopAm bỏ hợp âm lệch vạch nhịp
        → VongHoaThanh.tiLeChia
        → ReharmHome.tiLeChiaHat
        → buildPhraseSection
        → phraseChords
        → vonHopAmLinhNhi chèn hợp âm nửa ô

  Bài kiểm ở từng hàm lẻ không bắt được đứt dây giữa chặng. File này đi từ đầu tới cuối.
*/

const KEY = { tonic: 2 as const, scale: 'minor' as const }
const VON = parseChordInput('Dm | Gm | C | F | Bb | A7 | Am | Eb').chords

const doan = (tiLeChiaHat: number) =>
  buildPhraseSection({
    kind: 'intro',
    key: KEY,
    style: getStyle('bolero-linh-nhi-2')!,
    thay: 'linh-nhi',
    beatsPerChord: 4,
    dropRoot: true,
    take: 0,
    tiLeChiaHat,
    songChords: VON,
    opening: VON[0]!,
    solo: (chords) =>
      soloToTimeline(
        generateSolo(chords, {
          beatsPerChord: 4,
          density: 'dense',
          key: KEY,
          take: 0,
          noteSource: 'storeScale',
          interlude: true,
          storeScale: scaleForChord,
        }),
      ),
  })!

describe('ô chia đôi đi hết dây nối', () => {
  it('khungHopAm giữ lại tỉ lệ hợp âm nó đã bỏ', () => {
    /*
      `VongHoaThanh.chords` đã bỏ hợp âm nửa ô, nên nếu không giữ `tiLeChia` thì phía
      sau không còn cách nào biết bài có chia đôi hay không.

      Bốn ô, hai ô chia đôi → 6 hợp âm, `khungHopAm` giữ 4, bỏ 2 = 33%.
    */
    const spans = [
      { chord: VON[0]!, start: 0, beats: 4 },
      { chord: VON[1]!, start: 4, beats: 2 },
      { chord: VON[2]!, start: 6, beats: 2 },
      { chord: VON[3]!, start: 8, beats: 4 },
      { chord: VON[4]!, start: 12, beats: 2 },
      { chord: VON[5]!, start: 14, beats: 2 },
    ]
    const vong = doVongHoaThanh(spans, 4)
    expect(vong.chords).toHaveLength(4)
    expect(vong.tiLeChia).toBeCloseTo(2 / 6, 5)
  })

  it('bài hát KHÔNG chia thì đoạn dạo cũng không chia', () => {
    const spans = VON.map((chord, i) => ({ chord, start: i * 4, beats: 4 }))
    expect(doVongHoaThanh(spans, 4).tiLeChia).toBe(0)
  })

  it('đoạn dạo DÀI Y NGUYÊN dù có chia ô hay không', () => {
    /*
      Ô chia đôi dài nửa ô. Quên chỗ này thì mỗi ô chia cộng thêm một ô trọn và đoạn dạo
      dôi ra — đúng chỗ dễ đứt nhất của cả dây, vì `phraseSection` mới là nơi đổi mảng
      hợp âm thành số phách.
    */
    const goc = doan(0).lengthBeats
    for (const hat of [0.2, 0.4, 0.6, 0.9]) {
      expect(doan(hat).lengthBeats, `đoạn hát chia ${hat}`).toBe(goc)
    }
  })

  it('bài hát chia nhiều thì đoạn dạo nghe khác đi', () => {
    /*
      Đây là chỗ trả lời thẳng câu hỏi: phần hát chia đôi CÓ đổi hoà thanh đoạn dạo.
      Dưới ngưỡng 15% thì không đổi gì — Một Cõi 1% và Đường Xưa 13% đều có đoạn dạo
      không chia ô nào.
    */
    const van = (hat: number) =>
      doan(hat)
        .events.map((e) => `${e.startBeat}:${e.hand}:${e.notes.join('.')}`)
        .join(',')
    expect(van(0.13)).toBe(van(0))
    expect(van(0.4)).not.toBe(van(0))
  })
})
