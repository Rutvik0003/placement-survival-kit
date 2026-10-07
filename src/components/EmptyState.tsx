import type { ReactNode } from 'react'

/** A note pinned to a notice board — used for every empty screen. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rise relative mx-auto mt-6 max-w-md">
      <div className="relative rotate-[-0.6deg] rounded-xl border-[1.5px] border-dashed border-line bg-card/70 px-6 pb-6 pt-8 text-center">
        <span
          aria-hidden
          className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-marker shadow-[0_2px_0_var(--ink)]"
        />
        <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted">{body}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}
