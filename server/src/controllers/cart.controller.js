const cartService = require('../services/cart.service');

function sendCartError(res, err, fallbackMessage) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
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

/** GET /api/cart */
async function getCart(req, res) {
  try {
    const cart = await cartService.getCartByUser(req.authUserId);
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    return sendCartError(res, err, '장바구니를 불러오지 못했습니다.');
  }
}

/** GET /api/cart/items/:itemId */
async function getCartItem(req, res) {
  try {
    const item = await cartService.getCartItemByUser(req.authUserId, req.params.itemId);
    return res.status(200).json({ success: true, item });
  } catch (err) {
    return sendCartError(res, err, '장바구니 항목을 불러오지 못했습니다.');
  }
}

/** POST /api/cart/items */
async function addCartItem(req, res) {
  try {
    const { productId, size, variety } = req.body || {};
    const cart = await cartService.addItemToCart(req.authUserId, {
      productId,
      quantity: req.body?.quantity,
      size,
      variety,
    });
    return res.status(200).json({
      success: true,
      message: '장바구니에 담았습니다.',
      cart,
    });
  } catch (err) {
    return sendCartError(res, err, '장바구니에 담지 못했습니다.');
  }
}

/** PATCH /api/cart/items/:itemId */
async function updateCartItem(req, res) {
  try {
    const cart = await cartService.updateCartItemByUser(
      req.authUserId,
      req.params.itemId,
      req.body || {}
    );
    return res.status(200).json({
      success: true,
      message: '장바구니 항목이 수정되었습니다.',
      cart,
    });
  } catch (err) {
    return sendCartError(res, err, '수량 변경에 실패했습니다.');
  }
}

/** PUT /api/cart/items/:itemId */
async function replaceCartItem(req, res) {
  try {
    const cart = await cartService.replaceCartItemByUser(
      req.authUserId,
      req.params.itemId,
      req.body || {}
    );
    return res.status(200).json({
      success: true,
      message: '장바구니 항목이 수정되었습니다.',
      cart,
    });
  } catch (err) {
    return sendCartError(res, err, '장바구니 항목 수정에 실패했습니다.');
  }
}

/** DELETE /api/cart/items/:itemId */
async function removeCartItem(req, res) {
  try {
    const cart = await cartService.removeCartItemByUser(req.authUserId, req.params.itemId);
    return res.status(200).json({
      success: true,
      message: '장바구니에서 삭제했습니다.',
      cart,
    });
  } catch (err) {
    return sendCartError(res, err, '삭제에 실패했습니다.');
  }
}

/** DELETE /api/cart */
async function clearCart(req, res) {
  try {
    const cart = await cartService.clearCartByUser(req.authUserId);
    return res.status(200).json({
      success: true,
      message: '장바구니를 비웠습니다.',
      cart,
    });
  } catch (err) {
    return sendCartError(res, err, '장바구니 비우기에 실패했습니다.');
  }
}

module.exports = {
  getCart,
  getCartItem,
  addCartItem,
  updateCartItem,
  replaceCartItem,
  removeCartItem,
  clearCart,
};
