import React, { useEffect, useState } from 'react'
import Fab from '@mui/material/Fab'
import Zoom from '@mui/material/Zoom'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

export default function ScrollTopFab({ threshold = 280 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShow(window.scrollY > threshold)
          ticking = false
        })
        ticking = true
      }
    }
    onScroll() // evalúa al montar
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Zoom in={show}>
      <Fab
        color="primary"
        size="medium"
        onClick={handleClick}
        aria-label="Volver arriba"
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
          zIndex: (t) => t.zIndex.tooltip + 1,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  )
}
