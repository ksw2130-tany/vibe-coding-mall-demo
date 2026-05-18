const { mongoose } = require('../db');

/** 장바구니 한 줄 (상품 + 수량 + 담을 당시 가격 스냅샷) */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품 ID는 필수입니다.'],
    },
    quantity: {
      type: Number,
      required: [true, '수량은 필수입니다.'],
      min: [1, '수량은 1 이상이어야 합니다.'],
      max: [99, '수량은 99 이하여야 합니다.'],
      default: 1,
    },
    /** 담은 시점 상품 단가 (가격 변동 대비) */
    unitPrice: {
      type: Number,
      required: [true, '단가는 필수입니다.'],
      min: [0, '단가는 0 이상이어야 합니다.'],
    },
    /** 주문 시 선택한 옵션 (상품 size / variety 스냅샷) */
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
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 ID는 필수입니다.'],
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator(items) {
          if (!Array.isArray(items)) return false;
          const productIds = items.map((item) => String(item.product));
          return productIds.length === new Set(productIds).size;
        },
        message: '같은 상품은 장바구니에 한 번만 담을 수 있습니다.',
      },
    },
  },
  {
    timestamps: true,
    collection: 'carts',
  }
);

/** 총 수량 */
cartSchema.virtual('itemCount').get(function itemCount() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/** 소계 (unitPrice × quantity 합) */
cartSchema.virtual('subtotal').get(function subtotal() {
  return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
});

cartSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    if (ret.subtotal != null) ret.subtotal = Math.round(ret.subtotal);
    return ret;
  },
});

cartSchema.set('toObject', { virtuals: true });

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ 'items.product': 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
module.exports.cartItemSchema = cartItemSchema;
