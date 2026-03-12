// src/lib/api.ts
//
// CSRF strategy
// ─────────────
// 1. App.tsx calls seedCSRF() on startup and waits for it before rendering.
// 2. All subsequent calls go through apiFetch() which reads the already-seeded
//    token — no race condition possible.
// 3. If a 403 comes back AND it looks like a CSRF failure, we refresh once and retry.
//    A plain 403 from IsAuthenticated / IsAdminUser is passed through as-is.
// 4. If the CSRF endpoint itself fails we return '' so the app still renders.
//
// Performance
// ───────────
// 5. GET deduplication  — concurrent identical GETs share one network request.
// 6. GET response cache — 30 s TTL; call invalidateCache() after mutations.

let csrfToken: string | null = null
let csrfPromise: Promise<string> | null = null

// ── In-flight deduplication (GET only) ───────────────────────────────────────
const inFlight = new Map<string, Promise<Response>>()

// ── TTL response cache (GET only) ────────────────────────────────────────────
interface CacheEntry { data: unknown; ts: number }
const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS  = 30_000   // 30 seconds

/**
 * Bust the cache for a specific URL.
 * Call after PATCH / DELETE on that resource so the next GET re-fetches.
 * @example invalidateCache('/api/users/me/')
 */
export function invalidateCache(url: string): void {
  responseCache.delete(url)
}

/**
 * Bust all cached URLs that start with a given prefix.
 * @example invalidateCachePrefix('/api/orders/')
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) responseCache.delete(key)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function getCSRF(): Promise<string> {
  if (csrfToken)   return csrfToken
  if (csrfPromise) return csrfPromise

  csrfPromise = fetch('/api/users/csrf/', {
    method:      'GET',
    credentials: 'include',
    headers:     { 'Accept': 'application/json' },
  })
    .then(r => {
      if (!r.ok) throw new Error(`CSRF endpoint returned ${r.status}`)
      return r.json()
    })
    .then((data: { csrfToken: string }) => {
      csrfToken   = data.csrfToken ?? ''
      csrfPromise = null
      return csrfToken
    })
    .catch(err => {
      csrfPromise = null
      console.warn('[api] CSRF fetch failed — requests may fail:', err)
      return ''
    })

  return csrfPromise
}

/** Call once at app startup (App.tsx). Blocks rendering until cookie is seeded. */
export async function seedCSRF(): Promise<void> {
  await getCSRF()
}

/** Returns true only when Django's CSRF middleware rejected the request. */
async function isCsrfFailure(res: Response): Promise<boolean> {
  const reason = res.headers.get('X-Reason') ?? res.headers.get('Reason') ?? ''
  if (reason.toLowerCase().includes('csrf')) return true

  try {
    const text = await res.clone().text()
    return (
      text.includes('CSRF') ||
      text.includes('csrf') ||
      (text.includes('Forbidden') && text.includes('token'))
    )
  } catch {
    return false
  }
}

/**
 * Drop-in replacement for fetch() that:
 *  - Always includes credentials (session cookie)
 *  - Always sets Content-Type: application/json
 *  - Always attaches the current X-CSRFToken header
 *  - Deduplicates concurrent identical GET requests
 *  - Caches GET responses for 30 s (pass { cache: 'no-store' } to bypass)
 *  - Retries once on genuine CSRF rejection (403), not on auth/permission 403s
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const csrf        = await getCSRF()
  const method      = (options.method ?? 'GET').toUpperCase()
  const bypassCache = options.cache === 'no-store'

  const buildHeaders = (token: string): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { 'X-CSRFToken': token } : {}),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  })

  // ── GET fast-path: cache → dedup → fetch ─────────────────────────────────
  if (method === 'GET' && !bypassCache) {

    // 1. Return cached response if still fresh
    const cached = responseCache.get(url)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        status:  200,
        headers: { 'Content-Type': 'application/json', 'X-From-Cache': '1' },
      })
    }

    // 2. Join an existing in-flight request rather than firing a duplicate
    const existing = inFlight.get(url)
    if (existing) return existing.then(r => r.clone())

    // 3. Real network request — store in inFlight while pending
    const promise = fetch(url, {
      ...options,
      credentials: 'include',
      headers:     buildHeaders(csrf),
    })
      .then(async res => {
        inFlight.delete(url)

        if (res.ok) {
          try {
            const data = await res.clone().json()
            responseCache.set(url, { data, ts: Date.now() })
          } catch {
            // Non-JSON — skip caching
          }
        }

        if (res.status === 403 && await isCsrfFailure(res)) {
          csrfToken   = null
          csrfPromise = null
          const fresh = await getCSRF()
          return fetch(url, { ...options, credentials: 'include', headers: buildHeaders(fresh) })
        }

        return res
      })
      .catch(err => {
        inFlight.delete(url)
        throw err
      })

    inFlight.set(url, promise)
    return promise
  }

  // ── Non-GET (POST / PATCH / DELETE) ──────────────────────────────────────
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers:     buildHeaders(csrf),
  })

  if (res.status === 403 && await isCsrfFailure(res)) {
    csrfToken   = null
    csrfPromise = null
    const fresh = await getCSRF()
    return fetch(url, { ...options, credentials: 'include', headers: buildHeaders(fresh) })
  }

  return res
}