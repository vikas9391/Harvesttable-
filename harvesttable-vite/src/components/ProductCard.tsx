// src/components/ProductCard.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Product } from '../types'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/Languagecontext'
import ProductImage from './ProductImage'

interface Props { product: Product }

const Tag: React.FC<{ label: string; bg: string; color: string }> = ({ label, bg, color }) => (
  <span
    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
    style={{ backgroundColor: bg, color, border: `1px solid ${color}22` }}
  >
    {label}
  </span>
)

const keyframes = `
@keyframes addedCheck {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes badgePop {
  0%   { transform: scale(0.5) translateY(4px); opacity: 0; }
  70%  { transform: scale(1.12) translateY(0); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes lowStockIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`

const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart()
  const { t, isRTL } = useLanguage()
  const [added, setAdded] = useState(false)
  const [pressed, setPressed] = useState(false)

  const handleAdd = () => {
        addToCart(product)
        setAdded(true)
        setPressed(true)
        setTimeout(() => setAdded(false), 1800)
        setTimeout(() => setPressed(false), 150)    
  }

  const isLowStock  = product.stock_quantity <= 10
  const hasDiscount = !!product.original_price

  const surface   = '#ffffff'
  const border    = '#ede5d8'
  const borderHov = '#c8a882'
  const heading   = '#2a1a0e'
  const muted     = '#a08878'
  const accent    = '#7a4a28'
  const price     = '#8b3a1a'
  const green     = '#3a6028'
  const greenBg   = 'rgba(58,96,40,0.07)'

  return (
    <>
      <style>{keyframes}</style>
      <div
        className="group rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: surface,
          border: `1px solid ${border}`,
          boxShadow: '0 2px 10px rgba(122,74,40,0.05)',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s cubic-bezier(0.22,1,0.36,1)',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 8px 28px rgba(122,74,40,0.12)'
          el.style.borderColor = borderHov
          el.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '0 2px 10px rgba(122,74,40,0.05)'
          el.style.borderColor = border
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <Link to={`/products/${product.slug}`}>
            <ProductImage
              type={product.imageType}
              name={product.name}
              className="w-full h-48 sm:h-52 transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-3 flex flex-col gap-1.5" style={{ [isRTL ? 'right' : 'left']: '12px' }}>
            {product.badge && (
              <span
                className="text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg shadow-sm"
                style={{ backgroundColor: price, animation: 'badgePop 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
              >
                {product.badge}
              </span>
            )}
            {hasDiscount && (
              <span
                className="text-white text-[9px] font-bold tracking-wide px-2.5 py-1 rounded-lg shadow-sm"
                style={{ backgroundColor: green, animation: 'badgePop 0.4s cubic-bezier(0.22,1,0.36,1) 0.16s both' }}
              >
                SALE
              </span>
            )}
          </div>

          {/* Low stock indicator */}
          {isLowStock && (
            <div
              className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(250,247,242,0.92)',
                border: `1px solid ${border}`,
                animation: 'lowStockIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.2s both',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: '#c87840' }}/>
              <span className="text-[10px] font-medium" style={{ color: accent }}>
                {t('product.lowStock', { qty: String(product.stock_quantity) })}
              </span>
            </div>
          )}

          {/* Hover overlay — View Details */}
          <Link
            to={`/products/${product.slug}`}
            className="absolute inset-0 flex items-end justify-center pb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'linear-gradient(to top, rgba(42,26,14,0.18) 0%, transparent 60%)' }}
          >
            <span
              className="text-white text-xs font-semibold px-4 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(42,26,14,0.55)', backdropFilter: 'blur(4px)' }}
            >
              {t('product.details')}
            </span>
          </Link>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4">
          <p className="text-[9px] tracking-[0.28em] uppercase font-bold mb-1" style={{ color: '#9a6840' }}>
            {product.origin}
          </p>

          <Link to={`/products/${product.slug}`}>
            <h3
              className="font-serif text-base font-bold mb-2 leading-snug transition-colors"
              style={{ color: heading }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = heading}
            >
              {product.name}
            </h3>
          </Link>

          {/* Dietary tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.is_organic     && <Tag label={t('shop.organic')}    bg="rgba(58,96,40,0.08)"  color="#3a6028"/>}
            {product.is_vegan       && <Tag label={t('shop.vegan')}      bg="rgba(122,74,40,0.08)" color="#7a4a28"/>}
            {product.is_gluten_free && <Tag label={t('shop.glutenFree')} bg="rgba(58,90,154,0.08)" color="#3a5a9a"/>}
            {product.is_fair_trade  && <Tag label={t('shop.fairTrade')}  bg="rgba(100,80,40,0.08)" color="#645028"/>}
          </div>

          <div className="flex-1"/>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-lg font-bold" style={{ color: price }}>
                ${product.price}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through" style={{ color: muted }}>
                  ${product.original_price}
                </span>
              )}
            </div>

            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
              style={{
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                transform: pressed ? 'scale(0.93)' : 'translateY(0)',
                ...(added
                  ? { backgroundColor: greenBg, color: green, border: `1px solid rgba(58,96,40,0.22)` }
                  : { backgroundColor: accent, color: '#fff', boxShadow: '0 3px 10px rgba(122,74,40,0.28)' }
                ),
              }}
              onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if (!added) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              {added ? (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ animation: 'addedCheck 0.35s cubic-bezier(0.22,1,0.36,1)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  {t('product.added')}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  {t('product.addToCart')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductCard