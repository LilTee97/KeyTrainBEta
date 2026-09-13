import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { buildPhraseSection, type PhraseSectionOptions } from '../phraseSection'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED } from '../styleLibrary/caPhaoBossa'
import { parseChordInput } from '../../input/chordInputParser'
import { pitchClassName } from '../../../shared/musicTheory/pitch'
import type { PitchClass } from '../../../shared/musicTheory/types'

// Solo cũ đã bỏ khỏi đường phát. Kiểm bản lưu trên ô A nguồn, không áp
// thay đổi lực/độ dày của bản CHỈ ĐỆM đang được người dùng nghe duyệt.
const style = { ...CA_PHAO_BOSSA_IMPROVED, cell: { ...CA_PHAO_BOSSA_IMPROVED.cell!,
  left: [...CA_PHAO_BOSSA.cell!.left.filter(hit => hit.beat < 4), ...CA_PHAO_BOSSA_IMPROVED.cell!.left.filter(hit => hit.beat >= 4)],
  right: [...CA_PHAO_BOSSA.cell!.right.filter(hit => hit.beat < 4), ...CA_PHAO_BOSSA_IMPROVED.cell!.right.filter(hit => hit.beat >= 4)],
} }

const make = (kind: PhraseSectionOptions['kind'], tonic: number, take: number, high = 84) =>
  buildPhraseSection({ kind, key: { tonic: tonic as PitchClass, scale: 'minor' }, style,
    take, beatsPerChord: 4, dropRoot: true, range: { low: 62, high },
    opening: parseChordInput(pitchClassName(tonic as PitchClass) + 'm').chords[0]!, solo: () => [],
  })!

// Snapshot tạo từ 3854241 sau khi hoàn nguyên toàn bộ bản sửa bị bác.
it('giữ nguyên toàn bộ bản đã duyệt: nốt, hai tay, lực, gate, hòa âm và cadence', () => {
  const hashes = []
  for (const kind of ['intro', 'interlude', 'outro'] as const) {
    const digest = createHash('sha256')
    for (let tonic = 0; tonic < 12; tonic++) {
      for (let take = 0; take < 4; take++) {
        digest.update(JSON.stringify(make(kind, tonic, take)))
      }
    }
    hashes.push([kind, digest.digest('hex')])
  }
  expect(hashes).toMatchSnapshot()
})
