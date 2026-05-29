import { Router } from 'express';
import { authenticate, userOnly } from '../middleware/auth.js';
import {
  addUserPostComment,
  createUserPost,
  deleteUserPost,
  deleteUserPostComment,
  getUserPostComments,
  listFollowedUserPosts,
  listUserPosts,
  shareUserPost,
  toggleUserPostCommentLike,
  toggleUserPostLike,
} from '../services/userPostService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { uploadArray, uploadMimeTypes } from '../utils/upload.js';
import { getPagination } from '../utils/pagination.js';

const router = Router();

const getMediaType = (file) => {
  if (!file?.mimetype) return null;
  if (file.mimetype.startsWith('video/')) return 'video';
  if (file.mimetype.startsWith('image/')) return 'image';
  return null;
};

const getUploadedMedia = (files = []) => files.map((file, index) => ({
  mediaUrl: file.path,
  mediaType: getMediaType(file),
  sortOrder: index,
}));

const validatePostMedia = (mediaItems = []) => {
  const invalidItems = mediaItems.filter((item) => item.mediaUrl && !['image', 'video'].includes(String(item.mediaType || '').toLowerCase()));
  if (invalidItems.length) {
    throw new ApiError(400, 'Upload only image or video files for a post.');
  }

  const validItems = mediaItems.filter((item) => item.mediaUrl && item.mediaType);
  if (validItems.length > 15) {
    throw new ApiError(400, 'Upload up to 15 images or videos for one post.');
  }
  return validItems;
};

router.post(
  '/user/posts',
  authenticate,
  userOnly,
  uploadArray([
    { name: 'media', maxCount: 15 },
    { name: 'media[]', maxCount: 15 },
  ], 15, 'user-posts', {
    allowedMimeTypes: uploadMimeTypes.media,
    maxFileSize: 100 * 1024 * 1024,
  }),
  asyncHandler(async (req, res) => {
    const post = await createUserPost({
      userId: req.auth.sub,
      caption: req.body.caption,
      mediaItems: validatePostMedia(getUploadedMedia(Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat())),
    });

    res.status(201).json({ success: true, post });
  }),
);

router.get(
  '/user/following-posts',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const offset = Number(req.query.offset ?? pagination.offset);
    const result = await listFollowedUserPosts({
      userId: req.auth.sub,
      limit: pagination.limit,
      offset,
      page: pagination.page,
    });
    res.json({
      success: true,
      posts: result.posts,
      data: result.posts,
      pagination: result.pagination,
      nextOffset: offset + result.posts.length,
      hasMore: result.posts.length === pagination.limit,
    });
  }),
);

router.get(
  '/user/posts',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await listUserPosts({
      userId: req.query.userId || req.auth.sub,
      viewerId: req.auth.sub,
      type: req.query.type || 'all',
      pagination: getPagination(req.query),
    });
    res.json({
      success: true,
      posts: result.posts,
      data: result.posts,
      pagination: result.pagination,
    });
  }),
);

router.delete(
  '/user/posts/:id',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await deleteUserPost({ postId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/user/posts/:id/like',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await toggleUserPostLike({ postId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/user/posts/:id/share',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await shareUserPost({ postId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/user/posts/:id/comment',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const comment = await addUserPostComment({
      postId: req.params.id,
      userId: req.auth.sub,
      parentCommentId: req.body.parentCommentId || req.body.parent_comment_id || null,
      comment: req.body.comment,
    });
    res.status(201).json({ success: true, comment });
  }),
);

router.get(
  '/user/posts/:id/comments',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await getUserPostComments(req.params.id, getPagination(req.query));
    res.json({
      success: true,
      comments: result.comments,
      data: result.comments,
      pagination: result.pagination,
    });
  }),
);

router.delete(
  '/user/posts/:id/comments/:commentId',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await deleteUserPostComment({
      postId: req.params.id,
      commentId: req.params.commentId,
      userId: req.auth.sub,
    });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/user/posts/:id/comments/:commentId/like',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await toggleUserPostCommentLike({
      commentId: req.params.commentId,
      userId: req.auth.sub,
    });
    res.json({ success: true, ...result });
  }),
);

export default router;
