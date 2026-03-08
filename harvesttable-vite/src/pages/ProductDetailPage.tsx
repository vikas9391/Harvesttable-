// src/pages/ProductDetailPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct, useProducts, ApiProduct } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/Languagecontext';
import ProductCard from '../components/ProductCard'

const C = {
  bg: '#faf7f2', surface: '#ffffff', border: '#ede5d8',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878',
  accent: '#7a4a28', accentHov: '#8f5830', label: '#9a6840',
  price: '#8b3a1a', green: '#3a6028', greenBg: 'rgba(58,96,40,0.07)',
};

function useInView(threshold = 0.12): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Placeholder image when no image_url returned from API
const PlaceholderImage: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <div className={className} style={{ background: 'linear-gradient(135deg,#e8ddd0,#d4c4b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, opacity: 0.5 }}>{name.charAt(0)}</span>
  </div>
);

const ProductDetailPage: React.FC = () => {
  const { slug }        = useParams<{ slug: string }>();
  const navigate        = useNavigate();
  const { addToCart }   = useCart();
  const { t, isRTL }   = useLanguage();
  const [qty,        setQty]        = useState(1);
  const [added,      setAdded]      = useState(false);
  const [activeTab,  setActiveTab]  = useState<'description' | 'details'>('description');
  const [vis,        setVis]        = useState(false);
  const [relRef,     relInView]     = useInView(0.1);

  const { product, loading, error } = useProduct(slug);

  // Related products (same category, different id)
  const { products: relatedAll } = useProducts({
    category: product?.category,
  });
  const related = relatedAll.filter(p => p.id !== product?.id).slice(0, 3);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(timer);
  }, [slug]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
    </div>
  );

  // ── Not found ─────────────────────────────────────────────────────────────
  if (error || !product) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ backgroundColor: C.bg }}>
      <div className="text-center">
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.08)', border: `1px solid rgba(122,74,40,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" fill="none" stroke={C.accent} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p className="text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond',serif", color: C.heading }}>{t('product.notFound')}</p>
        <p className="text-sm mb-6" style={{ color: C.muted }}>Slug: "{slug}"</p>
        <button onClick={() => navigate('/products')} style={{ backgroundColor: C.accent, color: '#fff', padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          {t('product.backToShop')}
        </button>
      </div>
    </div>
  );

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product as any);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const badges = [
    product.is_organic     && { label: t('shop.organic'),    bg: 'rgba(58,96,40,0.08)',   border: 'rgba(58,96,40,0.22)',   color: '#3a6028' },
    product.is_vegan       && { label: t('shop.vegan'),      bg: 'rgba(58,110,50,0.08)',  border: 'rgba(58,110,50,0.22)',  color: '#3a6e30' },
    product.is_gluten_free && { label: t('shop.glutenFree'), bg: 'rgba(122,74,40,0.07)', border: 'rgba(122,74,40,0.22)',  color: '#7a4a28' },
    product.is_fair_trade  && { label: t('shop.fairTrade'),  bg: 'rgba(58,90,154,0.07)', border: 'rgba(58,90,154,0.22)',  color: '#3a5a9a' },
  ].filter(Boolean) as { label: string; bg: string; border: string; color: string }[];

  const isLowStock = (product.stock_quantity ?? 999) <= 10;

  const fade = (delay: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  });

  const slideLeft = (delay: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateX(0)' : `translateX(${isRTL ? '36px' : '-36px'})`,
    transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  });

  const freeShippingThreshold = 50;
  const orderTotal = parseFloat(product.price) * qty;
  const shippingMsg = orderTotal >= freeShippingThreshold
    ? t('product.freeShipping')
    : t('product.freeShippingMore', { amount: (freeShippingThreshold - orderTotal).toFixed(2) });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes badgePop   { 0%{opacity:0;transform:scale(0.7) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes imageFadeIn{ from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        .product-image-wrap   { animation: imageFadeIn 0.9s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
      <div style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }} className="min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Breadcrumb — all links use /products (not /shop) */}
          <nav style={{ ...fade(0), display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 32, color: C.muted, flexWrap: 'wrap' }}>
            <Link to="/"         style={{ color: C.muted, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>{t('common.home')}</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link to="/products" style={{ color: C.muted, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>{t('common.shop')}</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link to={`/products?category=${product.category}`} style={{ color: C.muted, textDecoration: 'none', textTransform: 'capitalize' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>
              {product.category.replace('-', ' ')}
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: C.body }}>{product.name}</span>
          </nav>

          {/* Product layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 48, marginBottom: 80 }}>

            {/* Image */}
            <div style={{ ...slideLeft(0.08), position: 'relative' }}>
              <div className="product-image-wrap" style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, boxShadow: '0 12px 48px rgba(122,74,40,0.14)' }}>
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} className="h-72 sm:h-96 lg:h-[520px] w-full" style={{ objectFit: 'cover', display: 'block' }}/>
                  : <PlaceholderImage name={product.name} className="h-72 sm:h-96 lg:h-[520px] w-full"/>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(42,26,14,0.18) 0%, transparent 50%)' }}/>
              </div>
              {product.badge && (
                <span style={{ position: 'absolute', top: 16, [isRTL ? 'right' : 'left']: 16, backgroundColor: '#8b3a1a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 8, boxShadow: '0 4px 14px rgba(139,58,26,0.35)', animation: 'badgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.4s both' }}>
                  {product.badge}
                </span>
              )}
              {isLowStock && (
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(250,247,242,0.94)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, animation: 'badgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.6s both' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c87840', flexShrink: 0, animation: 'timerPulse 1.5s ease-in-out infinite', display: 'inline-block' }}/>
                  <p style={{ fontSize: 12, color: C.accent, margin: 0 }}>
                    {t('product.lowStock', { qty: String(product.stock_quantity) })}
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ ...fade(0.1), marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to={`/products?category=${product.category}`} style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, color: C.label, textDecoration: 'none' }}>
                  {product.category.replace('-', ' ')}
                </Link>
                <span style={{ color: C.border }}>·</span>
                <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted }}>{product.origin}</span>
              </div>

              <div style={{ overflow: 'hidden', marginBottom: 16 }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: C.heading, margin: 0, lineHeight: 1.05, transform: vis ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.85s cubic-bezier(0.22,1,0.36,1) 0.15s' }}>
                  {product.name}
                </h1>
              </div>

              <div style={{ height: 1, maxWidth: 48, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: '100%', background: `linear-gradient(to right, ${C.accent}, transparent)`, transform: vis ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: isRTL ? 'right' : 'left', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s' }}/>
              </div>

              {/* Badges */}
              <div style={{ ...fade(0.25), display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {badges.map((b, i) => (
                  <span key={b.label} style={{ fontSize: 11, border: `1px solid ${b.border}`, padding: '4px 12px', borderRadius: 24, fontWeight: 600, letterSpacing: '0.06em', backgroundColor: b.bg, color: b.color, animation: `badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.35 + i * 0.08}s both` }}>
                    {b.label}
                  </span>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ ...fade(0.3), marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  {(['description', 'details'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ paddingBottom: 12, fontSize: 13, letterSpacing: '0.04em', textTransform: 'capitalize', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab ? C.accent : 'transparent'}`, marginBottom: -1, cursor: 'pointer', transition: 'all 0.25s ease', color: activeTab === tab ? C.accent : C.muted, fontWeight: activeTab === tab ? 600 : 400, fontFamily: "'Jost', sans-serif" }}>
                      {tab === 'description' ? t('product.description') : t('product.details')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...fade(0.35), marginBottom: 28, minHeight: 80 }}>
                {activeTab === 'description' && (
                  <p style={{ lineHeight: 1.85, color: C.body, fontSize: 14, margin: 0 }}>{product.description}</p>
                )}
                {activeTab === 'details' && (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {[
                      [t('product.category'), product.category.replace('-', ' ')],
                      [t('product.origin'),   product.origin],
                      [t('product.stock'),    `${product.stock_quantity ?? '—'} ${t('product.available')}`],
                      [t('product.certifications'), badges.map(b => b.label).join(', ') || t('product.none')],
                    ].map(([k, v], idx, arr) => (
                      <div key={k} style={{ display: 'flex', gap: 16, padding: '12px 16px', fontSize: 13, borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ width: 120, flexShrink: 0, fontWeight: 600, color: C.muted, textTransform: 'capitalize' }}>{k}</span>
                        <span style={{ color: C.body, textTransform: 'capitalize' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price */}
              <div style={{ ...fade(0.42), display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 600, color: C.price, lineHeight: 1 }}>
                  ${product.price}
                </span>
                <span style={{ fontSize: 12, color: C.muted }}>{t('product.qty')}</span>
              </div>

              {/* Add to cart */}
              <div style={{ ...fade(0.48), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fdf9f4' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 44, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, transition: 'color 0.2s', fontFamily: 'inherit' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontWeight: 700, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, color: C.heading, fontSize: 14 }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: 40, height: 44, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, transition: 'color 0.2s', fontFamily: 'inherit' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>+</button>
                </div>

                <button onClick={handleAddToCart} style={{
                  flex: 1, padding: '12px 20px', borderRadius: 12, fontWeight: 700, letterSpacing: '0.06em', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',  fontFamily: "'Jost', sans-serif", transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  ...(added ? { backgroundColor: C.greenBg, color: C.green, border: `1px solid rgba(58,96,40,0.22)` } : { backgroundColor: C.accent, color: '#fff', boxShadow: '0 6px 20px rgba(122,74,40,0.30)' }),
                }}
                  onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  {added
                    ? <><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>{t('product.added')}</>
                    : <><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>{t('product.addToCart')}</>
                  }
                </button>
              </div>

              {/* Shipping notice */}
              <div style={{ ...fade(0.54), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke={C.muted} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 13h12l1-13"/></svg>
                <p style={{ fontSize: 12, textAlign: 'center', color: C.muted, margin: 0 }}>{shippingMsg}</p>
              </div>
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div ref={relRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12, opacity: relInView ? 1 : 0, transform: relInView ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: C.heading, margin: 0 }}>{t('product.related')}</h2>
                {/* Fixed: use /products not /product */}
                <Link to={`/products?category=${product.category}`} style={{ fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.06em' }}>
                  {t('product.seeAll')}
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}/></svg>
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {related.map((p, i) => (
                  <div key={p.id} style={{ opacity: relInView ? 1 : 0, transform: relInView ? 'translateY(0)' : 'translateY(40px)', transition: `opacity 0.65s ease ${0.1 + i * 0.12}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s` }}>
                    <ProductCard product={p as any}/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;