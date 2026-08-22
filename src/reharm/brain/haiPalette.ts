import { brain } from './index'
import type { KnowledgeItem } from './index'
import type { ColorPalette } from '../reharmEngine/staticVoicingRules'

/**
 * Gu màu hợp âm của **thầy Hải**, đọc ra từ kho PianoBrain.
 *
 * Đây là bảng màu *thêm vào*, đứng cạnh bảng của anh Khá chứ không thay nó:
 * `PALETTE_BY_TONIC_COLOR` giữ nguyên, mặc định của app vẫn là add2 lối Khá.
 * Người dùng bấm nút mới thì mới đổi sang gu Hải.
 *
 * Bảng này **không phải tôi nghĩ ra**. Nó đếm hợp âm thật trong 740 item đã
 * rút từ 70 bài giảng của thầy, chỉ lấy phần `origin: "extracted"`. Đếm ở giọng
 * Đô vì gần hết ví dụ của thầy nằm ở giọng đó. Kho không có thì trả `null`, và
 * giao diện giấu nút đi — thà thiếu còn hơn bịa một gu không ai dạy.
 *
 * Đếm được (tháng 8/2026): chủ âm maj7 nhiều nhất, rồi add2; các bậc thứ chủ
 * yếu m7; bậc năm chủ yếu bảy thường, sus4 có dùng nhưng ít hơn hẳn. Ra bảng
 * maj7 / m7 / 7, không treo bậc năm mặc định.
 */

/** Bậc cần đo, và bộ màu ứng với ký hiệu hay gặp nhất ở bậc đó. */
const DEGREES = {
  tonic: /\bC((?:maj|add|sus|m|dim|aug|[0-9#b+-])*)(?=["\s,.;:)\]}>/-]|$)/g,
  minor: /\b(?:Dm|Em|Am)((?:maj|add|sus|dim|[0-9#b+-])*)(?=["\s,.;:)\]}>/-]|$)/g,
  dominant: /\bG((?:maj|add|sus|m|dim|aug|[0-9#b+-])*)(?=["\s,.;:)\]}>/-]|$)/g,
}

/*
  Bỏ ký hiệu chỉ cao độ chứ không phải màu: "C4" là nốt Đô quãng tám 4, "G3" là
  quãng tám chứ không phải hợp âm. Nhưng "Dm7", "G7" thì số lại chính là màu,
  nên không thể vứt hết chữ số. Cắt theo con số: quãng tám trong kho này chạy
  1-5 (và 8 khi nhắc quãng tám cao), còn màu hợp âm thì luôn là 6, 7 hoặc 9.
*/
const isPitchNumber = (quality: string) => /^[0-58]$/.test(quality)

function tally(text: string, re: RegExp): Map<string, number> {
  const counts = new Map<string, number>()
  re.lastIndex = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const quality = m[1] ?? ''
    if (quality === '' || isPitchNumber(quality)) continue
    counts.set(quality, (counts.get(quality) ?? 0) + 1)
  }
  return counts
}

const top = (counts: Map<string, number>): string =>
  [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

/** Ký hiệu thầy viết -> màu app hiểu. Chỉ nhận cái nào chắc, còn lại bỏ qua. */
const MAJOR: Record<string, ColorPalette['major']> = {
  maj7: 'maj7',
  maj79: 'maj9',
  maj9: 'maj9',
  add9: 'add9',
  add2: 'add9',
  '69': '69',
  '6': '6',
}
const MINOR: Record<string, ColorPalette['minor']> = {
  '7': 'm7',
  '9': 'm9',
  '79': 'm9',
  '11': 'm11',
  '6': 'm6',
}
const DOMINANT: Record<string, ColorPalette['dominant']> = {
  '7': '7',
  '9': '9',
  '13': '13',
  sus4: '9sus4',
  '7sus4': '9sus4',
}

export function deriveHaiPalette(items: readonly KnowledgeItem[]): ColorPalette | null {
  const hai = items.filter(
    (i) => i.origin === 'extracted' && i.source?.teacher_id === 'hai-joseph',
  )
  if (hai.length < 50) return null

  /*
    Chỉ đọc phần chữ người viết: tên, ghi chú, đầu vào và đầu ra. Bỏ `id` vì id
    có dạng `tap-03-bai-09-...`, đầy chữ số, đếm vào thì nhiễu.
  */
  const text = hai
    .map((i) => [i.name, i.note_vi, JSON.stringify(i.input), JSON.stringify(i.output)].join(' '))
    .join(' ')
  const major = MAJOR[top(tally(text, DEGREES.tonic))]
  const minor = MINOR[top(tally(text, DEGREES.minor))]
  const dominantCounts = tally(text, DEGREES.dominant)
  const dominant = DOMINANT[top(dominantCounts)]
  if (!major || !minor || !dominant) return null

  return {
    major,
    minor,
    dominant,
    /*
      Thầy có dùng Gsus4 nhiều, nhưng G7 thường vẫn nhiều hơn, nên treo bậc năm
      là *một nước đi* chứ không phải mặc định của thầy. Chỉ bật khi đếm được
      sus4 vượt hẳn bảy thường; bật bừa là ép cả bài mất nốt bậc ba dẫn về chủ.
    */
    susDominant: (dominantCounts.get('sus4') ?? 0) > (dominantCounts.get('7') ?? 0),
    styleName: 'Gu thầy Hải',
  }
}

let cached: ColorPalette | null | undefined

/** Bảng màu thầy Hải, hoặc `null` nếu kho chưa nạp được. Tính một lần. */
export function haiPalette(): ColorPalette | null {
  if (cached === undefined) cached = deriveHaiPalette(brain().items)
  return cached
}
