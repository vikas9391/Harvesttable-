import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  CSSProperties,
  RefObject,
} from "react";
import { useLanguage } from "../context/Languagecontext";

/* ─── useInView ─────────────────────────────────────────── */
function useInView(threshold = 0.1): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState<boolean>(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Scroll progress bar ───────────────────────────────── */
const ScrollBar: React.FC = () => {
  const [p, setP] = useState<number>(0);
  useEffect(() => {
    const h = () => {
      const t = document.documentElement.scrollHeight - window.innerHeight;
      setP(t > 0 ? (window.scrollY / t) * 100 : 0);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, background: "rgba(122,74,40,0.12)" }}>
      <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,#7a4a28,#d4a870,#e8c080)", transition: "width 0.06s linear", boxShadow: "0 0 12px rgba(212,168,112,0.9)" }} />
    </div>
  );
};

/* ─── 3D mouse-tilt wrapper ─────────────────────────────── */
interface TiltCardProps { children: ReactNode; style?: CSSProperties; intensity?: number; }
const TiltCard: React.FC<TiltCardProps> = ({ children, style, intensity = 10 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale(1.025)`;
    el.style.boxShadow = `${-x * 22}px ${-y * 22}px 44px rgba(80,40,10,0.24), 0 24px 64px rgba(80,40,10,0.18)`;
  }, [intensity]);
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.boxShadow = "0 24px 64px rgba(80,40,10,0.22)";
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1),box-shadow 0.28s", ...style }}>
      {children}
    </div>
  );
};

/* ─── Slide-in card ─────────────────────────────────────── */
interface SlideCardProps { children: ReactNode; direction?: "left"|"right"|"bottom"|"top"; delay?: number; active: boolean; style?: CSSProperties; }
const SlideCard: React.FC<SlideCardProps> = ({ children, direction = "left", delay = 0, active, style }) => {
  const fromMap: Record<string,string> = { left:"translateX(-64px)", right:"translateX(64px)", bottom:"translateY(60px)", top:"translateY(-60px)" };
  return (
    <div style={{ opacity: active ? 1 : 0, transform: active ? "translate(0,0)" : fromMap[direction], transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`, ...style }}>
      {children}
    </div>
  );
};

/* ─── SVG Icons ─────────────────────────────────────────── */
const IconLeaf: React.FC<{size?:number;color?:string}> = ({size=28,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);
const IconHandshake: React.FC<{size?:number;color?:string}> = ({size=28,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
  </svg>
);
const IconStar: React.FC<{size?:number;color?:string}> = ({size=28,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconEye: React.FC<{size?:number;color?:string}> = ({size=28,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconMountain: React.FC<{size?:number;color?:string}> = ({size=20,color="rgba(255,255,255,0.7)"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>
  </svg>
);
const IconFlower: React.FC<{size?:number;color?:string}> = ({size=20,color="rgba(255,255,255,0.7)"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z"/>
    <path d="M12 14a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z"/>
    <path d="M2 12a4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4z"/>
    <path d="M14 12a4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4z"/>
  </svg>
);
const IconSprout: React.FC<{size?:number;color?:string}> = ({size=20,color="rgba(255,255,255,0.7)"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/>
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-2-3.7.7-.1 3 .4 4.5.3z"/>
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.2-4.2-.8.1-3 1-4.4 1.6z"/>
  </svg>
);
const IconCertificate: React.FC<{size?:number;color?:string}> = ({size=14,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconRefresh: React.FC<{size?:number;color?:string}> = ({size=14,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IconShield: React.FC<{size?:number;color?:string}> = ({size=14,color="#7a4a28"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ─── 3D flip value card ─────────────────────────────────── */
interface FlipCardProps {
  Icon: React.FC<{size?:number;color?:string}>;
  title: string; desc: string; hoverHint: string;
  accent: string; delay: number; active: boolean;
}
const FlipCard: React.FC<FlipCardProps> = ({ Icon, title, desc, hoverHint, accent, delay, active }) => {
  const [flipped, setFlipped] = useState<boolean>(false);
  return (
    <div onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)}
      style={{ perspective: 1000, height: 230, cursor: "default", opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(52px)", transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.65s cubic-bezier(0.34,1.1,0.64,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 18, backgroundColor: "#fff", border: "1px solid #ede5d8", boxShadow: "0 4px 20px rgba(122,74,40,0.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 18px", textAlign: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(to right,#7a4a28,#d4a870)" }} />
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 4px 16px rgba(122,74,40,0.1)" }}>
            <Icon size={28} color="#7a4a28" />
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 21, color: "#2a1a0e", marginBottom: 8 }}>{title}</h3>
          <div style={{ width: 28, height: 1, background: "linear-gradient(to right,#c8a882,transparent)", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 12, color: "#c8b090", letterSpacing: "0.1em" }}>{hoverHint}</p>
        </div>
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 18, background: "linear-gradient(135deg,#2a1a0e 0%,#4a2a10 100%)", border: "1px solid rgba(212,168,112,0.22)", boxShadow: "0 4px 20px rgba(122,74,40,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 22px", textAlign: "center" }}>
          <div style={{ marginBottom: 14 }}><Icon size={36} color="#d4a870" /></div>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: 20, color: "#faf2e8", marginBottom: 10 }}>{title}</h3>
          <div style={{ width: 32, height: 1, background: "linear-gradient(to right,transparent,#d4a870,transparent)", marginBottom: 14 }} />
          <p style={{ fontSize: 13, lineHeight: 1.82, color: "rgba(250,242,232,0.76)" }}>{desc}</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Counting number ────────────────────────────────────── */
interface CountUpProps { target: string; suffix?: string; active: boolean; }
const CountUp: React.FC<CountUpProps> = ({ target, suffix = "", active }) => {
  const [val, setVal] = useState<number>(0);
  const num = parseInt(target) || 0;
  useEffect(() => {
    if (!active || num === 0) return;
    let start: number | null = null;
    const dur = 1300;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = setTimeout(() => requestAnimationFrame(step), 150);
    return () => clearTimeout(id);
  }, [active, num]);
  if (num === 0) return <>{target}</>;
  return <>{val}{suffix}</>;
};

/* ─── Magnetic CTA button ───────────────────────────────── */
interface MagBtnProps { children: ReactNode; }
const MagBtn: React.FC<MagBtnProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width/2)*0.28}px,${(e.clientY - r.top - r.height/2)*0.28}px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = "translate(0,0)"; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: "inline-block", transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <button
        style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 52px", borderRadius: 14, fontWeight: 600, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", border: "none", cursor: "pointer", background: "#7a4a28", boxShadow: "0 6px 32px rgba(122,74,40,0.4)", transition: "background 0.25s,box-shadow 0.25s", position: "relative", overflow: "hidden", fontFamily: "'Jost',sans-serif" }}
        onMouseEnter={e => { e.currentTarget.style.background="#9a5c30"; e.currentTarget.style.boxShadow="0 14px 48px rgba(122,74,40,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.background="#7a4a28"; e.currentTarget.style.boxShadow="0 6px 32px rgba(122,74,40,0.4)"; }}
      >
        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)", animation: "shine 3.5s ease infinite" }} />
        {children}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "arrowBounce 1.8s ease-in-out infinite" }}>
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </div>
  );
};

/* ─── Image URLs ─────────────────────────────────────────── */
const IMGS = {
  hero:   "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1600&q=80&fit=crop",
  spices: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=80&fit=crop",
  tea:    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&fit=crop",
  strip1: "https://images.unsplash.com/photo-1548013146-72479768bada?w=700&q=80&fit=crop",
  strip2: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=80&fit=crop",
  strip3: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80&fit=crop",
  cta:    "https://images.unsplash.com/photo-1489493585363-d69421e0edd3?w=1200&q=80&fit=crop",
} as const;

/* ─── Main component ─────────────────────────────────────── */
const AboutPage: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [vis, setVis] = useState<boolean>(false);

  const [s1Ref, s1]: [RefObject<HTMLDivElement>, boolean] = useInView();
  const [s2Ref, s2]: [RefObject<HTMLDivElement>, boolean] = useInView();
  const [s3Ref, s3]: [RefObject<HTMLDivElement>, boolean] = useInView();
  const [s4Ref, s4]: [RefObject<HTMLDivElement>, boolean] = useInView();
  const [statsRef, statsVis]: [RefObject<HTMLDivElement>, boolean] = useInView();
  const [stripRef, stripVis]: [RefObject<HTMLDivElement>, boolean] = useInView(0.08);
  const [stripHover, setStripHover] = useState<number>(-1);

  useEffect(() => {
    const timer = setTimeout(() => setVis(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const fade = (d: number): CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.8s ease ${d}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${d}s`,
  });

  const statItems = [
    { raw: "200", suffix: "+", labelKey: "about.stat1" },
    { raw: "12",  suffix: "",  labelKey: "about.stat2" },
    { raw: "6",   suffix: "×", labelKey: "about.stat3" },
    { raw: "100", suffix: "%", labelKey: "about.stat4" },
  ];

  const stripItems = [
    { src: IMGS.strip1, labelKey: "about.sourcing.r1", subKey: "about.sourcing.r1sub", Icon: IconMountain, wipe: "#d4b0f0", delay: 0 },
    { src: IMGS.strip2, labelKey: "about.sourcing.r2", subKey: "about.sourcing.r2sub", Icon: IconFlower,   wipe: "#f0a0b0", delay: 0.14 },
    { src: IMGS.strip3, labelKey: "about.sourcing.r3", subKey: "about.sourcing.r3sub", Icon: IconSprout,   wipe: "#a0d4a0", delay: 0.28 },
  ];

  const valueItems = [
    { Icon: IconLeaf,      titleKey: "about.values.v1", descKey: "about.values.v1desc", accent: "#e8f5e0", delay: 0.1 },
    { Icon: IconHandshake, titleKey: "about.values.v2", descKey: "about.values.v2desc", accent: "#fdf0e0", delay: 0.2 },
    { Icon: IconStar,      titleKey: "about.values.v3", descKey: "about.values.v3desc", accent: "#fefbe0", delay: 0.3 },
    { Icon: IconEye,       titleKey: "about.values.v4", descKey: "about.values.v4desc", accent: "#e0eeff", delay: 0.4 },
  ];

  const s1Tags = [
    t("about.sourcing.r1"),
    t("about.sourcing.r2"),
    t("about.sourcing.r3"),
    t("about.sourcing.marrakesh"),
  ];

  const s2Badges = [
    { Icon: IconCertificate, labelKey: "about.quality.cert1" },
    { Icon: IconRefresh,     labelKey: "about.quality.cert2" },
    { Icon: IconShield,      labelKey: "about.quality.cert3" },
  ];

  const dir       = isRTL ? "rtl" : "ltr";
  const s1ImgDir  = isRTL ? "right" : "left";
  const s1TextDir = isRTL ? "left"  : "right";
  const s2ImgDir  = isRTL ? "left"  : "right";
  const s2TextDir = isRTL ? "right" : "left";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@200;300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes floatA    { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(3deg)} }
        @keyframes floatB    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
        @keyframes slowSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulseRing { 0%{transform:scale(0.85);opacity:0.8} 70%{transform:scale(2.2);opacity:0} 100%{opacity:0} }
        @keyframes shine     { 0%{transform:translateX(-120%)} 22%{transform:translateX(120%)} 100%{transform:translateX(120%)} }
        @keyframes arrowBounce  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(6px)} }
        @keyframes borderDraw   { from{stroke-dashoffset:1800} to{stroke-dashoffset:0} }
        @keyframes heroImgIn    { from{opacity:0;transform:scale(1.08)} to{opacity:1;transform:scale(1)} }
        @keyframes statPop      { 0%{opacity:0;transform:scale(0.5) translateY(20px)} 65%{transform:scale(1.09) translateY(-3px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes lineGrow     { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1);transform-origin:left} }
        @keyframes badgePop     { 0%{opacity:0;transform:scale(0.45) translateY(14px)} 70%{transform:scale(1.08) translateY(-3px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes overlayWipe  { from{transform:scaleX(1);transform-origin:left} to{transform:scaleX(0);transform-origin:left} }
        @keyframes tagIn        { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ctaReveal    { from{opacity:0;transform:translateY(50px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes stripCardIn  { from{opacity:0;transform:translateY(48px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
        .strip-cell img { transition:transform 0.7s cubic-bezier(0.22,1,0.36,1) !important }
        .strip-cell:hover img { transform:scale(1.1) !important }
        .stat-card:hover .stat-num { color:#c8780a !important }
        .stat-num { transition:color 0.3s }
      `}</style>

      <ScrollBar />

      <div dir={dir} style={{ fontFamily: "'Jost',sans-serif", background: "#faf7f2", minHeight: "100vh" }}>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <div style={{ position: "relative", minHeight: 600, display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, animation: "heroImgIn 1.6s ease both" }}>
            <img src={IMGS.hero} alt="Moroccan spice market" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(18,7,2,0.92) 0%,rgba(18,7,2,0.62) 55%,rgba(18,7,2,0.12) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 52%,#faf7f2 100%)" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.16, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
          <svg style={{ position:"absolute", right:"5%", top:"50%", transform:"translateY(-50%)", width:280, height:280, opacity:0.1, animation:"slowSpin 80s linear infinite", pointerEvents:"none" }} viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="132" fill="none" stroke="#d4a870" strokeWidth="0.9" strokeDasharray="9 5" />
            <circle cx="140" cy="140" r="98"  fill="none" stroke="#d4a870" strokeWidth="0.6" strokeDasharray="3 6" />
            <circle cx="140" cy="140" r="62"  fill="none" stroke="#d4a870" strokeWidth="0.4" />
          </svg>
          <div style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "110px 32px 100px", width: "100%" }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{ ...fade(0.05), display:"flex", alignItems:"center", gap:14, marginBottom:22 }}>
                <span style={{ display:"block", width:32, height:1, background:"linear-gradient(to right,#d4a870,transparent)" }} />
                <p style={{ fontSize:11, letterSpacing:"0.45em", textTransform:"uppercase", fontWeight:600, color:"#d4a870" }}>{t("about.badge")}</p>
              </div>
              <div style={{ overflow:"hidden", marginBottom:28 }}>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,7vw,70px)", fontWeight:600, lineHeight:1.06, color:"#faf2e8", transform: vis ? "translateY(0)" : "translateY(110%)", transition:"transform 1.05s cubic-bezier(0.22,1,0.36,1) 0.1s" }}>
                  {t("about.hero.title")}
                </h1>
              </div>
              <div style={{ height:2, width:80, marginBottom:28, background:"linear-gradient(90deg,#7a4a28 0%,#d4a870 50%,#7a4a28 100%)", backgroundSize:"200% auto", animation: vis ? "shimmer 2.8s linear infinite" : "none", opacity: vis ? 1 : 0, transition:"opacity 0.6s ease 0.4s" }} />
              <p style={{ ...fade(0.35), fontSize:16, fontWeight:300, lineHeight:2, color:"rgba(250,242,232,0.82)", maxWidth:460, marginBottom:32 }}>{t("about.hero.desc")}</p>

              {/* ── Est. line — fixed visibility ── */}
              <div style={{ ...fade(0.5), display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ position:"relative", width:14, height:14, flexShrink:0 }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#d4a870", animation:"pulseRing 2.4s ease-out infinite" }} />
                  <div style={{ position:"absolute", inset:3, borderRadius:"50%", background:"#d4a870" }} />
                </div>
                <span style={{ fontSize:14, color:"rgba(255,235,190,0.95)", letterSpacing:"0.08em", fontWeight:400 }}>
                  {t("about.hero.est")}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ══ STATS ══════════════════════════════════════════════ */}
        <div ref={statsRef} style={{ background:"#fff", borderBottom:"1px solid #ede5d8", padding:"48px 32px" }}>
          <div style={{ maxWidth:960, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:24 }}>
            {statItems.map((s, i) => (
              <div key={s.labelKey} className="stat-card" style={{ textAlign:"center", padding:"8px 4px", opacity: statsVis ? 1 : 0, animation: statsVis ? `statPop 0.72s cubic-bezier(0.34,1.56,0.64,1) ${i*0.13}s both` : "none" }}>
                <span className="stat-num" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,5vw,58px)", fontWeight:600, color:"#7a4a28", lineHeight:1, display:"block" }}>
                  <CountUp target={s.raw} suffix={s.suffix} active={statsVis} />
                </span>
                <span style={{ fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", color:"#b09080", fontWeight:500, display:"block", marginTop:7 }}>{t(s.labelKey)}</span>
                <div style={{ height:1, width:32, background:"linear-gradient(to right,#d4a870,transparent)", margin:"10px auto 0", animation: statsVis ? `lineGrow 0.6s ease ${0.4+i*0.13}s both` : "none" }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:960, margin:"0 auto", padding:"88px 24px" }}>

          {/* ══ S1 — Heritage ════════════════════════════════════ */}
          <div ref={s1Ref} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:60, alignItems:"center", marginBottom:104 }}>
            <SlideCard direction={s1ImgDir as any} delay={0} active={s1} style={{ position:"relative" }}>
              <TiltCard style={{ borderRadius:24, height:420, overflow:"hidden", position:"relative", boxShadow:"0 24px 64px rgba(80,40,10,0.22)" }}>
                <div style={{ position:"absolute", inset:0, zIndex:2, background:"#e8c570", pointerEvents:"none", animation: s1 ? "overlayWipe 0.85s cubic-bezier(0.77,0,0.18,1) 0.12s forwards" : "none" }} />
                <img src={IMGS.spices} alt="Moroccan spices" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(20,8,2,0.48) 0%,transparent 55%)", pointerEvents:"none" }} />
                <svg style={{ position:"absolute", top:16, right:16, opacity:0.55, pointerEvents:"none" }} width="36" height="36" viewBox="0 0 36 36"><path d="M36,0 L36,36 L0,36" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/></svg>
                <svg style={{ position:"absolute", bottom:16, left:16, opacity:0.55, pointerEvents:"none" }} width="36" height="36" viewBox="0 0 36 36"><path d="M0,36 L0,0 L36,0" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/></svg>
              </TiltCard>
              {s1 && (
                <div style={{ position:"absolute", bottom:24, left:-20, zIndex:10, background:"rgba(255,255,255,0.97)", border:"1px solid rgba(122,74,40,0.13)", borderRadius:14, padding:"12px 18px", boxShadow:"0 10px 36px rgba(80,40,10,0.18)", animation:"badgePop 0.62s cubic-bezier(0.34,1.56,0.64,1) 0.72s both" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#f5ede0", display:"flex", alignItems:"center", justifyContent:"center", animation:"floatA 4s ease-in-out infinite", flexShrink:0 }}>
                      <IconLeaf size={18} color="#7a4a28" />
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:600, color:"#2a1a0e" }}>{t("about.heritage.badge")}</p>
                      <p style={{ fontSize:12, color:"#a08070" }}>{t("about.heritage.badgeSub")}</p>
                    </div>
                  </div>
                </div>
              )}
            </SlideCard>

            <div>
              <SlideCard direction={s1TextDir as any} delay={0.08} active={s1}>
                <p style={{ fontSize:11, letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, color:"#9a6840", marginBottom:14 }}>{t("about.heritage.label")}</p>
              </SlideCard>
              <SlideCard direction={s1TextDir as any} delay={0.16} active={s1}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:600, color:"#2a1a0e", marginBottom:18, lineHeight:1.1 }} dangerouslySetInnerHTML={{ __html: t("about.heritage.title") }} />
              </SlideCard>
              <SlideCard direction={s1TextDir as any} delay={0.22} active={s1}>
                <div style={{ height:1.5, width:48, background:"linear-gradient(to right,#7a4a28,transparent)", marginBottom:22, animation: s1 ? "lineGrow 0.8s ease 0.35s both" : "none" }} />
              </SlideCard>
              <SlideCard direction={s1TextDir as any} delay={0.27} active={s1}>
                <p style={{ fontSize:15, lineHeight:1.9, color:"#8a7060", marginBottom:18 }}>{t("about.heritage.p1")}</p>
              </SlideCard>
              <SlideCard direction={s1TextDir as any} delay={0.33} active={s1}>
                <p style={{ fontSize:15, lineHeight:1.9, color:"#8a7060", marginBottom:26 }}>{t("about.heritage.p2")}</p>
              </SlideCard>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {s1Tags.map((r, i) => (
                  <span key={r} style={{ fontSize:12, padding:"5px 14px", borderRadius:20, background:"#f5ede0", border:"1px solid #ddd0be", color:"#7a4a28", letterSpacing:"0.06em", opacity: s1 ? 1 : 0, animation: s1 ? `tagIn 0.5s cubic-bezier(0.22,1,0.36,1) ${0.52+i*0.09}s both` : "none" }}>{r}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ══ S2 — Quality ════════════════════════════════════ */}
          <div ref={s2Ref} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:60, alignItems:"center", marginBottom:104 }}>
            <div>
              <SlideCard direction={s2TextDir as any} delay={0.06} active={s2}>
                <p style={{ fontSize:11, letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, color:"#9a6840", marginBottom:14 }}>{t("about.quality.label")}</p>
              </SlideCard>
              <SlideCard direction={s2TextDir as any} delay={0.14} active={s2}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:600, color:"#2a1a0e", marginBottom:18, lineHeight:1.1 }} dangerouslySetInnerHTML={{ __html: t("about.quality.title") }} />
              </SlideCard>
              <SlideCard direction={s2TextDir as any} delay={0.2} active={s2}>
                <div style={{ height:1.5, width:48, background:"linear-gradient(to right,#7a4a28,transparent)", marginBottom:22, animation: s2 ? "lineGrow 0.8s ease 0.3s both" : "none" }} />
              </SlideCard>
              <SlideCard direction={s2TextDir as any} delay={0.25} active={s2}>
                <p style={{ fontSize:15, lineHeight:1.9, color:"#8a7060", marginBottom:18 }}>{t("about.quality.p1")}</p>
              </SlideCard>
              <SlideCard direction={s2TextDir as any} delay={0.3} active={s2}>
                <p style={{ fontSize:15, lineHeight:1.9, color:"#8a7060", marginBottom:26 }}>{t("about.quality.p2")}</p>
              </SlideCard>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {s2Badges.map((c, i) => (
                  <div key={c.labelKey} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#f5ede0,#ede0cc)", border:"1px solid #ddd0be", opacity: s2 ? 1 : 0, animation: s2 ? `tagIn 0.5s cubic-bezier(0.22,1,0.36,1) ${0.45+i*0.1}s both` : "none" }}>
                    <c.Icon size={14} color="#7a4a28" />
                    <span style={{ fontSize:12, fontWeight:600, color:"#7a4a28", letterSpacing:"0.06em" }}>{t(c.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>

            <SlideCard direction={s2ImgDir as any} delay={0} active={s2} style={{ position:"relative" }}>
              <TiltCard style={{ borderRadius:24, height:420, overflow:"hidden", position:"relative", boxShadow:"0 24px 64px rgba(80,40,10,0.22)" }}>
                <div style={{ position:"absolute", inset:0, zIndex:2, background:"#a8c890", pointerEvents:"none", animation: s2 ? "overlayWipe 0.85s cubic-bezier(0.77,0,0.18,1) 0.12s forwards" : "none" }} />
                <img src={IMGS.tea} alt="Moroccan mint tea" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(20,8,2,0.45) 0%,transparent 55%)", pointerEvents:"none" }} />
                <svg style={{ position:"absolute", top:16, left:16, opacity:0.55, pointerEvents:"none" }} width="36" height="36" viewBox="0 0 36 36"><path d="M0,0 L36,0 L36,36" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/></svg>
              </TiltCard>
              {s2 && (
                <div style={{ position:"absolute", bottom:24, right:-20, zIndex:10, background:"rgba(255,255,255,0.97)", border:"1px solid rgba(122,74,40,0.13)", borderRadius:14, padding:"12px 18px", boxShadow:"0 10px 36px rgba(80,40,10,0.18)", animation:"badgePop 0.62s cubic-bezier(0.34,1.56,0.64,1) 0.72s both" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#e8f5e0", display:"flex", alignItems:"center", justifyContent:"center", animation:"floatB 4s ease-in-out infinite", flexShrink:0 }}>
                      <IconLeaf size={18} color="#5a8a40" />
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:600, color:"#2a1a0e" }}>{t("about.quality.badge")}</p>
                      <p style={{ fontSize:12, color:"#a08070" }}>{t("about.quality.badgeSub")}</p>
                    </div>
                  </div>
                </div>
              )}
            </SlideCard>
          </div>

          {/* ══ SOURCING STRIP ════════════════════════════════════ */}
          <div ref={stripRef} style={{ marginBottom:104 }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <SlideCard direction="bottom" delay={0} active={stripVis}>
                <p style={{ fontSize:11, letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, color:"#9a6840", marginBottom:12 }}>{t("about.sourcing.label")}</p>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:600, color:"#2a1a0e" }}>{t("about.sourcing.title")}</h2>
              </SlideCard>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              {stripItems.map((item, i) => (
                <div key={i} className="strip-cell"
                  onMouseEnter={() => setStripHover(i)}
                  onMouseLeave={() => setStripHover(-1)}
                  style={{ position:"relative", height:268, overflow:"hidden", cursor:"default", borderRadius:18, boxShadow: stripHover===i ? "0 28px 60px rgba(80,40,10,0.3)" : "0 12px 36px rgba(80,40,10,0.16)", opacity: stripVis ? 1 : 0, animation: stripVis ? `stripCardIn 0.72s cubic-bezier(0.22,1,0.36,1) ${item.delay+0.08}s both` : "none", transition:"box-shadow 0.35s" }}>
                  <div style={{ position:"absolute", inset:0, zIndex:2, background:item.wipe, pointerEvents:"none", animation: stripVis ? `overlayWipe 0.8s cubic-bezier(0.77,0,0.18,1) ${item.delay+0.28}s forwards` : "none" }} />
                  <img src={item.src} alt={t(item.labelKey)} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(10,5,0,0.78) 0%,transparent 52%)", transition:"opacity 0.4s", opacity: stripHover===i ? 1 : 0.62 }} />
                  <div style={{ position:"absolute", top:14, right:14, background: stripHover===i ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)", backdropFilter:"blur(6px)", borderRadius:8, padding:"4px 10px", border:"1px solid rgba(255,255,255,0.22)", transition:"background 0.3s" }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)", letterSpacing:"0.1em" }}>0{i+1}</span>
                  </div>
                  <div style={{ position:"absolute", bottom:18, left:18, right:18, transform: stripHover===i ? "translateY(0)" : "translateY(8px)", transition:"transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <item.Icon size={16} color="rgba(255,255,255,0.85)" />
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:"#fff" }}>{t(item.labelKey)}</p>
                    </div>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", letterSpacing:"0.05em", opacity: stripHover===i ? 1 : 0, transition:"opacity 0.32s ease 0.06s" }}>{t(item.subKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ VALUES — 3D flip cards ═════════════════════════════ */}
          <div ref={s3Ref} style={{ marginBottom:104 }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <SlideCard direction="bottom" delay={0} active={s3}>
                <p style={{ fontSize:11, letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, color:"#9a6840", marginBottom:12 }}>{t("about.values.label")}</p>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(30px,4vw,48px)", fontWeight:600, color:"#2a1a0e", marginBottom:6 }}>{t("about.values.title")}</h2>
                <p style={{ fontSize:13, color:"#b09080", letterSpacing:"0.05em" }}>{t("about.values.hint")}</p>
              </SlideCard>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
              {valueItems.map((v) => (
                <FlipCard
                  key={v.titleKey}
                  Icon={v.Icon}
                  title={t(v.titleKey)}
                  desc={t(v.descKey)}
                  hoverHint={t("about.values.hoverHint")}
                  accent={v.accent}
                  delay={v.delay}
                  active={s3}
                />
              ))}
            </div>
          </div>

          {/* ══ CTA ════════════════════════════════════════════════ */}
          <div ref={s4Ref} style={{ position:"relative", borderRadius:28, overflow:"hidden", boxShadow:"0 32px 80px rgba(80,40,10,0.28)", opacity: s4 ? 1 : 0, animation: s4 ? "ctaReveal 0.95s cubic-bezier(0.22,1,0.36,1) both" : "none" }}>
            <div style={{ position:"absolute", inset:0 }}>
              <img src={IMGS.cta} alt="Morocco landscape" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(18,7,2,0.9) 0%,rgba(48,18,5,0.85) 100%)" }} />
              <div style={{ position:"absolute", inset:0, opacity:0.14, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
            </div>
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox="0 0 900 340" preserveAspectRatio="none">
              <rect x="2" y="2" width="896" height="336" rx="26" fill="none" stroke="rgba(212,168,112,0.5)" strokeWidth="1.5" strokeDasharray="1800" strokeDashoffset="1800" style={{ animation: s4 ? "borderDraw 2.6s cubic-bezier(0.22,1,0.36,1) 0.4s forwards" : "none" }} />
            </svg>
            <div style={{ position:"relative", zIndex:2, padding:"80px 40px", textAlign:"center" }}>
              <SlideCard direction="bottom" delay={0.1} active={s4}>
                <p style={{ fontSize:11, letterSpacing:"0.42em", textTransform:"uppercase", fontWeight:700, color:"#d4a870", marginBottom:14 }}>{t("about.cta.label")}</p>
              </SlideCard>
              <SlideCard direction="bottom" delay={0.18} active={s4}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,5vw,54px)", fontWeight:600, color:"#faf2e8", lineHeight:1.1, marginBottom:20 }}>{t("about.cta.title")}</h2>
              </SlideCard>
              <SlideCard direction="bottom" delay={0.25} active={s4}>
                <div style={{ height:1, width:60, margin:"0 auto 24px", background:"linear-gradient(90deg,transparent,#d4a870,transparent)" }} />
              </SlideCard>
              <SlideCard direction="bottom" delay={0.3} active={s4}>
                <p style={{ fontSize:15, fontWeight:300, lineHeight:1.9, color:"rgba(250,242,232,0.82)", maxWidth:480, margin:"0 auto 40px" }}>{t("about.cta.desc")}</p>
              </SlideCard>
              <SlideCard direction="bottom" delay={0.38} active={s4}>
                <MagBtn>{t("about.cta.btn")}</MagBtn>
              </SlideCard>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AboutPage;