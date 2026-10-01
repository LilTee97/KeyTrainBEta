import { expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { voiceLeadTwoHands } from '../../voicingGenerator/handSplitVoicing'
import { renderPattern } from '../../style/patternRenderer'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED as style } from '../../style/styleLibrary/caPhaoBossa'
import type { ArrangementStep, SourceSection } from '../../style/arrangement'
import { bossaBackingSteps, bossaSoloSteps, buildBossaRhythmOnly } from '../bossaRhythmOnly'

it('giữ nhịp 6 tiếng ô A nguồn, nhấn rõ Bùm 3; thêm đúng 5 tiếng ô B', () => {
  // Khung chính thức được người dùng nghe duyệt 13/9/2026. Solo không được sửa snapshot này.
  expect(style.cell).toMatchSnapshot()
  for (const hand of ['left', 'right'] as const) {
    expect(style.cell![hand].filter(hit => hit.beat < 4 && hit.beat !== 0 && hit.beat !== 1 && !(hand === 'left' && hit.beat === 2.5)))
      .toEqual(CA_PHAO_BOSSA.cell![hand].filter(hit => hit.beat < 4 && hit.beat !== 0 && hit.beat !== 1)
        .map(hit => hand === 'left' && hit.beat === 1.5 ? { ...hit, velocityScale: .85 } : hit))
  }
  const mainHits = [...style.cell!.left, ...style.cell!.right].filter(hit => !hit.som)
  expect([...new Set(mainHits.map(hit => hit.beat))].sort((a, b) => a - b))
    .toEqual([0, 1, 1.5, 2, 2.5, 3.5, 4, 4.5, 5.5, 6, 7])
  expect(style.cell!.right.find(hit => hit.beat === 4.5)!.durationBeats).toBe(1)
})

it('Bùm 1 có quãng tám, chát 2 mạnh và có bè đỡ; giữ trường độ và Bùm 3 trên 12 giọng', () => {
  const roots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  for (const root of roots) {
    for (const teacher of [false, true]) {
      const chords = parseChordInput(`${root}m9 ${root}m9`).chords
        .map(chord => teacher ? { ...chord, voicingStyle: 'ca-phao' as const } : chord)
      const backing = renderPattern(voiceLeadTwoHands(chords), style)
      const boom = backing.find(e => e.startBeat === 0)!
      expect(boom.notes).toHaveLength(2)
      expect(boom.notes[1] - boom.notes[0]).toBe(12)
      expect(boom.durationBeats).toBe(1.5)
      const chat = backing.filter(e => e.startBeat === 1)
      expect(chat.map(e => e.hand).sort()).toEqual(['left', 'right'])
      expect(chat.every(e => e.durationBeats === .5)).toBe(true)
      expect(chat.find(e => e.hand === 'right')!.velocity).toBe(68)
      expect(chat.find(e => e.hand === 'left')!.notes[0] - boom.notes[0]).toBe(7)
      expect(backing.find(e => e.startBeat === 1.5)!.velocity).toBe(58)
      const fourth = backing.find(e => e.startBeat === 2 && e.hand === 'left')!
      const fifthBass = backing.find(e => e.startBeat === 2.5 && e.hand === 'left')!
      const fifthChat = backing.find(e => e.startBeat === 2.5 && e.hand === 'right')!
      expect(fifthBass.notes).toEqual(fourth.notes)
      expect(fifthBass.notes).toHaveLength(1)
      expect(fourth.startBeat + fourth.durationBeats).toBe(fifthBass.startBeat)
      expect(fifthBass.startBeat + fifthBass.durationBeats).toBe(4)
      expect(fifthBass.velocity).toBe(34)
      expect(fifthBass.velocity).toBeLessThan(fourth.velocity)
      expect(fifthChat.durationBeats).toBe(1)
      expect(fifthChat.velocity).toBe(58)
    }
  }
})

it('bài có intro/giang/outro chỉ còn các đoạn đệm, không mất chát hoặc chèn khoảng nghỉ', () => {
  const backing = renderPattern(voiceLeadTwoHands(parseChordInput('Am7 Dm7 E7 Am7').chords), style)
  const sources: SourceSection[] = [{ name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 16 }]
  const steps: ArrangementStep[] = [
    { type: 'intro', restAfter: 4 }, { type: 'section', source: 0 },
    { type: 'interlude', over: 0, loops: 2, restAfter: 4 },
    { type: 'section', source: 0 }, { type: 'outro' },
  ]
  const before = JSON.stringify(steps)
  const song = buildBossaRhythmOnly(backing, 16, sources, steps)
  expect(song.events).toEqual([...backing, ...backing.map(e => ({ ...e, startBeat: e.startBeat + 16 }))])
  expect(song.totalBeats).toBe(32)
  expect(song.soloTakes).toBe(0)
  expect(song.soloSpans).toEqual([])
  expect(song.sections.map(s => s.kind)).toEqual(['verse', 'verse'])
  expect(JSON.stringify(steps)).toBe(before)
  const loop = buildBossaRhythmOnly(backing, 16, null, [])
  expect(loop.events).toEqual(backing)
  expect(loop.totalBeats).toBe(16)
  expect(loop.soloTakes).toBe(0)
  // Đã bỏ hết đoạn solo thì không được lui về phát nguyên bài gốc chứa các đoạn đó.
  const introSources: SourceSection[] = [{ ...sources[0], name: 'Intro' }]
  const withoutSolo = bossaBackingSteps([{ type: 'section', source: 0 }], introSources)
  expect(buildBossaRhythmOnly(backing, 16, introSources, withoutSolo).events).toEqual([])
})

it('giang tấu tự chèn: Bossa CP 2 lượt; Twist 1 lượt (người dùng 30/9/2026, cũ 2)', () => {
  const sources: SourceSection[] = [{ name: 'Phiên', kind: 'verse', startBeat: 0, lengthBeats: 16 }]
  const giang = (steps: ArrangementStep[]) => steps.find(step => step.type === 'interlude')
  expect(giang(bossaSoloSteps([{ type: 'section', source: 0 }], sources))).toMatchObject({ loops: 2 })
  expect(giang(bossaSoloSteps([{ type: 'section', source: 0 }], sources, 1))).toMatchObject({ loops: 1 })
  // Giang tấu người dùng đã sắp thì giữ nguyên số lượt của họ.
  const sap: ArrangementStep[] = [{ type: 'section', source: 0 }, { type: 'interlude', over: 0, loops: 3 }]
  expect(giang(bossaSoloSteps(sap, sources, 1))).toMatchObject({ loops: 3 })
})
