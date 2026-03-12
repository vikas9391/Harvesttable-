// src/pages/Returns.tsx
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
    return <div style={{ opacity:active?1:0, transform:active?"translate(0,0)":from, transition:`opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s,transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`, ...style }}>{children}</div>;
  };

const Acc: React.FC<{ q: string; a: string; i: number; active: boolean }> = ({ q, a, i, active }) => {
  const [open, setOpen] = useState(false);
  return (
    <Slide delay={0.07*i} active={active}>
      <div style={{ borderBottom:"1px solid #ede5d8" }}>
        <button onClick={()=>setOpen(v=>!v)} style={{ width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:16,fontFamily:"'Jost',sans-serif" }}>
          <span style={{ fontSize:15,fontWeight:600,color:open?"#7a4a28":"#2a1a0e",transition:"color .2s" }}>{q}</span>
          <svg width="16" height="16" fill="none" stroke="#9a6840" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"transform .3s",transform:open?"rotate(180deg)":"rotate(0deg)",flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div style={{ maxHeight:open?240:0,overflow:"hidden",transition:"max-height .4s cubic-bezier(.22,1,.36,1)" }}>
          <p style={{ fontSize:15,lineHeight:1.85,color:"#8a7060",paddingBottom:20,margin:0 }}>{a}</p>
        </div>
      </div>
    </Slide>
  );
};

const Returns: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const [vis, setVis] = useState(false);
  const [r1,v1]=useInView(); const [r2,v2]=useInView(); const [r3,v3]=useInView(); const [r4,v4]=useInView();
  useEffect(()=>{ const id=setTimeout(()=>setVis(true),80); return ()=>clearTimeout(id); },[]);
  const f = (d:number):CSSProperties => ({ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(24px)", transition:`opacity .75s ease ${d}s,transform .75s cubic-bezier(.22,1,.36,1) ${d}s` });

  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

  const steps = [
    { num: t('returns.step1.num'), title: t('returns.step1.title'), desc: t('returns.step1.desc') },
    { num: t('returns.step2.num'), title: t('returns.step2.title'), desc: t('returns.step2.desc') },
    { num: t('returns.step3.num'), title: t('returns.step3.title'), desc: t('returns.step3.desc') },
    { num: t('returns.step4.num'), title: t('returns.step4.title'), desc: t('returns.step4.desc') },
  ];

  const eligible = [
    t('returns.eligible.1'),
    t('returns.eligible.2'),
    t('returns.eligible.3'),
    t('returns.eligible.4'),
  ];

  const notEligible = [
    t('returns.noteligible.1'),
    t('returns.noteligible.2'),
    t('returns.noteligible.3'),
    t('returns.noteligible.4'),
  ];

  const faqs = [
    { q: t('returns.faq.q1'), a: t('returns.faq.a1') },
    { q: t('returns.faq.q2'), a: t('returns.faq.a2') },
    { q: t('returns.faq.q3'), a: t('returns.faq.a3') },
    { q: t('returns.faq.q4'), a: t('returns.faq.a4') },
    { q: t('returns.faq.q5'), a: t('returns.faq.a5') },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}@keyframes lineGrow{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}`}</style>
      <div dir={isRTL?"rtl":"ltr"} style={{ fontFamily:"'Jost',sans-serif",background:"#faf7f2",minHeight:"100vh" }} className="page-offset">

        {/* Hero */}
        <div style={{ position:"relative",minHeight:320,display:"flex",alignItems:"center",overflow:"hidden",background:"linear-gradient(135deg,#1a2a1a 0%,#2a4a1a 60%,#3a5a20 100%)" }}>
          <div style={{ position:"absolute",inset:0,opacity:0.06,backgroundImage:noise }}/>
          <svg style={{ position:"absolute",right:"4%",top:"50%",transform:"translateY(-50%)",width:240,height:240,opacity:0.07,pointerEvents:"none" }} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="114" fill="none" stroke="#a8d870" strokeWidth="0.8" strokeDasharray="8 5"/>
            <circle cx="120" cy="120" r="80" fill="none" stroke="#a8d870" strokeWidth="0.5" strokeDasharray="3 5"/>
          </svg>
          <div style={{ position:"relative",zIndex:2,maxWidth:960,margin:"0 auto",padding:"80px 32px",width:"100%" }}>
            <div style={{ ...f(0.05),display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
              <span style={{ display:"block",width:28,height:1,background:"linear-gradient(to right,#a8d870,transparent)" }}/>
              <p style={{ fontSize:10,letterSpacing:"0.42em",textTransform:"uppercase",fontWeight:700,color:"#a8d870",margin:0 }}>{t("nav.brandName")}</p>
            </div>
            <h1 style={{ ...f(0.12),fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(34px,6vw,62px)",fontWeight:600,color:"#faf2e8",lineHeight:1.08,margin:"0 0 16px" }}>{t('returns.hero.title')}</h1>
            <div style={{ ...f(0.18),height:2,width:60,background:"linear-gradient(90deg,#3a6028,#a8d870,#3a6028)",backgroundSize:"200% auto",animation:"shimmer 2.8s linear infinite",marginBottom:18 }}/>
            <p style={{ ...f(0.24),fontSize:16,fontWeight:300,lineHeight:1.9,color:"rgba(250,242,232,0.75)",maxWidth:480,margin:0 }}>{t('returns.hero.subtitle')}</p>
          </div>
        </div>

        <div style={{ maxWidth:960,margin:"0 auto",padding:"72px 24px" }}>

          {/* How it works */}
          <div ref={r1} style={{ marginBottom:80 }}>
            <Slide delay={0} active={v1}>
              <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#9a6840",marginBottom:10 }}>{t('returns.section1.eyebrow')}</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:600,color:"#2a1a0e",marginBottom:36,lineHeight:1.1 }}>{t('returns.section1.title')}</h2>
            </Slide>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14 }}>
              {steps.map((s,i) => (
                <Slide key={s.num} delay={0.09*i} active={v1}>
                  <div style={{ background:"#fff",border:"1px solid #ede5d8",borderRadius:16,padding:"28px 22px",height:"100%",position:"relative",overflow:"hidden",transition:"box-shadow .25s,border-color .25s,transform .25s" }}
                    onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow="0 10px 32px rgba(122,74,40,0.12)"; el.style.borderColor="#c8a882"; el.style.transform="translateY(-3px)"; }}
                    onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow="none"; el.style.borderColor="#ede5d8"; el.style.transform="translateY(0)"; }}>
                    <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(to right,#7a4a28,#d4a870)" }}/>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700,color:"rgba(122,74,40,0.12)",display:"block",lineHeight:1,marginBottom:12 }}>{s.num}</span>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:"#2a1a0e",marginBottom:10 }}>{s.title}</h3>
                    <p style={{ fontSize:14,lineHeight:1.75,color:"#8a7060",margin:0 }}>{s.desc}</p>
                  </div>
                </Slide>
              ))}
            </div>
          </div>

          {/* Eligible / Not eligible */}
          <div ref={r2} style={{ marginBottom:80 }}>
            <Slide delay={0} active={v2}>
              <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#9a6840",marginBottom:10 }}>{t('returns.section2.eyebrow')}</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:600,color:"#2a1a0e",marginBottom:32,lineHeight:1.1 }}>{t('returns.section2.title')}</h2>
            </Slide>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16 }}>
              <Slide delay={0.08} active={v2}>
                <div style={{ background:"#fff",border:"1px solid #c8e0b8",borderRadius:16,padding:"28px 24px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:"rgba(58,96,40,0.10)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>✅</div>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#2a4a10" }}>{t('returns.eligible.title')}</h3>
                  </div>
                  {eligible.map((label,i) => (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                      <span style={{ fontSize:16,flexShrink:0 }}>✅</span>
                      <span style={{ fontSize:14,color:"#4a6a28",fontWeight:500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </Slide>
              <Slide delay={0.16} active={v2}>
                <div style={{ background:"#fff",border:"1px solid #e8c8c8",borderRadius:16,padding:"28px 24px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:"rgba(160,50,50,0.09)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>❌</div>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#4a1010" }}>{t('returns.noteligible.title')}</h3>
                  </div>
                  {notEligible.map((label,i) => (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                      <span style={{ fontSize:16,flexShrink:0 }}>❌</span>
                      <span style={{ fontSize:14,color:"#6a3030",fontWeight:500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </Slide>
            </div>
          </div>

          {/* Guarantee banner */}
          <div ref={r3} style={{ marginBottom:80 }}>
            <Slide delay={0} active={v3}>
              <div style={{ position:"relative",borderRadius:20,overflow:"hidden",background:"linear-gradient(135deg,#2a1a0e 0%,#4a2a10 100%)",padding:"44px 40px",display:"flex",alignItems:"center",gap:32,flexWrap:"wrap" }}>
                <div style={{ position:"absolute",inset:0,opacity:0.07,backgroundImage:noise }}/>
                <div style={{ position:"relative",zIndex:1,width:72,height:72,borderRadius:"50%",background:"rgba(212,168,112,0.15)",border:"1px solid rgba(212,168,112,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:32 }}>🛡️</div>
                <div style={{ position:"relative",zIndex:1,flex:1,minWidth:220 }}>
                  <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#d4a870",margin:"0 0 8px" }}>{t('returns.banner.eyebrow')}</p>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(22px,4vw,34px)",fontWeight:600,color:"#faf2e8",margin:"0 0 10px",lineHeight:1.15 }}>{t('returns.banner.title')}</h3>
                  <p style={{ fontSize:15,color:"rgba(250,242,232,0.72)",margin:0,fontWeight:300,lineHeight:1.7 }}>{t('returns.banner.subtitle')}</p>
                </div>
              </div>
            </Slide>
          </div>

          {/* FAQ */}
          <div ref={r4}>
            <Slide delay={0} active={v4}>
              <p style={{ fontSize:11,letterSpacing:"0.35em",textTransform:"uppercase",fontWeight:700,color:"#9a6840",marginBottom:10 }}>{t('returns.faq.eyebrow')}</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:600,color:"#2a1a0e",marginBottom:28,lineHeight:1.1 }}>{t('returns.faq.title')}</h2>
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
export default Returns;