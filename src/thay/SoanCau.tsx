import { useEffect, useMemo, useRef, useState } from 'react'
import { playChord, playChordSequence, startAudio, stopTimelineLoop } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import type { LuotTap } from '../shared/persistence/db'
import {
  CONG_THUC,
  DO_DUOC,
  gocDep,
  hauDep,
  pcsTren,
  soThe,
  nhanHaiTay,
  tenHaiTay,
  tenTren,
  tenTrongGiong,
  theBamChong,
  type CongThuc,
} from './soanCau/chongHopAm'
import { loiThay, lyDoThay, lyThuyetCacBac, nguCanh, theBamHop, type Diem, type Hop } from './soanCau/giaiThich'
import {
  dungHopAm,
  GHI_CHU_THAY,
  LOAI_BAC1,
  lyThuyetBac,
  phanBoNot,
  tenBac,
  tenHopAm,
  tenNotBac,
  traLoiTen,
  vongCuaThay,
  vongLyThuyet,
  xepNot,
  type DuLieuSoanCau,
} from './soanCau/soanCau'
import { TapSolo } from './TapSolo'
import type { Teacher } from './teachers'
import { GOC, kieuDau } from './vongThay'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const the = 'rounded-xl border border-line bg-black/25 p-4 text-sm'
const chonClass = 'rounded border border-line bg-white/6 px-1.5 py-1 text-cream'
const phanTram = (x: number) => `${Math.round(x * 100)} %`

/** Thế bấm để nghe: gốc ở quãng tám 3, các nốt hợp âm ở quãng tám 4 — mộc, chưa phải thế bấm của thầy. */
const theBam = (pcs: readonly number[]) => [48 + pcs[0]!, ...[...new Set(pcs)].map((p) => 60 + p).sort((a, b) => a - b)]

const nghe = async (pcs: readonly number[]) => {
  await startAudio()
  playChord(theBam(pcs), '2n')
}
const ngheVong = async (pcs: readonly (readonly number[])[]) => {
  await startAudio()
  playChordSequence(pcs.map(theBam), 1.2)
}

const PHAN = ['1. Hợp âm theo bậc', '2. Nhớ vòng', '3. Chọn nốt solo', '4. Tập solo'] as const

/** Cách gọi thầy trong lời: Linh Nhi "chị", Cà Pháo "anh"; Blues không có một thầy — ba sheet và thầy Đức Thịnh. */
const goi = (t: Teacher) => (t.id === 'linh-nhi' ? 'chị' : t.id === 'ca-phao' ? 'anh' : t.id === 'blues' ? 'người chơi' : 'thầy')

/**
 * Tab HỌC CÁCH SOẠN CÂU (GĐ 3, `Reference/KE-HOACH-LUYEN-TAP.md` mục GĐ 3) — làm thử với Linh Nhi (người dùng chọn 4/10/2026).
 * Bốn phần: hợp âm theo bậc (lý thuyết | thầy) · nhớ vòng · chọn nốt solo bám sheet · tập solo trên backing (`TapSolo`).
 * `du` null (Cà Pháo, 7/10/2026): chỉ có lời giải thích Phần 1 — Phần 2–4 cần bảng số đo solo, chưa dựng (bước 8 lộ trình).
 */
export function SoanCau({
  teacher,
  du,
  luot,
  onGhi,
}: {
  teacher: Teacher
  du: DuLieuSoanCau | null
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const [thu, setThu] = useState(true)
  const [tonic, setTonic] = useState(9)
  const [loai, setLoai] = useState('m')
  const [phan, setPhan] = useState(0)
  useEffect(() => () => stopTimelineLoop(), [])

  return (
    <div className="flex flex-col gap-4">
      <div className={the}>
        <h3 className="mb-1 font-semibold text-cream">Học cách soạn câu — {teacher.label}</h3>
        <p className="text-xs text-dim">
          Hai nguồn, không trộn: <b className="text-cream">lý thuyết piano</b> và{' '}
          <b className="text-cream">số đo từ sheet của {goi(teacher)}</b>.{' '}
          {du
            ? `Chọn nốt solo bám sheet — ${goi(teacher)} đánh nốt nào bao nhiêu phần trăm; không có đúng sai tuyệt đối, nốt ${goi(teacher)} không dùng chỉ là "khác ${goi(teacher)}".`
            : `Hiện mới có Phần 1. Nhớ vòng · Chọn nốt · Tập solo cần bảng số đo đoạn solo của ${goi(teacher)} — chưa dựng (bước ${teacher.id === 'blues' ? 9 : 8} lộ trình).`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
        <span>Giọng</span>
        <select value={tonic} onChange={(event) => setTonic(Number(event.target.value))} className={chonClass}>
          {GOC.map((ten, i) => (
            <option key={ten} value={i}>
              {ten}
            </option>
          ))}
        </select>
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => {
              setThu(v)
              setLoai(v ? 'm' : '')
            }}
            className={nut(thu === v)}
          >
            {v ? 'thứ' : 'trưởng'}
          </button>
        ))}
        <span className="ml-2">Hợp âm bậc 1</span>
        {LOAI_BAC1[thu ? 'thu' : 'truong'].map((one) => (
          <button key={one.id} type="button" onClick={() => setLoai(one.id)} className={nut(loai === one.id)}>
            {tenHopAm(tonic, thu, 0, one.kyHieu)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PHAN.map((ten, i) => (
          <button
            key={ten}
            type="button"
            disabled={!du && i > 0}
            onClick={() => {
              stopTimelineLoop()
              setPhan(i)
            }}
            className={`${nut(phan === i)} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {ten}
          </button>
        ))}
      </div>

      {phan === 0 && <HopAmTheoBac teacher={teacher} du={du} tonic={tonic} thu={thu} loai={loai} />}
      {du && phan === 1 && <NhoVong du={du} tonic={tonic} thu={thu} bay={loai === 'maj7' || loai === 'm7'} />}
      {du && phan === 2 && <ChonNot teacher={teacher} du={du} tonic={tonic} thu={thu} />}
      {du && phan === 3 && <TapSolo teacher={teacher} du={du} tonic={tonic} thu={thu} luot={luot} onGhi={onGhi} />}
    </div>
  )
}

const ngheHop = async (tonic: number, x: Hop) => {
  await startAudio()
  playChord(theBamHop(tonic, x), '2n')
}
const ngheChuoi = async (tonic: number, ds: readonly Hop[]) => {
  await startAudio()
  playChordSequence(
    ds.map((x) => theBamHop(tonic, x)),
    1.2,
  )
}

/**
 * Phần 1 — viết lại 4/10/2026 theo người dùng ("ko cần kiểu giải thích máy móc … tư duy tại sao thầy lại chọn hợp âm đó ở vị trí
 * đó"). Bốn khối: chồng hợp âm (Stack — Jeff Schneider) · các lối thay hợp âm trong đệm hát · thầy đặt hợp âm thế nào · từng bậc (vì
 * sao là hợp âm ấy, thay bằng gì | thầy chọn gì ở đó, vì sao). Lời: `soanCau/giaiThich.ts`; công thức chồng: `soanCau/chongHopAm.ts`.
 */
function HopAmTheoBac({
  teacher,
  du,
  tonic,
  thu,
  loai,
}: {
  teacher: Teacher
  du: DuLieuSoanCau | null
  tonic: number
  thu: boolean
  loai: string
}) {
  const lt = lyThuyetBac(tonic, thu, loai)
  const vongLt = vongLyThuyet(tonic, thu, loai === 'maj7' || loai === 'm7')
  const vongT = du ? vongCuaThay(du, tonic, thu) : []
  const bac = lyThuyetCacBac(tonic, thu)
  const ly = lyDoThay(teacher.id, tonic, thu)
  const { h } = nguCanh(tonic, thu)
  const cacBac = [1, 2, 3, 4, 5, 6, 7].map((so) => {
    const dong = lt.dong.filter((d) => d.bac === so)
    const goc = dong[0]!.goc
    return { so, dong, lt: bac.find((x) => x.goc === goc), thay: ly?.bac[goc] ?? [] }
  })

  return (
    <div className="flex flex-col gap-4">
      <ChongHopAm tonic={tonic} thu={thu} />
      <LoiThayThe tonic={tonic} thu={thu} />

      {ly && (
        <div className={the}>
          <h4 className="mb-1 font-semibold text-cream">{teacher.label} đặt hợp âm thế nào — và vì sao</h4>
          <p className="mb-2 text-xs text-dim">
            Lời đầy đủ ở từng thẻ bậc bên dưới: lập luận trước; "Ai chọn" so với{' '}
            {teacher.id === 'blues'
              ? 'KHUNG 12 Ô của thể loại, và với HỢP ÂM PHỔ BIẾN của bài (Rising Sun): giống thì là của thể loại hay của bài, khác hay thêm thì là của người chơi (Ray, Robert, người phối Rising Sun)'
              : `HỢP ÂM PHỔ BIẾN của chính bài (vài bản cộng đồng mỗi bài — không phải hòa âm gốc của nhạc sĩ): giống thì là của bài, khác hay thêm thì là của ${goi(teacher)}`}
            ;
            "Trong sheet" là ô thật, đã soát tay từng nốt (giọng gốc của bài); "Cơ sở" là số đo và nhãn suy luận. Lời "nghe ra sao, khi
            nào nên chọn" là phân tích của Claude trong vai nhạc sĩ — không phải số đo. ▶ nghe câu bài ghi rồi câu {goi(teacher)} bấm (thế
            bấm để nghe là công thức chồng hay bấm mộc, chưa phải thế bấm của thầy).
          </p>
          <ul className="flex flex-col gap-1.5 text-xs">
            {ly.nguyenTac.map((d) => (
              <li key={d.y}>
                <b className="text-cream">{d.y}</b> — <span className="text-cream/85">{d.tom}</span>{' '}
                {d.bac.length > 0 && (
                  <span className="text-dim">(xem {d.bac.map((g) => `Bậc ${cacBac.find((c) => c.dong[0]!.goc === g)?.so ?? '?'}`).join(', ')})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cacBac.map((c) => (
        <div key={c.so} className={the}>
          <h4 className="mb-2 font-semibold text-cream">
            Bậc {c.so} · {c.dong.map((d) => `${d.laMa} ${d.hopAm}`).join(' / ')}
            {c.lt && <span className="font-normal text-dim"> — {c.lt.vai}</span>}
          </h4>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h5 className="mb-1 text-xs font-semibold tracking-wide text-dim uppercase">Vì sao là hợp âm này · thay bằng gì</h5>
              <div className="mb-2 flex flex-wrap gap-2">
                {c.dong.map((d) => (
                  <button key={d.laMa} type="button" onClick={() => void nghe(d.pcs)} className="text-xs font-semibold text-amber-key hover:underline">
                    ▶ {d.laMa} · {d.hopAm}
                  </button>
                ))}
              </div>
              {c.lt && (
                <>
                  <p className="text-xs text-cream/85">{c.lt.viSao}</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-xs">
                    {c.lt.thay.map((t) => (
                      <li key={`${t.goc}${t.chat}${t.bass ?? ''}`}>
                        <button type="button" onClick={() => void ngheHop(tonic, t)} className="font-semibold text-amber-key hover:underline">
                          ▶ {h(t.goc, t.chat, t.bass)}
                        </button>{' '}
                        <span className="text-cream/85">{t.viSao}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold tracking-wide text-dim uppercase">{teacher.label} ở bậc này</h5>
              {c.thay.length > 0 ? (
                c.thay.map((d) => <DiemThay key={d.y} d={d} tonic={tonic} thu={thu} ai={goi(teacher)} />)
              ) : (
                <p className="text-xs text-dim">Ở bậc này {goi(teacher)} không có lối riêng đáng kể trong phần hát của các sheet.</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={the}>
          <h5 className="mb-1 text-xs font-semibold text-cream">Vòng phổ biến (lý thuyết)</h5>
          <ul className="flex flex-col gap-1.5 text-xs">
            {vongLt.map((v) => (
              <li key={v.id}>
                <button type="button" onClick={() => void ngheVong(v.pcs)} className="font-semibold text-amber-key hover:underline">
                  ▶ {v.ten}
                </button>{' '}
                <span className="font-mono text-cream">{v.hopAm.join(' – ')}</span>
                <span className="block text-dim">{v.ghiChu}</span>
              </li>
            ))}
          </ul>
        </div>
        {du && (
          <div className={the}>
            <h5 className="mb-1 text-xs font-semibold text-cream">Vòng thật từ sheet của {teacher.label}</h5>
            <ul className="flex flex-col gap-1 text-xs">
              {vongT.map((v) => (
                <li key={v.id}>
                  <button type="button" onClick={() => void ngheVong(v.pcs)} className="font-semibold text-amber-key hover:underline">
                    ▶ {v.ten}
                  </button>{' '}
                  <span className="font-mono text-cream">{v.hopAm.join(' – ')}</span> <span className="text-dim">({v.dieu})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function DiemThay({ d, tonic, thu, ai }: { d: Diem; tonic: number; thu: boolean; ai: string }) {
  const { h } = nguCanh(tonic, thu)
  const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
  return (
    <div className="mb-3 text-xs last:mb-0">
      <p className="font-semibold text-cream">{d.y}</p>
      {d.nghe && (
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <button type="button" onClick={() => void ngheChuoi(tonic, d.nghe!.bai)} className="font-semibold text-amber-key hover:underline">
            ▶ bài ghi: {ten(d.nghe.bai)}
          </button>
          <button type="button" onClick={() => void ngheChuoi(tonic, d.nghe!.thay)} className="font-semibold text-amber-key hover:underline">
            ▶ {ai} bấm: {ten(d.nghe.thay)}
          </button>
        </p>
      )}
      <p className="mt-1 text-cream/85">{d.giai}</p>
      <p className="mt-1 text-cream/85">
        <span className="text-teal-key">Ai chọn:</span> {d.ai}
      </p>
      {d.viDu && (
        <p className="mt-1 text-cream/75">
          <span className="text-amber-key">Trong sheet:</span> {d.viDu}
        </p>
      )}
      <p className="mt-1 text-dim">Cơ sở: {d.coSo}</p>
    </div>
  )
}

/** Các lối thay hợp âm trong đệm hát — giữ gì, đổi gì, vì sao tai vẫn nhận; nghe câu gốc rồi câu đã thay. */
function LoiThayThe({ tonic, thu }: { tonic: number; thu: boolean }) {
  const { h, giong } = nguCanh(tonic, thu)
  const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">Thay hợp âm trong đệm hát — vì sao thay được</h4>
      <p className="mb-3 text-xs text-dim">
        Mỗi lối: giữ gì, đổi gì, vì sao tai vẫn nhận. Bấm ▶ nghe câu gốc rồi câu đã thay ({giong}). Thế bấm để nghe: hợp âm có công thức
        chồng thì bấm theo công thức, còn lại bấm mộc — chưa phải thế bấm của thầy.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {loiThay(tonic, thu).map((l) => (
          <div key={l.ten} className="rounded-lg border border-line/60 p-3 text-xs">
            <p className="font-semibold text-cream">{l.ten}</p>
            <p className="text-dim">
              Giữ: {l.giu} · Đổi: {l.doi}
            </p>
            <p className="mt-1 text-cream/85">{l.viSao}</p>
            <div className="mt-2 flex flex-col items-start gap-1">
              <button type="button" onClick={() => void ngheChuoi(tonic, l.goc)} className="text-amber-key hover:underline">
                ▶ gốc: <span className="font-mono">{ten(l.goc)}</span>
              </button>
              <button type="button" onClick={() => void ngheChuoi(tonic, l.thay)} className="text-amber-key hover:underline">
                ▶ thay: <span className="font-mono">{ten(l.thay)}</span>
              </button>
            </div>
            {l.thayDung && <p className="mt-1 text-cream/75">Trong sheet: {l.thayDung}</p>}
            <p className="mt-1 text-dim">Nguồn: {l.nguon}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const NHOM_CT = ['Trưởng', 'Thứ', 'Nửa giảm · giảm', 'Át'] as const
const THE = ['nguyên vị', 'đảo 1', 'đảo 2', 'đảo 3']

/**
 * CHỒNG HỢP ÂM (Stack, Jeff Schneider) — người dùng 4/10/2026. Chọn công thức → thấy hai tầng ở giọng đang chọn (hoặc gốc tự chọn —
 * tập chuyển giọng, bước Jeff gọi là quan trọng nhất), đảo từng tầng, nghe, bàn phím tô hai màu. Đố chuyển giọng: gốc ngẫu nhiên,
 * tìm hợp âm tầng trên — gõ tên hoặc bấm trên đàn (đàn MIDI · chuột · bàn phím máy · chạm).
 */
function ChongHopAm({ tonic, thu }: { tonic: number; thu: boolean }) {
  // Có bàn phím thì phím bấm phải ra tiếng (người dùng 4/10/2026). Phần 1 chỉ có một bàn phím — không kêu đôi.
  useLiveSound()
  useComputerKeyboard(60)
  const style = kieuDau(tonic, thu)
  const [id, setId] = useState('m11')
  const [gocTu, setGocTu] = useState<number | null>(null)
  const [daoDuoi, setDaoDuoi] = useState(0)
  const [daoTren, setDaoTren] = useState(0)
  /* Đố chuyển giọng. */
  const [cau, setCau] = useState<{ ct: CongThuc; goc: number } | null>(null)
  const [kq, setKq] = useState<'dang' | 'dung' | 'xem'>('dang')
  const [go, setGo] = useState('')
  const [bao, setBao] = useState('')
  const [diem, setDiem] = useState({ cau: 0, dung: 0 })
  const ct = CONG_THUC.find((c) => c.id === id)!
  const viDu = thu ? ct.viDu.thu : ct.viDu.truong
  const goc = gocTu ?? (tonic + viDu) % 12
  const gocTen = gocTu === null ? tenTrongGiong(tonic, thu, viDu) : GOC[gocTu]!
  const bam = theBamChong(ct, goc, daoDuoi, daoTren)
  const chonCt = (x: string) => {
    setId(x)
    setDaoDuoi(0)
    setDaoTren(0)
    setCau(null)
  }
  const choi = async (not: readonly number[]) => {
    await startAudio()
    playChord([...not], '2n')
  }

  const cauMoi = () => {
    setCau({ ct: DO_DUOC[Math.floor(Math.random() * DO_DUOC.length)]!, goc: Math.floor(Math.random() * 12) })
    setKq('dang')
    setBao('')
    setGo('')
  }
  const dung = () => {
    setKq('dung')
    setDiem((d) => ({ cau: d.cau + 1, dung: d.dung + 1 }))
  }
  const held = useMidiStore((state) => state.heldNotes)
  useEffect(() => {
    if (cau && kq === 'dang' && held.length >= 3 && dungHopAm(held, pcsTren(cau.ct, cau.goc))) dung()
  }, [held, cau, kq])
  const cauTen = cau ? `${gocDep(GOC[cau.goc]!)}${hauDep(cau.ct.kyHieu)}` : ''
  /* Bàn phím: đang đố thì tắt gợi ý; trả lời xong thì chỉ thế bấm của câu đố; không đố thì chỉ công thức đang xem. */
  const hien = cau ? (kq === 'dang' ? null : theBamChong(cau.ct, cau.goc)) : bam
  const dapAn = cau ? `${tenTren(cau.ct, GOC[cau.goc]!, style)} (${tenHaiTay(cau.ct, GOC[cau.goc]!, style).phai.join(' – ')})` : ''
  /* Nhãn hai tay đi theo đúng thứ đang sáng trên bàn phím; đang đố thì ẩn để không lộ đáp án. */
  const nhan = cau ? (kq === 'dang' ? null : nhanHaiTay(cau.ct, GOC[cau.goc]!, style)) : nhanHaiTay(ct, gocTen, style, daoDuoi, daoTren)

  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">Chồng hợp âm — dựng hợp âm màu (Stack · Jeff Schneider)</h4>
      <div className="mb-3 flex flex-col gap-1.5 text-xs text-cream/85">
        <p>
          Ý chính của video: một hợp âm "khó" là <b className="text-cream">hai hợp âm dễ chồng lên nhau</b> — như đọc chữ "earthquake" thành
          "earth" + "quake". Tay trái một hợp âm ba (hay chỉ hai nốt 3 – 7 của hợp âm át), tay phải một hợp âm ba khác. Jeff lấy vòng 2-5-1
          Đô trưởng Dm7 – G7 – Cmaj7 rồi dựng thành Dm11 – G13♭9♯11 – Cmaj9 bằng ba công thức (đánh dấu "Jeff" ở dưới).
        </p>
        <p>
          Bước quan trọng trước khi đảo thế: nhớ <b className="text-cream">quan hệ</b> giữa hợp âm chồng trên và gốc ("thấp hơn gốc một
          cung", "trên bậc 5", "cách gốc ba cung") chứ không nhớ tên nốt — quan hệ đem sang giọng nào cũng đúng. Thế đảo: đổi nốt nằm dưới
          của từng tầng (nguyên vị · đảo 1 · đảo 2) để ra voicing mới; nốt sát nhau ("crunch") và hai tầng chồng lấn đều không sao. Bước khó
          nhất và quan trọng nhất: chuyển voicing sang giọng khác — vd Fm11 = Fa thứ + Mi♭ trưởng; B♭13♭9♯11 = Rê – La♭ + Mi thứ; E♭maj9 =
          Mi♭ trưởng + Si♭ trưởng.
        </p>
        <p className="text-dim">
          Nguồn: Jeff Schneider, "How I Play Jazz Piano Chords – The Chord Stack System" (01:22 – 09:59) — Claude đọc phụ đề tự động của
          video, không xem hình. Công thức đánh dấu "Claude" là suy ra cùng nguyên tắc cho các màu có trong sheet các thầy; mỗi công thức có
          test kiểm nốt khớp đúng hợp âm.
        </p>
      </div>

      <div className="mb-3 flex flex-col gap-1.5">
        {NHOM_CT.map((nhom) => (
          <div key={nhom} className="flex flex-wrap items-center gap-1">
            <span className="w-28 text-xs text-dim">{nhom}</span>
            {CONG_THUC.filter((c) => c.nhom === nhom).map((c) => (
              <button key={c.id} type="button" onClick={() => chonCt(c.id)} className={nut(id === c.id)}>
                {hauDep(c.kyHieu)}
                {c.nguon === 'jeff' && ' · Jeff'}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mb-2 rounded-lg border border-line/60 p-3 text-xs">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg text-amber-key">
            {gocDep(gocTen)}
            {hauDep(ct.kyHieu)}
          </span>
          <span className="text-dim">gốc</span>
          <select
            value={gocTu ?? ''}
            onChange={(event) => setGocTu(event.target.value === '' ? null : Number(event.target.value))}
            className={chonClass}
            aria-label="Gốc hợp âm"
          >
            <option value="">theo giọng</option>
            {GOC.map((g, i) => (
              <option key={g} value={i}>
                {g}
              </option>
            ))}
          </select>
          <span className="text-dim">Thầy dùng: {ct.thay.length ? ct.thay.join(' · ') : 'chưa thấy trong sheet các thầy'}</span>
        </div>
        <p className="text-cream/85">
          <span className="text-dim">Quan hệ tay phải với gốc: </span>
          {ct.quanHe}
        </p>
        <p className="mt-1 text-cream/85">
          <span className="text-dim">Vì sao (ví dụ chữ lấy ở Đô trưởng như video; ví dụ sheet ở giọng gốc của bài): </span>
          {ct.viSao}
        </p>
        <p className="mt-1 text-dim">Nguồn: {ct.nguon === 'jeff' ? 'Jeff Schneider (video)' : 'Claude suy ra cùng nguyên tắc'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void choi(bam.trai)} className={nut(false)}>
            ▶ Tay trái
          </button>
          <button type="button" onClick={() => void choi(bam.phai)} className={nut(false)}>
            ▶ Tay phải
          </button>
          <button type="button" onClick={() => void choi([...bam.trai, ...bam.phai])} className={nut(false)}>
            ▶ Cả hai
          </button>
          {ct.duoi.length > 1 && (
            <>
              <span className="ml-2 text-dim">Tay trái:</span>
              {ct.duoi.map((_, i) => (
                <button key={i} type="button" onClick={() => setDaoDuoi(i)} className={nut(daoDuoi === i)}>
                  {ct.duoi.length === 2 ? (i === 0 ? '3 dưới' : '7 dưới') : THE[i]}
                </button>
              ))}
            </>
          )}
          {soThe(ct) > 1 && (
            <>
              <span className="ml-2 text-dim">Tay phải:</span>
              {Array.from({ length: soThe(ct) }, (_, i) => (
                <button key={i} type="button" onClick={() => setDaoTren(i)} className={nut(daoTren === i)}>
                  {THE[i]}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="mb-1 grid min-h-9 grid-cols-2 gap-2 text-xs">
        {nhan && (
          <>
            <p>
              <span className="text-dim">Tay trái: </span>
              <b className="font-mono text-base text-teal-key">{nhan.trai}</b> <span className="text-cream/70">({nhan.traiPhu})</span>
            </p>
            <p className="text-right">
              <span className="text-dim">Tay phải: </span>
              <b className="font-mono text-base text-amber-key">{nhan.phai}</b> <span className="text-cream/70">({nhan.phaiPhu})</span>
            </p>
          </>
        )}
      </div>
      <OnScreenPiano
        lowNote={36}
        highNote={84}
        leftHandNotes={hien?.trai ?? []}
        rightHandNotes={hien?.phai ?? []}
      />
      <p className="mt-1 mb-3 min-h-7 text-center text-sm">
        {nhan && (
          <>
            <span className="text-dim">Hợp âm tổng: </span>
            <b className="font-mono text-lg text-cream">{nhan.tong}</b>
          </>
        )}
      </p>
      <div className="mb-2 rounded-lg border border-line/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-cream">Đố chuyển giọng</span>
          <button type="button" onClick={cauMoi} className={nut(false)}>
            {cau ? 'Câu khác' : 'Bắt đầu'}
          </button>
          {cau && (
            <>
              <span>
                <span className="font-mono text-base text-amber-key">{cauTen}</span> — tay trái {cau.ct.tenDuoi}; tay phải chồng hợp âm nào?
              </span>
              <button
                type="button"
                disabled={kq !== 'dang'}
                onClick={() => {
                  setKq('xem')
                  setDiem((d) => ({ ...d, cau: d.cau + 1 }))
                }}
                className={nut(false)}
              >
                Xem đáp án
              </button>
            </>
          )}
          {diem.cau > 0 && (
            <span className="ml-auto font-mono text-dim">
              đúng {diem.dung}/{diem.cau} câu
            </span>
          )}
        </div>
        {cau && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (kq !== 'dang') return
              const r = traLoiTen(go, pcsTren(cau.ct, cau.goc))
              if (r === 'dung') dung()
              else setBao(r === 'khong-doc' ? `Chưa đọc được "${go}" — gõ như C, Dbm, Bdim, Eb+` : `${go} — chưa đúng`)
              setGo('')
            }}
            className="mt-2 flex flex-wrap items-center gap-2"
          >
            <span className="text-dim">Bấm hợp âm ấy trên đàn (3 nốt, quãng tám nào cũng được) hoặc gõ tên:</span>
            <input
              value={go}
              onChange={(event) => setGo(event.target.value)}
              placeholder="vd Dbm"
              className={`${chonClass} w-24`}
              aria-label="Gõ tên hợp âm tầng trên"
            />
            <button type="submit" disabled={kq !== 'dang' || !go.trim()} className={nut(false)}>
              Trả lời
            </button>
            {kq === 'dang' && bao && <span className="text-rose-300">{bao}</span>}
            {kq === 'dung' && <b className="text-teal-key">Đúng — {dapAn}</b>}
            {kq === 'xem' && <span className="text-rose-300">Đáp án: {dapAn}</span>}
          </form>
        )}
      </div>

      <MidiConnect />
    </div>
  )
}

/** Quiz điền ô trống: một ô của vòng bị ẩn, bấm hợp âm ấy trên đàn (đàn MIDI · chuột · bàn phím máy · chạm). */
function NhoVong({ du, tonic, thu, bay }: { du: DuLieuSoanCau; tonic: number; thu: boolean; bay: boolean }) {
  // Phím bấm phải ra tiếng — người dùng 4/10/2026: "click vào phím đàn mà ko nghe tiếng". Mỗi lúc chỉ một phần mở, không kêu đôi.
  useLiveSound()
  useComputerKeyboard(60)
  const [nguon, setNguon] = useState<'thay' | 'ly-thuyet'>('thay')
  const ds = useMemo(
    () => (nguon === 'thay' ? vongCuaThay(du, tonic, thu) : vongLyThuyet(tonic, thu, bay)),
    [nguon, du, tonic, thu, bay],
  )
  const [hat, setHat] = useState(0)
  const cau = useMemo(() => {
    const v = ds[hat % Math.max(1, ds.length)]
    return v ? { v, an: Math.floor(hat / ds.length) % v.hopAm.length } : null
  }, [ds, hat])
  const [ketQua, setKetQua] = useState<'dang' | 'dung' | 'xem'>('dang')
  const [sai, setSai] = useState(0)
  const [diem, setDiem] = useState({ cau: 0, dungNgay: 0 })
  const daSaiLuotBam = useRef(false)
  /* Tự do mặc định; tick "Vào tập luyện" mới đếm điểm (người dùng 4/10/2026, ý 2). Lịch ôn thẻ nhớ ở bước sau. */
  const [tapLuyen, setTapLuyen] = useState(false)
  /* Trả lời bằng TÊN — chạm chọn gốc + loại, hoặc gõ (người dùng 4/10/2026, ý 5). Loại lấy từ các vòng đang hỏi. */
  const hauTo = useMemo(() => [...new Set(ds.flatMap((v) => v.hopAm.map((h) => h.replace(/^[A-G][#b]?/, ''))))], [ds])
  const [chonGoc, setChonGoc] = useState<string | null>(null)
  const [chonHau, setChonHau] = useState<string | null>(null)
  const [go, setGo] = useState('')
  const [baoTen, setBaoTen] = useState('')
  const traLoi = (ten: string) => {
    if (!cau || ketQua !== 'dang') return
    const kq = traLoiTen(ten, cau.v.pcs[cau.an]!)
    if (kq === 'khong-doc') {
      setBaoTen(`Chưa đọc được "${ten}" — gõ như Dm7, Bb, F#m`)
      return
    }
    if (kq === 'dung') {
      setKetQua('dung')
      setDiem((d) => ({ cau: d.cau + 1, dungNgay: d.dungNgay + (sai === 0 ? 1 : 0) }))
      setBaoTen('')
      return
    }
    setSai((x) => x + 1)
    setBaoTen(`${ten} — chưa đúng`)
  }

  const held = useMidiStore((state) => state.heldNotes)
  useEffect(() => {
    if (!cau || ketQua !== 'dang') return
    if (held.length === 0) {
      daSaiLuotBam.current = false
      return
    }
    const pcs = cau.v.pcs[cau.an]!
    if (dungHopAm(held, pcs)) {
      setKetQua('dung')
      setDiem((d) => ({ cau: d.cau + 1, dungNgay: d.dungNgay + (sai === 0 ? 1 : 0) }))
      return
    }
    if (!daSaiLuotBam.current && new Set(held.map((x) => x % 12)).size >= new Set(pcs).size) {
      daSaiLuotBam.current = true
      setSai((x) => x + 1)
    }
  }, [held, cau, ketQua, sai])

  const lamMoi = () => {
    setKetQua('dang')
    setSai(0)
    setChonGoc(null)
    setChonHau(null)
    setBaoTen('')
  }
  const cauKhac = () => {
    stopTimelineLoop()
    setHat(Math.floor(Math.random() * 1000))
    lamMoi()
  }

  if (!cau) return <p className="text-sm text-dim">Chưa có vòng ở giọng này.</p>
  return (
    <div className="flex flex-col gap-3">
      <div className={the}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-dim">
          Vòng hỏi:
          {(
            [
              ['thay', 'vòng thật từ sheet của chị'],
              ['ly-thuyet', 'vòng lý thuyết'],
            ] as const
          ).map(([value, ten]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setNguon(value)
                setHat(0)
                lamMoi()
              }}
              className={nut(nguon === value)}
            >
              {ten}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-cream">
            <input type="checkbox" checked={tapLuyen} onChange={(event) => setTapLuyen(event.target.checked)} />
            Vào tập luyện — đếm điểm
          </label>
          {tapLuyen && (
            <span className="font-mono">
              đúng ngay lần đầu {diem.dungNgay}/{diem.cau} câu
            </span>
          )}
        </div>
        <p className="mb-2 text-xs text-dim">{cau.v.ten}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {cau.v.hopAm.map((h, i) => (
            <span
              key={i}
              className={`min-w-16 rounded-lg border px-3 py-2 text-center font-mono text-lg ${
                i === cau.an ? 'border-amber-key text-amber-key' : 'border-line text-cream'
              }`}
            >
              {i === cau.an && ketQua === 'dang' ? '?' : h}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void ngheVong(cau.v.pcs)} className={nut(false)}>
            ▶ Nghe vòng
          </button>
          <button
            type="button"
            disabled={ketQua !== 'dang'}
            onClick={() => {
              setKetQua('xem')
              setDiem((d) => ({ ...d, cau: d.cau + 1 }))
            }}
            className={nut(false)}
          >
            Xem đáp án
          </button>
          <button type="button" onClick={cauKhac} className={nut(false)}>
            Câu khác
          </button>
          <span className="text-xs">
            {ketQua === 'dung' && <b className="text-teal-key">Đúng — {cau.v.hopAm[cau.an]}</b>}
            {ketQua === 'xem' && <span className="text-rose-300">Đáp án: {cau.v.hopAm[cau.an]}</span>}
            {ketQua === 'dang' && (
              <span className="text-dim">
                Bấm hợp âm còn thiếu trên đàn (giữ cùng lúc mọi nốt, quãng tám nào cũng được), hoặc chọn / gõ tên ở dưới
                {sai > 0 && ` · chưa đúng ${sai} lần`}
              </span>
            )}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-line/60 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-dim">Chạm chọn tên:</span>
            {GOC.map((g) => (
              <button key={g} type="button" onClick={() => setChonGoc(g)} className={nut(chonGoc === g)}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-dim">loại:</span>
            {hauTo.map((h) => (
              <button key={h} type="button" onClick={() => setChonHau(h)} className={nut(chonHau === h)}>
                {h || 'trưởng'}
              </button>
            ))}
            <button
              type="button"
              disabled={chonGoc === null || chonHau === null || ketQua !== 'dang'}
              onClick={() => traLoi(`${chonGoc}${chonHau}`)}
              className="ml-2 rounded-lg bg-amber-key px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
            >
              Trả lời {chonGoc ?? '…'}
              {chonHau ?? ''}
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              traLoi(go)
              setGo('')
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-dim">hoặc gõ tên:</span>
            <input
              value={go}
              onChange={(event) => setGo(event.target.value)}
              placeholder="vd Dm7"
              className={`${chonClass} w-28`}
              aria-label="Gõ tên hợp âm còn thiếu"
            />
            <button type="submit" disabled={ketQua !== 'dang' || !go.trim()} className={nut(false)}>
              Trả lời
            </button>
            {baoTen && <span className="text-rose-300">{baoTen}</span>}
          </form>
        </div>
      </div>
      <MidiConnect />
      <OnScreenPiano lowNote={48} highNote={84} highlightNotes={ketQua === 'dang' ? [] : theBam(cau.v.pcs[cau.an]!)} />
    </div>
  )
}

/** Chọn nốt solo — bám sheet: trên từng hợp âm của một vòng, chị đánh nốt nào bao nhiêu phần trăm. */
function ChonNot({ teacher, du, tonic, thu }: { teacher: Teacher; du: DuLieuSoanCau; tonic: number; thu: boolean }) {
  useLiveSound()
  useComputerKeyboard(60)
  const ds = vongCuaThay(du, tonic, thu)
  const [vongId, setVongId] = useState<string | null>(null)
  const [phach, setPhach] = useState<'ca' | 'manh' | 'nhe'>('ca')
  const [chon, setChon] = useState(0)
  const v = ds.find((x) => x.id === vongId) ?? ds[0]
  if (!v) return <p className="text-sm text-dim">Chưa có vòng ở giọng này.</p>

  const cacHop = v.vong.hopAm.map((h, i) => {
    const pb = phanBoNot(du, v.dieu, thu, h.chat, phach)
    return { hopAm: v.hopAm[i]!, chat: h.chat, goc: tonic + h.goc, pcs: v.pcs[i]!, pb, xep: xepNot(pb) }
  })
  const dangChon = cacHop[chon] ?? cacHop[0]!
  const sang = dangChon.xep
    .filter((m) => m.muc === 'hay')
    .flatMap((m) => [60, 72].map((o) => o + ((dangChon.goc + m.rel) % 12)))

  return (
    <div className="flex flex-col gap-3">
      <div className={the}>
        <p className="mb-2 text-xs text-dim">
          Phần trăm = số nốt chị đánh trên loại hợp âm ấy ở đoạn solo (nốt cao nhất mỗi cú tay phải), bậc tính từ gốc hợp âm.
          "Hay dùng" là nhóm nốt gộp lại tới ~70 % số nốt của chị (Claude chọn mốc, chưa đo). {GHI_CHU_THAY[teacher.id]?.not}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
          Vòng:
          <select
            value={v.id}
            onChange={(event) => {
              setVongId(event.target.value)
              setChon(0)
            }}
            className={chonClass}
          >
            {ds.map((x) => (
              <option key={x.id} value={x.id}>
                {x.ten} — {x.hopAm.join(' ')}
              </option>
            ))}
          </select>
          {(
            [
              ['ca', 'mọi phách'],
              ['manh', 'phách mạnh'],
              ['nhe', 'phách nhẹ'],
            ] as const
          ).map(([value, ten]) => (
            <button key={value} type="button" onClick={() => setPhach(value)} className={nut(phach === value)}>
              {ten}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cacHop.map((h, i) => (
          <div key={i} className={`${the} ${i === chon ? 'ring-1 ring-amber-key' : ''}`}>
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <button
                type="button"
                onClick={() => {
                  setChon(i)
                  void nghe(h.pcs)
                }}
                className="text-lg font-semibold text-amber-key hover:underline"
              >
                ▶ {h.hopAm}
              </button>
              <span className="text-[11px] text-dim">
                {h.pb.moTa} · n = {h.pb.n}
              </span>
            </div>
            {(['hay', 'co', 'chua'] as const).map((muc) => {
              const ds_ = h.xep.filter((m) => m.muc === muc)
              if (!ds_.length) return null
              return (
                <p key={muc} className={`text-xs ${muc === 'hay' ? 'text-cream' : muc === 'co' ? 'text-cream/70' : 'text-dim'}`}>
                  <b>{muc === 'hay' ? 'Chị hay dùng' : muc === 'co' ? 'Có dùng' : 'Chưa gặp trong sheet'}:</b>{' '}
                  {ds_
                    .map((m) => `${tenBac(m.rel, h.chat)} (${tenNotBac(h.goc, m.rel, h.chat, tonic, thu)})${muc === 'chua' ? '' : ` ${phanTram(m.phanTram)}`}`)
                    .join(' · ')}
                </p>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-dim">
        Phím sáng: nhóm chị hay dùng trên <b className="text-cream">{dangChon.hopAm}</b> — bấm tên hợp âm khác để đổi.
      </p>
      <OnScreenPiano lowNote={48} highNote={84} highlightNotes={sang} />
    </div>
  )
}
