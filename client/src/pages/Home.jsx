import { memo, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import HomeNavbar from '../components/HomeNavbar.jsx'
import { fetchAllProducts, messageFromApi } from '../lib/products.js'
import { reviewToHomeCard } from '../lib/reviewForm.js'
import { fetchPublicReviews, messageFromApi as reviewMessageFromApi } from '../lib/reviews.js'
import './Home.css'

const IMG_GOLDEN_KIWI = '/images/golden-kiwi.png'
const IMG_SHINE_MUSCAT = '/images/shine-muscat.png'
const IMG_GYEONGAN_SUPER = '/images/gyeongan-super.png'
const heroSlides = [
  {
    id: 1,
    line1: '제주 노지 키위',
    line2: '당도 선별 · 신선 배송',
    accent: '지금 만나는 계절 맛',
    image: IMG_GOLDEN_KIWI,
  },
  {
    id: 2,
    line1: '국내산 샤인머스켓',
    line2: '알이 굵고 과즙 가득',
    accent: '프리미엄 과일 한정',
    image: IMG_SHINE_MUSCAT,
  },
  {
    id: 3,
    line1: '경안 슈퍼',
    line2: '매일 아침 들어오는 신선함',
    accent: '첫 구매 쿠폰 증정',
    image: IMG_GYEONGAN_SUPER,
  },
]

const THUMB_HUES = [
  'kiwi',
  'apple',
  'grape',
  'melon',
  'berry',
  'mango',
  'tomato',
  'greengrape',
  'strawberry',
  'banana',
]

const COPYRIGHT_YEAR = new Date().getFullYear()

/** @param {Record<string, unknown>} product */
function resolveProductImage(product) {
  const url = typeof product.image === 'string' ? product.image.trim() : ''
  if (url) return url
  const name = String(product.name ?? '')
  if (/키위|kiwi/i.test(name)) return IMG_GOLDEN_KIWI
  if (/샤인|머스켓|muscat/i.test(name)) return IMG_SHINE_MUSCAT
  return ''
}

/** @param {Record<string, unknown>} product @param {number} index */
function mapProductToCard(product, index) {
  return {
    id: String(product._id ?? product.id ?? index),
    name: String(product.name ?? ''),
    price: Number(product.price) || 0,
    image: resolveProductImage(product),
    hue: THUMB_HUES[index % THUMB_HUES.length],
    was: null,
    off: null,
  }
}

function formatWon(n) {
  return n.toLocaleString('ko-KR')
}

const ProductCard = memo(function ProductCard({ id, name, price, was, off, hue, image }) {
  return (
    <Link to={`/products/${id}`} className="olivia-pcard-link">
    <article className="olivia-pcard">
      {image ? (
        <img src={image} alt="" className="olivia-pthumb olivia-pthumb--photo" loading="lazy" />
      ) : (
        <div className={`olivia-pthumb olivia-pthumb--${hue}`} />
      )}
      <h3 className="olivia-pname">{name}</h3>
      <div className="olivia-prow">
        {was != null ? <span className="olivia-pwas">{formatWon(was)}원</span> : null}
        {off != null ? <span className="olivia-poff">{off}%</span> : null}
      </div>
      <p className="olivia-pprice">
        <strong>{formatWon(price)}</strong>원
      </p>
    </article>
    </Link>
  )
})

const ReviewCard = memo(function ReviewCard({ name, price, was, off, hue, image, quote, by }) {
  return (
    <article className="olivia-rcard">
      {image ? (
        <img src={image} alt="" className="olivia-pthumb olivia-pthumb--photo" loading="lazy" />
      ) : (
        <div className={`olivia-pthumb olivia-pthumb--${hue}`} />
      )}
      <h3 className="olivia-pname">{name}</h3>
      <div className="olivia-prow">
        {was != null ? <span className="olivia-pwas">{formatWon(was)}원</span> : null}
        {off != null ? <span className="olivia-poff">{off}%</span> : null}
      </div>
      <p className="olivia-pprice">
        <strong>{formatWon(price)}</strong>원
      </p>
      <div className="olivia-review">
        <span className="olivia-review-avatar" aria-hidden>
          ●
        </span>
        <p className="olivia-review-text">&ldquo;{quote}&rdquo;</p>
        <p className="olivia-review-by">{by}</p>
      </div>
    </article>
  )
})

const HeroCarousel = memo(function HeroCarousel() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((i) => (i + 1) % heroSlides.length)
    }, 5200)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="olivia-hero" aria-roledescription="carousel" aria-label="메인 배너">
      <div className="olivia-hero-viewport">
        <div
          className="olivia-hero-track"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {heroSlides.map((s, i) => (
            <div
              key={s.id}
              className={`olivia-slide olivia-slide--${(i % 3) + 1}${s.image ? ' olivia-slide--photo' : ''}`}
              style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}
              aria-hidden={slide !== i}
            >
              <div className="olivia-slide-inner">
                <p className="olivia-slide-kicker">{s.accent}</p>
                <h2 className="olivia-slide-title">{s.line1}</h2>
                <p className="olivia-slide-sub">{s.line2}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="olivia-hero-dots" role="tablist" aria-label="배너 선택">
        {heroSlides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={slide === i}
            className={`olivia-dot${slide === i ? ' olivia-dot--on' : ''}`}
            onClick={() => setSlide(i)}
          />
        ))}
      </div>
    </section>
  )
})

const SeasonalSection = memo(function SeasonalSection({ products, loading, error }) {
  const seasonal = products.slice(0, 5)
  return (
    <section id="seasonal" className="olivia-section">
      <div className="olivia-shell">
        <header className="olivia-section-head">
          <span className="olivia-icon olivia-icon--heart" aria-hidden>
            ♥
          </span>
          <h2 className="olivia-section-title">계절 추천</h2>
        </header>
        {loading ? (
          <p className="olivia-products-status">상품을 불러오는 중…</p>
        ) : error ? (
          <p className="olivia-products-error" role="alert">
            {error}
          </p>
        ) : seasonal.length === 0 ? (
          <p className="olivia-products-status">등록된 상품이 없습니다.</p>
        ) : (
          <ul className="olivia-row5">
            {seasonal.map((p) => (
              <li key={p.id}>
                <ProductCard {...p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
})

const ReviewsSection = memo(function ReviewsSection({ reviews, loading, error }) {
  return (
    <section id="reviews" className="olivia-section olivia-section--muted">
      <div className="olivia-shell">
        <header className="olivia-section-head">
          <span className="olivia-icon olivia-icon--star" aria-hidden>
            ★
          </span>
          <h2 className="olivia-section-title">베스트 상품</h2>
        </header>
        {loading ? (
          <p className="olivia-products-status">리뷰를 불러오는 중…</p>
        ) : error ? (
          <p className="olivia-products-error" role="alert">
            {error}
          </p>
        ) : reviews.length === 0 ? (
          <p className="olivia-products-status">등록된 리뷰가 없습니다.</p>
        ) : (
          <ul className="olivia-row4">
            {reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard {...r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
})

const AllProductsSection = memo(function AllProductsSection({ products, loading, error }) {
  return (
    <section id="all" className="olivia-section">
      <div className="olivia-shell">
        <header className="olivia-section-head">
          <span className="olivia-icon olivia-icon--bag" aria-hidden>
            🛍
          </span>
          <h2 className="olivia-section-title">전체 상품</h2>
        </header>
        {loading ? (
          <p className="olivia-products-status">상품을 불러오는 중…</p>
        ) : error ? (
          <p className="olivia-products-error" role="alert">
            {error}
          </p>
        ) : products.length === 0 ? (
          <p className="olivia-products-status">등록된 상품이 없습니다.</p>
        ) : (
          <ul className="olivia-grid5">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard {...p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
})

const HomeFooter = memo(function HomeFooter() {
  return (
    <footer className="olivia-footer">
      <div className="olivia-shell">
        <nav className="olivia-footnav" aria-label="회사 정보 링크">
          <a href="#intro" className="olivia-footlink">
            회사소개
          </a>
          <span className="olivia-util-sep" aria-hidden>
            |
          </span>
          <a href="#terms" className="olivia-footlink">
            이용약관
          </a>
          <span className="olivia-util-sep" aria-hidden>
            |
          </span>
          <a href="#privacy" className="olivia-footlink">
            개인정보처리방침
          </a>
        </nav>
        <div className="olivia-footbiz">
          <p>
            <strong>경안 슈퍼</strong> · 대표 홍길동 · 서울특별시 강남구 테헤란로 123
          </p>
          <p>
            고객센터 1588-0000 · 사업자등록번호 123-45-67890 · 통신판매업 신고 제2026-서울강남-0000호
          </p>
          <p className="olivia-foot-copy">© {COPYRIGHT_YEAR} 경안 슈퍼 · Shopping Mall Demo</p>
        </div>
      </div>
    </footer>
  )
})

export default function Home() {
  const location = useLocation()
  const signupOk = Boolean(location.state?.signupOk)
  const loginOk = Boolean(location.state?.loginOk)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const { ok, data } = await fetchAllProducts()
      if (cancelled) return
      if (!ok) {
        setError(messageFromApi(data, '상품을 불러오지 못했습니다.'))
        setProducts([])
      } else {
        const list = Array.isArray(data.products) ? data.products : []
        setProducts(list.map(mapProductToCard))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setReviewsLoading(true)
      setReviewsError('')
      const { ok, data } = await fetchPublicReviews()
      if (cancelled) return
      if (!ok) {
        setReviewsError(reviewMessageFromApi(data, '리뷰를 불러오지 못했습니다.'))
        setReviews([])
      } else {
        const list = Array.isArray(data.reviews) ? data.reviews : []
        setReviews(list.map(reviewToHomeCard))
      }
      setReviewsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="olivia">
      <HomeNavbar />

      <main>
        {(loginOk || signupOk) && (
          <div className="olivia-shell olivia-alerts" role="region" aria-label="알림">
            {loginOk ? (
              <p className="olivia-banner olivia-banner--info" role="status">
                로그인되었습니다.
              </p>
            ) : null}
            {signupOk ? (
              <p className="olivia-banner" role="status">
                회원가입이 완료되었습니다.
              </p>
            ) : null}
          </div>
        )}

        <HeroCarousel />

        <SeasonalSection products={products} loading={loading} error={error} />

        <section className="olivia-promo" aria-label="기획전 배너">
          <div className="olivia-shell">
            <div
              className="olivia-promo-inner"
              style={{ backgroundImage: `url(${IMG_SHINE_MUSCAT})` }}
            >
              <div className="olivia-promo-copy">
                <p className="olivia-promo-kicker">Premium</p>
                <h2 className="olivia-promo-title">샤인머스켓 시즌</h2>
                <p className="olivia-promo-desc">당도 높은 국내산 · 한정 수량</p>
              </div>
            </div>
          </div>
        </section>

        <AllProductsSection products={products} loading={loading} error={error} />
        <ReviewsSection reviews={reviews} loading={reviewsLoading} error={reviewsError} />
      </main>

      <HomeFooter />
    </div>
  )
}
