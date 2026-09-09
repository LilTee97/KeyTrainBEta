import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Ghi `Nguon.json` — sổ ghi các câu dạo đã phát và bình luận về chúng.
 *
 * ## Vì sao phải là plugin của máy chủ dev
 *
 * Trang web không tự ghi file lên đĩa được. Muốn có một file `Nguon.json` THẬT, mở bằng
 * trình soạn thảo mà đọc được, thì phải có ai đó ở phía máy chủ ghi hộ. Vite đã chạy sẵn
 * một máy chủ khi phát triển, nên gắn thêm vài đường vào đó là xong — không thêm phụ
 * thuộc, không dựng máy chủ riêng.
 *
 * **Chỉ chạy khi `npm run dev`.** Bản dựng tĩnh (GitHub Pages) không có máy chủ nào để
 * ghi, nên ở đó `luuCauDao` gọi sẽ hỏng và phía client bỏ qua trong im lặng. Đó là chủ
 * ý: sổ này để soi trong lúc luyện, không phải tính năng cho người dùng cuối.
 *
 * ## Bảng
 *
 * Người dùng yêu cầu lưu **theo kiểu bảng**, nên file có hai bảng nối nhau bằng `stt`:
 *
 * - `cau` — mỗi dòng là MỘT câu dạo khác nhau
 * - `binhLuan` — mỗi dòng là một ý kiến, trỏ về `cauStt`
 *
 * Mỗi bảng có `cot` (tên cột) và `dong` (các dòng, đúng thứ tự cột ấy). Đọc bằng mắt
 * hay đổ vào bảng tính đều được.
 *
 * ## Một câu phát nhiều lần thì KHÔNG đẻ dòng mới
 *
 * Mỗi lần bấm phát nay soạn một câu dạo MỚI, nên phần lớn lần phát sẽ đẻ một dòng mới —
 * đúng ý người dùng. Phép gộp này là lưới chắn cho những lần thật sự ra câu trùng: bài
 * ít hợp âm, đoạn dạo ngắn, hoặc vốn ô trong bảng tuyến quá mỏng.
 *
 * Trùng khít câu đã có thì chỉ **ghi thêm một mốc thời gian** vào cột `lanPhat` của
 * chính dòng ấy. Không có lưới này thì sổ đầy dòng trùng nhau và bình luận không biết
 * gắn vào đâu.
 */

const TEN_FILE = 'Nguon.json'

/** Cột của bảng `cau`. Thêm cột thì thêm vào cuối, đừng chèn giữa. */
const COT_CAU = [
  'stt',
  'tao',
  'bai',
  'giong',
  'dieu',
  'soO',
  'soNot',
  'lanPhat',
  'not',
  /**
   * `'on'` · `'chua-on'` · `''` khi người dùng chưa chấm.
   *
   * Người dùng tick "Đã ổn" thì câu được **giữ lại**; tick "Chưa ổn" thì mới mở ô cho
   * họ viết ý kiến. Chấm nằm ở bảng `cau` chứ không ở `binhLuan`, vì nó là nhận xét về
   * CÂU chứ không phải một mẩu ý kiến — một câu chỉ có một chấm, mà có thể có nhiều ý.
   */
  'danhGia',
  /**
   * Vòng hợp âm của chính câu dạo, theo ký hiệu, đúng thứ tự ô.
   *
   * Thiếu cột này thì muốn trả lời một câu hỏi đơn giản như *"intro đã tạo vòng hợp âm
   * trên giọng thứ chưa"* phải chạy lại code để dựng lại vòng — mà vòng dựng lại chưa
   * chắc trùng vòng đã phát, vì nó phụ thuộc lượt. Lưu thẳng là đọc thẳng.
   */
    'hopAm',
    /** `'intro'` · `'interlude'`. Cột mới — dòng cũ không có thì coi là intro. */
    'doan',
  ] as const

/** Cột của bảng `binhLuan`. */
const COT_BINH_LUAN = ['stt', 'cauStt', 'luc', 'yKien'] as const

export type Bang = { cot: readonly string[]; dong: unknown[][] }
export type So = { format: string; version: 1; cau: Bang; binhLuan: Bang }

export const soRong = (): So => ({
  format: 'keytrain-nguon',
  version: 1,
  cau: { cot: [...COT_CAU], dong: [] },
  binhLuan: { cot: [...COT_BINH_LUAN], dong: [] },
})

function doc(duong: string): So {
  try {
    const s = JSON.parse(fs.readFileSync(duong, 'utf8')) as So
    if (s?.cau?.dong && s?.binhLuan?.dong) return s
  } catch {
    /* Chưa có file, hoặc file hỏng — bắt đầu lại từ sổ rỗng. */
  }
  return soRong()
}

const ghi = (duong: string, so: So) =>
  fs.writeFileSync(duong, `${JSON.stringify(so, null, 2)}\n`, 'utf8')

/**
 * Thêm một câu dạo vào sổ.
 *
 * Câu trùng khít câu đã có thì KHÔNG đẻ dòng mới — chỉ ghi thêm một mốc phát vào dòng
 * cũ. Đo 20 lần bấm liên tiếp thì ra 20 câu khác nhau, nên đây là lưới chắn cho ca hiếm
 * chứ không phải đường đi thường ngày.
 */
export function themCau(
  so: So,
  than: Record<string, unknown>,
  luc: string,
): {
  stt: number
  moi: boolean
  lanPhat: number
  giong: string
  doan: string
  dieu: string
} {
  const giong = String(than.giong ?? '')
  const doan = than.doan === 'interlude' ? 'interlude' : 'intro'
  const dieu = String(than.dieu ?? '')
  /*
    So bằng NỐT, không so bằng hợp âm: hai câu khác nhau vẫn có thể đứng trên cùng một
    vòng hợp âm, mà thứ người dùng nghe và chấm là câu chứ không phải vòng.
  */
  const van = JSON.stringify(than.not ?? null)
  const cu = so.cau.dong.find((d) => JSON.stringify(d[8]) === van)
  if (cu) {
    ;(cu[7] as string[]).push(luc)
    return {
      stt: cu[0] as number,
      moi: false,
      lanPhat: (cu[7] as string[]).length,
      giong,
      doan,
      dieu,
    }
  }
  const stt = so.cau.dong.length + 1
  so.cau.dong.push([
    stt,
    luc,
    than.bai ?? '',
    giong,
    than.dieu ?? '',
    than.soO ?? 0,
    Array.isArray(than.not) ? than.not.length : 0,
    [luc],
    than.not ?? [],
    '',
    than.hopAm ?? [],
    doan,
  ])
  return { stt, moi: true, lanPhat: 1, giong, doan, dieu }
}

/**
 * Chấm một câu là "đã ổn" hay "chưa ổn".
 *
 * Ghi đè chấm cũ: nghe lại rồi đổi ý là chuyện thường, và giữ hai chấm ngược nhau trên
 * cùng một câu thì không ai đọc ra được câu ấy rốt cuộc thế nào.
 */
export function chamCau(so: So, cauStt: number, danhGia: string): { cauStt: number; danhGia: string } | null {
  if (danhGia !== 'on' && danhGia !== 'chua-on') return null
  const dong = so.cau.dong.find((d) => d[0] === cauStt)
  if (!dong) return null
  dong[9] = danhGia
  return { cauStt, danhGia }
}

/** Thêm một ý kiến, trỏ về `cauStt`. Trả `null` khi thiếu dữ liệu. */
export function themBinhLuan(
  so: So,
  cauStt: number,
  yKien: string,
  luc: string,
): { stt: number; cauStt: number } | null {
  const chu = yKien.trim()
  if (!Number.isFinite(cauStt) || cauStt <= 0 || chu === '') return null
  const stt = so.binhLuan.dong.length + 1
  so.binhLuan.dong.push([stt, cauStt, luc, chu])
  return { stt, cauStt }
}

async function docThan(req: { on: (e: string, f: (c?: unknown) => void) => void }) {
  const manh: string[] = []
  await new Promise<void>((xong) => {
    req.on('data', (c) => manh.push(String(c)))
    req.on('end', () => xong())
  })
  try {
    return JSON.parse(manh.join('')) as Record<string, unknown>
  } catch {
    return null
  }
}

export function nguonJson(goc: string): Plugin {
  const duong = path.join(goc, TEN_FILE)
  return {
    name: 'keytrain-nguon-json',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__nguon', (req, res) => {
        const tra = (ma: number, data: unknown) => {
          res.statusCode = ma
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(data))
        }

        if (req.method === 'GET') {
          tra(200, doc(duong))
          return
        }
        if (req.method !== 'POST') {
          tra(405, { loi: 'chỉ nhận GET và POST' })
          return
        }

        void (async () => {
          const than = await docThan(req as never)
          if (!than) {
            tra(400, { loi: 'thân yêu cầu không phải JSON' })
            return
          }
          const so = doc(duong)

          const luc = new Date().toISOString()

          /* /__nguon/cham — tick "Đã ổn" hoặc "Chưa ổn" cho một câu. */
          if ((req.url ?? '').startsWith('/cham')) {
            const ra = chamCau(so, Number(than.cauStt), String(than.danhGia ?? ''))
            if (!ra) {
              tra(400, { loi: 'thiếu cauStt hoặc danhGia' })
              return
            }
            ghi(duong, so)
            tra(200, ra)
            return
          }

          /* /__nguon/binh-luan — gắn ý kiến vào một câu đã lưu. */
          if ((req.url ?? '').startsWith('/binh-luan')) {
            const ra = themBinhLuan(so, Number(than.cauStt), String(than.yKien ?? ''), luc)
            if (!ra) {
              tra(400, { loi: 'thiếu cauStt hoặc yKien' })
              return
            }
            ghi(duong, so)
            tra(200, ra)
            return
          }

          /* /__nguon/cau — lưu một câu dạo vừa phát. */
          const ra = themCau(so, than, luc)
          ghi(duong, so)
          tra(200, ra)
        })()
      })
    },
  }
}
