import { describe, expect, it } from 'vitest'
import { getStyle } from '../../reharm/style/styleLibrary'
import { TEACHERS, THU_TU_TAP } from '../teachers'

describe('TEACHERS — điệu của từng thầy', () => {
  it('mọi id điệu đều có thật trong thư viện điệu (đổi id điệu mà quên ở đây thì đỏ)', () => {
    for (const teacher of TEACHERS) {
      for (const id of teacher.styleIds) expect(getStyle(id), `${teacher.label}: ${id}`).toBeDefined()
    }
  })

  it('không điệu nào thuộc hai thầy', () => {
    const ids = TEACHERS.flatMap((teacher) => teacher.styleIds)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('thứ tự tập cả app có đủ mọi bài, mỗi bài một lần', () => {
    const ids = TEACHERS.flatMap((teacher) => teacher.styleIds)
    expect([...THU_TU_TAP].sort()).toEqual([...ids].sort())
    // Trong từng trang, thứ tự trên trang theo đúng thứ tự tập cả app.
    for (const teacher of TEACHERS) {
      expect(THU_TU_TAP.filter((id) => teacher.styleIds.includes(id)), teacher.label).toEqual([...teacher.styleIds])
    }
  })

  it('chín nút thành chín bài — bỏ bài điệp Có em chờ, Để em (người dùng 2/10/2026)', () => {
    expect(TEACHERS.map((teacher) => teacher.styleIds.length)).toEqual([4, 1, 2, 2])
  })
})
