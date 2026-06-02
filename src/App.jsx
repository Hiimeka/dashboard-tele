import { useState, useEffect, useCallback, useRef } from "react";

// ── CONFIG ──────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3000").replace(/\/$/, "");

// ── AUTH HELPERS ─────────────────────────────────────────────────
const getToken  = ()         => localStorage.getItem("shopbot_token");
const getUser   = ()         => { try { return JSON.parse(localStorage.getItem("shopbot_user")||"null"); } catch { return null; } };
const setAuth   = (t, u)     => { localStorage.setItem("shopbot_token", t); localStorage.setItem("shopbot_user", JSON.stringify(u)); };
const clearAuth = ()         => { localStorage.removeItem("shopbot_token"); localStorage.removeItem("shopbot_user"); };

// ── API HELPER ───────────────────────────────────────────────────
const api = async (path, method = "GET", body = null) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) { clearAuth(); window.location.reload(); throw new Error("Session expired"); }
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || `HTTP ${res.status}`); }
  return res.json();
};

const formatIDR = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n||0);
const timeAgo = (ts) => {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s<60) return `${s}d lalu`;
  if (s<3600) return `${Math.floor(s/60)}m lalu`;
  if (s<86400) return `${Math.floor(s/3600)}j lalu`;
  return new Date(ts).toLocaleDateString("id-ID");
};

// ── TOAST ────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type="success") => {
    const id = Date.now()+Math.random();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  };
  return { toasts, toast:{ success:m=>add(m,"success"), error:m=>add(m,"error"), info:m=>add(m,"info") }};
}

function ToastContainer({toasts}) {
  if (!toasts.length) return null;
  const C = { success:{bg:"#D1FAE5",border:"#6EE7B7",text:"#065F46",icon:"✅"}, error:{bg:"#FEE2E2",border:"#FCA5A5",text:"#991B1B",icon:"❌"}, info:{bg:"#DBEAFE",border:"#93C5FD",text:"#1E40AF",icon:"ℹ️"} };
  return (
    <div style={{position:"fixed",top:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
      {toasts.map(t=>{const c=C[t.type]||C.info;return(
        <div key={t.id} style={{background:c.bg,border:`1px solid ${c.border}`,color:c.text,padding:"12px 16px",borderRadius:10,fontSize:13,fontWeight:600,maxWidth:320,boxShadow:"0 4px 12px rgba(0,0,0,0.12)",display:"flex",gap:8,alignItems:"center",animation:"slideIn 0.2s ease"}}>
          <span>{c.icon}</span><span>{t.msg}</span>
        </div>
      );})}
    </div>
  );
}

// ── REUSABLE ─────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:  {bg:"#FEF3C7",text:"#92400E",label:"Menunggu"},
  delivered:{bg:"#D1FAE5",text:"#065F46",label:"Terkirim"},
  cancelled:{bg:"#FEE2E2",text:"#991B1B",label:"Dibatalkan"},
  preorder: {bg:"#EDE9FE",text:"#5B21B6",label:"Pre-Order"},
};
function Badge({status}){const s=STATUS_COLORS[status]||{bg:"#F3F4F6",text:"#374151",label:status};return <span style={{background:s.bg,color:s.text,padding:"2px 10px",borderRadius:12,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{s.label}</span>;}
function Card({children,style={}}){return <div style={{background:"#fff",borderRadius:16,padding:24,border:"1px solid #F1F5F9",...style}}>{children}</div>;}
function Btn({onClick,children,color="#6366F1",disabled=false,full=false,style={}}){return <button onClick={onClick} disabled={disabled} style={{padding:"10px 20px",background:disabled?"#94A3B8":color,color:"#fff",border:"none",borderRadius:8,cursor:disabled?"default":"pointer",fontWeight:600,fontSize:13,width:full?"100%":"auto",transition:"opacity 0.15s",...style}}>{children}</button>;}
function Input({label,value,onChange,placeholder,type="text",required=false}){return(<div style={{marginBottom:12}}>{label&&<label style={{fontSize:12,color:"#64748B",display:"block",marginBottom:5,fontWeight:500}}>{label}{required&&<span style={{color:"#EF4444"}}> *</span>}</label>}<input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none"}}/></div>);}
function StatCard({icon,label,value,color="#6366F1"}){return(<div style={{background:"#fff",borderRadius:16,padding:"20px 24px",border:"1px solid #F1F5F9",display:"flex",gap:16,alignItems:"center"}}><div style={{width:48,height:48,borderRadius:12,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div><div><div style={{fontSize:13,color:"#94A3B8",marginBottom:2}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:"#0F172A"}}>{value}</div></div></div>);}
function MiniChart({data}){if(!data||data.length<2)return null;const max=Math.max(...data.map(d=>d.revenue),1);const w=400,h=80,pad=6;const pts=data.map((d,i)=>{const x=pad+(i/(data.length-1))*(w-pad*2);const y=h-pad-(d.revenue/max)*(h-pad*2);return`${x},${y}`;});return(<svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:70}}><polyline points={pts.join(" ")} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{data.map((d,i)=>{const x=pad+(i/(data.length-1))*(w-pad*2);const y=h-pad-(d.revenue/max)*(h-pad*2);return<circle key={i} cx={x} cy={y} r="3.5" fill="#6366F1"/>;})}</svg>);}

// ══════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════
function LoginPage({onLogin}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const login = async () => {
    if (!username||!password) return setError("Username dan password wajib diisi");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({username,password})
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error||"Login gagal");
      setAuth(data.token, data.user);
      onLogin(data.user);
    } catch { setError("Tidak bisa konek ke server. Cek VITE_API_BASE."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#1E1B4B 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:8}}>🤖</div>
          <div style={{fontSize:22,fontWeight:800,color:"#1E1B4B"}}>ShopBot</div>
          <div style={{fontSize:13,color:"#94A3B8",marginTop:4}}>Admin Dashboard</div>
        </div>
        {error && <div style={{background:"#FEE2E2",color:"#991B1B",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16,border:"1px solid #FCA5A5"}}>{error}</div>}
        <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" required />
        <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
        <div style={{marginTop:4}}>
          <Btn onClick={login} disabled={loading} full color="#6366F1">{loading?"⏳ Masuk...":"Masuk"}</Btn>
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#94A3B8"}}>Default: admin / admin123</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════
function DashboardPage() {
  const [stats,  setStats]  = useState(null);
  const [chart,  setChart]  = useState([]);
  const [orders, setOrders] = useState([]);
  const [err,    setErr]    = useState(null);

  useEffect(()=>{
    Promise.all([api("/api/stats"),api("/api/revenue?days=7"),api("/api/orders?status=pending")])
      .then(([s,c,o])=>{setStats(s);setChart(c);setOrders(o);})
      .catch(e=>setErr(e.message));
  },[]);

  if (err) return <div style={{padding:20,background:"#FEE2E2",borderRadius:12,color:"#991B1B",fontSize:14}}>❌ {err}</div>;
  if (!stats) return <div style={{padding:40,textAlign:"center",color:"#94A3B8"}}>⏳ Memuat...</div>;

  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:20}}>Dashboard</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:20}}>
        <StatCard icon="💰" label="Pendapatan Hari Ini" value={formatIDR(stats.revenue_today)} color="#10B981"/>
        <StatCard icon="📦" label="Terjual Hari Ini"    value={stats.sold_today??0}             color="#6366F1"/>
        <StatCard icon="⏳" label="Order Pending"       value={stats.pending_orders??0}         color="#F59E0B"/>
        <StatCard icon="👤" label="Total User"          value={stats.total_users??0}            color="#3B82F6"/>
        <StatCard icon="📋" label="Pre-Order"           value={stats.preorders??0}              color="#8B5CF6"/>
        <StatCard icon="📦" label="Stok Tersisa"        value={stats.total_stock??0}            color="#06B6D4"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:10}}>📈 Pendapatan 7 Hari</div>
          <MiniChart data={chart}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>{chart.map(d=><div key={d.date} style={{fontSize:10,color:"#94A3B8"}}>{d.date?.slice(5)}</div>)}</div>
        </Card>
        <Card>
          <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:10}}>⏳ Pending ({orders.length})</div>
          {orders.length===0
            ?<div style={{color:"#94A3B8",fontSize:13,textAlign:"center",padding:20}}>Tidak ada order pending 🎉</div>
            :orders.slice(0,5).map(o=>(
              <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #F8FAFC"}}>
                <div><div style={{fontSize:13,fontWeight:500}}>{o.product_name}</div><div style={{fontSize:11,color:"#94A3B8"}}>@{o.username}</div></div>
                <div style={{fontSize:13,fontWeight:600,color:"#10B981"}}>{formatIDR(o.price)}</div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ORDERS PAGE
// ══════════════════════════════════════════════════════════════════
function OrdersPage() {
  const {toasts,toast} = useToast();
  const [orders,setOrders]=useState([]);
  const [filter,setFilter]=useState("all");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(null);

  const load=useCallback(()=>{
    setLoading(true);
    api(`/api/orders${filter==="all"?"":"?status="+filter}`)
      .then(setOrders).catch(e=>toast.error(e.message)).finally(()=>setLoading(false));
  },[filter]);
  useEffect(()=>{load();},[load]);

  const confirm=async(id)=>{setBusy(id+"c");try{await api(`/api/orders/${id}/confirm`,"PUT");toast.success("✅ Order dikonfirmasi!");load();}catch(e){toast.error(e.message);}setBusy(null);};
  const reject=async(id)=>{if(!confirm("Batalkan?"))return;setBusy(id+"r");try{await api(`/api/orders/${id}/reject`,"PUT");toast.success("Order dibatalkan.");load();}catch(e){toast.error(e.message);}setBusy(null);};

  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:18}}>Pesanan</h1>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["all","pending","delivered","cancelled","preorder"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 16px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:13,fontWeight:500,background:filter===f?"#6366F1":"#fff",color:filter===f?"#fff":"#64748B",borderColor:filter===f?"#6366F1":"#E2E8F0"}}>
            {{all:"Semua",pending:"Menunggu",delivered:"Terkirim",cancelled:"Dibatalkan",preorder:"Pre-Order"}[f]}
          </button>
        ))}
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#F8FAFC"}}>{["Order ID","User","Produk","Harga","Status","Tanggal","Aksi"].map(h=><th key={h} style={{padding:"12px 14px",textAlign:"left",fontWeight:600,color:"#64748B",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {loading?<tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#94A3B8"}}>⏳</td></tr>
              :orders.length===0?<tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#94A3B8"}}>Tidak ada pesanan</td></tr>
              :orders.map(o=>(
                <tr key={o.id} style={{borderTop:"1px solid #F1F5F9"}}>
                  <td style={{padding:"11px 14px",fontFamily:"monospace",fontWeight:600,color:"#6366F1",fontSize:12}}>{o.id}</td>
                  <td style={{padding:"11px 14px"}}>@{o.username}</td>
                  <td style={{padding:"11px 14px",fontWeight:500}}>{o.product_name}</td>
                  <td style={{padding:"11px 14px",color:"#10B981",fontWeight:600}}>{formatIDR(o.price)}</td>
                  <td style={{padding:"11px 14px"}}><Badge status={o.status}/></td>
                  <td style={{padding:"11px 14px",color:"#94A3B8",whiteSpace:"nowrap"}}>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                  <td style={{padding:"11px 14px"}}>
                    {o.status==="pending"&&<div style={{display:"flex",gap:6}}>
                      <button onClick={()=>confirm(o.id)} disabled={!!busy} style={{padding:"5px 12px",background:"#10B981",color:"#fff",border:"none",borderRadius:7,cursor:busy?"default":"pointer",fontSize:12,fontWeight:600,opacity:busy?0.7:1}}>{busy===o.id+"c"?"⏳":"✓ Konfirmasi"}</button>
                      <button onClick={()=>reject(o.id)} disabled={!!busy} style={{padding:"5px 12px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:7,cursor:busy?"default":"pointer",fontSize:12,fontWeight:600,opacity:busy?0.7:1}}>{busy===o.id+"r"?"⏳":"✕ Tolak"}</button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ══════════════════════════════════════════════════════════════════
function ProductsPage() {
  const {toasts,toast}=useToast();
  const [products,setProducts]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:"",price:"",description:"",preorder_only:false});
  const f=k=>e=>setForm({...form,[k]:e.target.value});

  const load=()=>api("/api/products").then(setProducts).catch(e=>toast.error(e.message));
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!form.name.trim())return toast.error("Nama wajib!");
    if(!form.price)return toast.error("Harga wajib!");
    setSaving(true);
    try{
      await api("/api/products","POST",{name:form.name.trim(),price:parseInt(String(form.price).replace(/\D/g,"")),description:form.description.trim(),preorder_only:form.preorder_only});
      toast.success(`Produk "${form.name}" ditambahkan!`);
      setForm({name:"",price:"",description:"",preorder_only:false});setShowForm(false);load();
    }catch(e){toast.error(e.message);}
    setSaving(false);
  };
  const del=async(id,name)=>{if(!window.confirm(`Hapus "${name}"?`))return;try{await api(`/api/products/${id}`,"DELETE");toast.success("Dihapus.");load();}catch(e){toast.error(e.message);}};

  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A"}}>Produk</h1>
        <Btn onClick={()=>setShowForm(!showForm)}>+ Tambah Produk</Btn>
      </div>
      {showForm&&<Card style={{marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>Produk Baru</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Nama Produk" required value={form.name} onChange={f("name")} placeholder="Netflix Premium"/>
          <Input label="Harga (IDR)" required value={form.price} onChange={f("price")} placeholder="50000"/>
          <div style={{gridColumn:"1/-1"}}><Input label="Deskripsi" value={form.description} onChange={f("description")} placeholder="Deskripsi..."/></div>
          <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" id="po" checked={form.preorder_only} onChange={e=>setForm({...form,preorder_only:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
            <label htmlFor="po" style={{fontSize:13,cursor:"pointer"}}>Pre-Order Only</label>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <Btn onClick={save} color="#10B981" disabled={saving}>{saving?"⏳ Menyimpan...":"Simpan"}</Btn>
          <Btn onClick={()=>setShowForm(false)} color="#94A3B8">Batal</Btn>
        </div>
      </Card>}
      {products.length===0
        ?<Card><div style={{textAlign:"center",color:"#94A3B8",padding:30}}>Belum ada produk.</div></Card>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
          {products.map(p=>(
            <Card key={p.id} style={{padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div style={{fontSize:15,fontWeight:600,color:"#0F172A"}}>{p.name}</div>
                {p.preorder_only&&<span style={{background:"#EDE9FE",color:"#7C3AED",fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:600}}>PRE-ORDER</span>}
              </div>
              {p.description&&<div style={{fontSize:12,color:"#94A3B8",marginBottom:8}}>{p.description}</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:17,fontWeight:700,color:"#10B981"}}>{formatIDR(p.price)}</div>
                <div style={{fontSize:12,color:"#64748B"}}>Stok: <strong style={{color:p.stock_count>0?"#10B981":"#EF4444"}}>{p.stock_count}</strong></div>
              </div>
              {p.created_by&&<div style={{fontSize:11,color:"#94A3B8",marginBottom:8}}>Dibuat oleh: {p.created_by}</div>}
              <button onClick={()=>del(p.id,p.name)} style={{width:"100%",padding:"7px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>Hapus</button>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STOCK PAGE
// ══════════════════════════════════════════════════════════════════
function StockPage() {
  const {toasts,toast}=useToast();
  const [products,setProducts]=useState([]);
  const [allStock,setAllStock]=useState([]);
  const [sel,setSel]=useState("");
  const [input,setInput]=useState("");
  const [filter,setFilter]=useState("available");
  const [adding,setAdding]=useState(false);

  const load=useCallback(()=>{api("/api/products").then(setProducts).catch(console.error);api("/api/stock").then(setAllStock).catch(console.error);},[]);
  useEffect(()=>{load();},[load]);

  const addStock=async()=>{
    if(!sel)return toast.error("Pilih produk!");
    if(!input.trim())return toast.error("Isi data stok!");
    const items=input.split("\n").map(s=>s.trim()).filter(Boolean);
    if(!items.length)return toast.error("Tidak ada item valid!");
    setAdding(true);
    try{
      await api("/api/stock","POST",{product_id:sel,items});
      toast.success(`✅ ${items.length} item ditambahkan!`);
      setInput("");load();
    }catch(e){toast.error(e.message);}
    setAdding(false);
  };
  const del=async(id)=>{try{await api(`/api/stock/${id}`,"DELETE");toast.success("Dihapus.");load();}catch(e){toast.error(e.message);}};
  const filtered=allStock.filter(s=>filter==="all"?true:filter==="available"?!s.sold:s.sold);
  const getProd=id=>products.find(p=>p.id===id)?.name||id;

  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:18}}>Manajemen Stok</h1>
      <Card style={{marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>+ Tambah Stok</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,alignItems:"flex-start"}}>
          <div>
            <label style={{fontSize:12,color:"#64748B",display:"block",marginBottom:5,fontWeight:500}}>Produk <span style={{color:"#EF4444"}}>*</span></label>
            <select value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:14,background:"#fff",cursor:"pointer"}}>
              <option value="">-- Pilih --</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:12,color:"#64748B",display:"block",marginBottom:5,fontWeight:500}}>Data Stok (1 per baris) <span style={{color:"#EF4444"}}>*</span></label>
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={"email1@gmail.com:password1\nemail2@gmail.com:password2"} rows={5} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:13,fontFamily:"monospace",boxSizing:"border-box",resize:"vertical"}}/>
            <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>{input?`${input.split("\n").filter(s=>s.trim()).length} item`:"Kosong"}</div>
          </div>
        </div>
        <div style={{marginTop:14}}><Btn onClick={addStock} disabled={adding}>{adding?"⏳ Menambahkan...":"+ Tambah Stok"}</Btn></div>
      </Card>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{flex:1,fontSize:14,fontWeight:600,color:"#0F172A"}}>Stok ({filtered.length})</span>
          {["available","sold","all"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:16,border:"1px solid",fontSize:12,cursor:"pointer",background:filter===f?"#6366F1":"#fff",color:filter===f?"#fff":"#64748B",borderColor:filter===f?"#6366F1":"#E2E8F0"}}>
              {f==="available"?"Tersedia":f==="sold"?"Terjual":"Semua"}
            </button>
          ))}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#F8FAFC"}}>{["Produk","Data","Status","Ditambahkan","Aksi"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,color:"#64748B"}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={5} style={{textAlign:"center",padding:40,color:"#94A3B8"}}>Tidak ada stok</td></tr>
              :filtered.slice(0,100).map(s=>(
                <tr key={s.id} style={{borderTop:"1px solid #F1F5F9"}}>
                  <td style={{padding:"10px 14px",fontWeight:500}}>{getProd(s.product_id)}</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",fontSize:12,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sold?<span style={{color:"#94A3B8"}}>●●●●●●●●</span>:s.data}</td>
                  <td style={{padding:"10px 14px"}}><span style={{background:s.sold?"#FEE2E2":"#D1FAE5",color:s.sold?"#991B1B":"#065F46",padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>{s.sold?"Terjual":"Tersedia"}</span></td>
                  <td style={{padding:"10px 14px",color:"#94A3B8"}}>{new Date(s.added_at).toLocaleDateString("id-ID")}</td>
                  <td style={{padding:"10px 14px"}}>{!s.sold&&<button onClick={()=>del(s.id)} style={{padding:"3px 10px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>Hapus</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TRIGGERS PAGE
// ══════════════════════════════════════════════════════════════════
function TriggersPage() {
  const {toasts,toast}=useToast();
  const [triggers,setTriggers]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({trigger:"",response:""});
  const load=()=>api("/api/triggers").then(setTriggers).catch(e=>toast.error(e.message));
  useEffect(()=>{load();},[]);
  const save=async()=>{
    if(!form.trigger.trim())return toast.error("Trigger wajib!");
    if(!form.response.trim())return toast.error("Balasan wajib!");
    setSaving(true);
    try{await api("/api/triggers","POST",{trigger:form.trigger.trim(),response:form.response.trim()});toast.success("Trigger ditambahkan!");setForm({trigger:"",response:""});setShowForm(false);load();}
    catch(e){toast.error(e.message);}
    setSaving(false);
  };
  const del=async(t)=>{if(!window.confirm(`Hapus "${t}"?`))return;try{await api(`/api/triggers/${encodeURIComponent(t)}`,"DELETE");toast.success("Dihapus.");load();}catch(e){toast.error(e.message);}};
  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A"}}>Trigger & Command</h1>
        <Btn onClick={()=>setShowForm(!showForm)}>+ Tambah</Btn>
      </div>
      <div style={{background:"#F0FDF4",borderRadius:10,padding:"12px 16px",marginBottom:18,border:"1px solid #BBF7D0",fontSize:12,color:"#16A34A",lineHeight:1.7}}>
        💡 Foto ke trigger: Kirim foto di Telegram dengan caption <code>/settriggerpic /perintah</code><br/>
        💳 QR QRIS: Kirim foto di Telegram dengan caption <code>/setpay Teks info</code>
      </div>
      {showForm&&<Card style={{marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>Trigger Baru</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
          <Input label="Kata Trigger" required value={form.trigger} onChange={e=>setForm({...form,trigger:e.target.value})} placeholder="/pay atau /info"/>
          <div>
            <label style={{fontSize:12,color:"#64748B",display:"block",marginBottom:5,fontWeight:500}}>Teks Balasan <span style={{color:"#EF4444"}}>*</span></label>
            <textarea value={form.response} onChange={e=>setForm({...form,response:e.target.value})} rows={4} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:13,boxSizing:"border-box",resize:"vertical"}} placeholder="Teks balasan bot..."/>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <Btn onClick={save} color="#10B981" disabled={saving}>{saving?"⏳":"Simpan"}</Btn>
          <Btn onClick={()=>setShowForm(false)} color="#94A3B8">Batal</Btn>
        </div>
      </Card>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {triggers.length===0?<Card><div style={{textAlign:"center",color:"#94A3B8",padding:30}}>Belum ada trigger.</div></Card>
        :triggers.map(t=>(
          <div key={t.trigger} style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid #F1F5F9",display:"flex",alignItems:"flex-start",gap:14}}>
            <div style={{background:"#EEF2FF",borderRadius:8,padding:"5px 12px",fontSize:13,fontFamily:"monospace",fontWeight:600,color:"#6366F1",whiteSpace:"nowrap",flexShrink:0}}>{t.trigger}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{t.response?.substring(0,120)||"(kosong)"}{t.response?.length>120?"...":""}</div>
              <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                {t.photo_file_id&&<span style={{fontSize:11,background:"#EDE9FE",color:"#7C3AED",padding:"2px 8px",borderRadius:10}}>🖼 Ada Foto</span>}
                {t.created_by&&<span style={{fontSize:11,background:"#F1F5F9",color:"#64748B",padding:"2px 8px",borderRadius:10}}>oleh {t.created_by}</span>}
              </div>
            </div>
            <button onClick={()=>del(t.trigger)} style={{padding:"4px 12px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BROADCAST PAGE
// ══════════════════════════════════════════════════════════════════
function BroadcastPage() {
  const {toasts,toast}=useToast();
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [users,setUsers]=useState([]);
  useEffect(()=>{api("/api/users").then(setUsers).catch(console.error);},[]);
  const send=async()=>{
    if(!message.trim())return toast.error("Pesan kosong!");
    if(!window.confirm(`Kirim ke ${users.length} user?`))return;
    setLoading(true);setResult(null);
    try{const r=await api("/api/broadcast","POST",{message});setResult(r);toast.success(`Terkirim ke ${r.sent} user!`);setMessage("");}
    catch(e){toast.error(e.message);}
    setLoading(false);
  };
  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:18}}>Broadcast</h1>
      <div style={{background:"#FFF7ED",borderRadius:10,padding:"12px 16px",marginBottom:18,border:"1px solid #FED7AA",fontSize:12,color:"#C2410C"}}>⚠️ Akan dikirim ke <strong>{users.length} user</strong>.</div>
      <Card>
        <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:8}}>Pesan</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6} placeholder="Tulis pesan..." style={{width:"100%",padding:"12px",border:"1px solid #E2E8F0",borderRadius:10,fontSize:14,lineHeight:1.6,boxSizing:"border-box",resize:"vertical"}}/>
        {message&&<div style={{background:"#F8FAFC",borderRadius:8,padding:"12px 14px",margin:"12px 0",fontSize:13,lineHeight:1.6,border:"1px solid #E2E8F0"}}><div style={{fontSize:11,color:"#94A3B8",marginBottom:4,fontWeight:600}}>PREVIEW:</div>📢 <strong>Pengumuman</strong><br/><br/>{message}</div>}
        <Btn onClick={send} disabled={loading} color="#EF4444">{loading?"⏳ Mengirim...":`📢 Kirim ke ${users.length} User`}</Btn>
        {result&&<div style={{marginTop:14,padding:14,background:"#D1FAE5",borderRadius:10,fontSize:13,color:"#065F46"}}>✅ <strong>{result.sent}</strong> berhasil, <strong>{result.failed}</strong> gagal.</div>}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// REPORT PAGE
// ══════════════════════════════════════════════════════════════════
function ReportPage() {
  const [report,setReport]=useState(null);
  const [chart,setChart]=useState([]);
  useEffect(()=>{api("/api/report/daily").then(setReport).catch(console.error);api("/api/revenue?days=30").then(setChart).catch(console.error);},[]);
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:18}}>Laporan</h1>
      {report&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:20}}>
        <StatCard icon="💰" label="Pendapatan"  value={formatIDR(report.revenue)} color="#10B981"/>
        <StatCard icon="📦" label="Terjual"     value={report.sold}               color="#6366F1"/>
        <StatCard icon="🆕" label="Order Baru"  value={report.new_orders}         color="#3B82F6"/>
        <StatCard icon="❌" label="Dibatalkan"  value={report.cancelled}          color="#EF4444"/>
        <StatCard icon="📋" label="Pre-Order"   value={report.preorders}          color="#8B5CF6"/>
      </div>}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:12}}>📈 30 Hari Terakhir</div>
        <MiniChart data={chart}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>{chart.filter((_,i)=>i%6===0).map(d=><div key={d.date} style={{fontSize:10,color:"#94A3B8"}}>{d.date?.slice(5)}</div>)}</div>
      </Card>
      {report?.top_products?.length>0&&<Card>
        <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:14}}>🏆 Produk Terlaris</div>
        {report.top_products.map((p,i)=>(
          <div key={p.name} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F8FAFC"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:26,height:26,borderRadius:6,background:["#FEF3C7","#DBEAFE","#D1FAE5"][i]||"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{i+1}</div>
              <span style={{fontWeight:500}}>{p.name}</span>
            </div>
            <span style={{fontWeight:700,color:"#6366F1"}}>{p.count}x</span>
          </div>
        ))}
      </Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ACCESS LOG PAGE
// ══════════════════════════════════════════════════════════════════
const ACTION_STYLES = {
  LOGIN:          {bg:"#DBEAFE",text:"#1E40AF",icon:"🔑"},
  ADD_PRODUCT:    {bg:"#D1FAE5",text:"#065F46",icon:"➕"},
  DELETE_PRODUCT: {bg:"#FEE2E2",text:"#991B1B",icon:"🗑"},
  EDIT_PRODUCT:   {bg:"#FEF3C7",text:"#92400E",icon:"✏️"},
  ADD_STOCK:      {bg:"#D1FAE5",text:"#065F46",icon:"📦"},
  DELETE_STOCK:   {bg:"#FEE2E2",text:"#991B1B",icon:"🗑"},
  CONFIRM_ORDER:  {bg:"#D1FAE5",text:"#065F46",icon:"✅"},
  REJECT_ORDER:   {bg:"#FEE2E2",text:"#991B1B",icon:"❌"},
  ADD_TRIGGER:    {bg:"#EDE9FE",text:"#5B21B6",icon:"⚡"},
  DELETE_TRIGGER: {bg:"#FEE2E2",text:"#991B1B",icon:"🗑"},
  BROADCAST:      {bg:"#FEF3C7",text:"#92400E",icon:"📢"},
  CREATE_USER:    {bg:"#DBEAFE",text:"#1E40AF",icon:"👤"},
  EDIT_USER:      {bg:"#FEF3C7",text:"#92400E",icon:"✏️"},
  DELETE_USER:    {bg:"#FEE2E2",text:"#991B1B",icon:"🗑"},
  EDIT_PAYMENT:   {bg:"#EDE9FE",text:"#5B21B6",icon:"💳"},
  EDIT_SETTINGS:  {bg:"#F1F5F9",text:"#374151",icon:"⚙️"},
};

function LogsPage() {
  const [logs,setLogs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("ALL");

  useEffect(()=>{
    setLoading(true);
    api("/api/logs?limit=200").then(setLogs).catch(console.error).finally(()=>setLoading(false));
  },[]);

  const filtered = filter==="ALL" ? logs : logs.filter(l=>l.action===filter);
  const actions  = ["ALL",...new Set(logs.map(l=>l.action))];

  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:18}}>Log Akses</h1>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {actions.slice(0,8).map(a=>(
          <button key={a} onClick={()=>setFilter(a)} style={{padding:"5px 12px",borderRadius:16,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:500,background:filter===a?"#6366F1":"#fff",color:filter===a?"#fff":"#64748B",borderColor:filter===a?"#6366F1":"#E2E8F0"}}>
            {a==="ALL"?"Semua":(ACTION_STYLES[a]?.icon||"")+" "+a}
          </button>
        ))}
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#F8FAFC"}}>{["Waktu","User","Aksi","Detail"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontWeight:600,color:"#64748B"}}>{h}</th>)}</tr></thead>
            <tbody>
              {loading?<tr><td colSpan={4} style={{textAlign:"center",padding:40,color:"#94A3B8"}}>⏳</td></tr>
              :filtered.length===0?<tr><td colSpan={4} style={{textAlign:"center",padding:40,color:"#94A3B8"}}>Tidak ada log</td></tr>
              :filtered.map(l=>{const s=ACTION_STYLES[l.action]||{bg:"#F1F5F9",text:"#374151",icon:"📌"};return(
                <tr key={l.id} style={{borderTop:"1px solid #F1F5F9"}}>
                  <td style={{padding:"10px 14px",color:"#94A3B8",whiteSpace:"nowrap",fontSize:12}}>{timeAgo(l.timestamp)}</td>
                  <td style={{padding:"10px 14px",fontWeight:600,color:"#374151"}}>{l.username}</td>
                  <td style={{padding:"10px 14px"}}><span style={{background:s.bg,color:s.text,padding:"3px 10px",borderRadius:10,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{s.icon} {l.action}</span></td>
                  <td style={{padding:"10px 14px",color:"#374151",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.detail}</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// USER MANAGEMENT PAGE (Admin only)
// ══════════════════════════════════════════════════════════════════
function UsersPage({currentUser}) {
  const {toasts,toast}=useToast();
  const [users,setUsers]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({username:"",password:"",role:"member"});
  const f=k=>e=>setForm({...form,[k]:e.target.value});

  const load=()=>api("/api/dashboard-users").then(setUsers).catch(e=>toast.error(e.message));
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!form.username.trim())return toast.error("Username wajib!");
    if(!editId&&!form.password)return toast.error("Password wajib untuk user baru!");
    setSaving(true);
    try{
      if(editId){
        const upd={role:form.role};
        if(form.password)upd.password=form.password;
        await api(`/api/dashboard-users/${editId}`,"PUT",upd);
        toast.success("User diupdate!");
      }else{
        await api("/api/dashboard-users","POST",form);
        toast.success(`User "${form.username}" dibuat!`);
      }
      setForm({username:"",password:"",role:"member"});setShowForm(false);setEditId(null);load();
    }catch(e){toast.error(e.message);}
    setSaving(false);
  };

  const del=async(id,uname)=>{
    if(!window.confirm(`Hapus user "${uname}"?`))return;
    try{await api(`/api/dashboard-users/${id}`,"DELETE");toast.success("User dihapus.");load();}
    catch(e){toast.error(e.message);}
  };

  const startEdit=(u)=>{setEditId(u.id);setForm({username:u.username,password:"",role:u.role});setShowForm(true);};

  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A"}}>User Dashboard</h1>
        <Btn onClick={()=>{setShowForm(!showForm);setEditId(null);setForm({username:"",password:"",role:"member"});}}>+ Tambah User</Btn>
      </div>
      {showForm&&<Card style={{marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>{editId?"Edit User":"User Baru"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Input label="Username" required value={form.username} onChange={f("username")} placeholder="johndoe"/>
          <Input label={editId?"Password Baru (kosong=tidak ubah)":"Password"} type="password" required={!editId} value={form.password} onChange={f("password")} placeholder="••••••••"/>
          <div>
            <label style={{fontSize:12,color:"#64748B",display:"block",marginBottom:5,fontWeight:500}}>Role</label>
            <select value={form.role} onChange={f("role")} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:14,background:"#fff",cursor:"pointer"}}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div style={{marginTop:4,padding:"10px 14px",background:"#F8FAFC",borderRadius:8,fontSize:12,color:"#64748B",marginBottom:12}}>
          <strong>Admin:</strong> Bisa akses semua fitur + kelola user + lihat log<br/>
          <strong>Member:</strong> Bisa kelola produk, stok, order, trigger, broadcast
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={save} color="#10B981" disabled={saving}>{saving?"⏳ Menyimpan...":"Simpan"}</Btn>
          <Btn onClick={()=>{setShowForm(false);setEditId(null);}} color="#94A3B8">Batal</Btn>
        </div>
      </Card>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
        {users.map(u=>(
          <Card key={u.id} style={{padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:"#0F172A"}}>{u.username}</div>
                {u.id===getUser()?.id&&<span style={{fontSize:10,color:"#6366F1",fontWeight:600}}>(Anda)</span>}
              </div>
              <span style={{background:u.role==="admin"?"#EDE9FE":"#DBEAFE",color:u.role==="admin"?"#7C3AED":"#1E40AF",fontSize:11,padding:"3px 10px",borderRadius:10,fontWeight:700}}>
                {u.role==="admin"?"👑 Admin":"👤 Member"}
              </span>
            </div>
            <div style={{fontSize:12,color:"#94A3B8",marginBottom:4}}>Dibuat: {new Date(u.created_at).toLocaleDateString("id-ID")}</div>
            <div style={{fontSize:12,color:"#94A3B8",marginBottom:4}}>Oleh: {u.created_by}</div>
            <div style={{fontSize:12,color:"#94A3B8",marginBottom:12}}>Login terakhir: {u.last_login?timeAgo(u.last_login):"Belum pernah"}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>startEdit(u)} style={{flex:1,padding:"7px",background:"#EEF2FF",color:"#6366F1",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600}}>Edit</button>
              {u.id!==getUser()?.id&&<button onClick={()=>del(u.id,u.username)} style={{flex:1,padding:"7px",background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600}}>Hapus</button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════
function SettingsPage({currentUser}) {
  const {toasts,toast}=useToast();
  const [settings,setSettings]=useState({auto_order:false});
  const [payment,setPayment]=useState(null);
  const [payText,setPayText]=useState("");
  const [saving,setSaving]=useState(false);
  const [connStatus,setConnStatus]=useState(null);
  const [connLoading,setConnLoading]=useState(false);
  const [pwForm,setPwForm]=useState({old:"",new_:"",confirm:""});
  const [pwSaving,setPwSaving]=useState(false);

  const testConn=async()=>{setConnLoading(true);setConnStatus(null);try{await api("/api/stats");setConnStatus("ok");}catch(e){setConnStatus(e.message.includes("FORBIDDEN")?"forbidden":e.message.includes("Session")?"expired":"error");}setConnLoading(false);};
  useEffect(()=>{api("/api/settings").then(setSettings).catch(console.error);api("/api/payment").then(p=>{setPayment(p);if(p?.text)setPayText(p.text);}).catch(console.error);testConn();},[]);

  const saveSettings=async()=>{setSaving(true);try{await api("/api/settings","PUT",settings);toast.success("Pengaturan disimpan!");}catch(e){toast.error(e.message);}setSaving(false);};
  const savePayment=async()=>{try{await api("/api/payment","PUT",{text:payText});toast.success("Info pembayaran disimpan!");}catch(e){toast.error(e.message);}};
  const changePw=async()=>{
    if(!pwForm.old||!pwForm.new_)return toast.error("Semua field wajib!");
    if(pwForm.new_!==pwForm.confirm)return toast.error("Password baru tidak cocok!");
    if(pwForm.new_.length<6)return toast.error("Password minimal 6 karakter!");
    setPwSaving(true);
    try{await api(`/api/dashboard-users/${currentUser.id}`,"PUT",{password:pwForm.new_});toast.success("Password berhasil diubah!");setPwForm({old:"",new_:"",confirm:""});}
    catch(e){toast.error(e.message);}
    setPwSaving(false);
  };

  const CI={ok:{bg:"#D1FAE5",border:"#6EE7B7",text:"#065F46",msg:"✅ Terhubung"},error:{bg:"#FEE2E2",border:"#FCA5A5",text:"#991B1B",msg:"❌ Tidak bisa terhubung"}};

  return (
    <div>
      <ToastContainer toasts={toasts}/>
      <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:18}}>Pengaturan</h1>
      <div style={{display:"grid",gap:18}}>
        <Card>
          <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>🔌 Status Koneksi</div>
          <div style={{padding:"12px 16px",borderRadius:10,border:"1px solid",background:connStatus?CI[connStatus]?.bg||"#FEF3C7":"#F8FAFC",borderColor:connStatus?CI[connStatus]?.border||"#FCD34D":"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:connStatus?CI[connStatus]?.text||"#92400E":"#64748B"}}>{connLoading?"⏳ Mengecek...":connStatus?CI[connStatus]?.msg||"⚠️ Error":"Belum dicek"}</span>
            <button onClick={testConn} disabled={connLoading} style={{padding:"5px 14px",background:"#6366F1",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Test</button>
          </div>
          <div style={{fontSize:12,color:"#94A3B8"}}>API: <code style={{color:"#374151"}}>{API_BASE}</code></div>
        </Card>

        <Card>
          <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>🔒 Ganti Password</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Input label="Password Lama" type="password" value={pwForm.old} onChange={e=>setPwForm({...pwForm,old:e.target.value})} placeholder="••••••••"/>
            <Input label="Password Baru" type="password" value={pwForm.new_} onChange={e=>setPwForm({...pwForm,new_:e.target.value})} placeholder="Min 6 karakter"/>
            <Input label="Konfirmasi Baru" type="password" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} placeholder="Ulangi password"/>
          </div>
          <Btn onClick={changePw} color="#6366F1" disabled={pwSaving}>{pwSaving?"⏳ Menyimpan...":"Ganti Password"}</Btn>
        </Card>

        {currentUser.role==="admin"&&<Card>
          <div style={{fontSize:15,fontWeight:600,marginBottom:14}}>⚙️ Bot Settings</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #F8FAFC",marginBottom:14}}>
            <div><div style={{fontSize:14,fontWeight:500}}>Auto-Order</div><div style={{fontSize:12,color:"#94A3B8"}}>Kirim stok otomatis setelah dikonfirmasi</div></div>
            <div onClick={()=>setSettings({...settings,auto_order:!settings.auto_order})} style={{width:44,height:24,borderRadius:12,background:settings.auto_order?"#6366F1":"#E2E8F0",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:settings.auto_order?23:3,transition:"left 0.2s"}}/>
            </div>
          </div>
          <Btn onClick={saveSettings} color="#6366F1" disabled={saving}>{saving?"⏳ Menyimpan...":"Simpan"}</Btn>
        </Card>}

        <Card>
          <div style={{fontSize:15,fontWeight:600,marginBottom:10}}>💳 Info Pembayaran & QR QRIS</div>
          <div style={{background:"#EFF6FF",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:12,color:"#1D4ED8",lineHeight:1.7}}>
            Upload QR QRIS: Kirim foto di Telegram dengan caption <code>/setpay [teks]</code>
          </div>
          <label style={{fontSize:12,color:"#64748B",display:"block",marginBottom:6,fontWeight:500}}>Teks Info Pembayaran</label>
          <textarea value={payText} onChange={e=>setPayText(e.target.value)} rows={5} placeholder={"Transfer ke BCA 1234567890\na.n Nama Toko"} style={{width:"100%",padding:"10px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:13,boxSizing:"border-box",resize:"vertical"}}/>
          {payment?.photo_file_id&&<div style={{marginTop:6,fontSize:12,color:"#10B981"}}>✅ Foto QR sudah diset via Telegram</div>}
          <div style={{marginTop:12}}><Btn onClick={savePayment} color="#10B981">Simpan Info Pembayaran</Btn></div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  {id:"dashboard",icon:"🏠",label:"Dashboard",roles:["admin","member"]},
  {id:"orders",   icon:"📋",label:"Pesanan",  roles:["admin","member"]},
  {id:"products", icon:"🛍️",label:"Produk",   roles:["admin","member"]},
  {id:"stock",    icon:"📦",label:"Stok",     roles:["admin","member"]},
  {id:"triggers", icon:"⚡",label:"Triggers", roles:["admin","member"]},
  {id:"broadcast",icon:"📢",label:"Broadcast",roles:["admin","member"]},
  {id:"report",   icon:"📊",label:"Laporan",  roles:["admin","member"]},
  {id:"logs",     icon:"📝",label:"Log Akses",roles:["admin"]},
  {id:"users",    icon:"👥",label:"Users",    roles:["admin"]},
  {id:"settings", icon:"⚙️",label:"Pengaturan",roles:["admin","member"]},
];

export default function App() {
  const [user,    setUser]    = useState(getUser());
  const [page,    setPage]    = useState("dashboard");
  const [sidebar, setSidebar] = useState(false);

  if (!user) return <LoginPage onLogin={u=>{setUser(u);}}/>;

  const PAGES = {dashboard:DashboardPage,orders:OrdersPage,products:ProductsPage,stock:StockPage,triggers:TriggersPage,broadcast:BroadcastPage,report:ReportPage,logs:LogsPage,users:UsersPage,settings:SettingsPage};
  const visibleNav = NAV_ITEMS.filter(n=>n.roles.includes(user.role));
  const PageComp   = PAGES[page] || DashboardPage;
  const curNav     = visibleNav.find(n=>n.id===page);

  const logout=()=>{clearAuth();setUser(null);};
  const nav=(id)=>{setPage(id);setSidebar(false);};

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#F8FAFC",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      {sidebar&&<div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:40}}/>}

      <aside style={{width:220,background:"#1E1B4B",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",zIndex:50}} className={`sidebar${sidebar?" open":""}`}>
        <div style={{padding:"22px 18px 14px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
          <div style={{color:"#fff",fontSize:17,fontWeight:800}}>🤖 ShopBot</div>
          <div style={{color:"#A5B4FC",fontSize:11,marginTop:2}}>Admin Dashboard</div>
        </div>
        <div style={{padding:"12px 16px",background:"rgba(99,102,241,0.2)",margin:"10px 12px",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#6366F1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{user.username[0].toUpperCase()}</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{user.username}</div>
            <div style={{fontSize:11,color:"#A5B4FC"}}>{user.role==="admin"?"👑 Admin":"👤 Member"}</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
          {visibleNav.map(item=>(
            <button key={item.id} onClick={()=>nav(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 18px",background:page===item.id?"rgba(99,102,241,0.3)":"transparent",border:"none",cursor:"pointer",color:page===item.id?"#C7D2FE":"#94A3B8",fontSize:14,fontWeight:page===item.id?600:400,textAlign:"left",borderLeft:page===item.id?"3px solid #6366F1":"3px solid transparent",transition:"all 0.15s"}}>
              <span style={{fontSize:16}}>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={logout} style={{width:"100%",padding:"9px",background:"rgba(239,68,68,0.2)",color:"#FCA5A5",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>🚪 Logout</button>
        </div>
      </aside>

      <div style={{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}} className="main-content">
        <header style={{background:"#fff",borderBottom:"1px solid #F1F5F9",padding:"13px 24px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:30}}>
          <button onClick={()=>setSidebar(!sidebar)} className="hamburger" style={{display:"none",background:"none",border:"none",cursor:"pointer",fontSize:22,padding:2,color:"#374151"}}>☰</button>
          <div style={{fontSize:14,fontWeight:600,color:"#64748B"}}>{curNav?.icon} {curNav?.label}</div>
          <div style={{marginLeft:"auto",fontSize:12,color:"#94A3B8"}}>{new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}</div>
        </header>
        <main style={{flex:1,padding:24,maxWidth:1100,width:"100%",boxSizing:"border-box"}}>
          <PageComp currentUser={user}/>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;} body{margin:0;}
        input:focus,textarea:focus,select:focus{outline:2px solid #6366F1;border-color:#6366F1!important;}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%);transition:transform 0.25s;}
          .sidebar.open{transform:translateX(0)!important;}
          .main-content{margin-left:0!important;}
          .hamburger{display:block!important;}
        }
      `}</style>
    </div>
  );
}
