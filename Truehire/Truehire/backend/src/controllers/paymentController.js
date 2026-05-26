import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pool, prisma } from '../config/database.js';
import {
  createRazorpayOrder,
  getRazorpayConfig,
  validateRazorpayConfig,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from '../utils/razorpay.js';

const DEFAULT_PLAN_ID = 'premium';
const COMPANY_MESSAGE_PLAN_ID = 'company-message-premium';

const normalizeAmountToPaise = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, 'Amount must be a positive number');
  }

  return Math.round(numericAmount * 100);
};

const normalizePositiveId = (value, label) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return parsed;
};

const ensureCompanyMessagePaymentTables = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_company_message_access (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      recruiter_id BIGINT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      expires_at DATETIME NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_company_message_access (user_id, recruiter_id),
      INDEX idx_ucma_user_status (user_id, status),
      INDEX idx_ucma_recruiter_status (recruiter_id, status)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_company_message_payments (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      recruiter_id BIGINT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      payment_method VARCHAR(50) NULL,
      transaction_id VARCHAR(255) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      razorpay_order_id VARCHAR(255) NULL,
      razorpay_payment_id VARCHAR(255) NULL,
      paid_at DATETIME NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ucmp_user_recruiter (user_id, recruiter_id),
      INDEX idx_ucmp_razorpay_order (razorpay_order_id)
    )
  `);
};

const getCompanyMessageAccess = async (userId, recruiterId) => {
  await ensureCompanyMessagePaymentTables();
  const [rows] = await pool.execute(
    `SELECT id, status, expires_at
     FROM user_company_message_access
     WHERE user_id = ? AND recruiter_id = ?
     LIMIT 1`,
    [userId, recruiterId],
  );
  const access = rows[0] || null;
  const expiresAt = access?.expires_at ? new Date(access.expires_at) : null;
  const isActive = Boolean(access)
    && String(access.status || '').toUpperCase() === 'ACTIVE'
    && (!expiresAt || expiresAt > new Date());

  return {
    isActive,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  };
};

const assertCompanyMessageTarget = async (userId, recruiterId) => {
  const [[recruiterRows], [followRows]] = await Promise.all([
    pool.execute('SELECT id, company, company_name, name FROM recruiters WHERE id = ? LIMIT 1', [recruiterId]),
    pool.execute('SELECT id FROM company_followers WHERE user_id = ? AND company_id = ? LIMIT 1', [userId, recruiterId]),
  ]);

  if (!recruiterRows.length) {
    throw new ApiError(404, 'Company not found');
  }

  if (!followRows.length) {
    throw new ApiError(403, 'Follow this company before messaging the recruiter');
  }

  return recruiterRows[0];
};

const activateCompanyMessageAccess = async ({ userId, recruiterId, paymentId, orderId, amountInPaise, currency }) => {
  await ensureCompanyMessagePaymentTables();
  const { premiumDurationDays } = getRazorpayConfig();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + premiumDurationDays * 24 * 60 * 60 * 1000);

  await pool.execute(
    `UPDATE user_company_message_payments
     SET amount = ?, currency = ?, payment_method = 'razorpay', transaction_id = ?,
         razorpay_payment_id = ?, status = 'COMPLETED', paid_at = NOW(), updated_at = NOW()
     WHERE user_id = ? AND recruiter_id = ? AND razorpay_order_id = ?`,
    [amountInPaise / 100, currency, paymentId, paymentId, userId, recruiterId, orderId],
  );

  await pool.execute(
    `INSERT INTO user_company_message_access (user_id, recruiter_id, status, expires_at)
     VALUES (?, ?, 'ACTIVE', ?)
     ON CONFLICT (user_id, recruiter_id)
     DO UPDATE SET status = 'ACTIVE', expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
    [userId, recruiterId, expiresAt],
  );

  return expiresAt;
};

const markCompanyMessagePaymentFailed = async ({ orderId, paymentId = null }) => {
  await ensureCompanyMessagePaymentTables();
  await pool.execute(
    `UPDATE user_company_message_payments
     SET razorpay_payment_id = ?, transaction_id = ?, status = 'FAILED', updated_at = NOW()
     WHERE razorpay_order_id = ?`,
    [paymentId, paymentId, orderId],
  );
};

const activateRecruiterPremium = async ({ recruiterId, paymentId, orderId, amountInPaise, currency }) => {
  const { premiumDurationDays } = getRazorpayConfig();
  const now = new Date();
  const premiumExpiryAt = new Date(now.getTime() + premiumDurationDays * 24 * 60 * 60 * 1000);
  const premiumExpiry = new Date(premiumExpiryAt);
  premiumExpiry.setHours(0, 0, 0, 0);

  const existingPayment = await prisma.payments.findFirst({
    where: {
      recruiter_id: BigInt(recruiterId),
      razorpay_order_id: orderId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    if (existingPayment?.id) {
      await tx.payments.update({
        where: { id: existingPayment.id },
        data: {
          amount: amountInPaise / 100,
          currency,
          payment_method: 'razorpay',
          transaction_id: paymentId,
          razorpay_payment_id: paymentId,
          status: 'COMPLETED',
          paid_at: now,
          updated_at: now,
        },
      });
    } else {
      await tx.payments.create({
        data: {
          recruiter_id: BigInt(recruiterId),
          amount: amountInPaise / 100,
          currency,
          payment_method: 'razorpay',
          transaction_id: paymentId,
          status: 'COMPLETED',
          description: 'Premium upgrade',
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          paid_at: now,
        },
      });
    }

    await tx.recruiters.update({
      where: { id: BigInt(recruiterId) },
      data: {
        is_premium: true,
        premium_expiry: premiumExpiry,
        premium_expiry_at: premiumExpiryAt,
        subscription_status: 'ACTIVE',
        subscription_expiry: premiumExpiryAt,
      },
    });
  });

  return premiumExpiryAt;
};

const markPaymentFailed = async ({ orderId, paymentId = null }) => {
  const existingPayment = await prisma.payments.findFirst({
    where: { razorpay_order_id: orderId },
    select: { id: true },
  });

  if (!existingPayment?.id) {
    return;
  }

  await prisma.payments.update({
    where: { id: existingPayment.id },
    data: {
      razorpay_payment_id: paymentId,
      transaction_id: paymentId,
      status: 'FAILED',
      updated_at: new Date(),
    },
  });
};

export const createOrder = asyncHandler(async (req, res) => {
  validateRazorpayConfig();

  const { keyId, currency, premiumAmount } = getRazorpayConfig();

  if (!keyId) {
    throw new ApiError(500, 'Razorpay authentication key is missing on the backend');
  }

  const amountInPaise = normalizeAmountToPaise(req.body?.amount ?? premiumAmount);
  const receipt = `receipt_${Date.now()}`;
  const planId = String(req.body?.planId || DEFAULT_PLAN_ID);

  const order = await createRazorpayOrder({
    amount: amountInPaise,
    currency,
    receipt,
    notes: {
      recruiterId: String(req.auth.sub),
      planId,
    },
  });

  await prisma.payments.create({
    data: {
      recruiter_id: BigInt(req.auth.sub),
      amount: amountInPaise / 100,
      currency,
      payment_method: 'razorpay',
      status: 'PENDING',
      description: `Premium upgrade (${planId})`,
      razorpay_order_id: order.id,
    },
  });

  res.status(201).json({
    orderId: order.id,
    amount: order.amount,
    key: keyId,
    keyId: keyId,
    currency: order.currency ?? currency,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  validateRazorpayConfig();

  const razorpayOrderId = req.body?.razorpay_order_id;
  const razorpayPaymentId = req.body?.razorpay_payment_id;
  const razorpaySignature = req.body?.razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing Razorpay payment verification fields');
  }

  const isValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    await markPaymentFailed({ orderId: razorpayOrderId, paymentId: razorpayPaymentId });

    return res.status(400).json({ success: false });
  }

  const paymentRecord = await prisma.payments.findFirst({
    where: {
      recruiter_id: BigInt(req.auth.sub),
      razorpay_order_id: razorpayOrderId,
    },
    select: {
      amount: true,
      currency: true,
    },
  });

  const amountInPaise = paymentRecord ? Math.round(Number(paymentRecord.amount) * 100) : normalizeAmountToPaise(req.body?.amount);
  const premiumExpiryAt = await activateRecruiterPremium({
    recruiterId: req.auth.sub,
    paymentId: razorpayPaymentId,
    orderId: razorpayOrderId,
    amountInPaise,
    currency: paymentRecord?.currency ?? getRazorpayConfig().currency,
  });

  res.json({
    success: true,
    premiumExpiryAt: premiumExpiryAt.toISOString(),
  });
});

export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const recruiter = await prisma.recruiters.findUnique({
    where: { id: BigInt(req.auth.sub) },
    select: {
      id: true,
      is_premium: true,
      premium_expiry: true,
      premium_expiry_at: true,
      subscription_status: true,
      subscription_expiry: true,
    },
  });

  if (!recruiter) {
    throw new ApiError(404, 'Recruiter profile not found');
  }

  const now = new Date();
  const expiry = recruiter.premium_expiry_at || recruiter.subscription_expiry || recruiter.premium_expiry;
  const isActive = Boolean(recruiter.is_premium) && (!expiry || new Date(expiry) > now);

  res.json({
    success: true,
    subscription: {
      recruiterId: String(recruiter.id),
      status: isActive ? 'ACTIVE' : recruiter.subscription_status || 'INACTIVE',
      isPremium: isActive,
      premiumExpiry: expiry ? new Date(expiry).toISOString() : null,
    },
  });
});

export const getCompanyMessageAccessStatus = asyncHandler(async (req, res) => {
  const userId = normalizePositiveId(req.auth.sub, 'user id');
  const recruiterId = normalizePositiveId(req.params.companyId, 'company id');
  await assertCompanyMessageTarget(userId, recruiterId);
  const access = await getCompanyMessageAccess(userId, recruiterId);

  res.json({
    success: true,
    access,
  });
});

export const createCompanyMessageOrder = asyncHandler(async (req, res) => {
  validateRazorpayConfig();
  await ensureCompanyMessagePaymentTables();

  const userId = normalizePositiveId(req.auth.sub, 'user id');
  const recruiterId = normalizePositiveId(req.body?.companyId ?? req.body?.recruiterId, 'company id');
  const company = await assertCompanyMessageTarget(userId, recruiterId);
  const existingAccess = await getCompanyMessageAccess(userId, recruiterId);

  if (existingAccess.isActive) {
    return res.status(200).json({
      success: true,
      alreadyActive: true,
      access: existingAccess,
    });
  }

  const { keyId, currency, premiumAmount } = getRazorpayConfig();
  if (!keyId) {
    throw new ApiError(500, 'Razorpay authentication key is missing on the backend');
  }

  const amountInPaise = normalizeAmountToPaise(req.body?.amount ?? premiumAmount);
  const order = await createRazorpayOrder({
    amount: amountInPaise,
    currency,
    receipt: `company_msg_${Date.now()}`,
    notes: {
      userId: String(userId),
      recruiterId: String(recruiterId),
      planId: COMPANY_MESSAGE_PLAN_ID,
    },
  });

  await pool.execute(
    `INSERT INTO user_company_message_payments
       (user_id, recruiter_id, amount, currency, payment_method, status, razorpay_order_id)
     VALUES (?, ?, ?, ?, 'razorpay', 'PENDING', ?)`,
    [userId, recruiterId, amountInPaise / 100, currency, order.id],
  );

  res.status(201).json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    key: keyId,
    keyId,
    currency: order.currency ?? currency,
    company: {
      id: String(company.id),
      name: company.company_name || company.company || company.name || 'Company',
    },
  });
});

export const verifyCompanyMessagePayment = asyncHandler(async (req, res) => {
  validateRazorpayConfig();
  await ensureCompanyMessagePaymentTables();

  const userId = normalizePositiveId(req.auth.sub, 'user id');
  const recruiterId = normalizePositiveId(req.body?.companyId ?? req.body?.recruiterId, 'company id');
  const razorpayOrderId = req.body?.razorpay_order_id;
  const razorpayPaymentId = req.body?.razorpay_payment_id;
  const razorpaySignature = req.body?.razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing Razorpay payment verification fields');
  }

  await assertCompanyMessageTarget(userId, recruiterId);

  const [paymentRows] = await pool.execute(
    `SELECT amount, currency
     FROM user_company_message_payments
     WHERE user_id = ? AND recruiter_id = ? AND razorpay_order_id = ?
     LIMIT 1`,
    [userId, recruiterId, razorpayOrderId],
  );

  if (!paymentRows.length) {
    throw new ApiError(404, 'Payment order not found');
  }

  const isValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    await markCompanyMessagePaymentFailed({ orderId: razorpayOrderId, paymentId: razorpayPaymentId });
    return res.status(400).json({ success: false });
  }

  const payment = paymentRows[0];
  const expiresAt = await activateCompanyMessageAccess({
    userId,
    recruiterId,
    paymentId: razorpayPaymentId,
    orderId: razorpayOrderId,
    amountInPaise: Math.round(Number(payment.amount) * 100),
    currency: payment.currency ?? getRazorpayConfig().currency,
  });

  res.json({
    success: true,
    access: {
      isActive: true,
      expiresAt: expiresAt.toISOString(),
    },
  });
});

export const handleWebhook = asyncHandler(async (req, res) => {
  validateRazorpayConfig();

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  if (!verifyWebhookSignature({ rawBody, signature })) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const payload = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '{}'));
  const event = payload?.event;
  const paymentEntity = payload?.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id;
  const paymentId = paymentEntity?.id ?? null;

  if (!orderId) {
    return res.json({ received: true });
  }

  const existingPayment = await prisma.payments.findFirst({
    where: { razorpay_order_id: orderId },
    select: {
      recruiter_id: true,
      amount: true,
      currency: true,
    },
  });

  if (!existingPayment) {
    return res.json({ received: true });
  }

  if (event === 'payment.failed') {
    await markPaymentFailed({ orderId, paymentId });
    return res.json({ received: true });
  }

  if (event === 'payment.captured') {
    await activateRecruiterPremium({
      recruiterId: existingPayment.recruiter_id.toString(),
      paymentId,
      orderId,
      amountInPaise: Math.round(Number(existingPayment.amount) * 100),
      currency: paymentEntity?.currency ?? existingPayment.currency ?? getRazorpayConfig().currency,
    });
  }

  res.json({ received: true });
});
