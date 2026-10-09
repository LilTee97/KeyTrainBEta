import { nguCanh } from '../../thay/soanCau/giaiThich'
import { coDong, laMa, MAU_VONG, moTaKhuc, nhanVong } from '../../thay/soanCau/nhanVong'
import type { ParsedChord } from '../types'

/**
 * VÒNG HÒA THANH TRONG BÀI — người dùng 9/10/2026: "Trong tab Tái hòa âm sau khi tái hòa âm từ lời bài hát thì cũng hãy cố gắng phân
 * tích và cô đọng hợp âm lại xem chúng thuộc vòng nào trong các vòng hòa thanh trong âm nhạc". Hợp âm đã tái hòa âm (đúng như trên bản
 * nhạc, gồm chỗ người dùng sửa màu), từng đoạn của bài, cô đọng (`coDong`) rồi nhận bằng cùng bộ nhận với sheet các thầy (`nhanVong`).
 */
export function VongTrongBai({
  chords,
  ranges,
  songKey,
}: {
  chords: readonly ParsedChord[]
  ranges: readonly { name: string; from: number; to: number }[]
  songKey: { tonic: number; scale: string; label: string } | null
}) {
  if (!songKey || chords.length === 0) return null
  const thu = songKey.scale === 'minor'
  const { songSong } = nguCanh(songKey.tonic, thu)
  const dsDoan = (ranges.length ? ranges : [{ name: 'Cả bài', from: 0, to: chords.length - 1 }]).map((r) => {
    const ds = coDong(chords.slice(r.from, r.to + 1), songKey.tonic)
    return { ten: r.name, ds, khuc: nhanVong(ds.map((x) => x.hop), thu) }
  })
  /* Đoạn có chuỗi y hệt đoạn trước (điệp khúc hát lại) gộp một dòng. */
  const doan: (typeof dsDoan[number] & { cung: string[] })[] = []
  for (const d of dsDoan) {
    const khoa = d.ds.map((x) => x.ten).join(' ')
    const cu = doan.find((x) => x.ds.map((y) => y.ten).join(' ') === khoa)
    if (cu) cu.cung.push(d.ten)
    else doan.push({ ...d, cung: [d.ten] })
  }
  const tong = doan.reduce((s, d) => s + d.ds.length, 0)
  const phu = doan.reduce((s, d) => s + d.khuc.reduce((t, k) => t + k.den - k.tu + 1 - k.chen.length, 0), 0)
  const theoVong = new Map<string, string[]>()
  for (const d of doan) for (const k of d.khuc) theoVong.set(k.ten.replace(/ — \d+ hợp âm$/, ''), [...(theoVong.get(k.ten.replace(/ — \d+ hợp âm$/, '')) ?? []), ...d.cung])

  return (
    <div className="mt-4 rounded-xl border border-line bg-black/25 p-4 text-sm">
      <h3 className="mb-1 font-mono text-[11px] tracking-[0.08em] text-amber-key uppercase">Vòng hòa thanh trong bài</h3>
      <p className="mb-2 text-xs text-dim">
        Hợp âm đã tái hòa âm, cô đọng lại — bỏ hợp âm lướt, gộp hợp âm liền nhau cùng gốc cùng họ (Am7 → Am9 tính một) — rồi đối chiếu{' '}
        {MAU_VONG.length} vòng phổ biến và chuỗi quãng 5, cùng bộ nhận dùng cho sheet các thầy (trang Hợp âm · tab Tái hòa âm vòng). Giọng{' '}
        {songKey.label}. Đoạn hát lại y hệt gộp một dòng.
      </p>
      <p className="mb-1 text-xs text-cream">
        {phu}/{tong} hợp âm (sau cô đọng) nằm trong một vòng có tên
        {theoVong.size > 0 && ' — '}
        {[...theoVong.entries()].map(([ten, ds]) => `${ten} (${[...new Set(ds)].join(', ')})`).join(' · ')}
      </p>
      {doan.map((d) => (
        <div key={d.ten} className="mt-2 border-t border-line/40 pt-2">
          <p className="mb-1 text-xs font-semibold text-cream">{d.cung.join(' · ')}</p>
          <div className="mb-1 flex flex-wrap gap-1">
            {d.ds.map((x, j) => {
              const k = d.khuc.find((y) => j >= y.tu && j <= y.den)
              return (
                <span
                  key={j}
                  className={`rounded border px-1.5 py-0.5 text-center font-mono text-xs ${
                    !k ? 'border-line/50 text-cream/60' : k.chen.includes(j) ? 'border-dashed border-teal-key/50 text-cream/70' : 'border-teal-key/60 text-teal-key'
                  }`}
                >
                  {x.ten}
                  <span className="block text-[9px] text-dim">{laMa(x.hop)}</span>
                </span>
              )
            })}
          </div>
          {d.khuc.length ? (
            <ul className="flex flex-col gap-0.5 text-xs text-cream/85">
              {d.khuc.map((k) => (
                <li key={k.tu}>
                  <span className="font-mono text-teal-key">
                    {d.ds
                      .slice(k.tu, k.den + 1)
                      .map((x, j) => (k.chen.includes(k.tu + j) ? `(${x.ten})` : x.ten))
                      .join(' – ')}
                  </span>{' '}
                  {moTaKhuc(k, (j) => d.ds[j]!.ten, songSong)}
                  <span className="block text-[11px] text-dim">{k.nghe}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-dim">Không khớp vòng phổ biến nào — đoạn này đi đường riêng.</p>
          )}
        </div>
      ))}
    </div>
  )
}
