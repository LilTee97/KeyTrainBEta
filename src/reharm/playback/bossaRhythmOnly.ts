import { buildArrangedSong, type ArrangementStep, type SourceSection } from '../style/arrangement'
import { buildSongTimeline, SONG_FORMS } from '../style/songStructure'
import type { TimelineEvent } from '../style/types'
import type { PhraseSection } from '../style/phraseSection'

/**
 * Restore missing instrumental steps without deleting/reordering the user's sung steps.
 * `interludeLoops`: số lượt của giang tấu tự chèn — Bossa CP 2; Twist 1 (người dùng 30/9/2026, cũ 2).
 */
export function bossaSoloSteps(steps: readonly ArrangementStep[], sources: readonly SourceSection[],
  interludeLoops = 2): ArrangementStep[] {
  const result = [...steps]
  if (!result.some(s => s.type === 'section')) return result
  if (!result.some(s => s.type === 'intro')) result.unshift({ type: 'intro', restAfter: 0 })
  if (!result.some(s => s.type === 'interlude')) {
    const chorus = result.findIndex(s => s.type === 'section' && sources[s.source]?.kind === 'chorus')
    const at = chorus >= 0 ? chorus : result.findLastIndex(s => s.type === 'section')
    const over = (result[at] as Extract<ArrangementStep, { type: 'section' }>).source
    result.splice(at + 1, 0, { type: 'interlude', over, loops: interludeLoops, restAfter: 0 })
  }
  if (!result.some(s => s.type === 'outro')) result.push({ type: 'outro' })
  return result
}

/** Same arrangement renderer, but no legacy endings or fill-yield may rewrite sung Bossa. */
export function buildBossaSoloSong(accompaniment: readonly TimelineEvent[], loopLengthBeats: number,
  sources: readonly SourceSection[] | null, steps: readonly ArrangementStep[],
  phrase: (kind: 'intro' | 'interlude' | 'outro', take: number, nextStart?: number) => PhraseSection,
  fills: readonly TimelineEvent[] = [], preserveSoloHands = false, interludeLoops = 2) {
  const sourceList = sources ?? [{ name: 'Vòng hợp âm', kind: 'verse' as const, startBeat: 0, lengthBeats: loopLengthBeats }]
  const ordered = bossaSoloSteps(steps.length ? steps : [{ type: 'section', source: 0 }], sourceList, interludeLoops)
  const warnings: string[] = []
  const phraseSources: string[] = []
  const build = (kind: 'intro' | 'interlude' | 'outro', take: number, nextStart?: number) => {
    const made = phrase(kind, take, nextStart)
    if (made.unavailableReason) warnings.push(made.unavailableReason)
    if (made.sourcePhrase?.method === 'full-sheet' || made.sourcePhrase?.method === 'cp-composition' || made.sourcePhrase?.method === 'source-variation') {
      const s = made.sourcePhrase
      phraseSources.push(`${kind === 'intro' ? 'Dạo' : kind === 'outro' ? 'Kết' : 'Giang'}: ${s.method === 'cp-composition' ? 'câu mới CP' : s.method === 'source-variation' ? `biến thể ${s.song ?? s.id}` : s.song ?? s.id} · ${s.barCount} ô · ${made.lengthBeats} phách`)
      if (made.adaptationNote) phraseSources.push(made.adaptationNote)
    }
    return made
  }
  const first = ordered.find(s => s.type === 'section')
  const song = buildArrangedSong({ accompaniment, fills, sources: sourceList, steps: ordered, solo: () => [], preserveSoloHands,
    phrase: kind => build(kind, 0, first?.type === 'section' ? sourceList[first.source]?.startBeat : undefined),
    interludeRange: (over, next, take, lastLoop) => {
      const made = build('interlude', take, lastLoop ? next?.startBeat : undefined)
      return { startBeat: over.startBeat, lengthBeats: made.lengthBeats, events: made.events,
        solo: () => [], composed: true, kyHieu: made.chords, kyHieuBeats: made.beatsEach }
    }, beatsPerMeasure: 4, restAfterInterlude: 0,
  })
  return { ...song, phraseWarnings: warnings, phraseSources }
}

export const bossaBackingSteps = (steps: readonly ArrangementStep[], sources: readonly SourceSection[] | null) =>
  steps.filter(step => step.type === 'section' && sources?.[step.source] &&
    sources[step.source].kind !== 'interlude' && !/dạo|intro|giang|outro|kết/i.test(sources[step.source].name))

/** Khung CP đã duyệt 13/9/2026; tiếp tục chỉ đệm cho đến khi người dùng yêu cầu solo. */
export function buildBossaRhythmOnly(
  accompaniment: readonly TimelineEvent[], loopLengthBeats: number,
  sources: readonly SourceSection[] | null, steps: readonly ArrangementStep[],
  fills: readonly TimelineEvent[] = [],
) {
  const song = sources
    ? buildArrangedSong({
        accompaniment, fills: [...fills], solo: () => [], sources,
        steps: bossaBackingSteps(steps, sources),
      })
    : buildSongTimeline({ accompaniment, fills: [...fills], solo: () => [], loopLengthBeats, form: SONG_FORMS[0] })
  return { ...song, phraseWarnings: [`Bossa CP cải tiến — giữ khung 11 tiếng ngoài câu chêm. Bảng Thứ tự chơi vẫn hiện đủ dạo · giang · kết để bạn sắp; chọn Cà Pháo + giọng thứ để phát câu solo.${fills.length ? ' CP Lick phối hai tay theo sheet tại câu chêm.' : ''}`] }
}
