const { ORDER_STATUSES } = require('../models/order.model');

/**
 * 관리자 주문 API 권한 — 단일 설정
 * - listAllOrders: 전체 주문 조회
 * - updateStatus: 주문 상태 변경 (아래 전이 규칙 적용)
 */
const ADMIN_ORDER_PERMISSIONS = {
  listAllOrders: true,
  updateStatus: true,
  viewAnyOrderDetail: true,
  deleteOrder: true,
};

/**
 * 관리자가 변경 가능한 상태 전이
 * @type {Record<string, string[]>}
 */
const ADMIN_STATUS_TRANSITIONS = {
  pending: ['cancelled', 'paid'],
  paid: ['preparing', 'shipped', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

function assertAdminPayload(payload) {
  if (!payload || payload.user_type !== 'admin') {
    const err = new Error('관리자만 접근할 수 있습니다.');
    err.statusCode = 403;
    err.code = 'ADMIN_REQUIRED';
    throw err;
  }
}

function canAdminTransitionStatus(fromStatus, toStatus) {
  if (!ORDER_STATUSES.includes(fromStatus) || !ORDER_STATUSES.includes(toStatus)) {
    return false;
  }
  const allowed = ADMIN_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

/** UI·API용 — 현재 상태에서 허용되는 관리자 액션 */
function getAdminOrderActions(status) {
  const allowed = ADMIN_STATUS_TRANSITIONS[status] || [];
  return {
    canPrepare: allowed.includes('preparing'),
    canShip: allowed.includes('shipped'),
    canDeliver: allowed.includes('delivered'),
    canCancel: allowed.includes('cancelled'),
    allowedNextStatuses: [...allowed],
  };
}

const ADMIN_ORDER_STAGES = [
  'confirmed',
  'preparing',
  'shipping_start',
  'shipping',
  'delivered',
  'cancelled',
];

/**
 * 관리자 UI 단계 → 주문 필드 직접 반영 (드롭다운용)
 * @param {import('mongoose').Document} order
 * @param {string} stage
 * @param {(order: import('mongoose').Document, status: string, note?: string) => void} appendHistory
 */
function applyAdminOrderStage(order, stage, appendHistory) {
  if (!ADMIN_ORDER_STAGES.includes(stage)) {
    const err = new Error('유효하지 않은 주문 단계입니다.');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  switch (stage) {
    case 'confirmed':
      order.status = 'paid';
      if (order.payment) {
        if (order.payment.status === 'pending') order.payment.status = 'paid';
        if (!order.payment.paidAt) order.payment.paidAt = now;
      }
      appendHistory(order, 'paid', '관리자: 주문확인');
      break;
    case 'preparing':
      order.status = 'preparing';
      appendHistory(order, 'preparing', '관리자: 상품준비중');
      break;
    case 'shipping_start':
      order.status = 'shipped';
      order.tracking = order.tracking || {};
      order.tracking.shippedAt = now;
      order.tracking.number = '';
      appendHistory(order, 'shipped', '관리자: 배송시작');
      break;
    case 'shipping':
      order.status = 'shipped';
      order.tracking = order.tracking || {};
      order.tracking.shippedAt = order.tracking.shippedAt || now;
      if (!String(order.tracking.number || '').trim()) {
        order.tracking.number = '배송중';
      }
      appendHistory(order, 'shipped', '관리자: 배송중');
      break;
    case 'delivered':
      order.status = 'delivered';
      order.tracking = order.tracking || {};
      order.tracking.deliveredAt = now;
      appendHistory(order, 'delivered', '관리자: 배송완료');
      break;
    case 'cancelled':
      order.status = 'cancelled';
      order.cancelledAt = now;
      order.cancelReason = '관리자 취소';
      if (order.payment?.status === 'paid') {
        order.payment.status = 'refunded';
      }
      appendHistory(order, 'cancelled', '관리자: 주문취소');
      break;
    default:
      break;
  }
}

function getAdminPermissionsPayload() {
  const actionsByStatus = {};
  for (const status of ORDER_STATUSES) {
    actionsByStatus[status] = getAdminOrderActions(status);
  }
  return {
    permissions: ADMIN_ORDER_PERMISSIONS,
    statusTransitions: ADMIN_STATUS_TRANSITIONS,
    actionsByStatus,
  };
}

module.exports = {
  ADMIN_ORDER_PERMISSIONS,
  ADMIN_ORDER_STAGES,
  ADMIN_STATUS_TRANSITIONS,
  assertAdminPayload,
  applyAdminOrderStage,
  canAdminTransitionStatus,
  getAdminOrderActions,
  getAdminPermissionsPayload,
};
