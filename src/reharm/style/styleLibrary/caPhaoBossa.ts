import type { StylePattern, TimelineEvent } from '../types'

/**
 * Bản rút gọn ĐỆM HÁT từ Người hãy quên em đi, ô XML 9–10.
 * Xem Reference/CA-PHAO-BOSSA-AUDIT.md: không lấy histogram làm một ô,
 * không coi tie-stop là đánh lại, không biến mọi chùm giai điệu thành quạt.
 * RH bỏ lớp giai điệu cao; voicing/dynamics là lựa chọn biên soạn của KT.
 */
export const CA_PHAO_BOSSA: StylePattern = {
  id: 'ca-phao-bossa-sheet-9-10',
  name: 'Bossa Nova Cà Pháo — Người hãy quên em đi (mới)',
  family: 'ca-phao-bossa-sheet',
  familyName: 'Bossa Nova Cà Pháo (mới)',
  variant: 1,
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  bpm: 110,
  // Nhãn syncopated chung của KT; không khẳng định đây là clave 3+3+2.
  feel: 'syncopated-3-3-2',
  verified: true, // Có nguồn ký âm; KHÔNG đồng nghĩa người dùng đã duyệt tai.
  sourceVideos: ['nguoihayquenemdi.mxl — Cà Pháo, ô XML 9–10; đối chiếu ô 17–18'],
  releaseRatio: 1,
  leftHandTop: 67,
  cell: {
    lengthBeats: 8,
    left: [
      // Ô 9: D2 – G#2 – A2. Nốt tiếp cận nằm nửa cung DƯỚI bậc 5.
      { beat: 0, durationBeats: 1.5, velocityScale: .9, tones: [{ toneIndex: 0, fromRoot: true }] },
      { beat: 1.5, durationBeats: .5, velocityScale: .55, tones: [{ toneIndex: 2, fromRoot: true, semitones: -1 }] },
      { beat: 2, durationBeats: 2, velocityScale: .75, tones: [{ toneIndex: 2, fromRoot: true }] },
      // Ô 10: G2; D3 G3 Bb3 ở 2& nối qua phách 3; D4 ở phách 4.
      { beat: 4, durationBeats: 1.5, velocityScale: .9, tones: [{ toneIndex: 0, fromRoot: true }] },
      { beat: 5.5, durationBeats: 1.5, velocityScale: .6, tones: [
        { toneIndex: 2, fromRoot: true },
        { toneIndex: 0, fromRoot: true, semitones: 12 },
        { toneIndex: 1, fromRoot: true, semitones: 12 },
      ] },
      { beat: 7, durationBeats: 1, velocityScale: .5, tones: [{ toneIndex: 2, fromRoot: true, semitones: 12 }] },
    ],
    right: [
      // Ô 9: chùm lặp cùng cao độ ở 2, 3&, 4&. KHÔNG đánh ở 1 hay 3.
      { beat: 1, durationBeats: .5, velocityScale: .65, tones: [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }] },
      { beat: 2.5, durationBeats: 1, velocityScale: .72, tones: [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }] },
      { beat: 3.5, durationBeats: .5, velocityScale: .55, tones: [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }] },
      // Ô 10: giữ bè trong ở 1, 2&, 3&. Bỏ cụm giai điệu cao ở 2 và 4&.
      // 2& nối qua 3: một tiếng dài 1 phách, không thêm tiếng ở beat 6.
      { beat: 4, durationBeats: 1, velocityScale: .65, tones: [{ toneIndex: 0 }, { toneIndex: 1 }] },
      { beat: 5.5, durationBeats: 1, velocityScale: .62, tones: [{ toneIndex: 0 }, { toneIndex: 1 }] },
      { beat: 6.5, durationBeats: 1, velocityScale: .7, tones: [{ toneIndex: 0 }, { toneIndex: 1 }] },
    ],
  },
  note: 'Mới · rút gọn đệm ô 9–10 Người hãy quên em đi. Hai ô khác nhau; giữ nối ở 2&, bass tiếp cận bậc 5; không kéo mọi hợp âm đến sớm. Cần nghe duyệt.',
}

/** Biến thể theo phản hồi người dùng, KHÔNG phải bản chép ô 10 của Cà Pháo.
 * Khung chính thức được người dùng nghe duyệt 13/9/2026 (Reference/CA-PHAO.md).
 * Solo/fill tuyệt đối không được thay cấu trúc này trong phần đệm hát.
 * Ô A giữ onset nguồn, thêm quãng tám/bass đỡ/lực theo phản hồi; ô B nối liền:
 * bùm 7(4) 0.5 → chát 8(4.5) 1 → bùm 9(5.5) 0.5
 * → chát 10(6) 1 → chát 11(7) 0.5 → bass dẫn(7.5) 0.5.
 * Cặp 9–10 lặp cách đánh 7–8; không nghỉ sau tiếng 8.
 * Bass dẫn là nốt trên bass kế tiếp nửa cung,
 * giải xuống Bùm đầu câu sau; không đánh cả hợp âm mới sớm.
 * Không tăng BPM hoặc đổi độ dài ô. Hết bài thì không chèn bass dẫn vô đích.
 */
export const CA_PHAO_BOSSA_IMPROVED: StylePattern = {
  ...CA_PHAO_BOSSA,
  id: 'ca-phao-bossa-improved',
  name: 'Bossa CP cải tiến',
  family: 'ca-phao-bossa-improved',
  familyName: 'Bossa CP cải tiến',
  sourceVideos: ['Biến thể KT theo phản hồi người dùng; nền Người hãy quên em đi, ô XML 9–10'],
  cell: {
    lengthBeats: 8,
    // Ô A giữ nhịp nguồn; BÙM 3 phải rõ hơn bum 4, không chìm sau chát 2.
    left: [
      ...CA_PHAO_BOSSA.cell!.left.filter(hit => hit.beat < 4)
        .map(hit => hit.beat === 0
          ? { ...hit, tones: [{ toneIndex: 0, fromRoot: true }, { toneIndex: 0, fromRoot: true, semitones: 12 }] }
          : hit.beat === 1.5 ? { ...hit, velocityScale: .85 } : hit),
      // Đỡ chát 2 bằng bậc 5: dày hơn mà không gõ lại quãng tám đang ngân của Bùm 1.
      { beat: 1, durationBeats: .5, velocityScale: .55, tones: [{ toneIndex: 2, fromRoot: true }] },
      // Chát 5 nhắc nhẹ bass bum 4: gõ lại cùng bậc 5 ở 3&, ngân tới hết ô.
      // holdUntilStruckAgain nhả bum 4 tại đây, không chồng hai lần cùng phím.
      { beat: 2.5, durationBeats: 1.5, velocityScale: .5, tones: [{ toneIndex: 2, fromRoot: true }] },
      // Bùm 7/9 và chát 8/10 lấy thế bấm ô B nguồn, đặt lại theo khung người dùng.
      ...[4, 5.5].map(beat => ({ ...CA_PHAO_BOSSA.cell!.left[3], beat, durationBeats: .5, velocityScale: .65 })),
      ...[4.5, 6].map(beat => ({ ...CA_PHAO_BOSSA.cell!.left[4], beat, durationBeats: 1, velocityScale: .45 })),
      { beat: 7.5, durationBeats: .5, velocityScale: .45, som: true,
        requireNextChord: true, tones: [{ toneIndex: 0, fromRoot: true, semitones: 1 }] },
    ],
    right: [
      ...CA_PHAO_BOSSA.cell!.right.filter(hit => hit.beat < 4)
        .map(hit => hit.beat === 1 ? { ...hit, velocityScale: .85 } : hit),
      ...[4.5, 6].map(beat => ({ ...CA_PHAO_BOSSA.cell!.right[3], beat, durationBeats: 1, velocityScale: .6 })),
      { ...CA_PHAO_BOSSA.cell!.right[3], beat: 7, durationBeats: .5, velocityScale: .9 },
    ],
  },
  note: 'Khung chính thức đã duyệt 13/9/2026 · Chọn thầy Cà Pháo và giọng thứ để mở dạo/giang/kết soạn mới; CP Lick là tùy chọn riêng. 11 tiếng: Bùm chát Bùm-bum chát chát | bùm chát bùm chát CHÁT. Chát 8 (1) → bùm 9 (½) → chát 10 (1) → chát 11 (½) → bass dẫn nhẹ (½). Không nghỉ giữa 8–9; giữ câu 8 phách, 110 BPM.',
}

/** Mọi id được coi là "Bossa CP cải tiến". Nút thử "Bossa test 1" (12/9/2026) đã bỏ theo yêu cầu 13/9/2026;
 * muốn thêm nút thử khác thì thêm id vào đây là đủ. */
export const BOSSA_CP_IDS: ReadonlySet<string> = new Set([CA_PHAO_BOSSA_IMPROVED.id])

/**
 * Điệu này có đi đường Bossa CP cải tiến không (intro/giang/outro thứ của Cà Pháo, fill
 * theo khe, mở lại ô A đầu đoạn). Một chỗ hỏi cho mọi nơi — trước đây so cứng
 * `style.id === 'ca-phao-bossa-improved'` ở mười chỗ, thêm nút thử là phải sửa mười chỗ.
 */
export function laBossaCP(style: { id?: string } | string | null | undefined): boolean {
  const id = typeof style === 'string' ? style : style?.id
  return id !== undefined && BOSSA_CP_IDS.has(id)
}

/**
 * Ô tick nghe thử "giật kiểu Cà Pháo" (3/10/2026): CHÁT 11 — cú hợp âm tay phải ở phách 4 ô B — giật, vang một nửa trường độ.
 *
 * "Đánh giật" của người dùng = giật ngón: bấm rồi nhấc ngón ngay (3/10/2026, sau khi nghe ví dụ). Số đo — bản chép tay *Người
 * hãy quên em đi*, phần hát, cú hợp âm tay phải (`PianoBrain/tools/sheet/giat_lay.py`): anh giật 40/218 cú (18%), nhiều nhất ở
 * phách 4 (9/17); KHÔNG BAO GIỜ ở phách 1 (0/15), 2& (0/32), 4& (0/47). Ô đệm có 6 cú hợp âm tay phải; giật đúng cú phách 4 là
 * 1/6 = 17%, khớp mật độ của sheet. Vang một nửa trường độ ghi là cách đọc dấu staccato của Claude — cùng cách bộ soạn solo CP
 * đọc (gate × .5), chưa đo.
 *
 * Giá trị cũ: CHÁT 11 vang .5 phách. Lùi khi: nghe CHÁT 11 cụt, mất tiếng nhấn cuối khung.
 * Người dùng nghe ổn thì đặt làm mặc định; đừng tự xoá ô tick khi người dùng chưa bảo.
 */
export function giatKieuCaPhao(style: StylePattern): StylePattern {
  if (!laBossaCP(style) || !style.cell) return style
  return {
    ...style,
    cell: {
      ...style.cell,
      right: style.cell.right.map((hit) => (hit.beat === 7 ? { ...hit, durationBeats: hit.durationBeats / 2 } : hit)),
    },
  }
}

/** CP cải tiến: giữ nguyên cả câu fill chỉ khi nó vừa khe của tay chơi.
 * Nếu cắt từng nốt fill sẽ thủng câu; nếu chuyển chát sang LH sẽ mất nhịp đã chốt.
 */
export function bossaFillsInGaps(
  fills: readonly TimelineEvent[], backing: readonly TimelineEvent[],
): TimelineEvent[] {
  const phrases: TimelineEvent[][] = []
  let end = -Infinity
  for (const event of [...fills].sort((a, b) => a.startBeat - b.startBeat)) {
    if (event.startBeat > end + .25) phrases.push([])
    phrases.at(-1)!.push(event)
    end = Math.max(end, event.startBeat + event.durationBeats)
  }
  return phrases.filter(phrase => !phrase.some(note => backing.some(comp =>
    comp.hand === note.hand && comp.startBeat < note.startBeat + note.durationBeats - 1e-6 &&
    note.startBeat < comp.startBeat + comp.durationBeats - 1e-6))).flat()
}
