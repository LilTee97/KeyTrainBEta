import { useEffect, useState } from 'react'
import { initMidi, selectMidiDevice } from '../../shared/midi/midiInput'
import { useMidiStore } from '../../shared/midi/midiStore'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiStatus } from '../../shared/midi/types'
import { detectChords } from '../../shared/musicTheory/chordDetection'
import { midiToName } from '../../shared/musicTheory/pitch'

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

/**
 * Màn hình gỡ lỗi cho bước 2: xem KeyTrain có thấy đàn MIDI không và
 * các nốt đang bấm là nốt gì. Sẽ bị thay bằng giao diện thật ở các bước sau.
 */
export function MidiDebugPanel() {
  const status = useMidiStore((state) => state.status)
  const errorMessage = useMidiStore((state) => state.errorMessage)
  const devices = useMidiStore((state) => state.devices)
  const selectedDeviceId = useMidiStore((state) => state.selectedDeviceId)
  const heldNotes = useMidiStore((state) => state.heldNotes)
  const velocities = useMidiStore((state) => state.velocities)

  /** Nốt gán cho phím Z — dịch lên xuống là đổi quãng tám đang gõ. */
  const [keyboardBaseNote, setKeyboardBaseNote] = useState(60)
  useComputerKeyboard(keyboardBaseNote)

  const matches = detectChords(heldNotes, { maxResults: 4 })
  const [best, ...alternatives] = matches

  useEffect(() => {
    void initMidi()
  }, [])

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 text-lg font-semibold">Kết nối MIDI</h2>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`font-mono text-sm ${STATUS_COLOR[status]}`}>
            ● {STATUS_LABEL[status]}
          </span>
          <button
            type="button"
            onClick={() => void initMidi()}
            className="rounded-lg border border-line bg-white/6 px-3 py-1.5 text-xs text-cream hover:bg-white/12"
          >
            Quét lại thiết bị
          </button>
        </div>

        {errorMessage && (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {errorMessage}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Thiết bị ({devices.length})
        </h3>

        {devices.length === 0 ? (
          <p className="text-sm text-dim">
            Chưa thấy đàn nào. Cắm đàn MIDI rồi bấm “Quét lại thiết bị”.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => selectMidiDevice(null)}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                selectedDeviceId === null
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim'
              }`}
            >
              Nghe tất cả các cổng
            </button>

            {devices.map((device) => (
              <button
                key={device.id}
                type="button"
                onClick={() => selectMidiDevice(device.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedDeviceId === device.id
                    ? 'border-amber-key bg-amber-key/15 text-amber-key'
                    : 'border-line bg-white/4 text-cream'
                }`}
              >
                {device.name}
                {device.manufacturer && (
                  <span className="ml-2 font-mono text-[10px] text-dim">
                    {device.manufacturer}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Hợp âm đang chơi
        </h3>

        <div className="rounded-xl border border-line bg-black/25 p-4">
          {!best ? (
            <p className="text-sm text-dim">
              {heldNotes.length === 0
                ? 'Bấm một hợp âm để xem tên.'
                : 'Bấm ít nhất ba nốt khác nhau.'}
            </p>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="font-serif text-4xl font-semibold text-amber-key">
                {best.symbol}
              </span>
              <span className="text-sm text-dim">{best.quality.label}</span>
              <span className="font-mono text-xs text-teal-key">
                {Math.round(best.confidence * 100)}% chắc
                {best.inversion !== null && best.inversion > 0 && (
                  <> · thế đảo {best.inversion}</>
                )}
              </span>
            </div>
          )}

          {best && (best.missingNotes.length > 0 || best.extraNotes.length > 0) && (
            <p className="mt-2 font-mono text-[11px] text-dim">
              {best.missingNotes.length > 0 && (
                <>thiếu {best.missingNotes.length} nốt </>
              )}
              {best.extraNotes.length > 0 && (
                <span className="text-rose-300">
                  · {best.extraNotes.length} nốt lạ
                </span>
              )}
            </p>
          )}

          {alternatives.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              <span className="font-mono text-[10px] text-dim">
                cách đọc khác:
              </span>
              {alternatives.map((match) => (
                <span
                  key={`${match.root}-${match.quality.id}`}
                  className="font-mono text-[11px] text-dim"
                >
                  {match.symbol}
                  <span className="ml-1 opacity-50">
                    {Math.round(match.confidence * 100)}%
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
            Bàn phím ảo
          </h3>

          <div className="flex items-center gap-2 text-xs text-dim">
            <span>Phím Z =</span>
            <button
              type="button"
              onClick={() =>
                setKeyboardBaseNote((note) => Math.max(24, note - 12))
              }
              className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream hover:bg-white/12"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-cream">
              {midiToName(keyboardBaseNote)}
            </span>
            <button
              type="button"
              onClick={() =>
                setKeyboardBaseNote((note) => Math.min(96, note + 12))
              }
              className="rounded-md border border-line bg-white/6 px-2 py-1 text-cream hover:bg-white/12"
            >
              +
            </button>
          </div>
        </div>

        <OnScreenPiano />

        <p className="mt-3 text-xs leading-relaxed text-dim">
          Bấm chuột lên phím, hoặc rê tay qua nhiều phím. Muốn bấm cả hợp âm
          thì gõ bàn phím máy tính: hàng{' '}
          <span className="font-mono text-cream">Z S X D C V G B H N J M</span>{' '}
          là một quãng tám, hàng{' '}
          <span className="font-mono text-cream">Q 2 W 3 E R 5 T 6 Y 7 U</span>{' '}
          là quãng tám trên.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Nốt đang bấm ({heldNotes.length})
        </h3>

        <div className="flex min-h-[64px] flex-wrap items-start gap-2 rounded-xl border border-line bg-black/25 p-3">
          {heldNotes.length === 0 ? (
            <span className="text-sm text-dim">Chưa bấm nốt nào.</span>
          ) : (
            heldNotes.map((note) => (
              <span
                key={note}
                className="rounded-lg bg-amber-key px-3 py-2 font-mono text-sm font-bold text-ink"
              >
                {midiToName(note)}
                <span className="ml-2 text-[10px] font-normal opacity-70">
                  {note} · v{velocities[note] ?? 0}
                </span>
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
