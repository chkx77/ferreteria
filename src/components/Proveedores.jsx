import { useEffect, useState, useCallback } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useToast } from '../hooks/useToast'
import { Modal, Input, Select, Field, Spinner, Empty, SearchBox, useConfirm } from './UI'
import { CATS, COND_PAGO } from '../lib/utils'

function ProveedorModal({ proveedor, onSave, onClose }) {
  const empty = { nombre: '', cuit: '', contacto: '', telefono: '', email: '', categoria: CATS[0], condicion_pago: '30 días', notas: '' }
  const [form, setForm] = useState({ ...empty, ...proveedor })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Modal title={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>Guardar</button>
      </>}>
      <Input label="Nombre / Razón social *" value={form.nombre} onChange={set('nombre')} />
      <div className="form-grid-2">
        <Input label="CUIT" value={form.cuit} onChange={set('cuit')} />
        <Input label="Persona de contacto" value={form.contacto} onChange={set('contacto')} />
      </div>
      <div className="form-grid-2">
        <Input label="Teléfono" value={form.telefono} onChange={set('telefono')} />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} />
      </div>
      <div className="form-grid-2">
        <Select label="Rubro" options={CATS} value={form.categoria} onChange={set('categoria')} />
        <Select label="Condición de pago" options={COND_PAGO} value={form.condicion_pago} onChange={set('condicion_pago')} />
      </div>
      <Field label="Notas"><textarea rows="2" value={form.notas} onChange={set('notas')} /></Field>
    </Modal>
  )
}

export default function Proveedores() {
  const { load, add, update, remove, loading } = useFirestore()
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [proveedores, setProveedores] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const reload = useCallback(async () => {
    setProveedores(await load('proveedores'))
  }, [load])

  useEffect(() => { reload() }, [reload])

  const filtered = proveedores.filter(p =>
    !search || p.nombre?.toLowerCase().includes(search) || p.cuit?.includes(search)
  )

  async function handleSave(form) {
    if (!form.nombre) { toast('El nombre es obligatorio'); return }
    if (form.id) await update('proveedores', form.id, form)
    else await add('proveedores', form)
    setModal(null); toast(form.id ? 'Actualizado ✓' : 'Agregado ✓'); reload()
  }

  async function handleDelete(p) {
    const ok = await confirm(`¿Eliminar "${p.nombre}"?`)
    if (!ok) return
    await remove('proveedores', p.id)
    toast('Eliminado'); reload()
  }

  if (loading && !proveedores.length) return <Spinner />

  return (
    <>
      {dialog}
      {modal && <ProveedorModal proveedor={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="page-header">
        <div><h1>Proveedores</h1><div className="sub">{proveedores.length} registrados</div></div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Nuevo proveedor</button>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={v => setSearch(v.toLowerCase())} placeholder="Buscar proveedor o CUIT…" />
      </div>

      <div className="table-wrap pt">
        <table>
          <thead><tr>
            <th>Nombre / Razón Social</th><th>CUIT</th><th>Contacto</th>
            <th>Teléfono</th><th>Email</th><th>Cond. Pago</th><th />
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7}><Empty msg="Sin proveedores" /></td></tr>
              : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.categoria && <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>{p.categoria}</div>}
                  </td>
                  <td className="mono">{p.cuit || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{p.contacto || '—'}</td>
                  <td className="mono">{p.telefono || '—'}</td>
                  <td style={{ color: 'var(--info)', fontSize: 12 }}>{p.email || '—'}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{p.condicion_pago || '—'}</td>
                  <td>
                    <div className="action-row">
                      <button className="btn btn-ghost btn-xs" onClick={() => setModal(p)}>Editar</button>
                      <button className="btn btn-danger btn-xs" onClick={() => handleDelete(p)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
