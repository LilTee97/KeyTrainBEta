import { coverage, items, sources } from 'virtual:pianobrain-knowledge'
import { askMrHai } from '@pianobrain/mrhai/answer.js'
import { reply } from '@pianobrain/mrhai/chat.js'
import { generateFill, generateIntro, generateOutro } from '@pianobrain/mrhai/fill.js'
import { vocalFromText } from '@pianobrain/mrhai/parse.js'
import type { KnowledgeBase, KnowledgeItem } from '@pianobrain/kb/types.js'

/**
 * Cửa duy nhất KeyTrain đi vào bộ não PianoBrain.
 *
 * Phân vai đã chốt: **PianoBrain lo suy luận và kiến thức, KeyTrain lo tay** —
 * phát tiếng, MIDI, giao diện. Não không phát audio, không đụng Tone.js, và
 * không biết KeyTrain tồn tại. Mọi thứ dưới đây chỉ là đọc.
 *
 * Kho nạp một lần rồi dùng lại: dựng `byId` cho 800 item mỗi lần gọi thì phí.
 */
let cached: KnowledgeBase | null = null

export function brain(): KnowledgeBase {
  if (!cached) {
    const list = items as KnowledgeItem[]
    cached = {
      items: list,
      sources: sources as KnowledgeBase['sources'],
      coverage,
      byId: new Map(list.map((item) => [item.id, item])),
    }
  }
  return cached
}

/** Kho có sẵn không. Chưa cài PianoBrain thì tab Mr Hải nói thẳng là chưa có não. */
export const brainReady = (): boolean => brain().items.length > 0

/** Một dòng tóm tắt kho, để hiện ở đầu tab chat. */
export function brainSummary(): string {
  const kb = brain()
  const teachers = new Set(
    kb.items.map((i) => i.source?.teacher_id).filter((t): t is string => Boolean(t)),
  )
  return `${kb.items.length} item · ${kb.sources.length} nguồn · ${teachers.size} thầy`
}

/**
 * Hỏi Mr Hải bằng câu tiếng Việt, y như chat trong terminal của PianoBrain.
 *
 * Câu hỏi là chữ người dùng gõ, muốn thế nào cũng được, nên não vấp là chuyện
 * bình thường. Vấp thì nói ra chứ **không được ném lỗi**: hàm này chạy trong
 * lúc React dựng giao diện, ném ở đây là trắng cả trang.
 */
export function ask(text: string): string[] {
  if (!brainReady()) {
    return ['Chưa nạp được kho PianoBrain. Kiểm tra thư mục D:\\PianoBrain hoặc biến PIANOBRAIN_ROOT.']
  }
  try {
    return reply(text, brain())
  } catch (error) {
    return [
      'Thầy chưa đọc được câu này — não vấp giữa chừng, không phải kho thiếu kiến thức.',
      `  (${error instanceof Error ? error.message : String(error)})`,
      '  Thử gõ gọn lại, ví dụ "câu lót C G Am F" hoặc "bossa nova tay trái".',
    ]
  }
}

export { askMrHai, generateFill, generateIntro, generateOutro, vocalFromText }
export type { KnowledgeBase, KnowledgeItem }
