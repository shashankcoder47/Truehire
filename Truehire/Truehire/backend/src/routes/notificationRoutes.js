import { Router } from 'express';
import { authenticate, userOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  clearNotificationsForUser,
  countUnreadNotificationsForUser,
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService.js';
import { getPagination } from '../utils/pagination.js';

const router = Router();

router.use(authenticate, userOnly);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const [notificationResult, unreadCount] = await Promise.all([
      getNotificationsForUser(req.auth.sub, pagination),
      countUnreadNotificationsForUser(req.auth.sub),
    ]);

    res.json({
      success: true,
      notifications: notificationResult.notifications,
      data: notificationResult.notifications,
      pagination: notificationResult.pagination,
      unreadCount,
    });
  }),
);

router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const unreadCount = await countUnreadNotificationsForUser(req.auth.sub);

    res.json({
      success: true,
      unreadCount,
    });
  }),
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await markAllNotificationsAsRead(req.auth.sub);
    const pagination = getPagination(req.query);
    const [notificationResult, unreadCount] = await Promise.all([
      getNotificationsForUser(req.auth.sub, pagination),
      countUnreadNotificationsForUser(req.auth.sub),
    ]);

    res.json({
      success: true,
      notifications: notificationResult.notifications,
      data: notificationResult.notifications,
      pagination: notificationResult.pagination,
      unreadCount,
    });
  }),
);

const markReadHandler = asyncHandler(async (req, res) => {
  const updated = await markNotificationAsRead(req.params.id, req.auth.sub);

  if (!updated) {
    res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
    return;
  }

  const unreadCount = await countUnreadNotificationsForUser(req.auth.sub);

  res.json({
    success: true,
    unreadCount,
  });
});

router.patch('/:id/read', markReadHandler);
router.put('/:id/read', markReadHandler);

router.delete(
  '/clear',
  asyncHandler(async (req, res) => {
    await clearNotificationsForUser(req.auth.sub);

    res.json({
      success: true,
      unreadCount: 0,
    });
  }),
);

export default router;
