// src/pages/admin/AdminOrders.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { useLanguage } from '../../context/Languagecontext';

interface OrderItem { name: string; qty: number; price: string }
interface Order {
  id: number; order_number: string; full_name: string; email: string;
  phone?: string; address: string; status: string;
  subtotal: string; shipping: string; total: string;
  created_at: string; items: OrderItem[];
}

const ALL_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

const S: Record<string, { label:string; bg:string; text:string; border:string; dot:string }> = {
  pending:    { label:'Pending',    bg:'rgba(176,96,48,0.09)',  text:'#9a5820', border:'rgba(176,96,48,0.22)',  dot:'#c87840' },
  confirmed:  { label:'Confirmed',  bg:'rgba(50,90,160,0.08)',  text:'#3a5a9a', border:'rgba(50,90,160,0.22)',  dot:'#4a6ab0' },
  processing: { label:'Processing', bg:'rgba(90,50,130,0.08)',  text:'#6a3a90', border:'rgba(90,50,130,0.22)',  dot:'#7a4aa0' },
  shipped:    { label:'Shipped',    bg:'rgba(122,74,40,0.10)',  text:'#7a4a28', border:'rgba(122,74,40,0.25)',  dot:'#7a4a28' },
  delivered:  { label:'Delivered',  bg:'rgba(58,90,40,0.10)',   text:'#3a6028', border:'rgba(58,90,40,0.25)',   dot:'#3a6028' },
  cancelled:  { label:'Cancelled',  bg:'rgba(160,50,50,0.08)',  text:'#a03030', border:'rgba(160,50,50,0.22)',  dot:'#c04040' },
};
const sc = (s: string) => S[s] ?? S.pending;

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #ede5d8',
  borderRadius: 16,
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#c8a882', width:16, height:16 }}
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
  </svg>
);
const IconEmptyBox = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="#a08878" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);
const IconUser = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);
const IconPhone = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
  </svg>
);
const IconPackage = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);
const IconReceipt = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
  </svg>
);
const IconTruck = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h2l3 4v3h-5m0 0a2 2 0 11-4 0m4 0a2 2 0 01-4 0M9 17a2 2 0 11-4 0m4 0a2 2 0 01-4 0"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string; t: (k: string) => string }> = ({ status, t }) => {
  const s = sc(status);
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 99,
      backgroundColor: s.bg, color: s.text,
      border: `1px solid ${s.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {t(`status.${status}`)}
    </span>
  );
};

// ─── AdminOrders ──────────────────────────────────────────────────────────────
const AdminOrders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders]             = useState<Order[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [updating, setUpdating]         = useState<number | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<number | null>(null);
  const [error, setError]               = useState('');
  const [refreshing, setRefreshing]     = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const r = await apiFetch('/api/orders/admin/');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : data.results ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Derived counts (recalculated whenever orders changes) ──────────────────
  const countByStatus = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  const displayed = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !o.full_name.toLowerCase().includes(q) &&
        !o.email.toLowerCase().includes(q) &&
        !o.order_number.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // Keep selectedOrder in sync with latest orders state (so status updates reflect immediately)
  const selectedOrder = orders.find(o => o.id === selectedId);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await apiFetch(`/api/orders/${id}/admin/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // ✅ Update orders in-place — counts & detail panel both update instantly
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

      // Flash success indicator on the button
      setUpdateSuccess(id);
      setTimeout(() => setUpdateSuccess(null), 1500);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs = [
    { v: '', l: t('admin.order.filterAll'), count: orders.length },
    ...ALL_STATUSES.map(s => ({ v: s, l: t(`status.${s}`), count: countByStatus[s] })),
  ];

  return (
    <div style={{ padding: '28px 28px 36px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes successPop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        .order-row { transition: background-color 0.15s; }
        .order-row:hover { background-color: #fdf9f4 !important; }
        .tab-btn { transition: all 0.15s; }
        .tab-btn:hover { background-color: #faf7f2 !important; color: #5a4030 !important; }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
            {t('admin.orders')}
          </h1>
          <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>
            {loading ? '…' : `${orders.length} ${t('admin.order.totalOrders')}`}
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: '1px solid #ede5d8',
            backgroundColor: '#ffffff', color: '#7a4a28', fontSize: 12, fontWeight: 500,
            cursor: refreshing ? 'default' : 'pointer', fontFamily: "'Jost', sans-serif",
            opacity: refreshing ? 0.6 : 1, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!refreshing) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#c8a882'; el.style.backgroundColor = '#faf7f2'; }}}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#ede5d8'; el.style.backgroundColor = '#ffffff'; }}
        >
          <span style={{ display: 'flex', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>
            <IconRefresh />
          </span>
          Refresh
        </button>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 10,
          backgroundColor: 'rgba(160,50,50,0.08)', border: '1px solid rgba(160,50,50,0.22)',
          color: '#a03030', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠ {error}</span>
          <button onClick={() => fetchOrders()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a03030', fontSize: 12, fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Status tabs with live counts ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
        {tabs.map(({ v, l, count }) => {
          const active = filterStatus === v;
          return (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={active ? '' : 'tab-btn'}
              style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10, fontSize: 12,
                fontWeight: 500, cursor: 'pointer', border: 'none',
                backgroundColor: active ? 'rgba(122,74,40,0.10)' : '#ffffff',
                color: active ? '#7a4a28' : '#a08878',
                outline: active ? '1px solid rgba(122,74,40,0.25)' : '1px solid #ede5d8',
                fontFamily: "'Jost', sans-serif",
              }}
            >
              {/* Coloured dot for status tabs */}
              {v && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: active ? sc(v).dot : '#c8a882',
                }} />
              )}
              {l}
              {/* ✅ Live count badge */}
              <span style={{
                minWidth: 18, height: 18, borderRadius: 99,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600, lineHeight: 1,
                backgroundColor: active ? 'rgba(122,74,40,0.15)' : 'rgba(160,130,100,0.10)',
                color: active ? '#7a4a28' : '#a08878',
                padding: '0 5px',
                transition: 'all 0.2s',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 20 }}>
        <IconSearch />
        <input
          type="text"
          placeholder={t('admin.order.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 36px',
            backgroundColor: '#ffffff', border: '1px solid #ede5d8',
            borderRadius: 12, color: '#2a1a0e', fontSize: 13, outline: 'none',
            fontFamily: "'Jost', sans-serif", boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
          onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a08878', display: 'flex', padding: 2,
            }}
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* ── Results summary ───────────────────────────────────────────────── */}
      {!loading && (filterStatus || search) && (
        <p style={{ color: '#a08878', fontSize: 12, marginBottom: 12, marginTop: -8 }}>
          Showing {displayed.length} of {orders.length} orders
          {filterStatus && <> · <span style={{ color: sc(filterStatus).text }}>{t(`status.${filterStatus}`)}</span></>}
          {search && <> · matching "<strong style={{ color: '#5a4030' }}>{search}</strong>"</>}
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #ede5d8', borderTopColor: '#7a4a28', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedId ? 'minmax(0,1fr) minmax(0,420px)' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}>

          {/* ── Orders list ─────────────────────────────────────────────── */}
          <div style={{ ...card, overflow: 'hidden' }}>
            {displayed.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <IconEmptyBox size={24} />
                </div>
                <p style={{ color: '#a08878', margin: '0 0 8px', fontSize: 13 }}>{t('admin.order.noOrders')}</p>
                {(filterStatus || search) && (
                  <button
                    onClick={() => { setFilterStatus(''); setSearch(''); }}
                    style={{
                      background: 'none', border: '1px solid #ede5d8', cursor: 'pointer',
                      color: '#7a4a28', fontSize: 12, padding: '6px 14px', borderRadius: 8,
                      fontFamily: "'Jost', sans-serif",
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              displayed.map((order, idx) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedId(selectedId === order.id ? null : order.id)}
                  className={selectedId !== order.id ? 'order-row' : ''}
                  style={{
                    width: '100%', textAlign: 'left', padding: '15px 18px',
                    display: 'block', cursor: 'pointer',
                    borderBottom: idx < displayed.length - 1 ? '1px solid #f4ede4' : 'none',
                    border: 'none',
                    borderLeft: selectedId === order.id ? '3px solid #7a4a28' : '3px solid transparent',
                    backgroundColor: selectedId === order.id ? 'rgba(122,74,40,0.04)' : 'transparent',
                    fontFamily: "'Jost', sans-serif",
                    animation: 'fadeIn 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ color: '#7a4a28', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                          #{String(order.order_number).slice(0, 8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} t={t} />
                      </div>
                      <p style={{ color: '#2a1a0e', fontSize: 13, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.full_name}
                      </p>
                      <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>
                        {order.email} · {order.created_at?.slice(0, 10)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 17, margin: '0 0 2px' }}>
                        ${order.total}
                      </p>
                      <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>
                        {order.items?.length ?? 0} {order.items?.length !== 1 ? t('admin.order.items') : t('admin.order.item')}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* ── Order detail panel ──────────────────────────────────────── */}
          {selectedOrder && (
            <div style={{ ...card, overflow: 'hidden', alignSelf: 'start', animation: 'fadeIn 0.2s ease' }}>

              {/* Panel header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderBottom: '1px solid #ede5d8',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h3 style={{ color: '#2a1a0e', fontWeight: 600, margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: 17 }}>
                      #{String(selectedOrder.order_number).slice(0, 8).toUpperCase()}
                    </h3>
                    {/* ✅ Status badge in header updates instantly after updateStatus */}
                    <StatusBadge status={selectedOrder.status} t={t} />
                  </div>
                  <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{selectedOrder.created_at?.slice(0, 10)}</p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a08878', padding: 6, borderRadius: 8, display: 'flex', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#7a4a28'; el.style.backgroundColor = '#faf7f2'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#a08878'; el.style.backgroundColor = 'transparent'; }}
                >
                  <IconClose />
                </button>
              </div>

              <div style={{ padding: 20 }}>

                {/* Customer info */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ color: '#a08878', display: 'flex' }}><IconUser /></span>
                    <p style={{ color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>
                      {t('admin.order.col.customer')}
                    </p>
                  </div>
                  <p style={{ color: '#2a1a0e', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>{selectedOrder.full_name}</p>
                  <p style={{ color: '#5a4030', fontSize: 13, margin: '0 0 4px' }}>{selectedOrder.email}</p>
                  {selectedOrder.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ color: '#a08878', display: 'flex' }}><IconPhone /></span>
                      <p style={{ color: '#5a4030', fontSize: 13, margin: 0 }}>{selectedOrder.phone}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#a08878', display: 'flex', marginTop: 1 }}><IconMapPin /></span>
                    <p style={{ color: '#a08878', fontSize: 12, margin: 0 }}>{selectedOrder.address}</p>
                  </div>
                </div>

                {/* Items */}
                {selectedOrder.items?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ color: '#a08878', display: 'flex' }}><IconPackage /></span>
                      <p style={{ color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>
                        {t('admin.order.col.items')}
                      </p>
                    </div>
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: 13,
                        padding: '9px 0', borderBottom: '1px solid #f4ede4',
                      }}>
                        <span style={{ color: '#5a4030' }}>{item.qty}× {item.name}</span>
                        <span style={{ color: '#a08878' }}>${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                      </div>
                    ))}

                    {/* Shipping row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '9px 0', borderBottom: '1px solid #f4ede4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#a08878', display: 'flex' }}><IconTruck /></span>
                        <span style={{ color: '#a08878' }}>{t('checkout.shipping')}</span>
                      </div>
                      <span style={{ color: '#a08878' }}>
                        {parseFloat(selectedOrder.shipping) === 0 ? t('checkout.shippingFree') : `$${selectedOrder.shipping}`}
                      </span>
                    </div>

                    {/* Total row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#5a4030', display: 'flex' }}><IconReceipt /></span>
                        <span style={{ color: '#2a1a0e', fontWeight: 600, fontSize: 14 }}>
                          {t('checkout.grandTotal')}
                        </span>
                      </div>
                      <span style={{ color: '#7a4a28', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>
                        ${selectedOrder.total}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Status update buttons ────────────────────────────── */}
                <div>
                  <p style={{ color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
                    {t('admin.order.updateStatus')}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {ALL_STATUSES.map(s => {
                      const active     = selectedOrder.status === s;
                      const isUpdating = updating === selectedOrder.id;
                      const didSucceed = updateSuccess === selectedOrder.id && active;

                      return (
                        <button
                          key={s}
                          onClick={() => !isUpdating && !active && updateStatus(selectedOrder.id, s)}
                          disabled={isUpdating || active}
                          style={{
                            padding: '8px 0', fontSize: 12, borderRadius: 10,
                            cursor: isUpdating || active ? 'default' : 'pointer',
                            fontFamily: "'Jost', sans-serif", border: 'none',
                            backgroundColor: active ? sc(s).bg : 'transparent',
                            color: active ? sc(s).text : '#a08878',
                            outline: active ? `1px solid ${sc(s).border}` : '1px solid #ede5d8',
                            fontWeight: active ? 600 : 400,
                            transition: 'all 0.15s',
                            opacity: isUpdating && !active ? 0.4 : 1,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            animation: didSucceed ? 'successPop 0.35s cubic-bezier(0.22,1,0.36,1)' : 'none',
                          }}
                          onMouseEnter={e => { if (!active && !isUpdating) { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = sc(s).bg; el.style.color = sc(s).text; el.style.outline = `1px solid ${sc(s).border}`; }}}
                          onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = '#a08878'; el.style.outline = '1px solid #ede5d8'; }}}
                        >
                          {/* Spinner on the button being updated */}
                          {isUpdating && !active ? (
                            <span style={{ width: 8, height: 8, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />
                          ) : (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sc(s).dot, flexShrink: 0 }} />
                          )}
                          {t(`status.${s}`)}
                          {/* ✅ Checkmark when this is the newly-active status */}
                          {active && (
                            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;