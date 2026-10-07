/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

// App shell: cache the built files so the app opens instantly (and offline).
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// ─── Push ────────────────────────────────────────────────────────────────
type PushData = { title?: string; body?: string; url?: string; tag?: string; kind?: string; ack?: string }

self.addEventListener('push', (event) => {
  let data: PushData = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  const urgent = data.kind === 'headsup' || data.kind === 'nag'
  const options: NotificationOptions & { renotify?: boolean; actions?: { action: string; title: string }[] } = {
    body: data.body,
    tag: data.tag,
    renotify: !!data.tag,
    icon: '/pwa-192x192.png',
    badge: '/badge-96.png',
    data: { url: data.url ?? '/', ack: data.ack },
    requireInteraction: data.kind === 'nag',
    actions: urgent ? [{ action: 'ack', title: 'On it' }] : [],
  }
  event.waitUntil(self.registration.showNotification(data.title ?? 'Placement Survival Kit', options))
})

self.addEventListener('notificationclick', (event) => {
  const n = event.notification
  n.close()
  const { url = '/', ack } = (n.data ?? {}) as { url?: string; ack?: string }

  // Any tap counts as "seen" — that's what stops the nag.
  const acked = ack ? fetch(ack, { method: 'POST' }).catch(() => undefined) : Promise.resolve()
  if (event.action === 'ack') {
    event.waitUntil(acked)
    return
  }

  const target = new URL(url, self.location.origin).href
  const open = (async () => {
    if (target.startsWith(self.location.origin)) {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const win = wins.find((w) => w.url.startsWith(self.location.origin)) as WindowClient | undefined
      if (win) {
        await win.focus()
        await win.navigate(target).catch(() => undefined)
        return
      }
    }
    // External links (Meet/Zoom/test portal) open directly.
    await self.clients.openWindow(target)
  })()
  event.waitUntil(Promise.all([acked, open]))
})
