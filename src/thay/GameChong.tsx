import { useEffect, useRef, useState } from 'react'
import { playChord, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import { cachTimTayPhai } from './soanCau/chongHopAm'
import {
  chonCau,
  DAT_MAN,
  diemCau,
  dungHaiTay,
  dungTayPhai,
  GOC_CHOI,
  kieuGoc,
  luaChonTen,
  MAN,
  soCanCham,
  thoiGianRoi,
  type CachNhap,
  type CauGame,
  type DoKho,
  type GocChoi,
} from './soanCau/gameChong'
import { GOC } from './vongThay'

interface Vien extends CauGame {
  khoa: number
  /** Lúc sinh, theo đồng hồ game (mili giây, trừ lúc tạm dừng). */
  sinh: number
  roi: number
  lan: number
  luaChon: string[]
}
type Pha = 'chuan-bi' | 'choi' | 'dung' | 'het'

const pc = (x: number) => ((x % 12) + 12) % 12
const KHO = 'keytrain.mua-hop-am.v1'
interface Luu {
  best: Record<string, number>
  mo: number
}
const docLuu = (): Luu => {
  try {
    const x = JSON.parse(localStorage.getItem(KHO) ?? 'null') as Luu | null
    if (x && typeof x.mo === 'number' && x.best) return x
  } catch {
    /* không có bộ nhớ trình duyệt thì chơi từ màn 1 */
  }
  return { best: {}, mo: 0 }
}
const ghiLuu = (x: Luu) => {
  try {
    localStorage.setItem(KHO, JSON.stringify(x))
  } catch {
    /* bỏ qua — kỷ lục chỉ là tiện */
  }
}

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/80 hover:bg-white/8'}`
const DO_KHO: readonly { id: DoKho; ten: string; mo: string }[] = [
  { id: 'de', ten: 'Dễ', mo: 'gợi ý vị trí + chất, khung tay trái sáng, rơi chậm' },
  { id: 'vua', ten: 'Vừa', mo: 'chỉ khung tay trái sáng' },
  { id: 'kho', ten: 'Khó', mo: 'không gợi ý — bấm cả hai tay' },
]
const GOC_TEN: readonly { id: GocChoi; ten: string }[] = [
  { id: 'do', ten: 'Chỉ gốc Đô' },
  { id: 'trang', ten: 'Gốc phím trắng' },
  { id: 'tat', ten: 'Cả 12 gốc' },
]
const NHAP: readonly { id: CachNhap; ten: string; mo: string }[] = [
  { id: 'giu', ten: 'Giữ hợp âm', mo: 'đàn MIDI · phím máy tính · nhiều ngón cùng lúc' },
  { id: 'cham', ten: 'Chạm từng nốt', mo: 'chuột · cảm ứng — chạm đủ nốt là chấm' },
  { id: 'chon', ten: 'Chọn tên', mo: 'bốn nút to — hợp điện thoại' },
]

/**
 * GAME "MƯA HỢP ÂM" — học thuộc 26 công thức chồng bằng tay (người dùng 9/10/2026: "hãy phá lệ làm game cho phần học thuộc công thức
 * chồng hợp âm này"). Tên hợp âm rơi xuống; viên viền cam là viên đang đố — bàn phím sáng khung tay trái, bấm hợp âm ba tay phải đúng
 * công thức trước khi viên chạm đáy. Điểm · combo · 3 mạng · nhanh dần · 6 màn theo quy luật 1 (đạt 100 điểm mở màn sau) · công thức
 * hay sai rơi lại nhiều hơn. Nhập: giữ hợp âm (MIDI, phím máy tính), chạm từng nốt (chuột, cảm ứng), chọn tên (điện thoại).
 */
export function GameChong() {
  useLiveSound()
  useComputerKeyboard(60)
  const held = useMidiStore((state) => state.heldNotes)
  const suKien = useMidiStore((state) => state.lastEvent)
  const [luu, setLuu] = useState(docLuu)
  const [man, setMan] = useState(0)
  const [doKho, setDoKho] = useState<DoKho>('de')
  const [gocChoi, setGocChoi] = useState<GocChoi>('trang')
  const [nhap, setNhap] = useState<CachNhap>(() => (useMidiStore.getState().devices.length > 0 ? 'giu' : 'cham'))
  const [, setVe] = useState(0)
  const ve = () => setVe((k) => k + 1)
  /* Trạng thái game giữ trong ref: vòng khung hình (requestAnimationFrame) đọc bản mới nhất, không dính giá trị cũ của state. */
  const g = useRef({
    pha: 'chuan-bi' as Pha,
    vien: [] as Vien[],
    diem: 0,
    combo: 0,
    mang: 3,
    daDung: 0,
    truot: 0,
    khoa: 0,
    sinhCuoi: -1e9,
    truoc: null as string | null,
    sai: new Map<string, number>(),
    saiCau: [] as CauGame[],
    chon: [] as number[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    dongHo: { goc: 0, dung: 0, dungLuc: null as number | null },
  }).current
  const haiTay = doKho === 'kho'
  const dich = g.vien.reduce<Vien | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)

  function bayGio() {
    return (g.dongHo.dungLuc ?? performance.now()) - g.dongHo.goc - g.dongHo.dung
  }
  function dangDich() {
    return g.vien.reduce<Vien | null>((a, v) => (!a || v.sinh < a.sinh ? v : a), null)
  }
  function loiCau(v: CauGame) {
    return `${v.chong.nhan.tong} = ${v.chong.nhan.trai} + ${v.chong.nhan.phai} (${v.goiY.replace('tay phải ', '')})`
  }
  async function batDau() {
    await startAudio()
    Object.assign(g, {
      pha: 'choi',
      vien: [],
      diem: 0,
      combo: 0,
      mang: 3,
      daDung: 0,
      truot: 0,
      sinhCuoi: -1e9,
      truoc: null,
      sai: new Map(),
      saiCau: [],
      chon: [],
      bao: null,
      dongHo: { goc: performance.now(), dung: 0, dungLuc: null },
    })
    ve()
  }
  function sinh() {
    const t = bayGio()
    const cau = chonCau(MAN[man]!.ct, GOC_CHOI[gocChoi], g.sai, g.truoc)
    const dangDung = new Set(g.vien.map((v) => v.lan))
    const trong = [0, 1, 2, 3].filter((l) => !dangDung.has(l))
    const lan = trong[Math.floor(Math.random() * trong.length)] ?? 0
    g.vien = [...g.vien, { ...cau, khoa: ++g.khoa, sinh: t, roi: thoiGianRoi(doKho, g.daDung), lan, luaChon: luaChonTen(cau) }]
    g.truoc = cau.ct.id
    g.sinhCuoi = t
    ve()
  }
  function giai(v: Vien) {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    const cong = diemCau(g.combo)
    g.diem += cong
    g.combo += 1
    g.daDung += 1
    g.chon = []
    g.bao = { loai: 'dung', chu: `Đúng +${cong} — ${loiCau(v)}` }
    playChord([...v.chong.trai, ...v.chong.phai], '2n')
    ve()
  }
  function ketThuc() {
    g.pha = 'het'
    const k = `${man}|${doKho}`
    setLuu((cu) => {
      const moi = { best: { ...cu.best, [k]: Math.max(cu.best[k] ?? 0, g.diem) }, mo: g.diem >= DAT_MAN ? Math.max(cu.mo, man + 1) : cu.mo }
      ghiLuu(moi)
      return moi
    })
    ve()
  }
  function truot(v: Vien) {
    g.vien = g.vien.filter((x) => x.khoa !== v.khoa)
    g.mang -= 1
    g.combo = 0
    g.truot += 1
    g.chon = []
    g.sai.set(v.ct.id, (g.sai.get(v.ct.id) ?? 0) + 1)
    g.saiCau.push(v)
    g.bao = { loai: 'truot', chu: `Trượt — ${loiCau(v)}. ${cachTimTayPhai(v.ct, GOC[v.g]!, kieuGoc(v.g))}` }
    if (g.mang <= 0) ketThuc()
    ve()
  }
  function saiLan() {
    g.combo = 0
    g.chon = []
    g.bao = { loai: 'sai', chu: 'Chưa đúng — chọn lại (combo về 0)' }
    ve()
  }
  function tick() {
    if (g.pha !== 'choi') return
    const t = bayGio()
    for (const v of [...g.vien]) {
      if (t - v.sinh >= v.roi) truot(v)
      if (g.pha !== 'choi') return
    }
    if (g.vien.length < 4 && (g.vien.length === 0 || t - g.sinhCuoi >= thoiGianRoi(doKho, g.daDung) * 0.6)) sinh()
  }
  function tamDung() {
    if (g.pha === 'choi') {
      g.pha = 'dung'
      g.dongHo.dungLuc = performance.now()
    } else if (g.pha === 'dung') {
      g.dongHo.dung += performance.now() - (g.dongHo.dungLuc ?? performance.now())
      g.dongHo.dungLuc = null
      g.pha = 'choi'
    }
    ve()
  }
  function chonTen(ten: string) {
    const v = dangDich()
    if (g.pha !== 'choi' || !v) return
    if (ten === v.chong.nhan.phai) giai(v)
    else saiLan()
  }

  /* Rời tab / ẩn trang thì tự tạm dừng — quay lại không bị mất mạng oan. */
  const tamDungRef = useRef(tamDung)
  tamDungRef.current = tamDung
  useEffect(() => {
    const f = () => {
      if (document.hidden && g.pha === 'choi') tamDungRef.current()
    }
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [g])

  /* Giữ hợp âm: đàn MIDI, phím máy tính, nhiều ngón trên cảm ứng — đúng là ăn ngay. */
  const xuLyGiu = useRef<(ns: readonly number[]) => void>(() => {})
  xuLyGiu.current = (ns) => {
    const v = dangDich()
    if (nhap !== 'giu' || g.pha !== 'choi' || !v) return
    if ((haiTay ? dungHaiTay : dungTayPhai)(ns, v.chong)) giai(v)
  }
  useEffect(() => xuLyGiu.current(held), [held])

  /* Chạm từng nốt: mỗi cú chạm (chuột, cảm ứng, phím máy tính) bật / tắt một nốt; chạm đủ số nốt mà chưa đúng là sai. */
  const xuLyCham = useRef<(note: number) => void>(() => {})
  xuLyCham.current = (note) => {
    const v = dangDich()
    if (nhap !== 'cham' || g.pha !== 'choi' || !v) return
    g.chon = g.chon.includes(note) ? g.chon.filter((m) => m !== note) : [...g.chon, note]
    if ((haiTay ? dungHaiTay : dungTayPhai)(g.chon, v.chong)) giai(v)
    else if (new Set(g.chon.map(pc)).size >= soCanCham(v.chong, haiTay)) saiLan()
    else ve()
  }
  useEffect(() => {
    if (suKien && suKien.velocity > 0 && suKien.source === 'onscreen') xuLyCham.current(suKien.note)
  }, [suKien])

  const hep = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  const thap = hep ? 48 : 36
  const cao = hep ? 72 : 84
  const khungSang = dich && !haiTay ? dich.chong.trai.map((m) => (m < thap ? m + 12 * Math.ceil((thap - m) / 12) : m)) : []
  const best = (k: number) => luu.best[`${k}|${doKho}`] ?? 0

  if (g.pha === 'chuan-bi' || g.pha === 'het')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h4 className="text-lg font-semibold text-cream">Mưa hợp âm — game học thuộc công thức chồng</h4>
        {g.pha === 'het' && (
          <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
            <p className="text-base text-cream">
              {g.mang <= 0 ? 'Hết mạng' : 'Dừng'} — <b className="text-amber-key">{g.diem} điểm</b> · đúng {g.daDung} · trượt {g.truot} · kỷ lục màn này{' '}
              {best(man)}
            </p>
            {g.diem >= DAT_MAN && man < MAN.length - 1 && <p className="mt-1 text-teal-key">Đạt {DAT_MAN} điểm — đã mở màn {man + 2}: {MAN[man + 1]!.ten}!</p>}
            {g.saiCau.length > 0 && (
              <div className="mt-2 text-xs text-cream/85">
                <p className="mb-1 text-dim">Công thức cần ôn (vừa trượt):</p>
                <ul className="flex flex-col gap-1">
                  {[...new Map(g.saiCau.map((v) => [`${v.ct.id}${v.g}`, v])).values()].map((v) => (
                    <li key={`${v.ct.id}${v.g}`}>
                      <b className="font-mono text-cream">{loiCau(v)}</b>
                      <span className="block text-dim">{cachTimTayPhai(v.ct, GOC[v.g]!, kieuGoc(v.g))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-dim">
          Tên hợp âm rơi xuống. Viên viền cam là viên đang đố: bàn phím sáng khung tay trái (xanh) — bấm hợp âm ba tay phải đúng công thức trước khi
          viên chạm đáy. Đúng: cộng điểm, nối combo (5 câu liền nhân đôi). Trượt: mất một mạng và hiện công thức đúng. Công thức hay sai rơi lại
          nhiều hơn. Đạt {DAT_MAN} điểm mở màn sau. Bảng công thức ở tab Chồng hợp âm.
        </p>
        <div>
          <p className="mb-1 text-xs text-dim">Màn</p>
          <div className="flex flex-wrap gap-1.5">
            {MAN.map((m, k) => (
              <button key={m.ten} type="button" disabled={k > luu.mo} onClick={() => setMan(k)} className={nut(man === k)} title={m.goiY}>
                {k > luu.mo ? '🔒 ' : ''}
                {k + 1}. {m.ten}
                {best(k) > 0 && <span className="ml-1 text-[11px] text-dim">· {best(k)}</span>}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-dim">
            Màn {man + 1}: {MAN[man]!.goiY} ({MAN[man]!.ct.length} công thức)
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="mb-1 text-xs text-dim">Độ khó</p>
            <div className="flex flex-wrap gap-1.5">
              {DO_KHO.map((x) => (
                <button key={x.id} type="button" onClick={() => setDoKho(x.id)} className={nut(doKho === x.id)} title={x.mo}>
                  {x.ten}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-dim">{DO_KHO.find((x) => x.id === doKho)!.mo}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-dim">Gốc</p>
            <div className="flex flex-wrap gap-1.5">
              {GOC_TEN.map((x) => (
                <button key={x.id} type="button" onClick={() => setGocChoi(x.id)} className={nut(gocChoi === x.id)}>
                  {x.ten}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-dim">Cách nhập</p>
            <div className="flex flex-wrap gap-1.5">
              {NHAP.map((x) => (
                <button key={x.id} type="button" onClick={() => setNhap(x.id)} className={nut(nhap === x.id)} title={x.mo}>
                  {x.ten}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-dim">{NHAP.find((x) => x.id === nhap)!.mo}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void batDau()}
          className="self-start rounded-xl border border-amber-key bg-amber-key/20 px-6 py-3 text-base font-semibold text-amber-key hover:bg-amber-key/30"
        >
          {g.pha === 'het' ? 'Chơi lại' : 'Bắt đầu'}
        </button>
        <MidiConnect />
      </div>
    )

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/25 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-cream">
          Điểm <b className="font-mono text-lg text-amber-key">{g.diem}</b>
        </span>
        <span className="text-cream">
          Combo <b className="font-mono text-lg text-teal-key">×{g.combo}</b>
        </span>
        <span className="text-lg text-rose-300" aria-label={`${g.mang} mạng`}>
          {'♥'.repeat(Math.max(0, g.mang))}
          <span className="text-dim">{'♡'.repeat(Math.max(0, 3 - g.mang))}</span>
        </span>
        <span className="text-xs text-dim">
          Màn {man + 1} · {MAN[man]!.ten} · {DO_KHO.find((x) => x.id === doKho)!.ten}
        </span>
        <span className="ml-auto flex gap-1.5">
          <button type="button" onClick={tamDung} className={nut(false)}>
            {g.pha === 'dung' ? 'Tiếp tục' : 'Tạm dừng'}
          </button>
          <button type="button" onClick={ketThuc} className={nut(false)}>
            Dừng
          </button>
        </span>
      </div>

      <VungRoi vien={g.vien} dich={dich} bayGio={bayGio} tick={tick} chay={g.pha === 'choi'} doKho={doKho} />

      <p
        className={`min-h-10 text-sm ${g.bao?.loai === 'dung' ? 'text-teal-key' : g.bao?.loai === 'truot' ? 'text-rose-300' : 'text-amber-key'}`}
        aria-live="polite"
      >
        {g.pha === 'dung' ? 'Đang tạm dừng.' : (g.bao?.chu ?? 'Viên viền cam đang đố — bấm tay phải của nó.')}
      </p>

      {nhap === 'chon' && dich && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dich.luaChon.map((ten) => (
            <button
              key={ten}
              type="button"
              onClick={() => chonTen(ten)}
              className="min-h-12 rounded-xl border border-line bg-white/6 font-mono text-lg text-cream hover:bg-white/12 active:bg-amber-key/20"
            >
              {ten}
            </button>
          ))}
        </div>
      )}
      <OnScreenPiano lowNote={thap} highNote={cao} leftHandNotes={khungSang} rightHandNotes={nhap === 'cham' ? g.chon : []} />
      <p className="text-xs text-dim">
        {nhap === 'giu'
          ? 'Giữ cả hợp âm cùng lúc (đàn MIDI, phím máy tính) — quãng tám nào, thế đảo nào cũng được.'
          : nhap === 'cham'
            ? `Chạm từng nốt (sáng cam là đã chọn, chạm lại để bỏ) — đủ ${dich ? soCanCham(dich.chong, haiTay) : 3} nốt là chấm.`
            : 'Chọn tên hợp âm tay phải ở bốn nút trên — bàn phím sáng khung tay trái để nhìn.'}
        {haiTay && ' Độ khó Khó: bấm cả hai tay, nốt thấp nhất là gốc.'}
      </p>
      <MidiConnect />
    </div>
  )
}

/** Vùng mưa: tự vẽ lại mỗi khung hình (chỉ vùng này), gọi `tick` để game xét trượt / sinh viên mới. */
function VungRoi({ vien, dich, bayGio, tick, chay, doKho }: { vien: readonly Vien[]; dich: Vien | null; bayGio: () => number; tick: () => void; chay: boolean; doKho: DoKho }) {
  const [, setKhung] = useState(0)
  const tickRef = useRef(tick)
  tickRef.current = tick
  useEffect(() => {
    if (!chay) return
    let id = 0
    const vong = () => {
      tickRef.current()
      setKhung((k) => (k + 1) % 1_000_000)
      id = requestAnimationFrame(vong)
    }
    id = requestAnimationFrame(vong)
    return () => cancelAnimationFrame(id)
  }, [chay])
  const t = bayGio()
  return (
    <div className="relative h-[42vh] min-h-64 overflow-hidden rounded-xl border border-line bg-black/40">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-rose-500/25 to-transparent" />
      {vien.map((v) => {
        const p = Math.min(1, Math.max(0, (t - v.sinh) / v.roi))
        const laDich = v === dich
        return (
          <div
            key={v.khoa}
            className={`absolute w-[23%] rounded-lg border px-1 py-1.5 text-center ${laDich ? 'border-amber-key bg-amber-key/20 shadow-[0_0_14px_rgba(245,166,35,0.35)]' : 'border-line bg-white/6 opacity-80'}`}
            style={{ left: `${v.lan * 25 + 1}%`, top: `calc(${p * 100}% - ${p * 84}px)` }}
          >
            <p className="font-mono text-lg font-bold text-cream sm:text-2xl">{v.chong.nhan.tong}</p>
            {doKho !== 'kho' && <p className="text-[10px] leading-tight text-cream/75 sm:text-[11px]">khung {v.chong.nhan.trai}</p>}
            {doKho === 'de' && <p className="text-[10px] leading-tight text-amber-key sm:text-[11px]">{v.goiY.replace('tay phải ', '')}</p>}
          </div>
        )
      })}
    </div>
  )
}
