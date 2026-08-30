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
    families: ['bossa', 'bossa-clave', 'hai-bossa-nova', 'bossa-ca-phao'],
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

/**
 * Họ nào KHÔNG cho tỉa tay trái ở đoạn không lời.
 *
 * Mặc định `interlockHands` rút bớt cú gõ tay trái khi tay phải chạy dày, để
 * hai bè khỏi đục dải tần. Đo trên bản ký âm Linh Nhi thì người soạn KHÔNG làm
 * thế: ở giang tấu tay phải vọt từ 6,8 lên 9,3 nốt mỗi ô — dày nhất bài — còn
 * tay trái giữ nguyên 8,0, tầm y hệt 33-62.
 *
 * RANH GIỚI PHẢI SẮC. Người dùng từng bác lối "tay trái đảm nhiệm toàn bộ
 * pattern điệu đệm trong lúc solo"; cái bị bác là tay trái gánh CẢ PHẦN TAY
 * PHẢI của mẫu đệm. Cờ này chỉ nói: đừng tỉa phần của CHÍNH tay trái.
 *
 * Cỡ mẫu: MỘT bài, một người soạn, một đoạn mười ô. Chỉ mở cho họ bolero, và
 * chỉ vì có số đo. Họ khác chưa đo thì chưa mở.
 */
const KHONG_TIA: readonly string[] = ['bolero']

/** Điệu này có thuộc họ được giữ nguyên tay trái ở đoạn không lời không. */
export function khongTiaTayTrai(styleId: string): boolean {
  const ho = hoCuaDieu(styleId)
  return ho !== null && KHONG_TIA.includes(ho)
}

/**
 * Họ nào dùng lối RẢI MỞ RỘNG cho tay phải ở đoạn GIANG TẤU.
 *
 * Đo trên mười ô giang tấu bản ký âm Linh Nhi: 57% bước nhảy xa, móc kép giảm
 * từ 30% xuống 6%, 36% cú gõ chồng từ hai nốt, tầm lên tới 95. Giang tấu của
 * người soạn này KHÔNG phải chạy ngón nhanh — nó là rải hợp âm mở rộng.
 *
 * CHỈ giang tấu. Dạo đầu và kết bài chưa đo nên chưa mở, và cỡ mẫu vẫn là một
 * bài của một người soạn.
 */
const RAI_MO_RONG: readonly string[] = ['bolero']

/** Đoạn giang tấu của điệu này có dùng lối rải mở rộng không. */
export function raiMoRongOGiangTau(styleId: string): boolean {
  const ho = hoCuaDieu(styleId)
  return ho !== null && RAI_MO_RONG.includes(ho)
}

/**
 * Họ nào dựng tay phải giang tấu BÁM VÀO TAY TRÁI, thay vì sinh độc lập.
 *
 * Đo mười ô giang tấu bản ký âm Linh Nhi: 55% mốc gõ có cả hai tay, và trong
 * những mốc chung ấy 47% tay phải chơi lại chính lớp cao độ tay trái đang giữ.
 * Hai tay khoá nhau ở nhịp và lớp cao độ; đường nét thì tự do (52/48 cùng
 * hướng, tức gần như ngẫu nhiên).
 *
 * Họ nào bật cờ này thì đường giang tấu KHÔNG chạy qua `interlockHands` nữa —
 * luật ấy dựng theo Cà Pháo, nơi tay phải cài vào KHE của tay trái. Linh Nhi
 * làm ngược. Trộn hai phong cách là hỏng cả hai. Xem `raiLinhNhi.ts`.
 *
 * ## Vì sao BOSSA cũng bật, dù số đo bolero không nói gì về bossa
 *
 * Có một vòng đo dẫn tới câu "không" cho bossa: hai bản ký âm bossa của Cà
 * Pháo cho thấy vào giang tấu hai tay RỜI RA (40% xuống 39% và 30%), ngược hẳn
 * Linh Nhi (45% lên 55%). Nhưng người dùng nghe điệu dựng từ chính hai bản ký
 * âm ấy rồi bác: "nghe không ra chất bossa nova". Bằng chứng dùng để nói
 * "không" vì thế đáng ngờ đúng bằng cái điệu dựng ra từ nó, nên nó không còn
 * đứng vững làm lý do cấm.
 *
 * Số đo còn lại, và nó nói cơ chế KHÔNG GÃY trên tay trái bossa:
 *
 *   bolero-linh-nhi-2   trái 9,0 nốt/ô   mốc chung 44%   bắt chéo 0   phách 1 100%
 *   bossa-nova-1 / -2   trái 4,0 nốt/ô   mốc chung 32%   bắt chéo 0   phách 1 100%
 *   hai-bossa-nova      trái 4,0 nốt/ô   mốc chung 32%   bắt chéo 0   phách 1 100%
 *
 * Độ khoá LỎNG HƠN, và lỏng đúng theo tỉ lệ tay trái thưa hơn — bộ này suy tay
 * phải từ mốc gõ tay trái, nên ít mốc thì ít chỗ để khoá. Đó là hệ quả tính
 * được, không phải hỏng: luật cứng "không bao giờ bắt chéo" và luật "phách 1
 * luôn có nốt" vẫn giữ nguyên trên cả ba điệu.
 *
 * Tay trái vẫn chơi ĐÚNG mẫu bossa; chỉ cách dựng tay phải đổi. Không phải
 * tráo họ điệu.
 */
const RAI_THEO_TAY_TRAI: readonly string[] = ['bolero', 'bossa']

/**
 * Điệu nào chơi CÂU SOLO TỰ DO kiểu Cà Pháo.
 *
 * Người dùng đọc hai bản ký âm rồi kết luận: ở đoạn solo, người soạn này bỏ
 * hẳn mẫu đệm bossa, biến hoá tay phải và chơi tự do trên NỀN NHỊP của bài.
 * Số đo đứng về phía từng ý một — xem `caPhaoSolo.ts`.
 *
 * Cờ này đứng TRƯỚC `raiTheoTayTrai`: với riêng điệu của Cà Pháo, kho có số đo
 * trực tiếp về việc anh solo thế nào, và nó KHÔNG phải lối bám tay trái của
 * Linh Nhi (mốc gõ chung ở giang tấu tụt còn 30-39%, tức hai tay rời ra). Các
 * điệu bossa khác vẫn giữ lối bám tay trái như người dùng đã yêu cầu.
 */
const SOLO_TU_DO: readonly string[] = ['bossa-ca-phao']

/**
 * HỌ nào cũng chơi lối tự do ấy — mở theo SỐ ĐO, không theo cảm tính.
 *
 * Đo giang tấu cả bảy bản ký âm của Cà Pháo, đếm câu chạy ngón:
 *
 * | bài | thể loại | câu chạy | tay phải | mốc gõ chung |
 * |-----|----------|----------|----------|--------------|
 * | Hồng Kông 1 | bossa | 8 | 12,5/ô | 39% |
 * | Bèo dạt mây trôi | **ballad** | **4** | 10,5/ô | 20% |
 * | Yêu xa | **ballad** | **2** | 9,4/ô | 28% |
 * | Người hãy quên em đi | bossa | 1 | 14,6/ô | 30% |
 * | Kém duyên | ballad | 0 | 14,9/ô | 54% |
 * | Mơ | slow rock | 0 | 9,5/ô | 33% |
 *
 * **Ballad được mở** vì lối này đo được ở hai trên bốn bài ballad, và ở *Bèo
 * dạt mây trôi* nó còn ngoa hơn bossa: một câu 48 nốt trải 6 phách ở đoạn dạo,
 * giang tấu có câu 27 nốt, trường độ xuống tới chùm năm và chùm sáu.
 *
 * **Slow rock KHÔNG mở.** *Mơ* là bài slow rock duy nhất trong kho và nó có 0
 * câu chạy. Một bài thì chưa đủ để kết luận về cả họ, nhưng nó đủ để KHÔNG mở:
 * bằng chứng duy nhất đang nói ngược.
 *
 * Ghi lại một ca ngược sáng để đừng ai tưởng "không có câu chạy" là "solo
 * nhạt": *Kém duyên* không câu chạy nào nhưng tay phải DÀY NHẤT cả kho (14,9
 * nốt/ô) và mốc gõ chung 54% — gấp đôi mấy bài kia. Bài ấy solo bằng cách hai
 * tay khoá chặt vào nhau, gần lối Linh Nhi hơn lối tự do.
 */
const SOLO_TU_DO_HO: readonly string[] = ['ballad', 'slow-rock']

/**
 * Họ nào NGHIÊNG về thủ pháp nào trong lối solo tự do.
 *
 * Đo giang tấu sáu bài, tỉ lệ mốc gõ là nốt nhanh và số chùm nốt:
 *
 * | bài | thể loại | thủ pháp |
 * |-----|----------|----------|
 * | Bèo dạt mây trôi | ballad | chạy — 58% nhanh, 122 mốc đơn |
 * | Yêu xa | ballad | trộn — 42% |
 * | Kém duyên | ballad | chùm — 0% nhanh, 35 chùm ba |
 * | Hồng Kông 1 | bossa | chạy |
 * | Người hãy quên em đi | bossa | chùm |
 * | **Mơ** | **slow rock** | **chùm — 9% nhanh, 6 chùm ba + 28 đôi** |
 *
 * Chỗ nghiêng là chuyện của TỪNG BÀI chứ không của thể loại — họ ballad chứa
 * cả hai cực, họ bossa cũng vậy. Nên hai họ ấy để TRỘN.
 *
 * Slow rock thì khác, và đây là chỗ tôi đổi kết luận cũ. Lượt trước tôi nói
 * KHÔNG mở cho slow rock vì *Mơ* có 0 câu chạy. Đếm kỹ hơn thì "0 câu chạy"
 * không có nghĩa là "không ứng tấu": *Mơ* ứng tấu bằng CHÙM NỐT — 6 chùm ba và
 * 28 chùm đôi trong giang tấu. Thủ pháp ấy đã nằm sẵn trong bộ. Nên mở, và
 * nghiêng hẳn về chùm — bằng chứng duy nhất của họ này chỉ nói một chiều.
 */
const THIEN_VE: Readonly<Record<string, 'chay' | 'chum'>> = {
  'slow-rock': 'chum',
}

/** Họ của điệu này nghiêng về thủ pháp nào; `undefined` là trộn. */
export function thienVeCuaHo(styleId: string): 'chay' | 'chum' | undefined {
  const ho = hoCuaDieu(styleId)
  return ho !== null ? THIEN_VE[ho] : undefined
}

/** Điệu này có chơi câu solo tự do kiểu Cà Pháo không. */
export function soloTuDoCaPhao(styleId: string): boolean {
  const family = getStyle(styleId)?.family
  if (family !== undefined && SOLO_TU_DO.includes(family)) return true
  const ho = hoCuaDieu(styleId)
  return ho !== null && SOLO_TU_DO_HO.includes(ho)
}

/** Giang tấu của điệu này có dựng tay phải bám vào tay trái không. */
export function raiTheoTayTrai(styleId: string): boolean {
  /*
    MỘT ĐIỆU CHỈ THEO MỘT THẦY. Điệu nào đã có lối solo riêng của thầy nó thì
    không đồng thời mang lối của thầy khác.

    Người dùng đặt luật: mỗi lần học phong cách của ai thì phải tách hết khỏi
    các thầy khác, và chỉ hoà hai phong cách khi họ yêu cầu đích danh.

    Chặn ở ĐÂY chứ không ở từng chỗ gọi. Điệu bossa của Cà Pháo nằm trong họ
    bossa, mà cả họ ấy đã bật lối bám tay trái của Linh Nhi — nên cờ này vẫn
    trả `true` cho nó. Hiện mọi chỗ gọi đều kiểm `soloTuDoCaPhao` trước nên
    chưa lộ, nhưng đó là dựa vào THỨ TỰ, và đoạn code mới nào quên thứ tự ấy sẽ
    lặng lẽ dán luật Linh Nhi lên câu solo của Cà Pháo.
  */
  if (soloTuDoCaPhao(styleId)) return false
  const ho = hoCuaDieu(styleId)
  return ho !== null && RAI_THEO_TAY_TRAI.includes(ho)
}
