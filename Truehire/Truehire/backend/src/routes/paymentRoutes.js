import { Router } from 'express';
import {
  createCompanyMessageOrder,
  createOrder,
  getCompanyMessageAccessStatus,
  getSubscriptionStatus,
  handleWebhook,
  verifyCompanyMessagePayment,
  verifyPayment,
} from '../controllers/paymentController.js';
import { authenticate, recruiterOnly, userOnly } from '../middleware/auth.js';

const router = Router();

router.post('/create-order', authenticate, recruiterOnly, createOrder);
router.post('/create-premium-order', authenticate, recruiterOnly, createOrder);
router.post('/verify-payment', authenticate, recruiterOnly, verifyPayment);
router.post('/verify-premium', authenticate, recruiterOnly, verifyPayment);
router.get('/status', authenticate, recruiterOnly, getSubscriptionStatus);
router.get('/company-message/status/:companyId', authenticate, userOnly, getCompanyMessageAccessStatus);
router.post('/company-message/create-order', authenticate, userOnly, createCompanyMessageOrder);
router.post('/company-message/verify', authenticate, userOnly, verifyCompanyMessagePayment);
router.post('/webhook', handleWebhook);

export default router;
