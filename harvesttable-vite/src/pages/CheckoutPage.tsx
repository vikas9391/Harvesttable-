// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart, CartGiftBox, GuestGiftBox } from '../context/CartContext';
import { useLanguage } from '../context/Languagecontext';
import { Product } from '../types';
import ProductImage from '../components/ProductImage';
import { apiFetch } from '../lib/api';


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

// ── Country data ───────────────────────────────────────────────────────────────
const COUNTRIES_RAW: [string, string, string][] = [
  ['Algeria','Algérie','الجزائر'],['Egypt','Égypte','مصر'],['Ethiopia','Éthiopie','إثيوبيا'],
  ['Ghana','Ghana','غانا'],['Ivory Coast',"Côte d'Ivoire",'ساحل العاج'],['Kenya','Kenya','كينيا'],
  ['Libya','Libye','ليبيا'],['Morocco','Maroc','المغرب'],['Nigeria','Nigéria','نيجيريا'],
  ['Senegal','Sénégal','السنغال'],['South Africa','Afrique du Sud','جنوب أفريقيا'],
  ['Sudan','Soudan','السودان'],['Tanzania','Tanzanie','تنزانيا'],['Tunisia','Tunisie','تونس'],
  ['Uganda','Ouganda','أوغندا'],['Argentina','Argentine','الأرجنتين'],['Brazil','Brésil','البرازيل'],
  ['Canada','Canada','كندا'],['Chile','Chili','تشيلي'],['Colombia','Colombie','كولومبيا'],
  ['Mexico','Mexique','المكسيك'],['Peru','Pérou','بيرو'],['United States','États-Unis','الولايات المتحدة'],
  ['Venezuela','Venezuela','فنزويلا'],['Bangladesh','Bangladesh','بنغلاديش'],['China','Chine','الصين'],
  ['India','Inde','الهند'],['Indonesia','Indonésie','إندونيسيا'],['Iran','Iran','إيران'],
  ['Iraq','Irak','العراق'],['Israel','Israël','إسرائيل'],['Japan','Japon','اليابان'],
  ['Jordan','Jordanie','الأردن'],['Kazakhstan','Kazakhstan','كازاخستان'],['Kuwait','Koweït','الكويت'],
  ['Lebanon','Liban','لبنان'],['Malaysia','Malaisie','ماليزيا'],['Oman','Oman','عمان'],
  ['Pakistan','Pakistan','باكستان'],['Philippines','Philippines','الفلبين'],['Qatar','Qatar','قطر'],
  ['Saudi Arabia','Arabie Saoudite','المملكة العربية السعودية'],['Singapore','Singapour','سنغافورة'],
  ['South Korea','Corée du Sud','كوريا الجنوبية'],['Syria','Syrie','سوريا'],['Taiwan','Taïwan','تايوان'],
  ['Thailand','Thaïlande','تايلاند'],['Turkey','Turquie','تركيا'],
  ['United Arab Emirates','Émirats Arabes Unis','الإمارات العربية المتحدة'],
  ['Vietnam','Vietnam','فيتنام'],['Yemen','Yémen','اليمن'],['Austria','Autriche','النمسا'],
  ['Belgium','Belgique','بلجيكا'],['Czech Republic','République Tchèque','جمهورية التشيك'],
  ['Denmark','Danemark','الدنمارك'],['Finland','Finlande','فنلندا'],['France','France','فرنسا'],
  ['Germany','Allemagne','ألمانيا'],['Greece','Grèce','اليونان'],['Hungary','Hongrie','المجر'],
  ['Ireland','Irlande','أيرلندا'],['Italy','Italie','إيطاليا'],['Netherlands','Pays-Bas','هولندا'],
  ['Norway','Norvège','النرويج'],['Poland','Pologne','بولندا'],['Portugal','Portugal','البرتغال'],
  ['Romania','Roumanie','رومانيا'],['Russia','Russie','روسيا'],['Spain','Espagne','إسبانيا'],
  ['Sweden','Suède','السويد'],['Switzerland','Suisse','سويسرا'],['Ukraine','Ukraine','أوكرانيا'],
  ['United Kingdom','Royaume-Uni','المملكة المتحدة'],['Australia','Australie','أستراليا'],
  ['New Zealand','Nouvelle-Zélande','نيوزيلندا'],
];

function getCountries(lang: string): { value: string; label: string }[] {
  const locale = lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en';
  return COUNTRIES_RAW
    .map(([en, fr, ar]) => ({ value: en, label: lang === 'fr' ? fr : lang === 'ar' ? ar : en }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

function localName(product: Product, lang: string): string {
  if (lang === 'fr' && product.name_fr?.trim()) return product.name_fr;
  if (lang === 'ar' && product.name_ar?.trim()) return product.name_ar;
  return product.name;
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

// ─── InputField ───────────────────────────────────────────────────────────────
interface InputFieldProps {
  label: string; fieldKey: string; type?: string; placeholder?: string;
  value: string; error?: string; isRTL: boolean;
  onChange: (key: string, value: string) => void;
}
const InputField: React.FC<InputFieldProps> = ({
  label, fieldKey, type = 'text', placeholder = '', value, error, isRTL, onChange,
}) => {
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

// ─── GiftBoxIcon ──────────────────────────────────────────────────────────────
const GiftBoxIcon = ({ size }: { size: string }) => {
  if (size === 'small') return (
    <svg width="16" height="16" fill="none" stroke={C.accent} strokeWidth="1.4" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>
  );
  if (size === 'large') return (
    <svg width="16" height="16" fill="none" stroke={C.accent} strokeWidth="1.4" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2M2 12h20"/>
    </svg>
  );
  return (
    <svg width="16" height="16" fill="none" stroke={C.accent} strokeWidth="1.4" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6"/>
    </svg>
  );
};

// ─── PaymentMethodSelector ────────────────────────────────────────────────────
interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  t: (key: string) => string;
}
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selected, onChange, t }) => {
  const label = (key: string, fallback: string) => { const v = t(key); return v === key ? fallback : v; };
  const methods: { id: PaymentMethod; icon: React.ReactNode; titleKey: string; descKey: string }[] = [
    {
      id: 'card', titleKey: 'checkout.payCard', descKey: 'checkout.payCardDesc',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path strokeLinecap="round" d="M2 10h20"/>
          <path strokeLinecap="round" strokeWidth="2.5" d="M6 15h2M10 15h4"/>
        </svg>
      ),
    },
    {
      id: 'cod', titleKey: 'checkout.payCOD', descKey: 'checkout.payCODDesc',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
          <rect x="9" y="11" width="12" height="10" rx="2"/><circle cx="15" cy="16" r="2"/>
        </svg>
      ),
    },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {methods.map(m => {
        const active = selected === m.id;
        const title = label(m.titleKey, m.id === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery');
        const desc  = label(m.descKey,  m.id === 'card' ? 'Pay securely with your card' : 'Pay when your order arrives');
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
            <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {active && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.accent }} />}
            </div>
            <span style={{ color: active ? C.accent : C.muted, display: 'flex', flexShrink: 0 }}>{m.icon}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: active ? C.accent : C.heading, margin: '0 0 2px' }}>{title}</p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─── CheckoutPage ─────────────────────────────────────────────────────────────
const CheckoutPage: React.FC = () => {
  const {
    items, totalPrice, clearCart,
    giftBoxes, guestGiftBoxes,
    shippingCost, isFreeShipping,
  } = useCart();
  const { t, lang, isRTL } = useLanguage();

  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [placed, setPlaced]           = useState(false);
  const [vis, setVis]                 = useState(false);
  const [orderNum, setOrderNum]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);   
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm]               = useState(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const countries = getCountries(lang);

  const setField = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  useEffect(() => { const t2 = setTimeout(() => setVis(true), 60); return () => clearTimeout(t2); }, []);

  // ── All gift boxes (server + guest) ──────────────────────────────────────
  const allServerGiftBoxes: CartGiftBox[] = giftBoxes;
  const allGuestGiftBoxes:  GuestGiftBox[] = guestGiftBoxes;
  const hasAnyItems = items.length > 0 || allServerGiftBoxes.length > 0 || allGuestGiftBoxes.length > 0;

  // ── Totals (mirrors CartContext logic) ────────────────────────────────────
  const grandTotal = totalPrice + shippingCost;

  const handleContinueToReview = () => {
    const errors = validateStep1(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'card') {
      const errors = validateStep3Card(form);
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    }
    setFieldErrors({});
    setSubmitting(true);
    setSubmitError('');

    // ── Build gift boxes payload for backend ──────────────────────────────
    const giftBoxesPayload = [
      // Server gift boxes (logged-in user)
      ...allServerGiftBoxes.map(gb => ({
        size:          gb.size,
        packaging_fee: gb.packaging_fee,
        quantity:      gb.quantity,
        items_price:   gb.items_price,
        products:      gb.gift_items.map(gi => ({
          name:  gi.product.name,
          price: gi.product.price,
        })),
      })),
      // Guest gift boxes (just logged in / being merged)
      ...allGuestGiftBoxes.map(gb => ({
        size:          gb.size,
        packaging_fee: String(gb.packaging_fee),
        quantity:      gb.quantity,
        items_price:   String(gb.products.reduce((s, p) => s + parseFloat(p.price), 0)),
        products:      gb.products.map(p => ({
          name:  p.name,
          price: p.price,
        })),
      })),
    ];

    const payload = {
      email:            form.email,
      full_name:        `${form.firstName} ${form.lastName}`.trim(),
      phone:            form.phone,
      address_line1:    form.address,
      address_line2:    '',
      city:             form.city,
      state:            '',
      postal_code:      form.postal,
      country:          form.country,
      notes:            paymentMethod === 'cod' ? 'Payment method: Cash on Delivery' : 'Payment method: Card',
      items:            items.map(i => ({ product: i.product.id, quantity: i.quantity })),
      gift_boxes_payload: giftBoxesPayload,
    };

    try {
      // ── Uses VITE_API_BASE_URL env variable ───────────────────────────
      const res = await apiFetch('/api/orders/', {
      method: 'POST',
      body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setConfirmedTotal(grandTotal);
      setOrderNum(String(data.order_number).slice(0, 8).toUpperCase());
      clearCart();
      setPlaced(true);
    } catch (err: any) {
      setSubmitError(err.message || t('checkout.errorSubmit'));
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
  const selectedCountryLabel = countries.find(c => c.value === form.country)?.label ?? form.country;

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (!hasAnyItems && !placed) return (
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
          {paymentMethod === 'cod' && (
            <div style={{ margin: '0 auto 20px', padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(122,74,40,0.07)', border: `1px solid rgba(122,74,40,0.18)`, animation: 'fadeUp 0.6s ease 0.55s both', display: 'flex', alignItems: 'center', gap: 12, textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
              <svg width="20" height="20" fill="none" stroke={C.accent} strokeWidth="1.7" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
                <rect x="9" y="11" width="12" height="10" rx="2"/><circle cx="15" cy="16" r="2"/>
              </svg>
              <p style={{ fontSize: 13, color: C.accent, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                {t('checkout.codReadyAmount')} <strong>${confirmedTotal.toFixed(2)}</strong> {t('checkout.codReadyAmount2')}
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
              {t('profile.orders')}
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
                        <select value={form.country} onChange={e => setField('country', e.target.value)} dir={isRTL ? 'rtl' : 'ltr'} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: isRTL ? "'Noto Naskh Arabic', 'Segoe UI', serif" : "'Jost', sans-serif", backgroundColor: C.surface, color: C.heading, cursor: 'pointer', border: `1px solid ${fieldErrors.country ? C.borderErr : C.border}`, transition: 'border-color 0.2s', direction: isRTL ? 'rtl' : 'ltr' }}
                          onFocus={e => { if (!fieldErrors.country) e.currentTarget.style.borderColor = C.borderHov; }}
                          onBlur={e => { if (!fieldErrors.country) e.currentTarget.style.borderColor = C.border; }}>
                          <option value="">{t('checkout.select')}</option>
                          {countries.map(({ value, label: countryLabel }) => (
                            <option key={value} value={value}>{countryLabel}</option>
                          ))}
                        </select>
                        {fieldErrors.country && <p style={{ fontSize: 11, color: C.errorText, margin: '4px 0 0' }}>{fieldErrors.country}</p>}
                      </div>
                    </div>
                    {Object.keys(fieldErrors).length > 0 && (
                      <div style={{ padding: '10px 14px', backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 12 }}>
                        {t('checkout.errorFields')}
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

                  {/* Regular items */}
                  {items.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      {items.map((item, idx) => (
                        <div key={item.product.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: idx < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <ProductImage type={item.product.category ?? item.product.imageType ?? 'spices'} name={item.product.name} imageUrl={item.product.image_url} className="w-12 h-12 rounded-lg flex-shrink-0" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: C.heading, fontSize: 13, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(lang === 'ar' && { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif", direction: 'rtl' }) }}>
                              {localName(item.product, lang)}
                            </p>
                            <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{t('product.qty')}: {item.quantity}</p>
                          </div>
                          <span style={{ color: C.accent, fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "'Cormorant Garamond', serif" }}>
                            ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Server gift boxes */}
                  {allServerGiftBoxes.map(gb => (
                    <div key={`sgb-${gb.id}`} style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: `1.5px solid rgba(122,74,40,0.2)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: 'rgba(122,74,40,0.05)', borderBottom: `1px solid rgba(122,74,40,0.1)` }}>
                        <GiftBoxIcon size={gb.size} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {gb.size} {t('gift.packaging') ?? 'Gift Box'} ×{gb.quantity}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: C.accent, fontFamily: "'Cormorant Garamond', serif" }}>
                          ${parseFloat(gb.total_price).toFixed(2)}
                        </span>
                      </div>
                      {gb.gift_items.map((gi, idx) => (
                        <div key={gi.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx < gb.gift_items.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 12, color: C.body }}>
                          <span>{gi.product.name}</span>
                          <span style={{ color: C.muted }}>${gi.product.price}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: 11, color: C.muted, backgroundColor: 'rgba(122,74,40,0.02)' }}>
                        <span>{t('gift.packaging')} fee</span>
                        <span>+${parseFloat(gb.packaging_fee).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Guest gift boxes */}
                  {allGuestGiftBoxes.map(gb => (
                    <div key={`ggb-${gb.localId}`} style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: `1.5px solid rgba(122,74,40,0.2)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: 'rgba(122,74,40,0.05)', borderBottom: `1px solid rgba(122,74,40,0.1)` }}>
                        <GiftBoxIcon size={gb.size} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {gb.size} {t('gift.packaging') ?? 'Gift Box'} ×{gb.quantity}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: C.accent, fontFamily: "'Cormorant Garamond', serif" }}>
                          ${((gb.products.reduce((s, p) => s + parseFloat(p.price), 0) + gb.packaging_fee) * gb.quantity).toFixed(2)}
                        </span>
                      </div>
                      {gb.products.map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx < gb.products.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 12, color: C.body }}>
                          <span>{p.name}</span>
                          <span style={{ color: C.muted }}>${p.price}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: 11, color: C.muted, backgroundColor: 'rgba(122,74,40,0.02)' }}>
                        <span>{t('gift.packaging')} fee</span>
                        <span>+${gb.packaging_fee.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  <div style={{ backgroundColor: '#f7f2ea', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                      <span>{t('checkout.shipTo')}:</span><span style={{ color: C.body }}>{form.firstName} {form.lastName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                      <span>{t('checkout.email')}:</span><span style={{ color: C.body }}>{form.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                      <span>{t('checkout.addressLabel')}:</span>
                      <span style={{ color: C.body, textAlign: 'right', maxWidth: '60%' }}>
                        {form.address}, {form.city}, {form.postal}, {selectedCountryLabel}
                      </span>
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
                  <PaymentMethodSelector selected={paymentMethod} onChange={m => { setPaymentMethod(m); setFieldErrors({}); setSubmitError(''); }} t={t} />
                  <div style={{ height: 1, backgroundColor: C.border, marginBottom: 20 }} />

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
                          {t('checkout.errorPayment')}
                        </div>
                      )}
                    </>
                  )}

                  {paymentMethod === 'cod' && (
                    <div style={{ padding: 20, backgroundColor: 'rgba(122,74,40,0.05)', border: `1px solid rgba(122,74,40,0.15)`, borderRadius: 12 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', direction: isRTL ? 'rtl' : 'ltr' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(122,74,40,0.10)', border: `1px solid rgba(122,74,40,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="22" height="22" fill="none" stroke={C.accent} strokeWidth="1.7" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
                            <rect x="9" y="11" width="12" height="10" rx="2"/><circle cx="15" cy="16" r="2"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.heading, margin: '0 0 6px' }}>{t('checkout.payCOD')}</p>
                          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 14px', lineHeight: 1.7 }}>
                            {t('checkout.codDesc')} <strong style={{ color: C.accent }}>${grandTotal.toFixed(2)}</strong>
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[t('checkout.codTip1'), t('checkout.codTip2'), t('checkout.codTip3')].map((tip, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: C.successLight, border: '1px solid rgba(58,96,40,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="10" height="10" fill="none" stroke={C.success} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
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
                      {submitting ? (
                        <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{t('checkout.placing')}</>
                      ) : paymentMethod === 'cod' ? (
                        <>{t('checkout.placeOrderCOD')} · ${grandTotal.toFixed(2)}</>
                      ) : (
                        <>{t('checkout.placeOrder')} · ${grandTotal.toFixed(2)}</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Order summary sidebar ── */}
            <div style={{ ...fade(0.3), backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, position: 'sticky', top: 88, boxShadow: '0 2px 12px rgba(122,74,40,0.05)' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: C.heading, marginBottom: 20, fontWeight: 600 }}>{t('checkout.orderSummary')}</h3>
              <div style={{ marginBottom: 16 }}>

                {/* Regular items */}
                {items.map(i => (
                  <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: C.muted }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8, ...(lang === 'ar' && { fontFamily: "'Noto Naskh Arabic', 'Segoe UI', serif", direction: 'rtl' }) }}>
                      {localName(i.product, lang)} ×{i.quantity}
                    </span>
                    <span style={{ flexShrink: 0 }}>${(parseFloat(i.product.price) * i.quantity).toFixed(2)}</span>
                  </div>
                ))}

                {/* Server gift boxes */}
                {allServerGiftBoxes.map(gb => (
                  <div key={`sgb-${gb.id}`} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.accent }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GiftBoxIcon size={gb.size} />
                        {gb.size} box ×{gb.quantity}
                      </span>
                      <span style={{ flexShrink: 0, fontWeight: 600 }}>${parseFloat(gb.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {/* Guest gift boxes */}
                {allGuestGiftBoxes.map(gb => (
                  <div key={`ggb-${gb.localId}`} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.accent }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GiftBoxIcon size={gb.size} />
                        {gb.size} box ×{gb.quantity}
                      </span>
                      <span style={{ flexShrink: 0, fontWeight: 600 }}>
                        ${((gb.products.reduce((s, p) => s + parseFloat(p.price), 0) + gb.packaging_fee) * gb.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8 }}>
                  <span>{t('checkout.subtotal')}</span><span>${totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8 }}>
                  <span>{t('checkout.shipping')}</span>
                  <span style={{ color: isFreeShipping ? C.success : C.muted }}>
                    {isFreeShipping ? t('checkout.shippingFree') : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {step === 3 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: C.muted, marginBottom: 10 }}>
                    <span>{t('checkout.payment.label')}</span>
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600, backgroundColor: paymentMethod === 'cod' ? 'rgba(122,74,40,0.09)' : 'rgba(50,80,160,0.08)', color: paymentMethod === 'cod' ? C.accent : '#4a6898', border: `1px solid ${paymentMethod === 'cod' ? 'rgba(122,74,40,0.2)' : 'rgba(50,80,160,0.18)'}` }}>
                      {paymentMethod === 'cod' ? t('checkout.payCOD') : t('checkout.payCardBadge')}
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