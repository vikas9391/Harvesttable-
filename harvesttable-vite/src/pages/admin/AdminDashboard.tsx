// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useLanguage } from '../../context/Languagecontext';

interface Order {
  id: number; order_number: string; full_name: string;
  email: string; status: string; total: string; created_at: string;
}

interface ProductSummary {
  id: number; name: string; category: string; stock_quantity: number;
}

const S: Record<string, { bg: string; text: string; border: string }> = {
  pending:    { bg: 'rgba(176,96,48,0.09)',  text: '#9a5820', border: 'rgba(176,96,48,0.22)' },
  confirmed:  { bg: 'rgba(50,90,160,0.08)',  text: '#3a5a9a', border: 'rgba(50,90,160,0.22)' },
  processing: { bg: 'rgba(90,50,130,0.08)',  text: '#6a3a90', border: 'rgba(90,50,130,0.22)' },
  shipped:    { bg: 'rgba(122,74,40,0.10)',  text: '#7a4a28', border: 'rgba(122,74,40,0.25)' },
  delivered:  { bg: 'rgba(58,90,40,0.10)',   text: '#3a6028', border: 'rgba(58,90,40,0.25)'  },
  cancelled:  { bg: 'rgba(160,50,50,0.08)',  text: '#a03030', border: 'rgba(160,50,50,0.22)' },
};
const sc = (s: string) => S[s] ?? S.pending;

const card: React.CSSProperties = { backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 16 };

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconRevenue = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconOrders = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
);
const IconArrowUp = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
  </svg>
);
const IconWarning = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="22" height="22" fill="none" stroke="#3a6028" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
  </svg>
);
const IconEmptyBox = () => (
  <svg width="24" height="24" fill="none" stroke="#a08878" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);

// ─── AdminDashboard ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { t, lang } = useLanguage();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── Fetch orders ────────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/orders/admin/')
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch products from API (not static file) ───────────────────────────────
  useEffect(() => {
    apiFetch('/api/products/?page_size=200')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, []);

  const lowStock     = products.filter(p => p.stock_quantity <= 10);
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total || '0'), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 5);

  const salesData = Array(12).fill(0);
  orders.forEach(o => { const m = new Date(o.created_at).getMonth(); salesData[m] += parseFloat(o.total || '0'); });
  const maxSale = Math.max(...salesData, 1);

  const monthAbbrevs: Record<string, string[]> = {
    en: ['J','F','M','A','M','J','J','A','S','O','N','D'],
    fr: ['J','F','M','A','M','J','J','A','S','O','N','D'],
    ar: ['ي','ف','م','أ','م','ج','ج','أ','س','أ','ن','د'],
  };
  const months = monthAbbrevs[lang] ?? monthAbbrevs.en;

  const stats = [
    {
      key: 'revenue',
      label: t('admin.dash.totalRevenue'),
      value: `$${totalRevenue.toFixed(0)}`,
      sub: `${orders.length} ${t('admin.dash.ordersTotal')}`,
      good: true,
      icon: <IconRevenue />,
    },
    {
      key: 'orders',
      label: t('admin.dash.totalOrders'),
      value: orders.length.toString(),
      sub: `${pendingCount} ${t('admin.dash.pending')}`,
      good: true,
      icon: <IconOrders />,
    },
    {
      key: 'products',
      label: t('admin.dash.products'),
      value: products.length.toString(),
      sub: `${lowStock.length} ${t('admin.dash.lowStock')}`,
      good: lowStock.length === 0,
      icon: <IconShield />,
    },
    {
      key: 'avg',
      label: t('admin.dash.avgOrder'),
      value: orders.length ? `$${(totalRevenue / orders.length).toFixed(2)}` : '$0.00',
      sub: t('admin.dash.allTime'),
      good: true,
      icon: <IconChart />,
    },
  ];

  const statusLabel = (s: string) => t(`status.${s}`) ?? s;

  const tableHeaders = [
    t('admin.order.col.order'),
    t('admin.order.col.customer'),
    t('admin.order.col.status'),
    t('admin.order.col.date'),
    t('admin.order.col.total'),
  ];

  return (
    <div style={{ padding: '28px 28px 36px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
            {t('admin.dash.dashboard')}
          </h1>
          <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>
            {t('admin.dash.welcomeBack')}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a08878',
          backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 10, padding: '8px 14px',
        }}>
          <IconCalendar />
          {new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14, marginBottom: 22 }}>
        {stats.map(stat => (
          <div key={stat.key} style={{ ...card, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a6840',
              }}>
                {stat.icon}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                padding: '3px 9px', borderRadius: 99,
                backgroundColor: stat.good ? 'rgba(58,90,40,0.10)' : 'rgba(176,96,48,0.09)',
                color: stat.good ? '#3a6028' : '#9a5820',
                border: stat.good ? '1px solid rgba(58,90,40,0.20)' : '1px solid rgba(176,96,48,0.22)',
              }}>
                {stat.good ? <IconArrowUp /> : <IconWarning />}
              </div>
            </div>
            {loading
              ? <div style={{ height: 26, width: 72, backgroundColor: '#f0e8dc', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
              : <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#2a1a0e', margin: '0 0 2px' }}>{stat.value}</p>
            }
            <p style={{ fontSize: 12, color: '#5a4030', fontWeight: 600, margin: '0 0 2px' }}>{stat.label}</p>
            <p style={{ fontSize: 11, color: '#a08878', margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 16, marginBottom: 22 }}>
        {/* Sales chart */}
        <div className="lg:col-span-2" style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#2a1a0e', margin: 0 }}>
              {t('admin.dash.salesOverview')}
            </h2>
            <span style={{ fontSize: 11, color: '#a08878' }}>{t('admin.dash.monthly')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 130 }}>
            {salesData.map((val, i) => (
              <div
                key={i}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
                className="group"
              >
                <div
                  style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    backgroundColor: 'rgba(122,74,40,0.15)',
                    height: `${(val / maxSale) * 100}%`, minHeight: val > 0 ? 4 : 0,
                    transition: 'background-color 0.2s', cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(122,74,40,0.38)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(122,74,40,0.15)'}
                >
                  {val > 0 && (
                    <span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: '#2a1a0e', color: '#f5ede0', fontSize: 10,
                        padding: '3px 7px', borderRadius: 6, whiteSpace: 'nowrap', pointerEvents: 'none',
                      }}
                    >
                      ${val.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 8 }}>
            {months.map((m, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#c8a882' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#2a1a0e', margin: 0 }}>
              {t('admin.dash.stockTitle')}
            </h2>
            <Link to="/admin/products" style={{ fontSize: 12, color: '#7a4a28', textDecoration: 'none', fontWeight: 600 }}>
              {t('admin.dash.viewAll')}
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: 'rgba(58,96,40,0.09)', border: '1px solid rgba(58,96,40,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
              }}>
                <IconCheckCircle />
              </div>
              <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>{t('admin.dash.wellStocked')}</p>
            </div>
          ) : lowStock.map(p => (
            <Link
              key={p.id} to="/admin/products"
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', borderRadius: 10, backgroundColor: '#faf7f2',
                border: '1px solid #ede5d8', marginBottom: 6, textDecoration: 'none', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#c8a882'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#ede5d8'}
            >
              <div style={{ minWidth: 0, marginRight: 8 }}>
                <p style={{ color: '#2a1a0e', fontSize: 13, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </p>
                <p style={{ color: '#a08878', fontSize: 11, margin: 0, textTransform: 'capitalize' }}>
                  {p.category.replace('-', ' ')}
                </p>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 8, flexShrink: 0,
                backgroundColor: p.stock_quantity <= 5 ? 'rgba(160,50,50,0.09)' : 'rgba(176,96,48,0.09)',
                color: p.stock_quantity <= 5 ? '#a03030' : '#9a5820',
              }}>
                {p.stock_quantity}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', borderBottom: '1px solid #ede5d8',
        }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#2a1a0e', margin: 0 }}>
            {t('admin.dash.recentOrders')}
          </h2>
          <Link
            to="/admin/orders"
            style={{ fontSize: 12, color: '#7a4a28', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {t('admin.dash.viewAll')} <IconChevronRight />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #ede5d8', borderTopColor: '#7a4a28', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : recentOrders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <IconEmptyBox />
            </div>
            <p style={{ color: '#a08878', margin: 0, fontSize: 13 }}>{t('admin.dash.noOrders')}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ede5d8' }}>
                    {tableHeaders.map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 22px', color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid #f4ede4' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#fdf9f4'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 22px' }}>
                        <span style={{ color: '#7a4a28', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                          #{String(order.order_number).slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 22px' }}>
                        <p style={{ color: '#2a1a0e', margin: '0 0 2px', fontWeight: 500 }}>{order.full_name}</p>
                        <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{order.email}</p>
                      </td>
                      <td style={{ padding: '14px 22px' }}>
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 99,
                          backgroundColor: sc(order.status).bg,
                          color: sc(order.status).text,
                          border: `1px solid ${sc(order.status).border}`,
                        }}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 22px', color: '#a08878', fontSize: 12 }}>
                        {order.created_at?.slice(0, 10)}
                      </td>
                      <td style={{ padding: '14px 22px', color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>
                        ${order.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden">
              {recentOrders.map((order, i) => (
                <div key={order.id} style={{ padding: '14px 16px', borderBottom: i < recentOrders.length - 1 ? '1px solid #f4ede4' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#7a4a28', fontFamily: 'monospace', fontSize: 12 }}>
                      #{String(order.order_number).slice(0, 8).toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 99,
                      backgroundColor: sc(order.status).bg, color: sc(order.status).text,
                      border: `1px solid ${sc(order.status).border}`,
                    }}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <p style={{ color: '#2a1a0e', fontSize: 13, margin: '0 0 4px' }}>{order.full_name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a08878', fontSize: 11 }}>{order.created_at?.slice(0, 10)}</span>
                    <span style={{ color: '#7a4a28', fontWeight: 700 }}>${order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;