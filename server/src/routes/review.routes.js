const express = require('express');
const { authMiddleware, requireAdmin } = require('../auth');
const {
  getPublicReviews,
  getAdminReviews,
  getReviewById,
  createReview,
  updateReview,
  toggleReviewPublish,
  deleteReview,
} = require('../controllers/review.controller');

const router = express.Router();

/** 공개 리뷰 목록 (메인 베스트 상품) */
router.get('/', getPublicReviews);

/** 관리자 리뷰 목록 */
router.get('/admin/list', authMiddleware, requireAdmin, getAdminReviews);

/** 리뷰 단건 */
router.get('/:id', getReviewById);

/** 리뷰 등록 */
router.post('/', authMiddleware, requireAdmin, createReview);

/** 리뷰 수정 */
router.put('/:id', authMiddleware, requireAdmin, updateReview);

/** 노출/숨김 토글 */
router.patch('/:id/publish', authMiddleware, requireAdmin, toggleReviewPublish);

/** 리뷰 삭제 */
router.delete('/:id', authMiddleware, requireAdmin, deleteReview);

module.exports = router;
