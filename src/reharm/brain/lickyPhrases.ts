import { brain, generateFill } from './index'
import type { LickNote, LickPhrase } from '../licky/types'

/**
 * Thêm câu của thầy Kingsley vào **sổ Licky đang có**, không dựng sổ thứ hai.
 *
 * Sổ `phrases.json` là hình interval rút từ một tập lick jazz, và nó giữ nguyên
 * — kể cả dòng ghi nguồn. Mấy câu dưới đây chỉ nối thêm vào cuối lúc chạy, nên
 * không có chuyện đè lên câu cũ hay làm lẫn nguồn: id bắt đầu bằng `brain-`,
 * nhãn ghi thẳng tên thầy.
 *
 * ## Nốt lấy ở đâu
 *
 * Không gõ tay bảng bậc nào cả. Mỗi câu là **kết quả thật** của `generateFill`
 * bên PianoBrain: đưa cho não một vòng hai ô đúng kiểu để nó chọn công thức
 * mình muốn, rồi đọc nốt nó trả về. Nhờ vậy câu ở đây không thể lệch khỏi luật
 * trong kho — sửa luật bên kho là câu bên này đổi theo, và nếu item Kingsley
 * biến mất thì `authorized_by` rỗng, câu bị bỏ, sổ Licky quay về đúng như cũ.
 *
 * `1-7-5-3` chỉ ra khi ô trước bậc vi đúng là bậc I, nên vòng hỏi phải là
 * `I -> vi`. `V -> vi` cho ra `preceding 3-2-1`, đúng chỗ G sang Am.
 */
interface Recipe {
  id: string
  label: string
  progression: [string, string]
}

const RECIPES: Recipe[] = [
  { id: 'brain-kingsley-1753', label: 'Kingsley 1-7-5-3', progression: ['I', 'vi'] },
  { id: 'brain-kingsley-4316', label: 'Kingsley 4-3-1-6', progression: ['I', 'IV'] },
  { id: 'brain-kingsley-321', label: 'Kingsley 3-2-1', progression: ['V', 'vi'] },
]

/** Nốt của não -> hình interval mà sổ Licky dùng, tính từ nốt đầu câu. */
function toPhrase(recipe: Recipe, midis: number[], durs: number[]): LickPhrase | null {
  if (midis.length < 3) return null

  let at = 0
  const notes: LickNote[] = midis.map((midi, index) => {
    const note: LickNote = {
      interval: midi - midis[0],
      dur: durs[index],
      at,
    }
    at += durs[index]
    return note
  })

  return {
    id: recipe.id,
    label: recipe.label,
    kind: 'fill',
    span: at,
    notes,
  }
}

/** "1/16" -> 0,25 phách. */
const beatsOfDur = (dur: string): number => {
  const denominator = Number(dur.split('/')[1])
  return Number.isFinite(denominator) && denominator > 0 ? 4 / denominator : 0.5
}

let cached: LickPhrase[] | null = null

/**
 * Câu Licky lấy từ não. Kho không cho phép câu nào thì trả mảng rỗng và sổ
 * Licky chạy y như trước.
 */
export function brainLickPhrases(): readonly LickPhrase[] {
  if (cached) return cached

  const out: LickPhrase[] = []
  for (const recipe of RECIPES) {
    try {
      const plan = generateFill(
        { key: 'C', progression: [...recipe.progression] },
        brain(),
      )
      // Không có item Kingsley nào cho phép: bỏ câu này, không tự chế.
      if (!plan || plan.authorized_by.length === 0 || plan.bars.length === 0) continue

      const rh = plan.bars[0].rh.filter(
        (note): note is typeof note & { midi: number } =>
          note.midi !== undefined && note.note !== null,
      )
      const phrase = toPhrase(
        recipe,
        rh.map((note) => note.midi),
        rh.map((note) => beatsOfDur(note.dur)),
      )
      /*
        Bỏ câu trùng hình.

        Sổ Licky chỉ giữ khoảng cách giữa các nốt chứ không giữ cao độ, mà
        `1-7-5-3` dựng trên bậc I và `4-3-1-6` dựng trên bậc I ra đúng cùng một
        chuỗi khoảng cách (0, -1, -5, -8). Giữ cả hai thì sổ có hai câu y hệt
        nhau và bốc trúng chúng nhiều gấp đôi câu khác.
      */
      const shape = phrase && phrase.notes.map((n) => n.interval).join(',')
      if (phrase && !out.some((p) => p.notes.map((n) => n.interval).join(',') === shape)) {
        out.push(phrase)
      }
    } catch {
      // Não vấp thì bỏ đúng câu đó, sổ Licky vẫn dùng được.
    }
  }

  cached = out
  return cached
}
