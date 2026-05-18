const { mongoose } = require('../db');

/** @readonly */
const ORDER_STATUSES = [
  'pending',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

/** @readonly */
const PAYMENT_METHODS = ['card', 'transfer', 'kakao', 'naver', 'mock'];

/** @readonly */
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

/** @readonly */
const ORDER_SOURCES = ['cart', 'buy_now'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    image: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '', maxlength: 100 },
    quantity: {
      type: Number,
      required: true,
      min: [1, '수량은 1 이상이어야 합니다.'],
      max: [99, '수량은 99 이하여야 합니다.'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, '단가는 0 이상이어야 합니다.'],
    },
    lineTotal: {
      type: Number,
      required: true,
      min: [0, '행 금액은 0 이상이어야 합니다.'],
    },
    size: { type: String, trim: true, default: '', maxlength: 100 },
    variety: { type: String, trim: true, default: '', maxlength: 100 },
  },
  { _id: true }
);

orderItemSchema.virtual('computedLineTotal').get(function computedLineTotal() {
  return this.quantity * this.unitPrice;
});

const shippingSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    zipCode: { type: String, trim: true, default: '', maxlength: 10 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    addressDetail: { type: String, trim: true, default: '', maxlength: 200 },
    memo: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'mock',
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, '결제 금액은 0 이상이어야 합니다.'],
    },
    /** 포트원 imp_uid */
    transactionId: { type: String, trim: true, default: '' },
    /** 포트원 merchant_uid (가맹점 주문번호) */
    merchantUid: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: null },
    failedReason: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    carrier: { type: String, trim: true, default: '', maxlength: 50 },
    number: { type: String, trim: true, default: '', maxlength: 100 },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { _id: false }
);

const statusHistoryItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: '주문 상품이 없습니다.',
      },
    },
    shipping: {
      type: shippingSchema,
      required: true,
    },
    payment: {
      type: paymentSchema,
      required: true,
    },
    tracking: {
      type: trackingSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    statusHistory: {
      type: [statusHistoryItemSchema],
      default: [],
    },
    source: {
      type: String,
      enum: ORDER_SOURCES,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true, default: '', maxlength: 500 },
    adminNote: { type: String, trim: true, default: '', maxlength: 1000 },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.transactionId': 1 }, { unique: true, sparse: true });
orderSchema.index({ 'payment.merchantUid': 1 }, { unique: true, sparse: true });

orderSchema.pre('validate', function ensureLineTotals(next) {
  if (Array.isArray(this.items)) {
    for (const item of this.items) {
      if (item.lineTotal == null || item.lineTotal < 0) {
        item.lineTotal = item.quantity * item.unitPrice;
      }
    }
  }
  next();
});

orderSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    const round = (n) => (n != null ? Math.round(n) : n);
    ret.subtotal = round(ret.subtotal);
    ret.shippingFee = round(ret.shippingFee);
    ret.discountAmount = round(ret.discountAmount);
    ret.totalAmount = round(ret.totalAmount);
    if (ret.payment?.amount != null) ret.payment.amount = round(ret.payment.amount);
    if (Array.isArray(ret.items)) {
      ret.items = ret.items.map((item) => ({
        ...item,
        lineTotal: round(item.lineTotal),
        unitPrice: round(item.unitPrice),
      }));
    }
    return ret;
  },
});

orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.ORDER_SOURCES = ORDER_SOURCES;
