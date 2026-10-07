import type { CheckinMood } from '../lib/types'
import { checkinCopy as c } from '../copy'

const MOODS: CheckinMood[] = ['nailed', 'survived', 'dont_ask']

/** One-tap verdict: 🔥 / 😐 / 💀. `size="lg"` for the full check-in screen. */
export function MoodPicker({
  value,
  onPick,
  disabled,
  size = 'sm',
}: {
  value: CheckinMood | null
  onPick: (m: CheckinMood) => void
  disabled?: boolean
  size?: 'sm' | 'lg'
}) {
  const lg = size === 'lg'
  return (
    <div className={`grid grid-cols-3 ${lg ? 'gap-3' : 'gap-2'}`} role="radiogroup" aria-label={c.title}>
      {MOODS.map((m) => {
        const active = value === m
        return (
          <button
            key={m}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onPick(m)}
            className={`flex flex-col items-center justify-center rounded-2xl border transition-[transform,background-color,border-color] active:scale-95 disabled:opacity-60 ${
              lg ? 'h-32 gap-2' : 'h-20 gap-1'
            } ${active ? 'border-ink bg-highlight/50' : 'border-line bg-card hover:border-ink/40'}`}
          >
            <span className={lg ? 'text-[44px] leading-none' : 'text-[26px] leading-none'}>{c.moods[m].emoji}</span>
            <span className={`font-medium ${lg ? 'text-[15px]' : 'text-[12.5px]'}`}>{c.moods[m].label}</span>
          </button>
        )
      })}
    </div>
  )
}
