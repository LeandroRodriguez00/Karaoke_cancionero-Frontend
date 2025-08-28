import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useRequestModal } from '@/context/RequestModalContext'

export default function SongListItem({ song }) {
  const { openGuest, openHost } = useRequestModal()

  const handleGuest = () => openGuest({ artist: song.artist, title: song.title })
  const handleHost  = () => openHost({ artist: song.artist, title: song.title })

  return (
    <ListItem
      secondaryAction={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={handleGuest}>
            Cantar esta canción
          </Button>
          <Button size="small" variant="text" onClick={handleHost}>
            Pedile al cantante
          </Button>
        </Stack>
      }
    >
      <ListItemText primary={song.title} secondary={song.artist} />
    </ListItem>
  )
}
