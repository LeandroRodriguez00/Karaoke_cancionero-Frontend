import { useEffect, useMemo, useState, useTransition, useDeferredValue, useCallback } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import RequestPageIcon from '@mui/icons-material/RequestPage'

import theme from './theme'
import './styles.css'

import SearchBox from './components/SearchBox'
import GroupedSongList from './components/GroupedSongList'
import FullSongVirtualList from './components/FullSongVirtualList'
import ScrollTopFab from './components/ScrollTopFab' // ⬅️ nuevo

import { normalizeText } from './utils/normalize'
import { useDebounce } from './hooks/useDebounce'
import { fetchSongs } from './services/songs'

function LoadingList() {
  return (
    <List dense>
      {Array.from({ length: 8 }).map((_, i) => (
        <ListItem key={i}>
          <ListItemText primary={<Skeleton width="45%" />} secondary={<Skeleton width="25%" />} />
        </ListItem>
      ))}
    </List>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grouped') // 'grouped' | 'all'
  const debounced = useDebounce(query, 350)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Aplicar resultados en baja prioridad (no bloquea tipeo)
  const [isPending, startTransition] = useTransition()
  // Diferir el render del listado (suaviza cambios grandes)
  const deferredSongs = useDeferredValue(songs)

  const normalizedQuery = useMemo(() => normalizeText(debounced), [debounced])

  const handleSongClick = useCallback((s) => {
    // Etapa 4: abrir modal y prellenar artist/title
    alert(`(Etapa 4) Pedir: ${s.artist} — ${s.title}`)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const go = async () => {
      setLoading(true)
      setError('')
      try {
        const items = await fetchSongs({
          q: normalizedQuery,
          limit: 'all',           // backend controla SONGS_MAX_LIMIT
          signal: controller.signal,
        })
        if (!active) return
        // Aplicamos los items en baja prioridad
        startTransition(() => { setSongs(items) })
      } catch (err) {
        if (active && err.name !== 'AbortError') setError('No se pudo cargar el cancionero')
      } finally {
        if (active) setLoading(false)
      }
    }

    go()
    return () => {
      active = false
      controller.abort()
    }
  }, [normalizedQuery, startTransition])

  const showLoading = loading || isPending

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        {/* Hero */}
        <Box sx={{ py: { xs: 4, md: 6 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h2" gutterBottom>
                Cancionero Karaoke
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.85 }}>
                Buscá tu tema y ¡pedilo al toque!
              </Typography>
            </Box>
            <Button
              size="large"
              variant="contained"
              startIcon={<RequestPageIcon />}
              onClick={() => alert('Próximamente (Etapa 4): formulario "Pedí tu canción"')}
            >
              Pedí tu canción
            </Button>
          </Stack>
        </Box>

        {/* Buscador + Toggle de vista */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <SearchBox value={query} onChange={setQuery} />
            </Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, v) => v && setView(v)}
            >
              <ToggleButton value="grouped">Por artista</ToggleButton>
              <ToggleButton value="all">Todo</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        {/* Contenido */}
        <Box sx={{ mb: 3 }}>
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : showLoading ? (
            <LoadingList />
          ) : view === 'grouped' ? (
            <GroupedSongList
              songs={deferredSongs}
              // no pasamos 'loading' aquí para evitar renders extra
              onSongClick={handleSongClick}
            />
          ) : (
            <FullSongVirtualList
              songs={deferredSongs}
              // si tu FullSongVirtualList usa loading, podrías pasar false
              loading={false}
              height={600}
              onSongClick={handleSongClick}
            />
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ py: 4, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 1 }}>
          <QueueMusicIcon fontSize="small" />
          <Typography variant="body2">Hecho con ❤ para noches de karaoke</Typography>
        </Box>

        {/* Botón flotante "Volver arriba" */}
        <ScrollTopFab threshold={280} />
      </Container>
    </ThemeProvider>
  )
}
