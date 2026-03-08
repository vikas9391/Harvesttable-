// src/components/ProductImage.tsx
import React, { useState } from 'react'

interface Props { type: string; name: string; className?: string }

// SVG icon components per category — no emojis
const Icons: Record<string, React.FC<{ opacity?: number }>> = {
  spices: ({ opacity = 0.72 }) => (
    <svg width="42" height="42" fill="none" viewBox="0 0 24 24" style={{ opacity }}>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M8.5 8.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5c0 2.5-3.5 5-3.5 5s-3.5-2.5-3.5-5z"/>
      <circle cx="12" cy="8.5" r="1.2" fill="rgba(255,255,255,0.9)"/>
      <path stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round"
        d="M9 14.5c0 1.5 1.34 2.5 3 2.5s3-1 3-2.5"/>
    </svg>
  ),
  tea: ({ opacity = 0.72 }) => (
    <svg width="42" height="42" fill="none" viewBox="0 0 24 24" style={{ opacity }}>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M17 8H5a1 1 0 00-1 1v7a4 4 0 004 4h4a4 4 0 004-4v-1h1a3 3 0 000-6z"/>
      <path stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round"
        d="M8 2c0 1.5 2 2 2 3.5M12 2c0 1.5 2 2 2 3.5"/>
    </svg>
  ),
  market: ({ opacity = 0.72 }) => (
    <svg width="42" height="42" fill="none" viewBox="0 0 24 24" style={{ opacity }}>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
  ),
  herbs: ({ opacity = 0.72 }) => (
    <svg width="42" height="42" fill="none" viewBox="0 0 24 24" style={{ opacity }}>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M12 22V12M12 12C12 7 7 4 3 5c0 5 3 8 9 7M12 12c0-5 5-8 9-7 0 5-3 8-9 7"/>
      <path stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round"
        d="M12 12c0 3 0 6 0 10"/>
    </svg>
  ),
  garden: ({ opacity = 0.72 }) => (
    <svg width="42" height="42" fill="none" viewBox="0 0 24 24" style={{ opacity }}>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
      <path stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round"
        d="M9 15l3-3 3 3"/>
    </svg>
  ),
  gift: ({ opacity = 0.72 }) => (
    <svg width="42" height="42" fill="none" viewBox="0 0 24 24" style={{ opacity }}>
      <path stroke="rgba(255,255,255,0.9)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
        d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  ),
}

const configs: Record<string, { from: string; to: string; mid: string }> = {
  spices: { from: '#c17a3a', to: '#8b3a14', mid: '#a85c26' },
  tea:    { from: '#4a7a3a', to: '#2d5a28', mid: '#3d6832' },
  market: { from: '#b8893a', to: '#7a5218', mid: '#9a6d28' },
  herbs:  { from: '#c45070', to: '#8b2040', mid: '#a83858' },
  garden: { from: '#4a8050', to: '#2d5a38', mid: '#3a6c44' },
  gift:   { from: '#9a4a7a', to: '#6a1a50', mid: '#802060' },
}

const keyframes = `
@keyframes productImageIn {
  from { opacity: 0; transform: scale(1.04); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes iconFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}
@keyframes shimmerSweep {
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(250%) skewX(-12deg); }
}
`

const ProductImage: React.FC<Props> = ({ type, name, className = '' }) => {
  const c = configs[type] ?? configs.spices
  const Icon = Icons[type] ?? Icons.spices
  const [loaded, setLoaded] = useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 40)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(150deg, ${c.from} 0%, ${c.mid} 50%, ${c.to} 100%)`,
        animation: loaded ? 'productImageIn 0.45s cubic-bezier(0.22,1,0.36,1) both' : 'none',
      }}
    >
      <style>{keyframes}</style>

      {/* Radial highlight */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)' }}
      />

      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
          animation: 'shimmerSweep 2.4s cubic-bezier(0.4,0,0.6,1) 0.5s infinite',
        }}
      />

      {/* Category icon */}
      <div
        className="relative"
        style={{
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.22))',
          animation: 'iconFloat 3s ease-in-out infinite',
        }}
      >
        <Icon opacity={0.88}/>
      </div>

      {/* Product name label */}
      <span style={{
        position: 'relative',
        color: 'rgba(255,255,255,0.50)',
        fontSize: '0.6rem',
        marginTop: '8px',
        letterSpacing: '0.06em',
        maxWidth: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        textTransform: 'uppercase',
      }}>
        {name}
      </span>
    </div>
  )
}

export default ProductImage