# KeyTrain — Kế hoạch xây dựng

> **File này là bản chính thức của kế hoạch.** Bản đầu tiên do Claude Code sinh ra ở `~/.claude/plans/` nay đã cũ và không còn được cập nhật — đừng đọc bản đó.
>
> Tiến độ hiện tại được ghi theo từng bước trong lịch sử commit và trong `Reference/SO-TAY.md`.

## Context

Repo `D:\Coding Piano app` khi lập kế hoạch còn trống hoàn toàn (chỉ có thư mục `Reference\`). Mục tiêu là xây **KeyTrain** — một web app luyện piano gồm **hai hệ thống con** dùng chung một lõi:

- **Hệ A — Luyện tai nghe hợp âm** (lấy cảm hứng từ mikebwilliams.com/chords/): nhận diện hợp âm đơn, luyện progression, metronome, spaced repetition + thống kê. Điểm khác biệt: phần **ôn tập ghi nhớ được game hóa**.
- **Hệ B — Tái hòa âm & backing track theo phong cách Khá Bự**: nhập hợp âm / vòng hợp âm / lời bài hát có hợp âm → tái hòa âm theo phong cách → sinh backing track theo điệu → sinh câu fill/solo → luyện tương tác với chế độ **chờ đánh đúng nốt mới qua nốt tiếp** và **tách luyện tay trái / tay phải**. Hệ B **không game hoá** — không điểm, không sao, không huy hiệu.

Phạm vi nội dung nhạc: **chỉ Jazz + Pop**, không có nội dung cổ điển.

Tài liệu tham chiếu:
- `Reference\phongcachdemhatkhabu.md` — bộ quy tắc phong cách đệm hát Khá Bự (nguyên lý gốc + 5 kỹ thuật + 4 điệu đã xác thực + quy trình dò hợp âm).
- `Reference\TungaStyle-6-drop2_5.html` — công cụ tái hòa âm cho **guitar**. Quyết định của người dùng: **chỉ tham khảo ý tưởng UI/UX** (cấu trúc tab, 3 cách nhập hợp âm, chord tap → popup thế bấm, flashcard/drill), **không tái dùng logic thế bấm** (guitar 6 dây không áp dụng cho piano 2 tay).

**Quy trình bắt buộc:** làm từng bước nhỏ, mỗi bước phải demo được độc lập; người dùng xác nhận chạy tốt thì commit ngay để tạo lưới an toàn.

---

## Tech stack

| Hạng mục | Chọn | Lý do |
|---|---|---|
| Framework | React + TypeScript + Vite | Tái dùng component giữa 2 hệ (piano widget, tabs, popover); HMR nhanh, hợp với quy trình từng bước nhỏ. |
| Audio | **Tone.js** (trên nền Web Audio API) | Backing track cần lịch trình pattern/fill nhiều nhạc cụ, không chỉ chord stab. `Tone.Transport`/`Tone.Part` giải quyết sẵn bài toán lookahead scheduler (dùng `setTimeout` thô sẽ bị trôi nhịp). `Tone.Sampler` cho tiếng piano thật. Vẫn với tới được `AudioContext` thô khi cần đo latency. |
| State | **Zustand**, nhiều store nhỏ theo domain (`midiStore`, `earTrainingStore`, `srsStore`, `gamificationStore`, `reharmStore`, `playbackStore`) | Callback `onmidimessage` chạy ngoài vòng render của React — Zustand subscribe được từ JS thuần, không chỉ từ component. |
| Lưu trữ | `localStorage` cho setting nhỏ (tempo, voicing mode, theme); **IndexedDB** (qua `idb`) cho dữ liệu có cấu trúc/tăng dần: hàng đợi SRS, log thống kê, tiến trình gamification, bài hát/preset đã lưu | localStorage đồng bộ + giới hạn ~5-10MB; lịch sử thống kê và thư viện bài hát mở rộng vô hạn, cần truy vấn theo index ("item đến hạn hôm nay"). Thư viện điệu là **JSON tĩnh đóng gói sẵn**, không ghi vào browser storage. |
| Styling | Tailwind CSS + Radix UI primitives (Tabs, Popover, Dialog, Slider) | Có sẵn accessibility cho các pattern UI cần dùng, lặp nhanh. |
| Test | Vitest cho toàn bộ logic thuần (nhạc lý, luật tái hòa âm, SRS) + mock `MIDIAccess` tự viết | Chord detection, voice-leading, SRS là code thuần dễ test và đáng test nhất vì là 2 rule engine lớn. |

---

## Kiến trúc

Chia 3 tầng: `src/shared/` (xây một lần, cả 2 hệ dùng chung) — `src/earTraining/` (hệ A) — `src/reharm/` (hệ B).

### Lõi dùng chung

**`shared/musicTheory/`**
- `pitch.ts` — chuyển đổi MIDI note ⟷ pitch class ⟷ tên nốt, xử lý octave.
- `chordDefinitions.ts` — từ vựng hợp âm **chỉ jazz+pop** (triad, 7th, extension, sus2/4, add2, shell).
- `chordDetection.ts` — từ tập nốt đang bấm → trả về **danh sách ứng viên hợp âm có xếp hạng** (không phải 1 đáp án duy nhất — xem rủi ro #3), khớp theo tập con pitch-class để chấp nhận thể đảo/voicing thiếu nốt.
- `scales.ts` — bảng bậc diatonic theo giọng; dùng cho cả sinh progression (A) và hiển thị bậc (B).
- `romanNumeral.ts` — hợp âm ⟷ số La Mã theo giọng.
- `voicing.ts` — sinh voicing 1 tay cơ bản (thế gốc/đảo/shell), phục vụ drill hệ A.
- `progressionGenerator.ts` — progression có sẵn (ii-V-I, I-IV-V) + sinh ngẫu nhiên trong phạm vi jazz/pop.

**`shared/midi/`**
- `midiInput.ts` — bọc `navigator.requestMIDIAccess`, chuẩn hóa note-on/off vào `midiStore`.
- `onScreenPiano/OnScreenPiano.tsx` — bàn phím ảo bấm được, đẩy vào **cùng** `midiStore` để mọi module phía sau không cần biết nguồn input là gì. Đây là thành phần **chịu lực**, không phải trang trí (Safari không hỗ trợ Web MIDI — rủi ro #1).

**`shared/audio/`**
- `audioEngine.ts` — registry nhạc cụ Tone.js (piano sampler, bass, percussion nhẹ), bọc transport.
- `scheduler.ts` — tiện ích lookahead trên `Tone.Transport`/`Tone.Part`.
- `metronome.ts` — 30-240 BPM, nhấn phách 1, số phách/ô nhịp tùy chỉnh. Hệ A dùng trực tiếp; hệ B dùng làm đồng hồ nội bộ để pattern renderer bám vào.

### Hệ A — `src/earTraining/`
- `chordRecognition/` — phát hợp âm → người dùng bấm lại → chấm điểm qua `chordDetection.ts` → độ trễ hiện đáp án tùy chỉnh → chọn kiểu voicing → highlight bàn phím.
- `progressionTrainer/` — chuỗi hợp âm tuần tự, đồng bộ metronome tùy chọn.
- `metronomePanel/` — UI cho `shared/audio/metronome.ts`.
- `srs/srsEngine.ts` — **Leitner box** (5-7 hộp: cùng buổi / 1d / 3d / 7d / 14d / 30d), `reviewQueue.ts` (IndexedDB), `reviewSession.ts`.
  → Chọn Leitner thay vì SM-2 vì tập item nhỏ và có giới hạn (vài chục đến ~150 item trong phạm vi jazz+pop), Leitner đủ dùng, dễ test, và **map thẳng sang gamification** (mức hộp = bậc mastery hiển thị cho badge). SM-2 để dành v2 nếu dữ liệu cho thấy Leitner quá thô.
- `stats/` — `statsStore.ts` (log sự kiện append-only trong IndexedDB), `statsAggregation.ts` (tổng hợp theo ngày), UI dashboard.
- `gamification/` — `gamificationEngine.ts` (máy trạng thái XP/level/streak/combo/badge), `gamificationStore.ts`, các component `XPBar`/`StreakFlame`/`BadgeCase`/`ComboMeter`.

### Hệ B — `src/reharm/`
- `input/chordInputParser.ts` — text hợp âm tự do → `ChordSequence` chuẩn hóa.
- `input/songTextParser.ts` — lời bài hát có hợp âm → `Song` (xem Data model). Rủi ro parse cao nhất (#5).
- `input/degreeInput.ts` — nhập theo bậc La Mã → hợp âm cụ thể.
- `input/chordPickerGrid` — lưới chọn root/quality bấm được.
  → **Cả 3 cách nhập đều ghi vào cùng một kiểu `ChordSequence`** — bất biến then chốt học từ Tunga Style.
- `reharmEngine/voiceLeadingOptimizer.ts` — **nguyên lý gốc**: chọn thế đảo/voicing sao cho tổng khoảng cách di chuyển giữa các hợp âm là nhỏ nhất. Mọi luật khác đều gọi lại module này khi chèn/đổi hợp âm.
- `reharmEngine/staticVoicingRules.ts` — kỹ thuật 1: thay triad trơn bằng sus2/4/9/11/maj7/add2; quy hợp âm mở rộng về hình đơn giản chồng trên bass khác (upper-structure/slash chord) dưới dạng **luật tái dùng được**, không hardcode theo từng bài.
- `reharmEngine/passingChordRules.ts` — kỹ thuật 2: 3 công thức dim7 lướt (I→ii, iii→ii, dẫn về vi), chèn vòng 2-5-1 lướt cho 5 bậc {ii, iii, IV, V, vi}, chuỗi 2-3 dim7 nối V→I. Mỗi luật = matcher + gợi ý chèn, hiển thị cho người dùng **chấp nhận/từ chối**, không tự áp dụng ngầm.
- `reharmEngine/progressionSubstitution.ts` — kỹ thuật 3: đổi vòng cả bài sang ii-V-I-vi, **chỉ khi người dùng chủ động bật** (thay đổi bản sắc hòa âm).
- `reharmEngine/repeatVariation.ts` — kỹ thuật 5: đổi hợp âm kết ở lượt lặp lại.
- `reharmEngine/reharmPipeline.ts` — điều phối: parse → phân tích bậc → luật voicing tĩnh → gợi ý hợp âm lướt → tối ưu voice leading → `ReharmonizedProgression`.
- `style/styleLibrary/*.json` — `ballad.json`, `bossaNova.json`, `swing.json`, `valse.json` (đều `verified: true`, đúng schema tài liệu §19.3) + `unverified/*.json` (march/polka, boston/mazurka, cha-cha/rhumba/bolero/disco, slow-rock) với `verified: false, cell: null` để UI làm mờ thay vì **bịa ra** mẫu tiết tấu.
- `style/patternRenderer.ts` — `ReharmonizedProgression` + điệu + tempo → timeline nốt LH/RH. Điệu có `cell` cố định (bossa/swing/valse) thì lặp cell; ballad dùng thuật toán bám harmonic rhythm (giá trị nốt theo mật độ đổi hợp âm, chèn fill vào chỗ trống) vì ballad **không có cell dùng chung giữa các bài**.
- `voicingGenerator/handSplitVoicing.ts` — tách LH (bass) / RH (đệm hợp âm) theo từng điệu, gọi lại `voiceLeadingOptimizer.ts` để mỗi tay đều mượt.
- `fillSoloGenerator/graceNoteOrnamenter.ts` — kỹ thuật 4: chèn nốt láy cách 1 bậc trên/dưới/kết hợp, 3 mức mật độ.
- `fillSoloGenerator/fillGenerator.ts` — dùng đúng công thức chuỗi dim7 ở chỗ V→I; chỗ khác dùng connector đi liền bậc, rồi tô điểm bằng module trên.
- `fillSoloGenerator/soloGenerator.ts` — sinh câu solo/intro bằng cách nối các nốt đích lấy từ nốt mở rộng của hợp âm (9/11/13, sus), tô điểm bằng nốt láy.
- `playback/backingTrackRenderer.ts` — timeline phát thụ động hoàn chỉnh.
- `playback/noteGatedPlaybackEngine.ts` — **chờ đánh đúng nốt**: đi theo timeline nhưng chặn không cho qua cho tới khi `midiStore` báo đúng nhóm nốt mong đợi. So khớp với **đúng tập nốt của voicing đã sinh ra** (không phải khớp theo tên hợp âm mơ hồ) vì hệ B luôn biết chính xác nó đã sinh nốt nào.
- `playback/practiceModeController.ts` — chế độ chỉ tay trái / chỉ tay phải / hai tay, bằng cách lọc track nào đang bị gate.

### Luồng dữ liệu xuyên hệ
Cả 2 hệ đứng trên cùng `midiStore` (MIDI hoặc phím ảo), cùng `audioEngine`, cùng `chordDefinitions`/`romanNumeral`.
- **A**: input → `chordDetection` → so với đáp án drill → `statsStore` + `srsEngine` + `gamificationEngine`.
- **B**: text/hợp âm → parser → `ChordSequence` → `reharmPipeline` → `patternRenderer` + `handSplitVoicing` → `fillSoloGenerator` → `backingTrackRenderer` (thụ động) **hoặc** `noteGatedPlaybackEngine` (tương tác, dùng chung `midiStore` với A).
- Vì 2 hệ dùng chung kiểu `ChordVoicing`, sau này có thể đẩy một voicing đã tái hòa âm vào hàng đợi SRS của hệ A làm item luyện — **điểm mở rộng, không thuộc v1**.

---

## Thiết kế gamification

**Chỉ luồng ôn tập ghi nhớ của hệ A được game hoá.** Bài luyện tự do của hệ A (bước 6, 10) và **toàn bộ hệ B** đều không game hoá — không điểm, không sao, không huy hiệu.

Lý do: game hoá phục vụ việc quay lại đều đặn với việc ghi nhớ. Phần đệm hát thì người học đã có động lực tự thân là chơi được bài mình thích, thêm điểm số vào đó chỉ làm nhiễu.

### Luồng ôn tập ghi nhớ (hệ A)

- **XP**: 10 XP/câu đúng, nhân theo độ khó hợp âm (triad 1.0x, 7th 1.2x, mở rộng/jazz 1.5x), +5 XP nếu trả lời <2s (đúng mà chậm thì **không bị trừ**).
- **Combo trong buổi**: đúng liên tiếp → nhân XP: x1 (0-2), x1.5 (3-5), x2 (6-9), x3 (10+); sai một câu là về x1.
- **Streak theo ngày**: hoàn thành ≥1 buổi ôn/ngày thì +1, bỏ một ngày là mất. "Streak freeze" để dành sau v1.
- **Level**: ngưỡng XP theo đường cong `100 * level^1.5` cộng dồn; lên level có hiệu ứng chúc mừng + mở khóa màu/theme. Không có yếu tố thanh toán.
- **Badge mastery theo nhóm hợp âm**: 3 bậc Đồng/Bạc/Vàng, tính từ độ chính xác + số lần luyện theo từng nhóm ("Hợp âm Major 7", "Vòng ii-V-I", "Hợp âm Sus"), hiển thị dạng lưới `BadgeCase`.
- **Luồng buổi ôn (kiểu Duolingo)**: mỗi buổi 10-15 item đến hạn → nghe hợp âm → bấm trả lời → phản hồi tức thì bằng **cả âm thanh** (ding/buzz) **và hình ảnh** (bàn phím nháy xanh/đỏ) → đồng hồ combo cập nhật realtime → thanh tiến trình đầy dần → màn hình tổng kết cuối buổi (XP, streak, badge mới, % chính xác, số item đã thuộc).
- **Item sai được lặp lại**: vừa lên lịch lại theo Leitner, vừa **chèn lại vào cuối hàng đợi của chính buổi đó** (in-memory, không đụng lịch SRS lưu trữ).

Luyện chord/progression thô (bước 6, 10) **không** game hóa — chỉ luồng ôn tập mới có.

### Hệ B — không game hoá

Phần tái hòa âm và đệm hát **không có bất kỳ yếu tố game hoá nào**: không điểm, không sao, không combo, không huy hiệu, không bảng xếp hạng, không streak riêng.

Chế độ chờ đánh đúng nốt (bước 27-28) vẫn cho phản hồi đúng/sai tức thì để người học biết mình bấm trúng chưa — nhưng đó là **phản hồi kỹ thuật**, không phải chấm điểm, và không có gì được tích luỹ hay lưu lại thành thành tích.

---

## Data model

```
Chord            { root, quality, extensions?, bassOverride?, symbol }
ChordVoicing     { symbol, notes: MidiNoteNumber[], hand: 'LH'|'RH'|'both', inversion?, label? }
Progression      { id, name, key, degrees: RomanNumeralToken[], chords: Chord[], source }
ReviewItem       { id, kind: 'chord'|'progression', refId, category, boxLevel,
                   lastReviewedAt, nextDueAt, correctStreak, totalReps, totalCorrect }
StatsEvent       { id, timestamp, mode: 'practice'|'review', itemKind, category,
                   correct, responseMs }
EarProgress      { xp, level, currentStreakDays, longestStreakDays, lastActiveDate,
                   badges: {id, tier, unlockedAt}[] }   // chỉ hệ A; combo là state
                                                        // trong buổi, không lưu
Preset           { id, name, type, config }
Song             { id, title, key, sections: [{ name, lines: [{ lyric,
                   chordAnchors: [{chordSymbol, charOffset}] }] }] }
ReharmRule       { id, techniqueType, matcher, apply, verified, sourceNote? }
StylePattern     { name, timeSignature, feel, cellLength, verified, sourceVideos?,
                   cell: { rightHand, leftHand } | null }    // đúng schema tài liệu §19.3
```

### Định dạng nhập bài hát (2 định dạng, tự động nhận diện)

1. **Hai dòng canh cột (mặc định)** — dòng hợp âm canh theo khoảng trắng nằm trên dòng lời, tiêu đề đoạn dạng `[Verse]`/`[Chorus]`/`[Bridge]`:
   ```
   [Verse]
      Am11         D9sus4
   Ánh nắng chiều nay rơi xuống phố
   ```
   Parser tách các cụm không-khoảng-trắng trên dòng hợp âm thành `(chordSymbol, columnOffset)` rồi map sang vị trí ký tự gần nhất trên dòng lời. Đây là định dạng các trang hợp âm Việt Nam đang dùng → dán vào là chạy.
2. **ChordPro inline** — `Ánh nắng [Am11]chiều nay [D9sus4]rơi...`, tự nhận diện khi dòng có token hợp âm trong ngoặc vuông.

---

## Cấu trúc thư mục

```
KeyTrain/
  package.json  vite.config.ts  tsconfig.json  index.html
  src/
    main.tsx
    app/            App.tsx  AppShell.tsx (nav: Luyện tai | Tái hòa âm | Thống kê)
    shared/
      musicTheory/  pitch.ts chordDefinitions.ts chordDetection.ts scales.ts
                    romanNumeral.ts voicing.ts progressionGenerator.ts types.ts __tests__/
      midi/         midiInput.ts midiStore.ts onScreenPiano/ types.ts
      audio/        audioEngine.ts scheduler.ts metronome.ts instruments/
      persistence/  db.ts localSettings.ts
      ui/           Button Slider Tabs Popover Card (nền Radix)
    earTraining/
      chordRecognition/  progressionTrainer/  metronomePanel/
      srs/  stats/  gamification/  EarTrainingHome.tsx
    reharm/
      input/  reharmEngine/  style/styleLibrary/  voicingGenerator/
      fillSoloGenerator/  playback/  ReharmHome.tsx
  Reference/   (giữ nguyên)
```

---

## Thứ tự xây dựng (từng bước nhỏ, demo được, commit sau khi bạn xác nhận)

Lõi dùng chung (bước 0-9) xây một lần, cả 2 hệ dùng. Hệ A đi trước vì nhỏ hơn, rủi ro thấp hơn, và **kiểm chứng được MIDI/audio/persistence trước khi** đụng vào rule engine lớn của hệ B.

**Lõi dùng chung**
0. **Scaffold** — Vite+TS+Tailwind+ESLint, `AppShell` hiện chữ "KeyTrain". Demo: `npm run dev` mở được trang.
1. **Từ vựng hợp âm** — `pitch.ts` + `chordDefinitions.ts`, test Vitest (`{C,E,G} → "C major"`). Demo: `npm test` xanh.
2. **MIDI input** — `midiInput.ts` + trang debug hiện thiết bị + tên nốt đang bấm. Demo: bấm đàn thật, thấy nốt hiện lên.
3. **Bàn phím ảo dự phòng** — nối vào cùng store bước 2. Demo: click chuột cho kết quả y hệt bấm đàn.
4. **Nhận diện hợp âm realtime** — `chordDetection.ts` nối vào bước 2/3. Demo: bấm 3 nốt, hiện "Bạn đang chơi: C major". *(Lát cắt dọc đầu tiên của lõi chung.)*
5. **Audio tối thiểu** — Tone.js piano sampler + `playChord(notes)`. Demo: bấm nút, nghe hợp âm.

**Hệ A**
6. **Nhận diện hợp âm v0** — hợp âm ngẫu nhiên từ pool nhỏ → người dùng bấm lại → độ trễ hiện đáp án → đúng/sai. Chưa có SRS/gamification. *(Tính năng chơi được đầu tiên.)*
7. **Tùy chọn voicing + highlight bàn phím** — mở rộng `voicing.ts`, tô sáng nốt đúng.
8. **Metronome** — panel độc lập (30-240 BPM, phách/ô nhịp, nhấn phách 1).
9. **Sinh progression** — `progressionGenerator.ts` + test.
10. **Luyện progression** — phát vòng hợp âm (đồng bộ metronome tùy chọn), bấm lại từng hợp âm.
11. **Persistence** — `db.ts` (IndexedDB) + `localSettings.ts`; bước 6/10 nhớ tempo/voicing lần trước. *(Kiểm chứng lưu trữ trước khi xây SRS lên trên.)*
12. **Thống kê** — ghi mọi câu trả lời từ bước 6/10, trang Stats tối thiểu (đúng/sai hôm nay theo nhóm).
13. **SRS engine (chỉ logic)** — Leitner box + hàng đợi, test mô phỏng chuỗi ôn nhiều ngày.
14. **Buổi ôn tập (chưa game hóa)** — lấy item đến hạn từ 13, tái dùng UI drill 6/10, ghi qua 12/13. *(Vòng lặp spaced repetition đã chạy đủ.)*
15. **Gamification** — XP/streak/combo/badge nối vào bước 14. → **Hệ A hoàn tất phạm vi v1.**

*(Mốc kiểm: hệ A xong, lõi chung đã được kiểm chứng thực tế. Bắt đầu hệ B.)*

**Hệ B**
16. **Parser hợp âm** — `chordInputParser.ts` + UI nhập text/picker, "Am7 D9 Gmaj7" → `ChordSequence`, test edge case.
17. **Voice leading + tách 2 tay** — `voiceLeadingOptimizer.ts` + `handSplitVoicing.ts`. Demo: nút bật/tắt so sánh thế gốc thô vs đã tối ưu — **nghe được sự khác biệt**.
18. **Điệu Ballad** — `ballad.json` + nhánh ballad của `patternRenderer.ts`. Demo: dán vòng hợp âm → nghe đệm kiểu ballad.
19. **Luật voicing tĩnh** — sus/9/11/upper-structure áp vào pipeline bước 18, có toggle so sánh trước/sau.
20. **Luật hợp âm lướt** — dim7 + vòng 2-5-1 lướt, hiện dạng gợi ý chấp nhận/từ chối.
21. **Bossa / Swing / Valse** — các `styleLibrary/*.json` còn lại + nhánh cell cố định + UI chọn điệu. → **Mốc kiểm: cân nhắc lại phạm vi còn lại của hệ B (xem rủi ro #6) trước khi đi tiếp.**
22. **Nhập bài hát** — `songTextParser.ts` (cả 2 định dạng) + tab "Bài hát" hiện hợp âm bấm được trên lời.
23. **Popup thế bấm** — chạm hợp âm → hiện sơ đồ bàn phím 2 tay (bản piano của fret diagram bên Tunga).
24. **Câu fill V-I** — phát hiện chỗ V-I, chèn chuỗi dim7 đúng công thức tài liệu, có toggle.
25. **Nốt láy + sinh solo** — tô điểm giai điệu + sinh câu solo/intro, **gắn nhãn "thử nghiệm / mô phỏng phong cách"** trên UI.
26. **Backing track hoàn chỉnh** — gộp điệu + tái hòa âm + fill/solo vào một nút "Phát backing track".
27. **Chờ đánh đúng nốt (hai tay)** — `noteGatedPlaybackEngine.ts` gate timeline bước 26 theo `midiStore`. **Làm prototype quyết định transport tại đây** (rủi ro #2) trước khi xây tiếp lên trên.
28. **Chế độ tay trái / tay phải riêng** — `practiceModeController.ts` lọc track theo tay.
29. **Biến tấu khi lặp + đổi vòng cả bài sang ii-V-I-vi** — luật mang tính "gợi ý sáng tạo", để cuối.
30. **Hoàn thiện** — lưu preset/bài hát (mở rộng schema bước 11), làm mờ điệu chưa xác thực, trang cài đặt, responsive cho bàn phím ảo, rà accessibility.

---

## Cách kiểm chứng

- **Logic thuần** (nhạc lý, luật tái hòa âm, SRS): `npm test` (Vitest). Chord detection, voice-leading, và lịch Leitner đều test được không cần phần cứng — dùng mock `MIDIAccess` tự viết cho phần đọc MIDI.
- **Từng bước có UI**: `npm run dev`, thao tác trực tiếp trong trình duyệt theo phần "Demo" ghi ở mỗi bước. Với các bước liên quan MIDI (2, 4, 6, 27, 28) cần cắm đàn MIDI thật; các bước còn lại kiểm được bằng bàn phím ảo.
- **Các bước về âm thanh** (5, 17, 18, 21, 24, 25, 26): kiểm bằng **tai** — đặc biệt bước 17 (voice leading) và 18-21 (điệu) phải nghe ra khác biệt rõ, nếu không thì luật đang sai.
- Mỗi bước bạn xác nhận chạy tốt → commit ngay trước khi sang bước sau.

---

## Rủi ro cần biết trước

1. **Safari không hỗ trợ Web MIDI** (cả desktop lẫn iOS) → bàn phím ảo (bước 3) là thành phần chịu lực, không phải phụ. Feature-detect `navigator.requestMIDIAccess`, hiện banner "nên dùng Chrome/Edge để cắm đàn MIDI" và tự động rơi về bàn phím ảo.
2. **Timing của chế độ chờ đánh đúng nốt** — độ trễ đọc MIDI không phải vấn đề (dưới vài ms); vấn đề nằm ở chỗ gate ghép với `Tone.Transport` thế nào. Dừng/khởi động lại transport mỗi lần gate sẽ giật. Hướng đề xuất: giữ **một transport chạy liên tục làm đồng hồ thuần**, gate ở tầng "sự kiện nào được phép kêu", không pause/restart theo từng nốt — **làm prototype ở bước 27**, không giả định là xong.
3. **Hợp âm mơ hồ** — cùng một tập nốt có thể đọc thành nhiều tên hợp âm, càng tệ với extension/shell/slash chord. Hệ A: `chordDetection.ts` trả **danh sách xếp hạng**, chấm điểm theo **tập con pitch-class** với độ chặt tùy chỉnh, không đòi khớp tuyệt đối. Hệ B: né hẳn vấn đề bằng cách gate theo **đúng tập nốt của voicing đã sinh**, không khớp theo tên hợp âm.
4. **Chất lượng câu fill/solo tự sinh** — tài liệu mô tả kỹ thuật nốt láy ở mức **nguyên lý định tính**, không phải ngữ pháp sinh nhạc đầy đủ. Bộ sinh (bước 25) là **mô phỏng gần đúng**, phải gắn nhãn "thử nghiệm" trên UI để không bị hiểu nhầm là chép đúng phong cách Khá Bự.
5. **Parse lời có hợp âm** — text dán vào thực tế có khoảng trắng/tab lộn xộn, ký tự full-width, dòng nhạc cụ không có lời. Giới hạn đúng 2 định dạng đã đặc tả (không đoán mò tự do) + thêm bước **xem trước kết quả parse và chỉnh tay** vị trí hợp âm trước khi chấp nhận.
6. **Hệ B lớn hơn hẳn hệ A** — parser + rule engine + thư viện điệu + sinh voicing 2 tay + sinh fill/solo + backing track + note-gating gần bằng một sản phẩm độc lập. Thứ tự xây đã cố tình đẩy hệ A lên trước để kiểm chứng lõi chung với chi phí thấp, và **đặt mốc kiểm sau bước 21** để cân nhắc có nên dời phần nhập bài hát / sinh solo / tách tay sang đợt sau v1 hay không — quyết định có ý thức tại mốc đó, không mặc định là làm hết trong v1.
7. **Chỉ chạy client-side (quyết định để mở)** — v1 không cần backend vì chưa có yêu cầu tài khoản/chia sẻ. Nếu sau này cần đồng bộ tiến trình SRS/gamification giữa nhiều thiết bị, hoặc chia sẻ bài đã tái hòa âm cho người khác, sẽ cần một service đồng bộ nhẹ — **ghi nhận là không cần cho v1**.
