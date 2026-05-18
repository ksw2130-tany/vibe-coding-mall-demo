import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import { getStoredAuth } from '../lib/auth.js'
import {
  clearCart,
  fetchCart,
  messageFromApi,
  removeCartItem,
  updateCartItem,
} from '../lib/cart.js'
import './Cart.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

export default function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const loadCart = useCallback(async () => {
    setLoading(true)
    setError('')
    const { ok, data } = await fetchCart()
    if (!ok) {
      setError(messageFromApi(data, '장바구니를 불러오지 못했습니다.'))
      setCart(null)
    } else {
      setCart(data.cart ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!getStoredAuth()) return
    loadCart()
  }, [loadCart])

  if (!getStoredAuth()) {
    return <Navigate to="/login" replace state={{ from: '/cart' }} />
  }

  async function onQtyChange(itemId, nextQty) {
    if (nextQty < 1 || nextQty > 99) return
    setBusyId(itemId)
    const { ok, data } = await updateCartItem(itemId, nextQty)
    setBusyId('')
    if (!ok) {
      window.alert(messageFromApi(data, '수량 변경에 실패했습니다.'))
      return
    }
    setCart(data.cart)
  }

  async function onRemove(itemId) {
    if (!window.confirm('이 상품을 장바구니에서 삭제할까요?')) return
    setBusyId(itemId)
    const { ok, data } = await removeCartItem(itemId)
    setBusyId('')
    if (!ok) {
      window.alert(messageFromApi(data, '삭제에 실패했습니다.'))
      return
    }
    setCart(data.cart)
  }

  async function onClear() {
    if (!window.confirm('장바구니를 모두 비울까요?')) return
    const { ok, data } = await clearCart()
    if (!ok) {
      window.alert(messageFromApi(data, '비우기에 실패했습니다.'))
      return
    }
    setCart(data.cart)
  }

  const items = Array.isArray(cart?.items) ? cart.items : []
  const subtotal = cart?.subtotal ?? 0
  const itemCount = cart?.itemCount ?? 0

  return (
    <div className="cart-page">
      <HomeNavbar />

      <main className="cart-main">
        <div className="cart-shell">
          <header className="cart-header">
            <h1 className="cart-title">장바구니</h1>
            {items.length > 0 ? (
              <button type="button" className="cart-clear-btn" onClick={onClear}>
                전체 삭제
              </button>
            ) : null}
          </header>

          {loading ? (
            <p className="cart-status">불러오는 중…</p>
          ) : error ? (
            <p className="cart-status cart-status--error" role="alert">
              {error}
            </p>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <p>장바구니가 비어 있습니다.</p>
              <Link to="/" className="cart-shop-link">
                쇼핑 계속하기
              </Link>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {items.map((item) => {
                  const p = item.product
                  if (!p) return null
                  const lineTotal = item.quantity * item.unitPrice
                  const disabled = busyId === item._id

                  return (
                    <li key={item._id} className="cart-item">
                      <Link to={`/products/${p._id}`} className="cart-item-thumb-link">
                        {p.image ? (
                          <img src={p.image} alt="" className="cart-item-thumb" />
                        ) : (
                          <div className="cart-item-thumb cart-item-thumb--empty" />
                        )}
                      </Link>
                      <div className="cart-item-body">
                        <Link to={`/products/${p._id}`} className="cart-item-name">
                          {p.name}
                        </Link>
                        {(item.size || item.variety) && (
                          <p className="cart-item-opt">
                            {[item.size, item.variety].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="cart-item-price">{formatWon(item.unitPrice)}원</p>
                        <div className="cart-item-actions">
                          <div className="cart-qty">
                            <button
                              type="button"
                              disabled={disabled || item.quantity <= 1}
                              onClick={() => onQtyChange(item._id, item.quantity - 1)}
                              aria-label="수량 감소"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              disabled={disabled || item.quantity >= 99}
                              onClick={() => onQtyChange(item._id, item.quantity + 1)}
                              aria-label="수량 증가"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="cart-remove-btn"
                            disabled={disabled}
                            onClick={() => onRemove(item._id)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <p className="cart-item-total">{formatWon(lineTotal)}원</p>
                    </li>
                  )
                })}
              </ul>

              <aside className="cart-summary">
                <div className="cart-summary-row">
                  <span>상품 수</span>
                  <span>{itemCount}개</span>
                </div>
                <div className="cart-summary-row cart-summary-row--total">
                  <span>주문 예상 금액</span>
                  <strong>{formatWon(subtotal)}원</strong>
                </div>
                <button
                  type="button"
                  className="cart-checkout-btn"
                  disabled={items.length === 0}
                  onClick={() => navigate('/checkout')}
                >
                  결제하기
                </button>
                <Link to="/" className="cart-continue-link">
                  쇼핑 계속하기
                </Link>
              </aside>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
