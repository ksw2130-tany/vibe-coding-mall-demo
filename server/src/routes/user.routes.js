const express = require('express');
const { authMiddleware } = require('../auth');
const {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

const router = express.Router();

/** 회원가입 — MongoDB `users` 컬렉션에 문서 생성 */
router.post('/', createUser);
/** 로그인 — 이메일·비밀번호 (성공 200 / 실패 401·400) */
router.post('/login', loginUser);
/** 현재 로그인 사용자 — Authorization: Bearer JWT (반드시 /:id 보다 위) */
router.get('/me', authMiddleware, getMe);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
