import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LandingPage from './LandingPage.jsx'
import StockCheckPage from './StockCheckPage.jsx'

// Routing sederhana tanpa library tambahan:
// - /            -> landing page toko (publik, tanpa login)
// - /stock       -> halaman publik cek stok real-time
// - /login       -> form login dashboard admin (ditangani App.jsx)
// - /dashboard   -> dashboard admin, navigasi antar menu pakai state internal (App.jsx)
const path = window.location.pathname.replace(/\/+$/, '') || '/'

function Root() {
  if (path === '/') return <LandingPage />
  if (path === '/stock') return <StockCheckPage />
  // /login, /dashboard, dan path lainnya ditangani App.jsx (auto-redirect sesuai status login)
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
