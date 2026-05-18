const { mongoose } = require('../db');
const { verifyAuthToken } = require('../utils/jwt');
const { AuthError } = require('./auth.errors');

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 * @param {string|undefined} header
 * @returns {string}
 */
function extractBearerToken(header) {
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    throw new AuthError(
      401,
      '인증이 필요합니다. Authorization: Bearer 토큰을 보내 주세요.',
      'MISSING_AUTH_HEADER'
    );
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new AuthError(401, '인증이 필요합니다.', 'MISSING_TOKEN');
  }

  return token;
}

/**
 * JWT 검증 후 사용자 ID·payload 반환
 * @param {string} token
 * @returns {{ userId: string, payload: object }}
 */
function authenticateToken(token) {
  try {
    const payload = verifyAuthToken(token);
    const userId = payload && payload.sub;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AuthError(401, '유효하지 않은 토큰입니다.', 'INVALID_SUBJECT');
    }

    return { userId, payload };
  } catch (err) {
    if (err instanceof AuthError) {
      throw err;
    }
    if (err.message === 'JWT_SECRET is not set') {
      throw new AuthError(503, '서버 인증 설정 오류입니다.', 'JWT_SECRET_MISSING');
    }
    if (err.name === 'TokenExpiredError') {
      throw new AuthError(401, '토큰이 만료되었습니다.', 'TOKEN_EXPIRED');
    }
    throw new AuthError(401, '유효하지 않은 토큰입니다.', 'INVALID_TOKEN');
  }
}

/**
 * Authorization 헤더 한 번에 검증
 * @param {string|undefined} authorizationHeader
 * @returns {{ userId: string, payload: object }}
 */
function authenticateFromHeader(authorizationHeader) {
  const token = extractBearerToken(authorizationHeader);
  return authenticateToken(token);
}

/**
 * Express req에 인증 정보 부착
 * @param {import('express').Request} req
 * @param {{ userId: string, payload: object }} auth
 */
function attachAuthToRequest(req, { userId, payload }) {
  req.authUserId = userId;
  req.authPayload = payload;
}

/** JWT payload가 관리자인지 */
function isAdminPayload(payload) {
  return Boolean(payload && payload.user_type === 'admin');
}

/**
 * AuthError → JSON 응답 본문
 * @param {unknown} err
 * @returns {{ statusCode: number, body: { success: false, message: string } }}
 */
function authErrorResponse(err) {
  if (err instanceof AuthError) {
    return {
      statusCode: err.statusCode,
      body: { success: false, message: err.message },
    };
  }
  return {
    statusCode: 500,
    body: { success: false, message: '인증 처리 중 오류가 발생했습니다.' },
  };
}

module.exports = {
  extractBearerToken,
  authenticateToken,
  authenticateFromHeader,
  attachAuthToRequest,
  isAdminPayload,
  authErrorResponse,
};
