import { chordAtDegree } from '../../shared/musicTheory/scales'
import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { SoloTeacher, TonHungGiang } from '../fillSoloGenerator/soloTeacher'

/**
 * Vòng dạo / giang tấu / kết theo sheet từng thầy — không chép phiên, không
 * hỏi não thầy Hải.
 *
 * Cà Pháo: I–V–I–V (Người hãy quên). Giang: I–°–I–V khi dựng được dim.
 * Linh Nhi: bậc Đừng Xa (Dm) dựng lại trên tonic bài (Để nhớ = Am). Không dán Dm.
 * Tôn Hùng: I–IV–V–I. Giang: theo bài / hòa trộn, vào giọng thứ.
 */

type Key = { tonic: PitchClass; scale: ScaleType }

function parsed(
  chord: { root: PitchClass; quality: ParsedChord['quality']; symbol: string },
): ParsedChord {
  return {
    root: chord.root,
    quality: chord.quality,
    source: chord.symbol,
    symbol: chord.symbol,
  }
}

function fromPool(pool: readonly ParsedChord[], root: PitchClass): ParsedChord | null {
  return pool.find((chord) => chord.root === root) ?? null
}

function bac(
  key: Key,
  degree: number,
  pool: readonly ParsedChord[],
): ParsedChord | null {
  const built = chordAtDegree(key.tonic, key.scale, degree)
  if (!built) return null
  return fromPool(pool, built.root) ?? parsed(built)
}

function bacTron(key: Key, degree: number): ParsedChord | null {
  const built = chordAtDegree(key.tonic, key.scale, degree)
  return built ? parsed(built) : null
}

function I(key: Key, pool: readonly ParsedChord[]): ParsedChord | null {
  return fromPool(pool, key.tonic) ?? bac(key, 1, pool)
}

function V7(key: Key, pool: readonly ParsedChord[]): ParsedChord | null {
  const built = chordAtDegree(key.tonic, key.scale, 5, { qualityOverride: '7' })
  if (!built) return bac(key, 5, pool)
  const coBay = pool.find(
    (chord) => chord.root === built.root && chord.quality.intervals.includes(10),
  )
  return coBay ?? parsed(built)
}

function fill(chords: Array<ParsedChord | null>): ParsedChord[] {
  return chords.filter((chord): chord is ParsedChord => chord !== null)
}

function giongThu(key: Key): Key {
  return key.scale === 'minor'
    ? key
    : { tonic: ((key.tonic + 9) % 12) as PitchClass, scale: 'minor' }
}

/** Biển Tình = D trưởng; mọi giọng quy về trưởng song song. */
function giongTruong(key: Key): Key {
  return key.scale === 'major'
    ? key
    : { tonic: ((key.tonic + 3) % 12) as PitchClass, scale: 'major' }
}

function bacTruong(key: Key, degree: number): ParsedChord | null {
  return bacTron(giongTruong(key), degree)
}

function thu(key: Key, degree: number, qualityOverride?: string): ParsedChord | null {
  const k = giongThu(key)
  const built = chordAtDegree(
    k.tonic,
    'minor',
    degree,
    qualityOverride ? { qualityOverride } : {},
  )
  return built ? parsed(built) : null
}

/** Chiếc Lá ô 58–65: i V7 iv i | bvii iv i V7 */
export function chiecLaGiangChords(key: Key): ParsedChord[] {
  return fill([
    thu(key, 1),
    thu(key, 5, '7'),
    thu(key, 4),
    thu(key, 1),
    thu(key, 7, 'min'),
    thu(key, 4),
    thu(key, 1),
    thu(key, 5, '7'),
  ])
}

/** Tình Em ô 33–40: i VI vii° IΔ | V7/V V7 v7 i */
export function tinhEmGiangChords(key: Key): ParsedChord[] {
  return fill([
    thu(key, 1),
    thu(key, 6),
    thu(key, 2),
    thu(key, 3, 'maj7'),
    thu(key, 4, '7'),
    thu(key, 5, '7'),
    thu(key, 5, 'm7'),
    thu(key, 1),
  ])
}

/** Nửa đầu Chiếc Lá, nửa sau cadence Tình Em. */
export function hoaTronGiangChords(key: Key): ParsedChord[] {
  return fill([
    thu(key, 1),
    thu(key, 5, '7'),
    thu(key, 4),
    thu(key, 1),
    thu(key, 2),
    thu(key, 4, '7'),
    thu(key, 5, '7'),
    thu(key, 1),
  ])
}

export function introChordsForTeacher(
  thay: SoloTeacher,
  key: Key,
  pool: readonly ParsedChord[],
  // Giữ tham số cho đúng vị trí của mọi lời gọi. Vòng dạo giờ lấy thẳng từ
  // songIntro (ô nhịp thật của bản ký âm) chứ không rút từ phần hát nữa, nên
  // verse hết việc — nhưng bỏ nó đi thì lệch mọi đối số phía sau.
  _verse: readonly ParsedChord[],
  songIntro: readonly ParsedChord[] = [],
): ParsedChord[] {
  if (thay === 'linh-nhi') {
    const dao = songIntro.filter((chord) => !chord.passing).slice(0, 8)
    if (dao.length >= 4) return [...dao]
    const vong = fill([
      thu(key, 1),
      thu(key, 7),
      thu(key, 6),
      thu(key, 3),
      thu(key, 4),
      thu(key, 1),
      thu(key, 5, '7'),
      thu(key, 1),
    ])
    if (vong.length >= 3) return vong
  }

  if (thay === 'ton-hung') {
    const dao = songIntro.filter((chord) => !chord.passing).slice(0, 8)
    if (dao.length >= 4) return [...dao]
    const vong = fill([I(key, pool), bac(key, 4, pool), V7(key, pool), I(key, pool)])
    if (vong.length >= 3) return vong
  }

  if (thay === 'ca-phao') {
    const vong = fill([I(key, pool), V7(key, pool), I(key, pool), V7(key, pool)])
    if (vong.length >= 3) return vong
  }

  return []
}

export function interludeChordsForTeacher(
  thay: SoloTeacher,
  key: Key,
  pool: readonly ParsedChord[],
  _verse: readonly ParsedChord[],
  next: ParsedChord | null = null,
  _songIntro: readonly ParsedChord[] = [],
  giang: TonHungGiang = 'hoa-tron',
): ParsedChord[] {
  if (thay === 'linh-nhi') {
    const vong = fill([
      thu(key, 6, 'maj7'),
      thu(key, 1),
      thu(key, 7),
      thu(key, 6, 'min'),
      thu(key, 3),
      thu(key, 4),
      thu(key, 1),
      thu(key, 5, '7'),
    ])
    if (vong.length === 0) return []
    const vao = next
      ? chordAtDegree(next.root, next.quality.intervals.includes(3) ? 'minor' : 'major', 5, {
          qualityOverride: '7',
        })
      : thu(key, 5, '7')
    if (vao) vong[vong.length - 1] = 'source' in vao ? vao : parsed(vao)
    return vong
  }

  if (thay === 'ton-hung') {
    const vong =
      giang === 'chiec-la'
        ? chiecLaGiangChords(key)
        : giang === 'tinh-em'
          ? tinhEmGiangChords(key)
          : hoaTronGiangChords(key)
    if (vong.length >= 3) return vong
  }

  if (thay === 'ca-phao') {
    const tonic = I(key, pool)
    const dimQ = getChordQuality('dim')
    const dim =
      tonic && dimQ
        ? parsed({
            root: ((tonic.root + 1) % 12) as PitchClass,
            quality: dimQ,
            symbol: `${pitchClassName(((tonic.root + 1) % 12) as PitchClass)}${dimQ.symbol}`,
          })
        : null
    const vong = fill([tonic, dim, tonic, V7(key, pool)])
    if (vong.length >= 3) return vong
  }

  return []
}

/** Trưởng: Biển Tình vi–iii–ii–I. Thứ: Đừng Xa i–iv–i–V7. */
export function outroChordsForTeacher(thay: SoloTeacher, key: Key): ParsedChord[] {
  if (thay !== 'linh-nhi') return []
  if (key.scale === 'minor') {
    return fill([thu(key, 1), thu(key, 4), thu(key, 1), thu(key, 5, '7')])
  }
  return fill([
    bacTruong(key, 6),
    bacTruong(key, 3),
    bacTruong(key, 2),
    bacTruong(key, 1),
  ])
}
