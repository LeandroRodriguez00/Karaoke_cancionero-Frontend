// client/src/api/http.js
const RAW_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000'
export const API_ORIGIN = RAW_ORIGIN.replace(/\/+$/, '') // sin trailing slash

export class ApiError extends Error {
  constructor(message, { status, data, url, method } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.url = url
    this.method = method
  }
}

export function qs(params) {
  if (!params || typeof params !== 'object') return ''
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    sp.append(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

function adminHeaders() {
  const key = localStorage.getItem('ADMIN_KEY') || ''
  return key ? { 'x-admin-key': key } : {}
}

/**
 * request(method, path, opts)
 * opts:
 *   - body        : string | undefined (ya serializada si es JSON)
 *   - headers     : object headers extra
 *   - timeoutMs   : number (default 10000)
 *   - credentials : 'omit' | 'same-origin' | 'include' (default 'include')
 *   - admin       : boolean (si true, inyecta x-admin-key automáticamente)
 *   - query       : object (se convierte a ?a=1&b=2)
 */
async function request(
  method,
  path,
  { body, headers, timeoutMs = 10000, credentials = 'include', admin = false, query } = {}
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // normalización de URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const q = query ? qs(query) : ''
  const url = `${API_ORIGIN}${cleanPath}${q}`

  try {
    const finalHeaders = {
      Accept: 'application/json',
      ...(admin ? adminHeaders() : {}),
      ...(headers || {}),
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body,
      signal: controller.signal,
      credentials, // usamos include por defecto (no molesta si no hay cookies)
    })

    const ct = res.headers.get('content-type') || ''
    const isJSON = ct.includes('application/json')
    const data = isJSON ? await res.json().catch(() => ({})) : await res.text()

    if (!res.ok) {
      const msg =
        (isJSON && (data.error || data.message)) ||
        (typeof data === 'string' && data) ||
        `HTTP ${res.status}`
      throw new ApiError(msg, { status: res.status, data, url, method })
    }

    return data
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Tiempo de espera agotado', { status: 0, url, method })
    }
    if (!(err instanceof ApiError)) {
      throw new ApiError(err.message || 'Error de red', { status: 0, url, method })
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export function getJSON(path, opts = {}) {
  return request('GET', path, opts)
}

export function getJSONQ(path, params = {}, opts = {}) {
  return getJSON(path, { ...opts, query: params })
}

export function postJSON(path, data, opts = {}) {
  return request('POST', path, {
    body: JSON.stringify(data ?? {}),
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    admin: !!opts.admin,
    timeoutMs: opts.timeoutMs,
    credentials: opts.credentials ?? 'include',
    query: opts.query,
  })
}

export function putJSON(path, data, opts = {}) {
  return request('PUT', path, {
    body: JSON.stringify(data ?? {}),
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    admin: !!opts.admin,
    timeoutMs: opts.timeoutMs,
    credentials: opts.credentials ?? 'include',
    query: opts.query,
  })
}

export function patchJSON(path, data, opts = {}) {
  return request('PATCH', path, {
    body: JSON.stringify(data ?? {}),
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    admin: !!opts.admin,
    timeoutMs: opts.timeoutMs,
    credentials: opts.credentials ?? 'include',
    query: opts.query,
  })
}

export function delJSON(path, opts = {}) {
  return request('DELETE', path, {
    headers: { ...(opts.headers || {}) },
    admin: !!opts.admin,
    timeoutMs: opts.timeoutMs,
    credentials: opts.credentials ?? 'include',
    query: opts.query,
  })
}
