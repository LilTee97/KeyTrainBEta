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

/* ---------------- Mỗi tay tối đa 4 nốt — người dùng 9/10/2026: "hợp âm mỗi tay chỉ đánh tối đa 4 nốt chứ ko được đánh 5 như này" ---------------- */

export const TOI_DA_MOT_TAY = 4
/** Ưu tiên giữ (khóa: quãng so với gốc): bậc 3 và 7 định chất trước, rồi màu (9, 13, 11, ♭9, ♭5, ♯5), bậc 5, cuối cùng gốc (tay trái có). */
const UU_TIEN: Readonly<Record<number, number>> = { 4: 10, 3: 9.5, 10: 9, 11: 9, 2: 7, 9: 6.5, 5: 6, 1: 5.5, 6: 5, 8: 5, 7: 3, 0: 2 }

/** Giữ tối đa `toiDa` lớp cao độ theo thứ tự ưu tiên; ít hơn thì giữ nguyên. */
export function chonLop(pcs: readonly number[], goc: number, toiDa = TOI_DA_MOT_TAY): number[] {
  if (pcs.length <= toiDa) return [...pcs]
  return [...pcs].sort((a, b) => UU_TIEN[pc(b - goc)]! - UU_TIEN[pc(a - goc)]!).slice(0, toiDa)
}

/**
 * Gọn một tay về tối đa 4 nốt: bỏ nốt trùng quãng tám trước (không mất âm nào — Dm9 Đô4 Fa4 La4 Đô5 Mi5 thành Fa4 La4 Đô5 Mi5), còn quá
 * thì bỏ lớp ít quan trọng (`chonLop`); mỗi lớp giữ một nốt sao cho thế hẹp nhất, bằng nhau thì giữ nốt đỉnh cao hơn (giai điệu).
 */
export function gonTay(notes: readonly number[], goc: number): number[] {
  const ds = [...notes].sort((a, b) => a - b)
  if (ds.length <= TOI_DA_MOT_TAY) return ds
  const theoLop = chonLop([...new Set(ds.map(pc))], goc).map((p) => ds.filter((m) => pc(m) === p))
  let tot: number[] = []
  const thu = (k: number, chon: number[]) => {
    if (k === theoLop.length) {
      const s = [...chon].sort((a, b) => a - b)
      const tam = s[s.length - 1]! - s[0]!
      const tamTot = tot.length ? tot[tot.length - 1]! - tot[0]! : Infinity
      if (tam < tamTot || (tam === tamTot && s[s.length - 1]! > tot[tot.length - 1]!)) tot = s
      return
    }
    for (const m of theoLop[k]!) thu(k + 1, [...chon, m])
  }
  thu(0, [])
  return tot
}
