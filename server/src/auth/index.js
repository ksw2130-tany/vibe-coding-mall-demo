/**
 * 인증 모듈 — 서비스 로직 + 미들웨어 re-export
 * @see ./auth.service.js   토큰 추출·검증
 * @see ../middleware/auth.middleware.js
 */
const authService = require('./auth.service');
const { AuthError } = require('./auth.errors');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

module.exports = {
  AuthError,
  authMiddleware,
  requireAdmin,
  ...authService,
};
