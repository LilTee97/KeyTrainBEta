import { useState } from 'react'
import { playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { doanGiong, PHONG_CACH, taoDo, type Giong, type PhongCach } from './soanCau/doTaiHoaAm'
import { nguCanh, theBamHop, type Hop } from './soanCau/giaiThich'
import { docHop, docVong } from './soanCau/thayTrongVong'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const NGUON = {
  thay: 'Lời thầy: số đo sheet + lời nhạc sĩ của Claude, đã duyệt.',
  suy: 'Suy luận của Claude — bậc này chưa có luật riêng của thầy.',
  claude: 'Tư duy của Claude — không phải số đo.',
} as const

const nghe = async (tonic: number, ds: readonly Hop[]) => {
  await startAudio()
  playChordSequence(
    ds.map((x) => theBamHop(tonic, x)),
    1.2,
  )
}

/**
 * ĐỐ TÁI HÒA ÂM — người dùng 11/10/2026 (lời đầy đủ ở `soanCau/doTaiHoaAm.ts`): nhập vòng → app đoán chủ âm (đổi được) và tái hòa âm sẵn
 * ô chủ âm → mỗi ô còn lại chọn một trong bốn theo phong cách đang chọn; gợi ý bật khi cần; chọn xong hiện lời giải thích và nghe trong vòng.
 */
export function DoTaiHoaAm() {
  const [chu, setChu] = useState('Dm G C Am')
  const [nhap, setNhap] = useState('Dm G C Am')
  const [loi, setLoi] = useState('')
  const [p, setP] = useState<PhongCach>('ca-phao')
  const [ep, setEp] = useState<Giong | null>(null)
  const ds = docHop(nhap)
  const ung = ds ? doanGiong(ds) : []
  const g = ep ?? ung[0]
  const hop = g ? docVong(nhap, g.tonic) : null
  return (
    <div className="rounded-xl border border-line bg-black/25 p-4 text-sm">
      <h4 className="mb-1 font-semibold text-cream">Đố tái hòa âm — nhập vòng, chọn hợp âm theo lối thầy</h4>
      <p className="mb-3 text-xs text-dim">
        Nhập một vòng → app tìm chủ âm (không cần đứng đầu vòng) và tái hòa âm sẵn ô chủ âm; mỗi ô còn lại bạn chọn một trong bốn hợp âm — cái
        mà phong cách đang chọn sẽ bấm. Bấm một phương án là nghe nó trong vòng. Giọng đoán từ chính vòng bạn nhập, không theo ô "Giọng" phía
        trên.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (docHop(chu)) {
            setNhap(chu)
            setEp(null)
            setLoi('')
          } else setLoi(`Chưa đọc được "${chu}" — gõ như F G Em Am, hay Dm7 G7 Cmaj7`)
        }}
        className="mb-2 flex flex-wrap items-center gap-2 text-xs"
      >
        <span className="text-dim">Vòng:</span>
        <input
          value={chu}
          onChange={(event) => setChu(event.target.value)}
          placeholder="vd F G Em Am"
          className="w-56 rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
          aria-label="Vòng để đố"
        />
        <button type="submit" disabled={!chu.trim()} className={nut(false)}>
          Đố
        </button>
        {loi && <span className="text-rose-300">{loi}</span>}
      </form>
      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-dim">Phong cách:</span>
        {PHONG_CACH.map((q) => (
          <button key={q.id} type="button" onClick={() => setP(q.id)} className={nut(p === q.id)}>
            {q.ten}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-cream/70">{PHONG_CACH.find((q) => q.id === p)!.tom}</p>
      {g && hop ? (
        <>
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-dim">Chủ âm:</span>
            {ung.map((u, k) => {
              const nc = nguCanh(u.tonic, u.thu)
              return (
                <button key={`${u.tonic}${u.thu}`} type="button" onClick={() => setEp(u)} className={nut(u.tonic === g.tonic && u.thu === g.thu)}>
                  {nc.h(0, u.thu ? 'm' : '')} · {nc.giong}
                  {k === 0 ? ' (app đoán)' : ''}
                </button>
              )
            })}
          </div>
          <p className="mb-3 text-xs text-dim">
            App đoán theo: hợp âm nào nằm ngoài giọng, chỗ nào kéo về chủ âm (V → I, IV → I, ♭VII → i …), hợp âm đầu và cuối vòng. Vòng lặp
            nhiều khi hiểu được hai cách (Am F C G: La thứ hay Đô trưởng) — bấm để đổi.
          </p>
          <BaiDo key={`${nhap}|${p}|${g.tonic}|${g.thu}`} p={p} g={g} hop={hop} />
        </>
      ) : (
        ds && <p className="text-xs text-rose-300">Vòng không có hợp âm trưởng hay thứ nào để làm chủ âm.</p>
      )}
    </div>
  )
}

function BaiDo({ p, g, hop }: { p: PhongCach; g: Giong; hop: Hop[] }) {
  const { h, giong } = nguCanh(g.tonic, g.thu)
  const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
  const [cau] = useState(() => taoDo(p, hop, g.tonic, g.thu))
  const dau = Math.max(0, cau.findIndex((c) => !c.laChu))
  const [chon, setChon] = useState<Record<number, number>>({})
  const [o, setO] = useState(dau)
  const [goiY, setGoiY] = useState(false)
  const tenP = PHONG_CACH.find((q) => q.id === p)!.ten
  const xong = (i: number) => cau[i]!.laChu || chon[i] !== undefined
  // Vòng đang có: ô chủ âm và ô đã chọn mang đáp án, ô chưa chọn giữ bài ghi.
  const vongMoi = hop.map((x, i) => (xong(i) ? cau[i]!.dap.dap : [x]))
  const trongVong = (i: number, ds: readonly Hop[]) =>
    hop.length > 1 ? [vongMoi[(i - 1 + hop.length) % hop.length]!.at(-1)!, ...ds, vongMoi[(i + 1) % hop.length]![0]!] : ds
  const soDo = cau.filter((c) => !c.laChu).length
  const daChon = Object.keys(chon).length
  const dung = Object.entries(chon).filter(([i, k]) => cau[Number(i)]!.dung === k).length
  const c = cau[o]!
  const k = chon[o]
  const sau = () => {
    for (let d = 1; d <= hop.length; d += 1) {
      const j = (o + d) % hop.length
      if (!xong(j)) return setO(j)
    }
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-stretch gap-1.5">
        {hop.map((x, i) => {
          const cu = cau[i]!
          const tra = chon[i]
          const mau =
            o === i
              ? 'border-amber-key bg-amber-key/15 text-amber-key'
              : cu.laChu || tra === cu.dung
                ? 'border-teal-key/60 text-teal-key'
                : tra === undefined
                  ? 'border-line text-cream'
                  : 'border-rose-400/60 text-rose-300'
          return (
            <button key={i} type="button" onClick={() => setO(i)} className={`min-w-16 rounded-lg border px-3 py-2 text-center font-mono text-sm ${mau}`}>
              {xong(i) ? ten(cu.dap.dap) : ten([x])}
              <span className="block font-sans text-[10px] text-dim">
                {cu.laChu ? `chủ âm · bài ghi ${ten([x])}` : tra === undefined ? 'chưa chọn' : `bài ghi ${ten([x])}`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-2 rounded-lg border border-line/60 p-3 text-xs">
        {c.laChu ? (
          <p className="text-cream">
            Ô {o + 1}: <b className="font-mono">{ten([hop[o]!])}</b> là hợp âm chủ ({giong}) — đã tái hòa âm sẵn theo lối {tenP}:{' '}
            <b className="font-mono text-teal-key">{ten(c.dap.dap)}</b>
          </p>
        ) : (
          <>
            <p className="mb-2 text-cream">
              Ô {o + 1}: bài ghi <b className="font-mono">{ten([hop[o]!])}</b> — {tenP} bấm gì ở đây?
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {c.luaChon.map((l, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    if (k === undefined) setChon((x) => ({ ...x, [o]: j }))
                    void nghe(g.tonic, trongVong(o, l.hop))
                  }}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-sm ${
                    k === undefined
                      ? 'border-line bg-white/4 text-cream hover:bg-white/8'
                      : j === c.dung
                        ? 'border-teal-key bg-teal-key/15 text-teal-key'
                        : j === k
                          ? 'border-rose-400/60 text-rose-300'
                          : 'border-line text-dim'
                  }`}
                >
                  {ten(l.hop)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setGoiY((x) => !x)} className={nut(goiY)}>
                {goiY ? 'Tắt gợi ý' : 'Bật gợi ý'}
              </button>
              {goiY && k === undefined && <span className="text-amber-key">Gợi ý: {c.dap.goiY}</span>}
            </div>
          </>
        )}
        {(c.laChu || k !== undefined) && (
          <div className="mt-2 border-t border-line/40 pt-2">
            {k !== undefined && (
              <p className={`mb-1 font-semibold ${k === c.dung ? 'text-teal-key' : 'text-rose-300'}`}>
                {k === c.dung
                  ? `Đúng lối ${tenP}.`
                  : `Chưa đúng — bạn chọn ${ten(c.luaChon[k]!.hop)} (${c.luaChon[k]!.nguon}). ${tenP} bấm ${ten(c.dap.dap)}.`}
              </p>
            )}
            <p className="font-semibold text-cream">{c.dap.y}</p>
            <p className="mt-1 text-cream/85">{c.dap.giai}</p>
            {c.dap.viDu && <p className="mt-1 text-dim">Ví dụ trong sheet: {c.dap.viDu}</p>}
            {c.dap.ai && <p className="mt-1 text-dim">Ai chọn: {c.dap.ai}</p>}
            <p className="mt-1 text-dim">Cơ sở: {c.dap.coSo}</p>
            {c.dap.cung.length > 0 && <p className="mt-1 text-dim">Cũng đúng lối này: {c.dap.cung.map(ten).join(' · ')}</p>}
            <p className="mt-1 text-[10px] text-dim">{NGUON[c.dap.nguon]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => void nghe(g.tonic, trongVong(o, c.dap.dap))} className={nut(false)}>
                ▶ Đáp án trong vòng
              </button>
              <button type="button" onClick={() => void nghe(g.tonic, trongVong(o, [hop[o]!]))} className={nut(false)}>
                ▶ Bài ghi trong vòng
              </button>
              {daChon < soDo && (
                <button type="button" onClick={sau} className={nut(false)}>
                  Ô tiếp →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={() => void nghe(g.tonic, hop)} className={nut(false)}>
          ▶ Vòng bài ghi
        </button>
        <button type="button" onClick={() => void nghe(g.tonic, vongMoi.flat())} className={nut(false)} title="Ô chưa chọn phát hợp âm bài ghi">
          ▶ Vòng đã tái hòa âm
        </button>
        <button
          type="button"
          onClick={() => {
            setChon({})
            setO(dau)
          }}
          className={nut(false)}
        >
          Đố lại
        </button>
        <span className="text-dim">
          Đúng {dung}/{daChon} ô đã chọn · còn {soDo - daChon} ô{daChon === soDo && soDo > 0 ? ' — xong vòng' : ''}
        </span>
      </div>
    </>
  )
}
