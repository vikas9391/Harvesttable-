// src/pages/admin/AdminLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../components/Navbar';
import { useLanguage, LangCode } from '../../context/Languagecontext';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>
);
const IconProducts = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);
const IconOrders = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
  </svg>
);
const IconCustomers = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);
const IconSettings = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
  </svg>
);
const IconMenu = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);
const IconExternalLink = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2 12h20"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10A15.3 15.3 0 018 12a15.3 15.3 0 014-10z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
  </svg>
);
const IconChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
  </svg>
);

// ─── Language config ───────────────────────────────────────────────────────────
const LANGUAGES: { code: LangCode; native: string; abbr: string }[] = [
  { code: 'en', native: 'English',  abbr: 'EN' },
  { code: 'fr', native: 'Français', abbr: 'FR' },
  { code: 'ar', native: 'العربية',  abbr: 'AR' },
];

const C = {
  bg: '#faf7f2', surface: '#ffffff', border: '#ede5d8',
  accent: '#7a4a28', accentBg: 'rgba(122,74,40,0.09)', accentBorder: 'rgba(122,74,40,0.18)',
  muted: '#a08878', body: '#5a4030', heading: '#2a1a0e',
  hoverBg: '#faf7f2', activeBg: 'rgba(122,74,40,0.09)',
};

// ─── Sidebar Language Switcher ─────────────────────────────────────────────────
const SidebarLangSwitcher: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const active = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10, border: `1px solid ${open ? '#c8a882' : C.border}`,
          backgroundColor: open ? C.accentBg : 'transparent',
          cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: "'Jost', sans-serif",
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.backgroundColor = C.hoverBg; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        <span style={{ color: open ? C.accent : C.muted, display: 'flex' }}><IconGlobe /></span>
        <span style={{ flex: 1, textAlign: 'left', fontSize: 12, color: open ? C.accent : C.body, fontWeight: 500 }}>
          {active.native}
        </span>
        <span style={{ color: C.muted }}><IconChevronDown open={open} /></span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 101,
            backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            boxShadow: '0 8px 32px rgba(42,26,14,0.14)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 12px 6px', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, margin: 0 }}>
                {t('nav.language')}
              </p>
            </div>
            {LANGUAGES.map(langOpt => {
              const isSelected = lang === langOpt.code;
              return (
                <button
                  key={langOpt.code}
                  onClick={() => { setLang(langOpt.code); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    backgroundColor: isSelected ? C.accentBg : 'transparent',
                    fontFamily: "'Jost', sans-serif", transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = C.hoverBg; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 18, borderRadius: 4, flexShrink: 0,
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                    backgroundColor: isSelected ? 'rgba(122,74,40,0.12)' : 'rgba(90,64,48,0.07)',
                    color: isSelected ? C.accent : C.muted,
                  }}>
                    {langOpt.abbr}
                  </span>
                  <span style={{
                    flex: 1, fontSize: 12, fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? C.accent : C.body,
                    fontFamily: langOpt.code === 'ar' ? 'serif' : 'inherit',
                  }}>
                    {langOpt.native}
                  </span>
                  {isSelected && <span style={{ color: C.accent }}><IconCheck /></span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── AdminLayout ───────────────────────────────────────────────────────────────
const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, authLoading, isLoggedIn } = useAuth();
  const { t } = useLanguage();

  if (authLoading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #ede5d8', borderTopColor: '#7a4a28', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setSidebarOpen(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderRadius: 10, marginBottom: 2, fontSize: 13,
          fontFamily: "'Jost', sans-serif", fontWeight: active ? 600 : 400,
          color: active ? '#7a4a28' : C.muted,
          backgroundColor: active ? C.accentBg : 'transparent',
          border: active ? `1px solid ${C.accentBorder}` : '1px solid transparent',
          textDecoration: 'none', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = C.hoverBg; el.style.color = C.body; } }}
        onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = C.muted; } }}
      >
        {icon}
        {label}
      </Link>
    );
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{ width: 248, height: '100%', backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#7a4a28' }}>
              HarvestTable
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c8a882', marginTop: 2 }}>
              {t('admin.panel')}
            </div>
          </div>
          {mobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, borderRadius: 8, display: 'flex' }}
            >
              <IconClose />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 10 }}>
        <NavLink to="/admin"           icon={<IconDashboard />} label={t('admin.dashboard')} />
        <NavLink to="/admin/products"  icon={<IconProducts />}  label={t('admin.products')}  />
        <NavLink to="/admin/orders"    icon={<IconOrders />}    label={t('admin.orders')}    />
        <NavLink to="/admin/customers" icon={<IconCustomers />} label={t('admin.customers')} />
        <NavLink to="/admin/settings"  icon={<IconSettings />}  label={t('nav.settings')}    />
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          backgroundColor: '#faf7f2', borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 6,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg,#d4a870 0%,#7a4a28 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {user?.firstName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.heading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Language switcher */}
        <div style={{ marginBottom: 4 }}>
          <SidebarLangSwitcher />
        </div>

        {/* View store link */}
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderRadius: 10, fontSize: 13, color: C.muted, textDecoration: 'none',
            transition: 'all 0.15s', fontFamily: "'Jost', sans-serif",
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#7a4a28'; el.style.backgroundColor = 'rgba(122,74,40,0.07)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.muted; el.style.backgroundColor = 'transparent'; }}
        >
          <IconExternalLink />
          {t('admin.viewStore')}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#faf7f2', fontFamily: "'Jost', sans-serif" }}>
        {/* Desktop sidebar */}
        <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden"
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(42,26,14,0.35)', zIndex: 40 }}
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden" style={{ position: 'fixed', left: 0, top: 0, height: '100%', zIndex: 50 }}>
              <Sidebar mobile />
            </div>
          </>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top header */}
          <header style={{
            height: 56, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 6, borderRadius: 8 }}
              >
                <IconMenu />
              </button>
              <nav className="hidden sm:flex" style={{ alignItems: 'center', gap: 6, fontSize: 12, color: '#c8a882' }}>
                <Link
                  to="/admin"
                  style={{ color: '#c8a882', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#7a4a28'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#c8a882'}
                >
                  Admin
                </Link>
                {location.pathname !== '/admin' && (
                  <>
                    <span style={{ color: C.border }}>/</span>
                    <span style={{ color: C.body, textTransform: 'capitalize', fontWeight: 500 }}>
                      {location.pathname.split('/').pop()}
                    </span>
                  </>
                )}
              </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                className="hidden sm:block"
                style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                  backgroundColor: C.accentBg, color: '#7a4a28',
                  border: `1px solid ${C.accentBorder}`,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}
              >
                Admin
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg,#d4a870 0%,#7a4a28 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {user?.firstName?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#faf7f2' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;