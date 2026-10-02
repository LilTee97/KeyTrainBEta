import { describe, expect, it } from 'vitest'
import { getStyle } from '../../reharm/style/styleLibrary'
import { TEACHERS } from '../teachers'

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

  it('chín nút thành 11 bài: Có em chờ và Để em tách phiên · điệp (khác tiết tấu), Lá thư và Slow Blues một bài', () => {
    expect(TEACHERS.map((teacher) => teacher.styleIds.length)).toEqual([6, 1, 2, 2])
  })
})
