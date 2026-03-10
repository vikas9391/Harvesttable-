// src/components/CartDrawer.tsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart, CartGiftBox, GuestGiftBox } from '../context/CartContext'
import { useLanguage } from '../context/Languagecontext'
import ProductImage from './ProductImage'
import { Product } from '../types'

interface Props { isOpen: boolean; onClose: () => void }

const T = {
  bg: '#ffffff', bgAlt: '#faf5ee', border: '#ede5d8',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878',
  accent: '#7a4a28', accentHov: '#8f5830', price: '#8b3a1a',
  green: '#3a6028', greenBg: 'rgba(58,96,40,0.07)',
  progressBg: '#ede5d8', itemBg: '#fdf9f4',
}

const keyframes = `
@keyframes drawerItemIn {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes emptyIn {
  from { opacity: 0; transform: translateY(18px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes shippingBarIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes footerSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
`

const localName = (product: { name: string; name_fr?: string; name_ar?: string }, lang: string): string => {
  if (lang === 'fr' && product.name_fr?.trim()) return product.name_fr
  if (lang === 'ar' && product.name_ar?.trim()) return product.name_ar
  return product.name
}

// ─── Gift box size icons (inline SVG) ─────────────────────────────────────────
const GiftBoxIcon = ({ size }: { size: string }) => {
  if (size === 'small') return (
    <svg width="18" height="18" fill="none" stroke={T.accent} strokeWidth="1.4" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
  if (size === 'large') return (
    <svg width="18" height="18" fill="none" stroke={T.accent} strokeWidth="1.4" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2M2 12h20" />
    </svg>
  )
  return (
    <svg width="18" height="18" fill="none" stroke={T.accent} strokeWidth="1.4" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6" />
    </svg>
  )
}

// ─── Server gift box row ───────────────────────────────────────────────────────
const ServerGiftBoxRow: React.FC<{
  box: CartGiftBox
  lang: string
  t: (k: string) => string
  onRemove: (id: number) => void
  onQtyChange: (id: number, qty: number) => void
  animDelay: number
}> = ({ box, lang, t, onRemove, onQtyChange, animDelay }) => {
  const itemsPrice   = parseFloat(box.items_price)
  const packagingFee = parseFloat(box.packaging_fee)
  const lineTotal    = (itemsPrice + packagingFee) * box.quantity

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: `2px solid rgba(122,74,40,0.22)`,
      backgroundColor: T.itemBg,
      animation: `drawerItemIn 0.4s cubic-bezier(0.22,1,0.36,1) ${animDelay}s both`,
      marginBottom: 2,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        backgroundColor: 'rgba(122,74,40,0.05)',
        borderBottom: `1px solid rgba(122,74,40,0.12)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GiftBoxIcon size={box.size} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t(`gift.${box.size}`)} {t('gift.packaging') ?? 'Gift Box'}
          </span>
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, backgroundColor: 'rgba(122,74,40,0.1)', color: T.accent, border: '1px solid rgba(122,74,40,0.2)', fontWeight: 600 }}>
            {box.gift_items.length} {t('gift.items')}
          </span>
        </div>
        <button
          onClick={() => onRemove(box.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4b896', padding: 4, display: 'flex', borderRadius: 6, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#b04040' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#d4b896' }}
        >
          <svg className="w-3.5 h-3.5" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Products inside box */}
      <div style={{ padding: '8px 12px 4px' }}>
        {box.gift_items.map((gi, idx) => (
          <div key={gi.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6,
            borderBottom: idx < box.gift_items.length - 1 ? `1px solid ${T.border}` : 'none',
            marginBottom: 6,
          }}>
            <ProductImage
              type={gi.product.category ?? gi.product.imageType ?? 'spices'}
              name={gi.product.name}
              imageUrl={gi.product.image_url}
              className="w-7 h-7 rounded-md flex-shrink-0"
            />
            <span style={{ fontSize: 12, color: T.body, flex: 1,
              ...(lang === 'ar' ? { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif" } : {})
            }}>
              {localName(gi.product, lang)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.price }}>${gi.product.price}</span>
          </div>
        ))}

        {/* Packaging fee */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.muted }}>{t('gift.packaging')} fee</span>
          <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>+${packagingFee.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer: qty + line total */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderTop: `1px solid ${T.border}`,
        backgroundColor: 'rgba(122,74,40,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: T.muted }}>{t('gift.qty') ?? 'Qty'}:</span>
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            <button
              onClick={() => onQtyChange(box.id, box.quantity - 1)}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5ede0', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.muted}
            >−</button>
            <span style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.heading, backgroundColor: T.bgAlt, lineHeight: '24px', borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
              {box.quantity}
            </span>
            <button
              onClick={() => onQtyChange(box.id, box.quantity + 1)}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5ede0', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.muted}
            >+</button>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.price, fontFamily: "'Cormorant Garamond', serif" }}>
          ${lineTotal.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ─── Guest gift box row (identical UI, uses guest data shape) ─────────────────
const GuestGiftBoxRow: React.FC<{
  box: GuestGiftBox
  lang: string
  t: (k: string) => string
  onRemove: (id: string) => void
  onQtyChange: (id: string, qty: number) => void
  animDelay: number
}> = ({ box, lang, t, onRemove, onQtyChange, animDelay }) => {
  const itemsPrice = box.products.reduce((s, p) => s + parseFloat(p.price), 0)
  const lineTotal  = (itemsPrice + box.packaging_fee) * box.quantity

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: `2px solid rgba(122,74,40,0.22)`,
      backgroundColor: T.itemBg,
      animation: `drawerItemIn 0.4s cubic-bezier(0.22,1,0.36,1) ${animDelay}s both`,
      marginBottom: 2,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        backgroundColor: 'rgba(122,74,40,0.05)',
        borderBottom: `1px solid rgba(122,74,40,0.12)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GiftBoxIcon size={box.size} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t(`gift.${box.size}`)} {t('gift.packaging') ?? 'Gift Box'}
          </span>
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, backgroundColor: 'rgba(122,74,40,0.1)', color: T.accent, border: '1px solid rgba(122,74,0.2)', fontWeight: 600 }}>
            {box.products.length} {t('gift.items')}
          </span>
        </div>
        <button
          onClick={() => onRemove(box.localId)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4b896', padding: 4, display: 'flex', borderRadius: 6, transition: 'all 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#b04040'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#d4b896'}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '8px 12px 4px' }}>
        {box.products.map((p, idx) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6,
            borderBottom: idx < box.products.length - 1 ? `1px solid ${T.border}` : 'none',
            marginBottom: 6,
          }}>
            <ProductImage
              type={p.category ?? p.imageType ?? 'spices'}
              name={p.name}
              imageUrl={p.image_url}
              className="w-7 h-7 rounded-md flex-shrink-0"
            />
            <span style={{ fontSize: 12, color: T.body, flex: 1,
              ...(lang === 'ar' ? { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif" } : {})
            }}>
              {localName(p, lang)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.price }}>${p.price}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.muted }}>{t('gift.packaging')} fee</span>
          <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>+${box.packaging_fee.toFixed(2)}</span>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderTop: `1px solid ${T.border}`,
        backgroundColor: 'rgba(122,74,40,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: T.muted }}>{t('gift.qty') ?? 'Qty'}:</span>
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            <button onClick={() => onQtyChange(box.localId, box.quantity - 1)}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5ede0', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.muted}
            >−</button>
            <span style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.heading, backgroundColor: T.bgAlt, lineHeight: '24px', borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
              {box.quantity}
            </span>
            <button onClick={() => onQtyChange(box.localId, box.quantity + 1)}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5ede0', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.muted}
            >+</button>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.price, fontFamily: "'Cormorant Garamond', serif" }}>
          ${lineTotal.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CartDrawer
// ─────────────────────────────────────────────────────────────────────────────

const CartDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    items, removeFromCart, updateQuantity, totalPrice, clearCart,
    shippingCost, isFreeShipping, amountToFree, shippingConfig,
    // server gift boxes
    giftBoxes, removeGiftBox, updateGiftBoxQty,
    // guest gift boxes
    guestGiftBoxes, removeGuestGiftBox, updateGuestGiftBoxQty,
  } = useCart() as any

  const { t, isRTL, lang } = useLanguage()

  // Grand total including all gift boxes
  const giftBoxTotal = giftBoxes.reduce(
    (s: number, b: CartGiftBox) => s + parseFloat(b.total_price),
    0
  )
  const guestGiftTotal = guestGiftBoxes.reduce(
    (s: number, b: GuestGiftBox) =>
      s + (b.products.reduce((ps: number, p: any) => ps + parseFloat(p.price), 0) + b.packaging_fee) * b.quantity,
    0
  )
  const grandTotal = totalPrice + giftBoxTotal + guestGiftTotal + shippingCost

  const pct = Math.min((totalPrice / shippingConfig.freeShippingThreshold) * 100, 100)

  const regularItemCount   = items.reduce((s: number, i: any) => s + i.quantity, 0)
  const giftBoxCount       = giftBoxes.length + guestGiftBoxes.length
  const totalItemCount     = regularItemCount + giftBoxCount

  const hasAnyItems = items.length > 0 || giftBoxes.length > 0 || guestGiftBoxes.length > 0

  const [animKey, setAnimKey] = useState(0)
  useEffect(() => { if (isOpen) setAnimKey(k => k + 1) }, [isOpen])

  let animIdx = 0  // running counter for staggered animations

  return (
    <>
      <style>{keyframes}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(42,26,14,0.22)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 h-full w-full max-w-[400px] z-50 flex flex-col shadow-2xl"
        style={{
          backgroundColor: T.bg,
          [isRTL ? 'left' : 'right']: 0,
          borderLeft:  isRTL ? 'none' : `1px solid ${T.border}`,
          borderRight: isRTL ? `1px solid ${T.border}` : 'none',
          transform: isOpen ? 'translateX(0)' : `translateX(${isRTL ? '-100%' : '100%'})`,
          transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${T.border}`, opacity: isOpen ? 1 : 0, transform: isOpen ? 'translateY(0)' : 'translateY(-8px)', transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s' }}>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl font-bold" style={{ color: T.heading }}>{t('checkout.orderSummary')}</h2>
            {totalItemCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(122,74,40,0.09)', color: T.accent, border: `1px solid rgba(122,74,40,0.18)` }}>
                {totalItemCount} {totalItemCount === 1 ? t('shop.product') : t('shop.products')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color: T.muted }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.heading; (e.currentTarget as HTMLElement).style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted;   (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg)'; }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shipping progress bar */}
        {hasAnyItems && (
          <div className="px-5 py-3"
            style={{ backgroundColor: isFreeShipping ? T.greenBg : 'rgba(122,74,40,0.03)', borderBottom: `1px solid ${T.border}`, animation: 'shippingBarIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s both' }}>
            {isFreeShipping ? (
              <div className="flex items-center justify-center gap-2">
                <svg width="14" height="14" fill="none" stroke={T.green} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: T.green }}>{t('product.freeShipping')}</p>
              </div>
            ) : (
              <>
                <p className="text-xs mb-1.5" style={{ color: T.body }}>
                  {t('product.freeShippingMore', { amount: amountToFree.toFixed(2) })}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.progressBg }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: T.accent, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!hasAnyItems ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16"
              style={{ animation: 'emptyIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ backgroundColor: '#f5ede0', border: `2px solid ${T.border}` }}>
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#d4b896' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-serif text-lg font-semibold mb-1" style={{ color: T.heading }}>{t('checkout.cartEmpty')}</p>
              <p className="text-sm mb-6" style={{ color: T.muted }}>{t('checkout.cartEmptyDesc')}</p>
              <Link to="/products" onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: T.accent }}>
                {t('checkout.shopNow')}
              </Link>
            </div>
          ) : (
            <>
              {/* ── Regular items ─────────────────────────────────────────── */}
              {items.map((item: any) => {
                const delay = (animIdx++) * 0.05
                return (
                  <div key={`${item.product.id}-${animKey}`}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: T.itemBg, border: `1px solid ${T.border}`, animation: `drawerItemIn 0.4s cubic-bezier(0.22,1,0.36,1) ${delay}s both` }}>
                    <Link to={`/products/${item.product.slug}`} onClick={onClose} className="flex-shrink-0">
                      <ProductImage
                        type={item.product.category ?? item.product.imageType ?? 'spices'}
                        name={item.product.name}
                        imageUrl={item.product.image_url}
                        className="w-16 h-16 rounded-lg"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product.slug}`} onClick={onClose}>
                        <p className="text-sm font-semibold truncate transition-colors"
                          style={{ color: T.heading, ...(lang === 'ar' && { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif", direction: 'rtl' }) }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.accent}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.heading}>
                          {localName(item.product, lang)}
                        </p>
                      </Link>
                      <p className="text-sm font-bold mt-0.5" style={{ color: T.price }}>${item.product.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                          {[
                            { label: '−', action: () => updateQuantity(item.product.id, item.quantity - 1) },
                            null,
                            { label: '+', action: () => updateQuantity(item.product.id, item.quantity + 1) },
                          ].map((btn, i) =>
                            btn === null ? (
                              <span key="val" className="w-7 h-7 text-center text-sm font-semibold flex items-center justify-center"
                                style={{ borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, color: T.heading, backgroundColor: T.bgAlt }}>
                                {item.quantity}
                              </span>
                            ) : (
                              <button key={btn.label} onClick={btn.action}
                                className="w-7 h-7 flex items-center justify-center text-base transition-colors"
                                style={{ color: T.muted, backgroundColor: '#f5ede0' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.accent}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.muted}>
                                {btn.label}
                              </button>
                            )
                          )}
                        </div>
                        <span className="text-xs font-medium" style={{ color: T.muted }}>
                          = ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                        <button onClick={() => removeFromCart(item.product.id)} className="ml-auto p-1.5 rounded-lg transition-all" style={{ color: '#d4b896' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#b04040'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#d4b896'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* ── Server gift boxes (logged-in) ────────────────────────── */}
              {giftBoxes.map((box: CartGiftBox) => (
                <ServerGiftBoxRow
                  key={`gb-${box.id}-${animKey}`}
                  box={box}
                  lang={lang}
                  t={t}
                  onRemove={removeGiftBox}
                  onQtyChange={updateGiftBoxQty}
                  animDelay={(animIdx++) * 0.05}
                />
              ))}

              {/* ── Guest gift boxes (logged-out) ────────────────────────── */}
              {guestGiftBoxes.map((box: GuestGiftBox) => (
                <GuestGiftBoxRow
                  key={`ggb-${box.localId}-${animKey}`}
                  box={box}
                  lang={lang}
                  t={t}
                  onRemove={removeGuestGiftBox}
                  onQtyChange={updateGuestGiftBoxQty}
                  animDelay={(animIdx++) * 0.05}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {hasAnyItems && (
          <div className="px-5 py-5"
            style={{ borderTop: `1px solid ${T.border}`, backgroundColor: '#fdf9f4', animation: 'footerSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between" style={{ color: T.muted }}>
                <span>{t('checkout.subtotal')}</span>
                <span>${(totalPrice + giftBoxTotal + guestGiftTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ color: T.muted }}>
                <span>{t('checkout.shipping')}</span>
                <span style={{ color: isFreeShipping ? T.green : T.muted }}>
                  {isFreeShipping
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('checkout.shippingFree')}
                      </span>
                    : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2.5"
                style={{ borderTop: `1px solid ${T.border}`, color: T.heading }}>
                <span>{t('checkout.grandTotal')}</span>
                <span style={{ color: T.price }}>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Link to="/checkout" onClick={onClose}
              className="block w-full text-center text-white font-semibold py-3.5 rounded-xl text-sm tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: T.accent, boxShadow: '0 4px 16px rgba(122,74,40,0.26)' }}>
              {t('checkout.continuePayment')} →
            </Link>

            <div className="flex gap-3 mt-3">
              <Link to="/products" onClick={onClose}
                className="flex-1 py-2.5 text-center text-sm font-medium rounded-xl transition-colors"
                style={{ border: `1px solid ${T.border}`, color: T.body }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#c8a882'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                {t('checkout.continueShopping')}
              </Link>
              <button onClick={clearCart}
                className="px-4 py-2.5 text-xs rounded-xl transition-colors"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#b04040'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.muted}>
                {t('shop.clearAll')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default CartDrawer