import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import MicIcon from '@mui/icons-material/Mic'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import { useRequestModal } from '@/context/RequestModalContext'

export default function SongActionModal({ open, onClose, song }) {
  const { openGuest, openHost } = useRequestModal()
  const disabled = !song

  const chooseGuest = () => {
    if (!song) return
    openGuest({ artist: song.artist, title: song.title })
    onClose?.()
  }

  const chooseHost = () => {
    if (!song) return
    openHost({ artist: song.artist, title: song.title })
    onClose?.()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>¿Cómo querés pedirla?</DialogTitle>
      <DialogContent dividers>
        {song && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
            <Chip label={`Artista: ${song.artist}`} />
            <Chip label={`Canción: ${song.title}`} />
          </Stack>
        )}
        <Typography sx={{ mb: 2 }}>
          Elegí si la cantás vos o si preferís que la cante el cantante/host.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<MicIcon />}
            onClick={chooseGuest}
            disabled={disabled}
          >
            Cantar esta canción
          </Button>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            startIcon={<RecordVoiceOverIcon />}
            onClick={chooseHost}
            disabled={disabled}
          >
            Pedile al cantante
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  )
}
