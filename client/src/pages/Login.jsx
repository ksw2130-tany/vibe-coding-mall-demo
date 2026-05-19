import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  API_BASE_URL,
  TOKEN_KEY,
  TOKEN_TYPE_KEY,
  USER_KEY,
  fetchCurrentUser,
  getStoredAuth,
} from '../lib/auth.js'
import './Login.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

/**
 * 서버: `server/src/index.js` → `app.use('/api/users', userRouter)`
 * 라우트: `server/src/routes/user.routes.js` → `POST /login` → `loginUser`
 * 본문: `{ email, password }` — `server/src/controllers/user.controller.js`
 */
const LOGIN_URL = `${API_BASE_URL}/api/users/login`

function IconMail() {
  return (
    <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconEye({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

function IconGoogle() {
  return (
    <span className="login-social-icon" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    </span>
  )
}

function IconFacebook() {
  return (
    <span className="login-social-icon" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </span>
  )
}

/**
 * POST /api/users/login — 서버 `loginUser`와 동일 계약
 * @returns {{ ok: boolean, status: number, data: object }}
 */
async function loginWithEmailPassword(email, password) {
  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  let data = {}
  try {
    data = await res.json()
  } catch {
    // 빈 응답
  }

  return { ok: res.ok, status: res.status, data }
}

function errorMessageFromResponse(data, fallback) {
  if (data && typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }
  return fallback
}

function saveAuthAndGo(data, remember, navigate) {
  const storage = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  other.removeItem(TOKEN_KEY)
  other.removeItem(TOKEN_TYPE_KEY)
  other.removeItem(USER_KEY)
  storage.setItem(TOKEN_KEY, data.token)
  if (data.tokenType) storage.setItem(TOKEN_TYPE_KEY, data.tokenType)
  if (data.user) storage.setItem(USER_KEY, JSON.stringify(data.user))
  if (data.expiresIn) storage.setItem('auth_token_expires_in', String(data.expiresIn))
  navigate('/', { replace: true, state: { loginOk: true, userId: data.user?._id } })
}

export default function Login() {
  const navigate = useNavigate()
  /** 토큰 없음 → 바로 폼. 토큰 있음 → `/me` 검증 후 `go-home` 또는 폼 */
  const [authGate, setAuthGate] = useState(() => (getStoredAuth() ? 'checking' : 'form'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [socialHint, setSocialHint] = useState('')
  const googleBtnRef = useRef(null)

  useEffect(() => {
    if (authGate !== 'checking') return undefined
    let cancelled = false
    ;(async () => {
      const user = await fetchCurrentUser()
      if (cancelled) return
      setAuthGate(user ? 'go-home' : 'form')
    })()
    return () => { cancelled = true }
  }, [authGate])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return
    if (typeof window.google === 'undefined') return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: '100%',
      locale: 'ko',
    })
  })

  async function handleGoogleCredential({ credential }) {
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      let data = {}
      try { data = await res.json() } catch { /* empty */ }
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Google 로그인에 실패했습니다.')
        return
      }
      saveAuthAndGo(data, true, navigate)
    } catch {
      setFormError('서버에 연결할 수 없습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSocialHint('')

    if (!email.trim()) {
      setFormError('이메일을 입력해 주세요.')
      return
    }
    if (!password) {
      setFormError('비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const emailNorm = email.trim().toLowerCase()
      const { ok, status, data } = await loginWithEmailPassword(emailNorm, password)

      if (!ok) {
        const fallback =
          status === 401
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : status === 503
              ? '로그인 서비스를 일시적으로 사용할 수 없습니다.'
              : '로그인에 실패했습니다.'
        setFormError(errorMessageFromResponse(data, fallback))
        return
      }

      if (data.success !== true) {
        setFormError(errorMessageFromResponse(data, '로그인에 실패했습니다.'))
        return
      }

      if (!data.token) {
        setFormError('토큰이 발급되지 않았습니다. 서버 설정을 확인해 주세요.')
        return
      }

      saveAuthAndGo(data, remember, navigate)
    } catch {
      setFormError('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authGate === 'go-home') {
    return <Navigate to="/" replace />
  }

  if (authGate === 'checking') {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-form-info" role="status">
            로그인 확인 중…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-back">
          ← 홈
        </Link>

        <header className="login-header">
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">계정에 로그인하여 쇼핑을 시작하세요</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {formError ? <p className="login-form-error" role="alert">{formError}</p> : null}
          {socialHint ? (
            <p className="login-form-info" role="status">{socialHint}</p>
          ) : null}

          <div className="login-field">
            <label className="login-label" htmlFor="login-email">이메일</label>
            <div className="login-input-wrap">
              <IconMail />
              <input
                id="login-email"
                name="email"
                type="email"
                className="login-input"
                placeholder="your@email.com"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">비밀번호</label>
            <div className="login-input-wrap">
              <IconLock />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input--with-toggle"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
              <button
                type="button"
                className="login-toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <IconEye open={showPassword} />
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(ev) => setRemember(ev.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>
            <button
              type="button"
              className="login-forgot"
              onClick={() => setFormError('비밀번호 찾기는 준비 중입니다.')}
            >
              비밀번호 찾기
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? '처리 중…' : '로그인'}
          </button>
        </form>

        <div className="login-divider" role="separator">
          또는
        </div>

        <div className="login-social">
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="login-google-btn-wrap" />
          ) : (
            <button
              type="button"
              className="login-social-btn"
              onClick={() => { setFormError(''); setSocialHint('Google Client ID가 설정되지 않았습니다.') }}
            >
              <IconGoogle />
              Google로 로그인
            </button>
          )}
        </div>

        <p className="login-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
