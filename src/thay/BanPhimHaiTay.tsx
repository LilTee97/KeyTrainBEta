import { buildKeyboardLayout } from '../shared/midi/onScreenPiano/layout'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'

export interface NhanHaiTay {
  trai: string
  traiPhu: string
  phai: string
  phaiPhu: string
  tong: string
}

const kep = (x: number) => Math.min(0.9, Math.max(0.1, x))

/**
 * Bàn phím kèm tên hợp âm từng tay — người dùng 9/10/2026: "Khi cho hợp âm của tay trái hoặc phải thì hợp âm đó phải to rõ và hiện ở
 * giữa phía trái hoặc phải trên đầu phím đàn. hợp âm tổng phía dưới cũng phải to rõ." Tên mỗi tay đặt ngay trên tâm các phím tay ấy
 * (tính từ bố cục phím `buildKeyboardLayout`); hai tên gần nhau quá thì đẩy ra hai bên. `nhan` null (đang đố) thì không hiện tên.
 */
export function BanPhimHaiTay({
  trai,
  phai,
  nhan,
  lowNote = 36,
  highNote = 84,
}: {
  trai: readonly number[]
  phai: readonly number[]
  nhan: NhanHaiTay | null
  lowNote?: number
  highNote?: number
}) {
  const { whiteKeys, blackKeys } = buildKeyboardLayout(lowNote, highNote)
  const viTri = (n: number) => {
    const w = whiteKeys.find((k) => k.note === n)
    if (w) return (w.index + 0.5) / whiteKeys.length
    return blackKeys.find((k) => k.note === n)?.position ?? 0.5
  }
  const giua = (ds: readonly number[]) => (ds.length ? ds.reduce((s, n) => s + viTri(n), 0) / ds.length : null)
  let xT = giua(trai)
  let xP = giua(phai)
  if (xT !== null && xP !== null && xP - xT < 0.3) {
    const m = (xT + xP) / 2
    xT = m - 0.15
    xP = m + 0.15
  }
  return (
    <div>
      <div className="relative mb-1 h-20">
        {nhan && xT !== null && (
          <div className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${kep(xT) * 100}%` }}>
            <p className="text-[10px] tracking-wide text-teal-key uppercase">Tay trái</p>
            <p className="rounded-lg border border-teal-key/60 bg-teal-key/20 px-3 py-0.5 font-mono text-2xl font-bold whitespace-nowrap text-teal-key">
              {nhan.trai}
            </p>
            <p className="mt-0.5 text-xs whitespace-nowrap text-cream/80">{nhan.traiPhu}</p>
          </div>
        )}
        {nhan && xP !== null && (
          <div className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${kep(xP) * 100}%` }}>
            <p className="text-[10px] tracking-wide text-amber-key uppercase">Tay phải</p>
            <p className="rounded-lg border border-amber-key/60 bg-amber-key/20 px-3 py-0.5 font-mono text-2xl font-bold whitespace-nowrap text-amber-key">
              {nhan.phai}
            </p>
            <p className="mt-0.5 text-xs whitespace-nowrap text-cream/80">{nhan.phaiPhu}</p>
          </div>
        )}
      </div>
      <OnScreenPiano lowNote={lowNote} highNote={highNote} leftHandNotes={trai} rightHandNotes={phai} />
      <div className="mt-2 mb-3 min-h-16 text-center">
        {nhan && (
          <>
            <p className="text-[10px] tracking-wide text-dim uppercase">Hợp âm tổng</p>
            <p className="font-mono text-4xl font-bold text-cream">{nhan.tong}</p>
          </>
        )}
      </div>
    </div>
  )
}
