import { useState } from 'react'
import { initFirebase } from '../lib/firebase'
import { useToast } from './UI'

export default function Config({ onConnected }) {
  const toast = useToast()
  const saved = (() => { try { return JSON.parse(localStorage.getItem('fb_config') || 'null') } catch { return null } })()
  const empty = { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' }
  const [form, setForm] = useState({ ...empty, ...saved })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function conectar() {
    if (!form.apiKey || !form.projectId) { toast('API Key y Project ID son obligatorios'); return }
    try {
      initFirebase(form)
      localStorage.setItem('fb_config', JSON.stringify(form))
      toast('Firebase conectado ✓')
      onConnected()
    } catch (e) { toast('Error: ' + e.message) }
  }

  function desconectar() {
    if (!window.confirm('¿Desconectar Firebase?')) return
    localStorage.removeItem('fb_config')
    setForm(empty)
    toast('Desconectado')
    onConnected(false)
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Firebase Config</h1><div className="sub">Credenciales de conexión</div></div>
      </div>
      <div className="config-wrap">
        <div className="config-note">
          Ingresá las credenciales de tu proyecto Firebase.<br />
          Consola → Tu proyecto → Configuración → SDK web.<br />
          Se guardan en el browser. Nunca se envían a servidores externos.
        </div>

        <div className="form-group"><label>API Key</label><input value={form.apiKey} onChange={set('apiKey')} /></div>
        <div className="form-grid-2">
          <div className="form-group"><label>Auth Domain</label><input value={form.authDomain} onChange={set('authDomain')} placeholder="tu-proyecto.firebaseapp.com" /></div>
          <div className="form-group"><label>Project ID</label><input value={form.projectId} onChange={set('projectId')} /></div>
        </div>
        <div className="form-grid-2">
          <div className="form-group"><label>Storage Bucket</label><input value={form.storageBucket} onChange={set('storageBucket')} placeholder="tu-proyecto.appspot.com" /></div>
          <div className="form-group"><label>Messaging Sender ID</label><input value={form.messagingSenderId} onChange={set('messagingSenderId')} /></div>
        </div>
        <div className="form-group"><label>App ID</label><input value={form.appId} onChange={set('appId')} /></div>

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn btn-primary" onClick={conectar}>Conectar</button>
          {saved && <button className="btn btn-danger" onClick={desconectar}>Desconectar</button>}
        </div>

        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 10, letterSpacing: '.09em', textTransform: 'uppercase' }}>Reglas Firestore (desarrollo)</div>
          <pre className="code-block">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--accent)' }}>Colecciones utilizadas:</strong><br />
            <span style={{ color: 'var(--text)' }}>inventario</span> · <span style={{ color: 'var(--text)' }}>proveedores</span> · <span style={{ color: 'var(--text)' }}>facturas</span> · <span style={{ color: 'var(--text)' }}>compras</span>
          </div>
        </div>
      </div>
    </>
  )
}
