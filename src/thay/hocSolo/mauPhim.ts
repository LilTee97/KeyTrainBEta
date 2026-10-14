import type { CSSProperties } from 'react'

/*
  BA MỨC MÀU — người dùng 11/10/2026: "Nốt nào ko đánh được của các thầy thì ko in màu chứ đừng làm màu hồng. Nốt nào chính thì màu đậm
  còn nốt dùng được để thêm đẹp hợp âm thì làm mờ đi". Đậm = nốt của hợp âm, hay nốt thầy dùng từ 10 % trở lên (mốc 10 % Claude chọn);
  mờ = nốt màu, nốt gam đi qua, nốt nhà, nốt blue; không màu = nốt tránh ngân / ngoài gam mà thầy KHÔNG có số đo đánh. Số đo 11/10/2026:
  11/160 nốt có phần trăm là nốt tránh / ngoài gam mà thầy vẫn đánh 5–12 % (Cà Pháo 10, Linh Nhi 1) → mờ (12 % → đậm), vì "thầy không
  đánh" là sai với chúng. Cũ: bảy màu theo vai, nốt tránh màu hồng; bản đầu ba mức để mọi nốt tránh / ngoài không màu — lùi về đó nếu
  người dùng muốn nốt tránh luôn trắng dù thầy có lướt qua.
*/
export type Muc = 'dam' | 'mo' | 'khong'
export const NEN: Readonly<Record<Muc, { trang: CSSProperties; den: CSSProperties; chu: string }>> = {
  dam: { trang: { background: 'var(--color-teal-key)' }, den: { background: 'var(--color-teal-key)' }, chu: 'text-teal-key' },
  /* Người dùng 11/10/2026, lượt 3: "màu phím đừng để giống nhau như vậy, hãy làm cho nó khác rõ rệt" — mờ đổi sang MÀU KHÁC: cam
     (amber 70 % pha trắng; phím đen amber 70 % pha đen). Lượt 2: teal 55 % pha trắng + viền teal — vẫn cùng màu với phím đậm, người
     dùng thấy giống nhau. Lượt 1: teal 32 % pha kem (#c3d3c6) — lẫn phím trắng. Lùi nếu cam bị đọc nhầm thành phím đang bấm sai. */
  mo: {
    trang: { background: 'color-mix(in srgb, var(--color-amber-key) 70%, white)' },
    den: { background: 'color-mix(in srgb, var(--color-amber-key) 70%, #111)' },
    chu: 'text-amber-key',
  },
  khong: { trang: { background: 'var(--color-cream)' }, den: { background: '#0b0b0b' }, chu: 'text-dim' },
}
