import type { StylePattern } from '../types'

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
 * Giữ ô A; ô B nối liền: bùm 7(4) 0.5 → chát 8(4.5) 1 → bùm 9(5.5) 0.5
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
    left: [...CA_PHAO_BOSSA.cell!.left
      .filter(hit => hit.beat !== 7)
      .flatMap(hit => hit.beat === 4
        ? [4, 5.5].map(beat => ({ ...hit, beat, durationBeats: .5, velocityScale: .65 }))
        : hit.beat === 5.5
          ? [4.5, 6].map(beat => ({ ...hit, beat, durationBeats: 1, velocityScale: .45 }))
          : [{ ...hit }]),
      { beat: 7.5, durationBeats: .5, velocityScale: .45, som: true,
        requireNextChord: true, tones: [{ toneIndex: 0, fromRoot: true, semitones: 1 }] },
    ],
    right: CA_PHAO_BOSSA.cell!.right
      .filter(hit => hit.beat !== 4)
      .flatMap(hit => hit.beat === 5.5
        ? [4.5, 6].map(beat => ({ ...hit, beat, durationBeats: 1, velocityScale: .6 }))
        : hit.beat === 6.5
          ? [{ ...hit, beat: 7, durationBeats: .5, velocityScale: .9 }]
          : [{ ...hit }]),
  },
  note: 'Chát 8 ngân 1 → bùm 9 dài ½ → chát 10 dài 1 → chát 11 dài ½ → bass dẫn ½. Tất cả nối liền, không nghỉ sau tiếng 8. Cặp 9–10 như 7–8. Giữ câu 8 phách/BPM; biến thể KT.',
}
