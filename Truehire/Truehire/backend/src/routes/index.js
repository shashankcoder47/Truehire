import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import companyFollowRoutes from './companyFollowRoutes.js';
import companyPostRoutes from './companyPostRoutes.js';
import fileRoutes from './fileRoutes.js';
import friendRoutes from './friendRoutes.js';
import jobAlertRoutes from './jobAlertRoutes.js';
import jobRoutes from './jobRoutes.js';
import messageRoutes from './messageRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import userPostRoutes from './userPostRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'TrueHire API is healthy',
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', companyPostRoutes);
router.use('/', userPostRoutes);
router.use('/', companyFollowRoutes);
router.use('/', fileRoutes);
router.use('/', friendRoutes);
router.use('/job-alerts', jobAlertRoutes);
router.use('/jobs', jobRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);

export default router;
