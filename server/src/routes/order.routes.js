const express = require('express');
const { authMiddleware, requireAdmin } = require('../auth');
const {
  checkDuplicateOrder,
  createOrder,
  getAdminOrderPermissions,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
} = require('../controllers/order.controller');

const router = express.Router();

/**
 * 주문 CRUD — `/api/orders` (JWT 필요)
 *
 * | Method | Path           | CRUD | 설명                          |
 * |--------|----------------|------|-------------------------------|
 * | POST   | /check-duplicate | -  | 주문·결제 중복 확인         |
 * | POST   | /              | C    | 주문 생성 (장바구니/바로구매) |
 * | GET    | /              | R    | 내 주문 목록                  |
 * | GET    | /:id           | R    | 주문 상세                     |
 * | PATCH  | /:id           | U    | 배송 정보 수정                |
 * | PATCH  | /:id/cancel    | U    | 주문 취소                     |
 * | DELETE | /:id           | D    | 주문 삭제 (관리자)            |
 */
router.use(authMiddleware);

/** 중복 확인 — 결제 전 merchant_uid 검사 */
router.post('/check-duplicate', checkDuplicateOrder);

/** Create */
router.post('/', createOrder);

/** Read */
router.get('/', getMyOrders);

/** 관리자 전용 — `/:id`보다 위에 등록 */
router.use('/admin', requireAdmin);
router.get('/admin/permissions', getAdminOrderPermissions);
router.get('/admin/list', getAllOrders);

/** Update — 취소 (`:id` 단건 라우트보다 위) */
router.patch('/:id/cancel', cancelOrder);

/** Update — 상태 변경 (관리자) */
router.patch('/:id/status', requireAdmin, updateOrderStatus);

/** Update — 배송 정보 등 */
router.patch('/:id', updateOrder);

/** Read — 단건 */
router.get('/:id', getOrderById);

/** Delete — 관리자 */
router.delete('/:id', requireAdmin, deleteOrder);

module.exports = router;
