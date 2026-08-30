import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { caPhaoSolo } from '../caPhaoSolo'
import { raiTheoTayTrai, soloTuDoCaPhao, thienVeCuaHo } from '../hoDieu'
import { soloLeftHand } from '../soloLeftHand'
import { getStyle } from '../styleLibrary'

/*
  CÂU SOLO TỰ DO KIỂU CÀ PHÁO.

  Người dùng đọc hai bản ký âm rồi kết luận: ở đoạn solo, người soạn này bỏ hẳn
  mẫu đệm bossa, biến hoá tay phải và chơi tự do TRÊN NỀN NHỊP của bài. Số đo
  đứng về phía từng ý một:

    câu chạy      phiên khúc 0 · điệp khúc 0 · GIANG TẤU 8 trên 19 ô
    mật độ phải   12,5 nốt/ô (Hồng Kông 1) · 14,6 (Người hãy quên em đi)
    hướng câu     3 lên / 5 xuống — hai chiều
    chỗ vào       6 trên 8 câu vào LỆCH phách
    nền nhịp      99 ô 4/4 + 9 ô 2/4 · 101 ô 4/4 — KHÔNG một ô 3/4 hay 6/8
*/

const CHORDS = parseChordInput('Cmaj7 Am7 Dm7 G7 Cmaj7 Fmaj7 Dm7 G7').chords
const STYLE = getStyle('bossa-ca-phao-som')!
const BAR = STYLE.beatsPerMeasure

function dung(take: number) {
  const left = soloLeftHand({ chords: CHORDS, beatsEach: CHORDS.map(() => BAR), style: STYLE })
  const right = caPhaoSolo({
    chords: CHORDS,
    beatsPerChord: BAR,
    barBeats: BAR,
    range: { low: 62, high: 95 },
    take,
    left,
  })
  return { left, right }
}

describe('câu solo tự do Cà Pháo', () => {
  it('điệu Cà Pháo bật cờ này, và nó đứng TRƯỚC lối bám tay trái', () => {
    expect(soloTuDoCaPhao('bossa-ca-phao-som')).toBe(true)
    // Điệu bossa khác vẫn giữ lối bám tay trái như người dùng đã yêu cầu.
    expect(soloTuDoCaPhao('bossa-nova-1')).toBe(false)
    expect(raiTheoTayTrai('bossa-nova-1')).toBe(true)
  })

  it('mật độ tay phải nằm trong khoảng đo được', () => {
    for (let take = 0; take < 8; take += 1) {
      const moiO = dung(take).right.length / CHORDS.length
      // Hai bài nguồn đã lệch nhau 2 nốt/ô, nên khoá bằng khoảng chứ không bằng điểm.
      expect(moiO, `lượt ${take}`).toBeGreaterThan(7)
      expect(moiO, `lượt ${take}`).toBeLessThan(17)
    }
  })

  /*
    LUẬT CỨNG, và là ý người dùng nhấn mạnh nhất: tự do nằm ở TAY PHẢI, không ở
    nhịp. Mọi mốc phải rơi trên lưới chia hết của ô — nốt móc ba là nhỏ nhất.
    Lọt ra ngoài lưới ấy là bắt đầu trôi sang cảm giác 6/8 hay 3/4.
  */
  it('không nốt nào rời lưới nhịp của ô', () => {
    for (let take = 0; take < 8; take += 1) {
      for (const e of dung(take).right) {
        const trongO = e.startBeat % BAR
        const luoi = Math.round(trongO / 0.125) * 0.125
        expect(Math.abs(trongO - luoi), `lượt ${take} @ ${e.startBeat}`).toBeLessThan(1e-6)
      }
    }
  })

  it('không bao giờ chui xuống dưới tay trái', () => {
    for (let take = 0; take < 8; take += 1) {
      const { left, right } = dung(take)
      for (const e of right) {
        const cungLuc = left.filter((one) => Math.abs(one.startBeat - e.startBeat) < 0.03)
        if (cungLuc.length === 0) continue
        expect(Math.min(...e.notes)).toBeGreaterThan(
          Math.max(...cungLuc.flatMap((one) => one.notes)),
        )
      }
    }
  })

  /*
    Hai chiều, không như lối Linh Nhi vốn luôn trèo lên. Đo bản ký âm: 3 câu đi
    lên, 5 đi xuống.
  */
  it('câu chạy đi cả hai chiều', () => {
    let len = 0
    let xuong = 0
    for (let take = 0; take < 12; take += 1) {
      const nhanh = dung(take)
        .right.filter((e) => e.durationBeats <= 0.26 && e.notes.length === 1)
        .sort((a, b) => a.startBeat - b.startBeat)
      for (let at = 1; at < nhanh.length; at += 1) {
        if (nhanh[at]!.startBeat - nhanh[at - 1]!.startBeat > 0.26) continue
        if (nhanh[at]!.notes[0]! > nhanh[at - 1]!.notes[0]!) len += 1
        else if (nhanh[at]!.notes[0]! < nhanh[at - 1]!.notes[0]!) xuong += 1
      }
    }
    expect(len).toBeGreaterThan(0)
    expect(xuong).toBeGreaterThan(0)
    const tiLe = len / (len + xuong)
    expect(tiLe).toBeGreaterThan(0.25)
    expect(tiLe).toBeLessThan(0.75)
  })

  it('mỗi lượt một câu khác, nhưng cùng lượt thì cùng câu', () => {
    const van = (take: number) =>
      dung(take)
        .right.map((e) => `${e.startBeat.toFixed(3)}:${e.notes.join(',')}`)
        .join('|')
    const thay = new Set<string>()
    for (let take = 0; take < 6; take += 1) thay.add(van(take))
    expect(thay.size).toBe(6)
    expect(van(3)).toBe(van(3))
  })

  it('có chùm nốt — thủ pháp của Người hãy quên em đi', () => {
    let chum = 0
    for (let take = 0; take < 12; take += 1) {
      chum += dung(take).right.filter((e) => e.notes.length >= 3).length
    }
    expect(chum).toBeGreaterThan(0)
  })

  it('đoạn rỗng không nổ', () => {
    expect(
      caPhaoSolo({
        chords: [],
        beatsPerChord: 4,
        barBeats: 4,
        range: { low: 62, high: 95 },
        take: 0,
      }),
    ).toEqual([])
  })
})

/*
  MỞ CHO HỌ BALLAD — theo SỐ ĐO, không theo cảm tính.

  Đo giang tấu cả bảy bản ký âm của Cà Pháo, đếm câu chạy ngón:

    Hồng Kông 1          bossa       8 câu   tay phải 12,5/ô
    Bèo dạt mây trôi     ballad      4 câu            10,5/ô
    Yêu xa               ballad      2 câu             9,4/ô
    Người hãy quên em đi bossa       1 câu            14,6/ô
    Kém duyên            ballad      0 câu            14,9/ô
    Mơ                   slow rock   0 câu             9,5/ô

  Ballad mở vì đo được ở hai trên bốn bài, và ở Bèo dạt còn ngoa hơn bossa: một
  câu 48 nốt trải 6 phách ở đoạn dạo. Slow rock KHÔNG mở — Mơ là bài slow rock
  duy nhất trong kho và nó có 0 câu chạy; một bài chưa đủ kết luận về cả họ,
  nhưng đủ để không mở khi bằng chứng duy nhất đang nói ngược.
*/
describe('lối tự do mở tới đâu', () => {
  /*
    SLOW ROCK ĐƯỢC MỞ — đổi so với kết luận trước, và vì đếm kỹ hơn.

    Lượt trước tôi chốt KHÔNG mở cho slow rock, lý do: *Mơ* — bài slow rock duy
    nhất trong kho — có 0 câu chạy. Đếm kỹ hơn thì "0 câu chạy" KHÔNG có nghĩa
    là "không ứng tấu". Đo thủ pháp giang tấu sáu bài:

      Bèo dạt mây trôi   ballad     58% nốt nhanh, 122 mốc đơn   -> CHẠY
      Yêu xa             ballad     42%                          -> trộn
      Kém duyên          ballad      0% nhanh, 35 chùm ba        -> CHÙM
      Mơ                 slow rock   9% nhanh, 6 chùm ba + 28 đôi-> CHÙM

    *Mơ* ứng tấu bằng CHÙM NỐT, và thủ pháp ấy đã nằm sẵn trong bộ. Cùng lối,
    khác thủ pháp — chứ không phải không có lối.

    Nên mở, và nghiêng hẳn về chùm: bằng chứng duy nhất của họ này chỉ nói một
    chiều. Ballad và bossa để TRỘN vì mỗi họ chứa cả hai cực.
  */
  it('ballad và slow rock đều có, mỗi họ một chỗ nghiêng', () => {
    for (const id of ['pop-1', 'hai-pop-ballad', 'hai-ballad-dan-ca']) {
      expect(soloTuDoCaPhao(id), id).toBe(true)
      expect(thienVeCuaHo(id), id).toBeUndefined()
    }
    for (const id of ['slow-rock-2', 'hai-slow-rock', 'slow-rock-duc-thinh-3']) {
      expect(soloTuDoCaPhao(id), id).toBe(true)
      expect(thienVeCuaHo(id), id).toBe('chum')
    }
  })

  it('nghiêng về chùm thì ra nhiều chùm hơn và ít nốt nhanh hơn', () => {
    const dem = (thienVe?: 'chay' | 'chum') => {
      let chum = 0
      let nhanh = 0
      for (let take = 0; take < 10; take += 1) {
        const ev = caPhaoSolo({
          chords: CHORDS,
          beatsPerChord: BAR,
          barBeats: BAR,
          range: { low: 62, high: 95 },
          take,
          ...(thienVe ? { thienVe } : {}),
        })
        chum += ev.filter((e) => e.notes.length >= 3).length
        nhanh += ev.filter((e) => e.durationBeats <= 0.2).length
      }
      return { chum, nhanh }
    }
    const tron = dem()
    const chum = dem('chum')
    expect(chum.chum).toBeGreaterThan(tron.chum)
    expect(chum.nhanh).toBeLessThan(tron.nhanh)
  })

  it('bolero vẫn giữ lối bám tay trái của Linh Nhi, không đổi sang lối tự do', () => {
    expect(soloTuDoCaPhao('bolero-linh-nhi-2')).toBe(false)
    expect(raiTheoTayTrai('bolero-linh-nhi-2')).toBe(true)
  })
})
