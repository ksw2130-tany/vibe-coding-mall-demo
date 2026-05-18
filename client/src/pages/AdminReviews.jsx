import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminTopbar from '../components/AdminTopbar.jsx'
import { isAdminAccessDenied } from '../lib/adminAuth.js'
import { fetchAllProducts } from '../lib/products.js'
import { REVIEW_THUMB_HUES, REVIEW_THUMB_LABELS } from '../lib/reviewConstants.js'
import {
  EMPTY_REVIEW_FORM,
  formToReviewBody,
  reviewToForm,
  validateReviewForm,
} from '../lib/reviewForm.js'
import {
  createReview,
  deleteReview,
  fetchAdminReviews,
  messageFromApi,
  toggleReviewPublish,
  updateReview,
} from '../lib/reviews.js'
import './Admin.css'
import './AdminReviews.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function ReviewForm({ form, products, onChange, onSubmit, submitting, submitLabel, onCancel, idPrefix }) {
  return (
    <form className="admin-reviews-form" onSubmit={onSubmit}>
      <fieldset className="admin-form-section">
        <legend className="admin-form-section-title">상품 · 리뷰</legend>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-productName`}>
          <span>표시 상품명 *</span>
          <input
            id={`${idPrefix}-productName`}
            name="productName"
            value={form.productName}
            onChange={onChange}
            placeholder="애플망고 2입"
            required
          />
        </label>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-productId`}>
          <span>연결 상품 (선택)</span>
          <select id={`${idPrefix}-productId`} name="productId" value={form.productId} onChange={onChange}>
            <option value="">연결 안 함</option>
            {products.map((p) => (
              <option key={String(p._id)} value={String(p._id)}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </label>
        <label className="admin-reviews-field admin-reviews-field--full" htmlFor={`${idPrefix}-quote`}>
          <span>리뷰 내용 *</span>
          <textarea
            id={`${idPrefix}-quote`}
            name="quote"
            rows={3}
            value={form.quote}
            onChange={onChange}
            placeholder="고객 리뷰 문구"
            required
          />
        </label>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-authorDisplay`}>
          <span>작성자 표시 *</span>
          <input
            id={`${idPrefix}-authorDisplay`}
            name="authorDisplay"
            value={form.authorDisplay}
            onChange={onChange}
            placeholder="sky***"
            required
          />
        </label>
      </fieldset>

      <fieldset className="admin-form-section">
        <legend className="admin-form-section-title">가격 · 이미지</legend>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-price`}>
          <span>표시 가격 (원) *</span>
          <input
            id={`${idPrefix}-price`}
            name="price"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={onChange}
            required
          />
        </label>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-compareAtPrice`}>
          <span>정가 (원)</span>
          <input
            id={`${idPrefix}-compareAtPrice`}
            name="compareAtPrice"
            type="number"
            min="0"
            step="1"
            value={form.compareAtPrice}
            onChange={onChange}
          />
        </label>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-discountPercent`}>
          <span>할인율 (%)</span>
          <input
            id={`${idPrefix}-discountPercent`}
            name="discountPercent"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.discountPercent}
            onChange={onChange}
          />
        </label>
        <label className="admin-reviews-field admin-reviews-field--full" htmlFor={`${idPrefix}-image`}>
          <span>이미지 URL</span>
          <input
            id={`${idPrefix}-image`}
            name="image"
            value={form.image}
            onChange={onChange}
            placeholder="/images/review-apple-mango.png"
          />
        </label>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-thumbHue`}>
          <span>썸네일 색상</span>
          <select id={`${idPrefix}-thumbHue`} name="thumbHue" value={form.thumbHue} onChange={onChange}>
            {REVIEW_THUMB_HUES.map((hue) => (
              <option key={hue} value={hue}>
                {REVIEW_THUMB_LABELS[hue] ?? hue}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-reviews-field" htmlFor={`${idPrefix}-sortOrder`}>
          <span>노출 순서</span>
          <input
            id={`${idPrefix}-sortOrder`}
            name="sortOrder"
            type="number"
            step="1"
            value={form.sortOrder}
            onChange={onChange}
          />
        </label>
        <label className="admin-reviews-field admin-reviews-field--check">
          <input
            id={`${idPrefix}-published`}
            name="published"
            type="checkbox"
            checked={form.published}
            onChange={onChange}
          />
          <span>메인에 노출</span>
        </label>
      </fieldset>

      <div className="admin-reviews-form-actions">
        <button type="submit" className="admin-action-btn admin-action-btn--primary" disabled={submitting}>
          {submitting ? '저장 중…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="admin-action-btn" onClick={onCancel} disabled={submitting}>
            취소
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('')
  const [form, setForm] = useState(EMPTY_REVIEW_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setListError('')
    const { ok, data, status } = await fetchAdminReviews({
      q: debouncedSearch || undefined,
      published: publishedFilter || undefined,
    })
    if (!ok) {
      if (isAdminAccessDenied(data)) {
        setListError('관리자만 접근할 수 있습니다.')
      } else {
        setListError(messageFromApi(data, '리뷰 목록을 불러오지 못했습니다.'))
      }
      setReviews([])
    } else {
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])
    }
    setLoading(false)
    if (status === 401) setListError('로그인이 필요합니다.')
  }, [debouncedSearch, publishedFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { ok, data } = await fetchAllProducts()
      if (!cancelled && ok) {
        setProducts(Array.isArray(data.products) ? data.products : [])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const publishedCount = useMemo(
    () => reviews.filter((r) => r.published).length,
    [reviews]
  )

  function resetForm() {
    setForm(EMPTY_REVIEW_FORM)
    setEditingId(null)
    setFormError('')
    setShowForm(false)
  }

  function openCreate() {
    setForm(EMPTY_REVIEW_FORM)
    setEditingId(null)
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  /** @param {Record<string, unknown>} review */
  function openEdit(review) {
    setEditingId(String(review._id))
    setForm(reviewToForm(review))
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  /** @param {import('react').ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e */
  function onFieldChange(e) {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    const validationErrors = validateReviewForm(form)
    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(' '))
      return
    }

    setSubmitting(true)
    const body = formToReviewBody(form)
    const result = editingId
      ? await updateReview(editingId, body)
      : await createReview(body)
    setSubmitting(false)

    if (!result.ok) {
      setFormError(messageFromApi(result.data, '저장에 실패했습니다.'))
      return
    }

    setFormSuccess(messageFromApi(result.data, editingId ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.'))
    resetForm()
    loadReviews()
  }

  async function onTogglePublish(id, currentPublished) {
    const { ok, data } = await toggleReviewPublish(id, !currentPublished)
    if (!ok) {
      window.alert(messageFromApi(data, '노출 상태 변경에 실패했습니다.'))
      return
    }
    loadReviews()
  }

  async function onDelete(id, name) {
    if (!window.confirm(`"${name}" 리뷰를 삭제할까요?`)) return
    const { ok, data } = await deleteReview(id)
    if (!ok) {
      window.alert(messageFromApi(data, '삭제에 실패했습니다.'))
      return
    }
    if (editingId === id) resetForm()
    loadReviews()
  }

  return (
    <div className="admin admin-reviews">
      <AdminTopbar dashboardLink />

      <main className="admin-main admin-reviews-main">
        <div className="admin-shell">
          <header className="admin-hero admin-reviews-hero">
            <div>
              <p className="admin-reviews-kicker">고객 관리</p>
              <h1 className="admin-hero-title">리뷰 관리</h1>
              <p className="admin-hero-desc">
                메인 「베스트 상품」 섹션에 노출되는 고객 리뷰를 등록·수정·삭제합니다.
              </p>
            </div>
            <button type="button" className="admin-reviews-new-btn" onClick={openCreate}>
              + 새 리뷰 등록
            </button>
          </header>

          <div className="admin-reviews-summary" aria-label="리뷰 요약">
            <span>전체 {reviews.length}건</span>
            <span className="admin-reviews-summary-sep">·</span>
            <span>노출 중 {publishedCount}건</span>
          </div>

          {formSuccess && !showForm ? (
            <p className="admin-reviews-alert admin-reviews-alert--ok" role="status">
              {formSuccess}
            </p>
          ) : null}

          {showForm ? (
            <section className="admin-panel admin-reviews-form-panel" aria-label="리뷰 작성">
              <h2 className="admin-panel-title">{editingId ? '리뷰 수정' : '새 리뷰 등록'}</h2>
              {formError ? (
                <p className="admin-reviews-alert admin-reviews-alert--error" role="alert">
                  {formError}
                </p>
              ) : null}
              <ReviewForm
                form={form}
                products={products}
                onChange={onFieldChange}
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel={editingId ? '수정 저장' : '등록'}
                onCancel={resetForm}
                idPrefix={editingId ? 'edit-review' : 'new-review'}
              />
            </section>
          ) : null}

          <section className="admin-panel admin-reviews-list-panel" aria-label="리뷰 목록">
            <div className="admin-reviews-toolbar">
              <div className="admin-reviews-search-wrap">
                <span className="admin-reviews-search-icon" aria-hidden>
                  ⌕
                </span>
                <input
                  type="search"
                  className="admin-reviews-search"
                  placeholder="상품명, 리뷰, 작성자 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="리뷰 검색"
                />
              </div>
              <select
                className="admin-reviews-filter"
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value)}
                aria-label="노출 상태 필터"
              >
                <option value="">전체 상태</option>
                <option value="true">노출 중</option>
                <option value="false">숨김</option>
              </select>
            </div>

            {listError ? (
              <p className="admin-reviews-alert admin-reviews-alert--error" role="alert">
                {listError}
              </p>
            ) : null}

            {loading ? (
              <p className="admin-reviews-status">불러오는 중…</p>
            ) : reviews.length === 0 ? (
              <p className="admin-reviews-status">등록된 리뷰가 없습니다.</p>
            ) : (
              <ul className="admin-reviews-list">
                {reviews.map((review) => {
                  const id = String(review._id)
                  const image = typeof review.image === 'string' ? review.image : ''
                  return (
                    <li key={id}>
                      <article className={`admin-reviews-card${review.published ? '' : ' admin-reviews-card--hidden'}`}>
                        <div className="admin-reviews-card-media">
                          {image ? (
                            <img src={image} alt="" className="admin-reviews-card-img" />
                          ) : (
                            <div className={`admin-reviews-card-thumb admin-reviews-card-thumb--${review.thumbHue || 'mango'}`} />
                          )}
                        </div>
                        <div className="admin-reviews-card-body">
                          <div className="admin-reviews-card-head">
                            <h3 className="admin-reviews-card-title">{review.productName}</h3>
                            <span
                              className={`admin-reviews-badge${review.published ? ' admin-reviews-badge--on' : ''}`}
                            >
                              {review.published ? '노출' : '숨김'}
                            </span>
                          </div>
                          <p className="admin-reviews-card-price">
                            <strong>{formatWon(review.price)}</strong>원
                            {review.compareAtPrice != null ? (
                              <span className="admin-reviews-card-was">
                                {formatWon(review.compareAtPrice)}원
                              </span>
                            ) : null}
                            {review.discountPercent != null ? (
                              <span className="admin-reviews-card-off">{review.discountPercent}%</span>
                            ) : null}
                          </p>
                          <p className="admin-reviews-card-quote">&ldquo;{review.quote}&rdquo;</p>
                          <p className="admin-reviews-card-meta">
                            {review.authorDisplay}
                            {review.sortOrder != null ? ` · 순서 ${review.sortOrder}` : ''}
                          </p>
                        </div>
                        <div className="admin-reviews-card-actions">
                          <button type="button" className="admin-reviews-action" onClick={() => openEdit(review)}>
                            수정
                          </button>
                          <button
                            type="button"
                            className="admin-reviews-action"
                            onClick={() => onTogglePublish(id, review.published)}
                          >
                            {review.published ? '숨기기' : '노출'}
                          </button>
                          <button
                            type="button"
                            className="admin-reviews-action admin-reviews-action--danger"
                            onClick={() => onDelete(id, review.productName)}
                          >
                            삭제
                          </button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
