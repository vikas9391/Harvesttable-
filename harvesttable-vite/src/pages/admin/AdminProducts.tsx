// src/pages/admin/AdminProducts.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useLanguage } from '../../context/Languagecontext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminProduct {
  id:            number;
  name:          string;
  slug:          string;
  price:         string;
  category:      string;
  origin:        string;
  image_url:     string | null;
  badge:         string;
  is_organic:    boolean;
  is_vegan:      boolean;
  is_gluten_free: boolean;
  is_fair_trade: boolean;
  is_featured:   boolean;
  is_seasonal:   boolean;
  in_stock:      boolean;
  stock_quantity: number;
  description?:  string;
}

type EditableFields = Pick<AdminProduct, 'name' | 'price' | 'origin' | 'stock_quantity' | 'badge' | 'is_featured' | 'is_seasonal'>;

const EMPTY_EDIT: EditableFields = { name: '', price: '', origin: '', stock_quantity: 0, badge: '', is_featured: false, is_seasonal: false };

// ── Category badge styles ─────────────────────────────────────────────────────
const catStyle: Record<string, { bg: string; text: string; border: string }> = {
  'herbs':      { bg: 'rgba(58,90,40,0.09)',   text: '#3a6028', border: 'rgba(58,90,40,0.22)'   },
  'teas':       { bg: 'rgba(30,110,100,0.09)', text: '#1a6a60', border: 'rgba(30,110,100,0.22)' },
  'spices':     { bg: 'rgba(122,74,40,0.10)',  text: '#7a4a28', border: 'rgba(122,74,40,0.25)'  },
  'gift-boxes': { bg: 'rgba(150,60,80,0.08)',  text: '#963048', border: 'rgba(150,60,80,0.22)'  },
};
const cs = (cat: string) => catStyle[cat] ?? catStyle['spices'];

const card: React.CSSProperties = { backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 16 };

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c8a882', width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

// ── AdminProducts ─────────────────────────────────────────────────────────────
const AdminProducts: React.FC = () => {
  const { t } = useLanguage();
  const [products,   setProducts]   = useState<AdminProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('');
  const [sortBy,     setSortBy]     = useState('name');
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [editForm,   setEditForm]   = useState<EditableFields>(EMPTY_EDIT);
  const [error,      setError]      = useState('');
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  // ── Fetch all products (admin sees full list) ─────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await apiFetch('/api/products/?ordering=-created_at&page_size=200');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Client-side search / filter / sort ───────────────────────────────────
  let displayed = products.filter(p => {
    if (filterCat && p.category !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  if (sortBy === 'name')       displayed = [...displayed].sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'price-asc')  displayed = [...displayed].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  if (sortBy === 'stock')      displayed = [...displayed].sort((a, b) => a.stock_quantity - b.stock_quantity);

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEdit  = (p: AdminProduct) => { setEditingId(p.id); setEditForm({ name: p.name, price: p.price, origin: p.origin, stock_quantity: p.stock_quantity, badge: p.badge, is_featured: p.is_featured, is_seasonal: p.is_seasonal }); };
  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY_EDIT); };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/products/${products.find(p => p.id === editingId)?.slug}/`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { setError('Failed to save.'); return; }
      await fetchProducts();
      cancelEdit();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  // ── Toggle in_stock ───────────────────────────────────────────────────────
  const toggleStock = async (product: AdminProduct) => {
    try {
      await apiFetch(`/api/products/${product.slug}/`, {
        method: 'PATCH',
        body: JSON.stringify({ in_stock: !product.in_stock }),
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, in_stock: !p.in_stock } : p));
    } catch { setError('Failed to update stock status.'); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    const slug = products.find(p => p.id === deleteId)?.slug;
    try {
      await apiFetch(`/api/products/${slug}/`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    } catch { setError('Failed to delete product.'); }
    finally { setDeleteId(null); }
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = { backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 12, color: '#5a4030', fontSize: 13, padding: '10px 14px', outline: 'none', fontFamily: "'Jost', sans-serif", cursor: 'pointer' };

  return (
    <div style={{ padding: '28px 28px 36px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
            {t('admin.prod.title')}
          </h1>
          <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>{products.length} {t('admin.prod.totalProducts')}</p>
        </div>
        {/* "View Shop" link — correct URL */}
        <Link to="/products" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', backgroundColor: '#7a4a28', borderRadius: 12, color: '#ffffff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#8f5830'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#7a4a28'}>
          <IconEye/>
          View Shop
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(176,64,64,0.08)', border: '1px solid rgba(176,64,64,0.2)', color: '#b04040', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b04040', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row" style={{ gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <IconSearch/>
          <input type="text" placeholder={t('shop.search')} value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 12, color: '#2a1a0e', fontSize: 13, outline: 'none', fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
            onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
            onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selectStyle}>
          <option value="">{t('shop.all')}</option>
          <option value="herbs">{t('shop.herbs')}</option>
          <option value="teas">{t('shop.teas')}</option>
          <option value="spices">{t('shop.spices')}</option>
          <option value="gift-boxes">{t('shop.giftBoxes')}</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
          <option value="name">{t('shop.sortName')}</option>
          <option value="price-asc">{t('shop.sortPriceAsc')}</option>
          <option value="stock">{t('admin.prod.sort.stock')}</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #ede5d8', borderTopColor: '#7a4a28', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>

          {/* Desktop table */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ede5d8' }}>
                  {[t('admin.prod.col.product'), t('admin.prod.col.category'), t('admin.prod.col.price'), t('admin.prod.col.stock'), 'Featured', t('admin.prod.col.status'), t('admin.prod.col.actions')].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((p, i) => (
                  <React.Fragment key={p.id}>
                    <tr style={{ borderBottom: editingId !== p.id && i < displayed.length - 1 ? '1px solid #f4ede4' : 'none' }}
                      onMouseEnter={e => { if (editingId !== p.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#fdf9f4'; }}
                      onMouseLeave={e => { if (editingId !== p.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>

                      {/* Product */}
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}/>
                            : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg,#e8ddd0,#d4c4b0)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a08878', fontSize: 14, fontFamily: "'Cormorant Garamond',serif" }}>{p.name.charAt(0)}</div>
                          }
                          <div>
                            <p style={{ color: '#2a1a0e', fontWeight: 500, margin: '0 0 2px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{p.origin}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, backgroundColor: cs(p.category).bg, color: cs(p.category).text, border: `1px solid ${cs(p.category).border}`, textTransform: 'capitalize' }}>
                          {p.category.replace('-', ' ')}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '13px 20px', color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>
                        ${p.price}
                      </td>

                      {/* Stock qty */}
                      <td style={{ padding: '13px 20px', fontWeight: 700, color: p.stock_quantity <= 5 ? '#a03030' : p.stock_quantity <= 10 ? '#9a5820' : '#2a1a0e' }}>
                        {p.stock_quantity}
                      </td>

                      {/* Featured / Seasonal flags */}
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {p.is_featured && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, backgroundColor: 'rgba(122,74,40,0.09)', color: '#7a4a28', border: '1px solid rgba(122,74,40,0.2)' }}>Featured</span>}
                          {p.is_seasonal && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, backgroundColor: 'rgba(30,110,100,0.08)', color: '#1a6a60', border: '1px solid rgba(30,110,100,0.2)' }}>Seasonal</span>}
                        </div>
                      </td>

                      {/* In stock toggle */}
                      <td style={{ padding: '13px 20px' }}>
                        <button onClick={() => toggleStock(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s', border: 'none', backgroundColor: p.in_stock ? 'rgba(58,90,40,0.09)' : 'rgba(160,50,50,0.08)', color: p.in_stock ? '#3a6028' : '#a03030', outline: p.in_stock ? '1px solid rgba(58,90,40,0.22)' : '1px solid rgba(160,50,50,0.22)', fontFamily: "'Jost', sans-serif" }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: p.in_stock ? '#3a6028' : '#a03030', flexShrink: 0 }}/>
                          {p.in_stock ? t('admin.prod.inStock') : t('admin.prod.outOfStock')}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {/* View product — correct URL /products/:slug */}
                          <Link to={`/products/${p.slug}`} target="_blank" style={{ padding: 6, color: '#c8a882', borderRadius: 8, display: 'flex', transition: 'all 0.15s', textDecoration: 'none' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#7a4a28'; el.style.backgroundColor = '#faf7f2'; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#c8a882'; el.style.backgroundColor = 'transparent'; }}>
                            <IconEye/>
                          </Link>
                          <button onClick={() => startEdit(p)} style={{ padding: 6, color: '#c8a882', borderRadius: 8, display: 'flex', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#7a4a28'; el.style.backgroundColor = '#faf7f2'; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#c8a882'; el.style.backgroundColor = 'transparent'; }}>
                            <IconEdit/>
                          </button>
                          <button onClick={() => setDeleteId(p.id)} style={{ padding: 6, color: '#c8a882', borderRadius: 8, display: 'flex', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#b04040'; el.style.backgroundColor = 'rgba(176,64,64,0.06)'; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#c8a882'; el.style.backgroundColor = 'transparent'; }}>
                            <IconTrash/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit row */}
                    {editingId === p.id && (
                      <tr style={{ backgroundColor: 'rgba(122,74,40,0.04)', borderLeft: '3px solid #7a4a28', borderBottom: '1px solid #f4ede4' }}>
                        <td colSpan={7} style={{ padding: '16px 20px' }}>
                          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginBottom: 12 }}>
                            {([
                              ['name',           t('admin.prod.editName'),     'text'],
                              ['price',          t('admin.prod.editPrice'),    'number'],
                              ['origin',         t('product.origin'),          'text'],
                              ['stock_quantity', t('admin.prod.col.stock'),    'number'],
                              ['badge',          'Badge (e.g. Best Seller)',   'text'],
                            ] as [keyof EditableFields, string, string][]).map(([field, label, type]) => (
                              <div key={field}>
                                <label style={{ display: 'block', color: '#a08878', fontSize: 11, marginBottom: 5 }}>{label}</label>
                                <input type={type} value={String((editForm as any)[field] ?? '')}
                                  onChange={e => setEditForm(prev => ({ ...prev, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 10, color: '#2a1a0e', fontSize: 13, outline: 'none', fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
                                  onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
                                  onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
                                />
                              </div>
                            ))}
                            {/* Checkbox toggles */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
                              {(['is_featured', 'is_seasonal'] as const).map(key => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#5a4030' }}>
                                  <input type="checkbox" checked={editForm[key]} onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.checked }))}/>
                                  {key === 'is_featured' ? 'Featured' : 'Seasonal'}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={saveEdit} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#7a4a28', color: '#ffffff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Jost', sans-serif", opacity: saving ? 0.7 : 1 }}
                              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#8f5830'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7a4a28'; }}>
                              <IconCheck/>{saving ? 'Saving…' : t('profile.save')}
                            </button>
                            <button onClick={cancelEdit} style={{ padding: '8px 16px', backgroundColor: '#faf7f2', color: '#5a4030', border: '1px solid #ede5d8', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}>
                              {t('profile.cancel')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {displayed.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: i < displayed.length - 1 ? '1px solid #f4ede4' : 'none' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}/>
                  : <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#e8ddd0,#d4c4b0)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a08878', fontSize: 20, fontFamily: "'Cormorant Garamond',serif" }}>{p.name.charAt(0)}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <p style={{ color: '#2a1a0e', fontWeight: 500, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <span style={{ color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, flexShrink: 0 }}>${p.price}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, backgroundColor: cs(p.category).bg, color: cs(p.category).text, border: `1px solid ${cs(p.category).border}`, textTransform: 'capitalize' }}>{p.category.replace('-', ' ')}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.stock_quantity <= 5 ? '#a03030' : p.stock_quantity <= 10 ? '#9a5820' : '#a08878' }}>Stock: {p.stock_quantity}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleStock(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: "'Jost', sans-serif", border: 'none', backgroundColor: p.in_stock ? 'rgba(58,90,40,0.09)' : 'rgba(160,50,50,0.08)', color: p.in_stock ? '#3a6028' : '#a03030', outline: p.in_stock ? '1px solid rgba(58,90,40,0.22)' : '1px solid rgba(160,50,50,0.22)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: p.in_stock ? '#3a6028' : '#a03030' }}/>
                      {p.in_stock ? t('admin.prod.inStock') : t('admin.prod.outOfStock')}
                    </button>
                    <Link to={`/products/${p.slug}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '4px 10px', borderRadius: 99, color: '#a08878', border: '1px solid #ede5d8', textDecoration: 'none' }}>
                      <IconEye/> View
                    </Link>
                    <button onClick={() => startEdit(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '4px 10px', borderRadius: 99, color: '#7a4a28', border: '1px solid rgba(122,74,40,0.22)', background: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif" }}>
                      <IconEdit/> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {displayed.length === 0 && !loading && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#a08878', fontSize: 14 }}>No products found.</div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(42,26,14,0.4)', backdropFilter: 'blur(4px)', zIndex: 50 }} onClick={() => setDeleteId(null)}/>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 51, backgroundColor: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '90vw', boxShadow: '0 24px 64px rgba(42,26,14,0.2)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#2a1a0e', margin: '0 0 10px' }}>Delete Product?</h3>
            <p style={{ fontSize: 13, color: '#a08878', marginBottom: 22 }}>This action cannot be undone. The product will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '10px 0', backgroundColor: '#b04040', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Jost',sans-serif" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px 0', backgroundColor: '#faf7f2', color: '#5a4030', border: '1px solid #ede5d8', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: "'Jost',sans-serif" }}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProducts;