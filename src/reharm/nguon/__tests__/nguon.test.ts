import { describe, expect, it } from 'vitest'
import { soRong, themCau, themBinhLuan, chamCau } from '../nguonPlugin'

/*
  SỔ `Nguon.json` — ghi câu dạo mỗi lần phát, và bình luận gắn vào từng câu.

  Người dùng đặt năm điều:
    · câu dạo tự lưu khi được tạo ra, có SỐ THỨ TỰ và NGÀY GIỜ
    · tick "Đã ổn" thì giữ câu lại; tick "Chưa ổn" thì mới mở ô viết ý kiến
    · mỗi lần phát là lưu ngay, không hỏi, dừng giữa chừng cũng lưu trọn câu
    · có ô bình luận, ý kiến gắn vào đúng câu vừa nghe theo số thứ tự
    · ô bình luận nằm trên nút phát cả bài
    · file `Nguon.json` lưu theo KIỂU BẢNG

  File này canh phần bảng. Hai điều còn lại (chỗ gọi lúc bấm phát, chỗ đặt ô bình luận)
  nằm ở `ReharmHome.tsx` và `OBinhLuan.tsx`.
*/

const cau = (not: unknown[][], bai = 'Bài A') => ({
  bai,
  giong: 'D thứ',
  dieu: 'bolero-linh-nhi-3',
  soO: 8,
  hopAm: ['Dm', 'Gm', 'C', 'F', 'Bb', 'A7', 'Dm', 'A7'],
  not,
})

const A = [[0, 74, 0.5, 'P'], [1, 77, 0.5, 'P']]
const B = [[0, 74, 0.5, 'P'], [1, 79, 0.5, 'P']]

describe('Nguon.json — bảng câu dạo', () => {
  it('sổ rỗng có đủ hai bảng và tên cột', () => {
    const so = soRong()
    expect(so.cau.cot).toEqual([
      'stt',
      'tao',
      'bai',
      'giong',
      'dieu',
      'soO',
      'soNot',
      'lanPhat',
      'not',
      'danhGia',
      'hopAm',
      'doan',
    ])
    expect(so.binhLuan.cot).toEqual(['stt', 'cauStt', 'luc', 'yKien'])
    expect(so.cau.dong).toHaveLength(0)
  })

  it('câu đầu tiên được đánh số 1, có ngày giờ tạo', () => {
    const so = soRong()
    const ra = themCau(so, cau(A), '2026-09-04T10:00:00.000Z')
    expect(ra).toMatchObject({ stt: 1, moi: true, lanPhat: 1, giong: 'D thứ', doan: 'intro' })
    const dong = so.cau.dong[0]!
    expect(dong[0]).toBe(1)
    expect(dong[1]).toBe('2026-09-04T10:00:00.000Z')
    expect(dong[7]).toEqual(['2026-09-04T10:00:00.000Z'])
    expect(dong[6]).toBe(2)
    expect(dong[3]).toBe('D thứ')
    expect(dong[11]).toBe('intro')
  })

  it('cột doan phân biệt intro và giang tấu; giong đi cùng câu', () => {
    const so = soRong()
    const dao = themCau(so, cau(A), 't1')
    const giang = themCau(so, { ...cau(B), doan: 'interlude', giong: 'A thứ' }, 't2')
    expect(dao.giong).toBe('D thứ')
    expect(dao.doan).toBe('intro')
    expect(dao.dieu).toBe('bolero-linh-nhi-3')
    expect(giang.giong).toBe('A thứ')
    expect(giang.doan).toBe('interlude')
    expect(giang.dieu).toBe('bolero-linh-nhi-3')
    expect(so.cau.dong[1]![11]).toBe('interlude')
  })

  it('câu KHÁC thì đánh số tiếp', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    const ra = themCau(so, cau(B), 't2')
    expect(ra.stt).toBe(2)
    expect(ra.moi).toBe(true)
    expect(so.cau.dong).toHaveLength(2)
  })

  it('câu TRÙNG thì không đẻ dòng mới, chỉ ghi thêm mốc phát', () => {
    /*
      Mỗi lần bấm phát nay soạn một câu MỚI — đo 20 lần bấm liên tiếp ra 20 câu khác
      nhau — nên phép gộp này là lưới chắn cho ca hiếm: bài ít hợp âm, đoạn dạo ngắn,
      hoặc vốn ô trong bảng tuyến quá mỏng. Không có nó thì sổ đầy dòng trùng và bình
      luận không biết gắn vào đâu.
    */
    const so = soRong()
    themCau(so, cau(A), 't1')
    const hai = themCau(so, cau(A), 't2')
    const ba = themCau(so, cau(A), 't3')
    expect(so.cau.dong).toHaveLength(1)
    expect(hai).toMatchObject({ stt: 1, moi: false, lanPhat: 2 })
    expect(ba.lanPhat).toBe(3)
    expect(so.cau.dong[0]![7]).toEqual(['t1', 't2', 't3'])
  })

  it('mỗi dòng là một MẢNG đúng thứ tự cột — đổ ra bảng tính được', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    expect(Array.isArray(so.cau.dong[0])).toBe(true)
    expect(so.cau.dong[0]).toHaveLength(so.cau.cot.length)
  })
})

describe('Nguon.json — bảng bình luận', () => {
  it('ý kiến gắn vào đúng số thứ tự của câu', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    themCau(so, cau(B), 't2')
    const ra = themBinhLuan(so, 2, '  câu này nghe trống  ', 't3')
    expect(ra).toEqual({ stt: 1, cauStt: 2 })
    expect(so.binhLuan.dong[0]).toEqual([1, 2, 't3', 'câu này nghe trống'])
  })

  it('nhiều ý kiến cho cùng một câu đều giữ lại', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    themBinhLuan(so, 1, 'ý một', 't2')
    themBinhLuan(so, 1, 'ý hai', 't3')
    expect(so.binhLuan.dong.map((d) => d[3])).toEqual(['ý một', 'ý hai'])
    expect(so.binhLuan.dong.map((d) => d[1])).toEqual([1, 1])
  })

  it('ý kiến rỗng hoặc số câu sai thì không ghi', () => {
    const so = soRong()
    expect(themBinhLuan(so, 1, '   ', 't')).toBeNull()
    expect(themBinhLuan(so, 0, 'có chữ', 't')).toBeNull()
    expect(themBinhLuan(so, Number.NaN, 'có chữ', 't')).toBeNull()
    expect(so.binhLuan.dong).toHaveLength(0)
  })
})

describe('Nguon.json — chấm Đã ổn / Chưa ổn', () => {
  /*
    Người dùng đặt: *"1 là 'Đã ổn' thì intro này sẽ được giữ lại. 2 là 'Chưa ổn' thì sẽ
    cho tôi bình luận ý kiến."*

    Chấm nằm ở bảng `cau` chứ không ở `binhLuan`, vì nó là nhận xét về CÂU — một câu chỉ
    có một chấm, mà có thể có nhiều ý kiến.
  */
  it('chấm ghi vào đúng dòng của câu', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    themCau(so, cau(B), 't2')
    expect(chamCau(so, 2, 'on')).toEqual({ cauStt: 2, danhGia: 'on' })
    expect(so.cau.dong[1]![9]).toBe('on')
    /* Câu kia không bị đụng tới. */
    expect(so.cau.dong[0]![9]).toBe('')
  })

  it('chấm lại thì GHI ĐÈ, không giữ hai chấm ngược nhau', () => {
    /* Nghe lại rồi đổi ý là chuyện thường; giữ cả hai thì không ai đọc ra câu ấy thế nào. */
    const so = soRong()
    themCau(so, cau(A), 't1')
    chamCau(so, 1, 'chua-on')
    chamCau(so, 1, 'on')
    expect(so.cau.dong[0]![9]).toBe('on')
  })

  it('câu mới có cột chấm rỗng, và dòng vẫn đủ số cột', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    expect(so.cau.dong[0]![9]).toBe('')
    expect(so.cau.dong[0]).toHaveLength(so.cau.cot.length)
  })

  it('chấm bậy hoặc số câu không có thì không ghi', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    expect(chamCau(so, 1, 'hay-lam')).toBeNull()
    expect(chamCau(so, 99, 'on')).toBeNull()
    expect(so.cau.dong[0]![9]).toBe('')
  })
})

describe('Nguon.json — vòng hợp âm của câu', () => {
  /*
    Người dùng hỏi *"intro đã tạo vòng hợp âm trên giọng thứ chưa"* — mà sổ lúc ấy không
    lưu vòng, nên phải chạy lại code để dựng lại. Vòng dựng lại chưa chắc trùng vòng đã
    phát, vì nó phụ thuộc lượt. Lưu thẳng là đọc thẳng.
  */
  it('vòng hợp âm lưu đúng thứ tự ô', () => {
    const so = soRong()
    themCau(so, cau(A), 't1')
    expect(so.cau.dong[0]![10]).toEqual(['Dm', 'Gm', 'C', 'F', 'Bb', 'A7', 'Dm', 'A7'])
  })

  it('không có vòng thì để mảng rỗng, dòng vẫn đủ cột', () => {
    const so = soRong()
    themCau(so, { not: A, soO: 8 }, 't1')
    expect(so.cau.dong[0]![10]).toEqual([])
    expect(so.cau.dong[0]).toHaveLength(so.cau.cot.length)
  })

  it('gộp câu trùng vẫn so bằng NỐT, không so bằng hợp âm', () => {
    /*
      Hai câu khác nhau vẫn có thể đứng trên cùng một vòng hợp âm, mà thứ người dùng nghe
      và chấm là CÂU chứ không phải vòng.
    */
    const so = soRong()
    themCau(so, cau(A), 't1')
    const ra = themCau(so, cau(B), 't2')
    expect(ra.moi).toBe(true)
    expect(so.cau.dong).toHaveLength(2)
  })
})

describe('suKienTuNot', () => {
  it('đổi [phách, midi, ngân, tay] thành sự kiện', async () => {
    const { suKienTuNot } = await import('../nguon')
    const ev = suKienTuNot([
      [0, 72, 0.5, 'P'],
      [2, 48, 1, 'T'],
    ])
    expect(ev).toHaveLength(2)
    expect(ev[0]).toMatchObject({ startBeat: 0, notes: [72], hand: 'right' })
    expect(ev[1]).toMatchObject({ startBeat: 2, notes: [48], hand: 'left' })
  })
})
