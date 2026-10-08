import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getAuthInstance, getDB } from '../lib/firebase'

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null)
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    let generation = 0
    const unsubscribe = onAuthStateChanged(getAuthInstance(), async current => {
      const check = ++generation
      setUser(current); setAllowed(false); setChecking(true); setError('')
      try {
        const permission = current ? await getDoc(doc(getDB(), 'access', current.uid)) : null
        if (active && check === generation) {
          setAllowed(permission?.exists() && permission.data().enabled === true)
          if (current && !(permission?.exists() && permission.data().enabled === true)) setError('Tu cuenta todavía no tiene acceso a este comercio.')
        }
      } catch { if (active && check === generation) setError('No se pudo verificar el acceso. Revisá la conexión y los permisos.') }
      finally { if (active && check === generation) setChecking(false) }
    })
    return () => { active = false; unsubscribe() }
  }, [])
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password); setPassword('') }
    catch { setError('No se pudo ingresar. Revisá tu email, contraseña y conexión.') }
    finally { setBusy(false) }
  }
  if (checking) return <p role="status">Verificando acceso…</p>
  if (allowed) return <><div style={{padding:12,textAlign:'right'}}>{user.email} <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance()).catch(() => setError('No se pudo cerrar la sesión.'))}>Cerrar sesión</button></div>{children}</>
  return <section className="config-wrap"><h1>Ingresar al comercio</h1>
    <p>Usá la cuenta habilitada por el administrador.</p>
    {error && <p role="alert">{error}</p>}
    {!user ? <form onSubmit={login}>
      <div className="form-group"><label htmlFor="login-email">Email</label><input id="login-email" type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="form-group"><label htmlFor="login-password">Contraseña</label><input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
    </form> : <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance()).catch(() => setError('No se pudo cerrar la sesión.'))}>Usar otra cuenta</button>}
  </section>
}
