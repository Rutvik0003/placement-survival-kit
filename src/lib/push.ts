import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushState =
  | 'unsupported' // browser can't do push at all
  | 'ios-needs-install' // iPhone/iPad Safari: must be added to Home Screen first
  | 'no-key' // VAPID key missing from env
  | 'denied' // user blocked notifications
  | 'off' // allowed or not asked, but this device isn't subscribed
  | 'on'

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function b64uToBytes(s: string) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function deviceLabel() {
  const ua = navigator.userAgent
  const os = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Device'
  const app = isStandalone() ? 'app' : /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'browser'
  return `${os} · ${app}`
}

async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined
  return (await navigator.serviceWorker.getRegistration()) ?? undefined
}

export async function getPushState(): Promise<PushState> {
  if (isIOS() && !isStandalone()) return 'ios-needs-install'
  if (!('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  const reg = await registration()
  if (!reg) return 'unsupported' // e.g. dev server, where the service worker is off
  if (!VAPID_PUBLIC_KEY) return 'no-key'
  if (Notification.permission === 'denied') return 'denied'
  const sub = await reg.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint: sub.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth, device_label: deviceLabel() },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error(error.message)
}

export async function enablePush(): Promise<PushState> {
  const state = await getPushState()
  if (state === 'unsupported' || state === 'ios-needs-install' || state === 'no-key') return state
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = (await registration())!
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(VAPID_PUBLIC_KEY!) }))
  await saveSubscription(sub)
  return 'on'
}

export async function disablePush(): Promise<PushState> {
  const sub = await (await registration())?.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  return 'off'
}

/** Called on app start: if this device is subscribed, make sure the server still knows about it. */
export async function resyncPush() {
  try {
    if ((await getPushState()) !== 'on') return
    const sub = await (await registration())!.pushManager.getSubscription()
    if (sub) await saveSubscription(sub)
  } catch {
    /* offline or similar — try again next launch */
  }
}

export async function sendTestPush(): Promise<{ delivered: number; errors: string[] }> {
  const { data, error } = await supabase.functions.invoke('send-test', { method: 'POST' })
  if (error) throw new Error(error.message)
  return data as { delivered: number; errors: string[] }
}
