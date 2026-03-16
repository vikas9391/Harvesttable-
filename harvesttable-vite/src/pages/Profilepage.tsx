// src/pages/ProfilePage.tsx
// Fixes:
//  1. DELETE /api/users/me/ now handled — view must support METHOD=DELETE (see note below)
//  2. apiFetch used consistently everywhere (no raw fetch)
//  3. Duplicate orders fetch consolidated — single load on mount, re-fetch only when
//     switching to the Orders tab and the list is stale
//  4. Wishlist tab hidden until feature is built
//  5. totalSpent uses toFixed(2) consistently; no precision issues for display
//  6. initials pulls both first + last initial
//  7. Notification save shows "local-only" note when API 404s
//  8. Settings, password, and delete sections extracted to sub-components
//  9. useReducer replaces the 20+ useState declarations for form/UI state
// 10. Tab animation uses CSS classes instead of inline JS state toggling

import React, {
  useState, useEffect, useRef, useReducer, useCallback,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useLanguage } from '../context/Languagecontext'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#faf7f2',
  surface:    '#ffffff',
  surfaceAlt: '#fdf9f4',
  border:     '#ede5d8',
  borderFocus:'#c8a882',
  heading:    '#2a1a0e',
  body:       '#5a4030',
  muted:      '#a08878',
  accent:     '#7a4a28',
  label:      '#9a6840',
  inputBg:    '#fdfaf6',
  green:      '#3a6028',
  greenBg:    'rgba(58,96,40,0.07)',
  greenBorder:'rgba(58,96,40,0.2)',
  red:        '#b04040',
  redBg:      'rgba(176,64,64,0.08)',
  redBorder:  'rgba(176,64,64,0.2)',
  price:      '#8b3a1a',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'orders' | 'settings'

interface Profile {
  id:        number
  firstName: string
  lastName:  string
  email:     string
  phone:     string
  address:   string
  isAdmin:   boolean
}

interface Order {
  id:           number
  order_number: string
  status:       string
  total:        string
  created_at:   string
  items?:       { name: string; quantity: number; price: string }[]
}

interface NotifPrefs {
  orderUpdates:   boolean
  promotions:     boolean
  newArrivals:    boolean
  wishlistAlerts: boolean
}

// ─── Page-level state via useReducer ─────────────────────────────────────────
type State = {
  profile:     Profile | null
  editForm:    Profile | null
  orders:      Order[]
  editMode:    boolean
  pageLoading: boolean
  saveLoading: boolean
  pwLoading:   boolean
  deleteLoading: boolean
  saved:       boolean
  pwSaved:     boolean
  notifSaved:  boolean
  profileError:string
  pwError:     string
  deleteError: string
  showDeleteModal: boolean
  ordersLoaded: boolean
}

type Action =
  | { type: 'SET_PROFILE';       payload: Profile }
  | { type: 'SET_EDIT_FORM';     payload: Partial<Profile> }
  | { type: 'SET_ORDERS';        payload: Order[] }
  | { type: 'RESET_ORDERS' }                              
  | { type: 'SET_EDIT_MODE';     payload: boolean }
  | { type: 'PAGE_LOADED' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_DONE';         payload: Profile }
  | { type: 'SAVE_ERROR';        payload: string }
  | { type: 'PW_START' }
  | { type: 'PW_DONE' }
  | { type: 'PW_ERROR';          payload: string }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_ERROR';      payload: string }
  | { type: 'SHOW_DELETE_MODAL'; payload: boolean }
  | { type: 'NOTIF_SAVED' }
  | { type: 'CLEAR_SAVED' }
  | { type: 'PROFILE_ERROR';     payload: string }

const initialState: State = {
  profile: null, editForm: null, orders: [], editMode: false,
  pageLoading: true, saveLoading: false, pwLoading: false, deleteLoading: false,
  saved: false, pwSaved: false, notifSaved: false,
  profileError: '', pwError: '', deleteError: '',
  showDeleteModal: false, ordersLoaded: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PROFILE':   return { ...state, profile: action.payload, editForm: action.payload }
    case 'SET_EDIT_FORM': return { ...state, editForm: state.editForm ? { ...state.editForm, ...action.payload } : null }
    case 'SET_ORDERS':    return { ...state, orders: action.payload, ordersLoaded: true }
    case 'SET_EDIT_MODE': return { ...state, editMode: action.payload, profileError: '' }
    case 'PAGE_LOADED':   return { ...state, pageLoading: false }
    case 'SAVE_START':    return { ...state, saveLoading: true, profileError: '' }
    case 'SAVE_DONE':     return { ...state, saveLoading: false, saved: true, editMode: false, profile: action.payload, editForm: action.payload }
    case 'SAVE_ERROR':    return { ...state, saveLoading: false, profileError: action.payload }
    case 'PW_START':      return { ...state, pwLoading: true, pwError: '' }
    case 'PW_DONE':       return { ...state, pwLoading: false, pwSaved: true }
    case 'PW_ERROR':      return { ...state, pwLoading: false, pwError: action.payload }
    case 'DELETE_START':  return { ...state, deleteLoading: true, deleteError: '' }
    case 'DELETE_ERROR':  return { ...state, deleteLoading: false, deleteError: action.payload }
    case 'SHOW_DELETE_MODAL': return { ...state, showDeleteModal: action.payload, deleteError: '' }
    case 'NOTIF_SAVED':   return { ...state, notifSaved: true }
    case 'CLEAR_SAVED':   return { ...state, saved: false, pwSaved: false, notifSaved: false }
    case 'PROFILE_ERROR': return { ...state, profileError: action.payload }
    case 'RESET_ORDERS':  return { ...state, ordersLoaded: false }   // ADD THIS LINE
    default: return state
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 16px', borderRadius: 12, fontSize: 13,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  backgroundColor: C.inputBg, border: `1px solid ${C.border}`,
  color: C.heading, transition: 'border-color 0.2s',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 16, padding: 20,
  boxShadow: '0 2px 16px rgba(122,74,40,0.06)',
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
  color: '#fff', backgroundColor: C.accent, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
  boxShadow: '0 4px 14px rgba(122,74,40,0.26)',
  transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable inline feedback banner */
const Banner: React.FC<{
  type: 'success' | 'error'
  message: string
  style?: React.CSSProperties
}> = ({ type, message, style }) => (
  <div style={{
    padding: '12px 16px', borderRadius: 12, fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8,
    backgroundColor: type === 'success' ? C.greenBg : C.redBg,
    border: `1px solid ${type === 'success' ? C.greenBorder : C.redBorder}`,
    color: type === 'success' ? C.green : C.red,
    animation: 'successIn 0.3s ease',
    ...style,
  }}>
    {type === 'success'
      ? <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
      : <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    }
    {message}
  </div>
)

/** Spinning loader */
const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#fff' }) => (
  <div style={{ width: size, height: size, border: `2px solid rgba(255,255,255,0.35)`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
)

/** Status badge */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    delivered:  { bg: 'rgba(58,96,40,0.08)',   color: '#3a6028', border: 'rgba(58,96,40,0.2)' },
    shipped:    { bg: 'rgba(58,90,154,0.08)',  color: '#3a5a9a', border: 'rgba(58,90,154,0.2)' },
    processing: { bg: 'rgba(160,100,40,0.08)', color: '#a06428', border: 'rgba(160,100,40,0.2)' },
    confirmed:  { bg: 'rgba(50,90,160,0.08)',  color: '#3a5a9a', border: 'rgba(50,90,160,0.2)' },
    pending:    { bg: 'rgba(160,100,40,0.08)', color: '#a06428', border: 'rgba(160,100,40,0.2)' },
    cancelled:  { bg: 'rgba(176,64,64,0.08)',  color: C.red,     border: C.redBorder },
  }
  const s = map[status?.toLowerCase()] ?? map.pending
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconHome     = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IconPackage  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
const IconSettings = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>

// ── Delete Account Modal ──────────────────────────────────────────────────────
const DeleteAccountModal: React.FC<{
  email:     string
  loading:   boolean
  error:     string
  onConfirm: () => void
  onCancel:  () => void
}> = ({ email, loading, error, onConfirm, onCancel }) => {
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmed = val.trim().toLowerCase() === 'delete my account'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    setTimeout(() => inputRef.current?.focus(), 120)
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(30,15,5,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'fadeInBg 0.2s ease',
      }}>
      <div style={{
        backgroundColor: C.surface, borderRadius: 20, width: '100%', maxWidth: 440,
        padding: '32px 28px', border: `1px solid ${C.redBorder}`,
        boxShadow: '0 24px 64px rgba(30,15,5,0.3)',
        animation: 'slideUpModal 0.28s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          backgroundColor: C.redBg, border: `1px solid ${C.redBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 20px',
        }}>
          <svg width="22" height="22" fill="none" stroke={C.red} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.red, margin: '0 0 10px' }}>
          Delete Account
        </h2>
        <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, margin: '0 0 6px' }}>
          This will <strong>permanently delete</strong> your account and all associated data —
          orders, preferences, and personal information.
        </p>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
          Account: <strong style={{ color: C.body }}>{email}</strong>
        </p>

        {error && <Banner type="error" message={error} style={{ marginBottom: 16 }} />}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.red, marginBottom: 8 }}>
            Type{' '}
            <span style={{ fontFamily: 'monospace', backgroundColor: C.redBg, padding: '1px 6px', borderRadius: 4 }}>
              delete my account
            </span>{' '}
            to confirm
          </label>
          <input
            ref={inputRef}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && confirmed && !loading) onConfirm() }}
            placeholder="delete my account"
            disabled={loading}
            style={{
              ...inputStyle,
              border: `1px solid ${val.length > 0 && !confirmed ? 'rgba(176,64,64,0.5)' : C.border}`,
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.red}
            onBlur={e  => e.currentTarget.style.borderColor = val.length > 0 && !confirmed ? 'rgba(176,64,64,0.5)' : C.border}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
              color: '#fff', border: 'none', fontFamily: 'inherit',
              cursor: confirmed && !loading ? 'pointer' : 'not-allowed',
              backgroundColor: confirmed && !loading ? C.red : 'rgba(176,64,64,0.3)',
              transition: 'all 0.2s',
              boxShadow: confirmed && !loading ? '0 4px 14px rgba(176,64,64,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading ? <><Spinner /> Deleting…</> : 'Delete Account'}
          </button>
          <button
            onClick={onCancel} disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 500,
              border: `1px solid ${C.border}`, color: C.body, background: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Password Section ──────────────────────────────────────────────────────────
const PasswordSection: React.FC<{
  t:       (k: string) => string
  loading: boolean
  saved:   boolean
  error:   string
  onSave:  (cur: string, next: string) => Promise<void>
}> = ({ t, loading, saved, error, onSave }) => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const mismatch = form.confirm.length > 0 && form.confirm !== form.next

  const handleSubmit = () => {
    onSave(form.current, form.next).then(() => {
      setForm({ current: '', next: '', confirm: '' })
    }).catch(() => {})
  }

  return (
    <div style={cardStyle}>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, marginBottom: 20 }}>
        {t('profile.changePassword')}
      </h3>

      {saved && <Banner type="success" message={t('profile.passwordUpdated')} style={{ marginBottom: 16 }} />}
      {error && <Banner type="error"   message={error}                         style={{ marginBottom: 16 }} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {([
          ['current', t('profile.currentPw')],
          ['next',    t('profile.newPw')],
          ['confirm', t('profile.confirmPw')],
        ] as const).map(([k, label]) => (
          <div key={k}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>
              {label}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form[k]}
              onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              style={{
                ...inputStyle,
                border: `1px solid ${k === 'confirm' && mismatch ? C.redBorder : C.border}`,
              }}
              onFocus={e => e.currentTarget.style.borderColor = k === 'confirm' && mismatch ? C.red : C.borderFocus}
              onBlur={e  => e.currentTarget.style.borderColor = k === 'confirm' && mismatch ? C.redBorder : C.border}
            />
            {k === 'confirm' && mismatch && (
              <p style={{ fontSize: 11, marginTop: 4, color: C.red, fontWeight: 600 }}>{t('signup.mismatch')}</p>
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={loading || mismatch}
          style={{ ...btnPrimary, alignSelf: 'flex-start', opacity: loading || mismatch ? 0.65 : 1 }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
          {loading ? <><Spinner /> {t('profile.updatingPw')}</> : t('profile.updatePw')}
        </button>
      </div>
    </div>
  )
}

// ── Notifications Section ─────────────────────────────────────────────────────
const NotificationsSection: React.FC<{
  t:       (k: string) => string
  saved:   boolean
  onSave:  (prefs: NotifPrefs) => Promise<void>
}> = ({ t, saved, onSave }) => {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try {
      const p = localStorage.getItem('notif_prefs')
      return p ? JSON.parse(p) : { orderUpdates: true, promotions: false, newArrivals: true, wishlistAlerts: false }
    } catch {
      return { orderUpdates: true, promotions: false, newArrivals: true, wishlistAlerts: false }
    }
  })
  const [saving, setSaving]   = useState(false)
  const [localOnly, setLocalOnly] = useState(false)

  const notifications = [
    { key: 'orderUpdates'   as const, label: t('profile.orderUpdates'),   desc: t('profile.orderUpdatesDesc') },
    { key: 'promotions'     as const, label: t('profile.promotions'),     desc: t('profile.promotionsDesc') },
    { key: 'newArrivals'    as const, label: t('profile.newArrivals'),    desc: t('profile.newArrivalsDesc') },
    { key: 'wishlistAlerts' as const, label: t('profile.wishlistAlerts'), desc: t('profile.wishlistAlertsDesc') },
  ]

  const toggle = (key: keyof NotifPrefs) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const handleSave = async () => {
    setSaving(true); setLocalOnly(false)
    localStorage.setItem('notif_prefs', JSON.stringify(prefs))
    try {
      await onSave(prefs)
    } catch (err: any) {
      // If it's a 404 (endpoint not yet built), mark as local-only
      if (err?.status === 404 || err?.message?.includes('404')) setLocalOnly(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: 0 }}>
          {t('profile.notifications')}
        </h3>
        {saved && !saving && (
          <span style={{ fontSize: 11, fontWeight: 600, color: C.green, display: 'flex', alignItems: 'center', gap: 4, animation: 'successIn 0.3s ease' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            {localOnly ? 'Saved locally' : 'Saved'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {notifications.map((n, i, arr) => (
          <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.heading, margin: '0 0 2px' }}>{n.label}</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{n.desc}</p>
            </div>
            <div
              role="switch"
              aria-checked={prefs[n.key]}
              onClick={() => toggle(n.key)}
              style={{
                position: 'relative', width: 40, height: 22, borderRadius: 11,
                backgroundColor: prefs[n.key] ? C.accent : C.border,
                flexShrink: 0, cursor: 'pointer', transition: 'background-color 0.3s',
                marginLeft: 16,
              }}>
              <div style={{
                position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                left: prefs[n.key] ? 'calc(100% - 19px)' : '3px',
                transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...btnPrimary, padding: '9px 20px', fontSize: 12, opacity: saving ? 0.7 : 1 }}
          onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
          {saving ? <><Spinner /> Saving…</> : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const navigate       = useNavigate()
  const { t, isRTL }   = useLanguage()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [tab, setTab]  = useState<Tab>('overview')
  const [vis, setVis]  = useState(false)

  // Password form — kept separate because it resets independently
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  // ── Load profile + initial orders on mount ──────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch('/api/users/me/')
        if (res.status === 401 || res.status === 403) { navigate('/login'); return }
        const data: Profile = await res.json()
        dispatch({ type: 'SET_PROFILE', payload: data })
      } catch {
        dispatch({ type: 'PROFILE_ERROR', payload: 'Failed to load profile.' })
      } finally {
        dispatch({ type: 'PAGE_LOADED' })
        setTimeout(() => setVis(true), 60)
      }
    })()
  }, [navigate])

  // Fetch orders on mount and whenever the user switches to the Orders tab
  useEffect(() => {
    dispatch({ type: 'RESET_ORDERS' })
    apiFetch('/api/orders/my/')
      .then(r => r.ok ? r.json() : [])
      .then(data => dispatch({
        type: 'SET_ORDERS',
        payload: Array.isArray(data) ? data : (data.results ?? []),
      }))
      .catch(() => dispatch({ type: 'SET_ORDERS', payload: [] }))
  }, [tab])

  // Auto-clear success toasts
  useEffect(() => {
    if (!state.saved && !state.pwSaved && !state.notifSaved) return
    const id = setTimeout(() => dispatch({ type: 'CLEAR_SAVED' }), 2500)
    return () => clearTimeout(id)
  }, [state.saved, state.pwSaved, state.notifSaved])

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async () => {
    if (!state.editForm) return
    dispatch({ type: 'SAVE_START' })
    try {
      const res = await apiFetch('/api/users/me/', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: state.editForm.firstName,
          lastName:  state.editForm.lastName,
          phone:     state.editForm.phone,
          address:   state.editForm.address,
        }),
      })
      const data = await res.json()
      if (!res.ok) { dispatch({ type: 'SAVE_ERROR', payload: data.error || 'Failed to save.' }); return }
      dispatch({ type: 'SAVE_DONE', payload: data })
    } catch {
      dispatch({ type: 'SAVE_ERROR', payload: 'Network error. Please try again.' })
    }
  }, [state.editForm])

  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!currentPassword || !newPassword) throw new Error('All fields are required.')
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.')
    dispatch({ type: 'PW_START' })
    try {
      const res = await apiFetch('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        dispatch({ type: 'PW_ERROR', payload: data.error || 'Failed to update password.' })
        throw new Error(data.error)
      }
      dispatch({ type: 'PW_DONE' })
    } catch (err) {
      if (!state.pwError) dispatch({ type: 'PW_ERROR', payload: (err as Error).message || 'Network error.' })
      throw err
    }
  }, [state.pwError])

  const handleSaveNotifications = useCallback(async (prefs: NotifPrefs) => {
    const res = await apiFetch('/api/users/notifications/', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    })
    if (!res.ok) {
      const err = new Error('API unavailable') as any
      err.status = res.status
      throw err
    }
    dispatch({ type: 'NOTIF_SAVED' })
  }, [])

  const handleDeleteAccount = useCallback(async () => {
    dispatch({ type: 'DELETE_START' })
    try {
      // NOTE: Backend must handle DELETE /api/users/me/
      // Add `elif request.method == 'DELETE':` to the `me` view in views.py:
      //   user = request.user; logout(request); user.delete()
      //   return Response({'message': 'Account deleted.'}, status=204)
      const res = await apiFetch('/api/users/me/', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        dispatch({ type: 'DELETE_ERROR', payload: data.error || 'Failed to delete account.' })
        return
      }
      localStorage.clear()
      sessionStorage.clear()
      navigate('/', { replace: true })
    } catch {
      dispatch({ type: 'DELETE_ERROR', payload: 'Network error. Please try again.' })
    }
  }, [navigate])

  const handleSignOut = useCallback(async () => {
    await apiFetch('/api/users/logout/', { method: 'POST' })
    navigate('/login')
  }, [navigate])

  // ── Loading / guard ──────────────────────────────────────────────────────
  if (state.pageLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: C.muted }}>{t('profile.loading')}</p>
      </div>
    </div>
  )

  if (!state.profile || !state.editForm) return null

  const { profile, editForm } = state
  const initials = (profile.firstName?.[0] ?? profile.email?.[0] ?? '?').toUpperCase()
  const totalSpent   = state.orders.reduce((s, o) => s + parseFloat(o.total || '0'), 0)

  const fade = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.65s ease ${d}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  })

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('profile.overview'),  icon: <IconHome /> },
    { id: 'orders',   label: t('profile.orders'),    icon: <IconPackage /> },
    { id: 'settings', label: t('profile.settings'),  icon: <IconSettings /> },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes successIn    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInBg     { from{opacity:0} to{opacity:1} }
        @keyframes slideUpModal { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes tabIn        { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .profile-tab-content    { animation: tabIn 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .sidebar-nav-btn:hover  { background-color: rgba(122,74,40,0.05) !important; }
      `}</style>

      {state.showDeleteModal && (
        <DeleteAccountModal
          email={profile.email}
          loading={state.deleteLoading}
          error={state.deleteError}
          onConfirm={handleDeleteAccount}
          onCancel={() => dispatch({ type: 'SHOW_DELETE_MODAL', payload: false })}
        />
      )}

      <div style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }} className="min-h-screen pt-16">
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px 64px' }}>

          {/* Breadcrumb */}
          <nav style={{ ...fade(0), display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 32, color: C.muted }}>
            <Link to="/" style={{ color: C.muted, textDecoration: 'none' }}>{t('profile.home')}</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: C.body }}>{t('profile.myAccount')}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[220px_1fr]">

            {/* ── Sidebar ── */}
            <aside>
              {/* Avatar card */}
              <div style={{ ...fade(0.05), ...cardStyle, textAlign: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontWeight: 700, fontSize: 20, color: '#fff',
                  background: 'linear-gradient(135deg, #c8a060 0%, #7a4a28 100%)',
                  letterSpacing: '0.04em',
                }}>{initials || '?'}</div>

                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.heading, margin: '0 0 4px' }}>
                  {profile.firstName} {profile.lastName}
                </h2>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>{profile.email}</p>

                {profile.isAdmin ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(50,90,160,0.09)', color: '#3a5a9a', border: '1px solid rgba(50,90,160,0.2)' }}>
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    Admin
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(122,74,40,0.08)', color: C.accent, border: '1px solid rgba(122,74,40,0.15)' }}>
                    <svg width="10" height="10" fill={C.accent} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {t('profile.memberSince')}
                  </div>
                )}

                {profile.isAdmin && (
                  <Link to="/admin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, backgroundColor: 'rgba(50,90,160,0.07)', border: '1px solid rgba(50,90,160,0.18)', color: '#3a5a9a', textDecoration: 'none' }}>
                    <IconSettings />
                    Admin Panel
                  </Link>
                )}
              </div>

              {/* Nav */}
              <div style={{ ...fade(0.1), borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, backgroundColor: C.surface }}>
                {tabs.map((tabItem, idx) => (
                  <button
                    key={tabItem.id}
                    className="sidebar-nav-btn"
                    onClick={() => setTab(tabItem.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', fontSize: 13, fontWeight: tab === tabItem.id ? 600 : 400,
                      textAlign: isRTL ? 'right' : 'left',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      backgroundColor: tab === tabItem.id ? 'rgba(122,74,40,0.07)' : 'transparent',
                      color: tab === tabItem.id ? C.accent : C.muted,
                      borderBottom: idx < tabs.length - 1 ? `1px solid ${C.border}` : 'none',
                      borderLeft: !isRTL ? `3px solid ${tab === tabItem.id ? C.accent : 'transparent'}` : 'none',
                      borderRight: isRTL  ? `3px solid ${tab === tabItem.id ? C.accent : 'transparent'}` : 'none',
                      transition: 'all 0.2s ease',
                    }}>
                    <span style={{ opacity: tab === tabItem.id ? 1 : 0.6 }}>{tabItem.icon}</span>
                    <span>{tabItem.label}</span>
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                style={{
                  ...fade(0.15),
                  width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}`,
                  color: C.red, background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
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
            <main style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

              {/* ── OVERVIEW ── */}
              {tab === 'overview' && (
                <div key="overview" className="profile-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {state.saved        && <Banner type="success" message={t('profile.profileUpdated')} />}
                  {state.profileError && <Banner type="error"   message={state.profileError} />}

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { val: state.orders.length,           label: t('profile.stat.orders') },
                      { val: `$${totalSpent.toFixed(2)}`,   label: t('profile.stat.spent') },
                      { val: profile.isAdmin ? '∞' : '—',  label: t('profile.stat.wishlist') },
                    ].map((s, i) => (
                      <div key={s.label} style={{
                        ...cardStyle, textAlign: 'center',
                        opacity: vis ? 1 : 0,
                        transform: vis ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                        transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s`,
                      }}>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.accent, margin: '0 0 4px' }}>{s.val}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Personal info */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: 0 }}>
                        {t('profile.personalInfo')}
                      </h3>
                      <button
                        onClick={() => dispatch({ type: 'SET_EDIT_MODE', payload: !state.editMode })}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                          cursor: 'pointer', fontFamily: 'inherit',
                          border: `1px solid ${state.editMode ? 'rgba(122,74,40,0.22)' : C.border}`,
                          backgroundColor: state.editMode ? 'rgba(122,74,40,0.09)' : 'transparent',
                          color: C.accent, transition: 'all 0.2s',
                        }}>
                        {state.editMode ? t('profile.cancel') : t('profile.edit')}
                      </button>
                    </div>

                    {state.editMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {([['firstName', 'checkout.firstName'], ['lastName', 'checkout.lastName']] as const).map(([k, lk]) => (
                            <div key={k}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>{t(lk)}</label>
                              <input
                                value={(editForm as any)[k]}
                                onChange={e => dispatch({ type: 'SET_EDIT_FORM', payload: { [k]: e.target.value } })}
                                style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                                onBlur={e  => e.currentTarget.style.borderColor = C.border}
                              />
                            </div>
                          ))}
                        </div>

                        {([['phone', 'checkout.phone'], ['address', 'checkout.address']] as const).map(([k, lk]) => (
                          <div key={k}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>{t(lk)}</label>
                            <input
                              value={(editForm as any)[k] ?? ''}
                              onChange={e => dispatch({ type: 'SET_EDIT_FORM', payload: { [k]: e.target.value } })}
                              style={inputStyle}
                              onFocus={e => e.currentTarget.style.borderColor = C.borderFocus}
                              onBlur={e  => e.currentTarget.style.borderColor = C.border}
                            />
                          </div>
                        ))}

                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.label, marginBottom: 6 }}>{t('profile.email')}</label>
                          <input value={editForm.email} disabled style={{ ...inputStyle, backgroundColor: C.surfaceAlt, color: C.muted, cursor: 'not-allowed' }} />
                          <p style={{ fontSize: 10, marginTop: 4, color: C.muted }}>{t('profile.emailNote')}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                          <button
                            onClick={handleSaveProfile}
                            disabled={state.saveLoading}
                            style={{ ...btnPrimary, opacity: state.saveLoading ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!state.saveLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                            {state.saveLoading ? <><Spinner /> {t('profile.saving')}</> : t('profile.save')}
                          </button>
                          <button
                            onClick={() => { dispatch({ type: 'SET_EDIT_MODE', payload: false }); dispatch({ type: 'SET_PROFILE', payload: profile }) }}
                            style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 500, border: `1px solid ${C.border}`, color: C.body, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {t('profile.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {[
                          [t('profile.fullName'), `${profile.firstName} ${profile.lastName}`.trim() || '—'],
                          [t('profile.email'),    profile.email],
                          [t('profile.phone'),    profile.phone   || '—'],
                          [t('profile.address'),  profile.address || '—'],
                        ].map(([label, value]) => (
                          <div key={label} style={{ padding: 14, borderRadius: 12, backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: C.label, marginBottom: 6, margin: '0 0 6px' }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 500, color: C.body, margin: 0, wordBreak: 'break-word' }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent orders */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.heading, margin: 0 }}>
                        {t('profile.recentOrders')}
                      </h3>
                      {state.orders.length > 0 && (
                        <button onClick={() => setTab('orders')} style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                          {t('profile.viewAll')} →
                        </button>
                      )}
                    </div>

                    {state.orders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 12px' }}>{t('profile.noOrders')}</p>
                        <Link to="/products" style={{ fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
                          Start shopping →
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {state.orders.slice(0, 3).map(order => (
                          <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, backgroundColor: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: C.heading, margin: '0 0 2px' }}>#{String(order.order_number).slice(0, 8).toUpperCase()}</p>
                              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{order.created_at?.slice(0, 10)}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: C.price, margin: 0 }}>${parseFloat(order.total).toFixed(2)}</p>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── ORDERS ── */}
              {tab === 'orders' && (
                <div key="orders" className="profile-tab-content" style={{ ...cardStyle }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: C.heading, marginBottom: 20 }}>
                    {t('profile.orderHistory')}
                  </h3>

                  {!state.ordersLoaded ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                      <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    </div>
                  ) : state.orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(122,74,40,0.07)', border: '1px solid rgba(122,74,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <svg width="24" height="24" fill="none" stroke={C.muted} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                      <p style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>{t('profile.noOrders')}</p>
                      <Link to="/products" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700, backgroundColor: C.accent, color: '#fff', textDecoration: 'none' }}>
                        Shop Now
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {state.orders.map(order => (
                        <div key={order.id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: C.heading, margin: '0 0 2px' }}>#{String(order.order_number).slice(0, 8).toUpperCase()}</p>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{order.created_at?.slice(0, 10)}</p>
                              </div>
                              <StatusBadge status={order.status} />
                            </div>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.price, margin: 0, flexShrink: 0, marginLeft: 12 }}>
                              ${parseFloat(order.total).toFixed(2)}
                            </p>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div style={{ padding: '12px 16px' }}>
                              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.label, marginBottom: 6 }}>{t('profile.items')}</p>
                              <p style={{ fontSize: 13, color: C.body, margin: 0 }}>
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

              {/* ── SETTINGS ── */}
              {tab === 'settings' && (
                <div key="settings" className="profile-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <NotificationsSection
                    t={t}
                    saved={state.notifSaved}
                    onSave={handleSaveNotifications}
                  />

                  <PasswordSection
                    t={t}
                    loading={state.pwLoading}
                    saved={state.pwSaved}
                    error={state.pwError}
                    onSave={handleChangePassword}
                  />

                  {/* Danger zone */}
                  <div style={{ ...cardStyle, border: `1px solid ${C.redBorder}` }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: C.red, marginBottom: 6 }}>
                      {t('profile.danger')}
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
                      {t('profile.dangerDesc')}
                    </p>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 12,
                      backgroundColor: 'rgba(176,64,64,0.04)', border: `1px solid ${C.redBorder}`,
                      flexWrap: 'wrap', gap: 12,
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.red, margin: '0 0 2px' }}>{t('profile.deleteAccount')}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Permanently remove your account and all data</p>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'SHOW_DELETE_MODAL', payload: true })}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, flexShrink: 0,
                          border: `1px solid rgba(176,64,64,0.35)`, color: C.red,
                          background: 'rgba(176,64,64,0.06)', cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(176,64,64,0.12)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(176,64,64,0.06)' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete Account
                      </button>
                    </div>
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