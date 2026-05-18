import { Link, Navigate, useLocation } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import './OrderResult.css'

export default function OrderFailure() {
  const location = useLocation()
  const message = location.state?.message
  const fromCheckout = location.state?.fromCheckout !== false

  if (!message) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="order-result-page">
      <HomeNavbar />
      <main className="order-result-main">
        <div className="order-result-shell">
          <p className="order-result-eyebrow">Order Failed</p>

          <div className="order-result-hero order-result-hero--failure">
            <div className="order-result-icon order-result-icon--failure" aria-hidden>
              ✕
            </div>
            <h1 className="order-result-title">주문 처리에 실패했습니다</h1>
            <p className="order-result-desc">{message}</p>
            <p className="order-result-desc order-result-desc--muted">
              결제는 완료되지 않았거나 주문 저장 중 오류가 발생했습니다. 다시 시도해 주세요.
            </p>
          </div>

          <section className="order-result-card order-result-card--failure" aria-label="안내">
            <h2 className="order-result-card-title">다음 단계</h2>
            <ul className="order-result-tips">
              <li>결제 창을 닫았다면 장바구니에서 다시 결제해 주세요.</li>
              <li>같은 오류가 반복되면 고객센터로 문의해 주세요.</li>
            </ul>
          </section>

          <div className="order-result-actions">
            {fromCheckout ? (
              <Link to="/checkout" className="order-result-btn order-result-btn--primary">
                다시 결제하기
              </Link>
            ) : null}
            <Link to="/cart" className="order-result-btn order-result-btn--secondary">
              장바구니로
            </Link>
            <Link to="/" className="order-result-btn order-result-btn--ghost">
              홈으로
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
