const { mongoose } = require('../db');

/** @readonly */
const REVIEW_THUMB_HUES = [
  'kiwi',
  'apple',
  'grape',
  'melon',
  'berry',
  'mango',
  'tomato',
  'greengrape',
  'strawberry',
  'banana',
];

const reviewSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, '상품명은 필수입니다.'],
      trim: true,
      maxlength: 200,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    price: {
      type: Number,
      required: [true, '표시 가격은 필수입니다.'],
      min: [0, '가격은 0 이상이어야 합니다.'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, '정가는 0 이상이어야 합니다.'],
      default: null,
    },
    discountPercent: {
      type: Number,
      min: [0, '할인율은 0 이상이어야 합니다.'],
      max: [100, '할인율은 100 이하여야 합니다.'],
      default: null,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    thumbHue: {
      type: String,
      enum: {
        values: REVIEW_THUMB_HUES,
        message: `썸네일 색상은 ${REVIEW_THUMB_HUES.join(', ')} 중 하나여야 합니다.`,
      },
      default: 'mango',
    },
    quote: {
      type: String,
      required: [true, '리뷰 내용은 필수입니다.'],
      trim: true,
      maxlength: 500,
    },
    authorDisplay: {
      type: String,
      required: [true, '작성자 표시명은 필수입니다.'],
      trim: true,
      maxlength: 50,
    },
    published: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

reviewSchema.index({ published: 1, sortOrder: 1, createdAt: -1 });
reviewSchema.index({ productName: 'text', quote: 'text', authorDisplay: 'text' });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
module.exports.REVIEW_THUMB_HUES = REVIEW_THUMB_HUES;
