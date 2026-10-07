import type { ReactNode } from 'react'

export function PageHeader({ kicker, title, right }: { kicker?: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pb-5 pt-2 lg:pb-8 lg:pt-4">
      <div className="min-w-0">
        {kicker && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{kicker}</p>}
        <h1 className="mt-1 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.03em] lg:text-[44px]">
          {title}
        </h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}
