import { normalizePitchClass } from '../../shared/musicTheory/pitch'
import { getChordQuality } from '../../shared/musicTheory/chordDefinitions'
import type { ScaleType } from '../../shared/musicTheory/scales'
import type { ParsedChord } from '../types'
import { withQuality } from './staticVoicingRules'
import type { PassingSuggestion } from './passingChordRules'

/*
  MÀU BLUES CHO NÚT BLUE SUN (29/9/2026). Người dùng: *"Hãy phân tích kỹ 3 sheet Blues xem cách đặt hợp âm của Blues là như thế nào,
  kết hợp với tư duy của bạn để dạy cho bộ soạn biết chọn hợp âm màu Blues. Mỗi lần Click vào nút Blues Sun thì hợp âm phải được đặt
  theo màu Blues"*. Chạy ở khâu tô màu của `reharmonize` (`harmonyStyle: 'blue-sun'`) — bấm nút Blue Sun là vòng hợp âm của bài được
  tô lại.

  SỐ ĐO — nốt VANG hai tay mỗi đơn vị, so gốc hợp âm (`scripts/phan_tich_blues_ba_sheet.py --mau`; có lẫn nốt giai điệu lướt):
    Rockhouse (Sol trưởng): I (n=118) 6/13 72% · #9 (b3 blue) 51% · b7 41% · 9 22%; IV (n=47) b7 78% · 9 74% · 13 55%;
      V (n=22) b7 72% · 9 50% · #9 45% · b9 18%.
    Robert (Đô trưởng): IV (n=23) b7 73% · 9 52% · 13 47%; ii thứ (n=15) b7 53%; V (n=7) b7 57% · b13 57% · 9 42%.
    Rising Sun (Mi thứ, n rất nhỏ): i (n=5) b7 80% · 11 100%; III (n=3) b7 · 9 · 13 3/3; V7 (n=3) #9 3/3.

  BẢN 2 — MÀU BLUES TRONG GIỌNG (29/9/2026). Người dùng nghe bản 1 cùng ô tick "Bản Blues rút gọn": *"các hợp âm khi đánh đệm nghe
  bị phô"*. Bản 1 (I → 13 · IV/V → 9 · trưởng khác → 7; thứ: i m9 · v thứ/V → 7#9 · III → 13 · bVI/bVII/IV → 9) đưa NỐT NGOÀI GIỌNG
  vào ngay hợp âm tay trái: G13 trong Mi thứ có F thường (tay trái F3 G3 B3 D4) trong khi giai điệu bài Việt Mi thứ hát F#; C9 có Bb;
  I13 giọng trưởng có b7; IV9 có b3 của giọng; B7#9 từ Bm7 đưa D# chồng lên D của giai điệu. Nhạc blues gốc có giai điệu blues nên
  chịu được; bài Việt giai điệu theo giọng thì nghe phô.
  Nên bản 2 thử màu THEO THỨ TỰ số đo và BỎ màu nào thêm nốt ngoài giọng mà hợp âm gốc không có — các màu nhiều nhất trong sheet
  phần lớn vốn TRONG giọng: I 6 (72%) > b7 (41%); IV 9 (74%); V b7 (72%, b7 của V trong giọng) · 9 (50%); III 9 · 13.
    trưởng: I → 6/9 · 6 · add9 | IV → 6/9 · add9 · 6 | V → 9 · 13 · 7 | thứ (ii iii vi) → m9 · m7 | trưởng khác → 7 · 9 · 6/9 · add9
    thứ:    i → m9 · m11 · m7 | iv → m9 · m7 | v thứ → m7 · m11 (GIỮ thứ) | V trưởng (gốc có nốt dẫn) → 7#9 · 7b9 · 7 |
            III · bVI → 6/9 · maj7 · add9 | bVII · IV trưởng · II → 9 · 7 · 13
  Không hạ màu (gốc đã chứa đủ nốt của màu → giữ); giảm · nửa giảm · sus · tăng · hợp âm lướt giữ nguyên. Cũ — bản 1: triệu chứng để lùi
  là "nghe không ra Blues, hiền quá".
*/
type Giong = { tonic: number; scale: ScaleType }

const AM_GIAI = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] }

function thuTuMau(chord: ParsedChord, key: Giong): string[] {
  const iv = new Set(chord.quality.intervals.map(normalizePitchClass))
  const truong = iv.has(4) && !iv.has(3) && iv.has(7)
  const thu = iv.has(3) && !iv.has(4) && iv.has(7)
  if (!truong && !thu) return []
  const f = normalizePitchClass(chord.root - key.tonic)
  if (key.scale === 'minor') {
    if (thu) return f === 0 ? ['m9', 'm11', 'm7'] : f === 7 ? ['m7', 'm11'] : ['m9', 'm7']
    if (f === 7) return ['7#9', '7b9', '7']
    if (f === 3 || f === 8) return ['69', 'maj7', 'add9']
    return ['9', '7', '13']
  }
  if (thu) return ['m9', 'm7']
  if (f === 0) return ['69', '6', 'add9']
  if (f === 5) return ['69', 'add9', '6']
  if (f === 7) return ['9', '13', '7']
  return ['7', '9', '69', 'add9']
}

export function colorBlueSun(chords: readonly ParsedChord[], key: Giong | null): ParsedChord[] {
  if (!key) return [...chords]
  const giong = new Set(AM_GIAI[key.scale === 'minor' ? 'minor' : 'major'].map(x => normalizePitchClass(x + key.tonic)))
  return chords.map(chord => {
    if (chord.passing) return chord
    const co = new Set(chord.quality.intervals.map(x => normalizePitchClass(x + chord.root)))
    for (const id of thuTuMau(chord, key)) {
      const q = getChordQuality(id)
      if (!q) continue
      const not = q.intervals.map(x => normalizePitchClass(x + chord.root))
      // Không hạ màu: gốc đã chứa đủ nốt của màu này.
      if (not.every(x => co.has(x))) return chord
      // Màu trong giọng: nốt thêm vào phải thuộc âm giai của bài (nốt ngoài giọng chỉ được khi hợp âm gốc đã có).
      if (not.every(x => co.has(x) || giong.has(x))) return withQuality(chord, id)
    }
    return chord
  })
}

/*
  HỢP ÂM LƯỚT BLUES Ở CUỐI ĐOẠN (29/9/2026, ô tick riêng). Người dùng: "Làm việc đó đi" — việc đã báo chưa làm: tự chèn hợp âm lướt
  kiểu Robert / Ray. Số đo (ký hiệu in, `phan_tich_blues_ba_sheet.py` mục A): Robert I → bIII° 9% · bIII° → ii 6% · bII → I 4% của
  70 bước hợp âm; bIII° 8% · bII7 5% của 98 ký hiệu; Rockhouse turnaround cuối vòng 12 ô I · IV · #IV° · V (ô 11–12), câu kết
  V · bVI · bII7 · I (ô 113–114); Robert quay vòng C → F → F#/Gb → G (ô 76–79) trước vòng mới. Cả hai đặt hợp âm lướt ở CHỖ QUAY VÒNG
  cuối đoạn, chiếm NỬA SAU ô, không đặt giữa câu.
  BIÊN SOẠN của Claude: chỉ ở ô cuối mỗi đoạn, nửa sau ô (hợp âm chủ giữ phần còn lại), dẫn vào hợp âm đầu đoạn sau:
    · đoạn sau mở bằng chủ và ô cuối là V → bII7 (thay tritone — Robert bII7 → I, câu kết của Ray);
    · đoạn sau mở bằng chủ, ô cuối không phải V → V7 của chủ (giọng thứ V7#9 — màu Blue Sun);
    · đoạn sau mở bằng hợp âm khác → hợp âm giảm bảy nửa cung dưới hợp âm đích (Robert bIII° → ii · Ray #IV° → V).
  Không chèn giữa câu hát: hợp âm lướt là hợp âm màu, đặt dưới giọng hát thì dễ chỏi (người dùng vừa chê "nghe bị phô").
  Tay trái: `renderPattern` giữ pha ô đệm theo `beatsEach` nên hợp âm lướt rơi đúng cú hợp âm phách 4; tay phải soạn theo hợp âm ĐANG
  VANG (`hopTai` trong `soanCauBlues`).
*/
export function luotBlueSun(
  chords: readonly ParsedChord[],
  key: Giong,
  ranges: readonly { from: number; to: number }[],
  beatsPerChord: number,
): PassingSuggestion[] {
  const out: PassingSuggestion[] = []
  for (const r of [...ranges].sort((a, b) => a.to - b.to)) {
    const host = chords[r.to]
    const dich = chords[r.to + 1]
    if (!host || !dich || host.passing || dich.passing) continue
    const tong = host.beats ?? beatsPerChord
    if (tong < beatsPerChord - 1e-6) continue
    const f = normalizePitchClass(dich.root - key.tonic)
    const h = normalizePitchClass(host.root - key.tonic)
    const [goc, mau, cach] = f === 0
      ? h === 7 ? [key.tonic + 1, '7', 'thay tritone bII7 → chủ'] : [key.tonic + 7, key.scale === 'minor' ? '7#9' : '7', 'V7 của chủ']
      : [dich.root - 1, 'dim7', 'hợp âm giảm nửa cung dưới hợp âm đích']
    if (normalizePitchClass(goc) === normalizePitchClass(host.root)) continue
    const lot = withQuality({ ...dich, root: normalizePitchClass(goc), bass: undefined, symbol: '' }, mau)
    out.push({
      insertBeforeIndex: r.to + 1, chords: [lot], hostKeepBeats: tong - beatsPerChord / 2,
      technique: mau === 'dim7' ? 'dim7-passing' : 'secondary-dominant',
      explanation: `Blue Sun: hợp âm lướt Blues cuối đoạn — ${cach} (${lot.symbol} → ${dich.symbol}).`,
    })
  }
  return out
}
