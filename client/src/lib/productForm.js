import { PRODUCT_CATEGORIES } from './productConstants.js'

const DEFAULT_HIGHLIGHTS = [
  { icon: '🚚', title: '당일·익일 배송', desc: '오전 주문 시 당일 출고를 원칙으로 합니다.' },
  { icon: '✅', title: '엄격한 품질 관리', desc: '선별·검수 후 안전하게 포장합니다.' },
  { icon: '🌿', title: '신선도 보장', desc: '냉장·완충 포장으로 신선하게 전달합니다.' },
]

export const EMPTY_PRODUCT_FORM = {
  sku: '',
  name: '',
  price: '',
  category: PRODUCT_CATEGORIES[0],
  size: '',
  variety: '',
  image: '',
  additionalImages: '',
  description: '',
  detailKicker: '',
  detailHighlight1Icon: DEFAULT_HIGHLIGHTS[0].icon,
  detailHighlight1Title: DEFAULT_HIGHLIGHTS[0].title,
  detailHighlight1Desc: DEFAULT_HIGHLIGHTS[0].desc,
  detailHighlight2Icon: DEFAULT_HIGHLIGHTS[1].icon,
  detailHighlight2Title: DEFAULT_HIGHLIGHTS[1].title,
  detailHighlight2Desc: DEFAULT_HIGHLIGHTS[1].desc,
  detailHighlight3Icon: DEFAULT_HIGHLIGHTS[2].icon,
  detailHighlight3Title: DEFAULT_HIGHLIGHTS[2].title,
  detailHighlight3Desc: DEFAULT_HIGHLIGHTS[2].desc,
}

function highlightsFromProduct(detailPage) {
  const src = Array.isArray(detailPage?.highlights) ? detailPage.highlights : []
  return [0, 1, 2].map((i) => ({
    icon: src[i]?.icon || DEFAULT_HIGHLIGHTS[i].icon,
    title: src[i]?.title || '',
    desc: src[i]?.desc || '',
  }))
}

/** @param {Record<string, unknown>} product */
export function productToForm(product) {
  const extra = Array.isArray(product.additionalImages)
    ? product.additionalImages.join('\n')
    : ''
  const highlights = highlightsFromProduct(product.detailPage)

  return {
    sku: String(product.sku ?? ''),
    name: String(product.name ?? ''),
    price: String(product.price ?? ''),
    category: PRODUCT_CATEGORIES.includes(product.category)
      ? product.category
      : PRODUCT_CATEGORIES[0],
    size: String(product.size ?? ''),
    variety: String(product.variety ?? ''),
    image: String(product.image ?? ''),
    additionalImages: extra,
    description: String(product.description ?? ''),
    detailKicker: String(product.detailPage?.kicker ?? ''),
    detailHighlight1Icon: highlights[0].icon,
    detailHighlight1Title: highlights[0].title,
    detailHighlight1Desc: highlights[0].desc,
    detailHighlight2Icon: highlights[1].icon,
    detailHighlight2Title: highlights[1].title,
    detailHighlight2Desc: highlights[1].desc,
    detailHighlight3Icon: highlights[2].icon,
    detailHighlight3Title: highlights[2].title,
    detailHighlight3Desc: highlights[2].desc,
  }
}

function buildDetailPage(form) {
  const highlights = [
    {
      icon: form.detailHighlight1Icon.trim() || '✨',
      title: form.detailHighlight1Title.trim(),
      desc: form.detailHighlight1Desc.trim(),
    },
    {
      icon: form.detailHighlight2Icon.trim() || '✨',
      title: form.detailHighlight2Title.trim(),
      desc: form.detailHighlight2Desc.trim(),
    },
    {
      icon: form.detailHighlight3Icon.trim() || '✨',
      title: form.detailHighlight3Title.trim(),
      desc: form.detailHighlight3Desc.trim(),
    },
  ].filter((row) => row.title || row.desc)

  return {
    kicker: form.detailKicker.trim(),
    highlights,
  }
}

/** @param {typeof EMPTY_PRODUCT_FORM} form */
export function formToProductBody(form) {
  return {
    sku: form.sku.trim(),
    name: form.name.trim(),
    price: Number(form.price),
    category: form.category,
    image: form.image.trim(),
    size: form.size.trim(),
    variety: form.variety.trim(),
    additionalImages: form.additionalImages
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    description: form.description.trim(),
    detailPage: buildDetailPage(form),
  }
}

/** @param {typeof EMPTY_PRODUCT_FORM} form — 상세 페이지 미리보기용 */
export function formToPreviewProduct(form, productId = 'preview') {
  const body = formToProductBody(form)
  return {
    _id: productId,
    ...body,
    price: Number(body.price) || 0,
  }
}

/** @param {typeof EMPTY_PRODUCT_FORM} form @returns {string[]} */
export function validateProductForm(form) {
  const errors = []

  if (!form.sku.trim()) errors.push('SKU는 필수입니다.')
  if (!form.name.trim()) errors.push('상품 이름은 필수입니다.')

  const price = Number(form.price)
  if (form.price === '' || Number.isNaN(price)) {
    errors.push('상품 가격은 필수입니다.')
  } else if (price < 0) {
    errors.push('가격은 0 이상이어야 합니다.')
  }

  if (!form.category || !PRODUCT_CATEGORIES.includes(form.category)) {
    errors.push(`카테고리는 ${PRODUCT_CATEGORIES.join(', ')} 중 하나여야 합니다.`)
  }

  if (!form.image.trim()) errors.push('대표 이미지는 필수입니다.')

  return errors
}
