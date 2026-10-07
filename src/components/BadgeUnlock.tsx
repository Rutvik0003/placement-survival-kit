import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { celebrate } from '../lib/confetti'
import { BADGE_KEYS, type BadgeKey } from '../lib/fun'
import { badgeDefs, badgesCopy as c } from '../copy'

/** Full-screen "Badge unlocked" moment. Shows one badge; `remaining` drives the button label. */
export function BadgeUnlock({
  badge,
  remaining,
  total,
  onNext,
}: {
  badge: BadgeKey
  remaining: number
  total: number
  onNext: () => void
}) {
  const d = badgeDefs[badge]

  useEffect(() => {
    const t = setTimeout(celebrate, 650)
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && onNext()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [badge, onNext])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={c.unlocked(d.name)}>
      <div key={badge} className="relative flex w-full max-w-sm flex-col items-center text-center text-white">
        {/* Light rays */}
        <div aria-hidden className="badge-rays pointer-events-none absolute left-1/2 top-[92px] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2" />

        {/* Medal */}
        <div className="badge-drop relative mt-2" style={{ perspective: '600px' }}>
          <div className="relative grid h-[168px] w-[168px] place-items-center rounded-full border-4 border-[#16140f] bg-[radial-gradient(circle_at_35%_30%,#fff6b8,#f4e04d_45%,#d9a520)] shadow-[0_0_0_6px_#f4e04d55,0_20px_60px_#f4e04d55]">
            <div className="absolute inset-3 rounded-full border-2 border-dashed border-[#16140f]/25" />
            <span className="relative text-[84px] leading-none drop-shadow-[0_4px_0_rgba(0,0,0,.18)]">{d.emoji}</span>
            <div aria-hidden className="badge-shine absolute inset-0 overflow-hidden rounded-full" />
          </div>
          {/* Ribbon tails */}
          <svg aria-hidden viewBox="0 0 120 70" className="absolute -bottom-12 left-1/2 -z-10 w-28 -translate-x-1/2">
            <path d="M18 0 L48 0 L40 70 L30 56 L18 66 Z" fill="#ff4f1f" stroke="#16140f" strokeWidth="3" />
            <path d="M72 0 L102 0 L102 66 L90 56 L80 70 Z" fill="#2f5bd3" stroke="#16140f" strokeWidth="3" />
          </svg>
        </div>

        <p className="badge-text mt-16 font-mono text-[12px] font-semibold uppercase tracking-[0.3em] text-[#ff6a3d]">Badge unlocked</p>
        <h2 className="badge-text mt-2 font-display text-[32px] font-bold leading-tight tracking-[-0.03em]" style={{ animationDelay: '.75s' }}>
          {d.name}
        </h2>
        <p className="badge-text mt-1 text-[15px] text-white/70" style={{ animationDelay: '.85s' }}>
          {d.how}
        </p>
        <p className="badge-text mt-3 font-mono text-[11px] uppercase tracking-widest text-white/50" style={{ animationDelay: '.95s' }}>
          {c.progress(total, BADGE_KEYS.length)}
        </p>

        <div className="badge-text mt-8 flex w-full gap-2" style={{ animationDelay: '1.05s' }}>
          <Link to="/badges" onClick={onNext} className="btn h-12 flex-1 border border-white/25 text-white hover:bg-white/10">
            {c.seeAll}
          </Link>
          <button autoFocus onClick={onNext} className="btn h-12 flex-1 bg-[#f4e04d] font-semibold text-[#16140f] hover:brightness-95">
            {remaining > 0 ? c.next(remaining) : c.nice}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
