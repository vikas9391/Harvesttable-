import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode
} from 'react'
import type { CartContextType, CartItem, Product } from '../types'
import { useAuth } from '../components/Navbar'
import { apiFetch } from '../lib/api'

// ─── Shipping config ──────────────────────────────────────────────────────────
export interface ShippingConfig {
  freeShippingThreshold: number
  standardShippingCost:  number
}

const DEFAULT_SHIPPING: ShippingConfig = {
  freeShippingThreshold: 50,
  standardShippingCost:  5.99,
}

interface ShippingSettingsResponse {
  free_shipping_threshold: string
  standard_shipping_cost:  string
  updated_at:              string
}

// ─── Gift box types ───────────────────────────────────────────────────────────
export type GiftBoxSize = 'small' | 'medium' | 'large'

export interface GiftBoxProduct {
  id:          number
  name:        string
  slug:        string
  price:       string
  category:    string
  image_url?:  string
  imageType?:  string
  name_fr?:    string
  name_ar?:    string
  [key: string]: unknown
}

export interface CartGiftBoxItem {
  id:      number
  product: GiftBoxProduct
}

export interface CartGiftBox {
  id:            number
  size:          GiftBoxSize
  packaging_fee: string
  quantity:      number
  gift_items:    CartGiftBoxItem[]
  items_price:   string
  total_price:   string
}

// ─── Guest gift box (stored in localStorage before login) ─────────────────────
export interface GuestGiftBox {
  /** client-only id so we can remove/update before syncing */
  localId:       string
  size:          GiftBoxSize
  product_ids:   number[]
  /** cached product objects for display */
  products:      GiftBoxProduct[]
  quantity:      number
  packaging_fee: number
}

// ─── Context type ─────────────────────────────────────────────────────────────
interface ExtendedCartContextType extends CartContextType {
  // shipping
  shippingCost:          number
  isFreeShipping:        boolean
  amountToFree:          number
  shippingConfig:        ShippingConfig
  refreshShippingConfig: () => Promise<void>

  // server gift boxes (logged-in)
  giftBoxes:         CartGiftBox[]
  addGiftBox:        (size: GiftBoxSize, products: GiftBoxProduct[], quantity?: number) => Promise<void>
  removeGiftBox:     (boxId: number) => Promise<void>
  updateGiftBoxQty:  (boxId: number, quantity: number) => Promise<void>

  // guest gift boxes (logged-out)
  guestGiftBoxes:        GuestGiftBox[]
  addGuestGiftBox:       (size: GiftBoxSize, products: GiftBoxProduct[], quantity?: number) => void
  removeGuestGiftBox:    (localId: string) => void
  updateGuestGiftBoxQty: (localId: string, quantity: number) => void
}

const CartContext = createContext<ExtendedCartContextType | null>(null)

// ─── localStorage helpers ─────────────────────────────────────────────────────
const CART_KEY      = 'harvest_cart'
const GIFT_CART_KEY = 'harvest_gift_cart'

function loadLocalCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]') as CartItem[] }
  catch { return [] }
}
function saveLocalCart(items: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)) } catch {}
}
function clearLocalCart() { localStorage.removeItem(CART_KEY) }

function loadGuestGiftBoxes(): GuestGiftBox[] {
  try { return JSON.parse(localStorage.getItem(GIFT_CART_KEY) ?? '[]') as GuestGiftBox[] }
  catch { return [] }
}
function saveGuestGiftBoxes(boxes: GuestGiftBox[]) {
  try { localStorage.setItem(GIFT_CART_KEY, JSON.stringify(boxes)) } catch {}
}
function clearGuestGiftBoxes() { localStorage.removeItem(GIFT_CART_KEY) }

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

  const [items,            setItems]            = useState<CartItem[]>(loadLocalCart)
  const [giftBoxes,        setGiftBoxes]        = useState<CartGiftBox[]>([])
  const [guestGiftBoxes,   setGuestGiftBoxes]   = useState<GuestGiftBox[]>(loadGuestGiftBoxes)
  const [syncing,          setSyncing]          = useState(false)
  const [shippingConfig,   setShippingConfig]   = useState<ShippingConfig>(DEFAULT_SHIPPING)

  // ── Shipping config ────────────────────────────────────────────────────────
  const refreshShippingConfig = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings/shipping/')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ShippingSettingsResponse
      const threshold = parseFloat(data.free_shipping_threshold)
      const cost      = parseFloat(data.standard_shipping_cost)
      if (!isNaN(threshold) && !isNaN(cost)) {
        setShippingConfig({ freeShippingThreshold: threshold, standardShippingCost: cost })
      }
    } catch (err) {
      console.warn('Could not load shipping config:', err)
    }
  }, [])

  useEffect(() => { refreshShippingConfig() }, [refreshShippingConfig])

  // ── On login: merge guest cart + guest gift boxes → server ─────────────────
  useEffect(() => {
    if (authLoading) return
    if (isLoggedIn) {
      const guestItems    = loadLocalCart()
      const guestBoxes    = loadGuestGiftBoxes()

      const init = async () => {
        setSyncing(true)
        try {
          if (guestItems.length > 0 || guestBoxes.length > 0) {
            await apiFetch('/api/orders/cart/merge/', {
              method: 'POST',
              body: JSON.stringify({
                items: guestItems.map(i => ({
                  product_id: i.product.id,
                  quantity:   i.quantity,
                })),
                gift_boxes: guestBoxes.map(b => ({
                  size:        b.size,
                  product_ids: b.product_ids,
                  quantity:    b.quantity,
                })),
              }),
            })
            clearLocalCart()
            clearGuestGiftBoxes()
          }

          const res  = await apiFetch('/api/orders/cart/')
          const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
          setItems(serverItemsToCartItems(data.items ?? []))
          setGiftBoxes(data.gift_boxes ?? [])
          setGuestGiftBoxes([])
        } catch (err) {
          console.error('Cart sync error:', err)
        } finally {
          setSyncing(false)
        }
      }
      init()
    } else {
      setItems(loadLocalCart())
      setGiftBoxes([])
      setGuestGiftBoxes(loadGuestGiftBoxes())
    }
  }, [isLoggedIn, authLoading])

  // ── Persist guest data to localStorage ────────────────────────────────────
  useEffect(() => { if (!isLoggedIn) saveLocalCart(items) }, [items, isLoggedIn])
  useEffect(() => { if (!isLoggedIn) saveGuestGiftBoxes(guestGiftBoxes) }, [guestGiftBoxes, isLoggedIn])

  // ─── Regular cart ops ──────────────────────────────────────────────────────
  const addToCart = useCallback(async (product: Product) => {
    if (isLoggedIn) {
      try {
        const res  = await apiFetch('/api/orders/cart/', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        })
        const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
        setItems(serverItemsToCartItems(data.items ?? []))
        setGiftBoxes(data.gift_boxes ?? [])
      } catch (err) { console.error('addToCart error:', err) }
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.product.id === product.id)
        if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        return [...prev, { product, quantity: 1 }]
      })
    }
  }, [isLoggedIn])

  const removeFromCart = useCallback(async (productId: number) => {
    if (isLoggedIn) {
      const item = items.find(i => i.product.id === productId)
      if (!item?.cartItemId) return
      try {
        const res  = await apiFetch(`/api/orders/cart/items/${item.cartItemId}/`, { method: 'DELETE' })
        const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
        setItems(serverItemsToCartItems(data.items ?? []))
        setGiftBoxes(data.gift_boxes ?? [])
      } catch (err) { console.error('removeFromCart error:', err) }
    } else {
      setItems(prev => prev.filter(i => i.product.id !== productId))
    }
  }, [isLoggedIn, items])

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
        const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
        setItems(serverItemsToCartItems(data.items ?? []))
        setGiftBoxes(data.gift_boxes ?? [])
      } catch (err) { console.error('updateQuantity error:', err) }
    } else {
      setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i))
    }
  }, [isLoggedIn, items, removeFromCart])

  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try {
        await apiFetch('/api/orders/cart/', { method: 'DELETE' })
      } catch (err) { console.error('clearCart error:', err) }
      setGiftBoxes([])
    } else {
      clearLocalCart()
      clearGuestGiftBoxes()
      setGuestGiftBoxes([])
    }
    setItems([])
  }, [isLoggedIn])

  // ─── Server gift box ops (logged-in) ──────────────────────────────────────
  const addGiftBox = useCallback(async (
    size: GiftBoxSize,
    products: GiftBoxProduct[],
    quantity = 1,
  ) => {
    try {
      const res  = await apiFetch('/api/orders/cart/gift-boxes/', {
        method: 'POST',
        body: JSON.stringify({
          size,
          product_ids: products.map(p => p.id),
          quantity,
        }),
      })
      // Backend already removes these products from CartItem before responding,
      // so we just sync both lists from the response.
      const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
      setItems(serverItemsToCartItems(data.items ?? []))
      setGiftBoxes(data.gift_boxes ?? [])
    } catch (err) { console.error('addGiftBox error:', err) }
  }, [])

  const removeGiftBox = useCallback(async (boxId: number) => {
    try {
      const res  = await apiFetch(`/api/orders/cart/gift-boxes/${boxId}/`, { method: 'DELETE' })
      const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
      setItems(serverItemsToCartItems(data.items ?? []))
      setGiftBoxes(data.gift_boxes ?? [])
    } catch (err) { console.error('removeGiftBox error:', err) }
  }, [])

  const updateGiftBoxQty = useCallback(async (boxId: number, quantity: number) => {
    try {
      const res  = await apiFetch(`/api/orders/cart/gift-boxes/${boxId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      })
      const data = await res.json() as { items?: unknown[]; gift_boxes?: CartGiftBox[] }
      setItems(serverItemsToCartItems(data.items ?? []))
      setGiftBoxes(data.gift_boxes ?? [])
    } catch (err) { console.error('updateGiftBoxQty error:', err) }
  }, [])

  // ─── Guest gift box ops (logged-out) ──────────────────────────────────────
  const addGuestGiftBox = useCallback((
    size: GiftBoxSize,
    products: GiftBoxProduct[],
    quantity = 1,
  ) => {
    const PACKAGING: Record<GiftBoxSize, number> = { small: 5, medium: 8, large: 12 }
    const box: GuestGiftBox = {
      localId:       crypto.randomUUID(),
      size,
      product_ids:   products.map(p => p.id),
      products,
      quantity,
      packaging_fee: PACKAGING[size],
    }

    setGuestGiftBoxes(prev => [...prev, box])
  }, [])

  const removeGuestGiftBox = useCallback((localId: string) => {
    setGuestGiftBoxes(prev => prev.filter(b => b.localId !== localId))
  }, [])

  const updateGuestGiftBoxQty = useCallback((localId: string, quantity: number) => {
    if (quantity <= 0) { removeGuestGiftBox(localId); return }
    setGuestGiftBoxes(prev => prev.map(b => b.localId === localId ? { ...b, quantity } : b))
  }, [removeGuestGiftBox])

  // ─── Totals (regular items + all gift boxes) ──────────────────────────────
  const regularItemCount = items.reduce((s, i) => s + i.quantity, 0)
  const regularPrice     = items.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0)

  // Server gift boxes (logged-in)
  const serverGiftBoxCount = giftBoxes.reduce((s, b) => s + b.quantity, 0)
  const serverGiftBoxPrice = giftBoxes.reduce((s, b) => s + parseFloat(b.total_price), 0)

  // Guest gift boxes (logged-out)
  const guestGiftBoxCount = guestGiftBoxes.reduce((s, b) => s + b.quantity, 0)
  const guestGiftBoxPrice = guestGiftBoxes.reduce(
    (s, b) => s + (b.products.reduce((ps, p) => ps + parseFloat(p.price), 0) + b.packaging_fee) * b.quantity,
    0,
  )

  const totalItems = regularItemCount + serverGiftBoxCount + guestGiftBoxCount
  const totalPrice = regularPrice + serverGiftBoxPrice + guestGiftBoxPrice

  const isFreeShipping = totalPrice >= shippingConfig.freeShippingThreshold
  const shippingCost   = totalItems === 0 ? 0 : isFreeShipping ? 0 : shippingConfig.standardShippingCost
  const amountToFree   = Math.max(0, shippingConfig.freeShippingThreshold - totalPrice)

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice, syncing,
      shippingCost, isFreeShipping, amountToFree, shippingConfig, refreshShippingConfig,
      giftBoxes, addGiftBox, removeGiftBox, updateGiftBoxQty,
      guestGiftBoxes, addGuestGiftBox, removeGuestGiftBox, updateGuestGiftBoxQty,
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