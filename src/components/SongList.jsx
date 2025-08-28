import React from 'react'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import SongListItem from '@/components/SongListItem'

/**
 * Props:
 * - songs: array de canciones [{ artist, title, _id? }]
 * - loading: bool
 * - showCount?: bool                   -> muestra el contador de resultados (default: false)
 * - skeletonCount?: number             -> cantidad de skeletons durante carga (default: 8)
 * - emptyState?: ReactNode             -> UI alternativa cuando no hay resultados
 */
export default function SongList({
  songs = [],
  loading = false,
  showCount = false,
  skeletonCount = 8,
  emptyState,
}) {
  if (loading) {
    return (
      <List>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListItem key={i}>
            <ListItemText
              primary={<Skeleton width="60%" />}
              secondary={<Skeleton width="40%" />}
            />
          </ListItem>
        ))}
      </List>
    )
  }

  if (!songs?.length) {
    if (emptyState) return emptyState
    return (
      <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>
        No hay resultados.
      </Typography>
    )
  }

  return (
    <>
      {showCount && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {songs.length} resultado{songs.length !== 1 ? 's' : ''}
        </Typography>
      )}

      <List sx={{ width: '100%', bgcolor: 'transparent' }} disablePadding>
        {songs.map((s, idx) => {
          const key = s._id || `${s.artist}::${s.title}::${idx}`
          return (
            <React.Fragment key={key}>
              <SongListItem song={s} />
              {idx < songs.length - 1 && <Divider component="li" />}
            </React.Fragment>
          )
        })}
      </List>
    </>
  )
}
