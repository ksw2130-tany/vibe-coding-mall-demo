import { API_BASE_URL, getStoredAuth } from './auth.js'
import { apiFetch } from './apiFetch.js'

export const REVIEWS_API = {
  list: `${API_BASE_URL}/api/reviews`,
  adminList: `${API_BASE_URL}/api/reviews/admin/list`,
  byId: (id) => `${API_BASE_URL}/api/reviews/${id}`,
  publish: (id) => `${API_BASE_URL}/api/reviews/${id}/publish`,
}

function authHeaders(json = true) {
  const auth = getStoredAuth()
  if (!auth) return null
  const headers = {
    Accept: 'application/json',
    Authorization: `${auth.tokenType} ${auth.token}`,
  }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

/** 공개 리뷰 — GET /api/reviews */
export async function fetchPublicReviews() {
  const res = await apiFetch(REVIEWS_API.list, { headers: { Accept: 'application/json' } })
  return parseResponse(res)
}

/**
 * 관리자 리뷰 목록
 * @param {{ q?: string, published?: 'true' | 'false' }} [options]
 */
export async function fetchAdminReviews(options = {}) {
  const headers = authHeaders(false)
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }

  const url = new URL(REVIEWS_API.adminList)
  if (options.q) url.searchParams.set('q', options.q)
  if (options.published) url.searchParams.set('published', options.published)

  const res = await apiFetch(url.toString(), { headers })
  return parseResponse(res)
}

/** @param {ReturnType<import('./reviewForm.js').formToReviewBody>} body */
export async function createReview(body) {
  const headers = authHeaders()
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }
  const res = await apiFetch(REVIEWS_API.list, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/** @param {string} id @param {ReturnType<import('./reviewForm.js').formToReviewBody>} body */
export async function updateReview(id, body) {
  const headers = authHeaders()
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }
  const res = await apiFetch(REVIEWS_API.byId(id), {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/** @param {string} id @param {boolean} [published] */
export async function toggleReviewPublish(id, published) {
  const headers = authHeaders()
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }
  const res = await apiFetch(REVIEWS_API.publish(id), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(typeof published === 'boolean' ? { published } : {}),
  })
  return parseResponse(res)
}

/** @param {string} id */
export async function deleteReview(id) {
  const headers = authHeaders(false)
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }
  const res = await apiFetch(REVIEWS_API.byId(id), { method: 'DELETE', headers })
  return parseResponse(res)
}

export function messageFromApi(data, fallback) {
  if (data && typeof data.message === 'string' && data.message.trim()) return data.message
  return fallback
}
