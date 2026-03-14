import { useState, useEffect } from 'react'
import { initFirebase } from './lib/firebase'
import { ToastProvider } from './components/UI'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Inventario from './components/Inventario'
import Ventas from './components/Ventas'
import Historial from './components/Historial'
import Proveedores from './components/Proveedores'
import Compras from './components/Compras'
import Config from './components/Config'
import Estadisticas from './components/Estadisticas'

function AppContent() {
  const [page, setPage] = useState('config')
  const [connected, setConnected] = useState(false)
  const [sucursal, setSucursal] = useState(() => localStorage.getItem('sucursal') || 'Casa Central')

  useEffect(() => {
    const saved = localStorage.getItem('fb_config')
    if (saved) {
      try { initFirebase(JSON.parse(saved)); setConnected(true); setPage('dashboard') }
      catch { setPage('config') }
    }
  }, [])

  function navigate(p) { setPage(p) }

  function handleConnected(ok = true) {
    setConnected(ok)
    setPage(ok ? 'dashboard' : 'config')
  }

  function handleSucursal(s) {
    setSucursal(s)
    localStorage.setItem('sucursal', s)
  }

  const pages = {
    dashboard:    <Dashboard onNavigate={navigate} sucursal={sucursal} />,
    estadisticas: <Estadisticas sucursal={sucursal} />,
    inventario:   <Inventario sucursal={sucursal} />,
    ventas:       <Ventas onNavigate={navigate} sucursal={sucursal} />,
    historial:    <Historial sucursal={sucursal} />,
    proveedores:  <Proveedores />,
    compras:      <Compras sucursal={sucursal} />,
    config:       <Config onConnected={handleConnected} />,
  }

  return (
    <div className="app">
      <Sidebar
        page={page}
        onNavigate={navigate}
        connected={connected}
        sucursal={sucursal}
        onSucursal={handleSucursal}
      />
      <main>{pages[page] || pages.dashboard}</main>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
