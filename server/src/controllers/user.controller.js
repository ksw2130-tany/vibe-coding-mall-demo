const bcrypt = require('bcrypt');
const { mongoose } = require('../db');
const User = require('../models/user.model');
const { signAuthToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const ALLOWED_USER_TYPES = ['customer', 'admin', 'seller']

function pickCreateUserBody(body) {
  if (!body || typeof body !== 'object') return null
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  let user_type = typeof body.user_type === 'string' ? body.user_type.trim() : 'customer'
  if (!ALLOWED_USER_TYPES.includes(user_type)) {
    user_type = 'customer'
  }
  return { email, name, password, user_type, address }
}

async function createUser(req, res) {
  try {
    const fields = pickCreateUserBody(req.body)
    if (!fields) {
      return res.status(400).json({ message: 'Invalid request body' })
    }
    const { email, name, password, user_type, address } = fields
    if (!email || !name || !password) {
      return res.status(400).json({
        message: 'email, name, password are required',
      })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await User.create({
      email,
      name,
      password: passwordHash,
      user_type,
      address: address || '',
    })

    return res.status(201).json(user.toJSON())
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' })
    }
    return res.status(400).json({ message: err.message })
  }
}

const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.'

async function loginUser(req, res) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해 주세요.',
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: LOGIN_FAILED_MESSAGE,
      })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({
        success: false,
        message: LOGIN_FAILED_MESSAGE,
      })
    }

    let token
    try {
      token = signAuthToken(user)
    } catch (signErr) {
      return res.status(503).json({
        success: false,
        message:
          signErr.message === 'JWT_SECRET is not set'
            ? '서버에 JWT_SECRET이 설정되지 않았습니다. 관리자에게 문의하세요.'
            : '토큰 발급에 실패했습니다.',
      })
    }

    return res.status(200).json({
      success: true,
      message: '로그인에 성공했습니다.',
      token,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      user: user.toJSON(),
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || '로그인 처리 중 오류가 발생했습니다.',
    })
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.authUserId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      })
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || '사용자 정보를 불러오지 못했습니다.',
    })
  }
}

async function getUsers(_req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const updates = { ...req.body }
    if (Object.prototype.hasOwnProperty.call(updates, 'password')) {
      if (typeof updates.password === 'string' && updates.password.length > 0) {
        updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS)
      } else {
        delete updates.password
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user.toJSON());
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
