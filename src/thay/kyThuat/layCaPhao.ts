import data from './layCaPhao.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Cà Pháo — LÁY NỬA CUNG (người dùng 4/10/2026). 8 đoạn cắt NGUYÊN từ bản chép tay *Người hãy quên em đi* — sheet ghi nhiều nốt láy nhất
 * của anh (`scripts/ky_thuat_ca_phao.py`); dấu giật của sheet giữ khi phát nhưng không chấm ở bài này.
 */
export const LAY_CA_PHAO: KyThuat = {
  id: 'lay-cp',
  thay: 'ca-phao',
  ten: 'Láy nửa cung',
  gioiThieu:
    'Láy vào nốt giai điệu từ phím kề bên nửa cung: một nốt láy nửa cung dưới (Mi♭ → Mi), hoặc vuốt 2–3 nốt nửa cung liền (Rê–Mi♭ → Mi, Fa–Mi → Rê). Nốt láy bấm sát trước nốt chính, nhẹ và nhả ngay.',
  soDo:
    'Số đo trên bản chép tay Người hãy quên em đi (n = 1 bài, bossa) — sheet ghi nhiều nốt láy nhất của anh (Hồng Kông 1 chỉ 2 chỗ; các sheet khác không ghi, phần lớn là bản xuất máy không ghi được nốt láy): 35 chỗ láy, tay phải 33; láy một nốt nửa cung dưới 14, vuốt nửa cung từ dưới lên 6, từ trên xuống 8; 30/35 chỗ nằm trên giai điệu bài hát. Linh Nhi (Biển Tình) láy một nốt từ quãng 3 thứ dưới 21/46 chỗ — anh không láy kiểu ấy lần nào (0/35). ♩ 107 như sheet. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: false,
  chamLay: true,
  bac: thang4(
    'right',
    [
      'Tách tay phải, chậm: nốt láy và nốt chính là một cú vuốt — trượt ngón từ phím đen sang phím trắng kề bên, không chờ.',
      'Đúng nhịp sheet: nốt chính vẫn rơi đúng phách, nốt láy chen sát trước.',
      'Ghép tay trái: bass bossa đều dưới tay phải.',
      'Hai tay, nhịp thật.',
    ],
    null,
    [0.7, 0.8],
  ),
  bai: data.bai as DoanTap[],
}
