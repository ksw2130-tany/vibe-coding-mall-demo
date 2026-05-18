import { API_BASE_URL } from '../auth.js'

const BASE = `${API_BASE_URL}/api/cart`

/** 장바구니 API 경로·HTTP 메서드 정의 */
export const cartRoutes = {
  getCart: {
    method: 'GET',
    url: () => BASE,
  },
  getCartItem: {
    method: 'GET',
    url: (itemId) => `${BASE}/items/${itemId}`,
  },
  addItem: {
    method: 'POST',
    url: () => `${BASE}/items`,
  },
  updateItem: {
    method: 'PATCH',
    url: (itemId) => `${BASE}/items/${itemId}`,
  },
  replaceItem: {
    method: 'PUT',
    url: (itemId) => `${BASE}/items/${itemId}`,
  },
  removeItem: {
    method: 'DELETE',
    url: (itemId) => `${BASE}/items/${itemId}`,
  },
  clearCart: {
    method: 'DELETE',
    url: () => BASE,
  },
}

/** @deprecated cartRoutes 사용 권장 — 하위 호환 */
export const CART_API = {
  base: BASE,
  item: (itemId) => cartRoutes.updateItem.url(itemId),
}
