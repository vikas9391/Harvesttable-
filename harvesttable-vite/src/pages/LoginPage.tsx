// src/pages/LoginPage.tsx
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

const featureIcons = [
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
  </svg>,
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
  </svg>,
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M17 17h.01M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3l3 18m3-18l-3 18M5 21h4m6 0h4a2 2 0 002-2v-4M3 9h18"/>
  </svg>,
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
  </svg>,
]

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t, isRTL } = useLanguage()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [vis, setVis]           = useState(false)

  useEffect(() => {
    const t2 = setTimeout(() => setVis(true), 60)
    return () => clearTimeout(t2)
  }, [])

  const setField = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
    if (error) setError('')
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.isAdmin ? '/admin' : '/profile')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fade = (delay: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  })

  const featureItems = [
    t('login.feat1'),
    t('login.feat2'),
    t('login.feat3'),
    t('login.feat4'),
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes panelSlide { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes featureItemIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div className="min-h-screen flex" style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>

        {/* ── Left panel ── */}
        <div
          className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-14 overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #2a1a0e 0%, #3d2412 55%, #5a3418 100%)',
            animation: 'panelSlide 0.9s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04 }}>
            <defs>
              <pattern id="grain" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.8" fill="#fff"/>
                <circle cx="60" cy="10" r="0.5" fill="#fff"/>
                <circle cx="10" cy="60" r="0.6" fill="#fff"/>
                <circle cx="70" cy="50" r="0.9" fill="#fff"/>
                <circle cx="40" cy="70" r="0.4" fill="#fff"/>
                <circle cx="50" cy="35" r="0.7" fill="#fff"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grain)"/>
          </svg>

          <svg className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none" style={{ opacity: 0.06 }}>
            <circle cx="128" cy="128" r="120" fill="none" stroke="#d4a060" strokeWidth="1.5"/>
            <circle cx="128" cy="128" r="90"  fill="none" stroke="#d4a060" strokeWidth="0.8"/>
            <circle cx="128" cy="128" r="60"  fill="none" stroke="#d4a060" strokeWidth="0.4"/>
          </svg>

          <div className="pt-10 relative z-10">
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'6px 14px', borderRadius:2, marginBottom:32,
              backgroundColor: 'rgba(212,160,96,0.12)', border: '1px solid rgba(212,160,96,0.2)', color: '#d4a060',
              fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:600,
              animation:'featureItemIn 0.6s ease 0.4s both',
            }}>
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
              {t('login.memberAccess')}
            </div>

            <div style={{ overflow:'hidden', marginBottom:20 }}>
              <h2 style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:36, fontWeight:700, lineHeight:1.2,
                color:'#f5e8d0', letterSpacing:'-0.02em', margin:0,
                animation:'panelSlide 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both',
              }}>
                {t('login.left.title')}
              </h2>
            </div>

            <p style={{
              fontSize:13, lineHeight:1.8, color:'rgba(200,168,120,0.75)', maxWidth:280, marginBottom:36,
              animation:'featureItemIn 0.7s ease 0.5s both',
            }}>
              {t('login.left.desc')}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {featureItems.map((text, i) => (
                <div key={text} style={{
                  display:'flex', alignItems:'center', gap:12,
                  animation:`featureItemIn 0.6s ease ${0.6 + i*0.1}s both`,
                }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'rgba(212,160,96,0.12)', border:'1px solid rgba(212,160,96,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#d4a060' }}>
                    {featureIcons[i]}
                  </div>
                  <span style={{ fontSize:13, color:'rgba(200,168,120,0.8)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            borderRadius:16, padding:20,
            backgroundColor:'rgba(255,255,255,0.05)', border:'1px solid rgba(212,160,96,0.14)',
            animation:'featureItemIn 0.7s ease 1.1s both',
          }}>
            <p style={{ fontSize:13, fontStyle:'italic', lineHeight:1.7, marginBottom:12, color:'rgba(212,160,96,0.8)' }}>
              {t('login.quote')}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff',
                background:'linear-gradient(135deg, #d4a060, #7a4a28)',
              }}>
                {t('login.quoteName').charAt(0)}
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#e8c898', margin:0 }}>{t('login.quoteName')}</p>
                <p style={{ fontSize:10, color:'rgba(200,168,120,0.5)', margin:0 }}>{t('login.quoteSince')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 pt-28 lg:pt-24 overflow-y-auto">
          <div className="w-full max-w-[400px]">

            <div style={{ ...fade(0), textAlign:'center', marginBottom:40 }} className="lg:hidden">
              <Link to="/" style={{
                fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700,
                color: C.accent, textDecoration:'none',
              }}>HarvestTable</Link>
            </div>

            <div style={{ ...fade(0.05), marginBottom:32 }}>
              <p style={{ fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', fontWeight:700, color: C.label, marginBottom:8 }}>
                {t('login.memberAccess')}
              </p>
              <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:36, fontWeight:700, color: C.heading, margin:'0 0 8px', letterSpacing:'-0.02em' }}>
                {t('login.title')}
              </h1>
              <p style={{ fontSize:13, color: C.muted, margin:0 }}>
                {t('login.newTo')}{' '}
                <Link to="/signup" style={{ color: C.accent, fontWeight:600, textDecoration:'none' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.textDecoration='underline'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.textDecoration='none'}>
                  {t('login.createAccount')} →
                </Link>
              </p>
            </div>

            <div style={{ ...fade(0.1), height:1, backgroundColor: C.border, marginBottom:28 }}/>

            {error && (
              <div style={{
                marginBottom:20, padding:'12px 16px', borderRadius:12, fontSize:13,
                display:'flex', alignItems:'flex-start', gap:10,
                backgroundColor: C.errorBg, border:`1px solid ${C.errorBorder}`, color: C.errorText,
                animation:'slideUp 0.3s ease',
              }}>
                <svg style={{ width:16, height:16, marginTop:2, flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Email */}
              <div style={fade(0.15)}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: C.label, marginBottom:8 }}>
                  {t('login.email')}
                </label>
                <input
                  type="email"
                  placeholder={t('common.emailPlaceholder')}
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{
                    width:'100%', padding:'12px 16px', borderRadius:12, fontSize:13,
                    outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                    backgroundColor: C.inputBg, border:`1.5px solid ${C.border}`, color: C.heading,
                    transition:'border-color 0.2s',
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              {/* Password */}
              <div style={fade(0.2)}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: C.label }}>
                    {t('login.password')}
                  </label>
                  <Link to="#" style={{ fontSize:12, fontWeight:500, color: C.accent, textDecoration:'none' }}>
                    {t('login.forgot')}
                  </Link>
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{
                      width:'100%', padding:'12px 44px 12px 16px', borderRadius:12, fontSize:13,
                      outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                      backgroundColor: C.inputBg, border:`1.5px solid ${C.border}`, color: C.heading,
                      transition:'border-color 0.2s',
                      direction: isRTL ? 'rtl' : 'ltr',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', padding:4,
                    color: C.muted, opacity:0.8, transition:'opacity 0.2s',
                    display:'flex', alignItems:'center',
                  }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity='1'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity='0.8'}>
                    <EyeIcon open={showPw}/>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label style={{ ...fade(0.25), display:'flex', alignItems:'center', gap:12, cursor:'pointer', userSelect:'none' }}
                onClick={() => setRemember(v => !v)}>
                <div style={{
                  width:16, height:16, borderRadius:4, border:`2px solid ${remember?C.accent:C.border}`,
                  backgroundColor: remember ? C.accent : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  transition:'all 0.2s ease',
                }}>
                  {remember && <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span style={{ fontSize:13, color: C.muted }}>{t('login.remember')}</span>
              </label>

              {/* Submit */}
              <div style={fade(0.3)}>
                <button onClick={handleSubmit} disabled={loading} style={{
                  width:'100%', padding:'14px 0', borderRadius:12, fontWeight:700,
                  fontSize:13, color:'#fff', letterSpacing:'0.06em',
                  backgroundColor: C.accent, border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  boxShadow:'0 4px 20px rgba(122,74,40,0.30), 0 1px 3px rgba(122,74,40,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  fontFamily:'inherit', transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s',
                }}
                  onMouseEnter={e=>{ if(!loading)(e.currentTarget as HTMLElement).style.transform='translateY(-2px)' }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
                  {loading
                    ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                        {t('login.signingIn')}
                      </>
                    : <>{t('login.submit')} <span style={{ opacity:0.7 }}>→</span></>
                  }
                </button>
              </div>
            </div>

            <p style={{ ...fade(0.35), fontSize:11, textAlign:'center', marginTop:28, lineHeight:1.7, color: C.muted }}>
              {t('login.terms')}{' '}
              <Link to="#" style={{ color: C.accent, textDecoration:'none' }}>{t('login.termsLink')}</Link>
              {' '}&{' '}
              <Link to="#" style={{ color: C.accent, textDecoration:'none' }}>{t('login.privacyLink')}</Link>.
            </p>

            <div style={{
              ...fade(0.4),
              marginTop:28, padding:16, borderRadius:16, textAlign:'center',
              backgroundColor: C.accentLight, border:`1px solid ${C.border}`,
            }} className="lg:hidden">
              <p style={{ fontSize:13, fontWeight:500, color: C.body, marginBottom:12 }}>{t('login.noAccount')}</p>
              <Link to="/signup" style={{
                display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700,
                padding:'10px 20px', borderRadius:12, color:'#fff', textDecoration:'none',
                backgroundColor: C.accent, boxShadow:'0 2px 12px rgba(122,74,40,0.25)',
              }}>
                {t('login.createAccount')} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage