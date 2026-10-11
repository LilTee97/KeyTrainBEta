import { useEffect, useMemo, useRef, useState } from 'react'
import { playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import {
  baiTapNgon,
  cauScale,
  chamNgon,
  NHOM_SCALE,
  ngonArp,
  ngonGam,
  notDung,
  tenNot,
  TOC_DO,
  VONG_5_THU,
  VONG_5_TRUONG,
  type BaiNgon,
  type NhomScale,
  type Tay,
} from './hocSolo/gamNgon'

/*
  Hai game của trang Học Solo — người dùng 11/10/2026: "Hãy thêm Game chạy ngón và Game Scale". NGOẠI LỆ thứ hai của quyết định "không lớp
  game" (KE-HOACH mục 4c; ngoại lệ đầu là Mưa hợp âm, 9/10/2026) — người dùng tự xin. Bấm bằng đàn MIDI, phím máy tính hay bàn phím trên
  màn hình. App không biết ngón nào bấm — số ngón trên phím là hướng dẫn, chấm chỉ theo nốt và thời điểm.
*/

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const pc = (x: number) => ((x % 12) + 12) % 12
const sao = (k: number, tren = 3) => '★'.repeat(k) + '☆'.repeat(Math.max(0, tren - k))

/** Mỗi cú bấm xuống (đàn MIDI, phím máy tính, bàn phím trên màn hình) — kèm thời điểm của chính sự kiện. */
function useNotBam(onNot: (note: number, time: number) => void) {
  const ev = useMidiStore((state) => state.lastEvent)
  const goi = useRef(onNot)
  goi.current = onNot
  useEffect(() => {
    if (ev && ev.velocity > 0) goi.current(ev.note, ev.time)
  }, [ev])
}

/** Bộ nhớ trình duyệt cho kỷ lục — chỉ là tiện, không có vẫn chơi được. */
function docKho<T>(khoa: string, macDinh: T): T {
  try {
    const x = JSON.parse(localStorage.getItem(khoa) ?? 'null') as T | null
    return x ?? macDinh
  } catch {
    return macDinh
  }
}
function ghiKho(khoa: string, x: unknown) {
  try {
    localStorage.setItem(khoa, JSON.stringify(x))
  } catch {
    /* bỏ qua */
  }
}

const nghe = async (notes: readonly number[], giay: number) => {
  await startAudio()
  playChordSequence(
    notes.map((m) => [m]),
    giay,
  )
}

/** Khung bàn phím ôm trọn các nốt: từ Đô dưới nốt thấp nhất tới Đô trên nốt cao nhất. */
const khungPhim = (notes: readonly number[]) => ({
  lowNote: 12 * Math.floor(Math.min(...notes) / 12),
  highNote: 12 * Math.ceil((Math.max(...notes) + 1) / 12),
})

/* ---------------- Game chạy ngón ---------------- */

const KHO_NGON = 'keytrain.chay-ngon.v1'

/**
 * GAME CHẠY NGÓN — năm ngón · gam một quãng tám · rải hợp âm, lên rồi xuống, có số ngón trên phím. Bấm đúng nốt kế thì đi tiếp (sai thì
 * đứng chờ); hết bài chấm ba thứ: đúng bao nhiêu, đều tay (khoảng cách giữa các nốt đều không), và tốc độ so với mục tiêu.
 */
export function GameChayNgon() {
  useLiveSound()
  useComputerKeyboard(60)
  const [tay, setTay] = useState<Tay>('phai')
  const ds = useMemo(() => baiTapNgon(tay), [tay])
  const [chiSo, setChiSo] = useState(0)
  const bai: BaiNgon = ds[Math.min(chiSo, ds.length - 1)]!
  const [muc, setMuc] = useState<number>(TOC_DO[0].nps)
  const [i, setI] = useState(0)
  const [luc, setLuc] = useState<number[]>([])
  const [sai, setSai] = useState(0)
  const [saiNot, setSaiNot] = useState<number | null>(null)
  const [kyLuc, setKyLuc] = useState<Record<string, number>>(() => docKho(KHO_NGON, {}))
  const xong = i >= bai.notes.length
  const kq = xong ? chamNgon(luc, sai, muc) : null

  const lamLai = () => {
    setI(0)
    setLuc([])
    setSai(0)
    setSaiNot(null)
  }
  const chonBai = (k: number) => {
    setChiSo(k)
    lamLai()
  }

  useNotBam((not, t) => {
    if (xong) return
    if (not === bai.notes[i]) {
      setLuc((x) => [...x, t])
      setSaiNot(null)
      const ke = i + 1
      setI(ke)
      if (ke >= bai.notes.length) {
        const k = chamNgon([...luc, t], sai, muc)
        const khoa = `${bai.id}|${muc}`
        if (k.sao > (kyLuc[khoa] ?? 0)) {
          const moi = { ...kyLuc, [khoa]: k.sao }
          setKyLuc(moi)
          ghiKho(KHO_NGON, moi)
        }
      }
    } else if (i > 0) {
      // Bấm sai trước nốt đầu thì không tính — chưa bắt đầu.
      setSai((x) => x + 1)
      setSaiNot(not)
    }
  })

  const ngonCua: Record<number, number> = {}
  bai.notes.forEach((m, k) => {
    ngonCua[m] = bai.ngon[k]!
  })
  const nhom = [...new Set(ds.map((b) => b.nhom))]

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-1 font-semibold text-cream">Game chạy ngón</h3>
        <p className="text-xs text-dim">
          Bấm lần lượt từng nốt theo số ngón trên phím — lên rồi xuống. Bấm đúng thì đi tiếp, sai thì đứng chờ. Hết bài: chấm đúng bao nhiêu,
          đều tay không (khoảng cách giữa các nốt), và nhanh tới đâu so với mục tiêu. Ngón là ngón chuẩn sách piano; app không thấy ngón tay
          bạn — nhìn số mà bấm cho đúng thói quen. Ngưỡng sao là Claude đặt, chưa đo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-dim">Tay:</span>
        {(['phai', 'trai'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTay(t)
              lamLai()
            }}
            className={nut(tay === t)}
          >
            {t === 'phai' ? 'Tay phải' : 'Tay trái'}
          </button>
        ))}
        <span className="ml-2 text-dim">Mục tiêu:</span>
        {TOC_DO.map((x) => (
          <button key={x.nps} type="button" onClick={() => setMuc(x.nps)} className={nut(muc === x.nps)} title={x.mo}>
            {x.ten} · {x.nps} nốt/giây
          </button>
        ))}
        <MidiConnect />
      </div>

      <div className="flex flex-col gap-1.5 text-xs">
        {nhom.map((nh) => (
          <div key={nh} className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">{nh}</span>
            {ds.map((b, k) =>
              b.nhom === nh ? (
                <button key={b.id} type="button" onClick={() => chonBai(k)} className={nut(k === chiSo)}>
                  {b.ten.replace(/^(Năm ngón|Gam|Rải) /, '')}
                  {kyLuc[`${b.id}|${muc}`] ? <span className="ml-1 text-amber-key">{sao(kyLuc[`${b.id}|${muc}`]!)}</span> : null}
                </button>
              ) : null,
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-black/25 p-3">
        <p className="mb-2 font-semibold text-cream">
          {bai.ten} — {tay === 'phai' ? 'tay phải' : 'tay trái'}
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {bai.notes.map((m, k) => (
            <span
              key={k}
              className={`rounded border px-1.5 py-0.5 font-mono text-xs ${
                k < i ? 'border-teal-key/60 text-teal-key' : k === i ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line text-dim'
              }`}
            >
              {tenNot(m, bai.goc, bai.thu)}
              <sup className="ml-0.5">{bai.ngon[k]}</sup>
            </span>
          ))}
        </div>
        <p className="mb-2 text-xs">
          {xong ? (
            <span className="text-teal-key">Xong bài.</span>
          ) : saiNot !== null ? (
            <span className="text-rose-300">
              Sai: {tenNot(saiNot, bai.goc, bai.thu)} — cần {tenNot(bai.notes[i]!, bai.goc, bai.thu)} (ngón {bai.ngon[i]}).
            </span>
          ) : (
            <span className="text-cream/80">
              {i === 0 ? 'Bấm nốt đầu để bắt đầu: ' : 'Tiếp: '}
              <b className="text-amber-key">{tenNot(bai.notes[i]!, bai.goc, bai.thu)}</b> bằng ngón <b className="text-amber-key">{bai.ngon[i]}</b>
            </span>
          )}
        </p>
        <OnScreenPiano
          {...khungPhim(bai.notes)}
          highlightNotes={xong ? [] : [bai.notes[i]!]}
          fingerLabels={ngonCua}
          accidentalStyle={bai.notes.some((m) => tenNot(m, bai.goc, bai.thu).includes('♭')) ? 'flat' : 'sharp'}
        />
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={() => void nghe(bai.notes, 1 / muc)} className={nut(false)}>
            ▶ Nghe mẫu ở tốc độ mục tiêu
          </button>
          <button type="button" onClick={lamLai} className={nut(false)}>
            Làm lại
          </button>
          {xong && chiSo + 1 < ds.length && (
            <button type="button" onClick={() => chonBai(chiSo + 1)} className={nut(false)}>
              Bài tiếp →
            </button>
          )}
        </div>
        {kq && (
          <div className="mt-3 rounded-lg border border-line/60 p-3 text-xs">
            <p className="text-lg text-amber-key">{sao(kq.sao)}</p>
            <p className="text-cream/85">
              Đúng {kq.dung}/{kq.dung + kq.sai} cú ({Math.round(kq.chinhXac * 100)} %) · đều tay: lệch {kq.lech === null ? '—' : `${Math.round(kq.lech * 100)} %`} · tốc độ{' '}
              {kq.tocDo === null ? '—' : `${kq.tocDo.toFixed(1).replace('.', ',')} nốt/giây`} (mục tiêu {muc}).
            </p>
            <p className="mt-1 text-dim">
              {kq.sao === 3
                ? 'Đều và đủ nhanh — lên mục tiêu kế tiếp.'
                : kq.chinhXac < 0.9
                  ? 'Còn sai nốt: chậm lại, nhìn số ngón, đánh đúng trước rồi mới nhanh.'
                  : kq.lech !== null && kq.lech > 0.35
                    ? 'Đúng nốt rồi nhưng chưa đều: đếm thầm "một – hai – ba – bốn", mỗi nốt một tiếng đếm; chỗ luồn ngón cái hay bị hụt nhịp.'
                    : 'Đúng và khá đều — tăng tốc dần tới mục tiêu.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- Game Scale ---------------- */

const KHO_SCALE = 'keytrain.game-scale.v1'
const SO_CAU = 10

/** Xáo 12 gốc — mỗi lượt chơi một thứ tự. */
const xao = () => {
  const x = Array.from({ length: 12 }, (_, k) => k)
  for (let k = x.length - 1; k > 0; k -= 1) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[x[k], x[j]] = [x[j]!, x[k]!]
  }
  return x
}

/**
 * GAME SCALE — đố gam: app gọi tên một gam (hay hợp âm rải), bạn bấm đi lên một quãng tám, từ nốt gốc ở quãng tám nào cũng được. Mười câu
 * một lượt; gợi ý hiện nốt, hiện ngón, nghe mẫu — bật khi cần. Sao mỗi câu: 3★ không sai và trong khoảng 1,2 giây mỗi nốt; 2★ sai ≤ 1;
 * còn lại 1★ (ngưỡng Claude đặt, chưa đo).
 */
export function GameScale() {
  useLiveSound()
  useComputerKeyboard(60)
  const [nhom, setNhom] = useState<NhomScale>('truong')
  const [ngauNhien, setNgauNhien] = useState(false)
  const [thuTu, setThuTu] = useState<number[]>(() => xao())
  const [cau, setCau] = useState(0)
  const [daBam, setDaBam] = useState<number[]>([])
  const [sai, setSai] = useState(0)
  const [batDau, setBatDau] = useState<number | null>(null)
  const [saiNot, setSaiNot] = useState<number | null>(null)
  const [ketQua, setKetQua] = useState<{ ten: string; sao: number; giay: number; sai: number }[]>([])
  const [hienNot, setHienNot] = useState(false)
  const [hienNgon, setHienNgon] = useState(false)
  const [kyLuc, setKyLuc] = useState<Record<string, number>>(() => docKho(KHO_SCALE, {}))

  const vong = nhom === 'thu' || nhom === 'thu-hoa-thanh' || nhom === 'ngu-cung-thu' || nhom === 'blues' || nhom === 'arp-thu' ? VONG_5_THU : VONG_5_TRUONG
  const het = cau >= SO_CAU
  const goc = (ngauNhien ? thuTu : vong)[cau % 12]!
  const c = cauScale(nhom, goc)
  const tongSao = ketQua.reduce((a, x) => a + x.sao, 0)

  const choiLai = (n: NhomScale = nhom) => {
    setNhom(n)
    setThuTu(xao())
    setCau(0)
    setDaBam([])
    setSai(0)
    setBatDau(null)
    setSaiNot(null)
    setKetQua([])
  }

  useNotBam((not, t) => {
    if (het) return
    if (notDung(c, daBam, not)) {
      const moi = [...daBam, not]
      const bd = batDau ?? t
      if (batDau === null) setBatDau(t)
      setSaiNot(null)
      if (moi.length < c.iv.length) {
        setDaBam(moi)
        return
      }
      const giay = (t - bd) / 1000
      const s = sai === 0 && giay <= 1.2 * c.iv.length ? 3 : sai <= 1 ? 2 : 1
      const kq = [...ketQua, { ten: c.ten, sao: s, giay, sai }]
      setKetQua(kq)
      setCau(cau + 1)
      setDaBam([])
      setSai(0)
      setBatDau(null)
      if (cau + 1 >= SO_CAU) {
        const tong = kq.reduce((a, x) => a + x.sao, 0)
        if (tong > (kyLuc[nhom] ?? 0)) {
          const moi = { ...kyLuc, [nhom]: tong }
          setKyLuc(moi)
          ghiKho(KHO_SCALE, moi)
        }
      }
    } else if (daBam.length > 0 || pc(not) !== c.goc) {
      setSai((x) => x + 1)
      setSaiNot(not)
    }
  })

  const dau = daBam[0] ?? 60 + c.goc
  const notMau = c.iv.map((x) => dau + x)
  const ngon = !hienNgon
    ? null
    : nhom === 'arp-truong' || nhom === 'arp-thu'
      ? ngonArp(nhom === 'arp-thu' ? 'thu' : 'truong', c.goc, 'phai')
      : ngonGam(nhom, c.goc, 'phai')
  const ngonCua: Record<number, number> = {}
  if (ngon) notMau.forEach((m, k) => (ngonCua[m] = ngon[k]!))

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-1 font-semibold text-cream">Game Scale — đố gam</h3>
        <p className="text-xs text-dim">
          App gọi tên một gam (hay một hợp âm rải), bạn bấm đi lên một quãng tám — từ nốt gốc ở quãng tám nào cũng được. Mười câu một lượt,
          gốc đi theo vòng quãng năm (ít dấu hóa trước) hay ngẫu nhiên. Bí thì bật gợi ý. Sao mỗi câu: 3★ không sai và trong khoảng 1,2 giây
          mỗi nốt · 2★ sai một lần · 1★ còn lại — ngưỡng Claude đặt, chưa đo.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {NHOM_SCALE.map((x) => (
          <button key={x.id} type="button" onClick={() => choiLai(x.id)} className={nut(nhom === x.id)}>
            {x.ten}
            {kyLuc[x.id] ? <span className="ml-1 text-amber-key">{kyLuc[x.id]}★</span> : null}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setNgauNhien((x) => !x)
            choiLai()
          }}
          className={nut(ngauNhien)}
        >
          {ngauNhien ? 'Gốc ngẫu nhiên' : 'Gốc theo vòng quãng năm'}
        </button>
        <button type="button" onClick={() => setHienNot((x) => !x)} className={nut(hienNot)}>
          Gợi ý: hiện nốt
        </button>
        <button type="button" onClick={() => setHienNgon((x) => !x)} className={nut(hienNgon)}>
          Gợi ý: hiện ngón (tay phải)
        </button>
        <button type="button" onClick={() => void nghe(notMau, 0.35)} className={nut(false)} disabled={het}>
          ▶ Nghe mẫu
        </button>
        <MidiConnect />
      </div>

      <div className="rounded-xl border border-line bg-black/25 p-3">
        {het ? (
          <div>
            <p className="text-lg text-amber-key">
              Xong lượt: {tongSao}/{SO_CAU * 3} ★
            </p>
            <ul className="mt-1 text-xs text-cream/80">
              {ketQua.map((x, k) => (
                <li key={k}>
                  {k + 1}. {x.ten} — {sao(x.sao)} · {x.giay.toFixed(1).replace('.', ',')} giây{x.sai ? ` · sai ${x.sai}` : ''}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => choiLai()} className={`${nut(false)} mt-2`}>
              Chơi lại
            </button>
          </div>
        ) : (
          <>
            <p className="mb-1 text-xs text-dim">
              Câu {cau + 1}/{SO_CAU} · {tongSao} ★
            </p>
            <p className="mb-2 text-lg text-cream">
              Bấm: <b className="text-amber-key">{c.ten}</b> <span className="text-sm text-dim">— đi lên {c.iv.length} nốt</span>
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {c.iv.map((_, k) => (
                <span
                  key={k}
                  className={`rounded border px-2 py-0.5 font-mono text-xs ${k < daBam.length ? 'border-teal-key/60 text-teal-key' : 'border-line text-dim'}`}
                >
                  {k < daBam.length ? tenNot(daBam[k]!, c.goc, c.thu) : k + 1}
                </span>
              ))}
            </div>
            {saiNot !== null && (
              <p className="mb-2 text-xs text-rose-300">
                {tenNot(saiNot, c.goc, c.thu)} chưa đúng{daBam.length === 0 ? ` — gam bắt đầu từ ${tenNot(c.goc, c.goc, c.thu)}` : ''}.
              </p>
            )}
            {hienNgon && !ngon && <p className="mb-2 text-xs text-dim">Gam này chưa có ngón chuẩn trong app — giữ ngón cái ở phím trắng.</p>}
            <OnScreenPiano
              lowNote={48}
              highNote={84}
              highlightNotes={hienNot ? notMau : []}
              fingerLabels={ngon ? ngonCua : undefined}
              accidentalStyle={c.ten.includes('♭') || notMau.some((m) => tenNot(m, c.goc, c.thu).includes('♭')) ? 'flat' : 'sharp'}
            />
          </>
        )}
      </div>
    </div>
  )
}
