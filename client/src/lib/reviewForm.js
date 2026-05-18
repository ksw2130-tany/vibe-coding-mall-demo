import { REVIEW_THUMB_HUES } from './reviewConstants.js'

export const EMPTY_REVIEW_FORM = {
  productName: '',
  productId: '',
  price: '',
  compareAtPrice: '',
  discountPercent: '',
  image: '',
  thumbHue: 'mango',
  quote: '',
  authorDisplay: '',
  published: true,
  sortOrder: '0',
}

/** @param {Record<string, unknown>} review */
export function reviewToForm(review) {
  const product = review.product
  let productId = ''
  if (product && typeof product === 'object' && product._id) {
    productId = String(product._id)
  } else if (typeof review.product === 'string') {
    productId = review.product
  }

  return {
    productName: String(review.productName ?? ''),
    productId,
    price: review.price != null ? String(review.price) : '',
    compareAtPrice:
      review.compareAtPrice != null && review.compareAtPrice !== ''
        ? String(review.compareAtPrice)
        : '',
    discountPercent:
      review.discountPercent != null && review.discountPercent !== ''
        ? String(review.discountPercent)
        : '',
    image: String(review.image ?? ''),
    thumbHue: REVIEW_THUMB_HUES.includes(String(review.thumbHue))
      ? String(review.thumbHue)
      : 'mango',
    quote: String(review.quote ?? ''),
    authorDisplay: String(review.authorDisplay ?? ''),
    published: review.published !== false,
    sortOrder: review.sortOrder != null ? String(review.sortOrder) : '0',
  }
}

/** @param {typeof EMPTY_REVIEW_FORM} form */
export function formToReviewBody(form) {
  const price = Number(form.price)
  const compareAtPrice =
    form.compareAtPrice.trim() === '' ? null : Number(form.compareAtPrice)
  const discountPercent =
    form.discountPercent.trim() === '' ? null : Number(form.discountPercent)

  return {
    productName: form.productName.trim(),
    product: form.productId.trim() || null,
    price,
    compareAtPrice,
    discountPercent,
    image: form.image.trim(),
    thumbHue: form.thumbHue,
    quote: form.quote.trim(),
    authorDisplay: form.authorDisplay.trim(),
    published: Boolean(form.published),
    sortOrder: Number(form.sortOrder) || 0,
  }
}

/** @param {typeof EMPTY_REVIEW_FORM} form */
export function validateReviewForm(form) {
  const errors = []
  if (!form.productName.trim()) errors.push('상품명을 입력해 주세요.')
  if (form.price.trim() === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    errors.push('표시 가격을 올바르게 입력해 주세요.')
  }
  if (form.compareAtPrice.trim() !== '') {
    const was = Number(form.compareAtPrice)
    if (Number.isNaN(was) || was < 0) errors.push('정가를 올바르게 입력해 주세요.')
  }
  if (form.discountPercent.trim() !== '') {
    const off = Number(form.discountPercent)
    if (Number.isNaN(off) || off < 0 || off > 100) {
      errors.push('할인율은 0~100 사이여야 합니다.')
    }
  }
  if (!form.quote.trim()) errors.push('리뷰 내용을 입력해 주세요.')
  if (!form.authorDisplay.trim()) errors.push('작성자 표시명을 입력해 주세요.')
  return errors
}

/** @param {Record<string, unknown>} review */
export function reviewToHomeCard(review) {
  return {
    id: String(review._id ?? review.id ?? ''),
    name: String(review.productName ?? ''),
    price: Number(review.price) || 0,
    was: review.compareAtPrice != null ? Number(review.compareAtPrice) : null,
    off: review.discountPercent != null ? Number(review.discountPercent) : null,
    image: typeof review.image === 'string' ? review.image : '',
    hue: REVIEW_THUMB_HUES.includes(String(review.thumbHue))
      ? String(review.thumbHue)
      : 'mango',
    quote: String(review.quote ?? ''),
    by: String(review.authorDisplay ?? ''),
  }
}
