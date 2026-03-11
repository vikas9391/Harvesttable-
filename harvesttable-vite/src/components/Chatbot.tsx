// src/components/ChatBot.tsx
// Drop this anywhere in your app (e.g. inside App.tsx, outside the <Routes>)
// and the bot will float bottom-right on every page.

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../context/Languagecontext'

// ─── Brand colours (match site palette) ──────────────────────────────────────
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
  dark:     '#1e0e04',
  userBg:   '#7a4a28',
  botBg:    '#fdf9f4',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id:        string
  role:      'user' | 'bot'
  text:      string
  timestamp: Date
  quick?:    string[]
}

// ─── Pre-canned quick replies for the welcome message ────────────────────────
const WELCOME_QUICK = [
  '🌿 Browse products',
  '🎁 Build a gift box',
  '📦 Track my order',
  '✉️ Contact support',
]

// ─── Quick reply → URL navigation map ────────────────────────────────────────
const QUICK_NAV: Record<string, string> = {
  '🌿 Browse products':    '/products',
  '🎁 Build a gift box':   '/gift-builder',
  '🌿 Browse herbs':       '/products?category=herbs',
  '☕ Browse teas':        '/products?category=teas',
  '🌶 Browse spices':      '/products?category=spices',
  '🎁 Open Gift Builder':  '/gift-builder',
  '🎁 Gift boxes':         '/products?category=gift-boxes',
  '📦 Track my order':     '/profile',
  '🔑 My profile':         '/profile',
  '🔑 Log in':             '/login',
  '📝 Sign up':            '/signup',
  '✉️ Contact support':    '/contact',
  '✉️ Contact us':         '/contact',
  '✉️ Go to Contact page': '/contact',
  '📖 About us':           '/about',
  '📄 Shipping info':      '/shipping',
  '📄 Returns policy':     '/returns',
  '📄 Privacy policy':     '/privacy',
  '📄 Terms of service':   '/terms',
}

// ─── Anonymous session helpers ────────────────────────────────────────────────
const getAnonymousId = (): string => {
  let id = localStorage.getItem('ht_chat_anon_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ht_chat_anon_id', id)
  }
  return id
}

const getSavedSessionId = (): number | null => {
  const saved = localStorage.getItem('ht_chat_session_id')
  return saved ? parseInt(saved, 10) : null
}

// ─── CSRF token (required by Django for POST requests) ────────────────────────
const getCsrfToken = (): string => {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : ''
}

// ─── Unique message ID ────────────────────────────────────────────────────────
let _id = 0
const uid = () => `msg_${Date.now()}_${_id++}`

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 14px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: C.muted,
        animation: `typingBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
      }}/>
    ))}
  </div>
)

// ─── Single chat message bubble ───────────────────────────────────────────────
const Bubble: React.FC<{
  msg: Message
  onQuick: (text: string) => void
}> = ({ msg, onQuick }) => {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 6,
      animation: 'bubbleIn 0.32s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      {/* Avatar row */}
      {!isUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8a060 0%, #7a4a28 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, flexShrink: 0,
          }}>🌿</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.04em' }}>Basma</span>
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        backgroundColor: isUser ? C.userBg : C.botBg,
        color: isUser ? '#fdf5ea' : C.body,
        fontSize: 13,
        lineHeight: 1.65,
        border: isUser ? 'none' : `1px solid ${C.border}`,
        boxShadow: isUser
          ? '0 4px 16px rgba(122,74,40,0.28)'
          : '0 2px 8px rgba(122,74,40,0.07)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.text}
      </div>

      {/* Quick reply chips */}
      {msg.quick && msg.quick.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 30, maxWidth: '90%' }}>
          {msg.quick.map(q => (
            <button key={q} onClick={() => onQuick(q)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${C.border}`,
              backgroundColor: C.surface, color: C.accent,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = C.accentLt
                ;(e.currentTarget as HTMLElement).style.borderColor = C.accent
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = C.surface
                ;(e.currentTarget as HTMLElement).style.borderColor = C.border
              }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <span style={{ fontSize: 10, color: C.muted, paddingLeft: isUser ? 0 : 30, paddingRight: isUser ? 4 : 0 }}>
        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CHATBOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ChatBot: React.FC = () => {
  const { isRTL } = useLanguage()

  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [unread, setUnread]       = useState(0)
  const [hasOpened, setHasOpened] = useState(false)
  const [shake, setShake]         = useState(false)

  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const sessionIdRef = useRef<number | null>(null)
  const chatRef      = useRef<HTMLDivElement>(null)
  const fabRef       = useRef<HTMLButtonElement>(null)

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        chatRef.current && !chatRef.current.contains(target) &&
        fabRef.current  && !fabRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // ── Restore session from localStorage on mount ────────────────────────────
  useEffect(() => {
    sessionIdRef.current = getSavedSessionId()
  }, [])



  // ── Seed welcome message ──────────────────────────────────────────────────
  useEffect(() => {
    setMessages([{
      id:        uid(),
      role:      'bot',
      text:      "Marhaba! 🌿 I'm Basma, your HarvestTable guide.\n\nHow can I help you today? Whether it's finding the perfect tea, building a gift box, or tracking an order — I'm here.",
      timestamp: new Date(),
      quick:     WELCOME_QUICK,
    }])
  }, [])

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Focus input when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  // ── Periodic shake on FAB to attract attention ────────────────────────────
  useEffect(() => {
    if (hasOpened) return
    const id = setInterval(() => {
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }, 8000)
    return () => clearInterval(id)
  }, [hasOpened])

  const handleOpen = () => {
    setOpen(true)
    setHasOpened(true)
    setUnread(0)
  }

  // ── Send message → Django backend (no Anthropic call from browser) ────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, {
      id: uid(), role: 'user', text: trimmed, timestamp: new Date(),
    }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot/chat/', {
        method:      'POST',
        credentials: 'include',          // sends session cookie for logged-in users
        headers:     { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({
          session_id:   sessionIdRef.current ?? null,
          anonymous_id: getAnonymousId(),
          message:      trimmed,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Server error')

      // Persist session so conversation survives page reloads
      sessionIdRef.current = data.session_id
      localStorage.setItem('ht_chat_session_id', String(data.session_id))

      const reply: string   = data.reply
      const quick: string[] = Array.isArray(data.quick) ? data.quick : []

      setMessages(prev => [...prev, {
        id:        uid(),
        role:      'bot',
        text:      reply,
        timestamp: new Date(),
        quick:     quick.length > 0 ? quick : undefined,
      }])
      if (!open) setUnread(prev => prev + 1)

    } catch {
      setMessages(prev => [...prev, {
        id:        uid(),
        role:      'bot',
        text:      "Oops — something went wrong 😔 Please try again or reach us at support@harvesttable.com.",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, open])

  // ── Quick reply: navigate if it has a URL, otherwise send as message ──────
  const handleQuick = useCallback((q: string) => {
    if (QUICK_NAV[q]) {
      window.location.href = QUICK_NAV[q]
      return
    }
    sendMessage(q)
  }, [sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px'
  }

  const side = isRTL ? 'left' : 'right'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Jost:wght@300;400;500;600&display=swap');

        @keyframes chatOpen {
          from { opacity:0; transform:translateY(24px) scale(0.95) }
          to   { opacity:1; transform:translateY(0)   scale(1) }
        }
        @keyframes chatClose {
          from { opacity:1; transform:translateY(0)   scale(1) }
          to   { opacity:0; transform:translateY(24px) scale(0.95) }
        }
        @keyframes bubbleIn {
          from { opacity:0; transform:translateY(12px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes typingBounce {
          0%,80%,100% { transform:translateY(0) }
          40%          { transform:translateY(-6px) }
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

        .ht-chat-input:focus { outline:none; }
        .ht-chat-input::placeholder { color:#b09080; }
        .ht-chat-scroll::-webkit-scrollbar { width:4px; }
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
            background:     'linear-gradient(135deg, #1e0e04 0%, #3d2010 60%, #5a3010 100%)',
            backgroundSize: '200% 200%',
            animation:      'gradientShift 8s ease infinite',
            display:        'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom:   '1px solid rgba(212,160,96,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background:  'linear-gradient(135deg, #c8a060 0%, #7a4a28 100%)',
                display:     'flex', alignItems: 'center', justifyContent: 'center',
                fontSize:    18, border: '2px solid rgba(212,160,96,0.35)',
                boxShadow:   '0 2px 12px rgba(122,74,40,0.4)',
              }}>🌿</div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: '#f5ede0', margin: 0, letterSpacing: '0.01em' }}>
                    Basma
                  </h3>
                  {/* Online dot */}
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#5cb85c', boxShadow: '0 0 6px rgba(92,184,92,0.6)' }}/>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(212,160,96,0.7)', margin: 0, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                  HarvestTable · Always here
                </p>
              </div>
            </div>

            {/* Close */}
            <button onClick={() => setOpen(false)} style={{
              width: 32, height: 32, borderRadius: '50%',
              border:     '1px solid rgba(212,160,96,0.22)',
              background: 'rgba(255,255,255,0.07)',
              color:      'rgba(245,237,224,0.7)', cursor: 'pointer',
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="ht-chat-scroll" style={{
            flex:            1,
            overflowY:       'auto',
            padding:         '16px 14px',
            display:         'flex',
            flexDirection:   'column',
            gap:             14,
            backgroundColor: C.bg,
          }}>
            {messages.map(msg => (
              <Bubble key={msg.id} msg={msg} onQuick={handleQuick}/>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'bubbleIn 0.3s ease both' }}>
                <div style={{
                  width:      22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c8a060 0%, #7a4a28 100%)',
                  display:    'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize:   11, flexShrink: 0,
                }}>🌿</div>
                <div style={{
                  backgroundColor: C.botBg,
                  border:          `1px solid ${C.border}`,
                  borderRadius:    '4px 18px 18px 18px',
                  boxShadow:       '0 2px 8px rgba(122,74,40,0.07)',
                }}>
                  <TypingDots/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            flexShrink:      0,
            padding:         '12px 14px',
            backgroundColor: C.surface,
            borderTop:       `1px solid ${C.border}`,
            display:         'flex', alignItems: 'flex-end', gap: 10,
          }}>
            <textarea
              ref={inputRef}
              className="ht-chat-input"
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              disabled={loading}
              style={{
                flex:          1,
                resize:        'none',
                border:        `1px solid ${C.border}`,
                borderRadius:  14,
                padding:       '10px 14px',
                fontSize:      13,
                fontFamily:    'inherit',
                color:         C.heading,
                backgroundColor: C.bg,
                lineHeight:    1.55,
                maxHeight:     120,
                transition:    'border-color 0.2s',
                scrollbarWidth: 'none',
                outline:       'none',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
              onBlur={e  => e.currentTarget.style.borderColor = C.border}
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width:           40, height: 40, borderRadius: '50%', flexShrink: 0,
                backgroundColor: input.trim() && !loading ? C.accent : 'rgba(122,74,40,0.25)',
                border:          'none',
                cursor:          input.trim() && !loading ? 'pointer' : 'not-allowed',
                display:         'flex', alignItems: 'center', justifyContent: 'center',
                transition:      'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow:       input.trim() && !loading ? '0 4px 14px rgba(122,74,40,0.32)' : 'none',
              }}
              onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}>
              {loading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                : <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/>
                  </svg>
              }
            </button>
          </div>

          {/* Footer branding */}
          <div style={{
            flexShrink:      0,
            padding:         '6px 14px 8px',
            backgroundColor: C.surface,
            borderTop:       `1px solid ${C.border}`,
            display:         'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>Powered by</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, fontWeight: 600, color: C.label }}>HarvestTable AI</span>
            <span style={{ fontSize: 10, color: 'rgba(160,136,120,0.4)' }}>·</span>
            <span style={{ fontSize: 10, color: C.muted }}>🌿 Organic & Ethical</span>
          </div>
        </div>
      )}

      {/* ── FAB toggle button ── */}
      <button
        ref={fabRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="Open chat"
        style={{
          position:     'fixed',
          bottom:       24,
          [side]:       24,
          zIndex:       9001,
          width:        58, height: 58,
          borderRadius: '50%',
          border:       'none', cursor: 'pointer',
          background:   open
            ? 'linear-gradient(135deg, #5a4030 0%, #3d2010 100%)'
            : 'linear-gradient(135deg, #c8a060 0%, #7a4a28 100%)',
          boxShadow: open
            ? '0 6px 24px rgba(30,14,4,0.35)'
            : '0 8px 28px rgba(122,74,40,0.45)',
          display:    'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          animation:  shake
            ? 'fabShake 0.6s ease, fabPulse 2s ease infinite'
            : 'fabPulse 2s ease infinite',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}>

        {/* Icon swap */}
        {open
          ? <svg width="22" height="22" fill="none" stroke="#f5ede0" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
            </svg>
          : <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
        }

        {/* Unread badge */}
        {!open && unread > 0 && (
          <div style={{
            position:        'absolute', top: -2, right: -2,
            width:           20, height: 20, borderRadius: '50%',
            backgroundColor: '#e84a4a',
            border:          '2px solid #faf7f2',
            display:         'flex', alignItems: 'center', justifyContent: 'center',
            fontSize:        10, fontWeight: 700, color: '#fff',
            animation:       'badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            fontFamily:      'inherit',
          }}>
            {unread}
          </div>
        )}
      </button>
    </>
  )
}

export default ChatBot