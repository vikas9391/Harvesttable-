// src/pages/admin/AdminCustomers.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { useLanguage } from '../../context/Languagecontext';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  orders: number;
  total_spent: string;
  joined: string;
  last_order?: string | null;
}

const card: React.CSSProperties = {
  backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 16,
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconUsers    = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const IconRevenue  = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IconAvg      = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
const IconOrders   = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
const IconSearch   = () => <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c8a882', width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
const IconEmpty    = () => <svg width="20" height="20" fill="none" stroke="#a08878" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>

// ─── AdminCustomers ──────────────────────────────────────────────────────────
const AdminCustomers: React.FC = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]); // unfiltered, for stats
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('name');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Fetch customers — search & sort delegated to backend
  const fetchCustomers = useCallback(async (q: string, sort: string) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (q)    params.set('search', q);
      if (sort) params.set('ordering', sort);
      const res = await apiFetch(`/api/users/admin/customers/?${params.toString()}`);
      if (!res.ok) { setError('Failed to load customers.'); return; }
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all customers once (no filters) for header stats
  useEffect(() => {
    apiFetch('/api/users/admin/customers/')
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllCustomers(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, []);

  // Initial load
  useEffect(() => { fetchCustomers('', 'name'); }, [fetchCustomers]);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => fetchCustomers(val, sortBy), 380));
  };

  const handleSort = (val: string) => {
    setSortBy(val);
    fetchCustomers(search, val);
  };

  // Aggregate stats from the full unfiltered list
  const totalRevenue  = allCustomers.reduce((s, c) => s + parseFloat(c.total_spent || '0'), 0);
  const totalOrders   = allCustomers.reduce((s, c) => s + (c.orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    { label: t('admin.cust.totalCustomers'), value: allCustomers.length.toString(), icon: <IconUsers /> },
    { label: t('admin.cust.totalRevenue'),   value: `$${totalRevenue.toFixed(0)}`,  icon: <IconRevenue /> },
    { label: t('admin.cust.avgOrder'),       value: `$${avgOrderValue.toFixed(2)}`, icon: <IconAvg /> },
    { label: t('admin.cust.totalOrders') ?? 'Total Orders', value: totalOrders.toString(), icon: <IconOrders /> },
  ];

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 12,
    color: '#5a4030', fontSize: 13, padding: '10px 14px', outline: 'none',
    fontFamily: "'Jost', sans-serif", cursor: 'pointer',
  };

  const sortOptions = [
    { value: 'name',   label: t('admin.cust.sort.name')   },
    { value: 'spent',  label: t('admin.cust.sort.spent')  },
    { value: 'orders', label: t('admin.cust.sort.orders') },
  ];

  return (
    <div style={{ padding: '28px 28px 36px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
          {t('admin.cust.title')}
        </h1>
        <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>
          {allCustomers.length} {t('admin.cust.registered')}
        </p>
      </div>

      {/* Stats — computed from real data */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 14, marginBottom: 22 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
              {s.value}
            </p>
            <p style={{ color: '#a08878', fontSize: 12, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row" style={{ gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <IconSearch />
          <input
            type="text"
            placeholder={t('shop.search')}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              backgroundColor: '#ffffff', border: '1px solid #ede5d8',
              borderRadius: 12, color: '#2a1a0e', fontSize: 13, outline: 'none',
              fontFamily: "'Jost', sans-serif", boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
            onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => handleSort(e.target.value)}
          style={selectStyle}
          onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
          onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
        >
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13, backgroundColor: 'rgba(176,64,64,0.08)', border: '1px solid rgba(176,64,64,0.2)', color: '#b04040' }}>
          {error}
        </div>
      )}

      {/* Table / cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #ede5d8', borderTopColor: '#7a4a28', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>

          {/* Desktop table */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ede5d8' }}>
                  {[
                    t('admin.cust.col.customer'),
                    t('admin.cust.col.phone') ?? 'Phone',
                    t('admin.cust.col.orders'),
                    t('admin.cust.col.spent'),
                    t('admin.cust.col.joined'),
                    t('admin.cust.col.lastOrder'),
                  ].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconEmpty />
                        </div>
                        <p style={{ color: '#a08878', margin: 0, fontSize: 13 }}>{t('admin.cust.noFound')}</p>
                      </div>
                    </td>
                  </tr>
                ) : customers.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < customers.length - 1 ? '1px solid #f4ede4' : 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#fdf9f4'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#e8d0b0 0%,#c8a070 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #ede5d8' }}>
                          <span style={{ color: '#7a4a28', fontSize: 13, fontWeight: 700 }}>{c.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ color: '#2a1a0e', fontWeight: 500, margin: '0 0 2px' }}>{c.name}</p>
                          <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#5a4030', fontSize: 12 }}>{c.phone || '—'}</td>
                    <td style={{ padding: '14px 20px', color: '#2a1a0e', fontWeight: 500 }}>{c.orders}</td>
                    <td style={{ padding: '14px 20px', color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>
                      ${parseFloat(c.total_spent).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#a08878', fontSize: 12 }}>{c.joined?.slice(0, 10)}</td>
                    <td style={{ padding: '14px 20px', color: '#a08878', fontSize: 12 }}>{c.last_order?.slice(0, 10) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {customers.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconEmpty />
                </div>
                <p style={{ color: '#a08878', margin: 0, fontSize: 13 }}>{t('admin.cust.noFound')}</p>
              </div>
            ) : customers.map((c, i) => (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < customers.length - 1 ? '1px solid #f4ede4' : 'none' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#e8d0b0 0%,#c8a070 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #ede5d8' }}>
                  <span style={{ color: '#7a4a28', fontWeight: 700 }}>{c.name[0]?.toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#2a1a0e', fontSize: 13, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  <p style={{ color: '#a08878', fontSize: 11, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                  <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{c.orders} orders · joined {c.joined?.slice(0, 10)}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, margin: '0 0 2px' }}>
                    ${parseFloat(c.total_spent).toFixed(2)}
                  </p>
                  <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{c.last_order?.slice(0, 10) || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;