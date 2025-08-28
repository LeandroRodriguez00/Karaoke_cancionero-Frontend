// client/src/App.jsx
import { useEffect, useMemo, useState, useTransition, useDeferredValue } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import Button from '@mui/material/Button'

import theme from './theme'
import './styles.css'

import SearchBox from './components/SearchBox'
import GroupedSongList from './components/GroupedSongList'
import FullSongVirtualList from './components/FullSongVirtualList'
import ScrollTopFab from './components/ScrollTopFab'
import WelcomeModal, { shouldShowWelcome } from './components/WelcomeModal'

import { normalizeText } from './utils/normalize'
import { useDebounce } from './hooks/useDebounce'
import { fetchSongs } from './services/songs'

// Admin
import AdminApp from './pages/AdminApp'

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

/** Home pública (migrada a componente para poder rutear) */
function HomePage() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grouped') // 'grouped' | 'all'
  const debounced = useDebounce(query, 350)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Welcome modal: se muestra una sola vez por dispositivo
  const [welcomeOpen, setWelcomeOpen] = useState(shouldShowWelcome())

  // Aplicar resultados en baja prioridad (no bloquea tipeo)
  const [isPending, startTransition] = useTransition()
  // Diferir el render del listado (suaviza cambios grandes)
  const deferredSongs = useDeferredValue(songs)

  const normalizedQuery = useMemo(() => normalizeText(debounced), [debounced])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const go = async () => {
      setLoading(true)
      setError('')
      try {
        const items = await fetchSongs({
          q: normalizedQuery,
          limit: 'all', // backend controla SONGS_MAX_LIMIT
          signal: controller.signal,
        })
        if (!active) return
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
    <Container>
      {/* Hero centrado */}
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" gutterBottom align="center">
            Karaoke
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85 }} align="center">
            Buscá tu tema y ¡pedilo al toque!
          </Typography>
        </Stack>
      </Box>

      {/* Buscador + Toggle de vista + acceso Admin */}
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

          {/* Acceso visible al panel Admin */}
          <Box sx={{ ml: { xs: 0, sm: 'auto' } }}>
            <Button
              component={Link}
              to="/admin"
              size="small"
              variant="outlined"
            >
              Admin
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Contenido */}
      <Box sx={{ mb: 3 }}>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : showLoading ? (
          <LoadingList />
        ) : view === 'grouped' ? (
          <GroupedSongList songs={deferredSongs} />
        ) : (
          <FullSongVirtualList songs={deferredSongs} loading={false} height={600} />
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 1 }}>
        <QueueMusicIcon fontSize="small" />
        <Typography variant="body2">Hecho con ❤ para noches de karaoke</Typography>
      </Box>

      {/* Botón flotante "Volver arriba" */}
      <ScrollTopFab showAt={280} />

      {/* Modal de bienvenida (solo 1 vez por dispositivo) */}
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </Container>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminApp />} />
          {/* <Route path="*" element={<div style={{padding: 24}}>404</div>} /> */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
