/**
 * 인증 실패 시 HTTP 응답용 에러
 */
class AuthError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {string} [code]
   */
  constructor(statusCode, message, code) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code || 'AUTH_ERROR';
  }
}

module.exports = { AuthError };
