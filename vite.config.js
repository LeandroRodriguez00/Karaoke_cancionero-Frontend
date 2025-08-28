// client/vite.config.js
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
        '@': fileURLToPath(new URL('./src', import.meta.url)), // ✅ @ → src
      },
    },

    server: {
      host: true,        // accesible desde la LAN
      port: 5173,
      strictPort: true,  // no salta de puerto
      open: true,        // abre el navegador
      proxy: {
        // Proxy para API REST
        '/api': {
          target: API_ORIGIN,
          changeOrigin: true,
        },
        // Proxy + WS para Socket.IO (Etapa 5)
        '/socket.io': {
          target: API_ORIGIN,
          changeOrigin: true,
          ws: true,
        },
      },
      // Si no querés overlay de errores, podés descomentar:
      // hmr: { overlay: false },
    },

    // Preview (build local) — no siempre aplica proxy, pero lo dejamos igual
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': { target: API_ORIGIN, changeOrigin: true },
        '/socket.io': { target: API_ORIGIN, changeOrigin: true, ws: true },
      },
    },

    // Pequeña optimización de dev: prebundle del cliente de sockets
    optimizeDeps: {
      include: ['socket.io-client'],
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
