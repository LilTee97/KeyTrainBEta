import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { giaiDieuDaoLinhNhi } from '../giaiDieuDaoLinhNhi'
import { avoidMelodyClash, soloLeftHand } from '../soloLeftHand'
import { getStyle } from '../styleLibrary'
import { SOLO_RANGE, soloRange } from '../../fillSoloGenerator/soloGenerator'
import type { PitchClass } from '../../../shared/musicTheory/types'
import type { TimelineEvent } from '../types'

/*
  SO BÀI HOA TRINH NỮ (8 câu dạo app) với 3 đoạn dạo giọng trưởng Linh Nhi.

  Vế A: cùng vòng 9 ô, take 0–7, tầm SOLO_RANGE, điệu bolero-linh-nhi-2.
  Vế B: số đo 3 bài (Biển Tình · Đường Xưa · Mùa Xuân), n=141 nốt tuyến tay phải.
  Tra ngược vế B: python tools/sheet/boi_so.py linh-nhi  và script đo 5 trục.

  Không nới ngưỡng. Bài này IN SỐ, không đòi app trùng chị — chênh < 0,20 bội số
  không kết luận được. Kết luận chỉ nói về vòng Hoa Trinh Nữ, không suy ra bộ soạn.
*/

const VONG = 'Cadd2 | Dm11 | Em7 | Fadd2 | G9sus4 | C | Am9 | G9sus4 | G'
const TONIC = 0
const LUOT = 8
const ROM = ['I', 'bII', 'ii', 'bIII', 'iii', 'IV', '#IV', 'V', 'bVI', 'vi', 'bVII', 'vii']
const TEN_BAC = ['1', 'b9', '9', 'b3', '3', '11', 'b5', '5', 'b13', '13', 'b7', '7']
const GAM = [0, 2, 4, 5, 7, 9, 11]

/** Vế B — 3 đoạn dạo trưởng, đo 6/9/2026. */
const CHI = {
  day: 3.09,
  tron: 0.91,
  tam: 75.2,
  maxRh: 91,
  lien: 0.32,
  ba: 0.24,
  q45: 0.13,
  nhay: 0.25,
  lap: 0.06,
  boi: 1.561,
  nho: 0.561,
  rhO: 5.6,
  lhO: 6.8,
  minh: 0.49,
  vong: [
    'Biển Tình  vi iii ii I vi ii iii I',
    'Đường Xưa  IV ii I vi ii V vi',
    'Mùa Xuân   I vi iii V I iii I V',
  ],
}

function bucket(d: number) {
  if (d === 0) return 'lap'
  if (d <= 2) return 'lien'
  if (d <= 4) return 'ba'
  if (d <= 7) return 'q45'
  return 'nhay'
}

function hinh(ms: number[]) {
  if (ms.length < 2) return 'mot'
  let up = 0
  let dn = 0
  for (let i = 1; i < ms.length; i += 1) {
    if (ms[i]! > ms[i - 1]!) up += 1
    else if (ms[i]! < ms[i - 1]!) dn += 1
  }
  const n = ms.length - 1
  if (up / n >= 0.7) return 'len'
  if (dn / n >= 0.7) return 'xuong'
  return 'xen'
}

function moc(ev: readonly TimelineEvent[]) {
  return new Set(ev.map((e) => e.startBeat.toFixed(3)))
}

function soan(take: number, range = SOLO_RANGE) {
  const parsed = parseChordInput(VONG)
  const chords = parsed.chords
  const style = getStyle('bolero-linh-nhi-2')!
  const bar = 4
  const left0 = soloLeftHand({
    chords,
    beatsEach: chords.map(() => bar),
    style,
  })
  const right = giaiDieuDaoLinhNhi({
    left: left0,
    chords,
    beatsPerChord: bar,
    barBeats: bar,
    range,
    tonic: TONIC as PitchClass,
    minor: false,
    take,
    thay: 'linh-nhi',
    doan: 'intro',
  })
  const left = avoidMelodyClash(left0, right)
  const soO = chords.length

  const day = chords.map(
    (ch) => new Set(ch.quality.intervals.map((iv) => ((iv % 12) + 12) % 12)).size,
  )
  const tron = day.filter((n) => n === 3).length / day.length
  const bac = chords.map((ch) => ROM[(((ch.root - TONIC) % 12) + 12) % 12]!)

  const notes = right.map((e) => ({
    o: Math.floor(e.startBeat / bar),
    m: e.notes[0]!,
    t: e.startBeat,
  }))
  const tam = notes.reduce((a, x) => a + x.m, 0) / Math.max(1, notes.length)

  let trung = 0
  let ngau = 0
  const demBac = new Array<number>(12).fill(0)
  for (const { o, m } of notes) {
    const ch = chords[Math.min(chords.length - 1, o)]!
    const pcs = new Set(ch.quality.intervals.map((iv) => (((ch.root + iv) % 12) + 12) % 12))
    if (pcs.has((((m % 12) + 12) % 12))) trung += 1
    let co = 0
    for (const g of GAM) if (pcs.has((((TONIC + g) % 12) + 12) % 12)) co += 1
    ngau += co / 7
    demBac[(((m - ch.root) % 12) + 12) % 12]! += 1
  }
  const buoc = { lien: 0, ba: 0, q45: 0, nhay: 0, lap: 0 }
  for (let i = 1; i < notes.length; i += 1) {
    buoc[bucket(Math.abs(notes[i]!.m - notes[i - 1]!.m))] += 1
  }
  const nBuoc = Math.max(1, notes.length - 1)

  const hinhDem = { len: 0, xuong: 0, xen: 0, mot: 0 }
  const quang: number[] = []
  const rong: number[] = []
  for (let o = 0; o < soO; o += 1) {
    const g = left
      .filter((e) => Math.floor(e.startBeat / bar) === o)
      .sort((a, b) => a.startBeat - b.startBeat)
      .flatMap((e) => [...e.notes].sort((a, b) => a - b))
    hinhDem[hinh(g)] += 1
    if (g.length >= 2) rong.push(Math.max(...g) - Math.min(...g))
    for (let i = 1; i < g.length; i += 1) quang.push(Math.abs(g[i]! - g[i - 1]!))
  }
  const lhMidi = left.flatMap((e) => e.notes)
  const mt = moc(left)
  const mp = moc(right)
  let chung = 0
  for (const t of mt) if (mp.has(t)) chung += 1

  return {
    soO,
    bac: bac.join(' '),
    dayTb: day.reduce((a, n) => a + n, 0) / day.length,
    tron,
    tam,
    minRh: Math.min(...notes.map((x) => x.m)),
    maxRh: Math.max(...notes.map((x) => x.m)),
    nRh: notes.length,
    demBac,
    buoc: {
      lien: buoc.lien / nBuoc,
      ba: buoc.ba / nBuoc,
      q45: buoc.q45 / nBuoc,
      nhay: buoc.nhay / nBuoc,
      lap: buoc.lap / nBuoc,
    },
    boi: ngau === 0 ? 0 : trung / ngau,
    nho: (buoc.lien + buoc.ba) / nBuoc,
    hinh: hinhDem,
    quangTb: quang.length ? quang.reduce((a, n) => a + n, 0) / quang.length : 0,
    lhLo: lhMidi.length ? Math.min(...lhMidi) : 0,
    lhHi: lhMidi.length ? Math.max(...lhMidi) : 0,
    rongTb: rong.length ? rong.reduce((a, n) => a + n, 0) / rong.length : 0,
    rhO: notes.length / soO,
    lhO: mt.size / soO,
    minh: 1 - chung / Math.max(1, mt.size),
    loi: parsed.errors.length,
  }
}

function pct(x: number) {
  return `${(100 * x).toFixed(0)}%`
}

describe('Hoa Trinh Nữ × 8 câu vs dạo trưởng Linh Nhi', () => {
  const parsed = parseChordInput(VONG)
  const cau = Array.from({ length: LUOT }, (_, take) => soan(take))

  it('8 câu, cùng 9 ô, không lỗi đọc hợp âm', () => {
    expect(parsed.errors, JSON.stringify(parsed.errors)).toHaveLength(0)
    expect(parsed.chords).toHaveLength(9)
    expect(cau).toHaveLength(8)
    expect(cau.every((c) => c.nRh > 0)).toBe(true)
  })

  it('IN BẢNG — 8 câu app vs 3 đoạn dạo chị', () => {
    const tb = (f: (c: (typeof cau)[0]) => number) =>
      cau.reduce((a, c) => a + f(c), 0) / cau.length
    const bacGop = new Array<number>(12).fill(0)
    let nBac = 0
    const hinhGop = { len: 0, xuong: 0, xen: 0, mot: 0 }
    for (const c of cau) {
      c.demBac.forEach((n, i) => {
        bacGop[i]! += n
        nBac += n
      })
      ;(Object.keys(hinhGop) as (keyof typeof hinhGop)[]).forEach((k) => {
        hinhGop[k] += c.hinh[k]
      })
    }
    const hangBac = TEN_BAC.map((t, i) =>
      bacGop[i] ? `${t}:${((100 * bacGop[i]!) / nBac).toFixed(0)}%` : '',
    )
      .filter(Boolean)
      .join(' ')

    const dong = (ten: string, app: string, chi: string, ghi: string) =>
      `  ${ten.padEnd(22)} ${app.padEnd(22)} ${chi.padEnd(22)} ${ghi}`

    console.log(
      [
        '',
        `  n app = ${LUOT} câu · ${cau.reduce((a, c) => a + c.nRh, 0)} nốt tuyến  |  n chị = 3 bài · 141 nốt tuyến`,
        `  vòng app: ${cau[0]!.bac}`,
        `  vòng chị: ${CHI.vong.join(' · ')}`,
        '',
        dong('trục', 'Hoa Trinh Nữ 8 câu', 'Linh Nhi 3 dạo trưởng', 'đọc'),
        dong('1 độ dày hợp âm', `${tb((c) => c.dayTb).toFixed(2)} nốt`, `${CHI.day.toFixed(2)} nốt`, 'bảng màu, không phải bộ soạn'),
        dong('1 hợp âm ba trơn', pct(tb((c) => c.tron)), pct(CHI.tron), 'cùng chỗ'),
        dong('2 tâm RH', tb((c) => c.tam).toFixed(1), CHI.tam.toFixed(1), `trần 79; chị 75,3`),
        dong('2 tâm RH trần 84', (Array.from({ length: LUOT }, (_, t) => soan(t, soloRange(true))).reduce((a, c) => a + c.tam, 0) / LUOT).toFixed(1), CHI.tam.toFixed(1), 'cùng 8 câu, chỉ đổi trần'),
        dong('2 RH min–max', `${Math.min(...cau.map((c) => c.minRh))}–${Math.max(...cau.map((c) => c.maxRh))}`, `57–${CHI.maxRh}`, 'trần 79 cắt vật liệu ô'),
        dong('2 bước lien/ba/45/nhảy/lặp', [tb((c) => c.buoc.lien), tb((c) => c.buoc.ba), tb((c) => c.buoc.q45), tb((c) => c.buoc.nhay), tb((c) => c.buoc.lap)].map((x) => (100 * x).toFixed(0)).join('·'), [CHI.lien, CHI.ba, CHI.q45, CHI.nhay, CHI.lap].map((x) => (100 * x).toFixed(0)).join('·'), 'cùng thước'),
        dong('2 bậc vs gốc HA', hangBac, 'xem §9b', ''),
        dong('3 LH hình lên/xuống/xen', `${hinhGop.len}/${hinhGop.xuong}/${hinhGop.xen}`, 'chị: xen 19 / lên 3 / một 3 (n=25 ô)', ''),
        dong('3 LH quãng tb', tb((c) => c.quangTb).toFixed(1), '5.6·6.7·5.4', 'nửa cung giữa nốt rải'),
        dong('3 LH tầm', `${Math.min(...cau.map((c) => c.lhLo))}–${Math.max(...cau.map((c) => c.lhHi))}`, '33–69', ''),
        dong('4 RH nốt/ô', tb((c) => c.rhO).toFixed(1), CHI.rhO.toFixed(1), 'cùng tuyến giai điệu; mọi nốt RH chị = 6,8'),
        dong('4 LH mốc/ô', tb((c) => c.lhO).toFixed(1), CHI.lhO.toFixed(1), 'đoạn dạo trưởng không hãm'),
        dong('4 LH một mình', pct(tb((c) => c.minh)), pct(CHI.minh), 'chị trưởng 49% — khác 41% giọng thứ'),
        dong('5 BỘI SỐ', tb((c) => c.boi).toFixed(3), CHI.boi.toFixed(3), 'ngưỡng phát hiện 0,20'),
        dong('5 bước nhỏ', pct(tb((c) => c.nho)), pct(CHI.nho), 'liền bậc + quãng ba'),
        '',
        '  từng câu app:',
        ...cau.map(
          (c, i) =>
            `    take ${i}: tam ${c.tam.toFixed(1)}  boi ${c.boi.toFixed(2)}  nho ${pct(c.nho)}  RH/ô ${c.rhO.toFixed(1)}  LH/ô ${c.lhO.toFixed(1)}  mình ${pct(c.minh)}  ${c.nRh} nốt`,
        ),
      ].join('\n'),
    )
    expect(cau).toHaveLength(8)
  })
})
