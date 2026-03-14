import { useEffect, useState, useCallback } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useToast } from '../hooks/useToast'
import { Modal, Spinner, Empty, SearchBox, Badge, useConfirm } from './UI'
import { fmt, fmtInt, fmtDate, newNum } from '../lib/utils'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import * as XLSX from 'xlsx'

function CompraModal({ proveedores, inventario, onSave, onClose }) {
  const [provId, setProvId] = useState('')
  const [nota, setNota] = useState('')
  const [items, setItems] = useState([])
  const [selProd, setSelProd] = useState('')
  const [selQty, setSelQty] = useState(1)
  const [selPc, setSelPc] = useState('')
  const toast = useToast()

  const total = items.reduce((s, i) => s + i.total, 0)

  function agregar() {
    const prod = inventario.find(p => p.id === selProd)
    if (!prod) { toast('Seleccioná un producto'); return }
    const qty = +selQty || 1
    const pc = +selPc || prod.precio_costo || 0
    setItems(prev => [...prev, { id: prod.id, nombre: prod.nombre, cantidad: qty, precio_costo: pc, total: qty * pc }])
    setSelProd(''); setSelQty(1); setSelPc('')
  }

  function handleSave() {
    if (!provId) { toast('Seleccioná un proveedor'); return }
    if (!items.length) { toast('Agregá al menos un ítem'); return }
    const prov = proveedores.find(p => p.id === provId)
    onSave({ numero: newNum('OC'), proveedor_id: provId, proveedor_nombre: prov?.nombre || '', items, total, estado: 'Pendiente', nota, fecha: Timestamp.fromDate(new Date()) })
  }

  return (
    <Modal title="Nueva Orden de Compra" wide onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!items.length} onClick={handleSave}>Confirmar orden</button>
      </>}>
      <div className="form-grid-2">
        <div className="form-group">
          <label>Proveedor *</label>
          <select value={provId} onChange={e => setProvId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Nota</label><input value={nota} onChange={e => setNota(e.target.value)} placeholder="Referencia opcional" /></div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0 16px' }} />
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 10 }}>Productos</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="form-group" style={{ flex: 2, minWidth: 180, marginBottom: 0 }}>
          <label>Producto</label>
          <select value={selProd} onChange={e => { setSelProd(e.target.value); const p = inventario.find(x => x.id === e.target.value); if (p) setSelPc(p.precio_costo) }}>
            <option value="">— Seleccionar —</option>
            {inventario.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ width: 80, marginBottom: 0 }}><label>Cantidad</label><input type="number" min="1" value={selQty} onChange={e => setSelQty(+e.target.value)} /></div>
        <div className="form-group" style={{ width: 130, marginBottom: 0 }}><label>P. Costo ($)</label><input type="number" min="0" step="0.01" value={selPc} onChange={e => setSelPc(+e.target.value)} placeholder="0.00" /></div>
        <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={agregar}>+ Agregar</button>
      </div>
      {items.length > 0 && (
        <table style={{ width: '100%', marginBottom: 12 }}>
          <thead><tr>
            {['Producto', 'Cant.', 'P. Costo', 'Total', ''].map(h => <th key={h} style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', padding: '6px 8px', textAlign: h === '' ? 'center' : 'left' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 8px' }}>{it.nombre}</td>
                <td style={{ padding: '7px 8px', fontFamily: 'var(--mono)' }}>{it.cantidad}</td>
                <td style={{ padding: '7px 8px', fontFamily: 'var(--mono)' }}>${fmt(it.precio_costo)}</td>
                <td style={{ padding: '7px 8px', fontFamily: 'var(--mono)', fontWeight: 600 }}>${fmt(it.total)}</td>
                <td style={{ padding: '7px 8px' }}><button className="btn btn-ghost btn-xs" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {items.length > 0 && <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--info)', paddingRight: 8 }}>Total: ${fmt(total)}</div>}
    </Modal>
  )
}

function VerCompraModal({ compra: c, onClose, onRecibir }) {
  const sc = c.estado === 'Recibido' ? 'ok' : c.estado === 'Cancelado' ? 'low' : 'warn'
  return (
    <Modal wide onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        {c.estado === 'Pendiente' && <button className="btn btn-success" onClick={() => { onClose(); onRecibir(c.id) }}>Marcar como recibido</button>}
      </>}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>ORDEN DE COMPRA</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--info)' }}>{c.numero}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge variant={sc}>{c.estado}</Badge>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{fmtDate(c.fecha, true)}</div>
        </div>
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>PROVEEDOR</div>
        <div style={{ fontWeight: 600 }}>{c.proveedor_nombre || '—'}</div>
        {c.nota && <div style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)', marginTop: 4 }}>{c.nota}</div>}
      </div>
      <table style={{ width: '100%', marginBottom: 14 }}>
        <thead><tr>
          {['Producto', 'Cant.', 'P. Costo', 'Total'].map((h, i) => (
            <th key={h} style={{ textAlign: i > 0 ? 'right' : 'left', padding: '6px 10px', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {(c.items || []).map((it, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 10px' }}>{it.nombre}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', fontFamily: 'var(--mono)' }}>{it.cantidad}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', fontFamily: 'var(--mono)' }}>${fmt(it.precio_costo)}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>${fmt(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', fontSize: 16, fontWeight: 800, color: 'var(--info)', paddingRight: 10 }}>Total: ${fmt(c.total || 0)}</div>
    </Modal>
  )
}

export default function Compras() {
  const { load, add, update, recibirCompraDB, loading } = useFirestore()
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [inventario, setInventario] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | compra
  const [verModal, setVerModal] = useState(null)

  const reload = useCallback(async () => {
    const [c, p, inv] = await Promise.all([load('compras', 'fecha'), load('proveedores'), load('inventario')])
    setCompras(c); setProveedores(p); setInventario(inv)
  }, [load])

  useEffect(() => { reload() }, [reload])

  const filtered = compras.filter(c =>
    !search || c.numero?.includes(search) || c.proveedor_nombre?.toLowerCase().includes(search)
  )

  async function handleSave(data) {
    await add('compras', data)
    setModal(null); toast('Orden creada ✓'); reload()
  }

  async function handleRecibir(id) {
    const c = compras.find(x => x.id === id); if (!c) return
    const ok = await confirm(`¿Marcar ${c.numero} como RECIBIDA?\nEsto actualizará el stock.`)
    if (!ok) return
    await recibirCompraDB(id, c.items || [])
    toast('Recibido · stock actualizado ✓'); reload()
  }

  async function handleCancelar(id) {
    const c = compras.find(x => x.id === id); if (!c) return
    const ok = await confirm(`¿Cancelar orden ${c.numero}?`)
    if (!ok) return
    await update('compras', id, { estado: 'Cancelado' })
    toast('Cancelada'); reload()
  }

  function exportExcel() {
    if (!compras.length) { toast('Sin datos'); return }
    const rows = compras.map(c => ({ 'Número': c.numero || '', 'Fecha': fmtDate(c.fecha), 'Proveedor': c.proveedor_nombre || '', 'Estado': c.estado || '', 'Total': c.total || 0, 'Nota': c.nota || '' }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Compras')
    XLSX.writeFile(wb, `compras_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast('Excel descargado ✓')
  }

  const pendientes = compras.filter(c => c.estado === 'Pendiente').length
  const now = new Date()
  const totalMes = compras.filter(c => { const d = c.fecha?.toDate?.(); return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, c) => s + (c.total || 0), 0)

  if (loading && !compras.length) return <Spinner />

  return (
    <>
      {dialog}
      {modal === 'new' && <CompraModal proveedores={proveedores} inventario={inventario} onSave={handleSave} onClose={() => setModal(null)} />}
      {verModal && <VerCompraModal compra={verModal} onClose={() => setVerModal(null)} onRecibir={handleRecibir} />}

      <div className="page-header">
        <div><h1>Compras</h1><div className="sub">Órdenes a proveedores</div></div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={exportExcel}>↓ Excel</button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ Nueva orden</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="s-label">Órdenes totales</div><div className="s-val">{compras.length}</div></div>
        <div className="stat-card"><div className="s-label">Pendientes</div><div className="s-val" style={{ color: 'var(--accent)' }}>{pendientes}</div></div>
        <div className="stat-card"><div className="s-label">Compras del mes</div><div className="s-val" style={{ color: 'var(--info)' }}>${fmtInt(totalMes)}</div></div>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={v => setSearch(v.toLowerCase())} placeholder="Buscar número o proveedor…" />
      </div>

      <div className="table-wrap pt">
        <table>
          <thead><tr>
            <th>Nro.</th><th>Fecha</th><th>Proveedor</th><th>Ítems</th>
            <th style={{ textAlign: 'right' }}>Total</th><th>Estado</th><th />
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7}><Empty msg="Sin órdenes de compra" /></td></tr>
              : filtered.map(c => {
                const sc = c.estado === 'Recibido' ? 'ok' : c.estado === 'Cancelado' ? 'low' : 'warn'
                return (
                  <tr key={c.id}>
                    <td className="mono" style={{ color: 'var(--info)' }}>{c.numero}</td>
                    <td className="mono">{fmtDate(c.fecha)}</td>
                    <td>
                      <strong>{c.proveedor_nombre || '—'}</strong>
                      {c.nota && <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>{c.nota}</div>}
                    </td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{c.items?.length || 0}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">${fmt(c.total || 0)}</td>
                    <td><Badge variant={sc}>{c.estado || 'Pendiente'}</Badge></td>
                    <td>
                      <div className="action-row">
                        <button className="btn btn-ghost btn-xs" onClick={() => setVerModal(c)}>Ver</button>
                        {c.estado === 'Pendiente' && <button className="btn btn-success btn-xs" onClick={() => handleRecibir(c.id)}>Recibir</button>}
                        {c.estado === 'Pendiente' && <button className="btn btn-danger btn-xs" onClick={() => handleCancelar(c.id)}>Cancelar</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </>
  )
}
