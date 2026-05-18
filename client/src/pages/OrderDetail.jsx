import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import { getStoredAuth } from '../lib/auth.js'
import {
  ORDER_PROGRESS_TABS,
  ORDER_SOURCE_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  cancelOrder,
  fetchOrderById,
  getOrderListTabId,
  isOrderProgressTabActive,
  messageFromApi,
} from '../lib/orders.js'
import './OrderDetail.css'
import './Orders.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const orderCreated = Boolean(location.state?.orderCreated)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (orderCreated) {
      window.history.replaceState({}, document.title)
    }
  }, [orderCreated])

  useEffect(() => {
    let cancelled = false
    if (!id || !getStoredAuth()) return undefined

    ;(async () => {
      setLoading(true)
      const { ok, data } = await fetchOrderById(id)
      if (cancelled) return
      if (!ok || !data?.order) {
        setError(messageFromApi(data, '주문을 불러오지 못했습니다.'))
        setOrder(null)
      } else {
        setOrder(data.order)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  if (!getStoredAuth()) {
    return <Navigate to="/login" replace state={{ from: `/orders/${id}` }} />
  }

  async function onCancel() {
    if (!order || !window.confirm('이 주문을 취소할까요?')) return
    setCancelling(true)
    const { ok, data } = await cancelOrder(order._id)
    setCancelling(false)
    if (!ok) {
      window.alert(messageFromApi(data, '주문 취소에 실패했습니다.'))
      return
    }
    setOrder(data.order)
  }

  const canCancel = order && ['pending', 'paid'].includes(order.status)

  return (
    <div className="order-detail-page">
      <HomeNavbar />

      <main className="order-detail-main">
        <div className="order-detail-shell">
          {loading ? (
            <p className="order-detail-status">불러오는 중…</p>
          ) : error || !order ? (
            <p className="order-detail-status order-detail-status--error" role="alert">
              {error || '주문을 찾을 수 없습니다.'}
            </p>
          ) : (
            <>
              {orderCreated ? (
                <p className="order-detail-banner" role="status">
                  주문이 완료되었습니다. 감사합니다!
                </p>
              ) : null}

              <header className="order-detail-header">
                <div>
                  <p className="order-detail-number">{order.orderNumber}</p>
                  <h1 className="order-detail-title">주문 상세</h1>
                  <p className="order-detail-date">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`order-detail-badge order-detail-badge--${order.status}`}>
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </span>
              </header>

              <section className="order-detail-progress" aria-label="주문 진행 상태">
                <div className="orders-tabs-wrap">
                  <div className="orders-tabs" role="tablist">
                    {ORDER_PROGRESS_TABS.map((tab) => {
                      const isActive = isOrderProgressTabActive(order, tab.id)
                      return (
                        <span
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          className={`orders-tab${isActive ? ' orders-tab--active' : ''}`}
                        >
                          <span>{tab.label}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </section>

              <section className="order-detail-section">
                <h2>배송 정보</h2>
                <dl className="order-detail-dl">
                  <div>
                    <dt>받는 분</dt>
                    <dd>{order.shipping.recipientName}</dd>
                  </div>
                  <div>
                    <dt>연락처</dt>
                    <dd>{order.shipping.phone}</dd>
                  </div>
                  {order.shipping.zipCode ? (
                    <div>
                      <dt>우편번호</dt>
                      <dd>{order.shipping.zipCode}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>주소</dt>
                    <dd>
                      {order.shipping.address}
                      {order.shipping.addressDetail ? ` ${order.shipping.addressDetail}` : ''}
                    </dd>
                  </div>
                  {order.shipping.memo ? (
                    <div>
                      <dt>메모</dt>
                      <dd>{order.shipping.memo}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="order-detail-section">
                <h2>주문 상품</h2>
                <ul className="order-detail-items">
                  {order.items.map((item) => (
                    <li key={item._id} className="order-detail-item">
                      {item.image ? (
                        <img src={item.image} alt="" className="order-detail-item-img" />
                      ) : (
                        <div className="order-detail-item-img order-detail-item-img--empty" />
                      )}
                      <div>
                        <p className="order-detail-item-name">{item.name}</p>
                        <p className="order-detail-item-meta">
                          {[item.size, item.variety].filter(Boolean).join(' · ')}
                          {item.size || item.variety ? ' · ' : ''}
                          {item.quantity}개 × {formatWon(item.unitPrice)}원
                        </p>
                      </div>
                      <p className="order-detail-item-total">
                        {formatWon(item.lineTotal ?? item.quantity * item.unitPrice)}원
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              {order.payment ? (
                <section className="order-detail-section">
                  <h2>결제 정보</h2>
                  <dl className="order-detail-dl">
                    <div>
                      <dt>결제 수단</dt>
                      <dd>{PAYMENT_METHOD_LABEL[order.payment.method] || order.payment.method}</dd>
                    </div>
                    {order.source ? (
                      <div>
                        <dt>주문 경로</dt>
                        <dd>{ORDER_SOURCE_LABEL[order.source] || order.source}</dd>
                      </div>
                    ) : null}
                    {order.payment.paidAt ? (
                      <div>
                        <dt>결제 일시</dt>
                        <dd>{formatDate(order.payment.paidAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              <section className="order-detail-section order-detail-summary">
                <dl className="order-detail-totals">
                  <div>
                    <dt>상품 금액</dt>
                    <dd>{formatWon(order.subtotal)}원</dd>
                  </div>
                  <div>
                    <dt>배송비</dt>
                    <dd>{order.shippingFee === 0 ? '무료' : `${formatWon(order.shippingFee)}원`}</dd>
                  </div>
                  {order.discountAmount > 0 ? (
                    <div>
                      <dt>할인</dt>
                      <dd>-{formatWon(order.discountAmount)}원</dd>
                    </div>
                  ) : null}
                  <div className="order-detail-totals--total">
                    <dt>총 결제 금액</dt>
                    <dd>{formatWon(order.totalAmount)}원</dd>
                  </div>
                </dl>
              </section>

              <div className="order-detail-actions">
                {canCancel ? (
                  <button
                    type="button"
                    className="order-detail-cancel-btn"
                    disabled={cancelling}
                    onClick={onCancel}
                  >
                    {cancelling ? '처리 중…' : '주문 취소'}
                  </button>
                ) : null}
                <Link
                  to={order ? `/orders?tab=${getOrderListTabId(order)}` : '/orders'}
                  className="order-detail-link"
                >
                  주문 목록
                </Link>
                <Link to="/" className="order-detail-link">
                  쇼핑 계속하기
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
