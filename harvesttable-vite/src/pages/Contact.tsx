// src/pages/Contact.tsx
import React, { useState, useEffect, useRef, ReactNode, CSSProperties, RefObject } from "react";
import { useLanguage } from "../context/Languagecontext";

function useInView(t = 0.12): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } },
      { threshold: t }
    );
    obs.observe(el); return () => obs.disconnect();
  }, [t]);
  return [ref, v];
}

const Slide: React.FC<{
  children: ReactNode; delay?: number; active: boolean;
  dir?: "up" | "left" | "right"; style?: CSSProperties
}> = ({ children, delay = 0, active, dir = "up", style }) => {
  const from = dir === "left" ? "translateX(-44px)" : dir === "right" ? "translateX(44px)" : "translateY(36px)";
  return (
    <div style={{
      opacity: active ? 1 : 0,
      transform: active ? "translate(0,0)" : from,
      transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s,transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
};

// ─── CSRF helper ─────────────────────────────────────────────────────────────
const getCsrfToken = (): string => {
  const m = document.cookie.match(/csrftoken=([^;]+)/);
  return m ? m[1] : "";
};

// ─────────────────────────────────────────────────────────────────────────────
const Contact: React.FC = () => {
  const { isRTL, t, lang } = useLanguage();
  const [vis, setVis] = useState(false);
  const [r1, v1] = useInView();
  const [r2, v2] = useInView();

  useEffect(() => {
    const id = setTimeout(() => setVis(true), 80);
    return () => clearTimeout(id);
  }, []);

  const f = (d: number): CSSProperties => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : "translateY(24px)",
    transition: `opacity .75s ease ${d}s,transform .75s cubic-bezier(.22,1,.36,1) ${d}s`,
  });

  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── Submit handler — calls Django /api/contact/submit/ ──────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/contact/submit/", {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken":  getCsrfToken(),
        },
        body: JSON.stringify({
          name:    form.name.trim(),
          email:   form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          lang,          // ← current UI language sent to backend
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface the first validation error returned by DRF
        const firstError =
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Something went wrong. Please try again.";
        throw new Error(firstError);
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { icon: "✉️", title: t("contact.channel.email.title"),    value: t("contact.channel.email.value"),    sub: t("contact.channel.email.sub"),    href: "mailto:support@harvesttable.com", bg: "#f5ede0" },
    { icon: "💬", title: t("contact.channel.chat.title"),     value: t("contact.channel.chat.value"),     sub: t("contact.channel.chat.sub"),     href: "#",                               bg: "#f0f5e8" },
    { icon: "📍", title: t("contact.channel.location.title"), value: t("contact.channel.location.value"), sub: t("contact.channel.location.sub"), href: "#",                               bg: "#fef5e0" },
  ];

  const responseTimes = [
    { label: t("contact.times.general"),   time: t("contact.times.general.time")   },
    { label: t("contact.times.orders"),    time: t("contact.times.orders.time")    },
    { label: t("contact.times.wholesale"), time: t("contact.times.wholesale.time") },
    { label: t("contact.times.partners"),  time: t("contact.times.partners.time")  },
  ];

  const inputStyle: CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: "1px solid #ede5d8", fontSize: 15,
    fontFamily: "'Jost',sans-serif", color: "#2a1a0e",
    background: "#faf7f2", outline: "none",
    transition: "border-color .2s,box-shadow .2s",
    boxSizing: "border-box",
    textAlign: isRTL ? "right" : "left",
    direction:  isRTL ? "rtl" : "ltr",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .contact-input:focus { border-color:#9a6840 !important; box-shadow:0 0 0 3px rgba(154,104,64,0.12) !important; background:#fff !important; }
        .contact-input::placeholder { color:#b09080; }
        .contact-channel:hover { box-shadow:0 10px 32px rgba(122,74,40,0.12) !important; border-color:#c8a882 !important; transform:translateY(-3px) !important; }
      `}</style>

      <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Jost',sans-serif", background: "#faf7f2", minHeight: "100vh" }} className="page-offset">

        {/* ── Hero ── */}
        <div style={{ position: "relative", minHeight: 320, display: "flex", alignItems: "center", overflow: "hidden", background: "linear-gradient(135deg,#0e1a2a 0%,#102040 60%,#182a50 100%)" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: noise }}/>
          <svg style={{ position: "absolute", right: "4%", top: "50%", transform: "translateY(-50%)", width: 240, height: 240, opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="114" fill="none" stroke="#70a8d4" strokeWidth="0.8" strokeDasharray="8 5"/>
            <circle cx="120" cy="120" r="80"  fill="none" stroke="#70a8d4" strokeWidth="0.5" strokeDasharray="3 5"/>
          </svg>
          <div style={{ position: "relative", zIndex: 2, maxWidth: 960, margin: "0 auto", padding: "80px 32px", width: "100%" }}>
            <div style={{ ...f(0.05), display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ display: "block", width: 28, height: 1, background: "linear-gradient(to right,#70a8d4,transparent)" }}/>
              <p style={{ fontSize: 10, letterSpacing: "0.42em", textTransform: "uppercase", fontWeight: 700, color: "#70a8d4", margin: 0 }}>
                {t("contact.hero.eyebrow")}
              </p>
            </div>
            <h1 style={{ ...f(0.12), fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,6vw,62px)", fontWeight: 600, color: "#faf2e8", lineHeight: 1.08, margin: "0 0 16px" }}>
              {t("contact.hero.title")}
            </h1>
            <div style={{ ...f(0.18), height: 2, width: 60, background: "linear-gradient(90deg,#284a7a,#70a8d4,#284a7a)", backgroundSize: "200% auto", animation: "shimmer 2.8s linear infinite", marginBottom: 18 }}/>
            <p style={{ ...f(0.24), fontSize: 16, fontWeight: 300, lineHeight: 1.9, color: "rgba(250,242,232,0.75)", maxWidth: 460, margin: 0 }}>
              {t("contact.hero.subtitle")}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>

          {/* ── Channel cards ── */}
          <div ref={r1} style={{ marginBottom: 72 }}>
            <Slide delay={0} active={v1}>
              <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", fontWeight: 700, color: "#9a6840", marginBottom: 10 }}>
                {t("contact.section1.eyebrow")}
              </p>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(26px,4vw,40px)", fontWeight: 600, color: "#2a1a0e", marginBottom: 32, lineHeight: 1.1 }}>
                {t("contact.section1.title")}
              </h2>
            </Slide>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {channels.map((c, i) => (
                <Slide key={c.title} delay={0.09 * i} active={v1}>
                  <a href={c.href} className="contact-channel" style={{ display: "block", background: "#fff", border: "1px solid #ede5d8", borderRadius: 16, padding: "26px 22px", textDecoration: "none", transition: "box-shadow .25s,border-color .25s,transform .25s" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 24 }}>{c.icon}</div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#2a1a0e", marginBottom: 6 }}>{c.title}</h3>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#7a4a28", marginBottom: 4 }}>{c.value}</p>
                    <p style={{ fontSize: 13, color: "#a08878", margin: 0 }}>{c.sub}</p>
                  </a>
                </Slide>
              ))}
            </div>
          </div>

          {/* ── Form + sidebar ── */}
          <div ref={r2} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 32, alignItems: "start" }}>

            {/* Form card */}
            <Slide delay={0} active={v2} dir="left">
              <div style={{ background: "#fff", border: "1px solid #ede5d8", borderRadius: 20, padding: "36px 32px" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", fontWeight: 700, color: "#9a6840", marginBottom: 10 }}>
                  {t("contact.form.eyebrow")}
                </p>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 600, color: "#2a1a0e", marginBottom: 6, lineHeight: 1.1 }}>
                  {t("contact.form.title")}
                </h2>
                <div style={{ height: 1.5, width: 40, background: "linear-gradient(to right,#7a4a28,transparent)", marginBottom: 28 }}/>

                {/* ── Success state ── */}
                {sent ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(58,96,40,0.10)", border: "1px solid rgba(58,96,40,0.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✅</div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: "#2a1a0e", marginBottom: 10 }}>
                      {t("contact.form.sent.title")}
                    </h3>
                    <p style={{ fontSize: 15, color: "#8a7060", lineHeight: 1.75 }}>
                      {t("contact.form.sent.desc")}
                    </p>
                  </div>
                ) : (

                  /* ── Form ── */
                  <form onSubmit={handleSubmit}>

                    {/* Error banner */}
                    {error && (
                      <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 10, background: "rgba(176,64,64,0.08)", border: "1px solid rgba(176,64,64,0.22)", color: "#8a2a2a", fontSize: 13, lineHeight: 1.6 }}>
                        {error}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5a4030", marginBottom: 6, letterSpacing: "0.04em" }}>
                          {t("contact.form.name")}
                        </label>
                        <input
                          required className="contact-input" style={inputStyle}
                          placeholder={t("contact.form.name.placeholder")}
                          value={form.name}
                          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5a4030", marginBottom: 6, letterSpacing: "0.04em" }}>
                          {t("contact.form.email")}
                        </label>
                        <input
                          required type="email" className="contact-input" style={inputStyle}
                          placeholder={t("common.emailPlaceholder")}
                          value={form.email}
                          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5a4030", marginBottom: 6, letterSpacing: "0.04em" }}>
                        {t("contact.form.subject")}
                      </label>
                      <input
                        required className="contact-input" style={inputStyle}
                        placeholder={t("contact.form.subject.placeholder")}
                        value={form.subject}
                        onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5a4030", marginBottom: 6, letterSpacing: "0.04em" }}>
                        {t("contact.form.message")}
                      </label>
                      <textarea
                        required className="contact-input"
                        style={{ ...inputStyle, minHeight: 130, resize: "vertical" }}
                        placeholder={t("contact.form.message.placeholder")}
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      style={{
                        width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
                        cursor: sending ? "not-allowed" : "pointer",
                        background: sending ? "rgba(122,74,40,0.6)" : "#7a4a28",
                        color: "#fff", fontSize: 15, fontWeight: 600,
                        fontFamily: "'Jost',sans-serif", letterSpacing: "0.04em",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "background .2s,box-shadow .2s",
                        boxShadow: "0 4px 20px rgba(122,74,40,0.28)",
                      }}
                      onMouseEnter={e => { if (!sending) (e.currentTarget as HTMLElement).style.background = "#8f5830"; }}
                      onMouseLeave={e => { if (!sending) (e.currentTarget as HTMLElement).style.background = "#7a4a28"; }}
                    >
                      {sending ? (
                        <>
                          <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }}/>
                          {t("contact.form.sending")}
                        </>
                      ) : t("contact.form.send")}
                    </button>

                  </form>
                )}
              </div>
            </Slide>

            {/* Sidebar */}
            <div>
              <Slide delay={0.12} active={v2} dir="right">
                <div style={{ background: "#fff", border: "1px solid #ede5d8", borderRadius: 16, padding: "28px 24px", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#2a1a0e", marginBottom: 16 }}>
                    {t("contact.times.title")}
                  </h3>
                  {responseTimes.map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < responseTimes.length - 1 ? "1px solid #f4ede4" : "none" }}>
                      <span style={{ fontSize: 14, color: "#5a4030" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#7a4a28", background: "rgba(122,74,40,0.08)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(122,74,40,0.15)" }}>
                        {row.time}
                      </span>
                    </div>
                  ))}
                </div>
              </Slide>

              <Slide delay={0.2} active={v2} dir="right">
                <div style={{ background: "linear-gradient(135deg,#2a1a0e,#4a2a10)", border: "1px solid rgba(212,168,112,0.2)", borderRadius: 16, padding: "28px 24px" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>🌿</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#faf2e8", marginBottom: 10 }}>
                    {t("contact.did.title")}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(250,242,232,0.72)", margin: "0 0 18px", fontWeight: 300 }}>
                    {t("contact.did.desc")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,168,112,0.15)", border: "1px solid rgba(212,168,112,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
                    <span style={{ fontSize: 13, color: "rgba(212,168,112,0.85)", fontWeight: 500 }}>
                      {t("contact.did.location")}
                    </span>
                  </div>
                </div>
              </Slide>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;