import { useEffect, useMemo, useRef, useState } from 'react'
import { playChord, playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import { BanPhimHaiTay } from './BanPhimHaiTay'
import { BAC_TREN_BASS, BAM_THAY, hopTheoNot, LOI_BAM_THAY, ngonGoiY, type ThayBam } from './soanCau/bamNhuThay'
import { doiThe, TEN_DAO, theBamVong } from './soanCau/danhTheo'
import { nguCanh, type Hop } from './soanCau/giaiThich'
import { hopCuaMau, hopDoan, laMa, LOI_TONG_HOP, MAU_VONG, moTaKhuc, nhanVong, tongHop, type BaiSheet, type KhucVong } from './soanCau/nhanVong'
import { dungHopAm } from './soanCau/soanCau'
import { docVong } from './soanCau/thayTrongVong'
import vongSheet from './soanCau/vongSheet.json'
import { VongLuaChon } from './VongLuaChon'

type ThayId = 'linh-nhi' | 'ca-phao' | 'blues'
const SHEET = vongSheet as unknown as Record<ThayId, BaiSheet[]>
const THAY: readonly { id: ThayId; ten: string; nguon: string }[] = [
  {
    id: 'linh-nhi',
    ten: 'Linh Nhi',
    nguon: 'Hợp âm đọc từ nốt đệm phần hát (máy đọc ra hợp âm ba — bỏ 7, 9; hợp âm bảy trưởng có khi thành hợp âm thứ cách quãng ba, vd Fmaj7 → Am). Kém Duyên, Yêu Xa chưa có giọng nên chưa vào.',
  },
  {
    id: 'ca-phao',
    ten: 'Cà Pháo',
    nguon: 'Hợp âm đọc từ nốt đệm phần hát (máy đọc ra hợp âm ba; hai bài trưởng Hồng Kông 1, Có Em Chờ còn đọc lệch — md Cà Pháo mục "Ai chọn hợp âm"). Ba bài thứ giọng suy (sheet không ghi bộ khóa).',
  },
  { id: 'blues', ten: 'Blues', nguon: 'Ký hiệu hợp âm in trên ba sheet, cả bài một chuỗi; khung 12 ô đo riêng theo ô nhịp.' },
]

interface VongDanh {
  ten: string
  tonic: number
  thu: boolean
  hop: Hop[]
  /** Thế bấm THẬT của thầy (đoạn "Bấm như thầy") — có thì phải bấm đúng từng nốt; không có thì thế gợi ý của Claude, chấm theo lớp cao độ. */
  the?: { trai: number[]; phai: number[] }[]
}

const pc = (x: number) => ((x % 12) + 12) % 12
const the = 'rounded-xl border border-line bg-black/25 p-4 text-sm'
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`

function moTa(k: KhucVong, v: VongDanh) {
  const { h, songSong } = nguCanh(v.tonic, v.thu)
  return moTaKhuc(k, (j) => h(v.hop[j]!.goc, v.hop[j]!.chat), songSong)
}
const khucCua = (k: KhucVong, v: VongDanh): VongDanh => ({ ...v, ten: `${k.ten} — ${v.ten}`, hop: v.hop.slice(k.tu, k.den + 1).filter((_, j) => !k.chen.includes(k.tu + j)) })

/**
 * Tab TÁI HÒA ÂM VÒNG — người dùng 9/10/2026: "Hãy phân tích các vòng hợp âm trong các sheet của từng thầy rồi cố gắng tổng hợp lại xem
 * nó là vòng nào trong các vòng hợp âm phổ biến trong âm nhạc. Sau đó đưa vào tab để tôi có cái đánh theo. Hãy làm thêm chức năng tự
 * nhập vòng hợp âm để đánh theo". Trên cùng là khung đánh theo; bấm "Đánh theo" ở vòng phổ biến hay vòng trong sheet thì nạp vào đó.
 */
export function VongTab({ tonic, thu }: { tonic: number; thu: boolean }) {
  const [dang, setDang] = useState<VongDanh | null>(null)
  const [lan, setLan] = useState(0)
  const neo = useRef<HTMLDivElement>(null)
  const nap = (v: VongDanh) => {
    setDang(v)
    setLan((k) => k + 1)
    neo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <div className="flex flex-col gap-4">
      <div ref={neo}>
        <DanhTheoVong key={lan} vong={dang} tonic={tonic} thu={thu} nap={nap} />
      </div>
      <BamNhuThay nap={nap} />
      <VongSheetThay nap={nap} />
      <VongPhoBien tonic={tonic} nap={nap} />
      <VongLuaChon key={String(thu)} tonic={tonic} thu={thu} />
    </div>
  )
}

/**
 * ĐÁNH THEO — từng hợp âm một: bàn phím sáng thế gợi ý (tay trái bass, tay phải thế đảo gần thế trước — `theBamVong`); bấm đúng hợp âm
 * (thế nào cũng được, chấm theo lớp cao độ) thì tự sang hợp âm sau. Hai hợp âm liền nhau giống hệt thì phải đổi tay (nhả ra) mới tính.
 */
function DanhTheoVong({ vong, tonic, thu, nap }: { vong: VongDanh | null; tonic: number; thu: boolean; nap: (v: VongDanh) => void }) {
  useLiveSound()
  useComputerKeyboard(60)
  const held = useMidiStore((state) => state.heldNotes)
  const [tuNhap, setTuNhap] = useState('')
  const [loi, setLoi] = useState('')
  const [i, setI] = useState(0)
  const [luot, setLuot] = useState(0)
  const [khoa, setKhoa] = useState('')
  const tb = useMemo(
    () =>
      !vong
        ? []
        : vong.the
          ? vong.the.map((y) => {
              const pcs = [...new Set([...y.trai, ...y.phai].map(pc))]
              return { trai: y.trai, phai: y.phai, pcs, pcsGoiY: pcs, dao: -1 }
            })
          : theBamVong(vong.tonic, vong.hop),
    [vong],
  )
  const n = tb.length
  const t = tb[i]
  const theThay = vong?.the !== undefined
  /* Thế thầy: phải đúng từng nốt (khóa theo nốt); thế Claude: đúng lớp cao độ là được. */
  const giu = (theThay ? [...new Set(held)] : [...new Set(held.map(pc))]).sort((a, b) => a - b).join()
  const dungNot = t !== undefined && giu === [...new Set([...t.trai, ...t.phai])].sort((a, b) => a - b).join()
  const dungLop = t !== undefined && (dungHopAm(held, t.pcs) || dungHopAm(held, t.pcsGoiY))
  const dung = t !== undefined && giu !== khoa && (theThay ? dungNot : dungLop)

  useEffect(() => {
    if (!dung) return
    const id = window.setTimeout(() => {
      setKhoa(giu)
      if (i + 1 >= n) setLuot((l) => l + 1)
      setI((i + 1) % n)
    }, 250)
    return () => window.clearTimeout(id)
  }, [dung, giu, i, n])
  useEffect(() => {
    if (!held.length) setKhoa('')
  }, [held.length])

  const tuNhapForm = (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const hop = docVong(tuNhap, tonic)
        if (hop) {
          setLoi('')
          nap({ ten: `Vòng tự nhập ${tuNhap.trim()}`, tonic, thu, hop })
        } else setLoi(`Chưa đọc được "${tuNhap}" — gõ như C G Am F, hay Dm7 G7 Cmaj7, hay C/E`)
      }}
      className="flex flex-wrap items-center gap-2 text-xs"
    >
      <span className="text-dim">Tự nhập vòng để đánh theo:</span>
      <input
        value={tuNhap}
        onChange={(event) => setTuNhap(event.target.value)}
        placeholder="vd Am F C G"
        className="w-56 rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
        aria-label="Tự nhập vòng để đánh theo"
      />
      <button type="submit" disabled={!tuNhap.trim()} className={nut(false)}>
        Đánh theo
      </button>
      {loi && <span className="text-rose-300">{loi}</span>}
    </form>
  )

  if (!vong || !t)
    return (
      <div className={the}>
        <h4 className="mb-1 font-semibold text-cream">Đánh theo vòng</h4>
        <p className="mb-3 text-xs text-dim">
          Chọn một vòng bên dưới ("Đánh theo" ở vòng trong sheet các thầy hay vòng phổ biến), hoặc tự nhập. Mỗi hợp âm: bàn phím sáng thế gợi
          ý, bấm đúng thì tự sang hợp âm sau.
        </p>
        {tuNhapForm}
        <MidiConnect />
      </div>
    )

  const { h, n: tenNot, giong } = nguCanh(vong.tonic, vong.thu)
  const x = vong.hop[i]!
  const tenHop = (y: Hop) => h(y.goc, y.chat, y.bass)
  const not = (m: number) => tenNot(pc(m - vong.tonic))
  /** Kèm số quãng tám (Sol2) — để thấy lệch quãng tám ở thế thầy. */
  const notQ = (m: number) => `${not(m)}${Math.floor(m / 12) - 1}`
  const truoc = n > 1 && (i > 0 || luot > 0) ? tb[(i - 1 + n) % n]! : null
  const doi = truoc ? doiThe(truoc.phai, t.phai) : null
  const dangGiu = new Set(held.map(pc))
  const thieu = t.pcs.filter((p) => !dangGiu.has(p))
  const thua = [...dangGiu].filter((p) => !t.pcs.includes(p))
  const khuc = nhanVong(vong.hop, vong.thu)
  /* "Mi(1) – Sol(2) – Đô(5)": tên nốt kèm ngón gợi ý (Claude). */
  const coNgon = (ds: readonly number[], tay: 'trai' | 'phai') => {
    const ngon = ngonGoiY(ds, tay)
    return [...ds].sort((a, b) => a - b).map((m, k) => `${not(m)}${ngon ? `(${ngon[k]})` : ''}`).join(' – ')
  }
  const nghe = async (ds: readonly number[][]) => {
    await startAudio()
    if (ds.length === 1) playChord(ds[0]!, '1n')
    else playChordSequence(ds, 1.2)
  }

  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">
        Đánh theo: {vong.ten} <span className="font-normal text-dim">· {giong}</span>
      </h4>
      <p className="mb-3 text-xs text-dim">
        {theThay
          ? 'Thế bấm là nốt THẬT trong sheet của thầy (cú đầu tay trái, cụm tay phải tiêu biểu của khúc). Bấm đúng từng nốt thì sang hợp âm sau. Số trong ngoặc là ngón Claude gợi ý — sheet không ghi số ngón.'
          : 'Thế gợi ý là lối chung của Claude (tay trái giữ bass, tay phải chọn thế đảo gần thế trước nhất cho tay dời ít) — chưa phải lối bấm của thầy. Bấm thế nào cũng được miễn đủ nốt; đúng thì tự sang hợp âm sau. Số trong ngoặc là ngón gợi ý.'}
      </p>

      <div className="mb-2 flex flex-wrap gap-1">
        {vong.hop.map((y, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setI(k)}
            className={`min-w-12 rounded-lg border px-2 py-1 text-center font-mono text-sm ${
              k === i ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line text-cream/80 hover:bg-white/6'
            }`}
          >
            {tenHop(y)}
            <span className="block text-[10px] text-dim">{laMa(y)}</span>
          </button>
        ))}
      </div>
      {khuc.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-0.5 text-xs text-cream/85">
          {khuc.map((k) => (
            <li key={k.tu}>
              <span className="text-dim">
                Hợp âm {k.tu + 1}–{k.den + 1}:
              </span>{' '}
              {moTa(k, vong)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-dim">Vòng này không khớp vòng phổ biến nào trong thư viện ({MAU_VONG.length} vòng + chuỗi quãng 5).</p>
      )}

      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-cream">
          <span className="text-xs text-dim">
            Hợp âm {i + 1}/{n}
            {luot > 0 && ` · đã trọn ${luot} lượt`}
          </span>
          {'  '}
          {n > 1 && <span className="text-xs text-dim">· tiếp: {tenHop(vong.hop[(i + 1) % n]!)}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setI((i - 1 + n) % n)} className={nut(false)} aria-label="Hợp âm trước">
            ◀
          </button>
          <button type="button" onClick={() => setI((i + 1) % n)} className={nut(false)} aria-label="Hợp âm sau">
            ▶
          </button>
          <button type="button" onClick={() => void nghe([[...t.trai, ...t.phai]])} className={nut(false)}>
            Nghe hợp âm
          </button>
          <button type="button" onClick={() => void nghe(tb.map((y) => [...y.trai, ...y.phai]))} className={nut(false)}>
            Nghe cả vòng
          </button>
          <button
            type="button"
            onClick={() => {
              setI(0)
              setLuot(0)
            }}
            className={nut(false)}
          >
            Từ đầu
          </button>
        </div>
      </div>
      <BanPhimHaiTay
        trai={t.trai}
        phai={t.phai}
        lowNote={Math.min(36, ...tb.flatMap((y) => [...y.trai, ...y.phai]).map((m) => m - (m % 12)))}
        highNote={Math.max(84, ...tb.flatMap((y) => [...y.trai, ...y.phai]).map((m) => m - (m % 12) + 12))}
        nhan={{
          trai: not(t.trai[0]!),
          traiPhu: `${coNgon(t.trai, 'trai')}${theThay ? '' : x.bass === undefined ? ' · nốt gốc' : ' · bass'}`,
          phai: h(x.goc, x.chat),
          phaiPhu: `${coNgon(t.phai, 'phai')}${theThay ? '' : ` · ${TEN_DAO[t.dao]}`}`,
          tong: tenHop(x),
        }}
      />
      {doi && truoc && (
        <p className="mb-1 text-xs text-cream/85">
          <span className="text-amber-key">Tay phải từ {tenHop(vong.hop[(i - 1 + n) % n]!)} sang {tenHop(x)}: </span>
          {doi.giu.length ? `giữ ${doi.giu.map(not).join(', ')}` : 'không nốt nào giữ được'}
          {doi.doi.length > 0 && ` · ${doi.doi.map(([a, b]) => `${not(a)} → ${not(b)}`).join(', ')}`}
          {doi.them.length > 0 && ` · thêm ${doi.them.map(not).join(', ')}`}
          {doi.bo.length > 0 && ` · nhả ${doi.bo.map(not).join(', ')}`}
        </p>
      )}
      <p className={`mb-3 text-sm ${dung ? 'text-teal-key' : 'text-cream/85'}`} aria-live="polite">
        {dung
          ? `Đúng — ${tenHop(x)}`
          : held.length === 0
            ? `Bấm ${tenHop(x)}.`
            : theThay && dungLop
              ? `Đúng nốt nhưng khác thế — thầy bấm tay trái ${t.trai.map(notQ).join(' – ')}, tay phải ${t.phai.map(notQ).join(' – ')}.`
            : `Đang giữ ${[...dangGiu].map((p) => tenNot(pc(p - vong.tonic))).join(', ')}${thieu.length ? ` · thiếu ${thieu.map((p) => tenNot(pc(p - vong.tonic))).join(', ')}` : ''}${thua.length ? ` · thừa ${thua.map((p) => tenNot(pc(p - vong.tonic))).join(', ')}` : ''}`}
      </p>
      {tuNhapForm}
      <MidiConnect />
    </div>
  )
}

/**
 * BẤM NHƯ THẦY — người dùng 9/10/2026: "dạy bấm hợp âm như từng thầy … khi chuyển hợp âm thì từng thầy đã xếp ngón thế nào … thế đảo và
 * slash chord". Số đo thế bấm từ sheet (`tools/the_bam_thay.py`), lời đọc kết quả của Claude (`LOI_BAM_THAY`), và các đoạn nốt THẬT để
 * đánh theo — nạp vào khung Đánh theo ở chế độ thế thầy (bấm đúng từng nốt; ngón gợi ý là của Claude, sheet không ghi ngón).
 */
function BamNhuThay({ nap }: { nap: (v: VongDanh) => void }) {
  const [thay, setThay] = useState<ThayBam>('ca-phao')
  const { so, doan } = BAM_THAY[thay]
  const quang = (s: string) =>
    s === '0'
      ? 'bass đơn'
      : s
          .split('-')
          .map((x) => BAC_TREN_BASS[Number(x)] ?? x)
          .join('–')
  const ds = (xs: [string, number][], dau: (k: string) => string, bao = 6) => xs.slice(0, bao).map(([k, v]) => `${dau(k)}: ${v}`).join(' · ')
  const tenThay = THAY.find((x) => x.id === thay)!.ten
  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">Bấm như thầy — thế bấm, thế đảo, slash chord, chuyển hợp âm (đo trên sheet)</h4>
      <p className="mb-2 text-xs text-dim">
        Mỗi khúc hợp âm (phần hát của Linh Nhi, Cà Pháo; cả bài Blues) lấy cú đầu tay trái và cụm tay phải từ 3 nốt. Sheet không ghi số ngón —
        ngón ở phần đánh theo là Claude gợi ý. Dòng slash là máy đọc; ví dụ có tên trong "Đọc kết quả" đã soát tay từng nốt.
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {THAY.map((x) => (
          <button key={x.id} type="button" onClick={() => setThay(x.id)} className={nut(thay === x.id)}>
            {x.ten}
          </button>
        ))}
      </div>
      <ul className="mb-2 flex flex-col gap-1 text-xs text-cream/85">
        <li>
          <b className="text-cream">Tay trái</b> — cú đầu (trên {so.co_trai} khúc): {ds(so.trai_dau, quang, 4)}; các nốt rải trong khúc:{' '}
          {ds(so.trai_mau, quang, 5)}
        </li>
        <li>
          <b className="text-cream">Bass vào hợp âm</b> (trên {so.co_trai} khúc): {ds(so.bass_bac, (k) => `bậc ${k}`, 6)}
        </li>
        <li>
          <b className="text-cream">Thế đảo · slash hay gặp</b> (máy đọc): {so.slash.slice(0, 6).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </li>
        <li>
          <b className="text-cream">Bass đi liền bậc nhờ thế đảo</b>: {so.duong_bass.length} chỗ
          {so.duong_bass.length > 0 && ` — ${so.duong_bass.slice(0, 3).join(' · ')}`}
        </li>
        <li>
          <b className="text-cream">Tay phải</b> — {so.co_phai}/{so.khuc} khúc có cụm từ 3 nốt; hình hay gặp (bậc từ thấp lên): {ds(so.phai_hinh, (k) => k, 5)}; nốt
          thấp nhất: {ds(so.phai_day, (k) => `bậc ${k}`, 5)}; quãng tám kẹp giữa {so.phai_kep}/{so.co_phai}
        </li>
        <li>
          <b className="text-cream">Chuyển hợp âm</b> — tay phải giữ nốt chung {so.chuyen.giu}/{so.chuyen.n} lần, mọi nốt dời ≤ 2 nửa cung {so.chuyen.lien}/
          {so.chuyen.n}, mỗi nốt dời trung bình {so.chuyen.doi_tb} nửa cung; bass (trên {so.bass_chuyen.n} lần): đứng yên {so.bass_chuyen.dung} · liền bậc{' '}
          {so.bass_chuyen.lien} · quãng 3 {so.bass_chuyen.ba} · quãng 4–5 {so.bass_chuyen.bon_nam} · xa hơn {so.bass_chuyen.xa}
        </li>
      </ul>
      <p className="mb-3 rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85">
        <span className="text-teal-key">Đọc kết quả (Claude, từ số đo trên): </span>
        {LOI_BAM_THAY[thay]}
      </p>
      <p className="mb-1 text-xs font-semibold text-cream">Đánh theo thế thầy — nốt thật trong sheet ({doan.length} đoạn)</p>
      <ul className="flex flex-col gap-1 text-xs">
        {doan.map((d) => {
          const hop = d.hop.map((x, k) => hopTheoNot(d.tonic, x, d.the[k]!))
          const { h } = nguCanh(d.tonic, d.thu)
          return (
            <li key={`${d.bai}${d.doan}${hop.map((x) => x.chat).join()}`} className="flex flex-wrap items-center gap-2">
              <span className="text-dim">
                {d.bai} · {d.doan} · {d.giong}
              </span>
              <span className="font-mono text-teal-key">{hop.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')}</span>
              <button type="button" onClick={() => nap({ ten: `thế ${tenThay} — ${d.bai} · ${d.doan}`, tonic: d.tonic, thu: d.thu, hop, the: d.the })} className={nut(false)}>
                Đánh theo thế thầy
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * VÒNG TRONG SHEET CÁC THẦY — tổng hợp mỗi thầy (vòng nào có trong bao nhiêu đoạn, bao nhiêu hợp âm rơi vào vòng có tên), lời đọc kết
 * quả (`LOI_TONG_HOP`), rồi từng bài · từng đoạn: hợp âm ở giọng của bài, các khúc nhận ra, "Đánh theo" cả đoạn hay từng khúc.
 */
function VongSheetThay({ nap }: { nap: (v: VongDanh) => void }) {
  const [thay, setThay] = useState<ThayId>('linh-nhi')
  const [baiI, setBaiI] = useState(0)
  const ds = SHEET[thay]
  const tong = useMemo(() => tongHop(ds), [ds])
  const bai = ds[baiI] ?? ds[0]!
  const info = THAY.find((x) => x.id === thay)!
  const vongDoan = (b: BaiSheet, d: BaiSheet['doan'][number]): VongDanh => ({ ten: `${b.bai} · ${d.ten}`, tonic: b.tonic, thu: b.thu, hop: hopDoan(d) })
  /* Khúc thật đầu tiên của một vòng trong sheet thầy — để "Đánh theo" ngay ở dòng tổng hợp. */
  const khucDau = (id: string): VongDanh | null => {
    for (const b of ds)
      for (const d of b.doan) {
        const v = vongDoan(b, d)
        const k = nhanVong(v.hop, b.thu).find((y) => y.id === id)
        if (k) return khucCua(k, v)
      }
    return null
  }

  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">Vòng trong sheet các thầy — thuộc vòng phổ biến nào</h4>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {THAY.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setThay(x.id)
              setBaiI(0)
            }}
            className={nut(thay === x.id)}
          >
            {x.ten}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-dim">
        {info.nguon} Hợp âm lặp liền nhau gộp một; đoạn có chuỗi y hệt đoạn trước gộp làm một.
      </p>
      <p className="mb-1 text-xs text-cream">
        {tong.soDoan} {thay === 'blues' ? 'bài' : 'đoạn'} · {tong.soHop} hợp âm · {tong.phu} hợp âm ({Math.round((100 * tong.phu) / tong.soHop)}%) nằm trong một
        vòng có tên
      </p>
      <ul className="mb-2 flex flex-col gap-1 text-xs">
        {tong.theoMau.map((m) => {
          const k = khucDau(m.id)
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-2">
              <span className="text-cream">{m.ten}</span>
              <span className="text-dim">
                {m.doan}/{tong.soDoan} {thay === 'blues' ? 'bài' : 'đoạn'} · {m.lan} lần
              </span>
              {k && (
                <button type="button" onClick={() => nap(k)} className={nut(false)} title={k.ten}>
                  Đánh theo khúc thật
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mb-3 rounded-lg border border-teal-key/30 p-2 text-xs text-cream/85">
        <span className="text-teal-key">Đọc kết quả (Claude, từ số đo trên): </span>
        {LOI_TONG_HOP[thay]}
      </p>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {ds.map((b, k) => (
          <button key={b.bai} type="button" onClick={() => setBaiI(k)} className={nut(b === bai)}>
            {b.bai}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-dim">
        {bai.giong}
        {bai.suy && ' (giọng suy)'}
        {bai.khung12 !== undefined &&
          !bai.thu &&
          ` · khung 12 ô đo theo ô nhịp: ${
            bai.khung12.length ? bai.khung12.map((k) => `ô ${k.o}–${k.o + 11} (${k.kieu}, khớp ${k.khop}/12)`).join('; ') : 'không khung nào khớp từ 11/12'
          } — trong ${bai.so_o} ô`}
      </p>
      {bai.doan.map((d) => {
        const v = vongDoan(bai, d)
        const { h } = nguCanh(bai.tonic, bai.thu)
        const khuc = nhanVong(v.hop, bai.thu)
        const thuoc = (j: number) => khuc.findIndex((k) => j >= k.tu && j <= k.den)
        return (
          <div key={d.ten} className="mb-3 border-t border-line/40 pt-2">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              <b className="text-cream">{d.ten}</b>
              {d.lan > 1 && <span className="text-dim">×{d.lan} ({d.cung.join(', ')})</span>}
              <button type="button" onClick={() => nap(v)} className={nut(false)}>
                Đánh theo cả đoạn
              </button>
            </div>
            <div className="mb-1 flex flex-wrap gap-1">
              {v.hop.map((y, j) => {
                const k = thuoc(j)
                return (
                  <span
                    key={j}
                    className={`rounded border px-1.5 py-0.5 text-center font-mono text-xs ${
                      k < 0 ? 'border-line/50 text-cream/60' : khuc[k]!.chen.includes(j) ? 'border-dashed border-teal-key/50 text-cream/70' : 'border-teal-key/60 text-teal-key'
                    }`}
                  >
                    {h(y.goc, y.chat)}
                    <span className="block text-[9px] text-dim">{laMa(y)}</span>
                  </span>
                )
              })}
            </div>
            <ul className="flex flex-col gap-0.5 text-xs text-cream/85">
              {khuc.map((k) => (
                <li key={k.tu} className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-teal-key">
                    {v.hop
                      .slice(k.tu, k.den + 1)
                      .map((y, j) => (k.chen.includes(k.tu + j) ? `(${h(y.goc, y.chat)})` : h(y.goc, y.chat)))
                      .join(' – ')}
                  </span>
                  <span>{moTa(k, v)}</span>
                  <button type="button" onClick={() => nap(khucCua(k, v))} className={nut(false)}>
                    Đánh theo khúc
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/** VÒNG PHỔ BIẾN — thư viện vòng mà bộ nhận dùng; mỗi vòng ở chủ âm đang chọn (vòng giọng thứ lấy chủ âm ấy làm i), lời nghe ra sao. */
function VongPhoBien({ tonic, nap }: { tonic: number; nap: (v: VongDanh) => void }) {
  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">Vòng phổ biến — đánh theo ở chủ âm đang chọn</h4>
      <p className="mb-2 text-xs text-dim">
        Đây là thư viện bộ nhận vòng dùng để đối chiếu sheet các thầy (thêm chuỗi quãng 5 nhận riêng). Lời "nghe ra sao" và bài ví dụ là kiến
        thức chung, Claude viết — không phải số đo. Vòng giọng thứ lấy chủ âm đang chọn làm i.
      </p>
      {MAU_VONG.map((m) => {
        const hop = hopCuaMau(m)
        const { h, giong } = nguCanh(tonic, m.thu)
        return (
          <div key={m.id} className="border-t border-line/40 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-cream">{m.ten}</b>
              <span className="font-mono text-xs text-amber-key">{hop.map((x) => h(x.goc, x.chat)).join(' – ')}</span>
              <span className="text-[11px] text-dim">{giong}</span>
              <button type="button" onClick={() => nap({ ten: m.ten, tonic, thu: m.thu, hop })} className={nut(false)}>
                Đánh theo
              </button>
            </div>
            <p className="mt-0.5 text-xs text-cream/80">{m.nghe}</p>
          </div>
        )
      })}
    </div>
  )
}
