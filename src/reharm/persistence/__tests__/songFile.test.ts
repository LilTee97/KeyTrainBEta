import { describe, expect, it } from 'vitest'
import type { StoredSong } from '../../../shared/persistence/db'
import type { SongSnapshot } from '../songSnapshot'
import { fileNameFor, packSong, readFileText, toFileText } from '../songFile'

/**
 * Chuyển bài giữa hai máy cùng chạy KeyTrain.
 *
 * Bài lưu trong máy nằm ở IndexedDB, mà kho đó gắn chặt với một trình duyệt
 * trên một máy — chép sang điện thoại thì không mang theo được.
 */

/*
  Chỉ điền những trường bài test cần tới; phần còn lại của ảnh chụp không ảnh
  hưởng gì tới việc đóng gói và đọc lại file.
*/
const snapshot = {
  version: 1 as const,
  sourceText: '[Phiên khúc]\nC G\nHôm qua anh thấy',
  transpose: 2,
  sectionMarks: [],
} as unknown as SongSnapshot

const song: StoredSong = {
  id: 'a',
  title: 'Người Ấy',
  sourceText: snapshot.sourceText,
  updatedAt: 1000,
  snapshot,
}

describe('xuất bài ra file', () => {
  it('đọc lại được đúng những gì đã xuất', () => {
    const parsed = readFileText(toFileText(song)!)

    expect(parsed?.title).toBe('Người Ấy')
    expect(parsed?.snapshot.sourceText).toBe(snapshot.sourceText)
  })

  it('giữ nguyên mọi lựa chọn đã dựng', () => {
    /*
      Đây là lý do dùng JSON chứ không phải MIDI hay MusicXML: hai định dạng
      kia chỉ chứa nốt nhạc, không có chỗ ghi cách chia đoạn hay thứ tự chơi.
    */
    const parsed = readFileText(toFileText(song)!)

    expect(parsed?.snapshot).toEqual(snapshot)
  })

  it('là văn bản đọc được bằng mắt', () => {
    // Xuống dòng và thụt lề để mở bằng trình soạn thảo cũng xem được
    expect(toFileText(song)).toContain('\n')
  })

  it('bài chưa có ảnh chụp thì không xuất được', () => {
    expect(toFileText({ ...song, snapshot: undefined })).toBeNull()
  })
})

describe('nhập bài từ file', () => {
  it('từ chối file không phải của KeyTrain', () => {
    /*
      Chọn nhầm file là chuyện thường, và nhầm thì phải nói rõ chứ không được
      nhận bừa rồi hỏng ở đâu đó phía sau.
    */
    expect(readFileText('{"format":"khac","version":1}')).toBeNull()
  })

  it('từ chối văn bản không phải JSON', () => {
    expect(readFileText('C Am F G')).toBeNull()
    expect(readFileText('')).toBeNull()
  })

  it('từ chối file thiếu tên bài', () => {
    const text = toFileText(song)!.replace('"Người Ấy"', '""')
    expect(readFileText(text)).toBeNull()
  })

  it('từ chối file có ảnh chụp hỏng', () => {
    const text = toFileText(song)!.replace('"version": 1,\n  "title"', '"version": 1,\n  "title"')
    const broken = JSON.parse(text)
    broken.snapshot.version = 99

    expect(readFileText(JSON.stringify(broken))).toBeNull()
  })
})

describe('tên file gợi ý', () => {
  it('lấy theo tên bài', () => {
    expect(fileNameFor('Người Ấy')).toBe('Người Ấy.keytrain.json')
  })

  it('bỏ ký tự Windows và Android không cho đặt tên', () => {
    expect(fileNameFor('A/B:C*D?E"F<G>H|I')).toBe('ABCDEFGHI.keytrain.json')
  })

  it('giữ dấu tiếng Việt', () => {
    // Cả hai hệ đều nhận, mà bỏ dấu thì tên bài đọc lên khó nhận ra
    expect(fileNameFor('Chờ Em Về')).toContain('Chờ Em Về')
  })

  it('tên rỗng thì vẫn ra một cái tên dùng được', () => {
    expect(fileNameFor('   ')).toBe('bai-hat.keytrain.json')
  })
})

describe('xuất bài đang dựng dở', () => {
  /*
    Nhận thẳng ảnh chụp chứ không đòi bài phải nằm sẵn trong kho: muốn cất bài
    ra máy thì không có lý do gì bắt phải lưu vào trình duyệt trước.
  */
  it('đóng gói được mà không cần qua kho', () => {
    const parsed = readFileText(packSong('Bài mới', snapshot))

    expect(parsed?.title).toBe('Bài mới')
    expect(parsed?.snapshot).toEqual(snapshot)
  })

  it('ra cùng nội dung với bài đã nằm trong kho', () => {
    // Hai đường xuất phải cho cùng một file, không thì file lệ thuộc lối đi
    expect(packSong(song.title, snapshot)).toBe(toFileText(song))
  })
})
