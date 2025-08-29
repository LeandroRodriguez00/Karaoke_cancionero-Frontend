import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import { useRequestModal } from '@/context/RequestModalContext'

export default function Home() {
  const { openHost } = useRequestModal()

  return (
    <Stack spacing={3} alignItems="center" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
        Cancionero Karaoke
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'center' }}>
        Elegí si la cantás vos o si querés sugerir que la cante el cantante 🎤
      </Typography>

      <Button
        size="large"
        variant="outlined"
        startIcon={<RecordVoiceOverIcon />}
        onClick={() => openHost()}               // formulario vacío (canta el host)
        sx={{ borderRadius: 9999, px: 2.5, fontWeight: 700 }}
      >
        Sugerir al cantante que cante una canción
      </Button>
    </Stack>
  )
}
