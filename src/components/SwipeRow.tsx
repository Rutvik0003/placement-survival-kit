import { useRef, useState, type ReactNode } from 'react'

const THRESHOLD = 88

/**
 * Touch-swipe wrapper. Right → onRight, left → onLeft.
 * Mouse users get buttons elsewhere; this only reacts to touch/pen.
 */
export function SwipeRow({
  children,
  onRight,
  onLeft,
  rightLabel,
  leftLabel,
  rightEnabled = true,
  leftEnabled = true,
}: {
  children: ReactNode
  onRight: () => void
  onLeft: () => void
  rightLabel: ReactNode
  leftLabel: ReactNode
  rightEnabled?: boolean
  leftEnabled?: boolean
}) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; locked: 'x' | 'y' | null } | null>(null)
  const swiped = useRef(false)

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') return
    start.current = { x: e.clientX, y: e.clientY, locked: null }
    swiped.current = false
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = start.current
    if (!s) return
    const x = e.clientX - s.x
    const y = e.clientY - s.y
    if (!s.locked) {
      if (Math.abs(x) < 8 && Math.abs(y) < 8) return
      s.locked = Math.abs(x) > Math.abs(y) ? 'x' : 'y'
      if (s.locked === 'x') {
        setDragging(true)
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }
    }
    if (s.locked !== 'x') return
    let v = x
    if ((v > 0 && !rightEnabled) || (v < 0 && !leftEnabled)) v = v * 0.15 // resist
    setDx(Math.max(-160, Math.min(160, v)))
  }

  function onPointerUp() {
    const s = start.current
    start.current = null
    if (!s || s.locked !== 'x') return
    setDragging(false)
    if (dx > THRESHOLD && rightEnabled) {
      swiped.current = true
      navigator.vibrate?.(12)
      onRight()
    } else if (dx < -THRESHOLD && leftEnabled) {
      swiped.current = true
      navigator.vibrate?.(12)
      onLeft()
    } else if (Math.abs(dx) > 8) {
      swiped.current = true
    }
    setDx(0)
  }

  const past = Math.abs(dx) > THRESHOLD

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Revealed backgrounds */}
      <div
        aria-hidden
        className={`absolute inset-0 flex items-center justify-start pl-5 font-mono text-[12px] font-semibold uppercase tracking-wider transition-colors ${
          past && dx > 0 ? 'bg-stamp-green text-white' : 'bg-stamp-green/15 text-stamp-green'
        }`}
        style={{ opacity: dx > 0 ? 1 : 0 }}
      >
        {rightLabel}
      </div>
      <div
        aria-hidden
        className={`absolute inset-0 flex items-center justify-end pr-5 font-mono text-[12px] font-semibold uppercase tracking-wider transition-colors ${
          past && dx < 0 ? 'bg-stamp-red text-white' : 'bg-stamp-red/15 text-stamp-red'
        }`}
        style={{ opacity: dx < 0 ? 1 : 0 }}
      >
        {leftLabel}
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault()
            e.stopPropagation()
            swiped.current = false
          }
        }}
        className="relative touch-pan-y"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
