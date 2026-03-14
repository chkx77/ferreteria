const PAGES = [
  { section: 'Principal' },
  { id: 'dashboard', label: 'Dashboard', icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { section: 'Ventas' },
  { id: 'ventas', label: 'Nueva Factura', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M3 3h10v9H3z" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3V2m4 1V2M3 7h10" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { id: 'historial', label: 'Historial', icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { section: 'Stock' },
  { id: 'inventario', label: 'Inventario', icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 9h4M8 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id: 'compras', label: 'Compras', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M2 2h1.5l2 8h7l1.5-5H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="13" r="1" fill="currentColor"/><circle cx="12" cy="13" r="1" fill="currentColor"/></svg> },
  { section: 'Contactos' },
  { id: 'proveedores', label: 'Proveedores', icon: <svg viewBox="0 0 16 16" fill="none"><path d="M2 13V7l6-4 6 4v6H2z" stroke="currentColor" strokeWidth="1.2"/><path d="M6 13V9h4v4" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { section: 'Sistema' },
  { id: 'config', label: 'Firebase', icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.9 2.9l1.1 1.1M12 12l1.1 1.1M13.1 2.9L12 4M4 12l-1.1 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
]

export default function Sidebar({ page, onNavigate, connected }) {
  return (
    <aside>
      <div className="sidebar-logo">
        <div className="brand">Sistema de gestión</div>
        <div className="name">FERRETERÍA<br /><span>PRO</span></div>
      </div>
      <nav>
        {PAGES.map((p, i) =>
          p.section
            ? <div key={i} className="nav-section">{p.section}</div>
            : (
              <div key={p.id} className={`nav-item${page === p.id ? ' active' : ''}`} onClick={() => onNavigate(p.id)}>
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none">{p.icon.props.children}</svg>
                {p.label}
              </div>
            )
        )}
      </nav>
      <div className="sidebar-footer">
        v2.0 · FERRETERÍA PRO<br />
        <span style={{ color: connected ? 'var(--success)' : 'var(--danger)' }}>
          {connected ? '● Conectado' : '● Sin conexión'}
        </span>
      </div>
    </aside>
  )
}
