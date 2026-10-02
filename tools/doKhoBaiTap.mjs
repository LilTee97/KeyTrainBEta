// Đo độ khó các bài tập điệu → đề xuất thứ tự tập trong từng trang thầy — `Reference/KE-HOACH-LUYEN-TAP.md` GĐ 1 bước 4.
//
// CHẠY: `node tools/doKhoBaiTap.mjs` — đọc `src/thay/baiTap/*.json` (bản người dùng đã duyệt), in bảng markdown. Không cần máy
// chủ dev. Đo trên VÒNG TẬP (4 ô, bậc 1–6) ở tempo 100 % = ♩ mặc định của nút; đo lại trên vòng kiểm để xem thứ tự có vững không.
//
// "Cú" = các tiếng CÙNG TAY vào cùng lúc. Nốt láy không thành cú (chờ đúng nốt và bộ chấm theo nhịp đều bỏ qua nó) — đếm riêng.

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'thay', 'baiTap')

/** Hai cú liền nhau cùng tay phủ quá một quãng tám thì phải dời thế tay (luật "nốt đệm phải đánh được bằng tay người"). */
const TAM_TAY = 12

/** Gom tiếng cùng tay vào cùng lúc thành cú (ngân = tiếng dài nhất), bỏ nốt láy. */
function cuCuaTay(timeline, hand) {
  const theoLuc = new Map()
  for (const event of timeline) {
    if (event.hand !== hand || event.grace) continue
    const t = Math.round(event.startBeat * 1000) / 1000
    if (!theoLuc.has(t)) theoLuc.set(t, { notes: new Set(), dai: 0 })
    const cu = theoLuc.get(t)
    for (const note of event.notes) cu.notes.add(note)
    cu.dai = Math.max(cu.dai, event.durationBeats ?? 0)
  }
  return [...theoLuc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, cu]) => ({ t, dai: cu.dai, notes: [...cu.notes].sort((a, b) => a - b) }))
}

/**
 * Cú NGHỊCH PHÁCH: vào lệch đầu phách, ngân qua đầu phách kế mà phách ấy chính tay đó không đánh — cái khó của Bossa. Chuỗi
 * móc kép đều (Ballad cứ đi) vào lệch nhưng phách kế vẫn có tiếng, nên không tính.
 */
function nghichPhach(cu, doDai) {
  const coCu = new Set(cu.map((one) => Math.round(one.t * 1000)))
  return cu.filter((one) => {
    const dau = Math.ceil(one.t - 1e-6)
    if (Math.abs(dau - one.t) < 1e-6) return false
    return one.t + one.dai > dau + 1e-6 && !coCu.has(Math.round((dau % doDai) * 1000))
  }).length
}

/** Số đo một tay trên một vòng lặp (cú cuối nối sang cú đầu như khi lặp). */
function doTay(timeline, hand, doDai, bpm) {
  const cu = cuCuaTay(timeline, hand)
  const msMoiPhach = 60000 / bpm
  let satMs = Infinity
  let doi = 0
  let doiGapMs = Infinity
  for (let i = 0; i < cu.length; i += 1) {
    const a = cu[i]
    const b = cu[(i + 1) % cu.length]
    const ioiMs = ((b.t - a.t + doDai) % doDai || doDai) * msMoiPhach
    if (cu.length > 1) satMs = Math.min(satMs, ioiMs)
    const hai = [...a.notes, ...b.notes]
    if (Math.max(...hai) - Math.min(...hai) > TAM_TAY) {
      doi += 1
      doiGapMs = Math.min(doiGapMs, ioiMs)
    }
  }
  return {
    cu: cu.length,
    cuMoiGiay: cu.length / ((doDai * msMoiPhach) / 1000),
    satMs,
    notMax: Math.max(0, ...cu.map((one) => one.notes.length)),
    gianMax: Math.max(0, ...cu.map((one) => one.notes.at(-1) - one.notes[0])),
    doi,
    doiGapMs,
    nghich: nghichPhach(cu, doDai),
    lay: timeline.filter((event) => event.hand === hand && event.grace).length,
  }
}

export function doVong(vong, bpm) {
  return { L: doTay(vong.timeline, 'left', vong.doDai, bpm), R: doTay(vong.timeline, 'right', vong.doDai, bpm) }
}

/** Sáu chỉ số gộp thành điểm (suy luận của Claude: ngang trọng số, xếp hạng rồi cộng hạng). Hướng +1 = số lớn là khó. */
const CHI_SO = [
  ['cú/giây hai tay', (m) => m.L.cuMoiGiay + m.R.cuMoiGiay, 1],
  ['hai cú sát nhất', (m) => Math.min(m.L.satMs, m.R.satMs), -1],
  ['nốt/cú tối đa', (m) => Math.max(m.L.notMax, m.R.notMax), 1],
  ['giãn/cú tối đa', (m) => Math.max(m.L.gianMax, m.R.gianMax), 1],
  ['dời thế tay', (m) => m.L.doi + m.R.doi, 1],
  ['nghịch phách', (m) => (m.L.nghich + m.R.nghich) / (m.L.cu + m.R.cu), 1],
]

/** Hạng 1 = dễ nhất; bằng nhau thì chia đều hạng. */
function hang(values, huong) {
  const order = values.map((v, i) => [v * huong, i]).sort((a, b) => a[0] - b[0])
  const out = new Array(values.length)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j + 1 < order.length && Math.abs(order[j + 1][0] - order[i][0]) < 1e-9) j += 1
    for (let k = i; k <= j; k += 1) out[order[k][1]] = (i + j) / 2 + 1
    i = j + 1
  }
  return out
}

export function diem(soDo) {
  const tong = soDo.map(() => 0)
  for (const [, lay, huong] of CHI_SO) hang(soDo.map(lay), huong).forEach((h, i) => (tong[i] += h))
  return tong
}

/* Tự kiểm trên một vòng dựng tay: phải đúng thì số đo bài thật mới đáng tin. */
{
  const vong = {
    doDai: 2,
    timeline: [
      { startBeat: 0, hand: 'left', notes: [48, 60], durationBeats: 1 },
      { startBeat: 1, hand: 'left', notes: [50], durationBeats: 1 },
      { startBeat: 0.5, hand: 'right', notes: [64, 67, 71], durationBeats: 0.75 },
      { startBeat: 0.75, hand: 'right', notes: [79], durationBeats: 0.1 },
      { startBeat: 0.7, hand: 'right', notes: [78], durationBeats: 0.05, grace: true },
    ],
  }
  const m = doVong(vong, 60)
  const dung = (a, b, ten) => {
    if (Math.abs(a - b) > 1e-9) throw new Error(`tự kiểm sai ${ten}: ${a} ≠ ${b}`)
  }
  dung(m.L.cu, 2, 'cú trái')
  dung(m.L.gianMax, 12, 'giãn trái')
  dung(m.L.doi, 0, 'dời trái (48–60 rồi 50: trong một quãng tám)')
  dung(m.R.notMax, 3, 'nốt/cú phải')
  dung(m.R.satMs, 250, 'sát nhất phải (¼ phách ở ♩60)')
  dung(m.R.doi, 2, 'dời phải (64–79 vượt quãng tám, cả chỗ nối vòng)')
  dung(m.R.lay, 1, 'nốt láy')
  dung(m.R.nghich, 1, 'nghịch phách phải (0,5 ngân qua phách 1 mà phách 1 tay phải không đánh; 0,75 hết trước phách 1)')
  dung(m.L.nghich, 0, 'nghịch phách trái (đều vào đầu phách)')
  dung(hang([3, 1, 3], 1)[0], 2.5, 'hạng chia đều')
}

const bai = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')))
const tap = bai.map((one) => doVong(one.tap, one.bpm))
const kiem = bai.map((one) => doVong(one.kiem, one.bpm))
const diemTap = diem(tap)
const diemKiem = diem(kiem)

const r = (x, n = 1) => (Number.isFinite(x) ? x.toFixed(n).replace('.', ',') : '—')
const cap = (m, lay) => `${lay(m.L)} · ${lay(m.R)}`
console.log('| Bài | ♩ | cú/giây T · P | hai cú sát nhất T · P (ms) | nốt/cú tối đa T · P | giãn/cú T · P (nửa cung) | dời thế tay T · P (lần/vòng) | nghịch phách T · P | nốt láy | điểm tập | điểm kiểm |')
console.log('|---|---|---|---|---|---|---|---|---|---|---|')
bai
  .map((one, i) => ({ one, i }))
  .sort((a, b) => diemTap[a.i] - diemTap[b.i])
  .forEach(({ one, i }) => {
    const m = tap[i]
    console.log(
      `| ${one.styleId} | ${one.bpm} | ${cap(m, (h) => r(h.cuMoiGiay))} | ${cap(m, (h) => r(h.satMs, 0))} | ${cap(m, (h) => h.notMax)} | ` +
        `${cap(m, (h) => h.gianMax)} | ${cap(m, (h) => h.doi)} | ${cap(m, (h) => `${h.nghich}/${h.cu}`)} | ${m.L.lay + m.R.lay} | ` +
        `${r(diemTap[i], 1)} | ${r(diemKiem[i], 1)} |`,
    )
  })
const vuot = bai.flatMap((one, i) =>
  ['L', 'R'].flatMap((h) => (tap[i][h].gianMax > TAM_TAY ? [`${one.styleId} tay ${h === 'L' ? 'trái' : 'phải'} ${tap[i][h].gianMax}`] : [])),
)
console.log(`\nMột cú vượt quãng tám: ${vuot.length ? vuot.join(' · ') : 'không có'}`)
const gap = bai.flatMap((one, i) =>
  ['L', 'R'].flatMap((h) =>
    tap[i][h].doiGapMs < 200 ? [`${one.styleId} tay ${h === 'L' ? 'trái' : 'phải'} ${r(tap[i][h].doiGapMs, 0)} ms`] : [],
  ),
)
console.log(`Dời thế tay trong dưới 200 ms: ${gap.length ? gap.join(' · ') : 'không có'}`)
