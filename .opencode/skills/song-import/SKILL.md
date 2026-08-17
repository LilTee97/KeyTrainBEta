---
name: song-import
description: Import a song from uploaded audio or a pasted link/title into timed original chords + BPM, play it with KeyTrain styles (no original audio), and practice wait-for-correct-note. Use when adding YouTube/web-link/file import, Chordify-like analysis, beat-aligned harmonic rhythm, or wiring import into tab Tái hòa âm vs tab Luyện đệm.
---

# Nhập bài hát → đệm KeyTrain → luyện chờ nốt

Chordify (vd [Người Ấy](https://chordify.net/chords/nguoi-ay-trinh-thang-binh-official-pops-music)) làm 3 việc: lấy audio (YouTube/Spotify/file) → ước BPM + giọng + hợp âm **dính từng phách** → phát **nhạc gốc** kèm lưới hợp âm.

KeyTrain sao **lưới hợp âm + BPM** bằng clone MIR offline: chroma + dò giọng + softmax train trên chroma tự gán nhãn (`chordNet.ts`). Không lấy DNN Chordify (không API). Không phát nhạc gốc, không scrape.

## Ranh giới (đừng vượt)

- **Cấm** scrape chordify.net / youtube.com / yt-dlp trong app. Offline, CORS chặn, ToS cấm.
- **Cấm** phát file/audio gốc trong app. Người dùng đã nói rõ: chỉ điệu KeyTrain.
- Link YouTube / web bất kỳ = **tên bài + URL nguồn** (ghi vào snapshot). Audio thật chỉ từ **file người dùng chọn** (`<input type="file" accept="audio/*">`).
- Phân tích hợp âm từ audio là ước lượng (sai là bình thường). Người dùng sửa trên lời như bài dán tay.

## Hai tab — đừng gộp

| Việc | Tab | File sẵn |
|---|---|---|
| Nhập link/file, xem vòng gốc, chỉnh nhịp, chọn điệu, nghe đệm KeyTrain, lưu | **Tái hòa âm** | `ReharmHome.tsx` + `SongTextInput` |
| Chọn bài đã lưu, đánh theo, app **chờ nốt đúng** | **Luyện đệm** | `PracticeHome.tsx` + `NoteGatedPractice` + `practiceStore.ts` |

Luyện đệm **không** tự phân tích audio. Nó chỉ `requestOpen(snapshot)` → tab Tái hòa âm dựng lại timeline → `setSong`. Đừng chép pipeline sang Practice.

## Việc Chordify làm → chỗ KeyTrain đã có

| Chordify | KeyTrain đã có | Việc mới |
|---|---|---|
| Hợp âm theo phách | `chordBeats` + `pairedChords` + `beats` trên `ParsedChord` (`chordTiming.ts`) | Điền bảng phách từ import, đừng giả mọi hợp âm 4 phách |
| BPM | `setBpm` / `useMetronomeStore` | Gán BPM dò được (hoặc người dùng gõ) |
| Giọng | `detectKey` / `manualKey` | Có ước giọng thì điền `manualKey` |
| Lưới ô nhịp | Bản nhạc + `SongSheetView` | Không dựng lưới Chordify mới |
| Phát nhạc gốc | `renderPattern` + style library | Chỉ bấm Phát như bài dán tay |
| Chơi theo | `NoteGatedPractice` (chờ nốt đúng) | Không thêm chế độ mới |

Ra của mọi đường nhập: `loadSong(parseSongText(text), text)` + `setBeatsPerChord` / `halvedBeats` / `setBpm`. Cùng `ChordSequence` như dán lời.

## Định dạng nội bộ (một type, mọi nguồn)

```ts
interface ImportedTrack {
  title: string
  sourceUrl?: string
  bpm: number
  beatsPerMeasure: 3 | 4
  chords: { symbol: string; beats: number }[]
}
```

`beats` là số phách hợp âm đó chiếm (1, 2, 4…). Tổng phách = độ dài bài. Map sang vòng + `chordBeats` record (số thứ tự → phách). Điệu (`styleId`) người dùng chọn sau — không lấy từ Chordify.

## Khi nào viết code mới

1. **UI nhập** trên tab Tái hòa âm (cạnh `SongTextInput`): ô dán URL (chỉ lưu title/url), nút chọn file audio, ô BPM sửa tay, nút "Dùng vòng này".
2. **Bộ đọc nhịp** `src/reharm/input/importedTrack.ts`: `ImportedTrack` → text hợp âm + bảng `chordBeats`. Test thuần, không cần audio.
3. **Ước hợp âm từ file** — trong app: `analyzeAudio.ts` + `chordNet.ts`. Chính xác hơn: sidecar `tools/analyze_song.py` (librosa CQT + beat_track) → JSON → `parseSidecarTrack`.

Không làm: yt-dlp, Demucs, scrape Chordify, nhét Python vào Vite.

## Kiểm

- Import 4 hợp âm `| C | Am | F | G |` BPM 72 điệu ballad → `reharmonize` chạy, Phát không cần file audio.
- Đổi điệu ballad → bossa: cùng vòng, cell khác (`styleLibrary`).
- Lưu bài → tab Luyện đệm mở được, `NoteGatedPractice` chờ nốt đúng.
- Không có test gọi mạng.
