/**
 * Ước BPM từ file audio người dùng chọn — không gọi mạng.
 *
 * Lấy envelope năng lượng rồi tự tương quan trong khoảng 60–180. Đủ để có
 * một số khởi đầu; ô BPM vẫn sửa tay được.
 */

const MIN_BPM = 60
const MAX_BPM = 180

export async function estimateBpmFromFile(file: File): Promise<number | null> {
  const Context =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Context) return null

  const context = new Context()
  try {
    const raw = await file.arrayBuffer()
    const buffer = await context.decodeAudioData(raw.slice(0))
    return estimateBpmFromBuffer(buffer)
  } catch {
    return null
  } finally {
    void context.close()
  }
}

export function mixToMono(buffer: AudioBuffer): Float32Array {
  const mix = new Float32Array(buffer.length)
  const channels = buffer.numberOfChannels
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < data.length; index += 1) {
      mix[index] += data[index] / channels
    }
  }
  return mix
}

export function estimateBpmFromBuffer(buffer: AudioBuffer): number | null {
  return estimateBpmFromSamples(mixToMono(buffer), buffer.sampleRate)
}

export function estimateBpmFromSamples(
  mix: Float32Array,
  sampleRate: number,
): number | null {

  const hop = 512
  const energies: number[] = []
  for (let start = 0; start + hop < mix.length; start += hop) {
    let sum = 0
    for (let index = start; index < start + hop; index += 1) {
      sum += mix[index] * mix[index]
    }
    energies.push(Math.sqrt(sum / hop))
  }

  const onsets = energies.map((value, index) =>
    index === 0 ? 0 : Math.max(0, value - energies[index - 1]),
  )

  const hopRate = sampleRate / hop
  const minLag = Math.round((60 / MAX_BPM) * hopRate)
  const maxLag = Math.round((60 / MIN_BPM) * hopRate)
  if (maxLag >= onsets.length || minLag < 1) return null

  let bestLag = minLag
  let best = -Infinity
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let score = 0
    for (let index = 0; index + lag < onsets.length; index += 1) {
      score += onsets[index] * onsets[index + lag]
    }
    if (score > best) {
      best = score
      bestLag = lag
    }
  }

  if (best <= 0) return null
  return Math.round(60 * hopRate / bestLag)
}
