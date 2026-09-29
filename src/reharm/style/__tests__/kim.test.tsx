import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { StylePicker } from '../StylePicker'
import { renderPattern } from '../patternRenderer'
import { ALL_STYLES, getStyle } from '../styleLibrary'

const eighths = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
const render = (input: string) => renderPattern(voiceLeadTwoHands(parseChordInput(input).chords), getStyle('kim')!, {})

describe('Kim — đệm rock\'n\'roll đo từ bản thu ASIA', () => {
  it('có đúng một nút Kim trong bảng chọn', () => {
    const html = renderToStaticMarkup(<StylePicker styles={ALL_STYLES} selectedId="kim" onSelect={() => {}} />)
    expect((html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []).filter(b => />Kim<\/button>/.test(b))).toHaveLength(1)
  })

  it('tay trái 1 1 3 3 5 5 6 5, tay phải chặn hợp âm cả 8 móc đơn, nhấn 2 · 2& · 4', () => {
    const events = render('C F G')
    for (const [bar, root] of [36, 41, 43].entries()) {
      const inBar = events.filter(e => e.startBeat >= bar * 4 && e.startBeat < bar * 4 + 4)
      const left = inBar.filter(e => e.hand === 'left')
      const right = inBar.filter(e => e.hand === 'right')
      expect(left.map(e => e.startBeat - bar * 4)).toEqual(eighths)
      expect(left.map(e => e.notes)).toEqual([0, 0, 4, 4, 7, 7, 9, 7].map(k => [root + k]))
      expect(right.map(e => e.startBeat - bar * 4)).toEqual(eighths)
      for (const e of right) expect(new Set(e.notes.map(n => (n - root + 120) % 12))).toEqual(new Set([0, 4, 7]))
      const nhan = right.filter(e => e.velocity > right[0].velocity).map(e => e.startBeat - bar * 4)
      expect(nhan).toEqual([1, 1.5, 3])
    }
  })
})
