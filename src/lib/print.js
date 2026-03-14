import { fmt, fmtDate } from './utils'

export function imprimirFactura(f) {
  const win = window.open('', '_blank', 'width=750,height=900')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Factura ${f.numero}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Courier New',monospace;font-size:12px;color:#111;background:#fff;padding:32px}.hdr{border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end}.brand{font-size:22px;font-weight:900;letter-spacing:-.02em}.brand small{font-size:11px;font-weight:400;color:#666;display:block}.num{text-align:right;font-size:18px;font-weight:700}.num small{font-size:11px;font-weight:400;color:#666;display:block}.cli{background:#f8f8f8;border:1px solid #ddd;padding:10px 14px;margin-bottom:16px;border-radius:4px}.lbl{font-size:10px;color:#888;letter-spacing:.08em;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:12px}th{text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #ccc;padding:6px 8px}td{padding:7px 8px;border-bottom:1px solid #eee;font-size:12px}.r{text-align:right}.tots{margin-left:auto;width:260px}.tr{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid #eee}.ttot{font-size:16px;font-weight:900;padding-top:8px;border-top:2px solid #111;margin-top:6px}.foot{margin-top:32px;border-top:1px solid #ccc;padding-top:12px;font-size:10px;color:#888;text-align:center}@media print{body{padding:16px}}</style>
</head><body>
<div class="hdr">
  <div><div class="brand">FERRETERÍA PRO<small>Sistema de Gestión</small></div></div>
  <div><div class="num">${f.numero}<small>${fmtDate(f.fecha, true)}</small></div></div>
</div>
<div class="cli"><div class="lbl">Cliente</div><div style="font-size:14px;font-weight:700;margin-top:4px">${f.cliente?.nombre || 'Consumidor final'}</div>${f.cliente?.dni ? `<div style="color:#666">DNI/CUIT: ${f.cliente.dni}</div>` : ''}</div>
<table><thead><tr><th>Producto</th><th>Cant.</th><th class="r">P. Unitario</th><th class="r">Total</th></tr></thead>
<tbody>${(f.items || []).map(it => `<tr><td>${it.nombre}</td><td>${it.cantidad} ${it.unidad || ''}</td><td class="r">$${fmt(it.precio)}</td><td class="r">$${fmt(it.total)}</td></tr>`).join('')}</tbody></table>
<div class="tots">
  <div class="tr"><span>Subtotal</span><span>$${fmt(f.subtotal)}</span></div>
  ${f.descuento > 0 ? `<div class="tr"><span>Descuento</span><span>−$${fmt(f.descuento)}</span></div>` : ''}
  <div class="tr"><span>IVA 21%</span><span>$${fmt(f.iva)}</span></div>
  <div class="tr ttot"><span>TOTAL</span><span>$${fmt(f.total)}</span></div>
</div>
<div class="foot">Documento no válido como comprobante fiscal · FERRETERÍA PRO</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`)
  win.document.close()
}
