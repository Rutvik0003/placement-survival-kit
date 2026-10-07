import { IconBell, IconPlusSquare, IconShare } from './Icons'
import { installCopy as c } from '../copy'

const icons = { share: IconShare, plus: IconPlusSquare, bell: IconBell }

/** The "Add to Home Screen" walkthrough for iPhone Safari. */
export function IosInstallGuide() {
  return (
    <div>
      <ol className="space-y-2.5">
        {c.ios.steps.map((s) => {
          const Icon = icons[s.icon as keyof typeof icons]
          return (
            <li key={s.n} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-paper-2 text-stamp-blue">
                <Icon width={18} height={18} />
              </span>
              <span className="text-[14.5px] leading-snug">{s.text}</span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-[12.5px] leading-snug text-muted">{c.ios.note}</p>
    </div>
  )
}
