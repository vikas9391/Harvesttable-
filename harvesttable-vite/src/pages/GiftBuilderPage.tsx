// src/pages/GiftBuilderPage.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import ProductImage from '../components/ProductImage';
import { useCart, GiftBoxSize, GiftBoxProduct } from '../context/CartContext';
import { useLanguage } from '../context/Languagecontext';

// ── API base URL from environment ─────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://harvesttable-szli.onrender.com';

const C = {
  bg: '#faf7f2', surface: '#ffffff', surfaceAlt: '#fdf9f4', border: '#ede5d8', borderHov: '#c8a882',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878', accent: '#7a4a28', accentHov: '#8f5830',
  label: '#9a6840', green: '#3a6028', greenBg: 'rgba(58,96,40,0.07)', price: '#8b3a1a',
  stepActive: 'rgba(122,74,40,0.09)', stepDone: 'rgba(58,96,40,0.08)',
};

const BoxIconSmall = () => (
  <svg width="28" height="28" fill="none" stroke={C.accent} strokeWidth="1.4" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const BoxIconMedium = () => (
  <svg width="32" height="32" fill="none" stroke={C.accent} strokeWidth="1.4" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6" />
  </svg>
);
const BoxIconLarge = () => (
  <svg width="36" height="36" fill="none" stroke={C.accent} strokeWidth="1.4" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2M2 12h20" />
  </svg>
);

const GIFT_SIZES = [
  { labelKey: 'gift.small',  size: 'small'  as GiftBoxSize, items: 3, price: 5,  Icon: BoxIconSmall,  descKey: 'gift.smallDesc'  },
  { labelKey: 'gift.medium', size: 'medium' as GiftBoxSize, items: 5, price: 8,  Icon: BoxIconMedium, descKey: 'gift.mediumDesc' },
  { labelKey: 'gift.large',  size: 'large'  as GiftBoxSize, items: 8, price: 12, Icon: BoxIconLarge,  descKey: 'gift.largeDesc'  },
];

const localName = (product: Product, lang: string): string => {
  if (lang === 'fr' && product.name_fr?.trim()) return product.name_fr;
  if (lang === 'ar' && product.name_ar?.trim()) return product.name_ar;
  return product.name;
};

const GiftBuilderPage: React.FC = () => {
  const { addGiftBox, addGuestGiftBox, isLoggedIn } = useCart() as any;
  const { t, isRTL, lang } = useLanguage();

  const [selectedSize, setSelectedSize]   = useState(1);
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [filterCat, setFilterCat]         = useState('');
  const [step, setStep]                   = useState<1 | 2 | 3>(1);
  const [adding, setAdding]               = useState(false);
  const [added, setAdded]                 = useState(false);
  const [vis, setVis]                     = useState(false);
  const [products, setProducts]           = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/?page_size=200`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const currentSize = GIFT_SIZES[selectedSize];
  const maxItems    = currentSize.items;
  const boxPrice    = currentSize.price;

  const available = products.filter(
    p => !p.category.includes('gift') && (!filterCat || p.category === filterCat)
  );

  const toggleItem = (product: Product) => {
    if (selectedItems.find(i => i.id === product.id)) {
      setSelectedItems(prev => prev.filter(i => i.id !== product.id));
    } else if (selectedItems.length < maxItems) {
      setSelectedItems(prev => [...prev, product]);
    }
  };

  const totalPrice = selectedItems.reduce((sum, p) => sum + parseFloat(p.price), 0) + boxPrice;
  const pct        = (selectedItems.length / maxItems) * 100;

  // ── Add to cart as a single gift box bundle ──────────────────────────────
  const handleAddToCart = async () => {
    if (selectedItems.length === 0 || adding) return;
    setAdding(true);

    const giftProducts: GiftBoxProduct[] = selectedItems.map(p => ({
      id:        p.id,
      name:      p.name,
      slug:      p.slug,
      price:     p.price,
      category:  p.category,
      image_url: p.image_url ?? undefined,
      imageType: p.imageType,
      name_fr:   p.name_fr,
      name_ar:   p.name_ar,
    }));

    try {
      if (isLoggedIn) {
        await addGiftBox(currentSize.size, giftProducts, 1);
      } else {
        addGuestGiftBox(currentSize.size, giftProducts, 1);
      }
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
      }, 2200);
    } finally {
      setAdding(false);
    }
  };

  // ── Reset builder so user can add another gift box ───────────────────────
  const handleAddAnother = () => {
    setSelectedItems([]);
    setSelectedSize(1);
    setStep(1);
  };

  const f = (d: number): React.CSSProperties => ({
    opacity:    vis ? 1 : 0,
    transform:  vis ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity .75s ease ${d}s, transform .75s cubic-bezier(.22,1,.36,1) ${d}s`,
  });

  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

  const stepLabels             = [t('gift.step1'), t('gift.step2'), t('gift.step3')];
  const { Icon: SelectedIcon } = currentSize;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes stepIn  { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%   { background-position:-200% center }     100% { background-position:200% center } }
        @keyframes successPulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
      `}</style>

      <div style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }} className="min-h-screen pt-[68px]">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{
          position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #2a1a0e 0%, #4a2a10 60%, #6a3a18 100%)',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: noise, pointerEvents: 'none' }} />
          <svg style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', width: 240, height: 240, opacity: 0.07, pointerEvents: 'none' }} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="114" fill="none" stroke="#d4a870" strokeWidth="0.8" strokeDasharray="8 5" />
            <circle cx="120" cy="120" r="80"  fill="none" stroke="#d4a870" strokeWidth="0.5" strokeDasharray="3 5" />
          </svg>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '72px 32px', width: '100%' }}>
            <div style={{ ...f(0.05), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ display: 'block', width: 28, height: 1, background: 'linear-gradient(to right,#d4a870,transparent)' }} />
              <p style={{ fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 700, color: '#d4a870', margin: 0 }}>
                {t('gift.label')}
              </p>
            </div>
            <h1 style={{ ...f(0.12), fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 6vw, 62px)', fontWeight: 600, color: '#faf2e8', lineHeight: 1.08, margin: '0 0 16px' }}>
              {t('gift.title')}
            </h1>
            <div style={{ ...f(0.18), height: 2, width: 60, background: 'linear-gradient(90deg, #7a4a28, #d4a870, #7a4a28)', backgroundSize: '200% auto', animation: 'shimmer 2.8s linear infinite', marginBottom: 18 }} />
            <p style={{ ...f(0.24), fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: 'rgba(250,242,232,0.75)', maxWidth: 480, margin: 0 }}>
              {t('gift.desc')}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 16px 48px' }}>

          {/* ── Steps indicator ───────────────────────────────────────────── */}
          <div style={{ ...f(0.2), display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
            {stepLabels.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: i + 1 < step ? 'pointer' : 'default',
                  color: step > i + 1 ? C.green : step === i + 1 ? C.accent : C.muted,
                  transition: 'color 0.3s',
                }} onClick={() => { if (i + 1 < step) setStep(i + 1 as 1 | 2 | 3); }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 13, fontWeight: 700,
                    backgroundColor: step > i + 1 ? C.stepDone : step === i + 1 ? C.stepActive : 'rgba(160,136,120,0.07)',
                    border: `1.5px solid ${step > i + 1 ? 'rgba(58,96,40,0.28)' : step === i + 1 ? 'rgba(122,74,40,0.28)' : C.border}`,
                    transition: 'all 0.3s ease',
                  }}>
                    {step > i + 1
                      ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{s}</span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: 1,
                    backgroundColor: step > i + 1 ? 'rgba(58,96,40,0.22)' : C.border,
                    transition: 'background-color 0.4s ease',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Step 1 — Choose box size ──────────────────────────────────── */}
          {step === 1 && (
            <div style={{ animation: 'stepIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, textAlign: 'center', color: C.heading, marginBottom: 32 }}>
                {t('gift.chooseSize')}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 640, margin: '0 auto 32px' }}>
                {GIFT_SIZES.map((size, i) => (
                  <button key={size.labelKey} onClick={() => setSelectedSize(i)} style={{
                    padding: '28px 20px', borderRadius: 16, textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${selectedSize === i ? C.accent : C.border}`,
                    backgroundColor: selectedSize === i ? 'rgba(122,74,40,0.05)' : C.surface,
                    boxShadow: selectedSize === i ? '0 8px 24px rgba(122,74,40,0.15)' : '0 2px 8px rgba(122,74,40,0.06)',
                    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => { if (selectedSize !== i) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: selectedSize === i ? 'rgba(122,74,40,0.10)' : 'rgba(122,74,40,0.05)',
                      border: `1px solid ${selectedSize === i ? 'rgba(122,74,40,0.22)' : C.border}`,
                      transition: 'all 0.3s',
                    }}>
                      <size.Icon />
                    </div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, marginBottom: 8, color: selectedSize === i ? C.accent : C.heading }}>
                      {t(size.labelKey)}
                    </h3>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: C.muted, marginBottom: 12 }}>{t(size.descKey)}</p>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.price }}>
                      {t('gift.upTo')} {size.items} {t('gift.items')} · +${size.price}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => { setSelectedItems(p => p.slice(0, maxItems)); setStep(2); }} style={{
                  padding: '14px 40px', borderRadius: 2, fontWeight: 600, fontSize: 11,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff',
                  backgroundColor: C.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(122,74,40,0.30)',
                  transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                  {t('gift.continueItems')} →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2 — Pick items ───────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ animation: 'stepIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: C.heading, margin: 0 }}>
                  {t('gift.selectItems')}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{selectedItems.length} / {maxItems} {t('gift.selected')}</span>
                  {selectedItems.length === maxItems && (
                    <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, backgroundColor: C.greenBg, color: C.green, border: '1px solid rgba(58,96,40,0.2)' }}>
                      {t('gift.boxFull')}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: C.border }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${pct}%`,
                    backgroundColor: pct === 100 ? C.green : C.accent,
                    transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1), background-color 0.3s',
                  }} />
                </div>
              </div>

              {/* Category filter */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
                {([
                  [t('gift.all'),    ''],
                  [t('gift.herbs'),  'herbs'],
                  [t('gift.teas'),   'teas'],
                  [t('gift.spices'), 'spices'],
                ] as [string, string][]).map(([l, v]) => (
                  <button key={v} onClick={() => setFilterCat(v)} style={{
                    flexShrink: 0, padding: '6px 16px', borderRadius: 2, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
                    backgroundColor: filterCat === v ? C.accent : 'rgba(122,74,40,0.07)',
                    color:           filterCat === v ? '#fff'    : C.muted,
                    border: `1px solid ${filterCat === v ? C.accent : C.border}`,
                    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>{l}</button>
                ))}
              </div>

              {/* Product grid */}
              {available.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: C.muted, fontSize: 14 }}>
                  Loading products…
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
                  {available.map((product, i) => {
                    const isSelected = !!selectedItems.find(x => x.id === product.id);
                    const isDisabled = !isSelected && selectedItems.length >= maxItems;
                    return (
                      <button key={product.id} onClick={() => toggleItem(product)} disabled={isDisabled} style={{
                        borderRadius: 12, overflow: 'hidden', textAlign: 'left',
                        cursor:      isDisabled ? 'not-allowed' : 'pointer',
                        border:      `2px solid ${isSelected ? C.accent : C.border}`,
                        opacity:     isDisabled ? 0.4 : 1,
                        boxShadow:   isSelected ? '0 6px 20px rgba(122,74,40,0.18)' : '0 2px 8px rgba(122,74,40,0.06)',
                        transition:  'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                        transform:   'translateY(0)',
                        animation:   `stepIn 0.4s ease ${Math.min(i * 0.03, 0.3)}s both`,
                        background:  'none',
                      }}
                        onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => {                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                        <div style={{ position: 'relative' }}>
                          <ProductImage
                            type={product.category ?? product.imageType ?? 'spices'}
                            name={product.name}
                            imageUrl={product.image_url}
                            className="h-24 w-full"
                          />
                          {isSelected && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(122,74,40,0.2)' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(122,74,40,0.4)' }}>
                                <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '10px', backgroundColor: C.surface }}>
                          <p style={{
                            fontSize: 12, fontWeight: 600, color: C.heading, margin: '0 0 2px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            ...(lang === 'ar' && { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif", direction: 'rtl' }),
                          }}>
                            {localName(product, lang)}
                          </p>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.price, margin: 0 }}>${product.price}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                  color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.accent}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('gift.back')}
                </button>
                <button onClick={() => setStep(3)} disabled={selectedItems.length === 0} style={{
                  padding: '14px 32px', borderRadius: 2, fontWeight: 600, fontSize: 11,
                  letterSpacing: '0.10em', textTransform: 'uppercase', color: '#fff',
                  backgroundColor: C.accent, border: 'none',
                  cursor:    selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  opacity:   selectedItems.length === 0 ? 0.4 : 1,
                  fontFamily: 'inherit',
                  boxShadow: selectedItems.length > 0 ? '0 4px 20px rgba(122,74,40,0.28)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                  onMouseEnter={e => { if (selectedItems.length > 0) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => {                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  {t('gift.reviewBox')} ({selectedItems.length}) →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 — Review ───────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ maxWidth: 420, margin: '0 auto', animation: 'stepIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(122,74,40,0.08)', border: `1px solid rgba(122,74,40,0.18)`,
                  animation: 'stepIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
                }}>
                  <SelectedIcon />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.heading, marginBottom: 4 }}>
                  {t(currentSize.labelKey)}
                </h2>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                  {selectedItems.length} {t('gift.items')} {t('gift.selected')}
                </p>
              </div>

              <div style={{ borderRadius: 16, padding: 20, marginBottom: 24, backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 2px 16px rgba(122,74,40,0.08)' }}>
                <h3 style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 16 }}>
                  {t('gift.contents')}
                </h3>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                  {selectedItems.map((item, idx) => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                      borderBottom: idx < selectedItems.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProductImage
                          type={item.category ?? item.imageType ?? 'spices'}
                          name={item.name}
                          imageUrl={item.image_url}
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                        />
                        <span style={{
                          fontSize: 13, color: C.body,
                          ...(lang === 'ar' && { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif" }),
                        }}>
                          {localName(item, lang)}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.price }}>${item.price}</span>
                    </div>
                  ))}

                  {/* Packaging line */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                    fontSize: 13, color: C.muted,
                    backgroundColor: 'rgba(122,74,40,0.03)',
                    borderTop: `1px dashed ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(122,74,40,0.08)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <SelectedIcon />
                      </div>
                      <span style={{ color: C.body, fontSize: 12 }}>
                        {t('gift.packaging')} <span style={{ color: C.accent, fontWeight: 600 }}>({t(currentSize.labelKey)})</span>
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: C.accent }}>+${boxPrice}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.border}`, fontWeight: 700 }}>
                  <span style={{ color: C.heading }}>{t('gift.total')}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.price }}>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* ── Primary CTA ─────────────────────────────────────────── */}
                <button
                  onClick={handleAddToCart}
                  disabled={adding || added}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 2, fontWeight: 600, fontSize: 11,
                    cursor: adding || added ? 'default' : 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                    ...(added
                      ? { backgroundColor: C.greenBg, color: C.green, border: `1px solid rgba(58,96,40,0.25)`, animation: 'successPulse 0.4s ease' }
                      : adding
                        ? { backgroundColor: 'rgba(122,74,40,0.5)', color: '#fff', border: 'none' }
                        : { backgroundColor: C.accent, color: '#fff', boxShadow: '0 4px 20px rgba(122,74,40,0.28)', border: 'none' }
                    ),
                  }}
                  onMouseEnter={e => { if (!adding && !added) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => {                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  {added ? (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('gift.addedToCart')}
                    </>
                  ) : adding ? (
                    <>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      {t('gift.adding') ?? 'Adding…'}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {t('gift.addToCart')} · ${totalPrice.toFixed(2)}
                    </>
                  )}
                </button>

                {/* ── Add another box (shows after first add) ─────────────── */}
                {added && (
                  <button
                    onClick={handleAddAnother}
                    style={{
                      width: '100%', padding: '12px 0', fontSize: 11, letterSpacing: '0.10em',
                      textTransform: 'uppercase', borderRadius: 2,
                      border: `1px solid ${C.accent}`, color: C.accent, background: 'none',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      transition: 'all 0.2s',
                      animation: 'stepIn 0.4s ease both',
                    }}
                  >
                    + {t('gift.addAnother') ?? 'Add Another Gift Box'}
                  </button>
                )}

                <button onClick={() => setStep(2)} style={{
                  width: '100%', padding: '12px 0', fontSize: 11, letterSpacing: '0.10em',
                  textTransform: 'uppercase', borderRadius: 2,
                  border: `1px solid ${C.border}`, color: C.muted, background: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHov; (e.currentTarget as HTMLElement).style.color = C.body; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border;    (e.currentTarget as HTMLElement).style.color = C.muted; }}>
                  ← {t('gift.editSelection')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
};

export default GiftBuilderPage;