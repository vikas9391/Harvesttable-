// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/Languagecontext';
import ProductImage from '../components/ProductImage';

const C = {
  bg: '#faf7f2', surface: '#ffffff', border: '#ede5d8', borderHov: '#c8a882',
  borderErr: '#e08070',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878',
  accent: '#7a4a28', accentHov: '#8f5830', label: '#9a6840',
  accentBtn: '#7a4a28', accentBtnHov: '#8f5830',
  success: '#3a6028', successLight: 'rgba(58,96,40,0.12)',
  infoBlue: 'rgba(30,58,100,0.08)', infoBlueBorder: 'rgba(50,80,160,0.18)', infoBlueText: '#4a6898',
  errorBg: 'rgba(176,64,64,0.08)', errorBorder: 'rgba(176,64,64,0.2)', errorText: '#b04040',
};

function getCsrfToken(): string {
  for (const cookie of document.cookie.split(';')) {
    const [k, v] = cookie.trim().split('=');
    if (k === 'csrftoken') return decodeURIComponent(v ?? '');
  }
  return '';
}

const INITIAL_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', country: '', postal: '',
  card: '', expiry: '', cvc: '', cardName: '',
};

type PaymentMethod = 'card' | 'cod';

function validateStep1(f: typeof INITIAL_FORM): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.firstName.trim())  e.firstName = 'Required';
  if (!f.lastName.trim())   e.lastName  = 'Required';
  if (!f.email.trim())      e.email     = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (!f.phone.trim())      e.phone     = 'Required';
  if (!f.address.trim())    e.address   = 'Required';
  if (!f.city.trim())       e.city      = 'Required';
  if (!f.country)           e.country   = 'Please select a country';
  if (!f.postal.trim())     e.postal    = 'Required';
  return e;
}

function validateStep3Card(f: typeof INITIAL_FORM): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.card.trim())     e.card    = 'Required';
  else if (f.card.replace(/\s/g, '').length < 13) e.card = 'Enter a valid card number';
  if (!f.expiry.trim())   e.expiry  = 'Required';
  else if (!/^\d{2}[\s/]\d{2}$/.test(f.expiry))  e.expiry = 'Use MM/YY format';
  if (!f.cvc.trim())      e.cvc     = 'Required';
  else if (!/^\d{3,4}$/.test(f.cvc))              e.cvc    = '3–4 digits';
  if (!f.cardName.trim()) e.cardName = 'Required';
  return e;
}

// ─── InputField — outside parent to prevent focus loss on re-render ───────────
interface InputFieldProps {
  label: string; fieldKey: string; type?: string; placeholder?: string;
  value: string; error?: string; isRTL: boolean;
  onChange: (key: string, value: string) => void;
}
const InputField: React.FC<InputFieldProps> = ({ label, fieldKey, type = 'text', placeholder = '', value, error, isRTL, onChange }) => {
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: "'Jost', sans-serif",
    backgroundColor: C.surface, color: C.heading,
    border: `1px solid ${error ? C.borderErr : C.border}`,
    transition: 'border-color 0.2s', direction: isRTL ? 'rtl' : 'ltr',
  };
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: error ? C.errorText : C.label, marginBottom: 6, fontFamily: "'Jost', sans-serif", textTransform: 'uppercase' }}>
        {label} <span style={{ color: C.errorText }}>*</span>
      </label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(fieldKey, e.target.value)} style={iStyle}
        onFocus={e => { if (!error) e.currentTarget.style.borderColor = C.borderHov; }}
        onBlur={e => { if (!error) e.currentTarget.style.borderColor = C.border; }}
      />
      {error && (
        <p style={{ fontSize: 11, color: C.errorText, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// ─── PaymentMethodSelector — outside parent for same reason ───────────────────
interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selected, onChange }) => {
  const methods: { id: PaymentMethod; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      id: 'card', title: 'Credit / Debit Card', desc: 'Pay securely with your card',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path strokeLinecap="round" d="M2 10h20"/>
          <path strokeLinecap="round" strokeWidth="2.5" d="M6 15h2M10 15h4"/>
        </svg>
      ),
    },
    {
      id: 'cod', title: 'Cash on Delivery', desc: 'Pay when your order arrives',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
          <rect x="9" y="11" width="12" height="10" rx="2"/>
          <circle cx="15" cy="16" r="2"/>
        </svg>
      ),
    },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {methods.map(m => {
        const active = selected === m.id;
        return (
          <button key={m.id} type="button" onClick={() => onChange(m.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
            fontFamily: "'Jost', sans-serif", textAlign: 'left',
            border: `2px solid ${active ? C.accent : C.border}`,
            backgroundColor: active ? 'rgba(122,74,40,0.06)' : C.surface,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = C.borderHov; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
          >
            {/* Radio dot */}
            <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {active && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.accent }} />}
            </div>
            {/* Icon */}
            <span style={{ color: active ? C.accent : C.muted, display: 'flex', flexShrink: 0 }}>{m.icon}</span>
            {/* Text */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: active ? C.accent : C.heading, margin: '0 0 2px' }}>{m.title}</p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{m.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─── CheckoutPage ─────────────────────────────────────────────────────────────
const CheckoutPage: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { t, isRTL } = useLanguage();

  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [placed, setPlaced]           = useState(false);
  const [vis, setVis]                 = useState(false);
  const [orderNum, setOrderNum]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm]               = useState(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const setField = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  useEffect(() => {
    const t2 = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(t2);
  }, []);

  const shippingFree = totalPrice >= 50;
  const shippingCost = shippingFree ? 0 : 5.99;
  const grandTotal   = totalPrice + shippingCost;

  const handleContinueToReview = () => {
    const errors = validateStep1(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    // Card requires field validation; COD skips it entirely
    if (paymentMethod === 'card') {
      const errors = validateStep3Card(form);
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    }
    setFieldErrors({});
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      email:         form.email,
      full_name:     `${form.firstName} ${form.lastName}`.trim(),
      phone:         form.phone,
      address_line1: form.address,
      address_line2: '',
      city:          form.city,
      state:         '',
      postal_code:   form.postal,
      country:       form.country,
      // Pass payment method in notes so the backend/admin can see it
      notes: paymentMethod === 'cod' ? 'Payment method: Cash on Delivery' : 'Payment method: Card',
      items: items.map(i => ({ product: i.product.id, quantity: i.quantity })),
    };

    try {
      const res = await fetch('/api/orders/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setOrderNum(String(data.order_number).slice(0, 8).toUpperCase());
      clearCart();
      setPlaced(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fade = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${d}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  });

  const btnPrimary: React.CSSProperties = {
    padding: '14px 0', backgroundColor: C.accentBtn, borderRadius: 2, color: '#f5ede0',
    fontWeight: 600, fontSize: 11, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
    fontFamily: "'Jost', sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase',
    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', opacity: submitting ? 0.7 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };
  const btnSecondary: React.CSSProperties = {
    padding: '12px 0', border: `1px solid ${C.border}`, color: C.muted,
    background: C.surface, borderRadius: 2, cursor: 'pointer',
    fontSize: 11, fontFamily: "'Jost', sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase',
    transition: 'all 0.2s',
  };

  const steps = [t('checkout.step1'), t('checkout.step2'), t('checkout.step3')];

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0 && !placed) return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 24px', borderRadius: '50%', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" fill="none" stroke={C.muted} strokeWidth="1.4" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.heading, marginBottom: 12 }}>{t('checkout.cartEmpty')}</h2>
        <p style={{ color: C.muted, marginBottom: 28, fontSize: 14 }}>{t('checkout.cartEmptyDesc')}</p>
        <Link to="/products" style={{ padding: '12px 32px', backgroundColor: C.accentBtn, borderRadius: 2, color: '#f5ede0', fontWeight: 700, textDecoration: 'none', fontSize: 11, fontFamily: "'Jost', sans-serif", letterSpacing: '0.18em', textTransform: 'uppercase', display: 'inline-block' }}>
          {t('checkout.shopNow')}
        </Link>
      </div>
    </div>
  );

  // ── Success screen ────────────────────────────────────────────────────────
  if (placed) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes successPop { 0%{opacity:0;transform:scale(0.6)} 60%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{ backgroundColor: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, paddingTop: 80 }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, backgroundColor: C.successLight, border: '1px solid rgba(58,96,40,0.28)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'successPop 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <svg width="36" height="36" fill="none" stroke="#3a6028" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: C.heading, marginBottom: 8, animation: 'fadeUp 0.6s ease 0.3s both' }}>{t('checkout.orderPlaced')}</h1>
          <p style={{ color: C.muted, marginBottom: 8, animation: 'fadeUp 0.6s ease 0.4s both' }}>{t('checkout.thankYou')}</p>
          {orderNum && <p style={{ color: C.accent, fontFamily: 'monospace', fontSize: 13, marginBottom: 16, animation: 'fadeUp 0.6s ease 0.5s both' }}>#{orderNum}</p>}

          {/* COD reminder */}
          {paymentMethod === 'cod' && (
            <div style={{ margin: '0 auto 20px', padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(122,74,40,0.07)', border: `1px solid rgba(122,74,40,0.18)`, animation: 'fadeUp 0.6s ease 0.55s both', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <svg width="20" height="20" fill="none" stroke={C.accent} strokeWidth="1.7" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
                <rect x="9" y="11" width="12" height="10" rx="2"/>
                <circle cx="15" cy="16" r="2"/>
              </svg>
              <p style={{ fontSize: 13, color: C.accent, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                Please have <strong>${grandTotal.toFixed(2)}</strong> ready to pay upon delivery.
              </p>
            </div>
          )}

          <p style={{ color: C.muted, fontSize: 13, marginBottom: 28, animation: 'fadeUp 0.6s ease 0.6s both' }}>
            {t('checkout.confirmEmail', { email: form.email })}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.7s both' }}>
            <Link to="/products" style={{ padding: '12px 28px', backgroundColor: C.accentBtn, borderRadius: 2, color: '#f5ede0', fontWeight: 600, textDecoration: 'none', fontSize: 11, fontFamily: "'Jost', sans-serif", letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {t('checkout.continueShopping')}
            </Link>
            <Link to="/profile" style={{ padding: '12px 28px', border: `1px solid ${C.border}`, borderRadius: 2, color: C.body, textDecoration: 'none', fontSize: 11, fontFamily: "'Jost', sans-serif", letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  // ── Main checkout ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Jost:wght@200;300;400;500;600&display=swap');
        @keyframes stepSlide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ backgroundColor: C.bg, minHeight: '100vh', paddingTop: 64, paddingBottom: 48, fontFamily: "'Jost', sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

          {/* Breadcrumb */}
          <nav style={{ ...fade(0), display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, marginBottom: 32, letterSpacing: '0.08em' }}>
            <Link to="/" style={{ color: C.muted, textDecoration: 'none' }}>{t('common.home')}</Link>
            <span>/</span>
            <Link to="/products" style={{ color: C.muted, textDecoration: 'none' }}>{t('common.shop')}</Link>
            <span>/</span>
            <span style={{ color: C.body }}>{t('checkout.title')}</span>
          </nav>

          <div style={{ overflow: 'hidden', marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: C.heading, fontWeight: 600, margin: 0, transform: vis ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.85s cubic-bezier(0.22,1,0.36,1) 0.1s' }}>
              {t('checkout.title')}
            </h1>
          </div>

          {/* Steps indicator */}
          <div style={{ ...fade(0.15), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: step > i + 1 ? C.success : step === i + 1 ? C.accent : C.muted, transition: 'color 0.3s' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, backgroundColor: step > i + 1 ? C.successLight : step === i + 1 ? 'rgba(122,74,40,0.10)' : C.surface, border: `1.5px solid ${step > i + 1 ? 'rgba(58,96,40,0.4)' : step === i + 1 ? C.borderHov : C.border}`, transition: 'all 0.3s ease', fontFamily: "'Jost', sans-serif" }}>
                    {step > i + 1
                      ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : i + 1}
                  </div>
                  <span style={{ fontSize: 12, letterSpacing: '0.08em' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, maxWidth: 48, backgroundColor: step > i + 1 ? 'rgba(58,96,40,0.3)' : C.border, transition: 'background-color 0.4s' }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
            <div>

              {/* ── STEP 1: Shipping ── */}
              {step === 1 && (
                <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, animation: 'stepSlide 0.45s cubic-bezier(0.22,1,0.36,1) both', boxShadow: '0 2px 12px rgba(122,74,40,0.05)' }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.heading, marginBottom: 24, fontWeight: 600 }}>{t('checkout.shippingInfo')}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <InputField label={t('checkout.firstName')} fieldKey="firstName" value={form.firstName} error={fieldErrors.firstName} isRTL={isRTL} onChange={setField} />
                      <InputField label={t('checkout.lastName')}  fieldKey="lastName"  value={form.lastName}  error={fieldErrors.lastName}  isRTL={isRTL} onChange={setField} />
                    </div>
                    <InputField label={t('checkout.email')}   fieldKey="email"   type="email" placeholder="you@example.com" value={form.email}   error={fieldErrors.email}   isRTL={isRTL} onChange={setField} />
                    <InputField label={t('checkout.phone')}   fieldKey="phone"   type="tel"   placeholder="+1 555 000 0000" value={form.phone}   error={fieldErrors.phone}   isRTL={isRTL} onChange={setField} />
                    <InputField label={t('checkout.address')} fieldKey="address"              placeholder="123 Street Name"  value={form.address} error={fieldErrors.address} isRTL={isRTL} onChange={setField} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <InputField label={t('checkout.city')}   fieldKey="city"   value={form.city}   error={fieldErrors.city}   isRTL={isRTL} onChange={setField} />
                      <InputField label={t('checkout.postal')} fieldKey="postal" value={form.postal} error={fieldErrors.postal} isRTL={isRTL} onChange={setField} />
                      <div>
                        <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: fieldErrors.country ? C.errorText : C.label, marginBottom: 6, fontFamily: "'Jost', sans-serif", textTransform: 'uppercase' }}>
                          {t('checkout.country')} <span style={{ color: C.errorText }}>*</span>
                        </label>
                        <select value={form.country} onChange={e => setField('country', e.target.value)}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'Jost', sans-serif", backgroundColor: C.surface, color: C.heading, cursor: 'pointer', border: `1px solid ${fieldErrors.country ? C.borderErr : C.border}`, transition: 'border-color 0.2s' }}
                          onFocus={e => { if (!fieldErrors.country) e.currentTarget.style.borderColor = C.borderHov; }}
                          onBlur={e => { if (!fieldErrors.country) e.currentTarget.style.borderColor = C.border; }}>
                          <option value="">{t('checkout.select')}</option>
                          {['Morocco','United States','United Kingdom','France','Germany','Spain','Canada','Australia'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {fieldErrors.country && <p style={{ fontSize: 11, color: C.errorText, margin: '4px 0 0' }}>{fieldErrors.country}</p>}
                      </div>
                    </div>
                    {Object.keys(fieldErrors).length > 0 && (
                      <div style={{ padding: '10px 14px', backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 12 }}>
                        Please fill in all required fields correctly.
                      </div>
                    )}
                    <button onClick={handleContinueToReview} style={{ ...btnPrimary, marginTop: 8 }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = C.accentBtnHov; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 28px rgba(122,74,40,0.22)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = C.accentBtn; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}>
                      {t('checkout.continueReview')} →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Review ── */}
              {step === 2 && (
                <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, animation: 'stepSlide 0.45s cubic-bezier(0.22,1,0.36,1) both', boxShadow: '0 2px 12px rgba(122,74,40,0.05)' }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.heading, marginBottom: 20, fontWeight: 600 }}>{t('checkout.reviewOrder')}</h2>
                  <div style={{ marginBottom: 24 }}>
                    {items.map((item, idx) => (
                      <div key={item.product.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: idx < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <ProductImage type={item.product.imageType} name={item.product.name} className="w-12 h-12 rounded-lg flex-shrink-0" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: C.heading, fontSize: 13, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</p>
                          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Qty: {item.quantity}</p>
                        </div>
                        <span style={{ color: C.accent, fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'Cormorant Garamond', serif" }}>
                          ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor: '#f7f2ea', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                      <span>{t('checkout.shipTo')}:</span><span style={{ color: C.body }}>{form.firstName} {form.lastName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                      <span>Email:</span><span style={{ color: C.body }}>{form.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                      <span>{t('checkout.addressLabel')}:</span>
                      <span style={{ color: C.body, textAlign: 'right', maxWidth: '60%' }}>{form.address}, {form.city}, {form.postal}, {form.country}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setStep(1)} style={{ ...btnSecondary, flex: 1 }}>← {t('checkout.backBtn')}</button>
                    <button onClick={() => setStep(3)} style={{ ...btnPrimary, flex: 1 }}>{t('checkout.continuePayment')} →</button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Payment ── */}
              {step === 3 && (
                <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, animation: 'stepSlide 0.45s cubic-bezier(0.22,1,0.36,1) both', boxShadow: '0 2px 12px rgba(122,74,40,0.05)' }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.heading, marginBottom: 20, fontWeight: 600 }}>{t('checkout.payment')}</h2>

                  {/* ── Payment method toggle ── */}
                  <PaymentMethodSelector
                    selected={paymentMethod}
                    onChange={m => { setPaymentMethod(m); setFieldErrors({}); setSubmitError(''); }}
                  />

                  <div style={{ height: 1, backgroundColor: C.border, marginBottom: 20 }} />

                  {/* ── Card fields ── */}
                  {paymentMethod === 'card' && (
                    <>
                      <div style={{ padding: 12, backgroundColor: C.infoBlue, border: `1px solid ${C.infoBlueBorder}`, borderRadius: 8, marginBottom: 20, color: C.infoBlueText, fontSize: 12, fontFamily: "'Jost', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        {t('checkout.demoMode')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <InputField label={t('checkout.cardNumber')} fieldKey="card"     placeholder="4242 4242 4242 4242" value={form.card}     error={fieldErrors.card}     isRTL={isRTL} onChange={setField} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <InputField label={t('checkout.expiry')} fieldKey="expiry" placeholder="MM / YY" value={form.expiry} error={fieldErrors.expiry} isRTL={isRTL} onChange={setField} />
                          <InputField label={t('checkout.cvc')}    fieldKey="cvc"    placeholder="123"     value={form.cvc}    error={fieldErrors.cvc}    isRTL={isRTL} onChange={setField} />
                        </div>
                        <InputField label={t('checkout.cardName')} fieldKey="cardName" placeholder="Jane Smith" value={form.cardName} error={fieldErrors.cardName} isRTL={isRTL} onChange={setField} />
                      </div>
                      {Object.keys(fieldErrors).length > 0 && (
                        <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 12 }}>
                          Please fill in all payment fields correctly.
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Cash on Delivery info panel ── */}
                  {paymentMethod === 'cod' && (
                    <div style={{ padding: 20, backgroundColor: 'rgba(122,74,40,0.05)', border: `1px solid rgba(122,74,40,0.15)`, borderRadius: 12 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(122,74,40,0.10)', border: `1px solid rgba(122,74,40,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="22" height="22" fill="none" stroke={C.accent} strokeWidth="1.7" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
                            <rect x="9" y="11" width="12" height="10" rx="2"/>
                            <circle cx="15" cy="16" r="2"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.heading, margin: '0 0 6px' }}>Pay on Delivery</p>
                          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 14px', lineHeight: 1.7 }}>
                            No payment needed right now. Our delivery agent will collect{' '}
                            <strong style={{ color: C.accent }}>${grandTotal.toFixed(2)}</strong> when your order arrives.
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                              'Have the exact amount ready if possible',
                              'A receipt will be provided upon delivery',
                              'Order can be cancelled before dispatch',
                            ].map((tip, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: C.successLight, border: '1px solid rgba(58,96,40,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="10" height="10" fill="none" stroke={C.success} strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                </div>
                                <span style={{ fontSize: 12, color: C.body }}>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 13 }}>
                      ⚠ {submitError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button onClick={() => { setStep(2); setFieldErrors({}); setSubmitError(''); }} style={{ ...btnSecondary, flex: 1 }} disabled={submitting}>
                      ← {t('checkout.backBtn')}
                    </button>
                    <button onClick={handlePlaceOrder} disabled={submitting} style={{ ...btnPrimary, flex: 1 }}>
                      {submitting
                        ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Placing Order…</>
                        : paymentMethod === 'cod'
                          ? <>Place Order · Pay ${grandTotal.toFixed(2)} on Delivery</>
                          : <>{t('checkout.placeOrder')} · ${grandTotal.toFixed(2)}</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Order summary sidebar ── */}
            <div style={{ ...fade(0.3), backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, position: 'sticky', top: 88, boxShadow: '0 2px 12px rgba(122,74,40,0.05)' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: C.heading, marginBottom: 20, fontWeight: 600 }}>{t('checkout.orderSummary')}</h3>
              <div style={{ marginBottom: 16 }}>
                {items.map(i => (
                  <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: C.muted }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{i.product.name} ×{i.quantity}</span>
                    <span style={{ flexShrink: 0 }}>${(parseFloat(i.product.price) * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8 }}>
                  <span>{t('checkout.subtotal')}</span><span>${totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8 }}>
                  <span>{t('checkout.shipping')}</span>
                  <span style={{ color: shippingFree ? C.success : C.muted }}>
                    {shippingFree ? t('checkout.shippingFree') : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {/* Live payment method badge */}
                {step === 3 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: C.muted, marginBottom: 10 }}>
                    <span>Payment</span>
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600, backgroundColor: paymentMethod === 'cod' ? 'rgba(122,74,40,0.09)' : 'rgba(50,80,160,0.08)', color: paymentMethod === 'cod' ? C.accent : '#4a6898', border: `1px solid ${paymentMethod === 'cod' ? 'rgba(122,74,40,0.2)' : 'rgba(50,80,160,0.18)'}` }}>
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <span style={{ color: C.body }}>{t('checkout.grandTotal')}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.accent }}>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;