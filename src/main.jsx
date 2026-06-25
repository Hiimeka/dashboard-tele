import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import StockCheckPage from './StockCheckPage.jsx'

// Routing sederhana tanpa library tambahan:
// - /stock          -> halaman publik cek stok (tanpa login)
// - lainnya (/, dst) -> dashboard admin (App.jsx, butuh login)
const path = window.location.pathname.replace(/\/+$/, '')
const isPublicStockPage = path === '/stock'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPublicStockPage ? <StockCheckPage /> : <App />}
  </React.StrictMode>
)
