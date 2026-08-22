# Gam jazz của kho vào tới câu giang tấu

Nối tầng thang âm của PianoBrain vào bộ sinh câu solo, và sửa hai lỗi bộ lọc
giọng phát hiện ra trên đường nối.

## Vì sao

Kho PianoBrain có 40 item mang tập bậc thang âm rút từ 13 bài giảng jazz, nhưng
**không dòng code nào đọc `semitones_from_root`**. `interludeMaterial` có sẵn khe
`extra` ghi rõ là "thang âm jazz hoặc blues do bên gọi đưa vào", mà chỗ gọi duy
nhất không truyền gì — và tầng nốt hợp âm luôn đủ ba nốt nên khe ấy không bao giờ
tới lượt. Đo được: `G7b9` ra đúng bốn nốt y hệt `G7`.

## Đo được, trước và sau

Bài giọng Đô, đoạn giang tấu:

| hợp âm | trước | sau (bật công tắc "Gam jazz của kho") | gam |
|---|---|---|---|
| Cmaj7 | C E G B | C D E F# G A B | C Lydian |
| Am7 | A C E G | A B C D E F# G | A Dorian |
| G7 | G B D F | G A B C D E F F# | G Bebop Dominant |
| G7b9 | G B D F | G Ab Bb B Db D E F | G Dominant Diminished |
| Bm7b5 | B D F A | B Db D E F G A | B Half-Diminished |
| Cdim7 | C Eb Gb A | C D Eb F Gb Ab A B | C Diminished |
| Ebmaj7 | **F G C** | Eb F G A Bb C D | Eb Lydian |

Dòng `Ebmaj7` là lỗi, không phải thiếu tính năng — xem dưới.

## Ba thay đổi

### 1. Nốt của chính hợp âm không đi qua bộ lọc giọng

`interludeMaterial` từng chạy `keepInKey(chordTonesStrict(chord), key)`. Trên hợp
âm mượn, bộ lọc cắt gần hết: `Ebmaj7` trong bài giọng Đô mất Mi giáng, Si giáng
lẫn Rê, tụt xuống tầng ngũ cung, trả về **Fa Sol Đô** — câu chạy không còn một
nốt nào của hợp âm đang vang dưới tay trái. `G7b9` cũng mất nốt La giáng vì lý do
ấy, nên nghe y hệt `G7`.

Hợp âm là hoà âm đang kêu; nó không cần xin phép giọng của bài. Bỏ bộ lọc ở tầng
này. Hợp âm nằm trong giọng thì không đổi gì.

Bộ lọc giọng **giữ nguyên** ở tầng ngũ cung và tầng thang âm của giọng.

### 2. Khe `extra` được thông, và nó không lọc giọng

Gam jazz đứng **đầu** thay vì nằm sau ngũ cung — đặt nó dưới tầng nốt hợp âm là
viết một tầng chết. An toàn vì `scaleFor` bên PianoBrain đã kiểm gam trả về
**chứa đủ nốt của hợp âm**: nó là tập rộng hơn nốt hợp âm, không phải tập khác.

Không lọc giọng ở tầng này, vì thứ làm nên chất jazz chính là nốt ngoài giọng:
#11 của Lydian, b9 và #9 của gam altered, bậc 7 tự nhiên của bebop. Lọc xong thì
còn lại đúng thang âm của giọng, tức là không dùng gam nào cả.

Vùng nốt chung của cả đoạn (`tones`) cũng mở theo gam — nó là bộ lọc cuối, dựng
nó bằng nốt hợp âm rồi cắt gam qua nó thì nốt jazz bị chặn ở cửa sau.

### 3. Công tắc riêng: "Gam jazz của kho — chờ rà"

`SoloNoteSource` có thêm giá trị `jazzScale`, nhưng nó **không** nằm trong
`NOTE_SOURCE_OPTIONS`. Ba nút của hàng "lấy nốt từ đâu" là ba cách dựng nốt từ
chính hợp âm, ngang hàng nhau, và cách nào cũng ra tiếng. Gam jazz khác loại: nó
đọc kho, chỉ chạy ở đoạn không lời, và im lặng trên hợp âm nào kho chưa có gam —
mà đó là phần lớn hợp âm nhạc pop. Xếp nó thành nút thứ tư là nói với người dùng
rằng bốn thứ này cùng loại.

Nó là một ô tick riêng ngay dưới hàng nút. `ReharmHome` giữ `jazzScales` rồi tính
`soloNoteSource = jazzScales ? 'jazzScale' : noteSource` để đưa cho bộ sinh câu.

Không khoá theo họ ballad như hai công tắc dưới nó: gam jazz dùng được ở mọi
điệu, và ballad là chỗ ít cần nó nhất. Bật lên thì có thêm một dòng nhắc rằng
item còn draft. Trạng thái được lưu vào `SongSnapshot.jazzScales`; bài lưu từ
trước khi có công tắc đọc ra `undefined` và mặc định tắt.

## Item còn draft: không vào tiếng mặc định

Cả 104 item của nguồn `jazz-scales` đang ở `status: "draft"` — đã rút từ video
thật nhưng chưa ai xem lại để đối chiếu. Theo `brain/gate.ts`, `origin:
"extracted"` là đủ để phát tiếng, nên nếu nối thẳng thì kiến thức chưa rà sẽ tự
thành tiếng đàn.

Chốt: **mode riêng**, không siết `DEFAULT_SOUND_MODE`.

- `generateSolo` nhận `jazzScale?: (chord) => PitchClass[] | null`. Không truyền
  thì hành vi y hệt bản cũ.
- Truyền rồi vẫn chưa đủ: hàm chỉ được gọi khi người dùng bật công tắc "Gam jazz
  của kho". Mặc định tắt.
- Chỉ chạy ở **đoạn không lời**. Câu lót chen giữa lời không đọc nguồn nốt này —
  chỗ đó giọng hát là giai điệu, thêm #11 và b9 vào là giành chỗ người hát.
- Nhãn ghi thẳng "chờ rà" cạnh ô tick, và bật lên thì có một dòng nhắc rằng
  item chưa ai đối chiếu lại video.

Muốn siết hẳn thì `scaleFor(..., { requireValidated: true })` — hiện trả `null`
cho mọi hợp âm, đúng như mong đợi khi chưa rà item nào.

## Không bịa

`jazzScaleFor` trả `null` khi kho chưa có gam cho chất hợp âm đang hỏi, và đó là
phần lớn hợp âm nhạc pop: hợp âm ba nốt, `sus2`, `sus4`, `add9` chưa nguồn nào
dạy gam. Hợp âm ấy quay về nốt hợp âm như cũ, không lấy gam của chất gần giống.

## File đụng tới

**KeyTrain**

- `src/reharm/brain/jazzScale.ts` — mới. Cầu nối duy nhất sang `scaleFor`, không
  ném lỗi, kho trống thì trả `null`.
- `src/reharm/fillSoloGenerator/soloVocabulary.ts` — `interludeMaterial`: bỏ lọc
  giọng ở tầng nốt hợp âm, đưa `extra` lên đầu và không lọc nó.
- `src/reharm/fillSoloGenerator/soloGenerator.ts` — `SoloNoteSource` thêm
  `jazzScale`; `SoloOptions.jazzScale`; luồn qua `materialFor` (4 chỗ gọi) và qua
  vùng nốt chung của đoạn.
- `src/reharm/ReharmHome.tsx` — công tắc `jazzScales` + `soloNoteSource`; truyền
  `jazzScale: jazzScaleFor` vào hai chỗ gọi `generateSolo` của đoạn giang tấu;
  ô tick riêng dưới hàng nút "lấy nốt từ đâu"; lưu / nạp lại trạng thái.
- `src/reharm/persistence/songSnapshot.ts` — thêm `jazzScales?: boolean`.
- `src/reharm/fillSoloGenerator/__tests__/jazzScaleMaterial.test.ts` — mới, 12 test.
- `src/reharm/fillSoloGenerator/__tests__/soloGenerator.test.ts` — kiểm hàng nút
  vẫn đúng ba mục, `jazzScale` không được lọt vào, id không trùng.

**PianoBrain** (bước 1 và 2, cùng loạt)

- `src/migrate/importJazzScales.ts` — ingest bài 5-13; gốc gam lấy từ tên gam;
  `for_qualities`; chặn câu nhạc mẫu bị nhận nhầm thành thang âm.
- `src/migrate/reviewHaiScales.ts` — mới. Rà tay 11 item thang âm của thầy Hải.
- `src/mrhai/scaleFor.ts` — mới. Bộ chọn gam.
- `src/mrhai/chords.ts` — thêm chất hợp âm biến âm (`7alt`, `7#5`, `m(maj7)`…).
- `src/tests/scale-for.test.ts`, `src/tests/jazz-scales.test.ts`.

## Kiểm

- KeyTrain: `1784 pass / 2 fail` — hai lỗi có sẵn từ trước loạt này
  (`fillVariation.test.ts`, `interludeBacking.test.ts`), không liên quan.
- `tsc -b` sạch, `vite build` sạch.
- PianoBrain: `236 pass / 0 fail`, `tsc` sạch.
