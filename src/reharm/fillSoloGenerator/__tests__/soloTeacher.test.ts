import { describe, expect, it } from 'vitest'
import {
  melodyKind,
  noteSourceForTeacher,
  soloTeacherOf,
  styleIdForTeacher,
  teacherEndsWithRun,
} from '../soloTeacher'
import { raiTheoTayTrai, soloTuDoCaPhao } from '../../style/hoDieu'

describe('tách thầy khi sinh solo', () => {
  it('Tôn Hùng không dính Cà Pháo hay Linh Nhi', () => {
    expect(soloTeacherOf('ton-hung-ballad')).toBe('ton-hung')
    expect(soloTuDoCaPhao('ton-hung-ballad')).toBe(false)
    expect(raiTheoTayTrai('ton-hung-ballad')).toBe(false)
    expect(teacherEndsWithRun('ton-hung')).toBe(false)
    expect(noteSourceForTeacher('ton-hung')).toBe('chordTone')
    expect(melodyKind('ton-hung')).toBe('stable')
    expect(melodyKind('ca-phao')).toBe('color')
  })

  it('nút thầy trỏ đúng điệu', () => {
    expect(styleIdForTeacher('ton-hung')).toBe('ton-hung-ballad')
    expect(styleIdForTeacher('linh-nhi')).toBe('bolero-linh-nhi-2')
    expect(styleIdForTeacher('ca-phao')).toBe('bossa-ca-phao-som')
  })

  it('Cà Pháo bossa và Linh Nhi bolero mỗi người một lối', () => {
    expect(soloTeacherOf('bossa-ca-phao-som')).toBe('ca-phao')
    expect(soloTeacherOf('bolero-linh-nhi-2')).toBe('linh-nhi')
    expect(noteSourceForTeacher('linh-nhi')).toBe('chordTone')
  })
})
