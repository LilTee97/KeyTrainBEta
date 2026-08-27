import { getStyle } from './styleLibrary'

/**
 * Họ **ballad**: những điệu mà mấy thủ pháp đệm chậm mới có nghĩa.
 *
 * Walking bass 1-2-3-5, câu lót Kingsley và việc đổi mẫu đệm theo phiên khúc /
 * điệp khúc đều rút từ bài giảng về **đệm ballad**. Đem chúng sang swing, bossa
 * hay tango là dùng sai chỗ: swing có tuyến walking riêng đi nốt đen liền bậc
 * kèm nốt chromatic, bossa có tay trái luân phiên gốc - quãng 5, tango thì giật
 * staccato cả hai tay. Bày mấy công tắc kia ra ở đó chỉ khiến người học tưởng
 * chúng dùng được ở mọi điệu.
 *
 * Danh sách này **không** gồm 16 Beat: tuy cùng dòng nhạc nhẹ, kho xếp nó thành
 * một tiết điệu riêng với tay trái bass phách 1 và 3, không phải ballad.
 */
export const BALLAD_FAMILY_IDS: readonly string[] = [
  /** Điệu ballad mặc định của app, và là chỗ mọi alias `ballad*` trỏ tới. */
  'pop-1',
  'slow-rock-2',
  /* Ballad của thầy Hải trên bảng chọn — xem `styleLibrary/haiStyles.ts`. */
  'hai-pop-ballad',
  'hai-pop-ballad-chorus',
  'hai-slow-rock',
  'hai-slow-rock-chorus',
  'hai-ballad-dan-ca',
  /* Biến tấu KeyTrain dựng từ Pop Ballad (Hải) — vẫn là ballad. */
  'hai-pop-ballad-free',
  'hai-pop-ballad-free-chorus',
]

const BALLAD = new Set(BALLAD_FAMILY_IDS)

/**
 * Điệu này có thuộc họ ballad không.
 *
 * Tra qua `getStyle` trước để mọi tên gọi khác của cùng một điệu đều ra cùng
 * câu trả lời: `ballad`, `ballad-pre`, `ballad-chorus` đều là `pop-1`, còn
 * `slow-rock` là `slow-rock-2`. Không tra thì bật công tắc ở `ballad` mà tắt ở
 * `pop-1`, dù đó là một điệu.
 */
export function isBalladStyle(styleId: string | undefined | null): boolean {
  if (!styleId) return false
  const resolved = getStyle(styleId)?.id ?? styleId
  return BALLAD.has(resolved)
}

/**
 * Tầm cao độ cho câu solo khi đang chơi **điệu ballad**.
 *
 * Tầm giang tấu mặc định rộng tới quãng tám thứ sáu: lúc ấy câu solo là giọng
 * chính, chơi cao hơn hẳn phần đệm để nghe tách bạch. Đệm ballad thì ngược lại
 * — đàn nâng giọng hát, và một câu vọt lên Si quãng tám 6 nghe như hai người
 * chơi hai bài khác nhau, tay cũng không với tới cùng lúc với phần đệm.
 *
 * Sol quãng tám 3 tới La quãng tám 5 — đúng tầm một người đệm hát với tới.
 *
 * Trần hạ từ La quãng tám 5 xuống **Fa quãng tám 5**.
 *
 * Bản trước để La để cú quét ngũ cung còn vắt đủ hai tầng quãng tám. Đổi lại vì
 * người đệm đo bằng tai chứ không đo bằng hình câu: đây là app đệm hát, cây đàn
 * nâng giọng người, và câu chạy lên tới La quãng tám 5 đã bắt đầu nghe như hai
 * người chơi hai bài. Cú quét vì thế chỉ còn khoảng một tầng rưỡi — chấp nhận,
 * vì một cú quét ngắn hơn vẫn là cú quét, còn một câu bay quá tầm thì hỏng cả
 * chỗ đứng của người hát.
 *
 * Dòng nhạc nào cần cao hơn thì bên gọi truyền `range` riêng.
 */
/*
  Sàn nâng từ Son quãng tám 3 (55) lên **Si giáng quãng tám 3 (58)**.

  55 là đúng `LEFT_REGISTER_TOP` — trần tay trái của cả app. Để sàn câu solo
  bằng trần tay trái nghĩa là hai tay được phép rơi vào **cùng một phím**, và ở
  đoạn giang tấu thì cả hai đang kêu cùng lúc. Đo trên `hai-pop-ballad-free`:
  tay trái lên tới 55, nốt thấp nhất của câu solo cũng 55.

  Trước đây chỗ này không lộ ra, vì giang tấu thay tay trái bằng một tuyến trầm
  riêng trần 52, tự nó chừa sẵn khoảng cách. Bỏ tuyến ấy đi — giang tấu phải
  chơi đúng điệu đang chọn — thì khoảng cách phải do chính hai tầm này chừa.

  Ba nửa cung là quãng ba thứ: đủ để tai tách được bè, và vẫn còn hơn một quãng
  tám rưỡi cho câu chạy.
*/
export const BALLAD_SOLO_RANGE = { low: 58, high: 77 } as const
