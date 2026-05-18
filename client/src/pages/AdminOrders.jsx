import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminOrderStatusMenu from '../components/AdminOrderStatusMenu.jsx'
import AdminTopbar from '../components/AdminTopbar.jsx'
import { isAdminAccessDenied } from '../lib/adminAuth.js'
import {
  ADMIN_ORDER_TABS,
  countAdminOrdersByTab,
  fetchAdminOrderPermissionsApi,
  fetchAdminOrders,
  filterAdminOrdersByTab,
  getAdminOrderStatusTone,
  messageFromApi,
} from '../lib/orders.js'
import './Admin.css'
import './AdminOrders.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function formatOrderDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getCustomerName(order) {
  const user = order.user
  if (user && typeof user === 'object' && user.name) return String(user.name)
  return order.shipping?.recipientName || '고객'
}

function getCustomerEmail(order) {
  const user = order.user
  if (user && typeof user === 'object' && user.email) return String(user.email)
  return '—'
}

function formatAddress(order) {
  const ship = order.shipping || {}
  const parts = [ship.address, ship.addressDetail].filter(Boolean)
  return parts.join(' ') || '—'
}

function matchesSearch(order, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const orderNumber = String(order.orderNumber || '').toLowerCase()
  const name = getCustomerName(order).toLowerCase()
  const email = getCustomerEmail(order).toLowerCase()
  const phone = String(order.shipping?.phone || '').toLowerCase()
  return (
    orderNumber.includes(q) ||
    name.includes(q) ||
    email.includes(q) ||
    phone.includes(q)
  )
}

function OrderStatusIcon({ tone }) {
  if (tone === 'shipping') {
    return (
      <span className="admin-orders-card-icon admin-orders-card-icon--shipping" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </span>
    )
  }
  if (tone === 'done') {
    return (
      <span className="admin-orders-card-icon admin-orders-card-icon--done" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      </span>
    )
  }
  if (tone === 'muted') {
    return (
      <span className="admin-orders-card-icon admin-orders-card-icon--muted" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </span>
    )
  }
  return (
    <span className="admin-orders-card-icon admin-orders-card-icon--processing" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    </span>
  )
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setListError('')
    setAccessDenied(false)
    const { ok, data, status } = await fetchAdminOrders()
    if (!ok) {
      if (status === 403 || isAdminAccessDenied(data)) {
        setAccessDenied(true)
        setListError('관리자만 전체 주문을 조회할 수 있습니다.')
      } else {
        setListError(messageFromApi(data, '주문 목록을 불러오지 못했습니다.'))
      }
      setOrders([])
    } else {
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    ;(async () => {
      const { ok, data, status } = await fetchAdminOrderPermissionsApi()
      if (!ok) {
        if (status === 403 || isAdminAccessDenied(data)) {
          setAccessDenied(true)
          setLoading(false)
          return
        }
      }
      await loadOrders()
    })()
  }, [loadOrders])

  const tabCounts = useMemo(() => countAdminOrdersByTab(orders), [orders])

  const visibleOrders = useMemo(() => {
    const byTab = filterAdminOrdersByTab(orders, activeTab)
    return byTab.filter((order) => matchesSearch(order, searchQuery))
  }, [orders, activeTab, searchQuery])

  if (accessDenied) {
    return (
      <div className="admin admin-orders">
        <AdminTopbar dashboardLink />
        <div className="admin-shell admin-orders-forbidden">
          <h2>접근 권한이 없습니다</h2>
          <p>관리자 계정으로 로그인한 경우에만 주문 관리를 이용할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin admin-orders">
      <AdminTopbar dashboardLink />

      <main className="admin-main admin-orders-main">
        <div className="admin-shell">
          <header className="admin-orders-page-head">
            <button
              type="button"
              className="admin-orders-back"
              onClick={() => navigate('/admin')}
              aria-label="관리자 대시보드로 돌아가기"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="admin-orders-title">주문 관리</h1>
          </header>

          <div className="admin-orders-toolbar">
            <div className="admin-orders-search-wrap">
              <span className="admin-orders-search-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="search"
                className="admin-orders-search"
                placeholder="주문번호 또는 고객명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="주문 검색"
              />
            </div>
            <button
              type="button"
              className="admin-orders-filter-btn"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              필터
            </button>
          </div>

          {filterOpen ? (
            <p className="admin-orders-filter-hint" role="status">
              검색창에 주문번호, 고객명, 이메일, 연락처를 입력해 주세요.
            </p>
          ) : null}

          <div className="admin-orders-tabs" role="tablist" aria-label="주문 상태">
            {ADMIN_ORDER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`admin-orders-tab${activeTab === tab.id ? ' admin-orders-tab--on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className="admin-orders-tab-count">{tabCounts[tab.id] ?? 0}</span>
              </button>
            ))}
          </div>

          {listError ? (
            <p className="admin-orders-alert admin-orders-alert--error" role="alert">
              {listError}
            </p>
          ) : null}

          {loading ? (
            <p className="admin-orders-status">불러오는 중…</p>
          ) : visibleOrders.length === 0 ? (
            <p className="admin-orders-status">표시할 주문이 없습니다.</p>
          ) : (
            <ul className="admin-orders-list">
              {visibleOrders.map((order) => {
                const id = String(order._id)
                const tone = getAdminOrderStatusTone(order)
                const itemCount = Array.isArray(order.items) ? order.items.length : 0
                const isExpanded = expandedId === id

                return (
                  <li key={id}>
                    <article className="admin-orders-card">
                      <div className="admin-orders-card-top">
                        <div className="admin-orders-card-head">
                          <OrderStatusIcon tone={tone} />
                          <div>
                            <p className="admin-orders-card-id">{order.orderNumber}</p>
                            <p className="admin-orders-card-meta">
                              {getCustomerName(order)} · {formatOrderDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="admin-orders-card-top-right">
                          <AdminOrderStatusMenu order={order} onUpdated={loadOrders} />
                          <p className="admin-orders-card-amount">₩{formatWon(order.totalAmount)}</p>
                          <button
                            type="button"
                            className="admin-orders-detail-btn"
                            onClick={() => setExpandedId(isExpanded ? null : id)}
                            aria-expanded={isExpanded}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            상세보기
                          </button>
                        </div>
                      </div>

                      <div className="admin-orders-card-grid">
                        <div className="admin-orders-card-col">
                          <p className="admin-orders-card-label">고객 정보</p>
                          <p className="admin-orders-card-value">{getCustomerEmail(order)}</p>
                          <p className="admin-orders-card-sub">{order.shipping?.phone || '—'}</p>
                        </div>
                        <div className="admin-orders-card-col">
                          <p className="admin-orders-card-label">주문 상품</p>
                          <p className="admin-orders-card-value">{itemCount}개 상품</p>
                        </div>
                        <div className="admin-orders-card-col">
                          <p className="admin-orders-card-label">배송 주소</p>
                          <p className="admin-orders-card-value admin-orders-card-value--address">
                            {formatAddress(order)}
                          </p>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="admin-orders-expand">
                          <p className="admin-orders-expand-title">주문 상품 목록</p>
                          <ul className="admin-orders-expand-list">
                            {(order.items || []).map((item) => (
                              <li key={item._id || `${item.name}-${item.quantity}`}>
                                {item.name} × {item.quantity} — ₩{formatWon(item.lineTotal)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
