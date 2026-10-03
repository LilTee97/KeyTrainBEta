import data from './layLinhNhi.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Linh Nhi — LÁY QUÃNG 3 THEO NGŨ CUNG (GĐ 2 mục b, 3/10/2026: người dùng "tiếp tục đi" sau khi đồng ý làm mục a trước, b sau).
 * Số đo: md Linh Nhi 13j — Biển Tình (bản chép tay duy nhất của chị mang dấu nốt láy) 21/46 chỗ láy là láy từ quãng 3 thứ dưới; Cà Pháo
 * 0/35 kiểu này. Vật liệu: 8 đoạn cắt NGUYÊN từ Biển Tình (`scripts/lay_linh_nhi.py`). Sheet không ghi nhịp độ: ♩ 66 — Claude chọn theo md
 * ("chị chơi bolero 60–70 BPM").
 */
export const LAY_LINH_NHI: KyThuat = {
  id: 'lay-ln',
  thay: 'linh-nhi',
  ten: 'Láy quãng 3 theo ngũ cung',
  gioiThieu:
    'Tay phải vuốt từ nốt thấp hơn một quãng 3 thứ lên nốt giai điệu — Si lên Rê, Fa♯ lên La (bậc 6 lên 1, bậc 3 lên 5) — như tiếng luyến của giọng hát bolero. Nốt láy bấm sát trước nốt chính, nhẹ và nhả ngay.',
  soDo:
    'Số đo trên Biển Tình — bản duy nhất của chị có ghi nốt láy (n = 1 bài): 52 nốt láy ở 46 chỗ, toàn tay phải, 39 chỗ trên giai điệu lời; kiểu láy quãng 3 thứ dưới 21/46. Cà Pháo không láy kiểu này lần nào (0/35 chỗ, anh láy nửa cung). Sheet không ghi nhịp độ: ♩ 66 là Claude chọn theo "chị chơi bolero 60–70 BPM". Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: false,
  chamLay: true,
  bac: thang4(
    'right',
    [
      'Tách tay phải, chậm: nốt láy và nốt chính là MỘT cú vuốt — bấm nốt láy rồi lăn ngón lên nốt chính, không chờ. Nốt láy không có phách riêng.',
      'Đúng nhịp: nốt chính vẫn rơi đúng phách, nốt láy chen sát trước nó.',
      'Ghép tay trái: tay trái giữ nhịp bolero đều, tay phải vẫn vuốt nhẹ — đừng để nốt láy kéo lệch cả hai tay.',
      'Hai tay, nhịp thật.',
    ],
    null,
    [0.7, 0.8],
  ),
  bai: data.bai as DoanTap[],
}
