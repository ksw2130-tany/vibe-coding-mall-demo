const { mongoose } = require('../db');
const Product = require('../models/product.model');
const { PRODUCT_CATEGORIES } = require('../models/product.model');

function parsePrice(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return Number.NaN
}

function parseDetailPage(value) {
  if (value === undefined || value === null) return { kicker: '', highlights: [] }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { kicker: '', highlights: [] }
  }

  const kicker = typeof value.kicker === 'string' ? value.kicker.trim() : ''
  const highlights = Array.isArray(value.highlights)
    ? value.highlights
        .map((row) => ({
          icon: typeof row?.icon === 'string' && row.icon.trim() ? row.icon.trim() : '✨',
          title: typeof row?.title === 'string' ? row.title.trim() : '',
          desc: typeof row?.desc === 'string' ? row.desc.trim() : '',
        }))
        .filter((row) => row.title || row.desc)
        .slice(0, 6)
    : []

  return { kicker, highlights }
}

function parseAdditionalImages(value) {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function pickProductFields(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') return null

  const fields = {}

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'sku')) {
    fields.sku = typeof body.sku === 'string' ? body.sku.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'name')) {
    fields.name = typeof body.name === 'string' ? body.name.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'image')) {
    fields.image = typeof body.image === 'string' ? body.image.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'description')) {
    fields.description =
      typeof body.description === 'string' ? body.description.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'category')) {
    fields.category = typeof body.category === 'string' ? body.category.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'price')) {
    fields.price = parsePrice(body.price)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'size')) {
    fields.size = typeof body.size === 'string' ? body.size.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'variety')) {
    fields.variety = typeof body.variety === 'string' ? body.variety.trim() : partial ? undefined : ''
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'additionalImages')) {
    fields.additionalImages = parseAdditionalImages(body.additionalImages)
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'detailPage')) {
    fields.detailPage = parseDetailPage(body.detailPage)
  }

  return fields
}

function validateProductFields(fields, { partial = false } = {}) {
  const errors = []

  if (!partial || fields.sku !== undefined) {
    if (!fields.sku) errors.push('SKU는 필수입니다.')
  }
  if (!partial || fields.name !== undefined) {
    if (!fields.name) errors.push('상품 이름은 필수입니다.')
  }
  if (!partial || fields.price !== undefined) {
    if (fields.price === undefined || Number.isNaN(fields.price)) {
      errors.push('상품 가격은 필수입니다.')
    } else if (typeof fields.price !== 'number' || fields.price < 0) {
      errors.push('가격은 0 이상의 숫자여야 합니다.')
    }
  }
  if (!partial || fields.category !== undefined) {
    if (!fields.category) {
      errors.push('카테고리는 필수입니다.')
    } else if (!PRODUCT_CATEGORIES.includes(fields.category)) {
      errors.push(`카테고리는 ${PRODUCT_CATEGORIES.join(', ')} 중 하나여야 합니다.`)
    }
  }
  if (!partial || fields.image !== undefined) {
    if (!fields.image) errors.push('상품 이미지는 필수입니다.')
  }

  return errors
}

function sendProductError(res, err, fallbackMessage) {
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: '이미 사용 중인 SKU입니다.',
    })
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ')
    return res.status(400).json({ success: false, message })
  }
  return res.status(500).json({
    success: false,
    message: err.message || fallbackMessage,
  })
}

async function getProducts(req, res) {
  try {
    const filter = {}
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim() : ''
    if (category) {
      if (!PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `카테고리는 ${PRODUCT_CATEGORIES.join(', ')} 중 하나여야 합니다.`,
        })
      }
      filter.category = category
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      filter.$or = [
        { name: regex },
        { sku: regex },
        { variety: regex },
        { size: regex },
      ]
    }

    const total = await Product.countDocuments(filter)

    const hasPage = req.query.page !== undefined && req.query.page !== ''
    const hasLimit = req.query.limit !== undefined && req.query.limit !== ''
    const usePagination = hasPage || hasLimit

    let page = 1
    let limit = total || 1
    if (usePagination) {
      page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
      limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
    }

    const skip = usePagination ? (page - 1) * limit : 0
    let query = Product.find(filter).sort({ createdAt: -1 })
    if (usePagination) {
      query = query.skip(skip).limit(limit)
    }

    const products = await query
    const totalPages = usePagination ? Math.max(1, Math.ceil(total / limit)) : 1

    return res.status(200).json({
      success: true,
      count: total,
      page: usePagination ? page : 1,
      limit: usePagination ? limit : total,
      totalPages,
      products: products.map((p) => p.toJSON()),
    })
  } catch (err) {
    return sendProductError(res, err, '상품 목록을 불러오지 못했습니다.')
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 상품 ID입니다.' })
    }

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' })
    }

    return res.status(200).json({
      success: true,
      product: product.toJSON(),
    })
  } catch (err) {
    return sendProductError(res, err, '상품을 불러오지 못했습니다.')
  }
}

async function createProduct(req, res) {
  try {
    const fields = pickProductFields(req.body)
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: '요청 본문이 올바르지 않습니다.',
      })
    }

    const errors = validateProductFields(fields)
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') })
    }

    const product = await Product.create({
      sku: fields.sku,
      name: fields.name,
      price: fields.price,
      category: fields.category,
      image: fields.image,
      size: fields.size || '',
      variety: fields.variety || '',
      additionalImages: fields.additionalImages ?? [],
      description: fields.description || '',
      detailPage: fields.detailPage ?? { kicker: '', highlights: [] },
    })

    return res.status(201).json({
      success: true,
      message: '상품이 등록되었습니다.',
      product: product.toJSON(),
    })
  } catch (err) {
    return sendProductError(res, err, '상품 등록 중 오류가 발생했습니다.')
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 상품 ID입니다.' })
    }

    const fields = pickProductFields(req.body, { partial: true })
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: '요청 본문이 올바르지 않습니다.',
      })
    }

    const updates = {}
    for (const key of [
      'sku',
      'name',
      'price',
      'category',
      'image',
      'size',
      'variety',
      'additionalImages',
      'description',
      'detailPage',
    ]) {
      if (fields[key] !== undefined) updates[key] = fields[key]
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 필드를 하나 이상 보내 주세요.',
      })
    }

    const errors = validateProductFields(updates, { partial: true })
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') })
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })

    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' })
    }

    return res.status(200).json({
      success: true,
      message: '상품이 수정되었습니다.',
      product: product.toJSON(),
    })
  } catch (err) {
    return sendProductError(res, err, '상품 수정 중 오류가 발생했습니다.')
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 상품 ID입니다.' })
    }

    const product = await Product.findByIdAndDelete(id)
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' })
    }

    return res.status(200).json({
      success: true,
      message: '상품이 삭제되었습니다.',
      product: product.toJSON(),
    })
  } catch (err) {
    return sendProductError(res, err, '상품 삭제 중 오류가 발생했습니다.')
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  PRODUCT_CATEGORIES,
}
