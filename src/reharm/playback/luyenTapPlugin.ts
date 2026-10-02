import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Ghi `LuyenTap.json` — nhật ký chế độ chơi theo nhịp (Lộ trình tập, GĐ 0).
 *
 * Cùng lối với `Nguon.json` (`nguon/nguonPlugin.ts`): trang web không tự ghi đĩa được nên máy chủ dev ghi hộ;
 * chỉ chạy khi `npm run dev`, bản dựng tĩnh thì phía client bỏ qua trong im lặng. Có nó để Claude đọc SỐ ĐO
 * THẬT trên tay người dùng rồi mới chốt ngưỡng cửa đạt (`Reference/KE-HOACH-LUYEN-TAP.md` mục 2).
 *
 * Kiểu bảng như `Nguon.json` (người dùng muốn lưu theo bảng): `luot` — mỗi dòng một lượt chơi; `doTre` — mỗi
 * dòng một lần đo độ trễ. Thêm cột thì thêm vào cuối.
 */

const TEN_FILE = 'LuyenTap.json'

export const COT = {
  luot: [
    'stt', 'luc', 'bai', 'tay', 'bpm', 'phanTram', 'doTreMs',
    'tong', 'trung', 'thua', 'lechTrungViMs', 'lechTuyetDoiMs',
    /** Lệch từng nốt trúng, ms (âm = sớm). */
    'lechMs',
    /** Nốt trượt: [phách, nốt MIDI]. */
    'truot',
    /** Phím thừa: [phách, nốt MIDI]. */
    'phimThua',
    /** Mọi phím đã bấm: [phách, nốt MIDI, lực] — thêm 2/10/2026, dòng cũ không có. */
    'phim',
    /** Trình duyệt nhận tín hiệu đàn → app xử lý, từng phím, ms — thêm 2/10/2026. */
    'xuLyMs',
  ],
  doTre: ['stt', 'luc', 'bpm', 'doTreMs', 'daoDongMs', 'soLanGo', 'lechMs', 'xuLyMs'],
} as const

type TenBang = keyof typeof COT
type Bang = { cot: readonly string[]; dong: unknown[][] }
type So = { format: 'keytrain-luyen-tap'; version: 1 } & Record<TenBang, Bang>

const soRong = (): So => ({
  format: 'keytrain-luyen-tap',
  version: 1,
  luot: { cot: [...COT.luot], dong: [] },
  doTre: { cot: [...COT.doTre], dong: [] },
})

function doc(duong: string): So {
  try {
    const so = JSON.parse(fs.readFileSync(duong, 'utf8')) as So
    if (so?.luot?.dong && so?.doTre?.dong) {
      // Cột chỉ thêm vào cuối, nên dòng tiêu đề lấy theo mã là đúng cho cả dòng cũ (dòng cũ ngắn hơn, thiếu cột mới).
      so.luot.cot = [...COT.luot]
      so.doTre.cot = [...COT.doTre]
      return so
    }
  } catch {
    /* Chưa có file, hoặc file hỏng — bắt đầu từ sổ rỗng. */
  }
  return soRong()
}

/** Thêm một dòng theo đúng thứ tự cột; `stt` và `luc` do máy chủ đặt. */
export function themDong(so: So, bang: TenBang, than: Record<string, unknown>, luc: string): number {
  const stt = so[bang].dong.length + 1
  so[bang].dong.push(
    COT[bang].map((cot) => (cot === 'stt' ? stt : cot === 'luc' ? luc : (than[cot] ?? null))),
  )
  return stt
}

export function luyenTapJson(goc: string): Plugin {
  const duong = path.join(goc, TEN_FILE)
  return {
    name: 'keytrain-luyen-tap-json',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__luyen-tap', (req, res) => {
        const tra = (ma: number, data: unknown) => {
          res.statusCode = ma
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(data))
        }
        if (req.method === 'GET') return tra(200, doc(duong))
        if (req.method !== 'POST') return tra(405, { loi: 'chỉ nhận GET và POST' })

        const bang: TenBang | null = (req.url ?? '').startsWith('/luot')
          ? 'luot'
          : (req.url ?? '').startsWith('/do-tre')
            ? 'doTre'
            : null
        if (!bang) return tra(404, { loi: 'chỉ có /luot và /do-tre' })

        const manh: string[] = []
        req.on('data', (c) => manh.push(String(c)))
        req.on('end', () => {
          let than: Record<string, unknown>
          try {
            than = JSON.parse(manh.join('')) as Record<string, unknown>
          } catch {
            return tra(400, { loi: 'thân yêu cầu không phải JSON' })
          }
          const so = doc(duong)
          const stt = themDong(so, bang, than, new Date().toISOString())
          fs.writeFileSync(duong, `${JSON.stringify(so, null, 2)}\n`, 'utf8')
          tra(200, { stt })
        })
      })
    },
  }
}
