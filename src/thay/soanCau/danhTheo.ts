import { chordPitchClasses, findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import type { Hop } from './giaiThich'

/*
  ĐÁNH THEO VÒNG — thế bấm gợi ý cho từng hợp âm của một vòng (người dùng 9/10/2026: "đưa vào tab để tôi có cái đánh theo … làm thêm
  chức năng tự nhập vòng hợp âm để đánh theo"). Lối chung của Claude, CHƯA phải lối của thầy (dạy bấm như từng thầy là việc sau, khi đã
  đo thế bấm trong sheet): tay trái giữ bass, tay phải bấm hợp âm ở thế đảo GẦN thế trước nhất — chuyển hợp âm mà tay phải dời ít nhất,
  nốt chung giữ nguyên.
*/

const pc = (x: number) => ((x % 12) + 12) % 12

export interface TheBam {
  trai: number[]
  phai: number[]
  /** Lớp cao độ đủ của hợp âm (gồm bass). */
  pcs: number[]
  /** Lớp cao độ của đúng thế gợi ý (hợp âm từ 5 nốt bỏ bớt ở tay phải). */
  pcsGoiY: number[]
  /** Nốt thấp nhất tay phải là nốt thứ mấy của hợp âm: 0 thế gốc, 1 đảo 1 (bậc 3), 2 đảo 2 (bậc 5), 3 đảo 3 (bậc 7). */
  dao: number
}

/** Xếp liền các lớp cao độ đi lên, nốt đầu trong Sol3–Fa♯4 (55–66). */
const xep = (ds: readonly number[]) => {
  const ra = [55 + pc(ds[0]! - 55)]
  for (const p of ds.slice(1)) ra.push(ra[ra.length - 1]! + 1 + pc(p - ra[ra.length - 1]! - 1))
  return ra
}

/** Thế bấm cho cả vòng; tay phải mỗi hợp âm chọn thế đảo có nốt thấp + nốt cao gần thế trước nhất (hợp âm đầu: thế gốc). */
export function theBamVong(tonic: number, ds: readonly Hop[]): TheBam[] {
  let truoc: number[] | null = null
  return ds.map((x) => {
    const g = pc(tonic + x.goc)
    const du = chordPitchClasses(g, findQualityBySymbol(x.chat) ?? findQualityBySymbol('')!)
    const bass = pc(tonic + (x.bass ?? x.goc))
    // ponytail: hợp âm từ 5 nốt bỏ gốc (tay trái đã có) rồi bỏ quãng 5 — đủ cho 9, 11, 13; muốn thế riêng từng màu thì lấy công thức chồng
    let tren = du
    if (tren.length >= 5) tren = tren.filter((p) => p !== g)
    if (tren.length >= 5) tren = tren.filter((p) => p !== pc(g + 7))
    const ung = tren.map((_, r) => xep([...tren.slice(r), ...tren.slice(0, r)]))
    const cach = (t: number[]) => (truoc ? Math.abs(t[0]! - truoc[0]!) + Math.abs(t[t.length - 1]! - truoc[truoc.length - 1]!) : 0)
    const phai = truoc ? ung.reduce((a, b) => (cach(b) < cach(a) ? b : a)) : ung[0]!
    truoc = phai
    const trai = [41 + pc(bass - 5)] // Fa2–Mi3
    return {
      trai,
      phai,
      pcs: [...new Set([...du, bass])],
      pcsGoiY: [...new Set([...trai, ...phai].map(pc))],
      dao: Math.max(0, du.indexOf(pc(phai[0]!))),
    }
  })
}

export const TEN_DAO = ['thế gốc', 'đảo 1', 'đảo 2', 'đảo 3', 'đảo 4', 'đảo 5'] as const

/** Đổi thế tay phải: nốt giữ nguyên và các nốt dời (cặp theo thứ tự từ thấp lên trong số nốt không giữ). */
export function doiThe(truoc: readonly number[], sau: readonly number[]) {
  const giu = sau.filter((m) => truoc.includes(m))
  const di = truoc.filter((m) => !sau.includes(m))
  const den = sau.filter((m) => !truoc.includes(m))
  return { giu, doi: di.map((m, k) => [m, den[k]] as const).filter((x): x is readonly [number, number] => x[1] !== undefined), them: den.slice(di.length), bo: di.slice(den.length) }
}
