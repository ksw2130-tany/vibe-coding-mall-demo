const jwt = require('jsonwebtoken');

/**
 * 로그인용 액세스 토큰 발급 (HS256)
 * @param {{ _id: object, email: string, user_type: string }} user
 */
function signAuthToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret || !String(secret).trim()) {
    throw new Error('JWT_SECRET is not set')
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      user_type: user.user_type,
    },
    secret,
    { expiresIn }
  )
}

function verifyAuthToken(token) {
  const secret = process.env.JWT_SECRET
  if (!secret || !String(secret).trim()) {
    throw new Error('JWT_SECRET is not set')
  }
  return jwt.verify(token, secret)
}

module.exports = { signAuthToken, verifyAuthToken }
