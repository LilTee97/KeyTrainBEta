import { useState } from 'react'
import { GameChong } from './GameChong'
import { HopAmMau } from './HopAmMau'
import { ChongHopAm } from './SoanCau'
import { VongTab } from './VongTab'
import { GOC } from './vongThay'

/** Các tab của trang — dựng dần theo `Reference/KE-HOACH-LUYEN-TAP.md` mục "Bổ sung 8/10/2026" (B → C → vòng + lựa chọn thay). */
const TAB = [
  { id: 'chong', ten: 'Chồng hợp âm' },
  { id: 'mau', ten: 'Hợp âm màu' },
  { id: 'vong', ten: 'Tái hòa âm vòng' },
  { id: 'game', ten: 'Game công thức' },
] as const

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`

/**
 * Trang HỢP ÂM — người dùng 8/10/2026: "Hãy làm thành một trang để học cách bấm hợp âm theo kiểu chồng"; chốt 9/10/2026 theo đề xuất
 * của Claude: một trang chung cho mọi thầy (tab Chồng hợp âm · Hợp âm màu · Tái hòa âm vòng); trang Căn bản (bước 6) gộp vào đây.
 */
export function HopAmPage() {
  const [tab, setTab] = useState<(typeof TAB)[number]['id']>('chong')
  const [tonic, setTonic] = useState(0)
  const [thu, setThu] = useState(false)
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold">Hợp âm</h2>
        {TAB.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={nut(tab === t.id)}>
            {t.ten}
          </button>
        ))}
      </div>
      {tab !== 'game' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
          <span>Giọng — gốc ví dụ của mỗi hợp âm lấy theo giọng này</span>
          <select
            value={tonic}
            onChange={(event) => setTonic(Number(event.target.value))}
            className="rounded border border-line bg-white/6 px-1.5 py-1 text-cream"
            aria-label="Giọng"
          >
            {GOC.map((ten, i) => (
              <option key={ten} value={i}>
                {ten}
              </option>
            ))}
          </select>
          {[false, true].map((v) => (
            <button key={String(v)} type="button" onClick={() => setThu(v)} className={nut(thu === v)}>
              {v ? 'thứ' : 'trưởng'}
            </button>
          ))}
        </div>
      )}
      {tab === 'chong' && <ChongHopAm tonic={tonic} thu={thu} />}
      {tab === 'mau' && <HopAmMau tonic={tonic} thu={thu} />}
      {tab === 'vong' && <VongTab tonic={tonic} thu={thu} />}
      {tab === 'game' && <GameChong />}
    </section>
  )
}
