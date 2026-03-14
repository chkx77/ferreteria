import { useEffect, useState, useCallback } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useToast } from '../hooks/useToast'
import { Modal, Field, Input, Select, Spinner, Empty, SearchBox, Badge, useConfirm } from './UI'
import { fmt, fmtInt, CATS, UNIDADES } from '../lib/utils'
import * as XLSX from 'xlsx'

function MargenPreview({ costo, venta }) {
  if (!costo || !venta) return null
  const m = ((venta - costo) / costo * 100)
  const color = m > 30 ? 'var(--success)' : m > 10 ? 'var(--accent)' : 'var(--danger)'
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color, marginTop: -8, marginBottom: 12 }}>
    Margen: {m.toFixed(1)}% · Ganancia: ${fmt(venta - costo)} / unidad
  </div>
}

function ProductoModal({ producto, proveedores, onSave, onClose }) {
  const empty = { codigo: '', nombre: '', categoria: CATS[0], stock: 0, stock_minimo: 5, precio_costo: 0, precio_venta: 0, proveedor_id: '', proveedor_nombre: '', unidad: 'unidad', ubicacion: '', descripcion: '' }
  const [form, setForm] = useState({ ...empty, ...producto })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setN = (k) => (e) => setForm(f => ({ ...f, [k]: +e.target.value }))

  const provOptions = [
    { value: '', label: '— Sin proveedor —' },
    ...proveedores.map(p => ({ value: p.id, label: p.nombre }))
  ]

  function handleProvChange(e) {
    const id = e.target.value
    const prov = proveedores.find(p => p.id === id)
    setForm(f => ({ ...f, proveedor_id: id, proveedor_nombre: prov?.nombre || '' }))
  }

  return (
    <Modal title={producto ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>Guardar</button>
      </>}>
      <div className="form-grid-2">
        <Input label="Código" value={form.codigo} onChange={set('codigo')} />
        <Select label="Unidad" options={UNIDADES} value={form.unidad} onChange={set('unidad')} />
      </div>
      <Input label="Nombre del producto *" value={form.nombre} onChange={set('nombre')} />
      <div className="form-grid-2">
        <Select label="Categoría" options={CATS} value={form.categoria} onChange={set('categoria')} />
        <Field label="Proveedor">
          <select value={form.proveedor_id} onChange={handleProvChange}>
            {provOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="form-grid-3">
        <Input label="Stock actual" type="number" min="0" value={form.stock} onChange={setN('stock')} />
        <Input label="Stock mínimo" type="number" min="0" value={form.stock_minimo} onChange={setN('stock_minimo')} />
        <Input label="Ubicación" value={form.ubicacion} onChange={set('ubicacion')} placeholder="Ej: A-3" />
      </div>
      <div className="form-grid-2">
        <Input label="Precio costo ($)" type="number" min="0" step="0.01" value={form.precio_costo} onChange={setN('precio_costo')} />
        <Input label="Precio venta ($)" type="number" min="0" step="0.01" value={form.precio_venta} onChange={setN('precio_venta')} />
      </div>
      <MargenPreview costo={form.precio_costo} venta={form.precio_venta} />
      <Field label="Descripción">
        <textarea rows="2" value={form.descripcion} onChange={set('descripcion')} />
      </Field>
    </Modal>
  )
}

export default function Inventario() {
  const { load, add, update, remove, loading } = useFirestore()
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | producto

  const reload = useCallback(async () => {
    const [p, pv] = await Promise.all([load('inventario'), load('proveedores')])
    setProductos(p); setProveedores(pv)
  }, [load])

  useEffect(() => { reload() }, [reload])

  const filtered = productos.filter(p =>
    !search || p.nombre?.toLowerCase().includes(search) || p.codigo?.toLowerCase().includes(search) || p.categoria?.toLowerCase().includes(search)
  )

  async function handleSave(form) {
    if (!form.nombre) { toast('El nombre es obligatorio'); return }
    const data = { ...form, stock: +form.stock, stock_minimo: +form.stock_minimo, precio_costo: +form.precio_costo, precio_venta: +form.precio_venta }
    if (form.id) await update('inventario', form.id, data)
    else await add('inventario', data)
    setModal(null); toast(form.id ? 'Actualizado ✓' : 'Agregado ✓'); reload()
  }

  async function handleDelete(p) {
    const ok = await confirm(`¿Eliminar "${p.nombre}"?`)
    if (!ok) return
    await remove('inventario', p.id)
    toast('Eliminado'); reload()
  }

  function exportExcel() {
    if (!productos.length) { toast('Sin datos'); return }
    const rows = productos.map(p => ({
      'Código': p.codigo || '', 'Nombre': p.nombre || '', 'Categoría': p.categoria || '',
      'Proveedor': p.proveedor_nombre || '', 'Stock': p.stock || 0, 'Stock Mínimo': p.stock_minimo || 0,
      'Unidad': p.unidad || '', 'Precio Costo': p.precio_costo || 0, 'Precio Venta': p.precio_venta || 0,
      'Margen %': p.precio_costo > 0 ? +((p.precio_venta - p.precio_costo) / p.precio_costo * 100).toFixed(1) : 0,
      'Ubicación': p.ubicacion || ''
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    ws['!cols'] = [10, 30, 20, 25, 8, 10, 8, 14, 14, 10, 14].map(w => ({ wch: w }))
    XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast('Excel descargado ✓')
  }

  const stockBajo = productos.filter(p => (p.stock || 0) <= (p.stock_minimo || 0)).length
  const valorTotal = productos.reduce((s, p) => s + (p.precio_costo || 0) * (p.stock || 0), 0)

  if (loading && !productos.length) return <Spinner />

  return (
    <>
      {dialog}
      {modal && <ProductoModal producto={modal === 'new' ? null : modal} proveedores={proveedores} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="page-header">
        <div><h1>Inventario</h1><div className="sub">{productos.length} productos</div></div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={exportExcel}>↓ Excel</button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ Nuevo producto</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="s-label">Productos</div><div className="s-val">{productos.length}</div></div>
        <div className="stat-card"><div className="s-label">Stock crítico</div><div className="s-val" style={{ color: 'var(--danger)' }}>{stockBajo}</div></div>
        <div className="stat-card"><div className="s-label">Valor inventario</div><div className="s-val">${fmtInt(valorTotal)}</div><div className="s-sub">a precio costo</div></div>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={v => setSearch(v.toLowerCase())} placeholder="Buscar nombre, código, categoría…" />
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Código</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Mín.</th>
            <th>P. Costo</th><th>P. Venta</th><th>Margen</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={10}><Empty /></td></tr>
              : filtered.map(p => {
                const margen = p.precio_costo > 0 ? ((p.precio_venta - p.precio_costo) / p.precio_costo * 100) : 0
                const estClass = (p.stock || 0) <= (p.stock_minimo || 0) ? 'low' : (p.stock || 0) <= (p.stock_minimo || 0) * 1.5 ? 'warn' : 'ok'
                const estLabel = estClass === 'low' ? 'Bajo' : estClass === 'warn' ? 'Mínimo' : 'OK'
                return (
                  <tr key={p.id}>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{p.codigo || '—'}</td>
                    <td>
                      <strong>{p.nombre}</strong>
                      {p.proveedor_nombre && <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>{p.proveedor_nombre}</div>}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{p.categoria || '—'}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{p.stock || 0} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{p.unidad || ''}</span></td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{p.stock_minimo || 0}</td>
                    <td className="mono">${fmt(p.precio_costo)}</td>
                    <td className="mono" style={{ color: 'var(--accent)' }}>${fmt(p.precio_venta)}</td>
                    <td className="mono" style={{ color: margen > 30 ? 'var(--success)' : margen > 10 ? 'var(--accent)' : 'var(--danger)' }}>{margen.toFixed(0)}%</td>
                    <td><Badge variant={estClass}>{estLabel}</Badge></td>
                    <td>
                      <div className="action-row">
                        <button className="btn btn-ghost btn-xs" onClick={() => setModal(p)}>Editar</button>
                        <button className="btn btn-danger btn-xs" onClick={() => handleDelete(p)}>✕</button>
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
