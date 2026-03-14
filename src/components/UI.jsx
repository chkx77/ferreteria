import { useState, createContext, useContext, useCallback } from 'react'

// ── Toast context ────────────────────────────────────────
const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((msg, dur = 3000) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className="t-dot" />
          {t.msg}
        </div>
      ))}
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

// ── Modal ────────────────────────────────────────────────
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

// ── Field / Input / Select ───────────────────────────────
export function Field({ label, children }) {
  return <div className="form-group"><label>{label}</label>{children}</div>
}
export function Input({ label, ...props }) {
  if (!label) return <input {...props} />
  return <Field label={label}><input {...props} /></Field>
}
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
  return label ? <Field label={label}>{el}</Field> : el
}

// ── StatCard ─────────────────────────────────────────────
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

// ── Badge ────────────────────────────────────────────────
export function Badge({ variant = 'ok', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

// ── Spinner / Empty ──────────────────────────────────────
export function Spinner() {
  return (
    <div className="empty">
      <div className="spinner" />
      <div style={{ marginTop: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 11 }}>Cargando…</div>
    </div>
  )
}
export function Empty({ msg = 'Sin resultados' }) {
  return <div className="empty">{msg}</div>
}

// ── SearchBox ────────────────────────────────────────────
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

// ── useConfirm ───────────────────────────────────────────
export function useConfirm() {
  const [state, setState] = useState(null)
  const confirm = msg => new Promise(resolve => setState({ msg, resolve }))
  const dialog = state ? (
    <div className="modal-backdrop" onClick={() => { state.resolve(false); setState(null) }}>
      <div className="modal" style={{ width: 380 }} onClick={e => e.stopPropagation()}>
        <p>{state.msg}</p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { state.resolve(false); setState(null) }}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => { state.resolve(true); setState(null) }}>Confirmar</button>
        </div>
      </div>
    </div>
  ) : null
  return { confirm, dialog }
}
