import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // Lee .env y .env.* (sólo VITE_* se inyecta al cliente)
  const env = loadEnv(mode, process.cwd(), '')
  const API_ORIGIN = env.VITE_API_ORIGIN || 'http://localhost:4000'

  return {
    plugins: [react()],

    // Imports cortos: "@/components/..."
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      host: true,        // accesible desde la LAN
      port: 5173,
      strictPort: true,  // no salta de puerto
      open: true,        // abre el navegador
      proxy: {
        // Útil si alguna parte del front usa rutas relativas (/api)
        '/api': {
          target: API_ORIGIN,
          changeOrigin: true,
        },
        // Listo para Socket.IO (Etapa 5)
        '/socket.io': {
          target: API_ORIGIN,
          changeOrigin: true,
          ws: true,
        },
      },
    },

    // Nota: en algunas versiones de Vite, preview.proxy puede no aplicarse.
    // No afecta porque http.js usa VITE_API_ORIGIN absoluto.
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': { target: API_ORIGIN, changeOrigin: true },
        '/socket.io': { target: API_ORIGIN, changeOrigin: true, ws: true },
      },
    },

    // (Opcional) Sourcemaps en build para depurar
    // build: { sourcemap: true },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
