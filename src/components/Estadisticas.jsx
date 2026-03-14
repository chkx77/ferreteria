import { useEffect, useState, useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Tooltip, Legend, Filler
} from 'chart.js'
import { useFirestore } from '../hooks/useFirestore'
import { Spinner } from './UI'
import { fmt, fmtInt, fmtDate } from '../lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

const PERIODOS = [
  { id: '7d',  label: 'Últimos 7 días' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'anio', label: 'Este año' },
]

function getRango(periodoId) {
  const now = new Date()
  const desde = new Date()
  if (periodoId === '7d')   desde.setDate(now.getDate() - 7)
  if (periodoId === '30d')  desde.setDate(now.getDate() - 30)
  if (periodoId === '90d')  desde.setDate(now.getDate() - 90)
  if (periodoId === 'mes')  { desde.setDate(1); desde.setHours(0,0,0,0) }
  if (periodoId === 'anio') { desde.setMonth(0,1); desde.setHours(0,0,0,0) }
  return { desde, hasta: now }
}

const CHART_OPTS_BASE = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' $' + fmt(c.raw) } } },
  scales: {
    x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#8c8c82', font: { family: 'Geist Mono', size: 10 }, maxRotation: 45 } },
    y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#8c8c82', font: { family: 'Geist Mono', size: 10 }, callback: v => '$' + fmtInt(v) } }
  }
}

export default function Estadisticas({ sucursal }) {
  const { load } = useFirestore()
  const [loading, setLoading] = useState(true)
  const [facturas, setFacturas] = useState([])
  const [inventario, setInventario] = useState([])
  const [periodo, setPeriodo] = useState('30d')

  useEffect(() => {
    setLoading(true)
    Promise.all([load('facturas', 'fecha'), load('inventario')]).then(([f, inv]) => {
      setFacturas(f)
      setInventario(inv)
      setLoading(false)
    })
  }, [load])

  const { desde, hasta } = getRango(periodo)

  const facsPeriodo = useMemo(() =>
    facturas.filter(f => {
      const d = f.fecha?.toDate?.()
      return d && d >= desde && d <= hasta &&
        (!sucursal || f.sucursal === sucursal || !f.sucursal)
    }), [facturas, desde, hasta, sucursal])

  // KPIs
  const totalVentas   = facsPeriodo.reduce((s, f) => s + (f.total || 0), 0)
  const totalFacturas = facsPeriodo.length
  const ticketProm    = totalFacturas > 0 ? totalVentas / totalFacturas : 0
  const totalIva      = facsPeriodo.reduce((s, f) => s + (f.iva || 0), 0)

  // Ventas por día
  const ventasDia = useMemo(() => {
    const map = {}
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : periodo === 'mes' ? 31 : 365
    const step = dias > 60 ? 7 : 1 // agrupar por semana si hay muchos días
    for (let i = Math.min(dias, 60); i >= 0; i -= step) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = step > 1
        ? `Sem ${d.toLocaleDateString('es-AR', { day:'2-digit', month:'short' })}`
        : d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
      if (!map[key]) map[key] = 0
    }
    facsPeriodo.forEach(f => {
      const d = f.fecha?.toDate?.()
      if (!d) return
      const key = step > 1
        ? `Sem ${d.toLocaleDateString('es-AR', { day:'2-digit', month:'short' })}`
        : d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
      if (map[key] !== undefined) map[key] += (f.total || 0)
    })
    return map
  }, [facsPeriodo, periodo])

  // Top productos
  const topProductos = useMemo(() => {
    const cnt = {}
    facsPeriodo.forEach(f => (f.items || []).forEach(it => {
      if (!cnt[it.nombre]) cnt[it.nombre] = { qty: 0, total: 0 }
      cnt[it.nombre].qty += it.cantidad
      cnt[it.nombre].total += it.total
    }))
    return Object.entries(cnt).sort((a, b) => b[1].total - a[1].total).slice(0, 8)
  }, [facsPeriodo])

  // Ventas por categoría
  const porCategoria = useMemo(() => {
    const cat = {}
    facsPeriodo.forEach(f => (f.items || []).forEach(it => {
      const prod = inventario.find(p => p.id === it.id)
      const c = prod?.categoria || 'Sin categoría'
      cat[c] = (cat[c] || 0) + it.total
    }))
    return Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [facsPeriodo, inventario])

  const maxCat = porCategoria[0]?.[1] || 1
  const maxProd = topProductos[0]?.[1].total || 1

  // Clientes frecuentes
  const topClientes = useMemo(() => {
    const cl = {}
    facsPeriodo.forEach(f => {
      const n = f.cliente?.nombre || 'Consumidor final'
      if (!cl[n]) cl[n] = { compras: 0, total: 0 }
      cl[n].compras += 1
      cl[n].total += (f.total || 0)
    })
    return Object.entries(cl).sort((a, b) => b[1].total - a[1].total).slice(0, 6)
  }, [facsPeriodo])

  if (loading) return <Spinner />

  const chartData = {
    labels: Object.keys(ventasDia),
    datasets: [{
      data: Object.values(ventasDia),
      backgroundColor: 'rgba(91,106,240,.12)',
      borderColor: 'rgba(91,106,240,.8)',
      borderWidth: 2,
      borderRadius: 4,
      fill: true,
      tension: .3,
    }]
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Estadísticas</h1>
          <div className="sub">{sucursal} · {PERIODOS.find(p => p.id === periodo)?.label}</div>
        </div>
      </div>

      {/* Selector período */}
      <div className="periodo-tabs">
        {PERIODOS.map(p => (
          <div key={p.id} className={`periodo-tab${periodo === p.id ? ' active' : ''}`} onClick={() => setPeriodo(p.id)}>
            {p.label}
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="s-label">Ventas totales</div>
          <div className="s-val" style={{ color: 'var(--accent)' }}>${fmtInt(totalVentas)}</div>
        </div>
        <div className="stat-card">
          <div className="s-label">Facturas emitidas</div>
          <div className="s-val">{totalFacturas}</div>
        </div>
        <div className="stat-card">
          <div className="s-label">Ticket promedio</div>
          <div className="s-val">${fmtInt(ticketProm)}</div>
        </div>
        <div className="stat-card">
          <div className="s-label">IVA generado</div>
          <div className="s-val">${fmtInt(totalIva)}</div>
          <div className="s-sub">21% sobre ventas</div>
        </div>
      </div>

      {/* Gráfico ventas */}
      <div style={{ padding: '20px 28px 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 14 }}>
          Evolución de ventas
        </div>
        <div style={{ height: 220, paddingBottom: 20 }}>
          <Bar data={chartData} options={CHART_OPTS_BASE} />
        </div>
      </div>

      {/* Grids de detalle */}
      <div className="stats-detail-grid">

        {/* Top productos */}
        <div className="stats-panel">
          <h3>Top productos por facturación</h3>
          {topProductos.length === 0
            ? <div style={{ color: 'var(--muted2)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin datos</div>
            : topProductos.map(([nom, data]) => (
              <div key={nom} className="stat-bar-row">
                <span className="stat-bar-label" title={nom}>{nom}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${(data.total / maxProd * 100).toFixed(0)}%` }} />
                </div>
                <span className="stat-bar-val">${fmtInt(data.total)}</span>
              </div>
            ))}
        </div>

        {/* Por categoría */}
        <div className="stats-panel">
          <h3>Ventas por categoría</h3>
          {porCategoria.length === 0
            ? <div style={{ color: 'var(--muted2)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin datos</div>
            : porCategoria.map(([cat, total]) => (
              <div key={cat} className="stat-bar-row">
                <span className="stat-bar-label" title={cat}>{cat}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${(total / maxCat * 100).toFixed(0)}%`, background: 'var(--success)' }} />
                </div>
                <span className="stat-bar-val">${fmtInt(total)}</span>
              </div>
            ))}
        </div>

        {/* Clientes frecuentes */}
        <div className="stats-panel">
          <h3>Clientes más activos</h3>
          {topClientes.length === 0
            ? <div style={{ color: 'var(--muted2)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin datos</div>
            : topClientes.map(([nombre, data]) => (
              <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{nombre}</span>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>${fmtInt(data.total)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{data.compras} compra{data.compras !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
        </div>

        {/* KPIs extra */}
        <div className="stats-panel">
          <h3>Métricas del período</h3>
          <div className="kpi-grid">
            <div className="kpi-box">
              <div className="kpi-label">Ventas / día</div>
              <div className="kpi-val">${fmtInt(totalVentas / Math.max(1, (hasta - desde) / 86400000))}</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">Fact. / día</div>
              <div className="kpi-val">{((totalFacturas / Math.max(1, (hasta - desde) / 86400000))).toFixed(1)}</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">Ítems vendidos</div>
              <div className="kpi-val">{fmtInt(facsPeriodo.reduce((s, f) => s + (f.items || []).reduce((a, i) => a + i.cantidad, 0), 0))}</div>
            </div>
            <div className="kpi-box">
              <div className="kpi-label">Productos únicos</div>
              <div className="kpi-val">{new Set(facsPeriodo.flatMap(f => (f.items || []).map(i => i.id))).size}</div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
