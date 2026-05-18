import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AdminTopbar from '../components/AdminTopbar.jsx'
import ProductForm from '../components/ProductForm.jsx'
import ProductSearchBar from '../components/ProductSearchBar.jsx'
import { fetchCurrentUser, getStoredAuth } from '../lib/auth.js'
import {
  EMPTY_PRODUCT_FORM,
  formToProductBody,
  productToForm,
  validateProductForm,
} from '../lib/productForm.js'
import {
  PRODUCTS_PAGE_SIZE,
  deleteProduct,
  fetchProducts,
  messageFromApi,
  updateProduct,
} from '../lib/products.js'
import './Admin.css'
import './AdminProducts.css'

function formatWon(n) {
  return Number(n).toLocaleString('ko-KR')
}

function isAdminUser(user) {
  if (!user || typeof user !== 'object') return false
  const t = user.user_type ?? user.userType
  return t === 'admin'
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authGate, setAuthGate] = useState(() => (getStoredAuth() ? 'checking' : 'denied'))
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(
    () => location.state?.productCreated ?? ''
  )

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setListError('')
    const { ok, data } = await fetchProducts({
      category: categoryFilter || undefined,
      q: debouncedSearch || undefined,
      page,
      limit: PRODUCTS_PAGE_SIZE,
    })
    if (!ok) {
      setListError(messageFromApi(data, '상품 목록을 불러오지 못했습니다.'))
      setProducts([])
      setTotalCount(0)
      setTotalPages(1)
    } else {
      const items = Array.isArray(data.products) ? data.products : []
      const total = typeof data.count === 'number' ? data.count : 0
      const pages = typeof data.totalPages === 'number' ? data.totalPages : 1

      if (items.length === 0 && page > 1 && total > 0) {
        setPage(page - 1)
        return
      }

      setProducts(items)
      setTotalCount(total)
      setTotalPages(pages)
    }
    setLoading(false)
  }, [categoryFilter, debouncedSearch, page])

  useEffect(() => {
    let cancelled = false
    if (!getStoredAuth()) {
      setAuthGate('denied')
      return undefined
    }
    ;(async () => {
      const user = await fetchCurrentUser()
      if (cancelled) return
      if (!user || !isAdminUser(user)) setAuthGate('forbidden')
      else setAuthGate('ok')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryFilter])

  useEffect(() => {
    if (authGate === 'ok') loadProducts()
  }, [authGate, loadProducts])

  useEffect(() => {
    if (location.state?.productCreated) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  function resetForm() {
    setForm(EMPTY_PRODUCT_FORM)
    setEditingId(null)
    setFormError('')
    setFormSuccess('')
    setShowForm(false)
  }

  /** @param {Record<string, unknown>} product */
  function openEdit(product) {
    setEditingId(String(product._id))
    setForm(productToForm(product))
    setShowForm(true)
    setFormError('')
    setFormSuccess('')
  }

  function onFieldChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!editingId) return
    setFormError('')
    setFormSuccess('')

    const validationErrors = validateProductForm(form)
    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(' '))
      return
    }

    setSubmitting(true)
    const { ok, data } = await updateProduct(editingId, formToProductBody(form))
    setSubmitting(false)

    if (!ok) {
      setFormError(messageFromApi(data, '저장에 실패했습니다.'))
      return
    }

    setFormSuccess(messageFromApi(data, '상품이 수정되었습니다.'))
    resetForm()
    loadProducts()
  }

  async function onDelete(id, name) {
    if (!window.confirm(`"${name}" 상품을 삭제할까요?`)) return
    const { ok, data } = await deleteProduct(id)
    if (!ok) {
      window.alert(messageFromApi(data, '삭제에 실패했습니다.'))
      return
    }
    if (editingId === id) resetForm()
    loadProducts()
  }

  if (authGate === 'checking') {
    return (
      <div className="admin admin-products">
        <AdminTopbar dashboardLink />
        <p className="admin-products-status">권한 확인 중…</p>
      </div>
    )
  }

  if (authGate === 'denied') {
    return <Navigate to="/login" replace state={{ from: '/admin/products' }} />
  }

  if (authGate === 'forbidden') {
    return (
      <div className="admin admin-products">
        <AdminTopbar dashboardLink />
        <div className="admin-shell admin-products-forbidden">
          <p>관리자만 접근할 수 있습니다.</p>
          <Link to="/">홈으로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin admin-products">
      <AdminTopbar dashboardLink />

      <main className="admin-main">
        <div className="admin-shell">
          <header className="admin-hero admin-products-hero">
            <div>
              <h1 className="admin-hero-title">상품 관리</h1>
              <p className="admin-hero-desc">상품 등록·수정·삭제</p>
            </div>
            <Link to="/admin/products/new" className="admin-products-new-btn">
              + 새 상품 등록
            </Link>
          </header>

          {formSuccess && !showForm ? (
            <p className="admin-products-alert admin-products-alert--ok" role="status">
              {formSuccess}
            </p>
          ) : null}

          {showForm && editingId ? (
            <section className="admin-products-form-panel" aria-label="상품 수정">
              <h2 className="admin-panel-title">상품 수정</h2>
              {formError ? (
                <p className="admin-products-alert admin-products-alert--error" role="alert">
                  {formError}
                </p>
              ) : null}
              {formSuccess ? (
                <p className="admin-products-alert admin-products-alert--ok" role="status">
                  {formSuccess}
                </p>
              ) : null}
              <ProductForm
                form={form}
                onChange={onFieldChange}
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel="수정 저장"
                onCancel={resetForm}
                idPrefix="edit-product"
                previewProductId={editingId}
              />
            </section>
          ) : null}

          <section className="admin-panel admin-products-list-panel" aria-label="상품 목록">
            <div className="admin-products-list-toolbar">
              <h2 className="admin-panel-title">
                등록된 상품 ({totalCount})
                {totalPages > 1 ? ` · ${page} / ${totalPages}페이지` : ''}
              </h2>
            </div>

            <ProductSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              filterOpen={filterOpen}
              onFilterToggle={() => setFilterOpen((v) => !v)}
            />

            {listError ? (
              <p className="admin-products-alert admin-products-alert--error" role="alert">
                {listError}
              </p>
            ) : null}

            {loading ? (
              <p className="admin-products-status">불러오는 중…</p>
            ) : totalCount === 0 ? (
              <p className="admin-products-empty">
                {debouncedSearch || categoryFilter
                  ? '검색·필터 조건에 맞는 상품이 없습니다.'
                  : '등록된 상품이 없습니다.'}
              </p>
            ) : (
              <>
              <div className="admin-products-table-wrap">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>상품</th>
                      <th>크기/종류</th>
                      <th>카테고리</th>
                      <th>가격</th>
                      <th aria-label="작업" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id}>
                        <td className="admin-products-sku">{p.sku}</td>
                        <td>
                          <div className="admin-products-cell-name">
                            {p.image ? (
                              <img src={p.image} alt="" className="admin-products-thumb" />
                            ) : null}
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td>
                          {[p.size, p.variety].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td>{p.category}</td>
                        <td>₩{formatWon(p.price)}</td>
                        <td className="admin-products-actions">
                          <button type="button" onClick={() => openEdit(p)}>
                            수정
                          </button>
                          <button
                            type="button"
                            className="admin-products-delete"
                            onClick={() => onDelete(p._id, p.name)}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <nav className="admin-products-pagination" aria-label="상품 목록 페이지">
                  <button
                    type="button"
                    className="admin-products-page-btn"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    이전
                  </button>
                  <span className="admin-products-page-info">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="admin-products-page-btn"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    다음
                  </button>
                </nav>
              ) : null}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
