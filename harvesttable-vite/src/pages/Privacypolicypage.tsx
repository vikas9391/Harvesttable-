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

const PolicySection: React.FC<{ number: string; title: string; children: React.ReactNode; active: boolean; delay?: number }> = ({ number, title, children, active, delay = 0 }) => {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={delay} active={active}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: 'flex', gap: 28, padding: '32px 0', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 600, color: hov ? C.accent : C.muted, letterSpacing: '0.1em', transition: 'color 0.3s', display: 'block', width: 28, textAlign: 'right' }}>{number}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ width: hov ? 32 : 20, height: 1, background: `linear-gradient(to right, ${C.accent}, transparent)`, transition: 'width 0.4s ease', flexShrink: 0 }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 600, color: C.heading, margin: 0, lineHeight: 1.2 }}>{title}</h3>
          </div>
          <div style={{ paddingLeft: 46 }}>{children}</div>
        </div>
      </div>
    </Reveal>
  );
};

const PolicyText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300, color: C.body, lineHeight: 1.9, margin: '0 0 12px' }}>{children}</p>
);

const PolicyList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none' }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300, color: C.body, lineHeight: 1.9, marginBottom: 6 }}>
        <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 10 }} />
        {item}
      </li>
    ))}
  </ul>
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

const PrivacyPolicyPage: React.FC = () => {
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

  useEffect(() => { const timer = setTimeout(() => setVis(true), 60); return () => clearTimeout(timer); }, []);

  const f = (d: number): React.CSSProperties => ({
    opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity .75s ease ${d}s, transform .75s cubic-bezier(.22,1,.36,1) ${d}s`,
  });

  const sections = [
    { id: '01', title: t('privacy.s1.title') },
    { id: '02', title: t('privacy.s2.title') },
    { id: '03', title: t('privacy.s3.title') },
    { id: '04', title: t('privacy.s4.title') },
    { id: '05', title: t('privacy.s5.title') },
    { id: '06', title: t('privacy.s6.title') },
    { id: '07', title: t('privacy.s7.title') },
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
        @media (min-width: 1024px) { #privacy-toc { display: block !important; } }
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
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '90px 32px 80px', width: '100%' }}>
            <div style={{ maxWidth: 600 }}>
              <div style={{ ...f(0.05), display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ display: 'block', width: 28, height: 1, background: 'linear-gradient(to right,#d4a870,transparent)' }} />
                <p style={{ fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 700, color: '#d4a870', margin: 0 }}>{t('nav.brandSub')}</p>
              </div>
              <h1 style={{ ...f(0.12), fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 6vw, 62px)', fontWeight: 600, color: '#faf2e8', lineHeight: 1.08, margin: '0 0 16px' }}>
                {t('footer.privacy')}
              </h1>
              <div style={{ ...f(0.18), height: 2, width: 60, background: 'linear-gradient(90deg, #7a4a28, #d4a870, #7a4a28)', backgroundSize: '200% auto', animation: 'shimmer 2.8s linear infinite', marginBottom: 18 }} />
              <p style={{ ...f(0.24), fontSize: 15, fontWeight: 300, lineHeight: 1.9, color: 'rgba(250,242,232,0.75)', maxWidth: 480, margin: '0 0 20px' }}>
                {t('privacy.hero.desc')}
              </p>
              <div style={{ ...f(0.30), display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(212,168,112,0.12)', border: '1px solid rgba(212,168,112,0.25)' }}>
                <svg width="12" height="12" fill="none" stroke="#d4a870" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
                <span style={{ fontSize: 11, color: '#d4a870', letterSpacing: '0.08em' }}>{t('privacy.updated')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 96px' }}>
          <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start' }}>

            {/* TOC Sidebar */}
            <aside style={{ width: 220, flexShrink: 0, position: 'sticky', top: 96, display: 'none' }} id="privacy-toc">
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 2px 16px rgba(122,74,40,0.06)' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 600, color: C.heading, marginBottom: 16, marginTop: 0 }}>{t('privacy.toc')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sections.map(s => <TOCItem key={s.id} number={s.id} title={s.title} active={activeSection === s.id} onClick={() => scrollToSection(s.id)} />)}
                </div>
              </div>
              <div style={{ marginTop: 16, background: 'linear-gradient(135deg, #f5ede0, #ede0cc)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.heading, marginBottom: 6, marginTop: 0 }}>{t('privacy.questions')}</p>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12, marginTop: 0 }}>{t('privacy.questionsDesc')}</p>
                <a href="mailto:privacy@harvesttable.com" style={{ display: 'block', padding: '8px 14px', background: C.accent, color: '#f5ede0', borderRadius: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textDecoration: 'none', textAlign: 'center' }}>{t('footer.contact')}</a>
              </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Intro card */}
              <div style={{ ...f(0.1), background: 'linear-gradient(135deg, #f5ede0 0%, #ede0cc 100%)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 32px', marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(to right, #7a4a28, #d4a870, transparent)' }} />
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(122,74,40,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" fill="none" stroke="#7a4a28" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: C.heading, marginBottom: 6, marginTop: 0 }}>{t('privacy.commitment.title')}</p>
                    <p style={{ fontSize: 14, fontWeight: 300, color: C.body, lineHeight: 1.8, margin: 0 }}>{t('privacy.commitment.desc')}</p>
                  </div>
                </div>
              </div>

              <div id="section-01" ref={s1Ref}>
                <PolicySection number="01" title={t('privacy.s1.title')} active={s1}>
                  <PolicyText>{t('privacy.s1.intro')}</PolicyText>
                  <PolicyList items={[t('privacy.s1.item1'),t('privacy.s1.item2'),t('privacy.s1.item3'),t('privacy.s1.item4'),t('privacy.s1.item5'),t('privacy.s1.item6'),t('privacy.s1.item7')]} />
                  <PolicyText>{t('privacy.s1.outro')}</PolicyText>
                </PolicySection>
              </div>

              <div id="section-02" ref={s2Ref}>
                <PolicySection number="02" title={t('privacy.s2.title')} active={s2} delay={0.05}>
                  <PolicyText>{t('privacy.s2.intro')}</PolicyText>
                  <PolicyList items={[t('privacy.s2.item1'),t('privacy.s2.item2'),t('privacy.s2.item3'),t('privacy.s2.item4'),t('privacy.s2.item5'),t('privacy.s2.item6'),t('privacy.s2.item7')]} />
                </PolicySection>
              </div>

              <div id="section-03" ref={s3Ref}>
                <PolicySection number="03" title={t('privacy.s3.title')} active={s3} delay={0.05}>
                  <PolicyText>{t('privacy.s3.intro')}</PolicyText>
                  <PolicyList items={[t('privacy.s3.item1'),t('privacy.s3.item2'),t('privacy.s3.item3'),t('privacy.s3.item4'),t('privacy.s3.item5')]} />
                  <PolicyText>{t('privacy.s3.outro')}</PolicyText>
                </PolicySection>
              </div>

              <div id="section-04" ref={s4Ref}>
                <PolicySection number="04" title={t('privacy.s4.title')} active={s4} delay={0.05}>
                  <PolicyText>{t('privacy.s4.intro')}</PolicyText>
                  <PolicyList items={[t('privacy.s4.item1'),t('privacy.s4.item2'),t('privacy.s4.item3'),t('privacy.s4.item4')]} />
                  <PolicyText>{t('privacy.s4.outro')}</PolicyText>
                </PolicySection>
              </div>

              <div id="section-05" ref={s5Ref}>
                <PolicySection number="05" title={t('privacy.s5.title')} active={s5} delay={0.05}>
                  <PolicyText>{t('privacy.s5.intro')}</PolicyText>
                  <PolicyList items={[t('privacy.s5.item1'),t('privacy.s5.item2'),t('privacy.s5.item3'),t('privacy.s5.item4'),t('privacy.s5.item5')]} />
                  <PolicyText>{t('privacy.s5.outro')}</PolicyText>
                </PolicySection>
              </div>

              <div id="section-06" ref={s6Ref}>
                <PolicySection number="06" title={t('privacy.s6.title')} active={s6} delay={0.05}>
                  <PolicyText>{t('privacy.s6.intro')}</PolicyText>
                  <PolicyList items={[t('privacy.s6.item1'),t('privacy.s6.item2'),t('privacy.s6.item3'),t('privacy.s6.item4'),t('privacy.s6.item5'),t('privacy.s6.item6'),t('privacy.s6.item7')]} />
                  <PolicyText>{t('privacy.s6.outro')}</PolicyText>
                </PolicySection>
              </div>

              <div id="section-07" ref={s7Ref}>
                <PolicySection number="07" title={t('privacy.s7.title')} active={s7} delay={0.05}>
                  <PolicyText>{t('privacy.s7.intro')}</PolicyText>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                    {[
                      { label: t('privacy.s7.contact1label'), value: 'privacy@harvesttable.com', href: 'mailto:privacy@harvesttable.com' },
                      { label: t('privacy.s7.contact2label'), value: t('privacy.s7.contact2value'), href: null },
                      { label: t('privacy.s7.contact3label'), value: t('privacy.s7.contact3value'), href: null },
                    ].map(item => (
                      <div key={item.label} style={{ flex: '1 1 180px', padding: '16px 20px', background: 'rgba(122,74,40,0.05)', border: `1px solid ${C.border}`, borderRadius: 12 }}>
                        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.label, fontWeight: 600, margin: '0 0 6px' }}>{item.label}</p>
                        {item.href
                          ? <a href={item.href} style={{ fontSize: 13, color: C.accent, textDecoration: 'none', fontWeight: 500 }}>{item.value}</a>
                          : <p style={{ fontSize: 13, color: C.body, margin: 0 }}>{item.value}</p>}
                      </div>
                    ))}
                  </div>
                  <PolicyText>{t('privacy.s7.outro')}</PolicyText>
                </PolicySection>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;