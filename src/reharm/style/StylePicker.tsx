import { styleFamilies, removeStyle, getVisibleStyles } from './styleLibrary'
import { isBalladStyle } from './balladFamily'
import type { StylePattern } from './types'
import { useEffect, useRef, useState } from 'react'

interface StylePickerProps {
  styles: readonly StylePattern[]
  selectedId: string
  onSelect: (id: string) => void
}

const METER_ORDER = ['4/4', '3/4', '6/8', '2/4', '12/8']

function meterRank(ts: string): number {
  const at = METER_ORDER.indexOf(ts)
  return at < 0 ? 99 : at
}

export function StylePicker({
  selectedId,
  onSelect,
}: StylePickerProps) {
  const [, setRefreshKey] = useState(0)
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const styles = getVisibleStyles()
  const selected = styles.find((style) => style.id === selectedId) ?? styles[0]
  const meters = [
    ...new Set(styles.map((style) => style.timeSignature)),
  ].sort((a, b) => meterRank(a) - meterRank(b))

  const familyStyles = styles.filter(
    (style) => style.family === selected?.family,
  )

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  async function deleteStyle(id: string) {
    await removeStyle(id)
    setMenu(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      {meters.map((meter) => {
        const inMeter = styles.filter((style) => style.timeSignature === meter)
        const families = styleFamilies(inMeter)
        return (
          <div key={meter} className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] tracking-[0.08em] text-dim uppercase">
              {meter}
            </p>
            <div className="flex flex-wrap gap-2">
              {families.map((entry) => {
                const active = entry.styles.some((style) => style.id === selectedId)
                const ballad = entry.styles.some((style) => isBalladStyle(style.id))
                return (
                  <button
                    key={`${meter}-${entry.family}`}
                    type="button"
                    onClick={() => onSelect(entry.styles[0].id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenu({ id: entry.styles[0].id, x: e.clientX, y: e.clientY })
                    }}
                    title={entry.styles[0].note}
                    className={`cursor-context-menu rounded-lg border px-3 py-1.5 text-xs ${
                      active
                        ? ballad
                          ? 'border-teal-key bg-teal-key/20 text-teal-key'
                          : 'border-amber-key bg-amber-key/15 text-amber-key'
                        : ballad
                          ? 'border-teal-key/40 bg-teal-key/5 text-teal-key/80 hover:bg-teal-key/12'
                          : 'border-line bg-white/4 text-dim hover:bg-white/8'
                    }`}
                  >
                    {entry.familyName}
                    {entry.styles.length > 1 && (
                      <span className="ml-1 font-mono text-[9px] opacity-60">
                        {entry.styles.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {familyStyles.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {familyStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenu({ id: style.id, x: e.clientX, y: e.clientY })
              }}
              title={style.note}
              className="cursor-context-menu rounded-md border px-2 py-1 font-mono text-[11px] border-line bg-white/3 text-dim hover:bg-white/8"
            >
              {style.name}
            </button>
          ))}
        </div>
      )}

      {menu && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', left: menu.x, top: menu.y }}
          className="z-50 rounded-md border border-line bg-zinc-900 p-1 text-xs shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => deleteStyle(menu.id)}
            className="block w-full rounded px-3 py-1.5 text-left text-red-400 hover:bg-red-500/15"
          >
            Xóa điệu
          </button>
        </div>
      )}
    </div>
  )
}
