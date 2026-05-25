import { Router } from 'express';
import { authenticate, userOnly } from '../middleware/auth.js';
import { createReview, getReviews } from '../services/reviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const reviews = await getReviews();

    res.json({
      success: true,
      reviews,
    });
  }),
);

router.post(
  '/',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const review = await createReview(req.auth.sub, req.body);

    res.status(201).json({
      success: true,
      review,
    });
  }),
);

export default router;
