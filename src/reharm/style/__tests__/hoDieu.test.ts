import { describe, expect, it } from 'vitest'
import {
  HO_DIEU,
  hoCuaDieu,
  kieuChoDiepKhuc,
  kieuChoSolo,
  kieuTrongHo,
} from '../hoDieu'
import { getStyle } from '../styleLibrary'

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
  it('bolero Tuấn Lưu và bolero Linh Nhi cùng một họ', () => {
    expect(hoCuaDieu('bolero-1')).toBe('bolero')
    expect(hoCuaDieu('bolero-linh-nhi')).toBe('bolero')
    expect(hoCuaDieu('bolero-linh-nhi-2')).toBe('bolero')
    expect(hoCuaDieu('bolero-tu-n-improv-bai-04-00001')).toBe('bolero')
  })

  it('slow rock của ba nguồn cùng một họ', () => {
    for (const id of ['slow-rock-2', 'slow-rock-duc-thinh-3', 'hai-slow-rock']) {
      expect(hoCuaDieu(id), id).toBe('slow-rock')
    }
  })

  it('ballad của bốn nguồn cùng một họ', () => {
    for (const id of ['pop-1', 'hai-pop-ballad', 'hai-pop-ballad-free', 'hai-ballad-dan-ca']) {
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
    expect(kieuChoSolo('bolero-1')).toBe('bolero-linh-nhi-2')
    expect(kieuChoSolo('bolero-tu-n-improv-bai-04-00001')).toBe('bolero-linh-nhi-2')
  })

  it('người dùng chọn rồi thì theo họ', () => {
    expect(kieuChoSolo('bolero-linh-nhi-2', 'bolero-1')).toBe('bolero-1')
  })

  /*
    LUẬT CỨNG. Lựa chọn ngoài họ bị bỏ, không phải bị nhận rồi cảnh báo. Đây
    đúng là ca hỏng người dùng từng bác: chọn slow rock mà đoạn không lời chơi
    ballad.
  */
  it('lựa chọn NGOÀI HỌ bị bỏ, không bao giờ được dùng', () => {
    expect(kieuChoSolo('slow-rock-duc-thinh-3', 'hai-pop-ballad')).not.toBe('hai-pop-ballad')
    expect(hoCuaDieu(kieuChoSolo('slow-rock-duc-thinh-3', 'hai-pop-ballad'))).toBe('slow-rock')
  })

  it('họ không khai kiểu ưu tiên thì câu solo dùng luôn kiểu phần hát', () => {
    expect(HO_DIEU['slow-rock']!.soloUuTien).toBeUndefined()
    expect(kieuChoSolo('slow-rock-duc-thinh-3')).toBe('slow-rock-duc-thinh-3')
  })

  it('điệu chưa gom vào họ nào thì giữ nguyên, không đổi gì', () => {
    expect(hoCuaDieu('funk-1')).toBe(null)
    expect(kieuChoSolo('funk-1')).toBe('funk-1')
    expect(kieuChoSolo('funk-1', 'rock-1')).toBe('funk-1')
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
    expect(kieuChoDiepKhuc('bolero-1')).toBe('bolero-1')
    expect(kieuChoDiepKhuc('bolero-1', null)).toBe('bolero-1')
  })

  it('chọn trong cùng họ thì đổi', () => {
    expect(kieuChoDiepKhuc('bolero-1', 'bolero-linh-nhi-2')).toBe('bolero-linh-nhi-2')
  })

  it('chọn ngoài họ thì bỏ, quay về phiên khúc', () => {
    expect(kieuChoDiepKhuc('bolero-1', 'hai-pop-ballad')).toBe('bolero-1')
  })
})
