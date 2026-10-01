import { chordAtDegree } from '../../shared/musicTheory/scales'
import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import { pitchClassName } from '../../shared/musicTheory/pitch'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import { minorSoloSourceForTake, nguonKetThuBolero } from './minorSoloSource'
import type { TuyenSolo } from './tuyenSolo'

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
 * Dạo và giang ≈ 1,0.
 *
 * **Kết: 0,64 từ 9/9/2026, trước đó 0,45.** Con số cũ ghi là *"trung vị của năm bài dưới
 * ngưỡng 0,6"* — tức mẫu đã bị chọn lệch, bỏ hết những đoạn dày hơn trước khi lấy trung vị.
 * Đo lại đủ **bảy đoạn kết giọng thứ có ký hiệu** (`PianoBrain/tools/sheet/ket_thu.py`):
 *
 *     0,27 · 0,50 · 0,57 · 0,64 · 0,78 · 0,92 · 1,00   → trung vị 0,64 · trung bình 0,67
 *
 * Triệu chứng của số cũ, người dùng bắt được bằng mắt: vòng tám ô chỉ còn ba bốn hợp âm nên
 * ô nào cũng đứng cạnh một ô trùng nó — `Am Am E E Am Am Am Am`. Triệu chứng để lùi về 0,45:
 * đoạn kết đổi hợp âm quá gấp, nghe không kịp lắng.
 */
const NHIP: Record<'intro' | 'interlude' | 'outro', number> = {
  intro: 1,
  interlude: 1,
  /*
    **1,0 từ 9/9/2026 — đây là Ý NGƯỜI DÙNG, không phải trung vị số đo.**

    Lịch sử ba con số: `0,45` (mẫu chọn lệch, tự khai *"trung vị của năm bài dưới ngưỡng
    0,6"*) → `0,64` (trung vị đủ bảy đoạn) → `1,0`.

    Số đo bảy đoạn kết giọng thứ: `0,27 · 0,50 · 0,57 · 0,64 · 0,78 · 0,92 · 1,00`. Trung vị
    0,64, nhưng ở 0,64 thì tám ô chỉ có năm hợp âm nên **luôn có ô đứng cạnh một ô trùng
    nó**. Người dùng nêu ba lần liền: *"lại bị hiện tượng 2 hợp âm kề nhau"* · *"sao kết bài
    còn nguyên vẫn 2 hợp âm giống nhau đứng kế bên nhau"*.

    1,0 nằm trong dải đã đo — *Có Em Chờ* đúng 7 hợp âm trên 7 ô — nên đây là chọn **một
    đầu** của dải theo tai người dùng, không phải bịa một con số ngoài số đo. Ghi rõ để phiên
    sau đừng "sửa lại cho đúng trung vị": trung vị là 0,64, và người dùng biết điều đó.

    Triệu chứng để lùi về 0,64: đoạn kết đổi hợp âm quá gấp, nghe không kịp lắng.
  */
  outro: 1,
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

/** Ba nốt trơn. Đo dạo/giang/kết trưởng Linh Nhi: 90% trơn, add=0, maj7=0 (n=72 ô). */
function tronBa(chord: ParsedChord): ParsedChord {
  const iv = chord.quality.intervals
  const q = getChordQuality(iv.includes(3) && !iv.includes(4) ? 'min' : 'maj')
  if (!q) return chord
  const root = lop(chord) as PitchClass
  const symbol = `${pitchClassName(root)}${q.symbol}`
  return {
    root: chord.root,
    quality: q,
    source: symbol,
    symbol,
    ...(chord.bass !== undefined ? { bass: chord.bass } : {}),
  }
}

/**
 * Ô CHIA ĐÔI: đoạn dạo chia thưa hơn đoạn hát, đúng một nửa.
 *
 * Đo bảy bản ký âm, đếm ô có từ hai hợp âm khác nhau:
 *
 * | bài | đoạn hát | đoạn dạo |
 * |---|---|---|
 * | Biển Tình | 19% | 11% |
 * | Đừng Xa | 25% | 11% |
 * | Lá Thư | 40% | 33% |
 * | Một Cõi | 1% | 0% |
 * | Đường Xưa | 13% | 0% |
 * | Mùa Xuân | 20% | 12% |
 * | Rừng Lá | 39% | 11% |
 * | **gộp** | **22%** | **10%** |
 *
 * **7/7 bài đều có đoạn dạo chia thưa hơn hoặc bằng đoạn hát** — không bài nào ngược
 * lại. Nên bài hát chia nhiều thì đoạn dạo cũng chia, nhưng chỉ khoảng một nửa mức ấy.
 *
 * Hai bài mà đoạn hát chia **dưới 15%** (Một Cõi 1%, Đường Xưa 13%) có đoạn dạo **không
 * chia ô nào** — đó là `NGUONG_CHIA`.
 *
 * Tỉ số dạo/hát của năm bài còn lại: 0,58 · 0,44 · **0,83** · 0,60 · **0,28**. Trung vị
 * 0,58, và hai đầu cách nhau ba lần — Lá Thư kéo lên, Rừng Lá kéo xuống. **n=5, tản
 * rộng**; lấy 0,55 là lấy khoảng giữa chứ không phải một con số chắc.
 *
 * Cũ: 0,45 (lấy tỉ lệ gộp 10/22). Triệu chứng để lùi là bài chia nhiều với bài chia
 * vừa ra cùng một số ô chia — 0,45 không tách được hai mức ấy trong một đoạn tám ô.
 */
const HE_SO_CHIA = 0.55

/** Đoạn hát chia dưới mức này thì đoạn dạo không chia ô nào. Đo: Một Cõi 1%, Đường Xưa 13%. */
const NGUONG_CHIA = 0.15

/**
 * Ô chia đôi đặt ở đâu — CHƯA ĐO ĐỦ, đây là chỗ yếu nhất của bộ này.
 *
 * Sáu ô chia đo được nằm ở vị trí 0,89 · 0,78 · 0,83 · 0,50 · 0,33 · 0,33 của đoạn.
 * 3/6 rơi vào một phần ba cuối. **n=6**, chưa thành luật; tạm đặt từ ô ÁP CHÓT lùi
 * dần lên, và chừa ô cuối vì ô cuối là cửa bậc V cho ca sĩ vào hát.
 *
 * Phách chia: 3/6 đúng giữa ô, 2/6 ở phách 3, 1/6 ở phách 1 — lấy giữa ô.
 */
const CHIA_TU_CUOI = true

/** Đánh dấu hai nửa của một ô chia đôi, để `phraseSection` biết chia phách. */
const nuaO = new WeakSet<ParsedChord>()

/**
 * Số phách của từng hợp âm trong vòng.
 *
 * ponytail: nhận diện bằng WeakSet trên chính đối tượng hợp âm, nên đường đi từ đây
 * tới `phraseSection` phải giữ NGUYÊN tham chiếu, không được tạo hợp âm mới. Hiện
 * `phraseChords` chỉ sao chép MẢNG (`[...borrowed]`) chứ không tạo phần tử mới nên còn
 * đúng; ai chèn thêm bước `map` dựng hợp âm mới thì nhịp chia đôi sẽ lặng lẽ biến mất.
 *
 * Vì thế hai nửa của ô chia phải là ĐỐI TƯỢNG RIÊNG. Một vòng tám ô rút từ vốn sáu hợp
 * âm thì cùng một `A7` xuất hiện ở nhiều ô — đánh dấu thẳng lên nó là mọi ô chứa `A7`
 * cùng bị coi là nửa ô, và đoạn dạo co lại còn một nửa độ dài.
 */
export const nhipVong = (chords: readonly ParsedChord[], moiO: number): number[] =>
  chords.map((chord) => (nuaO.has(chord) ? moiO / 2 : moiO))

export function vonHopAmLinhNhi(options: {
  kind: 'intro' | 'interlude' | 'outro'
  key: Key | null
  /** Hợp âm CHÍNH của bài, đã bỏ hợp âm lướt. */
  songChords: readonly ParsedChord[]
  soO?: number
  /** Tỉ lệ ô chia đôi của ĐOẠN HÁT — xem `HE_SO_CHIA`. */
  tiLeChiaHat?: number
  /**
   * Ô tick: vòng dạo giống sheet trưởng. n=3 Linh Nhi. Mặc định tắt.
   */
  daoTruong?: boolean
  /**
   * Tuấn intro thứ (luôn bật — ô tick "vòng dạo giống sheet thứ" gỡ 1/10/2026): vòng dạo theo 8 sheet thứ, xoay `take`.
   * Cũ n=3 khóa tonic%3 → A thứ luôn Đừng Xa. Lùi: intro thứ lại một vòng Am G F C.
   */
  daoThu?: boolean
  /** Lượt phát — xoay mẫu sheet thứ. */
  take?: number
  /*
    Ô tick "vòng giang giống sheet thứ" (`giangThu`, mẫu `MAU_GIANG_THU`: Đừng Xa ♭VII–♭VI–♭III · Tình Em ♭VI–♭VII–♭III ·
    Chiếc Lá V–i–♭VII, n=3) gỡ 1/10/2026 — người dùng; đo trước khi gỡ: đổi 0 ca ở mọi nút. Khôi phục: commit 54b3463.
  */
}): ParsedChord[] {
  const { kind, key, songChords } = options
  const soO = options.soO ?? SO_O
  if (!key || songChords.length === 0) return []

  const gocKho = von(songChords)
  const thu = key.scale === 'minor'
  /*
    ĐOẠN KẾT GIỌNG THỨ CŨNG THEO MẪU SHEET — mở 9/9/2026.

    Người dùng hỏi hai lần cùng một chuyện: *"sao intro thứ dùng các hợp âm giống trong
    sheet thứ nhưng outro lại dùng hợp âm ngoài"* rồi *"sao outro vẫn còn vòng hợp âm
    add9 vậy"*. Trước đó đoạn kết lấy thẳng vốn hợp âm của bài, nên bài dùng màu
    (`Am(add9)`, `Dm9`, `G9`) thì đoạn kết kêu màu, trong khi đoạn dạo cùng bài lại kêu
    hợp âm ba trơn — hai đoạn nghe như hai bài.

    Bật `theoSheet` kéo theo hai việc cùng lúc: vòng chép theo **mẫu của sheet** thay vì
    xoay vốn bài, và kho hợp âm được `tronBa` — đó là chỗ hợp âm ba trơn ra đời.

    Không đặt sau ô tick: đoạn dạo giọng thứ (Bolero Tuấn) cũng đang **luôn bật** mẫu sheet,
    nên để đoạn kết sau một ô tick thì hai đoạn lại lệch nhau đúng như người dùng vừa phàn
    nàn. Triệu chứng để lùi: đoạn kết mất hẳn màu của bài.
  */
  const theoSheet =
    (kind === 'intro' &&
      ((thu && options.daoThu === true) || (!thu && options.daoTruong === true))) ||
    (kind === 'outro' && thu)
  const kho = theoSheet ? von(gocKho.map(tronBa)) : gocKho
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
  /*
    Mẫu trưởng n=3 Linh Nhi. Mẫu thứ: intro Linh Nhi + giang ít trưởng.
    Sheet Linh Nhi intro trưởng **30%** (11/37 ô, n=5 bài). Cũ: Tình Em/Đừng Xa giang ≥50%.
  */
  type Chat = 'm' | '' | '7'
  const MAU_DAO_TRUONG = [
    [0, 9, 4, 7, 0, 4, 0],
    [0, 9, 2, 4, 9, 2, 4],
    [0, 9, 2, 7, 9, 5, 2],
  ] as const
  const dung = (bac: number, chat: Chat): ParsedChord | undefined => {
    const q = getChordQuality(chat === 'm' ? 'min' : chat === '7' ? '7' : 'maj')
    if (!q) return undefined
    const root = (((key.tonic + bac) % 12) + 12) % 12 as PitchClass
    const symbol = `${pitchClassName(root)}${q.symbol}`
    return { root, quality: q, source: symbol, symbol }
  }
  const hopBac = (bac: number, chat?: Chat) => {
    const gocPc = (((key.tonic + bac) % 12) + 12) % 12
    const trong = kho.filter((c) => lop(c) === gocPc)
    if (chat === 'm') {
      const t = trong.find(laThu)
      if (t) return t
    } else if (chat === '7') {
      const t = trong.find((c) => c.quality.intervals.includes(10))
      if (t) return t
    } else if (chat === '') {
      const t = trong.find((c) => !laThu(c))
      if (t) return t
    }
    /*
      Dựng mới CHỈ khi bậc ấy đã có trong vốn bài, để đổi chất — vốn bài có `E` thì mẫu
      sheet đòi `Em`/`E7` vẫn dựng được.

      Riêng ĐOẠN KẾT thì bậc **không có trong bài** trả rỗng, để mẫu bỏ qua bậc ấy. Đoạn
      dạo vẫn được dựng (giang tấu không còn đi mẫu sheet từ 1/10/2026), vì hai bài kiểm `daoThu lấy bậc và chất hợp âm trực
      tiếp từ sheet` và `vòng solo Am giữ được ii thật` đòi đúng điều ngược lại — chặn cả
      hai đường làm chúng đỏ. Đo bảy bản ký âm:
      16 trên 20 đoạn không lời KHÔNG dùng bậc nào ngoài đoạn hát — `vonHopAmLinhNhi.test.ts`
      canh đúng luật này. Mở mẫu sheet cho đoạn kết ngày 9/9/2026 đã làm nó đỏ một lần:
      mẫu đòi bậc II mà bài La thứ không có bậc ấy, thế là sinh ra `Bm` từ hư không.
    */
    if (theoSheet && thu && chat !== undefined && (kind !== 'outro' || trong.length > 0))
      return dung(bac, chat)
    if (trong[0]) return trong[0]
    return theoSheet && (kind !== 'outro' || trong.length > 0)
      ? dung(bac, chat ?? '')
      : undefined
  }
  const moChu = (ds: ParsedChord[]) => {
    const h = hopBac(0, thu ? 'm' : '')
    if (!h) return ds
    if (ds.length === 0) return [h]
    if (lop(ds[0]!) === key.tonic) return ds
    const ra = [h, ...ds]
    return ra.filter((c, i) => i === 0 || lop(c) !== lop(ra[i - 1]!))
  }
  const theoMau = (): ParsedChord[] => {
    const ra: ParsedChord[] = []
    if (thu) {
      /* Đoạn kết học đoạn kết, đoạn dạo học đoạn dạo — không mượn chéo. */
      /*
        NGUỒN KHẢ THI: mọi bậc của mẫu đều có thật trong vốn hợp âm của bài.

        Nguồn nào đòi một chức năng bài không có thì bỏ hẳn nguồn ấy rồi thử nguồn kế —
        đúng chỉ dẫn *"hãy bỏ candidate/source đó trong vòng này"*. Thử tối đa ba nguồn
        (đúng số tuyến `linh-nhi + bolero + outro + thứ`); hết mà không nguồn nào khả thi
        thì trả rỗng để đường cũ tiếp quản, chứ không vá.
      */
      const bacCoTrongBai = (t: TuyenSolo): boolean => {
        const bars = t.phach === 8 && t.o4 ? t.o4 : t.o
        return bars
          .filter((o) => o.bac !== null)
          .every((o) => kho.some((c) => lop(c) === ((((key.tonic + o.bac!) % 12) + 12) % 12)))
      }
      const nguonKhaThi = (): TuyenSolo | undefined => {
        for (let i = 0; i < 3; i += 1) {
          const t = nguonKetThuBolero((options.take ?? 0) + i)
          if (t && bacCoTrongBai(t)) return t
        }
        return undefined
      }
      const source =
        kind === 'outro'
          ? nguonKhaThi()
          : minorSoloSourceForTake(options.take ?? 0, 'intro')
      const bars = source?.phach === 8 && source.o4 ? source.o4 : source?.o
      const mau: readonly (readonly [number, Chat])[] = (bars ?? [])
        .filter((o) => o.bac !== null)
        .map((o) => [o.bac!, o.chat === 'm' ? 'm' : o.chat === '7' ? '7' : ''] as const)
      /*
        Chép đường hợp âm chính theo từng ô của đúng sheet đã chọn. Giữ cả hai ô cùng
        hợp âm nếu sheet viết như vậy: đó là thời lượng hoà âm, không phải dữ liệu thừa.
        `bac2` chưa nhập ở đây vì Bolero Tuấn giữ khung một hợp âm mỗi ô.
      */
      for (let i = 0; mau.length > 0 && ra.length < soHopAm; i += 1) {
        const [bac, chat] = mau[i % mau.length]!
        /*
          Mẫu đòi một bậc bài không có thì **thay bằng bậc gần nhất trong vốn bài**, đừng
          bỏ qua.

          Bỏ qua là chuyện đã làm và người dùng bắt được bằng mắt: mẫu `i - V - II - i` của
          *Đừng Xa* mất bậc II vì bài La thứ không có, vòng còn đúng hai hợp âm rồi giãn ra
          thành `Am Am E E Am Am Am Am` — *"lại bị hiện tượng 2 hợp âm kề nhau"*.

          Thay thế giữ được cả hai luật cùng lúc: số hợp âm không hụt, mà cũng không sinh
          bậc nào ngoài bài (`vonHopAmLinhNhi.test.ts`, đo 7 bản ký âm, 16/20 đoạn không
          lời không dùng bậc ngoài đoạn hát).
        */
        /*
          BỎ `ganNhat()` Ở ĐOẠN KẾT — thay bậc theo bán cung gần nhất KHÔNG phải tương
          đương chức năng.

          `ganNhat` từng được thêm để vòng khỏi hụt hợp âm khi mẫu đòi một bậc bài không
          có. Nhưng nó lấy gốc gần nhất trên vòng tròn bán cung, mà gần về cao độ không có
          nghĩa là cùng chức năng: một `II` bị thay bằng `♭III` làm đổi hẳn hướng hoà thanh.

          Cách đúng: nguồn nào đòi một chức năng vốn bài không có thì **loại cả nguồn ấy**
          (xem `nguonKhaThi` bên dưới), không vá bằng hợp âm nghe gần.
        */
        const h = hopBac(bac, chat)
        if (!h) continue
        /*
          Chặn trùng liền kề CHỈ ở đoạn kết. Đoạn dạo phải giữ hợp âm lặp qua hai ô khi
          sheet viết như vậy — đó là thời lượng hoà âm, và hai bài kiểm `daoThu lấy bậc và
          chất hợp âm trực tiếp từ sheet` với `intro thứ daoThu: giữ cả hợp âm lặp qua hai
          ô` đỏ ngay nếu chặn cả hai đoạn.
        */
        if (kind === 'outro' && ra.length > 0 && lop(ra[ra.length - 1]!) === lop(h)) continue
        ra.push(h)
      }
      while (ra.length < soHopAm) {
        const gocCuoi = ra.length === 0 ? -1 : lop(ra[ra.length - 1]!)
        const h = hopBac(gocCuoi === key.tonic ? 5 : 0, 'm')
        if (!h || lop(h) === gocCuoi) break
        ra.push(h)
      }
      /* Một số sheet (Chiếc Lá Mùa Đông) lấy đà từ ♭VI; app cần xác lập giọng thứ ngay ô đầu. */
      const chuThu = hopBac(0, 'm')
      if (chuThu && ra.length > 0 && lop(ra[0]!) !== key.tonic) ra[0] = chuThu
      return ra
    }
    const mau = MAU_DAO_TRUONG[(options.take ?? 0) % MAU_DAO_TRUONG.length]!
    for (let i = 0; ra.length < soHopAm && i < mau.length * 4; i += 1) {
      const h = hopBac(mau[i % mau.length]!)
      if (h) ra.push(h)
    }
    return moChu(ra)
  }
  const tuMau = theoSheet ? theoMau() : []
  const chon =
    tuMau.length >= 2
      ? tuMau
      : Array.from({ length: soHopAm }, (_, i) => kho[(bat + i) % kho.length]!)
  if (chon.length < 2) return []

  /*
    Ô CUỐI DẠO VÀ CUỐI GIANG LÀ BẬC V — cửa vào hát.

    Đo được ở Biển Tình (giang kết A), Mùa Xuân (dạo và giang đều kết D) và Đừng Xa
    (dạo kết A). Đoạn kết KHÔNG áp luật này: ba bài đậu chủ âm, ba bài không, nên
    chưa thành luật.
  */
  if (kind !== 'outro') {
    const nam = bacNam(key, kho)
    if (nam) chon[chon.length - 1] = nam
  } else {
    /*
      Ô CUỐI ĐOẠN KẾT PHẢI ĐẬU Ở BẬC MÀ CÁC THẦY THẬT SỰ DÙNG ĐỂ KẾT.

      Đo 9 đoạn kết giọng thứ của cả ba thầy (`PianoBrain/tools/sheet/ket_thu.py`,
      có `--kiem`): bảy đoạn có ký hiệu hợp âm cuối, và chúng đậu ở bậc
      **1 ×4 · ♭3 ×1 · 2 ×1 · 4 ×1**. **Không đoạn nào kết ở ♭VII.**

      App thì có. Người dùng chụp màn hình một bài La thứ kết trên `G9` — bậc ♭VII —
      và hỏi vì sao đoạn kết vẫn thế. Kết ở ♭VII nghe lửng, không đóng được bài.

      Nên: ô cuối nằm ngoài tập bậc trên thì thay bằng **hợp âm chủ có trong vốn của
      bài** — giữ nguyên màu, không dựng hợp âm ba trơn. Không có hợp âm chủ trong
      vốn thì để nguyên, vì thay bằng thứ không có trong bài còn tệ hơn.

      Đây KHÔNG phải luật "phải đậu chủ âm": bốn trên bảy đoạn đậu chủ âm, ba đoạn
      đậu ♭3 · 2 · 4 — quá mỏng để ép về một bậc. Chỉ loại những bậc **chưa thầy nào
      dùng**. Triệu chứng để lùi: đoạn kết luôn về chủ âm, mất mấy màu kết lạ.
    */
    const KET_DUOC = new Set([0, 2, 3, 5])
    const cuoi = chon[chon.length - 1]!
    const bac = ((((cuoi.root - key.tonic) % 12) + 12) % 12)
    if (!KET_DUOC.has(bac)) {
      const chu = kho.find((c) => lop(c) === ((key.tonic % 12) + 12) % 12)
      if (chu) chon[chon.length - 1] = chu
    }
    /*
      Ép xong thì **ô liền trước phải khác ô cuối**.

      Không có luật này thì vòng kết bằng hai ba ô chủ âm dính nhau: người dùng chụp màn
      hình `Am Am E E C Am Am Am` và nói *"lại bị hiện tượng 2 hợp âm kề nhau"*. Ô áp chót
      lấy bậc **V** nếu bài có — đó là cửa dẫn về chủ âm, và bốn trên bảy đoạn kết của bản
      ký âm cũng đi qua bậc V ngay trước khi đậu.
    */
    if (chon.length >= 2) {
      const chotLop = lop(chon[chon.length - 1]!)
      if (lop(chon[chon.length - 2]!) === chotLop) {
        const nam = kho.find((c) => lop(c) === (((key.tonic + 7) % 12) + 12) % 12)
        const khac = nam ?? kho.find((c) => lop(c) !== chotLop)
        if (khac) chon[chon.length - 2] = khac
      }
    }
  }
  /*
    Giãn ra cho đủ số ô bằng cách GIỮ mỗi hợp âm nhiều ô, không phải thêm hợp âm
    mới. Đây là chỗ nhịp hoà âm chậm lại ở đoạn kết: bốn hợp âm trải tám ô thì mỗi
    hợp âm vang hai ô, ra đúng 0,5 hợp âm mỗi ô.
  */
  const deu =
    soHopAm >= soO
      ? chon
      : Array.from(
          { length: soO },
          (_, o) => chon[Math.min(soHopAm - 1, Math.floor((o * soHopAm) / soO))]!,
        )
  /*
    ĐOẠN KẾT: KHỬ MỌI CẶP Ô KỀ NHAU TRÙNG HỢP ÂM.

    **Đây là Ý NGƯỜI DÙNG**, nêu bốn lần liền: *"lại bị hiện tượng 2 hợp âm kề nhau"* ·
    *"sao kết bài còn nguyên vẫn 2 hợp âm giống nhau đứng kế bên nhau"* · *"vẫn lủng củng và
    bị trùng 2 hợp âm"*.

    Bản ký âm thì CÓ giữ một hợp âm qua hai ô — đó là thời lượng hoà âm thật. Nhưng người
    dùng không muốn thấy nó, và đây là lựa chọn phối khí của họ, không phải số đo.

    Cách khử: ô trùng ô trước thì thay bằng **hợp âm kế tiếp trong chính vòng đã dựng** — vẫn
    là hợp âm của vòng ấy, không dựng mới và không lấy từ ngoài vốn bài. Không tìm được thì
    để nguyên còn hơn bịa.

    Triệu chứng để lùi: đoạn kết đổi hợp âm quá gấp, mất chỗ lắng.
  */
  const khongKeTrung = (v: readonly ParsedChord[]): ParsedChord[] => {
    const ra = [...v]
    /* Ứng viên thay: hợp âm có thật trong vòng, khác cả ô trước lẫn ô sau. */
    const timThay = (truoc: number, sau: number | null): ParsedChord | undefined =>
      ra.find((c) => lop(c) !== truoc && (sau === null || lop(c) !== sau))
    for (let i = 1; i < ra.length; i += 1) {
      if (lop(ra[i]!) !== lop(ra[i - 1]!)) continue
      if (i === ra.length - 1) {
        /*
          Trùng ở CUỐI thì đổi ô ÁP CHÓT, không đổi ô chót: ô chót phải đậu hợp âm chủ —
          bốn trên bảy đoạn kết của bản ký âm đậu bậc 1, và không đoạn nào kết ở ♭VII.
        */
        const truoc = i >= 2 ? lop(ra[i - 2]!) : -1
        const thay = timThay(truoc, lop(ra[i]!))
        if (thay) ra[i - 1] = thay
      } else {
        const thay = timThay(lop(ra[i - 1]!), lop(ra[i + 1]!))
        if (thay) ra[i] = thay
      }
    }
    return ra
  }
  const raCuoi = chiaO(deu.map(boMaj7), kho, options.tiLeChiaHat ?? 0, soO)
  return kind === 'outro' ? khongKeTrung(raCuoi) : raCuoi
}

/**
 * Chèn hợp âm nửa ô sau vào một số ô, theo tỉ lệ đo được ở `HE_SO_CHIA`.
 *
 * Hợp âm chèn lấy trong VỐN HỢP ÂM CỦA BÀI, không dựng mới — giữ đúng luật gốc của
 * file này.
 *
 * Chất của hợp âm thứ hai, đo sáu ô chia: **át hoặc át phụ 3/6**, hạ át 2/6, chủ 1/6 —
 * Đừng Xa `E→A` (A7 là bậc V), Lá Thư `Bb→E` (át phụ), Biển Tình `F#m→E` (át phụ).
 * **n=6**, chỉ đủ để nói át là chất HAY GẶP NHẤT, không đủ thành luật. Nên: ưu tiên
 * một hợp âm chất át trong vốn của bài, không có thì đi tiếp trong vốn.
 *
 * Cũ: luôn đi tiếp trong vốn. Triệu chứng là vốn xếp cạnh nhau kiểu `Am` rồi `Eb` thì
 * ô chia nhảy quãng ba cung, nghe chối.
 */
function chiaO(
  vong: readonly ParsedChord[],
  kho: readonly ParsedChord[],
  tiLeChiaHat: number,
  soO: number,
): ParsedChord[] {
  if (tiLeChiaHat < NGUONG_CHIA) return [...vong]
  const soChia = Math.round(soO * tiLeChiaHat * HE_SO_CHIA)
  if (soChia <= 0 || vong.length < 2 || kho.length < 2) return [...vong]

  /* Ô áp chót lùi dần lên; chừa ô cuối vì đó là cửa bậc V cho ca sĩ vào hát. */
  const cho = new Set<number>()
  for (let k = 0; k < soChia; k += 1) {
    const o = vong.length - 2 - (CHIA_TU_CUOI ? k : -k)
    if (o >= 0) cho.add(o)
  }

  const out: ParsedChord[] = []
  vong.forEach((chord, o) => {
    out.push(chord)
    if (!cho.has(o)) return
    const trung = (a: ParsedChord, b: ParsedChord) =>
      lop(a) === lop(b) && a.quality.symbol === b.quality.symbol
    /* Ưu tiên một hợp âm chất át trong vốn; không có thì đi tiếp trong vốn. */
    const at = kho.find((c) => c.quality.intervals.includes(10) && !trung(c, chord))
    const i = kho.findIndex((c) => trung(c, chord))
    const ke = at ?? kho[(Math.max(0, i) + 1) % kho.length]!
    if (trung(ke, chord)) return
    /* Nhân bản để dấu chỉ dính đúng hai nửa này, không dính mọi ô cùng hợp âm. */
    const dau = { ...chord }
    const cuoi = { ...ke }
    nuaO.add(dau)
    nuaO.add(cuoi)
    out[out.length - 1] = dau
    out.push(cuoi)
  })
  return out
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
