import { beforeEach, describe, expect, it } from 'vitest'
import { useMidiStore } from '../midiStore'

/** Đưa kho về trạng thái sạch trước mỗi test. */
beforeEach(() => {
  useMidiStore.setState({
    status: 'idle',
    errorMessage: null,
    devices: [],
    selectedDeviceId: null,
    heldNotes: [],
    velocities: {},
    lastEvent: null,
  })
})

const state = () => useMidiStore.getState()

describe('noteOn', () => {
  it('thêm nốt vào danh sách đang giữ', () => {
    state().noteOn(60, 100, 'hardware')
    expect(state().heldNotes).toEqual([60])
    expect(state().velocities[60]).toBe(100)
  })

  it('luôn xếp nốt từ thấp lên cao bất kể thứ tự bấm', () => {
    state().noteOn(67, 80, 'hardware')
    state().noteOn(60, 80, 'hardware')
    state().noteOn(64, 80, 'hardware')
    expect(state().heldNotes).toEqual([60, 64, 67])
  })

  it('bấm lại nốt đang giữ thì chỉ cập nhật lực nhấn, không nhân đôi', () => {
    state().noteOn(60, 60, 'hardware')
    state().noteOn(60, 110, 'hardware')
    expect(state().heldNotes).toEqual([60])
    expect(state().velocities[60]).toBe(110)
  })

  it('bỏ qua nốt nằm ngoài dải MIDI', () => {
    state().noteOn(-1, 100, 'hardware')
    state().noteOn(128, 100, 'hardware')
    expect(state().heldNotes).toEqual([])
  })

  it('ghi lại sự kiện gần nhất kèm nguồn phát', () => {
    state().noteOn(60, 100, 'onscreen')
    expect(state().lastEvent).toMatchObject({
      note: 60,
      velocity: 100,
      source: 'onscreen',
    })
  })
})

describe('noteOff', () => {
  it('gỡ nốt khỏi danh sách và xoá lực nhấn', () => {
    state().noteOn(60, 100, 'hardware')
    state().noteOff(60, 'hardware')
    expect(state().heldNotes).toEqual([])
    expect(state().velocities[60]).toBeUndefined()
  })

  it('chỉ gỡ đúng nốt được nhả', () => {
    state().noteOn(60, 100, 'hardware')
    state().noteOn(64, 100, 'hardware')
    state().noteOff(60, 'hardware')
    expect(state().heldNotes).toEqual([64])
  })

  it('nhả nốt chưa từng bấm thì không đổi gì', () => {
    state().noteOn(60, 100, 'hardware')
    const before = state().heldNotes
    state().noteOff(72, 'hardware')
    expect(state().heldNotes).toBe(before)
  })
})

describe('nốt từ đàn thật và bàn phím ảo dùng chung một kho', () => {
  it('hai nguồn cùng góp nốt vào một danh sách', () => {
    state().noteOn(60, 100, 'hardware')
    state().noteOn(64, 100, 'onscreen')
    expect(state().heldNotes).toEqual([60, 64])
  })

  it('nốt bấm bằng nguồn này nhả được bằng nguồn kia', () => {
    // Bấm trên bàn phím ảo rồi nhả bằng đàn thật vẫn phải sạch —
    // các phần phía sau không cần biết nốt đến từ đâu.
    state().noteOn(60, 100, 'onscreen')
    state().noteOff(60, 'hardware')
    expect(state().heldNotes).toEqual([])
  })
})

describe('releaseAll', () => {
  it('nhả sạch mọi nốt đang giữ', () => {
    state().noteOn(60, 100, 'hardware')
    state().noteOn(64, 100, 'hardware')
    state().releaseAll()
    expect(state().heldNotes).toEqual([])
    expect(state().velocities).toEqual({})
  })
})

describe('selectDevice', () => {
  it('đổi cổng thì nhả hết nốt để tránh nốt kẹt của cổng cũ', () => {
    state().noteOn(60, 100, 'hardware')
    state().selectDevice('thiet-bi-khac')
    expect(state().selectedDeviceId).toBe('thiet-bi-khac')
    expect(state().heldNotes).toEqual([])
  })
})

describe('setStatus', () => {
  it('lưu tình trạng kèm thông báo lỗi', () => {
    state().setStatus('denied', 'Bị chặn quyền')
    expect(state().status).toBe('denied')
    expect(state().errorMessage).toBe('Bị chặn quyền')
  })

  it('xoá thông báo lỗi cũ khi chuyển sang trạng thái bình thường', () => {
    state().setStatus('error', 'Có lỗi')
    state().setStatus('ready')
    expect(state().errorMessage).toBeNull()
  })
})
