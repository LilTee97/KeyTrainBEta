import type { AnalyzedChord } from './degreeAnalysis'

/*
  MÀU HỢP ÂM LINH NHI — đo phần hát 8 bản ký âm, 24/9/2026 (`tools/hop_am_linh_nhi.py`).

  Màu lấy từ NỐT ĐỆM THẬT (tay trái + nốt dưới nốt đỉnh tay phải), không từ ký hiệu sheet.
  Phần lớn hợp âm chị để TRƠN — md ghi 77% ở phần hát; đếm theo bậc:

    trưởng (3 bài): I trơn 30/61 · V trơn 25/42 (V7 chỉ 7/42) · vi 25/34 · IV 18/24 ·
                     iii 16/20 · ii 22/38 · II (át của V) có ♭7 10/10, 3 bài.
    thứ (5 bài):    i trơn 41/101 · ♭III 22/51 · ♭VII 19/30 · V có ♭7 17/24, 4 bài ·
                     ii° có ♭7 10/16, 4 bài · I trưởng kéo về iv có ♭7 6/6, 4 bài.
    thứ, ĐIỆP KHÚC: ♭VI maj7 13/21 (phiên chỉ 8/25), 3 bài · iv add9 7/10, 3 bài.

  Không đặt luật cho chỗ chỉ một bài có: v7 thứ (12/16 nhưng 1 bài), III trơn (1 bài).
  Hợp âm chen trong ô chỉ lặp ≤ 5 lần ở ≥ 2 bài — KHÔNG tự chèn hợp âm vào bài.

  Giá trị cũ (bảng tĩnh, không số đo): trưởng I/IV maj7 · ii/iii/vi m7 · V7 · vii m7b5;
  thứ i m7 · ii m7b5 · III/VI maj7 · iv m7 · V7 · VII7 — và ép cả v thứ thành V7.
  Triệu chứng để lùi: nghe hợp âm "nhạt" — đó là chỗ chị để trơn; màu của chị nằm ở nốt
  rải tay trái (bậc 9 trên i và iv), không ở ký hiệu.
*/
/** Chất đích cho hợp âm này theo Linh Nhi, hoặc `null` = giữ nguyên như người dùng ghi. */
export function mauLinhNhi(analyzed: AnalyzedChord, minor: boolean, diep: boolean): string | null {
  const { chord, degree } = analyzed
  const id = chord.quality.id
  // Chỉ tô hợp âm ba trơn; màu và bass đảo người dùng ghi thì giữ.
  if (id !== 'maj' && id !== 'min' && id !== 'dim') return null
  if (!minor) return id === 'maj' && degree === 2 ? '7' : null
  if (id === 'maj' && degree === 5) return '7'
  if (id === 'dim' && degree === 2) return 'm7b5'
  if (id === 'maj' && degree === 1 && analyzed.actsAsDominant) return '7'
  if (diep && id === 'maj' && degree === 6) return 'maj7'
  if (diep && id === 'min' && degree === 4) return 'madd9'
  return null
}
