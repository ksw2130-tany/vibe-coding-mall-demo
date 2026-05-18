import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AdminTopbar from '../components/AdminTopbar.jsx'
import ProductForm from '../components/ProductForm.jsx'
import { fetchCurrentUser, getStoredAuth } from '../lib/auth.js'
import {
  EMPTY_PRODUCT_FORM,
  formToProductBody,
  validateProductForm,
} from '../lib/productForm.js'
import {
  PRODUCT_CATEGORIES,
  fetchProducts,
  messageFromApi,
  registerProduct,
} from '../lib/products.js'
import './Admin.css'
import './AdminProducts.css'

function isAdminUser(user) {
  if (!user || typeof user !== 'object') return false
  const t = user.user_type ?? user.userType
  return t === 'admin'
}

export default function AdminProductNew() {
  const navigate = useNavigate()
  const [authGate, setAuthGate] = useState(() => (getStoredAuth() ? 'checking' : 'denied'))
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM)
  const [products, setProducts] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const loadProducts = useCallback(async () => {
    setLoadingList(true)
    const { ok, data } = await fetchProducts(categoryFilter || undefined)
    if (ok && Array.isArray(data.products)) {
      setProducts(data.products)
    } else {
      setProducts([])
    }
    setLoadingList(false)
  }, [categoryFilter])

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
    if (authGate === 'ok') loadProducts()
  }, [authGate, loadProducts])

  function onFieldChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')

    const validationErrors = validateProductForm(form)
    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(' '))
      return
    }

    setSubmitting(true)
    const { ok, data } = await registerProduct(formToProductBody(form))
    setSubmitting(false)

    if (!ok) {
      setFormError(messageFromApi(data, '상품 등록에 실패했습니다.'))
      return
    }

    setForm(EMPTY_PRODUCT_FORM)
    loadProducts()
    navigate('/admin/products', {
      state: { productCreated: messageFromApi(data, '상품이 등록되었습니다.') },
    })
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
    return <Navigate to="/login" replace state={{ from: '/admin/products/new' }} />
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
            <Link to="/admin/products/new" className="admin-products-new-btn admin-products-new-btn--active">
              + 새 상품 등록
            </Link>
          </header>

          <section className="admin-products-form-panel" aria-label="새 상품 등록">
            <h2 className="admin-panel-title">새 상품 등록</h2>
            {formError ? (
              <p className="admin-products-alert admin-products-alert--error" role="alert">
                {formError}
              </p>
            ) : null}
            <ProductForm
              form={form}
              onChange={onFieldChange}
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel="등록"
              onCancel={() => navigate('/admin/products')}
              idPrefix="new-product"
            />
          </section>

          <section className="admin-panel admin-products-list-panel" aria-label="등록된 상품">
            <div className="admin-products-list-toolbar">
              <h2 className="admin-panel-title">등록된 상품 ({products.length})</h2>
              <label className="admin-products-filter">
                <span className="sr-only">카테고리 필터</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">전체 카테고리</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loadingList ? (
              <p className="admin-products-status">불러오는 중…</p>
            ) : products.length === 0 ? (
              <p className="admin-products-empty">등록된 상품이 없습니다.</p>
            ) : (
              <div className="admin-products-table-wrap">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>상품</th>
                      <th>크기/종류</th>
                      <th>카테고리</th>
                      <th>가격</th>
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
                        <td>₩{Number(p.price).toLocaleString('ko-KR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
