import { beforeEach, describe, expect, it } from 'vitest'
import type { SongSnapshot } from '../../persistence/songSnapshot'
import { usePracticeStore } from '../practiceStore'

/**
 * Đường nối giữa tab Luyện đệm và tab Tái hoà âm.
 *
 * Tab Luyện đệm mở bài bằng cách **nhờ** tab kia dựng lại, chứ không tự dựng:
 * ảnh chụp chỉ ghi lựa chọn của người dùng, còn dòng thời gian phải đi qua cả
 * chuỗi luật tái hoà âm nằm bên tab kia. Chép chuỗi ấy sang đây thì có hai bản
 * và hai bản sẽ lệch nhau ngay lần sửa luật kế tiếp.
 */

const snapshot = { version: 1, sourceText: 'C Am F G' } as unknown as SongSnapshot

describe('kho bài dùng chung giữa hai tab', () => {
  beforeEach(() => {
    usePracticeStore.setState({ song: null, request: null })
  })

  it('lời nhờ mở bài đứng chờ cho tới khi có người nhận', () => {
    usePracticeStore.getState().requestOpen({ snapshot, id: 'a', title: 'Bài A' })

    expect(usePracticeStore.getState().request?.title).toBe('Bài A')
  })

  it('nhận xong thì lời nhờ mất đi, không dựng lại hai lần', () => {
    usePracticeStore.getState().requestOpen({ snapshot, id: 'a', title: 'Bài A' })
    usePracticeStore.getState().clearRequest()

    expect(usePracticeStore.getState().request).toBeNull()
  })

  it('nhờ mở bài không tự thay bài đang tập', () => {
    /*
      Bài đang tập chỉ đổi khi tab kia dựng xong và đăng lại. Nếu đổi ngay lúc
      nhờ thì khung luyện tập trống một nhịp giữa lúc nhờ và lúc dựng xong.
    */
    usePracticeStore.setState({
      song: {
        id: 'cũ',
        title: 'Bài cũ',
        timeline: [],
        voicings: [],
        beatsPerChord: 4,
        perBeat: [],
        meter: 4,
      },
    })

    usePracticeStore.getState().requestOpen({ snapshot, id: 'a', title: 'Bài A' })

    expect(usePracticeStore.getState().song?.title).toBe('Bài cũ')
  })

  it('bài mở từ file chưa có khoá trong kho', () => {
    usePracticeStore.getState().requestOpen({ snapshot, id: null, title: 'Từ file' })

    expect(usePracticeStore.getState().request?.id).toBeNull()
  })
})
