import { describe, expect, it } from 'vitest'
import {
  HO_DIEU,
  hoCuaDieu,
  kieuChoDiepKhuc,
  kieuChoSolo,
  laBoleroTuan,
  kieuTrongHo,
} from '../hoDieu'
import { getStyle } from '../styleLibrary'

// 30/9/2026: kiểm trên điệu còn giữ (+ khuôn ngầm). Điệu cũ (Bolero 1, Bolero trữ tình, Slow Rock 2, Đức Thịnh,
// Pop, Hải…) đã xoá.
const BT = 'bolero-tu-n-improv-bai-04-00001'

/*
  HỌ ĐIỆU chứa nhiều KIỂU ĐỆM, và các kiểu ấy dùng lẫn nhau được.

  Trong thư viện, `family` đang ở mức cái KIỂU chứ không phải mức cái HỌ: Bolero
  nằm rải ở bốn `family`, Slow Rock ở ba, Ballad ở bốn. Tầng này gom lại bằng
  cách CỘNG THÊM, không sửa 102 bản ghi điệu.

  Luật phải giữ cho bằng được: mọi phép chọn tự động đều bị chặn TRONG MỘT HỌ.
  Luật cũ cấm app tự ý đổi họ sau lưng người dùng — nó ra đời từ một lỗi thật,
  chọn slow rock mà giang tấu đổi tay trái sang câu rải ballad. Chọn giữa các
  kiểu trong chính họ đã chọn thì là phối khí, không phải đánh tráo.
*/

describe('họ điệu gom các kiểu lại', () => {
  it('mọi family khai trong bảng đều có thật', () => {
    for (const [ho, mo] of Object.entries(HO_DIEU)) {
      for (const family of mo.families) {
        expect(kieuTrongHo(ho).length, `${ho} / ${family}`).toBeGreaterThan(0)
      }
    }
  })

  it('không family nào thuộc hai họ', () => {
    const thay = new Set<string>()
    for (const mo of Object.values(HO_DIEU)) {
      for (const family of mo.families) {
        expect(thay.has(family), family).toBe(false)
        thay.add(family)
      }
    }
  })

  /*
    Đây là chỗ người dùng bảo sửa: hai bolero của hai người soạn khác nhau phải
    là CÙNG MỘT HỌ, không phải hai điệu rời.
  */
  it('laBoleroTuan chỉ Pùng-Pắp, không rải Linh Nhi', () => {
    expect(laBoleroTuan(getStyle(BT)!)).toBe(true)
    expect(laBoleroTuan(getStyle('bolero-linh-nhi-2')!)).toBe(false)
  })

  it('bolero Tuấn Lưu và bolero Linh Nhi cùng một họ', () => {
    expect(hoCuaDieu('bolero-linh-nhi-2')).toBe('bolero')
    expect(hoCuaDieu(BT)).toBe('bolero')
  })

  it('slow rock Lá thư hai tay thuộc họ slow rock', () => {
    for (const id of ['slow-rock-la-thu-hai-tay', 'slow-rock-la-thu-hai-tay-chorus']) {
      expect(hoCuaDieu(id), id).toBe('slow-rock')
    }
  })

  it('ballad của hai thầy cùng một họ', () => {
    for (const id of ['ca-phao-ballad-cu-di', 'ca-phao-ballad-co-em-cho', 'ca-phao-ballad-de-em-roi-xa', 'ton-hung-ballad']) {
      expect(hoCuaDieu(id), id).toBe('ballad')
    }
  })

  /*
    Bản điệp khúc không phải một kiểu riêng để chọn — nó là mặt cao trào của
    chính kiểu đứng cạnh, và phép đổi sang nó đã tự chạy theo đoạn.
  */
  it('bảng chọn kiểu không bày bản điệp khúc', () => {
    for (const ho of Object.keys(HO_DIEU)) {
      for (const style of kieuTrongHo(ho)) {
        expect(style.id.endsWith('-chorus'), style.id).toBe(false)
      }
    }
    expect(kieuTrongHo('bolero').map((s) => s.id)).toContain('bolero-linh-nhi-2')
    expect(kieuTrongHo('bolero').map((s) => s.id)).not.toContain('bolero-linh-nhi-2-chorus')
    expect(kieuTrongHo('ballad').map((s) => s.id)).toContain('ton-hung-ballad')
    expect(kieuTrongHo('ballad').map((s) => s.id)).not.toContain('ton-hung-ballad-giang')
    expect(kieuTrongHo('ballad').map((s) => s.id)).not.toContain('ton-hung-tinh-em-giang')
  })
})

describe('chọn kiểu cho câu solo', () => {
  it('bolero không chọn thì tự lấy bản rải của Linh Nhi', () => {
    expect(kieuChoSolo(BT)).toBe('bolero-linh-nhi-2')
  })

  it('người dùng chọn rồi thì theo họ', () => {
    expect(kieuChoSolo(BT, BT)).toBe(BT)
  })

  /*
    LUẬT CỨNG. Lựa chọn ngoài họ bị bỏ, không phải bị nhận rồi cảnh báo. Đây
    đúng là ca hỏng người dùng từng bác: chọn slow rock mà đoạn không lời chơi
    ballad.
  */
  it('lựa chọn NGOÀI HỌ bị bỏ, không bao giờ được dùng', () => {
    expect(kieuChoSolo('slow-rock-la-thu-hai-tay', 'ca-phao-ballad-cu-di')).not.toBe('ca-phao-ballad-cu-di')
    expect(hoCuaDieu(kieuChoSolo('slow-rock-la-thu-hai-tay', 'ca-phao-ballad-cu-di'))).toBe('slow-rock')
  })

  it('họ không khai kiểu ưu tiên thì câu solo dùng luôn kiểu phần hát', () => {
    expect(HO_DIEU['slow-rock']!.soloUuTien).toBeUndefined()
    expect(kieuChoSolo('slow-rock-la-thu-hai-tay')).toBe('slow-rock-la-thu-hai-tay')
  })

  it('điệu chưa gom vào họ nào thì giữ nguyên, không đổi gì', () => {
    expect(hoCuaDieu('blue-sun')).toBe(null)
    expect(kieuChoSolo('blue-sun')).toBe('blue-sun')
    expect(kieuChoSolo('blue-sun', 'twist')).toBe('blue-sun')
  })

  it('kiểu ưu tiên phải là điệu có thật', () => {
    for (const [ho, mo] of Object.entries(HO_DIEU)) {
      if (!mo.soloUuTien) continue
      expect(getStyle(mo.soloUuTien)?.id, ho).toBe(mo.soloUuTien)
      expect(hoCuaDieu(mo.soloUuTien), ho).toBe(ho)
    }
  })
})

describe('chọn kiểu cho điệp khúc', () => {
  it('không chọn thì theo phiên khúc', () => {
    expect(kieuChoDiepKhuc(BT)).toBe(BT)
    expect(kieuChoDiepKhuc(BT, null)).toBe(BT)
  })

  it('chọn trong cùng họ thì đổi', () => {
    expect(kieuChoDiepKhuc(BT, 'bolero-linh-nhi-2')).toBe('bolero-linh-nhi-2')
  })

  it('chọn ngoài họ thì bỏ, quay về phiên khúc', () => {
    expect(kieuChoDiepKhuc(BT, 'ca-phao-ballad-cu-di')).toBe(BT)
  })
})
