import type { StylePattern } from '../types'
import { ONEMOTION_STYLES, styleFamilies } from './onemotion'
import { HAI_STYLES } from './haiStyles'
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

/**
 * Thư viện điệu: OneMotion Styles + Basic (rải) + Arp + điệu video.
 *
 * Đệm không còn theo pattern Khá Bự. Phong cách anh Khá chỉ còn ở
 * ngắt nghỉ / fill / hợp âm lướt.
 */

/**
 * Bolero / Rumba trích từ video Tuấn Lưu Piano (Improv_Bai_04).
 * Bass trái phách 1 (Root) và 3 (Fifth); tay phải dập hợp âm đảo phách
 * 1-and / 2 / 3-and / 4-and — đếm 7 điểm Pùng-Pắp.
 */
const BOLERO_STYLES: StylePattern[] = [
  {
    id: 'bolero-1',
    name: 'Bolero 1',
    family: 'bolero',
    familyName: 'Bolero',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 85,
    feel: 'syncopated-3-3-2',
    verified: true,
    sourceVideos: ['CÁCH ĐỆM HÁT BOLERO TRÊN ĐÀN PIANO (RUMBA) — Tuấn Lưu Piano'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 1, velocityScale: 1 },
        { beat: 2, durationBeats: 1, velocityScale: 0.9 },
      ],
      right: [
        { beat: 0.5, durationBeats: 0.5, velocityScale: 0.7 },
        { beat: 1, durationBeats: 0.5, velocityScale: 0.7 },
        { beat: 2.5, durationBeats: 0.5, velocityScale: 0.7 },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7 },
      ],
    },
    note: 'Bolero/Rumba Tuấn Lưu: bass trái phách 1 (Root) & 3 (Fifth), tay phải dập hợp âm đảo phách 1-and/2/3-and/4-and.',
  },

  /*
    Bolero / Rumba TRỮ TÌNH — kết cấu rải, đứng CẠNH bolero-1 chứ không thay.

    `bolero-1` là lối Pùng-Pắp của Tuấn Lưu: tay trái hai cú bass, tay phải dập
    hợp âm đảo phách. Hai điệu này khác nhau về loài, không phải hai biến thể
    của một thứ — nên thêm vào, không sửa đè.

    Đặc tả đọc từ video *Đừng Xa Em Đêm Nay — Linh Nhi Piano Solo* (Gemini,
    lần 2). Bản độc tấu: tay phải giữ giai điệu, ô nhịp không có tay phải.

    Verse: 1 (đen) · 5 (đen) · 8+10 giữ hai phách. Gemini gọi đó là mẫu chủ đạo
    ("bấm giữ phách 3-4"). Ô hai hợp âm chơi đúng nửa đầu — 1 rồi 5 — nhờ
    `isSplitAwareStyle`. Bậc 9 là nốt màu từng ô, không nhét vào cell.

    CHƯA ĐỐI CHIẾU BẰNG TAI.
  */
  {
    id: 'bolero-linh-nhi',
    name: 'Bolero trữ tình — rải 1-5-8+10',
    family: 'bolero-linh-nhi',
    familyName: 'Bolero trữ tình',
    variant: 1,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 72,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['uAWjGj9bHyE @ 00:23-01:03 — Đừng Xa Em Đêm Nay, Linh Nhi Piano Solo'],
    cell: {
      lengthBeats: 4,
      left: [
        { beat: 0, durationBeats: 1, velocityScale: 1, tones: [{ toneIndex: 0, fromRoot: true }] },
        { beat: 1, durationBeats: 1, velocityScale: 0.65, tones: [{ toneIndex: 2, fromRoot: true }] },
        {
          beat: 2,
          durationBeats: 2,
          velocityScale: 0.75,
          tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 2,
          durationBeats: 2,
          velocityScale: 0.75,
          tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }],
        },
      ],
      right: [],
    },
    note: 'Bolero trữ tình (Linh Nhi): tay trái 1-5 rồi 8+10 giữ phách 3-4. Bản độc tấu, không dập hợp âm tay phải.',
    /*
      Nới trần tay trái, đúng cửa mà `patternRenderer` mở cho thế 1-5-8-10.

      Trần chung của app là Son quãng tám 3 (55). Thế này vượt qua: bậc 10 cách
      nốt gốc 15 nửa cung, bậc 5 nâng quãng tám cách 19. Không khai thì
      `clampToHandRegister` kéo tụt xuống — đo ra bậc 5 ở phách 4 rơi về đúng
      chỗ bậc 5 ở phách 2, tức phách 4 mất hẳn đường đi lên. 64 là con số mẫu
      Slow Rock 1 của thầy Đức Thịnh đang dùng cho cùng thế bấm ấy.
    */
    leftHandTop: 64,
  },

  /*
    Cao trào — điệp khúc VÀ giang tấu. Gemini lần 2: tám móc đơn một ô, sóng
    1-5-8-10-12-10-8-5, quãng tám bass chỉ phách 1. Nốt 9/11 trong video là
    nốt lót theo hợp âm, cell giữ nốt hợp âm cho mọi giọng.

    Ô hai hợp âm: nửa đầu đúng 1-5-8-10, nhờ `isSplitAwareStyle`.
  */
  {
    id: 'bolero-linh-nhi-chorus',
    name: 'Bolero trữ tình — cao trào (arpeggio 8 nốt)',
    family: 'bolero-linh-nhi',
    familyName: 'Bolero trữ tình',
    variant: 2,
    timeSignature: '4/4',
    beatsPerMeasure: 4,
    bpm: 72,
    feel: 'straight-block-chord',
    verified: true,
    sourceVideos: ['uAWjGj9bHyE @ 02:02-02:24 — Đừng Xa Em Đêm Nay, Linh Nhi Piano Solo'],
    cell: {
      lengthBeats: 4,
      left: [
        {
          beat: 0,
          durationBeats: 0.5,
          velocityScale: 1,
          tones: [
            { toneIndex: 0, fromRoot: true },
            { toneIndex: 0, fromRoot: true, semitones: 12 },
          ],
        },
        { beat: 0.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true }] },
        {
          beat: 1,
          durationBeats: 0.5,
          velocityScale: 0.75,
          tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 1.5,
          durationBeats: 0.5,
          velocityScale: 0.8,
          tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 2,
          durationBeats: 0.5,
          velocityScale: 0.85,
          tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 2.5,
          durationBeats: 0.5,
          velocityScale: 0.8,
          tones: [{ toneIndex: 1, fromRoot: true, semitones: 12 }],
        },
        {
          beat: 3,
          durationBeats: 0.5,
          velocityScale: 0.75,
          tones: [{ toneIndex: 0, fromRoot: true, semitones: 12 }],
        },
        { beat: 3.5, durationBeats: 0.5, velocityScale: 0.7, tones: [{ toneIndex: 2, fromRoot: true }] },
      ],
      right: [],
    },
    note: 'Bolero trữ tình cao trào (Linh Nhi): tám móc đơn 1-5-8-10-12-10-8-5, octave bass phách 1. Điệp khúc và giang tấu.',
    /*
      Trần 67 chứ không 64 như bản phiên khúc.

      Sóng cao trào lên tới bậc 12, cách nốt gốc 19 nửa cung. Nốt gốc đặt trong
      khoảng 36-47 tuỳ giọng, nên đỉnh sóng chạm 66 ở giọng Si. Để trần 64 thì
      đúng HAI giọng gãy — Si giáng cần 65, Si cần 66 — và chỗ gãy không phải
      một nốt sai lạc mà là đỉnh sóng gấp ngược xuống, nghe ra ngay.

      Phiên khúc giữ 64: đỉnh nó chỉ tới bậc 10, cao nhất là 62.

      67 chồng lên tầm giai điệu, và điều đó chấp nhận được ở đây: ô nhịp này
      không có phần tay phải, còn va chạm với câu solo thì `avoidMelodyClash` lo.
      Đo trên bản ký âm của Cà Pháo, trần tay trái đoạn giang tấu là 62-70.
    */
    leftHandTop: 67,
  },
]

/*
  Điệu của thầy Hải nối vào sau bộ OneMotion, không chen vào giữa: thứ tự này
  là thứ tự hiện trên bảng chọn, nên bộ cũ giữ nguyên chỗ đứng của nó.
*/
const TESTER_STYLES = testerStylesJson as StylePattern[]

export const VERIFIED_STYLES: readonly StylePattern[] = [
  ...ONEMOTION_STYLES,
  ...HAI_STYLES,
  ...BOLERO_STYLES,
  ...TESTER_STYLES,
]

export const UNVERIFIED_STYLES: readonly StylePattern[] = []

export const ALL_STYLES: readonly StylePattern[] = VERIFIED_STYLES

const ALIAS: Record<string, string> = {
  ballad: 'pop-1',
  'ballad-pre': 'pop-1',
  'ballad-chorus': 'pop-1',
  'bossa-nova': 'bossa-nova-1',
  valse: 'waltz-1',
  swing: 'swing-1',
  bolero: 'bolero-1',
  'slow-rock': 'slow-rock-2',
  'slow-rock-1': 'slow-rock-2',
  /*
    Hai điệu ballad của thầy Hải từng mang tên khác lúc mới thêm. Bài đã lưu
    trước đó còn giữ id cũ trong máy người dùng, nên phải trỏ tiếp.
  */
  'hai-pop-ballad-1': 'hai-pop-ballad',
  'hai-pop-ballad-3': 'hai-pop-ballad-chorus',
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
*/
function hidden(id: string): boolean {
  if (removedThisSession.has(id)) return true
  return deletedIds.has(id) && !TESTER_IDS.has(id)
}

export function getStyle(id: string): StylePattern | undefined {
  if (hidden(id)) return undefined
  return ALL_STYLES.find((style) => style.id === (ALIAS[id] ?? id))
}

export function getVisibleStyles(): readonly StylePattern[] {
  return ALL_STYLES.filter((style) => !hidden(style.id))
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

export function isPlayable(style: StylePattern): boolean {
  return style.verified && style.cell !== null
}

export const BALLAD = getStyle('pop-1')!
export const BOSSA_NOVA = getStyle('bossa-nova-1')!
export const VALSE = getStyle('waltz-1')!
export const SWING = getStyle('swing-1')!

const TESTER_IDS = new Set(TESTER_STYLES.map((style) => style.id))

export function isTesterStyle(id: string): boolean {
  return TESTER_IDS.has(id)
}

export { ONEMOTION_STYLES, styleFamilies }
