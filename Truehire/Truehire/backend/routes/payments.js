const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { verifyToken, requireRecruiter } = require('../middleware/auth');
const {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpaySignature
} = require('../utils/razorpay');

const router = express.Router();
const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
});
const SUBSCRIPTION_STATUSES = Object.freeze({
  FREE: 'FREE',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
});

const normalizeStatus = (rawStatus) => {
  const value = String(rawStatus || '').trim().toUpperCase();
  if (!value) return PAYMENT_STATUSES.PENDING;

  if (['PENDING', 'CREATED', 'AUTHORIZED', 'INITIATED', 'PROCESSING'].includes(value)) {
    return PAYMENT_STATUSES.PENDING;
  }
  if (['SUCCESS', 'SUCCEEDED', 'COMPLETED', 'CAPTURED', 'PAID'].includes(value)) {
    return PAYMENT_STATUSES.SUCCESS;
  }
  if (['FAILED', 'FAILURE', 'ERROR', 'CANCELLED', 'DECLINED'].includes(value)) {
    return PAYMENT_STATUSES.FAILED;
  }
  if (['REFUNDED', 'REFUND', 'PARTIALLY_REFUNDED'].includes(value)) {
    return PAYMENT_STATUSES.REFUNDED;
  }

  return PAYMENT_STATUSES.PENDING;
};

const normalizeSubscriptionStatus = (rawStatus) => {
  const value = String(rawStatus || '').trim().toUpperCase();
  if (!value) {
    return { normalized: SUBSCRIPTION_STATUSES.FREE, isKnownInput: true };
  }

  if (['ACTIVE', 'PAID', 'SUCCESS', 'CAPTURED', 'COMPLETED', 'SUBSCRIBED'].includes(value)) {
    return { normalized: SUBSCRIPTION_STATUSES.ACTIVE, isKnownInput: true };
  }
  if (value === 'EXPIRED') {
    return { normalized: SUBSCRIPTION_STATUSES.EXPIRED, isKnownInput: true };
  }
  if (['CANCELLED', 'CANCELED'].includes(value)) {
    return { normalized: SUBSCRIPTION_STATUSES.CANCELLED, isKnownInput: true };
  }
  if (value === 'FREE') {
    return { normalized: SUBSCRIPTION_STATUSES.FREE, isKnownInput: true };
  }

  return { normalized: SUBSCRIPTION_STATUSES.FREE, isKnownInput: false };
};

const ensureRecruiterPremiumColumns = async () => {
  const statements = [
    "ALTER TABLE recruiters ADD COLUMN is_premium TINYINT(1) DEFAULT 0",
    "ALTER TABLE recruiters ADD COLUMN premium_expiry DATE NULL",
    "ALTER TABLE recruiters ADD COLUMN premium_expiry_at DATETIME NULL"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
};

const ensurePaymentColumns = async () => {
  const statements = [
    "ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(255) NULL",
    "ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(255) NULL"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
};

const ensurePaymentsTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recruiter_id INT NOT NULL,
      plan_id INT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_method VARCHAR(50) NULL,
      transaction_id VARCHAR(255) NULL,
      status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
      description TEXT NULL,
      invoice_url VARCHAR(500) NULL,
      paid_at TIMESTAMP NULL,
      razorpay_order_id VARCHAR(255) NULL,
      razorpay_payment_id VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_payments_recruiter_id (recruiter_id),
      INDEX idx_payments_razorpay_order_id (razorpay_order_id),
      CONSTRAINT fk_payments_recruiter
        FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
    )
  `);
};

const getRecruiterIdFromRequest = (req) => (
  req.user?.role === 'sub-recruiter' && req.user?.mainRecruiterId
    ? req.user.mainRecruiterId
    : req.user.id
);

const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature || !rawBody) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

const applyRecruiterSubscriptionStatus = async ({ recruiterId, rawStatus, strictInput = false }) => {
  const [recruiterRows] = await pool.execute(
    'SELECT id FROM recruiters WHERE id = ? LIMIT 1',
    [recruiterId]
  );
  if (!recruiterRows.length) {
    const error = new Error('Recruiter not found');
    error.status = 404;
    error.code = 'RECRUITER_NOT_FOUND';
    throw error;
  }

  const mapped = normalizeSubscriptionStatus(rawStatus);
  console.log('[subscription_status] mapping', {
    recruiterId,
    rawStatus: rawStatus ?? null,
    mappedStatus: mapped.normalized
  });

  if (strictInput && !mapped.isKnownInput) {
    const error = new Error('Invalid subscription status');
    error.status = 400;
    error.code = 'INVALID_SUBSCRIPTION_STATUS';
    throw error;
  }

  const shouldBeActive = mapped.normalized === SUBSCRIPTION_STATUSES.ACTIVE;
  const expiryDate = new Date();
  const { durationDays } = getRazorpayConfig();
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  const expiryDateString = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

  await pool.execute(
    `
      UPDATE recruiters
      SET is_premium = ?,
          premium_expiry_at = ?,
          subscription_status = ?,
          subscription_expiry = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [
      shouldBeActive ? 1 : 0,
      shouldBeActive ? expiryDateString : null,
      mapped.normalized,
      shouldBeActive ? expiryDateString.slice(0, 10) : null,
      recruiterId
    ]
  );

  return {
    subscriptionStatus: mapped.normalized,
    premiumExpiryAt: shouldBeActive ? expiryDateString : null
  };
};

const activatePremiumForRecruiter = async (recruiterId) => {
  const { durationDays } = getRazorpayConfig();
  void durationDays; // duration is handled by applyRecruiterSubscriptionStatus for ACTIVE mapping.
  const result = await applyRecruiterSubscriptionStatus({
    recruiterId,
    rawStatus: 'CAPTURED'
  });
  return result.premiumExpiryAt;
};

router.post('/create-premium-order', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterPremiumColumns();
    await ensurePaymentsTable();
    await ensurePaymentColumns();
    const recruiterId = getRecruiterIdFromRequest(req);
    const { keyId, currency, amountRupees } = getRazorpayConfig();

    const amount = Math.round(amountRupees * 100);
    const receipt = `premium-${recruiterId}-${Date.now()}`;
    const order = await createRazorpayOrder({
      amount,
      currency,
      receipt,
      notes: { recruiterId: String(recruiterId) }
    });

    await pool.execute(
      `
        INSERT INTO payments (
          recruiter_id,
          amount,
          currency,
          payment_method,
          status,
          description,
          razorpay_order_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        recruiterId,
        amountRupees,
        currency,
        'razorpay',
        normalizeStatus('pending'),
        'Premium upgrade',
        order.id
      ]
    );

    res.json({
      orderId: order.id,
      keyId,
      amount,
      currency: order.currency || currency
    });
  } catch (error) {
    console.error('Create premium order error:', error);
    res.status(500).json({
      message: 'Unable to create payment order',
      details: error?.sqlMessage || error?.details?.error?.description || error?.message || 'Unknown error'
    });
  }
});

const verifyPremiumPaymentHandler = async (req, res) => {
  try {
    await ensureRecruiterPremiumColumns();
    await ensurePaymentsTable();
    await ensurePaymentColumns();
    const recruiterId = getRecruiterIdFromRequest(req);
    const payload = req.body || {};
    const razorpay_order_id = payload.razorpay_order_id || payload.order_id || payload.orderId;
    const razorpay_payment_id = payload.razorpay_payment_id || payload.payment_id || payload.paymentId;
    const razorpay_signature = payload.razorpay_signature || payload.signature || null;
    const incomingSubscriptionStatus = payload.subscription_status || payload.subscriptionStatus || 'CAPTURED';
    const subscriptionStatusMapping = normalizeSubscriptionStatus(incomingSubscriptionStatus);
    console.log('[verify-premium] subscription status mapping', {
      rawStatus: incomingSubscriptionStatus ?? null,
      mappedStatus: subscriptionStatusMapping.normalized
    });
    if ((payload.subscription_status || payload.subscriptionStatus) && !subscriptionStatusMapping.isKnownInput) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'Invalid subscription status'
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ ok: false, success: false, message: 'Missing payment details' });
    }

    if (!razorpay_signature) {
      return res.status(400).json({ ok: false, success: false, message: 'Missing payment signature' });
    }

    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
    if (!isValidSignature) {
      return res.status(400).json({ ok: false, success: false, message: 'Invalid payment signature' });
    }

    const [payments] = await pool.execute(
      'SELECT id FROM payments WHERE recruiter_id = ? AND razorpay_order_id = ? LIMIT 1',
      [recruiterId, razorpay_order_id]
    );

    let paymentId = payments[0]?.id || null;
    if (!paymentId) {
      const { amountRupees, currency } = getRazorpayConfig();
      const [insertResult] = await pool.execute(
        `
          INSERT INTO payments (
            recruiter_id,
            amount,
            currency,
            payment_method,
            status,
            description,
            razorpay_order_id,
            razorpay_payment_id,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          recruiterId,
          amountRupees,
          currency,
          'razorpay',
          normalizeStatus('pending'),
          'Premium upgrade',
          razorpay_order_id,
          razorpay_payment_id
        ]
      );
      paymentId = insertResult.insertId;
    }

    await pool.execute(
      `
        UPDATE payments
        SET razorpay_payment_id = ?,
            status = ?,
            transaction_id = ?,
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `,
      [razorpay_payment_id, normalizeStatus('completed'), razorpay_payment_id, paymentId]
    );

    const subscriptionUpdate = await applyRecruiterSubscriptionStatus({
      recruiterId,
      rawStatus: incomingSubscriptionStatus,
      strictInput: Boolean(payload.subscription_status || payload.subscriptionStatus)
    });

    res.json({
      ok: true,
      success: true,
      status: 'ACTIVE',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      premium_expiry_at: subscriptionUpdate.premiumExpiryAt
    });
  } catch (error) {
    console.error('Verify premium payment error:', error);
    if (error?.status === 400) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: error.message || 'Invalid subscription status'
      });
    }
    if (error?.status === 404) {
      return res.status(404).json({
        ok: false,
        success: false,
        message: error.message || 'Recruiter not found'
      });
    }
    res.status(500).json({
      ok: false,
      success: false,
      message: 'Failed to verify payment',
      details: error?.sqlMessage || error?.message || 'Unknown error'
    });
  }
};

router.post('/verify-premium', verifyToken, requireRecruiter, verifyPremiumPaymentHandler);
router.post('/verify', verifyToken, requireRecruiter, verifyPremiumPaymentHandler);

router.get('/status', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterPremiumColumns();
    await ensurePaymentsTable();
    await ensurePaymentColumns();
    const recruiterId = getRecruiterIdFromRequest(req);
    const orderId = req.query.order_id || req.query.orderId;

    if (!orderId) {
      return res.status(400).json({ message: 'Missing order_id' });
    }

    const [payments] = await pool.execute(
      'SELECT status FROM payments WHERE recruiter_id = ? AND razorpay_order_id = ? LIMIT 1',
      [recruiterId, orderId]
    );

    if (!payments.length) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const paymentStatus = normalizeStatus(payments[0].status);

    if (paymentStatus === PAYMENT_STATUSES.FAILED) {
      return res.json({ status: 'FAILED' });
    }

    if (paymentStatus !== PAYMENT_STATUSES.SUCCESS) {
      return res.json({ status: 'PENDING' });
    }

    const [recruiterRows] = await pool.execute(
      `
        SELECT is_premium, premium_expiry_at, premium_expiry, subscription_status, subscription_expiry
        FROM recruiters
        WHERE id = ?
      `,
      [recruiterId]
    );

    const recruiter = recruiterRows[0];
    const expiry = recruiter?.premium_expiry_at || recruiter?.subscription_expiry || recruiter?.premium_expiry || null;
    const expiryDate = expiry ? new Date(expiry) : null;
    const isExpired = expiryDate ? expiryDate.setHours(23, 59, 59, 999) < Date.now() : false;
    const mappedSubscriptionStatus = normalizeSubscriptionStatus(recruiter?.subscription_status).normalized;
    const premiumActive = (recruiter?.is_premium || mappedSubscriptionStatus === SUBSCRIPTION_STATUSES.ACTIVE) && !isExpired;

    if (premiumActive) {
      return res.json({ status: 'ACTIVE', premium_expiry_at: expiry });
    }

    return res.json({ status: 'PENDING' });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    await ensureRecruiterPremiumColumns();
    await ensurePaymentsTable();
    await ensurePaymentColumns();

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      return res.json({ received: true });
    }

    const [payments] = await pool.execute(
      'SELECT id, recruiter_id FROM payments WHERE razorpay_order_id = ? LIMIT 1',
      [orderId]
    );

    if (!payments.length) {
      console.warn(`Webhook received for unknown order ${orderId}`);
      return res.json({ received: true });
    }

    if (event === 'payment.failed') {
      await pool.execute(
        'UPDATE payments SET status = ?, razorpay_payment_id = ?, updated_at = NOW() WHERE id = ?',
        [normalizeStatus('failed'), paymentId || null, payments[0].id]
      );
      return res.json({ received: true });
    }

    if (event !== 'payment.captured') {
      return res.json({ received: true });
    }

    const { amountRupees, currency, durationDays } = getRazorpayConfig();
    const expectedAmount = Math.round(amountRupees * 100);
    const capturedAmount = Number(paymentEntity?.amount);

    if (expectedAmount !== capturedAmount || (paymentEntity?.currency && paymentEntity.currency !== currency)) {
      await pool.execute(
        'UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?',
        [normalizeStatus('failed'), payments[0].id]
      );
      return res.json({ received: true });
    }

    await pool.execute(
      `
        UPDATE payments
        SET status = ?,
            transaction_id = ?,
            razorpay_payment_id = ?,
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `,
      [normalizeStatus('captured'), paymentId, paymentId, payments[0].id]
    );

    void durationDays; // duration is applied inside helper for ACTIVE mapping.
    const rawIncomingStatus = paymentEntity?.status || event || 'CAPTURED';
    console.log('[webhook] subscription status mapping', {
      rawStatus: rawIncomingStatus ?? null,
      mappedStatus: normalizeSubscriptionStatus(rawIncomingStatus).normalized
    });
    await applyRecruiterSubscriptionStatus({
      recruiterId: payments[0].recruiter_id,
      rawStatus: rawIncomingStatus
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;
