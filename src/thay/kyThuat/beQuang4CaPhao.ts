import data from './beQuang4CaPhao.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Cà Pháo — BÈ QUÃNG 4 · QUÃNG 5 (người dùng 4/10/2026). Nét riêng đo cùng một cách trên mọi sheet (PianoBrain `giat_lay.py --cu`).
 * 7 đoạn 2 ô ở đoạn đàn có nhiều cú bè quãng 4/5 nhất, mỗi bài tối đa 2 (`scripts/ky_thuat_ca_phao.py`).
 */
export const BE_QUANG_4_CA_PHAO: KyThuat = {
  id: 'be4-cp',
  thay: 'ca-phao',
  ten: 'Bè quãng 4 · quãng 5',
  gioiThieu:
    'Tay phải đi hai nốt cùng lúc cách nhau quãng 4 (5 nửa cung) hoặc quãng 5 (7 nửa cung) — tiếng "treo", trống, khác bè quãng 3 ngọt. Ở Để Em Rời Xa, câu đóng đoạn dạo vút bè quãng 4 từ Fa4+Si♭4 lên Fa6+Si♭6 trong một phách.',
  soDo:
    'Đo cùng một cách trên mọi sheet (% số cú hai nốt tay phải ở đoạn đàn dạo · giang · kết): ballad của anh, bè quãng 4/5 chiếm 38 % — nhiều nhất trong các loại bè ở đó (quãng 3/6 31 %, quãng 2 15 %, quãng 8 13 %; trên 1530 cú tay phải); Linh Nhi 12–24 %, Blues 17–25 %. Bossa của anh thì ít (9 %, mẫu nhỏ). Các đoạn cắt nguyên từ 5 sheet ballad (2 ô có nhiều bè quãng 4/5 nhất, mỗi bài tối đa 2), nhịp độ của bài gốc. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: false,
  chamLay: false,
  bac: thang4('right', [
    'Tách tay phải, chậm: giữ khung bàn tay cố định ở quãng 4 (ngón 1 – ngón 4) hay quãng 5 (ngón 1 – ngón 5) khi tay di chuyển.',
    'Đúng nhịp bài: hai nốt của bè vang cùng lúc, không rải.',
    'Ghép tay trái: phần lớn cú tay phải rơi lúc bass đang ngân (Để Em Rời Xa, đoạn dạo: 21/32 cú) — giữ bass, cho tay phải đi trên nó.',
    'Hai tay, nhịp thật.',
  ]),
  bai: data.bai as DoanTap[],
}
