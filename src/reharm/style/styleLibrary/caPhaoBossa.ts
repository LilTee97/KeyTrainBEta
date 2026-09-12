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
    // Viết trực tiếp khung đã chốt, không biến đổi ô B từ mẫu rút sheet.
    left: [
      { beat: 0, durationBeats: 1.5, velocityScale: .9, tones: [{ toneIndex: 0, fromRoot: true }] },
      { beat: 1.5, durationBeats: .5, velocityScale: .55, tones: [{ toneIndex: 2, fromRoot: true, semitones: -1 }] },
      { beat: 2, durationBeats: 2, velocityScale: .75, tones: [{ toneIndex: 2, fromRoot: true }] },
      { beat: 4, durationBeats: .5, velocityScale: .65, tones: [{ toneIndex: 0, fromRoot: true }] },
      { beat: 5.5, durationBeats: .5, velocityScale: .65, tones: [{ toneIndex: 0, fromRoot: true }] },
      ...[4.5, 6].map(beat => ({ beat, durationBeats: 1, velocityScale: .45, tones: [
        { toneIndex: 2, fromRoot: true },
        { toneIndex: 0, fromRoot: true, semitones: 12 },
        { toneIndex: 1, fromRoot: true, semitones: 12 },
      ] })),
      { beat: 7.5, durationBeats: .5, velocityScale: .45, som: true,
        requireNextChord: true, tones: [{ toneIndex: 0, fromRoot: true, semitones: 1 }] },
    ],
    right: [
      { beat: 1, durationBeats: .5, velocityScale: .65, tones: [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }] },
      { beat: 2.5, durationBeats: 1, velocityScale: .72, tones: [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }] },
      { beat: 3.5, durationBeats: .5, velocityScale: .55, tones: [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }] },
      { beat: 4.5, durationBeats: 1, velocityScale: .6, tones: [{ toneIndex: 0 }, { toneIndex: 1 }] },
      { beat: 6, durationBeats: 1, velocityScale: .6, tones: [{ toneIndex: 0 }, { toneIndex: 1 }] },
      { beat: 7, durationBeats: .5, velocityScale: .9, tones: [{ toneIndex: 0 }, { toneIndex: 1 }] },
    ],
  },
  note: 'Chát 8 ngân 1 → bùm 9 dài ½ → chát 10 dài 1 → chát 11 dài ½ → bass dẫn ½. Tất cả nối liền, không nghỉ sau tiếng 8. Cặp 9–10 như 7–8. Giữ câu 8 phách/BPM; biến thể KT.',
}

/**
 * BOSSA TEST 1 — bản DỰNG LẠI từ văn bản mô tả, làm nút riêng để nghe so với nút cũ.
 *
 * Người dùng yêu cầu 12/9/2026: tạo lại "Bossa CP cải tiến" từ ba file ghi chép ở commit
 * 64496ba (`Reference/CA-PHAO-MAU-GIANG-KET-BOSSA-2026-09-12.md`, `CA-PHAO.md`,
 * `SO-TAY.md`) thành một nút mới, KHÔNG chồng lên nút cũ. Cell viết thẳng theo lời mô tả
 * trong `CA_PHAO_BOSSA_IMPROVED`, không spread từ nó — để hai bản độc lập, sửa bản này
 * không lây sang bản đã duyệt:
 *
 *   Ô A (ô XML 9 Người hãy quên em đi): bass gốc 1½ phách · nốt tiếp cận nửa cung DƯỚI
 *   bậc 5 ở 2& (½) · bậc 5 ở 3 (2 phách). RH chát ba nốt ở 2, 3&, 4&; KHÔNG đánh ở 1 hay 3.
 *   Ô B (biến thể KT đã chốt): bùm 7(4) ½ → chát 8(4½) 1 → bùm 9(5½) ½ → chát 10(6) 1 →
 *   chát 11(7) ½ → bass dẫn (7½) ½ = nốt trên bass kế tiếp nửa cung, chỉ khi có hợp âm
 *   sau. Cặp 9–10 lặp cách đánh 7–8; không nghỉ sau tiếng 8. Giữ 8 phách / BPM.
 *
 * Đúng bằng cell cũ ở mọi số — cố ý, vì đây là bản tái tạo để đối chiếu; khác biệt (nếu
 * người dùng muốn thử) sẽ sửa ở ĐÂY, không sửa ở `CA_PHAO_BOSSA_IMPROVED`.
 */
const TONE_ROOT = { toneIndex: 0, fromRoot: true } as const
const TONE_FIFTH = { toneIndex: 2, fromRoot: true } as const
const CHAT_3 = [{ toneIndex: 0 }, { toneIndex: 1 }, { toneIndex: 2 }]
const CHAT_2 = [{ toneIndex: 0 }, { toneIndex: 1 }]
const CHAT_LH = [TONE_FIFTH, { toneIndex: 0, fromRoot: true, semitones: 12 }, { toneIndex: 1, fromRoot: true, semitones: 12 }]

export const CA_PHAO_BOSSA_TEST_1: StylePattern = {
  id: 'ca-phao-bossa-test-1',
  name: 'Bossa test 1',
  family: 'ca-phao-bossa-test-1',
  familyName: 'Bossa test 1',
  variant: 1,
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  bpm: 110,
  feel: 'syncopated-3-3-2',
  verified: true,
  sourceVideos: ['Dựng lại từ Reference/CA-PHAO-MAU-GIANG-KET-BOSSA-2026-09-12.md (commit 64496ba); nền Người hãy quên em đi ô XML 9–10'],
  releaseRatio: 1,
  leftHandTop: 67,
  cell: {
    lengthBeats: 8,
    left: [
      // Ô A
      { beat: 0, durationBeats: 1.5, velocityScale: .9, tones: [TONE_ROOT] },
      { beat: 1.5, durationBeats: .5, velocityScale: .55, tones: [{ ...TONE_FIFTH, semitones: -1 }] },
      { beat: 2, durationBeats: 2, velocityScale: .75, tones: [TONE_FIFTH] },
      // Ô B: bùm 7 · chát 8 · bùm 9 · chát 10 · chát 11 · bass dẫn
      { beat: 4, durationBeats: .5, velocityScale: .65, tones: [TONE_ROOT] },
      { beat: 4.5, durationBeats: 1, velocityScale: .45, tones: CHAT_LH },
      { beat: 5.5, durationBeats: .5, velocityScale: .65, tones: [TONE_ROOT] },
      { beat: 6, durationBeats: 1, velocityScale: .45, tones: CHAT_LH },
      { beat: 7.5, durationBeats: .5, velocityScale: .45, som: true,
        requireNextChord: true, tones: [{ toneIndex: 0, fromRoot: true, semitones: 1 }] },
    ],
    right: [
      // Ô A: chát ở 2, 3&, 4&
      { beat: 1, durationBeats: .5, velocityScale: .65, tones: CHAT_3 },
      { beat: 2.5, durationBeats: 1, velocityScale: .72, tones: CHAT_3 },
      { beat: 3.5, durationBeats: .5, velocityScale: .55, tones: CHAT_3 },
      // Ô B: chát 8 ngân 1 · chát 10 ngân 1 · chát 11 ½
      { beat: 4.5, durationBeats: 1, velocityScale: .6, tones: CHAT_2 },
      { beat: 6, durationBeats: 1, velocityScale: .6, tones: CHAT_2 },
      { beat: 7, durationBeats: .5, velocityScale: .9, tones: CHAT_2 },
    ],
  },
  note: 'Bossa test 1 — dựng lại Bossa CP cải tiến từ ghi chép 12/9/2026, nút riêng để nghe đối chiếu. Intro/giang/outro thứ đi cùng đường với nút cũ.',
}

/** Mọi id được coi là "Bossa CP cải tiến" — nút cũ đã duyệt và các nút thử dựng lại. */
export const BOSSA_CP_IDS: ReadonlySet<string> = new Set([CA_PHAO_BOSSA_IMPROVED.id, CA_PHAO_BOSSA_TEST_1.id])

/**
 * Điệu này có đi đường Bossa CP cải tiến không (intro/giang/outro thứ của Cà Pháo, fill
 * theo khe, mở lại ô A đầu đoạn). Một chỗ hỏi cho mọi nơi — trước đây so cứng
 * `style.id === 'ca-phao-bossa-improved'` ở mười chỗ, thêm nút thử là phải sửa mười chỗ.
 */
export function laBossaCP(style: { id?: string } | string | null | undefined): boolean {
  const id = typeof style === 'string' ? style : style?.id
  return id !== undefined && BOSSA_CP_IDS.has(id)
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
