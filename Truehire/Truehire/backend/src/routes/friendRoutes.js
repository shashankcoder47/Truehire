import { Router } from 'express';
import { authenticate, userOnly } from '../middleware/auth.js';
import {
  getFriendStatus,
  getFriendStats,
  getFriendSuggestions,
  getMyFriends,
  getPendingFriendRequests,
  sendFriendRequest,
  updateFriendRequest,
} from '../services/friendService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { followUser, getFollowList, getFollowStatus, getFollowStats } from '../services/followService.js';

const router = Router();

router.get(
  '/users/friend-suggestions',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const suggestions = await getFriendSuggestions(req.auth.sub, req.query.limit);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  }),
);

router.post(
  '/friends/request/:receiverId',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const request = await sendFriendRequest(req.auth.sub, req.params.receiverId);

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      request,
    });
  }),
);

router.post(
  '/connections/send',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const request = await sendFriendRequest(req.auth.sub, req.body?.receiver_id ?? req.body?.receiverId);
    res.status(201).json({ success: true, data: request, message: 'Friend request sent successfully' });
  }),
);

router.get(
  '/connections/my',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getMyFriends(req.auth.sub);
    res.json({ success: true, data });
  }),
);

router.get(
  '/connections/pending',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getPendingFriendRequests(req.auth.sub);
    res.json({ success: true, data });
  }),
);

router.get(
  '/connections/status/:userId',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getFriendStatus(req.auth.sub, req.params.userId);
    res.json({ success: true, data });
  }),
);

router.get(
  '/connections/stats',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getFriendStats(req.auth.sub);
    res.json({ success: true, data });
  }),
);

router.post(
  '/follows/:userId',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await followUser(req.auth.sub, req.params.userId);
    res.status(201).json({ success: true, data, message: 'Now following user' });
  }),
);

router.get(
  '/follows/status/:userId',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getFollowStatus(req.auth.sub, req.params.userId);
    res.json({ success: true, data });
  }),
);

router.get(
  '/follows/stats',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getFollowStats(req.auth.sub);
    res.json({ success: true, data });
  }),
);

router.get(
  '/follows/:type(followers|following)',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await getFollowList(req.auth.sub, req.params.type, req.auth.sub);
    res.json({ success: true, data });
  }),
);

router.post(
  '/connections/accept/:id',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await updateFriendRequest(req.params.id, req.auth.sub, 'accepted');
    res.json({ success: true, data, message: 'Friend request accepted' });
  }),
);

router.post(
  '/connections/reject/:id',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const data = await updateFriendRequest(req.params.id, req.auth.sub, 'rejected');
    res.json({ success: true, data, message: 'Friend request rejected' });
  }),
);

export default router;
