import { useState, useCallback } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, limit, serverTimestamp, runTransaction, Timestamp
} from 'firebase/firestore'
import { getDB } from '../lib/firebase'
import { groupItems, remainingStock, saleTotals } from '../lib/sales'

function col(name) { return collection(getDB(), name) }

export function useFirestore() {
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (colName, orderField = 'nombre', lim = 200) => {
    setLoading(true)
    try {
      const q = query(col(colName), orderBy(orderField), limit(lim))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally { setLoading(false) }
  }, [])

  const add = useCallback(async (colName, data) => {
    return addDoc(col(colName), { ...data, created_at: serverTimestamp(), updated_at: serverTimestamp() })
  }, [])

  const update = useCallback(async (colName, id, data) => {
    return updateDoc(doc(getDB(), colName, id), { ...data, updated_at: serverTimestamp() })
  }, [])

  const remove = useCallback(async (colName, id) => {
    return deleteDoc(doc(getDB(), colName, id))
  }, [])

  const confirmarVentaDB = useCallback(async (factura, items) => {
    const lines = groupItems(items)
    const ref = doc(col('facturas'), factura.numero)
    await runTransaction(getDB(), async tx => {
      const existing = await tx.get(ref)
      if (existing.exists()) throw new Error('Esta venta ya fue registrada.')
      const refs = lines.map(it => doc(getDB(), 'inventario', it.id))
      const snapshots = await Promise.all(refs.map(r => tx.get(r)))
      const stocks = snapshots.map((snapshot, i) => {
        if (!snapshot.exists()) throw new Error('Un producto ya no existe.')
        return remainingStock(snapshot.data(), lines[i].cantidad)
      })
      const totals = saleTotals(items, factura.descuentoPorcentaje || 0)
      tx.set(ref, { ...factura, ...totals, fecha: Timestamp.fromDate(new Date()), created_at: serverTimestamp() })
      refs.forEach((r, i) => tx.update(r, { stock: stocks[i], updated_at: serverTimestamp() }))
    })
    return ref.id
  }, [])

  const recibirCompraDB = useCallback(async (compraId, items) => {
    await runTransaction(getDB(), async tx => {
      const purchaseRef = doc(getDB(), 'compras', compraId)
      const purchase = await tx.get(purchaseRef)
      if (!purchase.exists() || purchase.data().estado !== 'Pendiente') throw new Error('La compra no está pendiente.')
      const lines = groupItems(purchase.data().items)
      const refs = lines.map(it => doc(getDB(), 'inventario', it.id))
      const snapshots = await Promise.all(refs.map(r => tx.get(r)))
      snapshots.forEach(snapshot => {
        if (!snapshot.exists() || !Number.isFinite(Number(snapshot.data().stock))) throw new Error('Inventario inválido.')
      })
      refs.forEach((r, i) => {
        const updates = { stock: Number(snapshots[i].data().stock) + lines[i].cantidad }
        if (Number(lines[i].precio_costo) > 0) updates.precio_costo = Number(lines[i].precio_costo)
        tx.update(r, updates)
      })
      tx.update(purchaseRef, { estado: 'Recibido', recibido_at: serverTimestamp() })
    })
  }, [])

  return { loading, load, add, update, remove, confirmarVentaDB, recibirCompraDB }
}
