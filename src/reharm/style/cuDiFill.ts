import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'
import { cpDanSong } from '../licky/cpLick'
import { acddRunPitches } from './cpBalladConnections'

/*
  CÂU FILL CÀ PHÁO CHO BALLAD CỨ ĐI — MẶC ĐỊNH của điệu từ 30/9/2026 (người dùng nghe ô tick rồi bảo đặt làm mặc định). Người dùng: *"hãy phân tích cách Cà Pháo đặt những câu fill và
  kết hợp với tư duy của bạn để đưa vào trong điệu Ballad Cứ đi"*.

  SỐ ĐO — 5 cửa fill lúc hát người dùng đã xác nhận trên phiếu (Để Em Rời Xa ô 40 · 59; Chưa Bao Giờ ô 22 · 50→51 · 75→76). Sheet Cà
  Pháo không có thẻ lời (0/9 bài), nên ngoài 5 cửa ấy không đo được chỗ ca sĩ nghỉ; Anh Cứ Đi Đi chưa có cửa fill nào được xác nhận.
  - Chỗ: 4/5 ôm lấy VẠCH NHỊP sau chỗ lời dứt — hoặc mở ở phách 4¼ ô trước rồi rơi vào phách 1 ô sau (50→51, 75→76), hoặc mở ngay
    phách 1 ô sau (40, 22). 1/5 giữa ô (59, phách 3).
  - Hình: 4/5 là THẾ BẤM (2–5 nốt) leo lên 1–3 quãng tám (40: A5 → D6+F#6+A6 → D7; 59: cụm Db4 → Db6; 22: Ab3 → F7 rồi xuống;
    50→51: C4+Bb4+C5 → F5+Bb5 → C6+F6 → Bb6+C7+F7); 1/5 đường đơn (75→76).
  - 3–8 cú móc kép; 4/5 kết bằng một cú NGÂN ½–1 phách ở đỉnh (D7 ½ · cụm Db6 1 · Bb6+C7+F7 1 · F4 1).
  - Tay trái: 3/5 chỉ giữ một cú ngân dưới câu (40 · 22 · 75→76), 1/5 đi tiếp khuôn thưa (59), 1/5 đáp lúc tay phải ngân (50→51).
  - Hoà âm: cả 4 chỗ ôm vạch nhịp đều CÙNG hợp âm hai bên vạch (câu leo nằm trong một hợp âm).

  Người dùng nghe bản đầu (30/9): *"sao quá đơn giản, sao ko có những kỹ thuật để dẫn nối giữa các hợp âm mà cà pháo hay dùng, Cà Pháo
  có dùng passing chord để nối hợp âm ko"* → thêm HỢP ÂM LƯỚT ở phách cuối hợp âm cũ (xem `chonHopAmLuot`, số đo ở đó).

  TƯ DUY CỦA CLAUDE (không phải số đo):
  - Hai hình, lấy đúng nhịp của hai cửa đã xác nhận: "leo" = Chưa Bao Giờ 50→51 (3 móc kép cuối hợp âm + cú rơi phách 1 ngân ¾);
    "mở" = Để Em 40 (phách 1: nốt đơn → thế bấm → nốt đỉnh ngân ½). Luân phiên theo lượt (câu soạn, không bốc thăm nốt).
  - Có hợp âm lướt: phách cuối hợp âm cũ đổi sang hợp âm lướt — tay trái vỏ hai nốt, tay phải cú ba nốt 3 · 7 · 3 (Anh Cứ Đi Đi 53),
    "leo" leo trên hợp âm lướt rồi rơi vào hợp âm sau. Ghép hình nhịp của một bài với lối hòa âm của bài khác là việc của Claude.
  - Không chèn được hợp âm lướt (bass cũ đã cách gốc sau nửa cung / trùng gốc) → như bản đầu: "leo" dùng nốt hợp âm ĐANG VANG, cú
    rơi là thế bấm hợp âm SAU; "mở" nằm trọn trong hợp âm sau.
  - Leo theo THẾ ĐẢO của hợp âm (mỗi cú lên một nốt hợp âm), không nhảy nguyên thế bấm lên quãng tám như sheet: người dùng dặn nốt
    phải đánh được bằng tay người — mọi nốt trong ½ phách ≤ một quãng tám. Leo được chừng 1½ quãng tám, đỉnh quanh C6–E6 (trên
    giọng hát và trên sóng rải). Muốn đúng hình sheet (nhảy quãng tám từng móc kép) thì phải người dùng cho phép.
  - Tay trái giữ sóng rải, NHƯỜNG tiếng móc kép trùng câu (`cpDanSong`): nửa sau ô 2 lượt thì bỏ ba tiếng chêm walking, chỉ còn bậc
    10 ngân — như 3/5 cửa sheet tay trái chỉ giữ một cú ngân.
*/

export type NotFill = { note: number; startBeat: number; durationBeats: number; hand: 'left' | 'right'; velocity: number }

const pc = (n: number) => ((n % 12) + 12) % 12
/** Ba nốt của hợp âm (treo: nốt treo thay bậc 3), đủ để leo thế đảo. */
function banNot(c: ParsedChord): number[] {
  const iv = c.quality.intervals
  const ba = iv.find(i => i === 3 || i === 4) ?? iv.find(i => i === 5 || i === 2) ?? 4
  const nam = iv.find(i => i === 7 || i === 6 || i === 8) ?? 7
  return [0, ba, nam].map(i => pc(c.root + i))
}
const chuoiPc = (ban: readonly number[]) => Array.from({ length: 53 }, (_, i) => 48 + i).filter(n => ban.includes(pc(n)))
const chuoi = (c: ParsedChord) => chuoiPc(banNot(c))
const DINH = 86   // đỉnh câu quanh D6 (Claude chọn; sheet: D7 · Db6 · F7 · F7 — nhưng phải vừa tầm tay phải C4–C6 của app)
/** Mọi nốt cùng tay gõ trong ½ phách nằm trong một quãng tám (luật người dùng: đánh được bằng tay người). */
const vuaTay = (not: readonly NotFill[]) => ['left', 'right'].every(tay => {
  const n = not.filter(x => x.hand === tay)
  return n.every(e => {
    const gan = n.filter(o => o.startBeat >= e.startBeat - 1e-6 && o.startBeat < e.startBeat + .5 - 1e-6).map(o => o.note)
    return Math.max(...gan) - Math.min(...gan) <= 12
  })
})

/*
  HỢP ÂM LƯỚT (đo 30/9/2026, `scripts/audit_cp_noi_hop_am.py`; 5 sheet ballad CP có vạch nhịp đúng pha, 288 chỗ đổi hợp âm trong phần
  hát): hợp âm lướt GHI ký hiệu 19/288 (7%; 9 là át 7 của hợp âm sau), hợp âm lướt NGẦM trong nốt tay trái 16/288 (6%) — át 7 của hợp
  âm sau với BASS LÀ NỐT CẢM ÂM 7 · bII7 (7 trội nửa cung trên hợp âm đích) 4 · bII7 hàng xóm 3 · bass đi 3 nốt 2.
  LUẬT CHỌN — rút từ 11 chỗ soi tận nốt, khớp 10/11 (Claude đặt, không phải luật của thầy):
  1. hợp âm sau là 7 trội → bII7 của nó: Anh Cứ Đi Đi ô 15 G7 → Db7 → C7 (ghi), ô 44→45; Có Em Chờ ô 29→30 Abmaj7 → Db9 → C7;
  2. thứ → thứ đi xuống một cung → bII7, bass nửa cung đi xuống: Chúng Ta ô 20→21 · 52→53 Em7 → Eb → Dm7; Có Em Chờ 34→35 Gm7 → Gb7 → Fm7;
  3. hợp âm cũ là át 7 của hợp âm sau → bII7 HÀNG XÓM rồi về lại: Anh Cứ Đi Đi ô 45 · 53 C7: tay trái Db3+B3 → C3+Bb3 → Fm;
  4. còn lại → át 7 của hợp âm sau, BASS LÀ NỐT CẢM ÂM: Anh Cứ Đi Đi ô 17→18 · 46→47 F7/A → Bbm; Chúng Ta 50→51 E7/G# → Am7; Có Em Chờ
     19→20 Bb7/D → Eb; Ngày mai 46→47 Eb7/G → Ab.
  Chỗ lệch: Có Em Chờ ô 44→45 Eb → A7 → Abmaj7 (luật ra Eb7/G). Bass cũ đã cách gốc sau nửa cung, hoặc trùng gốc → không chèn.
  "Vỏ" tay trái: bass + bậc 7 (bass là gốc) hoặc bass + quãng 3 cung (bass là nốt cảm âm = bậc 3 của át 7) — Anh Cứ Đi Đi 45 Db3+B3,
  Ngày mai 47 G3+Db4.
*/
type Doan = { tu: number; goc: number; bass: number; vo: number }
export type HopAmLuot = { ten: 'bII7' | 'bII7 hàng xóm' | 'át 7 bass cảm âm'; doan: Doan[] }
const co = (c: ParsedChord, ...iv: number[]) => iv.every(i => c.quality.intervals.includes(i))
export function chonHopAmLuot(chord: ParsedChord, next: ParsedChord): HopAmLuot | null {
  const a = chord.bass ?? chord.root, b = next.bass ?? next.root
  if (a === b || pc(a - b) === 1 || pc(b - a) === 1) return null
  const bII: HopAmLuot = { ten: 'bII7', doan: [{ tu: -1, goc: pc(b + 1), bass: pc(b + 1), vo: 10 }] }
  if (co(next, 4, 10)) return bII
  if (co(chord, 3) && co(next, 3) && pc(chord.root - next.root) === 2) return bII
  if (chord.root === pc(b + 7) && co(chord, 4, 10)) return { ten: 'bII7 hàng xóm', doan: [
    { tu: -1, goc: pc(chord.root + 1), bass: pc(chord.root + 1), vo: 10 }, { tu: -.5, goc: chord.root, bass: chord.root, vo: 10 }] }
  return { ten: 'át 7 bass cảm âm', doan: [{ tu: -1, goc: pc(b + 7), bass: pc(b - 1), vo: 6 }] }
}

/*
  DANH MỤC KỸ THUẬT FILL — xoay vòng theo THỨ TỰ CHỖ FILL trong bài (`thu`), lượt phát sau lệch điểm xuất phát. Người dùng 30/9/2026:
  *"fill là phải chơi đa dạng các kỹ thuật mình có chứ ko phải lặp lại đúng 1 kiểu"* (bản trước: hai hình luân phiên theo LƯỢT PHÁT,
  nên cả lượt nghe cùng một hình). Mọi kiểu nằm trong [L−1, L+1): nửa sau hợp âm chỗ ca sĩ nghỉ + phách đầu hợp âm sau — không mở
  sớm hơn để khỏi đè chữ cuối câu hát. Kiểu nào không hợp chỗ ấy (thiếu chỗ, bass không đủ xa…) thì sang kiểu kế.
  Nguồn từng kiểu (nhịp · hình từ sheet; ghép với hợp âm bài đang chơi là việc của Claude):
  1. leo — Chưa Bao Giờ 50→51 (3 móc kép leo + cú rơi phách 1 ngân), có hợp âm lướt (Anh Cứ Đi Đi 53: vỏ tay trái, cú F4+B4+F5);
  2. tay trái dẫn — Anh Cứ Đi Đi ô 16 nửa sau: tay trái Bb3 G3 E3 C3 rải xuống về gốc, tay phải G4+G5 giữ (`acddRunPitches`);
  3. mở — Để Em 40 (phách 1: nốt đơn → thế bấm → đỉnh ngân ½), có hợp âm lướt ở phách trước;
  4. bass đi — Có Em Chờ 20→21 (tay trái Db D Eb F Gb G → Ab) · 22 (E F Gb G → C): 4 nốt nửa cung vào bass sau, tay phải giữ;
  5. sóng lên xuống — Chưa Bao Giờ 22 (thế bấm ba nốt leo thế đảo rồi xuống), rút còn 4 cú + cú rơi;
  6. câu đơn — Chưa Bao Giờ 75→76 (đường nốt đơn nhảy rồi lùi) + nốt dẫn nửa cung vào bậc 3 hợp âm sau;
  7. chuyển quãng tám — Để Em 59 (một thế bấm dời lên quãng tám rồi lên nữa); giãn thành móc đơn (sheet: móc kép) để mỗi ½ phách chỉ
     một thế tay — luật "đánh được bằng tay người".
*/
export const KIEU_FILL = ['leo', 'tay trái dẫn', 'mở', 'bass đi', 'sóng lên xuống', 'câu đơn', 'chuyển quãng tám'] as const
export type KieuFill = typeof KIEU_FILL[number]

type YeuCau = { chord: ParsedChord; next: ParsedChord; endBeat: number; beats: number; take: number; thu?: number }
const R = (note: number, startBeat: number, durationBeats: number, velocity: number): NotFill =>
  ({ note, startBeat, durationBeats, hand: 'right', velocity })
const T = (note: number, startBeat: number, durationBeats: number, velocity: number): NotFill =>
  ({ note, startBeat, durationBeats, hand: 'left', velocity })
const ganNhat = (pcX: number, moc: number) => [...Array(13)].map((_, i) => moc - 6 + i).find(n => pc(n) === pcX)!
const bassLH = (c: ParsedChord) => 36 + pc((c.bass ?? c.root) - 36)
const bac5 = (c: ParsedChord) => pc(c.root + (c.quality.intervals.find(i => i === 7 || i === 6 || i === 8) ?? 7))
const tot = (phuongAn: NotFill[][], dich: number, L: number) => {
  const dinh = (f: NotFill[]) => Math.max(...f.filter(x => x.hand === 'right' && x.startBeat >= L - 1 - 1e-6).map(x => x.note))
  return phuongAn.filter(vuaTay).sort((x, y) => Math.abs(dinh(x) - dich) - Math.abs(dinh(y) - dich))[0] ?? []
}

/**
 * Bộ soạn fill cho MỘT lượt dựng: đếm chỗ fill theo thứ tự được hỏi (bộ chêm hỏi lần lượt từ đầu bài); `lech` = lượt phát — lượt sau
 * bắt đầu từ kỹ thuật khác. Cùng `lech` thì cùng kết quả.
 */
export function cuDiFillTheoThu(lech: number) {
  let dem = 0
  return (yc: YeuCau) => fillCuDi({ ...yc, thu: lech + dem++ })
}

export function fillCuDi(yc: YeuCau): NotFill[] {
  const thu = yc.thu ?? yc.take
  for (let k = 0; k < KIEU_FILL.length; k++) {
    const f = soanKieu(KIEU_FILL[(thu + k) % KIEU_FILL.length], yc)
    if (f.length) return f
  }
  return []
}

export function soanKieu(kieu: KieuFill, yc: YeuCau): NotFill[] {
  const L = yc.endBeat, A = yc.chord, B = yc.next
  if (kieu === 'leo' || kieu === 'mở') return leoMo(yc, kieu === 'leo')
  if (yc.beats < 1 - 1e-6) return []
  const cur = chuoi(A), sau = chuoi(B)
  const phuongAn: NotFill[][] = []
  if (kieu === 'tay trái dẫn') {
    // Đuôi câu chạy ô 16 (át 7 về chủ: 7 · 5 · 3 · gốc); hợp âm không có bậc 9 thì đuôi ra 5 · 3 · 3 · gốc → đổi nốt lặp thành bậc 2.
    const trai = acddRunPitches(A, B).slice(4)
    if (trai[2] === trai[1]) trai[2] = trai[3] + 2
    const tran = Math.max(...trai)
    for (let q = tran + 3; q <= 77; q++) if (pc(q) === bac5(A))
      phuongAn.push([...trai.map((n, k) => T(n, L - 1 + k * .25, .25, k ? 58 : 66)), R(q, L - 1, 1, 70), R(q + 12, L - 1, 1, 70)])
  } else if (kieu === 'bass đi') {
    const bB = bassLH(B), bA = ganNhat(A.bass ?? A.root, bB), d = bB - bA
    if (Math.abs(d) < 3) return []
    const huong = Math.sign(d)
    const trai = [4, 3, 2, 1].map((k, i) => T(bB - huong * k, L - 1 + i * .25, .25, [62, 58, 60, 66][i]))
    for (let q = 65; q <= 77; q++) if (pc(q) === bac5(A)) phuongAn.push([...trai, R(q, L - 1, 1, 70), R(q + 12, L - 1, 1, 70)])
  } else if (kieu === 'sóng lên xuống') {
    // Thế bấm ba nốt trên hợp âm đang vang: lên, lên, lên, xuống; rồi rơi thế bấm hợp âm sau ở phách 1 ngân ½.
    for (let i = 0; i + 4 < cur.length; i++) {
      if (cur[i] < 60) continue
      const the = [i, i + 1, i + 2, i + 1].map(j => cur.slice(j, j + 3))
      const cuoi = the[3]
      for (let r = 0; r + 2 < sau.length; r++) {
        const roi = sau.slice(r, r + 3)
        if (Math.max(roi[2], cuoi[2]) - Math.min(roi[0], cuoi[0]) > 12 || roi[0] < 60) continue
        phuongAn.push([...the.flatMap((t, k) => t.map(n => R(n, L - 1 + k * .25, .25, [62, 66, 70, 64][k]))),
          ...roi.map(n => R(n, L, .5, 72))])
      }
    }
    return tot(phuongAn, DINH - 7, L)
  } else if (kieu === 'câu đơn') {
    // Nốt đơn: nốt hợp âm → nhảy lên hai nốt → lùi một → nốt dẫn nửa cung dưới bậc 3 hợp âm sau → bậc 3 ngân ¾.
    const iv = B.quality.intervals
    const ba = pc(B.root + (iv.find(i => i === 3 || i === 4) ?? iv.find(i => i === 5 || i === 2) ?? 4))
    for (let i = 0; i + 2 < cur.length; i++) {
      if (cur[i] < 64) continue
      const dich = ganNhat(ba, cur[i + 1] + 2)
      if (dich - 1 === cur[i + 1] || dich - 1 < 60) continue
      phuongAn.push([R(cur[i], L - 1, .25, 64), R(cur[i + 2], L - .75, .25, 70), R(cur[i + 1], L - .5, .25, 64),
        R(dich - 1, L - .25, .25, 62), R(dich, L, .75, 74)])
    }
    return tot(phuongAn, 79, L)
  } else if (kieu === 'chuyển quãng tám') {
    // Thế bấm (hợp âm đang vang + bậc 9, trong một quãng ≤ 9) ở phách trước, lên quãng tám, rồi thế bấm hợp âm sau cao thêm ở phách 1.
    const the = (c: ParsedChord, goc: number) => [...new Set([...banNot(c), pc(c.root + 2)])]
      .map(p => goc + pc(p - goc)).sort((x, y) => x - y)
    for (let r = 60; r <= 71; r++) if (pc(r) === A.root) {
      const t0 = the(A, r)
      if (Math.max(...t0) - r > 9) continue
      const tren = t0.map(n => n + 12)
      for (let g = Math.max(...tren) - 2; g <= Math.max(...tren) + 10; g++) {
        const roi = banNot(B).map(p => g + pc(p - g)).sort((x, y) => x - y)
        if (pc(g) !== roi.map(pc)[0] || Math.max(...roi) - Math.min(...roi) > 9) continue
        phuongAn.push([...t0.map(n => R(n, L - 1, .5, 64)), ...tren.map(n => R(n, L - .5, .5, 68)), ...roi.map(n => R(n, L, .75, 74))])
      }
    }
  }
  return tot(phuongAn, DINH, L)
}

function leoMo(yc: YeuCau, leoMuon: boolean): NotFill[] {
  const L = yc.endBeat
  const luot = yc.beats >= 1 - 1e-6 ? chonHopAmLuot(yc.chord, yc.next) : null
  const leo = leoMuon && yc.beats >= .75 - 1e-6
  const sau = chuoi(yc.next)
  const phuongAn: NotFill[][] = []
  const mo = (i: number) => [R(sau[i], L, .25, 70), ...sau.slice(i + 1, i + 4).map(n => R(n, L + .25, .25, 72)), R(sau[i + 4], L + .5, .5, 76)]
  if (luot) {
    /*
      Phách cuối hợp âm cũ = hợp âm lướt: tay trái "vỏ" hai nốt ngân tới hết đoạn; tay phải cú ba nốt bậc 3 · 7 · 3 quãng tám (Anh Cứ
      Đi Đi 53 F4+B4+F5), nhấn, cùng lúc tay trái. "Leo": 3 cặp nốt leo trên hợp âm đang vang ở từng móc kép (hàng xóm: 1 cặp trên bII7
      rồi 2 cặp trên át 7) rồi rơi phách 1 hợp âm sau. "Mở": mỗi đoạn một cú ba nốt ngân hết đoạn, rồi "mở" trên hợp âm sau.
    */
    const bassSau = 36 + pc((yc.next.bass ?? yc.next.root) - 36)
    const doan = luot.doan.map((d, k) => {
      const bass = [...Array(13)].map((_, i) => bassSau - 6 + i).find(n => pc(n) === d.bass)!
      const het = luot.doan[k + 1]?.tu ?? 0
      return { ...d, tu: L + d.tu, het: L + het, bass, chuoi: chuoiPc([0, 4, 7, 10].map(i => pc(d.goc + i))) }
    })
    const trai = doan.flatMap(d => [{ note: d.bass, startBeat: d.tu, durationBeats: d.het - d.tu, hand: 'left' as const, velocity: 66 },
      { note: d.bass + d.vo, startBeat: d.tu, durationBeats: d.het - d.tu, hand: 'left' as const, velocity: 60 }])
    const tranTrai = Math.max(...trai.map(x => x.note))
    const doanLuc = (t: number) => doan.findLast(d => d.tu <= t + 1e-6)!
    const ba = (d: typeof doan[number], q3: number, dur: number) => [R(q3, d.tu, dur, 72), R(q3 + 6, d.tu, dur, 72), R(q3 + 12, d.tu, dur, 72)]
    for (const q3 of doan[0].chuoi.filter(n => pc(n - doan[0].goc) === 4 && n >= 60 && n <= 76 && n > tranTrai)) {
      if (!leo) {
        // Mỗi đoạn một cú ba nốt; đoạn sau lấy bậc 3 gần cú trước nhất.
        const cu = [ba(doan[0], q3, doan[0].het - doan[0].tu)]
        for (const d of doan.slice(1)) {
          const q = d.chuoi.filter(n => pc(n - d.goc) === 4 && n > tranTrai && n >= 60).sort((x, y) => Math.abs(x - q3) - Math.abs(y - q3))[0]
          cu.push(ba(d, q, d.het - d.tu))
        }
        for (let i = 0; i + 4 < sau.length; i++) if (sau[i] >= 64) phuongAn.push([...trai, ...cu.flat(), ...mo(i)])
        continue
      }
      const cap: number[][] = []
      let duoi = q3
      for (let k = 0; k < 3; k++) {
        const c = doanLuc(L - .75 + k * .25).chuoi
        const m = c.findIndex(n => n > duoi)
        if (m < 0 || m + 1 >= c.length) break
        cap.push([c[m], c[m + 1]])
        duoi = c[m]
      }
      if (cap.length < 3) continue
      for (let r = 0; r + 2 < sau.length; r++) {
        const roi = sau.slice(r, r + 3)
        if (roi[0] < cap[2][0] || roi[2] <= cap[2][1] || roi[2] - cap[2][0] > 12) continue
        phuongAn.push([...trai, ...ba(doan[0], q3, .25), ...cap.flatMap((c, k) => c.map(n => R(n, L - .75 + k * .25, .25, 62 + k * 3))),
          ...roi.map(n => R(n, L, .75, 76))])
      }
    }
  } else if (leo) {
    // Không chèn hợp âm lướt: leo trên hợp âm đang vang như bản đầu.
    const cur = chuoi(yc.chord)
    for (let i = 0; i + 3 < cur.length; i++) for (let j = 0; j + 2 < sau.length; j++) {
      const cu3 = [cur[i + 2], cur[i + 3]], roi = sau.slice(j, j + 3)
      if (roi[0] < cu3[0] || roi[2] <= cu3[1] || roi[2] - cu3[0] > 12 || cur[i] < 64) continue
      phuongAn.push([...[[cur[i], cur[i + 1]], [cur[i + 1], cur[i + 2]], cu3].flatMap((c, k) => c.map(n => R(n, L - .75 + k * .25, .25, 60 + k * 4))),
        ...roi.map(n => R(n, L, .75, 74))])
    }
  } else for (let i = 0; i + 4 < sau.length; i++) if (sau[i] >= 64) phuongAn.push(mo(i))
  const dinh = (f: NotFill[]) => Math.max(...f.filter(x => x.startBeat >= L - 1e-6).map(x => x.note))
  return phuongAn.filter(vuaTay).sort((x, y) => Math.abs(dinh(x) - DINH) - Math.abs(dinh(y) - DINH))[0] ?? []
}

/**
 * Câu fill ĐAN vào sóng rải: gom nốt (cả vỏ hợp âm lướt tay trái) thành từng câu (cách nhau < ½ phách) rồi nhường như CP Lick đan
 * (`cpDanSong`): mỗi tay nhường trọn khoảng mà tay ấy của câu chiếm — tay trái sóng tắt ở phách hợp âm lướt (bass cũ đang ngân cắt
 * tại đó, không chồng hai bass).
 */
export function danFillVaoSong(backing: readonly TimelineEvent[], fill: readonly TimelineEvent[]): TimelineEvent[] {
  const cau: { start: number; end: number; events: TimelineEvent[] }[] = []
  for (const e of [...fill].sort((a, b) => a.startBeat - b.startBeat)) {
    const truoc = cau.at(-1)
    if (truoc && e.startBeat < truoc.end + .5 - 1e-6) {
      truoc.events.push(e)
      truoc.end = Math.max(truoc.end, e.startBeat + e.durationBeats)
    } else cau.push({ start: e.startBeat, end: e.startBeat + e.durationBeats, events: [e] })
  }
  return cau.length ? cpDanSong(backing, cau) : [...backing]
}
