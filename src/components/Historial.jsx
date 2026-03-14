import { useEffect, useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { useToast } from '../hooks/useToast'
import { Modal, Spinner, Empty, SearchBox } from './UI'
import { fmt, fmtInt, fmtDate } from '../lib/utils'
import { imprimirFactura } from '../lib/print'
import * as XLSX from 'xlsx'

function FacturaModal({ factura: f, onClose }) {
  return (
    <Modal wide onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button className="btn btn-info" onClick={() => imprimirFactura(f)}>Imprimir</button>
      </>}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>FACTURA</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{f.numero}</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{fmtDate(f.fecha, true)}</div>
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>CLIENTE</div>
        <div style={{ fontWeight: 600 }}>{f.cliente?.nombre || 'Consumidor final'}</div>
        {f.cliente?.dni && <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{f.cliente.dni}</div>}
      </div>
      <table style={{ width: '100%', marginBottom: 14 }}>
        <thead><tr>
          {['Producto', 'Cant.', 'Unit.', 'Total'].map((h, i) => (
            <th key={h} style={{ textAlign: i > 0 ? 'right' : 'left', padding: '6px 10px', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {(f.items || []).map((it, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 10px' }}>{it.nombre}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', fontFamily: 'var(--mono)' }}>{it.cantidad} {it.unidad || ''}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', fontFamily: 'var(--mono)' }}>${fmt(it.precio)}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>${fmt(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 12 }}>
        {[
          ['Subtotal', `$${fmt(f.subtotal || 0)}`, 'var(--muted)'],
          f.descuento > 0 ? ['Descuento', `−$${fmt(f.descuento)}`, 'var(--success)'] : null,
          ['IVA 21%', `$${fmt(f.iva || 0)}`, 'var(--muted)'],
        ].filter(Boolean).map(([l, v, c]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 12, color: c, padding: '3px 10px' }}>
            <span>{l}</span><span>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--accent)', padding: '10px 10px 0', borderTop: '1px solid var(--border2)', marginTop: 6 }}>
          <span>TOTAL</span><span>${fmt(f.total || 0)}</span>
        </div>
      </div>
    </Modal>
  )
}

export default function Historial() {
  const { load, loading } = useFirestore()
  const toast = useToast()
  const [facturas, setFacturas] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { load('facturas', 'fecha').then(setFacturas) }, [load])

  const filtered = facturas.filter(f =>
    !search || f.numero?.includes(search) || f.cliente?.nombre?.toLowerCase().includes(search)
  )

  const totalVentas = facturas.reduce((s, f) => s + (f.total || 0), 0)

  function exportExcel() {
    if (!facturas.length) { toast('Sin datos'); return }
    const rows = facturas.map(f => ({
      'Número': f.numero || '', 'Fecha': fmtDate(f.fecha), 'Cliente': f.cliente?.nombre || '',
      'DNI/CUIT': f.cliente?.dni || '', 'Subtotal': f.subtotal || 0, 'Descuento': f.descuento || 0,
      'IVA 21%': f.iva || 0, 'Total': f.total || 0, 'Ítems': f.items?.length || 0
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
    XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast('Excel descargado ✓')
  }

  if (loading && !facturas.length) return <Spinner />

  return (
    <>
      {selected && <FacturaModal factura={selected} onClose={() => setSelected(null)} />}

      <div className="page-header">
        <div><h1>Historial de Ventas</h1><div className="sub">Últimas {facturas.length} facturas</div></div>
        <button className="btn btn-ghost" onClick={exportExcel}>↓ Excel</button>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="s-label">Facturas</div><div className="s-val">{facturas.length}</div></div>
        <div className="stat-card"><div className="s-label">Total facturado</div><div className="s-val" style={{ color: 'var(--accent)' }}>${fmtInt(totalVentas)}</div></div>
        <div className="stat-card"><div className="s-label">Ticket promedio</div><div className="s-val">${fmtInt(facturas.length > 0 ? totalVentas / facturas.length : 0)}</div></div>
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={v => setSearch(v.toLowerCase())} placeholder="Buscar por número o cliente…" />
      </div>

      <div className="table-wrap pt">
        <table>
          <thead><tr>
            <th>Nro.</th><th>Fecha</th><th>Cliente</th><th>Ítems</th>
            <th style={{ textAlign: 'right' }}>Subtotal</th><th style={{ textAlign: 'right' }}>Desc.</th>
            <th style={{ textAlign: 'right' }}>IVA</th><th style={{ textAlign: 'right' }}>Total</th><th />
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><Empty msg="Sin ventas registradas" /></td></tr>
              : filtered.map(f => (
                <tr key={f.id}>
                  <td className="mono" style={{ color: 'var(--accent)' }}>{f.numero}</td>
                  <td className="mono">{fmtDate(f.fecha)}</td>
                  <td>
                    {f.cliente?.nombre || '—'}
                    {f.cliente?.dni && <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>{f.cliente.dni}</div>}
                  </td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{f.items?.length || 0}</td>
                  <td style={{ textAlign: 'right' }} className="mono">${fmt(f.subtotal || 0)}</td>
                  <td style={{ textAlign: 'right' }} className="mono" style={{ color: 'var(--success)' }}>{f.descuento > 0 ? `−$${fmt(f.descuento)}` : '—'}</td>
                  <td style={{ textAlign: 'right' }} className="mono" style={{ color: 'var(--muted)' }}>${fmt(f.iva || 0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }} className="mono">${fmt(f.total || 0)}</td>
                  <td>
                    <div className="action-row">
                      <button className="btn btn-ghost btn-xs" onClick={() => setSelected(f)}>Ver</button>
                      <button className="btn btn-info btn-xs" onClick={() => imprimirFactura(f)}>Imprimir</button>
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
