import { findQualityBySymbol } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { TeacherId } from '../teachers'
import { kieuDau } from '../vongThay'
import { dep, lyThuyetBac, tenBac, tenHopAm, tenNotBac, type DongLyThuyet, type DongThay, type DuLieuSoanCau } from './soanCau'

/*
  THẺ GIẢI THÍCH phần 1 (GĐ 3, ý 3 — người dùng 4/10/2026): "khi chọn tone chủ và bậc 1 thì sẽ đưa ra các bậc còn lại và giải thích
  tại sao chọn hợp âm đó vào các bậc đó … bên phần của các thầy thì cũng sẽ giải thích về lựa chọn đặt hợp âm của các thầy … trong
  vai một thầy dạy Piano chuyên nghiệp, văn phong giải thích phải cặn kẽ … người mới biết cơ bản về Piano cũng có thể hiểu được …
  dùng từ ngữ chuyên môn nhưng phải giải thích các từ đó khi dùng".
  Câu sinh từ CHÍNH nốt của hợp âm nên đúng cho mọi giọng. Cột lý thuyết là lý thuyết (sách); cột thầy là số đo, ghi nguồn md.
*/

const SOL: Record<string, string> = { C: 'Đô', D: 'Rê', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' }
/** Tên Việt của nốt: 'Bb' → 'Si♭', 'C#' → 'Đô♯'. */
export const vn = (ten: string) => `${SOL[ten[0]!] ?? ten[0]}${ten.slice(1).replace(/#/g, '♯').replace(/b/g, '♭')}`

const pc = (x: number) => ((x % 12) + 12) % 12
const tenChu = (tonic: number, thu: boolean) => vn(pitchClassName(pc(tonic), kieuDau(tonic, thu)))
const tenGiong = (tonic: number, thu: boolean) => `${tenChu(tonic, thu)} ${thu ? 'thứ' : 'trưởng'}`

/** Nốt của hợp âm theo thứ tự cấu tạo (gốc → 3 → 5 → 7 → màu), gọi đúng chữ. */
function notCua(gocPc: number, chat: string, tonic: number, thu: boolean) {
  const q = findQualityBySymbol(chat) ?? findQualityBySymbol('')!
  return [...new Set(q.intervals.map((i) => i % 12))].map((rel) => ({ rel, ten: tenNotBac(gocPc, rel, chat, tonic, thu) }))
}

/** Bảy nốt của gam (thứ: tự nhiên), gọi theo chữ liền nhau. */
export function notGam(tonic: number, thu: boolean): string[] {
  const buoc = thu ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]
  const CHU = 'CDEFGAB'
  const PC = [0, 2, 4, 5, 7, 9, 11]
  const chuGoc = CHU.indexOf(pitchClassName(pc(tonic), kieuDau(tonic, thu))[0]!)
  return buoc.map((b, i) => {
    const c = (chuGoc + i) % 7
    const lech = pc(tonic + b - PC[c]! + 6) - 6
    return CHU[c]! + (lech > 0 ? '#'.repeat(lech) : 'b'.repeat(-lech))
  })
}

/** Đoạn mở đầu phần 1 — đọc một lần trước khi xem từng bậc. */
export const GIOI_THIEU =
  'Trong một giọng, ta dùng bảy nốt của gam. Trên mỗi nốt dựng một hợp âm bằng cách chồng thêm các nốt cách nhau một bậc (nhảy cách một nốt: ' +
  'Đô → Mi → Sol) — gọi là CHỒNG QUÃNG BA — và chỉ dùng nốt của gam. Vì khoảng cách giữa các nốt trong gam không đều (chỗ một cung, chỗ ' +
  'nửa cung), mỗi bậc tự ra một loại hợp âm: trưởng, thứ hay giảm. Bậc nào mang hợp âm nấy là do GAM quyết định, không phải ta chọn. ' +
  'Cột bên phải là lối của thầy đo từ sheet: thầy giữ đúng gam ở đâu, đổi ở đâu, và đổi để nghe ra sao.'

export const THUAT_NGU: readonly { tu: string; nghia: string }[] = [
  { tu: 'Nửa cung · một cung', nghia: 'Nửa cung là khoảng cách giữa hai phím liền nhau trên đàn, kể cả phím đen (Đô → Đô♯). Một cung = hai nửa cung (Đô → Rê).' },
  { tu: 'Gam', nghia: 'Dãy bảy nốt làm chất liệu của một giọng. Gam Đô trưởng: Đô Rê Mi Fa Sol La Si.' },
  { tu: 'Chủ âm', nghia: 'Nốt "nhà" của giọng — nốt đầu gam. Giọng La thứ có chủ âm La.' },
  {
    tu: 'Bậc · số La Mã',
    nghia:
      'Vị trí của nốt trong gam: bậc 1 là chủ âm … bậc 7. Hợp âm dựng trên bậc nào gọi theo bậc ấy, ghi bằng số La Mã: chữ HOA là hợp âm trưởng (I, IV, V), chữ thường là hợp âm thứ (ii, iii, vi), dấu ° là hợp âm giảm (vii°). Dấu ♭ đứng trước (♭III, ♭VI, ♭VII) nghĩa là gốc thấp hơn bậc ấy của gam trưởng nửa cung — gặp ở giọng thứ.',
  },
  {
    tu: 'Quãng',
    nghia:
      'Khoảng cách giữa hai nốt, đếm theo tên nốt: Đô → Mi là quãng ba (Đô–Rê–Mi, ba tên). Đo bằng nửa cung: quãng ba trưởng 4, quãng ba thứ 3, quãng năm đúng 7, quãng năm giảm 6, quãng bảy trưởng 11, quãng bảy thứ 10.',
  },
  { tu: 'Hợp âm ba', nghia: 'Ba nốt chồng quãng ba: gốc – bậc 3 – bậc 5. Trưởng = 4 + 3 nửa cung; thứ = 3 + 4; giảm = 3 + 3.' },
  {
    tu: 'Hợp âm bảy',
    nghia:
      'Hợp âm ba thêm nốt bậc 7: maj7 (trưởng + bảy trưởng), m7 (thứ + bảy thứ), 7 (trưởng + bảy thứ — gọi là hợp âm bảy ÁT), m7♭5 (giảm + bảy thứ — gọi là NỬA GIẢM).',
  },
  { tu: 'Chức năng', nghia: 'Vai của hợp âm trong giọng: CHỦ (nghỉ, "ở nhà"), HẠ ÁT (rời nhà, chuẩn bị), ÁT (căng, muốn về chủ).' },
  { tu: 'Nốt cảm âm', nghia: 'Nốt nằm dưới chủ âm đúng nửa cung (Si trong Đô trưởng, Sol♯ trong La thứ hòa âm). Tai nghe nó muốn bước lên chủ âm.' },
  {
    tu: 'Gam thứ tự nhiên · hòa âm',
    nghia:
      'Thứ tự nhiên: La Si Đô Rê Mi Fa Sol. Thứ HÒA ÂM: nâng bậc 7 lên nửa cung (Sol → Sol♯) để có nốt cảm âm — nhờ vậy bậc V thành hợp âm trưởng, kéo mạnh về chủ.',
  },
  { tu: 'Trơn · màu', nghia: 'Hợp âm TRƠN chỉ có ba nốt. Thêm nốt 6, 7, 9, 11 hay 13 là tô MÀU (vd add9 = thêm nốt 9, nốt cách gốc một quãng chín).' },
  { tu: 'Hợp âm treo (sus)', nghia: 'Bỏ bậc 3, thay bằng bậc 2 hoặc 4 — chưa rõ trưởng hay thứ, nghe lơ lửng, thường giải về hợp âm có bậc 3.' },
  { tu: 'Át phụ', nghia: 'Hợp âm bảy át mượn tạm để kéo sang một hợp âm KHÔNG phải chủ — vd II7 kéo sang V, I7 kéo sang iv.' },
  { tu: 'Đảo bass', nghia: 'Nốt thấp nhất không phải nốt gốc của hợp âm, viết C/E (Đô trưởng, bass Mi).' },
  { tu: 'Bước chuyển', nghia: 'Đi từ hợp âm này sang hợp âm kia — vd i → ♭VI.' },
]

/** Theo thói quen chung (sách hòa âm) — hay đi tới đâu. Nhãn: lý thuyết. */
const DI_TOI = {
  truong: ['', 'bất kỳ bậc nào — chủ là chỗ xuất phát', 'V (ii → V → I là "vòng 2-5-1")', 'vi', 'V, hoặc về thẳng I', 'I', 'ii hoặc IV', 'I'],
  thu: ['', 'bất kỳ bậc nào', 'V', '♭VI hoặc iv', 'V, hoặc về i', 'i', 'ii° hoặc ♭VII', '♭III hoặc i'],
}

const LOAI: Record<string, { ten: string; nghe: string }> = {
  '4-7': { ten: 'TRƯỞNG', nghe: 'nghe sáng, vững' },
  '3-7': { ten: 'THỨ', nghe: 'nghe tối và buồn hơn hợp âm trưởng' },
  '3-6': { ten: 'GIẢM', nghe: 'nghe căng, chênh vênh, không đứng yên được' },
  '4-8': { ten: 'TĂNG', nghe: 'nghe lơ lửng, kỳ lạ' },
}
const TEN_QUANG_BA = { 3: 'thứ', 4: 'trưởng' } as Record<number, string>
/** Nốt màu gọi theo QUÃNG thật trong cấu tạo (14 = 9, 21 = 13), không gộp quãng tám — 13 không thành "6". */
const NOT_MAU: Record<number, { ten: string; nghe: string }> = {
  9: { ten: '6', nghe: 'ngọt, hơi cổ' },
  13: { ten: '♭9', nghe: 'căng, màu tối' },
  14: { ten: '9', nghe: 'mềm, mở, nghe hiện đại hơn' },
  15: { ten: '♯9', nghe: 'căng, màu blues' },
  17: { ten: '11', nghe: 'lửng, treo' },
  18: { ten: '♯11', nghe: 'sáng, lạ — màu lydian' },
  20: { ten: '♭13', nghe: 'căng, màu tối' },
  21: { ten: '13', nghe: 'ngọt, sang' },
}
const TEN_QUANG_NAM = { 6: 'giảm', 7: 'đúng', 8: 'tăng' } as Record<number, string>

/** Lời thầy giải thích một hợp âm theo lý thuyết — cấu tạo, vì sao bậc ấy mang loại ấy, chức năng, hay đi tới đâu. */
export function giaiThichLyThuyet(tonic: number, thu: boolean, d: DongLyThuyet): string[] {
  const q = findQualityBySymbol(d.chat) ?? findQualityBySymbol('')!
  const gocPc = pc(tonic + d.goc)
  const nots = notCua(gocPc, d.chat, tonic, thu)
  const ten = (rel: number) => vn(nots.find((x) => x.rel === rel)?.ten ?? tenNotBac(gocPc, rel, d.chat, tonic, thu))
  const goc = ten(0)
  const iv = q.intervals
  const ba = iv.includes(4) ? 4 : iv.includes(3) ? 3 : null
  const nam = iv.includes(7) ? 7 : iv.includes(6) ? 6 : iv.includes(8) ? 8 : null
  const bay = q.id === 'dim7' ? 9 : iv.includes(11) ? 11 : iv.includes(10) ? 10 : null
  const treo = ba === null ? (iv.includes(5) ? 5 : iv.includes(2) ? 2 : null) : null
  const mau = iv.filter((i) => ![0, ba, nam, bay, treo].includes(i))
  const hoaAm = d.chucNang === 'át (gam thứ hòa âm)'
  const chu = tenChu(tonic, thu)
  const doan: string[] = [`${d.laMa} — ${d.hopAm}: gồm ${nots.map((x) => x.ten).join(' – ')} (${nots.map((x) => vn(x.ten)).join(' – ')}).`]

  if (ba !== null && nam !== null) {
    const loai = LOAI[`${ba}-${nam}`]
    doan.push(
      `Lấy ${goc} làm gốc rồi chồng thêm các nốt cách nhau một bậc trong gam: ${goc} → ${ten(ba)} → ${ten(nam)}. ` +
        `Từ ${goc} lên ${ten(ba)} là ${ba} nửa cung — quãng ba ${TEN_QUANG_BA[ba]}; từ ${goc} lên ${ten(nam)} là ${nam} nửa cung — quãng năm ${TEN_QUANG_NAM[nam]}. ` +
        (loai ? `Quãng ba ${TEN_QUANG_BA[ba]} cùng quãng năm ${TEN_QUANG_NAM[nam]} cho ra hợp âm ${loai.ten}: ${loai.nghe}.` : ''),
    )
    if (!hoaAm && loai) {
      doan.push(
        `Vì sao bậc ${d.bac} của giọng ${tenGiong(tonic, thu)} là hợp âm ${loai.ten.toLowerCase()}? Gam chỉ có bảy nốt ${notGam(tonic, thu).map(vn).join(' · ')}. ` +
          `Chồng quãng ba bằng đúng các nốt ấy thì trên bậc ${d.bac} tự ra hai quãng ba ${ba} rồi ${nam - ba} nửa cung — không phải ta chọn, mà gam quyết định.`,
      )
    }
  } else if (treo !== null) {
    doan.push(
      `Hợp âm TREO: không có bậc ba — thay bằng ${ten(treo)} (cách gốc ${treo} nửa cung). Thiếu bậc ba nên chưa rõ trưởng hay thứ: nghe lơ lửng, thường giải về hợp âm có bậc ba.`,
    )
  }
  if (hoaAm) {
    const b7 = vn(tenNotBac(gocPc, 3, 'm', tonic, thu))
    doan.push(
      `Gam thứ tự nhiên có ${b7} (bậc 7) nằm dưới chủ âm ${chu} một cung, nên bậc v ở đó là hợp âm thứ. Gam thứ HÒA ÂM nâng ${b7} lên nửa cung thành ${ten(4)} — bậc V thành hợp âm TRƯỞNG, mang nốt cảm âm ${ten(4)}.`,
    )
  }
  if (bay !== null) {
    const y =
      q.id === 'maj7'
        ? 'nghe mềm, mơ màng'
        : q.id === 'm7'
          ? 'êm và tròn hơn hợp âm thứ trơn'
          : q.id === '7'
            ? 'đây là hợp âm bảy ÁT — căng, rất muốn về chủ'
            : q.id === 'm7b5'
              ? 'gọi là NỬA GIẢM — căng nhưng mềm hơn hợp âm giảm, hay đứng trước V'
              : ''
    doan.push(
      `Thêm nốt thứ tư ${ten(bay)} — cách gốc ${bay} nửa cung (quãng bảy ${bay === 11 ? 'trưởng' : bay === 10 ? 'thứ' : 'giảm'}) — được ${d.hopAm}${y ? `: ${y}` : ''}.`,
    )
  }
  for (const i of mau) {
    const m = NOT_MAU[i]
    doan.push(`Thêm nốt ${ten(i % 12)} (nốt ${m?.ten ?? tenBac(i % 12, d.chat)} của hợp âm) để tô màu${m ? `: ${m.nghe}` : ''}.`)
  }

  const camAm = pc(tonic - 1)
  if (d.chucNang === 'chủ') {
    if (d.bac === 1) doan.push(`Chức năng CHỦ — "nhà" của giọng: nghe yên, đã về; bài thường mở và đóng ở đây.`)
    else {
      const chuPcs = [0, thu ? 3 : 4, 7].map((x) => pc(tonic + x))
      const chung = nots.filter((x) => chuPcs.includes(pc(gocPc + x.rel))).map((x) => vn(x.ten))
      doan.push(`Chức năng CHỦ thay thế: chung ${chung.length} nốt (${chung.join(', ')}) với hợp âm chủ nên đứng thay được chủ — nghe "ở nhà" nhưng nhẹ hơn.`)
    }
  } else if (d.chucNang === 'hạ át') {
    doan.push('Chức năng HẠ ÁT — rời nhà, chuẩn bị: thường dẫn sang át (bậc V).')
  } else if (d.pcs.includes(camAm)) {
    doan.push(
      `Chức năng ÁT — căng nhất giọng, muốn về chủ. Trong hợp âm có ${vn(tenNotBac(gocPc, pc(camAm - gocPc), d.chat, tonic, thu))} — nốt nằm dưới chủ âm ${chu} đúng nửa cung, gọi là NỐT CẢM ÂM: tai nghe nó "đòi" bước lên ${chu}.`,
    )
  } else {
    doan.push(
      `Chức năng ÁT nhưng YẾU: hợp âm không có nốt cảm âm (nốt nằm dưới chủ âm nửa cung), nên lực kéo về ${chu} nhẹ${d.bac === 7 && thu ? ' — ♭VII nghe mộc, dân gian, hay đi về ♭III hoặc i' : ''}.`,
    )
  }
  doan.push(`Thói quen chung (sách hòa âm): hay đi tới ${DI_TOI[thu ? 'thu' : 'truong'][d.bac]}.`)
  return doan
}

const XUNG: Partial<Record<TeacherId, string>> = { 'linh-nhi': 'chị', 'ca-phao': 'anh' }
const REL_MAU: Record<string, number> = { b7: 10, '7': 11, '9': 2, '11': 5, '6': 9, b9: 1, b13: 8, '#11': 6 }
const TEN_MAU: Record<string, string> = { b7: '♭7', '7': '7', '9': '9', '11': '11', '6': '6', b9: '♭9', b13: '♭13', '#11': '♯11' }
const Y_MAU: Record<string, (chat: string) => string> = {
  b7: (chat) =>
    chat === '' ? 'thành hợp âm bảy át: căng, kéo đi tiếp' : chat === 'm' ? 'thành m7: êm, tròn' : chat === 'dim' ? 'thành m7♭5 (nửa giảm)' : 'thêm nốt bảy',
  '7': () => 'thành maj7: sáng, mơ màng',
  '9': () => 'nốt 9: mềm, mở, nghe hiện đại hơn',
  '6': () => 'nốt 6: ngọt, hơi cổ',
  '11': () => 'nốt 11: lửng, treo',
  b9: () => 'nốt căng, màu tối',
  b13: () => 'nốt căng, màu tối',
  '#11': () => 'nốt căng, màu lạ',
}

/** Ghi chú viết tay theo bậc — số đo trong md của thầy, ghi nguồn. Khoá = ký hiệu bậc trong dữ liệu. */
const GHI_CHU_BAC: Partial<Record<TeacherId, Record<'truong' | 'thu', Record<string, string>>>> = {
  'linh-nhi': {
    thu: {
      i: 'Màu của chị trên chủ nằm ở NỐT RẢI TAY TRÁI — nhất là nốt 9 — chứ không ở ký hiệu hợp âm (số đo md 13d; ghi chú `linhNhiHarmony.ts`).',
      iv: 'Lên điệp khúc, iv thành add9 ở 7/10 đoạn (3 bài); phiên khúc phần lớn trơn — 18/38 (số đo md 13d).',
      bVI: 'Lên điệp khúc, ♭VI thành maj7 ở 13/21 đoạn (3 bài); phiên khúc chỉ 8/25 — điệp khúc là chỗ bài mở rộng, maj7 làm hợp âm sáng và rộng ra (số đo md 13d; câu sau là suy luận của Claude).',
      'ii°': 'Ở đoạn solo, chị vào V qua ii°: ii° → V7 ở 4/5 bài (số đo md 13c).',
      bVII: 'Ở đoạn dạo, chị hay đi xuống từ chủ: i → ♭VII ở Lá Thư, Đừng Xa, Rừng Lá (số đo md 13c).',
      V: 'Đoạn dạo của chị đóng trên V hoặc V7 ở 3/5 bài (số đo md 13c).',
    },
    truong: {
      I: 'Giọng trưởng chị gần như không tô màu: trơn là loại hay gặp nhất ở mọi bậc (số đo md 13d).',
      vi: 'Ở đoạn solo, chị hay đi xuống từng quãng ba I → vi → iii → ii (Biển Tình, Mùa Xuân — số đo md 13c).',
      V: 'V7 chỉ 7/42 đoạn — chị để V trơn là chính (số đo md 13d).',
    },
  },
}

/** Lời giải thích lựa chọn của THẦY ở một bậc — số đo phần hát, so với lý thuyết, ghi chú md, bước chuyển. */
export function giaiThichThay(du: DuLieuSoanCau, thay: TeacherId, tonic: number, thu: boolean, row: DongThay): string[] {
  const x = XUNG[thay] ?? 'thầy'
  const X = x[0]!.toUpperCase() + x.slice(1)
  const g = thu ? 'thu' : 'truong'
  const gocPc = pc(tonic + row.goc)
  const ba = notCua(gocPc, row.chat, tonic, thu)
  const chu = tenChu(tonic, thu)
  const doan: string[] = [`${X} đặt ${row.laMa} (${row.hopAm}) ở ${row.n} đoạn, trong ${row.bai} bài (phần hát).`]
  doan.push(
    `${row.tron}/${row.n} đoạn để TRƠN — chỉ ba nốt ${ba.map((n) => vn(n.ten)).join(' – ')}${row.tron * 2 >= row.n ? `: phần lớn ${x} để mộc` : ''}.`,
  )
  for (const [k, so] of row.mauKhoa) {
    const rel = REL_MAU[k]
    if (rel === undefined || so < Math.max(3, row.n * 0.15)) continue
    doan.push(`${so}/${row.n} đoạn có thêm ${vn(tenNotBac(gocPc, rel, row.chat, tonic, thu))} (nốt ${TEN_MAU[k]} của hợp âm) — ${Y_MAU[k]!(row.chat)}.`)
  }

  const ltBa = lyThuyetBac(tonic, thu, thu ? 'm' : '').dong.filter((d) => d.chucNang !== 'át (gam thứ hòa âm)').find((d) => d.goc === row.goc)
  const b7 = row.mauKhoa.find(([k]) => k === 'b7')?.[1] ?? 0
  const chatLt = ltBa ? (findQualityBySymbol(ltBa.chat)?.intervals.includes(4) ? '' : findQualityBySymbol(ltBa.chat)?.intervals.includes(6) ? 'dim' : 'm') : null
  if (!ltBa) {
    doan.push(`${row.laMa} là hợp âm NGOÀI GAM ${tenGiong(tonic, thu)}: gốc ${vn(ba[0]!.ten)} không nằm trong bảy nốt của gam.`)
  } else if (chatLt === row.chat) {
    doan.push(`Khớp lý thuyết: trong gam, bậc này là ${ltBa.laMa} (${ltBa.hopAm}).`)
  } else if (thu && row.goc === 7 && row.chat === '') {
    doan.push(
      `Khác gam thứ tự nhiên (cho v thứ — ${ltBa.hopAm}): ${x} đặt V TRƯỞNG, đúng lối gam thứ hòa âm — có nốt cảm âm ${vn(ba[1]!.ten)} kéo về ${chu}.` +
        (b7 * 2 >= row.n ? ` Thêm ♭7 ở ${b7}/${row.n} đoạn thành V7 — hợp âm bảy át, càng kéo mạnh.` : ''),
    )
  } else if (thu && row.goc === 0 && row.chat === '') {
    doan.push(
      `Hợp âm chủ TRƯỞNG trong giọng thứ: ${b7}/${row.n} đoạn có ♭7 — thành ${row.hopAm}7, hợp âm bảy át của iv (gọi là ÁT PHỤ): ${x} mượn tạm nó để kéo sang iv.`,
    )
  } else if (!thu && row.goc === 2 && row.chat === '') {
    doan.push(
      `Lý thuyết đặt ii thứ (${ltBa.hopAm}); ${x} đặt II TRƯỞNG — nâng ${vn(tenNotBac(gocPc, 3, 'm', tonic, thu))} lên ${vn(ba[1]!.ten)}, chính là nốt cảm âm của V.` +
        (b7 ? ` Có ♭7 ở ${b7}/${row.n} đoạn → ${row.hopAm}7 = át của V (ÁT PHỤ): kéo sang V.` : ''),
    )
  } else {
    doan.push(`Lý thuyết đặt ${ltBa.laMa} (${ltBa.hopAm}); ${x} đặt ${row.laMa} (${row.hopAm}).`)
  }

  const ghi = GHI_CHU_BAC[thay]?.[g]?.[row.khoa]
  if (ghi) doan.push(ghi)
  const bac = du.hopAm[g].bac
  const di = du.hopAm[g].chuyen.filter(([a, , , baiCo]) => a === row.khoa && baiCo >= 2).slice(0, 3)
  if (di.length) {
    doan.push(
      `Từ ${row.hopAm}, ${x} hay đi tới: ${di
        .map(([, b, n, baiCo]) => `${dep(b)}${bac[b] ? ` (${tenHopAm(tonic, thu, bac[b]!.goc, bac[b]!.chat)})` : ''} ${n} lần, ${baiCo} bài`)
        .join(' · ')}.`,
    )
  }
  if (row.nghi) doan.push(`Lưu ý số đo: ${row.nghi}.`)
  return doan
}
