import { getStoredAuth } from '../auth.js'
import { apiFetch } from '../apiFetch.js'

export function authHeaders(json = true) {
  const auth = getStoredAuth()
  if (!auth) return null
  const headers = {
    Accept: 'application/json',
    Authorization: `${auth.tokenType} ${auth.token}`,
  }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export function unauthorized(message = '로그인이 필요합니다.') {
  return { ok: false, status: 401, data: { message } }
}

export function messageFromApi(data, fallback) {
  if (data && typeof data.message === 'string' && data.message.trim()) return data.message
  return fallback
}

/**
 * @param {{ method: string, url: string, json?: boolean, body?: unknown }} options
 */
export async function authRequest({ method, url, json = false, body }) {
  const headers = authHeaders(json)
  if (!headers) return unauthorized()

  const init = { method, headers }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const res = await apiFetch(url, init)
  return parseResponse(res)
}
