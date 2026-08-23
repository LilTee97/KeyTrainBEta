import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Nạp kho kiến thức PianoBrain vào app mà **không chép** file nào sang đây.
 *
 * PianoBrain là bộ não, sống ở repo riêng. Bộ nạp gốc của nó dùng `node:fs`,
 * chạy được trong terminal chứ không chạy trong trình duyệt. Plugin này đọc
 * kho một lần lúc dựng, gói thành một module ảo, rồi app import module đó như
 * import một file bình thường.
 *
 * Vì vậy: không có 800 file JSON nào bị chép sang KeyTrain, không có máy chủ,
 * và app vẫn chạy hẳn khi mất mạng.
 *
 * ## Kho đổi thì phải nạp lại
 *
 * Module ảo được Vite giữ trong bộ nhớ, nên sửa kho bên PianoBrain mà không báo
 * gì thì trình duyệt vẫn đọc bản cũ **cho tới khi khởi động lại dev server**.
 * Chuyện đó đã đánh lừa một lần thật: rà xong 28 item gam thành `validated`,
 * test bên terminal xanh hết, mà app vẫn báo "kho chưa có gam" cho cả bốn hợp
 * âm — vì trong trình duyệt chúng vẫn đang là `draft`.
 *
 * `configureServer` bên dưới trông chừng thư mục kho: đổi một file JSON là
 * module ảo bị bỏ, trang tự nạp lại. Rà một item xong nhìn app là thấy ngay.
 */
export const PIANOBRAIN_KNOWLEDGE = 'virtual:pianobrain-knowledge'

/** Mặc định nằm cạnh KeyTrain. Đặt PIANOBRAIN_ROOT nếu để chỗ khác. */
export function pianobrainRoot(keyTrainRoot: string): string {
  return process.env.PIANOBRAIN_ROOT ?? path.resolve(keyTrainRoot, '..', 'PianoBrain')
}

function walkJson(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walkJson(full, out)
    else if (full.endsWith('.json')) out.push(full)
  }
  return out
}

export function readKnowledge(root: string): { items: unknown[]; sources: unknown[]; coverage: unknown } {
  const items = walkJson(path.join(root, 'knowledge')).map((file) =>
    JSON.parse(fs.readFileSync(file, 'utf8')),
  )
  const indexFile = path.join(root, 'sources', 'index.json')
  const index = fs.existsSync(indexFile)
    ? (JSON.parse(fs.readFileSync(indexFile, 'utf8')) as {
        sources?: unknown[]
        coverage?: unknown
      })
    : {}
  return {
    items,
    sources: index.sources ?? [],
    coverage: index.coverage ?? { skipped: [], incomplete: [] },
  }
}

export function pianobrainKnowledge(keyTrainRoot: string): Plugin {
  const root = pianobrainRoot(keyTrainRoot)
  const resolved = `\0${PIANOBRAIN_KNOWLEDGE}`

  return {
    name: 'pianobrain-knowledge',
    resolveId: (id) => (id === PIANOBRAIN_KNOWLEDGE ? resolved : null),

    configureServer(server) {
      const watched = [path.join(root, 'knowledge'), path.join(root, 'sources')]
      for (const dir of watched) {
        if (fs.existsSync(dir)) server.watcher.add(dir)
      }

      const refresh = (file: string) => {
        if (!file.endsWith('.json')) return
        if (!watched.some((dir) => file.startsWith(dir))) return

        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
        server.config.logger.info(`  kho PianoBrain đổi → nạp lại (${path.basename(file)})`)
      }

      server.watcher.on('change', refresh)
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
    load(id) {
      if (id !== resolved) return null
      if (!fs.existsSync(path.join(root, 'knowledge'))) {
        // Không có não thì app vẫn chạy, chỉ là tab Mr Hải nói kho trống.
        this.warn(`Không thấy kho PianoBrain ở ${root}. Đặt PIANOBRAIN_ROOT nếu để chỗ khác.`)
        return 'export const items = []\nexport const sources = []\nexport const coverage = { skipped: [], incomplete: [] }\n'
      }
      const { items, sources, coverage } = readKnowledge(root)
      return [
        `export const items = ${JSON.stringify(items)}`,
        `export const sources = ${JSON.stringify(sources)}`,
        `export const coverage = ${JSON.stringify(coverage)}`,
      ].join('\n')
    },
  }
}
