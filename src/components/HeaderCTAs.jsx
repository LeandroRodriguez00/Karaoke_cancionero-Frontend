import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { useRequestModal } from '@/context/RequestModalContext'

/**
 * Botones superiores para abrir el flujo de pedidos.
 * - "Pedí tu canción"  -> performer: 'guest'
 * - "Sugerir al cantante" -> performer: 'host'
 *
 * Props opcionales:
 * - size: 'small' | 'medium' | 'large' (default: 'large')
 */
export default function HeaderCTAs({ size = 'large' }) {
  const { openGuest, openHost } = useRequestModal()

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ width: '100%', alignItems: 'center' }}
    >
      <Button
        size={size}
        variant="contained"
        onClick={() => openGuest()}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        Pedí tu canción
      </Button>

      <Button
        size={size}
        variant="outlined"
        onClick={() => openHost()}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        Sugerir al cantante
      </Button>
    </Stack>
  )
}
