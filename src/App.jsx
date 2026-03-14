import { useState, useEffect } from 'react'
import { initFirebase, getDB } from './lib/firebase'
import { ToastProvider } from './hooks/useToast'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Inventario from './components/Inventario'
import Ventas from './components/Ventas'
import Historial from './components/Historial'
import Proveedores from './components/Proveedores'
import Compras from './components/Compras'
import Config from './components/Config'

function AppContent() {
  const [page, setPage] = useState('config')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fb_config')
    if (saved) {
      try {
        initFirebase(JSON.parse(saved))
        setConnected(true)
        setPage('dashboard')
      } catch (e) {
        setPage('config')
      }
    }
  }, [])

  function navigate(p) {
    setPage(p)
  }

  function handleConnected(ok = true) {
    setConnected(ok)
    setPage(ok ? 'dashboard' : 'config')
  }

  const pages = {
    dashboard: <Dashboard onNavigate={navigate} />,
    inventario: <Inventario />,
    ventas: <Ventas onNavigate={navigate} />,
    historial: <Historial />,
    proveedores: <Proveedores />,
    compras: <Compras />,
    config: <Config onConnected={handleConnected} />,
  }

  return (
    <div className="app">
      <Sidebar page={page} onNavigate={navigate} connected={connected} />
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
