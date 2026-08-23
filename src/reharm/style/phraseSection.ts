import type { ScaleType } from '../../shared/musicTheory/scales'
import type { PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { holdUntilStruckAgain, renderPattern } from './patternRenderer'
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
}

export interface PhraseSection {
  events: TimelineEvent[]
  lengthBeats: number
}

export function buildPhraseSection(
  options: PhraseSectionOptions,
): PhraseSection | null {
  const { kind, key, style, beatsPerChord, dropRoot, opening, solo, rollCue } =
    options

  const chords = phraseChords(kind, key)
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
  const backing = renderPattern(
    voiceLeadTwoHands(chords, { dropRootFromRightHand: dropRoot }),
    style,
    { beatsPerChord, beatsEach },
  ).filter((event) => kind !== 'outro' || event.hand !== 'right')

  const voiced = solo(chords)
  const roundBeats = chords.length * beatsPerChord

  /*
    Vòng dạo đầu chạy **trọn** rồi mới tới một phách hợp âm báo. Một phách thôi:
    kéo dài cả ô thì nó thành một hợp âm của vòng, và vòng bốn ô vốn đã trọn vẹn
    lại bị đèo thêm một đuôi.
  */
  const cueOf = kind === 'intro' ? cueChord(opening) : null
  const lengthBeats = roundBeats + (cueOf ? 1 : 0)

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

  const cue = cueOf
    ? cueStrike(cueVoicing, roundBeats, { roll: rollCue === true })
    : []

  /*
    Kết thì **cả hai tay cùng chậm lại**, không riêng giai điệu. Giãn mỗi nốt của
    câu mà phần đệm vẫn quạt đủ lực thì nghe như người hát ngân còn ban nhạc chưa
    biết bài sắp hết.
  */
  const whole = [...backing, ...voiced]
  const ghep =
    kind === 'outro' ? slowClose(whole, lengthBeats) : [...whole, ...cue]

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
