import { setTatTiengPhim, useAudioStore } from './audioEngine'

/**
 * Nút bật / tắt tiếng phím bấm — người dùng 16/10/2026: "làm nút tắt tiếng đàn để thiết bị Android ko phát ra tiếng đàn khi bấm phím
 * trên đàn, chỉ phát các backing track, hiện thị ở tất cả game". Nằm trong `MidiConnect` (mọi chỗ có bàn phím) và ở góc khung toàn màn hình.
 */
export function NutTiengPhim() {
  const tat = useAudioStore((state) => state.tatTiengPhim)
  return (
    <button
      type="button"
      onClick={() => setTatTiengPhim(!tat)}
      aria-pressed={tat}
      title="Đánh trên đàn thật thì tắt: app không phát tiếng phím bạn bấm, chỉ còn nền (backing track) và nút nghe mẫu."
      className={`rounded-lg border px-2.5 py-1 text-xs ${
        tat ? 'border-rose-400/60 bg-rose-500/15 text-rose-200' : 'border-line bg-black/60 text-cream/85 hover:bg-white/10'
      }`}
    >
      {tat ? '🔇 Tiếng phím: tắt' : '🔊 Tiếng phím: bật'}
    </button>
  )
}
