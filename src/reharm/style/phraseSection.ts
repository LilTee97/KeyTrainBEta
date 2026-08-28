import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { holdUntilStruckAgain } from './patternRenderer'
import { avoidMelodyClash, interlockHands, soloLeftHand } from './soloLeftHand'
import { cueChord, phraseChords } from './phraseChords'
import { cueStrike, slowClose } from './phraseCue'

/**
 * Ráp một đoạn dạo đầu hoặc một đoạn kết.
 *
 * Trước đây phần ráp này nằm trong thân một component React, nên không có cách
 * nào gọi nó từ test — và chính chỗ ấy sinh ra lỗi đè nốt ở đoạn kết mà không
 * lưới nào bắt được: bộ test cũ chỉ kiểm **phần đệm**, còn thứ tai nghe là phần
 * đệm cộng câu ngẫu hứng cộng hợp âm báo, sau khi đã ráp. Tách ra đây để lưới
 * bắt được đúng thứ người ta nghe.
 */
export interface PhraseSectionOptions {
  kind: 'intro' | 'outro'
  key: { tonic: PitchClass; scale: ScaleType } | null
  style: StylePattern
  beatsPerChord: number
  dropRoot: boolean
  /** Hợp âm mở bài — hợp âm báo cuối dạo đầu hút về chính nó. */
  opening: ParsedChord | null
  /** Câu ngẫu hứng cho một vòng hợp âm; cùng bộ sinh nốt với đoạn giang tấu. */
  solo: (chords: readonly ParsedChord[]) => readonly TimelineEvent[]
  /** Rải ngón hợp âm báo thay vì dặm một lượt — dành cho họ ballad. */
  rollCue?: boolean
  /**
   * Vòng hợp âm thật của bài — đoạn dạo mượn hợp âm từ đây thay vì dựng theo bậc.
   *
   * Xem `phraseChords.ts`. Bỏ trống thì vẫn dựng theo bậc như cũ, đúng cho
   * luồng gõ vòng hợp âm trơn: ở đó không có bài nào để mượn.
   */
  songChords?: readonly ParsedChord[]
  /** Rút hợp âm đoạn dạo về chất cơ bản, như đoạn giang tấu vẫn làm. */
  plainChords?: boolean
}

export interface PhraseSection {
  events: TimelineEvent[]
  lengthBeats: number
}

export function buildPhraseSection(
  options: PhraseSectionOptions,
): PhraseSection | null {
  const {
    kind,
    key,
    style,
    beatsPerChord,
    dropRoot,
    opening,
    solo,
    rollCue,
    songChords,
    plainChords,
  } = options

  const chords = phraseChords(kind, key, {
    ...(songChords ? { songChords } : {}),
    ...(plainChords ? { plain: true } : {}),
  })
  if (chords.length === 0) return null

  const beatsEach = chords.map(() => beatsPerChord)

  /*
    Đoạn kết: tay phải **chỉ ngẫu hứng**, không quạt đệm nữa.

    Trước đây đoạn kết phát đồng thời phần đệm tay phải và câu ngẫu hứng cũng của
    tay phải. Trên piano roll thấy rõ: Đô quãng 4 bị gõ bốn lần trong khi nó còn
    đang ngân, Mi và Sol cũng vậy — ba cụm chồng nhau, mà cùng lúc câu chạy vẫn
    đi qua. Không bàn tay nào làm được việc đó, và tai nghe ra là tiếng đục.

    Tay trái **giữ nguyên**. Đoạn kết là thứ cuối cùng người ta nghe; tay trái
    mỏng đi cùng lúc tay phải rút về một dòng đơn thì cả kết cấu sụp một lượt, và
    nó không nghe ra là "bài hết" mà nghe ra là "máy dừng". Tay trái mới là thứ
    dắt bass về chủ âm, và `slowClose` đã cho cả hai tay chậm lại — bấy nhiêu là
    đủ tín hiệu kết bài. Tay phải thưa đi chính là lúc bass ngân legato của thầy
    Hải lộ ra.

    Dạo đầu thì vẫn quạt cả hai tay: ở đó câu ngẫu hứng đi cùng phần đệm để dựng
    khí thế, chứ không phải để tiễn bài đi.
  */
  /*
    Tay phải giai điệu, tay trái mẫu đệm — nhưng CÀI VÀO NHAU, không cùng nói.

    Trước đây đoạn dạo quạt cả hai tay rồi chồng câu ngẫu hứng lên trên — ba
    tầng cùng lúc, mà tầng quạt tay phải giẫm đúng chỗ câu solo đang chạy. Sửa
    lượt một: bỏ tầng quạt, tay trái gánh trọn mẫu đệm. Người dùng nghe rồi bác
    tiếp — để tay trái đảm nhiệm toàn bộ pattern điệu đệm trong lúc solo là
    không đúng.

    Nay tay trái vẫn dựng từ mẫu đệm của chính điệu đang chọn, nhưng bao nhiêu
    phần trong đó thực sự kêu lên thì tuỳ tay phải đang bận tới đâu — xem
    `interlockHands`. Luật "đoạn không lời chơi đúng điệu" còn nguyên.
  */
  const backing = soloLeftHand({ chords, beatsEach, style })

  const voiced = solo(chords)
  const roundBeats = chords.length * beatsPerChord

  /*
    Vòng dạo đầu chạy **trọn** rồi mới tới một phách hợp âm báo. Một phách thôi:
    kéo dài cả ô thì nó thành một hợp âm của vòng, và vòng bốn ô vốn đã trọn vẹn
    lại bị đèo thêm một đuôi.
  */
  const cueOf = kind === 'intro' ? cueChord(opening) : null
  const lengthBeats = roundBeats + (cueOf || kind === 'outro' ? 1 : 0)

  /*
    Hợp âm báo nâng lên tầm tay phải.

    `voiceLeadTwoHands` cho một hợp âm đứng lẻ thì đặt nó khá thấp — đo ra Rê
    quãng tám 3 tới La quãng tám 3, tức chồng lên đúng chỗ tay trái đang giữ
    bass. Đây là tiếng báo cho ca sĩ, nó phải nổi lên trên chứ không lẫn vào bè
    trầm.
  */
  const cueVoicing = voiceLeadTwoHands([cueOf ?? opening ?? chords[0]], {
    dropRootFromRightHand: dropRoot,
  })[0].right.map((note) => {
    let pitch: number = note
    while (pitch < 60) pitch += 12
    while (pitch > 84) pitch -= 12
    return pitch as typeof note
  })

  const lastChord = chords[chords.length - 1]!
  const rollVoicing = voiceLeadTwoHands([lastChord], {
    dropRootFromRightHand: dropRoot,
  })[0]!.right.map((note) => {
    let pitch: number = note
    while (pitch < 60) pitch += 12
    while (pitch > 84) pitch -= 12
    return pitch as typeof note
  })

  /*
    Intro và outro cùng một kiểu kết: một phách sau vòng, nốt hợp âm rơi lần
    lượt từ dưới lên (roll), nốt trên cùng đúng vạch.
  */
  const cue =
    kind === 'intro' && cueOf
      ? cueStrike(cueVoicing, roundBeats, { roll: rollCue === true })
      : kind === 'outro'
        ? cueStrike(rollVoicing, roundBeats, { roll: true, beats: 1 })
        : []

  /*
    Tay trái nhường phím khi trùng với giai điệu — xem `avoidMelodyClash`.
    Chồng TẦM thì được, chồng PHÍM cùng lúc thì không.
  */
  const woven = interlockHands(backing, voiced, style.beatsPerMeasure * (style.gridUnit ?? 1))
  const whole = [...avoidMelodyClash(woven.left, woven.melody), ...woven.melody]
  const ghep =
    kind === 'outro' ? [...slowClose(whole, roundBeats), ...cue] : [...whole, ...cue]

  /*
    Cắt đuôi nốt đang ngân **sau khi đã ráp**, không chỉ trong từng tầng.

    `renderPattern` đã cắt trong phạm vi mẫu đệm của nó, và `slowClose` cắt phần
    nó giãn ra. Nhưng chỗ chồng thật nằm **giữa hai tầng**: đệm tay phải giữ nốt
    Mi quãng 4 từ phách 0, rồi câu ngẫu hứng gõ lại đúng Mi ấy ở phách 0,25.
    Không tầng nào thấy tầng kia, nên không tầng nào cắt được.

    Chỉ cắt khi **cùng một tay** và **trùng cao độ**: hai tay chồng nhau là hoà
    âm, hai cao độ khác nhau chồng nhau là legato — cả hai đều đúng.
  */
  const events = holdUntilStruckAgain(ghep)

  return { events, lengthBeats }
}
