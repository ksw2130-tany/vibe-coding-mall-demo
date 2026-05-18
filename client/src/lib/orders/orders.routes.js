import { API_BASE_URL } from '../auth.js'

const BASE = `${API_BASE_URL}/api/orders`

/** 주문 API 경로·HTTP 메서드 정의 */
export const orderRoutes = {
  /** 주문·결제 중복 확인 */
  checkDuplicate: {
    method: 'POST',
    url: () => `${BASE}/check-duplicate`,
  },
  /** Create — 주문 생성 (장바구니 / 바로구매) */
  create: {
    method: 'POST',
    url: () => BASE,
  },
  /** Read — 내 주문 목록 */
  list: {
    method: 'GET',
    url: () => BASE,
  },
  /** Read — 관리자 주문 권한·상태 전이 규칙 */
  adminPermissions: {
    method: 'GET',
    url: () => `${BASE}/admin/permissions`,
  },
  /** Read — 전체 주문 (관리자) */
  adminList: {
    method: 'GET',
    url: () => `${BASE}/admin/list`,
  },
  /** Read — 주문 단건 */
  byId: {
    method: 'GET',
    url: (id) => `${BASE}/${id}`,
  },
  /** Update — 배송 정보 등 부분 수정 */
  update: {
    method: 'PATCH',
    url: (id) => `${BASE}/${id}`,
  },
  /** Update — 주문 취소 */
  cancel: {
    method: 'PATCH',
    url: (id) => `${BASE}/${id}/cancel`,
  },
  /** Update — 주문 상태 (관리자) */
  updateStatus: {
    method: 'PATCH',
    url: (id) => `${BASE}/${id}/status`,
  },
  /** Delete — 주문 삭제 (관리자) */
  remove: {
    method: 'DELETE',
    url: (id) => `${BASE}/${id}`,
  },
}

/** @deprecated orderRoutes 사용 권장 — 하위 호환 */
export const ORDERS_API = {
  list: orderRoutes.list.url(),
  byId: orderRoutes.byId.url,
  cancel: orderRoutes.cancel.url,
}
