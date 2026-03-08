// src/components/Navbar.tsx
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import CartDrawer from './CartDrawer'
import { apiFetch } from '../lib/api'
import { useLanguage, LangCode } from '../context/Languagecontext'

const C = {
  bg:          '#faf7f2', surface:     '#ffffff', border:      '#ede5d8',
  borderFocus: '#c8a882', heading:     '#2a1a0e', body:        '#5a4030',
  muted:       '#a08878', accent:      '#7a4a28', accentHov:   '#8f5830',
  label:       '#9a6840', inputBg:     '#fdfaf6', green:       '#3a6028',
  red:         '#b04040', linkDefault: '#6a5040', linkActive:  '#7a4a28',
  linkActiveBg:'rgba(122,74,40,0.08)', linkHoverBg: 'rgba(122,74,40,0.05)',
  badgeBg:     '#8b3a1a', logoBg:      '#7a4a28', logoSub:     '#c0a888',
  bgScroll:    '#fdf9f4', navBorder:   '#ede5d8',
}

interface User { id: number; firstName: string; lastName: string; email: string; isAdmin: boolean }
interface AuthCtxType {
  isLoggedIn: boolean; user: User | null; authLoading: boolean
  login:  (email: string, password: string) => Promise<User>
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthCtxType>({
  isLoggedIn: false, user: null, authLoading: true,
  login: async () => ({ id: 0, firstName: '', lastName: '', email: '', isAdmin: false }),
  signup: async () => {}, logout: async () => {},
})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]               = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/me/', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data) })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const res  = await apiFetch('/api/users/login/', { method: 'POST', body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed.')
    setUser(data); return data
  }

  const signup = async (firstName: string, lastName: string, email: string, password: string) => {
    const res  = await apiFetch('/api/users/register/', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed.')
    setUser(data)
  }

  const logout = async () => {
    await apiFetch('/api/users/logout/', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, authLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useRequireAuth() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const guard = useCallback((action: () => void) => {
    if (isLoggedIn) { action(); return }
    navigate('/login')
  }, [isLoggedIn, navigate])
  const AuthModal = useCallback(() => null, [])
  return { guard, AuthModal }
}

// ─── SVG Icon Components ───────────────────────────────────────────────────────
const IconUser = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
  </svg>
)

const IconPackage = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
)

const IconHeart = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
  </svg>
)

const IconSettings = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)

const IconDashboard = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>
)

const IconLogOut = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
)

const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
  </svg>
)

const IconChevronDown = ({ size = 12, className = '' }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
  </svg>
)

const IconGlobe = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2 12h20"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
      d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10A15.3 15.3 0 018 12a15.3 15.3 0 014-10z"/>
  </svg>
)

// ─── Language Dropdown ─────────────────────────────────────────────────────────
const LANGUAGES: { code: LangCode; label: string; native: string; abbr: string }[] = [
  { code: 'en', label: 'English',  native: 'English',  abbr: 'EN' },
  { code: 'fr', label: 'Français', native: 'Français', abbr: 'FR' },
  { code: 'ar', label: 'Arabic',   native: 'العربية',  abbr: 'AR' },
]

const LangMenu: React.FC = () => {
  const { lang, setLang, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const active = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  return (
    // Always LTR — language picker UI should never flip
    <div className="relative hidden sm:block" dir="ltr">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center gap-1.5 rounded-lg transition-colors"
        style={{
          padding: '7px 10px',
          color: open ? C.accent : C.linkDefault,
          backgroundColor: open ? C.linkActiveBg : 'transparent',
          border: `1px solid ${open ? C.borderFocus : 'transparent'}`,
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.backgroundColor = C.linkHoverBg } }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.border = '1px solid transparent' } }}
        title={t('nav.language')}
      >
        <IconGlobe size={17} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>
          {active.abbr}
        </span>
        <IconChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-[calc(100%+10px)] z-[81] rounded-2xl overflow-hidden"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              minWidth: 176,
              boxShadow: '0 16px 48px rgba(42,26,14,0.14), 0 4px 12px rgba(42,26,14,0.08)',
              animation: 'dropdownIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, margin: 0 }}>
                {t('nav.language')}
              </p>
            </div>
            <div style={{ padding: '6px 0' }}>
              {LANGUAGES.map((langOpt, i) => {
                const isSelected = active.code === langOpt.code
                return (
                  <button
                    key={langOpt.code}
                    onClick={() => { setLang(langOpt.code); setOpen(false) }}
                    className="w-full flex items-center gap-3 text-left transition-colors"
                    style={{
                      padding: '9px 16px',
                      color: isSelected ? C.accent : C.body,
                      backgroundColor: isSelected ? C.linkActiveBg : 'transparent',
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: 13,
                      animation: `dropdownItemIn 0.25s cubic-bezier(0.22,1,0.36,1) ${0.04 + i * 0.04}s both`,
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = C.linkHoverBg }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 20, borderRadius: 4, flexShrink: 0,
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                      backgroundColor: isSelected ? 'rgba(122,74,40,0.12)' : 'rgba(90,64,48,0.07)',
                      color: isSelected ? C.accent : C.muted,
                    }}>
                      {langOpt.abbr}
                    </span>
                    <span style={{ fontFamily: langOpt.code === 'ar' ? 'serif' : 'inherit', flex: 1 }}>
                      {langOpt.native}
                    </span>
                    {isSelected && (
                      <span style={{ color: C.accent, marginLeft: 'auto', flexShrink: 0 }}>
                        <IconCheck size={13} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!user) return null

  const initial = user?.firstName?.charAt(0)?.toUpperCase() || 'U'

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }

  const menuItems: { icon: React.ReactNode; label: string; path: string }[] = [
    { icon: <IconUser size={15} />,      label: t('nav.myProfile'), path: '/profile' },
    { icon: <IconPackage size={15} />,   label: t('nav.myOrders'),  path: '/profile' },
    { icon: <IconHeart size={15} />,     label: t('nav.wishlist'),  path: '/profile' },
    { icon: <IconSettings size={15} />,  label: t('nav.settings'),  path: '/profile' },
    ...(user.isAdmin
      ? [{ icon: <IconDashboard size={15} />, label: t('nav.adminDash'), path: '/admin' }]
      : []),
  ]

  return (
    // Always LTR — profile chip and dropdown must never flip direction
    <div className="relative" dir="ltr">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all"
        style={{
          backgroundColor: open ? 'rgba(122,74,40,0.07)' : 'transparent',
          border: `1.5px solid ${open ? C.borderFocus : C.border}`,
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.borderColor = C.borderFocus }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.borderColor = C.border }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #d4a060 0%, #7a4a28 100%)' }}
        >
          {initial}
        </div>
        <span className="hidden sm:block text-xs font-semibold max-w-[80px] truncate" style={{ color: C.heading }}>
          {user.firstName}
        </span>
        <IconChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-[calc(100%+10px)] z-[81] rounded-2xl overflow-hidden"
            style={{
              backgroundColor: C.surface, border: `1px solid ${C.border}`, minWidth: 224,
              boxShadow: '0 16px 48px rgba(42,26,14,0.14), 0 4px 12px rgba(42,26,14,0.08)',
              animation: 'dropdownIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* User header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${C.border}`,
                background: 'linear-gradient(135deg, #fdf8f2 0%, #f9f0e4 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #d4a060 0%, #7a4a28 100%)', boxShadow: '0 2px 8px rgba(122,74,40,0.28)' }}
                >
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: C.heading, margin: '0 0 2px' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: C.muted, margin: 0 }}>{user.email}</p>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 10px', borderRadius: 99, fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  backgroundColor: 'rgba(122,74,40,0.08)', color: C.accent,
                  border: '1px solid rgba(122,74,40,0.14)',
                }}>
                  <svg width="8" height="8" viewBox="0 0 10 10" fill={C.accent}>
                    <polygon points="5,0 10,5 5,10 0,5" />
                  </svg>
                  {t('nav.member')}
                </span>
                {user.isAdmin && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 99, fontSize: 9,
                    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    backgroundColor: 'rgba(58,96,40,0.10)', color: '#3a6028',
                    border: '1px solid rgba(58,96,40,0.22)',
                  }}>
                    <IconDashboard size={9} />
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Menu items — use LTR layout but allow text to read naturally */}
            <div style={{ padding: '6px 0' }}>
              {menuItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setOpen(false) }}
                  className="w-full flex items-center gap-3 text-left transition-colors"
                  style={{
                    padding: '9px 16px', fontSize: 13, color: C.body,
                    backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                    animation: `dropdownItemIn 0.25s cubic-bezier(0.22,1,0.36,1) ${0.04 + i * 0.04}s both`,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.linkHoverBg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: C.label, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Sign out */}
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px 0' }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 text-left transition-colors"
                style={{
                  padding: '9px 16px', fontSize: 13, color: C.red,
                  backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(176,64,64,0.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}><IconLogOut size={15} /></span>
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const { totalItems }  = useCart()
  const { isLoggedIn }  = useAuth()
  const { t, isRTL }    = useLanguage()
  const navigate        = useNavigate()
  const location        = useLocation()
  const [cartOpen, setCartOpen]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => { const t2 = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t2) }, [])
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  if (location.pathname.startsWith('/admin')) return null

  const handleCartClick = () => {
    if (!isLoggedIn) { navigate('/login'); return }
    setCartOpen(v => !v)
  }

  const links = [
    { label: t('nav.home'),        to: '/' },
    { label: t('nav.shop'),        to: '/products' },
    { label: t('nav.giftBuilder'), to: '/gift-builder' },
    { label: t('nav.ourStory'),    to: '/about' },
  ]
  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <>
      <style>{`
        @keyframes navLogoIn   { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
        @keyframes navLinkIn   { from { opacity:0; transform:translateY(-8px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes navActionIn { from { opacity:0; transform:translateY(-8px) scale(0.92); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes dropdownIn  { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes dropdownItemIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        @keyframes cartBadgePop   { 0% { transform:scale(0); } 60% { transform:scale(1.25); } 100% { transform:scale(1); } }
      `}</style>

      {/* dir="ltr" on nav overrides <html dir="rtl"> — keeps logo-left, actions-right always */}
      <nav
        dir="ltr"
        className="fixed top-0 left-0 right-0 z-[90] transition-all duration-300"
        style={{
          backgroundColor: scrolled ? C.bgScroll : C.surface,
          borderBottom: `1px solid ${scrolled ? C.navBorder : '#f5ede0'}`,
          boxShadow: scrolled ? '0 1px 20px rgba(122,74,40,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo — always on the left, wordmark never reverses */}
            <Link
              to="/"
              className="flex items-baseline gap-2.5 flex-shrink-0"
              style={{ animation: mounted ? 'navLogoIn 0.6s cubic-bezier(0.22,1,0.36,1) both' : 'none', textDecoration: 'none' }}
            >
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.45rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.01em', color: C.logoBg }}>
                HarvestTable
              </span>
              <span className="text-[9px] font-semibold tracking-[0.2em] uppercase hidden sm:block" style={{ color: C.logoSub }}>
                {t('nav.brandSub')}
              </span>
            </Link>

            {/* Desktop nav links — reversed order in RTL so they read right-to-left */}
            <div className="hidden md:flex items-center gap-0.5" dir={isRTL ? 'rtl' : 'ltr'}>
              {(isRTL ? [...links].reverse() : links).map((l, i) => (
                <Link
                  key={l.to} to={l.to}
                  className="px-4 py-2 rounded-lg text-sm tracking-wide transition-all"
                  style={{
                    color: isActive(l.to) ? C.linkActive : C.linkDefault,
                    backgroundColor: isActive(l.to) ? C.linkActiveBg : 'transparent',
                    fontWeight: isActive(l.to) ? '600' : '500',
                    textDecoration: 'none',
                    animation: mounted ? `navLinkIn 0.5s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.05}s both` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive(l.to)) (e.currentTarget as HTMLElement).style.backgroundColor = C.linkHoverBg }}
                  onMouseLeave={e => { if (!isActive(l.to)) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/*
              Right actions: always dir="ltr" so cart badge, profile chip,
              sign-in/get-started buttons, and the hamburger never mirror.
            */}
            <div
              dir="ltr"
              className="flex items-center gap-1"
              style={{ animation: mounted ? 'navActionIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both' : 'none' }}
            >
              <LangMenu />

              {/* Cart */}
              <button
                onClick={handleCartClick}
                className="relative p-2.5 rounded-lg transition-colors"
                style={{ color: cartOpen ? C.accent : C.linkDefault, backgroundColor: cartOpen ? C.linkActiveBg : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (!cartOpen) (e.currentTarget as HTMLElement).style.backgroundColor = C.linkHoverBg }}
                onMouseLeave={e => { if (!cartOpen) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                {totalItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5"
                    style={{ backgroundColor: C.badgeBg, animation: 'cartBadgePop 0.35s cubic-bezier(0.22,1,0.36,1)' }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              {/* Auth */}
              <div className="flex items-center gap-2 ml-1">
                {isLoggedIn ? (
                  <UserMenu />
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 items-center gap-1.5"
                      style={{ color: C.accent, border: `1.5px solid ${C.border}`, backgroundColor: 'transparent', textDecoration: 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderFocus; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(122,74,40,0.04)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                    >
                      <IconUser size={14} />
                      {t('nav.signIn')}
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                      style={{ backgroundColor: C.accent, boxShadow: '0 2px 12px rgba(122,74,40,0.28)', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accentHov}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = C.accent}
                    >
                      {t('nav.getStarted')}
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden p-2.5 rounded-lg ml-1"
                style={{ color: C.linkDefault, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="w-5 flex flex-col gap-[5px]">
                  {[
                    mobileOpen ? 'rotate-45 translate-y-[7px]' : '',
                    mobileOpen ? 'opacity-0 scale-x-0' : '',
                    mobileOpen ? '-rotate-45 -translate-y-[7px]' : '',
                  ].map((cls, i) => (
                    <span
                      key={i}
                      className={`h-0.5 rounded-full transition-all duration-250 origin-center ${cls}`}
                      style={{ backgroundColor: C.linkDefault }}
                    />
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-96' : 'max-h-0'}`}
          style={{ borderTop: mobileOpen ? `1px solid ${C.navBorder}` : 'none', backgroundColor: C.bgScroll }}
        >
          <div className="px-4 py-3 space-y-0.5">
            {/* Nav links respect RTL order */}
            <div dir={isRTL ? 'rtl' : 'ltr'}>
            {(isRTL ? [...links].reverse() : links).map((l, i) => (
              <Link
                key={l.to} to={l.to}
                className="flex items-center px-4 py-3 rounded-xl text-sm transition-colors"
                style={{
                  color: isActive(l.to) ? C.linkActive : C.linkDefault,
                  backgroundColor: isActive(l.to) ? C.linkActiveBg : 'transparent',
                  fontWeight: isActive(l.to) ? '600' : '500',
                  textDecoration: 'none',
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `opacity 0.3s ease ${i * 0.05}s, transform 0.3s ease ${i * 0.05}s`,
                }}
              >
                {l.label}
              </Link>
            ))}

            </div>
            {/* Mobile language switcher — always LTR layout */}
            <div
              dir="ltr"
              style={{
                borderTop: `1px solid ${C.navBorder}`, paddingTop: 8, marginTop: 4,
                opacity: mobileOpen ? 1 : 0,
                transition: 'opacity 0.3s ease 0.18s',
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, margin: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconGlobe size={12} />
                {t('nav.language')}
              </p>
              <MobileLangSwitcher />
            </div>

            {/* Mobile auth — always LTR layout */}
            <div
              dir="ltr"
              style={{
                borderTop: `1px solid ${C.navBorder}`, paddingTop: 8, marginTop: 4,
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-12px)',
                transition: 'opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s',
              }}
            >
              {isLoggedIn ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ color: C.linkActive, backgroundColor: C.linkActiveBg, textDecoration: 'none' }}
                >
                  <IconUser size={14} />
                  {t('nav.myProfile')}
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ border: `1.5px solid ${C.border}`, color: C.accent, textDecoration: 'none' }}
                  >
                    <IconUser size={14} />
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: C.accent, textDecoration: 'none' }}
                  >
                    {t('nav.getStarted')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

// Small inline component to use the hook properly in mobile menu
const MobileLangSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage()
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 8px' }}>
      {LANGUAGES.map(langOpt => {
        const isSelected = lang === langOpt.code
        return (
          <button
            key={langOpt.code}
            onClick={() => setLang(langOpt.code)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 11,
              fontWeight: isSelected ? 700 : 500, letterSpacing: '0.06em',
              color: isSelected ? C.accent : C.muted,
              backgroundColor: isSelected ? C.linkActiveBg : 'transparent',
              border: `1px solid ${isSelected ? C.borderFocus : C.border}`,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {langOpt.abbr}
            </span>
            <span style={{ fontFamily: langOpt.code === 'ar' ? 'serif' : 'inherit', fontSize: 10 }}>
              {langOpt.native}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default Navbar