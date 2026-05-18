import { Link, Navigate, useLocation } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import './OrderResult.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function formatOrderDate(iso) {
  if (!iso) return '\u2014'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDeliveryDate(d) {
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getEstimatedDeliveryRange(createdAt) {
  const base = createdAt ? new Date(createdAt) : new Date()
  const start = new Date(base)
  start.setDate(start.getDate() + 3)
  const end = new Date(base)
  end.setDate(end.getDate() + 5)
  return { start, end }
}

const NEXT_STEPS = [
  {
    num: 1,
    color: 'green',
    title: '\uc8fc\ubb38 \ud655\uc778 \uc774\uba54\uc77c',
    desc: '\uc8fc\ubb38 \uc138\ubd80 \uc815\ubcf4\uac00 \ud3ec\ud568\ub41c \ud655\uc778 \uc774\uba54\uc77c\uc744 \ubc1b\uc73c\uc2e4 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
  },
  {
    num: 2,
    color: 'blue',
    title: '\uc8fc\ubb38 \ucc98\ub9ac',
    desc: '1-2 \uc601\uc5c5\uc77c \ub0b4\uc5d0 \uc8fc\ubb38\uc744 \ucc98\ub9ac\ud558\uace0 \ud3ec\uc7a5\ud569\ub2c8\ub2e4.',
  },
  {
    num: 3,
    color: 'purple',
    title: '\ubc30\uc1a1 \uc2dc\uc791',
    desc: '\ubc30\uc1a1\uc774 \uc2dc\uc791\ub418\uba74 \ucd94\uc801 \ubc88\ud638\ub97c \uc774\uba54\uc77c\ub85c \ubcf4\ub0b4\ub4dc\ub9bd\ub2c8\ub2e4.',
  },
]

export default function OrderSuccess() {
  const location = useLocation()
  const order = location.state?.order

  if (!order) {
    return <Navigate to="/orders" replace />
  }

  const items = Array.isArray(order.items) ? order.items : []
  const shipping = order.shipping || {}
  const { start: deliveryStart, end: deliveryEnd } = getEstimatedDeliveryRange(order.createdAt)

  return (
    <div className="order-result-page">
      <HomeNavbar />
      <main className="order-result-main">
        <div className="order-result-shell">
          <p className="order-result-eyebrow">Order Confirmation</p>
          <div className="order-result-hero order-result-hero--success">
            <div className="order-result-icon order-result-icon--success" aria-hidden>
              {'\u2713'}
            </div>
            <h1 className="order-result-title">{'\uc8fc\ubb38\uc774 \uc131\uacf5\uc801\uc73c\ub85c \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4!'}</h1>
            <p className="order-result-desc">{'\uc8fc\ubb38\ud574 \uc8fc\uc154\uc11c \uac10\uc0ac\ud569\ub2c8\ub2e4.'}</p>
            <p className="order-result-desc order-result-desc--muted">
              {'\uc8fc\ubb38 \ud655\uc778 \ub0b4\uc5ed\uc740 \uc544\ub798\uc5d0\uc11c \ud655\uc778\ud558\uc2e4 \uc218 \uc788\uc2b5\ub2c8\ub2e4.'}
            </p>
          </div>

          <section className="order-result-card" aria-label={'\uc8fc\ubb38 \uc815\ubcf4'}>
            <h2 className="order-result-card-title">
              <span aria-hidden>{'\ud83d\udce6'}</span> {'\uc8fc\ubb38 \uc815\ubcf4'}
            </h2>
            <dl className="order-result-meta">
              <div>
                <dt>{'\uc8fc\ubb38 \ubc88\ud638'}</dt>
                <dd>{order.orderNumber}</dd>
              </div>
              <div>
                <dt>{'\uc8fc\ubb38 \ub0a0\uc9dc'}</dt>
                <dd>{formatOrderDate(order.createdAt)}</dd>
              </div>
            </dl>
            <hr className="order-result-divider" />
            <ul className="order-result-items">
              {items.map((item) => (
                <li key={item._id} className="order-result-item">
                  <div className="order-result-item-info">
                    <p className="order-result-item-name">{item.name}</p>
                    {item.size || item.variety ? (
                      <p className="order-result-item-opt">
                        {[
                          item.size && `\uc0ac\uc774\uc988: ${item.size}`,
                          item.variety && `\uc635\uc158: ${item.variety}`,
                        ]
                          .filter(Boolean)
                          .join(' \u00b7 ')}
                      </p>
                    ) : null}
                    <p className="order-result-item-qty">{'\uc218\ub7c9: '}{item.quantity}</p>
                  </div>
                  <p className="order-result-item-price">
                    {formatWon(item.lineTotal ?? item.quantity * item.unitPrice)}{'\uc6d0'}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="order-result-total">
              <dt>{'\ucd1d \uacb0\uc81c\uae08\uc561'}</dt>
              <dd>{formatWon(order.totalAmount)}{'\uc6d0'}</dd>
            </dl>
          </section>

          <section className="order-result-card" aria-label={'\ubc30\uc1a1 \uc815\ubcf4'}>
            <h2 className="order-result-card-title">
              <span aria-hidden>{'\ud83d\udce6'}</span> {'\ubc30\uc1a1 \uc815\ubcf4'}
            </h2>
            <div className="order-result-delivery-banner">
              <div className="order-result-delivery-icon" aria-hidden>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="order-result-delivery-text">
                <p className="order-result-delivery-label">{'\uc608\uc0c1 \ubc30\uc1a1\uc77c'}</p>
                <p className="order-result-delivery-date">
                  {formatDeliveryDate(deliveryStart)} - {formatDeliveryDate(deliveryEnd)}
                </p>
              </div>
            </div>
            <h3 className="order-result-address-title">{'\ubc30\uc1a1 \uc8fc\uc18c'}</h3>
            <address className="order-result-address">
              {shipping.recipientName && <p>{shipping.recipientName}</p>}
              {shipping.phone && <p>{shipping.phone}</p>}
              {shipping.zipCode && <p>{shipping.zipCode}</p>}
              <p>
                {[shipping.address, shipping.addressDetail].filter(Boolean).join(' ') || '\u2014'}
              </p>
            </address>
          </section>

          <section className="order-result-card order-result-card--steps" aria-label={'\ub2e4\uc74c \ub2e8\uacc4'}>
            <h2 className="order-result-card-title">
              <span aria-hidden>{'\ud83d\udccb'}</span> {'\ub2e4\uc74c \ub2e8\uacc4'}
            </h2>
            <ol className="order-result-steps">
              {NEXT_STEPS.map((step) => (
                <li key={step.num} className="order-result-step">
                  <span className={`order-result-step-num order-result-step-num--${step.color}`}>
                    {step.num}
                  </span>
                  <div className="order-result-step-body">
                    <p className="order-result-step-title">{step.title}</p>
                    <p className="order-result-step-desc">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="order-result-actions">
            <Link to="/orders" replace className="order-result-btn order-result-btn--primary">
              ?? ?? ??
            </Link>
            <Link to="/" className="order-result-btn order-result-btn--secondary">
              ?? ????
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
