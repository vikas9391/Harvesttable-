// src/pages/ProductsPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../context/Languagecontext';

const C = {
  bg: '#faf7f2', surface: '#ffffff', surfaceAlt: '#fdf9f4',
  border: '#ede5d8', borderFocus: '#c8a882', heading: '#2a1a0e',
  body: '#5a4030', muted: '#a08878', accent: '#7a4a28',
  label: '#9a6840', green: '#3a6028', price: '#8b3a1a', inputBg: '#fdfaf6',
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

interface DietaryFilters {
  organic: boolean;
  vegan: boolean;
  glutenFree: boolean;
  fairTrade: boolean;
}

interface Category {
  label: string;
  value: string;
}

function useInView(threshold = 0.1): [React.RefObject<HTMLDivElement>, boolean] {
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

// ─── FilterPanel — defined OUTSIDE ProductsPage ───────────────────────────────
// Defining this inside the parent causes React to treat it as a new component
// type on every render, unmounting the <input> and losing focus after each keystroke.
interface FilterPanelProps {
  searchQuery:      string;
  category:         string;
  dietary:          DietaryFilters;
  activeFilterCount: number;
  categories:       Category[];
  isRTL:            boolean;
  onSearchChange:   (val: string) => void;
  onSetCategory:    (val: string) => void;
  onToggleDietary:  (key: keyof DietaryFilters) => void;
  onClearAll:       () => void;
  onClose?:         () => void;
  searchPlaceholder: string;
  searchLabel:      string;
  categoryLabel:    string;
  dietaryLabel:     string;
  clearAllLabel:    string;
  dietaryOptions:   [keyof DietaryFilters, string][];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  searchQuery, category, dietary, activeFilterCount,
  categories, isRTL,
  onSearchChange, onSetCategory, onToggleDietary, onClearAll, onClose,
  searchPlaceholder, searchLabel, categoryLabel, dietaryLabel, clearAllLabel,
  dietaryOptions,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

    {/* Search */}
    <div>
      <h3 style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 12 }}>
        {searchLabel}
      </h3>
      <div style={{ position: 'relative' }}>
        <svg
          style={{ position: 'absolute', [isRTL ? 'right' : 'left']: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: C.muted, pointerEvents: 'none' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: isRTL ? 12 : 36,
            paddingRight: isRTL ? 36 : 12,
            paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, fontSize: 13, outline: 'none',
            backgroundColor: C.inputBg, border: `1px solid ${C.border}`,
            color: C.heading, boxSizing: 'border-box', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
          onBlur={e => e.currentTarget.style.borderColor = C.border}
        />
      </div>
    </div>

    {/* Category */}
    <div>
      <h3 style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 10 }}>
        {categoryLabel}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {categories.map(cat => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => { onSetCategory(cat.value); onClose?.(); }}
              style={{
                width: '100%', textAlign: isRTL ? 'right' : 'left', padding: '10px 12px', borderRadius: 12,
                fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: isActive ? 'rgba(122,74,40,0.08)' : 'transparent',
                color: isActive ? C.accent : C.muted,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(122,74,40,0.04)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Dietary */}
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
      <h3 style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 12 }}>
        {dietaryLabel}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {dietaryOptions.map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div
              onClick={() => onToggleDietary(key)}
              style={{
                width: 18, height: 18, borderRadius: 5,
                border: `2px solid ${dietary[key] ? C.accent : C.border}`,
                backgroundColor: dietary[key] ? C.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s ease',
              }}
            >
              {dietary[key] && (
                <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {activeFilterCount > 0 && (
      <button
        onClick={onClearAll}
        style={{
          width: '100%', padding: '8px 0', fontSize: 12, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          border: `1px solid ${C.border}`, color: '#b04040', background: 'none',
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(176,64,64,0.05)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {clearAllLabel}
      </button>
    )}
  </div>
);

// ─── ProductsPage ─────────────────────────────────────────────────────────────
const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, isRTL } = useLanguage();

  const [sort,              setSort]              = useState<SortOption>('default');
  const [searchQuery,       setSearchQuery]       = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [headerVis,         setHeaderVis]         = useState(false);
  const [gridRef,           gridInView]           = useInView(0.05);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [dietary,  setDietary]  = useState<DietaryFilters>({
    organic: false, vegan: false, glutenFree: false, fairTrade: false,
  });

  const orderingMap: Record<SortOption, string> = {
    'default':    '-created_at',
    'price-asc':  'price',
    'price-desc': '-price',
    'name':       'name',
  };

  const { products: allProducts, loading, error } = useProducts({
    category:       category || undefined,
    search:         searchQuery || undefined,
    ordering:       orderingMap[sort],
    is_organic:     dietary.organic    || undefined,
    is_vegan:       dietary.vegan      || undefined,
    is_gluten_free: dietary.glutenFree || undefined,
    is_fair_trade:  dietary.fairTrade  || undefined,
  });

  let filteredProducts = [...allProducts];
  if (sort === 'name') {
    filteredProducts = filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const CATEGORIES: Category[] = [
    { label: t('shop.all'),       value: '' },
    { label: t('shop.herbs'),     value: 'herbs' },
    { label: t('shop.teas'),      value: 'teas' },
    { label: t('shop.spices'),    value: 'spices' },
    { label: t('shop.giftBoxes'), value: 'gift-boxes' },
  ];

  const DIETARY_OPTIONS: [keyof DietaryFilters, string][] = [
    ['organic',    t('shop.organic')],
    ['vegan',      t('shop.vegan')],
    ['glutenFree', t('shop.glutenFree')],
    ['fairTrade',  t('shop.fairTrade')],
  ];

  useEffect(() => {
    const timer = setTimeout(() => setHeaderVis(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  const handleSetCategory = (val: string) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set('category', val); else p.delete('category');
    setSearchParams(p);
    setCategory(val);
  };

  const toggleDietary = (key: keyof DietaryFilters) =>
    setDietary(prev => ({ ...prev, [key]: !prev[key] }));

  const clearAll = () => {
    handleSetCategory('');
    setSearchQuery('');
    setSort('default');
    setDietary({ organic: false, vegan: false, glutenFree: false, fairTrade: false });
  };

  const activeFilterCount = [
    category,
    dietary.organic, dietary.vegan, dietary.glutenFree, dietary.fairTrade,
    searchQuery,
  ].filter(Boolean).length;

  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

  const f = (d: number): React.CSSProperties => ({
    opacity: headerVis ? 1 : 0,
    transform: headerVis ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity .75s ease ${d}s, transform .75s cubic-bezier(.22,1,.36,1) ${d}s`,
  });

  // Shared props for both sidebar and mobile drawer instances of FilterPanel
  const filterPanelProps = {
    searchQuery,
    category,
    dietary,
    activeFilterCount,
    categories: CATEGORIES,
    isRTL,
    onSearchChange:  setSearchQuery,
    onSetCategory:   handleSetCategory,
    onToggleDietary: toggleDietary,
    onClearAll:      clearAll,
    searchPlaceholder: t('shop.search'),
    searchLabel:     t('shop.search').replace('...', ''),
    categoryLabel:   t('shop.category'),
    dietaryLabel:    t('shop.dietary'),
    clearAllLabel:   t('shop.clearAll'),
    dietaryOptions:  DIETARY_OPTIONS,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
      <div style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }} className="min-h-screen pt-[68px]">

        {/* Page hero */}
        <div style={{ position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #2a1a0e 0%, #4a2a10 60%, #6a3a18 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: noise, pointerEvents: 'none' }}/>
          <svg style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', width: 240, height: 240, opacity: 0.07, pointerEvents: 'none' }} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="114" fill="none" stroke="#d4a870" strokeWidth="0.8" strokeDasharray="8 5"/>
            <circle cx="120" cy="120" r="80"  fill="none" stroke="#d4a870" strokeWidth="0.5" strokeDasharray="3 5"/>
          </svg>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '72px 32px', width: '100%' }}>
            <div style={{ ...f(0.05), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ display: 'block', width: 28, height: 1, background: 'linear-gradient(to right,#d4a870,transparent)' }}/>
              <p style={{ fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 700, color: '#d4a870', margin: 0 }}>
                Moroccan Botanicals
              </p>
            </div>
            <h1 style={{ ...f(0.12), fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 6vw, 62px)', fontWeight: 600, color: '#faf2e8', lineHeight: 1.08, margin: '0 0 16px' }}>
              Our Collection
            </h1>
            <div style={{ ...f(0.18), height: 2, width: 60, background: 'linear-gradient(90deg, #7a4a28, #d4a870, #7a4a28)', backgroundSize: '200% auto', animation: 'shimmer 2.8s linear infinite', marginBottom: 18 }}/>
            <p style={{ ...f(0.24), fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: 'rgba(250,242,232,0.75)', maxWidth: 480, margin: 0 }}>
              Explore our carefully curated selection of artisan Moroccan herbs, teas, spices, and gift boxes.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 48px' }}>
          <div style={{ display: 'flex', gap: 40 }}>

            {/* Desktop sidebar */}
            <aside style={{
              display: 'none', width: 208, flexShrink: 0,
              opacity: headerVis ? 1 : 0,
              transform: headerVis ? 'translateX(0)' : `translateX(${isRTL ? '20px' : '-20px'})`,
              transition: 'opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s',
            }} className="lg:block" id="sidebar-desktop">
              <div style={{ position: 'sticky', top: 88, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 2px 16px rgba(122,74,40,0.06)' }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 20, marginTop: 0 }}>
                  {t('shop.filtersLabel')}
                </h2>
                <FilterPanel {...filterPanelProps} />
              </div>
            </aside>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Controls bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, opacity: headerVis ? 1 : 0, transition: 'opacity 0.6s ease 0.5s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                    {loading
                      ? <span style={{ color: C.muted }}>Loading…</span>
                      : <><span style={{ fontWeight: 600, color: C.accent }}>{filteredProducts.length}</span>{' '}{filteredProducts.length !== 1 ? t('shop.products') : t('shop.product')}</>
                    }
                  </p>
                  {activeFilterCount > 0 && (
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: 'rgba(122,74,40,0.09)', color: C.accent, border: '1px solid rgba(122,74,40,0.18)' }}>
                      {activeFilterCount} {activeFilterCount !== 1 ? t('shop.filtersActive') : t('shop.filterActive')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value as SortOption)}
                    style={{ fontSize: 13, borderRadius: 12, padding: '8px 12px', outline: 'none', backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.body, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    <option value="default">{t('shop.sortDefault')}</option>
                    <option value="price-asc">{t('shop.sortPriceAsc')}</option>
                    <option value="price-desc">{t('shop.sortPriceDesc')}</option>
                    <option value="name">{t('shop.sortName')}</option>
                  </select>
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 16px', borderRadius: 12, backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.body, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                    </svg>
                    {t('shop.filters')}
                    {activeFilterCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backgroundColor: C.accent }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Category pills */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 24, opacity: headerVis ? 1 : 0, transition: 'opacity 0.6s ease 0.55s' }}>
                {CATEGORIES.map(cat => {
                  const isActive = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => handleSetCategory(cat.value)}
                      style={{
                        flexShrink: 0, padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${isActive ? C.accent : C.border}`,
                        backgroundColor: isActive ? C.accent : 'rgba(122,74,40,0.07)',
                        color: isActive ? '#fff' : C.muted,
                        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Product grid */}
              <div ref={gridRef}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                  </div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '80px 0', color: '#b04040' }}>
                    <p>{error}</p>
                    <button onClick={clearAll} style={{ marginTop: 12, padding: '10px 24px', fontSize: 13, fontWeight: 600, borderRadius: 12, color: '#fff', backgroundColor: C.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Reset Filters
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 8, color: C.heading }}>{t('shop.noProducts')}</p>
                    <p style={{ fontSize: 13, marginBottom: 24, color: C.muted }}>{t('shop.noProductsDesc')}</p>
                    <button onClick={clearAll} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, borderRadius: 12, color: '#fff', backgroundColor: C.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {t('shop.clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                    {filteredProducts.map((product, i) => (
                      <div key={product.id} style={{
                        opacity: gridInView ? 1 : 0,
                        transform: gridInView ? 'translateY(0)' : 'translateY(36px)',
                        transition: `opacity 0.6s ease ${Math.min(i * 0.05, 0.5)}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${Math.min(i * 0.05, 0.5)}s`,
                      }}>
                        <ProductCard product={product as any}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(42,26,14,0.25)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div style={{ position: 'fixed', [isRTL ? 'right' : 'left']: 0, top: 0, height: '100%', width: 'min(85vw, 340px)', zIndex: 51, padding: 24, overflowY: 'auto', backgroundColor: C.surface, borderRight: isRTL ? 'none' : `1px solid ${C.border}`, borderLeft: isRTL ? `1px solid ${C.border}` : 'none', boxShadow: isRTL ? '-4px 0 32px rgba(42,26,14,0.14)' : '4px 0 32px rgba(42,26,14,0.14)', animation: 'slideIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: 0 }}>{t('shop.filtersLabel')}</h2>
                <button onClick={() => setMobileFiltersOpen(false)} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', color: C.muted, cursor: 'pointer' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <FilterPanel {...filterPanelProps} onClose={() => setMobileFiltersOpen(false)} />
            </div>
          </>
        )}
      </div>
      <style>{`
        @media (min-width: 1024px) { #sidebar-desktop { display: block !important; } }
      `}</style>
    </>
  );
};

export default ProductsPage;