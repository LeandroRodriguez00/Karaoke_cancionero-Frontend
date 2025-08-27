const BASE_URL = '/api/songs'

/**
 * fetchSongs
 * - Devuelve SIEMPRE un ARRAY de canciones [{ artist, title, styles, _id }, ...]
 * - Compatible con múltiples formatos de respuesta del server.
 * - Usado por App.jsx (lista agrupada).
 */
export async function fetchSongs({ q = '', page = 1, limit = 50, signal } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)                      // enviamos q sólo si hay texto
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()

  // Normalizamos cualquier forma común de respuesta a un array
  if (Array.isArray(data)) return data
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.songs)) return data.songs
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data

  return []
}

/**
 * fetchSongsPaged
 * - Devuelve el OBJETO paginado del server:
 *   { page, perPage, total, totalPages, items: [...] }
 * - Útil si querés implementar paginación real o “cargar más”.
 */
export async function fetchSongsPaged({ q = '', page = 1, limit = 20, signal } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()

  // Normalización suave por si la forma difiere
  const items =
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.songs) ? data.songs :
    Array.isArray(data?.results) ? data.results :
    Array.isArray(data?.data) ? data.data :
    Array.isArray(data) ? data :
    []

  return {
    page: Number(data?.page ?? page),
    perPage: Number(data?.perPage ?? limit),
    total: Number(data?.total ?? items.length),
    totalPages: Number(data?.totalPages ?? 1),
    items,
  }
}
