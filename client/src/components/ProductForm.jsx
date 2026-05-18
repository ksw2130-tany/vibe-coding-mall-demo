import { PRODUCT_CATEGORIES } from '../lib/products.js'
import ProductDetailPageEditor from './ProductDetailPageEditor.jsx'

/**
 * @param {{
 *   form: Record<string, string>
 *   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
 *   onSubmit: (e: React.FormEvent) => void
 *   submitting?: boolean
 *   submitLabel?: string
 *   onCancel?: () => void
 *   idPrefix?: string
 *   previewProductId?: string | null
 * }} props
 */
export default function ProductForm({
  form,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = '등록',
  onCancel,
  idPrefix = 'product',
  previewProductId = null,
}) {
  return (
    <form className="admin-products-form" onSubmit={onSubmit}>
      <fieldset className="admin-form-section">
        <legend className="admin-form-section-title">기본 정보</legend>
        <label className="admin-products-field" htmlFor={`${idPrefix}-sku`}>
          <span>SKU *</span>
          <input
            id={`${idPrefix}-sku`}
            name="sku"
            value={form.sku}
            onChange={onChange}
            placeholder="FRUIT-KIWI-001"
            required
          />
        </label>
        <label className="admin-products-field" htmlFor={`${idPrefix}-name`}>
          <span>상품 이름 *</span>
          <input
            id={`${idPrefix}-name`}
            name="name"
            value={form.name}
            onChange={onChange}
            required
          />
        </label>
        <label className="admin-products-field" htmlFor={`${idPrefix}-price`}>
          <span>가격 (원) *</span>
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
        <label className="admin-products-field" htmlFor={`${idPrefix}-category`}>
          <span>카테고리 *</span>
          <select id={`${idPrefix}-category`} name="category" value={form.category} onChange={onChange}>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-products-field" htmlFor={`${idPrefix}-size`}>
          <span>크기</span>
          <input
            id={`${idPrefix}-size`}
            name="size"
            value={form.size}
            onChange={onChange}
            placeholder="예: 1kg, 대과, 600g"
          />
        </label>
        <label className="admin-products-field" htmlFor={`${idPrefix}-variety`}>
          <span>종류</span>
          <input
            id={`${idPrefix}-variety`}
            name="variety"
            value={form.variety}
            onChange={onChange}
            placeholder="예: 골드키위, 부사, 샤인머스켓"
          />
        </label>
      </fieldset>

      <ProductDetailPageEditor
        form={form}
        onChange={onChange}
        idPrefix={idPrefix}
        previewProductId={previewProductId}
      />

      <div className="admin-products-form-actions">
        <button
          type="submit"
          className="admin-action-btn admin-action-btn--primary"
          disabled={submitting}
        >
          {submitting ? '저장 중…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="admin-action-btn" onClick={onCancel}>
            취소
          </button>
        ) : null}
      </div>
    </form>
  )
}
