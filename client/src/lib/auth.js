/**
 * 기본값 `http://localhost:5000` — 브라우저가 API 서버에 직접 요청(CORS 허용됨).
 * 빈 문자열로 두면 `/api/...` 상대 경로만 쓰게 되어 Vite 프록시를 탐 → 백엔드가 꺼 있으면 **502 Bad Gateway**.
 * @see client/vite.config.js — `VITE_API_BASE_URL`로 덮어쓰기
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(
  /\/$/,
  '',
)

export const TOKEN_KEY = 'auth_token'
export const TOKEN_TYPE_KEY = 'auth_token_type'
export const USER_KEY = 'auth_user'

/** 토큰과 무관하게 스토리지에 남아 있는 `auth_user` JSON에서 이름만 읽기 (로그인 직후 인사말용) */
export function getCachedUserName() {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem(USER_KEY)
    if (!raw) continue
    try {
      const u = JSON.parse(raw)
      if (u && typeof u.name === 'string') {
        const n = u.name.trim()
        if (n) return n
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

/** 토큰과 무관하게 스토리지의 `auth_user` JSON 전체 (로그인 직후·새로고침 초기 표시용) */
export function getCachedUser() {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem(USER_KEY)
    if (!raw) continue
    try {
      const u = JSON.parse(raw)
      if (u && typeof u === 'object') return u
    } catch {
      /* ignore */
    }
  }
  return null
}

/**
 * 로그인 시 remember 여부에 따라 localStorage 또는 sessionStorage 중 토큰이 있는 쪽 반환
 * @returns {{ storage: Storage, token: string, tokenType: string } | null}
 */
export function getStoredAuth() {
  for (const storage of [localStorage, sessionStorage]) {
    const token = storage.getItem(TOKEN_KEY)
    if (token) {
      return {
        storage,
        token,
        tokenType: storage.getItem(TOKEN_TYPE_KEY) || 'Bearer',
      }
    }
  }
  return null
}

const AUTH_STORAGE_KEYS = [TOKEN_KEY, TOKEN_TYPE_KEY, USER_KEY, 'auth_token_expires_in']

/** localStorage·sessionStorage에서 인증 관련 항목 제거 (로그아웃) */
export function clearStoredAuth() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of AUTH_STORAGE_KEYS) {
      storage.removeItem(key)
    }
  }
}

/** @returns {Promise<Record<string, unknown> | null>} */
export async function fetchCurrentUser() {
  const auth = getStoredAuth()
  if (!auth) return null

  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    cache: 'no-store',
    headers: {
      Authorization: `${auth.tokenType} ${auth.token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) return null

  const data = await res.json().catch(() => null)
  if (!data || data.success !== true || !data.user) return null

  try {
    auth.storage.setItem(USER_KEY, JSON.stringify(data.user))
  } catch {
    /* ignore quota */
  }

  return data.user
}
