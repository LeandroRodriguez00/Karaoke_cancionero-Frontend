import React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

export default function SongList({ songs, loading }) {
  if (loading) {
    return (
      <List>
        {Array.from({ length: 8 }).map((_, i) => (
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
    return <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>No hay resultados.</Typography>
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent' }}>
      {songs.map((s, idx) => {
        const key = s._id || `${s.artist}-${s.title}-${idx}`
        return (
          <React.Fragment key={key}>
            <ListItem alignItems="flex-start" disableGutters>
              <ListItemText
                primary={s.title}
                secondary={s.artist}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            {idx < songs.length - 1 && <Divider component="li" />}
          </React.Fragment>
        )
      })}
    </List>
  )
}
