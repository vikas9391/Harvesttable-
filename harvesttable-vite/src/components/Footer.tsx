// src/components/Footer.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/Languagecontext'

const Footer: React.FC = () => {
  const location = useLocation()
  const { t, isRTL } = useLanguage()
  const ref = useRef<HTMLElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (location.pathname.startsWith('/admin')) return null

  const SHOP_LINKS = [
    [t('shop.herbs'),      '/products?category=herbs'],
    [t('shop.teas'),       '/products?category=teas'],
    [t('shop.spices'),     '/products?category=spices'],
    [t('shop.giftBoxes'),  '/products?category=gift-boxes'],
    [t('nav.giftBuilder'), '/gift-builder'],
  ]

  const CARE_LINKS = [
    [t('footer.aboutUs'),      '/about'],
    [t('footer.shipping'),     '/shipping'],
    [t('footer.returns'),      '/returns'],
    [t('footer.contact'),      '/contact'],
  ]

  const badges = [
    {
      label: t('home.promise.organic'),
      icon: (
        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
    },
    {
      label: t('home.promise.fair'),
      icon: (
        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ),
    },
    {
      label: t('footer.secureCheckout'),
      icon: (
        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      ),
    },
  ]

  const fadeUp = (delay: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  })

  return (
    <footer ref={ref} style={{ backgroundColor: '#f4ede2', color: '#a08878', direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Top divider */}
      <div
        className="h-[1px] w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #d4b896, #c8a070, #d4b896, transparent)',
          transform: `scaleX(${vis ? 1 : 0})`,
          transformOrigin: 'center',
          transition: 'transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.05s',
        }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-14 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

          {/* Brand column */}
          <div className="col-span-2" style={fadeUp(0.1)}>
            <span className="font-serif text-2xl font-bold" style={{ color: '#7a4a28' }}>
                {t('nav.brandName')}
            </span>
            <p className="text-[9px] tracking-[0.28em] uppercase mt-1 mb-5" style={{ color: '#c0a888' }}>
              {t('nav.brandSub')}
            </p>
            <p className="text-sm leading-relaxed max-w-xs mb-6" style={{ color: '#9a8070' }}>
              {t('about.hero.desc')}
            </p>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, i) => (
                <span
                  key={badge.label}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(122,74,40,0.08)',
                    color: '#8a6040',
                    border: '1px solid rgba(122,74,40,0.15)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    opacity: vis ? 1 : 0,
                    transform: vis ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.92)',
                    transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${0.28 + i * 0.08}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${0.28 + i * 0.08}s`,
                  }}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div style={fadeUp(0.2)}>
            <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-5" style={{ color: '#7a4a28' }}>
              {t('common.shop')}
            </h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map(([label, to], i) => (
                <li
                  key={to}
                  style={{
                    opacity: vis ? 1 : 0,
                    transform: vis ? 'translateX(0)' : `translateX(${isRTL ? '10px' : '-10px'})`,
                    transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${0.25 + i * 0.06}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${0.25 + i * 0.06}s`,
                  }}
                >
                  <Link
                    to={to}
                    className="text-sm transition-colors"
                    style={{ color: '#a08878' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#7a4a28'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#a08878'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer care links */}
          <div style={fadeUp(0.28)}>
            <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-5" style={{ color: '#7a4a28' }}>
              {t('footer.customerCare')}
            </h4>
            <ul className="space-y-3">
              {CARE_LINKS.map(([label, to], i) => (
                <li
                  key={label}
                  style={{
                    opacity: vis ? 1 : 0,
                    transform: vis ? 'translateX(0)' : `translateX(${isRTL ? '10px' : '-10px'})`,
                    transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${0.32 + i * 0.06}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${0.32 + i * 0.06}s`,
                  }}
                >
                  <Link
                    to={to}
                    className="text-sm transition-colors"
                    style={{ color: '#a08878' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#7a4a28'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#a08878'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(122,74,40,0.12)', ...fadeUp(0.45) }}
        >
          <p className="text-xs" style={{ color: '#c0a888' }}>
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs transition-colors"
              style={{ color: '#c0a888' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#8a6040'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#c0a888'}
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to="/terms"
              className="text-xs transition-colors"
              style={{ color: '#c0a888' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#8a6040'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#c0a888'}
            >
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer