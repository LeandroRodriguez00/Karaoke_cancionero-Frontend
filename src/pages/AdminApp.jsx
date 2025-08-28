// client/src/pages/AdminApp.jsx
import { useEffect, useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminQueue from './AdminQueue'
import { getJSON } from '@/api/http'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function AdminApp() {
  const [hasKey, setHasKey] = useState(!!localStorage.getItem('ADMIN_KEY'))
  const [checking, setChecking] = useState(hasKey) // solo chequea si había clave

  useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!hasKey) return
      setChecking(true)
      try {
        // ping protegido: si la key es mala, tira 401/403 y volvemos al login
        await getJSON('/api/admin/requests', { admin: true })
        if (!cancelled) setChecking(false)
      } catch (e) {
        if (!cancelled) {
          // clave inválida → limpiamos y pedimos login
          localStorage.removeItem('ADMIN_KEY')
          setHasKey(false)
          setChecking(false)
        }
      }
    }

    verify()
    return () => { cancelled = true }
  }, [hasKey])

  if (checking) {
    return (
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return hasKey
    ? <AdminQueue />
    : <AdminLogin onSuccess={() => setHasKey(true)} />
}
