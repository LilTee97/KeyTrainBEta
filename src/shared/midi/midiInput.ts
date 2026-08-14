import { useMidiStore } from './midiStore'
import type { MidiDeviceInfo } from './types'

/**
 * Cầu nối giữa Web MIDI API của trình duyệt và kho trạng thái dùng chung.
 *
 * KeyTrain chỉ nhắm tới Chrome/Edge (xem CLAUDE.md) nên không có đường
 * dự phòng cho Safari/Firefox ở đây — thiếu Web MIDI thì người dùng chơi
 * bằng bàn phím ảo, sẽ làm ở bước sau.
 */

/** Bốn bit cao của byte trạng thái cho biết loại thông điệp. */
const NOTE_OFF = 0x80
const NOTE_ON = 0x90
const CONTROL_CHANGE = 0xb0

/** Số hiệu bộ điều khiển ra lệnh nhả toàn bộ nốt. */
const CC_ALL_NOTES_OFF = 123
const CC_ALL_SOUND_OFF = 120

let access: MIDIAccess | null = null
let attachedInputs: MIDIInput[] = []

/** Trình duyệt này có hỗ trợ Web MIDI không. */
export function isMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
}

function toDeviceInfo(input: MIDIInput): MidiDeviceInfo {
  return {
    id: input.id,
    name: input.name ?? 'Thiết bị không tên',
    manufacturer: input.manufacturer ?? '',
    connected: input.state === 'connected',
  }
}

/** Lệnh đã được diễn giải từ một thông điệp MIDI thô. */
export type MidiCommand =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'allNotesOff' }

/**
 * Diễn giải một thông điệp MIDI thô. Hàm thuần, không đụng tới trạng thái —
 * tách riêng để test được mà không cần giả lập trình duyệt.
 *
 * Trả về null với các thông điệp KeyTrain không quan tâm (bánh xe cao độ,
 * đồng hồ, thay đổi tiếng đàn…).
 */
export function parseMidiMessage(
  data: Uint8Array | number[] | null | undefined,
): MidiCommand | null {
  if (!data || data.length < 2) return null

  const command = data[0] & 0xf0

  if (command === NOTE_ON) {
    const note = data[1]
    const velocity = data[2] ?? 0
    // Theo chuẩn MIDI, note-on với lực nhấn 0 chính là note-off.
    // Nhiều đàn dùng cách này thay vì gửi hẳn thông điệp note-off.
    return velocity === 0
      ? { type: 'noteOff', note }
      : { type: 'noteOn', note, velocity }
  }

  if (command === NOTE_OFF) {
    return { type: 'noteOff', note: data[1] }
  }

  if (command === CONTROL_CHANGE) {
    const controller = data[1]
    if (controller === CC_ALL_NOTES_OFF || controller === CC_ALL_SOUND_OFF) {
      return { type: 'allNotesOff' }
    }
  }

  return null
}

/** Đưa lệnh đã diễn giải vào kho trạng thái dùng chung. */
function handleMidiMessage(event: MIDIMessageEvent): void {
  const command = parseMidiMessage(event.data)
  if (!command) return

  const store = useMidiStore.getState()

  switch (command.type) {
    case 'noteOn':
      store.noteOn(command.note, command.velocity, 'hardware')
      break
    case 'noteOff':
      store.noteOff(command.note, 'hardware')
      break
    case 'allNotesOff':
      store.releaseAll()
      break
  }
}

/**
 * Gắn bộ xử lý vào các cổng vào đang được chọn.
 * Gọi lại mỗi khi danh sách thiết bị hoặc lựa chọn của người dùng đổi.
 */
function attachInputs(): void {
  if (!access) return

  for (const input of attachedInputs) {
    input.onmidimessage = null
  }
  attachedInputs = []

  const { selectedDeviceId } = useMidiStore.getState()

  for (const input of access.inputs.values()) {
    // selectedDeviceId bằng null nghĩa là nghe tất cả các cổng — mặc định
    // tiện nhất vì đa số người dùng chỉ cắm một cây đàn.
    if (selectedDeviceId !== null && input.id !== selectedDeviceId) continue

    input.onmidimessage = handleMidiMessage
    attachedInputs.push(input)
  }
}

/** Đồng bộ danh sách thiết bị từ trình duyệt vào kho trạng thái. */
function refreshDevices(): void {
  if (!access) return

  const devices = [...access.inputs.values()].map(toDeviceInfo)
  useMidiStore.getState().setDevices(devices)

  // Cổng đang nghe bị rút ra thì quay về nghe tất cả, tránh kẹt ở
  // một thiết bị không còn tồn tại.
  const { selectedDeviceId } = useMidiStore.getState()
  if (
    selectedDeviceId !== null &&
    !devices.some((device) => device.id === selectedDeviceId)
  ) {
    useMidiStore.getState().selectDevice(null)
  }

  attachInputs()
}

/**
 * Xin quyền truy cập MIDI và bắt đầu lắng nghe.
 * Gọi nhiều lần cũng an toàn — lần sau chỉ làm mới danh sách thiết bị.
 */
export async function initMidi(): Promise<void> {
  const store = useMidiStore.getState()

  if (!isMidiSupported()) {
    store.setStatus(
      'unsupported',
      'Trình duyệt này không hỗ trợ Web MIDI. Hãy dùng Chrome hoặc Edge để cắm đàn.',
    )
    return
  }

  if (access) {
    refreshDevices()
    return
  }

  store.setStatus('requesting')

  try {
    access = await navigator.requestMIDIAccess({ sysex: false })
    access.onstatechange = refreshDevices

    refreshDevices()
    useMidiStore.getState().setStatus('ready')
  } catch (error) {
    const isPermissionError =
      error instanceof DOMException &&
      (error.name === 'SecurityError' || error.name === 'NotAllowedError')

    useMidiStore
      .getState()
      .setStatus(
        isPermissionError ? 'denied' : 'error',
        isPermissionError
          ? 'Trình duyệt đã chặn quyền truy cập MIDI. Hãy cấp quyền rồi thử lại.'
          : `Không truy cập được MIDI: ${String(error)}`,
      )
  }
}

/** Chọn cổng để lắng nghe. Truyền null để nghe tất cả các cổng. */
export function selectMidiDevice(deviceId: string | null): void {
  useMidiStore.getState().selectDevice(deviceId)
  attachInputs()
}

/** Ngắt kết nối, dùng khi dọn dẹp lúc thoát. */
export function disposeMidi(): void {
  for (const input of attachedInputs) {
    input.onmidimessage = null
  }
  attachedInputs = []

  if (access) {
    access.onstatechange = null
    access = null
  }

  useMidiStore.getState().releaseAll()
}
