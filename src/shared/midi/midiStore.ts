import { create } from 'zustand'
import { isValidMidiNote } from '../musicTheory/pitch'
import type { MidiNote } from '../musicTheory/types'
import type {
  MidiDeviceInfo,
  MidiStatus,
  NoteEvent,
  NoteSource,
} from './types'

/**
 * Kho trạng thái dùng chung cho mọi nguồn nốt.
 *
 * Cả đàn MIDI thật lẫn bàn phím ảo đều đổ vào đây, nên các phần phía sau
 * (nhận diện hợp âm, chế độ chờ đánh đúng nốt) không cần biết người dùng
 * đang chơi bằng gì.
 *
 * Kho này được cập nhật từ callback của Web MIDI — tức là ngoài vòng
 * render của React — nên phải subscribe được từ JavaScript thuần.
 */
export interface MidiState {
  status: MidiStatus
  /** Thông báo lỗi để hiển thị, chỉ có khi status là 'denied' hoặc 'error'. */
  errorMessage: string | null

  /** Các cổng MIDI vào đang thấy được. */
  devices: MidiDeviceInfo[]
  /** Cổng đang lắng nghe. null nghĩa là nghe tất cả các cổng. */
  selectedDeviceId: string | null

  /** Các nốt đang được giữ, xếp từ thấp lên cao. */
  heldNotes: MidiNote[]
  /** Lực nhấn của từng nốt đang giữ, dùng khi phát lại hoặc chấm điểm. */
  velocities: Record<MidiNote, number>
  /** Sự kiện nốt gần nhất, tiện cho việc gỡ lỗi và ghi nhật ký. */
  lastEvent: NoteEvent | null

  setStatus: (status: MidiStatus, errorMessage?: string | null) => void
  setDevices: (devices: MidiDeviceInfo[]) => void
  selectDevice: (deviceId: string | null) => void

  noteOn: (note: MidiNote, velocity: number, source: NoteSource) => void
  noteOff: (note: MidiNote, source: NoteSource) => void
  /** Nhả hết mọi nốt — dùng khi rút đàn hoặc đổi cổng đang nghe. */
  releaseAll: () => void
}

export const useMidiStore = create<MidiState>((set) => ({
  status: 'idle',
  errorMessage: null,
  devices: [],
  selectedDeviceId: null,
  heldNotes: [],
  velocities: {},
  lastEvent: null,

  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),

  setDevices: (devices) => set({ devices }),

  selectDevice: (deviceId) =>
    // Đổi cổng thì nhả hết nốt, tránh nốt của cổng cũ bị kẹt lại.
    set({ selectedDeviceId: deviceId, heldNotes: [], velocities: {} }),

  noteOn: (note, velocity, source) =>
    set((state) => {
      if (!isValidMidiNote(note)) return state

      const event: NoteEvent = {
        note,
        velocity,
        source,
        time: performance.now(),
      }

      // Đàn gửi lại note-on cho nốt đang giữ (khi bấm lại lúc chưa nhả hết)
      // thì chỉ cập nhật lực nhấn, không thêm nốt trùng vào danh sách.
      const alreadyHeld = state.heldNotes.includes(note)
      const heldNotes = alreadyHeld
        ? state.heldNotes
        : [...state.heldNotes, note].sort((a, b) => a - b)

      return {
        heldNotes,
        velocities: { ...state.velocities, [note]: velocity },
        lastEvent: event,
      }
    }),

  noteOff: (note, source) =>
    set((state) => {
      if (!state.heldNotes.includes(note)) return state

      const velocities = { ...state.velocities }
      delete velocities[note]

      return {
        heldNotes: state.heldNotes.filter((held) => held !== note),
        velocities,
        lastEvent: {
          note,
          velocity: 0,
          source,
          time: performance.now(),
        },
      }
    }),

  releaseAll: () => set({ heldNotes: [], velocities: {} }),
}))

/**
 * Đọc trạng thái ngoài component React — dùng trong callback của Web MIDI
 * và các engine chạy theo đồng hồ âm thanh.
 */
export const midiStore = useMidiStore
