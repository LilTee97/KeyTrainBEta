import { describe, expect, it } from 'vitest'
import { getVisibleStyles } from '../styleLibrary'
import { khongTiaTayTrai, raiMoRongOGiangTau, raiTheoTayTrai, soloTuDoCaPhao } from '../hoDieu'

/*
  MỖI ĐIỆU CHỈ THEO MỘT THẦY.

  Người dùng đặt luật đứng: mỗi lần học phong cách của ai thì phải tách hết
  khỏi các thầy khác, và chỉ hoà hai phong cách khi họ yêu cầu đích danh.

  Luật này không chỉ nói về "bộ sinh nào chạy". Nó nói cả về những chỗ mượn nhỏ
  trông như cho nhất quán: mượn hằng số đã chỉnh trên bản ký âm của thầy khác,
  gọi hàm của thầy khác vì "cũng là việc ấy", hay để một luật hậu kỳ chung nắn
  lại đường nét vốn dựng theo nguyên tắc của thầy này.

  Ca đã suýt lọt: `KHE_HEP` trong `caPhaoSolo.ts` từng lấy 7 "theo raiLinhNhi
  cho nhất quán". Đo lại thì nó sai cả về số — khe hai tay Linh Nhi trung vị 24
  (hẹp nhất 9), còn Cà Pháo 12-17 (hẹp nhất 0-6). Ép khe 7 là ép Cà Pháo chơi
  rộng như Linh Nhi, tức xoá đúng chỗ khác nhau giữa hai người.
*/
describe('tách phong cách từng thầy', () => {
  it('không điệu nào mang hai lối solo cùng lúc', () => {
    for (const style of getVisibleStyles()) {
      const hai = [soloTuDoCaPhao(style.id), raiTheoTayTrai(style.id)].filter(Boolean)
      expect(hai.length, `${style.id} mang ${hai.length} lối solo`).toBeLessThanOrEqual(1)
    }
  })

  /*
    Điệu bossa của Cà Pháo nằm trong họ bossa, mà cả họ ấy đã bật lối bám tay
    trái của Linh Nhi. Đây đúng là chỗ hai phong cách chồng lên nhau, nên khoá
    riêng nó.
  */
  it('Ballad Tôn Hùng không dính lối tự do Cà Pháo hay rải Linh Nhi', () => {
    expect(soloTuDoCaPhao('ton-hung-ballad')).toBe(false)
    expect(raiTheoTayTrai('ton-hung-ballad')).toBe(false)
  })

  it('điệu Cà Pháo KHÔNG dính lối bám tay trái của Linh Nhi', () => {
    expect(soloTuDoCaPhao('bossa-ca-phao-som')).toBe(true)
    expect(raiTheoTayTrai('bossa-ca-phao-som')).toBe(false)
    // Điệu bossa khác trong cùng họ thì vẫn giữ lối Linh Nhi.
    expect(raiTheoTayTrai('bossa-nova-1')).toBe(true)
  })

  /*
    Hai cờ kia cũng đo trên bản ký âm Linh Nhi, nên chúng không được chạm vào
    điệu của thầy khác.
  */
  it('cờ đo trên Linh Nhi không lan sang điệu có lối solo riêng', () => {
    for (const style of getVisibleStyles()) {
      if (!soloTuDoCaPhao(style.id)) continue
      expect(khongTiaTayTrai(style.id), style.id).toBe(false)
      expect(raiMoRongOGiangTau(style.id), style.id).toBe(false)
    }
  })
})
