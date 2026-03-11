// src/pages/admin/AdminContactMessages.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { useLanguage } from '../../context/Languagecontext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  lang: string;
  lang_display: string;
  status: 'new' | 'in_progress' | 'resolved' | 'spam';
  admin_note?: string;
  ip_address?: string;
  created_at: string;
  updated_at?: string;
  user?: { id: number; email: string } | null;
}

interface Stats {
  total: number;
  new: number;
  in_progress: number;
  resolved: number;
  spam: number;
  today: number;
  this_week: number;
  by_lang: { en: number; fr: number; ar: number };
}

// ─── Style constants ──────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #ede5d8',
  borderRadius: 16,
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  new:         { bg: 'rgba(50,90,160,0.08)',  text: '#3a5a9a', border: 'rgba(50,90,160,0.22)',  label: 'New'         },
  in_progress: { bg: 'rgba(176,96,48,0.09)',  text: '#9a5820', border: 'rgba(176,96,48,0.22)',  label: 'In Progress' },
  resolved:    { bg: 'rgba(58,90,40,0.10)',   text: '#3a6028', border: 'rgba(58,90,40,0.25)',   label: 'Resolved'    },
  spam:        { bg: 'rgba(160,50,50,0.08)',  text: '#a03030', border: 'rgba(160,50,50,0.22)',  label: 'Spam'        },
};

const LANG_LABELS: Record<string, string> = { en: 'EN', fr: 'FR', ar: 'AR' };

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconMail      = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const IconInbox     = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>;
const IconClock     = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconCheck2    = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="#9a6840" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconSearch    = () => <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c8a882', width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const IconClose     = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
const IconChevron   = ({ dir = 'right' }: { dir?: 'left' | 'right' }) => <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dir === 'right' ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}/></svg>;
const IconTrash     = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconNote      = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const IconUser      = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const IconEmpty     = () => <svg width="20" height="20" fill="none" stroke="#a08878" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal: React.FC<{
  msg: ContactMessage;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string, note?: string) => void;
  onDelete: (id: number) => void;
  t: (key: string) => string;
}> = ({ msg, onClose, onStatusUpdate, onDelete, t }) => {
  const [status, setStatus]   = useState(msg.status);
  const [note, setNote]       = useState(msg.admin_note || '');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onStatusUpdate(msg.id, status, note);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    await onDelete(msg.id);
    setDeleting(false);
    onClose();
  };

  const ss = STATUS_STYLES[status] ?? STATUS_STYLES.new;

  const selectStyle: React.CSSProperties = {
    backgroundColor: ss.bg, border: `1px solid ${ss.border}`,
    borderRadius: 10, color: ss.text, fontSize: 12, fontWeight: 600,
    padding: '7px 12px', outline: 'none', cursor: 'pointer',
    fontFamily: "'Jost', sans-serif", appearance: 'none', width: '100%',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(42,26,14,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, width: '90%', maxWidth: 580, maxHeight: '90vh',
        backgroundColor: '#fff', borderRadius: 20, border: '1px solid #ede5d8',
        boxShadow: '0 24px 80px rgba(42,26,14,0.22)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #ede5d8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.08em',
                backgroundColor: STATUS_STYLES[msg.status]?.bg, color: STATUS_STYLES[msg.status]?.text,
                border: `1px solid ${STATUS_STYLES[msg.status]?.border}`,
              }}>
                {STATUS_STYLES[msg.status]?.label}
              </span>
              <span style={{ fontSize: 10, color: '#c8a882', letterSpacing: '0.06em', fontWeight: 600 }}>
                #{msg.id} · {msg.created_at?.slice(0, 10)}
              </span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#2a1a0e', margin: 0, wordBreak: 'break-word' }}>
              {msg.subject}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a08878', padding: 4, borderRadius: 8, flexShrink: 0, display: 'flex' }}>
            <IconClose size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Sender info */}
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f4ede4', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg,#e8d0b0 0%,#c8a070 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: '1px solid #ede5d8',
            }}>
              <span style={{ color: '#7a4a28', fontSize: 15, fontWeight: 700 }}>{msg.name?.[0]?.toUpperCase()}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#2a1a0e', fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{msg.name}</p>
              <p style={{ color: '#7a4a28', fontSize: 12, margin: '0 0 2px' }}>
                <a href={`mailto:${msg.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{msg.email}</a>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: '#c8a882', fontWeight: 600, letterSpacing: '0.08em' }}>
                  LANG: {LANG_LABELS[msg.lang] ?? msg.lang}
                </span>
                {msg.user && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#7a4a28', fontWeight: 600, padding: '1px 6px', borderRadius: 6, backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.15)' }}>
                    <IconUser size={10} /> Registered
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Message body */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f4ede4' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a882', margin: '0 0 10px' }}>
              {t('contact.admin.message')}
            </p>
            <p style={{ color: '#2a1a0e', fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.message}
            </p>
          </div>

          {/* Status + note controls */}
          <div style={{ padding: '18px 22px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a882', margin: '0 0 12px' }}>
              {t('contact.admin.manage')}
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#a08878', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                {t('contact.admin.status')}
              </label>
              <select value={status} onChange={e => setStatus(e.target.value as ContactMessage['status'])} style={selectStyle}>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#a08878', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                {t('contact.admin.note')}
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder={t('contact.admin.notePlaceholder')}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 12,
                  border: '1px solid #ede5d8', backgroundColor: '#faf7f2',
                  color: '#2a1a0e', fontSize: 13, outline: 'none', resize: 'vertical',
                  fontFamily: "'Jost', sans-serif", boxSizing: 'border-box', lineHeight: 1.5,
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
                onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: saving ? 'default' : 'pointer',
                  backgroundColor: '#7a4a28', color: '#fff', fontSize: 13, fontWeight: 600,
                  fontFamily: "'Jost', sans-serif", opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <IconNote size={14} />
                {saving ? t('contact.admin.saving') : t('contact.admin.save')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '10px 14px', borderRadius: 12, cursor: deleting ? 'default' : 'pointer',
                  backgroundColor: confirmDel ? 'rgba(160,50,50,0.12)' : 'transparent',
                  border: `1px solid ${confirmDel ? 'rgba(160,50,50,0.35)' : '#ede5d8'}`,
                  color: confirmDel ? '#a03030' : '#a08878', fontSize: 13, fontWeight: 600,
                  fontFamily: "'Jost', sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <IconTrash size={14} />
                {confirmDel ? t('contact.admin.confirm') : t('contact.admin.delete')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── AdminContactMessages ─────────────────────────────────────────────────────
const AdminContactMessages: React.FC = () => {
  const { t } = useLanguage();

  const [messages, setMessages]       = useState<ContactMessage[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [langFilter, setLangFilter]   = useState('');
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [selected, setSelected]       = useState<ContactMessage | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 20;

  const fetchMessages = useCallback(async (q: string, status: string, lang: string, p: number) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (q)      params.set('search', q);
      if (status) params.set('status', status);
      if (lang)   params.set('lang', lang);
      params.set('page', String(p));
      params.set('page_size', String(PAGE_SIZE));

      const res = await apiFetch(`/api/contact/admin/messages/?${params.toString()}`);
      if (!res.ok) { setError('Failed to load messages.'); return; }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.results ?? []);
      setTotal(data.count ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/contact/admin/stats/');
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchMessages(search, statusFilter, langFilter, page); }, [fetchMessages, statusFilter, langFilter, page]);  // eslint-disable-line

  const handleSearch = (val: string) => {
    setSearch(val); setPage(1);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => fetchMessages(val, statusFilter, langFilter, 1), 380));
  };

  const handleStatusUpdate = async (id: number, status: string, note?: string) => {
    try {
      const res = await apiFetch(`/api/contact/admin/messages/${id}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(note !== undefined ? { admin_note: note } : {}) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: updated.status, admin_note: updated.admin_note } : m));
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: updated.status, admin_note: updated.admin_note } : null);
        fetchStats();
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await apiFetch(`/api/contact/admin/messages/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        setTotal(t => t - 1);
        fetchStats();
      }
    } catch { /* silent */ }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statCards = [
    { label: t('contact.admin.stats.total'),      value: stats?.total ?? 0,       icon: <IconInbox size={18} /> },
    { label: t('contact.admin.stats.new'),         value: stats?.new ?? 0,         icon: <IconMail size={18} /> },
    { label: t('contact.admin.stats.inProgress'),  value: stats?.in_progress ?? 0, icon: <IconClock size={18} /> },
    { label: t('contact.admin.stats.resolved'),    value: stats?.resolved ?? 0,    icon: <IconCheck2 size={18} /> },
  ];

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 12,
    color: '#5a4030', fontSize: 13, padding: '10px 14px', outline: 'none',
    fontFamily: "'Jost', sans-serif", cursor: 'pointer',
  };

  return (
    <div style={{ padding: '28px 28px 36px', fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
          {t('contact.admin.title')}
        </h1>
        <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>
          {total} {t('contact.admin.totalMessages')}
          {stats && <> · {stats.today} {t('contact.admin.today')} · {stats.this_week} {t('contact.admin.thisWeek')}</>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 14, marginBottom: 22 }}>
        {statCards.map(s => (
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
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}
          onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
          onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
        >
          <option value="">{t('contact.admin.filter.allStatus')}</option>
          <option value="new">{t('contact.admin.filter.new')}</option>
          <option value="in_progress">{t('contact.admin.filter.inProgress')}</option>
          <option value="resolved">{t('contact.admin.filter.resolved')}</option>
          <option value="spam">{t('contact.admin.filter.spam')}</option>
        </select>
        <select value={langFilter} onChange={e => { setLangFilter(e.target.value); setPage(1); }} style={selectStyle}
          onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
          onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
        >
          <option value="">{t('contact.admin.filter.allLangs')}</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13, backgroundColor: 'rgba(176,64,64,0.08)', border: '1px solid rgba(176,64,64,0.2)', color: '#b04040' }}>
          {error}
        </div>
      )}

      {/* Table */}
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
                    t('contact.admin.col.sender'),
                    t('contact.admin.col.subject'),
                    t('contact.admin.col.status'),
                    t('contact.admin.col.lang'),
                    t('contact.admin.col.date'),
                    '',
                  ].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '10px 20px', color: '#a08878', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconEmpty />
                        </div>
                        <p style={{ color: '#a08878', margin: 0, fontSize: 13 }}>{t('contact.admin.noFound')}</p>
                      </div>
                    </td>
                  </tr>
                ) : messages.map((msg, i) => {
                  const ss = STATUS_STYLES[msg.status] ?? STATUS_STYLES.new;
                  return (
                    <tr
                      key={msg.id}
                      style={{ borderBottom: i < messages.length - 1 ? '1px solid #f4ede4' : 'none', cursor: 'pointer' }}
                      onClick={() => setSelected(msg)}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#fdf9f4'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#e8d0b0 0%,#c8a070 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #ede5d8' }}>
                            <span style={{ color: '#7a4a28', fontSize: 12, fontWeight: 700 }}>{msg.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p style={{ color: '#2a1a0e', fontWeight: msg.status === 'new' ? 600 : 400, margin: '0 0 1px', fontSize: 13 }}>{msg.name}</p>
                            <p style={{ color: '#a08878', fontSize: 11, margin: 0 }}>{msg.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 20px', maxWidth: 240 }}>
                        <p style={{ color: '#2a1a0e', fontWeight: msg.status === 'new' ? 600 : 400, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</p>
                        <p style={{ color: '#a08878', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message?.slice(0, 60)}{(msg.message?.length ?? 0) > 60 ? '…' : ''}</p>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}`, fontWeight: 600 }}>
                          {ss.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: 'rgba(122,74,40,0.07)', color: '#7a4a28', letterSpacing: '0.08em' }}>
                          {LANG_LABELS[msg.lang] ?? msg.lang}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', color: '#a08878', fontSize: 12 }}>{msg.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ color: '#c8a882', display: 'flex', justifyContent: 'flex-end' }}>
                          <IconChevron dir="right" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {messages.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconEmpty />
                </div>
                <p style={{ color: '#a08878', margin: 0, fontSize: 13 }}>{t('contact.admin.noFound')}</p>
              </div>
            ) : messages.map((msg, i) => {
              const ss = STATUS_STYLES[msg.status] ?? STATUS_STYLES.new;
              return (
                <div
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: i < messages.length - 1 ? '1px solid #f4ede4' : 'none', cursor: 'pointer' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#e8d0b0 0%,#c8a070 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #ede5d8' }}>
                    <span style={{ color: '#7a4a28', fontWeight: 700 }}>{msg.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                      <p style={{ color: '#2a1a0e', fontSize: 13, fontWeight: msg.status === 'new' ? 600 : 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.name}</p>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}`, flexShrink: 0, fontWeight: 600 }}>
                        {ss.label}
                      </span>
                    </div>
                    <p style={{ color: '#5a4030', fontSize: 12, fontWeight: msg.status === 'new' ? 600 : 400, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ color: '#a08878', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {msg.message?.slice(0, 50)}{(msg.message?.length ?? 0) > 50 ? '…' : ''}
                      </p>
                      <span style={{ fontSize: 10, color: '#c8a882', flexShrink: 0, marginLeft: 8 }}>{msg.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f4ede4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#a08878' }}>
                {t('contact.admin.page')} {page} / {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #ede5d8', backgroundColor: '#fff', cursor: page <= 1 ? 'default' : 'pointer', color: page <= 1 ? '#c8a882' : '#5a4030', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                >
                  <IconChevron dir="left" /> {t('contact.admin.prev')}
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #ede5d8', backgroundColor: '#fff', cursor: page >= totalPages ? 'default' : 'pointer', color: page >= totalPages ? '#c8a882' : '#5a4030', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                >
                  {t('contact.admin.next')} <IconChevron dir="right" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          msg={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          t={t}
        />
      )}
    </div>
  );
};

export default AdminContactMessages;