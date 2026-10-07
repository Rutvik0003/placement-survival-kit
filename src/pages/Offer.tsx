import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CompanyTile } from '../components/Stamps'
import { useCompany } from '../hooks/queries'
import { celebrate } from '../lib/confetti'
import { pick } from '../copy/pick'
import { offerCopy as c } from '../copy'

/** The fake award ceremony. Shown when a company moves to "Offer". */
export default function Offer() {
  const { id } = useParams()
  const { data: company } = useCompany(id)
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  const [line] = useState(() => pick(c.lines))

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1600)
    const t2 = setTimeout(() => {
      setStage(2)
      celebrate()
    }, 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-[#14130f] px-6 text-center text-[#efe9dc]">
      {/* Spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: stage ? 1 : 0.4,
          background: 'radial-gradient(ellipse 60% 50% at 50% 42%, color-mix(in oklab, var(--highlight) 22%, transparent), transparent 70%)',
        }}
      />
      <p className="relative font-mono text-[12px] uppercase tracking-[0.3em] text-white/60">🏆 Placement Awards {new Date().getFullYear()}</p>
      <h1 className="relative mt-6 font-display text-[clamp(30px,7vw,56px)] font-bold leading-tight tracking-[-0.03em]">{c.drumroll}</h1>

      <div className="relative mt-8 h-[180px]">
        {stage >= 1 && (
          <p className="stamp-in font-display text-[clamp(64px,18vw,140px)] font-extrabold leading-none tracking-[-0.05em] text-[#f4e04d]">
            {c.reveal}
          </p>
        )}
      </div>

      <div className={`relative transition-all duration-700 ${stage === 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        {company && (
          <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
            <CompanyTile company={company} size={44} />
            <div className="text-left">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">{c.from}</p>
              <p className="font-display text-[20px] font-semibold">
                {company.name}
                {company.ctc_lpa != null && <span className="font-sans text-[15px] font-normal text-white/60"> · {company.ctc_lpa} LPA</span>}
              </p>
            </div>
          </div>
        )}
        <p className="mx-auto mt-6 max-w-sm text-[15px] text-white/70">{line}</p>
        <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link to="/graveyard" className="btn bg-[#ff4f1f] text-white">
            🪦🎉 {c.toGraveyard}
          </Link>
          <Link to={company ? `/companies/${company.id}` : '/'} className="btn text-white/70 hover:bg-white/10">
            {c.done}
          </Link>
        </div>
      </div>
    </div>
  )
}
