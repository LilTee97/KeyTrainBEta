// Đo CHẤT LIỆU tay phải — dặm (cụm ≥ 3 nốt) · đường đơn · câu chạy · kỹ thuật · đánh giật — trên sheet và trên bộ soạn.
// Dùng chung cho script đo (probe) và test. Một cú = một thời điểm tay phải (nhiều nốt cùng lúc là một cú).
export type Hit = { at: number; tones: number[]; gate: number; left: boolean }

export function texture(hits: readonly Hit[], beats: number) {
  const n = hits.length || 1
  const tops = hits.map(h => Math.max(...h.tones))
  // Câu chạy: ≥ 4 cú một nốt liên tiếp, cách nhau ≤ ½ phách (định nghĩa của Codex, CP-BALLAD-COMPOSER).
  let runs = 0, runNotes = 0, cur = 0
  hits.forEach((h, i) => {
    const single = h.tones.length === 1
    const close = i > 0 && h.at - hits[i - 1].at <= .501 && hits[i - 1].tones.length === 1
    cur = single ? (close ? cur + 1 : 1) : 0
    if (cur === 4) { runs += 1; runNotes += 4 } else if (cur > 4) runNotes += 1
  })
  const off16 = (h: Hit) => Math.abs(h.at * 2 - Math.round(h.at * 2)) > 1e-6
  const off8 = (h: Hit) => Math.abs(h.at - Math.round(h.at)) > 1e-6
  // Đánh giật: cú NGẮN (≤ ¼ phách) rơi giữa phách, sau nó nghỉ ≥ ¼ phách — tiếng chặn lệch phách.
  const giat = hits.filter((h, i) => off8(h) && h.gate <= .251 && (hits[i + 1]?.at ?? beats) - (h.at + h.gate) >= .249).length
  // Nghịch phách ngân: vào giữa phách rồi ngân qua phách kế.
  const nghich = hits.filter(h => off8(h) && Math.floor(h.at + h.gate - 1e-6) > Math.floor(h.at)).length
  return {
    cu: hits.length, cuMoiPhach: hits.length / beats,
    dam: hits.filter(h => h.tones.length >= 3).length / n,
    don: hits.filter(h => h.tones.length === 1).length / n,
    runs, runNotes: runNotes / n,
    octave: hits.filter(h => h.tones.some(t => h.tones.includes(t + 12))).length / n,
    dyad36: hits.filter(h => h.tones.length === 2 && [3, 4, 8, 9].includes(Math.abs(h.tones[1] - h.tones[0]))).length / n,
    mocKepLe: hits.filter(off16).length / n,
    giat: giat / n, nghich: nghich / n,
    haiTay: hits.filter(h => h.left).length / n,
    buocLien: tops.slice(1).filter((t, i) => Math.abs(t - tops[i]) >= 1 && Math.abs(t - tops[i]) <= 2).length / Math.max(1, tops.length - 1),
  }
}
