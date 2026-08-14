import { useEffect, useRef } from 'react'
import { isValidMidiNote } from '../../musicTheory/pitch'
import { useMidiStore } from '../midiStore'
import { noteForKeyCode, shouldIgnoreKeyboardEvent } from './keyboardMap'

/** Lực nhấn cố định cho nốt gõ bằng bàn phím máy tính. */
const KEYBOARD_VELOCITY = 90

/**
 * Cho phép chơi đàn bằng bàn phím máy tính.
 *
 * `baseNote` là nốt của phím Z — dịch nó lên xuống là đổi quãng tám đang chơi.
 */
export function useComputerKeyboard(baseNote: number, enabled = true): void {
  // Ghi lại phím nào đang giữ nốt nào, để lúc nhả đúng nốt đã bấm kể cả khi
  // người dùng đổi quãng tám giữa chừng.
  const activeKeys = useRef(new Map<string, number>())

  useEffect(() => {
    if (!enabled) return

    const { noteOn, noteOff } = useMidiStore.getState()

    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreKeyboardEvent(event)) return

      const note = noteForKeyCode(event.code, baseNote)
      if (note === null || !isValidMidiNote(note)) return
      if (activeKeys.current.has(event.code)) return

      activeKeys.current.set(event.code, note)
      noteOn(note, KEYBOARD_VELOCITY, 'onscreen')
      event.preventDefault()
    }

    function handleKeyUp(event: KeyboardEvent) {
      const note = activeKeys.current.get(event.code)
      if (note === undefined) return

      activeKeys.current.delete(event.code)
      noteOff(note, 'onscreen')
    }

    /**
     * Chuyển sang cửa sổ khác lúc đang giữ phím thì trình duyệt không gửi
     * keyup — không dọn ở đây thì nốt sẽ kẹt lại.
     */
    function releaseEverything() {
      for (const note of activeKeys.current.values()) {
        noteOff(note, 'onscreen')
      }
      activeKeys.current.clear()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', releaseEverything)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', releaseEverything)
      releaseEverything()
    }
  }, [baseNote, enabled])
}
