import { useState } from 'react'

// ── MODAL ──────────────────────────────────────
export function Modal({ title, wide, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target.classList.contains('modal-backdrop') && onClose()}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        {title && <h2>{title}</h2>}
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── FORM FIELD ────────────────────────────────
export function Field({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  )
}

// ── INPUT ─────────────────────────────────────
export function Input({ label, ...props }) {
  if (!label) return <input {...props} />
  return <Field label={label}><input {...props} /></Field>
}

// ── SELECT ────────────────────────────────────
export function Select({ label, options, ...props }) {
  const el = (
    <select {...props}>
      {options.map(o =>
        typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  )
  if (!label) return el
  return <Field label={label}>{el}</Field>
}

// ── STAT CARD ─────────────────────────────────
export function StatCard({ label, value, sub, trend, color }) {
  return (
    <div className="stat-card">
      <div className="s-label">{label}</div>
      <div className="s-val" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="s-sub">{sub}</div>}
      {trend && <div className={`s-trend ${trend.up ? 'trend-up' : 'trend-dn'}`}>{trend.label}</div>}
    </div>
  )
}

// ── BADGE ─────────────────────────────────────
export function Badge({ variant = 'ok', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

// ── SPINNER ───────────────────────────────────
export function Spinner() {
  return <div className="empty"><div className="spinner" /><div style={{ marginTop: 12 }}>Cargando…</div></div>
}

// ── EMPTY STATE ───────────────────────────────
export function Empty({ msg = 'Sin resultados' }) {
  return <div className="empty">{msg}</div>
}

// ── SEARCH BOX ────────────────────────────────
export function SearchBox({ value, onChange, placeholder = 'Buscar…' }) {
  return (
    <div className="search-box">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="var(--muted)" strokeWidth="1.2" />
        <path d="M11 11l3 3" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus />
    </div>
  )
}

// ── CONFIRM DIALOG (inline) ───────────────────
export function useConfirm() {
  const [state, setState] = useState(null)
  const confirm = (msg) => new Promise(resolve => setState({ msg, resolve }))
  const dialog = state ? (
    <div className="modal-backdrop" onClick={() => { state.resolve(false); setState(null) }}>
      <div className="modal" style={{ width: 360 }} onClick={e => e.stopPropagation()}>
        <p style={{ marginBottom: 20, lineHeight: 1.6 }}>{state.msg}</p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { state.resolve(false); setState(null) }}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => { state.resolve(true); setState(null) }}>Confirmar</button>
        </div>
      </div>
    </div>
  ) : null
  return { confirm, dialog }
}
