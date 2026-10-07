import { useState } from 'react'
import { loadingLines, pick } from '../copy'

export function Loading({ fullscreen = false }: { fullscreen?: boolean }) {
  const [line] = useState(() => pick(loadingLines))
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-4 px-8 text-center ${fullscreen ? 'min-h-dvh' : 'py-20'}`}
    >
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-marker"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <p className="max-w-xs font-mono text-[13px] text-muted">{line}</p>
    </div>
  )
}
