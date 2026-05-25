const https = require('https');
const crypto = require('crypto');

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const currency = process.env.RAZORPAY_PREMIUM_CURRENCY || 'INR';
  const amountRupees = Number(process.env.RAZORPAY_PREMIUM_AMOUNT || 999);
  const durationDays = Number(process.env.RAZORPAY_PREMIUM_DURATION_DAYS || 30);

  return {
    keyId,
    keySecret,
    currency,
    amountRupees: Number.isFinite(amountRupees) ? amountRupees : 999,
    durationDays: Number.isFinite(durationDays) ? durationDays : 30
  };
};

const validateRazorpayConfig = () => {
  const { keyId, keySecret } = getRazorpayConfig();
  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials missing. Set RAZORPAY_KEY_ID=rzp_test_S0UbXnsKz7vddk and RAZORPAY_KEY_SECRET=2bB6yfJh1l1dWSpIrdO42ggp.'
    );
  }
};

const createRazorpayOrder = ({ amount, currency, receipt, notes = {} }) => {
  const { keyId, keySecret } = getRazorpayConfig();

  const payload = JSON.stringify({
    amount,
    currency,
    receipt,
    payment_capture: 1,
    notes
  });

  const options = {
    hostname: 'api.razorpay.com',
    path: '/v1/orders',
    method: 'POST',
    auth: `${keyId}:${keySecret}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (response.statusCode >= 400) {
            const error = new Error(parsed.error?.description || 'Razorpay order failed');
            error.details = parsed;
            return reject(error);
          }
          return resolve(parsed);
        } catch (parseError) {
          return reject(parseError);
        }
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const { keySecret } = getRazorpayConfig();
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  getRazorpayConfig,
  validateRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpaySignature
};
