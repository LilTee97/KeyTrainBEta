import { describe, expect, it } from 'vitest'
import { parseChordInput } from '../../input/chordInputParser'
import { brainInterludeWindow, endorsedProgressions } from '../interlude'
import { brainPassingSuggestions } from '../passing'
import { brainPhrase } from '../phrase'
import { brainLickPhrases } from '../lickyPhrases'
import { lickyPhrases, placeLick } from '../../licky/generate'
import { buildArrangedSong } from '../../style/arrangement'
import { brain } from '../index'
import type { SourceSection } from '../../style/arrangement'

/**
 * KeyTrain mở chỗ, não điền vào. Bài kiểm ở đây canh đúng một điều cho cả bốn
 * chỗ: **não im thì phần cũ của KeyTrain vẫn chạy**, và não chỉ nói khi trong
 * kho có căn cứ.
 */
const C_MAJOR = { tonic: 0 as const, scale: 'major' as const }
const chordsOf = (text: string) => parseChordInput(text).chords

describe('não chọn bốn hợp âm cho giang tấu', () => {
  it('chỉ nhận vòng hòa âm thầy Hải chỉ dùng cho đoạn dạo', () => {
    const endorsed = endorsedProgressions(brain().items)
    expect(endorsed.length).toBeGreaterThan(5)
    /*
      Bậc của hợp âm (1-3-5-7) và mẫu rải tay trái (1-5-1-3) không phải vòng
      hòa âm. Lọt vào đây là hiểu sai kho.
    */
    const shapes = endorsed.map((p) => p.degrees.join('-'))
    expect(shapes).not.toContain('1-3-5-7')
    expect(shapes.some((s) => s.includes('4-3-2-5'))).toBe(true)
  })

  it('vòng F Em Dm G được chọn vì đúng vòng 4-3-2-5 của thầy', () => {
    const chords = chordsOf('C Am Dm G C F Em Dm G')
    const pick = brainInterludeWindow({
      chords,
      key: C_MAJOR,
      nextChord: chords[0],
    })
    expect(pick).not.toBeNull()
    expect(chords.slice(pick!.from, pick!.to + 1).map((c) => c.source)).toEqual([
      'F',
      'Em',
      'Dm',
      'G',
    ])
    expect(pick!.authorizedBy.length).toBeGreaterThan(0)
  })

  it('không có giọng, hoặc vòng lạ, thì im để heuristic cũ chạy', () => {
    const chords = chordsOf('C Am Dm G')
    expect(brainInterludeWindow({ chords, key: null })).toBeNull()
    expect(
      brainInterludeWindow({ chords: chordsOf('Db Gb Ab Cb'), key: C_MAJOR }),
    ).toBeNull()
  })
})

describe('hợp âm lướt não đề xuất, đứng cạnh anh Khá', () => {
  it('đề xuất át 7b9 kéo về bậc thứ', () => {
    const out = brainPassingSuggestions({
      chords: chordsOf('C F Am G'),
      key: C_MAJOR,
    })
    const intoAm = out.find((s) => s.insertBeforeIndex === 2)
    expect(intoAm).toBeTruthy()
    expect(intoAm!.technique).toBe('hai-7b9')
    expect(intoAm!.chords[0].symbol).toBe('E7b9')
  })

  it('không chèn khi hợp âm trước đã là át của nó rồi', () => {
    const out = brainPassingSuggestions({
      chords: chordsOf('C E7 Am F'),
      key: C_MAJOR,
    })
    expect(out.some((s) => s.insertBeforeIndex === 2)).toBe(false)
  })

  it('không có giọng thì không đề xuất gì', () => {
    expect(brainPassingSuggestions({ chords: chordsOf('C Am'), key: null })).toEqual([])
  })
})

describe('đoạn dạo đầu và đoạn kết', () => {
  it('não soạn được nốt, và có item Kingsley cho phép', () => {
    for (const kind of ['intro', 'outro'] as const) {
      const made = brainPhrase({ kind, key: C_MAJOR })
      expect(made, kind).not.toBeNull()
      expect(made!.events.length, kind).toBeGreaterThan(0)
      expect(made!.authorizedBy.length, kind).toBeGreaterThan(0)
      expect(made!.lengthBeats, kind).toBeGreaterThan(0)
    }
  })

  it('đủ dày để nghe ra câu nhạc, và nốt nằm trong tầm đàn được', () => {
    /*
      Bản trước mỗi ô intro chỉ kêu hai nốt: các khối hợp âm in ra dạng
      "C4+E4+G4" mà không kèm số MIDI, nên chỗ này bỏ qua hết. Giờ não rải từng
      nốt một, và cả câu dạo mới thật sự vang.
    */
    for (const kind of ['intro', 'outro'] as const) {
      const made = brainPhrase({ kind, key: C_MAJOR })!
      expect(made.events.length, kind).toBeGreaterThanOrEqual(kind === 'intro' ? 24 : 12)

      for (const event of made.events) {
        expect(event.notes.length, `${kind} @ ${event.startBeat}`).toBe(1)
        expect(event.notes[0], `${kind} @ ${event.startBeat}`).toBeGreaterThanOrEqual(55)
        expect(event.notes[0], `${kind} @ ${event.startBeat}`).toBeLessThanOrEqual(80)
      }
    }
  })

  it('nốt intro thuộc đúng hợp âm của ô đó', () => {
    const made = brainPhrase({ kind: 'intro', key: C_MAJOR })!
    // Vòng mặc định I - V - vi - IV ở giọng Đô: C, G, Am, F.
    const perBar = [
      [0, 4, 7],
      [7, 11, 2],
      [9, 0, 4],
      [5, 9, 0],
    ]

    // Giọng Đô trưởng: mọi nốt phải nằm trong đây, không có nốt ngoài giọng.
    const scale = [0, 2, 4, 5, 7, 9, 11]

    for (const event of made.events) {
      const bar = Math.floor(event.startBeat / 4)
      const tones = perBar[bar]
      if (!tones) continue
      const pitch = ((event.notes[0] % 12) + 12) % 12
      const inBar = event.startBeat - bar * 4

      expect(scale, `ô ${bar + 1} @ phách ${event.startBeat}`).toContain(pitch)

      /*
        Hai nốt mở câu phải là **nốt hợp âm**: đó là chỗ tai nhận ra đang ở hợp
        âm nào. Phách 2 tới 2.5 là cụm sus của thầy Kingsley, và phách cuối ô ba
        là nốt dẫn sang hợp âm sau — hai chỗ đó cố ý nằm ngoài hợp âm, nhưng vẫn
        phải trong giọng, và câu trên đã canh điều đó.
      */
      if (inBar < 1) {
        expect(tones, `ô ${bar + 1} mở câu @ phách ${event.startBeat}`).toContain(pitch)
      }
    }
  })

  it('không có giọng thì trả null, KeyTrain không chèn đoạn nào', () => {
    expect(brainPhrase({ kind: 'intro', key: null })).toBeNull()
  })

  it('bước dạo đầu vào đúng đầu bài và chiếm đúng số phách', () => {
    const sources: SourceSection[] = [
      { name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 16 },
    ]
    const made = brainPhrase({ kind: 'intro', key: C_MAJOR })!
    const song = buildArrangedSong({
      accompaniment: [],
      fills: [],
      solo: () => [],
      sources,
      steps: [{ type: 'intro' }, { type: 'section', source: 0 }],
      phrase: (kind) => brainPhrase({ kind, key: C_MAJOR }),
    })
    // Đoạn hát lùi bằng độ dài dạo cộng nghỉ mặc định bốn phách.
    const verse = song.sections.find((s) => s.kind === 'verse')
    expect(verse?.startBeat).toBe(made.lengthBeats + 4)
    expect(song.events.some((e) => e.startBeat < made.lengthBeats)).toBe(true)
  })

  it('não im thì bước dạo chiếm 0 phách, bài vẫn chạy', () => {
    const sources: SourceSection[] = [
      { name: 'Phiên khúc', kind: 'verse', startBeat: 0, lengthBeats: 16 },
    ]
    const song = buildArrangedSong({
      accompaniment: [],
      fills: [],
      solo: () => [],
      sources,
      steps: [{ type: 'intro' }, { type: 'section', source: 0 }],
      phrase: () => null,
    })
    expect(song.sections.find((s) => s.kind === 'verse')?.startBeat).toBe(0)
  })
})

describe('câu Licky lấy từ não', () => {
  it('nối thêm vào sổ cũ, không thay câu nào', () => {
    const added = brainLickPhrases()
    expect(added.length).toBeGreaterThan(0)
    for (const phrase of added) expect(phrase.id).toMatch(/^brain-/)

    const book = lickyPhrases()
    // Sổ gốc còn nguyên: câu đầu tiên vẫn là câu của sổ cũ.
    expect(book[0].id).toBe('lick-01')
    expect(book.length).toBe(book.filter((p) => !p.id.startsWith('brain-')).length + added.length)
  })

  it('đặt được câu của não xuống dòng thời gian', () => {
    const chords = chordsOf('C Am')
    const notes = placeLick({
      chord: chords[0],
      next: chords[1],
      startBeat: 0,
      beats: 2,
      kind: 'fill',
      take: 0,
    })
    expect(notes.length).toBeGreaterThan(0)
  })
})

describe('não không chặn việc vẽ bài', () => {
  /*
    Đây là bài kiểm về **cấu trúc**, không phải về thời gian chạy.

    Yêu cầu là tái hòa âm của anh Khá hiện ra ngay, không đợi não. Cách chắc
    chắn nhất để giữ điều đó không phải là đo tốc độ, mà là không cho engine tái
    hòa âm biết tới bộ não: nó không import, thì không có gì để đợi. Mọi lời gọi
    não đều nằm ở lớp trên (`ReharmHome`), sau khi bài đã dựng xong.
  */
  it('engine tái hòa âm không import bộ não', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const dir = path.resolve(__dirname, '../../reharmEngine')

    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.ts')) continue
      const source = fs.readFileSync(path.join(dir, name), 'utf8')
      expect(source, name).not.toMatch(/from ['"][^'"]*\/brain\//)
      expect(source, name).not.toMatch(/from ['"]@pianobrain/)
    }
  })

  it('mọi lời gọi não đều đồng bộ, không có Promise nào để await', () => {
    // Trả về mảng/đối tượng ngay, không phải Promise: không có chỗ nào chặn.
    expect(brainPassingSuggestions({ chords: chordsOf('C Am'), key: C_MAJOR })).toBeInstanceOf(Array)
    expect(brainPhrase({ kind: 'intro', key: C_MAJOR })).not.toBeInstanceOf(Promise)
    expect(brainInterludeWindow({ chords: chordsOf('C Am Dm G'), key: C_MAJOR })).not.toBeInstanceOf(Promise)
  })
})
