import { useEffect } from 'react'
import { useMidiStore } from '../midi/midiStore'
import { attackNote, releaseAllNotes, releaseNote } from './audioEngine'

/**
 * Cho nốt đang bấm phát ra tiếng.
 *
 * Theo dõi kho trạng thái dùng chung nên nghe được cả nốt từ đàn MIDI thật
 * lẫn nốt từ bàn phím ảo, không cần biết nguồn nào.
 */
export function useLiveSound(enabled = true): void {
  useEffect(() => {
    if (!enabled) return

    const unsubscribe = useMidiStore.subscribe((state, previous) => {
      if (state.heldNotes === previous.heldNotes) return

      for (const note of state.heldNotes) {
        if (!previous.heldNotes.includes(note)) {
          attackNote(note, state.velocities[note] ?? 90)
        }
      }

      for (const note of previous.heldNotes) {
        if (!state.heldNotes.includes(note)) {
          releaseNote(note)
        }
      }
    })

    return () => {
      unsubscribe()
      releaseAllNotes()
    }
  }, [enabled])
}
