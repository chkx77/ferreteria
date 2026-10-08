export function groupItems(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('Agregá productos.');
  const grouped = new Map();
  for (const item of items) {
    const quantity = Number(item.cantidad);
    if (!item.id || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Cantidad inválida.');
    const previous = grouped.get(item.id);
    grouped.set(item.id, { ...item, cantidad: quantity + (previous?.cantidad || 0) });
  }
  return [...grouped.values()];
}

export function remainingStock(product, quantity) {
  const stock = Number(product.stock);
  if (!Number.isFinite(stock) || stock < quantity) throw new Error(`Stock insuficiente de ${product.nombre || 'producto'}.`);
  return stock - quantity;
}

export function saleTotals(items, discount) {
  const percentage = Number(discount);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error('El descuento debe estar entre 0 y 100.');
  let subtotal = 0;
  for (const item of items) {
    if (!Number.isFinite(Number(item.precio)) || Number(item.precio) < 0 || !Number.isFinite(Number(item.cantidad)) || Number(item.cantidad) <= 0) throw new Error('Precio o cantidad inválidos.');
    subtotal += Math.round(Number(item.precio) * Number(item.cantidad) * 100);
  }
  const descuento = Math.round(subtotal * percentage / 100);
  const base = subtotal - descuento;
  const iva = Math.round(base * 0.21);
  return { subtotal: subtotal / 100, descuento: descuento / 100, iva: iva / 100, total: (base + iva) / 100 };
}
