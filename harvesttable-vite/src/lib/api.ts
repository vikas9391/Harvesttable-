// src/lib/api.ts
let csrfToken: string | null = null

async function getCSRF(): Promise<string> {
  if (csrfToken) return csrfToken
  const res = await fetch('/api/users/csrf/', { credentials: 'include' })
  const data = await res.json()
  csrfToken = data.csrfToken
  return csrfToken!
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRFToken'] = await getCSRF()
  }

  const res = await fetch(url, { ...options, credentials: 'include', headers })

  // If Django rejects the token (stale/missing), clear cache and retry once
  if (res.status === 403 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    csrfToken = null
    headers['X-CSRFToken'] = await getCSRF()
    return fetch(url, { ...options, credentials: 'include', headers })
  }

  return res
}