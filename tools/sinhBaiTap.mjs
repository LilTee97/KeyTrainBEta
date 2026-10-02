// Sinh bài tập điệu cho Lộ trình tập — `Reference/KE-HOACH-LUYEN-TAP.md` mục 4c, GĐ 1 bước 2.
//
// CHẠY: máy chủ dev đang chạy (`npm run dev`, cổng 5173) rồi `node tools/sinhBaiTap.mjs`. Script mở Chrome chạy ngầm, nạp app
// và với từng bài gọi `dungVong` (`src/thay/dungVong.ts` — CHÍNH đường dựng vòng tự tạo ở trang thầy): sửa ảnh chụp bài đang
// mở, nhờ tab Tái hòa âm dựng, cắt thân vòng. Ghi ra `src/thay/baiTap/<điệu>.json`. Đi qua app nên bài tập đúng là thứ người
// dùng nghe ở tab Tái hòa âm — không có bản dựng thứ hai.
//
// Ghi thêm `src/thay/vongThay.json`: kho vòng 4 ô của từng thầy (Đô trưởng / La thứ) cho nút "Tự soạn từ hợp âm chủ".
//
// VÒNG (người dùng 1/10: "vòng bạn soạn từ các bộ soạn của Cà Pháo, Linh Nhi và bộ soạn Blues"; 2/10: giọng Đô trưởng / La
// thứ, Tuấn mượn hòa âm Linh Nhi): lấy từ câu dạo · giang · kết người dùng đã chấm "đã ổn" trong `Nguon.json` — bộ soạn của thầy
// sinh, tai người dùng duyệt. `hopAm` trong sổ là danh sách hợp âm chứ không phải ô (xem `thanhO`). Blues chưa có câu "đã ổn"
// nào nên lấy khung giang tấu của Bộ Soạn Blues (`boSoanBlues.ts` KHUNG).
//
// LƯU Ý: tay phải Slow Blues do Bộ Soạn Blues sinh — mỗi lần chạy ra một bản khác. Bài đã được người dùng nghe duyệt thì đừng
// chạy lại đè (hoặc chạy rồi chỉ giữ tệp của bài chưa duyệt).

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
 * Thừa hợp âm thì hai hợp âm liền nhau CÙNG GỐC KHÁC KÝ HIỆU (sus rồi về: `D9sus4 D7`) chung một ô. Hợp âm "hút" (vào hát)
 * chiếm một ô trong `soO` nhưng không vào vòng tập. Vẫn không khớp thì null — không đoán.
 */
function thanhO(hopAm, soOCaHut) {
  const chords = hopAm.filter((c) => !/hút/.test(c))
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

/** Câu `stt` → các ô + số nửa cung dịch về Đô trưởng / La thứ (dịch làm trong trang, bằng `transposeSymbol` của app). */
function vongTu(stt, tuO, soO) {
  const r = daOn.get(stt)
  if (!r) throw new Error(`Nguon.json #${stt} không phải câu "đã ổn"`)
  const o = thanhO(r.hopAm, r.soO)
  if (!o) throw new Error(`Nguon.json #${stt}: ${r.hopAm.length} hợp âm không tách được thành ${r.soO} ô`)
  const g = giongOf(r.giong)
  return { o: o.slice(tuO, tuO + soO), dich: (g.minor ? 9 : 0) - g.tonic, nguon: `Nguon.json #${stt} (${r.dieu} · ${r.giong})` }
}

/** Khung giang tấu Bộ Soạn Blues (boSoanBlues.ts KHUNG) ở Đô trưởng / La thứ — mỗi hợp âm một ô. */
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

/**
 * Kho vòng 4 ô của từng thầy cho "Tự soạn từ hợp âm chủ": mọi câu "đã ổn" của thầy tách được thành ô, cửa sổ 4 ô liền nhau
 * (ô 1–4, 5–8, …) mà ô nào cũng chỉ một hợp âm. Câu của Tuấn không vào kho — người dùng 2/10: Tuấn mượn hòa âm Linh Nhi.
 */
function khoVong() {
  const thayCua = (dieu) =>
    dieu.startsWith('ca-phao') ? 'ca-phao' : dieu.includes('linh-nhi') || dieu.startsWith('slow-rock-la-thu') ? 'linh-nhi' : null
  const kho = []
  for (const r of daOn.values()) {
    const thay = thayCua(r.dieu)
    const o = thay ? thanhO(r.hopAm, r.soO) : null
    if (!o) continue
    const g = giongOf(r.giong)
    for (let tu = 0; tu + 4 <= o.length; tu += 4) {
      const cua = o.slice(tu, tu + 4)
      if (cua.every((one) => one.length === 1)) {
        kho.push({ thay, che: g.minor ? 'thu' : 'truong', hopAm: cua.map((one) => one[0]), dich: (g.minor ? 9 : 0) - g.tonic, nguon: `#${r.stt} ô ${tu + 1}–${tu + 4}` })
      }
    }
  }
  return kho
}

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

/*
  Nạp ĐÚNG bản mô-đun app đang dùng: tệp sửa trong lúc máy chủ dev chạy thì app nạp nó kèm `?t=…`; import đường trơn sẽ tạo
  bản thứ hai với kho trạng thái riêng — gửi lời nhờ vào đó thì app không bao giờ nhận.
*/
const MOD = `const mod = (path) => import(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(path)).at(-1) ?? path)`

await send('Runtime.enable')
await send('Page.navigate', { url: APP })
let sanSang = false
for (let i = 0; i < 240 && !sanSang; i++) {
  // Chỉ import khi app ĐÃ nạp mô-đun: import sớm (đường trơn) tạo bản thứ hai không bao giờ có `chupBai` (đo 2/10/2026).
  sanSang = await evaluate(`(async () => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/reharm/playback/practiceStore.ts')).at(-1)
    return !!url && typeof (await import(url)).usePracticeStore.getState().chupBai === 'function'
  })()`)
  if (!sanSang) await sleep(250)
}
if (!sanSang) throw new Error('App không lên sau 60 s — máy chủ dev có chạy ở cổng 5173 không?')

const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()

/* Bài ở tab Tái hòa âm phải được trả lại Y HỆT sau mỗi lần dựng (`dungVong` gửi lại `chupBai()` kèm `giu`). */
const chupTab = () =>
  evaluate(`(async () => { ${MOD}; const s = (await mod('/src/reharm/playback/practiceStore.ts')).usePracticeStore.getState(); return JSON.stringify([s.chupBai(), s.song?.timeline]) })()`)
const truocKhiDung = await chupTab()
mkdirSync(OUT, { recursive: true })

/** Dịch các ô về Đô trưởng / La thứ rồi gọi `dungVong` trong trang. */
const dung = (styleId, giong, vong) =>
  evaluate(`(async () => {
    ${MOD}
    const { transposeSymbol } = await mod('/src/reharm/transpose.ts')
    const { dungVong } = await mod('/src/thay/dungVong.ts')
    const o = ${JSON.stringify(vong.o)}.map((one) => one.map((c) => transposeSymbol(c, ${vong.dich})))
    return dungVong({ styleId: ${JSON.stringify(styleId)}, o, giong: ${JSON.stringify(giong === 'minor' ? '9:minor' : '0:major')} })
  })()`)

for (const [thay, styleId, giong, tap, kiem] of BAI) {
  const tapOut = await dung(styleId, giong, tap)
  const kiemOut = await dung(styleId, giong, kiem)
  const style = await evaluate(`(async () => { ${MOD}; const s = (await mod('/src/reharm/style/styleLibrary/index.ts')).getStyle(${JSON.stringify(styleId)}); return { ten: s.name, bpm: s.bpm } })()`)
  writeFileSync(
    join(OUT, `${styleId}.json`),
    `${JSON.stringify({ styleId, ten: style.ten, thay, giong: giong === 'minor' ? 'La thứ' : 'Đô trưởng', bpm: style.bpm,
      nguon: { tap: tap.nguon, kiem: kiem.nguon }, commit, tap: tapOut, kiem: kiemOut }, null, 1)}\n`,
  )
  const dem = (o) => `${o.timeline.length} tiếng (trái ${o.timeline.filter((e) => e.hand === 'left').length}, phải ${o.timeline.filter((e) => e.hand === 'right').length}), dài ${o.doDai} phách`
  console.log(`${styleId}: tập ${tapOut.hopAm.join(' ')} → ${dem(tapOut)} | kiểm → ${dem(kiemOut)}`)
}

if ((await chupTab()) !== truocKhiDung) {
  console.error('LỖI: bài ở tab Tái hòa âm KHÔNG được trả lại y hệt sau khi dựng — xem dungVong / OpenRequest.giu')
  process.exitCode = 1
} else console.log('Bài ở tab Tái hòa âm trả lại y hệt sau 22 lần dựng.')

/* Kho vòng: dịch về Đô trưởng / La thứ trong trang, bỏ trùng. */
const kho = await evaluate(`(async () => {
  ${MOD}
  const { transposeSymbol } = await mod('/src/reharm/transpose.ts')
  const out = { 'ca-phao': { truong: [], thu: [] }, 'linh-nhi': { truong: [], thu: [] }, blues: { truong: [], thu: [] } }
  const seen = new Set()
  for (const v of ${JSON.stringify(khoVong())}) {
    const hopAm = v.hopAm.map((c) => transposeSymbol(c, v.dich))
    const key = v.thay + v.che + hopAm.join(' ')
    if (seen.has(key)) continue
    seen.add(key)
    out[v.thay][v.che].push({ hopAm, nguon: 'Nguon.json ' + v.nguon })
  }
  out.blues.truong = [['C7', 'C7', 'C7', 'C7'], ['C7', 'F7', 'C7', 'C7'], ['F7', 'F7', 'C7', 'C7'], ['G7', 'F7', 'C7', 'C7']]
    .map((hopAm) => ({ hopAm, nguon: 'Bộ Soạn Blues — KHUNG trưởng' }))
  out.blues.thu = [['Am7', 'Am7', 'Am7', 'Am7'], ['Am7', 'Dm7', 'Am7', 'Am7'], ['Dm7', 'Dm7', 'Am7', 'Am7'], ['F7', 'E7', 'Am7', 'Am7']]
    .map((hopAm) => ({ hopAm, nguon: 'Bộ Soạn Blues — KHUNG thứ' }))
  return out
})()`)
writeFileSync(join(ROOT, 'src', 'thay', 'vongThay.json'), `${JSON.stringify(kho, null, 1)}\n`)
for (const [thay, che] of Object.entries(kho)) console.log(`kho vòng ${thay}: trưởng ${che.truong.length} · thứ ${che.thu.length}`)

ws.close()
chrome.kill()
await sleep(500)
try { rmSync(profile, { recursive: true, force: true }) } catch { /* Chrome còn giữ tệp — để lại cũng được */ }
console.log(`Xong ${BAI.length} bài → ${OUT}`)
