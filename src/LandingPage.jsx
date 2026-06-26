import { useState, useEffect, useCallback } from "react";

// ── CONFIG (selaras dengan App.jsx) ─────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3000").replace(/\/$/, "");

// ── DESIGN TOKENS — tema cyberpunk, selaras dashboard ────────────────────
const T = {
  void:     "#0A0612",
  panel:    "#120A1F",
  surface:  "#170D28",
  card:     "#150C24",
  border:   "rgba(255,255,255,0.09)",
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

  fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
  fontBody:    "'Inter', -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
};

const idr = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);

// ── ICON SET (subset, inline SVG, tanpa emoji) ───────────────────────────
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    bot:        <svg {...c}><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.2"/><circle cx="9" cy="13" r="1.2" fill={color}/><circle cx="15" cy="13" r="1.2" fill={color}/><path d="M9 17h6"/></svg>,
    box:        <svg {...c}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>,
    layers:     <svg {...c}><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/></svg>,
    lock:       <svg {...c}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
    creditCard: <svg {...c}><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>,
    bolt:       <svg {...c}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>,
    check:      <svg {...c}><path d="M20 6L9 17l-5-5"/></svg>,
    x:          <svg {...c}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    external:   <svg {...c}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>,
    sparkle:    <svg {...c}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
    shield:     <svg {...c}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>,
    arrowRight: <svg {...c}><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>,
    clock:      <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
    refresh:    <svg {...c}><path d="M21 2v6h-6"/><path d="M3 22v-6h6"/><path d="M3.5 9a9 9 0 0115-4.7L21 8"/><path d="M20.5 15a9 9 0 01-15 4.7L3 16"/></svg>,
  };
  return paths[name] || null;
}

// ══════════════════════════════════════════════════════════════════════════
// LANDING PAGE — toko digital publik, tanpa login
// ══════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState(null);
  const [botInfo,   setBotInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/stock`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products || []);
      setError(null);
    } catch {
      setError("Tidak bisa memuat produk saat ini.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Coba ambil info bot untuk tombol "Chat Bot" — gagal diam-diam jika tidak ada akses publik
    fetch(`${API_BASE}/api/public/bot-info`).then(r => r.ok ? r.json() : null).then(d => d && setBotInfo(d)).catch(() => {});
  }, [load]);

  return (
    <div style={{ minHeight: "100vh", background: T.void, color: T.text, fontFamily: T.fontBody }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,6,18,0.92)", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.cyanDim, border: `1px solid ${T.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bot" size={16} color={T.cyan} />
            </div>
            <span style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 16 }}>ShopBot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/stock" style={{ display: "none", padding: "8px 14px", fontSize: 12.5, fontWeight: 600, color: T.textSub, textDecoration: "none" }} className="nav-stock-link">Cek Stok</a>
            <a href="/login" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: T.text, textDecoration: "none" }}>
              <Icon name="lock" size={13} /> Login Admin
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "64px 20px 56px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "-20%", left: "10%", width: 360, height: 360, background: `radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "10%", width: 320, height: 320, background: `radial-gradient(circle, rgba(255,42,156,0.12) 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", background: T.cyanDim, border: `1px solid ${T.cyan}33`, borderRadius: 20, fontSize: 11.5, fontWeight: 600, color: T.cyan, marginBottom: 22 }}>
            <Icon name="sparkle" size={12} /> TOKO PRODUK DIGITAL
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 16 }}>
            Akun premium, instan,<br />lewat <span style={{ color: T.cyan }}>Telegram</span>.
          </h1>
          <p style={{ fontSize: 15, color: T.textSub, lineHeight: 1.7, marginBottom: 28, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Order dan bayar langsung di chat bot — stok dikirim otomatis setelah pembayaran terverifikasi. Tidak perlu antri, tidak perlu nunggu admin online.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {botInfo?.url ? (
              <a href={botInfo.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", background: `linear-gradient(135deg, ${T.cyan}, #0FD9C2)`, color: "#06140F", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14, boxShadow: `0 4px 24px ${T.cyanGlow}` }}>
                <Icon name="bot" size={16} /> Mulai Order di Bot <Icon name="external" size={13} />
              </a>
            ) : (
              <a href="#produk" style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", background: `linear-gradient(135deg, ${T.cyan}, #0FD9C2)`, color: "#06140F", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14, boxShadow: `0 4px 24px ${T.cyanGlow}` }}>
                Lihat Produk <Icon name="arrowRight" size={15} />
              </a>
            )}
            <a href="/stock" style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14, color: T.text }}>
              <Icon name="layers" size={15} color={T.cyan} /> Cek Stok Real-time
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "20px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          {[
            { icon: "bolt", text: "Pengiriman Otomatis" },
            { icon: "creditCard", text: "QRIS & Virtual Account" },
            { icon: "shield", text: "Stok Update Real-time" },
            { icon: "clock", text: "Order 24 Jam" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: T.textSub }}>
              <Icon name={f.icon} size={15} color={T.violet} />
              {f.text}
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUK ── */}
      <section id="produk" style={{ padding: "52px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Produk Tersedia</h2>
          <p style={{ fontSize: 13, color: T.textSub }}>Klik produk untuk order langsung lewat bot Telegram</p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 50, color: T.textMuted }}>
            <span style={{ display: "inline-block", width: 26, height: 26, border: `3px solid ${T.border}`, borderTopColor: T.cyan, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: 30, color: T.red, fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>Belum ada produk tersedia saat ini.</div>
        )}

        {!loading && !error && products.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {products.map(p => {
              const isPreorder = p.preorder_only;
              const inStock    = p.stock_count > 0;
              const statusColor = isPreorder ? T.violet : inStock ? T.green : T.red;
              const statusBg    = isPreorder ? T.violetDim : inStock ? T.greenDim : T.redDim;
              const statusLabel = isPreorder ? "Pre-Order" : inStock ? `${p.stock_count} Tersedia` : "Stok Habis";
              const statusIcon  = isPreorder ? "layers" : inStock ? "check" : "x";
              const orderUrl    = botInfo?.username ? `https://t.me/${botInfo.username}?start=order_${p.id}` : botInfo?.url;

              return (
                <div key={p.id} style={{ background: T.card, borderRadius: 14, padding: 20, border: `1px solid ${T.border}`, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`, opacity: 0.85 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                    <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                  </div>
                  {p.description && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.5, flex: 1 }}>{p.description}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>{idr(p.price)}</div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: statusBg, color: statusColor, padding: "4px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 700, border: `1px solid ${statusColor}30`, whiteSpace: "nowrap" }}>
                      <Icon name={statusIcon} size={10} /> {statusLabel}
                    </span>
                  </div>
                  {orderUrl ? (
                    <a href={orderUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", background: T.cyanDim, border: `1px solid ${T.cyan}40`, borderRadius: 9, textDecoration: "none", fontSize: 12.5, fontWeight: 600, color: T.cyan }}>
                      <Icon name="bot" size={13} /> Order di Bot
                    </a>
                  ) : (
                    <div style={{ padding: "10px", textAlign: "center", fontSize: 12, color: T.textMuted, background: T.glass, borderRadius: 9 }}>Hubungi admin untuk order</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "28px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 12, flexWrap: "wrap" }}>
          <a href="/stock" style={{ fontSize: 12, color: T.textSub, textDecoration: "none" }}>Cek Stok</a>
          <a href="/login" style={{ fontSize: 12, color: T.textSub, textDecoration: "none" }}>Login Admin</a>
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, letterSpacing: "0.04em" }}>
          POWERED BY SHOPBOT
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        a { transition: opacity .12s, filter .12s; }
        a:hover { filter: brightness(1.1); }
        @media (min-width: 480px) { .nav-stock-link { display: flex !important; } }
      `}</style>
    </div>
  );
}
