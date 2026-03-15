// src/lib/api.ts
//
// Auth strategy (JWT)
// ────────────────────
// 1. On login/register the server returns { access, refresh } tokens.
// 2. Tokens are stored in localStorage via setTokens().
// 3. Every apiFetch() call attaches Authorization: Bearer <access>.
// 4. On 401, we attempt a silent refresh via /api/users/refresh/.
// 5. If refresh fails, tokens are cleared and the user is treated as logged out.
// 6. No cookies, no CSRF — works cross-origin with no browser restrictions.
//
// Performance
// ───────────
// 7. GET deduplication  — concurrent identical GETs share one network request.
// 8. GET response cache — 30 s TTL; call invalidateCache() after mutations.
//
// Base URL
// ────────
// 9. All paths are prefixed with VITE_API_BASE_URL (falls back to Render URL).
//    Pass a full https:// URL to bypass prefixing (e.g. third-party calls).

// ── Base URL ──────────────────────────────────────────────────────────────────
export const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://harvesttable-szli.onrender.com'

function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const base = API_BASE.replace(/\/$/, '')
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${base}${path}`
}

// ── Token storage ─────────────────────────────────────────────────────────────
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

export function clearTokens(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// ── In-flight deduplication (GET only) ───────────────────────────────────────
const inFlight = new Map<string, Promise<Response>>()

// ── TTL response cache (GET only) ────────────────────────────────────────────
interface CacheEntry { data: unknown; ts: number }
const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS  = 30_000   // 30 seconds

export function invalidateCache(pathOrUrl: string): void {
  responseCache.delete(resolveUrl(pathOrUrl))
}

export function invalidateCachePrefix(prefix: string): void {
  const resolved = resolveUrl(prefix)
  for (const key of responseCache.keys()) {
    if (key.startsWith(resolved)) responseCache.delete(key)
  }
}

// ── Silent token refresh ──────────────────────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) return null

    try {
      const res = await fetch(resolveUrl('/api/users/refresh/'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh }),
      })

      if (!res.ok) {
        clearTokens()
        return null
      }

      const data: { access: string; refresh: string } = await res.json()
      setTokens(data.access, data.refresh)
      return data.access
    } catch {
      clearTokens()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ── Build request headers ─────────────────────────────────────────────────────
function buildHeaders(
  token: string | null,
  body?: BodyInit | null,
  extra?: HeadersInit,
): Record<string, string> {
  const headers: Record<string, string> = {}

  // Only set JSON Content-Type when body is NOT FormData.
  // For FormData the browser sets Content-Type with the correct
  // multipart boundary automatically — never override it manually.
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Merge any caller-supplied headers last so they can override if needed
  const extra_ = (extra as Record<string, string> | undefined) ?? {}
  return { ...headers, ...extra_ }
}

// ── seedCSRF — kept as a no-op so App.tsx doesn't need changes ────────────────
/** @deprecated No longer needed with JWT auth. Safe to remove from App.tsx. */
export async function seedCSRF(): Promise<void> {
  // No-op — JWT doesn't use CSRF tokens
}

/**
 * Drop-in replacement for fetch() that:
 *  - Resolves relative paths against VITE_API_BASE_URL
 *  - Attaches Authorization: Bearer <token> on every request
 *  - Silently refreshes the access token on 401 and retries once
 *  - Deduplicates concurrent identical GET requests
 *  - Caches GET responses for 30 s (pass { cache: 'no-store' } to bypass)
 *  - Correctly handles FormData (does NOT set Content-Type for multipart)
 */
export async function apiFetch(
  pathOrUrl: string,
  options: RequestInit = {},
): Promise<Response> {
  const url         = resolveUrl(pathOrUrl)
  const method      = (options.method ?? 'GET').toUpperCase()
  const bypassCache = options.cache === 'no-store'
  const token       = getAccessToken()

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

    // 2. Join an in-flight request rather than firing a duplicate
    const existing = inFlight.get(url)
    if (existing) return existing.then(r => r.clone())

    // 3. Real network request
    const promise = fetch(url, {
      ...options,
      headers: buildHeaders(token, options.body, options.headers),
    })
      .then(async res => {
        inFlight.delete(url)

        // Silent refresh on 401
        if (res.status === 401) {
          const newToken = await refreshAccessToken()
          if (newToken) {
            return fetch(url, {
              ...options,
              headers: buildHeaders(newToken, options.body, options.headers),
            })
          }
        }

        if (res.ok) {
          try {
            const data = await res.clone().json()
            responseCache.set(url, { data, ts: Date.now() })
          } catch {
            // Non-JSON response — skip caching
          }
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

  // ── Non-GET (POST / PATCH / DELETE / PUT) ─────────────────────────────────
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(token, options.body, options.headers),
  })

  // Silent refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return fetch(url, {
        ...options,
        headers: buildHeaders(newToken, options.body, options.headers),
      })
    }
  }

  return res
}