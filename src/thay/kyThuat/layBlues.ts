import data from './layBlues.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Blues — LÁY NỐT BLUE (GĐ 2 mục b, 3/10/2026). Hai dạng, hai sheet (`scripts/lay_blues.py`):
 * - Boogie Woogie Basics (sheet của điệu Twist, bản chép tay): nốt láy ghi riêng — Mi♭ → Mi (♭3 → 3), Mi♭ + Fa♯ → Mi + Sol. ♩ 140 như nút Twist.
 * - Rockhouse (Ray Charles, chép từ MIDI): láy chồng — hai nốt cách nửa cung bấm cùng lúc (13 cặp trong 12/74 câu lick). ♩ 88 như sheet.
 * Láy nửa cung thì Cà Pháo cũng có; cái riêng của Blues là láy đúng vào nốt blue của giọng — chưa đo Cà Pháo láy vào bậc nào.
 */
export const LAY_BLUES: KyThuat = {
  id: 'lay-blues',
  thay: 'blues',
  ten: 'Láy nốt blue',
  gioiThieu:
    'Bấm nốt blue nửa cung dưới rồi trượt ngay lên nốt hợp âm — Mi♭ lên Mi trên hợp âm Đô (♭3 lên 3). Rockhouse ghi kiểu láy chồng: bấm cả hai nốt cách nửa cung cùng lúc, như một tiếng "chỏi" có chủ ý.',
  soDo:
    'Số đo: sheet Boogie ghi 8 chỗ láy — Mi♭ → Mi ở ô 1–3, 17–19; Mi♭ + Fa♯ → Mi + Sol ở ô 25, 29. Rockhouse: 13 cặp láy chồng trong 12/74 câu lick. Đoạn Boogie tập ở ♩ 140 như nút Twist; đoạn Rockhouse ở ♩ 88 như sheet. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: false,
  chamLay: true,
  bac: thang4(
    'right',
    [
      'Tách tay phải, chậm: láy ghi riêng thì bấm nốt láy rồi trượt ngón sang phím trắng kề bên ngay; láy chồng thì bấm hai phím cùng lúc bằng một ngón hoặc hai ngón sát nhau.',
      'Đúng nhịp: láy gọn, nốt chính vẫn rơi đúng phách.',
      'Ghép tay trái: bass boogie / bass slow blues đi đều dưới tay phải.',
      'Hai tay, nhịp thật.',
    ],
    null,
    [0.7, 0.8],
  ),
  bai: data.bai as DoanTap[],
}
