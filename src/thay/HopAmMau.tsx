import { useState } from 'react'
import { playChord, startAudio } from '../shared/audio/audioEngine'
import { useLiveSound } from '../shared/audio/useLiveSound'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { useMidiStore } from '../shared/midi/midiStore'
import { OnScreenPiano } from '../shared/midi/onScreenPiano/OnScreenPiano'
import { useComputerKeyboard } from '../shared/midi/onScreenPiano/useComputerKeyboard'
import { CONG_THUC, gocDep, hauDep, KHI_CHON, pcsTong, tenTrongGiong, theBamChong, type CongThuc } from './soanCau/chongHopAm'
import { lyDoThay, lyThuyetCacBac, nguCanh, theBamHop } from './soanCau/giaiThich'
import { dungHopAm } from './soanCau/soanCau'
import { DiemThay } from './SoanCau'
import { TEACHERS } from './teachers'

const pc = (x: number) => ((x % 12) + 12) % 12
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const the = 'rounded-xl border border-line bg-black/25 p-4 text-sm'

/** Hợp âm gốc của từng bậc (nửa cung so với chủ âm) và họ màu của nó. */
const BAC: Record<'truong' | 'thu', readonly { goc: number; laMa: string; nhom: CongThuc['nhom']; chat: string }[]> = {
  truong: [
    { goc: 0, laMa: 'I', nhom: 'Trưởng', chat: '' },
    { goc: 2, laMa: 'ii', nhom: 'Thứ', chat: 'm' },
    { goc: 4, laMa: 'iii', nhom: 'Thứ', chat: 'm' },
    { goc: 5, laMa: 'IV', nhom: 'Trưởng', chat: '' },
    { goc: 7, laMa: 'V', nhom: 'Át', chat: '7' },
    { goc: 9, laMa: 'vi', nhom: 'Thứ', chat: 'm' },
    { goc: 11, laMa: 'vii°', nhom: 'Nửa giảm · giảm', chat: 'm7b5' },
  ],
  thu: [
    { goc: 0, laMa: 'i', nhom: 'Thứ', chat: 'm' },
    { goc: 2, laMa: 'ii°', nhom: 'Nửa giảm · giảm', chat: 'm7b5' },
    { goc: 3, laMa: '♭III', nhom: 'Trưởng', chat: '' },
    { goc: 5, laMa: 'iv', nhom: 'Thứ', chat: 'm' },
    { goc: 7, laMa: 'V', nhom: 'Át', chat: '7' },
    { goc: 8, laMa: '♭VI', nhom: 'Trưởng', chat: '' },
    { goc: 10, laMa: '♭VII', nhom: 'Trưởng', chat: '' },
  ],
}
const THAY_THAM_KHAO = ['linh-nhi', 'ca-phao', 'blues'] as const
const GOI: Record<(typeof THAY_THAM_KHAO)[number], string> = { 'linh-nhi': 'chị', 'ca-phao': 'anh', blues: 'người chơi' }

/** Hợp âm đang "đánh theo": tên, nốt hai tay để sáng trên bàn phím, lớp cao độ để chấm. */
interface Dich {
  ten: string
  trai: number[]
  phai: number[]
  pcs: number[]
}

const choi = async (not: readonly number[]) => {
  await startAudio()
  playChord([...not], '2n')
}

/** Một lựa chọn: tên, ▶ nghe, "Đánh theo", lời khi nào nên chọn. */
function LuaChon({ d, khi, phu, dangChon, onDanh }: { d: Dich; khi: string; phu?: string; dangChon: boolean; onDanh: (d: Dich) => void }) {
  return (
    <div className={`rounded-lg border p-3 text-xs ${dangChon ? 'border-amber-key/70' : 'border-line/60'}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-mono text-base text-amber-key">{d.ten}</span>
        <button type="button" onClick={() => void choi([...d.trai, ...d.phai])} className={nut(false)}>
          ▶ nghe
        </button>
        <button type="button" onClick={() => onDanh(d)} className={nut(dangChon)}>
          Đánh theo
        </button>
      </div>
      <p className="text-cream/85">{khi}</p>
      {phu && <p className="mt-1 text-dim">{phu}</p>}
    </div>
  )
}

/**
 * Tab HỢP ÂM MÀU — tái hòa âm MỘT hợp âm (người dùng 8/10/2026: "Cho hợp âm gốc rồi bắt tìm hợp âm màu của nó … lấy các phong cách đặt
 * hòa âm của Linh Nhi, Cà Pháo và Blues để tham khảo … ở mỗi bậc hãy cho các lựa chọn sẵn để tôi đánh theo, ở mỗi lựa chọn hãy giải thích
 * khi nào nên chọn hợp âm đó"). Ba nhóm lựa chọn ở mỗi bậc: thêm màu (công thức chồng + `KHI_CHON`), thay bằng hợp âm khác (lối thay lý
 * thuyết `lyThuyetCacBac`), các thầy làm gì ở bậc này (thẻ Phần 1 của ba thầy). "Đánh theo" → bàn phím sáng thế bấm hai màu tay, bấm đúng
 * thì báo.
 */
export function HopAmMau({ tonic, thu }: { tonic: number; thu: boolean }) {
  useLiveSound()
  useComputerKeyboard(60)
  const { h } = nguCanh(tonic, thu)
  const dsBac = BAC[thu ? 'thu' : 'truong']
  const [chon, setChon] = useState(0)
  const [dich, setDich] = useState<Dich | null>(null)
  const held = useMidiStore((state) => state.heldNotes)
  const bac = dsBac.find((b) => b.goc === chon) ?? dsBac[0]!
  const lt = lyThuyetCacBac(tonic, thu).find((b) => b.goc === bac.goc)
  const gocPc = pc(tonic + bac.goc)
  const gocTen = tenTrongGiong(tonic, thu, bac.goc)
  const mau = CONG_THUC.filter((c) => c.nhom === bac.nhom && c.kyHieu !== bac.chat)
  const dung = dich !== null && held.length >= 3 && dungHopAm(held, dich.pcs)

  const dichMau = (c: CongThuc): Dich => {
    const b = theBamChong(c, gocPc)
    return { ten: `${gocDep(gocTen)}${hauDep(c.kyHieu)}`, trai: [...b.trai], phai: [...b.phai], pcs: pcsTong(c, gocPc) }
  }
  const dichHop = (x: { goc: number; chat: string; bass?: number }): Dich => {
    const not = theBamHop(tonic, x)
    return { ten: h(x.goc, x.chat, x.bass), trai: not.slice(0, 1), phai: not.slice(1), pcs: [...new Set(not.map(pc))] }
  }
  /* Lối thay lý thuyết trùng tên một màu ở trên (vd G13♭9♯11, G9sus4 ở V) thì không in lại. */
  const tenMau = new Set(mau.map((c) => dichMau(c).ten))
  const thayKhac = (lt?.thay ?? []).filter((t) => !tenMau.has(h(t.goc, t.chat, t.bass)))

  return (
    <div className="flex flex-col gap-4">
      <div className={the}>
        <h4 className="mb-1 font-semibold text-cream">Hợp âm màu — mỗi bậc có những lựa chọn nào, khi nào nên chọn</h4>
        <p className="mb-2 text-xs text-dim">
          Chọn một bậc. Mỗi lựa chọn: ▶ nghe, "Đánh theo" — bàn phím sáng thế bấm (tay trái xanh, tay phải cam), bấm đúng thì báo. Lời "khi
          nào nên chọn" là phân tích của Claude trong vai nhạc sĩ, không phải số đo; phần "các thầy" là thẻ Phần 1 của từng thầy (có số đo).
        </p>
        <div className="flex flex-wrap gap-1.5">
          {dsBac.map((b) => (
            <button
              key={b.goc}
              type="button"
              onClick={() => {
                setChon(b.goc)
                setDich(null)
              }}
              className={nut(b.goc === bac.goc)}
            >
              {b.laMa} · {h(b.goc, b.chat)}
            </button>
          ))}
        </div>
      </div>

      <div className={the}>
        <h4 className="mb-1 font-semibold text-cream">
          {bac.laMa} · {h(bac.goc, bac.chat)}
          {lt && <span className="font-normal text-dim"> — {lt.vai}</span>}
        </h4>
        {lt && <p className="mb-3 text-xs text-cream/85">{lt.viSao}</p>}

        <h5 className="mb-2 text-xs font-semibold tracking-wide text-dim uppercase">Thêm màu — giữ hợp âm, thêm nốt (bấm kiểu chồng)</h5>
        <div className="mb-4 grid gap-2 lg:grid-cols-2">
          {mau.map((c) => (
            <LuaChon
              key={c.id}
              d={dichMau(c)}
              khi={KHI_CHON[c.id] ?? ''}
              phu={c.thay.length ? `Thầy dùng: ${c.thay.join(' · ')}` : undefined}
              dangChon={dich?.ten === dichMau(c).ten}
              onDanh={setDich}
            />
          ))}
        </div>

        {thayKhac.length > 0 && (
          <>
            <h5 className="mb-2 text-xs font-semibold tracking-wide text-dim uppercase">Thay bằng hợp âm khác — lý thuyết</h5>
            <div className="mb-4 grid gap-2 lg:grid-cols-2">
              {thayKhac.map((t) => (
                <LuaChon
                  key={`${t.goc}${t.chat}${t.bass ?? ''}`}
                  d={dichHop(t)}
                  khi={t.viSao}
                  dangChon={dich?.ten === dichHop(t).ten}
                  onDanh={setDich}
                />
              ))}
            </div>
          </>
        )}

        <h5 className="mb-2 text-xs font-semibold tracking-wide text-dim uppercase">Các thầy làm gì ở bậc này</h5>
        <div className="grid gap-3 lg:grid-cols-3">
          {THAY_THAM_KHAO.map((id) => {
            const ds = lyDoThay(id, tonic, thu)?.bac[bac.goc] ?? []
            return (
              <div key={id} className="rounded-lg border border-line/60 p-3">
                <p className="mb-2 text-xs font-semibold text-cream">{TEACHERS.find((t) => t.id === id)?.label}</p>
                {ds.length ? (
                  ds.map((d) => <DiemThay key={d.y} d={d} tonic={tonic} thu={thu} ai={GOI[id]} />)
                ) : (
                  <p className="text-xs text-dim">Ở bậc này không có lối riêng đáng kể trong các sheet.</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={the}>
        <p className="mb-1 min-h-6 text-xs">
          {dich ? (
            <>
              <span className="text-dim">Đánh theo: </span>
              <b className="font-mono text-base text-amber-key">{dich.ten}</b>{' '}
              {dung ? <b className="text-teal-key">— Đúng!</b> : <span className="text-dim">— bấm đủ các phím đang sáng (quãng tám nào cũng được)</span>}
            </>
          ) : (
            <span className="text-dim">Chọn "Đánh theo" ở một lựa chọn để bàn phím sáng thế bấm.</span>
          )}
        </p>
        <OnScreenPiano lowNote={36} highNote={84} leftHandNotes={dich?.trai ?? []} rightHandNotes={dich?.phai ?? []} />
        <div className="mt-2">
          <MidiConnect />
        </div>
      </div>
    </div>
  )
}
