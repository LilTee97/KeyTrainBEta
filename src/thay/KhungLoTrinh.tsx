import { useMemo, useState } from 'react'
import { stopTimelineLoop } from '../shared/audio/audioEngine'
import type { LuotTap } from '../shared/persistence/db'
import { NoteGatedPractice } from '../reharm/playback/NoteGatedPractice'
import { TimedPractice } from '../reharm/playback/TimedPractice'
import type { BaiTap, VongBaiTap } from './baiTap'
import { BAC, bacKeTiep, chamGated, chamTimed, dichBac7, dichVong, tenGiong, trangThaiBac, type Bac } from './loTrinh'

/** Bậc 4–6 chấm trên hai lượt vòng tập liền nhau (8 ô) — đoán, chưa đo: một lượt 4 ô ít tiếng quá. Bậc 7: một lượt vòng kiểm. */
const LUOT_THEO_NHIP = 2

const laThu = (bai: BaiTap) => bai.giong.includes('thứ')

function lap(vong: VongBaiTap, soLuot: number) {
  return Array.from({ length: soLuot }, (_, luot) =>
    vong.timeline.map((event) => ({ ...event, startBeat: event.startBeat + luot * vong.doDai })),
  ).flat()
}

const phanTram = (x: number) => Math.round(x * 100)

function nguongChu(bac: Bac): string {
  if (bac.cheDo === 'gated') {
    return `đi hết vòng, vấp ≤ ${phanTram(bac.vapToiDa)} % số chặng (bấm sai hay bỏ qua chặng đều tính vấp)`
  }
  return [
    `đúng nốt ≥ ${phanTram(bac.dungToiThieu)} %`,
    `lệch nhịp (trung vị) ≤ ${bac.lechToiDa} ms`,
    ...(bac.thuaToiDa === null ? [] : [`phím thừa ≤ ${phanTram(bac.thuaToiDa)} %`]),
    ...(bac.kiem ? ['chấm theo hợp âm, bỏ quãng tám'] : []),
  ].join(' · ')
}

/**
 * Lộ trình 7 bậc của MỘT bài tập điệu (logic ở `loTrinh.ts`): nút bậc (khoá · đang tập · đã qua), thẻ bậc (việc phải làm, ngưỡng, lời gia
 * sư), rồi khung tập đúng của bậc ấy — chờ đúng nốt (bậc 1–3) hay theo nhịp (bậc 4–7). Hết lượt thì chấm, ghi nhật ký, mở bậc sau.
 */
export function LoTrinh({
  bai,
  luot,
  onGhi,
}: {
  bai: BaiTap
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const trangThai = trangThaiBac(luot, bai.styleId)
  const [chon, setChon] = useState(() => bacKeTiep(trangThai))
  const bac = BAC[chon - 1]!
  const thu = laThu(bai)
  const kiem = bac.cheDo === 'timed' && bac.kiem
  const dich = dichBac7(luot, bai.styleId)

  const vong = useMemo(() => (kiem ? dichVong(bai.kiem, dich, thu) : bai.tap), [kiem, bai, dich, thu])
  const perBeat = useMemo(() => vong.perBeat.slice(0, vong.doDai), [vong])
  const timeline = useMemo(
    () => (bac.cheDo === 'timed' && !kiem ? lap(vong, LUOT_THEO_NHIP) : vong.timeline),
    [bac, kiem, vong],
  )

  const cuaBac = luot.filter((one) => one.styleId === bai.styleId && one.bac === bac.so)
  const ghi = (dat: boolean, soDo: Record<string, number>) =>
    onGhi({ timestamp: Date.now(), styleId: bai.styleId, bac: bac.so, dat, soDo })
  const chonBac = (so: number) => {
    stopTimelineLoop()
    setChon(so)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs text-dim">Lộ trình:</span>
        <span className="font-semibold text-amber-key">{bai.ten}</span>
        <span className="text-xs text-dim">{trangThai.filter((one) => one === 'qua').length}/7 bậc đã qua</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BAC.map((one, i) => {
          const tt = trangThai[i]
          return (
            <button
              key={one.so}
              type="button"
              disabled={tt === 'khoa'}
              title={tt === 'khoa' ? `Qua bậc ${one.so - 1} trước` : one.viSao}
              onClick={() => chonBac(one.so)}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-35 ${
                chon === one.so
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : tt === 'qua'
                    ? 'border-teal-key/60 bg-teal-key/10 text-teal-key hover:bg-teal-key/20'
                    : 'border-line bg-white/4 text-cream hover:bg-white/8'
              }`}
            >
              <span className="font-mono">
                {tt === 'qua' ? '✓' : tt === 'khoa' ? '·' : '○'} {one.so}
              </span>{' '}
              {one.ten}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-line bg-black/25 p-3 text-sm">
        <p>
          <b className="text-amber-key">
            Bậc {bac.so} — {bac.ten}
          </b>
          <span className="ml-2 text-xs text-dim">
            {bac.cheDo === 'timed' ? `♩ ${Math.round((vong.bpm * bac.tempo) / 100)}` : 'không đồng hồ'}
            {kiem ? ` · giọng ${tenGiong(dich, thu)}` : ''}
          </span>
        </p>
        <p className="mt-1 text-xs text-cream/85">{bac.viSao}</p>
        <p className="mt-1 text-xs text-dim">
          <span className="text-cream/85">Ngưỡng đạt:</span> {nguongChu(bac)}.
        </p>
        {kiem && (
          <p className="mt-1 font-mono text-xs text-cream/85">
            Vòng lượt này (giọng {tenGiong(dich, thu)}): {vong.hopAm.join(' · ')}
          </p>
        )}
        <p className="mt-1 text-xs text-dim">
          Đã tập {cuaBac.length} lượt · đạt {cuaBac.filter((one) => one.dat).length}
          {trangThai[chon - 1] === 'qua' && chon < BAC.length && (
            <button
              type="button"
              onClick={() => chonBac(chon + 1)}
              className="ml-3 rounded-lg bg-teal-key/80 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-teal-key"
            >
              Sang bậc {chon + 1} →
            </button>
          )}
        </p>
      </div>

      {bac.cheDo === 'gated' ? (
        <NoteGatedPractice
          key={`${bai.styleId}-${bac.so}`}
          timeline={vong.timeline}
          voicings={vong.voicings}
          beatsPerChord={vong.beatsPerChord}
          perBeat={perBeat}
          vongBpm={vong.bpm}
          bac={{
            tay: bac.tay,
            onXong: ({ chang, vap }) => {
              const ketQua = chamGated(bac.vapToiDa, chang, vap)
              ghi(ketQua.dat, { chang, vap })
              return ketQua
            },
          }}
        />
      ) : (
        <TimedPractice
          key={`${bai.styleId}-${bac.so}`}
          title={`${bai.ten} · bậc ${bac.so}${kiem ? ` · ${tenGiong(dich, thu)}` : ''}`}
          timeline={timeline}
          voicings={vong.voicings}
          beatsPerChord={vong.beatsPerChord}
          perBeat={perBeat}
          meter={vong.meter}
          vongBpm={vong.bpm}
          bac={{
            tay: 'both',
            tempo: bac.tempo,
            boQuaQuangTam: bac.kiem,
            anNotRoi: bac.kiem,
            onXong: (score) => {
              const ketQua = chamTimed(bac, score)
              ghi(ketQua.dat, {
                tong: score.total,
                trung: score.hit,
                thua: score.extra.length,
                lechMs: score.medianAbsMs ?? -1,
                bpm: Math.round((vong.bpm * bac.tempo) / 100),
                ...(bac.kiem ? { dich } : {}),
              })
              return ketQua
            },
          }}
        />
      )}
    </div>
  )
}
