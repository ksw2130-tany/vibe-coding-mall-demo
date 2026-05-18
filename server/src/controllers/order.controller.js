const { mongoose } = require('../db');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const {
  ORDER_STATUSES,
  PAYMENT_METHODS,
} = require('../models/order.model');
const { isAdminPayload } = require('../auth/auth.service');
const {
  ADMIN_ORDER_STAGES,
  assertAdminPayload,
  applyAdminOrderStage,
  canAdminTransitionStatus,
  getAdminOrderActions,
  getAdminPermissionsPayload,
} = require('../config/order.permissions');
const { assertNoDuplicateOrder, findDuplicateOrder } = require('../services/order.service');
const { verifyPortonePayment } = require('../services/portone.service');

const SHIPPING_FEE = 0;

function pickPaymentInfo(body) {
  const src = body?.payment && typeof body.payment === 'object' ? body.payment : body;
  const impUid = src?.impUid ?? src?.imp_uid ?? '';
  const merchantUid = src?.merchantUid ?? src?.merchant_uid ?? '';
  return {
    impUid: typeof impUid === 'string' ? impUid.trim() : '',
    merchantUid: typeof merchantUid === 'string' ? merchantUid.trim() : '',
  };
}

function buildOrderItemRow(product, { quantity, unitPrice, size, variety }) {
  const qty = quantity;
  const price = unitPrice;
  return {
    product: product._id,
    sku: product.sku || '',
    name: product.name,
    image: product.image || '',
    category: product.category || '',
    quantity: qty,
    unitPrice: price,
    lineTotal: qty * price,
    size: size || '',
    variety: variety || '',
  };
}

function appendStatusHistory(order, status, note = '') {
  order.statusHistory.push({
    status,
    at: new Date(),
    note: typeof note === 'string' ? note.trim().slice(0, 500) : '',
  });
}

function pickPaymentMethod(body) {
  const method = body?.payment?.method ?? body?.paymentMethod;
  if (typeof method === 'string' && PAYMENT_METHODS.includes(method)) {
    return method;
  }
  return 'mock';
}

function parseDiscountAmount(body) {
  const n = Number(body?.discountAmount ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function generateOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${y}${m}${day}-${rand}`;
}

function pickShipping(body, user) {
  const src =
    body?.shipping && typeof body.shipping === 'object' && !Array.isArray(body.shipping)
      ? body.shipping
      : body;

  const recipientName =
    typeof src?.recipientName === 'string' && src.recipientName.trim()
      ? src.recipientName.trim()
      : user?.name || '';
  const phone = typeof src?.phone === 'string' && src.phone.trim() ? src.phone.trim() : '';
  const zipCode =
    typeof src?.zipCode === 'string' && src.zipCode.trim() ? src.zipCode.trim() : '';
  const address =
    typeof src?.address === 'string' && src.address.trim()
      ? src.address.trim()
      : user?.address || '';
  const addressDetail =
    typeof src?.addressDetail === 'string' && src.addressDetail.trim()
      ? src.addressDetail.trim()
      : '';
  const memo = typeof src?.memo === 'string' ? src.memo.trim() : '';

  const errors = [];
  if (!recipientName) errors.push('받는 분 이름은 필수입니다.');
  if (!phone) errors.push('연락처는 필수입니다.');
  if (!address) errors.push('배송 주소는 필수입니다.');

  return {
    shipping: { recipientName, phone, zipCode, address, addressDetail, memo },
    errors,
  };
}

function sendOrderError(res, err, fallbackMessage) {
  if (err.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || '관리자만 접근할 수 있습니다.',
      code: err.code || 'ADMIN_REQUIRED',
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: '주문 번호가 중복되었습니다. 다시 시도해 주세요.',
    });
  }
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

function parseOrderQuantity(value) {
  if (value === undefined || value === null || value === '') return 1;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 99) return null;
  return n;
}

/** 바로구매 — body.items: [{ productId, quantity?, size?, variety? }] */
async function buildOrderItemsFromDirect(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('주문할 상품이 없습니다.');
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  for (const row of items) {
    const productId = row?.productId;
    const quantity = parseOrderQuantity(row?.quantity);
    if (quantity == null) {
      const err = new Error('수량은 1~99 사이 정수여야 합니다.');
      err.statusCode = 400;
      throw err;
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      const err = new Error('유효하지 않은 상품 ID입니다.');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('상품을 찾을 수 없습니다.');
      err.statusCode = 404;
      throw err;
    }

    const size =
      typeof row.size === 'string' && row.size.trim() ? row.size.trim() : product.size || '';
    const variety =
      typeof row.variety === 'string' && row.variety.trim()
        ? row.variety.trim()
        : product.variety || '';

    orderItems.push(
      buildOrderItemRow(product, {
        quantity,
        unitPrice: product.price,
        size,
        variety,
      })
    );
  }

  return orderItems;
}

async function buildOrderItemsFromCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'sku name price image category size variety',
  });

  if (!cart || cart.items.length === 0) {
    const err = new Error('장바구니가 비어 있습니다.');
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product) {
      const err = new Error('주문할 수 없는 상품이 포함되어 있습니다.');
      err.statusCode = 400;
      throw err;
    }
    orderItems.push(
      buildOrderItemRow(product, {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        size: item.size || '',
        variety: item.variety || '',
      })
    );
  }

  return { orderItems, cart };
}

/** POST /api/orders/check-duplicate — 주문·결제 중복 확인 */
async function checkDuplicateOrder(req, res) {
  try {
    const { impUid, merchantUid } = pickPaymentInfo(req.body);

    if (!impUid && !merchantUid) {
      return res.status(400).json({
        success: false,
        message: 'merchantUid 또는 impUid가 필요합니다.',
      });
    }

    const existing = await findDuplicateOrder({
      merchantUid,
      impUid,
      userId: req.authUserId,
    });

    return res.status(200).json({
      success: true,
      duplicate: Boolean(existing),
      existingOrder: existing
        ? { _id: existing._id, orderNumber: existing.orderNumber }
        : null,
    });
  } catch (err) {
    return sendOrderError(res, err, '중복 확인 중 오류가 발생했습니다.');
  }
}

/** POST /api/orders — 장바구니 또는 body.items(바로구매) */
async function createOrder(req, res) {
  try {
    const user = await User.findById(req.authUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const { shipping, errors } = pickShipping(req.body, user);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const { impUid, merchantUid } = pickPaymentInfo(req.body);
    const paymentMethod = pickPaymentMethod(req.body);

    const directItems = Array.isArray(req.body.items) ? req.body.items : null;
    const isBuyNow = directItems && directItems.length > 0;

    let orderItems;
    let cart = null;

    if (isBuyNow) {
      orderItems = await buildOrderItemsFromDirect(directItems);
    } else {
      const built = await buildOrderItemsFromCart(req.authUserId);
      orderItems = built.orderItems;
      cart = built.cart;
    }

    const subtotal = orderItems.reduce((sum, row) => sum + row.lineTotal, 0);
    const shippingFee = SHIPPING_FEE;
    const discountAmount = parseDiscountAmount(req.body);
    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);
    const source = isBuyNow ? 'buy_now' : 'cart';

    // --- 중복 주문 방지 ---
    await assertNoDuplicateOrder({
      merchantUid,
      impUid,
      userId: req.authUserId,
    });

    // --- 포트원 결제 검증 (imp_uid 또는 merchant_uid) ---
    let verifiedPayment = null;
    if (impUid || merchantUid) {
      verifiedPayment = await verifyPortonePayment({
        impUid,
        merchantUid,
        expectedAmount: totalAmount,
      });
    } else if (paymentMethod !== 'mock') {
      return res.status(400).json({
        success: false,
        message: '결제 정보가 없습니다. 결제를 완료한 후 다시 시도해 주세요.',
      });
    }

    const now = verifiedPayment?.paidAt || new Date();
    const orderNumber = merchantUid || generateOrderNumber();

    const order = await Order.create({
      user: req.authUserId,
      orderNumber,
      items: orderItems,
      shipping,
      payment: {
        method: paymentMethod,
        status: 'paid',
        amount: totalAmount,
        transactionId: verifiedPayment?.impUid || impUid || '',
        merchantUid: verifiedPayment?.merchantUid || merchantUid || '',
        paidAt: now,
      },
      tracking: {},
      status: 'paid',
      statusHistory: [
        { status: 'pending', at: now, note: '주문 생성' },
        { status: 'paid', at: now, note: verifiedPayment ? '결제 검증 완료' : '결제 완료' },
      ],
      source,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
    });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(201).json({
      success: true,
      message: '주문이 완료되었습니다.',
      order: order.toJSON(),
    });
  } catch (err) {
    if (err.statusCode) {
      const body = { success: false, message: err.message };
      if (err.existingOrderId) {
        body.existingOrderId = err.existingOrderId;
        body.existingOrderNumber = err.existingOrderNumber;
      }
      return res.status(err.statusCode).json(body);
    }
    return sendOrderError(res, err, '주문 처리 중 오류가 발생했습니다.');
  }
}

/** GET /api/orders/admin/permissions — 관리자 주문 권한·상태 전이 규칙 */
async function getAdminOrderPermissions(req, res) {
  try {
    assertAdminPayload(req.authPayload);
    return res.status(200).json({
      success: true,
      ...getAdminPermissionsPayload(),
    });
  } catch (err) {
    return sendOrderError(res, err, '권한 정보를 불러오지 못했습니다.');
  }
}

/** GET /api/orders/admin/list — 전체 주문 (관리자) */
async function getAllOrders(req, res) {
  try {
    assertAdminPayload(req.authPayload);
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    return sendOrderError(res, err, '주문 목록을 불러오지 못했습니다.');
  }
}

/** PATCH /api/orders/:id/status — 주문 상태 변경 (관리자) */
async function updateOrderStatus(req, res) {
  try {
    assertAdminPayload(req.authPayload);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 ID입니다.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const stage = typeof req.body?.stage === 'string' ? req.body.stage.trim() : '';
    if (stage) {
      if (!ADMIN_ORDER_STAGES.includes(stage)) {
        return res.status(400).json({ success: false, message: '유효하지 않은 주문 단계입니다.' });
      }
      applyAdminOrderStage(order, stage, appendStatusHistory);
      await order.save();
      return res.status(200).json({
        success: true,
        message: '주문 상태가 변경되었습니다.',
        order: order.toJSON(),
      });
    }

    const nextStatus =
      typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!ORDER_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 상태입니다.' });
    }

    const current = order.status;

    if (!canAdminTransitionStatus(current, nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `현재 상태(${current})에서 ${nextStatus}(으)로 변경할 수 없습니다.`,
        code: 'STATUS_TRANSITION_DENIED',
        allowedNextStatuses: getAdminOrderActions(current).allowedNextStatuses,
      });
    }

    if (nextStatus === 'cancelled') {
      const cancelReason =
        typeof req.body?.reason === 'string' && req.body.reason.trim()
          ? req.body.reason.trim().slice(0, 500)
          : '관리자 취소';
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = cancelReason;
      if (order.payment?.status === 'paid') {
        order.payment.status = 'refunded';
      }
      appendStatusHistory(order, 'cancelled', cancelReason);
    } else {
      order.status = nextStatus;
      if (nextStatus === 'shipped') {
        order.tracking = order.tracking || {};
        order.tracking.shippedAt = order.tracking.shippedAt || new Date();
        const carrier =
          typeof req.body?.tracking?.carrier === 'string'
            ? req.body.tracking.carrier.trim()
            : order.tracking.carrier || '';
        const number =
          typeof req.body?.tracking?.number === 'string'
            ? req.body.tracking.number.trim()
            : order.tracking.number || '';
        if (carrier) order.tracking.carrier = carrier;
        if (number) order.tracking.number = number;
      }
      if (nextStatus === 'delivered') {
        order.tracking = order.tracking || {};
        order.tracking.deliveredAt = order.tracking.deliveredAt || new Date();
      }
      appendStatusHistory(order, nextStatus, req.body?.note || '');
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: '주문 상태가 변경되었습니다.',
      order: order.toJSON(),
    });
  } catch (err) {
    return sendOrderError(res, err, '주문 상태 변경에 실패했습니다.');
  }
}

/** GET /api/orders — 내 주문 목록 */
async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.authUserId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    return sendOrderError(res, err, '주문 목록을 불러오지 못했습니다.');
  }
}

/** GET /api/orders/:id */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 ID입니다.' });
    }

    const isAdmin = isAdminPayload(req.authPayload);
    const order = await findOrderForUser(id, req.authUserId, isAdmin);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      success: true,
      order: order.toJSON(),
    });
  } catch (err) {
    return sendOrderError(res, err, '주문을 불러오지 못했습니다.');
  }
}

function findOrderForUser(orderId, userId, isAdmin) {
  const filter = { _id: orderId };
  if (!isAdmin) filter.user = userId;
  return Order.findOne(filter);
}

/** PATCH /api/orders/:id — 배송 정보 수정 (pending/paid) */
async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 ID입니다.' });
    }

    const isAdmin = isAdminPayload(req.authPayload);
    const order = await findOrderForUser(id, req.authUserId, isAdmin);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (!isAdmin && !['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '현재 상태에서는 주문 정보를 수정할 수 없습니다.',
      });
    }

    const src =
      req.body?.shipping && typeof req.body.shipping === 'object'
        ? req.body.shipping
        : req.body;
    const ship = order.shipping;

    if (typeof src?.recipientName === 'string' && src.recipientName.trim()) {
      ship.recipientName = src.recipientName.trim();
    }
    if (typeof src?.phone === 'string' && src.phone.trim()) {
      ship.phone = src.phone.trim();
    }
    if (typeof src?.zipCode === 'string') {
      ship.zipCode = src.zipCode.trim();
    }
    if (typeof src?.address === 'string' && src.address.trim()) {
      ship.address = src.address.trim();
    }
    if (typeof src?.addressDetail === 'string') {
      ship.addressDetail = src.addressDetail.trim();
    }
    if (typeof src?.memo === 'string') {
      ship.memo = src.memo.trim();
    }

    if (!ship.recipientName || !ship.phone || !ship.address) {
      return res.status(400).json({
        success: false,
        message: '받는 분, 연락처, 주소는 필수입니다.',
      });
    }

    order.shipping = ship;
    appendStatusHistory(order, order.status, '배송 정보 수정');
    await order.save();

    return res.status(200).json({
      success: true,
      message: '주문 정보가 수정되었습니다.',
      order: order.toJSON(),
    });
  } catch (err) {
    return sendOrderError(res, err, '주문 수정에 실패했습니다.');
  }
}

/** PATCH /api/orders/:id/cancel */
async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 ID입니다.' });
    }

    const order = await Order.findOne({ _id: id, user: req.authUserId });
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: '이미 취소된 주문입니다.' });
    }

    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '현재 상태에서는 주문을 취소할 수 없습니다.',
      });
    }

    const cancelReason =
      typeof req.body?.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 500)
        : typeof req.body?.cancelReason === 'string' && req.body.cancelReason.trim()
          ? req.body.cancelReason.trim().slice(0, 500)
          : '';

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = cancelReason;
    appendStatusHistory(order, 'cancelled', cancelReason || '고객 취소');

    if (order.payment && order.payment.status === 'paid') {
      order.payment.status = 'refunded';
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: '주문이 취소되었습니다.',
      order: order.toJSON(),
    });
  } catch (err) {
    return sendOrderError(res, err, '주문 취소에 실패했습니다.');
  }
}

/** DELETE /api/orders/:id — 관리자 하드 삭제 */
async function deleteOrder(req, res) {
  try {
    assertAdminPayload(req.authPayload);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 ID입니다.' });
    }

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      success: true,
      message: '주문이 삭제되었습니다.',
    });
  } catch (err) {
    return sendOrderError(res, err, '주문 삭제에 실패했습니다.');
  }
}

module.exports = {
  checkDuplicateOrder,
  createOrder,
  getAdminOrderPermissions,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  ORDER_STATUSES,
};
