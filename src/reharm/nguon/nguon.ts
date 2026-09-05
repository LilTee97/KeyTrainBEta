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
  /** Số thứ tự câu trong `Nguon.json`. Bình luận gắn vào số này. */
  stt: number
  /** Câu này lần đầu xuất hiện, hay là câu cũ phát lại. */
  moi: boolean
  /** Đã phát bao nhiêu lần tính cả lần này. */
  lanPhat: number
}

const GOC = '/__nguon'

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
        not,
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as CauDaoLuu
  } catch {
    return null
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
