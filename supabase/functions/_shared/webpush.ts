// Web Push sender using only Web Crypto + fetch (works in Deno, Node 20+, browsers).
// Implements RFC 8291 (aes128gcm payload encryption) and RFC 8292 (VAPID).

const enc = new TextEncoder()
type Bytes = Uint8Array<ArrayBuffer>

export function b64uToBytes(s: string): Bytes {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export function bytesToB64u(b: Uint8Array): string {
  let bin = ''
  for (const x of b) bin += String.fromCharCode(x)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, length: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8)
  return new Uint8Array(bits)
}

/** Encrypt a payload for one subscription (single aes128gcm record). */
export async function encryptPayload(payload: Uint8Array, p256dh: string, auth: string): Promise<Bytes> {
  const uaPublic = b64uToBytes(p256dh)
  const authSecret = b64uToBytes(auth)
  const as = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey))
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256))

  const ikm = await hkdf(authSecret, shared, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32)
  const salt: Bytes = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(payload, new Uint8Array([2]))),
  )

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, 4096)
  header[20] = asPublic.length
  header.set(asPublic, 21)
  return concat(header, cipher)
}

export type Vapid = { publicKey: string; privateKey: string; subject: string }

/** `Authorization` header value for a push endpoint. */
export async function vapidHeader(endpoint: string, vapid: Vapid): Promise<string> {
  const pub = b64uToBytes(vapid.publicKey)
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64u(pub.slice(1, 33)),
    y: bytesToB64u(pub.slice(33, 65)),
    d: vapid.privateKey,
    ext: true,
  }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const json = (o: unknown) => bytesToB64u(enc.encode(JSON.stringify(o)))
  const unsigned = `${json({ typ: 'JWT', alg: 'ES256' })}.${json({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: vapid.subject,
  })}`
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned) as Bytes))
  return `vapid t=${unsigned}.${bytesToB64u(sig)}, k=${vapid.publicKey}`
}

export type PushSubscriptionRow = { endpoint: string; p256dh: string; auth: string }

export async function sendPush(
  sub: PushSubscriptionRow,
  payload: unknown,
  vapid: Vapid,
  opts: { ttl?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' } = {},
): Promise<{ status: number; ok: boolean; error?: string }> {
  try {
    const body = await encryptPayload(enc.encode(JSON.stringify(payload)), sub.p256dh, sub.auth)
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: await vapidHeader(sub.endpoint, vapid),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(opts.ttl ?? 3600),
        Urgency: opts.urgency ?? 'high',
      },
      body,
    })
    return res.ok ? { status: res.status, ok: true } : { status: res.status, ok: false, error: (await res.text()).slice(0, 300) }
  } catch (e) {
    return { status: 0, ok: false, error: String(e).slice(0, 300) }
  }
}
