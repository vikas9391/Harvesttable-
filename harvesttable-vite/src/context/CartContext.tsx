import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode
} from 'react'
import type { CartContextType, CartItem, Product } from '../types'
import { useAuth } from '../components/Navbar'
import { apiFetch } from '../lib/api'

// ─── Shipping config — mirrors ShippingSettingsSerializer field names ─────────
export interface ShippingConfig {
  freeShippingThreshold: number   // backend: free_shipping_threshold
  standardShippingCost:  number   // backend: standard_shipping_cost
}

const DEFAULT_SHIPPING: ShippingConfig = {
  freeShippingThreshold: 50,
  standardShippingCost:  5.99,
}

// ─── Shape returned by GET /api/settings/shipping/ ───────────────────────────
interface ShippingSettingsResponse {
  free_shipping_threshold: string  // DRF serialises DecimalField as string
  standard_shipping_cost:  string
  updated_at:              string
}

// ─── Extended context type ────────────────────────────────────────────────────
interface ExtendedCartContextType extends CartContextType {
  shippingCost:         number
  isFreeShipping:       boolean
  amountToFree:         number
  shippingConfig:       ShippingConfig
  refreshShippingConfig: () => Promise<void>  // call after admin saves new rates
}

const CartContext = createContext<ExtendedCartContextType | null>(null)

// ─── localStorage helpers ─────────────────────────────────────────────────────
const CART_KEY = 'harvest_cart'

function loadLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch { return [] }
}

function saveLocalCart(items: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)) } catch {}
}

function clearLocalCart() {
  localStorage.removeItem(CART_KEY)
}

function serverItemsToCartItems(serverItems: unknown[]): CartItem[] {
  return (serverItems as Array<{ id: number; product: Product; quantity: number }>).map(i => ({
    cartItemId: i.id,
    product:    i.product,
    quantity:   i.quantity,
  }))
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, authLoading } = useAuth()
  const [items,          setItems]          = useState<CartItem[]>(loadLocalCart)
  const [syncing,        setSyncing]        = useState(false)
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING)

  // ── Fetch live shipping rates from admin_panel backend ────────────────────
  const refreshShippingConfig = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings/shipping/')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ShippingSettingsResponse

      const threshold = parseFloat(data.free_shipping_threshold)
      const cost      = parseFloat(data.standard_shipping_cost)

      // Only update if both values are valid numbers
      if (!isNaN(threshold) && !isNaN(cost)) {
        setShippingConfig({
          freeShippingThreshold: threshold,
          standardShippingCost:  cost,
        })
      }
    } catch (err) {
      // Non-fatal: keep current config (either defaults or last successful fetch)
      console.warn('Could not load shipping config, using current values:', err)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    refreshShippingConfig()
  }, [refreshShippingConfig])

  // ── On login: merge guest cart → server cart ──────────────────────────────
  useEffect(() => {
    if (authLoading) return

    if (isLoggedIn) {
      const guestItems = loadLocalCart()
      const init = async () => {
        setSyncing(true)
        try {
          if (guestItems.length > 0) {
            await apiFetch('/api/orders/cart/merge/', {
              method: 'POST',
              body: JSON.stringify({
                items: guestItems.map(i => ({
                  product_id: i.product.id,
                  quantity:   i.quantity,
                })),
              }),
            })
            clearLocalCart()
          }
          const res  = await apiFetch('/api/orders/cart/')
          const data = await res.json() as { items?: unknown[] }
          setItems(serverItemsToCartItems(data.items ?? []))
        } catch (err) {
          console.error('Cart sync error:', err)
        } finally {
          setSyncing(false)
        }
      }
      init()
    } else {
      setItems(loadLocalCart())
    }
  }, [isLoggedIn, authLoading])

  // ── Persist to localStorage for guests ───────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) saveLocalCart(items)
  }, [items, isLoggedIn])

  // ── Add to cart ───────────────────────────────────────────────────────────
  const addToCart = useCallback(async (product: Product) => {
    if (isLoggedIn) {
      try {
        const res  = await apiFetch('/api/orders/cart/', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        })
        const data = await res.json() as { items?: unknown[] }
        setItems(serverItemsToCartItems(data.items ?? []))
      } catch (err) {
        console.error('addToCart error:', err)
      }
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.product.id === product.id)
        if (existing) {
          return prev.map(i =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        }
        return [...prev, { product, quantity: 1 }]
      })
    }
  }, [isLoggedIn])

  // ── Remove from cart ──────────────────────────────────────────────────────
  const removeFromCart = useCallback(async (productId: number) => {
    if (isLoggedIn) {
      const item = items.find(i => i.product.id === productId)
      if (!item?.cartItemId) return
      try {
        const res  = await apiFetch(`/api/orders/cart/items/${item.cartItemId}/`, {
          method: 'DELETE',
        })
        const data = await res.json() as { items?: unknown[] }
        setItems(serverItemsToCartItems(data.items ?? []))
      } catch (err) {
        console.error('removeFromCart error:', err)
      }
    } else {
      setItems(prev => prev.filter(i => i.product.id !== productId))
    }
  }, [isLoggedIn, items])

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return }

    if (isLoggedIn) {
      const item = items.find(i => i.product.id === productId)
      if (!item?.cartItemId) return
      try {
        const res  = await apiFetch(`/api/orders/cart/items/${item.cartItemId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        })
        const data = await res.json() as { items?: unknown[] }
        setItems(serverItemsToCartItems(data.items ?? []))
      } catch (err) {
        console.error('updateQuantity error:', err)
      }
    } else {
      setItems(prev =>
        prev.map(i => i.product.id === productId ? { ...i, quantity } : i)
      )
    }
  }, [isLoggedIn, items, removeFromCart])

  // ── Clear cart ────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
        await apiFetch('/api/orders/cart/', { method: 'DELETE' })
      } catch (err) {
        console.error('clearCart error:', err)
      }
    } else {
      clearLocalCart()
    }
    setItems([])
  }, [isLoggedIn])

  // ── Shipping calculations (driven entirely by live admin_panel config) ────
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0)

  const isFreeShipping = totalPrice >= shippingConfig.freeShippingThreshold
  const shippingCost   = totalItems === 0
    ? 0
    : isFreeShipping
      ? 0
      : shippingConfig.standardShippingCost
  const amountToFree   = Math.max(0, shippingConfig.freeShippingThreshold - totalPrice)

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity,
      clearCart, totalItems, totalPrice, syncing,
      shippingCost, isFreeShipping, amountToFree, shippingConfig,
      refreshShippingConfig,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}