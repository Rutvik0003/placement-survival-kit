import { useEffect, useState } from 'react'
import { nowIST } from '../lib/time'

/** Current IST time, re-rendering every `ms` (default: each minute, aligned to the minute). */
export function useNow(ms = 60_000) {
  const [now, setNow] = useState(nowIST)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    const align = ms >= 60_000 ? ms - (Date.now() % ms) : ms
    const timeout = setTimeout(() => {
      setNow(nowIST())
      interval = setInterval(() => setNow(nowIST()), ms)
    }, align)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [ms])
  return now
}
