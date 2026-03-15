// src/pages/admin/AdminProducts.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useLanguage } from '../../context/Languagecontext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminProduct {
  id:             number;
  name:           string;
  slug:           string;
  price:          string;
  category:       string;
  origin:         string;
  image_url:      string | null;
  badge:          string;
  badge_fr?:      string;           // ← new
  badge_ar?:      string;           // ← new
  description:    string;
  name_fr?:         string;
  name_ar?:         string;
  description_fr?:  string;
  description_ar?:  string;
  is_organic:     boolean;
  is_vegan:       boolean;
  is_gluten_free: boolean;
  is_fair_trade:  boolean;
  is_featured:    boolean;
  is_seasonal:    boolean;
  in_stock:       boolean;
  stock_quantity: number;
}

type EditableFields = Pick<AdminProduct,
  'name' | 'price' | 'origin' | 'stock_quantity' | 'badge' | 'badge_fr' | 'badge_ar' |
  'description' | 'is_featured' | 'is_seasonal' | 'is_organic' |
  'is_vegan' | 'is_gluten_free' | 'is_fair_trade' | 'in_stock' | 'category' |
  'name_fr' | 'name_ar' | 'description_fr' | 'description_ar'
>;

// badge_en maps to the 'badge' column (English / default)
interface MultiLangFields {
  name_en:  string; name_fr:  string; name_ar:  string;
  desc_en:  string; desc_fr:  string; desc_ar:  string;
  badge_en: string; badge_fr: string; badge_ar: string;   // ← new
}

const EMPTY_EDIT: EditableFields = {
  name: '', price: '', origin: '', stock_quantity: 0,
  badge: '', badge_fr: '', badge_ar: '',
  description: '', is_featured: false, is_seasonal: false,
  is_organic: false, is_vegan: false, is_gluten_free: false,
  is_fair_trade: false, in_stock: true, category: 'herbs',
  name_fr: '', name_ar: '', description_fr: '', description_ar: '',
};

const EMPTY_MULTILANG: MultiLangFields = {
  name_en: '', name_fr: '', name_ar: '',
  desc_en: '', desc_fr: '', desc_ar: '',
  badge_en: '', badge_fr: '', badge_ar: '',
};

const catStyle: Record<string, { bg: string; text: string; border: string }> = {
  'herbs':      { bg: 'rgba(58,90,40,0.09)',   text: '#3a6028', border: 'rgba(58,90,40,0.22)'   },
  'teas':       { bg: 'rgba(30,110,100,0.09)', text: '#1a6a60', border: 'rgba(30,110,100,0.22)' },
  'spices':     { bg: 'rgba(122,74,40,0.10)',  text: '#7a4a28', border: 'rgba(122,74,40,0.25)'  },
  'gift-boxes': { bg: 'rgba(150,60,80,0.08)',  text: '#963048', border: 'rgba(150,60,80,0.22)'  },
};
const cs = (cat: string) => catStyle[cat] ?? catStyle['spices'];
const card: React.CSSProperties = { backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 16 };

// ── Icon components ───────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#c8a882', width:16, height:16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2 12h20"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10A15.3 15.3 0 018 12a15.3 15.3 0 014-10z"/>
  </svg>
);

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:'100%', padding:'9px 12px', backgroundColor:'#ffffff',
  border:'1px solid #ede5d8', borderRadius:10, color:'#2a1a0e',
  fontSize:13, outline:'none', fontFamily:"'Jost', sans-serif",
  boxSizing:'border-box', transition:'border-color 0.15s',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor:'pointer' };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize:'vertical', minHeight:80, lineHeight:1.6 };
const labelStyle: React.CSSProperties = {
  display:'block', color:'#a08878', fontSize:11,
  fontWeight:600, letterSpacing:'0.06em', marginBottom:5, textTransform:'uppercase',
};

const focus = (e: React.FocusEvent<any>) => e.currentTarget.style.borderColor = '#c8a882';
const blur  = (e: React.FocusEvent<any>) => e.currentTarget.style.borderColor = '#ede5d8';

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; color?: string }> = ({ label, checked, onChange, color = '#7a4a28' }) => (
  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
    <div onClick={() => onChange(!checked)} style={{ width:36, height:20, borderRadius:10, position:'relative', backgroundColor: checked ? color : '#ede5d8', transition:'background-color 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left: checked ? 18 : 2, width:16, height:16, borderRadius:'50%', backgroundColor:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.15)', transition:'left 0.2s' }}/>
    </div>
    <span style={{ fontSize:13, color:'#5a4030' }}>{label}</span>
  </label>
);

// ── Language tab definitions ───────────────────────────────────────────────────
const LANG_TABS = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية',  flag: '🇲🇦', rtl: true },
];

// ── LangValues now includes badge per language ─────────────────────────────────
interface LangValues {
  nameEn:  string; nameFr:  string; nameAr:  string;
  descEn:  string; descFr:  string; descAr:  string;
  badgeEn: string; badgeFr: string; badgeAr: string;
}
interface LangTabPanelProps {
  initialValues: LangValues;
  onChange: (v: LangValues) => void;
  resetKey?: string | number;
  compact?: boolean;
}

const LangTabPanel: React.FC<LangTabPanelProps> = ({ initialValues, onChange, resetKey, compact }) => {
  const [activeLang, setActiveLang] = useState('en');
  const [vals, setVals] = useState<LangValues>(initialValues);

  React.useEffect(() => {
    setActiveLang('en');
    setVals(initialValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const update = (key: keyof LangValues, value: string) => {
    setVals(prev => {
      const next = { ...prev, [key]: value };
      onChange(next);
      return next;
    });
  };

  return (
    <div style={{ marginBottom: compact ? 12 : 20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ display:'flex', color:'#7a4a28' }}><IconGlobe/></span>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a08878', margin:0 }}>
          Name, Description & Badge
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid #ede5d8', marginBottom:14 }}>
        {LANG_TABS.map(lt => (
          <button key={lt.code} onClick={() => setActiveLang(lt.code)}
            style={{
              padding: compact ? '6px 12px' : '8px 16px',
              borderRadius:'8px 8px 0 0', fontSize:12,
              fontWeight: activeLang === lt.code ? 700 : 500,
              cursor:'pointer', border:'none', fontFamily:"'Jost', sans-serif",
              backgroundColor: activeLang === lt.code ? '#fff' : 'transparent',
              color: activeLang === lt.code ? '#7a4a28' : '#a08878',
              borderBottom: activeLang === lt.code ? '2px solid #7a4a28' : '2px solid transparent',
              marginBottom: -1,
              display:'flex', alignItems:'center', gap:5,
            }}>
            <span>{lt.flag}</span>
            <span>{lt.label}</span>
            {lt.code === 'en' && (
              <span style={{ fontSize:9, backgroundColor:'#8b3a1a', color:'#fff', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>Required</span>
            )}
          </button>
        ))}
      </div>

      {/* ── English ─────────────────────────────────────────────────────────── */}
      <div style={{ display: activeLang === 'en' ? 'block' : 'none' }}>
        <div style={{ marginBottom:10 }}>
          <label style={labelStyle}>🇬🇧 English Name <span style={{ color:'#b04040' }}>*</span></label>
          <input type="text" placeholder="e.g. Moroccan Mint Tea"
            value={vals.nameEn} onChange={e => update('nameEn', e.target.value)}
            style={inputStyle} onFocus={focus} onBlur={blur}/>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={labelStyle}>🇬🇧 English Description</label>
          <textarea placeholder="Product description…"
            value={vals.descEn} onChange={e => update('descEn', e.target.value)}
            style={{ ...textareaStyle, minHeight: compact ? 68 : 80 }}
            onFocus={focus} onBlur={blur}/>
        </div>
        <div>
          <label style={labelStyle}>🇬🇧 Badge (English)</label>
          <input type="text" placeholder="e.g. Best Seller, New, Sale"
            value={vals.badgeEn} onChange={e => update('badgeEn', e.target.value)}
            style={inputStyle} onFocus={focus} onBlur={blur}/>
          <p style={{ fontSize:10, color:'#c8a882', margin:'4px 0 0' }}>Short label shown on the product image chip — leave blank for no badge</p>
        </div>
      </div>

      {/* ── French ──────────────────────────────────────────────────────────── */}
      <div style={{ display: activeLang === 'fr' ? 'block' : 'none' }}>
        <div style={{ marginBottom:10 }}>
          <label style={labelStyle}>🇫🇷 Français Nom</label>
          <input type="text" placeholder="ex. Thé à la Menthe Marocain"
            value={vals.nameFr} onChange={e => update('nameFr', e.target.value)}
            style={inputStyle} onFocus={focus} onBlur={blur}/>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={labelStyle}>🇫🇷 Français Description</label>
          <textarea placeholder="Description en français…"
            value={vals.descFr} onChange={e => update('descFr', e.target.value)}
            style={{ ...textareaStyle, minHeight: compact ? 68 : 80 }}
            onFocus={focus} onBlur={blur}/>
        </div>
        <div>
          <label style={labelStyle}>🇫🇷 Badge (Français)</label>
          <input type="text" placeholder="ex. Nouveau, Promo, Meilleures Ventes"
            value={vals.badgeFr} onChange={e => update('badgeFr', e.target.value)}
            style={inputStyle} onFocus={focus} onBlur={blur}/>
          <p style={{ fontSize:10, color:'#c8a882', margin:'4px 0 0' }}>Laisser vide pour ne pas afficher de badge</p>
        </div>
      </div>

      {/* ── Arabic ──────────────────────────────────────────────────────────── */}
      <div style={{ display: activeLang === 'ar' ? 'block' : 'none' }} dir="rtl">
        <div style={{ marginBottom:10 }}>
          <label style={labelStyle}>🇲🇦 الاسم بالعربية</label>
          <input type="text" placeholder="مثال: شاي النعناع المغربي"
            value={vals.nameAr} onChange={e => update('nameAr', e.target.value)}
            style={{ ...inputStyle, direction:'rtl' }} onFocus={focus} onBlur={blur}/>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={labelStyle}>🇲🇦 الوصف بالعربية</label>
          <textarea placeholder="وصف المنتج بالعربية…"
            value={vals.descAr} onChange={e => update('descAr', e.target.value)}
            style={{ ...textareaStyle, direction:'rtl', minHeight: compact ? 68 : 80 }}
            onFocus={focus} onBlur={blur}/>
        </div>
        <div>
          <label style={labelStyle}>🇲🇦 الشارة بالعربية</label>
          <input type="text" placeholder="مثال: جديد، تخفيض، الأكثر مبيعًا"
            value={vals.badgeAr} onChange={e => update('badgeAr', e.target.value)}
            style={{ ...inputStyle, direction:'rtl' }} onFocus={focus} onBlur={blur}/>
          <p style={{ fontSize:10, color:'#c8a882', margin:'4px 0 0', direction:'rtl' }}>اتركه فارغًا لإخفاء الشارة</p>
        </div>
      </div>
    </div>
  );
};

// ── Badge preview pill shown inline in the table ──────────────────────────────
const BadgePreview: React.FC<{ p: AdminProduct }> = ({ p }) => {
  if (!p.badge && !p.badge_fr && !p.badge_ar) return null;
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5 }}>
      {p.badge    && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, backgroundColor:'rgba(139,58,26,0.1)',  color:'#8b3a1a', border:'1px solid rgba(139,58,26,0.2)' }}>🇬🇧 {p.badge}</span>}
      {p.badge_fr && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, backgroundColor:'rgba(30,80,160,0.07)', color:'#1e50a0', border:'1px solid rgba(30,80,160,0.18)' }}>🇫🇷 {p.badge_fr}</span>}
      {p.badge_ar && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, backgroundColor:'rgba(180,30,30,0.07)', color:'#b41e1e', border:'1px solid rgba(180,30,30,0.18)', direction:'rtl' }}>🇲🇦 {p.badge_ar}</span>}
    </div>
  );
};

// ── AdminProducts ─────────────────────────────────────────────────────────────
const AdminProducts: React.FC = () => {
  const { t } = useLanguage();

  const [products,    setProducts]    = useState<AdminProduct[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('');
  const [sortBy,      setSortBy]      = useState('name');
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [editForm,    setEditForm]    = useState<EditableFields>(EMPTY_EDIT);
  const [error,       setError]       = useState('');
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [detailId,    setDetailId]    = useState<number | null>(null);

  const [showAdd,     setShowAdd]     = useState(false);
  const [addForm,     setAddForm]     = useState<EditableFields>(EMPTY_EDIT);
  const [multiLang,   setMultiLang]   = useState<MultiLangFields>(EMPTY_MULTILANG);
  const [addImage,    setAddImage]    = useState<File | null>(null);
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addSaving,   setAddSaving]   = useState(false);

  const multiLangRef = useRef<MultiLangFields>(EMPTY_MULTILANG);
  const editFormRef  = useRef<EditableFields>(EMPTY_EDIT);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await apiFetch('/api/products/?ordering=-created_at&page_size=200');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.results ?? []));
    } catch { setError('Failed to load products.'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Filter / sort ──────────────────────────────────────────────────────────
  let displayed = products.filter(p => {
    if (filterCat && p.category !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  if (sortBy === 'name')       displayed = [...displayed].sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'price-asc')  displayed = [...displayed].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  if (sortBy === 'stock')      displayed = [...displayed].sort((a, b) => a.stock_quantity - b.stock_quantity);

  const detailProduct = products.find(p => p.id === detailId) ?? null;

  // ── Edit ───────────────────────────────────────────────────────────────────
  const startEdit = (p: AdminProduct) => {
    const form: EditableFields = {
      name: p.name, price: p.price, origin: p.origin,
      stock_quantity: p.stock_quantity,
      badge:    p.badge,
      badge_fr: p.badge_fr ?? '',
      badge_ar: p.badge_ar ?? '',
      description: p.description || '', category: p.category,
      is_featured: p.is_featured, is_seasonal: p.is_seasonal,
      is_organic: p.is_organic, is_vegan: p.is_vegan,
      is_gluten_free: p.is_gluten_free, is_fair_trade: p.is_fair_trade,
      in_stock: p.in_stock,
      name_fr:        p.name_fr        ?? '',
      name_ar:        p.name_ar        ?? '',
      description_fr: p.description_fr ?? '',
      description_ar: p.description_ar ?? '',
    };
    setEditingId(p.id);
    setDetailId(null);
    setEditForm(form);
    editFormRef.current = form;
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT);
    editFormRef.current = EMPTY_EDIT;
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const latestForm = editFormRef.current;
    setSaving(true);
    try {
      const slug = products.find(p => p.id === editingId)?.slug;
      const res = await apiFetch(`/api/products/${slug}/`, {
        method: 'PATCH',
        body: JSON.stringify(latestForm),
      });
      if (!res.ok) { setError('Failed to save.'); return; }
      await fetchProducts();
      cancelEdit();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  // ── Toggle in_stock ────────────────────────────────────────────────────────
  const toggleStock = async (product: AdminProduct) => {
    try {
      await apiFetch(`/api/products/${product.slug}/`, {
        method: 'PATCH',
        body: JSON.stringify({ in_stock: !product.in_stock }),
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, in_stock: !p.in_stock } : p));
    } catch { setError('Failed to update stock status.'); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    const slug = products.find(p => p.id === deleteId)?.slug;
    try {
      await apiFetch(`/api/products/${slug}/`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== deleteId));
      if (detailId === deleteId) setDetailId(null);
    } catch { setError('Failed to delete product.'); }
    finally { setDeleteId(null); }
  };

  // ── Add Product ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setAddForm(EMPTY_EDIT);
    setMultiLang(EMPTY_MULTILANG);
    multiLangRef.current = EMPTY_MULTILANG;
    setAddImage(null);
    setAddImageUrl('');
    setShowAdd(true);
  };

const submitAdd = async () => {
  const ml = multiLangRef.current;
  if (!ml.name_en.trim()) { setError('English product name is required.'); return; }
  if (!addForm.price)     { setError('Price is required.'); return; }

  setAddSaving(true); setError('');
  try {
    const fd = new FormData();
    fd.append('name',           ml.name_en.trim());
    fd.append('description',    ml.desc_en.trim() || ml.name_en.trim());
    fd.append('name_fr',        ml.name_fr);
    fd.append('name_ar',        ml.name_ar);
    fd.append('description_fr', ml.desc_fr);
    fd.append('description_ar', ml.desc_ar);
    fd.append('badge',          ml.badge_en);
    fd.append('badge_fr',       ml.badge_fr);
    fd.append('badge_ar',       ml.badge_ar);
    fd.append('price',          String(addForm.price));
    fd.append('category',       addForm.category);
    fd.append('origin',         addForm.origin);
    fd.append('stock_quantity', String(addForm.stock_quantity));
    fd.append('in_stock',       String(addForm.in_stock));
    fd.append('is_organic',     String(addForm.is_organic));
    fd.append('is_vegan',       String(addForm.is_vegan));
    fd.append('is_gluten_free', String(addForm.is_gluten_free));
    fd.append('is_fair_trade',  String(addForm.is_fair_trade));
    fd.append('is_featured',    String(addForm.is_featured));
    fd.append('is_seasonal',    String(addForm.is_seasonal));
    if (addImage)         fd.append('image',          addImage);
    else if (addImageUrl) fd.append('image_url_path', addImageUrl);

    // ✅ Use apiFetch — it adds the Authorization: Bearer header automatically
    // Do NOT set Content-Type — browser sets it with boundary for FormData
    const res = await apiFetch('/api/products/', {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Object.entries(err)
        .map(([f, e]) => `${f}: ${(e as string[]).join(' ')}`)
        .join(' | ');
      setError(msg || 'Failed to add product.');
      return;
    }

    await fetchProducts();
    setShowAdd(false);
  } catch (e: any) {
    setError(e.message || 'Network error.');
  } finally {
    setAddSaving(false);
  }
};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'28px 28px 36px', fontFamily:"'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes fadeIn       { from { opacity:0; transform:translate(-50%,-50%) scale(0.94); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes fadeInDelete { from { opacity:0; transform:translate(-50%,-50%) scale(0.94); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes slideIn      { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .prod-row:hover td { background-color:#fdf9f4; }
        .action-btn:hover  { color:#7a4a28 !important; background-color:#faf7f2 !important; }
        .delete-btn:hover  { color:#b04040 !important; background-color:rgba(176,64,64,0.06) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:'#2a1a0e', margin:'0 0 4px' }}>{t('admin.prod.title')}</h1>
          <p style={{ color:'#a08878', fontSize:13, margin:0 }}>{products.length} {t('admin.prod.totalProducts')}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/products" target="_blank"
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', backgroundColor:'#ffffff', border:'1px solid #ede5d8', borderRadius:12, color:'#7a4a28', fontWeight:600, fontSize:13, textDecoration:'none', transition:'all 0.15s' }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='#c8a882'; el.style.backgroundColor='#faf7f2'; }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='#ede5d8'; el.style.backgroundColor='#ffffff'; }}>
            <IconEye/> View Shop
          </Link>
          <button onClick={openAdd}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', backgroundColor:'#7a4a28', border:'none', borderRadius:12, color:'#ffffff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'Jost', sans-serif", transition:'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor='#8f5830'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor='#7a4a28'}>
            <IconPlus/> {t('admin.prod.addProduct')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, backgroundColor:'rgba(176,64,64,0.08)', border:'1px solid rgba(176,64,64,0.2)', color:'#b04040', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#b04040', fontWeight:700, fontSize:16 }}>×</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <IconSearch/>
          <input type="text" placeholder={t('shop.search')} value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft:36 }} onFocus={focus} onBlur={blur}/>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...selectStyle, width:'auto' }}>
          <option value="">{t('shop.all')}</option>
          <option value="herbs">{t('shop.herbs')}</option>
          <option value="teas">{t('shop.teas')}</option>
          <option value="spices">{t('shop.spices')}</option>
          <option value="gift-boxes">{t('shop.giftBoxes')}</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectStyle, width:'auto' }}>
          <option value="name">{t('shop.sortName')}</option>
          <option value="price-asc">{t('shop.sortPriceAsc')}</option>
          <option value="stock">{t('admin.prod.sort.stock')}</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
          <div style={{ width:32, height:32, border:'3px solid #ede5d8', borderTopColor:'#7a4a28', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: detailId ? 'minmax(0,1fr) 360px' : '1fr', gap:20, alignItems:'start' }}>

          {/* ── Products table ───────────────────────────────────────────── */}
          <div style={{ ...card, overflow:'hidden' }}>
            <div className="hidden md:block" style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #ede5d8', backgroundColor:'#fdfaf6' }}>
                    {[t('admin.prod.col.product'), t('admin.prod.col.category'), t('admin.prod.col.price'), t('admin.prod.col.stock'), 'Flags', t('admin.prod.col.status'), t('admin.prod.col.actions')].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 16px', color:'#a08878', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((p, i) => (
                    <React.Fragment key={p.id}>
                      <tr className="prod-row"
                        style={{ borderBottom: editingId!==p.id && i<displayed.length-1 ? '1px solid #f4ede4' : 'none', cursor:'pointer', backgroundColor: detailId===p.id ? 'rgba(122,74,40,0.03)' : 'transparent', borderLeft: detailId===p.id ? '3px solid #7a4a28' : '3px solid transparent' }}
                        onClick={() => setDetailId(detailId===p.id ? null : p.id)}>

                        {/* Product cell — includes badge preview */}
                        <td style={{ padding:'12px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} style={{ width:38, height:38, borderRadius:8, objectFit:'cover', flexShrink:0, marginTop:2 }}/>
                              : <div style={{ width:38, height:38, borderRadius:8, background:'linear-gradient(135deg,#e8ddd0,#d4c4b0)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#a08878', fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, marginTop:2 }}>{p.name.charAt(0)}</div>
                            }
                            <div>
                              <p style={{ color:'#2a1a0e', fontWeight:600, margin:'0 0 2px', maxWidth: detailId ? 140 : 200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                              <p style={{ color:'#a08878', fontSize:11, margin:0 }}>{p.origin}</p>
                              <BadgePreview p={p}/>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:11, padding:'3px 9px', borderRadius:99, backgroundColor:cs(p.category).bg, color:cs(p.category).text, border:`1px solid ${cs(p.category).border}`, textTransform:'capitalize', whiteSpace:'nowrap' }}>
                            {p.category.replace('-',' ')}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', color:'#7a4a28', fontWeight:700, fontFamily:"'Cormorant Garamond', serif", fontSize:16 }}>${p.price}</td>
                        <td style={{ padding:'12px 16px', fontWeight:700, color: p.stock_quantity<=5 ? '#a03030' : p.stock_quantity<=10 ? '#9a5820' : '#2a1a0e' }}>{p.stock_quantity}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {p.is_featured && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, backgroundColor:'rgba(122,74,40,0.09)', color:'#7a4a28', border:'1px solid rgba(122,74,40,0.2)' }}>★ Featured</span>}
                            {p.is_seasonal && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, backgroundColor:'rgba(30,110,100,0.08)', color:'#1a6a60', border:'1px solid rgba(30,110,100,0.2)' }}>◈ Seasonal</span>}
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleStock(p)}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, padding:'4px 10px', borderRadius:99, cursor:'pointer', transition:'all 0.15s', border:'none', fontFamily:"'Jost', sans-serif", backgroundColor: p.in_stock ? 'rgba(58,90,40,0.09)' : 'rgba(160,50,50,0.08)', color: p.in_stock ? '#3a6028' : '#a03030', outline: p.in_stock ? '1px solid rgba(58,90,40,0.22)' : '1px solid rgba(160,50,50,0.22)', whiteSpace:'nowrap' }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', backgroundColor: p.in_stock ? '#3a6028' : '#a03030', flexShrink:0 }}/>
                            {p.in_stock ? t('admin.prod.inStock') : t('admin.prod.outOfStock')}
                          </button>
                        </td>
                        <td style={{ padding:'12px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                            <Link to={`/products/${p.slug}`} target="_blank" className="action-btn"
                              style={{ padding:6, color:'#c8a882', borderRadius:8, display:'flex', transition:'all 0.15s', textDecoration:'none' }}><IconEye/></Link>
                            <button onClick={() => startEdit(p)} className="action-btn"
                              style={{ padding:6, color:'#c8a882', borderRadius:8, display:'flex', background:'none', border:'none', cursor:'pointer', transition:'all 0.15s' }}><IconEdit/></button>
                            <button onClick={() => setDeleteId(p.id)} className="delete-btn"
                              style={{ padding:6, color:'#c8a882', borderRadius:8, display:'flex', background:'none', border:'none', cursor:'pointer', transition:'all 0.15s' }}><IconTrash/></button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Inline edit row ────────────────────────────────── */}
                      {editingId === p.id && (
                        <tr style={{ backgroundColor:'rgba(122,74,40,0.03)', borderLeft:'3px solid #7a4a28', borderBottom:'1px solid #f4ede4' }}>
                          <td colSpan={7} style={{ padding:'18px 16px' }}>

                            {/* LangTabPanel handles name + description + badge per lang */}
                            <LangTabPanel
                              compact
                              resetKey={editingId ?? undefined}
                              initialValues={{
                                nameEn:  editForm.name,
                                nameFr:  editForm.name_fr        ?? '',
                                nameAr:  editForm.name_ar        ?? '',
                                descEn:  editForm.description,
                                descFr:  editForm.description_fr ?? '',
                                descAr:  editForm.description_ar ?? '',
                                badgeEn: editForm.badge          ?? '',
                                badgeFr: editForm.badge_fr       ?? '',
                                badgeAr: editForm.badge_ar       ?? '',
                              }}
                              onChange={v => {
                                const updated: EditableFields = {
                                  ...editFormRef.current,
                                  name:           v.nameEn,
                                  name_fr:        v.nameFr,
                                  name_ar:        v.nameAr,
                                  description:    v.descEn,
                                  description_fr: v.descFr,
                                  description_ar: v.descAr,
                                  badge:          v.badgeEn,
                                  badge_fr:       v.badgeFr,
                                  badge_ar:       v.badgeAr,
                                };
                                editFormRef.current = updated;
                                setEditForm(updated);
                              }}
                            />

                            {/* Scalar fields — badge removed (now in LangTabPanel) */}
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, marginBottom:14 }}>
                              {([
                                ['price',          t('admin.prod.editPrice'), 'number'],
                                ['origin',         t('product.origin'),       'text'],
                                ['stock_quantity', t('admin.prod.col.stock'), 'number'],
                              ] as [keyof EditableFields, string, string][]).map(([field, label, type]) => (
                                <div key={field}>
                                  <label style={labelStyle}>{label}</label>
                                  <input type={type} value={String((editForm as any)[field] ?? '')}
                                    onChange={e => {
                                      const val = type==='number' ? Number(e.target.value) : e.target.value;
                                      const updated = { ...editFormRef.current, [field]: val };
                                      editFormRef.current = updated;
                                      setEditForm(updated);
                                    }}
                                    style={inputStyle} onFocus={focus} onBlur={blur}/>
                                </div>
                              ))}
                              <div>
                                <label style={labelStyle}>{t('admin.prod.col.category')}</label>
                                <select value={editForm.category}
                                  onChange={e => {
                                    const updated = { ...editFormRef.current, category: e.target.value };
                                    editFormRef.current = updated;
                                    setEditForm(updated);
                                  }}
                                  style={selectStyle} onFocus={focus} onBlur={blur}>
                                  <option value="herbs">{t('shop.herbs')}</option>
                                  <option value="teas">{t('shop.teas')}</option>
                                  <option value="spices">{t('shop.spices')}</option>
                                  <option value="gift-boxes">{t('shop.giftBoxes')}</option>
                                </select>
                              </div>
                            </div>

                            {/* Toggles */}
                            <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginBottom:16 }}>
                              {([
                                ['is_featured',   '★ Featured',           '#7a4a28'],
                                ['is_seasonal',   '◈ Seasonal',           '#1a6a60'],
                                ['is_organic',    t('shop.organic'),       '#3a6028'],
                                ['is_vegan',      t('shop.vegan'),         '#3a6028'],
                                ['is_gluten_free',t('shop.glutenFree'),    '#3a5a9a'],
                                ['is_fair_trade', t('shop.fairTrade'),     '#645028'],
                                ['in_stock',      t('admin.prod.inStock'), '#3a6028'],
                              ] as [keyof EditableFields, string, string][]).map(([key, label, color]) => (
                                <Toggle key={key} label={label} checked={editForm[key] as boolean}
                                  onChange={v => {
                                    const updated = { ...editFormRef.current, [key]: v };
                                    editFormRef.current = updated;
                                    setEditForm(updated);
                                  }}
                                  color={color}/>
                              ))}
                            </div>

                            {/* Save / Cancel */}
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={saveEdit} disabled={saving}
                                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', backgroundColor:'#7a4a28', color:'#ffffff', border:'none', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Jost', sans-serif", opacity: saving?0.7:1, transition:'background 0.15s' }}
                                onMouseEnter={e => { if(!saving)(e.currentTarget as HTMLElement).style.backgroundColor='#8f5830'; }}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor='#7a4a28'}>
                                <IconCheck/>{saving ? 'Saving…' : t('profile.save')}
                              </button>
                              <button onClick={cancelEdit}
                                style={{ padding:'8px 16px', backgroundColor:'#faf7f2', color:'#5a4030', border:'1px solid #ede5d8', borderRadius:10, fontSize:12, cursor:'pointer', fontFamily:"'Jost', sans-serif" }}>
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
                <div key={p.id}
                  style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', borderBottom: i<displayed.length-1 ? '1px solid #f4ede4' : 'none', cursor:'pointer', backgroundColor: detailId===p.id ? 'rgba(122,74,40,0.03)' : 'transparent' }}
                  onClick={() => setDetailId(detailId===p.id ? null : p.id)}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width:52, height:52, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
                    : <div style={{ width:52, height:52, borderRadius:10, background:'linear-gradient(135deg,#e8ddd0,#d4c4b0)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#a08878', fontSize:18, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{p.name.charAt(0)}</div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <p style={{ color:'#2a1a0e', fontWeight:600, fontSize:13, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                      <span style={{ color:'#7a4a28', fontWeight:700, fontFamily:"'Cormorant Garamond', serif", fontSize:16, flexShrink:0 }}>${p.price}</span>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, backgroundColor:cs(p.category).bg, color:cs(p.category).text, border:`1px solid ${cs(p.category).border}`, textTransform:'capitalize' }}>{p.category.replace('-',' ')}</span>
                      <span style={{ fontSize:11, fontWeight:600, color: p.stock_quantity<=5 ? '#a03030' : '#a08878' }}>Stock: {p.stock_quantity}</span>
                    </div>
                    <BadgePreview p={p}/>
                    <div style={{ display:'flex', gap:6, marginTop:6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleStock(p)}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, padding:'4px 9px', borderRadius:99, cursor:'pointer', fontFamily:"'Jost', sans-serif", border:'none', backgroundColor: p.in_stock ? 'rgba(58,90,40,0.09)' : 'rgba(160,50,50,0.08)', color: p.in_stock ? '#3a6028' : '#a03030', outline: p.in_stock ? '1px solid rgba(58,90,40,0.22)' : '1px solid rgba(160,50,50,0.22)' }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', backgroundColor: p.in_stock ? '#3a6028' : '#a03030' }}/>
                        {p.in_stock ? t('admin.prod.inStock') : t('admin.prod.outOfStock')}
                      </button>
                      <button onClick={() => startEdit(p)}
                        style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, padding:'4px 9px', borderRadius:99, color:'#7a4a28', border:'1px solid rgba(122,74,40,0.22)', background:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
                        <IconEdit/> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {displayed.length === 0 && !loading && (
              <div style={{ padding:'48px 0', textAlign:'center', color:'#a08878', fontSize:14 }}>No products found.</div>
            )}
          </div>

          {/* ── Detail panel ─────────────────────────────────────────────── */}
          {detailProduct && (
            <div style={{ ...card, overflow:'hidden', alignSelf:'start', animation:'slideIn 0.22s cubic-bezier(0.22,1,0.36,1)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid #ede5d8', background:'linear-gradient(135deg,#fdf8f2,#f9f0e4)' }}>
                <div>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700, color:'#2a1a0e', margin:'0 0 2px' }}>{detailProduct.name}</p>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, backgroundColor:cs(detailProduct.category).bg, color:cs(detailProduct.category).text, border:`1px solid ${cs(detailProduct.category).border}`, textTransform:'capitalize' }}>
                    {detailProduct.category.replace('-',' ')}
                  </span>
                </div>
                <button onClick={() => setDetailId(null)}
                  style={{ padding:6, borderRadius:8, background:'none', border:'none', cursor:'pointer', color:'#a08878', display:'flex', transition:'all 0.15s' }}
                  onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color='#7a4a28'; el.style.backgroundColor='#faf7f2'; }}
                  onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color='#a08878'; el.style.backgroundColor='transparent'; }}>
                  <IconClose/>
                </button>
              </div>
              {detailProduct.image_url && (
                <div style={{ height:180, overflow:'hidden' }}>
                  <img src={detailProduct.image_url} alt={detailProduct.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
              )}
              <div style={{ padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:'#8b3a1a' }}>${detailProduct.price}</span>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:12, color:'#a08878', margin:'0 0 2px' }}>Stock</p>
                    <p style={{ fontSize:16, fontWeight:700, color: detailProduct.stock_quantity<=5 ? '#a03030' : detailProduct.stock_quantity<=10 ? '#9a5820' : '#2a1a0e', margin:0 }}>{detailProduct.stock_quantity} units</p>
                  </div>
                </div>

                {/* Origin · Slug */}
                {[['Origin', detailProduct.origin], ['Slug', detailProduct.slug]].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f4ede4', fontSize:13 }}>
                    <span style={{ color:'#a08878', fontWeight:600 }}>{k}</span>
                    <span style={{ color:'#2a1a0e', textAlign:'right', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
                  </div>
                ))}

                {/* ── Badge — all 3 languages ─────────────────────────────── */}
                <div style={{ padding:'8px 0', borderBottom:'1px solid #f4ede4', fontSize:13 }}>
                  <span style={{ color:'#a08878', fontWeight:600 }}>Badge</span>
                  {(detailProduct.badge || detailProduct.badge_fr || detailProduct.badge_ar) ? (
                    <div style={{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' }}>
                      {detailProduct.badge    && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, backgroundColor:'rgba(139,58,26,0.1)',  color:'#8b3a1a', border:'1px solid rgba(139,58,26,0.22)' }}>🇬🇧 {detailProduct.badge}</span>}
                      {detailProduct.badge_fr && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, backgroundColor:'rgba(30,80,160,0.07)', color:'#1e50a0', border:'1px solid rgba(30,80,160,0.18)' }}>🇫🇷 {detailProduct.badge_fr}</span>}
                      {detailProduct.badge_ar && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, backgroundColor:'rgba(180,30,30,0.07)', color:'#b41e1e', border:'1px solid rgba(180,30,30,0.18)', direction:'rtl' }}>🇲🇦 {detailProduct.badge_ar}</span>}
                    </div>
                  ) : (
                    <span style={{ color:'#c8a882', fontSize:12, marginLeft:8 }}>—</span>
                  )}
                </div>

                {/* Translations */}
                <div style={{ padding:'8px 0', borderBottom:'1px solid #f4ede4', fontSize:13 }}>
                  <span style={{ color:'#a08878', fontWeight:600 }}>Translations</span>
                  <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, backgroundColor:'rgba(58,90,40,0.09)', color:'#3a6028', border:'1px solid rgba(58,90,40,0.2)' }}>🇬🇧 EN</span>
                    {detailProduct.name_fr && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, backgroundColor:'rgba(30,80,160,0.07)', color:'#1e50a0', border:'1px solid rgba(30,80,160,0.18)' }}>🇫🇷 FR</span>}
                    {detailProduct.name_ar && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, backgroundColor:'rgba(180,30,30,0.07)', color:'#b41e1e', border:'1px solid rgba(180,30,30,0.18)' }}>🇲🇦 AR</span>}
                  </div>
                </div>

                {detailProduct.description && (
                  <div style={{ marginTop:14 }}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a08878', marginBottom:6 }}>Description</p>
                    <p style={{ fontSize:13, color:'#5a4030', lineHeight:1.7, margin:0 }}>{detailProduct.description}</p>
                  </div>
                )}
                <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:6 }}>
                  {detailProduct.is_organic     && <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, backgroundColor:'rgba(58,96,40,0.08)',   color:'#3a6028', border:'1px solid rgba(58,96,40,0.2)'   }}>{t('shop.organic')}</span>}
                  {detailProduct.is_vegan       && <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, backgroundColor:'rgba(58,110,50,0.08)', color:'#3a6e30', border:'1px solid rgba(58,110,50,0.2)'  }}>{t('shop.vegan')}</span>}
                  {detailProduct.is_gluten_free && <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, backgroundColor:'rgba(58,90,154,0.07)',  color:'#3a5a9a', border:'1px solid rgba(58,90,154,0.2)' }}>{t('shop.glutenFree')}</span>}
                  {detailProduct.is_fair_trade  && <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, backgroundColor:'rgba(100,80,40,0.08)',  color:'#645028', border:'1px solid rgba(100,80,40,0.2)' }}>{t('shop.fairTrade')}</span>}
                  {detailProduct.is_featured    && <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, backgroundColor:'rgba(122,74,40,0.09)',  color:'#7a4a28', border:'1px solid rgba(122,74,40,0.2)' }}>★ Featured</span>}
                  {detailProduct.is_seasonal    && <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, backgroundColor:'rgba(30,110,100,0.08)', color:'#1a6a60', border:'1px solid rgba(30,110,100,0.2)' }}>◈ Seasonal</span>}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:16 }}>
                  <button onClick={() => startEdit(detailProduct)}
                    style={{ flex:1, padding:'9px 0', backgroundColor:'#7a4a28', color:'#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Jost',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor='#8f5830'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor='#7a4a28'}>
                    <IconEdit/> Edit
                  </button>
                  <Link to={`/products/${detailProduct.slug}`} target="_blank"
                    style={{ flex:1, padding:'9px 0', backgroundColor:'#faf7f2', color:'#7a4a28', border:'1px solid #ede5d8', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Jost',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:6, textDecoration:'none', transition:'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='#c8a882'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='#ede5d8'}>
                    <IconEye/> View
                  </Link>
                  <button onClick={() => setDeleteId(detailProduct.id)}
                    style={{ padding:'9px 12px', backgroundColor:'rgba(176,64,64,0.06)', color:'#b04040', border:'1px solid rgba(176,64,64,0.18)', borderRadius:10, fontSize:12, cursor:'pointer', fontFamily:"'Jost',sans-serif", display:'flex', alignItems:'center', transition:'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor='rgba(176,64,64,0.12)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor='rgba(176,64,64,0.06)'}>
                    <IconTrash/>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Product Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <>
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(42,26,14,0.45)', backdropFilter:'blur(6px)', zIndex:100 }} onClick={() => setShowAdd(false)}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:101, backgroundColor:'#fff', borderRadius:20, width:'min(96vw, 720px)', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(42,26,14,0.22)', animation:'fadeIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:'1px solid #ede5d8', background:'linear-gradient(135deg,#fdf8f2,#f9f0e4)', flexShrink:0 }}>
              <div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:'#2a1a0e', margin:0 }}>{t('admin.prod.addProduct')}</h2>
                <p style={{ fontSize:12, color:'#a08878', margin:'3px 0 0' }}>Fill in at least the English fields. FR &amp; AR are optional.</p>
              </div>
              <button onClick={() => setShowAdd(false)}
                style={{ padding:8, borderRadius:10, background:'none', border:'none', color:'#a08878', cursor:'pointer', display:'flex', transition:'all 0.15s' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.color='#7a4a28'; el.style.backgroundColor='#f0e8dc'; }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.color='#a08878'; el.style.backgroundColor='transparent'; }}>
                <IconClose/>
              </button>
            </div>

            <div style={{ overflowY:'auto', padding:'20px 24px', flex:1 }}>
              {/* LangTabPanel — name + description + badge per language */}
              <LangTabPanel
                resetKey="add"
                initialValues={{
                  nameEn:  multiLang.name_en,
                  nameFr:  multiLang.name_fr,
                  nameAr:  multiLang.name_ar,
                  descEn:  multiLang.desc_en,
                  descFr:  multiLang.desc_fr,
                  descAr:  multiLang.desc_ar,
                  badgeEn: multiLang.badge_en,
                  badgeFr: multiLang.badge_fr,
                  badgeAr: multiLang.badge_ar,
                }}
                onChange={v => {
                  const next: MultiLangFields = {
                    name_en:  v.nameEn,  name_fr:  v.nameFr,  name_ar:  v.nameAr,
                    desc_en:  v.descEn,  desc_fr:  v.descFr,  desc_ar:  v.descAr,
                    badge_en: v.badgeEn, badge_fr: v.badgeFr, badge_ar: v.badgeAr,
                  };
                  multiLangRef.current = next;
                  setMultiLang(next);
                }}
              />

              {/* Core fields */}
              <div style={{ borderTop:'1px solid #ede5d8', paddingTop:18, marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a08878', marginBottom:14 }}>Product Details</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
                  <div>
                    <label style={labelStyle}>{t('admin.prod.editPrice')} <span style={{ color:'#b04040' }}>*</span></label>
                    <input type="number" step="0.01" min="0" placeholder="0.00" value={addForm.price}
                      onChange={e => setAddForm(p => ({ ...p, price: e.target.value }))}
                      style={inputStyle} onFocus={focus} onBlur={blur}/>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('admin.prod.col.category')}</label>
                    <select value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))} style={selectStyle} onFocus={focus} onBlur={blur}>
                      <option value="herbs">{t('shop.herbs')}</option>
                      <option value="teas">{t('shop.teas')}</option>
                      <option value="spices">{t('shop.spices')}</option>
                      <option value="gift-boxes">{t('shop.giftBoxes')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('product.origin')}</label>
                    <input type="text" placeholder="e.g. Marrakesh, Morocco" value={addForm.origin}
                      onChange={e => setAddForm(p => ({ ...p, origin: e.target.value }))}
                      style={inputStyle} onFocus={focus} onBlur={blur}/>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('admin.prod.col.stock')}</label>
                    <input type="number" min="0" value={addForm.stock_quantity}
                      onChange={e => setAddForm(p => ({ ...p, stock_quantity: Number(e.target.value) }))}
                      style={inputStyle} onFocus={focus} onBlur={blur}/>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div style={{ borderTop:'1px solid #ede5d8', paddingTop:18, marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a08878', marginBottom:14 }}>Product Image</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={labelStyle}>Upload File</label>
                    <input type="file" accept="image/*"
                      onChange={e => { setAddImage(e.target.files?.[0] ?? null); setAddImageUrl(''); }}
                      style={{ ...inputStyle, padding:'7px 10px', cursor:'pointer' }}/>
                    {addImage && <p style={{ fontSize:11, color:'#3a6028', marginTop:4 }}>✓ {addImage.name}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Or Image URL Path</label>
                    <input type="text" placeholder="/images/products/mint.jpg" value={addImageUrl}
                      onChange={e => { setAddImageUrl(e.target.value); setAddImage(null); }}
                      style={inputStyle} onFocus={focus} onBlur={blur}/>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ borderTop:'1px solid #ede5d8', paddingTop:18 }}>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a08878', marginBottom:14 }}>Properties</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12 }}>
                  {([
                    ['in_stock',      t('admin.prod.inStock'),   '#3a6028'],
                    ['is_featured',   '★ Featured',              '#7a4a28'],
                    ['is_seasonal',   '◈ Seasonal',              '#1a6a60'],
                    ['is_organic',    t('shop.organic'),          '#3a6028'],
                    ['is_vegan',      t('shop.vegan'),            '#3a6028'],
                    ['is_gluten_free',t('shop.glutenFree'),       '#3a5a9a'],
                    ['is_fair_trade', t('shop.fairTrade'),        '#645028'],
                  ] as [keyof EditableFields, string, string][]).map(([key, label, color]) => (
                    <Toggle key={key} label={label} checked={addForm[key] as boolean} onChange={v => setAddForm(p => ({ ...p, [key]: v }))} color={color}/>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, padding:'16px 24px', borderTop:'1px solid #ede5d8', backgroundColor:'#fdfaf6', flexShrink:0 }}>
              <button onClick={submitAdd} disabled={addSaving}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 0', backgroundColor:'#7a4a28', color:'#fff', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Jost',sans-serif", opacity: addSaving?0.7:1, transition:'background 0.15s' }}
                onMouseEnter={e => { if(!addSaving)(e.currentTarget as HTMLElement).style.backgroundColor='#8f5830'; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor='#7a4a28'}>
                {addSaving
                  ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.6s linear infinite' }}/> Adding…</>
                  : <><IconPlus/> Add Product</>
                }
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ padding:'11px 20px', backgroundColor:'#ffffff', color:'#5a4030', border:'1px solid #ede5d8', borderRadius:12, fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirmation ─────────────────────────────────────────────── */}
      {deleteId !== null && (
        <>
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(42,26,14,0.4)', backdropFilter:'blur(4px)', zIndex:100 }} onClick={() => setDeleteId(null)}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:101, backgroundColor:'#fff', borderRadius:18, padding:28, maxWidth:380, width:'90vw', boxShadow:'0 24px 64px rgba(42,26,14,0.22)', animation:'fadeInDelete 0.2s cubic-bezier(0.22,1,0.36,1) forwards' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', backgroundColor:'rgba(176,64,64,0.08)', border:'1px solid rgba(176,64,64,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <IconTrash/>
            </div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#2a1a0e', margin:'0 0 8px', textAlign:'center' }}>Delete Product?</h3>
            <p style={{ fontSize:13, color:'#a08878', marginBottom:22, textAlign:'center' }}>This action cannot be undone. The product will be permanently removed.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={confirmDelete} style={{ flex:1, padding:'10px 0', backgroundColor:'#b04040', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, padding:'10px 0', backgroundColor:'#faf7f2', color:'#5a4030', border:'1px solid #ede5d8', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProducts;