import { useEffect, useRef, useState } from 'react'
import { startAudio } from '../shared/audio/audioEngine'
import { useMidiStore } from '../shared/midi/midiStore'
import { diemCau, DONG_CHO, SO_CAU_THI, soNotLo, thoiGianRoi } from './soanCau/gameChong'

/*
  MÁY MƯA — phần chung của các game rơi KHÔNG theo nhạc nền: đồng hồ có tạm dừng, sinh viên (tối đa 3, viên sau cách 60 % quãng rơi),
  trượt đáy, chờ đúng nốt (bên luyện), đúng / sai / combo, 20 viên bên thi, rời trang thì tự tạm dừng. Tách nguyên từ Mưa khung nốt
  (GameKhungRoi) 15/10/2026 khi Game chạy ngón (thử) phần 1 cần đúng máy ấy. Mưa hợp âm (GameChong) còn bản riêng (hai tay, thế bấm),
  chưa gộp. Trạng thái nằm trong ref — vòng khung hình của `VungRoi` đọc bản mới nhất.
*/

/** Câu của một viên — đủ để máy chấm, báo lời, và `VungRoi` vẽ. */
export interface CauRoi {
  /** Khóa đếm sai: câu sai quay lại nhiều hơn. */
  id: string
  ten: string
  khungTen: string
  goiY: string
  /** Lời giải sau khi đúng. */
  loi: string
  /** Mẹo khi sai / trượt. */
  meo: string
}
export type VienMua<C extends CauRoi> = C & { khoa: number; sinh: number; roi: number; lan: number }

/** Kỷ lục bên thi theo màn: số đúng và điểm cao nhất. */
export type KyLuc = Record<string, { tot: number; diem: number }>
export const docKyLuc = (kho: string): KyLuc => {
  try {
    const x = JSON.parse(localStorage.getItem(kho) ?? 'null') as KyLuc | null
    if (x && typeof x === 'object') return x
  } catch {
    /* không có bộ nhớ trình duyệt */
  }
  return {}
}
export const ghiKyLuc = (kho: string, x: KyLuc) => {
  try {
    localStorage.setItem(kho, JSON.stringify(x))
  } catch {
    /* bỏ qua */
  }
}
export const capKyLuc = (cu: KyLuc, khoa: string, dung: number, diem: number): KyLuc => ({
  ...cu,
  [khoa]: { tot: Math.max(cu[khoa]?.tot ?? 0, dung), diem: Math.max(cu[khoa]?.diem ?? 0, diem) },
})

/**
 * Mỗi cú bấm xuống (đàn MIDI, phím máy tính, chạm phím) — nghe thẳng kho MIDI, mỗi cú một lần. Đọc `lastEvent` qua React thì bấm bốn nốt
 * cùng lúc React gộp lần vẽ, chỉ đếm được nốt cuối (chạy thử 15/10: "4 nốt" ra "1 nốt").
 */
export function useNotXuong(f: (note: number) => void) {
  const r = useRef(f)
  r.current = f
  useEffect(
    () =>
      useMidiStore.subscribe((s, truoc) => {
        const ev = s.lastEvent
        if (ev && ev !== truoc.lastEvent && ev.velocity > 0) r.current(ev.note)
      }),
    [],
  )
}

export function useMuaRoi<C extends CauRoi>(o: {
  thi: boolean
  choNot: boolean
  /** Giây rơi đang chọn. */
  giay: number
  tao: (sai: ReadonlyMap<string, number>, truoc: string | null) => C
  /** Số phím hé lộ dần (bên luyện) — lộ hết khi viên rơi tới mốc chờ. */
  soLo: (c: C) => number
  /** Lời khi viên dừng chờ đúng nốt. */
  choChu: (c: C) => string
  /** Viên vừa xong — đúng, hay sai / trượt. */
  khiXong?: (c: C, dung: boolean) => void
  /** Xong đủ viên một lượt thi — ghi kỷ lục. */
  khiXongThi: (dung: number, diem: number) => void
}) {
  const [, setVe] = useState(0)
  const ve = () => setVe((k) => k + 1)
  const g = useRef({
    pha: 'chuan-bi' as 'chuan-bi' | 'choi' | 'dung' | 'het',
    vien: [] as VienMua<C>[],
    diem: 0,
    combo: 0,
    dung: 0,
    sai: 0,
    soSinh: 0,
    khoa: 0,
    sinhCuoi: -1e9,
    truoc: null as string | null,
    saiDem: new Map<string, number>(),
    saiCau: [] as C[],
    /** Nốt đã bấm đúng của viên đích (cao độ thật, để sáng phím). */
    daChay: [] as number[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    dongHo: { goc: 0, dung: 0, dungLuc: null as number | null },
    cho: false,
    lo: 0,
  }).current
  const { thi } = o

  function bayGio() {
    return (g.dongHo.dungLuc ?? performance.now()) - g.dongHo.goc - g.dongHo.dung
  }
  function dangDich() {
    return g.vien.reduce<VienMua<C> | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)
  }
  function capDongHo() {
    const dung = g.pha === 'dung' || g.cho
    const now = performance.now()
    if (dung && g.dongHo.dungLuc === null) g.dongHo.dungLuc = now
    if (!dung && g.dongHo.dungLuc !== null) {
      g.dongHo.dung += now - g.dongHo.dungLuc
      g.dongHo.dungLuc = null
    }
  }
  function loCua(v: VienMua<C> | null) {
    return thi || !v ? 0 : soNotLo(Math.min(1, (bayGio() - v.sinh) / v.roi), o.soLo(v))
  }
  async function batDau() {
    await startAudio()
    Object.assign(g, {
      pha: 'choi',
      vien: [],
      diem: 0,
      combo: 0,
      dung: 0,
      sai: 0,
      soSinh: 0,
      sinhCuoi: -1e9,
      truoc: null,
      saiDem: new Map(),
      saiCau: [],
      daChay: [],
      bao: null,
      dongHo: { goc: performance.now(), dung: 0, dungLuc: null },
      cho: false,
      lo: 0,
    })
    ve()
  }
  function sinh() {
    const t = bayGio()
    const cau = o.tao(g.saiDem, g.truoc)
    const dangDung = new Set(g.vien.map((v) => v.lan))
    const trong = [0, 1, 2, 3].filter((l) => !dangDung.has(l))
    const lan = trong[Math.floor(Math.random() * trong.length)] ?? 0
    g.vien = [...g.vien, { ...cau, khoa: ++g.khoa, sinh: t, roi: thoiGianRoi(o.giay), lan }]
    g.soSinh += 1
    g.truoc = cau.id
    g.sinhCuoi = t
    ve()
  }
  function ketThuc() {
    g.pha = 'het'
    if (thi && g.dung + g.sai >= SO_CAU_THI) o.khiXongThi(g.dung, g.diem)
    ve()
  }
  function xongThi() {
    if (thi && g.dung + g.sai >= SO_CAU_THI) ketThuc()
  }
  function boCho() {
    if (!g.cho) return
    g.cho = false
    capDongHo()
  }
  function giai(v: VienMua<C>) {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    const cong = diemCau(g.combo)
    g.diem += cong
    g.combo += 1
    g.dung += 1
    g.daChay = []
    g.bao = { loai: 'dung', chu: `Đúng +${cong} — ${v.loi}` }
    o.khiXong?.(v, true)
    boCho()
    xongThi()
    ve()
  }
  function tinhSai(v: VienMua<C>, loai: 'truot' | 'sai') {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    g.combo = 0
    g.sai += 1
    g.daChay = []
    g.saiDem.set(v.id, (g.saiDem.get(v.id) ?? 0) + 1)
    g.saiCau.push(v)
    g.bao = { loai: 'truot', chu: `${loai === 'truot' ? 'Trượt' : 'Sai'} — ${v.ten}. ${v.meo}` }
    o.khiXong?.(v, false)
    xongThi()
    ve()
  }
  /** Bấm sai: bên thi là mất viên; bên luyện chỉ báo, mất combo. */
  function saiLan(v: VienMua<C>, chu: string) {
    if (thi) return tinhSai(v, 'sai')
    g.combo = 0
    g.bao = { loai: 'sai', chu }
    ve()
  }
  function tick() {
    if (g.pha !== 'choi' || g.cho) return
    const t = bayGio()
    const d = dangDich()
    if (!thi && o.choNot && d && (t - d.sinh) / d.roi >= DONG_CHO) {
      g.cho = true
      capDongHo()
      g.bao = { loai: 'sai', chu: o.choChu(d) }
      ve()
      return
    }
    for (const v of [...g.vien]) {
      if (t - v.sinh >= v.roi) tinhSai(v, 'truot')
      if (g.pha !== 'choi') return
    }
    const conSinh = !thi || g.soSinh < SO_CAU_THI
    if (conSinh && g.vien.length < 3 && (g.vien.length === 0 || t - g.sinhCuoi >= thoiGianRoi(o.giay) * 0.6)) sinh()
    const lo = loCua(dangDich())
    if (lo !== g.lo) {
      g.lo = lo
      ve()
    }
  }
  function tamDung() {
    if (g.pha === 'choi') g.pha = 'dung'
    else if (g.pha === 'dung') g.pha = 'choi'
    capDongHo()
    ve()
  }
  /** Đổi tốc độ giữa chừng: giữ chỗ đang rơi của từng viên. */
  function doiRoi(giay: number) {
    const t = bayGio()
    if (g.pha === 'choi' || g.pha === 'dung')
      for (const v of g.vien) {
        const p = (t - v.sinh) / v.roi
        v.roi = thoiGianRoi(giay)
        v.sinh = t - p * v.roi
      }
  }

  /* Rời tab / ẩn trang thì tự tạm dừng. */
  const tamDungRef = useRef(tamDung)
  tamDungRef.current = tamDung
  useEffect(() => {
    const f = () => {
      if (document.hidden && g.pha === 'choi') tamDungRef.current()
    }
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [g])

  return { g, ve, dich: dangDich(), dangDich, bayGio, tick, batDau, ketThuc, tamDung, doiRoi, giai, saiLan, boCho, loCua }
}
