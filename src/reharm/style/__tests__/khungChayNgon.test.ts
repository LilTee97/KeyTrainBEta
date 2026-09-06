import { describe, expect, it } from 'vitest'
import { khungChayNgon } from '../khungChayNgon'

/*
  KHOẢNG DÀNH CHO CÂU CHẠY NGÓN — thứ duy nhất còn sống của `raiLinhNhi.ts`.

  Bộ soạn ấy đã xoá: bộ ghép ô thật phủ kín cả ba đoạn, và đo được **0 trên 128 lượt** bộ
  ghép trả rỗng cho Linh Nhi, tức đường lui không bao giờ đi tới. Số đo của nó đã chép sang
  `PianoBrain/knowledge/teachers/linh-nhi-piano.md` mục 10b.

  Hàm này ở lại vì HAI chỗ trong `ReharmHome` cùng gọi nó — một chỗ dựng câu chạy tay phải,
  một chỗ buông tay trái ra đúng khoảng ấy. Chung một hàm thì hai bên không thể lệch nhau;
  đó là điều bài kiểm này canh.
*/

describe('khungChayNgon', () => {
  it('rơi vào Ô ÁP CHÓT, không phải ô cuối', () => {
    /* 10 ô × 4 phách. Vạch ô cuối ở phách 36; câu chạy chiếm 1,5 phách trước đó. */
    expect(khungChayNgon(40, 4)).toEqual({ tu: 34.5, den: 36 })
  })

  it('nốt cuối câu chạy ĐÁP ĐÚNG VẠCH, không để trống một phách', () => {
    /*
      Bản đầu chạy từ 1,5 tới 3,0 rồi trống một phách mới tới hợp âm báo. Người dùng nghe
      ra: "nghe nó khựng lại rất dở". Nay `den` phải trùng đúng vạch ô cuối.
    */
    for (const [tong, bar] of [[40, 4], [36, 4], [30, 3], [24, 3]] as const) {
      const k = khungChayNgon(tong, bar)!
      const soO = Math.floor(tong / bar)
      expect(k.den, `${tong}/${bar}`).toBe((soO - 1) * bar)
      expect(k.den - k.tu, `${tong}/${bar}`).toBeCloseTo(1.5)
    }
  })

  it('đoạn ngắn dưới ba ô thì KHÔNG chen câu chạy', () => {
    expect(khungChayNgon(8, 4)).toBeNull()
    expect(khungChayNgon(4, 4)).toBeNull()
    /* 11 phách chỉ đủ 2 ô trọn — `floor(11 / 4) = 2`, vẫn dưới ngưỡng. */
    expect(khungChayNgon(11, 4)).toBeNull()
    /* Đủ ba ô thì có: vạch ô cuối ở phách 8. */
    expect(khungChayNgon(12, 4)).toEqual({ tu: 6.5, den: 8 })
  })
})
