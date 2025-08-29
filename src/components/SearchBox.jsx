// client/src/components/SearchBox.jsx
import { useMemo, useCallback, useRef } from 'react'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import MicIcon from '@mui/icons-material/Mic'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import { useRequestModal } from '@/context/RequestModalContext'
import { normalizeText } from '../utils/normalize'

export default function SearchBox({ value, onChange, autoFocus = true, onClear }) {
  const inputRef = useRef(null)
  const { openGuest, openHost } = useRequestModal()

  const helper = useMemo(() => {
    if (!value) return 'Buscá por artista, canción o género'
    return `Buscando: ${normalizeText(value)}`
  }, [value])

  const handleClear = useCallback(() => {
    onChange('')
    onClear?.()
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onChange, onClear])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault()
      handleClear()
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      const el = inputRef.current
      el?.focus()
      el?.select?.()
    }
  }, [value, handleClear])

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {/* Botones arriba */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<MicIcon />}
          onClick={() => openGuest()} // formulario vacío (canta el usuario)
          sx={{ borderRadius: 9999, px: 2.5, fontWeight: 700, alignSelf: { xs: 'stretch', md: 'auto' } }}
        >
          Pedir una canción para cantar
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<RecordVoiceOverIcon />}
          onClick={() => openHost()} // formulario vacío (canta el host)
          sx={{ borderRadius: 9999, px: 2.5, fontWeight: 700, alignSelf: { xs: 'stretch', md: 'auto' } }}
        >
          Sugerir al cantante que cante una canción
        </Button>
      </Stack>

      {/* Búsqueda debajo */}
      <TextField
        fullWidth
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ej: paez, fito, soda, rock, balada…"
        helperText={helper}
        inputRef={inputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title="Buscar">
                <SearchIcon />
              </Tooltip>
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <Tooltip title="Limpiar (Esc)">
                <IconButton
                  aria-label="Limpiar búsqueda"
                  size="small"
                  edge="end"
                  onClick={handleClear}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : null,
          inputMode: 'search',
        }}
        size="medium"
        variant="outlined"
        aria-label="Buscador de canciones por artista, título o género"
      />
    </Stack>
  )
}
