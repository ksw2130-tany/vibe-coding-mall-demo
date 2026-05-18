/**
 * 포트원(아임포트) REST API — 결제 단건 조회·검증
 * @see https://developers.portone.io/docs/ko/sdk/javascript
 */

const PORTONE_TOKEN_URL = 'https://api.iamport.kr/users/getToken';
const PORTONE_PAYMENT_URL = 'https://api.iamport.kr/payments';

const RETRY_DELAYS_MS = [0, 400, 800, 1200];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiCredentials() {
  const impKey = process.env.PORTONE_API_KEY || process.env.IMP_KEY || '';
  const impSecret = process.env.PORTONE_API_SECRET || process.env.IMP_SECRET || '';
  return {
    impKey: String(impKey).trim(),
    impSecret: String(impSecret).trim(),
  };
}

function hasApiCredentials() {
  const { impKey, impSecret } = getApiCredentials();
  return Boolean(impKey && impSecret);
}

function isPaymentNotFoundError(err) {
  const msg = err?.message || '';
  return msg.includes('존재하지 않는 결제') || msg.includes('존재하지 않는 결제정보');
}

function portoneApiError(data, fallbackMessage) {
  const err = new Error(data.message || fallbackMessage);
  err.statusCode = data.code === -1 && isPaymentNotFoundError(err) ? 400 : 502;
  if (isPaymentNotFoundError(err)) err.statusCode = 400;
  return err;
}

/** @returns {Promise<string>} */
async function getAccessToken() {
  const { impKey, impSecret } = getApiCredentials();
  if (!impKey || !impSecret) {
    const err = new Error(
      '포트원 API 키가 설정되지 않았습니다. server/.env 에 PORTONE_API_KEY, PORTONE_API_SECRET 을 추가하세요.'
    );
    err.statusCode = 503;
    throw err;
  }

  const res = await fetch(PORTONE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
  });

  const data = await res.json().catch(() => ({}));
  if (data.code !== 0 || !data.response?.access_token) {
    const err = new Error(data.message || '포트원 인증 토큰 발급에 실패했습니다.');
    err.statusCode = 502;
    throw err;
  }

  return data.response.access_token;
}

/**
 * imp_uid 로 결제 내역 조회
 * @param {string} impUid
 */
async function fetchPaymentByImpUid(impUid) {
  const token = await getAccessToken();
  const res = await fetch(`${PORTONE_PAYMENT_URL}/${encodeURIComponent(impUid)}`, {
    headers: { Authorization: token },
  });

  const data = await res.json().catch(() => ({}));
  if (data.code !== 0 || !data.response) {
    throw portoneApiError(data, '결제 정보를 조회하지 못했습니다.');
  }

  return data.response;
}

/**
 * merchant_uid 로 결제 내역 조회 (paid 등)
 * 일부 계정·샌드박스에서는 imp_uid 단건 조회가 실패하고 이 API만 동작함
 * @param {string} merchantUid
 * @param {string} [status='paid']
 */
async function fetchPaymentByMerchantUid(merchantUid, status = 'paid') {
  const token = await getAccessToken();
  const muid = encodeURIComponent(merchantUid.trim());
  const res = await fetch(`${PORTONE_PAYMENT_URL}/find/${muid}/${status}`, {
    headers: { Authorization: token },
  });

  const data = await res.json().catch(() => ({}));
  if (data.code !== 0 || !data.response) {
    throw portoneApiError(
      data,
      `주문번호(${merchantUid})에 대한 결제 정보를 찾을 수 없습니다.`
    );
  }

  return data.response;
}

/**
 * imp_uid / merchant_uid 로 결제 조회 (merchant_uid 우선)
 * @param {{ impUid?: string, merchantUid?: string }} params
 */
async function resolvePayment({ impUid, merchantUid }) {
  const uid = typeof impUid === 'string' ? impUid.trim() : '';
  const muid = typeof merchantUid === 'string' ? merchantUid.trim() : '';

  if (!uid && !muid) {
    const err = new Error('결제 식별 정보(imp_uid 또는 merchant_uid)가 필요합니다.');
    err.statusCode = 400;
    throw err;
  }

  let lastError = null;

  if (muid) {
    for (const delay of RETRY_DELAYS_MS) {
      if (delay > 0) await sleep(delay);
      try {
        const payment = await fetchPaymentByMerchantUid(muid, 'paid');
        if (uid && payment.imp_uid && payment.imp_uid !== uid) {
          const err = new Error('결제 고유번호가 일치하지 않습니다.');
          err.statusCode = 400;
          throw err;
        }
        return payment;
      } catch (err) {
        lastError = err;
        if (!isPaymentNotFoundError(err)) throw err;
      }
    }
  }

  if (uid) {
    for (const delay of RETRY_DELAYS_MS) {
      if (delay > 0) await sleep(delay);
      try {
        const payment = await fetchPaymentByImpUid(uid);
        if (muid && payment.merchant_uid && payment.merchant_uid !== muid) {
          const err = new Error('주문번호가 결제 정보와 일치하지 않습니다.');
          err.statusCode = 400;
          throw err;
        }
        return payment;
      } catch (err) {
        lastError = err;
        if (!isPaymentNotFoundError(err)) throw err;
      }
    }
  }

  const err =
    lastError ||
    new Error(
      '결제 정보를 확인할 수 없습니다. 잠시 후 다시 시도하거나, 포트원 콘솔의 REST API 키와 가맹점 식별코드가 동일 계정인지 확인해 주세요.'
    );
  if (!err.statusCode) err.statusCode = 400;
  throw err;
}

/**
 * 결제 검증 — 상태·merchant_uid·금액 일치 확인
 * @param {{ impUid?: string, merchantUid?: string, expectedAmount: number }} params
 */
async function verifyPortonePayment({ impUid, merchantUid, expectedAmount }) {
  if (!hasApiCredentials()) {
    const err = new Error('결제 검증을 위해 포트원 API 키 설정이 필요합니다.');
    err.statusCode = 503;
    throw err;
  }

  const uid = typeof impUid === 'string' ? impUid.trim() : '';
  const muid = typeof merchantUid === 'string' ? merchantUid.trim() : '';

  if (!uid && !muid) {
    const err = new Error('결제 식별 정보(imp_uid 또는 merchant_uid)가 필요합니다.');
    err.statusCode = 400;
    throw err;
  }

  const payment = await resolvePayment({ impUid: uid, merchantUid: muid });

  if (payment.status !== 'paid') {
    const err = new Error(`결제가 완료되지 않았습니다. (상태: ${payment.status})`);
    err.statusCode = 400;
    throw err;
  }

  const paidAmount = Number(payment.amount);
  const expected = Math.round(Number(expectedAmount));
  if (!Number.isFinite(expected) || expected < 0) {
    const err = new Error('유효하지 않은 주문 금액입니다.');
    err.statusCode = 400;
    throw err;
  }

  if (paidAmount !== expected) {
    const err = new Error(
      `결제 금액이 일치하지 않습니다. (결제: ${paidAmount}원, 주문: ${expected}원)`
    );
    err.statusCode = 400;
    throw err;
  }

  const resolvedImpUid = payment.imp_uid || uid;
  const resolvedMerchantUid = payment.merchant_uid || muid;

  return {
    impUid: resolvedImpUid,
    merchantUid: resolvedMerchantUid,
    amount: paidAmount,
    paidAt: payment.paid_at ? new Date(payment.paid_at * 1000) : new Date(),
    pgProvider: payment.pg_provider || '',
  };
}

module.exports = {
  hasApiCredentials,
  verifyPortonePayment,
  fetchPaymentByImpUid,
  fetchPaymentByMerchantUid,
  resolvePayment,
};
