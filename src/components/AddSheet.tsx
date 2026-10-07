import { Link } from 'react-router-dom'
import { Sheet } from './Sheet'
import { IconChevron, IconCompanies, IconToday } from './Icons'
import { addCopy as c } from '../copy'

/** The "+" button's menu: add a company on its own, or an event. */
export function AddSheet({ open, onClose, companyId }: { open: boolean; onClose: () => void; companyId?: string }) {
  const options = [
    { to: '/companies/new', icon: IconCompanies, title: c.company.title, hint: c.company.hint, tone: 'bg-highlight/50 text-ink' },
    {
      to: companyId ? `/events/new?company=${companyId}` : '/events/new',
      icon: IconToday,
      title: companyId ? c.event.titleHere : c.event.title,
      hint: c.event.hint,
      tone: 'bg-marker/15 text-marker',
    },
  ]
  return (
    <Sheet open={open} onClose={onClose} title={c.title}>
      <ul className="space-y-2">
        {options.map(({ to, icon: Icon, title, hint, tone }) => (
          <li key={to}>
            <Link
              to={to}
              onClick={onClose}
              className="flex items-center gap-4 rounded-2xl border border-line bg-paper px-4 py-3.5 transition-colors hover:border-ink/40"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon width={22} height={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[17px] font-semibold tracking-tight">{title}</span>
                <span className="block text-[13.5px] leading-snug text-muted">{hint}</span>
              </span>
              <IconChevron width={18} height={18} className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
