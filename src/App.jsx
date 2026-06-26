import { useState, useEffect, useCallback, useRef } from "react";

// ── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3000").replace(/\/$/, "");

// ── AUTH ──────────────────────────────────────────────────────────────────
const getToken  = () => localStorage.getItem("sb_token");
const getUser   = () => { try { return JSON.parse(localStorage.getItem("sb_user") || "null"); } catch { return null; } };
const setAuth   = (t, u) => { localStorage.setItem("sb_token", t); localStorage.setItem("sb_user", JSON.stringify(u)); };
const clearAuth = () => { localStorage.removeItem("sb_token"); localStorage.removeItem("sb_user"); };

// ── API ───────────────────────────────────────────────────────────────────
const api = async (path, method = "GET", body = null) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) { clearAuth(); window.location.reload(); throw new Error("Session expired"); }
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
  return res.json();
};

// ── HELPERS ───────────────────────────────────────────────────────────────
const idr = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
const ago = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s lalu`;
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  return new Date(ts).toLocaleDateString("id-ID");
};

// ── DESIGN TOKENS — "Quantum Console" ──────────────────────────────────────
const T = {
  void:     "#0A0612",
  panel:    "#120A1F",
  surface:  "#170D28",
  card:     "#150C24",
  cardSolid:"#170D28",
  border:   "rgba(255,255,255,0.09)",
  borderHi: "rgba(255,42,156,0.4)",
  glass:    "rgba(255,255,255,0.045)",

  cyan:     "#00F0FF",
  cyanDim:  "rgba(0,240,255,0.13)",
  cyanGlow: "rgba(0,240,255,0.5)",
  violet:   "#FF2A9C",
  violetDim:"rgba(255,42,156,0.14)",

  text:     "#F1E9FB",
  textSub:  "#9A8FB5",
  textMuted:"#5C5176",

  green:    "#39FF8E",
  greenDim: "rgba(57,255,142,0.13)",
  amber:    "#FFD23F",
  amberDim: "rgba(255,210,63,0.13)",
  red:      "#FF3366",
  redDim:   "rgba(255,51,102,0.13)",
  blue:     "#7B6CFF",
  blueDim:  "rgba(123,108,255,0.13)",

  fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
  fontBody:    "'Inter', -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

// ── ICON SET (inline SVG, stroke-based, no emoji) ──────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    grid:        <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    orders:      <svg {...common}><path d="M9 3h6l1 3H8l1-3z"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M9 11h6M9 15h6"/></svg>,
    box:         <svg {...common}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>,
    layers:      <svg {...common}><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/></svg>,
    bolt:        <svg {...common}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>,
    megaphone:   <svg {...common}><path d="M3 11v2a2 2 0 002 2h1l3 5h2l-1-5h2l9 4V6l-9 4H6a2 2 0 00-2 2z"/><path d="M21 9v6"/></svg>,
    chart:       <svg {...common}><path d="M3 3v18h18"/><path d="M7 16l4-6 3 3 5-8"/></svg>,
    activity:    <svg {...common}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    users:       <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14c2.8.3 5 2.4 5 6"/></svg>,
    settings:    <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 13.6a1.7 1.7 0 000-3.2l-1-.2a7.5 7.5 0 00-.7-1.7l.5-.9a1.7 1.7 0 00-2.3-2.3l-.9.5a7.5 7.5 0 00-1.7-.7l-.2-1a1.7 1.7 0 00-3.2 0l-.2 1a7.5 7.5 0 00-1.7.7l-.9-.5a1.7 1.7 0 00-2.3 2.3l.5.9a7.5 7.5 0 00-.7 1.7l-1 .2a1.7 1.7 0 000 3.2l1 .2a7.5 7.5 0 00.7 1.7l-.5.9a1.7 1.7 0 002.3 2.3l.9-.5a7.5 7.5 0 001.7.7l.2 1a1.7 1.7 0 003.2 0l.2-1a7.5 7.5 0 001.7-.7l.9.5a1.7 1.7 0 002.3-2.3l-.5-.9a7.5 7.5 0 00.7-1.7l1-.2z"/></svg>,
    logout:      <svg {...common}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
    chevronLeft: <svg {...common}><path d="M15 18l-6-6 6-6"/></svg>,
    chevronRight:<svg {...common}><path d="M9 18l6-6-6-6"/></svg>,
    menu:        <svg {...common}><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
    plus:        <svg {...common}><path d="M12 5v14M5 12h14"/></svg>,
    trash:       <svg {...common}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>,
    check:       <svg {...common}><path d="M20 6L9 17l-5-5"/></svg>,
    x:           <svg {...common}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    edit:        <svg {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
    eye:         <svg {...common}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff:      <svg {...common}><path d="M17.94 17.94A10.5 10.5 0 0112 19c-7 0-11-7-11-7a18.4 18.4 0 015-5.94M9.9 4.24A10.6 10.6 0 0112 4c7 0 11 7 11 7a18.4 18.4 0 01-2.16 3.19m-6.3-.85a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></svg>,
    link:        <svg {...common}><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>,
    copy:        <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    external:    <svg {...common}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>,
    bot:         <svg {...common}><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.2"/><circle cx="9" cy="13" r="1.2" fill={color}/><circle cx="15" cy="13" r="1.2" fill={color}/><path d="M9 17h6"/></svg>,
    refresh:     <svg {...common}><path d="M21 2v6h-6"/><path d="M3 22v-6h6"/><path d="M3.5 9a9 9 0 0115-4.7L21 8"/><path d="M20.5 15a9 9 0 01-15 4.7L3 16"/></svg>,
    creditCard:  <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>,
    qr:          <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M19 14h2M14 19h2M19 19h2v2"/></svg>,
    note:        <svg {...common}><path d="M4 4h12l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 16h5"/></svg>,
    lock:        <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
    key:         <svg {...common}><circle cx="8" cy="15" r="4"/><path d="M10.5 12.5L20 3M16 7l3 3M19 4l1.5 1.5"/></svg>,
    crown:       <svg {...common}><path d="M3 17h18l-2-9-4 4-3-7-3 7-4-4-2 9z"/></svg>,
    pulse:       <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M8 12h2l2-4 2 8 2-4h2"/></svg>,
    inbox:       <svg {...common}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
    search:      <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
    filter:      <svg {...common}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
    sparkle:     <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
    alertCircle: <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>,
    info:        <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>,
    clock:       <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
    tag:         <svg {...common}><path d="M20.6 11.4L13 3.8a2 2 0 00-2.8 0L3.8 10.2a2 2 0 000 2.8l7.6 7.6a2 2 0 002.8 0l6.4-6.4a2 2 0 000-2.8z"/><circle cx="9" cy="9" r="1.3" fill={color}/></svg>,
  };
  return paths[name] || null;
};

// ── TOAST ─────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  };
  return { toasts, toast: { success: m => add(m, "success"), error: m => add(m, "error"), info: m => add(m, "info") } };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  const C = {
    success: { border: T.cyan,  text: T.cyan,  icon: "check" },
    error:   { border: T.red,   text: T.red,   icon: "x" },
    info:    { border: T.blue,  text: T.blue,  icon: "info" },
  };
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => {
        const c = C[t.type] || C.info;
        return (
          <div key={t.id} className="toast-in" style={{
            background: T.cardSolid,
            border: `1px solid ${c.border}44`, borderLeft: `2px solid ${c.border}`,
            padding: "13px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            maxWidth: 340, boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)`,
            display: "flex", alignItems: "center", gap: 11, color: T.text,
          }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${c.border}18`, border: `1px solid ${c.border}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={c.icon} size={12} color={c.text} strokeWidth={2.4} />
            </span>
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────────────────
const STATUS = {
  pending:   { color: T.amber,  label: "Menunggu" },
  delivered: { color: T.cyan,   label: "Terkirim" },
  cancelled: { color: T.red,    label: "Dibatalkan" },
  preorder:  { color: T.violet, label: "Pre-Order" },
};

function Badge({ status }) {
  const s = STATUS[status] || { color: T.textSub, label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${s.color}14`, color: s.color, padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", border: `1px solid ${s.color}30` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {s.label}
    </span>
  );
}

// ── GLASS CARD ────────────────────────────────────────────────────────────
function Card({ children, style = {}, accent = null, className = "" }) {
  return (
    <div className={`glass-card ${className}`} style={{
      background: T.card,
      borderRadius: 14, padding: 24, border: `1px solid ${T.border}`,
      position: "relative", overflow: "hidden",
      boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 24px -12px rgba(0,0,0,0.5)",
      ...style,
    }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.85 }} />}
      {children}
    </div>
  );
}

// ── GLASS BUTTON ──────────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "primary", disabled = false, full = false, size = "md", icon = null, style = {} }) {
  const variants = {
    primary: { bg: `linear-gradient(135deg, ${T.cyan}, #0FD9C2)`, text: "#06140F", border: "transparent", shadow: `0 4px 20px ${T.cyanGlow}` },
    success: { bg: `linear-gradient(135deg, ${T.green}, #1FBE8B)`, text: "#06140F", border: "transparent", shadow: "0 4px 20px rgba(46,230,166,0.3)" },
    danger:  { bg: T.redDim,  text: T.red,  border: `${T.red}44`, shadow: "none" },
    ghost:   { bg: T.glass,   text: T.textSub, border: T.border, shadow: "none" },
    outline: { bg: "transparent", text: T.cyan, border: `${T.cyan}55`, shadow: "none" },
  };
  const v   = variants[variant] || variants.primary;
  const pad = size === "sm" ? "7px 14px" : size === "lg" ? "13px 26px" : "10px 18px";
  const fz  = size === "sm" ? 12 : size === "lg" ? 14 : 13;
  return (
    <button
      onClick={onClick} disabled={disabled} className="glass-btn"
      style={{
        padding: pad, background: disabled ? T.glass : v.bg, color: disabled ? T.textMuted : v.text,
        border: `1px solid ${disabled ? T.border : v.border}`, borderRadius: 9,
        cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: fz,
        width: full ? "100%" : "auto", fontFamily: T.fontBody, letterSpacing: "0.01em",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        boxShadow: disabled ? "none" : v.shadow, transition: "transform .12s, box-shadow .12s, opacity .12s",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}

// ── INPUT ─────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, type = "text", required = false, mono = false, onKeyDown }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>{label}{required && <span style={{ color: T.red }}> *</span>}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
        className="glass-input"
        style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 14, color: T.text, fontFamily: mono ? T.fontMono : T.fontBody, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = T.cyan }) {
  return (
    <Card accent={color} style={{ padding: "22px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1, fontFamily: T.fontDisplay, letterSpacing: "-0.01em" }}>{value}</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}14`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={icon} size={18} color={color} />
        </div>
      </div>
    </Card>
  );
}

// ── CHART ─────────────────────────────────────────────────────────────────
function MiniChart({ data, color = T.cyan }) {
  if (!data || data.length < 2) return <div style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 12 }}>Tidak ada data</div>;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const w = 400, h = 80, px = 8, py = 10;
  const pts = data.map((d, i) => {
    const x = px + (i / (data.length - 1)) * (w - px * 2);
    const y = h - py - (d.revenue / max) * (h - py * 2);
    return `${x},${y}`;
  });
  const area = `${px},${h} ${pts.join(" ")} ${w - px},${h}`;
  const gid = "g" + Math.random().toString(36).slice(2, 8);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 70 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = px + (i / (data.length - 1)) * (w - px * 2);
        const y = h - py - (d.revenue / max) * (h - py * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={T.void} stroke={color} strokeWidth="1.5" />;
      })}
    </svg>
  );
}

// ── SECTION HEADER ────────────────────────────────────────────────────────
function SectionTitle({ icon, children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 11, fontFamily: T.fontDisplay, letterSpacing: "-0.01em" }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: T.cyanDim, border: `1px solid ${T.cyan}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={T.cyan} />
        </span>
        {children}
      </h1>
      {action}
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────
function EmptyState({ icon = "inbox", text }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted }}>
      <Icon name={icon} size={32} color={T.textMuted} strokeWidth={1.4} />
      <div style={{ marginTop: 12, fontSize: 13 }}>{text}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STATIC CYBERPUNK BACKGROUND — no blur, no infinite animation (ringan)
// ══════════════════════════════════════════════════════════════════════════
function AnimatedBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Grid statis tipis */}
      <div className="bg-grid-static" />
      {/* Dua gradient warna statis di pojok, tanpa blur/animasi */}
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: "55%", height: "55%", background: `radial-gradient(circle, rgba(0,240,255,0.16) 0%, transparent 70%)` }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: "55%", height: "55%", background: `radial-gradient(circle, rgba(255,42,156,0.22) 0%, transparent 70%)` }} />
      {/* Garis aksen neon tipis horizontal, statis */}
      <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${T.cyan}33, transparent)` }} />
      <div style={{ position: "absolute", top: "70%", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${T.violet}33, transparent)` }} />
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, transparent 0%, ${T.void} 88%)` }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const login = async () => {
    if (!username || !password) return setError("Username dan password wajib diisi");
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login gagal"); setLoading(false); return; }
      setAuth(data.token, data.user);
      onLogin(data.user);
    } catch { setError("Tidak bisa terhubung ke server"); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.void, display: "flex", fontFamily: T.fontBody, position: "relative" }}>
      <AnimatedBackground />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 400 }} className="login-fade-in">
          {/* Logo */}
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${T.cyanDim}, ${T.violetDim})`, border: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: `0 0 50px ${T.cyanGlow}` }} className="logo-static-glow">
              <Icon name="bot" size={28} color={T.cyan} strokeWidth={1.6} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", fontFamily: T.fontDisplay }}>ShopBot</h1>
            <p style={{ fontSize: 12, color: T.textSub, marginTop: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Command Console</p>
          </div>

          {/* Form */}
          <div className="glass-card" style={{ background: T.cardSolid, borderRadius: 16, padding: 32, border: `1px solid ${T.border}`, boxShadow: "0 16px 40px -16px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 5, fontFamily: T.fontDisplay }}>Masuk ke Console</h2>
            <p style={{ fontSize: 13, color: T.textSub, marginBottom: 24 }}>Kelola toko Telegram kamu dari sini</p>

            {error && (
              <div style={{ background: T.redDim, border: `1px solid ${T.red}33`, borderLeft: `2px solid ${T.red}`, borderRadius: 9, padding: "11px 14px", fontSize: 13, color: T.red, marginBottom: 16, display: "flex", alignItems: "center", gap: 9 }}>
                <Icon name="alertCircle" size={15} color={T.red} />
                {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Username</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
                placeholder="Masukkan username" className="glass-input"
                style={{ width: "100%", padding: "12px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
                  placeholder="Masukkan password" className="glass-input"
                  style={{ width: "100%", padding: "12px 44px 12px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
                <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex" }}>
                  <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={login} disabled={loading} className="glass-btn"
              style={{ width: "100%", padding: "13px", background: loading ? T.glass : `linear-gradient(135deg, ${T.cyan}, #0FD9C2)`, color: loading ? T.textMuted : "#06140F", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.02em", boxShadow: loading ? "none" : `0 4px 24px ${T.cyanGlow}`, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? <><span className="spinner" /> Memverifikasi...</> : "Masuk"}
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 22, fontSize: 11, color: T.textMuted, letterSpacing: "0.04em" }}>
            SHOPBOT v2.0 &nbsp;·&nbsp; SECURED CONNECTION
          </p>
        </div>
      </div>

      {/* Right panel — feature list */}
      <div style={{ width: 420, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", zIndex: 1, background: T.panel }} className="login-panel-right">
        <div style={{ textAlign: "center", marginBottom: 36 }} className="login-fade-in-delay">
          <div style={{ width: 52, height: 52, borderRadius: 14, background: T.violetDim, border: `1px solid ${T.violet}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <Icon name="sparkle" size={24} color={T.violet} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 9, fontFamily: T.fontDisplay }}>Kontrol penuh dari satu console</h3>
          <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>Pantau penjualan, kelola stok, konfirmasi order, dan broadcast — semua real-time.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }} className="login-fade-in-delay">
          {[
            { icon: "box", text: "Manajemen stok real-time" },
            { icon: "creditCard", text: "Pembayaran otomatis" },
            { icon: "chart", text: "Analitik & laporan harian" },
            { icon: "users", text: "Multi-admin dengan role" },
          ].map((f, i) => (
            <div key={i} className="glass-card" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", background: T.glass, borderRadius: 11, border: `1px solid ${T.border}` }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: T.cyanDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={f.icon} size={14} color={T.cyan} />
              </span>
              <span style={{ fontSize: 13, color: T.textSub }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOADING TRANSITION — shown briefly after successful login
// ══════════════════════════════════════════════════════════════════════════
function LoadingConsole({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{ minHeight: "100vh", background: T.void, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <AnimatedBackground />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ width: 70, height: 70, borderRadius: 18, background: T.cyanDim, border: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 0 60px ${T.cyanGlow}` }} className="logo-static-glow">
          <Icon name="bot" size={32} color={T.cyan} strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 13, color: T.textSub, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, fontFamily: T.fontMono }}>Initializing Console</div>
        <div style={{ width: 200, height: 3, background: T.glass, borderRadius: 4, overflow: "hidden", margin: "0 auto" }}>
          <div className="loading-bar" style={{ height: "100%", background: `linear-gradient(90deg, ${T.cyan}, ${T.violet})`, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════
function DashboardPage() {
  const [stats,  setStats]  = useState(null);
  const [chart,  setChart]  = useState([]);
  const [orders, setOrders] = useState([]);
  const [err,    setErr]    = useState(null);

  useEffect(() => {
    Promise.all([api("/api/stats"), api("/api/revenue?days=7"), api("/api/orders?status=pending")])
      .then(([s, c, o]) => { setStats(s); setChart(c); setOrders(o); })
      .catch(e => setErr(e.message));
  }, []);

  if (err) return (
    <div style={{ padding: 20, background: T.redDim, borderRadius: 12, color: T.red, fontSize: 14, border: `1px solid ${T.red}33`, display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name="alertCircle" size={18} /> {err}
    </div>
  );
  if (!stats) return (
    <div style={{ padding: 60, textAlign: "center", color: T.textMuted, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <span className="spinner-lg" /> Memuat data console...
    </div>
  );

  return (
    <div>
      <SectionTitle icon="grid">Overview</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon="creditCard" label="Pendapatan Hari Ini" value={idr(stats.revenue_today)} color={T.green} />
        <StatCard icon="box"       label="Terjual Hari Ini"    value={stats.sold_today ?? 0}    color={T.cyan} />
        <StatCard icon="clock"     label="Pending"             value={stats.pending_orders ?? 0} color={T.amber} />
        <StatCard icon="users"     label="Total User"          value={stats.total_users ?? 0}   color={T.blue} />
        <StatCard icon="layers"    label="Pre-Order"           value={stats.preorders ?? 0}     color={T.violet} />
        <StatCard icon="tag"       label="Stok Tersisa"        value={stats.total_stock ?? 0}   color="#26C6F0" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }} className="responsive-grid">
        <Card accent={T.cyan}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pendapatan 7 Hari</div>
          <MiniChart data={chart} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            {chart.map(d => <div key={d.date} style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>{d.date?.slice(5)}</div>)}
          </div>
        </Card>
        <Card accent={T.amber}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Order Pending ({orders.length})</div>
          {orders.length === 0
            ? <EmptyState icon="check" text="Tidak ada order pending" />
            : orders.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{o.product_name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: T.fontMono }}>@{o.username} · {o.id}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>{idr(o.price)}</div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ORDERS PAGE
// ══════════════════════════════════════════════════════════════════════════
function OrdersPage() {
  const { toasts, toast } = useToast();
  const [orders,  setOrders]  = useState([]);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api(`/api/orders${filter === "all" ? "" : "?status=" + filter}`)
      .then(setOrders).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const confirm = async (id) => { setBusy(id + "c"); try { await api(`/api/orders/${id}/confirm`, "PUT"); toast.success("Order dikonfirmasi"); load(); } catch (e) { toast.error(e.message); } setBusy(null); };
  const reject  = async (id) => { if (!window.confirm("Batalkan order ini?")) return; setBusy(id + "r"); try { await api(`/api/orders/${id}/reject`, "PUT"); toast.success("Order dibatalkan"); load(); } catch (e) { toast.error(e.message); } setBusy(null); };

  const FILTERS = { all: "Semua", pending: "Menunggu", delivered: "Terkirim", cancelled: "Dibatalkan", preorder: "Pre-Order" };

  const ActionButtons = ({ o }) => o.status === "pending" ? (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={() => confirm(o.id)} disabled={!!busy} className="icon-btn" style={{ padding: "6px 12px", background: T.greenDim, color: T.green, border: `1px solid ${T.green}33`, borderRadius: 7, cursor: !!busy ? "default" : "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
        {busy === o.id + "c" ? <span className="spinner" /> : <Icon name="check" size={12} />} Konfirmasi
      </button>
      <button onClick={() => reject(o.id)} disabled={!!busy} className="icon-btn" style={{ padding: "6px 10px", background: T.redDim, color: T.red, border: `1px solid ${T.red}33`, borderRadius: 7, cursor: !!busy ? "default" : "pointer" }}>
        {busy === o.id + "r" ? <span className="spinner" /> : <Icon name="x" size={12} />}
      </button>
    </div>
  ) : null;

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="orders">Pesanan</SectionTitle>
      <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
        {Object.entries(FILTERS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className="filter-pill" style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === k ? T.cyan + "55" : T.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600, background: filter === k ? T.cyanDim : T.glass, color: filter === k ? T.cyan : T.textSub }}>
            {v}
          </button>
        ))}
      </div>

      {loading ? (
        <Card style={{ textAlign: "center", padding: 50 }}><span className="spinner-lg" /></Card>
      ) : orders.length === 0 ? (
        <Card><EmptyState text="Tidak ada pesanan" /></Card>
      ) : (
        <>
          {/* Desktop: tabel (disembunyikan di mobile via CSS) */}
          <Card className="desktop-only" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {["Order ID", "User", "Produk", "Catatan", "Harga", "Status", "Tanggal", "Aksi"].map(h => (
                      <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontWeight: 600, color: T.textMuted, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="table-row">
                      <td style={{ padding: "13px 16px", fontFamily: T.fontMono, fontWeight: 600, color: T.cyan, fontSize: 12 }}>{o.id}</td>
                      <td style={{ padding: "13px 16px", color: T.textSub }}>@{o.username}</td>
                      <td style={{ padding: "13px 16px", fontWeight: 500, color: T.text }}>{o.product_name}</td>
                      <td style={{ padding: "13px 16px", maxWidth: 180 }}>
                        {o.note
                          ? <span title={o.note} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: T.violet, background: T.violetDim, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.violet}30`, cursor: "help", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <Icon name="note" size={11} /> {o.note}
                            </span>
                          : <span style={{ fontSize: 11, color: T.textMuted }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "13px 16px", color: T.green, fontWeight: 700, fontFamily: T.fontMono }}>{idr(o.price)}</td>
                      <td style={{ padding: "13px 16px" }}><Badge status={o.status} /></td>
                      <td style={{ padding: "13px 16px", color: T.textMuted, whiteSpace: "nowrap", fontSize: 11.5, fontFamily: T.fontMono }}>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                      <td style={{ padding: "13px 16px" }}><ActionButtons o={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile: card list (disembunyikan di desktop via CSS) */}
          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map(o => (
              <Card key={o.id} style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: T.fontMono, fontWeight: 600, color: T.cyan, fontSize: 12.5 }}>{o.id}</div>
                    <div style={{ fontSize: 11.5, color: T.textSub, marginTop: 3 }}>@{o.username}</div>
                  </div>
                  <Badge status={o.status} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>{o.product_name}</div>
                {o.note && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: T.violet, background: T.violetDim, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.violet}30`, marginBottom: 8 }}>
                    <Icon name="note" size={11} /> {o.note}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>{idr(o.price)}</div>
                    <div style={{ fontSize: 10.5, color: T.textMuted, fontFamily: T.fontMono, marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString("id-ID")}</div>
                  </div>
                  <ActionButtons o={o} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ══════════════════════════════════════════════════════════════════════════
function ProductsPage() {
  const { toasts, toast } = useToast();
  const [products,  setProducts]  = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editPrice, setEditPrice] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", preorder_only: false });
  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const load = () => api("/api/products").then(setProducts).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nama produk wajib diisi");
    if (!form.price) return toast.error("Harga wajib diisi");
    setSaving(true);
    try {
      await api("/api/products", "POST", { name: form.name.trim(), price: parseInt(String(form.price).replace(/\D/g, "")), description: form.description.trim(), preorder_only: form.preorder_only });
      toast.success(`Produk "${form.name}" ditambahkan`);
      setForm({ name: "", price: "", description: "", preorder_only: false }); setShowForm(false); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const savePrice = async (id) => {
    const p = parseInt(String(editPrice.value).replace(/\D/g, ""));
    if (!p || p <= 0) return toast.error("Harga tidak valid");
    try { await api(`/api/products/${id}`, "PUT", { price: p }); toast.success("Harga diubah"); setEditPrice(null); load(); }
    catch (e) { toast.error(e.message); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Hapus "${name}"?`)) return;
    try { await api(`/api/products/${id}`, "DELETE"); toast.success("Produk dihapus"); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="box" action={<Btn onClick={() => setShowForm(!showForm)} size="sm" icon="plus">Tambah Produk</Btn>}>Produk</SectionTitle>

      {showForm && (
        <Card accent={T.cyan} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontDisplay }}>Produk Baru</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Nama Produk" required value={form.name} onChange={f("name")} placeholder="Netflix Premium" />
            <Input label="Harga (IDR)" required value={form.price} onChange={f("price")} placeholder="50000" mono />
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Deskripsi</label>
              <textarea value={form.description} onChange={f("description")} placeholder="Deskripsi produk..." rows={3} className="glass-input" style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 14, color: T.text, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", background: T.glass, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <input type="checkbox" id="po" checked={form.preorder_only} onChange={e => setForm({ ...form, preorder_only: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.cyan }} />
              <div>
                <label htmlFor="po" style={{ fontSize: 13, color: T.text, cursor: "pointer", fontWeight: 500 }}>Pre-Order Only</label>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>Produk tetap bisa dipesan meski stok kosong</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
            <Btn onClick={save} variant="success" disabled={saving} icon={saving ? null : "check"}>{saving ? "Menyimpan..." : "Simpan Produk"}</Btn>
            <Btn onClick={() => setShowForm(false)} variant="ghost">Batal</Btn>
          </div>
        </Card>
      )}

      {products.length === 0
        ? <Card><EmptyState icon="box" text="Belum ada produk" /></Card>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 16 }}>
          {products.map(p => (
            <Card key={p.id} accent={p.stock_count > 0 ? T.cyan : T.red} style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.fontDisplay }}>{p.name}</div>
                {p.preorder_only && <span style={{ background: T.violetDim, color: T.violet, fontSize: 9.5, padding: "3px 9px", borderRadius: 10, fontWeight: 700, letterSpacing: "0.04em" }}>PRE-ORDER</span>}
              </div>
              {p.description && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.6 }}>{p.description}</div>}
              <div style={{ marginBottom: 16 }}>
                {editPrice?.id === p.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input autoFocus value={editPrice.value} onChange={e => setEditPrice({ ...editPrice, value: e.target.value })} onKeyDown={e => { if (e.key === "Enter") savePrice(p.id); if (e.key === "Escape") setEditPrice(null); }} className="glass-input" style={{ flex: 1, padding: "7px 11px", background: T.glass, border: `1px solid ${T.cyan}66`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: T.green, fontFamily: T.fontMono, outline: "none" }} />
                    <button onClick={() => savePrice(p.id)} style={{ padding: "7px 11px", background: T.greenDim, color: T.green, border: `1px solid ${T.green}44`, borderRadius: 8, cursor: "pointer" }}><Icon name="check" size={13} /></button>
                    <button onClick={() => setEditPrice(null)} style={{ padding: "7px 11px", background: T.glass, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer" }}><Icon name="x" size={13} /></button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div onClick={() => setEditPrice({ id: p.id, value: String(p.price) })} title="Klik untuk edit harga" style={{ fontSize: 19, fontWeight: 700, color: T.green, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: T.fontMono }}>
                      {idr(p.price)} <Icon name="edit" size={12} color={T.textMuted} />
                    </div>
                    <span style={{ fontSize: 11.5, color: p.stock_count > 0 ? T.green : T.red, fontWeight: 600, fontFamily: T.fontMono }}>
                      {p.stock_count > 0 ? `${p.stock_count} stok` : "Habis"}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => del(p.id, p.name)} className="icon-btn" style={{ width: "100%", padding: 9, background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="trash" size={13} /> Hapus Produk
              </button>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STOCK PAGE
// ══════════════════════════════════════════════════════════════════════════
function StockPage() {
  const { toasts, toast } = useToast();
  const [products,    setProducts]    = useState([]);
  const [allStock,    setAllStock]    = useState([]);
  const [sel,         setSel]         = useState("");
  const [filterProd,  setFilterProd]  = useState("");
  const [input,       setInput]       = useState("");
  const [statusFilter, setStatusFilter] = useState("available");
  const [adding,      setAdding]      = useState(false);

  const loadProducts = () => api("/api/products").then(setProducts).catch(console.error);
  const loadStock    = useCallback(() => {
    let url = "/api/stock";
    const p = [];
    if (filterProd) p.push(`product_id=${filterProd}`);
    if (statusFilter !== "all") p.push(`status=${statusFilter}`);
    if (p.length) url += "?" + p.join("&");
    api(url).then(setAllStock).catch(console.error);
  }, [filterProd, statusFilter]);

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { loadStock(); }, [loadStock]);

  const addStock = async () => {
    if (!sel) return toast.error("Pilih produk dulu");
    if (!input.trim()) return toast.error("Isi data stok dulu");
    const items = input.split("\n").map(s => s.trim()).filter(Boolean);
    if (!items.length) return toast.error("Tidak ada item valid");
    setAdding(true);
    try { await api("/api/stock", "POST", { product_id: sel, items }); toast.success(`${items.length} item ditambahkan`); setInput(""); loadStock(); }
    catch (e) { toast.error(e.message); }
    setAdding(false);
  };

  const del = async (id) => { try { await api(`/api/stock/${id}`, "DELETE"); toast.success("Item dihapus"); loadStock(); } catch (e) { toast.error(e.message); } };
  const getProd = id => products.find(p => p.id === id)?.name || id;

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="layers">Manajemen Stok</SectionTitle>

      <Card accent={T.cyan} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontDisplay }}>Tambah Stok</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, alignItems: "flex-start" }} className="responsive-grid">
          <div>
            <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Pilih Produk <span style={{ color: T.red }}>*</span></label>
            <select value={sel} onChange={e => setSel(e.target.value)} className="glass-input" style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, cursor: "pointer", outline: "none" }}>
              <option value="">— Pilih Produk —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Data Stok — 1 item per baris <span style={{ color: T.red }}>*</span></label>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={"email1@gmail.com:password1\nemail2@gmail.com:password2"} rows={5} className="glass-input" style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 12, color: T.text, fontFamily: T.fontMono, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5, fontFamily: T.fontMono }}>{input ? `${input.split("\n").filter(s => s.trim()).length} item` : "Kosong"}</div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}><Btn onClick={addStock} disabled={adding} icon={adding ? null : "plus"}>{adding ? "Menambahkan..." : "Tambah Stok"}</Btn></div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterProd} onChange={e => setFilterProd(e.target.value)} className="glass-input" style={{ padding: "7px 12px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 12, color: T.text, cursor: "pointer", outline: "none" }}>
            <option value="">Semua Produk</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {["available", "sold", "all"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className="filter-pill" style={{ padding: "6px 14px", borderRadius: 16, border: `1px solid ${statusFilter === f ? T.cyan + "55" : T.border}`, fontSize: 11, cursor: "pointer", background: statusFilter === f ? T.cyanDim : T.glass, color: statusFilter === f ? T.cyan : T.textSub, fontWeight: 600 }}>
                {f === "available" ? "Tersedia" : f === "sold" ? "Terjual" : "Semua"}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: T.textMuted, width: "100%", fontFamily: T.fontMono }}>
            {filterProd ? getProd(filterProd) : "Semua produk"} · {allStock.length} item
          </span>
        </div>

        {allStock.length === 0 ? (
          <EmptyState icon="tag" text={`Tidak ada stok ${filterProd ? `untuk ${getProd(filterProd)}` : ""}`} />
        ) : (
          <>
            {/* Desktop: tabel */}
            <div className="desktop-only" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {["Produk", "Data", "Status", "Ditambahkan", ""].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: T.textMuted, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allStock.slice(0, 100).map(s => (
                    <tr key={s.id} className="table-row">
                      <td style={{ padding: "11px 16px", fontWeight: 500, color: T.text }}>{getProd(s.product_id)}</td>
                      <td style={{ padding: "11px 16px", fontFamily: T.fontMono, fontSize: 12, color: T.textSub, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.sold ? <span style={{ color: T.textMuted, letterSpacing: 2 }}>••••••••</span> : s.data}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ background: s.sold ? T.redDim : T.greenDim, color: s.sold ? T.red : T.green, padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.sold ? "Terjual" : "Tersedia"}</span>
                      </td>
                      <td style={{ padding: "11px 16px", color: T.textMuted, fontSize: 11.5, fontFamily: T.fontMono }}>{new Date(s.added_at).toLocaleDateString("id-ID")}</td>
                      <td style={{ padding: "11px 16px" }}>
                        {!s.sold && <button onClick={() => del(s.id)} className="icon-btn" style={{ padding: "5px 10px", background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 7, cursor: "pointer" }}><Icon name="trash" size={12} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: 9, padding: 14 }}>
              {allStock.slice(0, 100).map(s => (
                <div key={s.id} style={{ background: T.glass, borderRadius: 11, padding: 14, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{getProd(s.product_id)}</div>
                    <span style={{ background: s.sold ? T.redDim : T.greenDim, color: s.sold ? T.red : T.green, padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{s.sold ? "Terjual" : "Tersedia"}</span>
                  </div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSub, marginBottom: 8, wordBreak: "break-all" }}>
                    {s.sold ? <span style={{ color: T.textMuted, letterSpacing: 2 }}>••••••••</span> : s.data}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, color: T.textMuted, fontFamily: T.fontMono }}>{new Date(s.added_at).toLocaleDateString("id-ID")}</span>
                    {!s.sold && <button onClick={() => del(s.id)} className="icon-btn" style={{ padding: "5px 10px", background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 7, cursor: "pointer" }}><Icon name="trash" size={12} /></button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TRIGGERS PAGE
// ══════════════════════════════════════════════════════════════════════════
function TriggersPage() {
  const { toasts, toast } = useToast();
  const [triggers, setTriggers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ trigger: "", response: "" });

  const load = () => api("/api/triggers").then(setTriggers).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.trigger.trim()) return toast.error("Trigger wajib diisi");
    if (!form.response.trim()) return toast.error("Balasan wajib diisi");
    setSaving(true);
    try { await api("/api/triggers", "POST", { trigger: form.trigger.trim(), response: form.response.trim() }); toast.success("Trigger ditambahkan"); setForm({ trigger: "", response: "" }); setShowForm(false); load(); }
    catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const del = async (t) => { if (!window.confirm(`Hapus "${t}"?`)) return; try { await api(`/api/triggers/${encodeURIComponent(t)}`, "DELETE"); toast.success("Trigger dihapus"); load(); } catch (e) { toast.error(e.message); } };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="bolt" action={<Btn onClick={() => setShowForm(!showForm)} size="sm" icon="plus">Tambah</Btn>}>Trigger & Command</SectionTitle>

      <div style={{ background: T.blueDim, borderRadius: 11, padding: "12px 16px", marginBottom: 18, border: `1px solid ${T.blue}30`, fontSize: 12, color: T.blue, lineHeight: 1.8 }}>
        Foto ke trigger: kirim foto di Telegram dengan caption <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 7px", borderRadius: 5, fontFamily: T.fontMono }}>/settriggerpic /perintah</code><br/>
        QR QRIS: caption <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 7px", borderRadius: 5, fontFamily: T.fontMono }}>/setpay Teks</code>
      </div>

      {showForm && (
        <Card accent={T.cyan} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16, fontFamily: T.fontDisplay }}>Trigger Baru</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }} className="responsive-grid">
            <Input label="Kata Trigger" required value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} placeholder="/pay atau /info" mono />
            <div>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Teks Balasan <span style={{ color: T.red }}>*</span></label>
              <textarea value={form.response} onChange={e => setForm({ ...form, response: e.target.value })} rows={4} placeholder="Teks balasan bot..." className="glass-input" style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <Btn onClick={save} variant="success" disabled={saving} icon={saving ? null : "check"}>{saving ? "Menyimpan..." : "Simpan"}</Btn>
            <Btn onClick={() => setShowForm(false)} variant="ghost">Batal</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {triggers.length === 0
          ? <Card><EmptyState icon="bolt" text="Belum ada trigger" /></Card>
          : triggers.map(t => (
            <Card key={t.trigger} style={{ padding: "15px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
              <code style={{ background: T.cyanDim, borderRadius: 7, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: T.cyan, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${T.cyan}30`, fontFamily: T.fontMono }}>{t.trigger}</code>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{t.response?.substring(0, 120) || "(kosong)"}{t.response?.length > 120 ? "..." : ""}</div>
                {t.photo_file_id && <span style={{ fontSize: 10.5, background: T.violetDim, color: T.violet, padding: "3px 9px", borderRadius: 10, marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="qr" size={10} /> Ada Foto</span>}
              </div>
              <button onClick={() => del(t.trigger)} className="icon-btn" style={{ padding: "6px 12px", background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                <Icon name="trash" size={12} />
              </button>
            </Card>
          ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BROADCAST PAGE
// ══════════════════════════════════════════════════════════════════════════
function BroadcastPage() {
  const { toasts, toast } = useToast();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [users,   setUsers]   = useState([]);

  useEffect(() => { api("/api/users").then(setUsers).catch(console.error); }, []);

  const send = async () => {
    if (!message.trim()) return toast.error("Pesan tidak boleh kosong");
    if (!window.confirm(`Kirim ke ${users.length} user?`)) return;
    setLoading(true); setResult(null);
    try { const r = await api("/api/broadcast", "POST", { message }); setResult(r); toast.success(`Terkirim ke ${r.sent} user`); setMessage(""); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="megaphone">Broadcast</SectionTitle>
      <div style={{ background: T.amberDim, borderRadius: 11, padding: "12px 16px", marginBottom: 18, border: `1px solid ${T.amber}30`, fontSize: 12, color: T.amber, display: "flex", alignItems: "center", gap: 9 }}>
        <Icon name="alertCircle" size={15} />
        Pesan akan dikirim ke <strong>{users.length} user</strong>. Gunakan dengan bijak.
      </div>
      <Card accent={T.amber}>
        <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 9, fontWeight: 500 }}>Pesan Broadcast</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={"Tulis pesan...\nSupport Markdown: *bold*, _italic_, `code`"} rows={6} className="glass-input" style={{ width: "100%", padding: "13px 15px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 11, fontSize: 14, color: T.text, lineHeight: 1.6, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", outline: "none" }} />
        {message && (
          <div style={{ background: T.glass, borderRadius: 9, padding: "13px 15px", margin: "13px 0", fontSize: 13, color: T.textSub, lineHeight: 1.6, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 7, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Preview</div>
            <strong style={{ color: T.text }}>Pengumuman</strong><br /><br />{message}
          </div>
        )}
        <Btn onClick={send} disabled={loading} variant="danger" icon={loading ? null : "megaphone"} style={{ background: loading ? T.glass : T.redDim, border: `1px solid ${T.red}44` }}>
          {loading ? "Mengirim..." : `Kirim ke ${users.length} User`}
        </Btn>
        {result && (
          <div style={{ marginTop: 16 }}>
            <div style={{ padding: 15, background: result.failed > 0 ? T.amberDim : T.greenDim, borderRadius: 11, fontSize: 13, color: result.failed > 0 ? T.amber : T.green, border: `1px solid ${result.failed > 0 ? T.amber : T.green}33` }}>
              Selesai — <strong>{result.sent}</strong> berhasil, <strong>{result.failed}</strong> gagal dari total {result.total} user.
            </div>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 11, padding: 15, background: T.glass, borderRadius: 11, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 9, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                  Contoh Alasan Gagal ({result.errors.length})
                </div>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: T.textSub, padding: "7px 0", borderBottom: i < result.errors.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontFamily: T.fontMono, color: T.textMuted }}>{e.userId}</span> — {e.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// REPORT PAGE
// ══════════════════════════════════════════════════════════════════════════
function ReportPage() {
  const [report, setReport] = useState(null);
  const [chart,  setChart]  = useState([]);

  useEffect(() => {
    api("/api/report/daily").then(setReport).catch(console.error);
    api("/api/revenue?days=30").then(setChart).catch(console.error);
  }, []);

  return (
    <div>
      <SectionTitle icon="chart">Laporan</SectionTitle>
      {report && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard icon="creditCard" label="Pendapatan"   value={idr(report.revenue)}   color={T.green} />
          <StatCard icon="box"       label="Terjual"      value={report.sold}           color={T.cyan} />
          <StatCard icon="inbox"     label="Order Baru"   value={report.new_orders}     color={T.blue} />
          <StatCard icon="x"        label="Dibatalkan"   value={report.cancelled}      color={T.red} />
          <StatCard icon="layers"   label="Pre-Order"    value={report.preorders}      color={T.violet} />
        </div>
      )}
      <Card accent={T.cyan} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 }}>Pendapatan 30 Hari</div>
        <MiniChart data={chart} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {chart.filter((_, i) => i % 6 === 0).map(d => <div key={d.date} style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>{d.date?.slice(5)}</div>)}
        </div>
      </Card>
      {report?.top_products?.length > 0 && (
        <Card>
          <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 }}>Produk Terlaris</div>
          {report.top_products.map((p, i) => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: [T.amberDim, T.blueDim, T.greenDim][i] || T.cyanDim, border: `1px solid ${[T.amber, T.blue, T.green][i] || T.cyan}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: [T.amber, T.blue, T.green][i] || T.cyan, fontFamily: T.fontMono }}>{i + 1}</div>
                <span style={{ fontWeight: 500, color: T.text }}>{p.name}</span>
              </div>
              <span style={{ fontWeight: 700, color: T.cyan, fontFamily: T.fontMono }}>{p.count}×</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOGS PAGE
// ══════════════════════════════════════════════════════════════════════════
const ACTION_STYLE = {
  LOGIN:          { color: T.blue,   icon: "key" },
  ADD_PRODUCT:    { color: T.green,  icon: "plus" },
  DELETE_PRODUCT: { color: T.red,    icon: "trash" },
  EDIT_PRODUCT:   { color: T.amber,  icon: "edit" },
  ADD_STOCK:      { color: T.green,  icon: "box" },
  DELETE_STOCK:   { color: T.red,    icon: "trash" },
  CONFIRM_ORDER:  { color: T.green,  icon: "check" },
  REJECT_ORDER:   { color: T.red,    icon: "x" },
  AUTO_CONFIRM:   { color: T.cyan,   icon: "bot" },
  ADD_TRIGGER:    { color: T.violet, icon: "bolt" },
  DELETE_TRIGGER: { color: T.red,    icon: "trash" },
  BROADCAST:      { color: T.amber,  icon: "megaphone" },
  CREATE_USER:    { color: T.blue,   icon: "users" },
  EDIT_USER:      { color: T.amber,  icon: "edit" },
  DELETE_USER:    { color: T.red,    icon: "trash" },
  EDIT_PAYMENT:   { color: T.violet, icon: "creditCard" },
  EDIT_SETTINGS:  { color: T.textSub,icon: "settings" },
  EDIT_GREETING:  { color: T.cyan,   icon: "sparkle" },
};

function LogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => { setLoading(true); api("/api/logs?limit=200").then(setLogs).catch(console.error).finally(() => setLoading(false)); }, []);

  const filtered = filter === "ALL" ? logs : logs.filter(l => l.action === filter);
  const actions  = ["ALL", ...new Set(logs.map(l => l.action))];

  return (
    <div>
      <SectionTitle icon="activity">Log Akses</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {actions.slice(0, 12).map(a => (
          <button key={a} onClick={() => setFilter(a)} className="filter-pill" style={{ padding: "6px 13px", borderRadius: 16, border: `1px solid ${filter === a ? T.cyan + "55" : T.border}`, fontSize: 11, cursor: "pointer", background: filter === a ? T.cyanDim : T.glass, color: filter === a ? T.cyan : T.textSub, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            {a !== "ALL" && <Icon name={ACTION_STYLE[a]?.icon || "tag"} size={11} />}
            {a === "ALL" ? "Semua" : a}
          </button>
        ))}
      </div>

      {loading ? (
        <Card style={{ textAlign: "center", padding: 50 }}><span className="spinner-lg" /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState text="Tidak ada log" /></Card>
      ) : (
        <>
          {/* Desktop: tabel */}
          <Card className="desktop-only" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {["Waktu", "User", "Aksi", "Detail"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: T.textMuted, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const s = ACTION_STYLE[l.action] || { color: T.textSub, icon: "tag" };
                    return (
                      <tr key={l.id} className="table-row">
                        <td style={{ padding: "11px 16px", color: T.textMuted, fontSize: 11, whiteSpace: "nowrap", fontFamily: T.fontMono }}>{ago(l.timestamp)}</td>
                        <td style={{ padding: "11px 16px", fontWeight: 600, color: T.text }}>{l.username}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${s.color}14`, color: s.color, padding: "4px 11px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, border: `1px solid ${s.color}30` }}>
                            <Icon name={s.icon} size={10} /> {l.action}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px", color: T.textSub, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile: card list */}
          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {filtered.map(l => {
              const s = ACTION_STYLE[l.action] || { color: T.textSub, icon: "tag" };
              return (
                <Card key={l.id} style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${s.color}14`, color: s.color, padding: "4px 11px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, border: `1px solid ${s.color}30` }}>
                      <Icon name={s.icon} size={10} /> {l.action}
                    </span>
                    <span style={{ fontSize: 10.5, color: T.textMuted, fontFamily: T.fontMono, whiteSpace: "nowrap" }}>{ago(l.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 5 }}>{l.username}</div>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, wordBreak: "break-word" }}>{l.detail}</div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// USERS PAGE
// ══════════════════════════════════════════════════════════════════════════
function UsersPage({ currentUser }) {
  const { toasts, toast } = useToast();
  const [users,    setUsers]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ username: "", password: "", role: "member" });
  const f = k => e => setForm({ ...form, [k]: e.target.value });

  const load = () => api("/api/dashboard-users").then(setUsers).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.username.trim()) return toast.error("Username wajib diisi");
    if (!editId && !form.password) return toast.error("Password wajib diisi");
    setSaving(true);
    try {
      if (editId) { const u = {}; if (form.password) u.password = form.password; u.role = form.role; await api(`/api/dashboard-users/${editId}`, "PUT", u); toast.success("User diupdate"); }
      else { await api("/api/dashboard-users", "POST", form); toast.success(`User "${form.username}" dibuat`); }
      setForm({ username: "", password: "", role: "member" }); setShowForm(false); setEditId(null); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const del = async (id, uname) => { if (!window.confirm(`Hapus "${uname}"?`)) return; try { await api(`/api/dashboard-users/${id}`, "DELETE"); toast.success("User dihapus"); load(); } catch (e) { toast.error(e.message); } };
  const startEdit = (u) => { setEditId(u.id); setForm({ username: u.username, password: "", role: u.role }); setShowForm(true); };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="users" action={<Btn onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ username: "", password: "", role: "member" }); }} size="sm" icon="plus">Tambah User</Btn>}>User Console</SectionTitle>

      {showForm && (
        <Card accent={T.cyan} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontDisplay }}>{editId ? "Edit User" : "User Baru"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="responsive-grid-3">
            <Input label="Username" required value={form.username} onChange={f("username")} placeholder="johndoe" />
            <Input label={editId ? "Password Baru (kosong = tidak ubah)" : "Password"} type="password" required={!editId} value={form.password} onChange={f("password")} placeholder="••••••••" />
            <div>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Role</label>
              <select value={form.role} onChange={f("role")} className="glass-input" style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, cursor: "pointer", outline: "none" }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ padding: "11px 15px", background: T.glass, borderRadius: 9, fontSize: 12, color: T.textMuted, marginBottom: 16, border: `1px solid ${T.border}`, lineHeight: 1.8 }}>
            <strong style={{ color: T.text }}>Admin</strong> — Akses penuh + kelola user + lihat log &nbsp;|&nbsp; <strong style={{ color: T.text }}>Member</strong> — Kelola produk, stok, order, trigger, broadcast
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            <Btn onClick={save} variant="success" disabled={saving} icon={saving ? null : "check"}>{saving ? "Menyimpan..." : "Simpan"}</Btn>
            <Btn onClick={() => { setShowForm(false); setEditId(null); }} variant="ghost">Batal</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {users.map(u => (
          <Card key={u.id} accent={u.role === "admin" ? T.violet : T.cyan} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: u.role === "admin" ? T.violetDim : T.cyanDim, border: `1px solid ${u.role === "admin" ? T.violet : T.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: u.role === "admin" ? T.violet : T.cyan, fontFamily: T.fontDisplay }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{u.username}</div>
                  {u.id === getUser()?.id && <span style={{ fontSize: 10, color: T.cyan }}>Anda</span>}
                </div>
              </div>
              <span style={{ background: u.role === "admin" ? T.violetDim : T.glass, color: u.role === "admin" ? T.violet : T.textSub, fontSize: 10.5, padding: "4px 10px", borderRadius: 10, fontWeight: 700, border: `1px solid ${u.role === "admin" ? T.violet + "44" : T.border}`, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name={u.role === "admin" ? "crown" : "users"} size={10} />
                {u.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.9, fontFamily: T.fontMono }}>
              <div>Dibuat: {new Date(u.created_at).toLocaleDateString("id-ID")}</div>
              <div>Oleh: {u.created_by}</div>
              <div>Login: {u.last_login ? ago(u.last_login) : "Belum pernah"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => startEdit(u)} className="icon-btn" style={{ flex: 1, padding: 8, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}33`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
              {u.id !== getUser()?.id && <button onClick={() => del(u.id, u.username)} className="icon-btn" style={{ flex: 1, padding: 8, background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Hapus</button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAKASIR CARD
// ══════════════════════════════════════════════════════════════════════════
function PakasirCard({ toast }) {
  const [info, setInfo] = useState(null);
  const [testOrd, setTestOrd] = useState("");
  const [testAmt, setTestAmt] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { api("/api/pakasir/info").then(setInfo).catch(() => setInfo({ active: false })); }, []);

  const checkStatus = async () => {
    if (!testOrd || !testAmt) return toast.error("Isi Order ID dan Amount");
    setTesting(true); setTestResult(null);
    try { const r = await api(`/api/pakasir/status?order_id=${testOrd}&amount=${testAmt}`); setTestResult(r); }
    catch (e) { toast.error(e.message); }
    setTesting(false);
  };

  return (
    <Card accent={info?.active ? T.green : T.amber}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
        <Icon name="creditCard" size={16} color={T.cyan} /> Pakasir Payment Gateway
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderRadius: 11, border: `1px solid ${info?.active ? T.green + "33" : T.amber + "33"}`, background: info?.active ? T.greenDim : T.amberDim, marginBottom: 16 }}>
        <Icon name={info?.active ? "check" : "alertCircle"} size={20} color={info?.active ? T.green : T.amber} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: info?.active ? T.green : T.amber }}>{info === null ? "Memuat..." : info?.active ? `Aktif — ${info.project}` : "Tidak Aktif"}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{info?.active ? "Payment otomatis aktif" : "Set PAKASIR_PROJECT & PAKASIR_API_KEY di Railway"}</div>
        </div>
      </div>
      {info?.active && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Webhook URL — Paste ke Pakasir Dashboard</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={info.webhook} className="glass-input" style={{ flex: 1, padding: "10px 13px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 12, fontFamily: T.fontMono, color: T.textSub, outline: "none" }} />
              <Btn onClick={() => { navigator.clipboard.writeText(info.webhook); toast.success("Disalin"); }} size="sm" icon="copy" variant="outline">Salin</Btn>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 11 }}>Cek Status Transaksi</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }} className="responsive-grid-3">
              <input value={testOrd} onChange={e => setTestOrd(e.target.value)} placeholder="ORD-XXXXXXXX" className="glass-input" style={{ padding: "9px 11px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, fontFamily: T.fontMono, outline: "none" }} />
              <input value={testAmt} onChange={e => setTestAmt(e.target.value)} placeholder="50000" className="glass-input" style={{ padding: "9px 11px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none" }} />
              <Btn onClick={checkStatus} disabled={testing} size="sm">{testing ? "..." : "Cek"}</Btn>
            </div>
            {testResult?.transaction && (
              <div style={{ marginTop: 11, padding: "13px 15px", background: T.glass, borderRadius: 9, fontSize: 12, color: T.textSub, lineHeight: 1.9, border: `1px solid ${T.border}`, fontFamily: T.fontMono }}>
                <div>Status: <strong style={{ color: testResult.transaction.status === "completed" ? T.green : T.amber }}>{testResult.transaction.status}</strong></div>
                <div>Amount: <strong style={{ color: T.text }}>{idr(testResult.transaction.amount)}</strong></div>
              </div>
            )}
          </div>
        </>
      )}
      {!info?.active && (
        <div style={{ padding: "13px 15px", background: T.blueDim, borderRadius: 9, fontSize: 12, color: T.blue, lineHeight: 1.9, border: `1px solid ${T.blue}30` }}>
          <strong style={{ color: T.text }}>Setup Pakasir:</strong><br />
          1. Daftar di <a href="https://pakasir.com" target="_blank" rel="noreferrer" style={{ color: T.cyan }}>pakasir.com</a> → buat Proyek<br />
          2. Set di Railway: <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>PAKASIR_PROJECT</code> & <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>PAKASIR_API_KEY</code><br />
          3. Set <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>APP_URL</code> = URL Railway kamu<br />
          4. Di Pakasir → Edit Proyek → Webhook URL = <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>APP_URL/webhook/pakasir</code>
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════
function SettingsPage({ currentUser }) {
  const { toasts, toast } = useToast();
  const [settings, setSettings] = useState({ auto_order: false });
  const [payment,  setPayment]  = useState(null);
  const [payText,  setPayText]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [connStatus,  setConn]  = useState(null);
  const [connLoading, setConnL] = useState(false);
  const [botInfo,  setBotInfo]  = useState(null);
  const [customUrl, setCustomUrl] = useState("");
  const [pwForm,   setPwForm]   = useState({ old: "", new_: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [greetingText, setGreetingText] = useState("");
  const [greetingSaving, setGreetingSaving] = useState(false);
  const [hasCustomGreeting, setHasCustomGreeting] = useState(false);

  const testConn = async () => {
    setConnL(true); setConn(null);
    try { await api("/api/stats"); setConn("ok"); }
    catch (e) { setConn(e.message.includes("UNAUTHORIZED") ? "unauthorized" : "error"); }
    setConnL(false);
  };

  useEffect(() => {
    api("/api/settings").then(setSettings).catch(console.error);
    api("/api/payment").then(p => { setPayment(p); if (p?.text) setPayText(p.text); }).catch(console.error);
    api("/api/bot-info").then(i => { setBotInfo(i); setCustomUrl(i.url); }).catch(console.error);
    api("/api/greeting").then(g => {
      if (g?.text) { setGreetingText(g.text); setHasCustomGreeting(true); }
      else { setGreetingText("Halo {name}! Selamat datang."); setHasCustomGreeting(false); }
    }).catch(console.error);
    testConn();
  }, []);

  const saveSettings = async () => { setSaving(true); try { await api("/api/settings", "PUT", settings); toast.success("Tersimpan"); } catch (e) { toast.error(e.message); } setSaving(false); };
  const savePayment  = async () => { try { await api("/api/payment", "PUT", { text: payText }); toast.success("Info pembayaran disimpan"); } catch (e) { toast.error(e.message); } };
  const saveGreeting = async () => {
    if (!greetingText.trim()) return toast.error("Teks greeting tidak boleh kosong");
    setGreetingSaving(true);
    try { await api("/api/greeting", "PUT", { text: greetingText.trim() }); toast.success("Greeting disimpan"); setHasCustomGreeting(true); }
    catch (e) { toast.error(e.message); }
    setGreetingSaving(false);
  };
  const resetGreeting = async () => {
    if (!window.confirm("Reset greeting ke default?")) return;
    try { await api("/api/greeting", "DELETE"); toast.success("Greeting direset"); setGreetingText("Halo {name}! Selamat datang."); setHasCustomGreeting(false); }
    catch (e) { toast.error(e.message); }
  };
  const changePw = async () => {
    if (!pwForm.old || !pwForm.new_) return toast.error("Semua field wajib diisi");
    if (pwForm.new_ !== pwForm.confirm) return toast.error("Password baru tidak cocok");
    if (pwForm.new_.length < 6) return toast.error("Minimal 6 karakter");
    setPwSaving(true);
    try { await api(`/api/dashboard-users/${currentUser.id}`, "PUT", { password: pwForm.new_ }); toast.success("Password berhasil diubah"); setPwForm({ old: "", new_: "", confirm: "" }); }
    catch (e) { toast.error(e.message); }
    setPwSaving(false);
  };

  const connStyles = {
    ok:           { color: T.green, msg: "Terhubung ke server" },
    unauthorized: { color: T.red,   msg: "API Key Salah" },
    error:        { color: T.amber, msg: "Tidak bisa terhubung" },
  };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle icon="settings">Pengaturan</SectionTitle>
      <div style={{ display: "grid", gap: 16 }}>

        <PakasirCard toast={toast} />

        {/* Custom Greeting */}
        <Card accent={T.cyan}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="sparkle" size={16} color={T.cyan} /> Pesan Sambutan
            </div>
            {hasCustomGreeting && (
              <span style={{ fontSize: 10, background: T.greenDim, color: T.green, padding: "3px 9px", borderRadius: 10, fontWeight: 600, border: `1px solid ${T.green}30` }}>Custom Aktif</span>
            )}
          </div>
          <div style={{ padding: "12px 15px", background: T.blueDim, borderRadius: 9, fontSize: 12, color: T.blue, lineHeight: 1.8, marginBottom: 16, border: `1px solid ${T.blue}30` }}>
            Pesan ini muncul setiap user mengetik <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>/start</code> — gunakan <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>{"{name}"}</code> untuk nama pembeli otomatis. Ringkasan stok ditambahkan otomatis di bawah.
          </div>
          <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Teks Sambutan</label>
          <textarea
            value={greetingText} onChange={e => setGreetingText(e.target.value)} rows={4}
            placeholder="Halo {name}! Selamat datang di toko kami."
            className="glass-input"
            style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
          />
          <div style={{ marginTop: 11, padding: "13px 15px", background: T.glass, borderRadius: 9, fontSize: 12, color: T.textSub, lineHeight: 1.8, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 7, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Preview</div>
            {(greetingText || "Halo {name}! Selamat datang.").replace(/\{name\}/g, "Budi")}
            <div style={{ marginTop: 9, color: T.textMuted, fontFamily: T.fontMono, fontSize: 11.5 }}>Stok Tersedia:<br />Netflix Premium — Rp 50.000 (3 stok)<br />Spotify Premium — Rp 35.000 (Habis)</div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <Btn onClick={saveGreeting} variant="success" disabled={greetingSaving} icon={greetingSaving ? null : "check"}>{greetingSaving ? "Menyimpan..." : "Simpan Sambutan"}</Btn>
            {hasCustomGreeting && <Btn onClick={resetGreeting} variant="ghost" icon="refresh">Reset</Btn>}
          </div>
        </Card>

        {/* Koneksi */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="pulse" size={16} color={T.cyan} /> Status Koneksi
          </div>
          <div style={{ padding: "13px 16px", borderRadius: 11, border: `1px solid ${connStatus ? connStyles[connStatus]?.color + "30" : T.border}`, background: connStatus ? `${connStyles[connStatus]?.color}14` : T.glass, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: connStatus ? connStyles[connStatus]?.color : T.textSub, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: connStatus ? connStyles[connStatus]?.color : T.textMuted, boxShadow: connStatus ? `0 0 8px ${connStyles[connStatus]?.color}` : "none" }}  />
              {connLoading ? "Mengecek..." : connStatus ? connStyles[connStatus]?.msg : "Belum dicek"}
            </span>
            <Btn onClick={testConn} disabled={connLoading} size="sm" variant="outline" icon="refresh">Test</Btn>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>API: {API_BASE}</div>
        </Card>

        {/* Ganti Password */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="lock" size={16} color={T.cyan} /> Ganti Password
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }} className="responsive-grid-3">
            <Input label="Password Lama" type="password" value={pwForm.old} onChange={e => setPwForm({ ...pwForm, old: e.target.value })} placeholder="••••••••" />
            <Input label="Password Baru" type="password" value={pwForm.new_} onChange={e => setPwForm({ ...pwForm, new_: e.target.value })} placeholder="Min 6 karakter" />
            <Input label="Konfirmasi" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Ulangi password" />
          </div>
          <Btn onClick={changePw} disabled={pwSaving} icon={pwSaving ? null : "check"}>{pwSaving ? "Menyimpan..." : "Ganti Password"}</Btn>
        </Card>

        {currentUser.role === "admin" && (
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="settings" size={16} color={T.cyan} /> Bot Settings
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>Auto-Order</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Kirim stok otomatis setelah pembayaran dikonfirmasi</div>
              </div>
              <div onClick={() => setSettings({ ...settings, auto_order: !settings.auto_order })} className="toggle-switch" style={{ width: 46, height: 25, borderRadius: 13, background: settings.auto_order ? T.cyan : T.glass, border: `1px solid ${settings.auto_order ? T.cyan : T.border}`, cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ width: 19, height: 19, borderRadius: "50%", background: settings.auto_order ? "#06140F" : T.textMuted, position: "absolute", top: 2, left: settings.auto_order ? 24 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
              </div>
            </div>
            <Btn onClick={saveSettings} disabled={saving} icon={saving ? null : "check"}>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</Btn>
          </Card>
        )}

        {/* Info Pembayaran */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 12, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="qr" size={16} color={T.cyan} /> Info Pembayaran & QR QRIS
          </div>
          <div style={{ padding: "12px 15px", background: T.blueDim, borderRadius: 9, fontSize: 12, color: T.blue, lineHeight: 1.8, marginBottom: 16, border: `1px solid ${T.blue}30` }}>
            Upload QR QRIS: kirim foto di Telegram dengan caption <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>/setpay [teks]</code>
          </div>
          <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Teks Info Pembayaran</label>
          <textarea value={payText} onChange={e => setPayText(e.target.value)} rows={5} placeholder={"Transfer ke BCA 1234567890\na.n Nama Toko"} className="glass-input" style={{ width: "100%", padding: "11px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
          {payment?.photo_file_id && <div style={{ marginTop: 8, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={13} /> Foto QR sudah diset via Telegram</div>}
          <div style={{ marginTop: 14 }}><Btn onClick={savePayment} variant="success" icon="check">Simpan Info Pembayaran</Btn></div>
        </Card>

        {/* Bot Redirect — diletakkan di bawah */}
        <Card accent={T.violet}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="bot" size={16} color={T.violet} /> Tombol Redirect ke Bot
          </div>
          {botInfo ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", background: T.cyanDim, borderRadius: 11, border: `1px solid ${T.cyan}30`, marginBottom: 16, flexWrap: "wrap" }}>
                <Icon name="bot" size={20} color={T.cyan} />
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.cyan }}>@{botInfo.username}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, overflow: "hidden", textOverflow: "ellipsis" }}>{botInfo.url}</div>
                </div>
                <a href={botInfo.url} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", background: `linear-gradient(135deg, ${T.cyan}, #0FD9C2)`, color: "#06140F", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  Buka Bot <Icon name="external" size={12} />
                </a>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 7, fontWeight: 500 }}>Custom URL / Deep Link</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder={`https://t.me/${botInfo.username}?start=promo`} className="glass-input" style={{ flex: "1 1 200px", padding: "10px 13px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13, color: T.text, outline: "none", fontFamily: T.fontMono, minWidth: 0 }} />
                  <a href={customUrl || botInfo.url} target="_blank" rel="noreferrer" style={{ padding: "10px 16px", background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}44`, borderRadius: 9, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Test Link</a>
                </div>
              </div>
            </>
          ) : <div style={{ color: T.textMuted, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}><span className="spinner" /> Memuat info bot...</div>}
        </Card>

        {/* Halaman Cek Stok Publik */}
        <Card accent={T.cyan}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 18, fontFamily: T.fontDisplay, display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="layers" size={16} color={T.cyan} /> Halaman Cek Stok Publik
          </div>
          <div style={{ padding: "12px 15px", background: T.blueDim, borderRadius: 9, fontSize: 12, color: T.blue, lineHeight: 1.8, marginBottom: 16, border: `1px solid ${T.blue}30` }}>
            Customer bisa cek stok real-time tanpa login lewat tombol <strong style={{ color: T.text }}>Cek Stok Real-time</strong> di bot. Halaman ini auto-refresh tiap 15 detik dan tidak pernah menampilkan data akun/password.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", background: T.glass, borderRadius: 11, border: `1px solid ${T.border}`, marginBottom: 14, flexWrap: "wrap" }}>
            <Icon name="layers" size={20} color={T.cyan} />
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Link Halaman Stok</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, overflow: "hidden", textOverflow: "ellipsis" }}>{window.location.origin}/stock</div>
            </div>
            <a href="/stock" target="_blank" rel="noreferrer" style={{ padding: "8px 16px", background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}44`, borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
              Buka Halaman
            </a>
          </div>
          <div style={{ padding: "12px 15px", background: T.amberDim, borderRadius: 9, fontSize: 12, color: T.amber, lineHeight: 1.8, border: `1px solid ${T.amber}30` }}>
            <strong style={{ color: T.text }}>Wajib di-set di Railway:</strong> tambahkan variable <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>STOCK_PAGE_URL</code> = <code style={{ background: "rgba(0,0,0,0.35)", padding: "2px 6px", borderRadius: 4 }}>{window.location.origin}/stock</code> agar tombol di bot Telegram mengarah ke sini.
          </div>
        </Card>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", icon: "grid",      label: "Dashboard",  roles: ["admin", "member"] },
  { id: "orders",    icon: "orders",    label: "Pesanan",    roles: ["admin", "member"] },
  { id: "products",  icon: "box",       label: "Produk",     roles: ["admin", "member"] },
  { id: "stock",     icon: "layers",    label: "Stok",       roles: ["admin", "member"] },
  { id: "triggers",  icon: "bolt",      label: "Triggers",   roles: ["admin", "member"] },
  { id: "broadcast", icon: "megaphone", label: "Broadcast",  roles: ["admin", "member"] },
  { id: "report",    icon: "chart",     label: "Laporan",    roles: ["admin", "member"] },
  { id: "logs",      icon: "activity",  label: "Log Akses",  roles: ["admin"] },
  { id: "users",     icon: "users",     label: "Users",      roles: ["admin"] },
  { id: "settings",  icon: "settings",  label: "Pengaturan", roles: ["admin", "member"] },
];

const PAGES = { dashboard: DashboardPage, orders: OrdersPage, products: ProductsPage, stock: StockPage, triggers: TriggersPage, broadcast: BroadcastPage, report: ReportPage, logs: LogsPage, users: UsersPage, settings: SettingsPage };

function Dashboard({ user, onLogout }) {
  const [page,     setPage]     = useState("dashboard");
  const [mobile,   setMobile]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = NAV.filter(n => n.roles.includes(user.role));
  const PageComp    = PAGES[page] || DashboardPage;
  const curNav      = visibleNav.find(n => n.id === page);
  const SW          = collapsed ? 72 : 232;

  const nav = id => { setPage(id); setMobile(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.void, fontFamily: T.fontBody, color: T.text, position: "relative" }} className="dash-fade-in">
      {/* Ambient background — statis, tanpa blur/animasi agar ringan */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "5%", width: 380, height: 380, background: `radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "5%", width: 340, height: 340, background: `radial-gradient(circle, rgba(255,42,156,0.1) 0%, transparent 70%)` }} />
      </div>

      {mobile && <div onClick={() => setMobile(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40 }} />}

      {/* Sidebar */}
      <aside style={{ width: SW, background: T.panel, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, transition: "width .28s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }} className={`sidebar${mobile ? " open" : ""}`}>

        {/* Logo + collapse toggle */}
        <div style={{
          padding: collapsed ? "16px 0 12px" : "20px 18px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: collapsed ? 10 : 0,
          flexShrink: 0,
          minHeight: 68,
        }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: T.cyanDim, border: `1px solid ${T.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="bot" size={17} color={T.cyan} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.01em", fontFamily: T.fontDisplay, whiteSpace: "nowrap" }}>ShopBot</div>
                <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>CONSOLE</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.cyanDim, border: `1px solid ${T.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="bot" size={17} color={T.cyan} />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="collapse-btn icon-btn" style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 7, cursor: "pointer", color: T.textMuted, padding: "5px", flexShrink: 0, display: "flex" }}>
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={13} />
          </button>
        </div>

        {/* User badge */}
        {!collapsed ? (
          <div style={{ margin: "12px 14px 6px", padding: "11px 13px", background: T.glass, borderRadius: 11, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: user.role === "admin" ? T.violetDim : T.cyanDim, border: `1px solid ${user.role === "admin" ? T.violet : T.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: user.role === "admin" ? T.violet : T.cyan, flexShrink: 0, fontFamily: T.fontDisplay }}>{user.username[0].toUpperCase()}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</div>
              <div style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Icon name={user.role === "admin" ? "crown" : "users"} size={9} />{user.role === "admin" ? "Admin" : "Member"}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px", flexShrink: 0 }}>
            <div title={user.username} style={{ width: 34, height: 34, borderRadius: 9, background: user.role === "admin" ? T.violetDim : T.cyanDim, border: `1px solid ${user.role === "admin" ? T.violet : T.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: user.role === "admin" ? T.violet : T.cyan, fontFamily: T.fontDisplay }}>{user.username[0].toUpperCase()}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {visibleNav.map(item => (
            <button key={item.id} onClick={() => nav(item.id)} title={collapsed ? item.label : ""} className="nav-item" style={{
              width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : 12,
              justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "12px 0" : "11px 14px",
              background: page === item.id ? T.cyanDim : "transparent",
              border: page === item.id ? `1px solid ${T.cyan}33` : "1px solid transparent",
              cursor: "pointer", color: page === item.id ? T.cyan : T.textSub,
              fontSize: 13, fontWeight: page === item.id ? 600 : 500, textAlign: "left",
              borderRadius: 10, marginBottom: 3, whiteSpace: "nowrap", fontFamily: T.fontBody,
              position: "relative",
            }}>
              {page === item.id && !collapsed && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 16, background: T.cyan, borderRadius: 2, boxShadow: `0 0 8px ${T.cyan}` }} />}
              <Icon name={item.icon} size={collapsed ? 19 : 16} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: collapsed ? "12px 10px" : "12px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={onLogout} title="Logout" className="icon-btn" style={{ width: "100%", padding: collapsed ? "11px 0" : "10px 14px", background: "transparent", color: T.red, border: `1px solid ${T.red}30`, borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit" }}>
            <Icon name="logout" size={14} />{!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: SW, display: "flex", flexDirection: "column", minHeight: "100vh", transition: "margin-left .28s cubic-bezier(.4,0,.2,1)", position: "relative", zIndex: 1 }} className="main-content">
        <header style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: "0 26px", height: 60, display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 30 }}>
          <button onClick={() => setMobile(!mobile)} className="hamburger icon-btn" style={{ display: "none", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", padding: "7px", color: T.textSub }}>
            <Icon name="menu" size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name={curNav?.icon} size={17} color={T.cyan} />
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.fontDisplay }}>{curNav?.label}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>{new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</span>
            <button onClick={onLogout} className="topbar-logout icon-btn" style={{ display: "none", padding: "6px 13px", background: T.redDim, color: T.red, border: `1px solid ${T.red}30`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Logout</button>
          </div>
        </header>

        <main style={{ flex: 1, padding: 26, maxWidth: 1160, width: "100%", boxSizing: "border-box" }}>
          <PageComp currentUser={user} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(getUser());
  const [transitioning, setTransitioning] = useState(false);

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isLoginPath = path === "/login";

  const handleLogin = (u) => {
    setTransitioning(true);
    setUser(u);
  };
  const logout = () => {
    if (window.confirm("Logout dari console?")) {
      clearAuth();
      setUser(null);
      window.location.href = "/login";
    }
  };

  // Sudah login tapi masih di /login -> langsung ke dashboard
  useEffect(() => {
    if (user && isLoginPath && !transitioning) {
      window.location.href = "/dashboard";
    }
  }, [user, isLoginPath, transitioning]);

  // Belum login dan bukan di /login -> arahkan ke /login
  useEffect(() => {
    if (!user && !isLoginPath) {
      window.location.href = "/login";
    }
  }, [user, isLoginPath]);

  let content;
  if (transitioning) {
    // Setelah login sukses: tampilkan transisi loading, lalu pindah ke dashboard
    content = <LoadingConsole onDone={() => { window.location.href = "/dashboard"; }} />;
  } else if (isLoginPath) {
    content = user ? <LoadingConsole onDone={() => { window.location.href = "/dashboard"; }} /> : <LoginPage onLogin={handleLogin} />;
  } else if (!user) {
    // Sedang proses redirect ke /login
    content = <LoadingConsole onDone={() => {}} />;
  } else {
    content = <Dashboard user={user} onLogout={logout} />;
  }

  return (
    <>
      {content}
      <GlobalStyles />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES — animations, glass effects, responsive rules
// ══════════════════════════════════════════════════════════════════════════
function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; }

      /* ── Glass effects (statis, transition ringan) ── */
      .glass-card { transition: border-color .15s; }
      .glass-card:hover { border-color: rgba(0,240,255,0.22); }
      .glass-btn { transition: transform .1s ease, filter .1s ease; }
      .glass-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
      .glass-btn:active:not(:disabled) { transform: translateY(0); }
      .glass-input { transition: border-color .12s; }
      .glass-input:focus { border-color: ${T.cyan} !important; box-shadow: 0 0 0 3px ${T.cyanDim}; }
      .icon-btn { transition: filter .1s; }
      .icon-btn:hover:not(:disabled) { filter: brightness(1.25); }
      .filter-pill { transition: border-color .12s, color .12s, background .12s; }
      .filter-pill:hover { border-color: ${T.cyan}66 !important; }
      .nav-item { transition: background .12s, color .12s; }
      .nav-item:hover { background: rgba(255,255,255,0.04) !important; color: ${T.text} !important; }
      .table-row { border-bottom: 1px solid ${T.border}; transition: background .1s; }
      .table-row:hover { background: rgba(255,255,255,0.025); }
      .toggle-switch { transition: background .15s, border-color .15s; }

      /* ── Spinners (ringan, cuma rotate) ── */
      .spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15); border-top-color: currentColor; border-radius: 50%; display: inline-block; animation: spin .7s linear infinite; }
      .spinner-lg { width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: ${T.cyan}; border-radius: 50%; display: inline-block; animation: spin .8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* ── Toast (animasi sekali, bukan infinite) ── */
      .toast-in { animation: toastIn .2s ease-out; }
      @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

      /* ── Background statis cyberpunk — TIDAK ADA blur/animasi infinite ── */
      .bg-grid-static {
        position: absolute; inset: 0;
        background-image: linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px);
        background-size: 44px 44px;
        opacity: 0.45;
      }

      /* ── Fade masuk sekali saja, durasi pendek, tidak infinite ── */
      .login-fade-in { animation: fadeUp .35s ease-out; }
      .login-fade-in-delay { animation: fadeUp .35s ease-out .08s backwards; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

      .dash-fade-in { animation: dashFadeIn .25s ease-out; }
      @keyframes dashFadeIn { from { opacity: 0; } to { opacity: 1; } }

      /* ── Loading bar (sekali jalan, bukan infinite) ── */
      .loading-bar { width: 0%; animation: loadBar 1.2s ease-out forwards; }
      @keyframes loadBar { from { width: 0%; } to { width: 100%; } }

      /* ── Logo glow statis (tanpa pulse infinite) ── */
      .logo-static-glow { box-shadow: 0 0 28px ${T.cyanGlow}; }

      select option { background: ${T.surface}; color: ${T.text}; }
      nav::-webkit-scrollbar { width: 4px; }
      nav::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }

      /* ── Responsive ── */
      .mobile-only { display: none; }
      @media (max-width: 900px) {
        .responsive-grid { grid-template-columns: 1fr !important; }
        .responsive-grid-3 { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 768px) {
        .sidebar { transform: translateX(-100%); transition: transform .22s ease; }
        .sidebar.open { transform: translateX(0) !important; }
        .main-content { margin-left: 0 !important; }
        .hamburger { display: flex !important; }
        .collapse-btn { display: none !important; }
        .topbar-logout { display: flex !important; }
        .login-panel-right { display: none !important; }
        /* Toggle: tabel jadi card list di mobile supaya tidak overflow horizontal */
        .desktop-only { display: none !important; }
        .mobile-only { display: flex !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .login-fade-in, .login-fade-in-delay, .dash-fade-in, .loading-bar, .toast-in { animation: none !important; }
      }
    `}</style>
  );
}

