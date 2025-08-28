import { useState, useEffect, useMemo, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import { postJSON } from '@/api/http'

const clean = (s) => (typeof s === 'string' ? s.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim() : '')

/**
 * Props:
 * - open, onClose
 * - presetSong?: { artist, title }
 * - defaultPerformer?: 'guest' | 'host'   (por defecto guest)
 * - defaultSource?: 'public' | 'quick'    (por defecto public)
 */
export default function RequestModal({ open, onClose, presetSong, defaultPerformer, defaultSource }) {
  const [fullName, setFullName] = useState('')
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' })

  // Prefill desde la canción (cuando viene del listado)
  useEffect(() => {
    if (presetSong?.artist) setArtist(presetSong.artist)
    if (presetSong?.title) setTitle(presetSong.title)
  }, [presetSong])

  // Recupero nombre usado previamente (comodidad)
  useEffect(() => {
    const saved = localStorage.getItem('karaoke_fullName')
    if (saved) setFullName(saved)
  }, [])

  const disabled = useMemo(() => {
    return (
      loading ||
      clean(fullName).length < 2 ||
      clean(artist).length < 1 ||
      clean(title).length < 1
    )
  }, [loading, fullName, artist, title])

  const handleClose = useCallback(() => {
    if (!loading) onClose?.()
  }, [loading, onClose])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const payload = {
        fullName: clean(fullName),
        artist: clean(artist),
        title: clean(title),
        notes: clean(notes) || undefined,
        ...(defaultPerformer ? { performer: defaultPerformer } : {}),
        ...(defaultSource ? { source: defaultSource } : {}),
      }
      await postJSON('/api/requests', payload)
      // Guardamos el nombre para próximos pedidos
      localStorage.setItem('karaoke_fullName', payload.fullName)
      setToast({ open: true, msg: '¡Pedido enviado! Te avisamos cuando te toque 🎤', severity: 'success' })
      // Limpiar lo no “preset”
      setNotes('')
      if (!presetSong) { setArtist(''); setTitle('') }
      handleClose()
    } catch (e) {
      setToast({ open: true, msg: e.message || 'Error al enviar el pedido', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Enter para enviar si no está deshabilitado
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 🆕 Título dinámico según performer
  const titleText = defaultPerformer === 'host' ? 'Pedile al cantante' : 'Pedí tu canción'

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{titleText}</DialogTitle>
        <DialogContent dividers onKeyDown={onKeyDown}>
          {defaultPerformer === 'host' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Este pedido es para que la <b>cante el cantante/host</b>.
            </Alert>
          )}

          {presetSong && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
              <Chip label={`Artista: ${artist || ''}`} />
              <Chip label={`Canción: ${title || ''}`} />
            </Stack>
          )}

          <Stack spacing={2}>
            <TextField
              label="Nombre y apellido *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              inputProps={{ maxLength: 80 }}
              required
            />
            <TextField
              label="Artista *"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              inputProps={{ maxLength: 120 }}
              required
            />
            <TextField
              label="Canción *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              inputProps={{ maxLength: 180 }}
              required
            />
            <TextField
              label="Observaciones"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={2}
              inputProps={{ maxLength: 500 }}
              helperText="Opcional (tono, dedicatoria, etc.)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={disabled}>
            {loading ? 'Enviando...' : 'Enviar pedido'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
