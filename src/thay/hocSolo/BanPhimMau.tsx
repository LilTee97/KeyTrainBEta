import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useMidiStore } from '../../shared/midi/midiStore'
import { buildKeyboardLayout } from '../../shared/midi/onScreenPiano/layout'
import type { MidiNote } from '../../shared/musicTheory/types'
import { NEN, type Muc } from './mauPhim'

const CHU_PHIM: Readonly<Record<Muc, { trang: string; den: string }>> = {
  dam: { trang: 'text-ink', den: 'text-ink' },
  mo: { trang: 'text-ink', den: 'text-cream' },
  khong: { trang: 'text-ink/70', den: 'text-cream/80' },
}
/* Tên nốt trên phím — người dùng 11/10/2026: "tăng kích thước của tên nốt và đổi màu chúng cho thật nổi bật dễ nhìn", rồi "tất cả tên
   nốt … phải được viết to hơn". Thẻ tối chữ vàng đậm: nổi trên phím xanh, phím cam, phím kem lẫn phím đen; 17 px phím trắng · 14 px phím
   đen trên màn rộng. Cũ: 15 · 13 px (lượt 2); trước nữa chữ mono 10 px (phím đen 9 px), cùng màu với số bậc. */
const TEN_NOT = 'rounded bg-ink px-1 py-0.5 font-sans font-bold leading-none text-yellow-300 shadow'

/** Chữ trên một phím: tên nốt (thẻ nổi bật) · dòng phụ (bậc, %, ngón). */
export interface NhanPhim {
  ten: string
  phu?: ReactNode
}

function ChuPhim({ nhan, co }: { nhan: NhanPhim | null; co: string }) {
  if (!nhan) return null
  return (
    <>
      <span className={`${TEN_NOT} ${co}`}>{nhan.ten}</span>
      {nhan.phu}
    </>
  )
}

/** Bàn phím để XEM: tô màu theo vai, chữ trên phím, bấm để nghe — không đổ vào kho MIDI (không phải bàn phím chơi). */
export function BanPhimMau({
  thap,
  cao,
  muc,
  nhan,
  onBam,
  dangBam = [],
  danh = false,
  sao = [],
}: {
  thap: number
  cao: number
  muc: (m: number) => Muc
  nhan: (m: number) => NhanPhim | null
  onBam?: (m: number) => void
  /** Phím đang giữ — vòng vàng (game chạy ngón: thấy ngay nốt mình đang bấm nằm ở mức nào). */
  dangBam?: readonly number[]
  /** Bấm phím là bấm nốt (vào kho MIDI như bàn phím trên màn hình), thay cho bấm để nghe. */
  danh?: boolean
  /** Phím gợi ý — ★ trên tên nốt. */
  sao?: readonly number[]
}) {
  const { whiteKeys, blackKeys } = buildKeyboardLayout(thap, cao)
  const giu = (note: number) => (dangBam.includes(note) ? { boxShadow: 'inset 0 0 0 3px #fde047, inset 0 -10px 18px rgba(0,0,0,.35)' } : {})
  const bam = (note: number) =>
    danh
      ? {
          onPointerDown: (e: ReactPointerEvent) => {
            ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
            useMidiStore.getState().noteOn(note as MidiNote, 90, 'onscreen')
          },
          onPointerUp: () => useMidiStore.getState().noteOff(note as MidiNote, 'onscreen'),
          onPointerCancel: () => useMidiStore.getState().noteOff(note as MidiNote, 'onscreen'),
        }
      : { onClick: () => onBam?.(note) }
  const ten = (note: number): NhanPhim | null => {
    const x = nhan(note)
    return x && sao.includes(note) ? { ...x, ten: `★ ${x.ten}` } : x
  }
  return (
    <div className="relative h-40 w-full select-none sm:h-48" role="group" aria-label="Bàn phím tô màu nốt">
      <div className="flex h-full w-full gap-px">
        {whiteKeys.map(({ note }) => (
          <button
            key={note}
            type="button"
            {...bam(note)}
            style={{ ...NEN[muc(note)].trang, ...giu(note) }}
            className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-b-md pb-1.5 text-center font-mono text-[10px] leading-tight font-semibold sm:text-sm ${CHU_PHIM[muc(note)].trang}`}
          >
            <ChuPhim nhan={ten(note)} co="text-[10px] sm:text-[17px]" />
          </button>
        ))}
      </div>
      {blackKeys.map(({ note, position }) => (
        <button
          key={note}
          type="button"
          {...bam(note)}
          style={{ left: `${position * 100}%`, width: `${(100 / whiteKeys.length) * 0.66}%`, ...NEN[muc(note)].den, ...giu(note) }}
          className={`absolute top-0 flex h-[58%] -translate-x-1/2 flex-col items-center justify-end gap-0.5 rounded-b-md border border-black/60 pb-1 text-center font-mono text-[9px] leading-tight font-semibold sm:text-[11px] ${CHU_PHIM[muc(note)].den}`}
        >
          <ChuPhim nhan={ten(note)} co="text-[9px] sm:text-[14px]" />
        </button>
      ))}
    </div>
  )
}
