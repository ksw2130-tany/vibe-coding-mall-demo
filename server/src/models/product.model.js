const { mongoose } = require('../db');

/** @readonly */
const PRODUCT_CATEGORIES = ['농산물', '수산물', '정육', '가공식품'];

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU는 필수입니다.'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    name: {
      type: String,
      required: [true, '상품 이름은 필수입니다.'],
      trim: true,
      maxlength: 200,
    },
    price: {
      type: Number,
      required: [true, '상품 가격은 필수입니다.'],
      min: [0, '가격은 0 이상이어야 합니다.'],
    },
    category: {
      type: String,
      required: [true, '카테고리는 필수입니다.'],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: `카테고리는 ${PRODUCT_CATEGORIES.join(', ')} 중 하나여야 합니다.`,
      },
    },
    image: {
      type: String,
      required: [true, '상품 이미지는 필수입니다.'],
      trim: true,
    },
    size: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    variety: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    detailPage: {
      kicker: { type: String, trim: true, default: '', maxlength: 120 },
      highlights: {
        type: [
          {
            icon: { type: String, trim: true, default: '✨', maxlength: 8 },
            title: { type: String, trim: true, default: '', maxlength: 80 },
            desc: { type: String, trim: true, default: '', maxlength: 300 },
          },
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

productSchema.index({ category: 1 });
productSchema.index({ name: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
