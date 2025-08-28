// client/src/lib/socket.js
import { io } from 'socket.io-client'

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000'

// Singleton de socket para toda la app
export const socket = io(API_ORIGIN, {
  autoConnect: true,         // conecta apenas carga
  transports: ['websocket'], // más estable y rápido
})

// --- Helpers opcionales (azúcar sintáctico) ---

/** Identifica este cliente como "admin" (el server lo mete en la sala 'admins') */
export function identifyAsAdmin() {
  socket.emit('identify', { role: 'admin' })
}

/** Suscribe este cliente al canal de pedidos (sala 'requests') */
export function subscribeRequests() {
  socket.emit('subscribe:requests')
}

/** Atajo para registrar listeners */
export function on(event, handler) {
  socket.on(event, handler)
}

/** Atajo para desregistrar listeners */
export function off(event, handler) {
  socket.off(event, handler)
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
