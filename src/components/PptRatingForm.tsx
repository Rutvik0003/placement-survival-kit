import { useState } from 'react'
import { useSavePptRating, type PptRating } from '../hooks/fun'
import { useToast } from './Toast'
import { pptCopy as c } from '../copy'

function Scale({
  label,
  emoji,
  value,
  onChange,
  captions,
}: {
  label: string
  emoji: string
  value: number | null
  onChange: (v: number) => void
  captions: readonly string[]
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label mb-1">{label}</span>
        <span className="text-[12.5px] text-muted">{value ? captions[value - 1] : ''}</span>
      </div>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5`}
            onClick={() => onChange(n)}
            className={`grid h-11 flex-1 place-items-center rounded-xl border text-[22px] transition-[opacity,transform,border-color] active:scale-90 ${
              value && n <= value ? 'border-ink/30 bg-highlight/30 opacity-100' : 'border-line bg-card opacity-35 grayscale'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14.5px]">{label}</span>
      <div className="inline-grid shrink-0 grid-cols-2 rounded-lg border border-line bg-card p-0.5">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`h-8 rounded-md px-3.5 text-[13px] font-medium ${value === v ? 'bg-ink text-paper' : 'text-ink-2'}`}
          >
            {v ? c.yes : c.no}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PptRatingForm({ eventId, initial, onDone }: { eventId: string; initial?: PptRating; onDone?: () => void }) {
  const [r, setR] = useState<PptRating>(
    initial ?? { event_id: eventId, snacks_rating: null, length_rating: null, could_be_email: null, ran_over: null },
  )
  const save = useSavePptRating()
  const toast = useToast()
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-card p-4">
      <p className="font-display text-[17px] font-semibold">{c.title}</p>
      <Scale label={c.snacks} emoji="🥟" value={r.snacks_rating} captions={c.snacksScale} onChange={(v) => setR({ ...r, snacks_rating: v })} />
      <Scale label={c.length} emoji="🥱" value={r.length_rating} captions={c.lengthScale} onChange={(v) => setR({ ...r, length_rating: v })} />
      <YesNo label={c.email} value={r.could_be_email} onChange={(v) => setR({ ...r, could_be_email: v })} />
      <YesNo label={c.ranOver} value={r.ran_over} onChange={(v) => setR({ ...r, ran_over: v })} />
      <div className="flex gap-2 pt-1">
        {onDone && (
          <button type="button" className="btn btn-ghost h-10 flex-1 border border-line text-[14px]" onClick={onDone}>
            {c.skip}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary h-10 flex-[2] text-[14px]"
          disabled={save.isPending}
          onClick={async () => {
            await save.mutateAsync(r)
            toast.show({ message: c.saved })
            onDone?.()
          }}
        >
          {c.save}
        </button>
      </div>
    </div>
  )
}
