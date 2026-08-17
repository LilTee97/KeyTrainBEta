/**
 * Phát file nhạc gốc làm nền, tách khỏi tiếng đệm synth.
 *
 * Chỉ phát file người dùng đã chọn. Tua theo phách KeyTrain; đổi BPM thì
 * chỉnh `playbackRate` để khỏi lệch.
 */

let audio: HTMLAudioElement | null = null
let objectUrl: string | null = null
let nativeBpm = 120
let enabled = false
let volume = 0.45

export function hasSourceFile(): boolean {
  return audio !== null
}

export function isSourceEnabled(): boolean {
  return enabled
}

export function setSourceEnabled(on: boolean): void {
  enabled = on
  if (!on) pauseSource()
}

export function getSourceVolume(): number {
  return volume
}

export function setSourceVolume(value: number): void {
  volume = Math.min(1, Math.max(0, value))
  if (audio) audio.volume = volume
}

export function setSourceNativeBpm(bpm: number): void {
  nativeBpm = Math.max(1, bpm)
}

export function loadSourceFile(file: File | null): void {
  pauseSource()
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = null
  audio = null

  if (!file) return

  objectUrl = URL.createObjectURL(file)
  audio = new Audio(objectUrl)
  audio.volume = volume
  audio.preload = 'auto'
}

export function startSourceAtBeat(
  beat: number,
  playBpm: number,
  loop: boolean,
): void {
  if (!audio || !enabled) return

  audio.loop = loop
  audio.playbackRate = Math.min(4, Math.max(0.5, playBpm / nativeBpm))
  const seconds = Math.max(0, beat) * (60 / nativeBpm)
  try {
    audio.currentTime = seconds
  } catch {
    // Chưa sẵn sàng tua — phát từ đầu.
  }
  void audio.play().catch(() => {
    // Trình duyệt chặn autoplay — đã có cử chỉ phát đệm thì thường qua được.
  })
}

export function pauseSource(): void {
  if (!audio) return
  audio.pause()
}

export function stopSource(): void {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

/** Phát file gốc từ một mốc giây — dùng lưới xem trước, không cần bật nền. */
export function playSourceFrom(seconds: number, playBpm?: number): void {
  if (!audio) return
  if (playBpm !== undefined) {
    audio.playbackRate = Math.min(4, Math.max(0.5, playBpm / nativeBpm))
  }
  try {
    audio.currentTime = Math.max(0, seconds)
  } catch {
    // Chưa tua được.
  }
  void audio.play().catch(() => undefined)
}

export function getSourceCurrentTime(): number {
  return audio?.currentTime ?? 0
}

export function isSourcePlaying(): boolean {
  return audio !== null && !audio.paused
}

export function syncSourceRate(playBpm: number): void {
  if (!audio) return
  audio.playbackRate = Math.min(4, Math.max(0.5, playBpm / nativeBpm))
}
