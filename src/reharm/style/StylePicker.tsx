import { styleFamilies } from './styleLibrary'
import type { StylePattern } from './types'

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
  styles,
  selectedId,
  onSelect,
}: StylePickerProps) {
  const selected = styles.find((style) => style.id === selectedId) ?? styles[0]
  const meters = [
    ...new Set(styles.map((style) => style.timeSignature)),
  ].sort((a, b) => meterRank(a) - meterRank(b))

  const familyStyles = styles.filter(
    (style) => style.family === selected?.family,
  )

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
                return (
                  <button
                    key={`${meter}-${entry.family}`}
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
