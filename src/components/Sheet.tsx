import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="sheet-in pb-safe relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border-[1.5px] border-b-0 border-ink bg-card outline-none sm:max-w-md sm:rounded-3xl sm:border-b-[1.5px]"
      >
        <div className="sticky top-0 z-10 bg-card px-5 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
          {title && <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>}
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Yes/no confirmation built on Sheet. */
export function ConfirmSheet({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  busy,
}: {
  open: boolean
  onClose: () => void
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  busy?: boolean
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-[15px] leading-relaxed text-ink-2">{body}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="btn btn-ghost border-[1.5px] border-line" onClick={onClose}>
          {cancelLabel}
        </button>
        <button className="btn bg-stamp-red text-white hover:opacity-90" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
