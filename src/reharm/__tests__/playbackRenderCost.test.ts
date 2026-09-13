import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { expect, it } from 'vitest'
import { soloRange } from '../fillSoloGenerator/soloGenerator'

it('tầm solo giữ cùng tham chiếu khi con trỏ phát cập nhật, kể cả Trần 84', () => {
  for (const open of [false, true]) {
    const first = soloRange(open)
    expect(first).toEqual({ low: 62, high: open ? 84 : 79 })
    for (let tick = 0; tick < 100; tick++) expect(soloRange(open)).toBe(first)
  }
})

it('không soạn lại solo/fill ngay trong JSX mỗi móc kép chỉ để hiện thống kê', () => {
  // Kiểm chỗ gọi thật, không mock bộ soạn: nốt có thể đúng mà audio vẫn giật
  // nếu JSX chạy lại generateSolo/CP plan hàng chục ms mỗi lần con trỏ đổi.
  const file = ts.createSourceFile('ReharmHome.tsx',
    readFileSync(new URL('../ReharmHome.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const offenders: string[] = []
  const generators = new Set(['soloTake', 'fills', 'cpPlan', 'buildPass', 'generateSolo', 'planCpLicks'])
  function visit(node: ts.Node, inJsx = false) {
    const inside = inJsx || ts.isJsxElement(node) || ts.isJsxFragment(node)
    if (inside && ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
      generators.has(node.expression.text)) offenders.push(node.getText(file))
    ts.forEachChild(node, child => visit(child, inside))
  }
  visit(file)
  expect(offenders).toEqual([])
})
