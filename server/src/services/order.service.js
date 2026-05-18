const Order = require('../models/order.model');

/**
 * merchant_uid / imp_uid 기준 중복 주문 조회
 * @param {{ merchantUid?: string, impUid?: string, userId?: string }} params
 * @returns {Promise<import('mongoose').Document|null>}
 */
async function findDuplicateOrder({ merchantUid, impUid, userId }) {
  const or = [];

  const muid = typeof merchantUid === 'string' ? merchantUid.trim() : '';
  const iuid = typeof impUid === 'string' ? impUid.trim() : '';

  if (muid) or.push({ 'payment.merchantUid': muid });
  if (iuid) or.push({ 'payment.transactionId': iuid });

  if (or.length === 0) return null;

  const filter = { $or: or };
  if (userId) filter.user = userId;

  return Order.findOne(filter);
}

/**
 * 주문 생성 전 중복 여부 확인
 * @param {{ merchantUid?: string, impUid?: string, userId: string }} params
 */
async function assertNoDuplicateOrder({ merchantUid, impUid, userId }) {
  const existing = await findDuplicateOrder({ merchantUid, impUid, userId });
  if (!existing) return;

  const err = new Error('이미 처리된 주문입니다. 중복 결제가 감지되었습니다.');
  err.statusCode = 409;
  err.existingOrderId = String(existing._id);
  err.existingOrderNumber = existing.orderNumber;
  throw err;
}

module.exports = {
  findDuplicateOrder,
  assertNoDuplicateOrder,
};
