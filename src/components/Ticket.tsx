import type { ReactNode } from 'react'

/** A card with ticket-stub notches on both sides. `notchAt` = distance of the notches from the top. */
export function Ticket({
  children,
  className = '',
  notchAt = '50%',
}: {
  children: ReactNode
  className?: string
  notchAt?: string
}) {
  return (
    <div className={`relative rounded-2xl border-[1.5px] border-ink bg-card ${className}`}>
      <span
        aria-hidden
        className="absolute -left-[11px] h-5 w-5 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-paper [clip-path:inset(0_0_0_50%)]"
        style={{ top: notchAt }}
      />
      <span
        aria-hidden
        className="absolute -right-[11px] h-5 w-5 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-paper [clip-path:inset(0_50%_0_0)]"
        style={{ top: notchAt }}
      />
      {children}
    </div>
  )
}
