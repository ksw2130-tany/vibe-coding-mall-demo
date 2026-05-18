const {
  authenticateFromHeader,
  attachAuthToRequest,
  authErrorResponse,
} = require('../auth/auth.service');

/**
 * Authorization: Bearer <JWT> 검증 후 req.authUserId, req.authPayload 설정
 */
function authMiddleware(req, res, next) {
  try {
    const auth = authenticateFromHeader(req.headers.authorization);
    attachAuthToRequest(req, auth);
    return next();
  } catch (err) {
    const { statusCode, body } = authErrorResponse(err);
    return res.status(statusCode).json(body);
  }
}

module.exports = { authMiddleware };
