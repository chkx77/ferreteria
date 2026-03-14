import { useState, useCallback } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, limit, serverTimestamp, increment, writeBatch, Timestamp
} from 'firebase/firestore'
import { getDB } from '../lib/firebase'

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
    const ref = await addDoc(col('facturas'), {
      ...factura,
      fecha: Timestamp.fromDate(new Date()),
      created_at: serverTimestamp(),
    })
    const batch = writeBatch(getDB())
    for (const it of items) {
      batch.update(doc(getDB(), 'inventario', it.id), {
        stock: increment(-it.cantidad)
      })
    }
    await batch.commit()
    return ref.id
  }, [])

  const recibirCompraDB = useCallback(async (compraId, items) => {
    const batch = writeBatch(getDB())
    batch.update(doc(getDB(), 'compras', compraId), {
      estado: 'Recibido',
      recibido_at: serverTimestamp(),
    })
    for (const it of items) {
      const updates = { stock: increment(it.cantidad) }
      if (it.precio_costo > 0) updates.precio_costo = it.precio_costo
      batch.update(doc(getDB(), 'inventario', it.id), updates)
    }
    await batch.commit()
  }, [])

  return { loading, load, add, update, remove, confirmarVentaDB, recibirCompraDB }
}
