import { parseChordToken } from '../../reharm/input/chordInputParser'
import { buildProgression, PROGRESSION_TEMPLATES } from '../../shared/musicTheory/progressionGenerator'
import { CONG_THUC, KHI_CHON, type CongThuc } from './chongHopAm'
import { nguCanh, theBamHop, type Hop } from './giaiThich'
import { kieuDau } from '../vongThay'

/*
  VÒNG + LỰA CHỌN THAY — người dùng 8/10/2026: "Hãy cho những vòng hợp âm sẵn có hoặc cho tôi tự điền vòng hợp âm rồi sau đó mỗi hợp âm
  bạn sẽ đưa ra các hợp âm thay thế để tôi chọn, mỗi khi chọn vào bạn sẽ giải thích tại sao nên chọn hợp âm đó ở vị trí đó, và nó mang
  lại cảm giác như thế nào khi chơi và sẽ biến vòng đó theo hướng nào." Chốt 9/10 theo đề xuất của Claude: lời viết theo LOẠI thay (lời
  nhạc sĩ — phân tích của Claude, không phải số đo) cộng câu TÍNH từ chính vị trí ấy (bass đi, nốt chung, nốt dẫn, nốt ngoài gam — sự
  thật về nốt). Dùng ở trang Hợp âm (tab Tái hòa âm vòng) và Phần 2 của tab thầy.
*/

export type LoaiThay = 'mau' | 'ho-hang' | 'at-phu' | 'ii-v' | 'tam-cung' | 'giam-luot' | 'muon' | 'treo' | 'cau-thang' | 'nghieng'

/** `huong(sau)`: vòng rẽ về đâu — `sau` là tên hợp âm đứng sau ô ấy. */
export const LOAI: Readonly<Record<LoaiThay, { ten: string; nghe: string; huong: (sau: string) => string; thay: string }>> = {
  mau: {
    ten: 'Thêm màu',
    nghe: 'Giữ nguyên hợp âm, thêm 7, 9, 11 hay 13 — đường đi không đổi, chỉ độ dày đổi. Nghe mềm, sang, hiện đại hơn.',
    huong: () => 'Vòng giữ đúng đường cũ nhưng dày và mềm hơn — không đổi hướng, chỉ đổi ánh sáng.',
    thay: 'Cà Pháo tô màu trong tay phải; Linh Nhi để màu hiện ra từ hình rải tay trái; Blues cho hợp âm bảy khắp nơi.',
  },
  'ho-hang': {
    ten: 'Họ hàng — chung hai nốt, đổi bass',
    nghe: 'Hợp âm cách một quãng ba dùng chung hai nốt với hợp âm cũ, nên tai vẫn nhận ra chỗ ấy — nhưng bass và tính chất đổi: trưởng thành thứ thì chỗ ấy lắng xuống, thứ thành trưởng thì sáng lên.',
    huong: () => 'Vòng đổi màu ở đúng một chỗ mà không gãy — giai điệu cũ vẫn đặt lên được.',
    thay: 'Cà Pháo hạ bass một quãng ba (♭VI thành iv9); Linh Nhi đặt ii°7 = iv trên bass ii.',
  },
  'at-phu': {
    ten: 'Át phụ — biến hợp âm này thành V của hợp âm sau',
    nghe: 'Nâng một nốt thành nốt dẫn nửa cung vào gốc hợp âm sau, thêm ♭7: hợp âm sau đến như được kéo tới. Nghe lóe sáng một khoảnh khắc, có lực.',
    huong: (sau) => `Vòng có thêm một cú kéo — ${sau} thành đích, câu nhạc tiến về phía trước.`,
    thay: 'Cà Pháo: I7 trước iv, II7 trước V; Linh Nhi: I7 → iv (của bài), II7 ở Đường Xưa.',
  },
  'ii-v': {
    ten: 'ii – V phụ — rẽ vào hẻm ngắn',
    nghe: 'Thay một hợp âm bằng hai: ii rồi V của hợp âm sau — như rẽ vào một con hẻm ngắn rồi mới ra đường lớn. Nghe "có học", jazz, mềm hơn át phụ đứng một mình.',
    huong: (sau) => `Vòng tạm đổi nhà sang ${sau} trong một ô; nhịp hòa âm nhanh gấp đôi ở chỗ ấy.`,
    thay: 'Cà Pháo: v7 – I7 – iv7 (ii – V của iv); Robert (Blues): ii – V trước V.',
  },
  'tam-cung': {
    ten: 'Thay tam cung',
    nghe: 'Thay V7 bằng hợp âm bảy cách nó ba cung: hai hợp âm chung cặp nốt 3 – ♭7, nên vẫn kéo về đích, mà bass trượt nửa cung xuống thay vì nhảy quãng năm. Nghe trơn, sang, rất jazz.',
    huong: () => 'Vòng bớt "đóng" kiểu cổ điển, chảy hơn — bass đi nửa cung vào đích.',
    thay: 'Ray Charles (Blues) ở đuôi kết; Robert (Blues) ♭II7 → I.',
  },
  'giam-luot': {
    ten: 'Giảm lướt — chèn nửa cung dưới hợp âm sau',
    nghe: 'Giữ hợp âm này nửa đầu, nửa sau chèn hợp âm bảy giảm nằm nửa cung dưới gốc hợp âm sau: mọi nốt của nó dẫn nửa cung vào hợp âm sau. Nghe cổ điển, sang, hơi u buồn.',
    huong: () => 'Vòng chảy liền hơn — bass đi từng bậc thay vì nhảy.',
    thay: 'Linh Nhi: hợp âm giảm thay V ở Đường Xưa, Mùa Xuân; Robert (Blues): I → ♭III° → ii.',
  },
  muon: {
    ten: 'Mượn giọng cùng chủ âm',
    nghe: 'Mượn một hợp âm của giọng thứ (hay trưởng) cùng chủ âm: một nốt hạ hay nâng nửa cung mà cả màu đổi.',
    huong: () => 'Bài trưởng mượn iv, ♭VI, ♭VII thì vòng nhuốm buồn, như nắng chiều tắt dần; bài thứ mượn IV, I thì sáng lên bất ngờ.',
    thay: 'Linh Nhi: iv ngân suốt đoạn kết Đường Xưa.',
  },
  treo: {
    ten: 'Treo bậc 4 rồi mới thả',
    nghe: 'Nửa đầu treo bậc 4 thay bậc 3 — hợp âm lửng lơ, như hỏi mà chưa nói hết — nửa sau mới thả xuống bậc 3. Nghe hiện đại, có hơi thở.',
    huong: () => 'Vòng có thêm một nhịp chờ trước khi về — cuối câu đỡ "đóng sập".',
    thay: 'Linh Nhi: V7sus4 → V; Cà Pháo: V7sus4 rồi V13.',
  },
  'cau-thang': {
    ten: 'Cầu thang bass — chèn ♭VII cho bass đi xuống liền bậc',
    nghe: 'Chèn ♭VII giữa i và hợp âm sau: bass bước xuống từng bậc (1 → ♭7 → ♭6 → 5), "cầu thang buồn" của bolero — nghe như trôi xuống không cưỡng được.',
    huong: () => 'Vòng có đường bass đi xuống liền mạch — buồn, định mệnh.',
    thay: 'Linh Nhi chèn ♭VII giữa i và ♭VI (11 chỗ chèn).',
  },
  nghieng: {
    ten: 'Nghiêng trước V — chèn ii°7',
    nghe: 'Giữ iv nửa đầu, nửa sau chỉ hạ bass xuống bậc 2: thành ii°7 (iv trên bass ii). iv chưa vội đi, nghiêng thêm một nhịp — tối hơn — rồi mới đổ vào V.',
    huong: () => 'Vòng vào V chậm và nặng hơn — chất bolero cổ điển.',
    thay: 'Linh Nhi (12 chỗ, không bản phổ biến nào ghi).',
  },
}

export interface LuaChonThay {
  loai: LoaiThay
  /** Một hay hai hợp âm thay vào đúng ô ấy (hai = ô chia đôi). */
  thay: Hop[]
  /** Công thức màu (loại `mau`) — để lấy lời "khi nào nên chọn". */
  ct?: CongThuc
}

const pc = (x: number) => ((x % 12) + 12) % 12
const ho = (chat: string): CongThuc['nhom'] =>
  chat === 'dim' || chat === 'dim7' || chat.startsWith('m7b5')
    ? 'Nửa giảm · giảm'
    : chat.startsWith('m') && !chat.startsWith('maj')
      ? 'Thứ'
      : /^(7|9|13)/.test(chat)
        ? 'Át'
        : 'Trưởng'
/** Lớp cao độ của một hợp âm (gốc tính từ chủ âm) — đúng các nốt bấm để nghe (`theBamHop`). */
export const pcsHop = (tonic: number, x: Hop) => [...new Set(theBamHop(tonic, x).map(pc))]
const GAM_TRUONG = [0, 2, 4, 5, 7, 9, 11]
const GAM_THU = [0, 2, 3, 5, 7, 8, 10, 11] // thứ tự nhiên + bậc 7 nâng (cảm âm của V)
const trongGam = (thu: boolean, x: Hop) => {
  const g = thu ? GAM_THU : GAM_TRUONG
  return pcsHop(0, x).every((p) => g.includes(p))
}

/** Các lựa chọn thay cho ô `i` của vòng (vòng lặp: ô sau của ô cuối là ô đầu). */
export function cacLuaChon(vong: readonly Hop[], i: number, thu: boolean): LuaChonThay[] {
  const x = vong[i]!
  const y = vong[(i + 1) % vong.length]!
  const sau = y !== x && !(y.goc === x.goc && y.chat === x.chat)
  const ra: LuaChonThay[] = []
  const hx = ho(x.chat)
  // Thêm màu — mọi công thức cùng họ (bỏ chính nó).
  for (const ct of CONG_THUC.filter((c) => c.nhom === hx && c.kyHieu !== x.chat)) ra.push({ loai: 'mau', thay: [{ goc: x.goc, chat: ct.kyHieu }], ct })
  // Họ hàng — cách một quãng ba, chung hai nốt, trong gam.
  const hoHang: Hop[] =
    hx === 'Trưởng' ? [{ goc: pc(x.goc + 9), chat: 'm' }, { goc: pc(x.goc + 4), chat: 'm' }] : hx === 'Thứ' ? [{ goc: pc(x.goc + 3), chat: '' }, { goc: pc(x.goc + 8), chat: '' }] : []
  for (const h of hoHang) if (trongGam(thu, h)) ra.push({ loai: 'ho-hang', thay: [h] })
  if (sau && ho(y.chat) !== 'Nửa giảm · giảm') {
    const vY = { goc: pc(y.goc + 7), chat: '7' }
    const laAt = pc(x.goc - y.goc) === 7 && ho(x.chat) !== 'Thứ'
    if (!laAt) ra.push({ loai: 'at-phu', thay: [vY] })
    ra.push({ loai: 'ii-v', thay: [{ goc: pc(y.goc + 2), chat: ho(y.chat) === 'Thứ' ? 'm7b5' : 'm7' }, vY] })
    if (laAt) ra.push({ loai: 'tam-cung', thay: [{ goc: pc(y.goc + 1), chat: '7' }] })
    ra.push({ loai: 'giam-luot', thay: [x, { goc: pc(y.goc - 1), chat: 'dim7' }] })
  }
  // Mượn giọng cùng chủ âm.
  const muon: Record<string, Hop> = thu
    ? { '5|m': { goc: 5, chat: '' }, '0|m': { goc: 0, chat: '' } }
    : { '5|': { goc: 5, chat: 'm' }, '9|m': { goc: 8, chat: '' }, '7|': { goc: 10, chat: '' }, '2|m': { goc: 2, chat: 'm7b5' } }
  const m = muon[`${x.goc}|${x.chat.replace(/7$/, '')}`]
  if (m) ra.push({ loai: 'muon', thay: [m] })
  // Treo — hợp âm át (V hay át phụ).
  if (ho(x.chat) === 'Át' || (x.goc === 7 && hx === 'Trưởng')) ra.push({ loai: 'treo', thay: [{ goc: x.goc, chat: '7sus4' }, { goc: x.goc, chat: '7' }] })
  // Hai lối riêng của Linh Nhi ở giọng thứ.
  if (thu && x.goc === 0 && hx === 'Thứ' && (y.goc === 8 || y.goc === 7)) ra.push({ loai: 'cau-thang', thay: [x, { goc: 10, chat: '' }] })
  if (thu && x.goc === 5 && hx === 'Thứ' && y.goc === 7) ra.push({ loai: 'nghieng', thay: [x, { goc: 2, chat: 'm7b5' }] })
  return ra
}

const QUANG = ['đứng yên', 'nửa cung', 'một cung', 'quãng ba thứ', 'quãng ba trưởng', 'quãng bốn', 'ba cung']
/** Bass đi từ `a` sang `b` (nửa cung so với chủ âm): "lên một cung", "xuống quãng năm" … — chọn đường ngắn. */
const buocBass = (a: number, b: number) => {
  const len = pc(b - a)
  if (len === 0) return 'đứng yên'
  if (len === 6) return 'ba cung'
  return len < 6 ? `lên ${QUANG[len]}` : `xuống ${QUANG[12 - len]}`
}

/**
 * Câu TÍNH ở đúng vị trí: bass đi thế nào, chung nốt nào với hợp âm trước / sau, nốt nào dẫn nửa cung vào hợp âm sau, nốt nào ngoài
 * gam. Tên nốt ở giọng đang chọn.
 */
export function canhVong(vong: readonly Hop[], i: number, lc: LuaChonThay, tonic: number, thu: boolean): string[] {
  const { n, h } = nguCanh(tonic, thu)
  const truoc = vong[(i - 1 + vong.length) % vong.length]!
  const sau = vong[(i + 1) % vong.length]!
  const dau = lc.thay[0]!
  const cuoi = lc.thay[lc.thay.length - 1]!
  const bass = (x: Hop) => x.bass ?? x.goc
  const ten = (p: number) => n(pc(p - tonic))
  const ra: string[] = []
  const duong = [truoc, ...lc.thay, sau].map((x) => n(bass(x)))
  const buoc = [truoc, ...lc.thay, sau].slice(1).map((x, k) => buocBass(bass([truoc, ...lc.thay, sau][k]!), bass(x)))
  ra.push(`Bass: ${duong.join(' → ')} (${buoc.join(', ')}).`)
  const pT = new Set(pcsHop(tonic, truoc))
  const pS = new Set(pcsHop(tonic, sau))
  const chungTruoc = pcsHop(tonic, dau).filter((p) => pT.has(p))
  const chungSau = pcsHop(tonic, cuoi).filter((p) => pS.has(p))
  ra.push(
    `Chung nốt với ${h(truoc.goc, truoc.chat, truoc.bass)}: ${chungTruoc.length ? chungTruoc.map(ten).join(', ') : 'không'}; với ${h(sau.goc, sau.chat, sau.bass)}: ${chungSau.length ? chungSau.map(ten).join(', ') : 'không'}.`,
  )
  const dan = pcsHop(tonic, cuoi).filter((p) => !pS.has(p) && pS.has(pc(p + 1)))
  if (dan.length) ra.push(`Nốt dẫn nửa cung lên hợp âm sau: ${dan.map((p) => `${ten(p)} → ${ten(p + 1)}`).join(', ')}.`)
  const gam = thu ? GAM_THU : GAM_TRUONG
  const ngoai = [...new Set(lc.thay.flatMap((x) => pcsHop(tonic, x)))].filter((p) => !gam.includes(pc(p - tonic)))
  ra.push(ngoai.length ? `Nốt ngoài gam: ${ngoai.map(ten).join(', ')} — chỗ ấy đổi màu so với giọng.` : 'Mọi nốt đều trong gam — đổi màu mà không ra ngoài giọng.')
  return ra
}

/** Lời "khi nào nên chọn" của một lựa chọn: màu thì lấy `KHI_CHON` của công thức, còn lại lời của loại. */
export const loiChon = (lc: LuaChonThay) => (lc.ct ? KHI_CHON[lc.ct.id] ?? LOAI.mau.nghe : LOAI[lc.loai].nghe)

/** Vòng lý thuyết có sẵn (`PROGRESSION_TEMPLATES`) dưới dạng gốc + chất, tính từ chủ âm. */
export function vongLyThuyetHop(tonic: number, thu: boolean): { id: string; ten: string; ghiChu: string; hop: Hop[] }[] {
  return PROGRESSION_TEMPLATES.filter((t) => t.scale === (thu ? 'minor' : 'major')).map((t) => ({
    id: t.id,
    ten: t.name,
    ghiChu: t.note ?? '',
    hop: buildProgression(t, tonic, { accidentalStyle: kieuDau(tonic, thu) }).map((c) => ({ goc: pc(c.root - tonic), chat: c.quality.symbol })),
  }))
}

/** Đọc vòng tự điền ("C Am F G", "Dm7 G7 Cmaj7") → gốc + chất tính từ chủ âm; null nếu có hợp âm không đọc được. */
export function docVong(chu: string, tonic: number): Hop[] | null {
  const ds = chu.split(/[\s,|–-]+/).filter(Boolean)
  if (!ds.length) return null
  const ra: Hop[] = []
  for (const t of ds) {
    const doc = parseChordToken(t.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/^[a-g]/, (c) => c.toUpperCase()))
    if (typeof doc === 'string') return null
    ra.push(doc.bass === undefined ? { goc: pc(doc.root - tonic), chat: doc.quality.symbol } : { goc: pc(doc.root - tonic), chat: doc.quality.symbol, bass: pc(doc.bass - tonic) })
  }
  return ra
}
