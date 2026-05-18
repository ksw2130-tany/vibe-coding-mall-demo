const express = require('express');
const { authMiddleware } = require('../auth');
const {
  getCart,
  getCartItem,
  addCartItem,
  updateCartItem,
  replaceCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cart.controller');

const router = express.Router();

/**
 * 장바구니 CRUD — `/api/cart`
 * 모든 라우트에 JWT 인증 필요 (`Authorization: Bearer <token>`)
 *
 * | Method | Path              | CRUD | 설명                    |
 * |--------|-------------------|------|-------------------------|
 * | GET    | /                 | R    | 내 장바구니 전체 조회   |
 * | GET    | /items/:itemId    | R    | 장바구니 항목 단건 조회 |
 * | POST   | /items            | C    | 상품 담기               |
 * | PATCH  | /items/:itemId    | U    | 항목 부분 수정          |
 * | PUT    | /items/:itemId    | U    | 항목 전체 수정          |
 * | DELETE | /items/:itemId    | D    | 항목 삭제               |
 * | DELETE | /                 | D    | 장바구니 비우기         |
 */
router.use(authMiddleware);

/** Read — 장바구니 전체 */
router.get('/', getCart);

/** Read — 항목 단건 (`:itemId`는 장바구니 items._id) */
router.get('/items/:itemId', getCartItem);

/** Create — 상품 담기 */
router.post('/items', addCartItem);

/** Update — 부분 수정 (quantity, size, variety) */
router.patch('/items/:itemId', updateCartItem);

/** Update — 전체 수정 (quantity 필수) */
router.put('/items/:itemId', replaceCartItem);

/** Delete — 항목 삭제 */
router.delete('/items/:itemId', removeCartItem);

/** Delete — 장바구니 전체 비우기 (항목 라우트보다 아래에 둠) */
router.delete('/', clearCart);

module.exports = router;
