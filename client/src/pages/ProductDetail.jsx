import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import { getStoredAuth } from '../lib/auth.js'
import { addCartItem, messageFromApi as cartMessageFromApi } from '../lib/cart.js'
import {
  fetchAllProducts,
  fetchProductById,
  messageFromApi,
} from '../lib/products.js'
import './ProductDetail.css'

const TABS = [
  { id: 'detail', label: '상품상세' },
  { id: 'reviews', label: '리뷰' },
  { id: 'qna', label: 'Q&A' },
  { id: 'shipping', label: '배송/반품' },
]

const FEATURE_BLOCKS = [
  { icon: '🚚', title: '당일·익일 배송', desc: '오전 주문 시 당일 출고를 원칙으로 합니다.' },
  { icon: '✅', title: '엄격한 품질 관리', desc: '선별·검수 후 안전하게 포장합니다.' },
  { icon: '🌿', title: '신선도 보장', desc: '냉장·완충 포장으로 신선하게 전달합니다.' },
]

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function deliveryLabel() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return `${d.getMonth() + 1}/${d.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}) 예상`
}

function ImageGallery({ images, name, activeIndex, onSelect }) {
  const safe = images.length > 0 ? images : ['']
  const current = safe[activeIndex] || safe[0]

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery-main">
        {current ? (
          <img src={current} alt={name} className="pdp-gallery-main-img" />
        ) : (
          <div className="pdp-gallery-placeholder" />
        )}
      </div>
      {safe.length > 1 ? (
        <ul className="pdp-gallery-thumbs" aria-label="상품 이미지 미리보기">
          {safe.map((src, i) => (
            <li key={src || i}>
              <button
                type="button"
                className={`pdp-gallery-thumb${activeIndex === i ? ' pdp-gallery-thumb--on' : ''}`}
                onClick={() => onSelect(i)}
                aria-label={`이미지 ${i + 1}`}
                aria-current={activeIndex === i}
              >
                {src ? <img src={src} alt="" /> : <span />}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function PurchasePanel({
  product,
  quantity,
  onQuantityChange,
  selectedSize,
  onSizeChange,
  selectedVariety,
  onVarietyChange,
  onAddToCart,
  onBuyNow,
  addingToCart,
  cartMessage,
}) {
  const unitPrice = Number(product.price) || 0
  const total = unitPrice * quantity
  const sizeOptions = product.size ? [product.size] : []
  const varietyOptions = product.variety ? [product.variety] : []

  return (
    <div className="pdp-purchase">
      <p className="pdp-breadcrumb">
        <Link to="/">홈</Link>
        <span aria-hidden> › </span>
        <span>{product.category || '상품'}</span>
      </p>

      <h1 className="pdp-title">{product.name}</h1>

      <div className="pdp-rating" aria-label="평점 4.8점, 리뷰 128개">
        <span className="pdp-stars" aria-hidden>
          ★★★★★
        </span>
        <span className="pdp-rating-score">4.8</span>
        <span className="pdp-rating-count">(128)</span>
      </div>

      <div className="pdp-price-block">
        <p className="pdp-price">
          <strong>{formatWon(unitPrice)}</strong>
          <span className="pdp-price-unit">원</span>
        </p>
      </div>

      <dl className="pdp-meta">
        <div className="pdp-meta-row">
          <dt>배송</dt>
          <dd>
            <span className="pdp-ship-badge">무료배송</span>
            <span className="pdp-ship-date">{deliveryLabel()} 도착 예정</span>
          </dd>
        </div>
        <div className="pdp-meta-row">
          <dt>SKU</dt>
          <dd>{product.sku}</dd>
        </div>
      </dl>

      {sizeOptions.length > 0 ? (
        <label className="pdp-field">
          <span className="pdp-field-label">용량·크기</span>
          <select
            className="pdp-select"
            value={selectedSize}
            onChange={(e) => onSizeChange(e.target.value)}
          >
            {sizeOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {varietyOptions.length > 0 ? (
        <label className="pdp-field">
          <span className="pdp-field-label">품종·원산지</span>
          <select
            className="pdp-select"
            value={selectedVariety}
            onChange={(e) => onVarietyChange(e.target.value)}
          >
            {varietyOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="pdp-qty-row">
        <span className="pdp-field-label">수량</span>
        <div className="pdp-qty">
          <button
            type="button"
            className="pdp-qty-btn"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            aria-label="수량 감소"
          >
            −
          </button>
          <input
            type="number"
            className="pdp-qty-input"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            aria-label="수량"
          />
          <button
            type="button"
            className="pdp-qty-btn"
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
      </div>

      <p className="pdp-total">
        총 상품금액
        <strong>
          {formatWon(total)}
          <span>원</span>
        </strong>
      </p>

      {cartMessage ? (
        <p className="pdp-cart-msg" role="status">
          {cartMessage}
        </p>
      ) : null}

      <div className="pdp-actions">
        <button
          type="button"
          className="pdp-btn pdp-btn--cart"
          disabled={addingToCart}
          onClick={onAddToCart}
        >
          {addingToCart ? '담는 중…' : '장바구니'}
        </button>
        <button type="button" className="pdp-btn pdp-btn--buy" onClick={onBuyNow}>
          바로구매
        </button>
      </div>
    </div>
  )
}

function RelatedProducts({ products, currentId }) {
  const related = products.filter((p) => String(p._id) !== String(currentId)).slice(0, 8)
  if (related.length === 0) return null

  return (
    <section className="pdp-related" aria-label="함께 본 상품">
      <h2 className="pdp-related-title">다른 고객이 함께 본 상품</h2>
      <ul className="pdp-related-scroll">
        {related.map((p) => (
          <li key={p._id}>
            <Link to={`/products/${p._id}`} className="pdp-related-card">
              {p.image ? (
                <img src={p.image} alt="" className="pdp-related-img" loading="lazy" />
              ) : (
                <div className="pdp-related-img pdp-related-img--empty" />
              )}
              <p className="pdp-related-name">{p.name}</p>
              <p className="pdp-related-price">{formatWon(p.price)}원</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedVariety, setSelectedVariety] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [activeTab, setActiveTab] = useState('detail')

  useEffect(() => {
    let cancelled = false
    if (!id) {
      setError('상품을 찾을 수 없습니다.')
      setLoading(false)
      return undefined
    }

    ;(async () => {
      setLoading(true)
      setError('')
      const [detailRes, listRes] = await Promise.all([
        fetchProductById(id),
        fetchAllProducts(),
      ])
      if (cancelled) return

      if (!detailRes.ok || !detailRes.data?.product) {
        setError(messageFromApi(detailRes.data, '상품을 불러오지 못했습니다.'))
        setProduct(null)
      } else {
        const p = detailRes.data.product
        setProduct(p)
        setActiveImage(0)
        setQuantity(1)
        setSelectedSize(p.size || '')
        setSelectedVariety(p.variety || '')
        setCartMessage('')
      }

      if (listRes.ok && Array.isArray(listRes.data?.products)) {
        setRelated(listRes.data.products)
      } else {
        setRelated([])
      }

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  const galleryImages = useMemo(() => {
    if (!product) return []
    const extra = Array.isArray(product.additionalImages)
      ? product.additionalImages.filter(Boolean)
      : []
    const main = product.image ? [product.image] : []
    return [...main, ...extra.filter((url) => !main.includes(url))]
  }, [product])

  const descriptionParagraphs = useMemo(() => {
    if (!product?.description) return []
    return String(product.description)
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [product])

  const detailKicker = useMemo(() => {
    const k = product?.detailPage?.kicker
    return typeof k === 'string' && k.trim() ? k.trim() : 'Premium Fresh'
  }, [product])

  const detailFeatureBlocks = useMemo(() => {
    const custom = product?.detailPage?.highlights
    if (Array.isArray(custom) && custom.length > 0) {
      return custom.map((h) => ({
        icon: h.icon || '✨',
        title: h.title || '',
        desc: h.desc || '',
      }))
    }
    return FEATURE_BLOCKS
  }, [product])

  useEffect(() => {
    const sections = TABS.map((t) => document.getElementById(`pdp-panel-${t.id}`)).filter(Boolean)
    if (sections.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          const tabId = visible[0].target.id.replace('pdp-panel-', '')
          setActiveTab(tabId)
        }
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [product])

  function scrollToTab(tabId) {
    setActiveTab(tabId)
    document.getElementById(`pdp-panel-${tabId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleAddToCart() {
    if (!product) return
    if (!getStoredAuth()) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    setAddingToCart(true)
    setCartMessage('')
    const { ok, data } = await addCartItem({
      productId: String(product._id),
      quantity,
      size: selectedSize || undefined,
      variety: selectedVariety || undefined,
    })
    setAddingToCart(false)
    if (!ok) {
      setCartMessage(cartMessageFromApi(data, '장바구니에 담지 못했습니다.'))
      return
    }
    setCartMessage(cartMessageFromApi(data, '장바구니에 담았습니다.'))
  }

  function handleBuyNow() {
    if (!product) return
    if (!getStoredAuth()) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    navigate('/checkout', {
      state: {
        buyNow: {
          productId: String(product._id),
          quantity,
          size: selectedSize || '',
          variety: selectedVariety || '',
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="pdp">
        <HomeNavbar />
        <p className="pdp-status">상품 정보를 불러오는 중…</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="pdp">
        <HomeNavbar />
        <div className="pdp-shell">
          <p className="pdp-status pdp-status--error" role="alert">
            {error || '상품을 찾을 수 없습니다.'}
          </p>
          <button type="button" className="pdp-back-btn" onClick={() => navigate(-1)}>
            ← 이전으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pdp">
      <HomeNavbar />

      <main className="pdp-main">
        <div className="pdp-shell">
          <section className="pdp-top">
            <ImageGallery
              images={galleryImages}
              name={product.name}
              activeIndex={activeImage}
              onSelect={setActiveImage}
            />
            <PurchasePanel
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              selectedVariety={selectedVariety}
              onVarietyChange={setSelectedVariety}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              addingToCart={addingToCart}
              cartMessage={cartMessage}
            />
          </section>

          <RelatedProducts products={related} currentId={product._id} />

          <nav className="pdp-tabs" aria-label="상품 정보 탭">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`pdp-tab${activeTab === tab.id ? ' pdp-tab--on' : ''}`}
                onClick={() => scrollToTab(tab.id)}
                aria-current={activeTab === tab.id ? 'true' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div id="pdp-panel-detail" className="pdp-panel">
            <div className="pdp-detail-hero">
              <img src={galleryImages[0] || product.image} alt="" className="pdp-detail-banner" />
              <div className="pdp-detail-hero-text">
                <p className="pdp-detail-kicker">{detailKicker}</p>
                <h2>{product.name}</h2>
              </div>
            </div>

            {descriptionParagraphs.length > 0 ? (
              <div className="pdp-detail-copy">
                {descriptionParagraphs.map((text) => (
                  <p key={text.slice(0, 48)}>{text}</p>
                ))}
              </div>
            ) : (
              <p className="pdp-detail-copy">
                경안 슈퍼가 엄선한 {product.name}. 신선함을 그대로 전해 드립니다.
              </p>
            )}

            <ul className="pdp-feature-grid">
              {detailFeatureBlocks.map((f) => (
                <li key={f.title} className="pdp-feature-card">
                  <span className="pdp-feature-icon" aria-hidden>
                    {f.icon}
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </li>
              ))}
            </ul>

            {galleryImages.length > 1 ? (
              <ul className="pdp-detail-gallery">
                {galleryImages.map((src, i) => (
                  <li key={src}>
                    <img src={src} alt={`${product.name} 상세 ${i + 1}`} loading="lazy" />
                  </li>
                ))}
              </ul>
            ) : null}

            <table className="pdp-spec-table">
              <caption className="sr-only">상품 정보</caption>
              <tbody>
                <tr>
                  <th>상품명</th>
                  <td>{product.name}</td>
                </tr>
                <tr>
                  <th>카테고리</th>
                  <td>{product.category || '—'}</td>
                </tr>
                <tr>
                  <th>용량·크기</th>
                  <td>{product.size || '—'}</td>
                </tr>
                <tr>
                  <th>품종·원산지</th>
                  <td>{product.variety || '—'}</td>
                </tr>
                <tr>
                  <th>보관방법</th>
                  <td>냉장 보관 권장 (상품별 상이)</td>
                </tr>
                <tr>
                  <th>배송</th>
                  <td>택배 · 냉장/완충 포장</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="pdp-panel-reviews" className="pdp-panel pdp-panel--muted">
            <h2 className="pdp-panel-title">리뷰</h2>
            <p className="pdp-panel-empty">아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨 주세요!</p>
          </div>

          <div id="pdp-panel-qna" className="pdp-panel">
            <h2 className="pdp-panel-title">Q&amp;A</h2>
            <p className="pdp-panel-empty">등록된 문의가 없습니다.</p>
          </div>

          <div id="pdp-panel-shipping" className="pdp-panel pdp-panel--muted">
            <h2 className="pdp-panel-title">배송 · 반품 안내</h2>
            <ul className="pdp-shipping-list">
              <li>전 상품 기본 택배 배송 (제주·도서 산간 추가 배송비 발생 가능)</li>
              <li>신선 식품 특성상 단순 변심 반품은 수령 후 24시간 이내 미개봉 시에 한함</li>
              <li>파손·오배송 시 고객센터로 연락 주시면 빠르게 처리해 드립니다</li>
              <li>냉장·냉동 상품은 아이스박스 포장 후 발송됩니다</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
