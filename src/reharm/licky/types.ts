import type { MidiNote } from '../../shared/musicTheory/types'
import type { SongKey } from '../fillSoloGenerator/soloVocabulary'
import type { ParsedChord } from '../types'

export type LickyMode = 'clone' | 'create'
export type LickyKind = 'fill' | 'run'

export interface LickNote {
  interval: number
  dur: number
  at: number
}

export interface LickPhrase {
  id: string
  label: string
  kind: LickyKind
  span: number
  notes: LickNote[]
}

export interface PlacedNote {
  note: MidiNote
  startBeat: number
  durationBeats: number
  isGrace: false
  hand?: 'left' | 'right'
}

export interface PlaceOptions {
  chord: ParsedChord
  next?: ParsedChord
  startBeat: number
  beats: number
  take?: number
  mode?: LickyMode
  kind: LickyKind
  key?: SongKey | null
}
