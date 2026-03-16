import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useRequireAuth } from '../components/Navbar'
import { useLanguage } from '../context/Languagecontext'
import heroSpices from '../assets/hero-spices.png' 
import { useFeaturedProducts, useSeasonalProducts, ApiProduct } from '../hooks/useProducts'

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#faf7f2', surface: '#ffffff', border: '#ede5d8', borderHov: '#c8a882',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878',
  accent: '#7a4a28', accentHov: '#8f5830', label: '#9a6840',
}

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: light ? 'rgba(255,235,200,0.7)' : C.label, marginBottom: 10 }}>{children}</p>
)

// ─── Shimmer line ─────────────────────────────────────────────────────────────
const ShimmerLine: React.FC<{ active: boolean; delay?: number }> = ({ active, delay = 0 }) => (
  <div style={{ position: 'relative', height: 1, maxWidth: 60, overflow: 'hidden', margin: '0 auto 18px' }}>
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, transparent, ${C.accent}, transparent)`, transform: active ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: `transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s` }}/>
  </div>
)

// ─── Skeleton card (shown while loading) ─────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, backgroundColor: C.surface }}>
    <div style={{ height: 200, background: 'linear-gradient(90deg,#f0e8dc 25%,#faf7f2 50%,#f0e8dc 75%)', backgroundSize: '200% 100%', animation: 'shimmerBg 1.4s ease infinite' }}/>
    <div style={{ padding: 16 }}>
      <div style={{ height: 12, borderRadius: 4, background: '#ede5d8', marginBottom: 8 }}/>
      <div style={{ height: 10, borderRadius: 4, background: '#ede5d8', width: '60%' }}/>
    </div>
    <style>{`@keyframes shimmerBg{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// HERO — image background, no canvas animations
// ═══════════════════════════════════════════════════════════════════════════════
const HeroSection: React.FC<{ onShopClick: () => void }> = ({ onShopClick }) => {
  const { t } = useLanguage()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
        *{box-sizing:border-box}
        .bhero-fill{position:relative;overflow:hidden;background:#7a4a28;color:#f5ede0;border:none;padding:15px 44px;border-radius:2px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 28px rgba(122,74,40,0.32),inset 0 1px 0 rgba(255,210,160,0.14);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s}
        .bhero-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,215,150,0.14) 0%,transparent 55%);opacity:0;transition:opacity 0.3s}
        .bhero-fill:hover{transform:translateY(-3px);box-shadow:0 14px 44px rgba(122,74,40,0.38),inset 0 1px 0 rgba(255,210,160,0.14)}
        .bhero-fill:hover::after{opacity:1}
        .bhero-outline{background:rgba(255,255,255,0.10);color:#f5ede0;border:1px solid rgba(255,255,255,0.40);padding:14px 40px;border-radius:2px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(6px);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1)}
        .bhero-outline:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.7);transform:translateY(-3px)}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 0 3px rgba(255,210,160,0.18)}50%{box-shadow:0 0 0 7px rgba(255,210,160,0.06)}}
      `}</style>
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Hero image background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${heroSpices})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}/>

        {/* Dark overlay for text legibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(162deg, rgba(20,10,4,0.62) 0%, rgba(30,14,4,0.54) 40%, rgba(40,18,6,0.48) 70%, rgba(20,10,4,0.60) 100%)',
        }}/>

        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 48%, rgba(10,4,2,0.40) 100%)',
          pointerEvents: 'none',
        }}/>

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '96px 28px 80px', maxWidth: 700 }}>
          <div style={{ marginBottom: 32, display: 'inline-block' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 18px 7px 14px', borderRadius: 2, border: '1px solid rgba(255,210,160,0.30)', background: 'rgba(255,210,160,0.10)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f0c080', animation: 'dotPulse 2.6s ease-in-out infinite' }}/>
              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.26em', color: '#f0c080', textTransform: 'uppercase' }}>{t('home.badge')}</span>
            </div>
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(50px,8vw,96px)', fontWeight: 600, color: '#f8f0e4', lineHeight: 1.02, margin: '0 0 2px', letterSpacing: '-0.015em' }}>
            {t('home.hero.title')}
          </h1>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(50px,8vw,96px)', fontWeight: 300, fontStyle: 'italic', color: '#e8b87a', lineHeight: 1.02, margin: '0 0 32px', letterSpacing: '-0.01em' }}>
            {t('home.hero.subtitle')}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '0 auto 32px', maxWidth: 360 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(255,210,160,0.40))' }}/>
            <svg width="24" height="14" viewBox="0 0 24 14" fill="none"><path d="M12 1 L23 7 L12 13 L1 7 Z" fill="none" stroke="rgba(255,210,160,0.50)" strokeWidth="0.9"/><circle cx="12" cy="7" r="2.2" fill="rgba(255,210,160,0.50)"/><line x1="4" y1="7" x2="9" y2="7" stroke="rgba(255,210,160,0.36)" strokeWidth="0.8"/><line x1="15" y1="7" x2="20" y2="7" stroke="rgba(255,210,160,0.36)" strokeWidth="0.8"/></svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(255,210,160,0.40))' }}/>
          </div>

          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 300, color: 'rgba(240,220,190,0.88)', lineHeight: 1.9, maxWidth: 430, margin: '0 auto 44px', letterSpacing: '0.025em' }}>
            {t('home.hero.desc')}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 58 }}>
            <button className="bhero-fill" onClick={onShopClick}>{t('home.hero.cta')}</button>
            <Link to="/about" style={{ textDecoration: 'none' }}><button className="bhero-outline">{t('home.hero.ctaSecond')}</button></Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', rowGap: 20 }}>
            {([
              [t('home.hero.stat1'), '200+'],
              null,
              [t('home.hero.stat2'), '50+'],
              null,
              [t('home.hero.stat3'), '4.9★'],
              null,
              [t('home.hero.stat4'), '—'],
            ] as ([string, string] | null)[]).map((item, i) =>
              item === null
                ? <div key={i} style={{ width: 1, height: 36, background: 'linear-gradient(to bottom,transparent,rgba(255,210,160,0.30),transparent)', alignSelf: 'center', margin: '0 32px' }}/>
                : <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 600, color: '#f0d8b0', lineHeight: 1, margin: '0 0 4px' }}>{item[1]}</p>
                    <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 9, fontWeight: 600, color: 'rgba(230,200,160,0.70)', letterSpacing: '0.20em', textTransform: 'uppercase', margin: 0 }}>{item[0]}</p>
                  </div>
            )}
          </div>

          <div style={{ marginTop: 58, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 9, letterSpacing: '0.28em', color: 'rgba(230,200,160,0.65)', textTransform: 'uppercase', margin: 0 }}>{t('home.hero.discover')}</p>
            <div style={{ width: 1, height: 50, background: 'linear-gradient(to bottom,rgba(255,210,160,0.55),transparent)' }}/>
          </div>
        </div>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONAL — uses real ApiProduct[] from API
// ═══════════════════════════════════════════════════════════════════════════════
const SeasonalSection: React.FC<{ products: ApiProduct[]; loading: boolean }> = ({ products, loading }) => {
  const { t } = useLanguage()
  const [ref, inView] = useInView(0.1)
  return (
    <>
      <style>{`@keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <section ref={ref} style={{ padding: '88px 24px', position: 'relative', overflow: 'hidden', background: '#faf7f2' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.035 }} viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice">
          <circle cx="600" cy="-100" r="500" fill="none" stroke="#7a4a28" strokeWidth="1"/>
          <circle cx="600" cy="-100" r="580" fill="none" stroke="#7a4a28" strokeWidth="0.5"/>
          <circle cx="600" cy="-100" r="660" fill="none" stroke="#7a4a28" strokeWidth="0.3"/>
        </svg>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '5px 14px', borderRadius: 2, background: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.15)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8603a', display: 'inline-block', animation: 'timerPulse 1.5s ease-in-out infinite' }}/>
              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', color: '#c8603a', textTransform: 'uppercase' }}>{t('home.seasonal.badge')}</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, color: C.heading, margin: '0 0 8px', transform: inView ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s' }}>
                {t('home.seasonal.title')}
              </h2>
            </div>
            <ShimmerLine active={inView} delay={0.3}/>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 300, color: C.muted, maxWidth: 360, margin: '0 auto', lineHeight: 1.7, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.7s ease 0.45s' }}>
              {t('home.seasonal.desc')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,320px))', gap: 24, alignItems: 'start'}}>
            {loading
              ? [0, 1, 2].map(i => <SkeletonCard key={i}/>)
              : products.map((p, i) => (
                  <div key={p.id} style={{ height: 'fit-content', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0) rotate(0deg)' : `translateY(48px) rotate(${(i - 1) * 3}deg)`, transition: `opacity 0.7s ease ${0.2 + i * 0.12}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.12}s` }}>
                    <ProductCard product={p as any}/>
                  </div>
                ))
            }
          </div>
        </div>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURED — uses real ApiProduct[] from API
// ═══════════════════════════════════════════════════════════════════════════════
const FeaturedSection: React.FC<{ products: ApiProduct[]; loading: boolean; onExplore: () => void }> = ({ products, loading, onExplore }) => {
  const { t } = useLanguage()
  const [ref, inView] = useInView(0.1)
  return (
    <section ref={ref} style={{ padding: '88px 24px', background: '#f4ede2', position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04 }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs><pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="#7a4a28"/></pattern></defs>
        <rect width="100" height="100" fill="url(#dots)"/>
      </svg>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 52 }}>
          <div>
            <SectionLabel>{t('home.featured.label')}</SectionLabel>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, color: C.heading, margin: '0 0 6px', transform: inView ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s' }}>
                {t('home.featured.title')}
              </h2>
            </div>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 300, color: C.muted, margin: 0, opacity: inView ? 1 : 0, transition: 'opacity 0.6s ease 0.4s' }}>
              {t('home.featured.desc')}
            </p>
          </div>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, textDecoration: 'none', opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(20px)', transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s' }}>
            {t('home.featured.exploreAll')}
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,320px))', gap: 20, alignItems: 'start' }}>
          {loading
            ? [0, 1, 2, 3].map(i => <SkeletonCard key={i}/>)
            : products.map((p, i) => (
                <div key={p.id} style={{ height: 'fit-content', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(60px)', transition: `opacity 0.75s ease ${0.15 + i * 0.1}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.1}s` }}>
                  <ProductCard product={p as any}/>
                </div>
              ))
          }
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMISE — unchanged
// ═══════════════════════════════════════════════════════════════════════════════
const promiseIcons: Record<string, React.ReactNode> = {
  organic: (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4a6 6 0 010 12A6 6 0 0112 6z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"/></svg>),
  fair: (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>),
  shipping: (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>),
  authentic: (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>),
}
const PromiseCard: React.FC<{ iconKey: string; title: string; desc: string; index: number; inView: boolean }> = ({ iconKey, title, desc, index, inView }) => {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: C.surface, border: `1px solid ${hov ? C.borderHov : C.border}`, borderRadius: 16, padding: '32px 28px', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0) scale(1)' : `translateY(50px) scale(0.95)`, transition: `opacity 0.65s ease ${0.1 + index * 0.12}s, transform 0.65s cubic-bezier(0.34,1.2,0.64,1) ${0.1 + index * 0.12}s, box-shadow 0.3s, border-color 0.3s`, boxShadow: hov ? '0 16px 48px rgba(122,74,40,0.13)' : '0 2px 12px rgba(122,74,40,0.05)', cursor: 'default' }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: hov ? 'rgba(122,74,40,0.10)' : 'rgba(122,74,40,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a4a28', transition: 'background 0.3s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', transform: hov ? 'scale(1.12) rotate(-4deg)' : 'scale(1) rotate(0deg)' }}>
          {promiseIcons[iconKey]}
        </div>
        {hov && <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: '1.5px solid rgba(122,74,40,0.22)', animation: 'ringExpand 0.4s ease forwards' }}/>}
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: '0 0 8px' }}>{title}</h3>
      <div style={{ width: 28, height: 1, background: `linear-gradient(to right,${C.accent},transparent)`, marginBottom: 10, transform: hov ? 'scaleX(1.6)' : 'scaleX(1)', transformOrigin: 'left', transition: 'transform 0.3s ease' }}/>
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 300, color: C.muted, lineHeight: 1.75, margin: 0 }}>{desc}</p>
    </div>
  )
}
const PromiseSection: React.FC = () => {
  const { t } = useLanguage()
  const [ref, inView] = useInView(0.1)
  const items = [
    { iconKey: 'organic',   title: t('home.promise.organic'),   desc: t('home.promise.organicDesc') },
    { iconKey: 'fair',      title: t('home.promise.fair'),      desc: t('home.promise.fairDesc') },
    { iconKey: 'shipping',  title: t('home.promise.shipping'),  desc: t('home.promise.shippingDesc') },
    { iconKey: 'authentic', title: t('home.promise.authentic'), desc: t('home.promise.authenticDesc') },
  ]
  return (
    <>
      <style>{`@keyframes ringExpand{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}`}</style>
      <section ref={ref} style={{ padding: '88px 24px', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <SectionLabel>{t('home.promise.label')}</SectionLabel>
            <div style={{ overflow: 'hidden' }}><h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, color: C.heading, margin: '0 0 6px', transform: inView ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s' }}>{t('home.promise.title')}</h2></div>
            <ShimmerLine active={inView} delay={0.3}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,320px))', gap: 20 }}>
            {items.map((item, i) => <PromiseCard key={item.title} {...item} index={i} inView={inView}/>)}
          </div>
        </div>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GIFT CTA — unchanged
// ═══════════════════════════════════════════════════════════════════════════════
const GiftSection: React.FC = () => {
  const { t } = useLanguage()
  const [ref, inView] = useInView(0.15)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const sectionRef = useRef<HTMLDivElement>(null)
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height })
  }, [])
  return (
    <>
      <style>{`@keyframes giftFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }`}</style>
      <section ref={ref} style={{ padding: '88px 24px', background: C.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div ref={sectionRef} onMouseMove={onMouseMove} style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', textAlign: 'center', padding: '72px 48px', background: 'linear-gradient(135deg,#edddc8 0%,#e5ceb0 50%,#eadcc4 100%)', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)', transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 24 }} viewBox="0 0 900 320" preserveAspectRatio="none">
              <rect x="1" y="1" width="898" height="318" rx="23" fill="none" stroke="rgba(122,74,40,0.3)" strokeWidth="1.5" strokeDasharray="1200" strokeDashoffset={inView ? 0 : 1200} style={{ transition: 'stroke-dashoffset 2.2s cubic-bezier(0.22,1,0.36,1) 0.3s' }}/>
            </svg>
            <div style={{ position: 'absolute', top: '10%', right: '8%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(122,74,40,0.06)', pointerEvents: 'none', transform: `translate(${(mousePos.x - 0.5) * -24}px,${(mousePos.y - 0.5) * -16}px)`, transition: 'transform 0.6s ease' }}/>
            <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(122,74,40,0.08)', pointerEvents: 'none', transform: `translate(${(mousePos.x - 0.5) * -40}px,${(mousePos.y - 0.5) * -28}px)`, transition: 'transform 0.6s ease' }}/>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(122,74,40,0.10)', border: '1px solid rgba(122,74,40,0.18)', animation: inView ? 'giftFloat 3.5s ease-in-out infinite' : undefined }}>
              <svg width="32" height="32" fill="none" stroke="#7a4a28" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2M2 12h20M12 7v14"/></svg>
            </div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <SectionLabel>{t('home.gift.label')}</SectionLabel>
              <div style={{ overflow: 'hidden', marginBottom: 12 }}><h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(30px,5vw,52px)', fontWeight: 600, color: C.heading, margin: 0, transform: inView ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s' }}>{t('home.gift.title')}</h2></div>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 300, color: C.body, maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.75, opacity: inView ? 1 : 0, transition: 'opacity 0.7s ease 0.6s' }}>{t('home.gift.desc')}</p>
              <Link to="/gift-builder" style={{ textDecoration: 'none', display: 'inline-block', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.6s ease 0.75s, transform 0.6s ease 0.75s' }}>
                <div style={{ display: 'inline-block', padding: '14px 40px', background: C.accent, color: '#f5ede0', fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 2, boxShadow: '0 6px 28px rgba(122,74,40,0.28)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 40px rgba(122,74,40,0.38)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(122,74,40,0.28)'; }}>
                  {t('home.gift.cta')} →
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE — wires API hooks
// ═══════════════════════════════════════════════════════════════════════════════
const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { guard, AuthModal } = useRequireAuth()

  const { products: featured, loading: featuredLoading }  = useFeaturedProducts()
  const { products: seasonal, loading: seasonalLoading }  = useSeasonalProducts()

  return (
    <>
      <AuthModal/>
      <div style={{ backgroundColor: C.bg }}>
        <HeroSection onShopClick={() => guard(() => navigate('/products'))}/>

        {(seasonalLoading || seasonal.length > 0) && (
          <SeasonalSection products={seasonal} loading={seasonalLoading}/>
        )}

        <FeaturedSection
          products={featured}
          loading={featuredLoading}
          onExplore={() => guard(() => navigate('/products'))}
        />
        <PromiseSection/>
        <GiftSection/>
      </div>
    </>
  )
}

export default HomePage