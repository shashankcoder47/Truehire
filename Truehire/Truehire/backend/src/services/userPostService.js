import { pool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

const normalizeId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return id;
};

const normalizePost = (post) => ({
  ...post,
  id: String(post.id),
  user_id: String(post.user_id),
  user_name: post.user_name || post.name || 'Deleted user',
  like_count: Number(post.like_count || 0),
  comment_count: Number(post.comment_count || 0),
  share_count: Number(post.share_count || 0),
  liked: Boolean(post.liked),
  media: Array.isArray(post.media) ? post.media : [],
});

export const ensureUserPostTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_posts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      caption TEXT NULL,
      media_url VARCHAR(1000) NULL,
      media_type VARCHAR(30) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_posts_user_created (user_id, created_at),
      INDEX idx_user_posts_status_created (status, created_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_post_media (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      media_url VARCHAR(1000) NOT NULL,
      media_type VARCHAR(30) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_post_media_post_order (post_id, sort_order)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_post_likes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_post_likes_user_post (post_id, user_id),
      INDEX idx_user_post_likes_post_id (post_id),
      INDEX idx_user_post_likes_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_post_comments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      parent_comment_id BIGINT UNSIGNED NULL,
      comment TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_post_comments_post_created (post_id, created_at),
      INDEX idx_user_post_comments_parent_created (parent_comment_id, created_at),
      INDEX idx_user_post_comments_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_post_comment_likes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      comment_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_post_comment_likes_user_comment (comment_id, user_id),
      INDEX idx_user_post_comment_likes_comment_id (comment_id),
      INDEX idx_user_post_comment_likes_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_post_shares (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_post_shares_post_id (post_id),
      INDEX idx_user_post_shares_user_id (user_id)
    )
  `);
};

const normalizeMediaItems = (mediaItems = []) => (
  Array.isArray(mediaItems)
    ? mediaItems
      .map((item, index) => ({
        mediaUrl: item?.mediaUrl || item?.media_url || item?.url || item?.path || null,
        mediaType: item?.mediaType || item?.media_type || item?.type || null,
        sortOrder: Number.isInteger(Number(item?.sortOrder ?? item?.sort_order))
          ? Number(item?.sortOrder ?? item?.sort_order)
          : index,
      }))
      .filter((item) => item.mediaUrl && item.mediaType)
    : []
);

const insertPostMedia = async (postId, mediaItems = []) => {
  const items = normalizeMediaItems(mediaItems);
  if (!items.length) return;

  await pool.query(
    `
      INSERT INTO user_post_media (post_id, media_url, media_type, sort_order)
      VALUES ${items.map(() => '(?, ?, ?, ?)').join(', ')}
    `,
    items.flatMap((item, index) => [
      normalizeId(postId, 'post id'),
      item.mediaUrl,
      item.mediaType,
      Number.isInteger(item.sortOrder) ? item.sortOrder : index,
    ]),
  );
};

const attachPostMedia = async (posts) => {
  const postList = Array.isArray(posts) ? posts : [posts];
  if (!postList.length) return posts;

  const ids = postList.map((post) => normalizeId(post.id, 'post id'));
  const [mediaRows] = await pool.query(
    `
      SELECT id, post_id, media_url, media_type, sort_order
      FROM user_post_media
      WHERE post_id IN (${ids.map(() => '?').join(', ')})
      ORDER BY post_id ASC, sort_order ASC, id ASC
    `,
    ids,
  );

  const mediaByPostId = new Map();
  mediaRows.forEach((row) => {
    const postId = String(row.post_id);
    if (!mediaByPostId.has(postId)) mediaByPostId.set(postId, []);
    mediaByPostId.get(postId).push({
      id: String(row.id),
      post_id: postId,
      media_url: row.media_url,
      url: row.media_url,
      media_type: row.media_type,
      type: row.media_type,
      sort_order: Number(row.sort_order || 0),
    });
  });

  const withMedia = postList.map((post) => {
    const media = mediaByPostId.get(String(post.id)) || (
      post.media_url
        ? [{
          post_id: String(post.id),
          media_url: post.media_url,
          url: post.media_url,
          media_type: post.media_type,
          type: post.media_type,
          sort_order: 0,
        }]
        : []
    );
    const firstMedia = media[0] || null;
    return normalizePost({
      ...post,
      media,
      media_url: firstMedia?.media_url || post.media_url || null,
      media_type: firstMedia?.media_type || post.media_type || null,
    });
  });

  return Array.isArray(posts) ? withMedia : withMedia[0];
};

const getPostOwner = async (postId) => {
  const [rows] = await pool.query(
    "SELECT id, user_id FROM user_posts WHERE id = ? AND status <> 'DELETED' LIMIT 1",
    [normalizeId(postId, 'post id')],
  );
  if (!rows.length) throw new ApiError(404, 'Post not found');
  return rows[0];
};

export const createUserPost = async ({ userId, caption, mediaItems = [] }) => {
  await ensureUserPostTables();
  const normalizedMedia = normalizeMediaItems(mediaItems);
  const firstMedia = normalizedMedia[0] || {};
  const trimmedCaption = String(caption || '').trim();

  if (!trimmedCaption && !normalizedMedia.length) {
    throw new ApiError(400, 'Add text or media before posting.');
  }

  const [result] = await pool.query(
    `
      INSERT INTO user_posts (user_id, caption, media_url, media_type, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `,
    [
      normalizeId(userId, 'user id'),
      trimmedCaption,
      firstMedia.mediaUrl || null,
      firstMedia.mediaType || null,
    ],
  );

  await insertPostMedia(result.insertId, normalizedMedia);
  return getUserPostById({ postId: result.insertId, viewerId: userId });
};

export const listUserPosts = async ({ userId, viewerId, type = 'all' }) => {
  await ensureUserPostTables();
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedViewerId = normalizeId(viewerId, 'viewer id');
  const normalizedType = String(type || 'all').toLowerCase();
  const mediaFilter = normalizedType === 'images'
    ? "AND EXISTS (SELECT 1 FROM user_post_media upm WHERE upm.post_id = up.id AND upm.media_type = 'image')"
    : normalizedType === 'videos'
      ? "AND EXISTS (SELECT 1 FROM user_post_media upm WHERE upm.post_id = up.id AND upm.media_type = 'video')"
      : '';

  const [rows] = await pool.query(
    `
      SELECT up.*, COALESCE(u.name, 'Deleted user') AS user_name, u.profile_photo,
        CASE WHEN upl.id IS NOT NULL THEN 1 ELSE 0 END AS liked,
        (SELECT COUNT(*) FROM user_post_likes likes WHERE likes.post_id = up.id) AS like_count,
        (SELECT COUNT(*) FROM user_post_comments comments WHERE comments.post_id = up.id) AS comment_count,
        (SELECT COUNT(*) FROM user_post_shares shares WHERE shares.post_id = up.id) AS share_count
      FROM user_posts up
      LEFT JOIN users u ON u.id = up.user_id
      LEFT JOIN user_post_likes upl ON upl.post_id = up.id AND upl.user_id = ?
      WHERE up.user_id = ? AND UPPER(up.status) = 'ACTIVE'
      ${mediaFilter}
      ORDER BY up.created_at DESC
    `,
    [normalizedViewerId, normalizedUserId],
  );

  return attachPostMedia(rows);
};

export const listFollowedUserPosts = async ({ userId, limit = 8, offset = 0 }) => {
  await ensureUserPostTables();
  const normalizedUserId = normalizeId(userId, 'user id');
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [rows] = await pool.query(
    `
      SELECT up.*, COALESCE(u.name, 'Deleted user') AS user_name, u.profile_photo,
        CASE WHEN upl.id IS NOT NULL THEN 1 ELSE 0 END AS liked,
        (SELECT COUNT(*) FROM user_post_likes likes WHERE likes.post_id = up.id) AS like_count,
        (SELECT COUNT(*) FROM user_post_comments comments WHERE comments.post_id = up.id) AS comment_count,
        (SELECT COUNT(*) FROM user_post_shares shares WHERE shares.post_id = up.id) AS share_count
      FROM user_posts up
      INNER JOIN user_follows uf ON uf.following_id = up.user_id
      LEFT JOIN users u ON u.id = up.user_id
      LEFT JOIN user_post_likes upl ON upl.post_id = up.id AND upl.user_id = ?
      WHERE uf.follower_id = ?
        AND UPPER(up.status) = 'ACTIVE'
      ORDER BY up.created_at DESC, up.id DESC
      LIMIT ? OFFSET ?
    `,
    [normalizedUserId, normalizedUserId, safeLimit, safeOffset],
  );

  const posts = await attachPostMedia(rows);
  return (Array.isArray(posts) ? posts : posts ? [posts] : []).map((post) => ({
    ...post,
    post_type: 'user',
  }));
};

export const getUserPostById = async ({ postId, viewerId }) => {
  await ensureUserPostTables();
  const normalizedViewerId = normalizeId(viewerId, 'viewer id');
  const [rows] = await pool.query(
    `
      SELECT up.*, COALESCE(u.name, 'Deleted user') AS user_name, u.profile_photo,
        CASE WHEN upl.id IS NOT NULL THEN 1 ELSE 0 END AS liked,
        (SELECT COUNT(*) FROM user_post_likes likes WHERE likes.post_id = up.id) AS like_count,
        (SELECT COUNT(*) FROM user_post_comments comments WHERE comments.post_id = up.id) AS comment_count,
        (SELECT COUNT(*) FROM user_post_shares shares WHERE shares.post_id = up.id) AS share_count
      FROM user_posts up
      LEFT JOIN users u ON u.id = up.user_id
      LEFT JOIN user_post_likes upl ON upl.post_id = up.id AND upl.user_id = ?
      WHERE up.id = ? AND UPPER(up.status) = 'ACTIVE'
      LIMIT 1
    `,
    [normalizedViewerId, normalizeId(postId, 'post id')],
  );

  if (!rows.length) throw new ApiError(404, 'Post not found');
  return attachPostMedia(rows[0]);
};

export const deleteUserPost = async ({ postId, userId }) => {
  await ensureUserPostTables();
  const post = await getPostOwner(postId);
  if (String(post.user_id) !== String(userId)) {
    throw new ApiError(403, 'You can delete only your own post');
  }
  await pool.query("UPDATE user_posts SET status = 'DELETED', updated_at = NOW() WHERE id = ?", [normalizeId(postId, 'post id')]);
  return { deleted: true };
};

export const toggleUserPostLike = async ({ postId, userId }) => {
  await ensureUserPostTables();
  await getPostOwner(postId);
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const [existing] = await pool.query(
    'SELECT id FROM user_post_likes WHERE post_id = ? AND user_id = ? LIMIT 1',
    [normalizedPostId, normalizedUserId],
  );

  if (existing.length) {
    await pool.query('DELETE FROM user_post_likes WHERE post_id = ? AND user_id = ?', [normalizedPostId, normalizedUserId]);
    return { liked: false };
  }

  await pool.query('INSERT IGNORE INTO user_post_likes (post_id, user_id) VALUES (?, ?)', [normalizedPostId, normalizedUserId]);
  return { liked: true };
};

export const shareUserPost = async ({ postId, userId }) => {
  await ensureUserPostTables();
  await getPostOwner(postId);
  await pool.query('INSERT INTO user_post_shares (post_id, user_id) VALUES (?, ?)', [
    normalizeId(postId, 'post id'),
    normalizeId(userId, 'user id'),
  ]);

  const [rows] = await pool.query('SELECT COUNT(*) AS share_count FROM user_post_shares WHERE post_id = ?', [normalizeId(postId, 'post id')]);
  return { shared: true, share_count: Number(rows?.[0]?.share_count || 0) };
};

export const addUserPostComment = async ({ postId, userId, comment, parentCommentId = null }) => {
  await ensureUserPostTables();
  await getPostOwner(postId);
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedParentCommentId = parentCommentId ? normalizeId(parentCommentId, 'parent comment id') : null;
  const trimmed = String(comment || '').trim();
  if (!trimmed) throw new ApiError(400, 'Comment is required');

  if (normalizedParentCommentId) {
    const [parentRows] = await pool.query(
      'SELECT id FROM user_post_comments WHERE id = ? AND post_id = ? LIMIT 1',
      [normalizedParentCommentId, normalizedPostId],
    );
    if (!parentRows.length) throw new ApiError(404, 'Parent comment not found');
  }

  const [result] = await pool.query(
    'INSERT INTO user_post_comments (post_id, user_id, parent_comment_id, comment) VALUES (?, ?, ?, ?)',
    [normalizedPostId, normalizedUserId, normalizedParentCommentId, trimmed],
  );

  return {
    id: String(result.insertId),
    post_id: String(normalizedPostId),
    user_id: String(normalizedUserId),
    parent_comment_id: normalizedParentCommentId ? String(normalizedParentCommentId) : null,
    comment: trimmed,
  };
};

export const getUserPostComments = async (postId) => {
  await ensureUserPostTables();
  const [rows] = await pool.query(
    `
      SELECT upc.*, COALESCE(u.name, 'User') AS user_name,
        (SELECT COUNT(*) FROM user_post_comment_likes upcl WHERE upcl.comment_id = upc.id) AS like_count
      FROM user_post_comments upc
      LEFT JOIN users u ON u.id = upc.user_id
      WHERE upc.post_id = ?
      ORDER BY COALESCE(upc.parent_comment_id, upc.id) ASC, upc.parent_comment_id IS NOT NULL ASC, upc.created_at ASC
    `,
    [normalizeId(postId, 'post id')],
  );
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    post_id: String(row.post_id),
    user_id: String(row.user_id),
    parent_comment_id: row.parent_comment_id != null ? String(row.parent_comment_id) : null,
    like_count: Number(row.like_count || 0),
  }));
};

export const deleteUserPostComment = async ({ postId, commentId, userId }) => {
  await ensureUserPostTables();
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedCommentId = normalizeId(commentId, 'comment id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const [rows] = await pool.query(
    'SELECT id, user_id FROM user_post_comments WHERE id = ? AND post_id = ? LIMIT 1',
    [normalizedCommentId, normalizedPostId],
  );
  if (!rows.length) throw new ApiError(404, 'Comment not found');
  if (String(rows[0].user_id) !== String(normalizedUserId)) {
    throw new ApiError(403, 'You can delete only your own comment');
  }

  await pool.query(
    'DELETE FROM user_post_comments WHERE (id = ? OR parent_comment_id = ?) AND post_id = ? AND user_id = ?',
    [normalizedCommentId, normalizedCommentId, normalizedPostId, normalizedUserId],
  );
  return { deleted: true };
};

export const toggleUserPostCommentLike = async ({ commentId, userId }) => {
  await ensureUserPostTables();
  const normalizedCommentId = normalizeId(commentId, 'comment id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const [comments] = await pool.query('SELECT id FROM user_post_comments WHERE id = ? LIMIT 1', [normalizedCommentId]);
  if (!comments.length) throw new ApiError(404, 'Comment not found');

  const [existing] = await pool.query(
    'SELECT id FROM user_post_comment_likes WHERE comment_id = ? AND user_id = ? LIMIT 1',
    [normalizedCommentId, normalizedUserId],
  );

  let liked = false;
  if (existing.length) {
    await pool.query('DELETE FROM user_post_comment_likes WHERE comment_id = ? AND user_id = ?', [normalizedCommentId, normalizedUserId]);
  } else {
    await pool.query('INSERT IGNORE INTO user_post_comment_likes (comment_id, user_id) VALUES (?, ?)', [normalizedCommentId, normalizedUserId]);
    liked = true;
  }

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS like_count FROM user_post_comment_likes WHERE comment_id = ?',
    [normalizedCommentId],
  );
  return { liked, like_count: Number(countRows?.[0]?.like_count || 0) };
};
