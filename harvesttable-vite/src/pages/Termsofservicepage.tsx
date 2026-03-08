import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/Languagecontext';

const C = {
  bg: '#faf7f2', surface: '#ffffff', border: '#ede5d8',
  heading: '#2a1a0e', body: '#5a4030', muted: '#a08878',
  accent: '#7a4a28', label: '#9a6840',
}

function useInView(threshold = 0.1): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; active: boolean }> = ({ children, delay = 0, active }) => (
  <div style={{ opacity: active ? 1 : 0, transform: active ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s` }}>
    {children}
  </div>
);

const TermsSection: React.FC<{ number: string; title: string; children: React.ReactNode; active: boolean; delay?: number; highlight?: boolean }> = ({ number, title, children, active, delay = 0, highlight = false }) => {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay} active={active}>
      <div id={`section-${number}`} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'flex', gap: 28, padding: '32px 0', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 600, color: hov ? C.accent : C.muted, letterSpacing: '0.1em', transition: 'color 0.3s', display: 'block', width: 28, textAlign: 'right' }}>{number}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ width: hov ? 32 : 20, height: 1, background: `linear-gradient(to right, ${highlight ? '#c8603a' : C.accent}, transparent)`, transition: 'width 0.4s ease', flexShrink: 0 }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 600, color: C.heading, margin: 0, lineHeight: 1.2 }}>{title}</h3>
            {highlight && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8603a', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(200,96,58,0.3)', background: 'rgba(200,96,58,0.06)' }}>
                {/* label injected via title prop already */}
              </span>
            )}
          </div>
          <div style={{ paddingLeft: 46 }}>{children}</div>
        </div>
      </div>
    </Reveal>
  );
};

const TermsText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300, color: C.body, lineHeight: 1.9, margin: '0 0 12px' }}>{children}</p>
);

const TermsList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none' }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300, color: C.body, lineHeight: 1.9, marginBottom: 6 }}>
        <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 10 }} />
        {item}
      </li>
    ))}
  </ul>
);

const InfoBox: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; variant?: 'info' | 'warning' }> = ({ icon, children, variant = 'info' }) => (
  <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderRadius: 12, marginBottom: 16, background: variant === 'warning' ? 'rgba(200,96,58,0.06)' : 'rgba(122,74,40,0.05)', border: `1px solid ${variant === 'warning' ? 'rgba(200,96,58,0.22)' : 'rgba(122,74,40,0.15)'}` }}>
    {icon && <div style={{ flexShrink: 0, paddingTop: 2 }}>{icon}</div>}
    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: C.body, lineHeight: 1.8 }}>{children}</div>
  </div>
);

const TOCItem: React.FC<{ number: string; title: string; active: boolean; onClick: () => void }> = ({ number, title, active, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%', border: 'none', background: active ? 'rgba(122,74,40,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', fontFamily: 'inherit', borderLeft: `2px solid ${active ? C.accent : 'transparent'}` }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(122,74,40,0.04)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
  >
    <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, flexShrink: 0 }}>{number}</span>
    <span style={{ fontSize: 12, color: active ? C.accent : C.muted, fontWeight: active ? 600 : 400, lineHeight: 1.3 }}>{title}</span>
  </button>
);

const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const TermsOfServicePage: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [vis, setVis] = useState(false);
  const [activeSection, setActiveSection] = useState('01');

  const [s1Ref, s1] = useInView(0.05);
  const [s2Ref, s2] = useInView(0.05);
  const [s3Ref, s3] = useInView(0.05);
  const [s4Ref, s4] = useInView(0.05);
  const [s5Ref, s5] = useInView(0.05);
  const [s6Ref, s6] = useInView(0.05);
  const [s7Ref, s7] = useInView(0.05);
  const [s8Ref, s8] = useInView(0.05);

  useEffect(() => { const timer = setTimeout(() => setVis(true), 60); return () => clearTimeout(timer); }, []);

  const f = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity .75s ease ${d}s, transform .75s cubic-bezier(.22,1,.36,1) ${d}s`,
  });

  const sections = [
    { id: '01', title: t('terms.s1.title') },
    { id: '02', title: t('terms.s2.title') },
    { id: '03', title: t('terms.s3.title') },
    { id: '04', title: t('terms.s4.title') },
    { id: '05', title: t('terms.s5.title') },
    { id: '06', title: t('terms.s6.title') },
    { id: '07', title: t('terms.s7.title') },
    { id: '08', title: t('terms.s8.title') },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes slowSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (min-width: 1024px) { #terms-toc { display: block !important; } }
      `}</style>

      <div style={{ backgroundColor: C.bg, fontFamily: "'Jost', sans-serif", minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>

        {/* ── Hero ── */}
        <div style={{ position: 'relative', minHeight: 320, display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #2a1a0e 0%, #4a2a10 60%, #6a3a18 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: noise, pointerEvents: 'none' }} />
          <svg style={{ position: 'absolute', right: isRTL ? 'auto' : '4%', left: isRTL ? '4%' : 'auto', top: '50%', transform: 'translateY(-50%)', width: 260, height: 260, opacity: 0.07, pointerEvents: 'none', animation: 'slowSpin 90s linear infinite' }} viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="122" fill="none" stroke="#d4a870" strokeWidth="0.8" strokeDasharray="8 5" />
            <circle cx="130" cy="130" r="88" fill="none" stroke="#d4a870" strokeWidth="0.5" strokeDasharray="3 5" />
            <circle cx="130" cy="130" r="52" fill="none" stroke="#d4a870" strokeWidth="0.4" />
          </svg>
          <svg style={{ position: 'absolute', left: isRTL ? 'auto' : '3%', right: isRTL ? '3%' : 'auto', bottom: '10%', width: 160, height: 160, opacity: 0.05, pointerEvents: 'none' }} viewBox="0 0 200 200">
            <polygon points="100,10 190,60 190,140 100,190 10,140 10,60" fill="none" stroke="#d4a870" strokeWidth="1" />
            <polygon points="100,35 165,72 165,128 100,165 35,128 35,72" fill="none" stroke="#d4a870" strokeWidth="0.6" />
          </svg>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '90px 32px 80px', width: '100%' }}>
            <div style={{ maxWidth: 600 }}>
              <div style={{ ...f(0.05), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ display: 'block', width: 28, height: 1, background: 'linear-gradient(to right,#d4a870,transparent)' }} />
                <p style={{ fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 700, color: '#d4a870', margin: 0 }}>{t('nav.brandSub')}</p>
              </div>
              <h1 style={{ ...f(0.12), fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 6vw, 62px)', fontWeight: 600, color: '#faf2e8', lineHeight: 1.08, margin: '0 0 16px' }}>
                {t('footer.terms')}
              </h1>
              <div style={{ ...f(0.18), height: 2, width: 60, background: 'linear-gradient(90deg, #7a4a28, #d4a870, #7a4a28)', backgroundSize: '200% auto', animation: 'shimmer 2.8s linear infinite', marginBottom: 18 }} />
              <p style={{ ...f(0.24), fontSize: 15, fontWeight: 300, lineHeight: 1.9, color: 'rgba(250,242,232,0.75)', maxWidth: 480, margin: '0 0 20px' }}>
                {t('terms.hero.desc')}
              </p>
              <div style={{ ...f(0.30), display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(212,168,112,0.12)', border: '1px solid rgba(212,168,112,0.25)' }}>
                <svg width="12" height="12" fill="none" stroke="#d4a870" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
                <span style={{ fontSize: 11, color: '#d4a870', letterSpacing: '0.08em' }}>{t('terms.effective')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 96px' }}>
          <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start' }}>

            {/* TOC Sidebar */}
            <aside style={{ width: 220, flexShrink: 0, position: 'sticky', top: 96, display: 'none' }} id="terms-toc">
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 2px 16px rgba(122,74,40,0.06)' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 600, color: C.heading, marginBottom: 16, marginTop: 0 }}>{t('privacy.toc')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sections.map(s => <TOCItem key={s.id} number={s.id} title={s.title} active={activeSection === s.id} onClick={() => scrollToSection(s.id)} />)}
                </div>
              </div>
              <div style={{ marginTop: 16, background: 'linear-gradient(135deg, #f5ede0, #ede0cc)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.heading, marginBottom: 10, marginTop: 0 }}>{t('terms.relatedPolicies')}</p>
                {[
                  { label: t('footer.privacy'), href: '/privacy' },
                  { label: t('footer.shipping'), href: '/shipping' },
                  { label: t('footer.returns'), href: '/returns' },
                ].map(link => (
                  <a key={link.label} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', fontSize: 12, color: C.accent, textDecoration: 'none', borderBottom: `1px solid rgba(122,74,40,0.08)`, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                  >
                    {link.label}
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </a>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Summary trust bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '20px 24px', background: 'linear-gradient(135deg, #f5ede0, #ede0cc)', border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 8, position: 'relative', overflow: 'hidden', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(to right, #7a4a28, #d4a870, transparent)' }} />
                {[
                  { icon: '🌿', label: t('terms.trust1'), desc: t('terms.trust1desc') },
                  { icon: '🔒', label: t('terms.trust2'), desc: t('terms.trust2desc') },
                  { icon: '↩', label: t('terms.trust3'), desc: t('terms.trust3desc') },
                  { icon: '⚖', label: t('terms.trust4'), desc: t('terms.trust4desc') },
                ].map(item => (
                  <div key={item.label} style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.heading, margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 01 */}
              <div ref={s1Ref}>
                <TermsSection number="01" title={t('terms.s1.title')} active={s1}>
                  <TermsText>{t('terms.s1.p1')}</TermsText>
                  <TermsText>{t('terms.s1.p2')}</TermsText>
                </TermsSection>
              </div>

              {/* Section 02 */}
              <div ref={s2Ref}>
                <TermsSection number="02" title={t('terms.s2.title')} active={s2} delay={0.05}>
                  <TermsText>{t('terms.s2.intro')}</TermsText>
                  <TermsList items={[t('terms.s2.item1'),t('terms.s2.item2'),t('terms.s2.item3'),t('terms.s2.item4'),t('terms.s2.item5'),t('terms.s2.item6')]} />
                  <InfoBox icon={<svg width="16" height="16" fill="none" stroke={C.accent} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}>
                    {t('terms.s2.note')}
                  </InfoBox>
                </TermsSection>
              </div>

              {/* Section 03 */}
              <div ref={s3Ref}>
                <TermsSection number="03" title={t('terms.s3.title')} active={s3} delay={0.05}>
                  <TermsText>{t('terms.s3.intro')}</TermsText>
                  <TermsList items={[t('terms.s3.item1'),t('terms.s3.item2'),t('terms.s3.item3'),t('terms.s3.item4'),t('terms.s3.item5'),t('terms.s3.item6')]} />
                  <InfoBox variant="warning" icon={<svg width="16" height="16" fill="none" stroke="#c8603a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}>
                    {t('terms.s3.note')}
                  </InfoBox>
                </TermsSection>
              </div>

              {/* Section 04 */}
              <div ref={s4Ref}>
                <TermsSection number="04" title={t('terms.s4.title')} active={s4} delay={0.05}>
                  <TermsText>{t('terms.s4.intro')}</TermsText>
                  <TermsList items={[t('terms.s4.item1'),t('terms.s4.item2'),t('terms.s4.item3'),t('terms.s4.item4'),t('terms.s4.item5'),t('terms.s4.item6')]} />
                  <TermsText>{t('terms.s4.outro')}</TermsText>
                </TermsSection>
              </div>

              {/* Section 05 */}
              <div ref={s5Ref}>
                <TermsSection number="05" title={t('terms.s5.title')} active={s5} delay={0.05} highlight>
                  <TermsText>{t('terms.s5.intro')}</TermsText>
                  <TermsList items={[t('terms.s5.item1'),t('terms.s5.item2'),t('terms.s5.item3'),t('terms.s5.item4'),t('terms.s5.item5'),t('terms.s5.item6'),t('terms.s5.item7')]} />
                  <TermsText>{t('terms.s5.outro')}</TermsText>
                </TermsSection>
              </div>

              {/* Section 06 */}
              <div ref={s6Ref}>
                <TermsSection number="06" title={t('terms.s6.title')} active={s6} delay={0.05}>
                  <TermsText>{t('terms.s6.intro')}</TermsText>
                  <TermsList items={[t('terms.s6.item1'),t('terms.s6.item2'),t('terms.s6.item3'),t('terms.s6.item4')]} />
                </TermsSection>
              </div>

              {/* Section 07 */}
              <div ref={s7Ref}>
                <TermsSection number="07" title={t('terms.s7.title')} active={s7} delay={0.05} highlight>
                  <TermsText>{t('terms.s7.intro')}</TermsText>
                  <TermsList items={[t('terms.s7.item1'),t('terms.s7.item2'),t('terms.s7.item3'),t('terms.s7.item4'),t('terms.s7.item5')]} />
                  <InfoBox icon={<svg width="16" height="16" fill="none" stroke={C.accent} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
                    {t('terms.s7.note')}
                  </InfoBox>
                </TermsSection>
              </div>

              {/* Section 08 */}
              <div ref={s8Ref}>
                <TermsSection number="08" title={t('terms.s8.title')} active={s8} delay={0.05}>
                  <TermsText>{t('terms.s8.p1')}</TermsText>
                  <TermsText>{t('terms.s8.p2')}</TermsText>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
                    {[
                      { label: t('terms.s8.contact1label'), value: 'legal@harvesttable.com', href: 'mailto:legal@harvesttable.com' },
                      { label: t('terms.s8.contact2label'), value: t('terms.s8.contact2value'), href: null },
                      { label: t('terms.s8.contact3label'), value: t('terms.s8.contact3value'), href: null },
                    ].map(item => (
                      <div key={item.label} style={{ flex: '1 1 160px', padding: '16px 20px', background: 'rgba(122,74,40,0.05)', border: `1px solid ${C.border}`, borderRadius: 12 }}>
                        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.label, fontWeight: 600, margin: '0 0 6px' }}>{item.label}</p>
                        {item.href
                          ? <a href={item.href} style={{ fontSize: 13, color: C.accent, textDecoration: 'none', fontWeight: 500 }}>{item.value}</a>
                          : <p style={{ fontSize: 13, color: C.body, margin: 0 }}>{item.value}</p>}
                      </div>
                    ))}
                  </div>
                </TermsSection>
              </div>

              {/* Closing note */}
              <Reveal delay={0.1} active={s8}>
                <div style={{ marginTop: 40, padding: '24px 28px', background: 'linear-gradient(135deg, #2a1a0e, #4a2a10)', borderRadius: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #d4a870, transparent)' }} />
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: '#faf2e8', marginBottom: 8, marginTop: 0 }}>{t('terms.closing.title')}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(250,242,232,0.65)', lineHeight: 1.7, margin: '0 auto', maxWidth: 420 }}>{t('terms.closing.desc')}</p>
                </div>
              </Reveal>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;