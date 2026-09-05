import type { LickNote, LickPhrase } from './types'

function n(midis: readonly number[], ats: readonly number[], dur = 0.25): LickNote[] {
  const z = midis[0]!
  return midis.map((midi, i) => ({
    interval: midi - z,
    at: ats[i]!,
    dur,
  }))
}

/** Fill/run Linh Nhi đã chốt phiếu — interval từ nốt đầu, dịch theo hợp âm đang vang. */
export const LINH_NHI_PHRASES: readonly LickPhrase[] = [
  /*
    BỐN CÂU BA NỐT — hình hay gặp nhất, sổ trước thiếu hẳn.

    Đo 54 cụm móc kép trong đoạn có lời của bảy bản ký âm (đã bỏ nốt chồng, chỉ
    lấy nốt trên cùng mỗi mốc): **34 cụm là 3 nốt (63%)**, 11 cụm 4 nốt (20%).
    Sổ ban đầu có 4, 4, 4, 6, 8, 8 nốt — không câu nào ba nốt.

    Hệ quả nghe được: `placeLocked` neo câu vào CUỐI hợp âm, nên độ dài câu quyết
    định chỗ nó bắt đầu. Câu 6-8 nốt đẩy điểm vào tận phách 2, trong khi chị ấy
    hay vào ở **phách 4,25** (15/54 lần) — đúng ba nốt móc kép ôm sát vạch nhịp.

    Bốn hình dưới là bốn hình ba nốt hay gặp nhất, lấy nguyên quãng và nguyên bậc
    nốt đầu từ ô nguồn ghi kèm.
  */
  {
    id: 'ln-fill-dx29',
    label: 'Đường Xưa ô 29 · rải xuống từ bậc 5',
    kind: 'fill',
    span: 0.75,
    fromRoot: 7,
    notes: n([76, 67, 72], [0, 0.25, 0.5]),
  },
  {
    id: 'ln-fill-dx37',
    label: 'Đường Xưa ô 37 · rải xuống từ bậc ♭7',
    kind: 'fill',
    span: 0.75,
    fromRoot: 10,
    notes: n([74, 65, 69], [0, 0.25, 0.5]),
  },
  {
    id: 'ln-fill-dx91',
    label: 'Đường Xưa ô 91 · xuống quãng tám rồi về',
    kind: 'fill',
    span: 0.75,
    fromRoot: 0,
    notes: n([81, 72, 81], [0, 0.25, 0.5]),
  },
  {
    id: 'ln-fill-dx27',
    label: 'Đường Xưa ô 27 · bật lên quãng mười',
    kind: 'fill',
    span: 0.75,
    fromRoot: 0,
    notes: n([64, 67, 80], [0, 0.25, 0.5]),
  },
  {
    id: 'ln-run-27',
    label: 'Đừng Xa ô 27',
    kind: 'run',
    span: 2.25,
    fromRoot: 3,
    notes: n([89, 88, 86, 81, 77, 76, 74, 69, 65], [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]),
  },
  {
    id: 'ln-fill-36',
    label: 'Đừng Xa A7',
    kind: 'fill',
    span: 1.75,
    fromRoot: 4,
    notes: n([61, 64, 67, 67, 73, 67], [0, 0.25, 0.5, 0.75, 1, 1.5], 0.3),
  },
  {
    id: 'ln-fill-26',
    label: 'Biển Tình A',
    kind: 'fill',
    span: 2,
    fromRoot: 0,
    notes: n([69, 73, 76, 81], [0, 0.5, 1, 1.5], 0.45),
  },
  {
    id: 'ln-fill-17',
    label: 'Biển Tình ô 17',
    kind: 'fill',
    span: 1,
    fromRoot: 5,
    notes: n([52, 57, 59, 62], [0, 0.25, 0.5, 0.75]),
  },
  {
    id: 'ln-run-63',
    label: 'Đường xưa ô 63',
    kind: 'run',
    span: 1.5,
    fromRoot: 3,
    notes: n([79, 83, 79, 83, 79, 83, 79], [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5]),
  },
  {
    id: 'ln-fill-90',
    label: 'Đường xưa 90→91',
    kind: 'fill',
    span: 1.5,
    fromRoot: 4,
    notes: n([76, 72, 71, 67], [0, 0.5, 1, 1.5], 0.45),
  },
  {
    id: 'ln-fill-mx',
    label: 'Mùa xuân 17→18',
    kind: 'fill',
    span: 2.5,
    fromRoot: 10,
    notes: n([60, 62, 66, 69, 74, 66, 74, 66], [0, 0.5, 1, 1.5, 1.75, 2, 2.25, 2.5]),
  },
  {
    id: 'ln-fill-42',
    label: 'Rừng lá thấp 42→43',
    kind: 'fill',
    span: 2,
    fromRoot: 3,
    notes: n([60, 64, 72, 74, 76, 79, 76, 81], [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75]),
  },
]

export function linhNhiBook(kind: 'fill' | 'run'): readonly LickPhrase[] {
  const hit = LINH_NHI_PHRASES.filter((one) => one.kind === kind)
  return hit.length > 0 ? hit : LINH_NHI_PHRASES
}
