import { chordAtDegree } from '../../shared/musicTheory/scales'
import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'

/**
 * Vòng hợp âm cho đoạn dạo / giang / kết — **rút từ vốn hợp âm của chính bài**.
 *
 * ## Số đo đứng sau bộ này
 *
 * Đo bảy bản ký âm Linh Nhi (3 trưởng, 4 thứ), so bậc của hai mươi đoạn không lời
 * với bậc của các đoạn có lời trong CÙNG bài:
 *
 *   **16 trên 20 đoạn solo không dùng một bậc nào ngoài đoạn hát.**
 *
 * Chị ấy không soạn hoà âm mới cho câu solo — chị ấy **chọn lại từ vốn của bài**.
 *
 * Bốn ngoại lệ chỉ gồm hai hợp âm, và cả bốn đều rơi vào đoạn không lời:
 *
 * | bài        | đoạn  | bậc thêm |
 * |------------|-------|----------|
 * | Đường Xưa  | kết   | iv thứ   |
 * | Rừng Lá    | dạo   | iv thứ   |
 * | Rừng Lá    | kết   | iv thứ   |
 * | Một Cõi    | giang | I trưởng |
 *
 * Ba trên bốn là **bậc iv thứ mượn**, cái còn lại là **I trưởng Picardy**.
 *
 * ## Nhịp hoà âm chia ba tầng
 *
 * | đoạn  | hợp âm mỗi ô                      |
 * |-------|-----------------------------------|
 * | dạo   | 0,88–1,33 — phần lớn **≈ 1,0**    |
 * | giang | 0,70–1,00                         |
 * | kết   | **0,00–0,92**, năm trên bảy bài dưới **0,6** |
 *
 * Đoạn kết: Lá Thư **0,00** (không một ký hiệu nào, giữ nguyên suốt), Một Cõi 0,27,
 * Đường Xưa 0,33, Mùa Xuân 0,45, Đừng Xa 0,57. Vào đoạn kết chị ấy **hãm hoà âm lại
 * còn khoảng một nửa**, và nó đi cùng chỗ tay trái mỏng đi (2,1–6,7 mốc/ô so với
 * 5,9–7,7 ở đoạn dạo). Hai tay và hoà âm cùng thưa ra một lượt.
 *
 * ## Chỗ này thay gì
 *
 * `teacherSoloChords.ts` dựng một **dãy bậc CỐ ĐỊNH**, y hệt nhau cho mọi bài —
 * `thu(1) thu(7) thu(6) thu(3)…`. Số đo nói ngược lại. Dãy cố định ấy cũng chính là
 * chỗ sinh ra hợp âm `Bbm` (bậc VI thứ) không thuộc bài nào trong năm bài đo được.
 *
 * Bộ này KHÔNG xoá dãy cố định. Nó chạy trước; bài nào ít hợp âm quá thì nó trả rỗng
 * và đường cũ tiếp quản. Đó cũng là lý do nó nằm ở file riêng: `teacherSoloChords.ts`
 * đang có người khác sửa dở.
 */

type Key = { tonic: PitchClass; scale: ScaleType }

/** Số ô mặc định của một đoạn không lời — đo ra 6–10 ô, phần lớn 8. */
const SO_O = 8

/**
 * Hợp âm mỗi ô, theo đoạn.
 *
 * Dạo và giang ≈ 1,0. Kết 0,45 — trung vị của năm bài dưới ngưỡng 0,6.
 */
const NHIP: Record<'intro' | 'interlude' | 'outro', number> = {
  intro: 1,
  interlude: 1,
  outro: 0.45,
}

const lop = (chord: ParsedChord) => ((chord.root % 12) + 12) % 12
const laThu = (chord: ParsedChord) =>
  chord.quality.intervals.includes(3) && !chord.quality.intervals.includes(4)

/** Gộp hợp âm trùng gốc + chất, GIỮ NGUYÊN thứ tự xuất hiện trong bài. */
function von(chords: readonly ParsedChord[]): ParsedChord[] {
  const thay = new Set<string>()
  const out: ParsedChord[] = []
  for (const chord of chords) {
    const khoa = `${lop(chord)}|${chord.quality.symbol}`
    if (thay.has(khoa)) continue
    thay.add(khoa)
    out.push(chord)
  }
  return out
}

/** Bậc V của giọng bài — cửa vào hát ở ô cuối đoạn dạo và đoạn giang. */
function bacNam(key: Key, pool: readonly ParsedChord[]): ParsedChord | null {
  const built = chordAtDegree(key.tonic, key.scale, 5, { qualityOverride: '7' })
  const goc = built ? ((built.root % 12) + 12) % 12 : ((key.tonic + 7) % 12)
  /* Có sẵn trong bài thì lấy của bài — đừng dựng cái mới khi bài đã cho. */
  const cua = pool.find((chord) => lop(chord) === goc)
  if (cua) return cua
  if (!built) return null
  return { root: built.root, quality: built.quality, source: built.symbol, symbol: built.symbol }
}

/**
 * BỎ CHẤT maj7 Ở ĐOẠN SOLO — đo được, không phải suy đoán.
 *
 * Đếm chất hợp âm trên bảy bản ký âm, tách đoạn hát và đoạn không lời:
 *
 * | | hợp âm trơn | có màu |
 * |---|---|---|
 * | đoạn solo | 105 (**78%**) | 30 |
 * | đoạn hát  | 417 (**77%**) | 125 |
 *
 * Tỉ lệ giữ màu Y HỆT nhau — **chị ấy KHÔNG rút hợp âm solo về chất trơn**. Nên
 * đừng bóc màu của bài đi.
 *
 * Nhưng chất màu thì khác: `maj7` gặp **20 lần ở đoạn hát, 0 lần trong 30 hợp âm
 * màu của đoạn solo**. Nếu tỉ lệ hai bên bằng nhau thì xác suất ra 0 là dưới 1%.
 * Nên đây là chỗ chị ấy tránh thật.
 */
function boMaj7(chord: ParsedChord): ParsedChord {
  const iv = chord.quality.intervals
  if (!iv.includes(11) || iv.includes(10) || iv.includes(3)) return chord
  const tron = getChordQuality('maj')
  if (!tron) return chord
  const symbol = pitchClassName(((chord.root % 12) + 12) % 12 as PitchClass)
  return { root: chord.root, quality: tron, source: symbol, symbol }
}

export function vonHopAmLinhNhi(options: {
  kind: 'intro' | 'interlude' | 'outro'
  key: Key | null
  /** Hợp âm CHÍNH của bài, đã bỏ hợp âm lướt. */
  songChords: readonly ParsedChord[]
  soO?: number
}): ParsedChord[] {
  const { kind, key, songChords } = options
  const soO = options.soO ?? SO_O
  if (!key || songChords.length === 0) return []

  const kho = von(songChords)
  /*
    Dưới ba hợp âm thì không đủ vốn để sắp thành một vòng — trả rỗng, để đường
    dãy-bậc-cố-định cũ tiếp quản. Thà dùng vòng dựng sẵn còn hơn lặp hai hợp âm.
  */
  if (kho.length < 3) return []

  /*
    KHÔNG chặn theo số hợp âm của bài. Bài ít hợp âm thì QUAY VÒNG qua vốn ấy —
    đó vẫn là "rút từ vốn của bài", và nó giữ đúng nhịp 1,0 hợp âm mỗi ô của đoạn
    dạo. Chặn lại thì vòng dạo bị giữ lặp và nhịp hoà âm tụt xuống 0,75.
  */
  const soHopAm = Math.max(2, Math.round(soO * NHIP[kind]))

  /*
    MỞ TRÊN HỢP ÂM CHỦ nếu bài có. Đo bảy đoạn dạo: bốn mở trên i/I, một trên vi
    (bậc song song của giọng trưởng). Xoay vòng chứ không sắp lại — giữ nguyên
    trật tự của bài là cách trung thực nhất với "rút từ vốn của bài".
  */
  const chu = kho.findIndex((chord) => lop(chord) === key.tonic)
  const bat = chu >= 0 ? chu : 0
  const chon = Array.from({ length: soHopAm }, (_, i) => kho[(bat + i) % kho.length]!)

  /*
    Ô CUỐI DẠO VÀ CUỐI GIANG LÀ BẬC V — cửa vào hát.

    Đo được ở Biển Tình (giang kết A), Mùa Xuân (dạo và giang đều kết D) và Đừng Xa
    (dạo kết A). Đoạn kết KHÔNG áp luật này: ba bài đậu chủ âm, ba bài không, nên
    chưa thành luật.
  */
  if (kind !== 'outro') {
    const nam = bacNam(key, kho)
    if (nam) chon[chon.length - 1] = nam
  }

  /*
    Giãn ra cho đủ số ô bằng cách GIỮ mỗi hợp âm nhiều ô, không phải thêm hợp âm
    mới. Đây là chỗ nhịp hoà âm chậm lại ở đoạn kết: bốn hợp âm trải tám ô thì mỗi
    hợp âm vang hai ô, ra đúng 0,5 hợp âm mỗi ô.
  */
  if (soHopAm >= soO) return chon.map(boMaj7)
  const out: ParsedChord[] = []
  for (let o = 0; o < soO; o += 1) {
    out.push(chon[Math.min(soHopAm - 1, Math.floor((o * soHopAm) / soO))]!)
  }
  return out.map(boMaj7)
}

/**
 * Hai hợp âm DUY NHẤT chị ấy cho phép mình mượn ngoài bài, và chỉ ở đoạn không lời:
 * **bậc iv thứ** (3 lần) và **bậc I trưởng Picardy** (1 lần).
 *
 * Chưa dùng tới — 16 trên 20 đoạn KHÔNG mượn gì, nên mượn là ngoại lệ chứ không phải
 * luật. Để đây làm mốc cho lượt sau, nếu người dùng nghe thấy vòng rút từ bài quá
 * phẳng và muốn thêm màu.
 */
export const MUON_NGOAI_BAI = ['iv thứ', 'I trưởng (Picardy)'] as const

export const laBacIvThu = (chord: ParsedChord, key: Key) =>
  ((lop(chord) - key.tonic + 12) % 12) === 5 && laThu(chord)
