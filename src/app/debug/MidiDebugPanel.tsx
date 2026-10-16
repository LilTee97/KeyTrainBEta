import { useEffect, useState } from 'react'
import {
  playChord,
  setVolumeDb,
  startAudio,
  useAudioStore,
} from '../../shared/audio/audioEngine'
import { useLiveSound } from '../../shared/audio/useLiveSound'
import { initMidi, selectMidiDevice } from '../../shared/midi/midiInput'
import { useMidiStore } from '../../shared/midi/midiStore'
import { getKeyboardRange, KEYBOARD_SIZES } from '../../shared/midi/onScreenPiano/layout'
import { OnScreenPiano } from '../../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../../shared/midi/onScreenPiano/useComputerKeyboard'
import type { MidiStatus } from '../../shared/midi/types'
import { detectChords } from '../../shared/musicTheory/chordDetection'
import { midiToName } from '../../shared/musicTheory/pitch'
import { readSetting, writeSetting } from '../../shared/persistence/localSettings'

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

const nutChon = (on: boolean) =>
  `rounded-lg border px-2.5 py-1 text-xs ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/85 hover:bg-white/10'}`

/**
 * SỐ PHÍM ĐÀN — người dùng 16/10/2026: "Hãy làm nút lựa chọn số phím đàn hoặc tự đo số phím đàn ở mục Gỡ Lỗi trong phần tái hòa âm".
 * Chọn một cỡ có sẵn, hay TỰ ĐO: bấm phím thấp nhất và cao nhất trên đàn thật (chỉ nghe đàn MIDI, không nghe phím ảo) — số phím = cao −
 * thấp + 1. Ghi vào cài đặt `midiKeyboardKeys` (trước chỉ chọn được trong Luyện đệm · chờ đúng nốt): Luyện đệm và các game rơi (khi cắm
 * đàn — `useDayPhim`) hiện bàn phím đúng dải chuẩn của cỡ ấy (`getKeyboardRange`).
 */
function SoPhimDan() {
  const [soPhim, setSoPhim] = useState(() => readSetting('midiKeyboardKeys'))
  const [doPhim, setDoPhim] = useState<null | { thap: number | null; cao: number | null }>(null)
  const coDan = useMidiStore((state) => state.devices.length > 0)
  const dangDo = doPhim !== null

  useEffect(() => {
    if (!dangDo) return
    return useMidiStore.subscribe((state, previous) => {
      const ev = state.lastEvent
      if (!ev || ev === previous.lastEvent || ev.velocity === 0 || ev.source !== 'hardware') return
      setDoPhim((d) => d && { thap: Math.min(d.thap ?? ev.note, ev.note), cao: Math.max(d.cao ?? ev.note, ev.note) })
    })
  }, [dangDo])

  const chon = (n: number) => {
    setSoPhim(n)
    writeSetting('midiKeyboardKeys', n)
  }
  const day = getKeyboardRange(soPhim)
  const doDuoc = doPhim && doPhim.thap !== null && doPhim.cao !== null && doPhim.cao > doPhim.thap ? doPhim.cao - doPhim.thap + 1 : null
  const chuan = doDuoc ? getKeyboardRange(doDuoc) : null

  return (
    <div>
      <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">Số phím đàn</h3>
      <div className="flex flex-wrap items-center gap-1.5">
        {KEYBOARD_SIZES.map((k) => (
          <button key={k} type="button" onClick={() => chon(k)} className={nutChon(soPhim === k)} aria-pressed={soPhim === k}>
            {k} phím
          </button>
        ))}
        {!(KEYBOARD_SIZES as readonly number[]).includes(soPhim) && <span className={nutChon(true)}>{soPhim} phím (đo được)</span>}
        <button type="button" onClick={() => setDoPhim(dangDo ? null : { thap: null, cao: null })} className={nutChon(dangDo)}>
          {dangDo ? 'Hủy đo' : 'Tự đo số phím'}
        </button>
      </div>
      <p className="mt-2 text-xs text-cream/85">
        Đàn của bạn: <b className="text-amber-key">{soPhim} phím</b> · {midiToName(day.low)} – {midiToName(day.high)}
      </p>
      {dangDo && (
        <div className="mt-2 rounded-lg border border-amber-key/50 bg-amber-key/10 p-3 text-xs text-cream">
          <p>
            Bấm phím <b>THẤP NHẤT</b> và phím <b>CAO NHẤT</b> trên đàn (thứ tự nào cũng được).
            {!coDan && <span className="text-rose-300"> Chưa thấy đàn MIDI — cắm đàn rồi bấm “Quét lại thiết bị” ở trên.</span>}
          </p>
          <p className="mt-1 font-mono">
            {doPhim.thap === null ? 'Chưa bấm phím nào.' : `Đã thấy: ${midiToName(doPhim.thap)} – ${midiToName(doPhim.cao!)}`}
            {doDuoc ? ` → ${doDuoc} phím` : ''}
          </p>
          {chuan && doPhim.thap !== chuan.low && (
            <p className="mt-1 text-rose-300">
              Dải đo được lệch so với dải chuẩn của đàn {doDuoc} phím ({midiToName(chuan.low)} – {midiToName(chuan.high)}) — đàn có thể đang
              bật dời quãng tám (Octave / Transpose). App dùng dải chuẩn.
            </p>
          )}
          <button
            type="button"
            disabled={!doDuoc}
            onClick={() => {
              chon(doDuoc!)
              setDoPhim(null)
            }}
            className="mt-2 rounded-lg bg-amber-key px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
          >
            {doDuoc ? `Lưu ${doDuoc} phím` : 'Lưu'}
          </button>
        </div>
      )}
      <p className="mt-2 text-xs text-dim">
        Cắm đàn MIDI thì bàn phím trong các game rơi và Luyện đệm hiện đúng dải này, phím gợi ý nằm đúng quãng tám như trên đàn. Không cắm
        đàn thì game giữ bàn phím to theo màn hình để chạm.
      </p>
    </div>
  )
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

  const audioReady = useAudioStore((state) => state.ready)
  const volumeDb = useAudioStore((state) => state.volumeDb)
  useLiveSound()

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

      <SoPhimDan />

      <div>
        <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-dim uppercase">
          Âm thanh
        </h3>

        {!audioReady ? (
          <button
            type="button"
            onClick={() => void startAudio()}
            className="rounded-lg bg-amber-key px-4 py-2 text-sm font-semibold text-ink hover:brightness-110"
          >
            Bật âm thanh
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-sm text-teal-key">● Đang bật</span>

            <button
              type="button"
              onClick={() => playChord([60, 64, 67, 71])}
              className="rounded-lg border border-line bg-white/6 px-3 py-1.5 text-xs text-cream hover:bg-white/12"
            >
              Nghe thử Cmaj7
            </button>

            <label className="flex items-center gap-2 text-xs text-dim">
              Âm lượng
              <input
                type="range"
                min={-40}
                max={6}
                step={1}
                value={volumeDb}
                onChange={(event) => setVolumeDb(Number(event.target.value))}
                className="accent-amber-key"
              />
              <span className="w-10 font-mono text-cream">{volumeDb} dB</span>
            </label>
          </div>
        )}

        {!audioReady && (
          <p className="mt-2 text-xs text-dim">
            Trình duyệt chỉ cho phát tiếng sau khi bạn chạm vào trang.
          </p>
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
