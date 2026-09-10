/** Một lượt soạn cho mỗi lần nghe; dựng lại để lưu/hiển thị không tiêu thêm lượt. */
export function createPhraseTakeSequence(initial = 0) {
  let next = initial
  return {
    start(count = 1) {
      const width = Math.max(1, Math.floor(count))
      const first = next
      next += width
      return (pass: number) => {
        const take = first + Math.max(0, Math.floor(pass)) * width
        next = Math.max(next, take + width)
        return take
      }
    },
  }
}
