import data from './fillCaPhao.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Cà Pháo — CÂU FILL LÚC HÁT, 7 kiểu (người dùng 4/10/2026: "các kỹ thuật đặc trưng khác của anh đâu"). 8 đoạn cắt NGUYÊN đúng các chỗ
 * nguồn của bảng "Bảy kỹ thuật" trong md Cà Pháo (`scripts/ky_thuat_ca_phao.py`). Đoạn "tay trái dẫn", "bass đi nửa cung" tập tay trái
 * ở bậc tách tay (`DoanTap.tay`).
 */
export const FILL_CA_PHAO: KyThuat = {
  id: 'fill-cp',
  thay: 'ca-phao',
  ten: 'Câu fill lúc hát — 7 kiểu',
  gioiThieu:
    'Câu chèn vào chỗ ca sĩ nghỉ, thường ôm lấy vạch nhịp: mở ở phách cuối ô trước rồi rơi vào phách 1 ô sau. Bảy kiểu của anh: leo thế đảo kèm hợp âm lướt · tay trái dẫn · mở kèm hợp âm lướt · bass đi nửa cung · sóng lên xuống · câu đơn có nốt dẫn nửa cung · chuyển nguyên thế bấm lên quãng tám.',
  soDo:
    'Số đo trên 5 chỗ fill bạn đã xác nhận (Để Em 40 · 59; Chưa Bao Giờ 22 · 50→51 · 75→76) cộng Có Em Chờ 20→22 và Anh Cứ Đi Đi 16 · 53: 4/5 câu ôm lấy vạch nhịp, 4/5 là thế bấm leo 1–3 quãng tám, 4/5 kết bằng một cú ngân ở đỉnh. Mỗi kiểu chỉ 1–2 chỗ trong sheet. Bộ fill soạn từ 7 kiểu này bạn đã nghe duyệt ở điệu Ballad cứ đi (30/9). Mỗi đoạn tập ở nhịp độ của bài gốc. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: false,
  chamLay: false,
  bac: thang4('right', [
    'Tách tay, chậm — tay phải, riêng đoạn "tay trái dẫn" và "bass đi nửa cung" là tay trái. Câu fill rơi gọn vào khe, đầu câu không đè chữ cuối câu hát.',
    'Đúng nhịp bài: nốt cuối câu fill chạm đúng phách 1 của hợp âm sau.',
    'Ghép hai tay, chậm: tay kia thường chỉ giữ một cú ngân dưới câu fill (3/5 chỗ fill của anh như vậy).',
    'Hai tay, nhịp thật.',
  ]),
  bai: data.bai as DoanTap[],
}
