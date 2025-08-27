import { useMemo, useCallback, useRef } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { normalizeText } from '../utils/normalize'

export default function SearchBox({ value, onChange, autoFocus = true, onClear }) {
  const inputRef = useRef(null)

  const helper = useMemo(() => {
    if (!value) return 'Buscá por artista, canción o género'
    return `Buscando: ${normalizeText(value)}`
  }, [value])

  const handleClear = useCallback(() => {
    onChange('')
    if (onClear) onClear()
    // re-enfocar para seguir tipeando
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onChange, onClear])

  const handleKeyDown = useCallback((e) => {
    // ESC limpia
    if (e.key === 'Escape' && value) {
      e.preventDefault()
      handleClear()
    }
    // Ctrl/Cmd + K: selecciona todo para reescribir rápido (UX común)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      const el = inputRef.current
      if (el) {
        el.focus()
        el.select?.()
      }
    }
  }, [value, handleClear])

  return (
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
  )
}
