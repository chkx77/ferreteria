import { SUCURSALES } from '../lib/utils'

const PAGES = [
  { section: 'Principal' },
  { id: 'dashboard',    label: 'Dashboard',      icon: 'grid' },
  { id: 'estadisticas', label: 'Estadísticas',   icon: 'chart' },
  { section: 'Ventas' },
  { id: 'ventas',       label: 'Nueva Factura',  icon: 'receipt' },
  { id: 'historial',    label: 'Historial',      icon: 'clock' },
  { section: 'Stock' },
  { id: 'inventario',   label: 'Inventario',     icon: 'box' },
  { id: 'compras',      label: 'Compras',        icon: 'cart' },
  { section: 'Contactos' },
  { id: 'proveedores',  label: 'Proveedores',    icon: 'user' },
  { section: 'Sistema' },
  { id: 'config',       label: 'Firebase',       icon: 'settings' },
]

const icons = {
  grid:     <><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/></>,
  chart:    <><path d="M2 12V6l3 3 3-4 3 2 3-5v10H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/></>,
  receipt:  <><path d="M3 2h10v12l-2-1.5-2 1.5-2-1.5L5 14 3 14V2z" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M6 6h4M6 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>,
  clock:    <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>,
  box:      <><path d="M2 5.5l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M6 13.5v-4h4v4" stroke="currentColor" strokeWidth="1.3"/></>,
  cart:     <><path d="M1.5 2h2l2 7h7l1.5-4.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/><circle cx="7" cy="12.5" r="1" fill="currentColor"/><circle cx="12" cy="12.5" r="1" fill="currentColor"/></>,
  user:     <><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/></>,
  settings: <><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.07 1.07M11.53 11.53l1.07 1.07M12.6 3.4l-1.07 1.07M4.47 11.53l-1.07 1.07" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>,
}

export default function Sidebar({ page, onNavigate, connected, sucursal, onSucursal }) {
  return (
    <aside>
      <div className="sidebar-logo">
        <div className="brand">Gestión integral</div>
        <div className="name">
          <span className="logo-icon">FP</span>
          Ferretería PRO
        </div>
        <select
          className="sucursal-select"
          value={sucursal}
          onChange={e => onSucursal(e.target.value)}
          title="Sucursal activa"
        >
          {SUCURSALES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <nav>
        {PAGES.map((p, i) =>
          p.section
            ? <div key={i} className="nav-section">{p.section}</div>
            : (
              <div
                key={p.id}
                className={`nav-item${page === p.id ? ' active' : ''}`}
                onClick={() => onNavigate(p.id)}
              >
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none">{icons[p.icon]}</svg>
                {p.label}
              </div>
            )
        )}
      </nav>

      <div className="sidebar-footer">
        <span className={`db-indicator ${connected ? 'on' : 'off'}`}>
          {connected ? 'Firebase conectado' : 'Sin conexión'}
        </span>
        <br />
        {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </aside>
  )
}
