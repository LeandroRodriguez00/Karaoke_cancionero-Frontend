// client/src/pages/AdminQueue.jsx
import { useEffect, useMemo, useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
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

import { getJSON, patchJSON, delJSON } from '@/api/http'
import { socket, identifyAsAdmin, subscribeRequests } from '@/lib/socket'

const STATUS_LABEL = {
  pending: 'Pendiente',
  on_stage: 'En vivo',
  done: 'Hecha',
  no_show: 'No se presentó',
}

export default function AdminQueue() {
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' })

  // Confirmación "Eliminar todo"
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const notify = (msg, sev = 'info') => setSnack({ open: true, msg, sev })

  async function load() {
    setLoading(true)
    try {
      const res = await getJSON('/api/admin/requests', { admin: true })
      setRows(res.data || [])
      setCounts(res.counts || {})
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    identifyAsAdmin()
    subscribeRequests()
    load()

    const onNew = (payload) => {
      setRows(prev => [payload, ...prev])
      setCounts(prev => ({ ...prev, pending: (prev.pending || 0) + 1 }))
      notify(`Nuevo pedido: ${payload.fullName} — ${payload.artist} - ${payload.title}`, 'success')
    }

    const onUpdate = ({ _id, status }) => {
      setRows(prev => prev.map(r => ((r._id || r.id) === _id ? { ...r, status } : r)))
      notify(`Estado: ${STATUS_LABEL[status]}`, 'info')
      load() // refresca contadores seguros
    }

    const onDelete = ({ _id }) => {
      setRows(prev => prev.filter(r => (r._id || r.id) !== _id))
      load()
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const g = { pending: [], on_stage: [], done: [], no_show: [] }
    for (const r of rows) g[r.status]?.push(r)
    return g
  }, [rows])

  const changeStatus = async (id, status) => {
    try {
      await patchJSON(`/api/admin/requests/${id || ''}/status`, { status }, { admin: true })
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const deleteOne = async (r) => {
    const rid = r._id || r.id
    const ok = window.confirm(`¿Eliminar el pedido de "${r.fullName}" — ${r.artist} • ${r.title}?`)
    if (!ok) return
    try {
      await delJSON(`/api/admin/requests/${rid}`, { admin: true })
      setRows(prev => prev.filter(x => (x._id || x.id) !== rid))
      load()
      notify('Pedido eliminado', 'success')
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const deleteAll = async () => {
    try {
      await delJSON('/api/admin/requests', { admin: true })
      setConfirmOpen(false)
      setConfirmText('')
      setRows([])
      setCounts({ pending: 0, on_stage: 0, done: 0, no_show: 0 })
      notify('Se eliminaron todos los pedidos', 'warning')
    } catch (e) {
      notify(e.message, 'error')
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
            // ======= LAYOUT: CSS GRID CON ÁREAS =======
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
                  items={[...(grouped.done || []), ...(grouped.no_show || [])]}
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
            onChange={e => setConfirmText(e.target.value)}
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
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Container>
  )
}

/** Columna centrada y contenida.
 *  - Top: máx 760px → centradas
 *  - Bottom: máx 1100px → a todo el ancho pero contenido
 *  - Resaltados:
 *      no_show => error (rojo)
 *      done    => success (verde)
 *      on_stage=> warning (amarillo)
 *      yoCanto => info (celeste)
 *    Prioridad: No show > Hecha > En vivo > Yo canto
 */
function Section({ title, items, actions, fullWidth = false }) {
  const MAX_COL_WIDTH = fullWidth ? 1100 : 760

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

      <List disablePadding>
        {(!items || items.length === 0) ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Sin items</Typography>
          </Box>
        ) : items.map((r, idx) => {
          const rid = r._id || r.id
          const cleanNotes = (r.notes || '').replace(/\s*\n+\s*/g, ' ')
          const yoCanto = (r.source === 'quick' || r.performer === 'host')
          const isNoShow = r.status === 'no_show'
          const isDone   = r.status === 'done'
          const isLive   = r.status === 'on_stage'

          // Prioridad de sombreado
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
            <Box key={rid}>
              {/* Item con sombreado condicional */}
              <Box
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

                    {/* Chips */}
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

              {idx < items.length - 1 && <Divider />}
            </Box>
          )
        })}
      </List>
    </Box>
  )
}
