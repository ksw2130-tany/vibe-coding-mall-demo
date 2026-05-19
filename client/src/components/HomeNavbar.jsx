import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import './HomeNavbar.css'
import { Link, useLocation } from 'react-router-dom'
import {
  clearStoredAuth,
  fetchCurrentUser,
  getCachedUser,
  getStoredAuth,
} from '../lib/auth.js'
import { refreshCartBadge, resetCartBadge, subscribeCartBadge } from '../lib/cart.js'

const mainNav = [
  { id: 'season', label: '계절 과일', href: '#seasonal' },
  { id: 'best', label: '베스트', href: '#reviews' },
  { id: 'gift', label: '선물 세트', href: '#all' },
  { id: 'organic', label: '친환경', href: '#all' },
  { id: 'sale', label: '특가', href: '#seasonal' },
]

/** @param {Record<string, unknown> | null} user */
function isAdminUser(user) {
  if (!user || typeof user !== 'object') return false
  const t = user.user_type ?? user.userType
  return t === 'admin'
}

/** @param {Record<string, unknown> | null} user */
function userDisplayName(user) {
  if (!user || typeof user.name !== 'string') return ''
  return user.name.trim()
}

function initialMe() {
  return getStoredAuth() ? getCachedUser() : null
}

const HomeNavbar = memo(function HomeNavbar() {
  const location = useLocation()
  const [me, setMe] = useState(initialMe)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => subscribeCartBadge(setCartCount), [])

  useEffect(() => {
    let cancelled = false
    if (!getStoredAuth()) {
      setMe(null)
      resetCartBadge()
      return () => {
        cancelled = true
      }
    }
    const cached = getCachedUser()
    if (cached) setMe(cached)
    ;(async () => {
      const u = await fetchCurrentUser()
      if (cancelled) return
      setMe(u ?? cached ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [location.key])

  const { loggedIn, showAdmin, name } = useMemo(() => {
    const hasToken = Boolean(getStoredAuth())
    const displayName = userDisplayName(me)
    const isLoggedIn = hasToken && Boolean(displayName)
    return {
      loggedIn: isLoggedIn,
      showAdmin: isLoggedIn && isAdminUser(me),
      name: displayName,
    }
  }, [me])

  useEffect(() => {
    if (!getStoredAuth()) {
      resetCartBadge()
      return
    }
    refreshCartBadge()
  }, [location.key, me])

  const handleLogout = useCallback(() => {
    clearStoredAuth()
    resetCartBadge()
    setMe(null)
  }, [])

  return (
    <header className="olivia-navbar" role="banner">
      <div className="olivia-navbar-top">
        <p className="olivia-brand-slogan">타니와 뽀뽀가 있는곳!!!</p>
        <div className="olivia-shell olivia-navbar-top-inner">
          <Link to="/" className="olivia-navbar-brand" aria-label="경안 슈퍼 홈">
            <span className="olivia-logo-leaf" aria-hidden>
              🌿
            </span>
            <span className="olivia-logo-text">경안 슈퍼</span>
          </Link>

          <div className="olivia-navbar-right">
            <div className="olivia-search" role="search">
            <span className="olivia-search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              className="olivia-search-input"
              placeholder="상품명을 입력해 주세요"
              aria-label="상품 검색"
            />
          </div>
          <nav className="olivia-util" aria-label="회원·주문">
            {loggedIn ? (
              <>
                <span className="olivia-welcome">
                  <strong className="olivia-welcome-name">{name}</strong>님 환영합니다
                </span>
                <span className="olivia-util-sep" aria-hidden>
                  |
                </span>
                <button type="button" className="olivia-util-btn" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="olivia-util-link">
                  로그인
                </Link>
                <span className="olivia-util-sep" aria-hidden>
                  |
                </span>
                <Link to="/signup" className="olivia-util-link">
                  회원가입
                </Link>
              </>
            )}
            <span className="olivia-util-sep" aria-hidden>
              |
            </span>
            <Link to="/cart" className="olivia-util-link olivia-util-cart">
              장바구니
              {cartCount > 0 ? (
                <span className="olivia-cart-badge" aria-label={`장바구니 ${cartCount}개`}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
            <span className="olivia-util-sep" aria-hidden>
              |
            </span>
            <Link to="/orders" className="olivia-util-link">
              주문조회
            </Link>
            {showAdmin ? (
              <>
                <span className="olivia-util-sep" aria-hidden>
                  |
                </span>
                <Link to="/admin" className="olivia-util-link olivia-util-admin">
                  관리자
                </Link>
              </>
            ) : null}
          </nav>
          </div>
        </div>
      </div>

      <div className="olivia-mainnav-wrap">
        <nav className="olivia-shell olivia-mainnav" aria-label="메인 메뉴">
          {mainNav.map((item) => (
            <a key={item.id} className="olivia-mainnav-link" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
})

export default HomeNavbar
