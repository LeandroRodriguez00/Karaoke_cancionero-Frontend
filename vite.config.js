import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // lee .env y .env.* (solo claves VITE_* se inyectan)
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
      host: true,        // accesible desde la LAN (probar en el celu)
      port: 5173,
      strictPort: true,  // no salta de puerto silenciosamente
      open: true,        // abre el navegador al arrancar
      proxy: {
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

    // Para "vite preview" (simula prod local) manteniendo el proxy
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': { target: API_ORIGIN, changeOrigin: true },
        '/socket.io': { target: API_ORIGIN, changeOrigin: true, ws: true },
      },
    },

    // Opcional: sourcemaps en build para depurar (comentá si no los querés)
    // build: { sourcemap: true },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
