import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

const DEFAULT_PREMIUM_DURATION_DAYS = 30;

let razorpayInstance;

export const getRazorpayConfig = () => ({
  keyId: env.razorpayKeyId,
  keySecret: env.razorpayKeySecret,
  webhookSecret: env.razorpayWebhookSecret,
  currency: env.razorpayCurrency || 'INR',
  premiumAmount: Number.isFinite(env.razorpayPremiumAmount) ? env.razorpayPremiumAmount : 999,
  premiumDurationDays: Number.isFinite(env.razorpayPremiumDurationDays)
    ? env.razorpayPremiumDurationDays
    : DEFAULT_PREMIUM_DURATION_DAYS,
});

export const validateRazorpayConfig = () => {
  const { keyId, keySecret } = getRazorpayConfig();

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay credentials are not configured');
    error.code = 'RAZORPAY_CONFIG_MISSING';
    throw error;
  }
};

export const getRazorpayInstance = () => {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const { keyId, keySecret } = getRazorpayConfig();
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
};

export const createRazorpayOrder = async ({ amount, currency, receipt, notes = {} }) => {
  validateRazorpayConfig();

  return getRazorpayInstance().orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const { keySecret } = getRazorpayConfig();
  const digest = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return digest === signature;
};

export const verifyWebhookSignature = ({ rawBody, signature }) => {
  const { webhookSecret } = getRazorpayConfig();

  if (!webhookSecret || !signature || !rawBody) {
    return false;
  }

  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody));
  const digest = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

  return digest === signature;
};
