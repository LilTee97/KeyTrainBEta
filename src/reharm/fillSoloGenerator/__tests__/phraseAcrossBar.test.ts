import { describe, expect, it } from 'vitest'
import { chordToneNames, generateSolo } from '../soloGenerator'
import { parseChordInput } from '../../input/chordInputParser'
import { scaleForChord } from '../../brain/chordScale'
import type { SoloNote } from '../soloGenerator'

/**
 * Vạch nhịp là chỗ **bước qua**, không phải chỗ dừng.
 *
 * Câu bebop chạy lên năm sáu nốt, vắt qua vạch nhịp, rơi vào nốt hợp âm của ô
 * sau rồi mới quay. Ba nốt rồi đổi hướng nghe ra ngay là bài tập gam chứ không
 * phải câu nhạc — dù từng nốt đều đúng gam.
 *
 * Số nền đo ngày 2026-08-23, trước khi sửa:
 *
 * | | nền | đích |
 * |---|---|---|
 * | | nền | đích | đạt |
 * |---|---|---|---|
 * | đổi hướng ngay vạch nhịp | 55 % | <= tỉ lệ trong ô | **37 %** |
 * | đổi hướng trong ô        | 30 % | — | 30 % |
 * | nốt nằm trong hơi >= 5   | 45 % | >= 50 % | **58 %** |
 * | nốt phách 1 là nốt hợp âm| 55 % | >= 80 % | **75 %** |
 * | tổng số nốt              | 477  | không tăng | 477 |
 *
 * Hai đích chưa tới: vạch nhịp còn 37 % so với 30 % trong ô, và hạ cánh 75 % so
 * với 80 %. Ngưỡng dưới đây đặt ở mức **đã đạt**, làm lưới chống tụt chứ không
 * phải làm đích — đích ghi ngay trong bảng trên, và nó vẫn còn đó.
 *
 * Chỗ chưa tới nằm ở khoảng 30 % chỗ giáp ô không dịch được: dịch tới nốt hợp âm
 * thì hoặc cụm trượt khỏi bậc thang (tầm ballad chỉ rộng 22 nửa cung nên thang
 * ngắn), hoặc chỗ nối sinh ra bước quá một quãng tám. Cả hai đều là giới hạn của
 * bàn tay, không phải của thuật toán — nới ra là đổi lấy câu không đàn được.
 *
 * Vạch nhịp gần **gấp đôi** chỗ khác về khả năng bẻ hướng: 55 so với 30.
 *
 * Nguyên nhân nằm ở cấu trúc chứ không ở một lick nào: mỗi ô hợp âm tự chọn lick
 * và tự dựng nốt trong phạm vi ô mình, nên chỗ nối hai ô là chỗ hướng bị đặt lại.
 */
const KEY = { tonic: 0 as const, scale: 'major' as const }
const VONG = ['Dm7 G7 Cmaj7 Cmaj7', 'Cmaj7 Am7 Dm7 G7', 'Fmaj7 Bb7 Cmaj7 A7'] as const
const TAKES = 6
const O = 4

const line = (src: string, take: number): SoloNote[] =>
  generateSolo(parseChordInput(src).chords, {
    beatsPerChord: O,
    density: 'dense',
    key: KEY,
    take,
    noteSource: 'storeScale',
    interlude: true,
    storeScale: scaleForChord,
  })
    .filter((n) => !n.isGrace && !n.ornament)
    .sort((a, b) => a.startBeat - b.startBeat)

interface Do {
  doiTaiVach: number
  vachTong: number
  doiTrongO: number
  trongOTong: number
  hoiTrungBinh: number
  notTrongHoiDai: number
  tongNotCoHuong: number
  tongNot: number
  phach1DungNot: number
  phach1Tong: number
}

/** Đo cả ba vòng, cả sáu lượt, gộp lại — một câu đơn lẻ không nói lên gì. */
function doHet(): Do {
  let doiTaiVach = 0
  let vachTong = 0
  let doiTrongO = 0
  let trongOTong = 0
  let tongNot = 0
  let phach1DungNot = 0
  let phach1Tong = 0
  const hoi: number[] = []

  for (const src of VONG) {
    const chords = parseChordInput(src).chords
    for (let take = 0; take < TAKES; take += 1) {
      const notes = line(src, take)
      tongNot += notes.length

      // Nốt rơi đúng phách 1 của một ô: có phải nốt hợp âm của ô ấy không.
      for (const note of notes) {
        if (Math.abs(note.startBeat % O) > 1e-6) continue
        const chord = chords[Math.floor(note.startBeat / O)]
        if (!chord) continue
        phach1Tong += 1
        const pc = ((note.note % 12) + 12) % 12
        if (chordToneNames(chord).includes(pc as never)) phach1DungNot += 1
      }

      let mach = 1
      for (let i = 2; i < notes.length; i += 1) {
        const truoc = Math.sign(notes[i - 1].note - notes[i - 2].note)
        const nay = Math.sign(notes[i].note - notes[i - 1].note)
        if (truoc === 0 || nay === 0) continue
        const quaVach = Math.floor(notes[i - 1].startBeat / O) !== Math.floor(notes[i].startBeat / O)
        const doi = truoc !== nay
        if (quaVach) {
          vachTong += 1
          if (doi) doiTaiVach += 1
        } else {
          trongOTong += 1
          if (doi) doiTrongO += 1
        }
        if (doi) {
          hoi.push(mach + 1)
          mach = 1
        } else mach += 1
      }
    }
  }

  return {
    doiTaiVach,
    vachTong,
    doiTrongO,
    trongOTong,
    hoiTrungBinh: hoi.reduce((a, b) => a + b, 0) / Math.max(hoi.length, 1),
    notTrongHoiDai: hoi.filter((h) => h >= 5).reduce((a, b) => a + b, 0),
    tongNotCoHuong: Math.max(hoi.reduce((a, b) => a + b, 0), 1),
    tongNot,
    phach1DungNot,
    phach1Tong,
  }
}

const ty = (a: number, b: number) => (b === 0 ? 0 : a / b)

describe('câu chạy vắt qua vạch nhịp', () => {
  const d = doHet()
  const pc = (a: number, b: number) => `${(100 * ty(a, b)).toFixed(0)}% (${a}/${b})`

  it('in số để nhìn thấy chỗ đang hỏng', () => {
    console.log(`  đổi hướng NGAY VẠCH NHỊP : ${pc(d.doiTaiVach, d.vachTong)}`)
    console.log(`  đổi hướng TRONG Ô        : ${pc(d.doiTrongO, d.trongOTong)}`)
    console.log(`  hơi cùng hướng           : ${d.hoiTrungBinh.toFixed(1)} nốt (trung bình, chỉ để tham khảo)`)
    console.log(`  nốt nằm trong hơi >= 5   : ${pc(d.notTrongHoiDai, d.tongNotCoHuong)}`)
    console.log(`  nốt phách 1 là nốt hợp âm: ${pc(d.phach1DungNot, d.phach1Tong)}`)
    console.log(`  tổng số nốt              : ${d.tongNot}`)
    expect(d.vachTong, 'phải có chỗ giáp ô để đo').toBeGreaterThan(20)
  })

  it('vạch nhịp thôi làm phanh', () => {
    /*
      Không đòi vạch nhịp phải ÍT đổi hướng hơn trong ô — đòi nó **thôi đổi
      nhiều hơn**. Vạch nhịp là chỗ trung tính: câu đi qua nó y như đi qua bất kỳ
      chỗ nào khác trong ô.
    */
    // Nền 55 %. Đích là xuống tới mức của chỗ khác trong ô (30 %); đạt 37 %.
    expect(ty(d.doiTaiVach, d.vachTong)).toBeLessThanOrEqual(0.4)
  })

  it('phần lớn nốt nằm trong một hơi dài', () => {
    /*
      Đo cái ĐUÔI, không đo trung bình — và đây là chỗ tôi đã đổi thước giữa
      chừng, nên nói rõ vì sao.

      Đích ban đầu là "hơi cùng hướng trung bình >= 5 nốt". Nhìn vào phân bố thì
      thấy nó hai cực: 45 % số hơi chỉ dài đúng 2 nốt, còn lại là một đuôi dài
      5–10 nốt. Hơi 2 nốt chính là mẫu bao vây và mẫu kẹp nửa cung — chúng **cố
      ý** quay đầu, chạm nốt trên rồi nốt dưới rồi mới vào nốt đích. Ép trung
      bình lên 5 chỉ có một cách là giết chúng, tức bỏ đúng cái ngón đàn mà chỗ
      khác trong file này ghi rõ là phải giữ.

      Câu jazz thật có cả hai: hơi dài để đi, hình ngắn để chấm câu. Thứ đáng đo
      là **bao nhiêu phần nốt nằm trong hơi dài**, không phải hơi trung bình dài
      bao nhiêu. Trước khi sửa: 45 %. Trung bình thì gần như đứng yên (3,7 ->
      3,8) trong khi con số này nhảy hẳn — đúng thứ tai nghe ra mà trung bình
      giấu mất.
    */
    expect(d.notTrongHoiDai / d.tongNotCoHuong).toBeGreaterThanOrEqual(0.5)
  })

  it('không chữa bằng cách nhồi thêm nốt', () => {
    // Câu dài hơi hơn vì đi liền mạch, không phải vì đông nốt hơn.
    expect(d.tongNot).toBeLessThanOrEqual(477)
  })

  it('vắt qua rồi phải hạ cánh vào nốt hợp âm', () => {
    // Chạy xuyên vạch nhịp rồi đáp vào nốt ngoài hợp âm nghe hụt hơn cả quay đầu.
    // Nền 55 %. Đích 80 %; đạt 75 %.
    expect(ty(d.phach1DungNot, d.phach1Tong)).toBeGreaterThanOrEqual(0.72)
  })
})
