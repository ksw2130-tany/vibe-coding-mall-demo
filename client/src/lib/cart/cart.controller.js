import { authRequest } from '../api/http.js'
import { syncCartBadgeFromCart } from './cartBadge.js'
import { cartRoutes } from './cart.routes.js'

function syncBadgeFromResponse(res) {
  if (res.ok && res.data?.cart != null) {
    syncCartBadgeFromCart(res.data.cart)
  }
  return res
}

/** GET /api/cart */
export async function fetchCart() {
  const { method, url } = cartRoutes.getCart
  return syncBadgeFromResponse(await authRequest({ method, url: url() }))
}

/**
 * POST /api/cart/items
 * @param {{ productId: string, quantity?: number, size?: string, variety?: string }} body
 */
export async function addCartItem(body) {
  const { method, url } = cartRoutes.addItem
  return syncBadgeFromResponse(
    await authRequest({ method, url: url(), json: true, body })
  )
}

/** GET /api/cart/items/:itemId */
export async function fetchCartItem(itemId) {
  const { method, url } = cartRoutes.getCartItem
  return authRequest({ method, url: url(itemId) })
}

/** PATCH /api/cart/items/:itemId */
export async function updateCartItem(itemId, body) {
  const payload = typeof body === 'number' ? { quantity: body } : body
  const { method, url } = cartRoutes.updateItem
  return syncBadgeFromResponse(
    await authRequest({ method, url: url(itemId), json: true, body: payload })
  )
}

/** PUT /api/cart/items/:itemId */
export async function replaceCartItem(itemId, body) {
  const { method, url } = cartRoutes.replaceItem
  return authRequest({ method, url: url(itemId), json: true, body })
}

/** DELETE /api/cart/items/:itemId */
export async function removeCartItem(itemId) {
  const { method, url } = cartRoutes.removeItem
  return syncBadgeFromResponse(await authRequest({ method, url: url(itemId) }))
}

/** DELETE /api/cart */
export async function clearCart() {
  const { method, url } = cartRoutes.clearCart
  return syncBadgeFromResponse(await authRequest({ method, url: url() }))
}
