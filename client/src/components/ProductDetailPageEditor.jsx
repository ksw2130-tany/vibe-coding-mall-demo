import CloudinaryImageField from './CloudinaryImageField.jsx'

function parseGallery(value, mainImage) {
  const extra = String(value || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const main = mainImage ? [mainImage] : []
  return [...main, ...extra.filter((url) => !main.includes(url))]
}

/**
 * @param {{
 *   form: Record<string, string>
 *   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
 *   idPrefix?: string
 *   previewProductId?: string | null
 * }} props
 */
export default function ProductDetailPageEditor({
  form,
  onChange,
  idPrefix = 'product',
  previewProductId = null,
}) {
  const gallery = parseGallery(form.additionalImages, form.image)
  const paragraphs = String(form.description || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const highlights = [
    {
      icon: form.detailHighlight1Icon,
      title: form.detailHighlight1Title,
      desc: form.detailHighlight1Desc,
    },
    {
      icon: form.detailHighlight2Icon,
      title: form.detailHighlight2Title,
      desc: form.detailHighlight2Desc,
    },
    {
      icon: form.detailHighlight3Icon,
      title: form.detailHighlight3Title,
      desc: form.detailHighlight3Desc,
    },
  ].filter((h) => h.title?.trim() || h.desc?.trim())

  const previewHref = previewProductId
    ? `/products/${previewProductId}#pdp-panel-detail`
    : null

  return (
    <section className="admin-detail-editor" aria-label="상품 상세 페이지 구성">
      <header className="admin-detail-editor-head">
        <div>
          <h3 className="admin-detail-editor-title">상품 상세 페이지</h3>
          <p className="admin-detail-editor-desc">
            쇼핑몰 상품 상세의 「상품상세」 탭에 표시됩니다. 사진과 설명을 입력하면 고객이 볼 수
            있습니다.
          </p>
        </div>
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-detail-preview-link"
          >
            상세 페이지 열기 ↗
          </a>
        ) : null}
      </header>

      <div className="admin-detail-editor-grid">
        <div className="admin-detail-editor-fields">
          <label className="admin-products-field" htmlFor={`${idPrefix}-detailKicker`}>
            <span>상단 라벨 (키커)</span>
            <input
              id={`${idPrefix}-detailKicker`}
              name="detailKicker"
              value={form.detailKicker}
              onChange={onChange}
              placeholder="예: Premium Fresh"
            />
          </label>

          <label className="admin-products-field admin-products-field--full" htmlFor={`${idPrefix}-description`}>
            <span>상세 설명 본문</span>
            <textarea
              id={`${idPrefix}-description`}
              name="description"
              rows={6}
              value={form.description}
              onChange={onChange}
              placeholder={'문단마다 빈 줄을 넣어 구분하세요.\n\n경안 슈퍼가 엄선한 상품입니다.\n신선함을 그대로 전해 드립니다.'}
            />
          </label>

          <fieldset className="admin-detail-highlights">
            <legend>상세 페이지 강조 포인트 (최대 3개)</legend>
            {[1, 2, 3].map((n) => (
              <div key={n} className="admin-detail-highlight-row">
                <label className="admin-detail-highlight-icon">
                  <span>아이콘</span>
                  <input
                    name={`detailHighlight${n}Icon`}
                    value={form[`detailHighlight${n}Icon`]}
                    onChange={onChange}
                    maxLength={4}
                    placeholder="🚚"
                  />
                </label>
                <label className="admin-detail-highlight-title">
                  <span>제목</span>
                  <input
                    name={`detailHighlight${n}Title`}
                    value={form[`detailHighlight${n}Title`]}
                    onChange={onChange}
                    placeholder="예: 당일·익일 배송"
                  />
                </label>
                <label className="admin-detail-highlight-desc">
                  <span>설명</span>
                  <input
                    name={`detailHighlight${n}Desc`}
                    value={form[`detailHighlight${n}Desc`]}
                    onChange={onChange}
                    placeholder="짧은 설명"
                  />
                </label>
              </div>
            ))}
          </fieldset>

          <CloudinaryImageField
            label="상세 페이지 대표 사진"
            name="image"
            value={form.image}
            onChange={onChange}
            required
            idPrefix={`${idPrefix}-detail`}
          />
          <CloudinaryImageField
            label="상세 페이지 추가 사진 (갤러리)"
            name="additionalImages"
            value={form.additionalImages}
            onChange={onChange}
            multiple
            idPrefix={`${idPrefix}-detail-gallery`}
          />
        </div>

        <aside className="admin-detail-preview" aria-label="상세 페이지 미리보기">
          <p className="admin-detail-preview-label">미리보기</p>
          <div className="admin-detail-preview-card">
            <div className="admin-detail-preview-hero">
              {gallery[0] ? (
                <img src={gallery[0]} alt="" className="admin-detail-preview-hero-img" />
              ) : (
                <div className="admin-detail-preview-hero-placeholder" />
              )}
              <div className="admin-detail-preview-hero-text">
                <p className="admin-detail-preview-kicker">
                  {form.detailKicker.trim() || 'Premium Fresh'}
                </p>
                <h4>{form.name.trim() || '상품 이름'}</h4>
              </div>
            </div>

            {paragraphs.length > 0 ? (
              <div className="admin-detail-preview-copy">
                {paragraphs.slice(0, 3).map((text) => (
                  <p key={text.slice(0, 40)}>{text}</p>
                ))}
              </div>
            ) : (
              <p className="admin-detail-preview-copy admin-detail-preview-copy--muted">
                상세 설명을 입력하면 여기에 표시됩니다.
              </p>
            )}

            {highlights.length > 0 ? (
              <ul className="admin-detail-preview-features">
                {highlights.map((h) => (
                  <li key={`${h.title}-${h.desc}`}>
                    <span aria-hidden>{h.icon || '✨'}</span>
                    <div>
                      <strong>{h.title}</strong>
                      <p>{h.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {gallery.length > 1 ? (
              <ul className="admin-detail-preview-gallery">
                {gallery.slice(1, 5).map((src) => (
                  <li key={src}>
                    <img src={src} alt="" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  )
}
