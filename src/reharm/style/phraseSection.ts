import type { ScaleType } from '../../shared/musicTheory/scales'
import type { MidiNote, PitchClass } from '../../shared/musicTheory/types'
import type { ParsedChord } from '../types'
import type { StylePattern, TimelineEvent } from './types'
import { voiceLeadTwoHands } from '../voicingGenerator/handSplitVoicing'
import { holdUntilStruckAgain } from './patternRenderer'
import { khongTiaTayTrai, thienVeCuaHo } from './hoDieu'
import { soloTeacherOf } from '../fillSoloGenerator/soloTeacher'
import { caPhaoSolo } from './caPhaoSolo'
import { raiLinhNhi } from './raiLinhNhi'
import { avoidMelodyClash, interlockHands, soloLeftHand } from './soloLeftHand'
import { cueChord, phraseChords } from './phraseChords'
import { cueStrike, slowClose, tamBao } from './phraseCue'
import { chiecLaMotif } from './chiecLaMotif'

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
  /**
   * Gam để dựng câu, nếu điệu này dùng lối bám tay trái.
   *
   * Bỏ trống thì `solo` chạy như cũ — mọi điệu không thuộc họ có khai lối ấy
   * đều đi đường cũ, không đổi gì.
   */
  scale?: readonly PitchClass[]
  /**
   * Số lượt, để mỗi lần chơi ra một câu khác — Y NHƯ GIANG TẤU.
   *
   * Thiếu nó thì lối bám tay trái nhận `take` mặc định 0, và dạo đầu với kết
   * bài phát lại đúng một câu mỗi lần trong khi giang tấu thì đổi. Đường
   * `solo` cũ đã tự xoay theo lượt từ trước, nên chỉ nhánh này bị kẹt.
   */
  take?: number
  /**
   * Tầm nốt tay phải. Bỏ trống thì dùng tầm rộng cũ của hai đoạn này.
   *
   * Có mặt ở đây để dạo đầu và kết bài nhận ĐÚNG tầm mà giang tấu đang dùng:
   * bản trước đóng cứng đáy 57 trong khi giang tấu đi từ 62, nên cùng một bài
   * cùng một điệu mà hai đoạn với xuống thấp hơn hẳn.
   */
  range?: { low: MidiNote; high: MidiNote }
  /**
   * Vòng hợp âm thật của bài — đoạn dạo mượn hợp âm từ đây thay vì dựng theo bậc.
   *
   * Xem `phraseChords.ts`. Bỏ trống thì vẫn dựng theo bậc như cũ, đúng cho
   * luồng gõ vòng hợp âm trơn: ở đó không có bài nào để mượn.
   */
  songChords?: readonly ParsedChord[]
  /** Rút hợp âm đoạn dạo về chất cơ bản, như đoạn giang tấu vẫn làm. */
  plainChords?: boolean
  /** Thầy cho vòng dạo/kết — không đổi điệu đệm. */
  thay?: import('../fillSoloGenerator/soloTeacher').SoloTeacher
  vongPhienKhuc?: readonly ParsedChord[]
  songIntro?: readonly ParsedChord[]
  /** Ostinato Bb–A–D Chiếc Lá — chỉ dạo. */
  motif?: 'chiec-la'
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
    take,
    songChords,
    plainChords,
    thay,
    vongPhienKhuc,
    songIntro,
  } = options

  const chords = phraseChords(kind, key, {
    ...(songChords ? { songChords } : {}),
    ...(plainChords ? { plain: true } : {}),
    ...(thay ? { thay } : {}),
    ...(vongPhienKhuc ? { vongPhienKhuc } : {}),
    ...(songIntro ? { songIntro } : {}),
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
  const thaySolo = thay ?? soloTeacherOf(style.id)
  const backing = soloLeftHand({
    chords,
    beatsEach,
    style,
    chiPhach1: thaySolo === 'ton-hung',
  })

  /*
    DẠO ĐẦU VÀ KẾT BÀI cũng dựng như giang tấu, theo yêu cầu người dùng.

    Trước đây chỉ giang tấu dùng lối bám tay trái; dạo đầu và kết bài vẫn sinh
    câu độc lập rồi mới cài vào. Hai đoạn ấy nghe khác hẳn giang tấu dù cùng
    một bài, cùng một điệu.

    Đường cũ vẫn còn nguyên cho mọi điệu không khai lối này — `raiTheoTayTrai`
    trả `false` thì `solo` chạy y như trước.
  */
  const voiced =
    kind === 'intro' && options.motif === 'chiec-la' && key
    ? chiecLaMotif({
        chords,
        beatsPerChord,
        tonic: key.tonic,
        scale: key.scale,
      })
    : thaySolo === 'ca-phao'
    ? caPhaoSolo({
        chords,
        beatsPerChord,
        barBeats: style.beatsPerMeasure * (style.gridUnit ?? 1),
        range: options.range ?? { low: 57, high: 95 },
        take: take ?? 0,
        ...(thienVeCuaHo(style.id) ? { thienVe: thienVeCuaHo(style.id)! } : {}),
        left: backing,
      })
    : thaySolo === 'linh-nhi'
    ? raiLinhNhi({
        left: backing,
        chords,
        beatsPerChord,
        barBeats: style.beatsPerMeasure * (style.gridUnit ?? 1),
        ...(options.scale ? { scale: options.scale } : {}),
        range: options.range ?? { low: 57, high: 95 },
        chayNgonCuoi: kind !== 'intro',
        ...(take !== undefined ? { take } : {}),
      })
    : solo(chords)
  const roundBeats = chords.length * beatsPerChord

  /*
    HỢP ÂM BÁO NẰM TRONG VÒNG, KHÔNG ĐÈO THÊM MỘT PHÁCH.

    Bản trước cộng một phách vào sau vòng dạo đầu để dặm hợp âm báo. Người dùng
    nghe ra ngay: "ở intro có một nhịp dặm hợp âm trước khi kết đoạn nghe có vẻ
    bị dư". Đúng — vòng bốn ô vốn đã trọn vẹn, cộng thêm một phách thì đoạn dạo
    dài bốn ô lẻ một phách, và cái lẻ ấy nghe ra là một cú gõ thừa chứ không
    phải một tiếng báo.

    Nay hợp âm báo rơi vào phách CUỐI của chính vòng ấy. Vẫn báo được giờ vì nó
    vẫn là tiếng cuối cùng trước khi người hát vào, mà đoạn dạo giữ đúng số ô.

    Đoạn kết giữ nguyên một phách cộng thêm: ở đó cái đuôi ấy chính là chỗ bài
    đậu xuống, không phải thứ chen vào giữa hai đoạn.
  */
  const cueOf = kind === 'intro' ? cueChord(opening) : null
  const lengthBeats = roundBeats + (kind === 'outro' ? 1 : 0)

  const cueVoicing = tamBao(
    voiceLeadTwoHands([cueOf ?? opening ?? chords[0]], {
      dropRootFromRightHand: dropRoot,
    })[0].right,
  )

  const lastChord = chords[chords.length - 1]!
  const rollVoicing = tamBao(
    voiceLeadTwoHands([lastChord], { dropRootFromRightHand: dropRoot })[0]!.right,
  )

  /*
    Intro và outro cùng một kiểu kết: một phách sau vòng, nốt hợp âm rơi lần
    lượt từ dưới lên (roll), nốt trên cùng đúng vạch.
  */
  /*
    HỢP ÂM BÁO CUỐI DẠO ĐẦU RẢI, KHÔNG DẶM — MỌI ĐIỆU.

    Trước đây chỉ ballad mới rải, điệu khác dặm cả hợp âm một lượt. Đo trên
    `pop-1`: một khối ba nốt rơi đúng phách áp chót rồi đoạn còn chạy tiếp một
    phách, nên nó nghe ra một cú gõ chen vào giữa chứ không phải một tiếng báo
    hết đoạn. Người dùng bảo "chỉ dặm hợp âm khi báo hết đoạn và dặm kiểu
    outro", tức lấy đúng lối rải của đoạn kết cho mọi điệu.

    `rollCue` mất chỗ dùng cuối cùng ở đây nên xoá hẳn: đoạn kết vốn đã luôn
    rải, giờ đoạn dạo cũng vậy.
  */
  const cue =
    kind === 'intro' && cueOf
      ? cueStrike(cueVoicing, roundBeats - 1, { roll: true })
      : kind === 'outro'
        ? cueStrike(rollVoicing, roundBeats, { roll: true, beats: 1 })
        : []

  /*
    Tay trái nhường phím khi trùng với giai điệu — xem `avoidMelodyClash`.
    Chồng TẦM thì được, chồng PHÍM cùng lúc thì không.
  */
  /*
    ĐƯỜNG NÀO DỰNG TỪ TAY TRÁI THÌ ĐỪNG ĐỂ `interlockHands` NẮN LẠI TAY TRÁI.

    `interlockHands` dựng theo Cà Pháo: tay phải cài vào KHE tay trái, nên nó
    vừa tỉa bớt cú gõ khi tay phải dày, vừa CHÈN thêm nốt rải khi tay phải
    nghỉ. Lối bám tay trái làm ngược — tay phải suy ra TỪ mốc gõ tay trái — nên
    chồng hai phép lên nhau là nắn lại chính cái vừa dùng làm gốc.

    `arrangement.ts` đã bỏ qua `interlockHands` cho họ bật cờ này ở đoạn giang
    tấu, nhưng đoạn dạo đầu và kết bài đi qua đây thì chưa. Bolero không lộ vì
    đường của nó DÀY (8,8 nốt mỗi ô) nên không để lại khe nào cho luật 2 chèn
    vào; bossa thưa hơn (7,0 nốt trên một tay trái 4 mốc mỗi ô) nên lộ ngay —
    tay trái bossa `[0, 1,5, 2, 3,5]` bị chèn thành `[0, 1,5, 2, 2,167, 2,667,
    3,333, 3,5]`, tức thôi chơi bossa. Đó đúng là ca người dùng cấm: đoạn không
    lời phải chơi đúng điệu đã chọn.

    Cờ `khongTiaTayTrai` KHÔNG cứu được, và tôi thử rồi: nó chỉ tắt luật 1
    (tỉa), còn luật 2 (chèn nốt lấp khe) chạy bất kể cờ. Nên phải bỏ hẳn phép
    cài, đúng như `arrangement.ts` làm, chứ không phải chỉnh cờ.
  */
  const woven = thaySolo === 'linh-nhi' || thaySolo === 'ca-phao' || thaySolo === 'ton-hung'
    ? { left: backing, melody: voiced }
    : interlockHands(
        backing,
        voiced,
        style.beatsPerMeasure * (style.gridUnit ?? 1),
        khongTiaTayTrai(style.id),
      )
  /*
    Ô CHÓT ĐOẠN DẠO PHẢI SẠCH CHÙM NỐT, để tiếng báo đứng một mình.

    Người dùng: "intro vẫn bị dặm hợp âm trước báo, hãy sửa để chỉ báo mới dặm
    hợp âm." Lối solo tự do Cà Pháo có chùm ba nốt, và đo trên bản ký âm thì
    chùm ấy CÓ mặt trong đoạn dạo thật — Bèo dạt 0,6 chùm mỗi ô, Yêu xa 0,6, Mơ
    0,7, ngang với giang tấu của chính chúng. Nên không cấm chùm cả đoạn.

    Chỉ dọn Ô CHÓT: đó là chỗ tiếng báo đứng, và một khối hợp âm ngay cạnh nó
    là đúng thứ người dùng nghe ra thành "hai lần thông báo".
  */
  const melody =
    kind === 'intro'
      ? woven.melody.filter(
          (e) => e.notes.length < 2 || e.startBeat < roundBeats - beatsPerChord + 1e-6,
        )
      : /*
          ĐOẠN KẾT: rút chùm nốt còn MỘT nốt, giữ nguyên câu chạy.

          Luật cũ ở đây có gốc từ một lỗi thật người dùng nghe ra: tay phải vừa
          quạt hợp âm vừa chạy giai điệu, "không ai chơi vậy được, và nghe cũng
          đục". Lối solo tự do có chùm ba nốt, và bản ký âm CÓ chùm ấy trong
          đoạn kết thật (Bèo dạt 0,6 chùm mỗi ô, Kém duyên 0,7) — nhưng ở đây
          nó rơi đúng vào chỗ luật cũ cấm.

          Giữ luật cũ vì nó đến từ tai người dùng, và giữ đường nét bằng cách
          rút chùm còn nốt trên cùng thay vì xoá cả cú gõ. Câu chạy — thứ làm
          nên lối tự do — không đụng tới.
        */
        woven.melody
          /*
            PHÁCH CHÓT ĐOẠN KẾT ĐỂ TRỐNG cho cú rải hợp âm chủ.

            Đo bản sinh ra: thang ngũ cung chạy tới phách 11,875 trong khi cú
            rải kết đáp ở 11,84 tới 12 — hai cử chỉ đâm vào nhau, và mốc gõ
            trùng nhau đúng chỗ tai chờ nghe bài đóng lại. Cùng lý do với ô chót
            đoạn dạo: cử chỉ báo hiệu phải đứng một mình.
          */
          .filter((e) => e.startBeat < roundBeats - 1 - 1e-6)
          .map((e) =>
            e.notes.length > 1
              ? { ...e, notes: [Math.max(...e.notes) as (typeof e.notes)[number]] }
              : e,
          )
  const whole = [...avoidMelodyClash(woven.left, melody), ...melody]
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
