const { mongoose } = require('../db');
const Review = require('../models/review.model');
const { REVIEW_THUMB_HUES } = require('../models/review.model');

const DEFAULT_REVIEWS = [
  {
    productName: '애플망고 2입',
    price: 18900,
    image: '/images/review-apple-mango.png',
    thumbHue: 'mango',
    quote: '향이 진하고 당도 최고예요. 재구매 각입니다!',
    authorDisplay: 'sky***',
    sortOrder: 1,
    published: true,
  },
  {
    productName: '방울토마토 1kg',
    price: 7900,
    image: '/images/review-cherry-tomato.png',
    thumbHue: 'tomato',
    quote: '아이 간식으로 딱이에요. 탱글탱글해요.',
    authorDisplay: 'momo**',
    sortOrder: 2,
    published: true,
  },
  {
    productName: '청포도 1송이',
    price: 12900,
    image: '/images/review-green-grape.png',
    thumbHue: 'greengrape',
    quote: '포장 꼼꼼하고 상처 없이 잘 왔어요.',
    authorDisplay: 'fruit*',
    sortOrder: 3,
    published: true,
  },
  {
    productName: '딸기 500g',
    price: 14900,
    compareAtPrice: 16900,
    discountPercent: 12,
    image: '/images/review-strawberry.png',
    thumbHue: 'strawberry',
    quote: '향긋하고 새콤달콤! 생과일 느낌 그대로예요.',
    authorDisplay: 'berry***',
    sortOrder: 4,
    published: true,
  },
];

async function ensureDefaultReviews() {
  const count = await Review.countDocuments();
  if (count === 0) {
    await Review.insertMany(DEFAULT_REVIEWS);
  }
}

function parsePrice(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = parsePrice(value);
  return Number.isNaN(n) ? Number.NaN : n;
}

function pickReviewFields(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object') return null;

  const fields = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'productName')) {
    fields.productName =
      typeof body.productName === 'string' ? body.productName.trim() : partial ? undefined : '';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'product')) {
    if (body.product === null || body.product === '') {
      fields.product = null;
    } else if (typeof body.product === 'string' && mongoose.isValidObjectId(body.product)) {
      fields.product = body.product;
    } else if (partial && body.product === undefined) {
      fields.product = undefined;
    } else if (!partial) {
      fields.product = null;
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'price')) {
    fields.price = parsePrice(body.price);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'compareAtPrice')) {
    fields.compareAtPrice = parseOptionalNumber(body.compareAtPrice);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'discountPercent')) {
    fields.discountPercent = parseOptionalNumber(body.discountPercent);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'image')) {
    fields.image = typeof body.image === 'string' ? body.image.trim() : partial ? undefined : '';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'thumbHue')) {
    fields.thumbHue =
      typeof body.thumbHue === 'string' ? body.thumbHue.trim() : partial ? undefined : 'mango';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'quote')) {
    fields.quote = typeof body.quote === 'string' ? body.quote.trim() : partial ? undefined : '';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'authorDisplay')) {
    fields.authorDisplay =
      typeof body.authorDisplay === 'string' ? body.authorDisplay.trim() : partial ? undefined : '';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'published')) {
    if (body.published === undefined || body.published === null) {
      fields.published = partial ? undefined : true;
    } else {
      fields.published = Boolean(body.published);
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
    const sortOrder = parsePrice(body.sortOrder);
    fields.sortOrder = Number.isNaN(sortOrder) ? 0 : sortOrder;
  }

  return fields;
}

function validateReviewFields(fields, { partial = false } = {}) {
  const errors = [];

  if (!partial || fields.productName !== undefined) {
    if (!fields.productName) errors.push('상품명은 필수입니다.');
  }
  if (!partial || fields.price !== undefined) {
    if (fields.price === undefined || Number.isNaN(fields.price) || fields.price < 0) {
      errors.push('표시 가격은 0 이상의 숫자여야 합니다.');
    }
  }
  if (!partial || fields.compareAtPrice !== undefined) {
    if (fields.compareAtPrice !== null && fields.compareAtPrice !== undefined) {
      if (Number.isNaN(fields.compareAtPrice) || fields.compareAtPrice < 0) {
        errors.push('정가는 0 이상의 숫자여야 합니다.');
      }
    }
  }
  if (!partial || fields.discountPercent !== undefined) {
    if (fields.discountPercent !== null && fields.discountPercent !== undefined) {
      if (
        Number.isNaN(fields.discountPercent) ||
        fields.discountPercent < 0 ||
        fields.discountPercent > 100
      ) {
        errors.push('할인율은 0~100 사이여야 합니다.');
      }
    }
  }
  if (!partial || fields.thumbHue !== undefined) {
    if (fields.thumbHue && !REVIEW_THUMB_HUES.includes(fields.thumbHue)) {
      errors.push(`썸네일 색상은 ${REVIEW_THUMB_HUES.join(', ')} 중 하나여야 합니다.`);
    }
  }
  if (!partial || fields.quote !== undefined) {
    if (!fields.quote) errors.push('리뷰 내용은 필수입니다.');
  }
  if (!partial || fields.authorDisplay !== undefined) {
    if (!fields.authorDisplay) errors.push('작성자 표시명은 필수입니다.');
  }

  return errors;
}

function sendReviewError(res, err, fallbackMessage) {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
    return res.status(400).json({ success: false, message });
  }
  return res.status(500).json({
    success: false,
    message: err.message || fallbackMessage,
  });
}

async function getPublicReviews(_req, res) {
  try {
    await ensureDefaultReviews();
    const reviews = await Review.find({ published: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return res.json({ success: true, reviews, count: reviews.length });
  } catch (err) {
    return sendReviewError(res, err, '리뷰 목록을 불러오지 못했습니다.');
  }
}

async function getAdminReviews(req, res) {
  try {
    await ensureDefaultReviews();

    const filter = {};
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { productName: regex },
        { quote: regex },
        { authorDisplay: regex },
      ];
    }

    const published = req.query.published;
    if (published === 'true') filter.published = true;
    if (published === 'false') filter.published = false;

    const reviews = await Review.find(filter)
      .populate('product', 'name sku image price')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return res.json({ success: true, reviews, count: reviews.length });
  } catch (err) {
    return sendReviewError(res, err, '리뷰 목록을 불러오지 못했습니다.');
  }
}

async function getReviewById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: '잘못된 리뷰 ID입니다.' });
    }
    const review = await Review.findById(req.params.id).populate('product', 'name sku image price').lean();
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, review });
  } catch (err) {
    return sendReviewError(res, err, '리뷰를 불러오지 못했습니다.');
  }
}

async function createReview(req, res) {
  try {
    const fields = pickReviewFields(req.body, { partial: false });
    const errors = validateReviewFields(fields, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const review = await Review.create(fields);
    return res.status(201).json({
      success: true,
      message: '리뷰가 등록되었습니다.',
      review,
    });
  } catch (err) {
    return sendReviewError(res, err, '리뷰 등록에 실패했습니다.');
  }
}

async function updateReview(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: '잘못된 리뷰 ID입니다.' });
    }

    const fields = pickReviewFields(req.body, { partial: true });
    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ success: false, message: '수정할 항목이 없습니다.' });
    }

    const errors = validateReviewFields(fields, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const review = await Review.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    }).populate('product', 'name sku image price');

    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    return res.json({
      success: true,
      message: '리뷰가 수정되었습니다.',
      review,
    });
  } catch (err) {
    return sendReviewError(res, err, '리뷰 수정에 실패했습니다.');
  }
}

async function toggleReviewPublish(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: '잘못된 리뷰 ID입니다.' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    if (typeof req.body?.published === 'boolean') {
      review.published = req.body.published;
    } else {
      review.published = !review.published;
    }
    await review.save();

    return res.json({
      success: true,
      message: review.published ? '리뷰가 노출됩니다.' : '리뷰가 숨김 처리되었습니다.',
      review,
    });
  } catch (err) {
    return sendReviewError(res, err, '노출 상태 변경에 실패했습니다.');
  }
}

async function deleteReview(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: '잘못된 리뷰 ID입니다.' });
    }

    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    return res.json({ success: true, message: '리뷰가 삭제되었습니다.' });
  } catch (err) {
    return sendReviewError(res, err, '리뷰 삭제에 실패했습니다.');
  }
}

module.exports = {
  getPublicReviews,
  getAdminReviews,
  getReviewById,
  createReview,
  updateReview,
  toggleReviewPublish,
  deleteReview,
};
