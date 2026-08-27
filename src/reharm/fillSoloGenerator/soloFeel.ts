import { getStyle } from '../style/styleLibrary'

/**
 * Cách chia thời gian của câu chạy, theo điệu đang chọn.
 *
 * Trước đây bộ sinh câu **không nhìn thấy điệu** một lần nào: `soloGenerator.ts`
 * không import module điệu nào cả, nên câu giang tấu của bossa nova, slow rock,
 * swing và ballad giống hệt nhau từng nốt — chỉ phần đệm đổi. Nghe ra ngay là
 * một câu chạy vô danh tính đặt lên một nền có danh tính.
 *
 * Chỗ này **không đổi một nốt nào**, chỉ đổi chỗ nốt rơi. Cao độ là việc của
 * hoà âm, còn đây là việc của nhịp.
 */
export type SoloFeel =
  /** Móc đơn đều nhau. Ballad, slow rock, pop. */
  | 'straight'
  /** Móc đơn chia chùm ba, nốt lệch rơi ở 2/3 phách. Jazz, swing. */
  | 'swing'
  /** Móc đơn vẫn đều, nhưng nửa sau ô nhịp **tới sớm** một móc đơn. Bossa, samba. */
  | 'bossa'

/**
 * Điệu này thì câu chạy chia nhịp kiểu gì.
 *
 * Đọc `feel` của chính điệu trong thư viện, nên thêm điệu mới là tự có, không
 * phải nhớ cập nhật một bảng thứ hai ở đây.
 *
 * Bossa **không swing**: nhạc Brazil chơi móc đơn đều, chất của nó nằm ở chỗ
 * đảo phách chứ không ở chỗ nảy. Trộn swing vào bossa là lỗi nghe ra ngay.
 */
export function soloFeelFor(styleId: string | undefined | null): SoloFeel {
  if (!styleId) return 'straight'
  switch (getStyle(styleId)?.feel) {
    case 'swing':
      return 'swing'
    case 'syncopated-3-3-2':
      return 'bossa'
    default:
      // Ballad, slow rock, pop, valse: đều. Không mượn cái nảy của jazz sang.
      return 'straight'
  }
}

/** Tỉ lệ dài ngắn 2:1 — nốt lệch rơi ở hai phần ba phách. */
const SWING_OFFBEAT = 2 / 3

/** Bossa nghiêng về phía trước: nốt lệch tới sớm, ngược hẳn cái nảy của jazz. */
const BOSSA_OFFBEAT = 0.47

/** Nốt nào coi là "nốt lệch" của một phách: quanh giữa phách. */
const isOffBeat = (offset: number) => offset > 0.4 && offset < 0.6

export interface TimedNote {
  startBeat: number
  durationBeats: number
}

/**
 * Đặt lại chỗ rơi của từng nốt theo feel.
 *
 * Trường độ co giãn theo, để nốt không đè lên nốt sau — nhưng không nốt nào bị
 * bỏ đi và không nốt nào đổi cao độ.
 */
export function applyFeel<T extends TimedNote>(
  notes: readonly T[],
  feel: SoloFeel,
  beatsPerBar = 4,
): T[] {
  if (feel === 'straight') return [...notes]

  const starts = new Set(notes.map((note) => Number(note.startBeat.toFixed(4))))
  const moved = notes.map((note) => {
    const beat = Math.floor(note.startBeat)
    const offset = note.startBeat - beat

    if (feel === 'swing') {
      /*
        Chỉ **móc đơn** mới nảy. Đoạn chạy móc kép thì người chơi jazz đánh đều —
        nảy cả móc kép là thành lắp bắp, không phải swing.

        Nốt chính đứng ngay trước một nốt lệch thì dài ra đúng phần nốt lệch
        trượt đi: đó chính là cái nảy, dài rồi ngắn, 2 trên 1.
      */
      if (isOffBeat(offset)) return { ...note, startBeat: beat + SWING_OFFBEAT }
      if (offset > 1e-6) return note
      const hasOffBeat = notes.some(
        (other) => Math.abs(other.startBeat - (beat + 0.5)) < 1e-6,
      )
      return hasOffBeat
        ? { ...note, durationBeats: Math.max(note.durationBeats, SWING_OFFBEAT) }
        : note
    }

    /*
      Bossa, hai chuyện cùng lúc, và **không chuyện nào là swing**.

      1. **Nghiêng về phía trước.** Nốt lệch tới sớm một chút thay vì muộn.
         Đây là chỗ khác nhau rõ nhất giữa bossa và jazz: cùng móc đơn đều trên
         giấy, jazz nảy ra sau, bossa đẩy ra trước. Nghiêng ít thôi — nhiều là
         thành lệch nhịp chứ không thành chất.
      2. **Nửa sau ô nhịp tới sớm một móc đơn.** Nốt rơi đúng phách 3 dời lên
         chỗ "và của phách 2" — cú đảo phách làm nên chất Brazil. Chỉ dời khi
         chỗ tới còn trống; câu chạy dày kín móc kép thì không còn khe nào, và
         lúc ấy chỉ còn phần nghiêng ở trên.

      Cả hai đều là **quy ước soạn của KeyTrain**, không phải bài của thầy nào:
      kho có mẫu ĐỆM bossa của thầy Hải và của Peter Martin, nhưng không có bài
      nào dạy cách chia nhịp cho một câu chạy bossa.
    */
    const inBar = ((note.startBeat % beatsPerBar) + beatsPerBar) % beatsPerBar
    if (Math.abs(inBar - beatsPerBar / 2) < 1e-6) {
      const target = note.startBeat - 0.5
      if (!starts.has(Number(target.toFixed(4)))) {
        return { ...note, startBeat: target, durationBeats: note.durationBeats + 0.5 }
      }
    }
    if (!isOffBeat(offset)) return note
    return { ...note, startBeat: beat + BOSSA_OFFBEAT }
  })

  // Nốt nào bị nốt sau đuổi kịp thì cắt ngắn lại, đừng để chồng tiếng.
  return moved.map((note) => {
    let duration = note.durationBeats
    for (const other of moved) {
      const room = other.startBeat - note.startBeat
      if (room > 1e-6 && duration > room) duration = room
    }
    return duration === note.durationBeats ? note : { ...note, durationBeats: duration }
  })
}

/**
 * Mạch của điệu: **chính những chỗ mẫu đệm gõ** trong một ô nhịp.
 *
 * Ba khuôn `straight` / `swing` / `bossa` ở trên đổi chỗ rơi của nốt theo một
 * quy ước chung của cả dòng nhạc. Nó đủ cho ballad và jazz, nhưng sai chỗ với
 * ba họ điệu có tiết tấu riêng rõ rệt:
 *
 * - **Slow rock 6/8** rơi vào `straight`, tức móc đơn đều — câu chạy đi đều tăm
 *   tắp qua một mẫu đệm gõ ở phách 1, 3, 4, 6. Hai bè không gặp nhau chỗ nào.
 * - **Bolero** khai `syncopated-3-3-2` nên bị gán khuôn **bossa**, mà tiết tấu
 *   thật của nó là Pùng-Pắp ở phách 1-and, 2, 3-and, 4-and — không phải 3-3-2.
 *   Mượn nhầm idiom của một dòng nhạc khác.
 * - **Bossa** thì khuôn đúng, nhưng nó chỉ nghiêng nốt lệch, không neo câu vào
 *   chỗ tay trái đảo phách.
 *
 * Không cần dựng thêm khuôn thứ tư cho từng họ: mỗi điệu **đã tự khai chỗ gõ**
 * của nó trong `cell`. Lấy đúng chỗ ấy làm mạch thì câu chạy khớp với bất kỳ
 * điệu nào, kể cả điệu chép từ video về sau, mà không phải nhớ cập nhật bảng.
 *
 * Trả về chỗ gõ đã quy về **nốt đen** và về **một ô nhịp**, tăng dần, không lặp.
 */
export function cellPulseOf(styleId: string | undefined | null): number[] {
  const style = styleId ? getStyle(styleId) : null
  if (!style?.cell) return []
  const grid = style.gridUnit ?? 1
  const bar = style.beatsPerMeasure * grid
  const beats = [...style.cell.left, ...style.cell.right].map(
    (hit) => Number((((hit.beat * grid) % bar + bar) % bar).toFixed(3)),
  )
  return [...new Set(beats)].sort((a, b) => a - b)
}

/**
 * Điệu nào cho câu solo **neo vào mạch của mẫu đệm**.
 *
 * Ba họ người dùng chỉ đích danh: slow rock, bolero, bossa nova. Đây là ba họ
 * mà tiết tấu *là* danh tính của điệu — nghe hai phách là nhận ra — nên câu solo
 * chạy lệch mạch thì lộ ra ngay là hai người chơi hai bài.
 *
 * Không bật cho mọi điệu, vì với ballad và swing thì câu chạy đi **ngược** mạch
 * đệm mới là chỗ hay: bè giai điệu lấp vào chỗ tay trái để trống. Bật cả loạt
 * là đổi tiếng của những điệu đang chạy tốt mà không ai yêu cầu.
 */
export function soloLocksToCell(styleId: string | undefined | null): boolean {
  const family = (styleId ? getStyle(styleId)?.family : null) ?? ''
  return /slow-rock|bolero|bossa/i.test(family)
}

/**
 * Mạch mà điệu này **thật sự** dùng: rỗng nếu điệu không thuộc diện neo.
 *
 * Gộp `soloLocksToCell` với `cellPulseOf` làm một cửa duy nhất, để bên gọi
 * không phải tự ghép hai điều kiện. Ghép ở hai nơi thì có ngày hai nơi lệch
 * nhau — và lúc ấy app neo một đằng, lưới test đo một nẻo.
 */
export function pulseForStyle(styleId: string | undefined | null): number[] {
  return soloLocksToCell(styleId) ? cellPulseOf(styleId) : []
}

/** Nốt lệch mạch trong khoảng này thì bị kéo về mạch; xa hơn thì để yên. */
const SNAP_WINDOW = 0.34

/**
 * Kéo nốt về mạch của điệu.
 *
 * Chỉ kéo nốt **gần** một chỗ gõ — trong vòng một phần ba nốt đen. Nốt nằm giữa
 * hai chỗ gõ là nốt nối, và nốt nối mới là thứ làm câu nhạc chạy; kéo hết mọi
 * nốt về mạch thì câu solo hoá thành một bản sao của mẫu đệm, gõ cùng lúc cùng
 * chỗ, và tai nghe ra một bè dày chứ không ra hai bè.
 *
 * Không dồn hai nốt vào một chỗ: chỗ đã có nốt rồi thì nốt sau đứng nguyên.
 */
export function snapToPulse<T extends TimedNote>(
  notes: readonly T[],
  pulse: readonly number[],
  beatsPerBar: number,
): T[] {
  if (pulse.length === 0 || beatsPerBar <= 0) return [...notes]

  const taken = new Set<string>()
  const key = (beat: number) => beat.toFixed(3)
  const out: T[] = []

  for (const note of notes) {
    const bar = Math.floor(note.startBeat / beatsPerBar) * beatsPerBar
    const inBar = note.startBeat - bar

    let best: number | null = null
    for (const beat of [...pulse, beatsPerBar]) {
      const distance = Math.abs(beat - inBar)
      if (distance > SNAP_WINDOW) continue
      if (best === null || distance < Math.abs(best - inBar)) best = beat
    }

    if (best === null) {
      taken.add(key(note.startBeat))
      out.push(note)
      continue
    }

    const moved = bar + best
    if (taken.has(key(moved))) {
      taken.add(key(note.startBeat))
      out.push(note)
      continue
    }

    taken.add(key(moved))
    out.push({
      ...note,
      startBeat: moved,
      // Giữ nguyên chỗ kết thúc, để nốt không thò qua nốt sau.
      durationBeats: Math.max(0.05, note.startBeat + note.durationBeats - moved),
    })
  }

  return out.sort((a, b) => a.startBeat - b.startBeat)
}

/**
 * Đoạn không lời dài bao nhiêu thì câu solo dày bấy nhiêu.
 *
 * Đo trên bảy bản ký âm của Cà Pháo (`tools/sheet/profile.py` bên PianoBrain,
 * item `ca-phao-cau-solo-tren-vong-hop-am`). Sáu đoạn giang tấu, tách hoàn hảo
 * theo ĐỘ DÀI — và thể loại không giải thích được gì, cả bossa lẫn ballad đều
 * nằm ở cả hai bên:
 *
 * | ô nhịp | so với đoạn hát |
 * |---|---|
 * | 9, 10, 10 | thưa hơn 3-6% |
 * | 11 | dày hơn 6% |
 * | 18 | dày hơn 65% |
 * | 20 | dày hơn 31% |
 *
 * Từ 18 ô trở lên anh ấy viết một bản độc tấu; từ 11 ô trở xuống anh ấy coi đó
 * là cầu nối và đi qua bằng chính kết cấu đoạn hát. Ranh giới nằm đâu đó giữa
 * 11 và 18 ô — chưa có điểm dữ liệu nào ở giữa, nên `LONG_INTERLUDE_BARS` là
 * một con số CHỌN trong khoảng ấy, không phải một con số đo được.
 *
 * ## Vì sao không phải công tắc bật / tắt
 *
 * Bản đầu của luật này định làm: đoạn ngắn thì **không sinh câu solo**, giữ mẫu
 * đệm chạy tiếp. Sai, vì hai bên không so được trực tiếp.
 *
 * Ở bản ký âm của Cà Pháo, tay phải LUÔN chơi giai điệu — đoạn hát cũng là tay
 * phải hát. "Giữ nguyên kết cấu" ở đó nghĩa là vẫn có giai điệu, chỉ không bận
 * rộn thêm. Ở KeyTrain thì tay phải đang quạt hợp âm, vì người hát mới là giai
 * điệu; "giữ nguyên kết cấu" thành ra **không có giai điệu nào cả**, và đoạn
 * giang tấu hoá thành một khoảng trống. Không phải thứ số liệu nói.
 *
 * Nên chỗ dịch đúng là **mật độ**: đoạn ngắn được một câu thưa, đoạn dài được
 * một câu dày. Tỉ lệ nốt giữa `sparse` và `medium` là 0,8 so với 1,4 mỗi phách
 * — chênh 75%, nằm đúng khoảng chênh lệch đo được ở người thật (31-65%).
 */
export const LONG_INTERLUDE_BARS = 14

/** Câu solo đoạn giang tấu nên dày cỡ nào, theo độ dài đoạn tính bằng ô nhịp. */
export function interludeDensity(bars: number): 'sparse' | 'medium' {
  return bars >= LONG_INTERLUDE_BARS ? 'medium' : 'sparse'
}
