import type { TimelineEvent } from '../style/types'

/**
 * Gửi câu dạo và bình luận sang `Nguon.json` — xem `nguonPlugin.ts`.
 *
 * ## Lưu NGAY LÚC BẮT ĐẦU PHÁT, không đợi phát xong
 *
 * Người dùng đặt: *"Mỗi lần phát câu intro là lưu ngay không cần hỏi, cũng không quan
 * tâm dù có bị nút dừng phát cắt ngang, cứ lưu câu đầy đủ."*
 *
 * Nên chỗ gọi nằm ở `playFromBeat`, ngay khi dựng xong câu — không phải ở chỗ phát xong.
 * Câu đã dựng trọn vẹn trước khi tiếng đầu tiên kêu lên, nên bấm dừng giữa chừng cũng
 * không mất gì.
 *
 * ## Hỏng thì im lặng
 *
 * Bản dựng tĩnh không có máy chủ nào để ghi. Sổ này là công cụ soi trong lúc luyện, hỏng
 * thì không được làm gãy việc phát nhạc — nên mọi lỗi đều nuốt.
 */

export type CauDaoLuu = {
  stt: number
  moi: boolean
  lanPhat: number
  giong?: string
  doan?: 'intro' | 'interlude' | 'outro'
  dieu?: string
}

const GOC = '/__nguon'

export type CauOn = {
  stt: number
  bai: string
  giong: string
  dieu: string
  soO: number
  lanPhat: number
  not: readonly unknown[]
  hopAm: readonly string[]
  doan: 'intro' | 'interlude' | 'outro'
}

export function suKienTuNot(not: readonly unknown[]): TimelineEvent[] {
  return (Array.isArray(not) ? not : []).flatMap((hang) => {
    if (!Array.isArray(hang) || hang.length < 2) return []
    const at = Number(hang[0])
    const midi = Number(hang[1])
    const du = Number(hang[2])
    const tay = hang[3]
    if (!Number.isFinite(at) || !Number.isFinite(midi)) return []
    return [
      {
        notes: [midi],
        startBeat: at,
        durationBeats: Number.isFinite(du) && du > 0 ? du : 0.5,
        hand: tay === 'T' ? ('left' as const) : ('right' as const),
        velocity: 70,
      },
    ]
  })
}

export async function layCauOn(): Promise<CauOn[]> {
  try {
    const res = await fetch(GOC)
    if (!res.ok) return []
    const so = (await res.json()) as { cau?: { cot?: string[]; dong?: unknown[][] } }
    const cot = so.cau?.cot ?? []
    const ix = (k: string) => cot.indexOf(k)
    const iStt = ix('stt')
    const iBai = ix('bai')
    const iGiong = ix('giong')
    const iDieu = ix('dieu')
    const iSoO = ix('soO')
    const iLan = ix('lanPhat')
    const iNot = ix('not')
    const iDg = ix('danhGia')
    const iHop = ix('hopAm')
    const iDoan = ix('doan')
    return (so.cau?.dong ?? []).flatMap((d) => {
      if (d[iDg] !== 'on') return []
      const not = d[iNot]
      if (!Array.isArray(not) || not.length === 0) return []
      const lan = d[iLan]
      return [
        {
          stt: Number(d[iStt]) || 0,
          bai: String(d[iBai] ?? ''),
          giong: String(d[iGiong] ?? ''),
          dieu: String(d[iDieu] ?? ''),
          soO: Number(d[iSoO]) || 0,
          lanPhat: Array.isArray(lan) ? lan.length : 1,
          not,
          hopAm: Array.isArray(d[iHop]) ? (d[iHop] as string[]) : [],
          doan: d[iDoan] === 'interlude' || d[iDoan] === 'outro' ? d[iDoan] : 'intro',
        },
      ]
    })
  } catch {
    return []
  }
}

/** Rút gọn sự kiện thành `[phách, cao độ, số phách ngân, tay]` cho gọn sổ. */
const gonNot = (events: readonly TimelineEvent[]) =>
  events
    .filter((e) => !e.grace)
    .flatMap((e) =>
      e.notes.map((n) => [
        Math.round(e.startBeat * 1000) / 1000,
        n,
        Math.round(e.durationBeats * 1000) / 1000,
        e.hand === 'left' ? 'T' : 'P',
      ]),
    )
    .sort((a, b) => (a[0] as number) - (b[0] as number) || (a[1] as number) - (b[1] as number))

export async function luuCauDao(thongTin: {
  events: readonly TimelineEvent[]
  lengthBeats: number
  barBeats: number
  bai: string
  giong: string
  dieu: string
  /** Ký hiệu hợp âm của chính câu dạo, đúng thứ tự ô. */
  hopAm: readonly string[]
  doan?: 'intro' | 'interlude' | 'outro'
}): Promise<CauDaoLuu | null> {
  const not = gonNot(thongTin.events)
  if (not.length === 0) return null
  try {
    const res = await fetch(`${GOC}/cau`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bai: thongTin.bai,
        giong: thongTin.giong,
        dieu: thongTin.dieu,
        soO: Math.max(1, Math.round(thongTin.lengthBeats / thongTin.barBeats)),
        hopAm: thongTin.hopAm,
        doan: thongTin.doan ?? 'intro',
        not,
      }),
    })
    if (!res.ok) return { stt: 0, moi: false, lanPhat: 0 }
    return (await res.json()) as CauDaoLuu
  } catch {
    return { stt: 0, moi: false, lanPhat: 0 }
  }
}

/**
 * Chấm câu vừa nghe: `'on'` giữ lại, `'chua-on'` thì người dùng viết thêm ý kiến.
 */
export async function chamCauDao(cauStt: number, danhGia: 'on' | 'chua-on'): Promise<boolean> {
  if (!Number.isFinite(cauStt) || cauStt <= 0) return false
  try {
    const res = await fetch(`${GOC}/cham`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cauStt, danhGia }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function luuBinhLuan(cauStt: number, yKien: string): Promise<boolean> {
  if (!Number.isFinite(cauStt) || cauStt <= 0 || yKien.trim() === '') return false
  try {
    const res = await fetch(`${GOC}/binh-luan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cauStt, yKien: yKien.trim() }),
    })
    return res.ok
  } catch {
    return false
  }
}
