import { buildArrangedSong, type ArrangementStep, type SourceSection } from '../style/arrangement'
import { buildSongTimeline, SONG_FORMS } from '../style/songStructure'
import type { TimelineEvent } from '../style/types'

export const bossaBackingSteps = (steps: readonly ArrangementStep[], sources: readonly SourceSection[] | null) =>
  steps.filter(step => step.type === 'section' && sources?.[step.source] &&
    sources[step.source].kind !== 'interlude' && !/dạo|intro|giang|outro|kết/i.test(sources[step.source].name))

/** Khung CP đã duyệt 13/9/2026; tiếp tục chỉ đệm cho đến khi người dùng yêu cầu solo. */
export function buildBossaRhythmOnly(
  accompaniment: readonly TimelineEvent[], loopLengthBeats: number,
  sources: readonly SourceSection[] | null, steps: readonly ArrangementStep[],
) {
  const song = sources
    ? buildArrangedSong({
        accompaniment, fills: [], solo: () => [], sources,
        steps: bossaBackingSteps(steps, sources),
      })
    : buildSongTimeline({ accompaniment, fills: [], solo: () => [], loopLengthBeats, form: SONG_FORMS[0] })
  return { ...song, phraseWarnings: ['Bossa CP cải tiến — khung đệm chính thức đã duyệt 13/9/2026. Giữ nguyên 11 tiếng; chưa bật lại dạo, giang, kết hoặc fill.'] }
}
