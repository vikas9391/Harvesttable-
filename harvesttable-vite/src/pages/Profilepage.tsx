// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useLanguage } from '../context/Languagecontext'

const C = {
  bg: '#faf7f2', surface: '#ffffff', surfaceAlt: '#fdf9f4', border: '#ede5d8',
  borderFocus: '#c8a882', heading: '#2a1a0e', body: '#5a4030', muted: '#a08878',
  accent: '#7a4a28', label: '#9a6840', inputBg: '#fdfaf6',
  green: '#3a6028', greenBg: 'rgba(58,96,40,0.07)', price: '#8b3a1a',
}

type Tab = 'overview' | 'orders' | 'wishlist' | 'settings'

// Profile shape matches ProfileSerializer exactly
interface Profile {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  isAdmin: boolean
}

interface Order {
  id: number
  order_number: string
  status: string
  total: string
  created_at: string
  items?: { name: string; quantity: number; price: string }[]
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    delivered:  { bg: 'rgba(58,96,40,0.08)',   color: '#3a6028', border: 'rgba(58,96,40,0.2)' },
    shipped:    { bg: 'rgba(58,90,154,0.08)',  color: '#3a5a9a', border: 'rgba(58,90,154,0.2)' },
    processing: { bg: 'rgba(160,100,40,0.08)', color: '#a06428', border: 'rgba(160,100,40,0.2)' },
    confirmed:  { bg: 'rgba(50,90,160,0.08)',  color: '#3a5a9a', border: 'rgba(50,90,160,0.2)' },
    pending:    { bg: 'rgba(160,100,40,0.08)', color: '#a06428', border: 'rgba(160,100,40,0.2)' },
    cancelled:  { bg: 'rgba(176,64,64,0.08)',  color: '#b04040', border: 'rgba(176,64,64,0.2)' },
  }
  const s = styles[status?.toLowerCase()] ?? styles.pending
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

const IconHome = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IconPackage = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
const IconHeart = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
const IconSettings = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { t, isRTL } = useLanguage()
  const [tab, setTab]               = useState<Tab>('overview')
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [editForm, setEditForm]     = useState<Profile | null>(null)
  const [editMode, setEditMode]     = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saved, setSaved]           = useState(false)
  const [profileError, setProfileError] = useState('')
  const [orders, setOrders]         = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [pwForm, setPwForm]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwError, setPwError]       = useState('')
  const [pwSaved, setPwSaved]       = useState(false)
  const [vis, setVis]               = useState(false)
  const [tabVis, setTabVis]         = useState(false)
  const [notifState, setNotifState] = useState({
    orderUpdates: true, promotions: false, newArrivals: true, wishlistAlerts: false,
  })

  // Load profile on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/users/me/', { credentials: 'include' })
        if (res.status === 401 || res.status === 403) { navigate('/login'); return }
        const data: Profile = await res.json()
        setProfile(data)
        setEditForm(data)
      } catch {
        setProfileError('Failed to load profile.')
      } finally {
        setPageLoading(false)
        setTimeout(() => setVis(true), 60)
      }
    })()
  }, [navigate])

  // Load orders when orders tab is opened
  useEffect(() => {
    if (tab !== 'orders' || orders.length > 0) return
    setOrdersLoading(true)
    apiFetch('/api/orders/my/')
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false))
  }, [tab])

  // Also load orders on mount for overview stats
  useEffect(() => {
    apiFetch('/api/orders/my/')
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setTabVis(false)
    const timer = setTimeout(() => setTabVis(true), 50)
    return () => clearTimeout(timer)
  }, [tab])

  const handleSave = async () => {
    if (!editForm) return
    setSaveLoading(true); setProfileError('')
    try {
      const res = await apiFetch('/api/users/me/', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          address: editForm.address,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setProfileError(data.error || 'Failed to save changes.'); return }
      setProfile(data); setEditForm(data); setEditMode(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { setProfileError('Network error. Please try again.') }
    finally { setSaveLoading(false) }
  }

  const handleChangePassword = async () => {
    setPwError('')
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) { setPwError('All fields are required.'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match.'); return }
    if (pwForm.newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    setPwLoading(true)
    try {
      const res = await apiFetch('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setPwError(data.error || 'Failed to update password.'); return }
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwSaved(true); setTimeout(() => setPwSaved(false), 2500)
    } catch { setPwError('Network error. Please try again.') }
    finally { setPwLoading(false) }
  }

  const handleSignOut = async () => {
    await apiFetch('/api/users/logout/', { method: 'POST' })
    navigate('/login')
  }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: C.muted }}>{t('profile.loading')}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  if (!profile || !editForm) return null

  const initials = `${profile.firstName?.[0] ?? ''}`.toUpperCase()
  const totalSpent = orders.reduce((s, o) => s + parseFloat(o.total || '0'), 0)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('profile.overview'),  icon: <IconHome /> },
    { id: 'orders',   label: t('profile.orders'),    icon: <IconPackage /> },
    { id: 'wishlist', label: t('profile.wishlist'),  icon: <IconHeart /> },
    { id: 'settings', label: t('profile.settings'),  icon: <IconSettings /> },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 16px', borderRadius: 12, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    backgroundColor: C.inputBg, border: `1px solid ${C.border}`, color: C.heading,
    transition: 'border-color 0.2s',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 20,
    boxShadow: '0 2px 16px rgba(122,74,40,0.06)',
  }

  const fade = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.65s ease ${d}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  })

  const tabFade: React.CSSProperties = {
    opacity: tabVis ? 1 : 0,
    transform: tabVis ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
  }

  const notifications = [
    { key: 'orderUpdates',   label: t('profile.orderUpdates'),   desc: t('profile.orderUpdatesDesc') },
    { key: 'promotions',     label: t('profile.promotions'),     desc: t('profile.promotionsDesc') },
    { key: 'newArrivals',    label: t('profile.newArrivals'),    desc: t('profile.newArrivalsDesc') },
    { key: 'wishlistAlerts', label: t('profile.wishlistAlerts'), desc: t('profile.wishlistAlertsDesc') },
  ] as const

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes successIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }} className="min-h-screen pt-16">
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px 48px' }}>

          {/* Breadcrumb */}
          <nav style={{ ...fade(0), display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 32, color: C.muted }}>
            <Link to="/" style={{ color: C.muted, textDecoration: 'none' }}>{t('profile.home')}</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: C.body }}>{t('profile.myAccount')}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[220px_1fr]">

            {/* ── Sidebar ── */}
            <aside>
              {/* Profile card */}
              <div style={{ ...fade(0.05), ...cardStyle, textAlign: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontWeight: 700, fontSize: 20, color: '#fff',
                  background: 'linear-gradient(135deg, #c8a060 0%, #7a4a28 100%)',
                }}>{initials}</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.heading, margin: '0 0 4px' }}>
                  {profile.firstName} {profile.lastName}
                </h2>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>{profile.email}</p>

                {/* Admin badge or member badge */}
                {profile.isAdmin ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(50,90,160,0.09)', color: '#3a5a9a',
                    border: '1px solid rgba(50,90,160,0.2)',
                  }}>
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    Admin
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(122,74,40,0.08)', color: C.accent,
                    border: '1px solid rgba(122,74,40,0.15)',
                  }}>
                    <svg width="10" height="10" fill={C.accent} viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {t('profile.memberSince')}
                  </div>
                )}

                {/* Admin shortcut */}
                {profile.isAdmin && (
                  <Link to="/admin" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    marginTop: 12, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    backgroundColor: 'rgba(50,90,160,0.07)', border: '1px solid rgba(50,90,160,0.18)',
                    color: '#3a5a9a', textDecoration: 'none', transition: 'background 0.2s',
                  }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Admin Panel
                  </Link>
                )}
              </div>

              {/* Nav tabs */}
              <div style={{ ...fade(0.1), borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, backgroundColor: C.surface }}>
                {tabs.map((tabItem, idx) => (
                  <button key={tabItem.id} onClick={() => setTab(tabItem.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    fontSize: 13, fontWeight: tab === tabItem.id ? 600 : 400,
                    textAlign: isRTL ? 'right' : 'left',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    backgroundColor: tab === tabItem.id ? 'rgba(122,74,40,0.07)' : 'transparent',
                    color: tab === tabItem.id ? C.accent : C.muted,
                    borderBottom: idx < tabs.length - 1 ? `1px solid ${C.border}` : 'none',
                    borderLeft: !isRTL ? `3px solid ${tab === tabItem.id ? C.accent : 'transparent'}` : 'none',
                    borderRight: isRTL ? `3px solid ${tab === tabItem.id ? C.accent : 'transparent'}` : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ opacity: tab === tabItem.id ? 1 : 0.6 }}>{tabItem.icon}</span>
                    <span>{tabItem.label}</span>
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <button onClick={handleSignOut} style={{
                ...fade(0.15),
                width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 12,
                fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}`, color: '#b04040',
                background: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(176,64,64,0.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                {t('profile.signOut')}
              </button>
            </aside>

            {/* ── Main content ── */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <div style={{ ...tabFade, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {saved && (
                    <div style={{ ...cardStyle, backgroundColor: C.greenBg, border: '1px solid rgba(58,96,40,0.2)', color: C.green, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, animation: 'successIn 0.3s ease' }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      {t('profile.profileUpdated')}
                    </div>
                  )}
                  {profileError && (
                    <div style={{ ...cardStyle, backgroundColor: 'rgba(176,64,64,0.08)', border: '1px solid rgba(176,64,64,0.2)', color: '#b04040', fontSize: 13 }}>{profileError}</div>
                  )}

                  {/* Stats — real data from API */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { val: orders.length, label: t('profile.stat.orders') },
                      { val: 0,             label: t('profile.stat.wishlist') },
                      { val: `$${totalSpent.toFixed(0)}`, label: t('profile.stat.spent') },
                    ].map((s, i) => (
                      <div key={s.label} style={{
                        ...cardStyle, textAlign: 'center',
                        opacity: tabVis ? 1 : 0,
                        transform: tabVis ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                        transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s`,
                      }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: '0 0 4px' }}>{s.val}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Personal info — real data from ProfileSerializer */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: 0 }}>
                        {t('profile.personalInfo')}
                      </h3>
                      <button onClick={() => { setEditMode(v => !v); setProfileError('') }} style={{
                        fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'inherit', border: `1px solid ${editMode ? 'rgba(122,74,40,0.22)' : C.border}`,
                        backgroundColor: editMode ? 'rgba(122,74,40,0.09)' : 'transparent', color: C.accent, transition: 'all 0.2s',
                      }}>
                        {editMode ? t('profile.cancel') : t('profile.edit')}
                      </button>
                    </div>

                    {editMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {([['firstName', 'checkout.firstName'], ['lastName', 'checkout.lastName']] as const).map(([k, labelKey]) => (
                            <div key={k}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>
                                {t(labelKey)}
                              </label>
                              <input
                                value={(editForm as any)[k]}
                                onChange={e => setEditForm(f => f ? { ...f, [k]: e.target.value } : f)}
                                style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                                onBlur={e => e.currentTarget.style.borderColor = C.border}
                              />
                            </div>
                          ))}
                        </div>
                        {([['phone', 'checkout.phone'], ['address', 'checkout.address']] as const).map(([k, labelKey]) => (
                          <div key={k}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>
                              {t(labelKey)}
                            </label>
                            <input
                              value={(editForm as any)[k] ?? ''}
                              onChange={e => setEditForm(f => f ? { ...f, [k]: e.target.value } : f)}
                              style={inputStyle}
                              onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                              onBlur={e => e.currentTarget.style.borderColor = C.border}
                            />
                          </div>
                        ))}
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>
                            {t('profile.email')}
                          </label>
                          <input value={editForm.email} disabled style={{ ...inputStyle, backgroundColor: C.surfaceAlt, color: C.muted, cursor: 'not-allowed' }} />
                          <p style={{ fontSize: 10, marginTop: 4, color: C.muted }}>{t('profile.emailNote')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                          <button onClick={handleSave} disabled={saveLoading} style={{
                            padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#fff',
                            backgroundColor: C.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 14px rgba(122,74,40,0.26)',
                            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', opacity: saveLoading ? 0.7 : 1,
                          }}
                            onMouseEnter={e => { if (!saveLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                            {saveLoading
                              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{t('profile.saving')}</>
                              : t('profile.save')
                            }
                          </button>
                          <button onClick={() => { setEditMode(false); setEditForm(profile); setProfileError('') }} style={{
                            padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                            border: `1px solid ${C.border}`, color: C.body, background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            {t('profile.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {[
                          [t('profile.fullName'), `${profile.firstName} ${profile.lastName}`],
                          [t('profile.email'),    profile.email],
                          [t('profile.phone'),    profile.phone || '—'],
                          [t('profile.address'),  profile.address || '—'],
                        ].map(([label, value]) => (
                          <div key={label} style={{ padding: 14, borderRadius: 12, backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 6 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 500, color: C.body, margin: 0 }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent orders — real data */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: 0 }}>
                        {t('profile.recentOrders')}
                      </h3>
                      <button onClick={() => setTab('orders')} style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                        {t('profile.viewAll')} →
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '24px 0' }}>
                        {t('profile.noOrders')}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {orders.slice(0, 2).map(order => (
                          <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: C.heading, margin: '0 0 2px' }}>
  #{String(order.order_number).slice(0, 8).toUpperCase()}
</p>
                              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{order.created_at?.slice(0, 10)}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: C.price, margin: '0 0 4px', fontFamily: "'Cormorant Garamond', serif" }}>${order.total}</p>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ORDERS TAB — real data */}
              {tab === 'orders' && (
                <div style={{ ...tabFade, ...cardStyle }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.heading, marginBottom: 20 }}>
                    {t('profile.orderHistory')}
                  </h3>
                  {ordersLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                      <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <svg width="24" height="24" fill="none" stroke={C.muted} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                      <p style={{ color: C.muted, fontSize: 13 }}>{t('profile.noOrders')}
</p>
                      <Link to="/products" style={{ display: 'inline-block', marginTop: 14, padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, backgroundColor: C.accent, color: '#fff', textDecoration: 'none' }}>
                        Shop Now
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {orders.map((order, i) => (
                        <div key={order.id} style={{
                          border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden',
                          opacity: tabVis ? 1 : 0,
                          transform: tabVis ? 'translateY(0)' : 'translateY(24px)',
                          transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: C.heading, margin: '0 0 2px' }}>
  #{String(order.order_number).slice(0, 8).toUpperCase()}
</p>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{order.created_at?.slice(0, 10)}</p>
                              </div>
                              <StatusBadge status={order.status} />
                            </div>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.price, margin: 0 }}>${order.total}</p>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div style={{ padding: '12px 16px' }}>
                              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.label, marginBottom: 8 }}>
                                {t('profile.items')}
                              </p>
                              <p style={{ fontSize: 13, color: C.body, margin: '0 0 12px' }}>
                                {order.items.map(item => `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`).join(' · ')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WISHLIST TAB — placeholder until backend supports it */}
              {tab === 'wishlist' && (
                <div style={{ ...tabFade, ...cardStyle }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.heading, marginBottom: 20 }}>
                    {t('profile.savedItems')}
                  </h3>
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <svg width="24" height="24" fill="none" stroke={C.muted} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    </div>
                    <p style={{ color: C.muted, fontSize: 13 }}>{t('profile.wishlistEmpty')}</p>
                    <Link to="/shop" style={{ display: 'inline-block', marginTop: 14, padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, backgroundColor: C.accent, color: '#fff', textDecoration: 'none' }}>
                      {t('profile.browseProducts')}
                    </Link>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {tab === 'settings' && (
                <div style={{ ...tabFade, display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Notifications */}
                  <div style={cardStyle}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, marginBottom: 20 }}>
                      {t('profile.notifications')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {notifications.map((n, i, arr) => (
                        <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.heading, margin: '0 0 2px' }}>{n.label}</p>
                            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{n.desc}</p>
                          </div>
                          <div
                            onClick={() => setNotifState(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                            style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, backgroundColor: notifState[n.key] ? C.accent : C.border, flexShrink: 0, cursor: 'pointer', transition: 'background-color 0.3s' }}>
                            <div style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', left: notifState[n.key] ? 'calc(100% - 19px)' : '3px', transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Change password — real endpoint */}
                  <div style={cardStyle}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, marginBottom: 20 }}>
                      {t('profile.changePassword')}
                    </h3>
                    {pwSaved && (
                      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.greenBg, border: '1px solid rgba(58,96,40,0.2)', color: C.green, animation: 'successIn 0.3s ease' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        {t('profile.passwordUpdated')}
                      </div>
                    )}
                    {pwError && (
                      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13, backgroundColor: 'rgba(176,64,64,0.08)', border: '1px solid rgba(176,64,64,0.2)', color: '#b04040' }}>{pwError}</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {([
                        ['currentPassword', t('profile.currentPw')],
                        ['newPassword',     t('profile.newPw')],
                        ['confirmPassword', t('profile.confirmPw')],
                      ] as const).map(([k, l]) => (
                        <div key={k}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>{l}</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={(pwForm as any)[k]}
                            onChange={e => { setPwForm(f => ({ ...f, [k]: e.target.value })); if (pwError) setPwError('') }}
                            style={inputStyle}
                            onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                            onBlur={e => e.currentTarget.style.borderColor = C.border}
                          />
                        </div>
                      ))}
                      <button onClick={handleChangePassword} disabled={pwLoading} style={{
                        padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#fff',
                        backgroundColor: C.accent, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 14px rgba(122,74,40,0.26)', alignSelf: 'flex-start',
                        transition: 'transform 0.3s', opacity: pwLoading ? 0.7 : 1,
                      }}
                        onMouseEnter={e => { if (!pwLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                        {pwLoading
                          ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{t('profile.updatingPw')}</>
                          : t('profile.updatePw')
                        }
                      </button>
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div style={{ ...cardStyle, border: '1px solid rgba(176,64,64,0.18)' }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: '#b04040', marginBottom: 6 }}>
                      {t('profile.danger')}
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{t('profile.dangerDesc')}</p>
                    <button style={{ fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(176,64,64,0.3)', color: '#b04040', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {t('profile.deleteAccount')}
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePage