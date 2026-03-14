const PAGES = [
  { section: 'Principal' },
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
  },
  { section: 'Ventas' },
  {
    id: 'ventas', label: 'Nueva Factura',
    icon: <svg viewBox="0 0 16 16" fill="none"><path d="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 2.5V1.5M10.5 2.5V1.5M2 6.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 9.5h6M5 11.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  },
  {
    id: 'historial', label: 'Historial',
    icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  { section: 'Stock' },
  {
    id: 'inventario', label: 'Inventario',
    icon: <svg viewBox="0 0 16 16" fill="none"><path d="M2 5.5l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 13.5v-5h4v5" stroke="currentColor" strokeWidth="1.3"/></svg>
  },
  {
    id: 'compras', label: 'Compras',
    icon: <svg viewBox="0 0 16 16" fill="none"><path d="M1.5 2h2l2 7h7l1.5-4.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="12.5" r="1" fill="currentColor"/><circle cx="12" cy="12.5" r="1" fill="currentColor"/></svg>
  },
  { section: 'Contactos' },
  {
    id: 'proveedores', label: 'Proveedores',
    icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13.5c0-3.04 2.462-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  },
  { section: 'Sistema' },
  {
    id: 'config', label: 'Firebase',
    icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.07 1.07M11.53 11.53l1.07 1.07M12.6 3.4l-1.07 1.07M4.47 11.53l-1.07 1.07" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  },
]

export default function Sidebar({ page, onNavigate, connected }) {
  return (
    <aside>
      <div className="sidebar-logo">
        <div className="brand">Sistema de gestión</div>
        <div className="name">
          Ferretería<br />
          <em>PRO</em>
        </div>
        <div className="tagline">v2.0 · gestión integral</div>
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
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
                  {p.icon.props.children}
                </svg>
                {p.label}
              </div>
            )
        )}
      </nav>

      <div className="sidebar-footer">
        <span
          className="db-dot"
          style={{ background: connected ? '#1a9e6a' : '#e5424a' }}
        />
        {connected ? 'Conectado a Firebase' : 'Sin conexión'}
        <br />
        {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </aside>
  )
}
