import { useCallback, useEffect, useState } from 'react'
import { disablePush, enablePush, getPushState, isIOS, isStandalone, type PushState } from '../lib/push'

export function usePushState() {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getPushState().then((s) => alive && setState(s))
    return () => {
      alive = false
    }
  }, [])

  const run = useCallback(async (fn: () => Promise<PushState>) => {
    setBusy(true)
    setError(null)
    try {
      setState(await fn())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  return {
    state,
    busy,
    error,
    turnOn: () => run(enablePush),
    turnOff: () => run(disablePush),
  }
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  // Chrome/Edge/Android fire this when the app is installable. Stash it for a button.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((l) => l())
  })
}

export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return {
    installed: isStandalone(),
    ios: isIOS(),
    canPrompt: !!deferred,
    prompt: async () => {
      if (!deferred) return
      await deferred.prompt()
      await deferred.userChoice
      deferred = null
      force((n) => n + 1)
    },
  }
}
