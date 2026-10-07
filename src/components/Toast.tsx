import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Toast = { id: number; message: string; action?: { label: string; onClick: () => void }; duration?: number }
type ToastApi = { show: (t: Omit<Toast, 'id'>) => void; dismiss: () => void }

const ToastContext = createContext<ToastApi>({ show: () => {}, dismiss: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const dismiss = useCallback(() => {
    clearTimeout(timer.current)
    setToast(null)
  }, [])

  const show = useCallback((t: Omit<Toast, 'id'>) => {
    clearTimeout(timer.current)
    setToast({ ...t, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    timer.current = setTimeout(() => setToast(null), toast.duration ?? 4000)
    return () => clearTimeout(timer.current)
  }, [toast])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-50 flex justify-start pl-4 pr-[5.5rem] lg:bottom-6 lg:justify-center lg:pr-4 lg:pl-[248px]"
      >
        {toast && (
          <div
            key={toast.id}
            className="rise pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border-[1.5px] border-ink bg-ink py-2.5 pl-4 pr-2 text-[14px] text-paper shadow-[0_8px_24px_rgb(0_0_0/0.18)]"
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.action && (
              <button
                className="shrink-0 rounded-lg px-3 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-highlight hover:bg-paper/10"
                onClick={() => {
                  toast.action!.onClick()
                  dismiss()
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
