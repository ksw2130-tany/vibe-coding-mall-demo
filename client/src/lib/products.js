import { API_BASE_URL, getStoredAuth } from './auth.js'
import { apiFetch } from './apiFetch.js'
import { PRODUCT_CATEGORIES } from './productConstants.js'

export { PRODUCT_CATEGORIES }

/** 상품 목록 페이지당 개수 (관리자 상품 관리) */
export const PRODUCTS_PAGE_SIZE = 2

/** @type {const} */
export const PRODUCTS_API = {
  list: `${API_BASE_URL}/api/products`,
  create: `${API_BASE_URL}/api/products`,
  byId: (id) => `${API_BASE_URL}/api/products/${id}`,
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
  const ok = res.ok || res.status === 304
  return { ok, status: res.status, data }
}

/**
 * 상품 목록 — GET /api/products
 * @param {string | { category?: string, q?: string, page?: number, limit?: number }} [options]
 */
export async function fetchProducts(options) {
  const params =
    typeof options === 'string'
      ? { category: options }
      : options && typeof options === 'object'
        ? options
        : {}

  const url = new URL(PRODUCTS_API.list)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.q) url.searchParams.set('q', params.q)
  if (params.page != null) url.searchParams.set('page', String(params.page))
  if (params.limit != null) url.searchParams.set('limit', String(params.limit))

  const res = await apiFetch(url.toString(), { headers: { Accept: 'application/json' } })
  const result = await parseResponse(res)
  if (res.status === 304 && !result.data?.products) {
    return { ok: false, status: 304, data: { message: '캐시된 응답입니다. 새로고침해 주세요.' } }
  }
  if (result.ok && result.data?.success === false) {
    return { ok: false, status: result.status, data: result.data }
  }
  return result
}

/** 전체 상품 목록 (페이지네이션 없음) — GET /api/products */
export async function fetchAllProducts(options = {}) {
  const { category, q } =
    typeof options === 'string' ? { category: options } : options
  return fetchProducts({ category, q })
}

/** @param {string} id */
export async function fetchProductById(id) {
  const res = await apiFetch(PRODUCTS_API.byId(id), { headers: { Accept: 'application/json' } })
  return parseResponse(res)
}

/**
 * 상품 등록 API — POST /api/products (관리자 JWT)
 * @param {ReturnType<import('./productForm.js').formToProductBody>} body
 */
export async function registerProduct(body) {
  const headers = authHeaders()
  if (!headers) {
    return {
      ok: false,
      status: 401,
      data: { success: false, message: '로그인이 필요합니다.' },
      product: null,
    }
  }

  const res = await apiFetch(PRODUCTS_API.create, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const result = await parseResponse(res)
  return {
    ...result,
    product: result.ok && result.data?.product ? result.data.product : null,
  }
}

/** @param {ReturnType<import('./productForm.js').formToProductBody>} body */
export async function createProduct(body) {
  return registerProduct(body)
}

/** @param {string} id @param {ReturnType<import('./productForm.js').formToProductBody>} body */
export async function updateProduct(id, body) {
  const headers = authHeaders()
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }
  const res = await apiFetch(PRODUCTS_API.byId(id), {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  return parseResponse(res)
}

/** @param {string} id */
export async function deleteProduct(id) {
  const headers = authHeaders(false)
  if (!headers) {
    return { ok: false, status: 401, data: { message: '로그인이 필요합니다.' } }
  }
  const res = await apiFetch(PRODUCTS_API.byId(id), { method: 'DELETE', headers })
  return parseResponse(res)
}

export function messageFromApi(data, fallback) {
  if (data && typeof data.message === 'string' && data.message.trim()) return data.message
  return fallback
}
