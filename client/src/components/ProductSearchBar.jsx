import { PRODUCT_CATEGORIES } from '../lib/productConstants.js'

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  )
}

/**
 * @param {{
 *   searchQuery: string
 *   onSearchChange: (value: string) => void
 *   categoryFilter: string
 *   onCategoryChange: (value: string) => void
 *   filterOpen: boolean
 *   onFilterToggle: () => void
 * }} props
 */
export default function ProductSearchBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  filterOpen,
  onFilterToggle,
}) {
  const hasActiveFilter = Boolean(categoryFilter)

  return (
    <div className="admin-products-search-wrap">
      <div className="admin-products-search-bar">
        <label className="admin-products-search-field">
          <span className="admin-products-search-icon" aria-hidden>
            <IconSearch />
          </span>
          <input
            type="search"
            className="admin-products-search-input"
            placeholder="상품명으로 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="상품명으로 검색"
          />
        </label>
        <button
          type="button"
          className={`admin-products-filter-btn${hasActiveFilter ? ' admin-products-filter-btn--active' : ''}`}
          onClick={onFilterToggle}
          aria-expanded={filterOpen}
          aria-controls="product-filter-panel"
        >
          <IconFilter />
          필터
          {hasActiveFilter ? <span className="admin-products-filter-dot" aria-hidden /> : null}
        </button>
      </div>

      {filterOpen ? (
        <div id="product-filter-panel" className="admin-products-filter-panel" role="region" aria-label="필터">
          <label className="admin-products-filter-label">
            <span>카테고리</span>
            <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
              <option value="">전체 카테고리</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {hasActiveFilter ? (
            <button
              type="button"
              className="admin-products-filter-reset"
              onClick={() => onCategoryChange('')}
            >
              필터 초기화
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
