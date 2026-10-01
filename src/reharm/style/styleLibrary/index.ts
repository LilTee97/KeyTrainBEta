import type { StylePattern } from '../types'
import { TON_HUNG_STYLES } from './tonHungStyles'
import { CA_PHAO_BOSSA, CA_PHAO_BOSSA_IMPROVED } from './caPhaoBossa'
import { CP_BALLAD_CU_DI_STYLES, CP_BALLAD_DE_EM_STYLES, CP_BALLAD_SONG_STYLES } from './caPhaoBalladSongs'
import { LINH_NHI_SLOW_ROCK } from './linhNhiSlowRock'
import { BLUE_SUN, BLUE_SUN_CHORUS } from './bluesClaude'
import { TWIST } from './twist'
import testerStylesJson from './testerStyles.json'

const DELETED_KEY = 'keytrain-deleted-styles'

/*
  `localStorage` KHÔNG phải lúc nào cũng có.

  Đọc thẳng nó ở thân module thì file này ném lỗi ngay lúc **nạp** — không phải
  lúc gọi hàm. Bộ test chạy môi trường node, không có localStorage, nên 38 bộ
  test không nạp nổi file và tắt luôn, chứ không đỏ từng test một. Trình duyệt ẩn
  danh hoặc thiết lập chặn cookie cũng ném y như vậy.

  App phải chạy được kể cả khi không nhớ được gì: không đọc được thì coi như chưa
  xoá điệu nào, không ghi được thì lần sau mở lại hiện đủ điệu.
*/
function readDeleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

const deletedIds = new Set<string>(readDeleted())

function persistDeleted(): void {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds]))
  } catch {
    // Không nhớ được thì thôi; trong phiên này vẫn xoá đúng.
  }
}

/** Bolero rải Linh Nhi — khuôn ngầm, xem `INTERNAL_STYLES`. */
const LINH_NHI_RAI_STYLES: StylePattern[] = [
  /*
    BOLERO RAI, do tu BAN KY AM THAT — khong phai tu loi mo ta.

    Nguồn: bản piano do Linh Nhi soạn, người dùng đưa vào. 72 ô nhịp 4/4, và có
    sẵn 80 ký hiệu hợp âm. Đây là hạng cao nhất kho từng có: hai tay tách sẵn
    trên hai khuông, phách là số hữu tỉ chính xác, hoà âm cho trước chứ không
    phải suy ngược từ tay trái như bảy bản Cà Pháo.

    KHUÔN NGẦM từ 30/9/2026: người dùng xoá nút Bolero rải, nhưng khuôn này vẫn là
    nguồn nốt câu solo Linh Nhi (`LINH_NHI_RAI`) — Bolero Tuấn và nút thầy Linh Nhi
    mượn nó ở dạo / giang / kết. Không có nút, không chọn được.

    MẪU ĐO ĐƯỢC — chín cú gõ mỗi ô, chữ ký nằm ở CẶP MÓC KÉP phách 1&:

        phách 1     bậc 1    móc đơn
        phách 1&    bậc 5    móc kép  ┐  hai nốt này làm nên mẫu
        phách 1&½   bậc 8    móc kép  ┘
        phách 2     bậc 10   móc đơn

    Ba nốt đầu giống nhau ở mọi ô. Từ phách 2 rẽ làm HAI VÒM, và mỗi vòm giữ
    riêng thành một điệu:

        vòm THẤP  lên bậc 10 rồi về gốc         21 trên 70 ô
        vòm CAO   trèo tới bậc 15 rồi hạ dần    13 trên 70 ô

    Đếm chỗ gõ trên cả bài: phách 1 có ở 70/70 ô, phách 1& ở 69, cặp móc kép ở
    49, phách 2 ở 70; phần đuôi ô thưa dần còn 55-66 ô.

    Ô nhịp không có phần tay phải — bản độc tấu, tay phải giữ giai điệu.
  */
  {
    id: 'bolero-linh-nhi-2',
    name: 'Bolero rai — vom thap (1-5-8-10)',
    family: 'bolero-linh-nhi-2',
    familyName: 'Bolero rai (ban ky am)',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 69,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['bien-tinh-linh-nhi-piano.mxl — ban ky am piano do Linh Nhi soan'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 0.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 0.5, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 0.75, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.85, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.75, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true }] },
      ],
      right: [],
    },
    note: 'Bolero rai vom thap: 1-5-8-10 roi ve goc. Cap moc kep bac 5 va bac 8 o phach 1& la chu ky cua mau. Do tren 21/70 o cua ban ky am.',
    leftHandTop: 67,
    soloMaxStrikes: 9,
  },
  {
    id: 'bolero-linh-nhi-2-chorus',
    name: 'Bolero rai — vom cao (len bac 15)',
    family: 'bolero-linh-nhi-2',
    familyName: 'Bolero rai (ban ky am)',
    variant: 2,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 69,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['bien-tinh-linh-nhi-piano.mxl — ban ky am piano do Linh Nhi soan'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 0.5, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 0.5, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 2, fromRoot: true }] },
        { beat: 0.75, durationBeats: 0.25, velocityScale: 0.6, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.85, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 1.5, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
        { beat: 2, durationBeats: 0.5, velocityScale: 0.9, tones: [{ toneIndex: 0, fromRoot: true, semitones: 24 }] },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
        { beat: 3, durationBeats: 0.5, velocityScale: 0.8, tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }] },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }] },
      ],
      right: [],
    },
    note: 'Bolero rai vom cao: cung ba not dau voi vom thap, tu phach 2 treo len bac 15 roi ha dan. Do tren 13/70 o cua ban ky am.',
    leftHandTop: 74,
    soloMaxStrikes: 9,
  },
]

/** Bolero Tuấn và Tango Tuấn — xuất từ PatternTester. */
const TESTER_STYLES = testerStylesJson as StylePattern[]

/*
  ĐIỆU TRÊN BẢNG CHỌN — người dùng 30/9/2026 giữ đúng chín nút: Bossa CP cải tiến · Ballad Có em chờ ·
  Ballad Để em · Ballad Cứ đi · Twist · Bolero Tuấn · Tango Tuấn · Slow Rock Lá Thư 2 tay · Slow Blues.
  Mọi điệu khác (OneMotion, thầy Hải, Ballad CP sáu kiểu, ACDD, Ngày mai em đi, DERX, Bolero Linh Nhi,
  Slow Rock Lá thư một tay, Slow Rock LT, Đức Thịnh, Kim, bossa CP cũ) đã xoá hẳn cùng nút.
  Thứ tự giữ như cũ: bảng chọn xếp nút theo thứ tự này trong từng nhịp.
*/
const PICKER_STYLES: readonly StylePattern[] = [
  CA_PHAO_BOSSA_IMPROVED,
  ...CP_BALLAD_SONG_STYLES,
  ...CP_BALLAD_DE_EM_STYLES,
  ...CP_BALLAD_CU_DI_STYLES,
  ...LINH_NHI_SLOW_ROCK,
  BLUE_SUN,
  BLUE_SUN_CHORUS,
  TWIST,
  ...TESTER_STYLES,
]

/*
  KHUÔN NGẦM — không nút, không chọn được, bia mộ không chôn được; chỉ để điệu trên bảng mượn:
  - `bolero-linh-nhi-2` (+ vòm cao): nguồn nốt câu solo Linh Nhi (`LINH_NHI_RAI`).
  - Tôn Hùng (4 khuôn): nút thầy Tôn Hùng ở dạo / giang / kết.
  - `CA_PHAO_BOSSA` (bossa sheet ô 9–10): nút thầy Cà Pháo (`SOLO_THAY_NUT`), và là gốc của Bossa CP cải tiến.
*/
const INTERNAL_STYLES: readonly StylePattern[] = [...LINH_NHI_RAI_STYLES, ...TON_HUNG_STYLES, CA_PHAO_BOSSA]
const INTERNAL_IDS = new Set(INTERNAL_STYLES.map((style) => style.id))

export const ALL_STYLES: readonly StylePattern[] = [...PICKER_STYLES, ...INTERNAL_STYLES]

/**
 * Điệu mặc định — lần đầu mở app, và bài đã lưu mang điệu đã xoá (người dùng 30/9/2026: Ballad cứ đi).
 * Cũ: `pop-1` (Pop Ballad OneMotion, đã xoá).
 */
export const DEFAULT_STYLE: StylePattern = CP_BALLAD_CU_DI_STYLES[0]!

// Nhóm biên soạn từ sheet; màu nút không biểu thị đã được nghe duyệt.
const CODEX_STYLE_IDS = new Set([
  CA_PHAO_BOSSA_IMPROVED.id,
  ...CP_BALLAD_SONG_STYLES.map(style => style.id),
  TWIST.id,
])

export function isCodexStyle(id: string): boolean {
  return CODEX_STYLE_IDS.has(id)
}

/** Điệu tester vừa xoá trong phiên này — file đã bỏ nó, bộ nhớ thì chưa. */
const removedThisSession = new Set<string>()

/*
  Bia mộ trong `localStorage` chỉ có nghĩa với điệu **không xoá khỏi file được**
  — điệu dựng sẵn trong mã nguồn.

  Điệu tester thì xoá được thật: `/__kt/delete` gỡ nó khỏi `testerStyles.json`.
  Nên nếu id đó **vẫn còn trong file**, nghĩa là nó vừa được xuất lại — phải
  hiện lên. Giữ bia mộ ở đây làm điệu xuất lại **trùng tên cũ** biến mất vĩnh
  viễn: xuất bao nhiêu lần cũng không thấy, mà không có lấy một thông báo nào.

  Khuôn ngầm bỏ qua bia mộ: người dùng từng xoá nút Bolero rải và bossa Cà Pháo,
  mà hai khuôn ấy giờ là nguồn nốt câu solo.
*/
function hidden(id: string): boolean {
  if (INTERNAL_IDS.has(id)) return false
  if (removedThisSession.has(id)) return true
  return deletedIds.has(id) && !TESTER_IDS.has(id)
}

export function getStyle(id: string): StylePattern | undefined {
  if (hidden(id)) return undefined
  return ALL_STYLES.find((style) => style.id === id)
}

/** Điệu trên bảng chọn (kể cả bản điệp khúc) — không có khuôn ngầm. */
export function getVisibleStyles(): readonly StylePattern[] {
  return PICKER_STYLES.filter((style) => !hidden(style.id))
}

/** Id bài đã lưu còn chọn được thì giữ; điệu đã xoá hay khuôn ngầm thì về điệu mặc định. */
export function styleIdOrDefault(id: string): string {
  return getVisibleStyles().some((style) => style.id === id) ? id : DEFAULT_STYLE.id
}

/**
 * Điệu DỰNG SẴN đang bị bia mộ chôn — để giao diện còn có đường hiện lại.
 *
 * Bia mộ là vĩnh viễn và im lặng: xoá một điệu dựng sẵn rồi thì không có nút
 * nào, không có thông báo nào đưa nó về. Đã cắn thật — người dùng xoá điệu
 * bossa Cà Pháo, tôi dựng lại điệu ấy với ĐÚNG id cũ, và nó không bao giờ hiện
 * lên. Người dùng phải tự hỏi "sao chưa thấy" chứ app không nói gì.
 *
 * Chỉ tính điệu trên bảng chọn: id lạ trong `localStorage` — điệu đã xoá khỏi
 * mã, điệu tester đã gỡ khỏi file, hay điệu đổi tên — không phải thứ hiện lại được.
 */
export function hiddenBuiltIns(): StylePattern[] {
  return PICKER_STYLES.filter(
    (style) => !removedThisSession.has(style.id) && deletedIds.has(style.id) && !TESTER_IDS.has(style.id),
  )
}

/** Bỏ bia mộ cho những điệu dựng sẵn, hiện lại tất cả. */
export function restoreHiddenStyles(): void {
  for (const style of hiddenBuiltIns()) deletedIds.delete(style.id)
  persistDeleted()
}

export async function removeStyle(id: string): Promise<boolean> {
  if (TESTER_IDS.has(id)) {
    try {
      const res = await fetch('http://localhost:5174/__kt/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        // Đã gỡ khỏi file. Chỉ cần giấu nốt phiên này, không ghi nhớ.
        removedThisSession.add(id)
        return true
      }
    } catch {
      /* không nối được máy chủ tester — rơi xuống nhánh ghi nhớ */
    }
  }
  deletedIds.add(id)
  persistDeleted()
  return true
}

const TESTER_IDS = new Set(TESTER_STYLES.map((style) => style.id))

export function isTesterStyle(id: string): boolean {
  return TESTER_IDS.has(id)
}

/** Gom điệu theo `family`, giữ thứ tự xuất hiện — mỗi họ một nút trên bảng chọn. */
export function styleFamilies(
  styles: readonly StylePattern[],
): { family: string; familyName: string; styles: StylePattern[] }[] {
  const map = new Map<string, StylePattern[]>()
  for (const style of styles) {
    const list = map.get(style.family) ?? []
    list.push(style)
    map.set(style.family, list)
  }
  return [...map.entries()].map(([family, group]) => ({
    family,
    familyName: group[0].familyName,
    styles: group,
  }))
}
