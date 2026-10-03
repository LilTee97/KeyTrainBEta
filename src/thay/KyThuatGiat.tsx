import { useMemo, useState } from 'react'
import { startAudio, startTimelineLoop, stopTimelineLoop } from '../shared/audio/audioEngine'
import type { LuotTap } from '../shared/persistence/db'
import { TimedPractice } from '../reharm/playback/TimedPractice'
import {
  BAC_GIAT,
  GIAT_CA_PHAO,
  bacGiatKeTiep,
  boGiat,
  chamGiat,
  khoaGiat,
  lapDoan,
  trangThaiGiat,
  type DoanGiat,
} from './kyThuat/giatCaPhao'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`

const phanTram = (x: number) => Math.round(x * 100)

/**
 * Tab Kỹ thuật đánh · Cà Pháo — đánh giật (dữ liệu và ngưỡng ở `kyThuat/giatCaPhao.ts`).
 * Chọn đoạn → nghe mẫu (có giật / bỏ giật) → tập theo nhịp trên thang 4 bậc; bộ chấm chấm cả lúc nhấc phím (`chamNhacPhim`).
 */
export function KyThuatGiat({
  luot,
  onGhi,
}: {
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const [chonId, setChonId] = useState(GIAT_CA_PHAO.bai[0]!.id)
  const doan = GIAT_CA_PHAO.bai.find((one) => one.id === chonId) ?? GIAT_CA_PHAO.bai[0]!

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h3 className="mb-2 font-semibold text-cream">Đánh giật kiểu Cà Pháo</h3>
        <p className="mb-2 text-cream/85">
          Giật ngón: bấm rồi nhấc ngón lên ngay, tiếng ngắn, có khoảng lặng nhỏ trước tiếng sau. Nốt không có dấu thì vẫn giữ đủ.
        </p>
        <p className="text-xs text-dim">
          Số đo trên bản chép tay <i>Người hãy quên em đi</i> (bài duy nhất của anh có ghi dấu giật): lúc hát, anh giật 18 % số cú
          hợp âm tay phải (40/218), nhiều nhất ở phách 4 (9/17); không bao giờ giật ở phách 1, 2& và 4&. Tay trái hầu như ngân. Các
          đoạn dưới đây cắt nguyên từ sheet, dễ trước. Ngưỡng đạt do Claude đặt, chưa đo.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {GIAT_CA_PHAO.bai.map((one) => {
          const qua = trangThaiGiat(luot, one.id).filter((tt) => tt === 'qua').length
          return (
            <li key={one.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => {
                  stopTimelineLoop()
                  setChonId(one.id)
                }}
                className={nut(one.id === doan.id)}
              >
                {one.ten}
              </button>
              <span className="text-xs text-dim">
                {one.soCuGiat}/{one.soCu} cú giật · {one.cuMoiPhach} cú/phách
                {one.soNotLay > 0 ? ` · ${one.soNotLay} nốt láy` : ''}
              </span>
              <span className="font-mono text-xs text-dim">{qua}/4</span>
            </li>
          )
        })}
      </ul>

      <BacDoan key={doan.id} doan={doan} luot={luot} onGhi={onGhi} />
    </div>
  )
}

function BacDoan({
  doan,
  luot,
  onGhi,
}: {
  doan: DoanGiat
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const trangThai = trangThaiGiat(luot, doan.id)
  const [chon, setChon] = useState(() => bacGiatKeTiep(trangThai))
  const bac = BAC_GIAT[chon - 1]!
  const timeline = useMemo(() => lapDoan(doan), [doan])
  const bpm = Math.round((GIAT_CA_PHAO.bpm * bac.tempo) / 100)

  const nghe = async (coGiat: boolean) => {
    await startAudio()
    const events = coGiat ? doan.events : boGiat(doan.events)
    startTimelineLoop(events, bpm, undefined, 0, true)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs text-dim">Đang tập:</span>
        <span className="font-semibold text-amber-key">{doan.ten}</span>
        <span className="text-xs text-dim">♩ {GIAT_CA_PHAO.bpm} theo sheet</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void nghe(true)} className={nut(false)}>
          ▶ Nghe mẫu — có giật
        </button>
        <button type="button" onClick={() => void nghe(false)} className={nut(false)}>
          ▶ Nghe so sánh — bỏ giật, ngân đủ
        </button>
        <button type="button" onClick={() => stopTimelineLoop()} className={nut(false)}>
          Dừng
        </button>
        <span className="text-[11px] text-dim">
          nghe ở {bpm} BPM ({bac.tempo} %)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-dim">Bậc:</span>
        {BAC_GIAT.map((one, i) => {
          const tt = trangThai[i]
          return (
            <button
              key={one.so}
              type="button"
              disabled={tt === 'khoa'}
              onClick={() => {
                stopTimelineLoop()
                setChon(one.so)
              }}
              className={nut(chon === one.so)}
              title={tt === 'khoa' ? 'Qua bậc trước để mở' : undefined}
            >
              {one.so}. {one.ten}
              {tt === 'qua' ? ' ✓' : tt === 'khoa' ? ' 🔒' : ''}
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-line bg-black/30 p-3 text-xs">
        <p className="mb-1 text-sm font-semibold text-cream">
          Bậc {bac.so} — {bac.ten}
        </p>
        <p className="mb-1 text-cream/85">{bac.viSao}</p>
        <p className="text-dim">
          Đạt khi: đúng nốt ≥ {phanTram(bac.dungToiThieu)} % · lệch nhịp ≤ {bac.lechToiDa} ms · phím thừa ≤{' '}
          {phanTram(bac.thuaToiDa)} % · nốt giật nhấc sớm ≥ {phanTram(bac.giatToiThieu)} % · nốt ngân giữ đủ ≥{' '}
          {phanTram(bac.nganToiThieu)} %.
        </p>
      </div>

      <TimedPractice
        key={`${doan.id}-${bac.so}`}
        title={`Giật CP · ${doan.ten} · bậc ${bac.so}`}
        timeline={timeline}
        voicings={[]}
        beatsPerChord={4}
        perBeat={[]}
        meter={GIAT_CA_PHAO.meter}
        vongBpm={GIAT_CA_PHAO.bpm}
        bac={{
          tay: bac.tay,
          tempo: bac.tempo,
          boQuaQuangTam: false,
          anNotRoi: false,
          theoHopAm: false,
          chamNhac: true,
          onXong: (score, _hopAm, nhac) => {
            const ketQua = chamGiat(bac, score, nhac)
            onGhi({
              timestamp: Date.now(),
              styleId: khoaGiat(doan.id),
              bac: bac.so,
              dat: ketQua.dat,
              soDo: {
                tong: score.total,
                trung: score.hit,
                thua: score.extra.length,
                lechMs: score.medianAbsMs ?? -1,
                giatTong: nhac?.giatTong ?? 0,
                giatDung: nhac?.giatDung ?? 0,
                nganTong: nhac?.nganTong ?? 0,
                nganDung: nhac?.nganDung ?? 0,
              },
            })
            return ketQua
          },
        }}
      />
    </div>
  )
}
