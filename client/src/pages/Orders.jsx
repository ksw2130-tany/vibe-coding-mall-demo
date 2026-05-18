import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import { getStoredAuth } from '../lib/auth.js'
import {
  ORDER_LIST_STATUS_LABEL,
  ORDER_LIST_TABS,
  countOrdersByTab,
  fetchMyOrders,
  filterOrdersByTab,
  messageFromApi,
  normalizeOrderListTabId,
} from '../lib/orders.js'
import './Orders.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function formatOrderDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatFooterDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getStatusDate(order, status) {
  const entry = order.statusHistory?.find((h) => h.status === status)
  return entry?.at || null
}

function getEstimatedDeliveryDate(createdAt) {
  const base = createdAt ? new Date(createdAt) : new Date()
  const eta = new Date(base)
  eta.setDate(eta.getDate() + 3)
  return eta
}

function getOrderFooterNote(order) {
  if (order.status === 'delivered') {
    const at = getStatusDate(order, 'delivered') || order.updatedAt
    return at ? `완료: ${formatFooterDate(at)}` : null
  }
  if (order.status === 'shipped') {
    return `배송 예정일: ${formatFooterDate(getEstimatedDeliveryDate(order.createdAt))}`
  }
  if (['pending', 'paid', 'preparing'].includes(order.status)) {
    return '주문이 처리 중입니다.'
  }
  if (order.status === 'cancelled') {
    const at = getStatusDate(order, 'cancelled') || order.cancelledAt
    return at ? `취소: ${formatFooterDate(at)}` : '주문이 취소되었습니다.'
  }
  if (order.status === 'refunded') {
    const at = getStatusDate(order, 'refunded') || order.cancelledAt
    return at ? `환불: ${formatFooterDate(at)}` : '환불이 완료되었습니다.'
  }
  return null
}

function getListStatusLabel(order) {
  if (order.status === 'shipped' && !order.tracking?.number?.trim()) {
    return '배송시작'
  }
  return ORDER_LIST_STATUS_LABEL[order.status] || order.status
}

function getStatusBadgeClass(order) {
  const status = order.status
  if (status === 'delivered') return 'delivered'
  if (status === 'shipped') return 'shipped'
  if (status === 'preparing') return 'preparing'
  if (status === 'pending' || status === 'paid') return 'confirmed'
  if (status === 'cancelled' || status === 'refunded') return 'muted'
  return 'confirmed'
}

function getStatusIconClass(order) {
  const status = order.status
  if (status === 'delivered') return 'done'
  if (status === 'shipped') return 'shipping'
  if (status === 'preparing') return 'preparing'
  if (status === 'cancelled' || status === 'refunded') return 'muted'
  return 'confirmed'
}

function itemOptionText(item) {
  const parts = []
  if (item.size) parts.push(`사이즈: ${item.size}`)
  if (item.variety) parts.push(`옵션: ${item.variety}`)
  return parts.join(' · ')
}

function reorderTarget(order) {
  const items = Array.isArray(order.items) ? order.items : []
  if (items.length === 1 && items[0].product) {
    const pid = typeof items[0].product === 'string' ? items[0].product : items[0].product?._id
    if (pid) return `/products/${pid}`
  }
  return '/'
}

function OrderStatusIcon({ order }) {
  const kind = getStatusIconClass(order)
  if (kind === 'done') {
    return (
      <span className="orders-card-icon orders-card-icon--done" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (kind === 'shipping') {
    return (
      <span className="orders-card-icon orders-card-icon--shipping" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </span>
    )
  }
  if (kind === 'muted') {
    return (
      <span className="orders-card-icon orders-card-icon--muted" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span className="orders-card-icon orders-card-icon--processing" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function OrderCard({ order }) {
  const items = Array.isArray(order.items) ? order.items : []
  const footerNote = getOrderFooterNote(order)
  const badgeClass = getStatusBadgeClass(order)
  const statusLabel = getListStatusLabel(order)

  return (
    <article className="orders-card">
      <header className="orders-card-header">
        <div className="orders-card-header-left">
          <OrderStatusIcon order={order} />
          <div>
            <p className="orders-card-number">주문 #{order.orderNumber}</p>
            <p className="orders-card-date">주문일: {formatOrderDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="orders-card-header-right">
          <span className={`orders-badge orders-badge--${badgeClass}`}>{statusLabel}</span>
          <p className="orders-card-total">{formatWon(order.totalAmount)}원</p>
        </div>
      </header>

      <ul className="orders-card-items">
        {items.map((item) => (
          <li key={item._id || `${item.name}-${item.quantity}`} className="orders-card-item">
            {item.image ? (
              <img src={item.image} alt="" className="orders-card-thumb" />
            ) : (
              <div className="orders-card-thumb orders-card-thumb--empty" />
            )}
            <div className="orders-card-item-body">
              <p className="orders-card-item-name">{item.name}</p>
              {itemOptionText(item) ? (
                <p className="orders-card-item-opt">{itemOptionText(item)}</p>
              ) : null}
              <p className="orders-card-item-qty">수량: {item.quantity}</p>
              <p className="orders-card-item-price">
                {formatWon(item.lineTotal ?? item.quantity * item.unitPrice)}원
              </p>
            </div>
          </li>
        ))}
      </ul>

      {footerNote ? <p className="orders-card-footer-note">{footerNote}</p> : null}

      <div className="orders-card-actions">
        <Link to={`/orders/${order._id}`} className="orders-card-btn">
          주문 상세보기
        </Link>
        {order.status === 'shipped' ? (
          <Link to={`/orders/${order._id}`} className="orders-card-btn">
            배송 추적
          </Link>
        ) : order.status === 'delivered' ? (
          <Link to={reorderTarget(order)} className="orders-card-btn">
            다시 주문하기
          </Link>
        ) : ['pending', 'paid', 'preparing'].includes(order.status) ? (
          <Link to={reorderTarget(order)} className="orders-card-btn">
            다시 주문하기
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = normalizeOrderListTabId(searchParams.get('tab'))

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getStoredAuth()) return undefined
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { ok, data } = await fetchMyOrders()
      if (cancelled) return
      if (!ok) {
        setError(messageFromApi(data, '주문 목록을 불러오지 못했습니다.'))
        setOrders([])
      } else {
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const tabCounts = useMemo(() => countOrdersByTab(orders), [orders])
  const filteredOrders = useMemo(
    () => filterOrdersByTab(orders, activeTab),
    [orders, activeTab]
  )

  function onTabChange(tabId) {
    if (tabId === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: tabId })
    }
  }

  if (!getStoredAuth()) {
    return <Navigate to="/login" replace state={{ from: '/orders' }} />
  }

  return (
    <div className="orders-page">
      <HomeNavbar />

      <main className="orders-main">
        <div className="orders-shell">
          <h1 className="orders-title">주문 내역</h1>

          <div className="orders-tabs-wrap">
            <div className="orders-tabs" role="tablist" aria-label="주문 상태 필터">
              {ORDER_LIST_TABS.map((tab) => {
                const count = tabCounts[tab.id] ?? 0
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`orders-tab${isActive ? ' orders-tab--active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                  >
                    <span>{tab.label}</span>
                    {!loading && count > 0 ? (
                      <span className="orders-tab-count">{count}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <p className="orders-status">불러오는 중…</p>
          ) : error ? (
            <p className="orders-status orders-status--error" role="alert">
              {error}
            </p>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty">
              <p>
                {activeTab === 'all'
                  ? '주문 내역이 없습니다.'
                  : `${ORDER_LIST_TABS.find((t) => t.id === activeTab)?.label ?? ''} 상태의 주문이 없습니다.`}
              </p>
              {activeTab !== 'all' ? (
                <button type="button" className="orders-empty-btn" onClick={() => onTabChange('all')}>
                  전체 주문 보기
                </button>
              ) : (
                <Link to="/" className="orders-empty-btn">
                  쇼핑하러 가기
                </Link>
              )}
            </div>
          ) : (
            <ul className="orders-list" role="tabpanel">
              {filteredOrders.map((order) => (
                <li key={order._id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
          )}

          <div className="orders-page-footer">
            <Link to="/" className="orders-continue-btn">
              계속 쇼핑하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
