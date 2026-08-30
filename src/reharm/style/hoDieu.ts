import { ALL_STYLES, getStyle } from './styleLibrary'
import type { StylePattern } from './types'

/**
 * HỌ ĐIỆU — một họ chứa nhiều KIỂU ĐỆM, và các kiểu ấy dùng lẫn nhau được.
 *
 * Người dùng đặt lại cách mô hình hoá: Bolero của Tuấn Lưu và Bolero của Linh
 * Nhi là **cùng một họ**, không phải hai điệu khác nhau. Áp dụng cho mọi họ.
 *
 * Vì sao cần tầng này: trong thư viện, "họ" (`family`) đang ở mức cái KIỂU chứ
 * không phải mức cái HỌ. Bolero nằm rải ở bốn `family` — `bolero`, `bolero-tu-n`,
 * `bolero-linh-nhi`, `bolero-linh-nhi-2`; Slow Rock ở ba; Ballad ở bốn. Nên bảng
 * này gom chúng lại, và gom bằng cách CỘNG THÊM chứ không sửa 102 bản ghi điệu —
 * mọi thứ đang chạy vẫn chạy nguyên.
 *
 * ## Luật chọn kiểu, do người dùng đặt
 *
 * - Chọn một họ cho bài thì **hỏi kiểu nào cho phần hát**, và kiểu ấy chơi
 *   xuyên suốt phần hát.
 * - **Điệp khúc** có lựa chọn đổi sang kiểu khác *trong cùng họ*. Không chọn
 *   thì theo phiên khúc.
 * - **Câu solo** (dạo đầu, giang tấu, kết bài) người dùng chọn được; không chọn
 *   thì app tự chọn — xem `soloUuTien`.
 *
 * ## Chỗ này KHÔNG mâu thuẫn với luật cũ
 *
 * Luật cũ: đoạn không lời phải chơi đúng điệu đã chọn, không được thay bằng
 * điệu khác. Nó ra đời từ một lỗi thật — chọn slow rock mà giang tấu lại đổi
 * tay trái sang câu rải ballad.
 *
 * Luật ấy cấm app **tự ý đổi HỌ sau lưng người dùng**. Chọn giữa các KIỂU
 * trong chính họ người dùng đã chọn là phối khí, không phải đánh tráo. Mọi phép
 * chọn tự động ở đây đều bị chặn trong phạm vi một họ.
 */
export interface HoDieu {
  /** Tên bày trên giao diện. */
  ten: string
  /** Những `family` trong thư viện thuộc về họ này. */
  families: readonly string[]
  /**
   * Kiểu nên dùng cho câu solo khi người dùng không chọn.
   *
   * Bỏ trống thì câu solo dùng luôn kiểu của phần hát — giữ nguyên hành vi cũ.
   */
  soloUuTien?: string
}

export const HO_DIEU: Readonly<Record<string, HoDieu>> = {
  bolero: {
    ten: 'Bolero',
    families: ['bolero', 'bolero-tu-n', 'bolero-linh-nhi', 'bolero-linh-nhi-2'],
    /*
      Bolero rải của Linh Nhi được ưu tiên cho câu solo, theo yêu cầu người dùng.

      Số đo đứng về phía lựa chọn ấy: trên bản ký âm gốc, ở đoạn giang tấu tay
      phải vọt từ 6,8 lên 9,3 nốt mỗi ô còn tay trái GIỮ NGUYÊN 8,0 — mẫu rải
      chín cú gõ này chịu được một tay phải dày mà không phải rút bớt. Lối
      Pùng-Pắp của Tuấn Lưu chỉ có hai cú bass mỗi ô, mỏng hơn hẳn ở chỗ ấy.
    */
    soloUuTien: 'bolero-linh-nhi-2',
  },
  'slow-rock': {
    ten: 'Slow Rock',
    families: ['slow-rock', 'slow-rock-duc-thinh', 'hai-slow-rock'],
  },
  ballad: {
    ten: 'Ballad',
    families: ['pop', 'hai-pop-ballad', 'hai-pop-ballad-free', 'hai-ballad-dan-ca'],
  },
  bossa: {
    ten: 'Bossa Nova',
    families: ['bossa', 'bossa-clave', 'hai-bossa-nova'],
  },
  rumba: {
    ten: 'Rumba',
    families: ['hai-rumba', 'cinquillo', 'habanera'],
  },
  swing: {
    ten: 'Swing',
    families: ['swing', 'hai-swing'],
  },
  waltz: {
    ten: 'Waltz',
    families: ['hai-waltz', 'jazz-waltz'],
  },
  tango: {
    ten: 'Tango',
    families: ['tango', 'tango-tu-n', 'hai-tango'],
  },
}

/** `family` nào thuộc họ nào — dựng ngược một lần từ bảng trên. */
const HO_CUA_FAMILY: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(HO_DIEU).flatMap(([ho, mo]) => mo.families.map((f) => [f, ho])),
)

/** Điệu này thuộc họ nào. Điệu chưa gom vào họ nào thì trả `null`. */
export function hoCuaDieu(styleId: string): string | null {
  const family = getStyle(styleId)?.family
  return family ? (HO_CUA_FAMILY[family] ?? null) : null
}

/**
 * Những KIỂU chọn được trong một họ.
 *
 * Bỏ bản điệp khúc ra khỏi danh sách: nó không phải một kiểu riêng để chọn, nó
 * là mặt cao trào của chính kiểu đứng cạnh. Bày cả hai lên bảng chọn thì người
 * dùng phải đoán "vòm cao" khác "vòm thấp" chỗ nào, trong khi phép đổi giữa
 * chúng đã tự chạy theo đoạn.
 */
export function kieuTrongHo(hoId: string): StylePattern[] {
  const mo = HO_DIEU[hoId]
  if (!mo) return []
  return ALL_STYLES.filter(
    (style) => mo.families.includes(style.family) && !style.id.endsWith('-chorus'),
  )
}

/**
 * Kiểu dùng cho CÂU SOLO — dạo đầu, giang tấu, kết bài.
 *
 * Người dùng chọn thì theo họ. Không chọn thì lấy `soloUuTien` của họ, và họ
 * không khai thì dùng luôn kiểu của phần hát.
 *
 * Chỉ nhận lựa chọn nằm TRONG CÙNG HỌ với phần hát. Đây là chỗ luật cũ được
 * giữ: app không bao giờ tự bước ra khỏi họ người dùng đã chọn.
 */
export function kieuChoSolo(kieuHat: string, chon?: string | null): string {
  const ho = hoCuaDieu(kieuHat)
  if (chon && hoCuaDieu(chon) === ho && ho !== null) return chon
  const uu = ho ? HO_DIEU[ho]?.soloUuTien : undefined
  return uu && getStyle(uu) ? uu : kieuHat
}

/**
 * Kiểu dùng cho ĐIỆP KHÚC.
 *
 * Không chọn thì theo phiên khúc — và lúc ấy `resolveStyleForSection` vẫn tự
 * đổi sang bản cao trào của chính kiểu ấy nếu có, như trước.
 */
export function kieuChoDiepKhuc(kieuHat: string, chon?: string | null): string {
  const ho = hoCuaDieu(kieuHat)
  if (chon && ho !== null && hoCuaDieu(chon) === ho) return chon
  return kieuHat
}
