import { afterEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { StylePicker } from '../StylePicker'
import { ALL_STYLES, getStyle, getVisibleStyles, hiddenBuiltIns, removeStyle, restoreHiddenStyles } from '../styleLibrary'
import { CHORUS_PAIRS, getSectionPlaybackStyle, resolveStyleForSection } from '../sectionStyles'

const base = 'ca-phao-ballad-co-em-cho'
const chorus = `${base}-chorus`
const markup = (selectedId = base) => renderToStaticMarkup(
  <StylePicker styles={ALL_STYLES} selectedId={selectedId} onSelect={() => {}} />,
)
const button = (html: string, label: string) =>
  html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)!.find(tag => tag.includes(`>${label}<`))

afterEach(() => restoreHiddenStyles())

describe('single picker choice with automatic section variants', () => {
  it('keeps pink Có Em Chờ separate from Claude Ballad Để em, including a saved chorus', () => {
    const html = markup(chorus)
    expect(html.match(/>Ballad Có Em Chờ</g)).toHaveLength(1)
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*text-pink-100[^>]*>Ballad Có Em Chờ<\/button>/)
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Ballad Để em<\/button>/)
    const other = markup('ca-phao-ballad-de-em-roi-xa')
    expect(other).toMatch(/<button[^>]*aria-pressed="true"[^>]*text-teal-key[^>]*>Ballad Để em<\/button>/)
    expect(other).toMatch(/<button[^>]*aria-pressed="false"[^>]*text-pink-300[^>]*>Ballad Có Em Chờ<\/button>/)
  })

  it('shows Slow Rock Lá thư hai tay once and keeps the saved chorus selection active', () => {
    const html = markup('slow-rock-la-thu-hai-tay-chorus')
    expect(html.match(/>Slow Rock Lá thư hai tay</g)).toHaveLength(1)
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*text-amber-key[^>]*>Slow Rock Lá thư hai tay<\/button>/)
  })

  it('highlights sheet arrangements separately from imported styles', () => {
    const html = markup('ca-phao-ballad-cu-di')
    for (const label of ['Ballad Có Em Chờ', 'Bossa CP cải tiến', 'Twist']) {
      expect(button(html, label), label).toContain('text-pink-300')
      expect(button(html, label), label).toContain('aria-pressed="false"')
    }
    for (const label of ['Ballad Để em', 'Slow Rock Lá thư hai tay', 'Slow Blues', 'Bolero Tuấn', 'Tango Tuấn']) {
      expect(button(html, label), label).toBeDefined()
      expect(button(html, label), label).not.toContain('pink-')
    }
  })

  it('never shows the internal patterns borrowed by the kept styles', () => {
    const html = markup('ca-phao-ballad-cu-di')
    for (const id of ['bolero-linh-nhi-2', 'ton-hung-ballad', 'ca-phao-bossa-sheet-9-10'])
      expect(html, id).not.toContain(`>${getStyle(id)!.familyName}<`)
  })

  it('shows only the song button, including for a saved chorus ID', () => {
    const visible = new Set(getVisibleStyles().map(style => style.id))
    for (const [verse, chorusId] of Object.entries(CHORUS_PAIRS)) {
      if (!visible.has(verse)) continue // khuôn ngầm (bolero rải Linh Nhi, Tôn Hùng) không có nút
      const html = markup(chorusId)
      expect(html).toContain(`>${getStyle(verse)!.familyName}`)
      expect(html).not.toContain(`>${getStyle(chorusId)!.name}</button>`)
      expect(html).toMatch(/aria-pressed="true"/)
    }
    expect(markup(chorus).match(/>Ballad Có Em Chờ</g)).toHaveLength(1)
  })

  it('does not resurrect a hidden base button through its chorus', async () => {
    await removeStyle(base)
    const before = hiddenBuiltIns().map(style => style.id)
    expect(markup()).not.toContain('>Ballad Có Em Chờ</button>')
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
    expect(markup()).toContain('>Ballad Có Em Chờ</button>')
  })

  it('a tombstone left on an internal pattern does not break the solo source', async () => {
    await removeStyle('bolero-linh-nhi-2')
    expect(getStyle('bolero-linh-nhi-2')?.id).toBe('bolero-linh-nhi-2')
    expect(hiddenBuiltIns().map(style => style.id)).not.toContain('bolero-linh-nhi-2')
  })
})
