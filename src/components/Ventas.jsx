import { useEffect, useRef, useState, useCallback } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useToast } from '../hooks/useToast'
import { fmt, newNum, fmtDate } from '../lib/utils'
import { imprimirFactura } from '../lib/print'

// ── Barcode scanner hook ──────────────────────────────────
function useBarcodeScanner(onCode) {
  const buf = useRef('')
  const timer = useRef(null)

  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName?.toLowerCase()
      const isScanInput = document.activeElement?.dataset?.scanner === 'true'
      if ((tag === 'input' || tag === 'textarea' || tag === 'select') && !isScanInput) return

      if (e.key === 'Enter') {
        if (buf.current.length >= 2) { onCode(buf.current.trim()) }
        buf.current = ''; clearTimeout(timer.current)
        return
      }
      if (e.key.length === 1) {
        buf.current += e.key
        clearTimeout(timer.current)
        timer.current = setTimeout(() => { buf.current = '' }, 100)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(timer.current) }
  }, [onCode])
}

// ── Qty controls ──────────────────────────────────────────
function QtyCtrl({ qty, onInc, onDec }) {
  return (
    <div className="qty-ctrl">
      <button className="btn btn-ghost btn-xs" onClick={onDec} style={{ padding: '1px 8px', fontSize: 15, lineHeight: 1 }}>−</button>
      <span className="qty-val">{qty}</span>
      <button className="btn btn-ghost btn-xs" onClick={onInc} style={{ padding: '1px 8px', fontSize: 15, lineHeight: 1 }}>+</button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function Ventas({ onNavigate }) {
  const { load, confirmarVentaDB } = useFirestore()
  const toast = useToast()
  const [inventario, setInventario] = useState([])
  const [items, setItems] = useState([])
  const [cliente, setCliente] = useState({ nombre: '', dni: '' })
  const [descuento, setDescuento] = useState(0)
  const [scanFlash, setScanFlash] = useState('') // '' | 'ok' | 'err'
  const [flashRows, setFlashRows] = useState({})
  const [nro] = useState(() => newNum('F'))
  const scanRef = useRef()

  useEffect(() => {
    load('inventario').then(setInventario)
    scanRef.current?.focus()
  }, [load])

  // ── Scanner logic ──
  const handleCode = useCallback((codigo) => {
    const prod = inventario.find(p => p.codigo?.trim() === codigo.trim())
    if (!prod) {
      setScanFlash('err'); setTimeout(() => setScanFlash(''), 600)
      toast(`Código "${codigo}" no encontrado`)
      return
    }
    setItems(prev => {
      const existing = prev.find(i => i.id === prod.id)
      const yaQty = existing?.cantidad || 0
      if (yaQty >= (prod.stock || 0)) {
        toast(`Stock insuficiente de "${prod.nombre}"`); return prev
      }
      setScanFlash('ok'); setTimeout(() => setScanFlash(''), 600)
      setFlashRows(r => { const n = { ...r, [prod.id]: Date.now() }; return n })
      if (existing) {
        return prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1, total: (i.cantidad + 1) * i.precio } : i)
      }
      return [...prev, { id: prod.id, nombre: prod.nombre, unidad: prod.unidad || 'unidad', cantidad: 1, precio: prod.precio_venta || 0, total: prod.precio_venta || 0 }]
    })
    if (scanRef.current) {
      scanRef.current.value = ''
      scanRef.current.placeholder = `✓ ${prod.nombre}`
      setTimeout(() => { if (scanRef.current) scanRef.current.placeholder = 'Escanear o escribir código…' }, 1500)
    }
  }, [inventario, toast])

  useBarcodeScanner(handleCode)

  function handleScanInput(e) {
    if (e.key === 'Enter') {
      const v = e.target.value.trim()
      if (v) { handleCode(v); e.target.value = '' }
    }
  }

  // ── Item controls ──
  function cambiar(id, delta) {
    const prod = inventario.find(p => p.id === id)
    setItems(prev => prev.reduce((acc, it) => {
      if (it.id !== id) return [...acc, it]
      const qty = it.cantidad + delta
      if (qty < 1) return acc // elimina
      if (prod && qty > (prod.stock || 0)) { toast(`Stock máx: ${prod.stock}`); return [...acc, it] }
      return [...acc, { ...it, cantidad: qty, total: qty * it.precio }]
    }, []))
  }

  // ── Totals ──
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const descAmt = subtotal * (descuento / 100)
  const base = subtotal - descAmt
  const iva = base * 0.21
  const total = base + iva

  // ── Confirm ──
  async function confirmar() {
    if (!items.length) return
    const factura = { numero: nro, cliente, items, subtotal, descuento: descAmt, iva, total }
    try {
      await confirmarVentaDB(factura, items)
      toast(`Venta confirmada · ${nro} ✓`)
      imprimirFactura({ ...factura, fecha: { toDate: () => new Date() } })
      onNavigate('historial')
    } catch (e) { toast('Error: ' + e.message) }
  }

  // ── Selector manual ──
  const [selProd, setSelProd] = useState('')
  const [selQty, setSelQty] = useState(1)
  const [selPrecio, setSelPrecio] = useState('')

  function agregarDesdeSelector() {
    const prod = inventario.find(p => p.id === selProd)
    if (!prod) { toast('Seleccioná un producto'); return }
    const precio = +selPrecio || prod.precio_venta || 0
    const existing = items.find(i => i.id === prod.id)
    const yaQty = existing?.cantidad || 0
    if (selQty + yaQty > (prod.stock || 0)) { toast(`Stock insuficiente (disponible: ${prod.stock - yaQty})`); return }
    setItems(prev => {
      if (existing) return prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + selQty, total: (i.cantidad + selQty) * i.precio } : i)
      return [...prev, { id: prod.id, nombre: prod.nombre, unidad: prod.unidad || 'unidad', cantidad: selQty, precio, total: selQty * precio }]
    })
    setSelProd(''); setSelQty(1); setSelPrecio('')
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Nueva Factura</h1><div className="sub">Nro. {nro}</div></div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => { setItems([]); setDescuento(0); setCliente({ nombre: '', dni: '' }) }}>Limpiar</button>
          <button className="btn btn-primary" disabled={items.length === 0} onClick={confirmar}>
            {items.length > 0 ? `Confirmar — $${fmt(total)}` : 'Confirmar'}
          </button>
        </div>
      </div>

      <div className="factura-section">
        {/* SCANNER BAR */}
        <div className={`scan-bar${scanFlash ? ` flash-${scanFlash}` : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 5h2M7 5h1M10 5h4M16 5h1M19 5h2M3 12h2M7 12h5M14 12h2M18 12h3M3 19h2M7 19h1M10 19h4M16 19h1M19 19h2" />
            <rect x="1" y="2" width="22" height="20" rx="2" strokeOpacity=".3" />
          </svg>
          <input
            ref={scanRef}
            data-scanner="true"
            placeholder="Escanear o escribir código de barras…"
            onKeyDown={handleScanInput}
            autoComplete="off" autoCorrect="off" spellCheck={false}
          />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Enter para agregar</span>
        </div>

        {/* CLIENTE */}
        <div className="cliente-box">
          <div className="cliente-box-title">Datos del cliente</div>
          <div className="form-grid-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nombre</label>
              <input placeholder="Consumidor final" value={cliente.nombre} onChange={e => setCliente(c => ({ ...c, nombre: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>DNI / CUIT</label>
              <input placeholder="—" value={cliente.dni} onChange={e => setCliente(c => ({ ...c, dni: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Descuento global %</label>
              <input type="number" min="0" max="100" step="0.5" value={descuento} onChange={e => setDescuento(+e.target.value)} />
            </div>
          </div>
        </div>

        {/* SELECTOR MANUAL */}
        <details className="selector-box">
          <summary className="selector-summary">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Agregar por nombre / selector
          </summary>
          <div className="selector-body">
            <div className="item-add-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
                <label>Producto</label>
                <select value={selProd} onChange={e => { setSelProd(e.target.value); const p = inventario.find(x => x.id === e.target.value); if (p) setSelPrecio(p.precio_venta) }}>
                  <option value="">— Seleccionar —</option>
                  {inventario.map(p => <option key={p.id} value={p.id}>{p.nombre} · stock: {p.stock}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ width: 80, marginBottom: 0 }}>
                <label>Cantidad</label>
                <input type="number" min="1" value={selQty} onChange={e => setSelQty(+e.target.value)} />
              </div>
              <div className="form-group" style={{ width: 130, marginBottom: 0 }}>
                <label>P. unitario</label>
                <input type="number" min="0" step="0.01" value={selPrecio} onChange={e => setSelPrecio(+e.target.value)} placeholder="Auto" />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={agregarDesdeSelector}>+ Agregar</button>
            </div>
          </div>
        </details>

        {/* TABLA ITEMS */}
        <div className="factura-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>P. Unit.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>Escaneá un producto o usá el selector</td></tr>
                : items.map(it => (
                  <tr key={it.id} className={flashRows[it.id] ? 'row-flash' : ''}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{it.nombre}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{it.unidad}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <QtyCtrl qty={it.cantidad} onInc={() => cambiar(it.id, 1)} onDec={() => cambiar(it.id, -1)} />
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">${fmt(it.precio)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="mono">${fmt(it.total)}</td>
                    <td><button className="btn btn-danger btn-xs" onClick={() => setItems(prev => prev.filter(i => i.id !== it.id))}>✕</button></td>
                  </tr>
                ))}
            </tbody>
          </table>

          {items.length > 0 && (
            <div className="factura-totales">
              <div className="total-line"><span>Subtotal</span><span className="mono">${fmt(subtotal)}</span></div>
              {descuento > 0 && <div className="total-line"><span>Descuento {descuento}%</span><span className="mono" style={{ color: 'var(--success)' }}>−${fmt(descAmt)}</span></div>}
              <div className="total-line"><span>Base imponible</span><span className="mono">${fmt(base)}</span></div>
              <div className="total-line"><span>IVA 21%</span><span className="mono" style={{ color: 'var(--muted)' }}>${fmt(iva)}</span></div>
              <div className="total-line big"><span>TOTAL</span><span>${fmt(total)}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
