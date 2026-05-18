import { useEffect, useState } from 'react'
import { fetchCurrentUser, getStoredAuth } from './auth.js'

/** @param {unknown} user */
export function isAdminUser(user) {
  if (!user || typeof user !== 'object') return false
  const t = user.user_type ?? user.userType
  return t === 'admin'
}

/**
 * 관리자 페이지 접근 게이트
 * @param {string} [redirectFrom] 로그인 후 복귀 경로
 * @returns {{ authGate: 'checking' | 'denied' | 'forbidden' | 'ok', user: object | null }}
 */
export function useAdminGate(redirectFrom = '/admin') {
  const [authGate, setAuthGate] = useState(() => (getStoredAuth() ? 'checking' : 'denied'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!getStoredAuth()) {
      setAuthGate('denied')
      setUser(null)
      return undefined
    }

    ;(async () => {
      const me = await fetchCurrentUser()
      if (cancelled) return
      if (!me) {
        setAuthGate('denied')
        setUser(null)
        return
      }
      if (!isAdminUser(me)) {
        setAuthGate('forbidden')
        setUser(me)
        return
      }
      setAuthGate('ok')
      setUser(me)
    })()

    return () => {
      cancelled = true
    }
  }, [redirectFrom])

  return { authGate, user }
}

/** API 403 응답이 관리자 권한 거부인지 */
export function isAdminAccessDenied(data) {
  if (!data || typeof data !== 'object') return false
  return data.code === 'ADMIN_REQUIRED' || /관리자만/.test(String(data.message || ''))
}
