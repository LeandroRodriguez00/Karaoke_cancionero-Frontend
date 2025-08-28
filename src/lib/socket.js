// client/src/lib/socket.js
import { io } from 'socket.io-client'

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000'
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io'

// Opciones robustas (reconexión, timeouts, WS preferido)
const options = {
  autoConnect: true,
  transports: ['websocket'],
  path: SOCKET_PATH,
  withCredentials: false,          // cambiar a true si usás cookies same-site
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,          // backoff inicial
  reconnectionDelayMax: 4000,      // backoff máximo
  timeout: 20000,                  // handshake timeout
}

// ---- Singleton + safe HMR (Vite) ----
// Evita múltiples conexiones cuando el módulo se recarga en desarrollo.
let _socket = globalThis.__karaoke_socket
if (!_socket) {
  _socket = io(API_ORIGIN, options)
  globalThis.__karaoke_socket = _socket
}

// Singleton de socket para toda la app
export const socket = _socket

// --- Helpers opcionales (azúcar sintáctico) ---

/** Identifica este cliente como "admin" (el server lo mete en la sala 'admins') */
export function identifyAsAdmin() {
  socket.emit('identify', { role: 'admin' })
}

/** Suscribe este cliente al canal de pedidos (sala 'requests') */
export function subscribeRequests() {
  socket.emit('subscribe:requests')
}

/** Atajo para registrar listeners (devuelve un unsubscribe) */
export function on(event, handler) {
  socket.on(event, handler)
  return () => socket.off(event, handler)
}

/** Listener one-shot */
export function once(event, handler) {
  socket.once(event, handler)
}

/** Atajo para desregistrar listeners */
export function off(event, handler) {
  socket.off(event, handler)
}

/** Remueve todos los listeners (o todos de un evento) */
export function offAll(event) {
  if (event) socket.removeAllListeners(event)
  else socket.removeAllListeners()
}

/** Útil para pruebas de latencia/conectividad */
export function ping() {
  socket.emit('ping:client')
}

/** Conectar/desconectar manualmente si alguna vista lo requiere */
export function connect() {
  if (!socket.connected) socket.connect()
}
export function disconnect() {
  if (socket.connected) socket.disconnect()
}

// No cerramos el socket en HMR; conservamos la instancia única
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // dejamos el socket vivo para evitar reconexiones innecesarias
  })
}
