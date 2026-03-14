import { useEffect, useState, useCallback, useRef } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useToast } from '../hooks/useToast'
import { Modal, Field, Input, Select, Spinner, Empty, SearchBox, Badge, useConfirm } from './UI'
import { fmt, fmtInt, CATS, UNIDADES } from '../lib/utils'
import * as XLSX from 'xlsx'

// ── Inline price cell ────────────────────────────────────
function PriceCell({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const ref = useRef()

  function start() { setVal(value); setEditing(true); setTimeout(() => ref.current?.select(), 10) }
  function save() { setEditing(false); if (+val !== value) onSave(+val) }
  function onKey(e) { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }

  if (editing) return (
    <div className="editable-cell">
      <input ref={ref} type="number" value={val} onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={onKey} autoFocus />
    </div>
  )
  return (
    <span className="mono editable-cell" onClick={start} title="Click para editar precio">
      ${fmt(value)}
    </span>
  )
}

// ── Margen hint ──────────────────────────────────────────
function MargenHint({ costo, venta }) {
  if (!costo || !venta) return null
  const m = ((venta - costo) / costo * 100)
  const color = m > 30 ? 'var(--success)' : m > 10 ? 'var(--warning)' : 'var(--danger)'
  return <div className="margen-hint" style={{ color }}>Margen: {m.toFixed(1)}% · +${fmt(venta - costo)} por unidad</div>
}

// ── Import modal ─────────────────────────────────────────
const PROD_FIELDS = [
  { key: 'nombre', label: 'Nombre *' }, { key: 'codigo', label: 'Código' },
  { key: 'categoria', label: 'Categoría' }, { key: 'precio_costo', label: 'Precio Costo' },
  { key: 'precio_venta', label: 'Precio Venta' }, { key: 'stock', label: 'Stock' },
  { key: 'stock_minimo', label: 'Stock Mínimo' }, { key: 'unidad', label: 'Unidad' },
  { key: 'ubicacion', label: 'Ubicación' }, { key: '__skip', label: '— Ignorar —' },
]

function autoMap(headers) {
  const map = {}
  headers.forEach((h, i) => {
    const hl = h.toLowerCase().replace(/[\s_\-]/g, '')
    const match = PROD_FIELDS.find(f => {
      if (f.key === '__skip') return false
      const fl = f.key.replace(/_/g, '')
      return hl === fl || hl.includes('nombre') && f.key === 'nombre'
        || hl.includes('cod') && f.key === 'codigo'
        || (hl.includes('cost') || hl.includes('costo')) && f.key === 'precio_costo'
        || (hl.includes('venta') || hl.includes('pventa')) && f.key === 'precio_venta'
        || hl === 'stock' && f.key === 'stock'
        || (hl.includes('min') || hl.includes('minimo')) && hl.includes('stock') && f.key === 'stock_minimo'
        || hl === 'precio' && f.key === 'precio_venta'
    })
    map[i] = match?.key || '__skip'
  })
  return map
}

function ImportModal({ onImport, onClose }) {
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState('upload')
  const [previewRows, setPreviewRows] = useState([])
  const fileRef = useRef()

  function parseFile(file) {
    const reader = new FileReader()
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
      if (!data.length) return
      const hdrs = data[0].map(String)
      const dataRows = data.slice(1).filter(r => r.some(c => c !== '' && c != null))
      setHeaders(hdrs); setRows(dataRows); setMapping(autoMap(hdrs)); setStep('map')
    }
    reader.readAsBinaryString(file)
  }

  const mappedFields = Object.entries(mapping).filter(([, v]) => v !== '__skip')

  function buildPreview() {
    setPreviewRows(rows.slice(0, 5).map(row => {
      const obj = {}
      mappedFields.forEach(([idx, field]) => { obj[field] = row[+idx] })
      return obj
    }))
    setStep('preview')
  }

  function doImport() {
    onImport(rows.map(row => {
      const obj = {}
      mappedFields.forEach(([idx, field]) => { obj[field] = row[+idx] })
      return obj
    }).filter(o => o.nombre))
  }

  return (
    <Modal title="Importar productos desde Excel" wide onClose={onClose}
      footer={
        step === 'upload'  ? <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        : step === 'map'   ? <><button className="btn btn-ghost" onClick={() => setStep('upload')}>← Volver</button><button className="btn btn-primary" onClick={buildPreview}>Vista previa →</button></>
        : <><button className="btn btn-ghost" onClick={() => setStep('map')}>← Volver</button><button className="btn btn-primary" onClick={doImport}>Importar {rows.length} productos</button></>
      }>

      {step === 'upload' && (
        <>
          <div className={`import-zone${dragging ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}>
            <div className="iz-icon">📊</div>
            <p><strong>Arrastrá tu archivo o hacé click para seleccionar</strong></p>
            <p style={{ marginTop: 6, fontSize: 12 }}>.xlsx · .xls · .csv</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]) }} />
          <div style={{ marginTop: 14, padding: '11px 13px', background: 'var(--surface2)', borderRadius: 'var(--r)', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', lineHeight: 1.8, border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--accent)' }}>Columnas reconocidas:</strong> nombre · codigo · precio_costo · precio_venta · stock · stock_minimo · unidad · categoria · ubicacion
          </div>
        </>
      )}

      {step === 'map' && (
        <>
          <div style={{ marginBottom: 12, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {rows.length} filas · {headers.length} columnas · Asigná cada columna de tu archivo a un campo del sistema:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {headers.map((h, i) => (
              <div key={i} className="import-mapping-row">
                <span className="col-name">{h}</span>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: .4, flexShrink: 0 }}><path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <select value={mapping[i] || '__skip'} onChange={e => setMapping(m => ({ ...m, [i]: e.target.value }))}>
                  {PROD_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div style={{ marginBottom: 10, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            Primeras 5 de {rows.length} filas:
          </div>
          <div className="import-preview">
            <table>
              <thead><tr>{mappedFields.map(([idx, field]) => <th key={idx}>{PROD_FIELDS.find(f => f.key === field)?.label}</th>)}</tr></thead>
              <tbody>{previewRows.map((row, i) => <tr key={i}>{mappedFields.map(([idx, field]) => <td key={idx}>{String(row[field] ?? '—')}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, padding: '10px 13px', background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>
            Se importarán {rows.length} productos. Los que ya existen (mismo código o nombre) se actualizarán.
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Producto modal ───────────────────────────────────────
function ProductoModal({ producto, proveedores, onSave, onClose }) {
  const e0 = { codigo: '', nombre: '', categoria: CATS[0], stock: 0, stock_minimo: 5, precio_costo: 0, precio_venta: 0, proveedor_id: '', proveedor_nombre: '', unidad: 'unidad', ubicacion: '', descripcion: '' }
  const [form, setForm] = useState({ ...e0, ...producto })
  const set  = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setN = k => e => setForm(f => ({ ...f, [k]: +e.target.value }))

  return (
    <Modal title={producto ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => onSave(form)}>Guardar</button></>}>
      <div className="form-grid-2">
        <Input label="Código" value={form.codigo} onChange={set('codigo')} />
        <Select label="Unidad" options={UNIDADES} value={form.unidad} onChange={set('unidad')} />
      </div>
      <Input label="Nombre *" value={form.nombre} onChange={set('nombre')} />
      <div className="form-grid-2">
        <Select label="Categoría" options={CATS} value={form.categoria} onChange={set('categoria')} />
        <Field label="Proveedor">
          <select value={form.proveedor_id} onChange={e => { const p = proveedores.find(x => x.id === e.target.value); setForm(f => ({ ...f, proveedor_id: e.target.value, proveedor_nombre: p?.nombre || '' })) }}>
            <option value="">— Sin proveedor —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
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
      <MargenHint costo={form.precio_costo} venta={form.precio_venta} />
      <Field label="Descripción"><textarea rows="2" value={form.descripcion} onChange={set('descripcion')} /></Field>
    </Modal>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function Inventario({ sucursal }) {
  const { load, add, update, remove } = useFirestore()
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const [p, pv] = await Promise.all([load('inventario'), load('proveedores')])
    setProductos(p); setProveedores(pv); setLoading(false)
  }, [load])

  useEffect(() => { reload() }, [reload])

  const filtered = productos.filter(p =>
    !search || p.nombre?.toLowerCase().includes(search) ||
    p.codigo?.toLowerCase().includes(search) || p.categoria?.toLowerCase().includes(search)
  )

  async function handleSave(form) {
    if (!form.nombre) { toast('El nombre es obligatorio'); return }
    const data = { ...form, stock: +form.stock, stock_minimo: +form.stock_minimo, precio_costo: +form.precio_costo, precio_venta: +form.precio_venta }
    if (form.id) await update('inventario', form.id, data)
    else await add('inventario', data)
    setModal(null); toast(form.id ? 'Actualizado ✓' : 'Agregado ✓'); reload()
  }

  async function handleDelete(p) {
    if (!(await confirm(`¿Eliminar "${p.nombre}"?`))) return
    await remove('inventario', p.id); toast('Eliminado'); reload()
  }

  async function handleInlineUpdate(id, field, value) {
    await update('inventario', id, { [field]: value })
    setProductos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    toast('Precio actualizado ✓')
  }

  async function handleImport(rows) {
    setShowImport(false)
    let created = 0, updated = 0
    for (const row of rows) {
      if (!row.nombre) continue
      const data = { nombre: String(row.nombre).trim(), codigo: String(row.codigo||'').trim(), categoria: row.categoria||CATS[0], precio_costo: +row.precio_costo||0, precio_venta: +row.precio_venta||0, stock: +row.stock||0, stock_minimo: +row.stock_minimo||0, unidad: row.unidad||'unidad', ubicacion: row.ubicacion||'', proveedor_id: '', proveedor_nombre: '' }
      const existing = productos.find(p => (data.codigo && p.codigo === data.codigo) || p.nombre?.toLowerCase() === data.nombre.toLowerCase())
      if (existing) { await update('inventario', existing.id, data); updated++ }
      else { await add('inventario', data); created++ }
    }
    toast(`Importación completa: ${created} nuevos, ${updated} actualizados`)
    reload()
  }

  function exportExcel() {
    if (!productos.length) { toast('Sin datos'); return }
    const rows = productos.map(p => ({ 'Código':p.codigo||'','Nombre':p.nombre||'','Categoría':p.categoria||'','Proveedor':p.proveedor_nombre||'','Stock':p.stock||0,'Stock Mínimo':p.stock_minimo||0,'Unidad':p.unidad||'','Precio Costo':p.precio_costo||0,'Precio Venta':p.precio_venta||0,'Margen %':p.precio_costo>0?+((p.precio_venta-p.precio_costo)/p.precio_costo*100).toFixed(1):0,'Ubicación':p.ubicacion||'' }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    ws['!cols'] = [10,30,20,25,8,10,8,14,14,10,14].map(w=>({wch:w}))
    XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0,10)}.xlsx`)
    toast('Excel exportado ✓')
  }

  const stockBajo = productos.filter(p => (p.stock||0) <= (p.stock_minimo||0)).length
  const valorTotal = productos.reduce((s,p) => s+(p.precio_costo||0)*(p.stock||0), 0)

  if (loading) return <Spinner />

  return (
    <>
      {dialog}
      {modal && <ProductoModal producto={modal==='new'?null:modal} proveedores={proveedores} onSave={handleSave} onClose={() => setModal(null)} />}
      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}

      <div className="page-header">
        <div><h1>Inventario</h1><div className="sub">{productos.length} productos · ${fmtInt(valorTotal)} valor total</div></div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>↑ Importar Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={exportExcel}>↓ Exportar</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>+ Nuevo</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="s-label">Productos</div><div className="s-val">{productos.length}</div></div>
        <div className="stat-card"><div className="s-label">Stock crítico</div><div className="s-val" style={{color:'var(--danger)'}}>{stockBajo}</div></div>
        <div className="stat-card"><div className="s-label">Valor inventario</div><div className="s-val">${fmtInt(valorTotal)}</div><div className="s-sub">precio costo</div></div>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={v => setSearch(v.toLowerCase())} placeholder="Buscar nombre, código, categoría…" />
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--muted2)' }}>Click en un precio para editarlo</span>
      </div>

      <div className="table-wrap padded">
        <table>
          <thead><tr>
            <th>Código</th><th>Producto</th><th>Categoría</th><th>Stock</th>
            <th>Mín.</th><th>P. Costo</th><th>P. Venta</th><th>Margen</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={10}><Empty /></td></tr>
              : filtered.map(p => {
                const margen = p.precio_costo > 0 ? ((p.precio_venta - p.precio_costo) / p.precio_costo * 100) : 0
                const ec = (p.stock||0)<=(p.stock_minimo||0)?'low':(p.stock||0)<=(p.stock_minimo||0)*1.5?'warn':'ok'
                return (
                  <tr key={p.id}>
                    <td className="mono" style={{color:'var(--muted)'}}>{p.codigo||'—'}</td>
                    <td>
                      <strong>{p.nombre}</strong>
                      {p.proveedor_nombre && <div style={{color:'var(--muted)',fontSize:11,fontFamily:'var(--mono)'}}>{p.proveedor_nombre}</div>}
                    </td>
                    <td style={{color:'var(--muted)',fontSize:12}}>{p.categoria||'—'}</td>
                    <td className="mono" style={{fontWeight:600}}>{p.stock||0} <span style={{color:'var(--muted)',fontSize:10}}>{p.unidad}</span></td>
                    <td className="mono" style={{color:'var(--muted)'}}>{p.stock_minimo||0}</td>
                    <td><PriceCell value={p.precio_costo||0} onSave={v => handleInlineUpdate(p.id,'precio_costo',v)} /></td>
                    <td><PriceCell value={p.precio_venta||0} onSave={v => handleInlineUpdate(p.id,'precio_venta',v)} /></td>
                    <td className="mono" style={{color:margen>30?'var(--success)':margen>10?'var(--warning)':'var(--danger)'}}>{margen.toFixed(0)}%</td>
                    <td><Badge variant={ec}>{ec==='low'?'Bajo':ec==='warn'?'Mínimo':'OK'}</Badge></td>
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
