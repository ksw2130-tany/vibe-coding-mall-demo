import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProducts } from '../lib/products.js'
import './Admin.css'

const stats = [
  {
    id: 'orders',
    label: '총 주문',
    value: '1,234',
    trend: '+12% from last month',
    icon: 'cart',
    iconTone: 'blue',
  },
  {
    id: 'products',
    label: '총 상품',
    value: '156',
    trend: '+3% from last month',
    icon: 'box',
    iconTone: 'green',
  },
  {
    id: 'customers',
    label: '총 고객',
    value: '2,345',
    trend: '+8% from last month',
    icon: 'users',
    iconTone: 'purple',
  },
  {
    id: 'revenue',
    label: '총 매출',
    value: '₩45,678,000',
    trend: '+15% from last month',
    icon: 'chart',
    iconTone: 'orange',
  },
]

const quickActions = [
  { id: 'product', label: '새 상품 등록', icon: 'plus', primary: true },
  { id: 'orders', label: '주문 관리', icon: 'eye' },
  { id: 'reviews', label: '리뷰 관리', icon: 'star' },
  { id: 'customers', label: '고객 관리', icon: 'user' },
]

const manageCards = [
  {
    id: 'products',
    title: '상품 관리',
    desc: '등록, 수정, 삭제 및 재고 관리',
    icon: '📦',
    iconClass: 'admin-manage-icon--box',
  },
  {
    id: 'orders',
    title: '주문 관리',
    desc: '주문 조회, 상태 변경 및 배송 관리',
    icon: '🛒',
    iconClass: 'admin-manage-icon--cart',
  },
  {
    id: 'reviews',
    title: '리뷰 관리',
    desc: '고객 리뷰 등록·수정 및 메인 노출 관리',
    icon: '⭐',
    iconClass: 'admin-manage-icon--star',
  },
]

const recentOrders = [
  {
    id: 'ORD-001234',
    customer: '김민수',
    date: '2024-12-30',
    status: '처리중',
    statusTone: 'pending',
    amount: '₩219,000',
  },
  {
    id: 'ORD-001233',
    customer: '이영희',
    date: '2024-12-29',
    status: '배송중',
    statusTone: 'shipping',
    amount: '₩156,000',
  },
  {
    id: 'ORD-001232',
    customer: '박지훈',
    date: '2024-12-29',
    status: '완료',
    statusTone: 'done',
    amount: '₩89,500',
  },
]

function AdminIcon({ name }) {
  const icons = {
    cart: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    box: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
    users: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    chart: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
    plus: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    eye: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    bars: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    user: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    star: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  }
  return icons[name] ?? null
}

export default function Admin() {
  const navigate = useNavigate()
  const [productCount, setProductCount] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { ok, data } = await fetchProducts()
      if (!cancelled && ok && typeof data.count === 'number') {
        setProductCount(data.count)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="admin">
      <header className="admin-topbar">
        <div className="admin-shell admin-topbar-inner">
          <div className="admin-brand">
            <span className="admin-logo">경안 슈퍼</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <Link to="/" className="admin-store-link">
            쇼핑몰로 돌아가기
          </Link>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-shell">
          <header className="admin-hero">
            <h1 className="admin-hero-title">관리자 대시보드</h1>
            <p className="admin-hero-desc">
              경안 슈퍼 쇼핑몰 관리 시스템에 오신 것을 환영합니다.
            </p>
          </header>

          <section className="admin-stats" aria-label="요약 통계">
            {stats.map((s) => (
              <article key={s.id} className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">{s.label}</span>
                  <span className={`admin-stat-icon admin-stat-icon--${s.iconTone}`}>
                    <AdminIcon name={s.icon} />
                  </span>
                </div>
                <p className="admin-stat-value">
                  {s.id === 'products' && productCount !== null
                    ? productCount.toLocaleString('ko-KR')
                    : s.value}
                </p>
                <p className="admin-stat-trend">{s.trend}</p>
              </article>
            ))}
          </section>

          <section className="admin-panels">
            <div className="admin-panel admin-panel--actions">
              <h2 className="admin-panel-title">빠른 작업</h2>
              <ul className="admin-actions">
                {quickActions.map((action) => (
                  <li key={action.id}>
                    <button
                      type="button"
                      className={`admin-action-btn${action.primary ? ' admin-action-btn--primary' : ''}`}
                      onClick={() => {
                        if (action.id === 'product') navigate('/admin/products/new')
                        if (action.id === 'orders') navigate('/admin/orders')
                        if (action.id === 'reviews' || action.id === 'customers') {
                          navigate('/admin/reviews')
                        }
                      }}
                    >
                      <AdminIcon name={action.icon} />
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-panel admin-panel--orders">
              <div className="admin-panel-head">
                <h2 className="admin-panel-title">최근 주문</h2>
                <button
                  type="button"
                  className="admin-view-all"
                  onClick={() => navigate('/admin/orders')}
                >
                  전체보기
                </button>
              </div>
              <ul className="admin-orders">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <article className="admin-order-card">
                      <div className="admin-order-main">
                        <p className="admin-order-id">{order.id}</p>
                        <p className="admin-order-meta">
                          {order.customer} · {order.date}
                        </p>
                      </div>
                      <div className="admin-order-side">
                        <span className={`admin-order-status admin-order-status--${order.statusTone}`}>
                          {order.status}
                        </span>
                        <p className="admin-order-amount">{order.amount}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="admin-manage" aria-label="관리 메뉴">
            {manageCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className="admin-manage-card"
                onClick={() => {
                  if (card.id === 'products') navigate('/admin/products')
                  if (card.id === 'orders') navigate('/admin/orders')
                  if (card.id === 'reviews') navigate('/admin/reviews')
                }}
              >
                <span className={`admin-manage-icon ${card.iconClass}`} aria-hidden>
                  {card.icon}
                </span>
                <h3 className="admin-manage-title">{card.title}</h3>
                <p className="admin-manage-desc">{card.desc}</p>
              </button>
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
