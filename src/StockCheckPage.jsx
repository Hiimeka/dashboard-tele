import { useState, useEffect, useCallback } from "react";

// ── CONFIG (sama dengan App.jsx) ────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3000").replace(/\/$/, "");

// ── DESIGN TOKENS — selaras tema cyberpunk dashboard ─────────────────────
const T = {
  void:     "#0A0612",
  card:     "#150C24",
  border:   "rgba(255,255,255,0.09)",

  cyan:     "#00F0FF",
  cyanDim:  "rgba(0,240,255,0.13)",
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

  fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
  fontBody:    "'Inter', -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

const idr = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);

// ── ICON (subset kecil, inline SVG, tanpa emoji) ─────────────────────────
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    box:     <svg {...c}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>,
    refresh: <svg {...c}><path d="M21 2v6h-6"/><path d="M3 22v-6h6"/><path d="M3.5 9a9 9 0 0115-4.7L21 8"/><path d="M20.5 15a9 9 0 01-15 4.7L3 16"/></svg>,
    check:   <svg {...c}><path d="M20 6L9 17l-5-5"/></svg>,
    x:       <svg {...c}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    layers:  <svg {...c}><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/></svg>,
    bot:     <svg {...c}><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.2"/><circle cx="9" cy="13" r="1.2" fill={color}/><circle cx="15" cy="13" r="1.2" fill={color}/><path d="M9 17h6"/></svg>,
    alertCircle: <svg {...c}><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>,
    clock:   <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  };
  return paths[name] || null;
}

// ══════════════════════════════════════════════════════════════════════════
// STOCK CHECK PAGE — halaman publik, tanpa login, auto-refresh
// ══════════════════════════════════════════════════════════════════════════
export default function StockCheckPage() {
  const [products, setProducts]   = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/stock`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data.products || []);
      setUpdatedAt(data.updated_at);
      setError(null);
    } catch (e) {
      setError("Tidak bisa memuat data stok. Coba lagi sebentar.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Load awal + auto-refresh tiap 15 detik (real-time tanpa perlu reload manual)
  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div style={{ minHeight: "100vh", background: T.void, color: T.text, fontFamily: T.fontBody, padding: "32px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: T.cyanDim, border: `1px solid ${T.cyan}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Icon name="bot" size={24} color={T.cyan} />
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>Cek Stok Real-time</h1>
          <p style={{ fontSize: 13, color: T.textSub }}>Data ter-update otomatis setiap 15 detik</p>
        </div>

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, padding: "10px 16px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 11.5, color: T.textMuted, fontFamily: T.fontMono, display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="clock" size={13} />
            {updatedAt ? `Update: ${new Date(updatedAt).toLocaleTimeString("id-ID")}` : "Memuat..."}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}40`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: refreshing ? "default" : "pointer", fontFamily: "inherit" }}
          >
            <span style={{ display: "inline-flex", animation: refreshing ? "spin .8s linear infinite" : "none" }}>
              <Icon name="refresh" size={13} />
            </span>
            Refresh
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: 16, background: T.redDim, border: `1px solid ${T.red}40`, borderRadius: 10, color: T.red, fontSize: 13, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alertCircle" size={17} /> {error}
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
            <span style={{ display: "inline-block", width: 28, height: 28, border: `3px solid ${T.border}`, borderTopColor: T.cyan, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <div style={{ marginTop: 14, fontSize: 13 }}>Memuat data stok...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
            <Icon name="box" size={32} color={T.textMuted} strokeWidth={1.4} />
            <div style={{ marginTop: 14, fontSize: 13 }}>Belum ada produk tersedia saat ini.</div>
          </div>
        )}

        {/* Product list */}
        {!loading && !error && products.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map(p => {
              const isAvailable = p.preorder_only || p.stock_count > 0;
              const statusColor = p.preorder_only ? T.violet : p.stock_count > 0 ? T.green : T.red;
              const statusBg    = p.preorder_only ? T.violetDim : p.stock_count > 0 ? T.greenDim : T.redDim;
              const statusLabel = p.preorder_only ? "Pre-Order" : p.stock_count > 0 ? `${p.stock_count} Tersedia` : "Stok Habis";
              const statusIcon  = p.preorder_only ? "layers" : p.stock_count > 0 ? "check" : "x";

              return (
                <div key={p.id} style={{ background: T.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`, opacity: 0.8 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: T.fontDisplay, marginBottom: 4 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, lineHeight: 1.5 }}>{p.description}</div>}
                      <div style={{ fontSize: 17, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>{idr(p.price)}</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: statusBg, color: statusColor, padding: "5px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, border: `1px solid ${statusColor}30`, whiteSpace: "nowrap", flexShrink: 0 }}>
                      <Icon name={statusIcon} size={11} /> {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, letterSpacing: "0.04em" }}>
          POWERED BY SHOPBOT &nbsp;·&nbsp; HALAMAN PUBLIK
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
