const express = require('express');
const UserNotification = require('../models/UserNotification');
const { verifyToken, requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications, unreadCount] = await Promise.all([
      UserNotification.findByUserId(userId),
      UserNotification.countUnread(userId)
    ]);
    res.json({
      success: true,
      notifications: notifications.map(notification => notification.toJSON()),
      unreadCount
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

router.get('/unread-count', verifyToken, requireUser, async (req, res) => {
  try {
    const unreadCount = await UserNotification.countUnread(req.user.id);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Fetch unread notifications count error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching unread count' });
  }
});

const markNotificationReadHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const updated = await UserNotification.markAsRead(notificationId, userId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await UserNotification.countUnread(userId);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

router.patch('/read-all', verifyToken, requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    await UserNotification.markAllAsRead(userId);
    const [notifications, unreadCount] = await Promise.all([
      UserNotification.findByUserId(userId),
      UserNotification.countUnread(userId)
    ]);

    res.json({
      success: true,
      notifications: notifications.map(notification => notification.toJSON()),
      unreadCount
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
});

router.patch('/:id/read', verifyToken, requireUser, markNotificationReadHandler);
router.put('/:id/read', verifyToken, requireUser, markNotificationReadHandler);

router.delete('/clear', verifyToken, requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    await UserNotification.deleteAllForUser(userId);
    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error clearing notifications' });
  }
});

module.exports = router;
