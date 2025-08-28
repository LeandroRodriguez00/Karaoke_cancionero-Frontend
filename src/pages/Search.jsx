import { useEffect, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import SongList from '@/components/SongList'
import { getJSON } from '@/api/http'

// Normalización cliente (extra a la del server): quita tildes, baja a minúsculas, colapsa espacios.
const norm = (s = '') =>
  s
    .normalize?.('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacríticos
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export default function Search() {
  const [q, setQ] = useState('')
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Para evitar disparar búsqueda por cada tecla: debounce 300ms
  const debouncedQ = useDebounce(q, 300)

  useEffect(() => {
    let cancelled = false
    const fetchSongs = async () => {
      setLoading(true)
      setError('')
      try {
        const qn = norm(debouncedQ)
        const path = `/api/songs${qn ? `?q=${encodeURIComponent(qn)}` : ''}`
        const res = await getJSON(path)
        if (!cancelled) {
          // Soporta respuesta como {items: []} o [] según tu implementación
          setSongs(Array.isArray(res) ? res : res?.items || [])
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al buscar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSongs()
    return () => { cancelled = true }
  }, [debouncedQ])

  const clear = () => setQ('')

  const resultsLabel = useMemo(() => {
    if (loading) return 'Buscando...'
    if (error) return 'Ocurrió un error'
    if (!songs?.length) return debouncedQ ? 'Sin resultados' : 'Explorá el catálogo'
    return `${songs.length} resultado${songs.length !== 1 ? 's' : ''}`
  }, [loading, error, songs, debouncedQ])

  return (
    <Stack spacing={2} sx={{ py: 3 }}>
      <TextField
        label="Buscar artista o canción"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: q ? (
            <InputAdornment position="end">
              <IconButton aria-label="Limpiar búsqueda" onClick={clear} edge="end">
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        helperText="Tip: probá sin tildes o con mayúsculas/minúsculas, la búsqueda es flexible."
      />

      <Typography variant="caption" color="text.secondary">
        {resultsLabel}
      </Typography>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <SongList songs={songs} loading={loading} />
      )}
    </Stack>
  )
}

/** Hook de debounce simple */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
