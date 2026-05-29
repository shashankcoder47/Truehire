import { Router } from 'express';
import { authenticate, recruiterOnly, userOnly } from '../middleware/auth.js';
import {
  addPostComment,
  createRecruiterPost,
  createRecruiterStatus,
  deletePostComment,
  deleteRecruiterPost,
  deleteRecruiterStatus,
  followCompanyForFeed,
  getCompanyStatusById,
  getPostComments,
  getPulseUpdates,
  getRecruiterCompanyProfile,
  getRecruiterStatusViews,
  getUserFeed,
  getUserStatuses,
  listCompanyPosts,
  listRecruiterPosts,
  listRecruiterStatuses,
  markCompanyStatusViewed,
  markCompanyPostViewed,
  markPulseUpdateRead,
  togglePostCommentLike,
  togglePostLike,
  unfollowCompanyForFeed,
  updateRecruiterPost,
} from '../services/companyPostService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { uploadArray, uploadMimeTypes, uploadSingle } from '../utils/upload.js';
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

const parseExistingMedia = (value) => {
  if (!value) return undefined;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .map((item, index) => ({
        mediaUrl: item?.mediaUrl || item?.media_url || item?.url || item?.path || null,
        mediaType: item?.mediaType || item?.media_type || item?.type || null,
        sortOrder: index,
      }))
      .filter((item) => item.mediaUrl);
  } catch (_error) {
    return undefined;
  }
};

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
  '/recruiter/posts',
  authenticate,
  recruiterOnly,
  uploadArray('media', 15, 'company-posts', {
    allowedMimeTypes: uploadMimeTypes.media,
    maxFileSize: 100 * 1024 * 1024,
  }),
  asyncHandler(async (req, res) => {
    const mediaItems = validatePostMedia(getUploadedMedia(req.files));
    const post = await createRecruiterPost({
      recruiterId: req.auth.sub,
      caption: req.body.caption,
      mediaItems: mediaItems.length
        ? mediaItems
        : validatePostMedia(parseExistingMedia(req.body.existing_media) || [{
          mediaUrl: req.body.media_url || null,
          mediaType: req.body.media_type || null,
          sortOrder: 0,
        }]),
    });

    res.status(201).json({ success: true, post });
  }),
);

router.get(
  '/recruiter/posts',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const [postResult, profile] = await Promise.all([
      listRecruiterPosts(req.auth.sub, getPagination(req.query)),
      getRecruiterCompanyProfile(req.auth.sub),
    ]);
    res.json({
      success: true,
      posts: postResult.posts,
      data: postResult.posts,
      pagination: postResult.pagination,
      profile,
    });
  }),
);

router.get(
  '/companies/:id/posts',
  authenticate,
  asyncHandler(async (req, res) => {
    const [postResult, profile] = await Promise.all([
      listCompanyPosts({
        companyId: req.params.id,
        viewerUserId: req.auth.sub,
        pagination: getPagination(req.query),
      }),
      getRecruiterCompanyProfile(req.params.id),
    ]);
    res.json({
      success: true,
      posts: postResult.posts,
      data: postResult.posts,
      pagination: postResult.pagination,
      profile,
    });
  }),
);

router.put(
  '/recruiter/posts/:id',
  authenticate,
  recruiterOnly,
  uploadArray('media', 15, 'company-posts', {
    allowedMimeTypes: uploadMimeTypes.media,
    maxFileSize: 100 * 1024 * 1024,
  }),
  asyncHandler(async (req, res) => {
    const uploadedMedia = validatePostMedia(getUploadedMedia(req.files));
    const existingMedia = parseExistingMedia(req.body.existing_media);
    const post = await updateRecruiterPost({
      postId: req.params.id,
      recruiterId: req.auth.sub,
      caption: req.body.caption,
      mediaItems: uploadedMedia.length
        ? uploadedMedia
        : existingMedia || (req.body.media_url !== undefined
          ? validatePostMedia([{
            mediaUrl: req.body.media_url || null,
            mediaType: req.body.media_type || null,
            sortOrder: 0,
          }])
          : undefined),
    });

    res.json({ success: true, post });
  }),
);

router.delete(
  '/recruiter/posts/:id',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const result = await deleteRecruiterPost({ postId: req.params.id, recruiterId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/recruiter/statuses',
  authenticate,
  recruiterOnly,
  uploadSingle('media', 'company-statuses', {
    allowedMimeTypes: uploadMimeTypes.media,
    maxFileSize: 100 * 1024 * 1024,
  }),
  asyncHandler(async (req, res) => {
    const status = await createRecruiterStatus({
      recruiterId: req.auth.sub,
      caption: req.body.caption,
      mediaUrl: req.file?.path || null,
      mediaType: getMediaType(req.file),
    });

    res.status(201).json({ success: true, status });
  }),
);

router.get(
  '/recruiter/statuses',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const statuses = await listRecruiterStatuses(req.auth.sub);
    res.json({ success: true, statuses });
  }),
);

router.delete(
  '/recruiter/statuses/:id',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const result = await deleteRecruiterStatus({ statusId: req.params.id, recruiterId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.get(
  '/recruiter/statuses/:id/views',
  authenticate,
  recruiterOnly,
  asyncHandler(async (req, res) => {
    const viewers = await getRecruiterStatusViews({ statusId: req.params.id, recruiterId: req.auth.sub });
    res.json({ success: true, viewers });
  }),
);

router.get(
  '/user/feed',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query);
    const offset = Number(req.query.offset ?? pagination.offset);
    const result = await getUserFeed({
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
  '/user/statuses',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const statuses = await getUserStatuses({ userId: req.auth.sub });
    res.json({ success: true, statuses });
  }),
);

router.get(
  '/user/statuses/:id',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const status = await getCompanyStatusById({ statusId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, status });
  }),
);

router.post(
  '/user/statuses/:id/view',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await markCompanyStatusViewed({ statusId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/posts/:id/like',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await togglePostLike({ postId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/posts/:id/view',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await markCompanyPostViewed({ postId: req.params.id, userId: req.auth.sub });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/posts/:id/comment',
  authenticate,
  asyncHandler(async (req, res) => {
    const comment = await addPostComment({
      postId: req.params.id,
      userId: req.auth.sub,
      authorRole: req.auth.role,
      parentCommentId: req.body.parentCommentId || req.body.parent_comment_id || null,
      comment: req.body.comment,
    });
    res.status(201).json({ success: true, comment });
  }),
);

router.get(
  '/posts/:id/comments',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await getPostComments(req.params.id, getPagination(req.query));
    res.json({
      success: true,
      comments: result.comments,
      data: result.comments,
      pagination: result.pagination,
    });
  }),
);

router.delete(
  '/posts/:id/comments/:commentId',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await deletePostComment({
      postId: req.params.id,
      commentId: req.params.commentId,
      userId: req.auth.sub,
      authorRole: req.auth.role,
    });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/posts/:id/comments/:commentId/like',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await togglePostCommentLike({
      commentId: req.params.commentId,
      userId: req.auth.sub,
      authorRole: req.auth.role,
    });
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/company/:id/follow',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await followCompanyForFeed({ userId: req.auth.sub, companyId: req.params.id });
    res.status(201).json({ success: true, ...result });
  }),
);

router.delete(
  '/company/:id/unfollow',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await unfollowCompanyForFeed({ userId: req.auth.sub, companyId: req.params.id });
    res.json({ success: true, ...result });
  }),
);

router.get(
  '/user/pulse-updates',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const updates = await getPulseUpdates(req.auth.sub);
    res.json({ success: true, updates });
  }),
);

router.patch(
  '/user/pulse-updates/:id/read',
  authenticate,
  userOnly,
  asyncHandler(async (req, res) => {
    const result = await markPulseUpdateRead({ userId: req.auth.sub, updateId: req.params.id });
    res.json({ success: true, ...result });
  }),
);

export default router;
