// client/src/pages/AdminQueue.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { alpha } from '@mui/material/styles'

import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

// 🔽 Virtualización
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as VList } from 'react-window'

import { getJSON, patchJSON, delJSON } from '@/api/http'
import { socket, identifyAsAdmin, subscribeRequests } from '@/lib/socket'

const STATUS_LABEL = {
  pending: 'Pendiente',
  on_stage: 'En vivo',
  done: 'Hecha',
  no_show: 'No se presentó',
}

const VIRTUAL_THRESHOLD = 50
const ROW_HEIGHT = 80

function recomputeCounts(arr) {
  const c = { pending: 0, on_stage: 0, done: 0, no_show: 0 }
  for (const r of arr) {
    if (r.status === 'on_stage') c.on_stage++
    else if (r.status === 'done') c.done++
    else if (r.status === 'no_show') c.no_show++
    else c.pending++
  }
  return c
}

// ====== Helpers de orden ======
// Fallback: timestamp desde ObjectId si no viene createdAt/updatedAt
const oidMs = (id) => {
  if (!id) return 0
  const s = String(id).slice(0, 8)
  const ms = parseInt(s, 16) * 1000
  return Number.isFinite(ms) ? ms : 0
}
const tsMs = (iso) => {
  const t = Date.parse(iso || '')
  return Number.isFinite(t) ? t : NaN
}
// Preferimos updatedAt para “Hechas / No show”; si no, createdAt; si no, ObjectId
const updatedAtMs = (x) => {
  const u = tsMs(x?.updatedAt)
  if (Number.isFinite(u)) return u
  const c = tsMs(x?.createdAt)
  if (Number.isFinite(c)) return c
  return oidMs(x?._id || x?.id)
}
const createdAtMs = (x) => {
  const c = tsMs(x?.createdAt)
  return Number.isFinite(c) ? c : oidMs(x?._id || x?.id)
}

const byCreatedAsc  = (a, b) => createdAtMs(a) - createdAtMs(b)     // más viejo primero
const byUpdatedDesc = (a, b) => updatedAtMs(b) - updatedAtMs(a)     // último cambio primero

export default function AdminQueue() {
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' })

  // Confirmación "Eliminar todo"
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // Cola de toasts agrupados
  const newToastCountRef = useRef(0)
  const toastTimerRef = useRef(null)

  const notify = (msg, sev = 'info') => setSnack({ open: true, msg, sev })

  async function load() {
    setLoading(true)
    try {
      const res = await getJSON('/api/admin/requests', { admin: true })
      const list = res.data || []
      setRows(list)
      setCounts(recomputeCounts(list))
    } catch (e) {
      notify(e.message || 'Error cargando la cola', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    identifyAsAdmin()
    subscribeRequests()
    load()

    const onNew = (payload) => {
      setRows((prev) => {
        const next = [payload, ...prev] // el orden por columna corregirá la posición
        setCounts(recomputeCounts(next))
        return next
      })
      // Agrupar toasts cada ~700ms
      newToastCountRef.current += 1
      if (!toastTimerRef.current) {
        toastTimerRef.current = setTimeout(() => {
          const n = newToastCountRef.current
          newToastCountRef.current = 0
          toastTimerRef.current = null
          notify(`${n} nuevo${n > 1 ? 's' : ''} pedido${n > 1 ? 's' : ''}`, 'success')
        }, 700)
      }
    }

    // ⚠️ Importante: guardamos updatedAt si viene en el payload
    const onUpdate = ({ _id, status, updatedAt }) => {
      setRows((prev) => {
        const next = prev.map((r) => {
          if ((r._id || r.id) !== _id) return r
          return { ...r, status, ...(updatedAt ? { updatedAt } : {}) }
        })
        setCounts(recomputeCounts(next))
        return next
      })
      notify(`Estado: ${STATUS_LABEL[status] || status}`, 'info')
    }

    const onDelete = ({ _id }) => {
      setRows((prev) => {
        const next = prev.filter((r) => (r._id || r.id) !== _id)
        setCounts(recomputeCounts(next))
        return next
      })
      notify('Pedido eliminado', 'warning')
    }

    const onClear = () => {
      setRows([])
      setCounts({ pending: 0, on_stage: 0, done: 0, no_show: 0 })
      notify('Se eliminaron todos los pedidos', 'warning')
    }

    socket.on('request:new', onNew)
    socket.on('request:update', onUpdate)
    socket.on('request:delete', onDelete)
    socket.on('requests:clear', onClear)

    return () => {
      socket.off('request:new', onNew)
      socket.off('request:update', onUpdate)
      socket.off('request:delete', onDelete)
      socket.off('requests:clear', onClear)
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const g = { pending: [], on_stage: [], done: [], no_show: [] }
    for (const r of rows) (g[r.status] || g.pending).push(r)

    // FIFO en pendientes / en vivo
    g.pending.sort(byCreatedAsc)
    g.on_stage.sort(byCreatedAsc)

    // “Hechas / No show”: el último que ENTRÓ en esa columna arriba
    // → ordenamos por updatedAt desc (fallback a createdAt/ObjectId)
    const finished = [...g.done, ...g.no_show].sort(byUpdatedDesc)

    return { ...g, finished }
  }, [rows])

  const changeStatus = async (id, status) => {
    try {
      await patchJSON(`/api/admin/requests/${id || ''}/status`, { status }, { admin: true })
      // El server emite request:update → el listener ajusta estado/updatedAt
    } catch (e) {
      notify(e.message || 'No se pudo actualizar el estado', 'error')
    }
  }

  const deleteOne = async (r) => {
    const rid = r._id || r.id
    const ok = window.confirm(`¿Eliminar el pedido de "${r.fullName}" — ${r.artist} • ${r.title}?`)
    if (!ok) return
    try {
      await delJSON(`/api/admin/requests/${rid}`, { admin: true })
      // El server emite request:delete → el listener ajusta la lista
    } catch (e) {
      notify(e.message || 'No se pudo eliminar', 'error')
    }
  }

  const deleteAll = async () => {
    try {
      await delJSON('/api/admin/requests', { admin: true })
      setConfirmOpen(false)
      setConfirmText('')
      // El server emite requests:clear → el listener limpia todo
    } catch (e) {
      notify(e.message || 'No se pudo eliminar todo', 'error')
    }
  }

  const Counter = ({ label, value }) => (
    <Chip label={`${label}: ${value ?? 0}`} sx={{ mr: 1 }} />
  )

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" gutterBottom textAlign="center">Panel Admin</Typography>

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Counter label="Pendientes" value={counts.pending} />
          <Counter label="En vivo" value={counts.on_stage} />
          <Counter label="Hechas" value={counts.done} />
          <Counter label="No show" value={counts.no_show} />
          <Tooltip title="Refrescar">
            <Chip
              icon={<RefreshIcon />}
              label="Refrescar"
              onClick={load}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
          <Tooltip title='Eliminar TODOS los pedidos (escribí "ELIMINAR" para confirmar)'>
            <Chip
              color="error"
              icon={<DeleteForeverIcon />}
              label="Eliminar todo"
              onClick={() => setConfirmOpen(true)}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        </Box>

        <Paper variant="outlined">
          {loading ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 0,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gridTemplateAreas: {
                  xs: `"pending" "live" "done"`,
                  md: `"pending live" "done    done"`,
                },
              }}
            >
              {/* Columna 1: Pendientes */}
              <Box
                sx={{
                  gridArea: 'pending',
                  borderRight: { md: '1px solid' },
                  borderColor: { md: 'divider' },
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Section
                  title="Pendientes"
                  items={grouped.pending}
                  onDelete={deleteOne}
                  actions={(r) => (
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Llamar (pasa a En vivo)">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon sx={{ fontSize: 18 }} />}
                          sx={{ whiteSpace: 'nowrap' }}
                          onClick={() => changeStatus(r._id || r.id, 'on_stage')}
                        >
                          Llamar
                        </Button>
                      </Tooltip>
                      <Tooltip title="No se presentó">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonOffIcon sx={{ fontSize: 18 }} />}
                          sx={{ whiteSpace: 'nowrap' }}
                          onClick={() => changeStatus(r._id || r.id, 'no_show')}
                        >
                          No show
                        </Button>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => deleteOne(r)}
                        >
                          Eliminar
                        </Button>
                      </Tooltip>
                    </Stack>
                  )}
                />
              </Box>

              {/* Columna 2: En vivo */}
              <Box
                sx={{
                  gridArea: 'live',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Section
                  title="En vivo"
                  items={grouped.on_stage}
                  onDelete={deleteOne}
                  actions={(r) => (
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Marcar como cantada">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<DoneAllIcon sx={{ fontSize: 18 }} />}
                          sx={{ whiteSpace: 'nowrap' }}
                          onClick={() => changeStatus(r._id || r.id, 'done')}
                        >
                          Cantada
                        </Button>
                      </Tooltip>
                      <Tooltip title="No se presentó">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonOffIcon sx={{ fontSize: 18 }} />}
                          sx={{ whiteSpace: 'nowrap' }}
                          onClick={() => changeStatus(r._id || r.id, 'no_show')}
                        >
                          No show
                        </Button>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => deleteOne(r)}
                        >
                          Eliminar
                        </Button>
                      </Tooltip>
                    </Stack>
                  )}
                />
              </Box>

              {/* Fila 2: Hechas / No show (a todo el ancho) */}
              <Box
                sx={{
                  gridArea: 'done',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Section
                  title="Hechas / No show"
                  // Mezclamos ambas y ordenamos por updatedAt desc
                  items={grouped.finished}
                  onDelete={deleteOne}
                  actions={(r) => (
                    <Tooltip title="Eliminar">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => deleteOne(r)}
                      >
                        Eliminar
                      </Button>
                    </Tooltip>
                  )}
                  fullWidth
                />
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Confirmación ELIMINAR TODO */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Eliminar TODOS los pedidos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer. Para continuar, escribí <b>ELIMINAR</b>:
          </Typography>
          <TextField
            fullWidth
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<DeleteForeverIcon />}
            disabled={confirmText.trim().toUpperCase() !== 'ELIMINAR'}
            onClick={deleteAll}
          >
            Eliminar todo
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={2600}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Container>
  )
}

/** Columna centrada y contenida con virtualización condicional.
 *  - Top: máx 760px → centradas
 *  - Bottom: máx 1100px → a todo el ancho pero contenido
 *  - Virtualiza si hay >= VIRTUAL_THRESHOLD items
 */
function Section({ title, items, actions, onDelete, fullWidth = false }) {
  const MAX_COL_WIDTH = fullWidth ? 1100 : 760
  const listHeight = fullWidth ? '50vh' : '60vh'

  return (
    <Box sx={{ width: '100%', maxWidth: MAX_COL_WIDTH, mx: 'auto' }}>
      {/* Header sticky y centrado */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6">{title}</Typography>
      </Box>

      {(!items || items.length === 0) ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Sin items</Typography>
        </Box>
      ) : items.length >= VIRTUAL_THRESHOLD ? (
        // ---- Virtualizado ----
        <Box sx={{ height: listHeight }}>
          <AutoSizer>
            {({ height, width }) => (
              <VList
                height={height}
                width={width}
                itemCount={items.length}
                itemSize={ROW_HEIGHT}
                itemData={{ items, actions, onDelete }}
                overscanCount={6}
              >
                {VirtualRow}
              </VList>
            )}
          </AutoSizer>
        </Box>
      ) : (
        // ---- Lista normal (pocas filas) ----
        <Box>
          {items.map((r, idx) => (
            <Box key={r._id || r.id}>
              <RequestRow r={r} actions={actions} />
              {idx < items.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

function VirtualRow({ index, style, data }) {
  const r = data.items[index]
  return (
    <div style={style}>
      <RequestRow r={r} actions={data.actions} />
      <Divider />
    </div>
  )
}

function RequestRow({ r, actions }) {
  const rid = r._id || r.id
  const cleanNotes = (r.notes || '').replace(/\s*\n+\s*/g, ' ')
  const yoCanto = r.source === 'quick' || r.performer === 'host'
  const isNoShow = r.status === 'no_show'
  const isDone = r.status === 'done'
  const isLive = r.status === 'on_stage'

  const itemStyle = (theme) => {
    if (isNoShow) {
      return {
        bgcolor: alpha(theme.palette.error.main, 0.08),
        borderLeft: `4px solid ${theme.palette.error.main}`,
        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
      }
    }
    if (isDone) {
      return {
        bgcolor: alpha(theme.palette.success.main, 0.08),
        borderLeft: `4px solid ${theme.palette.success.main}`,
        '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.12) },
      }
    }
    if (isLive) {
      return {
        bgcolor: alpha(theme.palette.warning.main, 0.10),
        borderLeft: `4px solid ${theme.palette.warning.main}`,
        '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.16) },
      }
    }
    if (yoCanto) {
      return {
        bgcolor: alpha(theme.palette.info.main, 0.08),
        borderLeft: `4px solid ${theme.palette.info.main}`,
        '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.12) },
      }
    }
    return {}
  }

  return (
    <Box
      key={rid}
      sx={[
        {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderRadius: 1,
        },
        itemStyle,
      ]}
    >
      {/* Texto */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ lineHeight: 1.25, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
        >
          {r.artist} — {r.title}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          sx={{ mt: 0.5 }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Cantante:</strong> {r.fullName}
          </Typography>

          {cleanNotes && (
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.9 }}>
              &middot; <strong>Notas:</strong> {cleanNotes}
            </Typography>
          )}

          {yoCanto && (
            <Chip label="Yo canto" size="small" color="info" variant="filled" sx={{ height: 22 }} />
          )}
          {isLive && (
            <Chip label="En vivo" size="small" color="warning" variant="filled" sx={{ height: 22 }} />
          )}
          {isDone && (
            <Chip label="Hecha" size="small" color="success" variant="filled" sx={{ height: 22 }} />
          )}
          {isNoShow && (
            <Chip label="No show" size="small" color="error" variant="outlined" sx={{ height: 22 }} />
          )}
        </Stack>
      </Box>

      {/* Acciones */}
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0, pt: 0.25 }}>
        {actions ? actions(r) : null}
      </Stack>
    </Box>
  )
}
