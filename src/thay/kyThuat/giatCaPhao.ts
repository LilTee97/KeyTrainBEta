import data from './giatCaPhao.json'
import { thang4, type DoanTap, type KyThuat } from './kyThuat'

/**
 * Cà Pháo — ĐÁNH GIẬT. Người dùng 3/10/2026: "đánh giật" = giật ngón (bấm rồi nhấc ngón ngay — dấu staccato) · *"tôi chỉ muốn học
 * đánh giật kiểu Cà Pháo"*. Vật liệu: 9 đoạn cắt NGUYÊN từ bản chép tay *Người hãy quên em đi* — sheet duy nhất của anh có ghi dấu giật
 * (bảy sheet ballad là bản máy chép không mang dấu; Hồng Kông 1 không ghi dấu giật nào). Cắt bằng `scripts/giat_ca_phao.py`; nốt giật
 * vang nửa trường độ ghi (cách đọc của Claude, như bộ soạn solo CP).
 */
export interface DoanGiat extends DoanTap {
  soCu: number
  soCuGiat: number
  /** Cú giật của tay phải. */
  giatPhai: number
  soNotLay: number
}

export const GIAT_CA_PHAO: KyThuat<DoanGiat> = {
  id: 'giat-cp',
  thay: 'ca-phao',
  ten: 'Đánh giật kiểu Cà Pháo',
  gioiThieu:
    'Giật ngón: bấm rồi nhấc ngón lên ngay, tiếng ngắn, có khoảng lặng nhỏ trước tiếng sau. Nốt không có dấu thì vẫn giữ đủ.',
  soDo:
    'Số đo trên bản chép tay Người hãy quên em đi (bài duy nhất của anh có ghi dấu giật): lúc hát, anh giật 18 % số cú hợp âm tay phải (40/218), nhiều nhất ở phách 4 (9/17); không bao giờ giật ở phách 1, 2& và 4&. Tay trái hầu như ngân. Các đoạn cắt nguyên từ sheet, dễ trước. Ngưỡng đạt do Claude đặt, chưa đo.',
  bpm: data.bpm,
  meter: 4,
  chamNhac: true,
  chamLay: false,
  bac: thang4(
    'right',
    [
      'Tách tay phải, chậm: tách việc giật ra khỏi việc tìm phím. Anh giật chủ yếu ở hợp âm tay phải — cả cú nhấc lên cùng lúc, như chạm vào nồi nóng. Nốt không có dấu thì giữ đủ; giật nhầm chỗ ngân cũng tính sai.',
      'Đúng nhịp sheet: nhanh hơn thì cú giật phải gọn hơn mà vẫn rơi đúng chỗ.',
      'Ghép tay trái: bass phần lớn ngân, chỉ vài nốt có dấu giật. Hai tay nhấc khác nhau mới là cái khó, nên chậm lại và nới ngưỡng.',
      'Hai tay, nhịp thật: tiếng giật rõ tai mà nhịp vẫn đều.',
    ],
    { giatToiThieu: [0.75, 0.85], nganToiThieu: [0.75, 0.8] },
  ),
  bai: data.bai as DoanGiat[],
}
