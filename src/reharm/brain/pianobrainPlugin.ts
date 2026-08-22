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
