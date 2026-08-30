import { describe, expect, it } from 'vitest'
import { getStyle, getVisibleStyles, hiddenBuiltIns, removeStyle, restoreHiddenStyles } from '../styleLibrary'

/*
  BIA MỘ XOÁ ĐIỆU PHẢI CÓ ĐƯỜNG QUAY LẠI.

  Xoá một điệu dựng sẵn thì id của nó vào `localStorage` và ở đó vĩnh viễn.
  Không nút nào, không thông báo nào đưa nó về. Đã cắn thật: người dùng xoá
  điệu bossa Cà Pháo, bản dựng lại mang ĐÚNG id cũ, và nó không bao giờ hiện
  lên — người dùng phải tự hỏi "sao chưa thấy" chứ app không nói gì.
*/
describe('hiện lại điệu dựng sẵn đã xoá', () => {
  const ID = 'bossa-ca-phao-som'

  it('xoá rồi thì biến mất, nhưng ĐẾM ĐƯỢC là đang ẩn', () => {
    expect(getStyle(ID)).toBeDefined()
    void removeStyle(ID)

    expect(getStyle(ID)).toBeUndefined()
    expect(getVisibleStyles().some((one) => one.id === ID)).toBe(false)
    // Đây là chỗ bản trước thiếu: app không biết mình đang giấu cái gì.
    expect(hiddenBuiltIns().map((one) => one.id)).toContain(ID)
  })

  it('hiện lại thì về đủ', () => {
    restoreHiddenStyles()
    expect(getStyle(ID)).toBeDefined()
    expect(hiddenBuiltIns()).toHaveLength(0)
  })
})
