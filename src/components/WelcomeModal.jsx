import { useState, useMemo, forwardRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Grow from '@mui/material/Grow'

import CelebrationIcon from '@mui/icons-material/Celebration'
import SearchIcon from '@mui/icons-material/Search'
import MicIcon from '@mui/icons-material/Mic'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'

export function shouldShowWelcome(storageKey = 'karaoke_welcome_v1') {
  try {
    return !localStorage.getItem(storageKey)
  } catch {
    return true
  }
}

// Transición suave (zoom+fade)
const Transition = forwardRef(function Transition(props, ref) {
  return <Grow ref={ref} {...props} />
})

export default function WelcomeModal({
  open,
  onClose,
  storageKey = 'karaoke_welcome_v1',
}) {
  const [dontShow, setDontShow] = useState(true) // recuerda por defecto

  const stepItems = useMemo(
    () => [
      { icon: <SearchIcon />, text: 'Buscá por artista, canción o género' },
      { icon: <MicIcon />, text: 'Si encontraste la canción presionala y pedila' },
      { icon: <RecordVoiceOverIcon />, text: 'Si no la encontraste, pedila igual: ¡la buscamos!' },
      { icon: <QueueMusicIcon />, text: 'Una vez enviado el pedido, relajá y tomá algo rico 🍺' },
      { icon: <NotificationsActiveIcon />, text: 'Cuando te llamemos, ¡al escenario! 😁' },
    ],
    []
  )

  const markAsSeen = () => {
    try {
      if (dontShow) localStorage.setItem(storageKey, '1')
    } catch {}
  }

  const handleClose = () => {
    markAsSeen()
    onClose?.()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      keepMounted
      TransitionComponent={Transition}
      transitionDuration={{ appear: 260, enter: 220, exit: 180 }}
      // v5
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(6,10,14,.72)',     // oscurece el fondo
          backdropFilter: 'saturate(140%) blur(6px)',// leve blur para foco
        },
      }}
      // v6
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(6,10,14,.72)',
            backdropFilter: 'saturate(140%) blur(6px)',
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: 24,
        },
      }}
    >
      {/* Header con gradiente */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: (t) =>
            `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,.15)',
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CelebrationIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
              ¡Bienvenid@ al Karaoke!
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              Ya falta poco para arrancar!!! 🎤
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={1.25} sx={{ mb: 2 }}>
          {stepItems.map((s, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: 'action.hover',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'text.secondary',
                  flex: '0 0 auto',
                }}
              >
                {s.icon}
              </Box>
              <Typography>{s.text}</Typography>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ mt: 1 }} />

        <Typography variant="body2" sx={{ mt: 2, opacity: 0.85 }}>
          Info: también podés pedirle que cante una canción a Lean… ¡Eso si, el protagonista sos vos!
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
          }
          label="No volver a mostrar en este dispositivo"
          sx={{ mr: 'auto' }}
        />
        <Button onClick={handleClose} variant="contained">
          ¡Entendido!
        </Button>
      </DialogActions>
    </Dialog>
  )
}
