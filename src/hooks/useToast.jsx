import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, dur = 3000) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
