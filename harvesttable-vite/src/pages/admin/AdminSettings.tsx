// src/pages/admin/AdminSettings.tsx
import React, { useState } from 'react';
import { useLanguage } from '../../context/Languagecontext';

const card: React.CSSProperties = { backgroundColor: '#ffffff', border: '1px solid #ede5d8', borderRadius: 16, overflow: 'hidden' };

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconStore = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 22V12h6v10"/>
  </svg>
);

const IconTruck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h2l3 4v3h-5m0 0a2 2 0 11-4 0m4 0a2 2 0 01-4 0M9 17a2 2 0 11-4 0m4 0a2 2 0 01-4 0"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

const IconCode = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h8l4 4v12a2 2 0 01-2 2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 21v-6h6v6M9 3v4h6"/>
  </svg>
);

const IconInfo = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const IconCircleDot = () => (
  <svg width="10" height="10" fill="none" stroke="#3a6028" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8" strokeWidth={2} />
    <circle cx="12" cy="12" r="3" fill="#3a6028" />
  </svg>
);

// ─── AdminSettings ─────────────────────────────────────────────────────────────
const AdminSettings: React.FC = () => {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    storeName:              'HarvestTable',
    storeEmail:             'hello@harvesttable.com',
    currency:               'USD',
    freeShippingThreshold:  '50',
    standardShipping:       '5.99',
    metaTitle:              'HarvestTable - Moroccan Botanicals',
    metaDesc:               'Artisan herbs, teas & spices from Morocco',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '10px 14px', backgroundColor: '#faf7f2',
    border: '1px solid #ede5d8', borderRadius: 12, color: '#2a1a0e',
    fontSize: 13, outline: 'none', fontFamily: "'Jost', sans-serif",
    width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#9a7060', fontSize: 11,
    letterSpacing: '0.06em', marginBottom: 6, fontWeight: 500,
  };

  // ── Section wrapper ──
  const Section = ({
    title, icon, children,
  }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={card}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #ede5d8', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#9a6840', display: 'flex' }}>{icon}</span>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: '#2a1a0e', margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );

  // ── Field ──
  const Field = ({
    label, name, type = 'text', prefix, readOnly,
  }: { label: string; name: string; type?: string; prefix?: string; readOnly?: boolean }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex' }}>
        {prefix && (
          <span style={{
            padding: '10px 12px', backgroundColor: '#f0e8dc',
            border: '1px solid #ede5d8', borderRight: 'none',
            borderRadius: '12px 0 0 12px', color: '#9a7060', fontSize: 13,
          }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={(form as any)[name]}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
          readOnly={readOnly}
          style={{ ...inputStyle, borderRadius: prefix ? '0 12px 12px 0' : 12, cursor: readOnly ? 'default' : 'text' }}
          onFocus={e => { if (!readOnly) e.currentTarget.style.borderColor = '#c8a882'; }}
          onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 28px 36px', maxWidth: 680, fontFamily: "'Jost', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#2a1a0e', margin: '0 0 4px' }}>
            {t('nav.settings')}
          </h1>
          <p style={{ color: '#a08878', fontSize: 13, margin: 0 }}>{t('admin.settings.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            border: 'none', transition: 'all 0.2s', fontFamily: "'Jost', sans-serif",
            backgroundColor: saved ? 'rgba(58,90,40,0.12)' : '#7a4a28',
            color: saved ? '#3a6028' : '#ffffff',
            outline: saved ? '1px solid rgba(58,90,40,0.30)' : 'none',
          }}
          onMouseEnter={e => { if (!saved) (e.currentTarget as HTMLElement).style.backgroundColor = '#8f5830'; }}
          onMouseLeave={e => { if (!saved) (e.currentTarget as HTMLElement).style.backgroundColor = '#7a4a28'; }}
        >
          {saved ? (
            <>
              <IconCheck />
              {t('admin.settings.saved')}
            </>
          ) : (
            <>
              <IconSave />
              {t('profile.save')}
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Store Information */}
        <Section title={t('admin.settings.storeInfo')} icon={<IconStore />}>
          <Field label={t('admin.settings.storeName')} name="storeName" />
          <Field label={t('admin.settings.contactEmail')} name="storeEmail" type="email" />
          <div>
            <label style={labelStyle}>{t('admin.settings.currency')}</label>
            <select
              value={form.currency}
              onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties}
              onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
              onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="MAD">MAD — Moroccan Dirham</option>
            </select>
          </div>
        </Section>

        {/* Shipping */}
        <Section title={t('admin.settings.shipping')} icon={<IconTruck />}>
          <Field label={t('admin.settings.freeThreshold')} name="freeShippingThreshold" type="number" prefix="$" />
          <Field label={t('admin.settings.standardCost')}  name="standardShipping"       type="number" prefix="$" />
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 16px', backgroundColor: 'rgba(122,74,40,0.06)',
            border: '1px solid rgba(122,74,40,0.18)', borderRadius: 12,
          }}>
            <span style={{ color: '#9a6840', display: 'flex', marginTop: 1, flexShrink: 0 }}><IconInfo /></span>
            <p style={{ color: '#7a4a28', fontSize: 12, margin: 0, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: t('admin.settings.shippingNote')
                .replace('${threshold}', form.freeShippingThreshold)
                .replace('${cost}', form.standardShipping) }}
            />
          </div>
        </Section>

        {/* SEO */}
        <Section title={t('admin.settings.seo')} icon={<IconSearch />}>
          <Field label={t('admin.settings.metaTitle')} name="metaTitle" />
          <div>
            <label style={labelStyle}>{t('admin.settings.metaDesc')}</label>
            <textarea
              value={form.metaDesc}
              onChange={e => setForm(prev => ({ ...prev, metaDesc: e.target.value }))}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', backgroundColor: '#faf7f2',
                border: '1px solid #ede5d8', borderRadius: 12, color: '#2a1a0e',
                fontSize: 13, outline: 'none', resize: 'none',
                fontFamily: "'Jost', sans-serif", boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#c8a882'}
              onBlur={e => e.currentTarget.style.borderColor = '#ede5d8'}
            />
          </div>
        </Section>

        {/* API Configuration */}
        <Section title={t('admin.settings.api')} icon={<IconCode />}>
          <div>
            <label style={labelStyle}>{t('admin.settings.apiUrl')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                defaultValue="http://localhost:8000/api"
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 } as React.CSSProperties}
                readOnly
              />
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 14px', backgroundColor: 'rgba(58,90,40,0.09)',
                border: '1px solid rgba(58,90,40,0.22)', color: '#3a6028',
                fontSize: 12, borderRadius: 12, whiteSpace: 'nowrap', fontWeight: 600,
              }}>
                <IconCircleDot />
                {t('admin.settings.connected')}
              </span>
            </div>
          </div>
          <p style={{ color: '#a08878', fontSize: 12, margin: 0 }}>
            {t('admin.settings.apiEnvNote').split('REACT_APP_API_URL')[0]}
            <code style={{ color: '#7a4a28', backgroundColor: 'rgba(122,74,40,0.08)', padding: '1px 6px', borderRadius: 5 }}>
              REACT_APP_API_URL
            </code>
            {t('admin.settings.apiEnvNote').split('REACT_APP_API_URL')[1]}
          </p>
        </Section>

      </div>
    </div>
  );
};

export default AdminSettings;