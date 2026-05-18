/** @type {number} */
let itemCount = 0

/** @type {Set<(count: number) => void>} */
const listeners = new Set()

export function getCartBadgeCount() {
  return itemCount
}

/**
 * API cart 응답으로 배지 수량 동기화
 * @param {{ itemCount?: number } | null | undefined} cart
 */
export function syncCartBadgeFromCart(cart) {
  const next =
    cart && typeof cart.itemCount === 'number' && cart.itemCount >= 0
      ? cart.itemCount
      : 0
  if (next === itemCount) return
  itemCount = next
  listeners.forEach((fn) => fn(itemCount))
}

export function resetCartBadge() {
  syncCartBadgeFromCart({ itemCount: 0 })
}

/** @param {(count: number) => void} listener */
export function subscribeCartBadge(listener) {
  listeners.add(listener)
  listener(itemCount)
  return () => listeners.delete(listener)
}
