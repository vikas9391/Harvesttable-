// src/pages/SignupPage.tsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/Navbar'
import { useLanguage } from '../context/Languagecontext'

const C = {
  bg: '#faf7f2', surface: '#ffffff', border: '#ede5d8', borderFocus: '#c8a882',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878', accent: '#7a4a28',
  accentLight: 'rgba(122,74,40,0.07)', label: '#9a6840', inputBg: '#fdfaf6',
  errorBg: 'rgba(176,64,64,0.07)', errorBorder: 'rgba(176,64,64,0.2)', errorText: '#b04040',
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      : <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </>
    }
  </svg>
)

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { t } = useLanguage()
  const strength = (() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const labels = ['', t('signup.pw.weak'), t('signup.pw.fair'), t('signup.pw.good'), t('signup.pw.strong')]
  const colors = ['', '#b04040', '#c87840', '#9a8030', '#3a6028']
  if (!password) return null
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= strength ? colors[strength] : C.border, transition: 'background-color 0.3s' }}/>
        ))}
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: colors[strength], margin: 0 }}>{labels[strength]}</p>
    </div>
  )
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { t, isRTL } = useLanguage()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVis(true), 60)
    return () => clearTimeout(timer)
  }, [])

  const setField = (k: string, v: string) => { setForm(prev => ({ ...prev, [k]: v })); if (error) setError('') }

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password) { setError(t('signup.errorRequired') || 'Please fill in all required fields.'); return }
    if (form.password !== form.confirm) { setError(t('signup.mismatch')); return }
    if (form.password.length < 8) { setError(t('signup.errorLength') || 'Password must be at least 8 characters.'); return }
    if (!agreed) { setError(t('signup.errorTerms') || 'Please accept the Terms of Service to continue.'); return }
    setLoading(true)
    try {
      await signup(form.firstName, form.lastName, form.email, form.password)
      navigate('/profile')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const fade = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.7s ease ${d}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  })

  const passwordMismatch = form.confirm.length > 0 && form.confirm !== form.password

  const stats = [
    { value: '12,000+', label: t('signup.stat1') },
    { value: '100%',    label: t('signup.stat2') },
    { value: '80+',     label: t('signup.stat3') },
    { value: '4.9',     label: t('signup.stat4') },
  ]

  const statIcons = [
    <svg key="users" width="14" height="14" fill="none" stroke="#d4a060" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    <svg key="leaf" width="14" height="14" fill="none" stroke="#d4a060" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    <svg key="box" width="14" height="14" fill="none" stroke="#d4a060" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
    <svg key="star" width="14" height="14" fill="none" stroke="#d4a060" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes panelSlide { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes statIn { from{opacity:0;transform:translateY(16px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes errorIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div className="min-h-screen flex" style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>

        {/* Left panel */}
        <div
          className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-14 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #2a1a0e 0%, #3d2412 55%, #5a3418 100%)', animation: 'panelSlide 0.9s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04 }}>
            <defs>
              <pattern id="grain2" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.8" fill="#fff"/><circle cx="60" cy="10" r="0.5" fill="#fff"/>
                <circle cx="10" cy="60" r="0.6" fill="#fff"/><circle cx="70" cy="50" r="0.9" fill="#fff"/>
                <circle cx="40" cy="70" r="0.4" fill="#fff"/><circle cx="50" cy="35" r="0.7" fill="#fff"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grain2)"/>
          </svg>
          <svg className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none" style={{ opacity: 0.06 }}>
            <circle cx="128" cy="128" r="120" fill="none" stroke="#d4a060" strokeWidth="1.5"/>
            <circle cx="128" cy="128" r="90"  fill="none" stroke="#d4a060" strokeWidth="0.8"/>
            <circle cx="128" cy="128" r="60"  fill="none" stroke="#d4a060" strokeWidth="0.4"/>
          </svg>

          <div className="pt-10 relative z-10">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 2, marginBottom: 32, backgroundColor: 'rgba(212,160,96,0.12)', border: '1px solid rgba(212,160,96,0.2)', color: '#d4a060', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, animation: 'panelSlide 0.7s ease 0.4s both' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
              </svg>
              {t('signup.free')}
            </div>

            <div style={{ overflow: 'hidden', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, lineHeight: 1.2, color: '#f5e8d0', letterSpacing: '-0.02em', margin: 0, animation: 'panelSlide 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both' }}>
                {t('signup.left.title')}
              </h2>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(200,168,120,0.75)', maxWidth: 280, marginBottom: 36, animation: 'panelSlide 0.7s ease 0.5s both' }}>
              {t('signup.left.desc')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {stats.map((s, i) => (
                <div key={s.label} style={{ borderRadius: 12, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,160,96,0.10)', animation: `statIn 0.6s ease ${0.6 + i * 0.1}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {statIcons[i]}
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#d4a060', margin: 0 }}>{s.value}</p>
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(200,168,120,0.6)', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: 16, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,160,96,0.14)', animation: 'panelSlide 0.7s ease 1.1s both' }}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="rgba(212,160,96,0.3)" style={{ marginBottom: 10 }}>
              <path d="M0 14V8.4C0 3.76 2.56 1.08 7.68 0l.96 1.56C5.92 2.36 4.4 4.04 4.16 6.64H8V14H0zm12 0V8.4C12 3.76 14.56 1.08 19.68 0l.96 1.56c-2.72.8-4.24 2.48-4.48 5.08H20V14h-8z"/>
            </svg>
            <p style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 12, color: 'rgba(212,160,96,0.8)' }}>
              {t('signup.quote')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #d4a060, #7a4a28)' }}>
                {t('signup.quoteName').charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e8c898', margin: 0 }}>{t('signup.quoteName')}</p>
                <p style={{ fontSize: 10, color: 'rgba(200,168,120,0.5)', margin: 0 }}>{t('signup.quoteSince')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 pt-28 lg:pt-24 overflow-y-auto">
          <div className="w-full max-w-[420px]">

            <div style={{ ...fade(0), textAlign: 'center', marginBottom: 40 }} className="lg:hidden">
              <Link to="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>HarvestTable</Link>
            </div>

            <div style={{ ...fade(0.05), marginBottom: 24 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 8 }}>{t('signup.free')}</p>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.heading, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{t('signup.title')}</h1>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                {t('signup.alreadyMember')}{' '}
                <Link to="/login" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}>
                  {t('signup.signIn')} →
                </Link>
              </p>
            </div>

            <div style={{ ...fade(0.1), height: 1, backgroundColor: C.border, marginBottom: 24 }}/>

            {error && (
              <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.errorText, animation: 'errorIn 0.3s ease' }}>
                <svg style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name row */}
              <div style={fade(0.15)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {([['firstName', t('signup.firstName')], ['lastName', t('signup.lastName')]] as const).map(([k, l]) => (
                    <div key={k}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.label, marginBottom: 8 }}>{l}</label>
                      <input
                        type="text"
                        value={(form as any)[k]}
                        onChange={e => setField(k, e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: C.inputBg, border: `1.5px solid ${C.border}`, color: C.heading, transition: 'border-color 0.2s' }}
                        onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                        onBlur={e => e.currentTarget.style.borderColor = C.border}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div style={fade(0.2)}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.label, marginBottom: 8 }}>{t('signup.email')}</label>
                <input
                  type="email"
                  placeholder={t('common.emailPlaceholder')}
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: C.inputBg, border: `1.5px solid ${C.border}`, color: C.heading, transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              {/* Password */}
              <div style={fade(0.25)}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.label, marginBottom: 8 }}>{t('signup.password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder={t('signup.passwordHint')}
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    style={{ width: '100%', padding: isRTL ? '12px 16px 12px 44px' : '12px 44px 12px 16px', borderRadius: 12, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: C.inputBg, border: `1.5px solid ${C.border}`, color: C.heading, transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', [isRTL ? 'left' : 'right']: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}
                  >
                    <EyeIcon open={showPw}/>
                  </button>
                </div>
                <StrengthBar password={form.password}/>
              </div>

              {/* Confirm password */}
              <div style={fade(0.3)}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.label, marginBottom: 8 }}>{t('signup.confirm')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => setField('confirm', e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: C.inputBg, border: `1.5px solid ${passwordMismatch ? '#b04040' : C.border}`, color: C.heading, transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = passwordMismatch ? '#b04040' : C.borderFocus}
                  onBlur={e => e.currentTarget.style.borderColor = passwordMismatch ? '#b04040' : C.border}
                />
                {passwordMismatch && <p style={{ fontSize: 10, marginTop: 6, fontWeight: 600, color: '#b04040' }}>{t('signup.mismatch')}</p>}
              </div>

              {/* Terms */}
              <label style={{ ...fade(0.35), display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none', paddingTop: 4 }} onClick={() => setAgreed(v => !v)}>
                <div style={{ width: 16, height: 16, marginTop: 2, borderRadius: 4, border: `2px solid ${agreed ? C.accent : C.border}`, backgroundColor: agreed ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}>
                  {agreed && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: C.muted }}>
                  {t('signup.agree')}{' '}
                  <Link to="#" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{t('signup.terms')}</Link>
                  {' '}{t('signup.and')}{' '}
                  <Link to="#" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{t('signup.privacy')}</Link>
                </span>
              </label>

              {/* Submit */}
              <div style={fade(0.4)}>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 13, color: '#fff', backgroundColor: C.accent, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, boxShadow: '0 4px 20px rgba(122,74,40,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                >
                  {loading
                    ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>{t('signup.creating')}</>
                    : <>{t('signup.submit')} <span style={{ opacity: 0.7 }}>→</span></>
                  }
                </button>
              </div>
            </div>

            <div style={{ ...fade(0.45), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              <svg width="12" height="12" fill="none" stroke={C.muted} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <p style={{ fontSize: 11, textAlign: 'center', color: C.muted, margin: 0 }}>
                {t('signup.dataNote')}
              </p>
            </div>

            <div style={{ ...fade(0.5), marginTop: 24, padding: 16, borderRadius: 16, textAlign: 'center', backgroundColor: C.accentLight, border: `1px solid ${C.border}` }} className="lg:hidden">
              <p style={{ fontSize: 13, fontWeight: 500, color: C.body, marginBottom: 12 }}>{t('signup.haveAccount')}</p>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, color: C.accent, textDecoration: 'none', border: `1.5px solid ${C.border}`, backgroundColor: C.surface }}>
                {t('signup.signInInstead')} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignupPage