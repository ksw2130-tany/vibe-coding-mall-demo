const { isAdminPayload } = require('../auth/auth.service');

/**
 * authMiddleware 이후 사용 — JWT payload의 user_type이 admin인지 확인
 */
function requireAdmin(req, res, next) {
  if (!isAdminPayload(req.authPayload)) {
    return res.status(403).json({
      success: false,
      message: '관리자만 접근할 수 있습니다.',
    });
  }
  return next();
}

module.exports = { requireAdmin };
