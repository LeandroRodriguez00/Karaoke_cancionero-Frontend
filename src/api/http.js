// client/src/api/http.js
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000'

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

function qs(params) {
  if (!params || typeof params !== 'object') return ''
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    sp.append(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function request(method, path, { body, headers, timeoutMs = 10000, credentials = 'omit' } = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const url = `${API_ORIGIN}${path}`

  try {
    const res = await fetch(url, {
      method,
      headers: { Accept: 'application/json', ...(headers || {}) },
      body,
      signal: controller.signal,
      credentials, // usa 'include' si algún día manejás cookies
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
    // Reempaquetar otros errores de red como ApiError para manejo homogéneo
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
  return getJSON(`${path}${qs(params)}`, opts)
}

export function postJSON(path, data, opts = {}) {
  return request('POST', path, {
    body: JSON.stringify(data ?? {}),
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
}

// (Opcional, pensando en el Admin de la Etapa 5)
// export const putJSON   = (p,d,o={}) => request('PUT',   p, { body: JSON.stringify(d??{}), headers:{'Content-Type':'application/json',...(o.headers||{})}, ...o })
// export const patchJSON = (p,d,o={}) => request('PATCH', p, { body: JSON.stringify(d??{}), headers:{'Content-Type':'application/json',...(o.headers||{})}, ...o })
// export const delJSON   = (p,o={})   => request('DELETE',p, o)
