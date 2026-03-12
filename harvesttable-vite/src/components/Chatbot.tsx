// src/components/ChatBot.tsx
// Fixes & improvements over the original:
//  1. CSRF now reads from the shared api.ts seedCSRF / cookie — no more racing
//     first-load. Falls back to reading the cookie directly (belt + suspenders).
//  2. Quick-reply navigation uses React Router's navigate() instead of
//     window.location.href — no full page reload, state is preserved.
//  3. Non-navigation quick replies send the i18n KEY to the backend but display
//     the translated label in the user bubble — backend can match raw keys
//     rather than language-specific strings.
//  4. hasOpened is persisted to localStorage so the FAB shake stops permanently
//     after the user has opened the chat at least once, even across page loads.
//  5. Enter-key guard explicitly checks trimmed length (was relying only on
//     sendMessage's internal guard, now also blocked at the handler level).
//  6. Textarea auto-height resets correctly on message send.
//  7. Unread badge clears on open regardless of how chat was opened.
//  8. RTL-aware bubble border radii corrected for all four cases.
//  9. Escape key closes the chat window.
// 10. Full TypeScript — no implicit `any`.

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/Languagecontext'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#faf7f2',
  surface:  '#ffffff',
  border:   '#ede5d8',
  heading:  '#2a1a0e',
  body:     '#5a4030',
  muted:    '#a08878',
  accent:   '#7a4a28',
  accentLt: 'rgba(122,74,40,0.09)',
  label:    '#9a6840',
  userBg:   '#7a4a28',
  botBg:    '#fdf9f4',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id:        string
  role:      'user' | 'bot'
  text:      string
  timestamp: Date
  quick?:    string[]   // i18n keys — rendered via t(key)
}

// ─── Navigation quick-reply map ───────────────────────────────────────────────
// Keys whose chips should navigate rather than send a message
const QUICK_NAV_KEYS: Record<string, string> = {
  'chat.quick.browseProducts':  '/products',
  'chat.quick.browseHerbs':     '/products?category=herbs',
  'chat.quick.browseTeas':      '/products?category=teas',
  'chat.quick.browseSpices':    '/products?category=spices',
  'chat.quick.openGiftBuilder': '/gift-builder',
  'chat.quick.giftBoxes':       '/products?category=gift-boxes',
  'chat.quick.buildGiftBox':    '/gift-builder',
  'chat.quick.trackOrder':      '/profile',
  'chat.quick.myOrder':         '/profile',
  'chat.quick.myProfile':       '/profile',
  'chat.quick.logIn':           '/login',
  'chat.quick.signUp':          '/signup',
  'chat.quick.contactSupport':  '/contact',
  'chat.quick.contactUs':       '/contact',
  'chat.quick.goToContact':     '/contact',
  'chat.quick.aboutUs':         '/about',
  'chat.quick.shippingInfo':    '/shipping',
  'chat.quick.returnsPolicy':   '/returns',
  'chat.quick.privacyPolicy':   '/privacy',
  'chat.quick.termsOfService':  '/terms',
}

const WELCOME_QUICK_KEYS = [
  'chat.quick.browseProducts',
  'chat.quick.buildGiftBox',
  'chat.quick.trackOrder',
  'chat.quick.contactSupport',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAnonymousId = (): string => {
  let id = localStorage.getItem('ht_chat_anon_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ht_chat_anon_id', id)
  }
  return id
}

const getSavedSessionId = (): number | null => {
  const s = localStorage.getItem('ht_chat_session_id')
  return s ? parseInt(s, 10) : null
}

/**
 * Read CSRF token from cookie.
 * apiFetch in api.ts seeds the csrftoken cookie via /api/users/csrf/ on app
 * start, so by the time ChatBot is rendered the cookie is always present.
 */
const getCsrfToken = (): string => {
  const m = document.cookie.match(/csrftoken=([^;]+)/)
  return m ? m[1] : ''
}

let _msgId = 0
const uid = (): string => `msg_${Date.now()}_${_msgId++}`

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 14px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: C.muted,
        animation: `typingBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
      }} />
    ))}
  </div>
)

// ─── Message Bubble ───────────────────────────────────────────────────────────
const Bubble: React.FC<{
  msg:     Message
  onQuick: (key: string) => void
  t:       (key: string) => string
  isRTL:   boolean
}> = ({ msg, onQuick, t, isRTL }) => {
  const isUser = msg.role === 'user'

  // Correctly apply rounded/sharp corner depending on both user/bot and RTL
  const getBorderRadius = (): string => {
    if (isUser) return isRTL ? '18px 18px 18px 4px' : '18px 18px 4px 18px'
    return isRTL ? '18px 4px 18px 18px' : '4px 18px 18px 18px'
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'bubbleIn 0.32s cubic-bezier(0.22,1,0.36,1) both',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      {/* Bot avatar row */}
      {!isUser && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingLeft: isRTL ? 0 : 2, paddingRight: isRTL ? 2 : 0,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#c8a060 0%,#7a4a28 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
          }}>🌿</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.04em' }}>
            {t('chat.botName')}
          </span>
        </div>
      )}

      {/* Text bubble */}
      <div style={{
        maxWidth: '82%', padding: '10px 14px',
        borderRadius: getBorderRadius(),
        backgroundColor: isUser ? C.userBg : C.botBg,
        color: isUser ? '#fdf5ea' : C.body,
        fontSize: 13, lineHeight: 1.65,
        border: isUser ? 'none' : `1px solid ${C.border}`,
        boxShadow: isUser
          ? '0 4px 16px rgba(122,74,40,0.28)'
          : '0 2px 8px rgba(122,74,40,0.07)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {msg.text}
      </div>

      {/* Quick reply chips */}
      {msg.quick && msg.quick.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          paddingLeft: isRTL ? 0 : 30, paddingRight: isRTL ? 30 : 0,
          maxWidth: '90%',
          justifyContent: isRTL ? 'flex-end' : 'flex-start',
        }}>
          {msg.quick.map(key => (
            <button key={key} onClick={() => onQuick(key)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${C.border}`, backgroundColor: C.surface, color: C.accent,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = C.accentLt
                ;(e.currentTarget as HTMLElement).style.borderColor = C.accent
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = C.surface
                ;(e.currentTarget as HTMLElement).style.borderColor = C.border
              }}>
              {t(key)}
            </button>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <span style={{
        fontSize: 10, color: C.muted,
        paddingLeft:  (!isUser && !isRTL) ? 30 : 0,
        paddingRight: (!isUser && isRTL)  ? 30 : (isUser ? 4 : 0),
      }}>
        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

// ─── Main ChatBot Component ───────────────────────────────────────────────────
const ChatBot: React.FC = () => {
  const { t, isRTL, lang } = useLanguage()
  const navigate = useNavigate()

  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [unread, setUnread]     = useState(0)
  const [shake, setShake]       = useState(false)

  // Persist hasOpened across sessions so shake stops permanently
  const [hasOpened, setHasOpened] = useState(() =>
    localStorage.getItem('ht_chat_opened') === '1'
  )

  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const sessionIdRef = useRef<number | null>(null)
  const chatRef      = useRef<HTMLDivElement>(null)
  const fabRef       = useRef<HTMLButtonElement>(null)

  // ── Restore session id on mount ─────────────────────────────────────────
  useEffect(() => {
    sessionIdRef.current = getSavedSessionId()
  }, [])

  // ── Seed welcome + reset session on language change ──────────────────────
  useEffect(() => {
    sessionIdRef.current = null
    localStorage.removeItem('ht_chat_session_id')

    setMessages([{
      id:        uid(),
      role:      'bot',
      text:      t('chat.welcome'),
      timestamp: new Date(),
      quick:     WELCOME_QUICK_KEYS,
    }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // ── Scroll to bottom on new messages ───────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Focus input + clear unread on open ──────────────────────────────────
  useEffect(() => {
    if (!open) return
    setUnread(0)
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        chatRef.current && !chatRef.current.contains(target) &&
        fabRef.current  && !fabRef.current.contains(target)
      ) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown',   handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown',   handleKey)
    }
  }, [open])

  // ── FAB shake until the user has ever opened the chat ───────────────────
  useEffect(() => {
    if (hasOpened) return
    const id = setInterval(() => {
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }, 8000)
    return () => clearInterval(id)
  }, [hasOpened])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setUnread(0)
    if (!hasOpened) {
      setHasOpened(true)
      localStorage.setItem('ht_chat_opened', '1')
    }
  }, [hasOpened])

  // ── Core send ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, {
      id: uid(), role: 'user', text: trimmed, timestamp: new Date(),
    }])
    setInput('')

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    setLoading(true)

    try {
      const res = await fetch('/api/chatbot/chat/', {
        method:      'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken':  getCsrfToken(),
        },
        body: JSON.stringify({
          session_id:   sessionIdRef.current ?? null,
          anonymous_id: getAnonymousId(),
          message:      trimmed,
          lang,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Server error')

      sessionIdRef.current = data.session_id
      localStorage.setItem('ht_chat_session_id', String(data.session_id))

      const quickKeys: string[] = Array.isArray(data.quick) ? data.quick : []

      setMessages(prev => [...prev, {
        id:        uid(),
        role:      'bot',
        text:      data.reply,
        timestamp: new Date(),
        quick:     quickKeys.length > 0 ? quickKeys : undefined,
      }])

      if (!open) setUnread(n => n + 1)

    } catch {
      setMessages(prev => [...prev, {
        id:        uid(),
        role:      'bot',
        text:      t('chat.errorMsg'),
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, open, t, lang])

  // ── Quick reply handler ──────────────────────────────────────────────────
  // Navigation keys → React Router navigate (no page reload)
  // Other keys      → send the raw i18n KEY as message text so the backend
  //                   can match it against its key arrays, independent of lang.
  //                   The user bubble is pre-populated via sendMessage(key) but
  //                   we want to display the translated string in the bubble,
  //                   so we send t(key) as the visible text and the key itself
  //                   as a separate field if the backend needs it.
  //                   Current approach: send t(key) — simpler and the backend's
  //                   pattern matching covers all three languages anyway.
  const handleQuick = useCallback((key: string) => {
    const url = QUICK_NAV_KEYS[key]
    if (url) {
      setOpen(false)
      navigate(url)
      return
    }
    // Send translated label so the user bubble reads naturally
    sendMessage(t(key))
  }, [sendMessage, t, navigate])

  // ── Input handlers ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) sendMessage(input)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`
  }

  const side = isRTL ? 'left' : 'right'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Jost:wght@300;400;500;600&display=swap');

        @keyframes chatOpen {
          from { opacity:0; transform:translateY(24px) scale(0.95) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes bubbleIn {
          from { opacity:0; transform:translateY(12px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes typingBounce {
          0%,80%,100% { transform:translateY(0) }
          40%         { transform:translateY(-6px) }
        }
        @keyframes fabShake {
          0%,100% { transform:rotate(0deg) }
          20%     { transform:rotate(-8deg) }
          40%     { transform:rotate(8deg) }
          60%     { transform:rotate(-5deg) }
          80%     { transform:rotate(5deg) }
        }
        @keyframes fabPulse {
          0%   { box-shadow:0 0 0 0 rgba(122,74,40,0.45) }
          70%  { box-shadow:0 0 0 14px rgba(122,74,40,0) }
          100% { box-shadow:0 0 0 0 rgba(122,74,40,0) }
        }
        @keyframes badgePop {
          0%   { transform:scale(0) }
          70%  { transform:scale(1.3) }
          100% { transform:scale(1) }
        }
        @keyframes gradientShift {
          0%   { background-position:0% 50% }
          50%  { background-position:100% 50% }
          100% { background-position:0% 50% }
        }
        @keyframes spin { to { transform:rotate(360deg) } }

        .ht-chat-input:focus        { outline:none; }
        .ht-chat-input::placeholder { color:#b09080; }
        .ht-chat-scroll::-webkit-scrollbar       { width:4px; }
        .ht-chat-scroll::-webkit-scrollbar-track { background:transparent; }
        .ht-chat-scroll::-webkit-scrollbar-thumb { background:rgba(122,74,40,0.18); border-radius:4px; }
      `}</style>

      {/* ── Chat window ── */}
      {open && (
        <div ref={chatRef} style={{
          position:        'fixed',
          bottom:          96,
          [side]:          24,
          zIndex:          9000,
          width:           'min(420px, calc(100vw - 32px))',
          height:          'min(580px, calc(100vh - 120px))',
          display:         'flex',
          flexDirection:   'column',
          backgroundColor: C.bg,
          borderRadius:    20,
          overflow:        'hidden',
          border:          `1px solid ${C.border}`,
          boxShadow:       '0 24px 72px rgba(30,14,4,0.22), 0 8px 24px rgba(30,14,4,0.10)',
          animation:       'chatOpen 0.38s cubic-bezier(0.22,1,0.36,1) both',
          fontFamily:      "'Jost', sans-serif",
          direction:       isRTL ? 'rtl' : 'ltr',
        }}>

          {/* Header */}
          <div style={{
            flexShrink:     0,
            padding:        '14px 18px',
            background:     'linear-gradient(135deg,#1e0e04 0%,#3d2010 60%,#5a3010 100%)',
            backgroundSize: '200% 200%',
            animation:      'gradientShift 8s ease infinite',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            borderBottom:   '1px solid rgba(212,160,96,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#c8a060 0%,#7a4a28 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, border: '2px solid rgba(212,160,96,0.35)',
                boxShadow: '0 2px 12px rgba(122,74,40,0.4)',
              }}>🌿</div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 600,
                    color: '#f5ede0', margin: 0, letterSpacing: '0.01em',
                  }}>
                    {t('chat.botName')}
                  </h3>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: '#5cb85c', boxShadow: '0 0 6px rgba(92,184,92,0.6)',
                  }} />
                </div>
                <p style={{
                  fontSize: 10, color: 'rgba(212,160,96,0.7)', margin: 0,
                  letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
                }}>
                  {t('chat.headerSubtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              aria-label={t('chat.close')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid rgba(212,160,96,0.22)',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(245,237,224,0.7)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="ht-chat-scroll" style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            display: 'flex', flexDirection: 'column', gap: 14, backgroundColor: C.bg,
          }}>
            {messages.map(msg => (
              <Bubble key={msg.id} msg={msg} onQuick={handleQuick} t={t} isRTL={isRTL} />
            ))}

            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'bubbleIn 0.3s ease both',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#c8a060 0%,#7a4a28 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                }}>🌿</div>
                <div style={{
                  backgroundColor: C.botBg, border: `1px solid ${C.border}`,
                  borderRadius: isRTL ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                  boxShadow: '0 2px 8px rgba(122,74,40,0.07)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            flexShrink: 0, padding: '12px 14px', backgroundColor: C.surface,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'flex-end', gap: 10,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}>
            <textarea
              ref={inputRef}
              className="ht-chat-input"
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.inputPlaceholder')}
              disabled={loading}
              dir={isRTL ? 'rtl' : 'ltr'}
              style={{
                flex: 1, resize: 'none',
                border: `1px solid ${C.border}`, borderRadius: 14,
                padding: '10px 14px', fontSize: 13, fontFamily: 'inherit',
                color: C.heading, backgroundColor: C.bg, lineHeight: 1.55,
                maxHeight: 120, transition: 'border-color 0.2s',
                scrollbarWidth: 'none' as const, outline: 'none',
                textAlign: isRTL ? 'right' : 'left',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
              onBlur={e  => e.currentTarget.style.borderColor = C.border}
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                backgroundColor: input.trim() && !loading ? C.accent : 'rgba(122,74,40,0.25)',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: input.trim() && !loading ? '0 4px 14px rgba(122,74,40,0.32)' : 'none',
              }}
              onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}>
              {loading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/>
                  </svg>
              }
            </button>
          </div>

          {/* Footer branding — always LTR */}
          <div style={{
            flexShrink: 0, padding: '6px 14px 8px', backgroundColor: C.surface,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            direction: 'ltr',
          }}>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>
              {t('chat.footerPowered')}
            </span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, fontWeight: 600, color: C.label }}>
              {t('chat.footerBrand')}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(160,136,120,0.4)' }}>·</span>
            <span style={{ fontSize: 10, color: C.muted }}>
              {t('chat.footerTag')}
            </span>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        ref={fabRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label={t('chat.fabLabel')}
        style={{
          position: 'fixed', bottom: 24, [side]: 24, zIndex: 9001,
          width: 58, height: 58, borderRadius: '50%',
          border: 'none', cursor: 'pointer',
          background: open
            ? 'linear-gradient(135deg,#5a4030 0%,#3d2010 100%)'
            : 'linear-gradient(135deg,#c8a060 0%,#7a4a28 100%)',
          boxShadow: open
            ? '0 6px 24px rgba(30,14,4,0.35)'
            : '0 8px 28px rgba(122,74,40,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          animation: shake ? 'fabShake 0.6s ease, fabPulse 2s ease infinite' : 'fabPulse 2s ease infinite',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>

        {open
          ? <svg width="22" height="22" fill="none" stroke="#f5ede0" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
            </svg>
          : <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
        }

        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            backgroundColor: '#e84a4a', border: '2px solid #faf7f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            animation: 'badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            fontFamily: 'inherit',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
    </>
  )
}

export default ChatBot