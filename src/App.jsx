import { useState, useEffect, useCallback } from "react";

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
  if (s < 60) return `${s}d lalu`;
  if (s < 3600) return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  return new Date(ts).toLocaleDateString("id-ID");
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────
const T = {
  // Surfaces
  bg:       "#0F1117",
  surface:  "#161B27",
  card:     "#1C2333",
  border:   "#252D3D",
  borderHover: "#334155",
  // Accent
  accent:   "#6C63FF",
  accentHover: "#7C75FF",
  accentDim:"rgba(108,99,255,0.15)",
  accentGlow:"rgba(108,99,255,0.3)",
  // Text
  text:     "#E2E8F0",
  textSub:  "#94A3B8",
  textMuted:"#475569",
  // Status
  green:    "#10B981",
  greenDim: "rgba(16,185,129,0.15)",
  amber:    "#F59E0B",
  amberDim: "rgba(245,158,11,0.15)",
  red:      "#EF4444",
  redDim:   "rgba(239,68,68,0.15)",
  blue:     "#3B82F6",
  blueDim:  "rgba(59,130,246,0.15)",
  purple:   "#8B5CF6",
  purpleDim:"rgba(139,92,246,0.15)",
};

// ── TOAST ─────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  return { toasts, toast: { success: m => add(m, "success"), error: m => add(m, "error"), info: m => add(m, "info") } };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  const C = {
    success: { bg: T.greenDim,  border: T.green,  text: "#6EE7B7", icon: "✓" },
    error:   { bg: T.redDim,    border: T.red,    text: "#FCA5A5", icon: "✕" },
    info:    { bg: T.blueDim,   border: T.blue,   text: "#93C5FD", icon: "i" },
  };
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => {
        const c = C[t.type] || C.info;
        return (
          <div key={t.id} style={{ background: T.card, border: `1px solid ${c.border}`, borderLeft: `3px solid ${c.border}`, padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, maxWidth: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10, animation: "slideIn .2s ease", color: T.text }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.text, flexShrink: 0 }}>{c.icon}</span>
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── REUSABLE COMPONENTS ───────────────────────────────────────────────────
const STATUS = {
  pending:   { bg: T.amberDim,  text: T.amber,  label: "Menunggu" },
  delivered: { bg: T.greenDim,  text: T.green,  label: "Terkirim" },
  cancelled: { bg: T.redDim,    text: T.red,    label: "Dibatalkan" },
  preorder:  { bg: T.purpleDim, text: T.purple, label: "Pre-Order" },
};

function Badge({ status }) {
  const s = STATUS[status] || { bg: "rgba(71,85,105,0.3)", text: T.textSub, label: status };
  return <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" }}>{s.label}</span>;
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{ background: T.card, borderRadius: 14, padding: 24, border: `1px solid ${T.border}`, boxShadow: glow ? `0 0 0 1px ${T.accentGlow}, 0 4px 24px rgba(0,0,0,0.3)` : "0 2px 12px rgba(0,0,0,0.2)", ...style }}>
      {children}
    </div>
  );
}

function Btn({ onClick, children, variant = "primary", disabled = false, full = false, size = "md", style = {} }) {
  const variants = {
    primary:  { bg: T.accent,   hover: T.accentHover, text: "#fff",      border: "transparent" },
    success:  { bg: T.green,    hover: "#059669",     text: "#fff",      border: "transparent" },
    danger:   { bg: T.redDim,   hover: "rgba(239,68,68,0.25)", text: T.red, border: T.red },
    ghost:    { bg: "transparent", hover: T.accentDim, text: T.textSub, border: T.border },
    outline:  { bg: "transparent", hover: T.accentDim, text: T.accent, border: T.accent },
  };
  const v    = variants[variant] || variants.primary;
  const pad  = size === "sm" ? "6px 14px" : size === "lg" ? "14px 28px" : "10px 20px";
  const fz   = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: pad, background: disabled ? T.textMuted : v.bg, color: disabled ? "#94A3B8" : v.text, border: `1px solid ${v.border}`, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: fz, width: full ? "100%" : "auto", transition: "all .15s", fontFamily: "inherit", letterSpacing: "0.01em", ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = disabled ? T.textMuted : v.bg; }}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", required = false, mono = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>{label}{required && <span style={{ color: T.red }}> *</span>}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", outline: "none", transition: "border .15s", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = T.accent}
        onBlur={e => e.target.style.borderColor = T.border}
      />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = T.accent, trend = null }) {
  return (
    <div style={{ background: T.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      </div>
      {trend !== null && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, fontSize: 12, color: trend >= 0 ? T.green : T.red }}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% dari kemarin
        </div>
      )}
    </div>
  );
}

function MiniChart({ data, color = T.accent }) {
  if (!data || data.length < 2) return <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 12 }}>Tidak ada data</div>;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const w = 400, h = 70, px = 8, py = 8;
  const pts = data.map((d, i) => {
    const x = px + (i / (data.length - 1)) * (w - px * 2);
    const y = h - py - (d.revenue / max) * (h - py * 2);
    return `${x},${y}`;
  });
  const area = `${px},${h} ${pts.join(" ")} ${w - px},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 60 }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#cg)" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = px + (i / (data.length - 1)) * (w - px * 2);
        const y = h - py - (d.revenue / max) * (h - py * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 10 }}>{children}</h1>
      {action}
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
      if (!res.ok) return setError(data.error || "Login gagal");
      setAuth(data.token, data.user);
      onLogin(data.user);
    } catch { setError("Tidak bisa terhubung ke server"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${T.accentGlow} 0%, transparent 70%)`, top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", boxShadow: `0 0 40px ${T.accentGlow}` }}>APT CONTROLLER</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>APOSTLE GROUP</h1>
            <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>Dashboard Admin</p>
          </div>

          {/* Form */}
          <div style={{ background: T.card, borderRadius: 16, padding: 32, border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>Selamat datang</h2>
            <p style={{ fontSize: 13, color: T.textSub, marginBottom: 24 }}>Masuk untuk kelola toko Telegram kamu</p>

            {error && (
              <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderLeft: `3px solid ${T.red}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#FCA5A5", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Username</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder="Masukkan username"
                style={{ width: "100%", padding: "11px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  placeholder="Masukkan password"
                  style={{ width: "100%", padding: "11px 42px 11px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = T.accent}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 14 }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              onClick={login} disabled={loading}
              style={{ width: "100%", padding: "12px", background: loading ? T.textMuted : `linear-gradient(135deg, ${T.accent}, #8B5CF6)`, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.02em", boxShadow: loading ? "none" : `0 4px 20px ${T.accentGlow}`, transition: "all .2s", fontFamily: "inherit" }}
            >
              {loading ? "⏳ Masuk..." : "Masuk ke Dashboard"}
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: T.textMuted }}>
            Panel Controller •© Firmandev - MewOne
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div style={{ width: 420, background: T.surface, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48 }} className="login-panel-right">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Kelola toko Telegram</h3>
          <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>Pantau penjualan, kelola stok, konfirmasi order, dan kirim broadcast — semua dari satu dashboard.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {[
            { icon: "📦", text: "Manajemen produk & stok real-time" },
            { icon: "💳", text: "Pembayaran otomatis via Pakasir" },
            { icon: "📊", text: "Laporan & analitik harian" },
            { icon: "👥", text: "Multi-admin dengan role berbeda" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: T.textSub }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 768px) { .login-panel-right { display: none !important; } }
      `}</style>
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

  if (err) return <div style={{ padding: 20, background: T.redDim, borderRadius: 12, color: "#FCA5A5", fontSize: 14, border: `1px solid ${T.red}44` }}>❌ {err}</div>;
  if (!stats) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 14 }}>⏳ Memuat data...</div>;

  return (
    <div>
      <SectionTitle>
        <span style={{ fontSize: 22 }}>🏠</span> Overview
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon="💰" label="Pendapatan Hari Ini" value={idr(stats.revenue_today)} color={T.green} />
        <StatCard icon="📦" label="Terjual Hari Ini"    value={stats.sold_today ?? 0}    color={T.accent} />
        <StatCard icon="⏳" label="Pending"             value={stats.pending_orders ?? 0} color={T.amber} />
        <StatCard icon="👤" label="Total User"          value={stats.total_users ?? 0}   color={T.blue} />
        <StatCard icon="📋" label="Pre-Order"           value={stats.preorders ?? 0}     color={T.purple} />
        <StatCard icon="📦" label="Stok Tersisa"        value={stats.total_stock ?? 0}   color="#06B6D4" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub, marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>Pendapatan 7 Hari</div>
          <MiniChart data={chart} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {chart.map(d => <div key={d.date} style={{ fontSize: 10, color: T.textMuted }}>{d.date?.slice(5)}</div>)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub, marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>Order Pending ({orders.length})</div>
          {orders.length === 0
            ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Tidak ada order pending ✓</div>
            : orders.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{o.product_name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>@{o.username} · <span style={{ fontFamily: "monospace" }}>{o.id}</span></div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{idr(o.price)}</div>
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

  const confirm = async (id) => { setBusy(id + "c"); try { await api(`/api/orders/${id}/confirm`, "PUT"); toast.success("✓ Order dikonfirmasi!"); load(); } catch (e) { toast.error(e.message); } setBusy(null); };
  const reject  = async (id) => { if (!window.confirm("Batalkan order ini?")) return; setBusy(id + "r"); try { await api(`/api/orders/${id}/reject`, "PUT"); toast.success("Order dibatalkan."); load(); } catch (e) { toast.error(e.message); } setBusy(null); };

  const FILTERS = { all: "Semua", pending: "Menunggu", delivered: "Terkirim", cancelled: "Dibatalkan", preorder: "Pre-Order" };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle><span style={{ fontSize: 22 }}>📋</span> Pesanan</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {Object.entries(FILTERS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${filter === k ? T.accent : T.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600, background: filter === k ? T.accentDim : "transparent", color: filter === k ? T.accent : T.textSub, transition: "all .15s" }}>
            {v}
          </button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Order ID", "User", "Produk", "Harga", "Status", "Tanggal", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: T.textMuted, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: T.textMuted }}>⏳ Memuat...</td></tr>
                : orders.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Tidak ada pesanan</td></tr>
                  : orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.surface} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: T.accent, fontSize: 12 }}>{o.id}</td>
                      <td style={{ padding: "12px 16px", color: T.textSub }}>@{o.username}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: T.text }}>{o.product_name}</td>
                      <td style={{ padding: "12px 16px", color: T.green, fontWeight: 700 }}>{idr(o.price)}</td>
                      <td style={{ padding: "12px 16px" }}><Badge status={o.status} /></td>
                      <td style={{ padding: "12px 16px", color: T.textMuted, whiteSpace: "nowrap", fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {o.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => confirm(o.id)} disabled={!!busy} style={{ padding: "5px 12px", background: T.greenDim, color: T.green, border: `1px solid ${T.green}44`, borderRadius: 6, cursor: !!busy ? "default" : "pointer", fontSize: 11, fontWeight: 600 }}>{busy === o.id + "c" ? "⏳" : "✓ Konfirmasi"}</button>
                            <button onClick={() => reject(o.id)} disabled={!!busy} style={{ padding: "5px 12px", background: T.redDim, color: T.red, border: `1px solid ${T.red}44`, borderRadius: 6, cursor: !!busy ? "default" : "pointer", fontSize: 11, fontWeight: 600 }}>{busy === o.id + "r" ? "⏳" : "✕"}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </Card>
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
    if (!form.name.trim()) return toast.error("Nama produk wajib!");
    if (!form.price) return toast.error("Harga wajib!");
    setSaving(true);
    try {
      await api("/api/products", "POST", { name: form.name.trim(), price: parseInt(String(form.price).replace(/\D/g, "")), description: form.description.trim(), preorder_only: form.preorder_only });
      toast.success(`Produk "${form.name}" ditambahkan!`);
      setForm({ name: "", price: "", description: "", preorder_only: false }); setShowForm(false); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const savePrice = async (id) => {
    const p = parseInt(String(editPrice.value).replace(/\D/g, ""));
    if (!p || p <= 0) return toast.error("Harga tidak valid!");
    try { await api(`/api/products/${id}`, "PUT", { price: p }); toast.success("Harga diubah!"); setEditPrice(null); load(); }
    catch (e) { toast.error(e.message); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Hapus "${name}"?`)) return;
    try { await api(`/api/products/${id}`, "DELETE"); toast.success("Dihapus."); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle>
        <span style={{ fontSize: 22 }}>🛍️</span> Produk
        <Btn onClick={() => setShowForm(!showForm)} size="sm">+ Tambah Produk</Btn>
      </SectionTitle>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Produk Baru</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Nama Produk" required value={form.name} onChange={f("name")} placeholder="Netflix Premium" />
            <Input label="Harga (IDR)" required value={form.price} onChange={f("price")} placeholder="50000" />
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Deskripsi</label>
              <textarea value={form.description} onChange={f("description")} placeholder="Deskripsi produk..." rows={3} style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <input type="checkbox" id="po" checked={form.preorder_only} onChange={e => setForm({ ...form, preorder_only: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.accent }} />
              <div>
                <label htmlFor="po" style={{ fontSize: 13, color: T.text, cursor: "pointer", fontWeight: 500 }}>Pre-Order Only</label>
                <div style={{ fontSize: 11, color: T.textMuted }}>Produk tetap bisa dipesan meski stok kosong</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Btn onClick={save} variant="success" disabled={saving}>{saving ? "⏳ Menyimpan..." : "💾 Simpan Produk"}</Btn>
            <Btn onClick={() => setShowForm(false)} variant="ghost">Batal</Btn>
          </div>
        </Card>
      )}

      {products.length === 0
        ? <Card><div style={{ textAlign: "center", color: T.textMuted, padding: 30 }}>Belum ada produk. Tambahkan di atas.</div></Card>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
          {products.map(p => (
            <Card key={p.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{p.name}</div>
                {p.preorder_only && <span style={{ background: T.purpleDim, color: T.purple, fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>PRE-ORDER</span>}
              </div>
              {p.description && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.5 }}>{p.description}</div>}
              <div style={{ marginBottom: 14 }}>
                {editPrice?.id === p.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input autoFocus value={editPrice.value} onChange={e => setEditPrice({ ...editPrice, value: e.target.value })} onKeyDown={e => { if (e.key === "Enter") savePrice(p.id); if (e.key === "Escape") setEditPrice(null); }} style={{ flex: 1, padding: "6px 10px", background: T.surface, border: `1px solid ${T.accent}`, borderRadius: 7, fontSize: 14, fontWeight: 700, color: T.green, fontFamily: "inherit", outline: "none" }} />
                    <button onClick={() => savePrice(p.id)} style={{ padding: "6px 10px", background: T.greenDim, color: T.green, border: `1px solid ${T.green}44`, borderRadius: 7, cursor: "pointer", fontWeight: 700 }}>✓</button>
                    <button onClick={() => setEditPrice(null)} style={{ padding: "6px 10px", background: T.surface, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 7, cursor: "pointer" }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div onClick={() => setEditPrice({ id: p.id, value: String(p.price) })} title="Klik untuk edit harga" style={{ fontSize: 18, fontWeight: 800, color: T.green, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      {idr(p.price)} <span style={{ fontSize: 11, color: T.textMuted }}>✏️</span>
                    </div>
                    <span style={{ fontSize: 12, color: p.stock_count > 0 ? T.green : T.red, fontWeight: 600 }}>
                      {p.stock_count > 0 ? `${p.stock_count} stok` : "Habis"}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => del(p.id, p.name)} style={{ width: "100%", padding: 8, background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Hapus Produk</button>
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
    if (!sel) return toast.error("Pilih produk!");
    if (!input.trim()) return toast.error("Isi data stok!");
    const items = input.split("\n").map(s => s.trim()).filter(Boolean);
    if (!items.length) return toast.error("Tidak ada item valid!");
    setAdding(true);
    try { await api("/api/stock", "POST", { product_id: sel, items }); toast.success(`✓ ${items.length} item ditambahkan!`); setInput(""); loadStock(); }
    catch (e) { toast.error(e.message); }
    setAdding(false);
  };

  const del = async (id) => { try { await api(`/api/stock/${id}`, "DELETE"); toast.success("Dihapus."); loadStock(); } catch (e) { toast.error(e.message); } };
  const getProd = id => products.find(p => p.id === id)?.name || id;

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle><span style={{ fontSize: 22 }}>📦</span> Manajemen Stok</SectionTitle>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Tambah Stok</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, alignItems: "flex-start" }}>
          <div>
            <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Pilih Produk <span style={{ color: T.red }}>*</span></label>
            <select value={sel} onChange={e => setSel(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, cursor: "pointer", outline: "none" }}>
              <option value="">-- Pilih Produk --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Data Stok — 1 item per baris <span style={{ color: T.red }}>*</span></label>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={"email1@gmail.com:password1\nemail2@gmail.com:password2"} rows={5} style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text, fontFamily: "'JetBrains Mono', monospace", resize: "vertical", boxSizing: "border-box", outline: "none" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{input ? `${input.split("\n").filter(s => s.trim()).length} item` : "Kosong"}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}><Btn onClick={addStock} disabled={adding}>{adding ? "⏳ Menambahkan..." : "+ Tambah Stok"}</Btn></div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterProd} onChange={e => setFilterProd(e.target.value)} style={{ padding: "6px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text, cursor: "pointer", outline: "none" }}>
            <option value="">Semua Produk</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {["available", "sold", "all"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "5px 14px", borderRadius: 16, border: `1px solid ${statusFilter === f ? T.accent : T.border}`, fontSize: 11, cursor: "pointer", background: statusFilter === f ? T.accentDim : "transparent", color: statusFilter === f ? T.accent : T.textSub, fontWeight: 600 }}>
                {f === "available" ? "Tersedia" : f === "sold" ? "Terjual" : "Semua"}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: T.textMuted, width: "100%" }}>
            {filterProd ? `📦 ${getProd(filterProd)}` : "Semua produk"} · {allStock.length} item
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Produk", "Data", "Status", "Ditambahkan", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: T.textMuted, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allStock.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Tidak ada stok {filterProd ? `untuk ${getProd(filterProd)}` : ""}</td></tr>
                : allStock.slice(0, 100).map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.surface} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 16px", fontWeight: 500, color: T.text }}>{getProd(s.product_id)}</td>
                    <td style={{ padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.textSub, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.sold ? <span style={{ color: T.textMuted, letterSpacing: 2 }}>●●●●●●●●</span> : s.data}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ background: s.sold ? T.redDim : T.greenDim, color: s.sold ? T.red : T.green, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.sold ? "Terjual" : "Tersedia"}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: T.textMuted, fontSize: 12 }}>{new Date(s.added_at).toLocaleDateString("id-ID")}</td>
                    <td style={{ padding: "10px 16px" }}>
                      {!s.sold && <button onClick={() => del(s.id)} style={{ padding: "3px 10px", background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Hapus</button>}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
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
    if (!form.trigger.trim()) return toast.error("Trigger wajib!");
    if (!form.response.trim()) return toast.error("Balasan wajib!");
    setSaving(true);
    try { await api("/api/triggers", "POST", { trigger: form.trigger.trim(), response: form.response.trim() }); toast.success("Trigger ditambahkan!"); setForm({ trigger: "", response: "" }); setShowForm(false); load(); }
    catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const del = async (t) => { if (!window.confirm(`Hapus "${t}"?`)) return; try { await api(`/api/triggers/${encodeURIComponent(t)}`, "DELETE"); toast.success("Dihapus."); load(); } catch (e) { toast.error(e.message); } };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle>
        <span style={{ fontSize: 22 }}>⚡</span> Trigger & Command
        <Btn onClick={() => setShowForm(!showForm)} size="sm">+ Tambah</Btn>
      </SectionTitle>

      <div style={{ background: T.greenDim, borderRadius: 10, padding: "10px 16px", marginBottom: 16, border: `1px solid ${T.green}44`, fontSize: 12, color: "#6EE7B7", lineHeight: 1.7 }}>
        💡 Foto ke trigger: kirim foto di Telegram → caption <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>/settriggerpic /perintah</code>&nbsp;&nbsp;
        QR QRIS: caption <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>/setpay Teks</code>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Trigger Baru</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <Input label="Kata Trigger" required value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} placeholder="/pay atau /info" mono />
            <div>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Teks Balasan <span style={{ color: T.red }}>*</span></label>
              <textarea value={form.response} onChange={e => setForm({ ...form, response: e.target.value })} rows={4} placeholder="Teks balasan bot..." style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={save} variant="success" disabled={saving}>{saving ? "⏳" : "Simpan"}</Btn>
            <Btn onClick={() => setShowForm(false)} variant="ghost">Batal</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {triggers.length === 0
          ? <Card><div style={{ textAlign: "center", color: T.textMuted, padding: 30 }}>Belum ada trigger.</div></Card>
          : triggers.map(t => (
            <div key={t.trigger} style={{ background: T.card, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <code style={{ background: T.accentDim, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600, color: T.accent, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${T.accent}33` }}>{t.trigger}</code>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>{t.response?.substring(0, 120) || "(kosong)"}{t.response?.length > 120 ? "..." : ""}</div>
                {t.photo_file_id && <span style={{ fontSize: 11, background: T.purpleDim, color: T.purple, padding: "2px 8px", borderRadius: 10, marginTop: 4, display: "inline-block" }}>🖼 Ada Foto</span>}
              </div>
              <button onClick={() => del(t.trigger)} style={{ padding: "4px 12px", background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Hapus</button>
            </div>
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
    if (!message.trim()) return toast.error("Pesan kosong!");
    if (!window.confirm(`Kirim ke ${users.length} user?`)) return;
    setLoading(true); setResult(null);
    try { const r = await api("/api/broadcast", "POST", { message }); setResult(r); toast.success(`Terkirim ke ${r.sent} user!`); setMessage(""); }
    catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle><span style={{ fontSize: 22 }}>📢</span> Broadcast</SectionTitle>
      <div style={{ background: T.amberDim, borderRadius: 10, padding: "10px 16px", marginBottom: 16, border: `1px solid ${T.amber}44`, fontSize: 12, color: T.amber }}>
        ⚠️ Pesan akan dikirim ke <strong>{users.length} user</strong>. Gunakan dengan bijak.
      </div>
      <Card>
        <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 8, fontWeight: 500 }}>Pesan Broadcast</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={"Tulis pesan...\nSupport Markdown: *bold*, _italic_, `code`"} rows={6} style={{ width: "100%", padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, color: T.text, lineHeight: 1.6, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", outline: "none" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
        {message && (
          <div style={{ background: T.surface, borderRadius: 8, padding: "12px 14px", margin: "12px 0", fontSize: 13, color: T.textSub, lineHeight: 1.6, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Preview</div>
            📢 <strong style={{ color: T.text }}>Pengumuman</strong><br /><br />{message}
          </div>
        )}
        <Btn onClick={send} disabled={loading} variant="danger" style={{ background: loading ? T.textMuted : T.red, color: "#fff", border: "none" }}>
          {loading ? "⏳ Mengirim..." : `📢 Kirim ke ${users.length} User`}
        </Btn>
        {result && <div style={{ marginTop: 14, padding: 14, background: T.greenDim, borderRadius: 10, fontSize: 13, color: "#6EE7B7", border: `1px solid ${T.green}44` }}>✓ Selesai — <strong>{result.sent}</strong> berhasil, <strong>{result.failed}</strong> gagal.</div>}
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
      <SectionTitle><span style={{ fontSize: 22 }}>📊</span> Laporan</SectionTitle>
      {report && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard icon="💰" label="Pendapatan"   value={idr(report.revenue)}   color={T.green} />
          <StatCard icon="📦" label="Terjual"      value={report.sold}           color={T.accent} />
          <StatCard icon="🆕" label="Order Baru"   value={report.new_orders}     color={T.blue} />
          <StatCard icon="❌" label="Dibatalkan"   value={report.cancelled}      color={T.red} />
          <StatCard icon="📋" label="Pre-Order"    value={report.preorders}      color={T.purple} />
        </div>
      )}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 14 }}>Pendapatan 30 Hari</div>
        <MiniChart data={chart} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {chart.filter((_, i) => i % 6 === 0).map(d => <div key={d.date} style={{ fontSize: 10, color: T.textMuted }}>{d.date?.slice(5)}</div>)}
        </div>
      </Card>
      {report?.top_products?.length > 0 && (
        <Card>
          <div style={{ fontSize: 12, color: T.textSub, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16 }}>Produk Terlaris</div>
          {report.top_products.map((p, i) => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: [T.amberDim, T.blueDim, T.greenDim][i] || T.accentDim, border: `1px solid ${[T.amber, T.blue, T.green][i] || T.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: [T.amber, T.blue, T.green][i] || T.accent }}>{i + 1}</div>
                <span style={{ fontWeight: 500, color: T.text }}>{p.name}</span>
              </div>
              <span style={{ fontWeight: 700, color: T.accent }}>{p.count}×</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOG PAGE
// ══════════════════════════════════════════════════════════════════════════
const ACTION_STYLE = {
  LOGIN:          { color: T.blue,   icon: "🔑" },
  ADD_PRODUCT:    { color: T.green,  icon: "➕" },
  DELETE_PRODUCT: { color: T.red,    icon: "🗑" },
  EDIT_PRODUCT:   { color: T.amber,  icon: "✏️" },
  ADD_STOCK:      { color: T.green,  icon: "📦" },
  DELETE_STOCK:   { color: T.red,    icon: "🗑" },
  CONFIRM_ORDER:  { color: T.green,  icon: "✅" },
  REJECT_ORDER:   { color: T.red,    icon: "❌" },
  AUTO_CONFIRM:   { color: T.green,  icon: "🤖" },
  ADD_TRIGGER:    { color: T.purple, icon: "⚡" },
  DELETE_TRIGGER: { color: T.red,    icon: "🗑" },
  BROADCAST:      { color: T.amber,  icon: "📢" },
  CREATE_USER:    { color: T.blue,   icon: "👤" },
  EDIT_USER:      { color: T.amber,  icon: "✏️" },
  DELETE_USER:    { color: T.red,    icon: "🗑" },
  EDIT_PAYMENT:   { color: T.purple, icon: "💳" },
  EDIT_SETTINGS:  { color: T.textSub, icon: "⚙️" },
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
      <SectionTitle><span style={{ fontSize: 22 }}>📝</span> Log Akses</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {actions.slice(0, 10).map(a => (
          <button key={a} onClick={() => setFilter(a)} style={{ padding: "5px 12px", borderRadius: 16, border: `1px solid ${filter === a ? T.accent : T.border}`, fontSize: 11, cursor: "pointer", background: filter === a ? T.accentDim : "transparent", color: filter === a ? T.accent : T.textSub, fontWeight: 600 }}>
            {a === "ALL" ? "Semua" : `${ACTION_STYLE[a]?.icon || ""} ${a}`}
          </button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Waktu", "User", "Aksi", "Detail"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: T.textMuted, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: T.textMuted }}>⏳</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Tidak ada log</td></tr>
                  : filtered.map(l => {
                    const s = ACTION_STYLE[l.action] || { color: T.textSub, icon: "📌" };
                    return (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.surface} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 16px", color: T.textMuted, fontSize: 11, whiteSpace: "nowrap" }}>{ago(l.timestamp)}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: T.text }}>{l.username}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${s.color}18`, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${s.color}33` }}>
                            {s.icon} {l.action}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", color: T.textSub, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.detail}</td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </Card>
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
    if (!form.username.trim()) return toast.error("Username wajib!");
    if (!editId && !form.password) return toast.error("Password wajib!");
    setSaving(true);
    try {
      if (editId) { const u = {}; if (form.password) u.password = form.password; u.role = form.role; await api(`/api/dashboard-users/${editId}`, "PUT", u); toast.success("User diupdate!"); }
      else { await api("/api/dashboard-users", "POST", form); toast.success(`User "${form.username}" dibuat!`); }
      setForm({ username: "", password: "", role: "member" }); setShowForm(false); setEditId(null); load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const del = async (id, uname) => { if (!window.confirm(`Hapus "${uname}"?`)) return; try { await api(`/api/dashboard-users/${id}`, "DELETE"); toast.success("Dihapus."); load(); } catch (e) { toast.error(e.message); } };
  const startEdit = (u) => { setEditId(u.id); setForm({ username: u.username, password: "", role: u.role }); setShowForm(true); };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle>
        <span style={{ fontSize: 22 }}>👥</span> User Dashboard
        <Btn onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ username: "", password: "", role: "member" }); }} size="sm">+ Tambah User</Btn>
      </SectionTitle>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>{editId ? "Edit User" : "User Baru"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Input label="Username" required value={form.username} onChange={f("username")} placeholder="johndoe" />
            <Input label={editId ? "Password Baru (kosong = tidak ubah)" : "Password"} type="password" required={!editId} value={form.password} onChange={f("password")} placeholder="••••••••" />
            <div>
              <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Role</label>
              <select value={form.role} onChange={f("role")} style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, cursor: "pointer", outline: "none" }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ padding: "10px 14px", background: T.surface, borderRadius: 8, fontSize: 12, color: T.textMuted, marginBottom: 14, border: `1px solid ${T.border}`, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>Admin</strong> — Akses penuh + kelola user + lihat log&nbsp;&nbsp;|&nbsp;&nbsp;<strong style={{ color: T.text }}>Member</strong> — Kelola produk, stok, order, trigger, broadcast
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={save} variant="success" disabled={saving}>{saving ? "⏳" : "Simpan"}</Btn>
            <Btn onClick={() => { setShowForm(false); setEditId(null); }} variant="ghost">Batal</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {users.map(u => (
          <Card key={u.id} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.role === "admin" ? `linear-gradient(135deg, ${T.accent}, ${T.purple})` : T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: T.text }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{u.username}</div>
                  {u.id === getUser()?.id && <span style={{ fontSize: 10, color: T.accent }}>Anda</span>}
                </div>
              </div>
              <span style={{ background: u.role === "admin" ? T.accentDim : T.surface, color: u.role === "admin" ? T.accent : T.textSub, fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 700, border: `1px solid ${u.role === "admin" ? T.accent + "44" : T.border}` }}>
                {u.role === "admin" ? "👑 Admin" : "👤 Member"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              <div>Dibuat: {new Date(u.created_at).toLocaleDateString("id-ID")}</div>
              <div>Oleh: {u.created_by}</div>
              <div>Login: {u.last_login ? ago(u.last_login) : "Belum pernah"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => startEdit(u)} style={{ flex: 1, padding: 7, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}33`, borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
              {u.id !== getUser()?.id && <button onClick={() => del(u.id, u.username)} style={{ flex: 1, padding: 7, background: T.redDim, color: T.red, border: `1px solid ${T.red}22`, borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Hapus</button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAKASIR COMPONENT
// ══════════════════════════════════════════════════════════════════════════
function PakasirCard({ toast }) {
  const [info, setInfo] = useState(null);
  const [testOrd, setTestOrd] = useState("");
  const [testAmt, setTestAmt] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { api("/api/pakasir/info").then(setInfo).catch(() => setInfo({ active: false })); }, []);

  const checkStatus = async () => {
    if (!testOrd || !testAmt) return toast.error("Isi Order ID dan Amount!");
    setTesting(true); setTestResult(null);
    try { const r = await api(`/api/pakasir/status?order_id=${testOrd}&amount=${testAmt}`); setTestResult(r); }
    catch (e) { toast.error(e.message); }
    setTesting(false);
  };

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>💳 Pakasir Payment Gateway</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, border: `1px solid ${info?.active ? T.green + "44" : T.amber + "44"}`, background: info?.active ? T.greenDim : T.amberDim, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{info?.active ? "✅" : "⚠️"}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: info?.active ? T.green : T.amber }}>{info === null ? "Memuat..." : info?.active ? `Aktif — ${info.project}` : "Tidak Aktif"}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{info?.active ? "Payment otomatis aktif" : "Set PAKASIR_PROJECT & PAKASIR_API_KEY di Railway"}</div>
        </div>
      </div>
      {info?.active && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Webhook URL — Paste ke Pakasir Dashboard</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={info.webhook} style={{ flex: 1, padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.textSub, outline: "none" }} />
              <Btn onClick={() => { navigator.clipboard.writeText(info.webhook); toast.success("Disalin!"); }} size="sm">Salin</Btn>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Cek Status Transaksi</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
              <input value={testOrd} onChange={e => setTestOrd(e.target.value)} placeholder="ORD-XXXXXXXX" style={{ padding: "8px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, color: T.text, fontFamily: "monospace", outline: "none" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
              <input value={testAmt} onChange={e => setTestAmt(e.target.value)} placeholder="50000" style={{ padding: "8px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, color: T.text, outline: "none" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
              <Btn onClick={checkStatus} disabled={testing} size="sm">{testing ? "⏳" : "Cek"}</Btn>
            </div>
            {testResult?.transaction && (
              <div style={{ marginTop: 10, padding: "12px 14px", background: T.surface, borderRadius: 8, fontSize: 12, color: T.textSub, lineHeight: 1.8, border: `1px solid ${T.border}` }}>
                <div>Status: <strong style={{ color: testResult.transaction.status === "completed" ? T.green : T.amber }}>{testResult.transaction.status}</strong></div>
                <div>Amount: <strong style={{ color: T.text }}>{idr(testResult.transaction.amount)}</strong></div>
              </div>
            )}
          </div>
        </>
      )}
      {!info?.active && (
        <div style={{ padding: "12px 14px", background: T.blueDim, borderRadius: 8, fontSize: 12, color: "#93C5FD", lineHeight: 1.8, border: `1px solid ${T.blue}44` }}>
          <strong style={{ color: T.text }}>Setup Pakasir:</strong><br />
          1. Daftar di <a href="https://pakasir.com" target="_blank" rel="noreferrer" style={{ color: T.accent }}>pakasir.com</a> → buat Proyek<br />
          2. Set di Railway: <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>PAKASIR_PROJECT</code> & <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>PAKASIR_API_KEY</code><br />
          3. Set <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>APP_URL</code> = URL Railway kamu<br />
          4. Di Pakasir → Edit Proyek → Webhook URL = <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>APP_URL/webhook/pakasir</code>
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
    testConn();
  }, []);

  const saveSettings = async () => { setSaving(true); try { await api("/api/settings", "PUT", settings); toast.success("Tersimpan!"); } catch (e) { toast.error(e.message); } setSaving(false); };
  const savePayment  = async () => { try { await api("/api/payment", "PUT", { text: payText }); toast.success("Info pembayaran disimpan!"); } catch (e) { toast.error(e.message); } };
  const changePw     = async () => {
    if (!pwForm.old || !pwForm.new_) return toast.error("Semua field wajib!");
    if (pwForm.new_ !== pwForm.confirm) return toast.error("Password baru tidak cocok!");
    if (pwForm.new_.length < 6) return toast.error("Minimal 6 karakter!");
    setPwSaving(true);
    try { await api(`/api/dashboard-users/${currentUser.id}`, "PUT", { password: pwForm.new_ }); toast.success("Password berhasil diubah!"); setPwForm({ old: "", new_: "", confirm: "" }); }
    catch (e) { toast.error(e.message); }
    setPwSaving(false);
  };

  const connStyles = {
    ok:           { bg: T.greenDim,  border: T.green,  text: T.green,  msg: "✓ Terhubung ke Railway" },
    unauthorized: { bg: T.redDim,    border: T.red,    text: T.red,    msg: "✕ API Key Salah" },
    error:        { bg: T.amberDim,  border: T.amber,  text: T.amber,  msg: "⚠ Tidak bisa terhubung" },
  };

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <SectionTitle><span style={{ fontSize: 22 }}>⚙️</span> Pengaturan</SectionTitle>
      <div style={{ display: "grid", gap: 16 }}>

        {/* Pakasir */}
        <PakasirCard toast={toast} />

        {/* Bot Redirect */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>🤖 Tombol Redirect ke Bot</div>
          {botInfo ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: T.greenDim, borderRadius: 10, border: `1px solid ${T.green}44`, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.green }}>@{botInfo.username}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{botInfo.url}</div>
                </div>
                <a href={botInfo.url} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", padding: "7px 16px", background: T.green, color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>Buka Bot ↗</a>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Custom URL / Deep Link</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder={`https://t.me/${botInfo.username}?start=promo`} style={{ flex: 1, padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "monospace" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
                  <a href={customUrl || botInfo.url} target="_blank" rel="noreferrer" style={{ padding: "9px 16px", background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Test Link</a>
                </div>
              </div>
            </>
          ) : <div style={{ color: T.textMuted, fontSize: 13 }}>⏳ Memuat info bot...</div>}
        </Card>

        {/* Koneksi */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>🔌 Status Koneksi API</div>
          <div style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${connStatus ? connStyles[connStatus]?.border + "44" : T.border}`, background: connStatus ? connStyles[connStatus]?.bg : T.surface, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: connStatus ? connStyles[connStatus]?.text : T.textSub }}>
              {connLoading ? "⏳ Mengecek..." : connStatus ? connStyles[connStatus]?.msg : "Belum dicek"}
            </span>
            <Btn onClick={testConn} disabled={connLoading} size="sm">Test</Btn>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>API: <code style={{ color: T.textSub, fontFamily: "monospace" }}>{API_BASE}</code></div>
        </Card>

        {/* Ganti Password */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>🔒 Ganti Password</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Input label="Password Lama" type="password" value={pwForm.old} onChange={e => setPwForm({ ...pwForm, old: e.target.value })} placeholder="••••••••" />
            <Input label="Password Baru" type="password" value={pwForm.new_} onChange={e => setPwForm({ ...pwForm, new_: e.target.value })} placeholder="Min 6 karakter" />
            <Input label="Konfirmasi" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Ulangi password" />
          </div>
          <Btn onClick={changePw} disabled={pwSaving}>{pwSaving ? "⏳" : "Ganti Password"}</Btn>
        </Card>

        {/* Bot Settings */}
        {currentUser.role === "admin" && (
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>⚙️ Bot Settings</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}`, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>Auto-Order</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>Kirim stok otomatis setelah pembayaran dikonfirmasi</div>
              </div>
              <div onClick={() => setSettings({ ...settings, auto_order: !settings.auto_order })} style={{ width: 44, height: 24, borderRadius: 12, background: settings.auto_order ? T.accent : T.surface, border: `1px solid ${settings.auto_order ? T.accent : T.border}`, cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: settings.auto_order ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
              </div>
            </div>
            <Btn onClick={saveSettings} disabled={saving}>{saving ? "⏳" : "Simpan Pengaturan"}</Btn>
          </Card>
        )}

        {/* Info Pembayaran */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>💳 Info Pembayaran & QR QRIS</div>
          <div style={{ padding: "10px 14px", background: T.blueDim, borderRadius: 8, fontSize: 12, color: "#93C5FD", lineHeight: 1.7, marginBottom: 14, border: `1px solid ${T.blue}44` }}>
            Upload QR QRIS: kirim foto di Telegram dengan caption <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>/setpay [teks]</code>
          </div>
          <label style={{ fontSize: 12, color: T.textSub, display: "block", marginBottom: 6, fontWeight: 500 }}>Teks Info Pembayaran</label>
          <textarea value={payText} onChange={e => setPayText(e.target.value)} rows={5} placeholder={"Transfer ke BCA 1234567890\na.n Nama Toko"} style={{ width: "100%", padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
          {payment?.photo_file_id && <div style={{ marginTop: 6, fontSize: 12, color: T.green }}>✓ Foto QR sudah diset via Telegram</div>}
          <div style={{ marginTop: 12 }}><Btn onClick={savePayment} variant="success">Simpan Info Pembayaran</Btn></div>
        </Card>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", icon: "🏠", label: "Dashboard",  roles: ["admin", "member"] },
  { id: "orders",    icon: "📋", label: "Pesanan",    roles: ["admin", "member"] },
  { id: "products",  icon: "🛍️", label: "Produk",    roles: ["admin", "member"] },
  { id: "stock",     icon: "📦", label: "Stok",       roles: ["admin", "member"] },
  { id: "triggers",  icon: "⚡", label: "Triggers",   roles: ["admin", "member"] },
  { id: "broadcast", icon: "📢", label: "Broadcast",  roles: ["admin", "member"] },
  { id: "report",    icon: "📊", label: "Laporan",    roles: ["admin", "member"] },
  { id: "logs",      icon: "📝", label: "Log Akses",  roles: ["admin"] },
  { id: "users",     icon: "👥", label: "Users",      roles: ["admin"] },
  { id: "settings",  icon: "⚙️", label: "Pengaturan", roles: ["admin", "member"] },
];

const PAGES = { dashboard: DashboardPage, orders: OrdersPage, products: ProductsPage, stock: StockPage, triggers: TriggersPage, broadcast: BroadcastPage, report: ReportPage, logs: LogsPage, users: UsersPage, settings: SettingsPage };

export default function App() {
  const [user,     setUser]     = useState(getUser());
  const [page,     setPage]     = useState("dashboard");
  const [mobile,   setMobile]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return <LoginPage onLogin={u => setUser(u)} />;

  const visibleNav  = NAV.filter(n => n.roles.includes(user.role));
  const PageComp    = PAGES[page] || DashboardPage;
  const curNav      = visibleNav.find(n => n.id === page);
  const SW          = collapsed ? 64 : 220;

  const logout = () => { if (window.confirm("Logout dari dashboard?")) { clearAuth(); setUser(null); } };
  const nav    = id => { setPage(id); setMobile(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", color: T.text }}>
      {/* Mobile overlay */}
      {mobile && <div onClick={() => setMobile(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40, backdropFilter: "blur(4px)" }} />}

      {/* Sidebar */}
      <aside style={{ width: SW, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, transition: "width .25s ease", overflow: "hidden" }} className={`sidebar${mobile ? " open" : ""}`}>
        {/* Logo + collapse */}
        <div style={{ padding: collapsed ? "18px 0" : "18px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", flexShrink: 0, minHeight: 64 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>APOSTLE PANEL</div>
                <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.04em" }}>DASHBOARD</div>
              </div>
            </div>
          )}
          {collapsed && <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>}
          <button onClick={() => setCollapsed(!collapsed)} className="collapse-btn" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", color: T.textMuted, fontSize: 11, padding: "3px 6px", flexShrink: 0, lineHeight: 1, marginLeft: collapsed ? 0 : 4 }}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* User badge */}
        {!collapsed ? (
          <div style={{ margin: "10px 12px 4px", padding: "10px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{user.username[0].toUpperCase()}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{user.role === "admin" ? "👑 Admin" : "👤 Member"}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}>
            <div title={user.username} style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{user.username[0].toUpperCase()}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {visibleNav.map(item => (
            <button key={item.id} onClick={() => nav(item.id)} title={collapsed ? item.label : ""} style={{ width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "11px 0" : "10px 16px", background: page === item.id ? T.accentDim : "transparent", border: "none", cursor: "pointer", color: page === item.id ? T.accent : T.textSub, fontSize: 13, fontWeight: page === item.id ? 600 : 400, textAlign: "left", borderLeft: !collapsed && page === item.id ? `2px solid ${T.accent}` : "2px solid transparent", transition: "all .15s", whiteSpace: "nowrap", fontFamily: "inherit" }}
              onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = T.card; }}
              onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: collapsed ? 18 : 15, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: collapsed ? "10px 8px" : "10px 12px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={logout} title="Logout" style={{ width: "100%", padding: collapsed ? "10px 0" : "9px 14px", background: "transparent", color: T.red, border: `1px solid ${T.red}33`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = T.redDim}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span>🚪</span>{!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: SW, display: "flex", flexDirection: "column", minHeight: "100vh", transition: "margin-left .25s ease" }} className="main-content">
        {/* Topbar */}
        <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 30 }}>
          <button onClick={() => setMobile(!mobile)} className="hamburger" style={{ display: "none", background: "none", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", fontSize: 16, padding: "4px 8px", color: T.textSub }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{curNav?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{curNav?.label}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span>
            <button onClick={logout} className="topbar-logout" style={{ display: "none", padding: "5px 12px", background: T.redDim, color: T.red, border: `1px solid ${T.red}33`, borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🚪 Logout</button>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, maxWidth: 1140, width: "100%", boxSizing: "border-box" }}>
          <PageComp currentUser={user} />
        </main>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        select option { background: ${T.surface}; color: ${T.text}; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); transition: transform .25s; }
          .sidebar.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
          .hamburger { display: flex !important; }
          .collapse-btn { display: none !important; }
          .topbar-logout { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
