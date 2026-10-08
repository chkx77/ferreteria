import { initializeApp, getApps, deleteApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

let dbInstance = null
let authInstance = null

export async function initFirebase(cfg) {
  await Promise.all(getApps().map(a => deleteApp(a)))
  const app = initializeApp(cfg)
  dbInstance = getFirestore(app)
  authInstance = getAuth(app)
  return dbInstance
}

export function getAuthInstance() { return authInstance }

export function getDB() {
  return dbInstance
}
