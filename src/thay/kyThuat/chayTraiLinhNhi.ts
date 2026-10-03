import data from './chayTraiLinhNhi.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Linh Nhi — CÂU CHẠY TAY TRÁI DẪN BÈ TRẦM VÀO HỢP ÂM SAU (kỹ thuật đặc trưng, người dùng 3/10/2026: "làm theo bạn đề nghị").
 * Số đo: md Linh Nhi 13g (`tools/chay_ngon_slow_rock.py`) — lúc hát, câu chạy của chị nằm ở tay trái (42/48 câu chạy, 2 sheet slow rock).
 * Vật liệu: 7 đoạn cắt NGUYÊN từ *Lá Thư Trần Thế* — bài gốc của điệu Slow Rock Lá thư (`scripts/chay_trai_linh_nhi.py`); mỗi đoạn hai ô
 * 6/8, câu hát lại ở phiên sau chỉ giữ một.
 */
export const CHAY_TRAI_LINH_NHI: KyThuat = {
  id: 'chay-trai-ln',
  thay: 'linh-nhi',
  ten: 'Câu chạy tay trái dẫn vào hợp âm sau',
  gioiThieu:
    'Cuối ô 6/8, tay trái chạy ba nốt liền một chiều (thường đi quãng tám) rồi nốt thứ tư rơi đúng vạch ô, vào gốc hợp âm sau. Tay phải hát giai điệu hay giữ hợp âm phía trên.',
  soDo:
    'Số đo trên 2 sheet slow rock của chị (Lá Thư, Một Cõi): lúc hát, câu chạy nằm ở tay trái 42/48 câu — vào ở tiếng 4 (phách mạnh thứ hai của ô 6/8), móc đơn, nốt đáp là nốt của hợp âm sau 56/64 câu. Các đoạn cắt nguyên từ Lá Thư Trần Thế — bài gốc của điệu Slow Rock Lá thư; Một Cõi chép hỏng nhịp nên không cắt. Chưa đo cùng cách trên thầy khác. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 3,
  chamNhac: false,
  bac: thang4('left', [
    'Tách tay trái, chậm: ba nốt chạy đều, nốt thứ tư rơi đúng vạch — tai nghe đó là chỗ đổi hợp âm. Đừng vội ở nốt cuối.',
    'Đúng nhịp sheet: câu chạy vẫn phải chạm vạch đúng lúc, không chạy trước.',
    'Ghép tay phải: lúc tay trái chạy, tay phải vẫn hát giai điệu hay giữ hợp âm — hai tay độc lập, nên chậm lại và nới ngưỡng.',
    'Hai tay, nhịp thật: câu chạy dẫn vào hợp âm sau mà giai điệu không chựng.',
  ]),
  bai: data.bai as DoanTap[],
}
