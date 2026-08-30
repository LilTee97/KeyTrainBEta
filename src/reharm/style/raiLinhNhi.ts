import { chordTonesStrict } from '../fillSoloGenerator/soloVocabulary'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { TimelineEvent } from './types'

/**
 * Tay phải đoạn giang tấu, **suy ra từ tay trái** thay vì sinh độc lập.
 *
 * ## Vì sao phải đảo kiến trúc
 *
 * Bộ sinh trước cho tay phải bốc nốt từ thang gam mà **không hề biết tay trái
 * đang giữ nốt gì ở thời điểm ấy**, rồi mới để `interlockHands` xen vào tỉa
 * bớt. Hai luồng xa lạ ghép lại. Người dùng nghe ra ngay: "tay phải quá rời
 * rạc với tay trái".
 *
 * Đo mười ô giang tấu bản ký âm Linh Nhi thì thấy ngược hẳn dự đoán:
 *
 * |                          | phiên khúc | giang tấu |
 * |--------------------------|-----------|-----------|
 * | mốc gõ có CẢ HAI tay     | 45%       | **55%**   |
 * | chỉ tay trái             | 43%       | 31%       |
 * | chỉ tay phải             | 11%       | 13%       |
 * | nốt TRÙNG LỚP CAO ĐỘ     | 31%       | **47%**   |
 * | khe hai tay (trung vị)   | 19        | **24**    |
 * | tay phải xuống dưới trái | 0%        | **0%**    |
 * | hai tay cùng hướng       | 72%       | 52%       |
 *
 * Ba điều rút ra:
 *
 * 1. Vào giang tấu hai tay gõ CÙNG NHAU NHIỀU HƠN, không ít hơn.
 * 2. Gần một nửa số mốc chung, tay phải chơi lại chính lớp cao độ tay trái đang
 *    giữ — nó **nhân bản nốt tay trái lên cao**, không đi tìm nốt riêng.
 * 3. Khe cố định quanh hai quãng tám và **không bao giờ bắt chéo**.
 *
 * Còn hướng đi thì độc lập — 52/48, gần như ngẫu nhiên. Hai tay khoá nhau ở
 * NHỊP và LỚP CAO ĐỘ, còn đường nét để tự do.
 *
 * ## Chỗ này thay gì
 *
 * Đây là bản sao lối Linh Nhi, nên nó **không** dùng `interlockHands` — luật ấy
 * dựng theo Cà Pháo, nơi chỉ 32-73% nốt tay phải trùng cú gõ tay trái, tức "cài
 * vào khe". Linh Nhi làm ngược. Trộn hai phong cách là hỏng cả hai.
 */

/** Bao nhiêu phần cú gõ tay trái được tay phải gõ cùng. Đo: 55 trên 55+31. */
const CUNG_GO = 0.64

/** Trong những mốc chung, bao nhiêu phần tay phải lấy lại lớp cao độ tay trái. */
const NHAN_BAN = 0.47

/** Bao nhiêu mốc là tay phải gõ MỘT MÌNH, chen giữa hai cú gõ tay trái. */
const RIENG = 0.2

/**
 * Bao nhiêu phần cú gõ tay phải có từ hai nốt trở lên. Đo trên bản gốc: 36%.
 *
 * Đặt cao hơn 0,36 có chủ ý: phép chồng chỉ chạy ở mốc CHUNG, mà mốc chung
 * chiếm chừng 57% số cú gõ tay phải, nên 0,36 thẳng thì đo ra chỉ 23%.
 */
const CHONG = 0.55

/** Khe giữa hai tay: trung vị 24 nửa cung, hẹp nhất 9. */
const KHE_VUA = 24
const KHE_HEP = 9

const hash = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const lop = (note: number) => (((note % 12) + 12) % 12) as PitchClass

/**
 * Đặt một lớp cao độ vào quãng tám gần `muon` nhất, nhưng không thấp hơn `san`.
 *
 * `san` là trần tay trái cộng khe hẹp nhất — đây là chỗ giữ luật "không bao giờ
 * bắt chéo", và số đo cho 0% nên nó là luật cứng chứ không phải xu hướng.
 */
function datNot(pc: PitchClass, muon: number, san: number, tran: number): MidiNote | null {
  let note = Math.round((muon - pc) / 12) * 12 + pc
  while (note < san) note += 12
  while (note > tran) note -= 12
  return note >= san && note <= tran ? (note as MidiNote) : null
}

export interface RaiLinhNhiOptions {
  /** Tay trái đã dựng xong — bộ này bám vào nó. */
  left: readonly TimelineEvent[]
  chords: readonly ParsedChord[]
  beatsPerChord: number
  range: { low: number; high: number }
  /** Lượt chơi — đổi đường đi mà không đổi luật. */
  take?: number
}

export function raiLinhNhi(options: RaiLinhNhiOptions): TimelineEvent[] {
  const { left, chords, beatsPerChord, range } = options
  const take = options.take ?? 0
  if (left.length === 0 || chords.length === 0) return []

  /* Gom tay trái theo mốc gõ: một mốc có thể nhiều nốt. */
  const moc = new Map<number, MidiNote[]>()
  for (const event of left) {
    const at = Number(event.startBeat.toFixed(3))
    moc.set(at, [...(moc.get(at) ?? []), ...event.notes])
  }
  const mocs = [...moc.keys()].sort((a, b) => a - b)

  const hopAm = (beat: number) =>
    chords[Math.min(chords.length - 1, Math.floor(beat / beatsPerChord))]!

  const out: TimelineEvent[] = []
  let truoc = (range.low + range.high) / 2

  const them = (beat: number, note: MidiNote, manh: boolean, den: number) => {
    out.push({
      notes: [note],
      startBeat: beat,
      durationBeats: Math.max(0.05, den * 0.9),
      hand: 'right',
      velocity: manh ? 78 : 66,
      grace: false,
    })
    truoc = note
  }

  mocs.forEach((beat, index) => {
    const sau = mocs[index + 1] ?? beat + 0.5
    const keo = sau - beat
    const duoi = moc.get(beat)!
    const tranTrai = Math.max(...duoi)
    const san = Math.max(range.low, tranTrai + KHE_HEP)
    const chord = hopAm(beat)
    const tones = chordTonesStrict(chord)

    if (hash(take * 17 + index * 5) < CUNG_GO) {
      /*
        MỐC CHUNG. Gần một nửa số lần lấy lại chính lớp cao độ tay trái đang
        giữ — đây là chỗ hai tay dính vào nhau. Còn lại lấy một nốt hợp âm khác,
        để đường trên không thành bản sao y nguyên.
      */
      /*
        Không nhân bản thì phải bốc nốt KHÔNG có trong tay trái.

        Bản đầu bốc từ cả bộ nốt hợp âm, mà tay trái cũng đang chơi nốt hợp âm —
        nên nó vô tình trùng thêm, và tỉ lệ trùng lớp đo ra 66% thay vì 47%. Cái
        núm 0,47 không điều khiển được gì cả khi nhánh còn lại cũng trùng.
      */
      const dangGiu = new Set(duoi.map(lop))
      const nhanBan = hash(take * 29 + index * 11) < NHAN_BAN
      const khac = tones.filter((pc) => !dangGiu.has(pc))
      const kho = nhanBan || khac.length === 0 ? duoi.map(lop) : khac
      const pc = kho[Math.floor(hash(take * 7 + index * 13) * kho.length) % kho.length]!
      const note = datNot(pc, tranTrai + KHE_VUA, san, range.high)
      if (note !== null) them(beat, note, true, keo)

      if (note !== null && hash(take * 3 + index * 41) < CHONG) {
        // Chồng thêm một nốt hợp âm phía dưới, vẫn trên trần tay trái.
        const duoiPc = tones[Math.floor(hash(take * 19 + index * 23) * tones.length) % tones.length]!
        const them2 = datNot(duoiPc, note - 5, san, note - 1)
        if (them2 !== null) {
          out.push({
            notes: [them2],
            startBeat: beat,
            durationBeats: Math.max(0.05, keo * 0.9),
            hand: 'right',
            velocity: 60,
            grace: false,
          })
        }
      }
    }

    /*
      MỐC RIÊNG của tay phải, chen vào giữa hai cú gõ tay trái. Đo ra 13% số
      mốc; nó là chỗ tay phải nhô ra khỏi khung của tay trái.
    */
    // Chặn 0,3 chứ không 0,4: mẫu rải này gõ dày nên khe 0,375 rất hay gặp,
    // chặn ở 0,4 thì mốc riêng bị bóp còn 8% thay vì 13%.
    if (keo >= 0.3 && hash(take * 37 + index * 3) < RIENG) {
      const pc = tones[Math.floor(hash(take * 43 + index * 7) * tones.length) % tones.length]!
      const note = datNot(pc, truoc, san, range.high)
      if (note !== null) them(beat + keo / 2, note, false, keo / 2)
    }
  })

  return out.sort((a, b) => a.startBeat - b.startBeat)
}
