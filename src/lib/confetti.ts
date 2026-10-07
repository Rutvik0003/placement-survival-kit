import confetti from 'canvas-confetti'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const COLORS = ['#ff4f1f', '#f4e04d', '#2c7a4b', '#2f5bd3', '#7b4fd6', '#fbf9f4']

/** A celebratory burst from both bottom corners. */
export function celebrate() {
  if (reduced()) return
  const fire = (x: number, angle: number) =>
    confetti({ particleCount: 90, spread: 70, startVelocity: 55, angle, origin: { x, y: 0.9 }, colors: COLORS, ticks: 260 })
  fire(0.1, 60)
  fire(0.9, 120)
  setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.35 }, colors: COLORS, ticks: 300 }), 450)
}

/** Gentle drizzle (graveyard party). */
export function drizzle() {
  if (reduced()) return
  confetti({ particleCount: 60, spread: 160, startVelocity: 25, origin: { y: 0 }, colors: COLORS, gravity: 0.6, ticks: 400 })
}
