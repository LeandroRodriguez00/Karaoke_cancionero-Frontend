// client/src/pages/AdminLogin.jsx
import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import KeyIcon from '@mui/icons-material/Key'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { getJSON } from '@/api/http'

export default function AdminLogin({ onSuccess }) {
  const [value, setValue] = useState(localStorage.getItem('ADMIN_KEY') || '')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' })

  const notify = (msg, sev = 'info') =>
    setSnack({ open: true, msg, sev })

  const handleSaveOnly = () => {
    const v = value.trim()
    if (!v) return notify('Ingresá la contraseña', 'warning')
    localStorage.setItem('ADMIN_KEY', v)
    notify('Contraseña guardada localmente', 'success')
  }

  const handleClear = () => {
    localStorage.removeItem('ADMIN_KEY')
    setValue('')
    notify('Contraseña eliminada del navegador', 'info')
  }

  const handleTestAndEnter = async (e) => {
    e?.preventDefault?.()
    const v = value.trim()
    if (!v) return notify('Ingresá la contraseña', 'warning')

    localStorage.setItem('ADMIN_KEY', v) // guardo antes para que http.js la inyecte
    setLoading(true)
    try {
      // Ping protegido para validar la clave: intenta listar (no importa el contenido)
      await getJSON('/api/admin/requests', { admin: true })
      notify('Acceso verificado. ¡Bienvenido!', 'success')
      onSuccess?.()
    } catch (err) {
      // Si falla, limpio para evitar confusiones
      localStorage.removeItem('ADMIN_KEY')
      notify(err.message || 'Clave inválida', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Ingreso Admin</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ingresá la contraseña del panel (se guarda <b>sólo</b> en tu navegador).
          </Typography>

          <form onSubmit={handleTestAndEnter}>
            <Stack spacing={2}>
              <TextField
                label="Contraseña Admin"
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="mostrar contraseña"
                        onClick={() => setShow(s => !s)}
                        edge="end"
                      >
                        {show ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<DeleteForeverIcon />}
                  onClick={handleClear}
                >
                  Borrar clave
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleSaveOnly}
                >
                  Guardar
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  disabled={loading}
                >
                  {loading ? 'Verificando…' : 'Probar y entrar'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={2600}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Container>
  )
}
