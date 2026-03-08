// src/pages/ShippingInfo.tsx
import React, { useState, useEffect, useRef, ReactNode, CSSProperties, RefObject } from "react";
import { useLanguage } from "../context/Languagecontext";

function useInView(t = 0.12): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: t });
    obs.observe(el); return () => obs.disconnect();
  }, [t]);
  return [ref, v];
}

const Slide: React.FC<{ children: ReactNode; delay?: number; active: boolean; dir?: "up"|"left"|"right"; style?: CSSProperties }> =
  ({ children, delay = 0, active, dir = "up", style }) => {
    const from = dir === "left" ? "translateX(-44px)" : dir === "right" ? "translateX(44px)" : "translateY(36px)";
    return <div style={{ opacity: active?1:0, transform: active?"translate(0,0)":from, transition:`opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s,transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`, ...style }}>{children}</div>;
  };

const Acc: React.FC<{ q: string; a: string; i: number; active: boolean }> = ({ q, a, i, active }) => {
  const [open, setOpen] = useState(false);
  return (
    <Slide delay={0.07*i} active={active}>
      <div style={{ borderBottom:"1px solid #ede5d8" }}>
        <button onClick={() => setOpen(v=>!v)} style={{ width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:16,fontFamily:"'Jost',sans-serif" }}>
          <span style={{ fontSize:15,fontWeight:600,color:open?"#7a4a28":"#2a1a0e",transition:"color .2s" }}>{q}</span>
          <svg width="16" height="16" fill="none" stroke="#9a6840" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"transform .3s",transform:open?"rotate(180deg)":"rotate(0deg)",flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div style={{ maxHeight:open?220:0,overflow:"hidden",transition:"max-height .4s cubic-bezier(.22,1,.36,1)" }}>
          <p style={{ fontSize:15,lineHeight:1.85,color:"#8a7060",paddingBottom:20,margin:0 }}>{a}</p>
        </div>
      </div>
    </Slide>
  );
};

const ShippingInfo: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const [vis, setVis] = useState(false);
  const [r1,v1]=useInView(); const [r2,v2]=useInView(); const [r3,v3]=useInView(); const [r4,v4]=useInView();
  useEffect(()=>{ const id=setTimeout(()=>setVis(true),80); return ()=>clearTimeout(id); },[]);
  const f = (d:number):CSSProperties => ({ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(24px)", transition:`opacity .75s ease ${d}s,transform .75s cubic-bezier(.22,1,.36,1) ${d}s` });

  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

  const cards = [
    { icon:"🚚", title: t('shipping.card.standard.title'), desc: t('shipping.card.standard.desc'), bg:"#f5ede0" },
    { icon:"⚡", title: t('shipping.card.express.title'),  desc: t('shipping.card.express.desc'),  bg:"#f0f5e8" },
    { icon:"🎁", title: t('shipping.card.free.title'),     desc: t('shipping.card.free.desc'),     bg:"#fef5e0" },
    { icon:"🌍", title: t('shipping.card.intl.title'),     desc: t('shipping.card.intl.desc'),     bg:"#e8f0f8" },
    { icon:"🔒", title: t('shipping.card.insured.title'),  desc: t('shipping.card.insured.desc'),  bg:"#f0e8f5" },
  ];

  const packaging = [
    { icon:"🌿", label: t('shipping.pack.sealed.label'), desc: t('shipping.pack.sealed.desc') },
    { icon:"♻️", label: t('shipping.pack.eco.label'),    desc: t('shipping.pack.eco.desc')    },
    { icon:"✅", label: t('shipping.pack.tamper.label'), desc: t('shipping.pack.tamper.desc') },
  ];

  const faqs = [
    { q: t('shipping.faq.q1'), a: t('shipping.faq.a1') },
    { q: t('shipping.faq.q2'), a: t('shipping.faq.a2') },
    { q: t('shipping.faq.q3'), a: t('shipping.faq.a3') },
    { q: t('shipping.faq.q4'), a: t('shipping.faq.a4') },
    { q: t('shipping.faq.q5'), a: t('shipping.faq.a5') },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`}</style>
      <div dir={isRTL?"rtl":"ltr"} style={{ fontFamily:"'Jost',sans-serif",background:"#faf7f2",minHeight:"100vh" }} className="page-offset">

        {/* Hero */}
        <div style={{ position:"relative",minHeight:320,display:"flex",alignItems:"center",overflow:"hidden",background:"linear-gradient(135deg,#2a1a0e 0%,#4a2a10 60%,#6a3a18 100%)" }}>
          <div style={{ position:"absolute",inset:0,opacity:0.06,backgroundImage:noise }}/>
          <svg style={{ position:"absolute",right:"4%",top:"50%",transform:"translateY(-50%)",width:240,height:240,opacity:0.07,pointerEvents:"none" }} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="114" fill="none" stroke="#d4a870" strokeWidth="0.8" strokeDasharray="8 5"/>
            <circle cx="120" cy="120" r="80" fill="none" stroke="#d4a870" strokeWidth="0.5" strokeDasharray="3 5"/>
          </svg>
          <div style={{ position:"relative",zIndex:2,maxWidth:960,margin:"0 auto",padding:"80px 32px",width:"100%" }}>
            <div style={{ ...f(0.05),display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
              <span style={{ display:"block",width:28,height:1,background:"linear-gradient(to right,#d4a870,transparent)" }}/>
              <p style={{ fontSize:10,letterSpacing:"0.42em",textTransform:"uppercase",fontWeight:700,color:"#d4a870",margin:0 }}>{t('shipping.hero.eyebrow')}</p>
            </div>
            <h1 style={{ ...f(0.12),fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(34px,6vw,62px)",fontWeight:600,color:"#faf2e8",lineHeight:1.08,margin:"0 0 16px" }}>{t('shipping.hero.title')}</h1>
            <div style={{ ...f(0.18),height:2,width:60,background:"linear-gradient(90deg,#7a4a28,#d4a870,#7a4a28)",backgroundSize:"200% auto",animation:"shimmer 2.8s linear infinite",marginBottom:18 }}/>
            <p style={{ ...f(0.24),fontSize:16,fontWeight:300,lineHeight:1.9,color:"rgba(250,242,232,0.75)",maxWidth:460,margin:0 }}>{t('shipping.hero.subtitle')}</p>
          </div>
        </div>

        <div style={{ maxWidth:960,margin:"0 auto",padding:"72px 24px" }}>

          {/* Shipping cards */}
          <div ref={r1} style={{ marginBottom:80 }}>
            <Slide delay={0} active={v1}>
              <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#9a6840",marginBottom:10 }}>{t('shipping.section1.eyebrow')}</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:600,color:"#2a1a0e",marginBottom:32,lineHeight:1.1 }}>{t('shipping.section1.title')}</h2>
            </Slide>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14 }}>
              {cards.map((c,i) => (
                <Slide key={c.title} delay={0.08*i} active={v1}>
                  <div style={{ background:"#fff",border:"1px solid #ede5d8",borderRadius:16,padding:"24px 22px",height:"100%",transition:"box-shadow .25s,border-color .25s,transform .25s" }}
                    onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow="0 10px 32px rgba(122,74,40,0.12)"; el.style.borderColor="#c8a882"; el.style.transform="translateY(-3px)"; }}
                    onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow="none"; el.style.borderColor="#ede5d8"; el.style.transform="translateY(0)"; }}>
                    <div style={{ width:48,height:48,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:22 }}>{c.icon}</div>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:"#2a1a0e",marginBottom:8 }}>{c.title}</h3>
                    <p style={{ fontSize:14,lineHeight:1.75,color:"#8a7060",margin:0 }}>{c.desc}</p>
                  </div>
                </Slide>
              ))}
            </div>
          </div>

          {/* Free shipping banner */}
          <div ref={r2} style={{ marginBottom:80 }}>
            <Slide delay={0} active={v2}>
              <div style={{ position:"relative",borderRadius:20,overflow:"hidden",background:"linear-gradient(135deg,#2a1a0e 0%,#4a2a10 100%)",padding:"44px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:24 }}>
                <div style={{ position:"absolute",inset:0,opacity:0.07,backgroundImage:noise }}/>
                <div style={{ position:"relative",zIndex:1 }}>
                  <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#d4a870",margin:"0 0 8px" }}>{t('shipping.banner.eyebrow')}</p>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(22px,4vw,36px)",fontWeight:600,color:"#faf2e8",margin:"0 0 10px",lineHeight:1.1 }}>{t('shipping.banner.title')}</h3>
                  <p style={{ fontSize:15,color:"rgba(250,242,232,0.72)",margin:0,fontWeight:300 }}>{t('shipping.banner.subtitle')}</p>
                </div>
                <div style={{ position:"relative",zIndex:1,background:"rgba(212,168,112,0.14)",border:"1px solid rgba(212,168,112,0.28)",borderRadius:14,padding:"18px 28px",textAlign:"center",flexShrink:0 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:700,color:"#d4a870",margin:"0 0 4px",lineHeight:1 }}>$50</p>
                  <p style={{ fontSize:11,color:"rgba(212,168,112,0.8)",letterSpacing:"0.12em",margin:0 }}>{t('shipping.banner.threshold')}</p>
                </div>
              </div>
            </Slide>
          </div>

          {/* Packaging */}
          <div ref={r3} style={{ marginBottom:80 }}>
            <Slide delay={0} active={v3}>
              <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#9a6840",marginBottom:10 }}>{t('shipping.section3.eyebrow')}</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:600,color:"#2a1a0e",marginBottom:28,lineHeight:1.1 }}>{t('shipping.section3.title')}</h2>
            </Slide>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14 }}>
              {packaging.map((p,i) => (
                <Slide key={p.label} delay={0.1*i} active={v3}>
                  <div style={{ display:"flex",gap:16,padding:"22px",background:"#fff",border:"1px solid #ede5d8",borderRadius:14 }}>
                    <span style={{ fontSize:26,flexShrink:0,lineHeight:1.3 }}>{p.icon}</span>
                    <div>
                      <h4 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:"#2a1a0e",marginBottom:6 }}>{p.label}</h4>
                      <p style={{ fontSize:14,lineHeight:1.75,color:"#8a7060",margin:0 }}>{p.desc}</p>
                    </div>
                  </div>
                </Slide>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div ref={r4}>
            <Slide delay={0} active={v4}>
              <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#9a6840",marginBottom:10 }}>{t('shipping.faq.eyebrow')}</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:600,color:"#2a1a0e",marginBottom:28,lineHeight:1.1 }}>{t('shipping.faq.title')}</h2>
            </Slide>
            <div style={{ background:"#fff",border:"1px solid #ede5d8",borderRadius:18,padding:"8px 28px" }}>
              {faqs.map((faq,i) => <Acc key={i} q={faq.q} a={faq.a} i={i} active={v4}/>)}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
export default ShippingInfo;