import { useEffect, useMemo, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Zoom from '@mui/material/Zoom'
import Tooltip from '@mui/material/Tooltip'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import useScrollTrigger from '@mui/material/useScrollTrigger'

function ScrollTopFab({
  getScrollElement,
  showAt = 240,
  bottom = 16,
  right = 16,
  size = 'medium',
  color = 'primary',
  label = 'Volver arriba',
  onClick,
}) {
  const [targetEl, setTargetEl] = useState(null)

  useEffect(() => {
    const resolve = () => {
      try {
        const el = typeof getScrollElement === 'function'
          ? getScrollElement()
          : (typeof window !== 'undefined' ? window : null)
        setTargetEl(el || null)
      } catch {
        setTargetEl(typeof window !== 'undefined' ? window : null)
      }
    }
    resolve()
  }, [getScrollElement])

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: showAt,
    target: targetEl || undefined,
  })

  const defaultScrollTop = useCallback(() => {
    const el = targetEl
    if (!el) return
    if (typeof window !== 'undefined' && el === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if ('scrollTo' in el) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [targetEl])

  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') {
      onClick(targetEl)
    } else {
      defaultScrollTop()
    }
  }, [onClick, targetEl, defaultScrollTop])

  const mounted = useMemo(() => Boolean(targetEl), [targetEl])
  if (!mounted) return null

  return (
    <Box
      role="presentation"
      sx={{
        position: 'fixed',
        right,
        bottom,
        zIndex: (t) => t.zIndex.snackbar,
      }}
    >
      <Zoom in={trigger}>
        <Tooltip title={label} placement="left" arrow>
          <Fab color={color} size={size} aria-label={label} onClick={handleClick}>
            <KeyboardArrowUpIcon />
          </Fab>
        </Tooltip>
      </Zoom>
    </Box>
  )
}

export default ScrollTopFab
export { ScrollTopFab }  // ← export nombrado opcional
