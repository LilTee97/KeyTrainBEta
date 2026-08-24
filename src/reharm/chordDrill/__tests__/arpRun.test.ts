import { describe, expect, it } from 'vitest'
import { parseNamed } from '../chordDrillEngine'
import { buildArpRun, nextNoteHit } from '../arpRun'

describe('rải arpeggio', () => {
  it('tay phải lên rồi về, tay trái xuống rồi về', () => {
    const [c] = parseNamed('C')
    const run = buildArpRun(c!, 'chord', 'both')
    expect(run.right[0]).toBeLessThan(run.right[Math.floor(run.right.length / 2)])
    expect(run.left[0]).toBeGreaterThan(run.left[Math.floor(run.left.length / 2)])
    expect(run.right.at(-1)).toBe(run.right[0])
    expect(run.left.at(-1)).toBe(run.left[0])
  })

  it('chromatic có đủ 12 lớp', () => {
    const [c] = parseNamed('C')
    const run = buildArpRun(c!, 'chromatic', 'right')
    const pcs = new Set(run.right.map((note) => note % 12))
    expect(pcs.size).toBe(12)
    expect(run.scaleName).toBe('Chromatic')
  })

  it('theo gam thì vẫn rải được và có tên', () => {
    const [c] = parseNamed('Cmaj7')
    const run = buildArpRun(c!, 'scale', 'right')
    expect(run.right.length).toBeGreaterThan(4)
    expect(run.scaleName.length).toBeGreaterThan(0)
  })

  it('chỉ tính nốt mới bấm', () => {
    expect(nextNoteHit([60], [], 60)).toBe(true)
    expect(nextNoteHit([60], [60], 60)).toBe(false)
  })
})
