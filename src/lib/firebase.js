import { initializeApp, getApps, deleteApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

let dbInstance = null

export function initFirebase(cfg) {
  if (getApps().length) getApps().forEach(a => deleteApp(a))
  const app = initializeApp(cfg)
  dbInstance = getFirestore(app)
  return dbInstance
}

export function getDB() {
  return dbInstance
}
