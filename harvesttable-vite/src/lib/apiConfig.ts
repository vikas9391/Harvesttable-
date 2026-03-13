// src/lib/apiConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the backend base URL.
//
// Priority:
//   1. VITE_API_URL  – set this in .env.local / your hosting environment
//   2. Hard-coded Render fallback so the app works out-of-the-box in prod
//      without any extra config.
//
// Usage:
//   import { API_BASE } from '@/lib/apiConfig'
//   fetch(`${API_BASE}/api/products/`)
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://harvesttable-szli.onrender.com'


/**
 * Resolve a (possibly relative) Django media URL to an absolute URL.
 * Absolute URLs (http/https) are returned unchanged.
 * Relative paths like "/media/products/img.jpg" are prefixed with API_BASE.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}