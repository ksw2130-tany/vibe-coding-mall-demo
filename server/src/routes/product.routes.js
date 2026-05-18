const express = require('express');
const { authMiddleware, requireAdmin } = require('../auth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

const router = express.Router();

/** 상품 목록 — ?category= & ?q= & ?page= & ?limit= (페이지당 2개 등) */
router.get('/', getProducts);

/** 상품 단건 조회 */
router.get('/:id', getProductById);

/** 상품 등록 — 관리자 JWT 필요 */
router.post('/', authMiddleware, requireAdmin, createProduct);

/** 상품 수정 — 관리자 JWT 필요 (부분 수정 가능) */
router.put('/:id', authMiddleware, requireAdmin, updateProduct);

/** 상품 삭제 — 관리자 JWT 필요 */
router.delete('/:id', authMiddleware, requireAdmin, deleteProduct);

module.exports = router;
