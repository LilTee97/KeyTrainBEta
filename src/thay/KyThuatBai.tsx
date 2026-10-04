import { useMemo, useState } from 'react'
import { startAudio, startTimelineLoop, stopTimelineLoop } from '../shared/audio/audioEngine'
import type { LuotTap } from '../shared/persistence/db'
import { TimedPractice } from '../reharm/playback/TimedPractice'
import {
  bacCuaDoan,
  bacKeTiepKyThuat,
  boGiat,
  chamKyThuat,
  khoaKyThuat,
  lapDoan,
  trangThaiKyThuat,
  type DoanTap,
  type KyThuat,
} from './kyThuat/kyThuat'

const nut = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40 ${
    on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-dim hover:bg-white/8'
  }`

const phanTram = (x: number) => Math.round(x * 100)

/**
 * Một kỹ thuật của tab Kỹ thuật đánh (`kyThuat/kyThuat.ts`): chọn đoạn → nghe mẫu → tập theo nhịp trên thang 4 bậc. Đánh giật thì
 * có thêm nút nghe bản bỏ giật, và bộ chấm chấm cả lúc nhấc phím (`chamNhacPhim`).
 */
export function KyThuatBai({
  kt,
  luot,
  onGhi,
}: {
  kt: KyThuat
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const [chonId, setChonId] = useState(kt.bai[0]!.id)
  const doan = kt.bai.find((one) => one.id === chonId) ?? kt.bai[0]!

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h3 className="mb-2 font-semibold text-cream">{kt.ten}</h3>
        <p className="mb-2 text-cream/85">{kt.gioiThieu}</p>
        <p className="text-xs text-dim">{kt.soDo}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {kt.bai.map((one) => {
          const qua = trangThaiKyThuat(luot, kt, one.id).filter((tt) => tt === 'qua').length
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
              <span className="text-xs text-dim">{one.ghiChu}</span>
              <span className="font-mono text-xs text-dim">
                {qua}/{kt.bac.length}
              </span>
            </li>
          )
        })}
      </ul>

      <BacDoan key={`${kt.id}:${doan.id}`} kt={kt} doan={doan} luot={luot} onGhi={onGhi} />
    </div>
  )
}

function BacDoan({
  kt,
  doan,
  luot,
  onGhi,
}: {
  kt: KyThuat
  doan: DoanTap
  luot: readonly LuotTap[]
  onGhi: (luot: Omit<LuotTap, 'id' | 'day'>) => void
}) {
  const trangThai = trangThaiKyThuat(luot, kt, doan.id)
  const [chon, setChon] = useState(() => bacKeTiepKyThuat(trangThai))
  const thang = bacCuaDoan(kt, doan)
  const bac = thang[chon - 1]!
  const timeline = useMemo(() => lapDoan(doan), [doan])
  const bpmGoc = doan.bpm ?? kt.bpm
  /* Tập tự do (người dùng 4/10/2026): chọn tay, kéo BPM tuỳ ý — không vào thang bậc, không lưu tiến độ. */
  const [cheDo, setCheDo] = useState<'bac' | 'tu-do'>('bac')
  const [bpmTuDo, setBpmTuDo] = useState(() => Math.round(bpmGoc * 0.6))
  const bpm = cheDo === 'tu-do' ? bpmTuDo : Math.round((bpmGoc * bac.tempo) / 100)

  const nghe = async (coGiat: boolean) => {
    await startAudio()
    startTimelineLoop(coGiat ? doan.events : boGiat(doan.events), bpm, undefined, 0, true)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs text-dim">Đang tập:</span>
        <span className="font-semibold text-amber-key">{doan.ten}</span>
        <span className="text-xs text-dim">♩ {bpmGoc}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['bac', `Lộ trình ${kt.bac.length} bậc`],
            ['tu-do', 'Tập tự do'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              stopTimelineLoop()
              setCheDo(value)
            }}
            className={nut(cheDo === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {cheDo === 'tu-do' && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-dim">
          <label className="flex items-center gap-2">
            Nhịp độ
            <input
              type="range"
              min={30}
              max={Math.max(60, Math.round(bpmGoc * 1.5))}
              value={bpmTuDo}
              onChange={(event) => setBpmTuDo(Number(event.target.value))}
              className="accent-amber-key"
            />
            <b className="w-16 font-mono text-cream">{bpmTuDo} BPM</b>
          </label>
          {[60, 80, 100].map((phan) => (
            <button
              key={phan}
              type="button"
              onClick={() => setBpmTuDo(Math.round((bpmGoc * phan) / 100))}
              className={nut(bpmTuDo === Math.round((bpmGoc * phan) / 100))}
            >
              {phan} %
            </button>
          ))}
          <span>Tự chọn tay ở khung tập bên dưới. Tập tự do không tính bậc, không lưu tiến độ.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void nghe(true)} className={nut(false)}>
          {kt.chamNhac ? '▶ Nghe mẫu — có giật' : '▶ Nghe mẫu'}
        </button>
        {kt.chamNhac && (
          <button type="button" onClick={() => void nghe(false)} className={nut(false)}>
            ▶ Nghe so sánh — bỏ giật, ngân đủ
          </button>
        )}
        <button type="button" onClick={() => stopTimelineLoop()} className={nut(false)}>
          Dừng
        </button>
        <span className="text-[11px] text-dim">
          nghe ở {bpm} BPM ({Math.round((bpm / bpmGoc) * 100)} %)
        </span>
      </div>

      {cheDo === 'bac' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-dim">Bậc:</span>
            {thang.map((one, i) => {
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
              {phanTram(bac.thuaToiDa)} %
              {bac.giatToiThieu !== null && ` · nốt giật nhấc sớm ≥ ${phanTram(bac.giatToiThieu)} %`}
              {bac.nganToiThieu !== null && ` · nốt ngân giữ đủ ≥ ${phanTram(bac.nganToiThieu)} %`}
              {bac.layToiThieu !== null && ` · nốt láy đúng ≥ ${phanTram(bac.layToiThieu)} %`}.
            </p>
          </div>
        </>
      )}

      {cheDo === 'tu-do' ? (
        <TimedPractice
          key={`${kt.id}-${doan.id}-tu-do`}
          title={`${kt.ten} · ${doan.ten} · tự do`}
          timeline={timeline}
          voicings={[]}
          beatsPerChord={4}
          perBeat={[]}
          meter={kt.meter}
          vongBpm={bpmTuDo}
          anTempo
          chamNhac={kt.chamNhac}
          chamLay={kt.chamLay}
        />
      ) : (
        <TimedPractice
          key={`${kt.id}-${doan.id}-${bac.so}`}
          title={`${kt.ten} · ${doan.ten} · bậc ${bac.so}`}
          timeline={timeline}
          voicings={[]}
          beatsPerChord={4}
          perBeat={[]}
          meter={kt.meter}
          vongBpm={bpmGoc}
          bac={{
            tay: bac.tay,
            tempo: bac.tempo,
            boQuaQuangTam: false,
            anNotRoi: false,
            theoHopAm: false,
            chamNhac: kt.chamNhac,
            chamLay: kt.chamLay,
            onXong: (score, _hopAm, nhac, lay, luc) => {
              const ketQua = chamKyThuat(bac, score, nhac, lay)
              onGhi({
                timestamp: Date.now(),
                styleId: khoaKyThuat(kt, doan.id),
                bac: bac.so,
                dat: ketQua.dat,
                soDo: {
                  tong: score.total,
                  trung: score.hit,
                  thua: score.extra.length,
                  lechMs: score.medianAbsMs ?? -1,
                  ...(nhac ?? {}),
                  ...(lay ? { layTong: lay.layTong, layDung: lay.layDung } : {}),
                  ...(luc ? { lucNhan: luc.nhanTB, lucThuong: luc.thuongTB } : {}),
                },
              })
              return ketQua
            },
          }}
        />
      )}
    </div>
  )
}
