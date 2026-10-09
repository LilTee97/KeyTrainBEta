import { describe, expect, it } from 'vitest'
import type { Hop } from './giaiThich'
import { docBacMau, hopCuaMau, hopDoan, laMa, LOI_TONG_HOP, MAU_VONG, nhanVong, tongHop, type BaiSheet } from './nhanVong'
import vongSheet from './vongSheet.json'

const H = (s: string): Hop[] => s.split(' ').map((t) => docBacMau(t).hop)
const sheet = vongSheet as unknown as Record<string, BaiSheet[]>

describe('nhanVong — nhận vòng phổ biến', () => {
  it('mọi bậc mẫu đọc được thành hợp âm đánh theo', () => {
    for (const m of MAU_VONG) expect(hopCuaMau(m)).toHaveLength(m.bac.length)
    expect(H('iiø7 ♭iii°7 V? III7')).toEqual([
      { goc: 2, chat: 'm7b5' },
      { goc: 3, chat: 'dim7' },
      { goc: 7, chat: '' },
      { goc: 4, chat: '7' },
    ])
  })

  it('vòng lặp nhận cả khi bắt đầu từ giữa: vi–IV–I–V là vòng trục xoay từ vi', () => {
    expect(nhanVong(H('vi IV I V'), false)).toMatchObject([{ id: 'truc', tu: 0, den: 3, xoay: 2, songSong: false }])
  })

  it('bài thứ nhận vòng giọng trưởng qua giọng song song: ♭VI–♭VII–v–i là Royal Road, ♭VI–♭VII–i–v thì không', () => {
    expect(nhanVong(H('♭VI ♭VII v i'), true)).toMatchObject([{ id: 'royal', songSong: true, xoay: 0 }])
    expect(nhanVong(H('♭VI ♭VII i v'), true)).toMatchObject([{ id: 'aeolian', tu: 0, den: 2 }])
    expect(nhanVong(H('i ♭VI ♭III ♭VII'), true)).toMatchObject([{ id: 'truc', songSong: true, xoay: 2 }])
  })

  it('chuỗi quãng 5 cho chen một hợp âm (dạng verse Người hãy quên em đi)', () => {
    const r = nhanVong(H('i iv ♭VII ♭III ♭VI iv ii° V i'), true)
    expect(r).toMatchObject([{ id: 'quang-5', tu: 0, den: 8, chen: [5] }])
    expect(r[0]!.ten).toBe('Chuỗi quãng 5 — 8 hợp âm')
  })

  it('dài bằng nhau thì mẫu có tên thắng chuỗi quãng 5; dài hơn thì chuỗi thắng', () => {
    expect(nhanVong(H('vi ii V I'), false)).toMatchObject([{ id: '1625', xoay: 1 }])
    expect(nhanVong(H('iii vi ii V I'), false)).toMatchObject([{ id: 'quang-5', tu: 0, den: 4 }])
  })

  it('ii–V–I đúng tên; II–V–I (át của át) là chuỗi 3 hợp âm về chủ; chuỗi 3 không về chủ thì không nhận', () => {
    expect(nhanVong(H('ii V I'), false)).toMatchObject([{ id: 'ii-v-i' }])
    expect(nhanVong(H('II V I'), false)).toMatchObject([{ id: 'quang-5', ten: 'Chuỗi quãng 5 — 3 hợp âm' }])
    expect(nhanVong(H('vi ii V'), false)).toEqual([])
  })

  it('khúc không chồng nhau, khúc dài trước: vòng Canon đủ 8 thắng nửa đầu', () => {
    expect(nhanVong(H('I V vi iii IV I IV V'), false)).toMatchObject([{ id: 'canon', tu: 0, den: 7 }])
    expect(nhanVong(H('I V vi iii I'), false)).toMatchObject([{ id: 'canon-nua', tu: 0, den: 3 }])
  })

  it('sus khớp cả trưởng lẫn thứ; bậc mẫu giảm nhận cả thứ; chất lệch họ thì không khớp', () => {
    expect(nhanVong([{ goc: 2, chat: 'm7' }, { goc: 7, chat: '7sus4' }, { goc: 0, chat: 'maj7' }], false)).toMatchObject([{ id: 'ii-v-i' }])
    expect(nhanVong(H('ii V i'), true)).toMatchObject([{ id: 'ii-v-i-thu' }])
    expect(nhanVong(H('I V VI IV'), false)).toEqual([])
  })

  it('khung 12 ô gộp ô lặp: I7 IV7 I7 V7 IV7 I7', () => {
    expect(nhanVong(H('I7 IV7 I7 V7 IV7 I7'), false)).toMatchObject([{ id: 'blues-12', tu: 0, den: 5 }])
  })
})

describe('vòng trong sheet các thầy (vongSheet.json)', () => {
  it('đủ 18 bài (Linh Nhi 8 · Cà Pháo 7 · Blues 3), mọi đoạn nhận được mà không lỗi', () => {
    expect([sheet['linh-nhi']!.length, sheet['ca-phao']!.length, sheet['blues']!.length]).toEqual([8, 7, 3])
    for (const ds of Object.values(sheet)) {
      const t = tongHop(ds)
      expect(t.phu).toBeLessThanOrEqual(t.soHop)
      expect(t.soDoan).toBe(ds.reduce((s, b) => s + b.doan.length, 0))
    }
  })

  it('Rockhouse có 2 khung 12 ô sạch (đo theo ô nhịp)', () => {
    expect(sheet['blues']![0]!.khung12).toEqual([
      { o: 32, kieu: 'chuẩn', khop: 12 },
      { o: 44, kieu: 'chuẩn / đổi nhanh', khop: 11 },
    ])
  })

  it('mọi con số trong lời tổng hợp đúng với số đo (đổi số đo thì viết lại lời)', () => {
    const t = (k: string) => tongHop(sheet[k]!)
    const dong = (k: string, id: string) => t(k).theoMau.find((m) => m.id === id)!
    const ln = t('linh-nhi')
    expect([ln.phu, ln.soHop, ln.soDoan, dong('linh-nhi', 'quang-5').doan, dong('linh-nhi', 'ba-chinh-thu').doan, dong('linh-nhi', '1625').doan]).toEqual([155, 605, 35, 11, 11, 7])
    expect(dong('linh-nhi', 'just-two').lan).toBe(3)
    expect(LOI_TONG_HOP['linh-nhi']).toContain('155/605 hợp âm (26%)')
    const cp = t('ca-phao')
    expect([cp.phu, cp.soHop, cp.soDoan, dong('ca-phao', 'aeolian').doan, dong('ca-phao', 'aeolian').lan]).toEqual([175, 380, 29, 9, 13])
    expect(LOI_TONG_HOP['ca-phao']).toContain('175/380 hợp âm (46%)')
    const quen = sheet['ca-phao']!.find((b) => b.bai === 'Người hãy quên em đi')!.doan[0]!
    expect(nhanVong(hopDoan(quen), true)[0]).toMatchObject({ id: 'quang-5', ten: 'Chuỗi quãng 5 — 12 hợp âm' })
    const chua = sheet['ca-phao']!.find((b) => b.bai.startsWith('Chưa Bao Giờ'))!.doan.find((d) => d.ten === 'prechorus')!
    expect(nhanVong(hopDoan(chua), true).map((k) => k.id)).toContain('royal')
    expect([dong('blues', 'ba-chinh').doan, dong('blues', 'ba-chinh').lan, dong('blues', 'quay-dau-giam').lan, dong('blues', 'rising-sun').lan]).toEqual([2, 10, 3, 2])
  })

  it('đuôi ♭VI–ii°–V–i có ở Dung Xa Em Đêm Nay và Một Cõi Đi Về (ví dụ trong lời Linh Nhi)', () => {
    const coDuoi = (ten: string) =>
      sheet['linh-nhi']!.find((b) => b.bai === ten)!.doan.some((d) => {
        const hop = hopDoan(d)
        return nhanVong(hop, true).some((k) => k.id === 'quang-5' && Array.from({ length: k.den - k.tu + 1 }, (_, j) => k.tu + j).filter((j) => !k.chen.includes(j)).map((j) => laMa(hop[j]!)).join(' ').includes('♭VI ii° V i'))
      })
    expect([coDuoi('Dung Xa Em Dem Nay'), coDuoi('Mot Coi Di Ve')]).toEqual([true, true])
  })
})
