import { useEffect, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'

import HeaderCTAs from '@/components/HeaderCTAs'
import { useRequestModal } from '@/context/RequestModalContext'
import { getJSON } from '@/api/http'

// Normaliza texto en cliente (extra a lo del server)
const norm = (s = '') =>
  s.normalize?.('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Vista de catálogo por artista.
 * Espera que /api/artists devuelva algo del estilo:
 * [
 *   { artist: "Soda Stereo", songs: [{ title: "De Música Ligera", _id: "..." }, ...] },
 *   ...
 * ]
 */
export default function Catalog() {
  const { openGuest, openHost } = useRequestModal()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchArtists = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getJSON('/api/artists')
        if (!cancelled) {
          setArtists(Array.isArray(res) ? res : res?.items || [])
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar el catálogo')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchArtists()
    return () => { cancelled = true }
  }, [])

  // Filtro por artista o canción
  const filtered = useMemo(() => {
    const nq = norm(q)
    if (!nq) return artists
    return artists
      .map((grp) => {
        const artistMatch = norm(grp.artist).includes(nq)
        const songs = (grp.songs || []).filter(s => artistMatch || norm(s.title).includes(nq))
        return songs.length ? { ...grp, songs } : null
      })
      .filter(Boolean)
  }, [artists, q])

  const resultsCount = useMemo(
    () => filtered.reduce((acc, g) => acc + (g.songs?.length || 0), 0),
    [filtered]
  )

  const clearQ = () => setQ('')

  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      {/* CTAs superiores – antes había alert(), ahora abren el modal real */}
      <HeaderCTAs />

      {/* Buscador local (no pega al server) */}
      <TextField
        label="Filtrar por artista o canción (local)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
          endAdornment: q ? (
            <InputAdornment position="end">
              <IconButton aria-label="Limpiar" onClick={clearQ} edge="end">
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      {/* Skeleton de carga */}
      {loading ? (
        <Stack spacing={1}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Accordion key={i} disabled>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Skeleton width="40%" />
              </AccordionSummary>
              <AccordionDetails>
                <List disablePadding>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <ListItem key={j}>
                      <ListItemText
                        primary={<Skeleton width="60%" />}
                        secondary={<Skeleton width="30%" />}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary">
            {resultsCount
              ? `${resultsCount} canción${resultsCount !== 1 ? 'es' : ''} encontradas`
              : 'Explorá por artista o usá el buscador de arriba'}
          </Typography>

          {!filtered.length && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              No hay artistas para mostrar.
            </Typography>
          )}

          {filtered.map((grp, idxA) => (
            <Accordion key={grp.artist || idxA} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {grp.artist}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {!grp.songs?.length ? (
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Sin canciones para este filtro.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {grp.songs.map((s, idxS) => {
                      const key = s._id || `${grp.artist}::${s.title}::${idxS}`
                      const doGuest = () => openGuest({ artist: grp.artist, title: s.title })
                      const doHost  = () => openHost({ artist: grp.artist, title: s.title })
                      return (
                        <div key={key}>
                          <ListItem
                            disableGutters
                            secondaryAction={
                              <Stack direction="row" spacing={1}>
                                {/* Antes: alert(`(Etapa 4) Pedir: ${artist} — ${title}`) */}
                                <Button size="small" variant="outlined" onClick={doGuest}>
                                  Cantar esta canción
                                </Button>
                                <Button size="small" variant="text" onClick={doHost}>
                                  Pedile al cantante
                                </Button>
                              </Stack>
                            }
                          >
                            <ListItemText
                              primary={s.title}
                              secondary={grp.artist}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                          </ListItem>
                          <Divider component="li" />
                        </div>
                      )
                    })}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}
    </Stack>
  )
}
