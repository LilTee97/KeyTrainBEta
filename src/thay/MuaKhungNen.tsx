import { useEffect, useRef, useState } from 'react'
import { getPlaybackBeats, setTimelineBpm, startAudio, startTimelineLoop, stopTimelineLoop } from '../shared/audio/audioEngine'
import { MidiConnect } from '../shared/midi/MidiConnect'
import { BanPhimChong } from './BanPhimChong'
import { ChonNhip, VungRoi, type VienRoi } from './GameChong'
import { nguonNenBeat } from './hocSolo/beatNen'
import { chamSsa, type CauSsa, type VongNen } from './hocSolo/loiSsa'
import { bacDoRo, DAT_THI, diemCau, doRoGoiY, SO_CAU_THI, type Ben } from './soanCau/gameChong'
import { useDayPhim, useNotXuong } from './useMuaRoi'

/*
  MƯA KHUNG NỐT CÓ BACKING TRACK — người dùng 15/10/2026: "Cho Mục lối SSA và các thầy khác có nhạc backing track để solo trên đó". Nền phát
  lặp theo vòng (`VongNen`: Lối SSA — đúng vòng anh chơi trong clip, nền bass rồi rải 5 – 8; thầy — câu bộ soạn của thầy, nền tay trái thầy +
  thế màu), viên rơi KHỚP NHỊP: mỗi viên rơi suốt ô trước và ô của nó, chạm đáy đúng lúc hết hợp âm (máy rơi theo đồng hồ nền như phần 2
  Game chạy ngón — `getPlaybackBeats`, có đếm vào). Trong ô của hợp âm, CHỒNG rồi CHẠY như lối chồng + chạy (`chamSsa`); hết ô mà chưa xong là
  trượt. Bên luyện: gợi ý hai tay hiện đủ ngay khi tới ô; bên thi: 20 hợp âm, không gợi ý, nốt sai mất ô, đúng từ 16 là Đạt.
  Anh SSA chạy ngay sau cú chồng và ở phách cuối trước khi đổi hợp âm (Rai 2: 45/96 · 42/96 nốt chạy) — ở đây chồng trước, chạy sau, trong
  ô của hợp âm; phách đúng trong ô chưa chấm (Claude).
  ponytail: máy rơi theo nền chép từ DapThayRoi (Game chạy ngón, ô dài ngắn theo vòng) — duyệt đạt thì gộp thành một hook chung.
*/

/** Kết quả một lượt chơi thẳng (`ngay`) — trả về màn gọi để hiện tổng kết. */
export interface KetQuaNen {
  thi: boolean
  dung: number
  sai: number
  diem: number
  bpm: number
  /** '♩' · '♪' (6/8 đếm móc đơn). */
  kyHieu: string
  saiO: { ten: string; meo: string }[]
}

interface VienNen extends VienRoi {
  i: number
  c: CauSsa
  daChay: number[]
  xong: boolean
}

/** Bấm sớm trước ô bao nhiêu phách vẫn tính cho ô ấy (như phần 2 Game chạy ngón). */
const SOM = 0.25
const NHIP_DO = [40, 50, 60, 70, 80] as const
const nut = (on: boolean) =>
  `rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${on ? 'border-amber-key bg-amber-key/15 text-amber-key' : 'border-line bg-white/4 text-cream/80 hover:bg-white/8'}`

export function MuaKhungNen({
  tieuDe,
  moTa,
  nap,
  coDoiCau = false,
  bpmMacDinh = 50,
  tenThay = '',
  ngay,
  onThoat,
}: {
  tieuDe: string
  moTa: string
  /** Vòng nền lượt `take` (thầy: câu bộ soạn kế tiếp; SSA: vòng clip) — null nếu chưa có. */
  nap: (take: number) => VongNen | null
  /** Có nút "Đổi câu" (bộ soạn ra vòng mới). */
  coDoiCau?: boolean
  bpmMacDinh?: number
  tenThay?: string
  /** Chơi thẳng bên này (bỏ màn chuẩn bị — màn gọi đã chọn nhịp, bên luyện / thi); Dừng thì trả kết quả qua `onThoat`. Lối SSA trên
   *  backing track (người dùng 15/10/2026: "thêm tính năng backing track trong mục Lối SSA"). */
  ngay?: Ben
  onThoat: (kq?: KetQuaNen) => void
}) {
  const [ben, setBen] = useState<Ben>('meo')
  const [bpm, setBpm] = useState(bpmMacDinh)
  const [, setVe] = useState(0)
  const ve = () => setVe((k) => k + 1)
  const thi = ben === 'thi'
  const s = useRef({
    pha: 'chuan-bi' as 'chuan-bi' | 'choi' | 'het',
    vong: null as VongNen | null,
    take: 0,
    /** Mốc đầu từng hợp âm trong một lượt (phách), thêm mốc cuối = độ dài lượt. */
    moc: [0, 4] as number[],
    demVao: 4,
    t0: 0,
    nen: false,
    vien: [] as VienNen[],
    sinhToi: -1,
    /** Bậc độ rõ gợi ý của viên đích lần vẽ trước — đổi thì vẽ lại bàn phím. */
    ro: -1,
    dang: -1,
    diem: 0,
    combo: 0,
    dung: 0,
    sai: 0,
    saiO: [] as { ten: string; meo: string }[],
    bao: null as null | { loai: 'dung' | 'sai' | 'truot'; chu: string },
    loi: '',
  }).current
  const { thap, cao } = useDayPhim()
  const nC = () => Math.max(1, s.vong?.cau.length ?? 1)
  const dai = () => s.moc[s.moc.length - 1]!
  /** Ô thứ `i` kể từ lúc nền vào (lượt nối lượt): phách đầu, phách cuối. */
  const dauO = (i: number) => Math.floor(i / nC()) * dai() + s.moc[i % nC()]!
  const cuoiO = (i: number) => Math.floor(i / nC()) * dai() + s.moc[(i % nC()) + 1]!
  const oTai = (b: number) => {
    if (b < 0) return -1
    const p = Math.floor(b / dai())
    const x = b - p * dai()
    let j = 0
    while (j + 1 < nC() && s.moc[j + 1]! <= x) j += 1
    return p * nC() + j
  }
  /** Phách đang nghe: trước khi nền vào là đồng hồ đếm vào (âm), sau đó là đồng hồ nền đã bù lệch hình – tiếng. Nền beat chạy từ lúc đếm
   *  vào (đếm vào nằm trong nền) nên lùi đi số phách đếm vào. */
  function bayGio() {
    if (s.nen) return getPlaybackBeats() - (s.vong?.demTrong ? s.demVao : 0)
    return (performance.now() - s.t0) / (60000 / bpm) - s.demVao
  }
  /**
   * Đổi tốc độ giữa chừng (bên luyện — người dùng 16/10/2026: "cho các game có thể chọn tốc độ phát"): nền đang chạy thì đổi luôn nhịp
   * của nền (lịch ghi theo phách, nền co giãn theo); còn đang đếm vào (đồng hồ hình) thì neo lại đồng hồ cho phách đang ở giữ nguyên.
   */
  function doiNhip(x: number) {
    if (s.pha === 'choi') {
      if (s.nen) setTimelineBpm(x)
      else s.t0 = performance.now() - (bayGio() + s.demVao) * (60000 / x)
    }
    setBpm(x)
  }
  /** Nạp vòng từ lượt `tu` (bỏ lượt không soạn được); về đếm vào, giữ điểm. */
  function napVong(tu: number) {
    for (let t = tu; t < tu + 12; t += 1) {
      const v = nap(t)
      if (!v || !v.cau.length) continue
      const moc = [0]
      for (const x of v.nhip) moc.push(moc[moc.length - 1]! + x)
      // Nền beat đếm vào đúng một ô (khớp vạch ô của trống); nền khác 4 phách hay ít hơn nếu hợp âm đầu ngắn.
      const demVao = v.demTrong ? (v.demVao ?? v.chuKyNen ?? 4) : Math.min(4, v.nhip[0] ?? 4)
      Object.assign(s, { vong: v, take: t, moc, demVao, t0: performance.now(), nen: false, vien: [], sinhToi: -1, dang: -1 })
      return true
    }
    return false
  }
  async function batDau(b: Ben) {
    if (!napVong(0)) {
      s.loi = 'Chưa nạp được vòng nền — thử giọng hay đoạn khác.'
      return ve()
    }
    setBen(b)
    await startAudio()
    Object.assign(s, { pha: 'choi', t0: performance.now(), diem: 0, combo: 0, dung: 0, sai: 0, saiO: [], bao: null, loi: '' })
    /*
      Nền beat: tiếng hi-hat đếm vào nằm luôn trong lượt đầu của nền rồi trống vào — chung một đồng hồ (đồng hồ vận chuyển), khớp bằng cấu
      trúc. Bản đầu hẹn giờ đếm vào riêng (đồng hồ âm thanh lúc bấm) rồi mới khởi nền khi đồng hồ hình tới phách 0 — hai đường hẹn giờ, không
      bảo đảm khớp. Đo bản này (15/10/2026, chặn `triggerAttack` của bộ trống): giờ hẹn 4 tiếng đếm vào cách nhau đúng 0,600 s ở ♩ 100, phách 1
      tới sau tiếng đếm cuối 0,600 s; thu mẫu âm (AudioWorklet, ghi cả khung im lặng) ra 0,601 · 0,598 · 0,601 s. Các con số "vào sớm 80 ms"
      · "đếm vào nén lại" đo lúc đầu là lỗi của cách thu (bộ thu bỏ khung im lặng), không phải lỗi app.
      Nền lặp theo `chuKyNen` (chu kỳ trống, một hay hai ô): lượt đầu là ô đếm vào, các lượt sau là trống xoay vòng (`nguonNenBeat`).
    */
    const v = s.vong
    if (v?.demTrong) {
      const L = v.chuKyNen ?? dai()
      startTimelineLoop(nguonNenBeat(v.nen, s.demVao, L), bpm, L)
      s.nen = true
    }
    ve()
  }
  function ketThuc() {
    if (s.pha !== 'choi') return
    s.pha = 'het'
    stopTimelineLoop()
    if (ngay) return onThoat({ thi, dung: s.dung, sai: s.sai, diem: s.diem, bpm, kyHieu: s.vong?.kyHieuNhip ?? '♩', saiO: s.saiO })
    ve()
  }
  function doiCau() {
    stopTimelineLoop()
    if (napVong(s.take + 1)) s.bao = { loai: 'dung', chu: 'Vòng mới — đếm vào lại.' }
    else {
      napVong(s.take)
      s.bao = { loai: 'sai', chu: 'Bộ soạn chưa ra vòng khác — chơi lại vòng này.' }
    }
    ve()
  }
  /** Viên đang đố: viên của ô đang nghe (lúc đếm vào: viên đầu). */
  function dichCua() {
    return s.vien.find((v) => v.i === s.dang) ?? s.vien.find((v) => v.i === 0) ?? null
  }
  function sinh(i: number) {
    const c = s.vong!.cau[i % nC()]!
    const tu = i === 0 ? -s.demVao : dauO(i - 1)
    s.vien = [...s.vien, { khoa: i, i, c, daChay: [], xong: false, sinh: tu, roi: cuoiO(i) - tu, lan: i % 4, ten: c.ten, khungTen: c.khungTen, goiY: c.goiY }]
    s.sinhToi = i
  }
  function truot(v: VienNen) {
    v.xong = true
    s.combo = 0
    s.sai += 1
    s.saiO.push({ ten: v.c.ten, meo: v.c.meo })
    s.bao = { loai: 'truot', chu: `Trượt ${v.c.ten} — hết ô mà chưa chồng + chạy xong.` }
    v.khungTen = '✗ trượt'
  }
  function tick() {
    if (s.pha !== 'choi' || !s.vong) return
    let b = bayGio()
    if (!s.nen && b >= 0) {
      startTimelineLoop(s.vong.nen, bpm, dai())
      s.nen = true
      b = bayGio()
    }
    let doi = false
    for (const v of s.vien)
      if (!v.xong && b >= cuoiO(v.i) - SOM) {
        truot(v)
        doi = true
      }
    if (s.vien.some((v) => b >= cuoiO(v.i))) s.vien = s.vien.filter((v) => b < cuoiO(v.i))
    const dang = oTai(b)
    // Sinh viên là vẽ lại — lúc đếm vào đã thấy viên đầu và gợi ý của nó (chạy thử 15/10/2026: trước đó gợi ý chỉ hiện khi nền đã vào).
    for (const i of [dang, dang + 1])
      if (i >= 0 && i > s.sinhToi && (!thi || i < SO_CAU_THI)) {
        sinh(i)
        doi = true
      }
    if (dang !== s.dang) {
      s.dang = dang
      doi = true
    }
    // Gợi ý mờ rồi rõ dần theo quãng rơi của viên đích (20 bậc) — như Mưa khung nốt rơi tự do.
    const vd = dichCua()
    const ro = thi || !vd ? -1 : vd.i * 100 + bacDoRo((b - vd.sinh) / vd.roi)
    if (ro !== s.ro) {
      s.ro = ro
      doi = true
    }
    if (doi) ve()
    if (thi && s.dung + s.sai >= SO_CAU_THI) ketThuc()
  }
  useNotXuong((note) => {
    if (s.pha !== 'choi' || !s.vong) return
    const i = oTai(bayGio() + SOM)
    const v = s.vien.find((x) => x.i === i)
    if (i < 0 || !v || v.xong) return
    const r = chamSsa(v.c, v.daChay, note)
    if (r.kq === 'dung') {
      v.xong = true
      const cong = diemCau(s.combo)
      s.diem += cong
      s.combo += 1
      s.dung += 1
      s.bao = { loai: 'dung', chu: `Đúng +${cong} — ${v.c.loi}` }
      v.khungTen = '✓ xong'
    } else if (r.kq === 'sai') {
      s.combo = 0
      s.bao = { loai: 'sai', chu: `Chưa đúng — ${r.chu}` }
      if (thi) {
        v.xong = true
        s.sai += 1
        s.saiO.push({ ten: v.c.ten, meo: v.c.meo })
        v.khungTen = '✗ sai'
      }
    } else if (r.kq === 'bo') s.bao = { loai: 'sai', chu: r.chu }
    else {
      v.daChay = r.daChay
      if (r.chu) s.bao = { loai: 'dung', chu: r.chu }
    }
    ve()
  })
  /* Chơi thẳng: vào lượt ngay khi mở (màn gọi đã dựng xong nền). */
  const ngayRef = useRef(ngay)
  useEffect(() => {
    const b = ngayRef.current
    if (!b) return
    // Một lần: StrictMode gọi hiệu ứng hai lần lúc mở.
    ngayRef.current = undefined
    void batDau(b)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi mở
  }, [])
  /* Ẩn trang thì dừng lượt (nền không tạm dừng giữa chừng được mà vẫn khớp ô); rời trang thì tắt nền. */
  const ketRef = useRef(ketThuc)
  ketRef.current = ketThuc
  useEffect(() => {
    const f = () => {
      if (document.hidden) ketRef.current()
    }
    document.addEventListener('visibilitychange', f)
    return () => {
      document.removeEventListener('visibilitychange', f)
      if (s.pha === 'choi') stopTimelineLoop()
    }
  }, [s])

  if (s.pha !== 'choi')
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-black/25 p-4 text-sm">
        <h4 className="text-lg font-semibold text-cream">{tieuDe}</h4>
        {s.pha === 'het' && (
          <div className="rounded-lg border border-amber-key/50 bg-amber-key/10 p-3">
            <p className="text-base text-cream">
              {thi && s.dung + s.sai >= SO_CAU_THI ? (
                <b className={s.dung >= DAT_THI ? 'text-teal-key' : 'text-rose-300'}>
                  {s.dung >= DAT_THI ? `ĐẠT ✓ ${s.dung}/${SO_CAU_THI}` : `Chưa đạt ${s.dung}/${SO_CAU_THI} — cần ${DAT_THI}`}
                </b>
              ) : (
                'Dừng'
              )}{' '}
              — <b className="text-amber-key">{s.diem} điểm</b> · đúng {s.dung} · sai / trượt {s.sai} · ♩ = {bpm}
            </p>
            {s.saiO.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-xs text-cream/85">
                {[...new Map(s.saiO.map((x) => [x.ten, x])).values()].map((x) => (
                  <li key={x.ten}>
                    <b className="font-mono text-cream">{x.ten}</b>
                    <span className="block text-dim">{x.meo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="text-xs text-dim">{moTa}</p>
        <p className="text-xs text-dim">
          Viên rơi khớp nhịp: chạm đáy đúng lúc hết hợp âm. Trong ô của hợp âm: CHỒNG bass + thế, rồi CHẠY nốt trên đỉnh — hết ô mà chưa xong là
          trượt. Có một ô đếm vào trước khi nền vào. Bên luyện gợi ý hai tay hiện đủ (viền xanh tay trái, viền cam tay phải); bên thi {SO_CAU_THI}{' '}
          hợp âm, không gợi ý, nốt sai mất ô, đúng từ {DAT_THI} là Đạt.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-dim">♩ =</span>
          {NHIP_DO.map((x) => (
            <button key={x} type="button" onClick={() => setBpm(x)} className={nut(bpm === x)}>
              {x}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => void batDau('meo')} className={nut(false)}>
            Luyện có mẹo — chơi với nền
          </button>
          <button type="button" onClick={() => void batDau('thi')} className={nut(false)}>
            Thi không mẹo — {SO_CAU_THI} hợp âm
          </button>
          <button type="button" onClick={() => onThoat()} className={nut(false)}>
            ← Quay lại
          </button>
        </div>
        {s.loi && <p className="text-xs text-rose-300">{s.loi}</p>}
        <MidiConnect />
      </div>
    )

  const dich = dichCua()
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/25 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={`text-xs font-semibold ${thi ? 'text-amber-key' : 'text-teal-key'}`}>{thi ? 'THI' : 'LUYỆN CÓ MẸO'}</span>
        <span className="text-cream">
          Điểm <b className="font-mono text-lg text-amber-key">{s.diem}</b>
        </span>
        <span className="text-cream">
          Combo <b className="font-mono text-lg text-teal-key">×{s.combo}</b>
        </span>
        {thi && (
          <span className="text-cream">
            Hợp âm <b className="font-mono">{Math.min(SO_CAU_THI, s.dung + s.sai + 1)}/{SO_CAU_THI}</b> · đúng{' '}
            <b className="font-mono text-teal-key">{s.dung}</b>
          </span>
        )}
        <span className="text-xs text-dim">
          {s.vong?.ten} · {s.vong?.kyHieuNhip ?? '♩'} = {bpm} · backing track
        </span>
        <span className="ml-auto flex gap-1.5">
          {coDoiCau && (
            <button type="button" onClick={doiCau} className={nut(false)}>
              Đổi câu
            </button>
          )}
          <button type="button" onClick={ketThuc} className={nut(false)}>
            Dừng
          </button>
        </span>
      </div>

      {!thi && <ChonNhip bpm={bpm} ds={NHIP_DO} doi={doiNhip} />}
      <VungRoi vien={s.vien} dich={dich} bayGio={bayGio} tick={tick} chay meo={!thi} />

      <p
        className={`min-h-10 text-sm ${s.bao?.loai === 'dung' ? 'text-teal-key' : s.bao?.loai === 'truot' ? 'text-rose-300' : 'text-amber-key'}`}
        aria-live="polite"
      >
        {s.bao?.chu ?? (s.dang < 0 ? `Đếm vào — nền vào ở ${s.vong?.cau[0]?.ten ?? ''}: chồng rồi chạy trong ô ấy.` : 'Trong ô của hợp âm: chồng bass + thế rồi chạy nốt trên đỉnh.')}
      </p>
      {dich && (
        <BanPhimChong
          c={dich.c}
          daChay={dich.daChay}
          loN={thi ? 0 : dich.c.ssa.lo.length}
          thi={thi}
          thap={thap}
          cao={cao}
          tenThay={tenThay}
          doRo={thi ? undefined : doRoGoiY((bayGio() - dich.sinh) / dich.roi)}
        />
      )}
      <MidiConnect />
    </div>
  )
}
