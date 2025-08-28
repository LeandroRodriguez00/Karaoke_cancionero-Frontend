import React, { useMemo, useRef, useCallback, useState } from 'react'
import { FixedSizeList as VList } from 'react-window'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Chip from '@mui/material/Chip'
import SongActionModal from '@/components/SongActionModal'

const LETTERS = ['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']

function useLetterIndex(songs){
  return useMemo(() => {
    const idx = new Map()
    for (let i = 0; i < songs.length; i++) {
      const a = (songs[i].artist || '').trim()
      const first = a.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase() || '#'
      const letter = /[A-Z]/.test(first) ? first : '#'
      if (!idx.has(letter)) idx.set(letter, i)
    }
    return idx
  }, [songs])
}

export default function FullSongVirtualList({
  songs,
  loading,
  height = 600,
  itemSize = 64,
  chipLimit = 3,
}) {
  const listRef = useRef(null)
  const letterIndex = useLetterIndex(songs)

  // NEW: chooser state
  const [chooser, setChooser] = useState({ open: false, song: null })
  const openChooser = (song) => setChooser({ open: true, song })
  const closeChooser = () => setChooser({ open: false, song: null })

  const onJump = useCallback((_, value) => {
    if (!value) return
    const i = letterIndex.get(value)
    if (typeof i === 'number' && listRef.current){
      listRef.current.scrollToItem(i, 'start')
    }
  }, [letterIndex])

  const Row = useCallback(({ index, style }) => {
    const s = songs[index]
    const key = s._id || `${s.artist}-${s.title}-${index}`
    const stylesArr = Array.isArray(s.styles) ? s.styles.filter(Boolean) : []

    return (
      <div style={style} key={key}>
        <ListItemButton onClick={() => openChooser({ artist: s.artist, title: s.title })} sx={{ height: '100%' }}>
          <ListItemText
            primary={`${s.artist} — ${s.title}`}
            secondary={
              stylesArr.length ? (
                <Box sx={{ mt: 0.5, display:'flex', flexWrap:'wrap', gap:0.5 }}>
                  {stylesArr.slice(0, chipLimit).map((st, i) => (
                    <Chip key={`${key}-st-${i}`} size="small" label={st} />
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
        <Divider />
      </div>
    )
  }, [songs, chipLimit])

  if (loading) return <Typography sx={{ opacity:.7, mt:2 }}>Cargando catálogo…</Typography>
  if (!songs?.length) return <Typography sx={{ opacity:.7, mt:2 }}>No hay resultados.</Typography>

  return (
    <Box>
      <ToggleButtonGroup exclusive size="small" onChange={onJump} sx={{ flexWrap:'wrap', gap:0.5, mb:1 }}>
        {LETTERS.map(l => (
          <ToggleButton key={l} value={l} disabled={!letterIndex.has(l)}>{l}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      <VList
        ref={listRef}
        height={height}
        itemCount={songs.length}
        itemSize={itemSize}
        width="100%"
        itemKey={(index) => songs[index]?._id || `${songs[index]?.artist}::${songs[index]?.title}::${index}`}
      >
        {Row}
      </VList>

      <Typography variant="caption" sx={{ display:'block', mt:1, opacity:.7 }}>
        Mostrando {songs.length.toLocaleString()} canciones
      </Typography>

      {/* Modal de acciones */}
      <SongActionModal open={chooser.open} song={chooser.song} onClose={closeChooser} />
    </Box>
  )
}
