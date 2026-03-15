import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../lib/api'          // ← add this import
import { PRODUCTS } from '../data/products'
import type { Product } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://harvesttable-szli.onrender.com'

export type ApiProduct = Product

interface UseProductsOptions {
  category?:       string
  search?:         string
  is_organic?:     boolean
  is_vegan?:       boolean
  is_gluten_free?: boolean
  is_fair_trade?:  boolean
  is_featured?:    boolean
  is_seasonal?:    boolean
  ordering?:       string
}

function buildQuery(opts: UseProductsOptions): string {
  const p = new URLSearchParams()
  if (opts.category)       p.set('category',       opts.category)
  if (opts.search)         p.set('search',         opts.search)
  if (opts.ordering)       p.set('ordering',       opts.ordering)
  if (opts.is_organic)     p.set('is_organic',     'true')
  if (opts.is_vegan)       p.set('is_vegan',       'true')
  if (opts.is_gluten_free) p.set('is_gluten_free', 'true')
  if (opts.is_fair_trade)  p.set('is_fair_trade',  'true')
  if (opts.is_featured)    p.set('is_featured',    'true')
  if (opts.is_seasonal)    p.set('is_seasonal',    'true')
  const q = p.toString()
  return q ? `?${q}` : ''
}

function filterStatic(opts: UseProductsOptions): Product[] {
  let list = [...PRODUCTS]
  if (opts.category)       list = list.filter(p => p.category === opts.category)
  if (opts.search)         list = list.filter(p =>
    p.name.toLowerCase().includes(opts.search!.toLowerCase()) ||
    p.description.toLowerCase().includes(opts.search!.toLowerCase())
  )
  if (opts.is_organic)     list = list.filter(p => p.is_organic)
  if (opts.is_vegan)       list = list.filter(p => p.is_vegan)
  if (opts.is_gluten_free) list = list.filter(p => p.is_gluten_free)
  if (opts.is_fair_trade)  list = list.filter(p => p.is_fair_trade)
  if (opts.is_featured)    list = list.filter(p => p.is_featured)
  if (opts.is_seasonal)    list = list.filter(p => p.is_seasonal)

  const ord = opts.ordering ?? '-created_at'
  if (ord === 'price' || ord === 'price-asc')
    list = list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
  else if (ord === '-price' || ord === 'price-desc')
    list = list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
  else if (ord === 'name')
    list = list.sort((a, b) => a.name.localeCompare(b.name))

  return list
}

export interface ProductsState {
  products: ApiProduct[]
  loading:  boolean
  error:    string | null
  refetch:  () => void
}

export function useProducts(opts: UseProductsOptions = {}): ProductsState {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [tick,     setTick]     = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])
  const queryKey = buildQuery(opts) + tick

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // ✅ use apiFetch so JWT token is included
    apiFetch(`/api/products/${buildQuery(opts)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: ApiProduct[] | { results: ApiProduct[] }) => {
        if (!cancelled)
          setProducts(Array.isArray(data) ? data : (data.results ?? []))
      })
      .catch(() => {
        if (!cancelled) {
          setProducts(filterStatic(opts))
          setError(null)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  return { products, loading, error, refetch }
}

export function useProduct(slug: string | undefined) {
  const [product, setProduct] = useState<ApiProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    let cancelled = false
    setLoading(true); setError(null)

    // ✅ use apiFetch so JWT token is included
    apiFetch(`/api/products/${slug}/`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: ApiProduct) => { if (!cancelled) setProduct(data) })
      .catch(() => {
        if (!cancelled) {
          const found = PRODUCTS.find(p => p.slug === slug) ?? null
          setProduct(found)
          if (!found) setError('Product not found.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [slug])

  return { product, loading, error }
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false

    // ✅ use apiFetch
    apiFetch(`/api/products/featured/`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: ApiProduct[] | { results: ApiProduct[] }) => {
        if (!cancelled)
          setProducts(Array.isArray(data) ? data : (data.results ?? []))
      })
      .catch(() => {
        if (!cancelled)
          setProducts(PRODUCTS.filter(p => p.is_featured).slice(0, 4))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { products, loading }
}

export function useSeasonalProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false

    // ✅ use apiFetch
    apiFetch(`/api/products/seasonal/`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: ApiProduct[] | { results: ApiProduct[] }) => {
        if (!cancelled)
          setProducts(Array.isArray(data) ? data : (data.results ?? []))
      })
      .catch(() => {
        if (!cancelled)
          setProducts(PRODUCTS.filter(p => p.is_seasonal).slice(0, 3))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { products, loading }
}