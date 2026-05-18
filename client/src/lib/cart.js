/**
 * 장바구니 API — routes + controller 분리
 * @see ./cart/cart.routes.js   엔드포인트 정의
 * @see ./cart/cart.controller.js  HTTP 호출
 */
export { cartRoutes, CART_API } from './cart/cart.routes.js'
export {
  fetchCart,
  addCartItem,
  fetchCartItem,
  updateCartItem,
  replaceCartItem,
  removeCartItem,
  clearCart,
} from './cart/cart.controller.js'
export {
  getCartBadgeCount,
  resetCartBadge,
  subscribeCartBadge,
  syncCartBadgeFromCart,
} from './cart/cartBadge.js'
export { messageFromApi } from './api/http.js'

import { getStoredAuth } from './auth.js'
import { fetchCart } from './cart/cart.controller.js'
import { resetCartBadge } from './cart/cartBadge.js'

/** 로그인 사용자 장바구니 수량 새로고침 */
export async function refreshCartBadge() {
  if (!getStoredAuth()) {
    resetCartBadge()
    return 0
  }
  const { ok, data } = await fetchCart()
  if (!ok) {
    resetCartBadge()
    return 0
  }
  return data.cart?.itemCount ?? 0
}
