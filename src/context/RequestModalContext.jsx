// client/src/context/RequestModalContext.jsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import RequestModal from '@/components/RequestModal'

/**
 * Contexto para abrir el RequestModal desde cualquier parte de la app.
 *
 * API expuesta por el hook useRequestModal():
 * - openGuest(song?)        -> source: 'public', performer: 'guest'
 * - openHost(song?)         -> source: 'public', performer: 'host'
 * - openQuickHost(song?)    -> source: 'quick',  performer: 'host'   (opcional, útil para staff)
 * - openCustom({ performer, song, source })
 * - close()
 */

const Ctx = createContext(null)

const INITIAL = {
  open: false,
  performer: 'guest', // 'guest' | 'host'
  song: null,         // { artist, title } | null
  source: 'public',   // 'public' | 'quick'
}

export function RequestModalProvider({ children }) {
  const [state, setState] = useState(INITIAL)

  const openCustom = useCallback((opts = {}) => {
    const performer = opts.performer === 'host' ? 'host' : 'guest'
    const source = opts.source === 'quick' ? 'quick' : 'public'
    const song = opts.song ?? null
    setState({ open: true, performer, song, source })
  }, [])

  const openGuest = useCallback((song = null) => {
    openCustom({ performer: 'guest', source: 'public', song })
  }, [openCustom])

  const openHost = useCallback((song = null) => {
    openCustom({ performer: 'host', source: 'public', song })
  }, [openCustom])

  const openQuickHost = useCallback((song = null) => {
    openCustom({ performer: 'host', source: 'quick', song })
  }, [openCustom])

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  // Limpia completamente el state (evita que queden artista/título de un caso anterior)
  const closeAndReset = useCallback(() => setState(INITIAL), [])

  const value = useMemo(
    () => ({ openGuest, openHost, openQuickHost, openCustom, close, closeAndReset }),
    [openGuest, openHost, openQuickHost, openCustom, close, closeAndReset]
  )

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Modal montado una sola vez a nivel app */}
      <RequestModal
        open={state.open}
        onClose={close}                 // cerrar (usá closeAndReset si querés limpiar todo)
        presetSong={state.song || undefined}
        defaultPerformer={state.performer}
        defaultSource={state.source}
      />
    </Ctx.Provider>
  )
}

export function useRequestModal() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRequestModal must be used within RequestModalProvider')
  return ctx
}
