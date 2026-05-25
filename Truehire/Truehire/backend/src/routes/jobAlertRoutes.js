import { Router } from 'express';
import { adminOnly, authenticate } from '../middleware/auth.js';
import { getWeeklyJobMatchesForUser, sendWeeklyJobAlerts } from '../services/jobAlertService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/matches/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const jobs = await getWeeklyJobMatchesForUser(req.auth.sub);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  }),
);

router.post(
  '/weekly/send',
  authenticate,
  adminOnly,
  asyncHandler(async (_req, res) => {
    const summary = await sendWeeklyJobAlerts();

    res.json({
      success: true,
      message: 'Weekly job alert run completed.',
      summary,
    });
  }),
);

export default router;
