/**
 * Cách gom các loại hợp âm thành nhóm cho người học chọn phạm vi luyện.
 *
 * Nhóm ở đây là nhóm theo cảm nhận người chơi, không phải theo phân loại
 * nhạc lý chặt chẽ — mục đích là để chọn "hôm nay luyện gì" cho dễ, và để
 * thống kê xem mình yếu nhóm nào.
 */
export interface QualityGroup {
  label: string
  ids: string[]
}

export const QUALITY_GROUPS: readonly QualityGroup[] = [
  { label: 'Hợp âm ba', ids: ['maj', 'min'] },
  { label: 'Giảm & tăng', ids: ['dim', 'aug'] },
  { label: 'Treo', ids: ['sus2', 'sus4'] },
  { label: 'Hợp âm bảy', ids: ['maj7', '7', 'm7'] },
  { label: 'Nửa giảm & bảy giảm', ids: ['m7b5', 'dim7'] },
  { label: 'Sáu & thêm nốt', ids: ['6', 'm6', 'add9'] },
  { label: 'Mở rộng', ids: ['maj9', '9', 'm9', 'm11'] },
  { label: 'Treo mở rộng', ids: ['7sus4', '9sus4'] },
]

const GROUP_BY_QUALITY_ID = new Map<string, string>()
for (const group of QUALITY_GROUPS) {
  for (const id of group.ids) {
    GROUP_BY_QUALITY_ID.set(id, group.label)
  }
}

/**
 * Nhóm chứa một loại hợp âm.
 * Loại hợp âm chưa được xếp nhóm nào thì gom vào 'Khác', để thống kê không
 * mất dấu — ví dụ hợp âm biến âm sinh ra từ phần tái hòa âm.
 */
export function groupLabelFor(qualityId: string): string {
  return GROUP_BY_QUALITY_ID.get(qualityId) ?? 'Khác'
}

/** Các loại hợp âm thuộc những nhóm đã chọn. */
export function qualityIdsForGroups(labels: readonly string[]): string[] {
  return QUALITY_GROUPS.filter((group) => labels.includes(group.label)).flatMap(
    (group) => group.ids,
  )
}
