import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useTheme, alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'

/** Normaliza string para agrupar (case/tildes/espacios) */
const norm = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

/** Iniciales del artista para Avatar */
const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')

/** Agrupa por artista robusto */
function groupByArtist(songs = []) {
  const byKey = new Map()
  for (const s of songs) {
    const artistRaw = (s.artist ?? 'Desconocido').trim()
    const key = norm(artistRaw)
    if (!byKey.has(key)) byKey.set(key, { artist: artistRaw, songs: [] })
    byKey.get(key).songs.push(s)
  }
  const groups = Array.from(byKey.values())
  groups.sort((a, b) => a.artist.localeCompare(b.artist, 'es', { sensitivity: 'base' }))
  for (const g of groups) {
    g.songs.sort((a, b) => (a.title || '').localeCompare((b.title || ''), 'es', { sensitivity: 'base' }))
    g.count = g.songs.length
  }
  return groups
}

export default function GroupedSongList({
  songs,
  loading,
  onSongClick,
  chipLimit = 3,
}) {
  const theme = useTheme()
  const primary = theme.palette.primary.main

  const groups = useMemo(() => groupByArtist(songs), [songs])
  const allKeys = useMemo(() => groups.map(g => g.artist), [groups])
  const [openSet, setOpenSet] = useState(new Set())

  useEffect(() => {
    if (groups.length > 0 && groups.length <= 5) setOpenSet(new Set(allKeys))
    else setOpenSet(new Set())
  }, [allKeys, groups.length])

  const toggle = useCallback((artist) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      next.has(artist) ? next.delete(artist) : next.add(artist)
      return next
    })
  }, [])
  const expandAll = useCallback(() => setOpenSet(new Set(allKeys)), [allKeys])
  const collapseAll = useCallback(() => setOpenSet(new Set()), [])

  if (loading) {
    return (
      <List dense>
        {Array.from({ length: 6 }).map((_, i) => (
          <ListItem key={i}>
            <ListItemText primary={<Skeleton width="45%" />} secondary={<Skeleton width="25%" />} />
          </ListItem>
        ))}
      </List>
    )
  }

  if (!groups.length) {
    return <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>No hay resultados.</Typography>
  }

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} justifyContent="flex-end">
        <Button size="small" variant="outlined" onClick={expandAll}>Expandir todo</Button>
        <Button size="small" variant="outlined" onClick={collapseAll}>Colapsar todo</Button>
      </Stack>

      <List component="div" sx={{ width: '100%', bgcolor: 'transparent' }} disablePadding>
        {groups.map((g, idx) => {
          const isOpen = openSet.has(g.artist)
          const headerBg = isOpen ? alpha(primary, 0.08) : 'transparent'

          return (
            <Box key={g.artist} sx={{ mb: 1.25 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Header artista bien diferenciado */}
                <ListItemButton
                  onClick={() => toggle(g.artist)}
                  sx={{
                    py: 1.25,
                    bgcolor: headerBg,
                    transition: 'background-color .2s ease',
                    '&:hover': { bgcolor: alpha(primary, 0.12) }
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`panel-${norm(g.artist)}`}
                >
                  <Avatar
                    sx={{
                      mr: 1.5, width: 32, height: 32,
                      bgcolor: alpha(primary, 0.18),
                      color: primary, fontSize: 14, fontWeight: 700
                    }}
                  >
                    {initials(g.artist)}
                  </Avatar>

                  <ListItemText
                    primary={g.artist}
                    secondary={`${g.count} ${g.count === 1 ? 'canción' : 'canciones'}`}
                    primaryTypographyProps={{ fontWeight: 800 }}
                  />

                  <Chip size="small" label={g.count} sx={{ mr: 1, bgcolor: alpha(primary, 0.08) }} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                {/* Canciones envueltas con fondo suave e indent */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List
                    id={`panel-${norm(g.artist)}`}
                    component="div"
                    disablePadding
                    dense
                    sx={{ bgcolor: alpha(primary, 0.03) }}
                  >
                    {g.songs.map((s, i) => {
                      const key = s._id || `${s.artist}-${s.title}-${i}`
                      const stylesArr = Array.isArray(s.styles) ? s.styles.filter(Boolean) : []

                      return (
                        <React.Fragment key={key}>
                          <ListItem disablePadding>
                            <ListItemButton
                              sx={{
                                pl: 7,
                                alignItems: 'flex-start',
                                borderLeft: `3px solid ${alpha(primary, 0.25)}`
                              }}
                              onClick={() =>
                                (onSongClick ? onSongClick(s) : alert(`Elegiste: ${s.artist} — ${s.title}`))
                              }
                            >
                              <ListItemText
                                primary={s.title}
                                secondary={
                                  stylesArr.length ? (
                                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {stylesArr.slice(0, chipLimit).map((st, idx) => (
                                        <Chip key={`${key}-style-${idx}`} size="small" label={st} />
                                      ))}
                                      {stylesArr.length > chipLimit && (
                                        <Chip size="small" variant="outlined" label={`+${stylesArr.length - chipLimit}`} />
                                      )}
                                    </Box>
                                  ) : null
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                              />
                            </ListItemButton>
                          </ListItem>
                          {i < g.songs.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      )
                    })}
                  </List>
                </Collapse>
              </Paper>

              {idx < groups.length - 1 && <Box sx={{ height: 4 }} />}
            </Box>
          )
        })}
      </List>
    </>
  )
}
