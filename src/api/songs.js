// client/src/api/songs.js
// Fetch de canciones con:
// - AbortController (cancela búsquedas anteriores)
// - Cache por (q,page,limit)
// - Prefetch de la página siguiente

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000'

let inFlightController = null
const cache = new Map()

function keyFor(q, page, limit) {
  return `${q}::${page}::${limit}`
}

export async function fetchSongs({ q = '', page = 1, limit = 100, prefetchNext = true } = {}) {
  const k = keyFor(q, page, limit)
  if (cache.has(k)) return cache.get(k)

  if (inFlightController) inFlightController.abort()
  inFlightController = new AbortController()

  const url = new URL('/api/songs', API_ORIGIN)
  if (q) url.searchParams.set('q', q)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))

  const req = fetch(url.toString(), { signal: inFlightController.signal }).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    cache.set(k, data)

    // Prefetch de la siguiente página (si hay)
    if (prefetchNext && data?.hasNext) {
      const nextK = keyFor(q, page + 1, limit)
      if (!cache.has(nextK)) {
        const nextUrl = new URL(url)
        nextUrl.searchParams.set('page', String(page + 1))
        fetch(nextUrl.toString())
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d && cache.set(nextK, d))
          .catch(() => {})
      }
    }

    return data
  })

  return req
}

// Limpiar cache si necesitás forzar refresh (p.ej. al logout)
export function clearSongsCache() {
  cache.clear()
}
