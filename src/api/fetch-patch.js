// client/src/api/fetch-patch.js
// Reescribe cualquier fetch al mismo dominio (Hostinger) que apunte a /api/*
// o a rutas relativas "songs?...", para que vaya a la API de Render.
// - Si es /api/songs (o "songs") y NO hay 'q', fuerza perPage/limit = 5000 (cargar todo)
// - Si viene 'all', lo respeta (no lo convierte a número)
// - Log de debug opcional

const DEFAULT_API = 'https://karaoke-cancionero-backend.onrender.com';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || DEFAULT_API;
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_API === '1';

export function patchFetchForApi() {
  if (typeof window === 'undefined' || !window.fetch) return;
  const originalFetch = window.fetch;

  window.fetch = function (input, init) {
    try {
      // URL absoluta del request (sirve para strings y Request objects)
      const abs = (() => {
        if (typeof input === 'string') return new URL(input, window.location.origin);
        if (input && typeof input.url === 'string') return new URL(input.url, window.location.origin);
        return null;
      })();

      if (abs) {
        const sameOrigin  = abs.origin === window.location.origin;
        const path        = abs.pathname;                  // p.ej. "/songs" o "/api/songs"
        const isApiCall   = path.startsWith('/api/');
        const isBareSongs = sameOrigin && path === '/songs';

        if (sameOrigin && (isApiCall || isBareSongs)) {
          // Mapear "songs" -> "/api/songs", sino dejar el path tal cual
          const targetPath = isBareSongs ? '/api/songs' : path;
          const target = new URL(targetPath, API_ORIGIN);

          // Copiar todos los query params
          abs.searchParams.forEach((v, k) => target.searchParams.set(k, v));

          // Ajustes SOLO para el endpoint de canciones
          if (target.pathname.endsWith('/songs')) {
            const rawSize = (target.searchParams.get('perPage') || target.searchParams.get('limit') || '').toString().toLowerCase();
            const hasAll  = rawSize === 'all';
            const hasQ    = !!(target.searchParams.get('q') || '').trim();

            if (hasAll) {
              // Respetar "all"
              target.searchParams.set('perPage', 'all');
              target.searchParams.set('limit', 'all');
            } else if (!hasQ) {
              // Carga inicial SIN búsqueda -> traer TODO (tu catálogo actual es ~406)
              target.searchParams.set('perPage', '5000');
              target.searchParams.set('limit', '5000');
            } else {
              // Búsquedas: si no enviaron tamaño, fijar uno razonable
              if (!rawSize) {
                target.searchParams.set('perPage', '50');
                target.searchParams.set('limit', '50');
              }
            }
          }

          if (DEBUG) console.log('[fetch-patch] Reescrito:', abs.href, '=>', target.href);

          input = (typeof input === 'string') ? target.href : new Request(target.href, input);
        }
      }
    } catch (e) {
      console.warn('[fetch-patch] Error reescribiendo URL:', e);
    }
    return originalFetch.call(this, input, init);
  };
}
