import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import { fetchCurrentUser, getStoredAuth } from '../lib/auth.js'
import { fetchCart, messageFromApi as cartMessageFromApi } from '../lib/cart.js'
import { checkOrderDuplicate, createOrder, fetchOrderById, messageFromApi } from '../lib/orders.js'
import { fetchProductById, messageFromApi as productMessageFromApi } from '../lib/products.js'
import './Checkout.css'

const IMP_UID = 'imp54300850'

const PAYMENT_OPTIONS = [
  { id: 'card',     label: '신용카드',   icon: '💳', pg: 'html5_inicis',  pay_method: 'card'     },
  { id: 'transfer', label: '계좌이체',   icon: '🏦', pg: 'html5_inicis',  pay_method: 'trans'    },
  { id: 'kakao',    label: '카카오페이', icon: '💬', pg: 'kakaopay',      pay_method: 'card'     },
  { id: 'naver',    label: '네이버페이', icon: 'N',  pg: 'naverpay',      pay_method: 'card'     },
]

/**
 * IMP.request_pay 를 Promise 로 감싼 헬퍼
 * @param {object} params - 포트원 결제 요청 파라미터
 * @returns {Promise<{ imp_uid: string, merchant_uid: string }>}
 */
function requestImpPay(params) {
  return new Promise((resolve, reject) => {
    /* global IMP */
    const imp = window.IMP
    if (!imp) {
      reject(new Error('포트원 모듈이 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.'))
      return
    }
    imp.request_pay(params, (rsp) => {
      if (rsp.success) {
        resolve(rsp)
      } else {
        reject(new Error(rsp.error_msg || '결제가 취소되었습니다.'))
      }
    })
  })
}

/** merchant_uid 생성 — ORD-YYYYMMDD-랜덤6자 */
function generateMerchantUid() {
  const d = new Date()
  const date =
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ORD-${date}-${rand}`
}

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function OrderSummary({ items, subtotal, shippingFee, total, itemCount }) {
  return (
    <aside className="checkout-summary" aria-label="주문 요약">
      <h2 className="checkout-summary-title">주문 요약</h2>
      <ul className="checkout-summary-items">
        {items.map((item) => {
          const p = item.product
          return (
            <li key={item._id} className="checkout-summary-item">
              {p.image ? (
                <img src={p.image} alt="" className="checkout-summary-thumb" />
              ) : (
                <div className="checkout-summary-thumb checkout-summary-thumb--empty" />
              )}
              <div className="checkout-summary-item-body">
                <p className="checkout-summary-item-name">{p.name}</p>
                <p className="checkout-summary-item-meta">{item.quantity}개</p>
              </div>
              <p className="checkout-summary-item-price">
                {formatWon(item.quantity * item.unitPrice)}원
              </p>
            </li>
          )
        })}
      </ul>
      <dl className="checkout-summary-totals">
        <div>
          <dt>상품 수량 ({itemCount}개)</dt>
          <dd>{formatWon(subtotal)}원</dd>
        </div>
        <div>
          <dt>배송비</dt>
          <dd className="checkout-free">{shippingFee === 0 ? '무료' : `${formatWon(shippingFee)}원`}</dd>
        </div>
        <div className="checkout-summary-total">
          <dt>총 결제금액</dt>
          <dd>{formatWon(total)}원</dd>
        </div>
      </dl>
    </aside>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const buyNow = location.state?.buyNow ?? null

  // 포트원 SDK 초기화 — 컴포넌트 마운트 시 1회만 실행
  useEffect(() => {
    /* global IMP */
    const imp = window.IMP
    if (imp) {
      imp.init(IMP_UID)
    }
  }, [])

  const [cart, setCart] = useState(null)
  const [buyNowProduct, setBuyNowProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    memo: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const user = await fetchCurrentUser()

    if (buyNow?.productId) {
      const productRes = await fetchProductById(buyNow.productId)
      if (!productRes.ok || !productRes.data?.product) {
        setError(productMessageFromApi(productRes.data, '상품을 불러오지 못했습니다.'))
        setBuyNowProduct(null)
      } else {
        setBuyNowProduct(productRes.data.product)
      }
      setCart(null)
    } else {
      const cartRes = await fetchCart()
      if (!cartRes.ok) {
        setError(cartMessageFromApi(cartRes.data, '장바구니를 불러오지 못했습니다.'))
        setCart(null)
      } else {
        setCart(cartRes.data.cart ?? null)
      }
      setBuyNowProduct(null)
    }

    if (user) {
      setForm((prev) => ({
        ...prev,
        recipientName: prev.recipientName || user.name || '',
        address: prev.address || user.address || '',
      }))
    }
    setLoading(false)
  }, [buyNow])

  useEffect(() => {
    if (!getStoredAuth()) return
    load()
  }, [load])

  const checkoutItems = useMemo(() => {
    if (buyNow && buyNowProduct) {
      const qty = Number(buyNow.quantity) || 1
      return [
        {
          _id: 'buy-now',
          quantity: qty,
          unitPrice: Number(buyNowProduct.price) || 0,
          size: buyNow.size || buyNowProduct.size || '',
          variety: buyNow.variety || buyNowProduct.variety || '',
          product: buyNowProduct,
        },
      ]
    }
    return Array.isArray(cart?.items) ? cart.items.filter((i) => i.product) : []
  }, [buyNow, buyNowProduct, cart])

  const itemCount = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
    [checkoutItems]
  )
  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [checkoutItems]
  )
  const shippingFee = 0
  const total = subtotal + shippingFee
  const isBuyNowMode = Boolean(buyNow?.productId)

  if (!getStoredAuth()) {
    return <Navigate to="/login" replace state={{ from: '/checkout', buyNow }} />
  }

  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validateForm() {
    if (!form.recipientName.trim()) return '받는 분 이름을 입력해 주세요.'
    if (!form.phone.trim()) return '연락처를 입력해 주세요.'
    if (!form.address.trim()) return '주소를 입력해 주세요.'
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    const msg = validateForm()
    if (msg) {
      setError(msg)
      return
    }

    setError('')
    setSubmitting(true)

    // 선택된 결제 수단 정보
    const selectedOpt = PAYMENT_OPTIONS.find((o) => o.id === paymentMethod) ?? PAYMENT_OPTIONS[0]
    const merchantUid = generateMerchantUid()

    // --- 주문 중복 확인 (merchant_uid) ---
    const dupRes = await checkOrderDuplicate({ merchantUid })
    if (!dupRes.ok) {
      setSubmitting(false)
      setError(messageFromApi(dupRes.data, '주문 확인에 실패했습니다.'))
      return
    }
    if (dupRes.data.duplicate) {
      setSubmitting(false)
      const num = dupRes.data.existingOrder?.orderNumber
      setError(
        num
          ? `이미 처리된 주문입니다. (주문번호: ${num})`
          : '이미 처리된 주문입니다. 페이지를 새로고침 후 다시 시도해 주세요.'
      )
      return
    }

    // --- 포트원 결제창 호출 ---
    let impRsp = null
    try {
      impRsp = await requestImpPay({
        pg: selectedOpt.pg,
        pay_method: selectedOpt.pay_method,
        merchant_uid: merchantUid,
        name: checkoutItems.map((i) => i.product.name).join(', '),
        amount: total,
        buyer_name: form.recipientName.trim(),
        buyer_tel: form.phone.trim(),
        buyer_addr: [form.address.trim(), form.addressDetail.trim()].filter(Boolean).join(' '),
        buyer_postcode: form.zipCode.trim(),
        buyer_email: '',
      })
    } catch (payErr) {
      setSubmitting(false)
      navigate('/order/failure', {
        replace: true,
        state: { message: payErr.message, fromCheckout: true, buyNow },
      })
      return
    }

    // --- 결제 성공 → 서버에 주문 생성 ---
    const payload = {
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      zipCode: form.zipCode.trim(),
      address: form.address.trim(),
      addressDetail: form.addressDetail.trim(),
      memo: form.memo.trim(),
      payment: {
        method: paymentMethod,
        impUid: impRsp.imp_uid,
        merchantUid: impRsp.merchant_uid || merchantUid,
      },
      expectedAmount: total,
    }

    if (isBuyNowMode && buyNow) {
      payload.items = [
        {
          productId: buyNow.productId,
          quantity: buyNow.quantity,
          size: buyNow.size || undefined,
          variety: buyNow.variety || undefined,
        },
      ]
    }

    const { ok, data } = await createOrder(payload)
    setSubmitting(false)
    if (!ok) {
      if (data?.existingOrderId) {
        const existing = await fetchOrderById(data.existingOrderId)
        if (existing.ok && existing.data?.order) {
          navigate('/order/success', {
            replace: true,
            state: { order: existing.data.order },
          })
          return
        }
      }
      navigate('/order/failure', {
        replace: true,
        state: {
          message: messageFromApi(data, '주문에 실패했습니다.'),
          fromCheckout: true,
          buyNow,
        },
      })
      return
    }
    if (data.order) {
      navigate('/order/success', { replace: true, state: { order: data.order } })
    } else {
      navigate('/order/failure', {
        replace: true,
        state: { message: '주문 정보를 확인할 수 없습니다.', fromCheckout: true, buyNow },
      })
    }
  }

  return (
    <div className="checkout-page">
      <HomeNavbar />

      <main className="checkout-main">
        <div className="checkout-shell">
          <header className="checkout-header">
            <h1 className="checkout-page-title">결제</h1>
          </header>

          {isBuyNowMode ? (
            <p className="checkout-mode-hint">선택한 상품만 주문합니다. 장바구니는 그대로 유지됩니다.</p>
          ) : null}

          {loading ? (
            <p className="checkout-status">불러오는 중…</p>
          ) : checkoutItems.length === 0 ? (
            <div className="checkout-empty">
              <p>주문할 상품이 없습니다.</p>
              <Link to={isBuyNowMode ? '/' : '/cart'} className="checkout-link">
                {isBuyNowMode ? '쇼핑 계속하기' : '장바구니로 이동'}
              </Link>
            </div>
          ) : (
            <form className="checkout-layout" onSubmit={onSubmit}>
              <div className="checkout-left">
                {error ? (
                  <p className="checkout-alert" role="alert">
                    {error}
                  </p>
                ) : null}

                <section className="checkout-card" aria-label="배송 정보">
                  <h2 className="checkout-card-title">
                    <span className="checkout-card-icon" aria-hidden>
                      📦
                    </span>
                    배송 정보
                  </h2>
                  <div className="checkout-form-grid checkout-form-grid--2">
                    <label className="checkout-field">
                      <span>
                        받는 분 <em className="checkout-required">*</em>
                      </span>
                      <input
                        name="recipientName"
                        value={form.recipientName}
                        onChange={onChange}
                        required
                        autoComplete="name"
                      />
                    </label>
                    <label className="checkout-field">
                      <span>
                        연락처 <em className="checkout-required">*</em>
                      </span>
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={onChange}
                        required
                        placeholder="010-0000-0000"
                        autoComplete="tel"
                      />
                    </label>
                  </div>
                  <label className="checkout-field">
                    <span>
                      주소 <em className="checkout-required">*</em>
                    </span>
                    <input
                      name="address"
                      value={form.address}
                      onChange={onChange}
                      required
                      placeholder="기본 주소"
                      autoComplete="street-address"
                    />
                  </label>
                  <label className="checkout-field">
                    <span className="checkout-sr-only">상세 주소</span>
                    <input
                      name="addressDetail"
                      value={form.addressDetail}
                      onChange={onChange}
                      placeholder="상세 주소"
                    />
                  </label>
                  <div className="checkout-form-grid checkout-form-grid--2">
                    <label className="checkout-field">
                      <span>우편번호</span>
                      <input
                        name="zipCode"
                        value={form.zipCode}
                        onChange={onChange}
                        placeholder="00000"
                        inputMode="numeric"
                      />
                    </label>
                    <label className="checkout-field">
                      <span>배송 요청사항</span>
                      <input
                        name="memo"
                        value={form.memo}
                        onChange={onChange}
                        placeholder="(선택)"
                      />
                    </label>
                  </div>
                </section>

                <section className="checkout-card" aria-label="배송 방법">
                  <h2 className="checkout-card-title">
                    <span className="checkout-card-icon" aria-hidden>
                      🚚
                    </span>
                    배송 방법
                  </h2>
                  <div className="checkout-option checkout-option--selected">
                    <div className="checkout-option-body">
                      <p className="checkout-option-title">일반 배송</p>
                      <p className="checkout-option-desc">1–2일</p>
                    </div>
                    <span className="checkout-free">무료</span>
                  </div>
                </section>

                <section className="checkout-card" aria-label="결제 정보">
                  <h2 className="checkout-card-title">
                    <span className="checkout-card-icon" aria-hidden>
                      💳
                    </span>
                    결제 정보
                  </h2>
                  <ul className="checkout-payments" role="radiogroup" aria-label="결제 수단">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <li key={opt.id}>
                        <label
                          className={`checkout-payment${paymentMethod === opt.id ? ' checkout-payment--selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={opt.id}
                            checked={paymentMethod === opt.id}
                            onChange={() => setPaymentMethod(opt.id)}
                          />
                          <span className="checkout-payment-icon" aria-hidden>
                            {opt.icon}
                          </span>
                          <span>{opt.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="checkout-right">
                <OrderSummary
                  items={checkoutItems}
                  subtotal={subtotal}
                  shippingFee={shippingFee}
                  total={total}
                  itemCount={itemCount}
                />
                <button type="submit" className="checkout-submit" disabled={submitting}>
                  {submitting ? '주문 처리 중…' : '주문하기'}
                </button>
                <p className="checkout-legal">
                  주문 완료 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
                </p>
                <Link
                  to={isBuyNowMode ? `/products/${buyNow.productId}` : '/cart'}
                  className="checkout-back-link"
                >
                  {isBuyNowMode ? '← 상품으로' : '← 장바구니로'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
