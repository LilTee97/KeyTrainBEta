import { initMidi, selectMidiDevice } from './midiInput'
import { useMidiStore } from './midiStore'
import type { MidiStatus } from './types'

/**
 * Nút kết nối đàn MIDI, kèm trạng thái và ô chọn thiết bị.
 *
 * Đặt được ở bất cứ chỗ nào cần đàn, vì **cách bật phải nằm cạnh chỗ dùng**.
 * Trước đây `initMidi()` chỉ được gọi từ tab Gỡ lỗi, nên cắm đàn rồi mở thẳng
 * tab Tái hoà âm là app không hề kết nối — bấm phím đàn không có gì phản hồi,
 * mà chẳng có gì trên màn hình nói cho biết vì sao.
 *
 * Không tự gọi `initMidi()` lúc mở app: trình duyệt hỏi quyền ngay khi gọi, mà
 * phần lớn thời gian người dùng chỉ dựng bài chứ không cắm đàn. Hỏi quyền lúc
 * chưa ai cần là làm phiền.
 */

const STATUS_LABEL: Record<MidiStatus, string> = {
  idle: 'Chưa kết nối',
  requesting: 'Đang xin quyền…',
  ready: 'Đã kết nối',
  unsupported: 'Trình duyệt không hỗ trợ',
  denied: 'Bị từ chối quyền',
  error: 'Lỗi',
}

const STATUS_COLOR: Record<MidiStatus, string> = {
  idle: 'text-dim',
  requesting: 'text-amber-key',
  ready: 'text-teal-key',
  unsupported: 'text-rose-400',
  denied: 'text-rose-400',
  error: 'text-rose-400',
}

export function MidiConnect() {
  const status = useMidiStore((state) => state.status)
  const errorMessage = useMidiStore((state) => state.errorMessage)
  const devices = useMidiStore((state) => state.devices)
  const selectedDeviceId = useMidiStore((state) => state.selectedDeviceId)

  const connected = status === 'ready'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/*
        Đã kết nối rồi thì không bày lại nút — chỗ đó dành cho ô chọn thiết bị,
        thứ duy nhất còn cần đến sau khi kết nối.
      */}
      {!connected && (
        <button
          type="button"
          onClick={() => void initMidi()}
          disabled={status === 'requesting' || status === 'unsupported'}
          className="rounded-lg border border-teal-key/50 bg-teal-key/10 px-2.5 py-1 text-xs text-teal-key hover:bg-teal-key/20 disabled:opacity-40"
        >
          Cắm đàn MIDI
        </button>
      )}

      <span className={`font-mono text-[10px] ${STATUS_COLOR[status]}`}>
        {STATUS_LABEL[status]}
        {connected && devices.length === 0 && ' · chưa thấy đàn nào'}
      </span>

      {connected && devices.length > 0 && (
        <select
          value={selectedDeviceId ?? ''}
          onChange={(event) => selectMidiDevice(event.target.value || null)}
          aria-label="Chọn đàn MIDI"
          className="rounded-md border border-line bg-white/6 px-2 py-0.5 text-xs text-cream"
        >
          <option value="">Tất cả cổng</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      )}

      {errorMessage && (
        <span className="text-[10px] text-rose-300">{errorMessage}</span>
      )}
    </div>
  )
}
