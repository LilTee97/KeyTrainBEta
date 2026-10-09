import { useState } from 'react'
import { playChordSequence, startAudio } from '../shared/audio/audioEngine'
import { nguCanh, theBamHop, type Hop } from './soanCau/giaiThich'
import { cacLuaChon, canhVong, docVong, LOAI, loiChon, vongLyThuyetHop, type LoaiThay, type LuaChonThay } from './soanCau/thayTrongVong'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`
const the = 'rounded-xl border border-line bg-black/25 p-4 text-sm'
const THU_TU: readonly LoaiThay[] = ['at-phu', 'ii-v', 'ho-hang', 'tam-cung', 'giam-luot', 'muon', 'treo', 'cau-thang', 'nghieng', 'mau']

export interface VongCoSan {
  id: string
  ten: string
  ghiChu: string
  hop: Hop[]
}

const nghe = async (tonic: number, ds: readonly Hop[]) => {
  await startAudio()
  playChordSequence(
    ds.map((x) => theBamHop(tonic, x)),
    1.2,
  )
}

/**
 * VÒNG + LỰA CHỌN THAY — người dùng 8/10/2026 (mục D và C-theo-vòng, chốt gộp làm một công cụ 9/10/2026): chọn vòng sẵn (của thầy · lý
 * thuyết) hoặc tự điền; bấm một ô → các hợp âm thay theo loại; chọn → thay vào vòng đang thử và giải thích: nghe ra sao, khi nào chọn
 * (lời nhạc sĩ của Claude), vòng rẽ về đâu, và câu tính ở đúng chỗ ấy (bass, nốt chung, nốt dẫn, nốt ngoài gam). Không có bàn phím
 * riêng — Phần 2 tab thầy đã có bàn phím của đố nhớ vòng (hai bàn phím thì kêu đôi).
 */
export function VongLuaChon({ tonic, thu, cuaThay, tenThay }: { tonic: number; thu: boolean; cuaThay?: readonly VongCoSan[]; tenThay?: string }) {
  const { h } = nguCanh(tonic, thu)
  const lyThuyet = vongLyThuyetHop(tonic, thu)
  const dsVong: readonly (VongCoSan & { nhom: string })[] = [
    ...(cuaThay ?? []).map((v) => ({ ...v, nhom: tenThay ?? 'Thầy' })),
    ...lyThuyet.map((v) => ({ ...v, nhom: 'Lý thuyết' })),
  ]
  const [id, setId] = useState<string | null>(null)
  const [tuDien, setTuDien] = useState('')
  const [loiDien, setLoiDien] = useState('')
  const [goc, setGoc] = useState<Hop[]>(() => dsVong[0]?.hop ?? [])
  const [o, setO] = useState<Hop[][]>(() => (dsVong[0]?.hop ?? []).map((x) => [x]))
  const [chonO, setChonO] = useState<number | null>(null)
  const [daChon, setDaChon] = useState<{ i: number; lc: LuaChonThay; cu: Hop[] } | null>(null)
  const vongDangChon = id ?? dsVong[0]?.id ?? null

  const dung = (v: Hop[], vid: string | null) => {
    setId(vid)
    setGoc(v)
    setO(v.map((x) => [x]))
    setChonO(null)
    setDaChon(null)
  }
  const ten = (ds: readonly Hop[]) => ds.map((x) => h(x.goc, x.chat, x.bass)).join(' – ')
  /* Lựa chọn tính trên hợp âm GỐC của ô ấy; hợp âm trước / sau lấy từ vòng đang thử (ô bên cạnh đã đổi thì tính theo cái mới —
     ô sau lấy hợp âm đầu, ô khác lấy hợp âm cuối của ô). */
  const vongPhang = (k: number) => o.map((ds, j) => (j === k ? goc[k]! : j === (k + 1) % o.length ? ds[0]! : ds[ds.length - 1]!))
  const luaChon = chonO === null ? [] : cacLuaChon(vongPhang(chonO), chonO, thu)

  return (
    <div className={the}>
      <h4 className="mb-1 font-semibold text-cream">Vòng + lựa chọn thay — mỗi hợp âm thay được bằng gì, vì sao, vòng rẽ về đâu</h4>
      <p className="mb-3 text-xs text-dim">
        Chọn vòng (hoặc tự điền) → bấm một ô → chọn hợp âm thay; lời giải thích hiện bên dưới. Lời "nghe ra sao · khi nào chọn · vòng rẽ về
        đâu" là phân tích của Claude trong vai nhạc sĩ; dòng "Ở chỗ này" tính từ đúng các nốt. ▶ phát mỗi hợp âm một nhịp đều nhau.
      </p>

      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        {dsVong.map((v) => (
          <button key={`${v.nhom}${v.id}`} type="button" onClick={() => dung(v.hop, v.id)} className={nut(vongDangChon === v.id)} title={v.ghiChu}>
            {v.nhom === 'Lý thuyết' ? '' : `${v.nhom} · `}
            {v.ten}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const v = docVong(tuDien, tonic)
          if (v) {
            dung(v, 'tu-dien')
            setLoiDien('')
          } else setLoiDien(`Chưa đọc được "${tuDien}" — gõ như C G Am F, hay Dm7 G7 Cmaj7`)
        }}
        className="mb-3 flex flex-wrap items-center gap-2 text-xs"
      >
        <span className="text-dim">Tự điền vòng:</span>
        <input
          value={tuDien}
          onChange={(event) => setTuDien(event.target.value)}
          placeholder="vd C G Am F"
          className="w-48 rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
          aria-label="Tự điền vòng"
        />
        <button type="submit" disabled={!tuDien.trim()} className={nut(false)}>
          Dùng
        </button>
        {loiDien && <span className="text-rose-300">{loiDien}</span>}
      </form>

      <div className="mb-2 flex flex-wrap items-stretch gap-1.5">
        {o.map((ds, i) => {
          const doi = ds.length !== 1 || ds[0] !== goc[i]
          return (
            <button
              key={i}
              type="button"
              onClick={() => setChonO(i === chonO ? null : i)}
              className={`min-w-16 rounded-lg border px-3 py-2 text-center font-mono text-sm ${
                chonO === i ? 'border-amber-key bg-amber-key/15 text-amber-key' : doi ? 'border-teal-key/60 text-teal-key' : 'border-line text-cream'
              }`}
            >
              {ten(ds)}
              {doi && <span className="block text-[10px] text-dim">gốc {ten([goc[i]!])}</span>}
            </button>
          )
        })}
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={() => void nghe(tonic, goc)} className={nut(false)}>
          ▶ Vòng gốc
        </button>
        <button type="button" onClick={() => void nghe(tonic, o.flat())} className={nut(false)}>
          ▶ Vòng đã thay
        </button>
        <button type="button" onClick={() => dung(goc, id)} className={nut(false)}>
          Đặt lại
        </button>
      </div>

      {chonO !== null && (
        <div className="mb-3 rounded-lg border border-line/60 p-3 text-xs">
          <p className="mb-2 text-cream">
            Ô {chonO + 1}: <b className="font-mono">{ten([goc[chonO]!])}</b> — thay bằng gì?
          </p>
          <div className="flex flex-col gap-1.5">
            {THU_TU.map((l) => {
              const ds = luaChon.filter((x) => x.loai === l)
              if (!ds.length) return null
              return (
                <div key={l} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-56 text-dim">{LOAI[l].ten}</span>
                  {ds.map((lc) => (
                    <button
                      key={ten(lc.thay)}
                      type="button"
                      onClick={() => {
                        setO((cu) => cu.map((x, j) => (j === chonO ? lc.thay : x)))
                        setDaChon({ i: chonO, lc, cu: [goc[chonO]!] })
                      }}
                      className={nut(daChon?.i === chonO && ten(daChon.lc.thay) === ten(lc.thay))}
                    >
                      {ten(lc.thay)}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {daChon && (
        <div className="rounded-lg border border-teal-key/40 p-3 text-xs">
          <p className="mb-1 font-semibold text-cream">
            Ô {daChon.i + 1}: <span className="font-mono">{ten(daChon.cu)}</span> → <span className="font-mono text-teal-key">{ten(daChon.lc.thay)}</span>
            <span className="font-normal text-dim"> · {LOAI[daChon.lc.loai].ten}</span>
          </p>
          <p className="mt-1 text-cream/85">
            <span className="text-amber-key">Nghe ra sao, khi nào chọn: </span>
            {loiChon(daChon.lc)}
          </p>
          <p className="mt-1 text-cream/85">
            <span className="text-amber-key">Vòng rẽ về đâu: </span>
            {LOAI[daChon.lc.loai].huong(ten([o[(daChon.i + 1) % o.length]![0]!]))}
          </p>
          <p className="mt-1 text-cream/85">
            <span className="text-amber-key">Ở chỗ này: </span>
            {canhVong(vongPhang(daChon.i), daChon.i, daChon.lc, tonic, thu).join(' ')}
          </p>
          <p className="mt-1 text-dim">Thầy dùng: {LOAI[daChon.lc.loai].thay}</p>
        </div>
      )}
    </div>
  )
}
