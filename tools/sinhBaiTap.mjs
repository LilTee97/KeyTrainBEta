// Sinh bài tập điệu cho Lộ trình tập — `Reference/KE-HOACH-LUYEN-TAP.md` mục 4c, GĐ 1 bước 2.
//
// CHẠY: máy chủ dev đang chạy (`npm run dev`, cổng 5173) rồi `node tools/sinhBaiTap.mjs`. Script mở Chrome chạy ngầm, nạp app,
// và với từng bài: lấy ảnh chụp bài mặc định (`window.__ktSnapshot`, chỉ có trên máy chủ dev), thay hợp âm · điệu · giọng ·
// nhịp độ, nhờ tab Tái hòa âm dựng (`practiceStore.requestOpen`) rồi chép dòng thời gian ra `src/thay/baiTap/<điệu>.json`.
// Đi qua app nên bài tập đúng là thứ người dùng nghe ở tab Tái hòa âm — không có bản dựng thứ hai.
//
// VÒNG TẬP (người dùng 1/10: "vòng bạn soạn từ các bộ soạn của Cà Pháo, Linh Nhi và bộ soạn Blues"; 2/10: giọng Đô trưởng /
// La thứ, Tuấn mượn hòa âm Linh Nhi): lấy từ câu dạo · giang · kết người dùng đã chấm "đã ổn" trong `Nguon.json` — bộ soạn
// của thầy sinh, tai người dùng duyệt. `hopAm` trong sổ là danh sách hợp âm chứ không phải danh sách ô: hai hợp âm liền nhau
// CÙNG GỐC (sus rồi về) thì chung một ô; tách xong không khớp số ô `soO` thì bỏ câu ấy, không đoán. Blues chưa có câu "đã
// ổn" nào nên lấy thẳng khung giang tấu của Bộ Soạn Blues (`boSoanBlues.ts` KHUNG). Mỗi bài: vòng TẬP 4 ô (bậc 1–6) và vòng
// KIỂM 8 ô (Blues 11 ô) chưa gặp, cho bậc 7.

import { spawn, execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'thay', 'baiTap')
const APP = 'http://localhost:5173/'
const PORT = 9341
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- vòng hợp âm từ Nguon.json ----------

const TEN = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }
const goc = (symbol) => symbol.match(/^[A-G][#b]?/)?.[0]
const giongOf = (text) => {
  const [ten, loai] = String(text).split(' ')
  return { tonic: TEN[ten], minor: /thứ/.test(loai ?? '') }
}

/**
 * Danh sách hợp âm → các ô. Khớp số ô sẵn thì mỗi hợp âm một ô (hợp âm lặp = ngân nhiều ô, như `Bm7b5 Bm7b5` ở #984).
 * Thừa hợp âm thì hai hợp âm liền nhau CÙNG GỐC KHÁC KÝ HIỆU (sus rồi về: `D9sus4 D7`) chung một ô. Vẫn không khớp thì null.
 */
function thanhO(hopAm, soOCaHut) {
  const chords = hopAm.filter((c) => !/hút/.test(c))
  // Hợp âm hút (vào hát) cũng chiếm một ô trong `soO` — bỏ nó khỏi vòng tập thì trừ ô của nó ra.
  const soO = soOCaHut - (hopAm.length - chords.length)
  if (chords.length === soO) return chords.map((c) => [c])
  const o = []
  for (const c of chords) {
    const truoc = o[o.length - 1]
    if (truoc && truoc.length === 1 && truoc[0] !== c && goc(truoc[0]) === goc(c)) truoc.push(c)
    else o.push([c])
  }
  return o.length === soO ? o : null
}

const so = JSON.parse(readFileSync(join(ROOT, 'Nguon.json'), 'utf8'))
const cot = so.cau.cot
const cau = so.cau.dong.map((d) => Object.fromEntries(cot.map((c, i) => [c, d[i]])))
const daOn = new Map(cau.filter((r) => r.danhGia === 'on').map((r) => [r.stt, r]))

/** Câu `stt` → các ô (dịch về Đô trưởng / La thứ làm ở trang, bằng `transposeSymbol` của app). */
function vongTu(stt, tuO, soO) {
  const r = daOn.get(stt)
  if (!r) throw new Error(`Nguon.json #${stt} không phải câu "đã ổn"`)
  const o = thanhO(r.hopAm, r.soO)
  if (!o) throw new Error(`Nguon.json #${stt}: ${r.hopAm.length} hợp âm không tách được thành ${r.soO} ô`)
  const g = giongOf(r.giong)
  return { o: o.slice(tuO, tuO + soO), dich: (g.minor ? 9 : 0) - g.tonic, nguon: `Nguon.json #${stt} (${r.dieu} · ${r.giong})` }
}

/** Khung giang tấu Bộ Soạn Blues (boSoanBlues.ts KHUNG) ở Đô trưởng / La thứ — mọi hợp âm một ô. */
const BLUES = {
  truong: { tap: ['C7', 'F7', 'C7', 'C7'], kiem: ['C7', 'C7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7'] },
  thu: { tap: ['Am7', 'Dm7', 'Am7', 'Am7'], kiem: ['Am7', 'Am7', 'Am7', 'Am7', 'Dm7', 'Dm7', 'Am7', 'Am7', 'F7', 'E7', 'Am7'] },
}
const blues = (chords, nguon) => ({ o: chords.map((c) => [c]), dich: 0, nguon })

// Bài tập: [thầy, điệu, giọng, vòng tập, vòng kiểm]. Có em chờ, Để em tách phiên · điệp (khác tiết tấu — đo 2/10/2026).
const BAI = [
  ['ca-phao', 'ca-phao-bossa-improved', 'minor', vongTu(995, 0, 4), vongTu(988, 0, 8)],
  ['ca-phao', 'ca-phao-ballad-co-em-cho', 'major', vongTu(1350, 0, 4), vongTu(1353, 0, 8)],
  ['ca-phao', 'ca-phao-ballad-co-em-cho-chorus', 'major', vongTu(1350, 0, 4), vongTu(1353, 0, 8)],
  ['ca-phao', 'ca-phao-ballad-de-em-roi-xa', 'minor', vongTu(992, 0, 4), vongTu(984, 0, 8)],
  ['ca-phao', 'ca-phao-ballad-de-em-roi-xa-chorus', 'minor', vongTu(992, 0, 4), vongTu(984, 0, 8)],
  ['ca-phao', 'ca-phao-ballad-cu-di', 'minor', vongTu(988, 0, 4), vongTu(984, 0, 8)],
  ['linh-nhi', 'slow-rock-la-thu-hai-tay', 'minor', vongTu(1382, 0, 4), vongTu(182, 0, 8)],
  ['tuan', 'bolero-tu-n-improv-bai-04-00001', 'minor', vongTu(182, 0, 4), vongTu(1382, 0, 8)],
  ['tuan', 'tango-tu-n-improv-bai-04-00004', 'minor', vongTu(182, 4, 4), vongTu(1382, 0, 8)],
  ['blues', 'blue-sun', 'minor', blues(BLUES.thu.tap, 'Bộ Soạn Blues — KHUNG thứ, giang biến thể 2'), blues(BLUES.thu.kiem, 'Bộ Soạn Blues — KHUNG thứ, giang biến thể 1')],
  ['blues', 'twist', 'major', blues(BLUES.truong.tap, 'Bộ Soạn Blues — KHUNG trưởng, giang biến thể 2'), blues(BLUES.truong.kiem, 'Bộ Soạn Blues — KHUNG trưởng, giang biến thể 1')],
]

// ---------- Chrome chạy ngầm qua giao thức DevTools ----------

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync)
if (!CHROME) throw new Error('Không thấy Chrome')
const profile = join(tmpdir(), `kt-sinh-bai-tap-${process.pid}`)
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })

let page = []
for (let i = 0; i < 60 && page.length === 0; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).filter((t) => t.type === 'page') } catch { await sleep(250) }
}
const ws = new WebSocket(page[0].webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.method === 'Runtime.exceptionThrown') console.log('  ! lỗi trong trang:', m.params.exceptionDetails.exception?.description?.split('\n')[0])
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
})
const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })) })
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'lỗi evaluate')
  return r.result?.result?.value
}

await send('Runtime.enable')
await send('Page.navigate', { url: APP })
for (let i = 0; i < 80; i++) {
  if (await evaluate('typeof window.__ktSnapshot === "function"')) break
  await sleep(250)
}
if (!(await evaluate('typeof window.__ktSnapshot === "function"'))) throw new Error('App chưa có __ktSnapshot — máy chủ dev có đang chạy bản mới không?')

const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()
mkdirSync(OUT, { recursive: true })

/** Nhờ app dựng một vòng ở một điệu; trả dòng thời gian + thế bấm + lưới hợp âm. */
async function dung(styleId, giong, vong, title) {
  const job = { styleId, giong, o: vong.o, dich: vong.dich, title }
  return evaluate(`(async () => {
    const job = ${JSON.stringify(job)}
    /*
      Nạp ĐÚNG bản mô-đun app đang dùng: tệp sửa trong lúc máy chủ dev chạy thì app nạp nó kèm \`?t=…\`; import đường trơn
      sẽ tạo bản thứ hai với kho trạng thái riêng — gửi lời nhờ vào đó thì app không bao giờ nhận.
    */
    const mod = (path) => import(performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes(path)) ?? path)
    const { transposeSymbol } = await mod('/src/reharm/transpose.ts')
    const { getStyle } = await mod('/src/reharm/style/styleLibrary/index.ts')
    const { usePracticeStore } = await mod('/src/reharm/playback/practiceStore.ts')
    const style = getStyle(job.styleId)
    if (!style) throw new Error('không có điệu ' + job.styleId)
    const bar = style.beatsPerMeasure
    const chords = job.o.flat().map((c) => transposeSymbol(c, job.dich))
    const durations = job.o.flatMap((o) => o.map(() => bar / o.length))
    /*
      Nối thêm một ô (lặp ô đầu vòng) rồi chỉ giữ đúng độ dài vòng: câu chạy Bộ Soạn Blues chèn ở CUỐI ĐOẠN (\`sectionEnds\` —
      Twist ô 4 bị thay cú chặn bằng A4 C5 A4 C5 …) rơi vào ô thừa và bị cắt; ô cuối vòng cũng nối sang đầu vòng như khi lặp.
    */
    const dau0 = job.o[0].map((c) => transposeSymbol(c, job.dich))
    const chordsNoi = [...chords, ...dau0]
    const durationsNoi = [...durations, ...job.o[0].map(() => bar / job.o[0].length)]
    const base = window.__ktSnapshot()
    const snapshot = { ...base,
      /*
        Twist: không có lời thì Bộ Soạn Blues coi mỗi 16 phách là hết một câu hát (\`chayTwistBlues\` → \`moc16\`) và chèn câu chạy
        vào ô 4, ô 8 … Đưa hợp âm thành MỘT dòng lời (ChordPro) thì chỗ nghỉ duy nhất ở cuối dòng — rơi vào ô thừa, bị cắt.
      */
      sourceText: job.styleId === 'twist' ? chordsNoi.map((c) => '[' + c + ']la').join(' ') : chordsNoi.join(' '),
      transpose: 0, manualKey: job.giong === 'minor' ? '9:minor' : '0:major',
      sectionMarks: [], arrangement: null, transitionEdits: {}, pairedChords: [], mutedFills: [], extraFills: [], extraRuns: [],
      fillRests: {}, colorEdits: {}, slashEdits: {}, acceptedPassing: [],
      lickyFills: false, lickyRuns: false, cpLick: false, caPhaoFull: false, slowRockMotO: true, twistSinglePass: true,
      bluesLickSR: false, bluesSoan6: false, bluesSoan12: false, bluesLuot: false,
      styleId: job.styleId, beatsPerChord: bar, chordDurations: durationsNoi, bpm: style.bpm,
      useSlashChords: false, varyOnRepeat: false, allowJazzColors: false, intensity: 'off', susDominant: false,
    }
    usePracticeStore.getState().requestOpen({ snapshot, id: null, title: job.title })
    let last = '', same = 0
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 100))
      const song = usePracticeStore.getState().song
      if (!song || song.title !== job.title || song.timeline.length === 0) continue
      const key = song.timeline.length + '|' + JSON.stringify(song.timeline[song.timeline.length - 1])
      same = key === last ? same + 1 : 0
      last = key
      if (same < 5) continue
      /*
        Bossa CP, Bolero Tuấn, Slow Blues, Twist TỰ CHÈN dạo · giang · kết cả khi bài chỉ có hợp âm. Bài tập là khung đệm
        của thân vòng: tìm phách (đã sắp) ứng với phách 0 của bài gốc (\`transport.sourceBeat\`), giữ đúng độ dài vòng, dời về 0.
      */
      const transport = usePracticeStore.getState().transport
      const total = Math.max(...song.timeline.map((e) => e.startBeat + e.durationBeats))
      const doDai = durations.reduce((a, b) => a + b, 0)
      let dau = 0
      for (let b = 0; b < total; b += 0.125) {
        const s = transport?.sourceBeat?.(b)
        if (s != null && Math.abs(s) < 1e-6) { dau = b; break }
      }
      const timeline = song.timeline
        .filter((e) => e.startBeat >= dau - 1e-6 && e.startBeat < dau + doDai - 1e-6)
        .map((e) => ({ ...e, startBeat: Math.round((e.startBeat - dau) * 1e6) / 1e6 }))
      // \`hopAm\` = hợp âm app THẬT SỰ đánh (thế bấm) — Slow Blues tô màu riêng (Am7 → Am9, \`harmonyStyle: 'blue-sun'\`).
      return { hopAm: song.voicings.slice(0, chords.length).map((v) => v.symbol), hopAmNhap: chords,
        phach: durations, doDai, bpm: style.bpm, meter: song.meter, beatsPerChord: song.beatsPerChord,
        perBeat: song.perBeat, catTuPhach: dau, timeline, voicings: song.voicings }
    }
    throw new Error('app không dựng xong ' + job.title)
  })()`)
}

const tomTat = []
for (const [thay, styleId, giong, tap, kiem] of BAI) {
  const tapOut = await dung(styleId, giong, tap, `bai-tap:${styleId}:tap`)
  const kiemOut = await dung(styleId, giong, kiem, `bai-tap:${styleId}:kiem`)
  const style = await evaluate(`(async () => {
    const path = '/src/reharm/style/styleLibrary/index.ts'
    const { getStyle } = await import(performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes(path)) ?? path)
    const s = getStyle(${JSON.stringify(styleId)})
    return { ten: s.name, bpm: s.bpm, meter: s.beatsPerMeasure }
  })()`)
  writeFileSync(
    join(OUT, `${styleId}.json`),
    `${JSON.stringify({ styleId, ten: style.ten, thay, giong: giong === 'minor' ? 'La thứ' : 'Đô trưởng', bpm: style.bpm,
      nguon: { tap: tap.nguon, kiem: kiem.nguon }, commit, tap: tapOut, kiem: kiemOut }, null, 1)}\n`,
  )
  const dem = (o) => `${o.timeline.length} tiếng (trái ${o.timeline.filter((e) => e.hand === 'left').length}, phải ${o.timeline.filter((e) => e.hand === 'right').length}), dài ${Math.max(...o.timeline.map((e) => e.startBeat + e.durationBeats)).toFixed(2)} phách`
  tomTat.push(`${styleId}: tập ${tapOut.hopAm.join(' ')} → ${dem(tapOut)} | kiểm → ${dem(kiemOut)}`)
  console.log(tomTat[tomTat.length - 1])
}

ws.close()
chrome.kill()
await sleep(500)
try { rmSync(profile, { recursive: true, force: true }) } catch { /* Chrome còn giữ tệp — để lại cũng được */ }
console.log(`Xong ${BAI.length} bài → ${OUT}`)
