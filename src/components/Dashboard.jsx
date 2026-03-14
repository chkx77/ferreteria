import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { useFirestore } from '../hooks/useFirestore'
import { StatCard, Spinner } from './UI'
import { fmt, fmtInt, fmtDate } from '../lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function Dashboard({ onNavigate }) {
  const { load } = useFirestore()
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetch() {
      const [inv, facs, comps] = await Promise.all([
        load('inventario'), load('facturas', 'fecha'), load('compras', 'fecha')
      ])
      const now = new Date()
      const mes = now.getMonth(), anio = now.getFullYear()
      const mesAnt = mes === 0 ? 11 : mes - 1
      const anioAnt = mes === 0 ? anio - 1 : anio

      const factMes = facs.filter(f => { const d = f.fecha?.toDate?.(); return d && d.getMonth() === mes && d.getFullYear() === anio })
      const factMesAnt = facs.filter(f => { const d = f.fecha?.toDate?.(); return d && d.getMonth() === mesAnt && d.getFullYear() === anioAnt })
      const totalMes = factMes.reduce((s, f) => s + (f.total || 0), 0)
      const totalMesAnt = factMesAnt.reduce((s, f) => s + (f.total || 0), 0)
      const delta = totalMesAnt > 0 ? ((totalMes - totalMesAnt) / totalMesAnt * 100) : 0

      const stockBajo = inv.filter(p => (p.stock || 0) <= (p.stock_minimo || 0))
      const valorInv = inv.reduce((s, p) => s + (p.precio_costo || 0) * (p.stock || 0), 0)

      const comprasMes = comps.filter(c => { const d = c.fecha?.toDate?.(); return d && d.getMonth() === mes && d.getFullYear() === anio })
      const totalComprasMes = comprasMes.reduce((s, c) => s + (c.total || 0), 0)

      // Chart: últimos 14 días
      const ventasDia = {}
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        ventasDia[d.toLocaleDateString('es-AR')] = 0
      }
      facs.forEach(f => { const k = fmtDate(f.fecha); if (ventasDia[k] !== undefined) ventasDia[k] += (f.total || 0) })

      // Top productos
      const prodCount = {}
      facs.forEach(f => (f.items || []).forEach(it => { prodCount[it.nombre] = (prodCount[it.nombre] || 0) + it.cantidad }))
      const topProds = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

      setData({ totalMes, delta, factMes, stockBajo, valorInv, inv, totalComprasMes, comprasMes, ventasDia, topProds })
    }
    fetch()
  }, [])

  if (!data) return <Spinner />

  const { totalMes, delta, factMes, stockBajo, valorInv, inv, totalComprasMes, comprasMes, ventasDia, topProds } = data
  const maxTop = topProds[0]?.[1] || 1

  const chartData = {
    labels: Object.keys(ventasDia),
    datasets: [{
      data: Object.values(ventasDia),
      backgroundColor: Object.values(ventasDia).map(v => v > 0 ? 'rgba(47,94,232,.72)' : 'rgba(0,0,0,.05)'),
      borderColor: 'transparent',
      borderRadius: 4,
    }]
  }
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' $' + fmt(c.raw) } } },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { family: 'DM Mono', size: 10 }, maxRotation: 45 } },
      y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { family: 'DM Mono', size: 10 }, callback: v => '$' + fmtInt(v) } }
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => onNavigate('ventas')}>+ Nueva venta</button>
      </div>

      <div className="stats-row">
        <StatCard label="Ventas del mes" value={`$${fmtInt(totalMes)}`} color="var(--accent)" trend={{ up: delta >= 0, label: `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}% vs mes ant.` }} />
        <StatCard label="Facturas emitidas" value={factMes.length} sub="este mes" />
        <StatCard label="Valor inventario" value={`$${fmtInt(valorInv)}`} sub={`${inv.length} productos`} />
        <StatCard label="Stock crítico" value={stockBajo.length} color={stockBajo.length > 0 ? 'var(--danger)' : 'var(--success)'} sub="por reponer" />
        <StatCard label="Compras del mes" value={`$${fmtInt(totalComprasMes)}`} color="var(--info)" sub={`${comprasMes.length} órdenes`} />
      </div>

      <div className="dash-grid">
        <div className="dash-panel full">
          <h3>Ventas últimos 14 días</h3>
          <div className="chart-wrap"><Bar data={chartData} options={chartOpts} /></div>
        </div>

        <div className="dash-panel">
          <h3>Top 5 productos vendidos</h3>
          {topProds.length === 0
            ? <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>Sin datos aún</div>
            : topProds.map(([nom, qty]) => (
              <div key={nom} className="top-item">
                <span style={{ flex: '0 0 auto', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{nom}</span>
                <div className="top-bar-wrap"><div className="top-bar" style={{ width: `${(qty / maxTop * 100).toFixed(0)}%` }} /></div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', minWidth: 30, textAlign: 'right' }}>{qty}</span>
              </div>
            ))}
        </div>

        <div className="dash-panel">
          <h3>Alertas de stock</h3>
          {stockBajo.length === 0
            ? <div style={{ color: 'var(--success)', fontFamily: 'var(--mono)', fontSize: 12 }}>✓ Todo en orden</div>
            : stockBajo.slice(0, 6).map(p => (
              <div key={p.id} className="alerta-item">
                <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{p.nombre}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span className="badge badge-low">{p.stock}/{p.stock_minimo}</span>
                  <button className="btn btn-xs btn-ghost" onClick={() => onNavigate('compras')}>Comprar</button>
                </div>
              </div>
            ))}
          {stockBajo.length > 6 && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', paddingTop: 8 }}>+{stockBajo.length - 6} más…</div>}
        </div>
      </div>
    </>
  )
}
