import { authRequest, messageFromApi } from '../api/http.js'
import { orderRoutes } from './orders.routes.js'

export { messageFromApi }

/**
 * POST /api/orders/check-duplicate
 * @param {{ merchantUid?: string, impUid?: string }} body
 */
export async function checkOrderDuplicate(body) {
  const { method, url } = orderRoutes.checkDuplicate
  return authRequest({ method, url: url(), json: true, body })
}

/**
 * POST /api/orders — 장바구니 주문 또는 바로구매
 * @param {object} payload
 */
export async function createOrder(payload) {
  const { method, url } = orderRoutes.create
  return authRequest({ method, url: url(), json: true, body: payload })
}

/** GET /api/orders */
export async function fetchMyOrders() {
  const { method, url } = orderRoutes.list
  return authRequest({ method, url: url() })
}

/** GET /api/orders/admin/permissions */
export async function fetchAdminOrderPermissionsApi() {
  const { method, url } = orderRoutes.adminPermissions
  return authRequest({ method, url: url() })
}

/** GET /api/orders/admin/list */
export async function fetchAdminOrders() {
  const { method, url } = orderRoutes.adminList
  return authRequest({ method, url: url() })
}

/**
 * PATCH /api/orders/:id/status — 관리자 상태 변경
 * @param {string} id
 * @param {{ status: string, reason?: string, tracking?: { carrier?: string, number?: string } }} body
 */
export async function updateOrderStatus(id, body) {
  const { method, url } = orderRoutes.updateStatus
  return authRequest({ method, url: url(id), json: true, body })
}

/** GET /api/orders/:id */
export async function fetchOrderById(id) {
  const { method, url } = orderRoutes.byId
  return authRequest({ method, url: url(id) })
}

/**
 * PATCH /api/orders/:id — 배송 정보 수정
 * @param {string} id
 * @param {object} payload
 */
export async function updateOrder(id, payload) {
  const { method, url } = orderRoutes.update
  return authRequest({ method, url: url(id), json: true, body: payload })
}

/**
 * PATCH /api/orders/:id/cancel
 * @param {string} id
 * @param {{ reason?: string, cancelReason?: string }} [body]
 */
export async function cancelOrder(id, body) {
  const { method, url } = orderRoutes.cancel
  if (body) {
    return authRequest({ method, url: url(id), json: true, body })
  }
  return authRequest({ method, url: url(id) })
}

/** DELETE /api/orders/:id — 관리자 */
export async function deleteOrder(id) {
  const { method, url } = orderRoutes.remove
  return authRequest({ method, url: url(id) })
}
