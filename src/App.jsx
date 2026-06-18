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

// ── PROFESSIONAL IT THEME PALETTE ─────────────────────────────────────────
const T = {
  bg: "#0B0F19",                 // Deep Enterprise Dark Blue
  surface: "#111827",            // Solid Card Base
  surfaceLight: "#1F2937",       // Input & Border Highlight
  border: "rgba(192, 192, 170, 0.15)", // Metallic Silver subtle line
  text: "#F8FAFC",               // Crisp White
  textMuted: "#94A3B8",          // Cool Grey
  
  // Gradient Colors Requested
  primary: "#1cefff",            // Electric Cyan
  secondary: "#c0c0aa",          // Metallic Silver
  gradient: "linear-gradient(135deg, #1cefff 0%, #c0c0aa 100%)",
  
  // Status Colors
  green: "#10B981",
  greenDim: "rgba(16, 185, 129, 0.1)",
  red: "#EF4444",
  redDim: "rgba(239, 68, 68, 0.1)",
  blue: "#3B82F6",
  blueDim: "rgba(59, 130, 246, 0.1)"
};

export default function App() {
  const [user, setUser] = useState(getUser);
  const [token, setToken] = useState(getToken);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const login = (t, u) => { setAuth(t, u); setToken(t); setUser(u); };
  const logout = () => { clearAuth(); setToken(null); setUser(null); };

  if (!token) return <LoginPage onLogin={login} />;

  const pages = {
    dashboard: () => <DashboardPage />,
    products: () => <ProductsPage />,
    transactions: () => <TransactionsPage />,
    settings: () => <SettingsPage currentUser={user} />
  };
  const PageComp = pages[activeTab] || (() => <div>Not Found</div>);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.text }}>
      
      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{
        width: 260,
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        boxShadow: "4px 0 24px rgba(0,0,0,0.25)"
      }}>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", justifyContent: "between", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: T.gradient, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#000" }}>🚀</div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.5px", background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IT ENTERPRISE</h1>
              <p style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>MANAGEMENT CONSOLE</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ display: "none", background: "none", border: "none", color: T.text, fontSize: 20, cursor: "pointer" }} className="sidebar-close-btn">×</button>
        </div>

        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { id: "dashboard", label: "📊 System Dashboard" },
            { id: "products", label: "📦 Infrastructure Items" },
            { id: "transactions", label: "💸 Node Transactions" },
            { id: "settings", label: "⚙️ Console Settings" }
          ].map(m => {
            const act = activeTab === m.id;
            return (
              <button key={m.id} onClick={() => { setActiveTab(m.id); setSidebarOpen(false); }} style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                background: act ? "rgba(28, 239, 255, 0.08)" : "transparent",
                color: act ? T.primary : T.textMuted,
                border: act ? `1px solid rgba(28, 239, 255, 0.25)` : "1px solid transparent",
                textAlign: "left",
                fontSize: 13,
                fontWeight: act ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }} className="nav-link-btn">
                {m.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 20, borderTop: `1px solid ${T.border}`, background: "rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.surfaceLight, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user?.username || "Operator"}</div>
              <div style={{ fontSize: 10, color: T.green, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, background: T.green, borderRadius: "50%" }}></span>Secured Link</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "10px", background: T.redDim, color: T.red, border: `1px solid rgba(239, 68, 68, 0.2)`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }} className="logout-btn">Terminate Session</button>
        </div>
      </aside>

      {/* ── MAIN CONTAINER ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column", minWidth: 0 }} className="main-content">
        <header style={{
          height: 64,
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 90
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ display: "none", background: "none", border: "none", color: T.text, fontSize: 22, marginRight: 12, cursor: "pointer" }} className="sidebar-toggle-btn">☰</button>
          <h2 style={{ fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>{activeTab} Overview</h2>
          
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: T.textMuted, background: T.surfaceLight, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}` }}>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, padding: 32, maxWidth: 1200, width: "100%", boxSizing: "border-box", margin: "0 auto" }}>
          <PageComp currentUser={user} />
        </main>
      </div>

      {/* ── STYLE GLOBAL UTILITIES ────────────────────────────────────────── */}
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .nav-link-btn:hover { background: rgba(192, 192, 170, 0.05) !important; color: ${T.text} !important; }
        .logout-btn:hover { background: ${T.red} !important; color: #fff !important; }
        select option { background: ${T.surface}; color: ${T.text}; }
        
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); transition: transform .25s ease-in-out; }
          .sidebar.open { transform: translateX(0); }
          .sidebar-close-btn { display: block !important; }
          .sidebar-toggle-btn { display: block !important; }
          .main-content { marginLeft: 0 !important; }
        }
      `}</style>
    </div>
  );
}

// ── SUB-PAGES PLACEHOLDER (MENJAGA AGAR FUNGSIONALITAS TETAP JALAN) ────────
function DashboardPage() { return <div style={{ animation: "slideIn 0.3s" }}><Card title="Status Real-time">Konten dashboard...</Card></div>; }
function ProductsPage() { return <div style={{ animation: "slideIn 0.3s" }}><Card title="Daftar Infrastruktur">Konten produk...</Card></div>; }
function TransactionsPage() { return <div style={{ animation: "slideIn 0.3s" }}><Card title="Log Aktivitas Finansial">Konten transaksi...</Card></div>; }
function SettingsPage({ currentUser }) { return <div style={{ animation: "slideIn 0.3s" }}><Card title="Konfigurasi Server">Pengaturan pengguna: {currentUser?.username}</Card></div>; }
function LoginPage({ onLogin }) { return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: T.bg }}><button onClick={() => onLogin("mock_token", { username: "admin" })} style={{ padding: "12px 24px", background: T.gradient, border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Buka Dashboard Console</button></div>; }

// ── COMPONENT REUSABLE CARD KORPORAT ───────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: T.secondary, letterSpacing: "0.3px", borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>{title}</h3>
      {children}
    </div>
  );
}