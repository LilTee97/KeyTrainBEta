import type { StylePattern } from '../types'

/*
  KHUÔN MẪU CHỈ DÙNG TRONG TEST — không nằm trong thư viện điệu, không có nút, `getStyle` không thấy.

  Người dùng 30/9/2026 xoá mọi điệu trừ chín nút (xem `styleLibrary/index.ts`). Test máy chung — renderer, phát theo
  nốt, bù tiếng hợp âm lướt, cảm nhịp câu solo — cần vài ô đệm đơn giản 4/4, 3/4, swing, bossa. Bốn khuôn dưới chép
  NGUYÊN số liệu Pop 1 · Bossa Nova 1 · Waltz 1 · Swing 1 (OneMotion) tại commit c58be15, chỉ đổi id / tên cho khỏi
  lẫn với điệu thật.
*/
export const MAU_BALLAD: StylePattern = {
  id: 'mau-ballad',
  name: 'Mẫu ballad (Pop 1 cũ)',
  family: 'mau-ballad',
  familyName: 'Mẫu ballad (Pop 1 cũ)',
  variant: 1,
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  bpm: 120,
  feel: 'straight-block-chord',
  verified: true,
  sourceVideos: ['OneMotion Chord Player'],
  cell: {
    lengthBeats: 4,
    right: [
      { beat: 0, durationBeats: 0.7, velocityScale: 1 },
      { beat: 1, durationBeats: 0.7, velocityScale: 0.82 },
      { beat: 2, durationBeats: 0.7, velocityScale: 1 },
      { beat: 3, durationBeats: 0.7, velocityScale: 0.82 },
    ],
    left: [
      {
        beat: 0,
        durationBeats: 0.7,
        velocityScale: 1,
        tones: [
          { toneIndex: 0 },
          { toneIndex: 0, semitones: 12 },
        ],
        voice: 'bottom',
      },
      {
        beat: 3.5,
        durationBeats: 0.5,
        velocityScale: 1,
        tones: [
          { toneIndex: 0, semitones: 7 },
        ],
        voice: 'bottom',
      },
    ],
  },
  note: 'OneMotion Pop 1',
}

export const MAU_BOSSA: StylePattern = {
  id: 'mau-bossa',
  name: 'Mẫu bossa (Bossa Nova 1 cũ)',
  family: 'mau-bossa',
  familyName: 'Mẫu bossa (Bossa Nova 1 cũ)',
  variant: 1,
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  bpm: 120,
  feel: 'syncopated-3-3-2',
  verified: true,
  sourceVideos: ['OneMotion Chord Player'],
  cell: {
    lengthBeats: 8,
    right: [
      { beat: 0, durationBeats: 0.7, velocityScale: 1 },
      { beat: 1, durationBeats: 0.35, velocityScale: 0.78 },
      { beat: 2.5, durationBeats: 0.7, velocityScale: 0.88 },
      { beat: 3.5, durationBeats: 0.7, velocityScale: 1 },
      { beat: 4.5, durationBeats: 0.35, velocityScale: 0.78 },
      { beat: 6, durationBeats: 0.7, velocityScale: 1 },
      { beat: 7, durationBeats: 0.7, velocityScale: 1 },
    ],
    left: [
      {
        beat: 0,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
      {
        beat: 1.5,
        durationBeats: 0.7,
        velocityScale: 0.88,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
      {
        beat: 2,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0, semitones: 7 },
        ],
        voice: 'bottom',
      },
      {
        beat: 3.5,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
      {
        beat: 4,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
      {
        beat: 5.5,
        durationBeats: 0.7,
        velocityScale: 0.88,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
      {
        beat: 6,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0, semitones: 7 },
        ],
        voice: 'bottom',
      },
      {
        beat: 7.5,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
    ],
  },
  note: 'OneMotion Bossa Nova 1',
}

export const MAU_VALSE: StylePattern = {
  id: 'mau-valse',
  name: 'Mẫu valse (Waltz 1 cũ)',
  family: 'mau-valse',
  familyName: 'Mẫu valse (Waltz 1 cũ)',
  variant: 1,
  timeSignature: '3/4',
  beatsPerMeasure: 3,
  bpm: 120,
  feel: 'waltz-oom-pah-pah',
  verified: true,
  sourceVideos: ['OneMotion Chord Player'],
  cell: {
    lengthBeats: 3,
    right: [
      { beat: 1, durationBeats: 1.4, velocityScale: 0.88 },
      { beat: 2, durationBeats: 1, velocityScale: 0.88 },
    ],
    left: [
      {
        beat: 0,
        durationBeats: 1.4,
        velocityScale: 0.88,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
    ],
  },
  note: 'OneMotion Waltz 1',
}

export const MAU_SWING: StylePattern = {
  id: 'mau-swing',
  name: 'Mẫu swing (Swing 1 cũ)',
  family: 'mau-swing',
  familyName: 'Mẫu swing (Swing 1 cũ)',
  variant: 1,
  timeSignature: '4/4',
  beatsPerMeasure: 4,
  bpm: 130,
  feel: 'swing',
  verified: true,
  sourceVideos: ['OneMotion Chord Player'],
  cell: {
    lengthBeats: 4,
    right: [
      { beat: 1.5, durationBeats: 0.35, velocityScale: 0.78 },
      { beat: 3, durationBeats: 0.7, velocityScale: 1 },
    ],
    left: [
      {
        beat: 0,
        durationBeats: 0.35,
        velocityScale: 0.78,
        tones: [
          { toneIndex: 0 },
        ],
        voice: 'bottom',
      },
      {
        beat: 3.5,
        durationBeats: 0.5,
        velocityScale: 0.88,
        tones: [
          { toneIndex: 0, semitones: 7 },
        ],
        voice: 'bottom',
      },
    ],
  },
  note: 'OneMotion Swing 1',
}
