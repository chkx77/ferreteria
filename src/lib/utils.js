export const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)

export const fmtInt = (n) =>
  new Intl.NumberFormat('es-AR').format(Math.round(n || 0))

export const fmtDate = (ts, long = false) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (long) return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  return d.toLocaleDateString('es-AR')
}

export const newNum = (prefix) => `${prefix}-${String(Date.now()).slice(-7)}`

export const CATS = [
  'Herramientas manuales', 'Herramientas eléctricas', 'Fijaciones',
  'Plomería', 'Electricidad', 'Pintura', 'Maderas', 'Adhesivos', 'Seguridad', 'Otros',
]

export const UNIDADES = ['unidad', 'metro', 'kg', 'litro', 'par', 'caja', 'rollo', 'bolsa']
export const COND_PAGO = ['Contado', '15 días', '30 días', '60 días', '90 días', 'A convenir']
