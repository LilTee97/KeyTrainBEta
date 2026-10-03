import data from './lickBeBlues.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Blues — CÂU LICK BÈ QUÃNG 3/6 (kỹ thuật đặc trưng, người dùng 3/10/2026: "làm theo bạn đề nghị").
 * Số đo: md Blues mục 4 + PianoBrain `tools/sheet/giat_lay.py --cu` — bè 3/6 chiếm 51 % cú hai nốt ở slow blues (Cà Pháo ballad 31 %,
 * Linh Nhi 27–40 %). Vật liệu: 6 câu lick cắt NGUYÊN từ *Rockhouse* (Ray Charles) — mọi câu có ≥ 4 cú, ≥ một nửa là bè 3/6, không láy
 * chồng (`scripts/lick_be_blues.py`). Láy nốt blue để bài riêng: app chưa chấm nốt láy.
 */
export const LICK_BE_BLUES: KyThuat = {
  id: 'lick-be-blues',
  thay: 'blues',
  ten: 'Câu lick bè quãng 3/6',
  gioiThieu:
    'Tay phải chơi câu lick ngắn bằng hai nốt cùng lúc, cách nhau quãng 3 hoặc quãng 6, hai ngón đi song song. Nhịp chùm ba (swing chậm); tay trái vẫn đi bass suốt câu.',
  soDo:
    'Số đo: trong câu chạy Rockhouse một nửa số cú là bè đôi (95/191). Đo cùng một cách trên mọi sheet, bè 3/6 chiếm 51 % số cú hai nốt ở slow blues — Cà Pháo ballad 31 %, Linh Nhi 27–40 %. Các câu cắt nguyên từ sheet Rockhouse (Ray Charles, giọng Sol, ♩ 88); Rockhouse chỉ có 6 câu đủ điều kiện. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: false,
  bac: thang4('right', [
    'Tách tay phải, chậm: giữ hai ngón đúng khoảng bè (quãng 3 hay quãng 6) khi tay di chuyển. Câu hay vào ở ⅓ hay ⅔ phách — nghe chùm ba trong đầu.',
    'Đúng nhịp sheet: câu ngắn, gọn, đáp vào phách chính.',
    'Ghép tay trái: tay trái vẫn đi bass suốt câu lick — Ray không dừng tay trái khi tay phải chạy.',
    'Hai tay, nhịp thật: câu lick nhẹ mà nhịp swing vẫn đều.',
  ]),
  bai: data.bai as DoanTap[],
}
