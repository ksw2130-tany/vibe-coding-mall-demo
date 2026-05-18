const { mongoose } = require('../db');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

function parseQuantity(value, fallback = 1) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return null;
  if (n > 99) return null;
  return n;
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function loadPopulatedCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'sku name price image category size variety',
  });
  if (!cart) {
    return {
      _id: null,
      user: userId,
      items: [],
      itemCount: 0,
      subtotal: 0,
    };
  }
  return cart.toJSON();
}

function findCartItem(cart, itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) return null;
  return cart.items.id(itemId) || null;
}

function formatCartItemResponse(cart, item) {
  const json = cart.toJSON();
  return json.items.find((row) => String(row._id) === String(item._id)) || null;
}

async function getCartByUser(userId) {
  return loadPopulatedCart(userId);
}

async function getCartItemByUser(userId, itemId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'sku name price image category size variety',
  });
  if (!cart) {
    const err = new Error('장바구니 항목을 찾을 수 없습니다.');
    err.statusCode = 404;
    throw err;
  }
  const item = findCartItem(cart, itemId);
  if (!item) {
    const err = new Error('장바구니 항목을 찾을 수 없습니다.');
    err.statusCode = 404;
    throw err;
  }
  return formatCartItemResponse(cart, item);
}

async function addItemToCart(userId, { productId, quantity = 1, size, variety }) {
  const qty = parseQuantity(quantity, 1);
  if (qty == null) {
    const err = new Error('수량은 1~99 사이 정수여야 합니다.');
    err.statusCode = 400;
    throw err;
  }
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    const err = new Error('유효한 상품 ID가 필요합니다.');
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error('상품을 찾을 수 없습니다.');
    err.statusCode = 404;
    throw err;
  }

  const cart = await getOrCreateCart(userId);
  const pid = String(product._id);
  const existing = cart.items.find((item) => String(item.product) === pid);

  const itemSize =
    typeof size === 'string' && size.trim() ? size.trim() : product.size || '';
  const itemVariety =
    typeof variety === 'string' && variety.trim() ? variety.trim() : product.variety || '';

  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + qty);
    existing.unitPrice = product.price;
    existing.size = itemSize;
    existing.variety = itemVariety;
  } else {
    cart.items.push({
      product: product._id,
      quantity: qty,
      unitPrice: product.price,
      size: itemSize,
      variety: itemVariety,
    });
  }

  await cart.save();
  return loadPopulatedCart(userId);
}

async function updateCartItemByUser(userId, itemId, body = {}) {
  const cart = await getOrCreateCart(userId);
  const item = findCartItem(cart, itemId);
  if (!item) {
    const err = new Error('장바구니 항목을 찾을 수 없습니다.');
    err.statusCode = 404;
    throw err;
  }

  if (body.quantity !== undefined) {
    const quantity = parseQuantity(body.quantity);
    if (quantity == null) {
      const err = new Error('수량은 1~99 사이 정수여야 합니다.');
      err.statusCode = 400;
      throw err;
    }
    item.quantity = quantity;
  }
  if (body.size !== undefined) {
    item.size = typeof body.size === 'string' ? body.size.trim() : '';
  }
  if (body.variety !== undefined) {
    item.variety = typeof body.variety === 'string' ? body.variety.trim() : '';
  }

  await cart.save();
  return loadPopulatedCart(userId);
}

async function replaceCartItemByUser(userId, itemId, body = {}) {
  const quantity = parseQuantity(body.quantity);
  if (quantity == null) {
    const err = new Error('수량은 1~99 사이 정수여야 합니다.');
    err.statusCode = 400;
    throw err;
  }

  const cart = await getOrCreateCart(userId);
  const item = findCartItem(cart, itemId);
  if (!item) {
    const err = new Error('장바구니 항목을 찾을 수 없습니다.');
    err.statusCode = 404;
    throw err;
  }

  item.quantity = quantity;
  item.size = typeof body.size === 'string' ? body.size.trim() : item.size || '';
  item.variety = typeof body.variety === 'string' ? body.variety.trim() : item.variety || '';

  await cart.save();
  return loadPopulatedCart(userId);
}

async function removeCartItemByUser(userId, itemId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    const err = new Error('유효하지 않은 항목 ID입니다.');
    err.statusCode = 400;
    throw err;
  }

  const cart = await getOrCreateCart(userId);
  const item = findCartItem(cart, itemId);
  if (!item) {
    const err = new Error('장바구니 항목을 찾을 수 없습니다.');
    err.statusCode = 404;
    throw err;
  }

  cart.items.pull(itemId);
  await cart.save();
  return loadPopulatedCart(userId);
}

async function clearCartByUser(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return loadPopulatedCart(userId);
}

module.exports = {
  getCartByUser,
  getCartItemByUser,
  addItemToCart,
  updateCartItemByUser,
  replaceCartItemByUser,
  removeCartItemByUser,
  clearCartByUser,
};
