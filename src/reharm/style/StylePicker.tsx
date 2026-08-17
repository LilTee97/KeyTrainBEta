import { styleFamilies } from './styleLibrary'
import type { StylePattern } from './types'

interface StylePickerProps {
  styles: readonly StylePattern[]
  selectedId: string
  onSelect: (id: string) => void
}

export function StylePicker({
  styles,
  selectedId,
  onSelect,
}: StylePickerProps) {
  const families = styleFamilies(styles)
  const selected = styles.find((style) => style.id === selectedId) ?? styles[0]
  const open = families.find((entry) => entry.family === selected?.family)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {families.map((entry) => {
          const active = entry.family === selected?.family
          return (
            <button
              key={entry.family}
              type="button"
              onClick={() => onSelect(entry.styles[0].id)}
              title={entry.styles[0].note}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                active
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
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

      {open && open.styles.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {open.styles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              title={style.note}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                style.id === selectedId
                  ? 'border-amber-key bg-amber-key/20 text-amber-key'
                  : 'border-line bg-white/3 text-dim hover:bg-white/8'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
