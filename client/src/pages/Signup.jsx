import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../lib/auth.js'
import './Signup.css'

const SIGNUP_URL = `${API_BASE_URL}/api/users`

function IconUser() {
  return (
    <svg className="signup-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg className="signup-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="signup-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
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

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing

  function setAgreeAll(checked) {
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
    setAgreeMarketing(checked)
  }

  function toggleAgreeAll() {
    setAgreeAll(!agreeAll)
  }

  function onToggleTerms(checked) {
    setAgreeTerms(checked)
  }

  function onTogglePrivacy(checked) {
    setAgreePrivacy(checked)
  }

  function onToggleMarketing(checked) {
    setAgreeMarketing(checked)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError('이름을 입력해 주세요.')
      return
    }
    if (!email.trim()) {
      setFormError('이메일을 입력해 주세요.')
      return
    }
    if (!password) {
      setFormError('비밀번호를 입력해 주세요.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!agreeTerms || !agreePrivacy) {
      setFormError('필수 약관에 동의해 주세요.')
      return
    }

    const payload = {
      email: email.trim(),
      name: trimmedName,
      password,
      user_type: 'customer',
    }

    setSubmitting(true)
    try {
      const res = await fetch(SIGNUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        // ignore empty body
      }

      if (!res.ok) {
        const msg =
          typeof data?.message === 'string' ? data.message : '가입에 실패했습니다.'
        setFormError(msg)
        return
      }

      navigate('/', {
        replace: true,
        state: { signupOk: true, userId: data?._id },
      })
    } catch {
      setFormError('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <Link to="/" className="signup-back">
          ← 홈
        </Link>

        <header className="signup-header">
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">새로운 계정을 만들어 쇼핑을 시작하세요</p>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {formError ? <p className="signup-form-error" role="alert">{formError}</p> : null}

          <div className="signup-field">
            <label className="signup-label" htmlFor="name">이름</label>
            <div className="signup-input-wrap">
              <IconUser />
              <input
                id="name"
                name="name"
                type="text"
                className="signup-input"
                placeholder="홍길동"
                autoComplete="name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-label" htmlFor="email">이메일</label>
            <div className="signup-input-wrap">
              <IconMail />
              <input
                id="email"
                name="email"
                type="email"
                className="signup-input"
                placeholder="your@email.com"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-label" htmlFor="password">비밀번호</label>
            <div className="signup-input-wrap">
              <IconLock />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="signup-input signup-input--with-toggle"
                placeholder="비밀번호를 입력하세요"
                autoComplete="new-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
              <button
                type="button"
                className="signup-toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <IconEye open={showPassword} />
              </button>
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-label" htmlFor="confirmPassword">비밀번호 확인</label>
            <div className="signup-input-wrap">
              <IconLock />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className="signup-input signup-input--with-toggle"
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
              />
              <button
                type="button"
                className="signup-toggle-visibility"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <IconEye open={showConfirm} />
              </button>
            </div>
          </div>

          <section className="signup-agreements-panel" aria-label="약관 동의">
            <div className="signup-agreements-block">
              <div className="signup-field signup-field--divider">
              <label className="signup-label" htmlFor="agreeAll">전체 동의</label>
              <div className="signup-checkbox-row">
                <input
                  id="agreeAll"
                  type="checkbox"
                  className="signup-checkbox-only"
                  checked={agreeAll}
                  onChange={() => toggleAgreeAll()}
                />
              </div>
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="agreeTerms">이용약관 동의 (필수)</label>
              <div className="signup-checkbox-row">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  className="signup-checkbox-only"
                  checked={agreeTerms}
                  onChange={(ev) => onToggleTerms(ev.target.checked)}
                />
                <button type="button" className="signup-view-link" onClick={(e) => e.preventDefault()}>보기</button>
              </div>
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="agreePrivacy">개인정보처리방침 동의 (필수)</label>
              <div className="signup-checkbox-row">
                <input
                  id="agreePrivacy"
                  type="checkbox"
                  className="signup-checkbox-only"
                  checked={agreePrivacy}
                  onChange={(ev) => onTogglePrivacy(ev.target.checked)}
                />
                <button type="button" className="signup-view-link" onClick={(e) => e.preventDefault()}>보기</button>
              </div>
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="agreeMarketing">마케팅 정보 수신 동의 (선택)</label>
              <div className="signup-checkbox-row">
                <input
                  id="agreeMarketing"
                  type="checkbox"
                  className="signup-checkbox-only"
                  checked={agreeMarketing}
                  onChange={(ev) => onToggleMarketing(ev.target.checked)}
                />
              </div>
              </div>
            </div>
          </section>

          <button type="submit" className="signup-submit" disabled={submitting}>
            {submitting ? '처리 중…' : '회원가입'}
          </button>
        </form>

        <p className="signup-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
