import { useEffect, useMemo, useRef, useState } from 'react'
import { NoteGatedPractice } from '../reharm/playback/NoteGatedPractice'
import { TimedPractice } from '../reharm/playback/TimedPractice'
import { playChordSequence, startAudio, stopTimelineLoop } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import {
  baiChayDon,
  baiChayVong,
  baiTapNgon,
  cauScale,
  KIEU_CHAY,
  lapLai,
  NHOM_SCALE,
  ngonArp,
  ngonGam,
  notDung,
  saoChoDung,
  saoTheoNhip,
  tenNot,
  VONG_5_THU,
  VONG_5_TRUONG,
  type KieuChay,
  type NhomScale,
  type Tay,
} from './hocSolo/gamNgon'
import { vongLyThuyetHop } from './soanCau/thayTrongVong'
import { GOC } from './vongThay'

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

/* ---------------- Game chạy ngón ---------------- */

const KHO_NGON = 'keytrain.chay-ngon.v2'
const NHIP = [50, 60, 80, 100] as const

/**
 * GAME CHẠY NGÓN — khung nốt rơi của app (như tab Điệu): nốt rơi xuống bàn phím, khối nốt ghi số ngón; máy chơi tay kia làm backing.
 * Hai phần (người dùng 11/10/2026): HỢP ÂM RIÊNG LẺ — năm ngón · gam · rải trên một hợp âm; THEO VÒNG HỢP ÂM — vòng có backing, hợp âm nào
 * rơi xuống thì chạy nốt của hợp âm ấy cho khớp nhịp. Hai chế độ: chờ đánh đúng (đứng chờ tới khi bấm đúng) · theo nhịp (chấm trúng nốt và
 * lệch mili giây — lượt ghi vào LuyenTap.json như mọi lượt tập theo nhịp). Sao lưu ở bộ nhớ trình duyệt.
 */
export function GameChayNgon() {
  const [phan, setPhan] = useState<'don' | 'vong'>('don')
  const [cheDo, setCheDo] = useState<'cho' | 'nhip'>('cho')
  const [bpm, setBpm] = useState<number>(60)
  const [tay, setTay] = useState<Tay>('phai')
  const ds = useMemo(() => baiTapNgon(tay), [tay])
  const [chiSo, setChiSo] = useState(0)
  const [tonic, setTonic] = useState(0)
  const [thu, setThu] = useState(false)
  const vongs = useMemo(() => vongLyThuyetHop(tonic, thu), [tonic, thu])
  const [vongId, setVongId] = useState<string | null>(null)
  const vong = vongs.find((x) => x.id === vongId) ?? vongs[0]!
  const [kieu, setKieu] = useState<KieuChay>('nam-ngon')
  const [kyLuc, setKyLuc] = useState<Record<string, number>>(() => docKho(KHO_NGON, {}))

  const bai = useMemo(
    () => (phan === 'don' ? baiChayDon(ds[Math.min(chiSo, ds.length - 1)]!) : baiChayVong(vong.hop, tonic, thu, kieu, vong.id)),
    [phan, ds, chiSo, vong, tonic, thu, kieu],
  )
  const khoa = `${bai.id}|${cheDo}`
  const timelineNhip = useMemo(() => (phan === 'vong' ? lapLai(bai.timeline, bai.perBeat.length, 2) : bai.timeline), [bai, phan])
  const ghiSao = (s: number) => {
    setKyLuc((cu) => {
      if (s <= (cu[khoa] ?? 0)) return cu
      const moi = { ...cu, [khoa]: s }
      ghiKho(KHO_NGON, moi)
      return moi
    })
  }
  const doi = (f: () => void) => {
    stopTimelineLoop()
    f()
  }
  const saoCua = (id: string) => kyLuc[`${id}|${cheDo}`]
  const nhom = [...new Set(ds.map((x) => x.nhom))]

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="rounded-xl border border-line bg-black/25 p-4">
        <h3 className="mb-1 font-semibold text-cream">Game chạy ngón</h3>
        <p className="text-xs text-dim">
          Nốt rơi xuống bàn phím, số trên khối nốt là ngón. Máy chơi tay kia làm backing. <b>Chờ đúng nốt</b>: mọi thứ đứng chờ tới khi bạn bấm
          đúng — bấm đúng nốt nào thì máy đánh luôn phần đệm của chỗ ấy. <b>Theo nhịp</b>: có đếm vào, backing chạy liên tục, hết lượt chấm
          trúng bao nhiêu nốt và lệch bao nhiêu mili giây. Ngón là ngón
          chuẩn sách piano; app không thấy ngón tay — nhìn số mà bấm cho đúng thói quen. Ngưỡng sao là Claude đặt, chưa đo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {(
          [
            ['don', 'Hợp âm riêng lẻ'],
            ['vong', 'Theo vòng hợp âm'],
          ] as const
        ).map(([v, ten]) => (
          <button key={v} type="button" onClick={() => doi(() => setPhan(v))} className={nut(phan === v)}>
            {ten}
          </button>
        ))}
        <span className="ml-3 text-dim">Chế độ:</span>
        {(
          [
            ['cho', 'Chờ đúng nốt'],
            ['nhip', 'Theo nhịp'],
          ] as const
        ).map(([v, ten]) => (
          <button key={v} type="button" onClick={() => doi(() => setCheDo(v))} className={nut(cheDo === v)}>
            {ten}
          </button>
        ))}
        <span className="ml-3 text-dim">♩ =</span>
        {NHIP.map((x) => (
          <button key={x} type="button" onClick={() => doi(() => setBpm(x))} className={nut(bpm === x)} title={`móc đơn ${(x / 30).toFixed(1).replace('.', ',')} nốt/giây`}>
            {x}
          </button>
        ))}
      </div>

      {phan === 'don' ? (
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">Tay</span>
            {(['phai', 'trai'] as const).map((t) => (
              <button key={t} type="button" onClick={() => doi(() => setTay(t))} className={nut(tay === t)}>
                {t === 'phai' ? 'Tay phải' : 'Tay trái'}
              </button>
            ))}
          </div>
          {nhom.map((nh) => (
            <div key={nh} className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 text-dim">{nh}</span>
              {ds.map((x, k) =>
                x.nhom === nh ? (
                  <button key={x.id} type="button" onClick={() => doi(() => setChiSo(k))} className={nut(k === chiSo)}>
                    {x.ten.replace(/^(Năm ngón|Gam|Rải) /, '')}
                    {saoCua(`don-${x.id}`) ? <span className="ml-1 text-amber-key">{sao(saoCua(`don-${x.id}`)!)}</span> : null}
                  </button>
                ) : null,
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">Giọng</span>
            <select
              value={tonic}
              onChange={(event) => doi(() => setTonic(Number(event.target.value)))}
              className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
              aria-label="Giọng của vòng"
            >
              {GOC.map((ten, k) => (
                <option key={ten} value={k}>
                  {ten}
                </option>
              ))}
            </select>
            {[false, true].map((v) => (
              <button key={String(v)} type="button" onClick={() => doi(() => setThu(v))} className={nut(thu === v)}>
                {v ? 'thứ' : 'trưởng'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">Vòng</span>
            {vongs.map((x) => (
              <button key={x.id} type="button" onClick={() => doi(() => setVongId(x.id))} className={nut(x.id === vong.id)} title={x.ghiChu}>
                {x.ten}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-dim">Kiểu chạy</span>
            {KIEU_CHAY.map((x) => (
              <button key={x.id} type="button" onClick={() => doi(() => setKieu(x.id))} className={nut(kieu === x.id)}>
                {x.ten}
                {saoCua(`vong-${vong.id}-${tonic}-${thu ? 'thu' : 'truong'}-${x.id}`) ? (
                  <span className="ml-1 text-amber-key">{sao(saoCua(`vong-${vong.id}-${tonic}-${thu ? 'thu' : 'truong'}-${x.id}`)!)}</span>
                ) : null}
              </button>
            ))}
          </div>
          <p className="text-cream/80">
            {KIEU_CHAY.find((x) => x.id === kieu)!.mo}. Mỗi hợp âm một ô 4 phách; tay trái máy đệm "bùm – chát" (bass phách 1 · 3, chồng phách 2 ·
            4){cheDo === 'nhip' ? ', vòng chơi hai lượt' : ''}.
          </p>
        </div>
      )}

      <p className="text-xs text-cream/85">
        Đang chạy: <b className="text-amber-key">{bai.ten}</b> · {bai.tay === 'right' ? 'tay phải' : 'tay trái'} · ♩ = {bpm}
        {kyLuc[khoa] ? <span className="ml-2 text-amber-key">kỷ lục {sao(kyLuc[khoa]!)}</span> : null}
      </p>

      {cheDo === 'cho' ? (
        <NoteGatedPractice
          key={`${khoa}|${bpm}`}
          timeline={bai.timeline}
          voicings={bai.voicings}
          beatsPerChord={bai.beatsPerChord}
          perBeat={bai.perBeat}
          vongBpm={bpm}
          nenTayKia
          bac={{
            tay: bai.tay,
            onXong: (k) => {
              const s = saoChoDung(k)
              ghiSao(s)
              return { dat: s >= 2, tomTat: `${sao(s)} — ${k.chang - k.vap}/${k.chang} chặng không vấp` }
            },
          }}
        />
      ) : (
        <TimedPractice
          key={`${khoa}|${bpm}`}
          title={`Chạy ngón · ${bai.ten}`}
          timeline={timelineNhip}
          voicings={bai.voicings}
          beatsPerChord={bai.beatsPerChord}
          perBeat={bai.perBeat}
          meter={4}
          vongBpm={bpm}
          anTempo
          bac={{
            tay: bai.tay,
            tempo: 100,
            boQuaQuangTam: false,
            anNotRoi: false,
            theoHopAm: false,
            onXong: (score) => {
              const s = saoTheoNhip(score)
              ghiSao(s)
              return {
                dat: s >= 2,
                tomTat: `${sao(s)} — trúng ${score.hit}/${score.total} nốt, lệch trung vị ${score.medianAbsMs === null ? '—' : `${Math.round(score.medianAbsMs)} ms`}`,
              }
            },
          }}
        />
      )}
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
