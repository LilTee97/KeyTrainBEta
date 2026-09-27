import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { ParsedChord } from '../types'
import { withQuality } from './staticVoicingRules'

/** Màu theo chức năng Blues, từ hợp âm gốc; giữ bass, thời lượng và hợp âm đặc biệt. */
export function colorBluesHarmony(chords: readonly ParsedChord[], key: { tonic: number; scale: ScaleType } | null): ParsedChord[] {
  return chords.map(chord => {
    if (!key) return chord
    const degree = normalizePitchClass(chord.root - key.tonic)
    const id = chord.quality.id
    if (key.scale === 'minor') {
      if (id === 'min' && (degree === 0 || degree === 5)) return withQuality(chord, 'm7')
      if (id === 'maj' && degree === 7) return withQuality(chord, '7')
      return chord
    }
    // I7 là màu chủ Blues. IV9/V9 giữ 3–b7 và thêm 9; không biến vi/ii thành át.
    if (['maj', 'add9', '6'].includes(id) && [0, 5, 7].includes(degree)) {
      return withQuality(chord, degree === 0 ? '7' : '9')
    }
    return chord
  })
}
