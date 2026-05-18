/**
 * 주문 API — routes + controller 분리
 * @see ./orders/orders.routes.js
 * @see ./orders/orders.controller.js
 */
export { orderRoutes, ORDERS_API } from './orders/orders.routes.js'
export {
  checkOrderDuplicate,
  createOrder,
  fetchMyOrders,
  fetchAdminOrderPermissionsApi,
  fetchAdminOrders,
  fetchOrderById,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  messageFromApi,
} from './orders/orders.controller.js'

/** 관리자 주문 목록 탭 */
export const ADMIN_ORDER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'confirmed', label: '주문확인' },
  { id: 'preparing', label: '상품준비중' },
  { id: 'shipping_start', label: '배송시작' },
  { id: 'shipping', label: '배송중' },
  { id: 'delivered', label: '배송완료' },
  { id: 'cancelled', label: '주문취소' },
]

/** @param {object} order @param {string} tabId */
export function adminOrderMatchesTab(order, tabId) {
  if (!order || tabId === 'all') return tabId === 'all'
  const status = order.status
  const hasTracking = Boolean(order.tracking?.number?.trim())

  switch (tabId) {
    case 'confirmed':
      return status === 'pending' || status === 'paid'
    case 'preparing':
      return status === 'preparing'
    case 'shipping_start':
      return status === 'shipped' && !hasTracking
    case 'shipping':
      return status === 'shipped' && hasTracking
    case 'delivered':
      return status === 'delivered'
    case 'cancelled':
      return status === 'cancelled' || status === 'refunded'
    default:
      return false
  }
}

/** @param {object[]} orders @param {string} tabId */
export function filterAdminOrdersByTab(orders, tabId) {
  if (!Array.isArray(orders) || tabId === 'all') return Array.isArray(orders) ? orders : []
  return orders.filter((order) => adminOrderMatchesTab(order, tabId))
}

/** 관리자 목록 상태 라벨 */
export function getAdminOrderStatusLabel(order) {
  const status = order?.status
  if (status === 'pending' || status === 'paid') return '주문확인'
  if (status === 'preparing') return '상품준비중'
  if (status === 'shipped' && !order.tracking?.number?.trim()) return '배송시작'
  if (status === 'shipped') return '배송중'
  if (status === 'delivered') return '배송완료'
  if (status === 'cancelled') return '주문취소'
  if (status === 'refunded') return '환불'
  return status || '—'
}

/** @param {object} order */
export function getAdminOrderStatusTone(order) {
  const status = order?.status
  if (status === 'delivered') return 'done'
  if (status === 'shipped') return 'shipping'
  if (status === 'preparing') return 'preparing'
  if (status === 'cancelled' || status === 'refunded') return 'muted'
  return 'processing'
}

/** 관리자 카드 상태 드롭다운 옵션 (전체 제외) */
export const ADMIN_STATUS_SELECT_OPTIONS = ADMIN_ORDER_TABS.filter((t) => t.id !== 'all')

/** @param {object} order */
export function getAdminOrderStatusKey(order) {
  for (const tab of ADMIN_STATUS_SELECT_OPTIONS) {
    if (adminOrderMatchesTab(order, tab.id)) {
      return tab.id
    }
  }
  return 'confirmed'
}

/** @param {object[]} orders */
export function countAdminOrdersByTab(orders) {
  const list = Array.isArray(orders) ? orders : []
  const counts = Object.fromEntries(ADMIN_ORDER_TABS.map((t) => [t.id, 0]))
  counts.all = list.length
  for (const order of list) {
    for (const tab of ADMIN_ORDER_TABS) {
      if (tab.id !== 'all' && adminOrderMatchesTab(order, tab.id)) {
        counts[tab.id] += 1
      }
    }
  }
  return counts
}

export const ORDER_STATUS_LABEL = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비중',
  shipped: '배송중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
}

/** 주문 목록 카드·뱃지용 짧은 라벨 */
export const ORDER_LIST_STATUS_LABEL = {
  pending: '주문확인',
  paid: '주문확인',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '주문취소',
  refunded: '환불 완료',
}

/** 주문 목록·상세 진행 상태 탭 */
export const ORDER_LIST_TABS = [
  { id: 'all', label: '전체' },
  { id: 'confirmed', label: '주문확인' },
  { id: 'preparing', label: '상품준비중' },
  { id: 'shipping_start', label: '배송시작' },
  { id: 'shipping', label: '배송중' },
  { id: 'delivered', label: '배송완료' },
  { id: 'cancelled', label: '주문취소' },
]

/** 상세 페이지 진행 탭 (전체 제외) */
export const ORDER_PROGRESS_TABS = ORDER_LIST_TABS.filter((t) => t.id !== 'all')

const VALID_TAB_IDS = new Set(ORDER_LIST_TABS.map((t) => t.id))

/**
 * 주문이 탭에 해당하는지
 * @param {object} order
 * @param {string} tabId
 */
export function orderMatchesListTab(order, tabId) {
  if (!order || tabId === 'all') return tabId === 'all'
  const status = order.status
  const hasTracking = Boolean(order.tracking?.number?.trim())

  switch (tabId) {
    case 'confirmed':
      return status === 'pending' || status === 'paid'
    case 'preparing':
      return status === 'preparing'
    case 'shipping_start':
      return status === 'shipped' && !hasTracking
    case 'shipping':
      return status === 'shipped' && hasTracking
    case 'delivered':
      return status === 'delivered'
    case 'cancelled':
      return status === 'cancelled' || status === 'refunded'
    default:
      return false
  }
}

/**
 * 주문 status → 목록 탭 id (상세 → 목록 복귀용)
 * @param {object | string} orderOrStatus
 */
export function getOrderListTabId(orderOrStatus) {
  const order =
    typeof orderOrStatus === 'string' ? { status: orderOrStatus, tracking: {} } : orderOrStatus
  if (!order?.status) return 'all'

  for (const tab of ORDER_PROGRESS_TABS) {
    if (orderMatchesListTab(order, tab.id)) {
      return tab.id
    }
  }
  return 'all'
}

/**
 * 상세 진행 탭 — 현재 활성 id
 * @param {object} order
 */
export function getOrderProgressTabId(order) {
  return getOrderListTabId(order)
}

/** 상세 진행 탭 — 현재 단계인지 */
export function isOrderProgressTabActive(order, tabId) {
  return getOrderProgressTabId(order) === tabId
}

/**
 * URL 등에서 탭 id 정규화
 * @param {string | null | undefined} tabId
 */
export function normalizeOrderListTabId(tabId) {
  if (tabId && VALID_TAB_IDS.has(tabId)) return tabId
  return 'all'
}

/**
 * 탭에 맞는 주문만 필터
 * @param {object[]} orders
 * @param {string} tabId
 */
export function filterOrdersByTab(orders, tabId) {
  const tab = normalizeOrderListTabId(tabId)
  if (!Array.isArray(orders)) return []
  if (tab === 'all') return orders
  return orders.filter((order) => orderMatchesListTab(order, tab))
}

/**
 * 탭별 주문 개수
 * @param {object[]} orders
 */
export function countOrdersByTab(orders) {
  const list = Array.isArray(orders) ? orders : []
  const counts = Object.fromEntries(ORDER_LIST_TABS.map((t) => [t.id, 0]))
  counts.all = list.length
  for (const order of list) {
    for (const tab of ORDER_LIST_TABS) {
      if (tab.id !== 'all' && orderMatchesListTab(order, tab.id)) {
        counts[tab.id] += 1
      }
    }
  }
  return counts
}

export const ORDER_SOURCE_LABEL = {
  cart: '장바구니',
  buy_now: '바로구매',
}

export const PAYMENT_METHOD_LABEL = {
  card: '카드',
  transfer: '계좌이체',
  kakao: '카카오페이',
  naver: '네이버페이',
  mock: '테스트 결제',
}
