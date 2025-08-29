// client/src/api/songs.js
// Capa de fetch para /api/songs con:
// - AbortController (cancela búsquedas anteriores)
// - Cache por (q,page,pageSize)
// - Prefetch de la página siguiente
// - Fallback a PROD (Render) si no hay VITE_API_ORIGIN
// - Logs de debug y detección de respuestas no-JSON

const DEFAULT_API = 'https://karaoke-cancionero-backend.onrender.com';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || DEFAULT_API;
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_API === '1';

let inFlightController = null;
const cache = new Map();

function keyFor(q, page, pageSize) {
  return `${q || ''}::${page || 1}::${pageSize || 50}`;
}

/**
 * fetchSongs({ q, page, limit, perPage, prefetchNext })
 * - limit y perPage son equivalentes (usa el que quieras).
 */
export async function fetchSongs({
  q = '',
  page = 1,
  limit,
  perPage,
  prefetchNext = true,
} = {}) {
  const pageSize = Number(perPage ?? limit ?? 50);

  const k = keyFor(q, page, pageSize);
  if (cache.has(k)) return cache.get(k);

  // Cancelamos cualquier búsqueda anterior
  if (inFlightController) inFlightController.abort();
  inFlightController = new AbortController();

  // Armamos URL absoluta a Render/Backend
  const url = new URL('/api/songs', API_ORIGIN);
  if (q) url.searchParams.set('q', q);
  url.searchParams.set('page', String(page));
  // Enviamos ambos nombres por compatibilidad backend
  url.searchParams.set('perPage', String(pageSize));
  url.searchParams.set('limit', String(pageSize));

  if (DEBUG) {
    // Para ver en consola que esté llamando a Render y no a una ruta relativa
    console.log('[fetchSongs] API_ORIGIN =', API_ORIGIN);
    console.log('[fetchSongs] URL =>', url.toString());
  }

  const req = fetch(url.toString(), { signal: inFlightController.signal })
    .then(async (res) => {
      // Si el server devuelve HTML (p.ej. index.html), lo detectamos y tiramos error claro
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          '[fetchSongs] Respuesta no JSON (¿ruta relativa?). Primeros bytes: ' +
          text.slice(0, 120)
        );
      }

      const data = await res.json();
      cache.set(k, data);

      // Prefetch de la siguiente página (si corresponde)
      const hasNext =
        data?.hasNext ??
        ((data?.page || page) * (data?.perPage || pageSize) < (data?.total || 0));

      if (prefetchNext && hasNext) {
        const nextK = keyFor(q, page + 1, pageSize);
        if (!cache.has(nextK)) {
          const nextUrl = new URL(url);
          nextUrl.searchParams.set('page', String(page + 1));
          fetch(nextUrl.toString())
            .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('application/json') ? r.json() : null))
            .then((d) => d && cache.set(nextK, d))
            .catch(() => {});
        }
      }

      return data;
    });

  return req;
}

// Limpiar cache si necesitás forzar refresh (p.ej. al logout)
export function clearSongsCache() {
  cache.clear();
}
