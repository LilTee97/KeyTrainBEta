import { afterEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { StylePicker } from '../StylePicker'
import { ALL_STYLES, getStyle, hiddenBuiltIns, removeStyle, restoreHiddenStyles } from '../styleLibrary'
import { CHORUS_PAIRS, getSectionPlaybackStyle, resolveStyleForSection } from '../sectionStyles'

const base = 'ca-phao-ballad-acdd'
const chorus = `${base}-chorus`
const markup = (selectedId = base) => renderToStaticMarkup(
  <StylePicker styles={ALL_STYLES} selectedId={selectedId} onSelect={() => {}} />,
)

afterEach(() => restoreHiddenStyles())

describe('single picker choice with automatic section variants', () => {
  it('shows only the song button, including for a saved chorus ID', () => {
    for (const [verse, chorusId] of Object.entries(CHORUS_PAIRS)) {
      const html = markup(chorusId)
      expect(html).toContain(`>${getStyle(verse)!.familyName}`)
      expect(html).not.toContain(`>${getStyle(chorusId)!.name}</button>`)
      expect(html).toMatch(/aria-pressed="true"/)
    }
    expect(markup(chorus).match(/>Ballad ACDD</g)).toHaveLength(1)
  })

  it('retains independent variations such as Pop 1 and Pop 2', () => {
    const html = markup('pop-1')
    expect(html).toContain(`>${getStyle('pop-1')!.name}</button>`)
    expect(html).toContain(`>${getStyle('pop-2')!.name}</button>`)
  })

  it('does not resurrect a hidden base button through its chorus', async () => {
    await removeStyle(base)
    const before = hiddenBuiltIns().map(style => style.id)
    expect(markup()).not.toContain('>Ballad ACDD</button>')
    expect(hiddenBuiltIns().map(style => style.id)).toEqual(before)
    expect(getStyle(base)).toBeUndefined()
  })

  it('can play an internal chorus hidden in the old UI without restoring buttons', async () => {
    await removeStyle(chorus)
    const before = hiddenBuiltIns().map(style => style.id)
    const chosen = resolveStyleForSection(base, 'chorus')
    expect(getSectionPlaybackStyle(chosen)?.id).toBe(chorus)
    expect(getStyle(chorus)).toBeUndefined()
    expect(hiddenBuiltIns().map(style => style.id)).toEqual(before)
    expect(markup()).toContain('>Ballad ACDD</button>')
  })
})
