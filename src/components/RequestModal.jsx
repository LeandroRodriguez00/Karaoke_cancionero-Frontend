import { useState, useEffect, useMemo, useCallback } from 'react'
import { alpha } from '@mui/material/styles'
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
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import RequestPageIcon from '@mui/icons-material/RequestPage'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import { postJSON } from '@/api/http'

const COLORS = {
  app: '#0f141a',
  paper: '#1b222a',        // fondo del modal
  field: '#2a313b',        // fondo inputs
  fieldHover: '#323a46',
  fieldFocus: '#3a4452',
  text: '#e6eef6',
  textMuted: 'rgba(230,238,246,0.72)',
  divider: 'rgba(255,255,255,0.08)',
  primary: '#7fb5ff',
}

const clean = (s) =>
  typeof s === 'string' ? s.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim() : ''

export default function RequestModal({
  open,
  onClose,
  presetSong,
  defaultPerformer,
  defaultSource,
}) {
  const [fullName, setFullName] = useState('')
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' })

  useEffect(() => {
    if (presetSong?.artist) setArtist(presetSong.artist)
    if (presetSong?.title) setTitle(presetSong.title)
  }, [presetSong])

  useEffect(() => {
    const saved = localStorage.getItem('karaoke_fullName')
    if (saved) setFullName(saved)
  }, [])

  const notesCount = notes.length
  const notesHelper = useMemo(
    () => `${notesCount}/500 · Opcional (tono, dedicatoria, etc.)`,
    [notesCount]
  )

  const disabled = useMemo(
    () =>
      loading ||
      clean(fullName).length < 2 ||
      clean(artist).length < 1 ||
      clean(title).length < 1,
    [loading, fullName, artist, title]
  )

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
        observaciones: clean(notes) || undefined, // compat
        ...(defaultPerformer ? { performer: defaultPerformer } : {}),
        ...(defaultSource ? { source: defaultSource } : {}),
      }
      await postJSON('/api/requests', payload)
      localStorage.setItem('karaoke_fullName', payload.fullName)
      setToast({ open: true, msg: '¡Pedido enviado! Te avisamos cuando te toque 🎤', severity: 'success' })
      setNotes('')
      if (!presetSong) { setArtist(''); setTitle('') }
      handleClose()
    } catch (e) {
      setToast({ open: true, msg: e.message || 'Error al enviar el pedido', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !disabled) { e.preventDefault(); handleSubmit() }
  }

  const titleText = defaultPerformer === 'host' ? 'Pedile al cantante' : 'Pedí tu canción'

  // Estilo para inputs "filled" (sin depender del theme)
  const filledStyle = {
    '& .MuiFilledInput-root': {
      backgroundColor: COLORS.field,
      borderRadius: 14,
      color: COLORS.text,
      '&:hover': { backgroundColor: COLORS.fieldHover },
      '&.Mui-focused': { backgroundColor: COLORS.fieldFocus },
      '&:before, &:after': { borderBottom: 'none !important' }, // sin subrayado
      '& input, & textarea': { color: COLORS.text },
    },
    '& .MuiInputLabel-root': { color: COLORS.textMuted },
    '& .MuiFormHelperText-root': { color: COLORS.textMuted },
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 20,
            border: `1px solid ${COLORS.divider}`,
            bgcolor: COLORS.paper,
            color: COLORS.text,
            backgroundImage: 'none',
            boxShadow: '0 20px 50px rgba(0,0,0,.55)',
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(6px)',
              backgroundColor: alpha(COLORS.app, 0.7),
            },
          },
        }}
      >
        {/* Header oscuro con acento */}
        <DialogTitle
          sx={{
            p: 2.5, pb: 1.5,
            background: `linear-gradient(180deg, ${alpha(COLORS.primary, 0.22)} 0%, transparent 80%)`,
            color: COLORS.text,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(COLORS.primary, 0.22),
                color: '#0e1320',
                display: 'inline-flex',
              }}
            >
              <RequestPageIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.text }}>
                {titleText}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.75, color: COLORS.textMuted }}>
                Completá tus datos y listo. ¡Te llamamos!
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          onKeyDown={onKeyDown}
          sx={{
            pt: 2,
            background: `linear-gradient(90deg, ${alpha(COLORS.primary, 0.06)} 0%, transparent 70%)`,
            '&.MuiDialogContent-dividers': {
              borderTopColor: COLORS.divider,
              borderBottomColor: COLORS.divider,
            },
            color: COLORS.text,
          }}
        >
          {presetSong && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
              <QueueMusicIcon fontSize="small" htmlColor={COLORS.textMuted} />
              <Chip
                size="small"
                label={`Artista: ${artist || ''}`}
                sx={{ bgcolor: alpha(COLORS.primary, 0.18), color: COLORS.text }}
              />
              <Chip
                size="small"
                label={`Canción: ${title || ''}`}
                sx={{ bgcolor: alpha(COLORS.primary, 0.18), color: COLORS.text }}
              />
            </Stack>
          )}

          <Stack spacing={2}>
            <TextField
              variant="filled"
              label="Nombre y apellido *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              inputProps={{ maxLength: 80 }}
              required
              fullWidth
              sx={filledStyle}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                variant="filled"
                label="Artista *"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                inputProps={{ maxLength: 120 }}
                required
                fullWidth
                sx={filledStyle}
              />
              <TextField
                variant="filled"
                label="Canción *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                inputProps={{ maxLength: 180 }}
                required
                fullWidth
                sx={filledStyle}
              />
            </Stack>

            <TextField
              variant="filled"
              label="Observaciones"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              multiline
              minRows={3}
              inputProps={{ maxLength: 500 }}
              helperText={notesHelper}
              fullWidth
              sx={filledStyle}
            />
          </Stack>

          <Divider sx={{ my: 2, borderColor: COLORS.divider }} />

          <Typography variant="caption" sx={{ opacity: 0.75, color: COLORS.textMuted }}>
            Al enviar aceptás aparecer en la cola del karaoke. ¡Ajustá tu tono en las observaciones si lo necesitás!
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={disabled}>
            {loading ? 'Enviando…' : 'Enviar pedido'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          variant="filled"
          severity={toast.severity}
          sx={{
            width: '100%',
            bgcolor:
              toast.severity === 'success'
                ? alpha('#2e7d32', 0.25)
                : alpha('#d32f2f', 0.25),
            color:
              toast.severity === 'success'
                ? '#a5d6a7'
                : '#ef9a9a',
          }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
