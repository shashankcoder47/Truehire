import { pool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

const normalizeId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return id;
};

const isVideoMedia = (mediaType, mediaUrl = '') => {
  const type = String(mediaType || '').toLowerCase();
  const url = String(mediaUrl || '').toLowerCase();
  return type.includes('video') || type.includes('reel') || /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url);
};

const normalizeCommentAuthorRole = (role) => {
  const normalized = String(role || 'USER').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return normalized === 'RECRUITER' || normalized === 'SUB_RECRUITER' ? 'RECRUITER' : 'USER';
};

const ensureColumn = async (tableName, columnName, definition) => {
  const [rows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName],
  );

  if (!rows.length) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const ensureIndex = async (tableName, indexName, definition) => {
  const [rows] = await pool.query(
    `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
      LIMIT 1
    `,
    [tableName, indexName],
  );

  if (!rows.length) {
    await pool.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} ${definition}`);
  }
};

const normalizePost = (post) => ({
  ...post,
  id: String(post.id),
  recruiter_id: post.recruiter_id != null ? String(post.recruiter_id) : null,
  company_id: post.company_id != null ? String(post.company_id) : null,
  company_name: post.company_name || post.company || 'TrueHire company',
  company_logo: post.company_logo || null,
  like_count: Number(post.like_count || 0),
  comment_count: Number(post.comment_count || 0),
  view_count: Number(post.view_count || 0),
  followers_count: Number(post.followers_count || 0),
  liked: Boolean(post.liked),
  following: Boolean(post.following),
  media: Array.isArray(post.media) ? post.media : [],
});

const normalizeStatus = (status) => ({
  ...status,
  id: String(status.id),
  recruiter_id: status.recruiter_id != null ? String(status.recruiter_id) : null,
  company_id: status.company_id != null ? String(status.company_id) : null,
  company_name: status.company_name || status.company || 'TrueHire company',
  company_logo: status.company_logo || null,
  following: Boolean(status.following),
  viewed: Boolean(status.viewed),
  view_count: Number(status.view_count || 0),
});

export const ensureCompanyPostTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_followers (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      company_id BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_company (user_id, company_id),
      INDEX idx_company_followers_user_id (user_id),
      INDEX idx_company_followers_company_id (company_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_network (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      company_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_company_network_user_company (user_id, company_id),
      INDEX idx_company_network_company_id (company_id),
      INDEX idx_company_network_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_posts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      recruiter_id BIGINT NOT NULL,
      company_id BIGINT NOT NULL,
      caption TEXT NULL,
      media_url VARCHAR(1000) NULL,
      media_type VARCHAR(30) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_posts_company_created (company_id, created_at),
      INDEX idx_company_posts_recruiter_id (recruiter_id),
      INDEX idx_company_posts_status_created (status, created_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_post_media (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      media_url VARCHAR(1000) NOT NULL,
      media_type VARCHAR(30) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_company_post_media_post_order (post_id, sort_order)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_post_likes_user_post (post_id, user_id),
      INDEX idx_post_likes_post_id (post_id),
      INDEX idx_post_likes_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      author_role VARCHAR(30) NOT NULL DEFAULT 'USER',
      parent_comment_id BIGINT UNSIGNED NULL,
      comment TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_post_comments_post_id_created (post_id, created_at),
      INDEX idx_post_comments_parent_created (parent_comment_id, created_at),
      INDEX idx_post_comments_user_id (user_id)
    )
  `);

  await ensureColumn('post_comments', 'author_role', "VARCHAR(30) NOT NULL DEFAULT 'USER' AFTER user_id");
  await ensureColumn('post_comments', 'parent_comment_id', 'BIGINT UNSIGNED NULL AFTER author_role');
  await ensureIndex('post_comments', 'idx_post_comments_parent_created', '(parent_comment_id, created_at)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_comment_likes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      comment_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      author_role VARCHAR(30) NOT NULL DEFAULT 'USER',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_post_comment_likes_user_comment (comment_id, user_id, author_role),
      INDEX idx_post_comment_likes_comment_id (comment_id),
      INDEX idx_post_comment_likes_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_post_views (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_company_post_views_user_post (post_id, user_id),
      INDEX idx_company_post_views_post_id (post_id),
      INDEX idx_company_post_views_user_id (user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pulse_updates (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      type VARCHAR(80) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pulse_updates_user_read_created (user_id, is_read, created_at)
    )
  `);
};

export const ensureCompanyStatusTables = async () => {
  await ensureCompanyPostTables();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_statuses (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      recruiter_id BIGINT NOT NULL,
      company_id BIGINT NOT NULL,
      media_url VARCHAR(1000) NOT NULL,
      media_type VARCHAR(30) NOT NULL,
      caption TEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_statuses_company_created (company_id, created_at),
      INDEX idx_company_statuses_recruiter_id (recruiter_id),
      INDEX idx_company_statuses_active_expiry (status, expires_at, created_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_status_views (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      status_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT NOT NULL,
      viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_company_status_view_user (status_id, user_id),
      INDEX idx_company_status_views_status_id (status_id),
      INDEX idx_company_status_views_user_id (user_id)
    )
  `);
};

const getRecruiterCompany = async (recruiterId) => {
  const normalizedRecruiterId = normalizeId(recruiterId, 'recruiter id');
  const [rows] = await pool.query(
    `SELECT id, company, company_name, company_logo FROM recruiters WHERE id = ? LIMIT 1`,
    [normalizedRecruiterId],
  );

  if (!rows.length) throw new ApiError(404, 'Recruiter company not found');
  return rows[0];
};

export const getRecruiterCompanyProfile = async (recruiterId) => {
  await ensureCompanyPostTables();
  const normalizedRecruiterId = normalizeId(recruiterId, 'recruiter id');
  const [rows] = await pool.query(
    `
      SELECT
        r.id,
        r.company,
        r.company_name,
        r.company_logo,
        r.company_type,
        r.category,
        r.industry,
        r.company_size,
        r.year_founded,
        r.official_email,
        r.email,
        r.phone_number,
        r.website,
        r.headquarters_location,
        r.short_overview,
        r.detailed_description,
        r.linkedin,
        r.instagram,
        r.facebook,
        (SELECT COUNT(DISTINCT cf.user_id) FROM company_followers cf WHERE cf.company_id = r.id) AS followers_count,
        (SELECT COUNT(*) FROM company_posts cp WHERE cp.company_id = r.id AND cp.status <> 'DELETED') AS posts_count
      FROM recruiters r
      WHERE r.id = ?
      LIMIT 1
    `,
    [normalizedRecruiterId],
  );

  if (!rows.length) throw new ApiError(404, 'Recruiter company not found');
  const profile = rows[0];
  return {
    ...profile,
    id: String(profile.id),
    followers_count: Number(profile.followers_count || 0),
    posts_count: Number(profile.posts_count || 0),
  };
};

const getPostForRecruiter = async (postId, recruiterId) => {
  const [rows] = await pool.query(
    `SELECT id, recruiter_id FROM company_posts WHERE id = ? AND status <> 'DELETED' LIMIT 1`,
    [normalizeId(postId, 'post id')],
  );

  if (!rows.length) throw new ApiError(404, 'Post not found');
  if (String(rows[0].recruiter_id) !== String(recruiterId)) {
    throw new ApiError(403, 'You can edit or delete only your own posts');
  }
  return rows[0];
};

const getStatusForRecruiter = async (statusId, recruiterId) => {
  const [rows] = await pool.query(
    `SELECT id, recruiter_id FROM company_statuses WHERE id = ? AND status <> 'DELETED' LIMIT 1`,
    [normalizeId(statusId, 'status id')],
  );

  if (!rows.length) throw new ApiError(404, 'Status not found');
  if (String(rows[0].recruiter_id) !== String(recruiterId)) {
    throw new ApiError(403, 'You can delete only your own status');
  }
  return rows[0];
};

const notifyFollowersOfPost = async ({ companyId, companyName }) => {
  await ensureCompanyPostTables();
  const [followers] = await pool.query(
    `
      SELECT user_id FROM company_network WHERE company_id = ?
      UNION
      SELECT user_id FROM company_followers WHERE company_id = ?
    `,
    [companyId, companyId],
  );

  if (!followers.length) return;

  await pool.query(
    `
      INSERT INTO pulse_updates (user_id, type, title, message)
      VALUES ${followers.map(() => '(?, ?, ?, ?)').join(', ')}
    `,
    followers.flatMap((row) => [
      row.user_id,
      'COMPANY_POST',
      'New company update',
      `${companyName} posted a new update.`,
    ]),
  );
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
      INSERT INTO company_post_media (post_id, media_url, media_type, sort_order)
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
      FROM company_post_media
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

export const createRecruiterPost = async ({ recruiterId, caption, mediaItems = [] }) => {
  await ensureCompanyPostTables();
  const company = await getRecruiterCompany(recruiterId);
  const companyName = company.company_name || company.company || 'TrueHire company';
  const normalizedMedia = normalizeMediaItems(mediaItems);
  const firstMedia = normalizedMedia[0] || {};

  const [result] = await pool.query(
    `
      INSERT INTO company_posts (recruiter_id, company_id, caption, media_url, media_type, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `,
    [
      normalizeId(recruiterId, 'recruiter id'),
      company.id,
      caption || '',
      firstMedia.mediaUrl || null,
      firstMedia.mediaType || null,
    ],
  );

  await insertPostMedia(result.insertId, normalizedMedia);
  await notifyFollowersOfPost({ companyId: company.id, companyName });

  return getRecruiterPostById(result.insertId);
};

export const getRecruiterPostById = async (postId) => {
  const [rows] = await pool.query(
    `
      SELECT cp.*, r.company, r.company_name, r.company_logo,
        0 AS liked,
        0 AS following,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = cp.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) AS comment_count,
        (SELECT COUNT(*) FROM company_post_views cpv WHERE cpv.post_id = cp.id) AS view_count,
        (SELECT COUNT(DISTINCT cf.user_id) FROM company_followers cf WHERE cf.company_id = cp.company_id) AS followers_count
      FROM company_posts cp
      INNER JOIN recruiters r ON r.id = cp.company_id
      WHERE cp.id = ? AND cp.status <> 'DELETED'
      LIMIT 1
    `,
    [normalizeId(postId, 'post id')],
  );

  if (!rows.length) throw new ApiError(404, 'Post not found');
  return attachPostMedia(rows[0]);
};

export const listRecruiterPosts = async (recruiterId) => {
  await ensureCompanyPostTables();
  const [rows] = await pool.query(
    `
      SELECT cp.*, r.company, r.company_name, r.company_logo,
        0 AS liked,
        0 AS following,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = cp.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id) AS comment_count,
        (SELECT COUNT(*) FROM company_post_views cpv WHERE cpv.post_id = cp.id) AS view_count,
        (SELECT COUNT(DISTINCT cf.user_id) FROM company_followers cf WHERE cf.company_id = cp.company_id) AS followers_count
      FROM company_posts cp
      INNER JOIN recruiters r ON r.id = cp.company_id
      WHERE cp.recruiter_id = ? AND cp.status <> 'DELETED'
      ORDER BY cp.created_at DESC
    `,
    [normalizeId(recruiterId, 'recruiter id')],
  );
  return attachPostMedia(rows);
};

export const listCompanyPosts = async ({ companyId, viewerUserId = null }) => {
  await ensureCompanyPostTables();
  const normalizedCompanyId = normalizeId(companyId, 'company id');
  const normalizedViewerId = viewerUserId ? normalizeId(viewerUserId, 'user id') : null;

  const [rows] = await pool.query(
    `
      SELECT cp.*, r.company, r.company_name, r.company_logo,
        CASE WHEN ? IS NOT NULL AND (cn.id IS NOT NULL OR cf.id IS NOT NULL) THEN 1 ELSE 0 END AS following,
        CASE WHEN ? IS NOT NULL AND pl.id IS NOT NULL THEN 1 ELSE 0 END AS liked,
        (SELECT COUNT(*) FROM post_likes likes WHERE likes.post_id = cp.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments comments WHERE comments.post_id = cp.id) AS comment_count,
        (SELECT COUNT(*) FROM company_post_views views WHERE views.post_id = cp.id) AS view_count,
        (SELECT COUNT(DISTINCT followers.user_id) FROM company_followers followers WHERE followers.company_id = cp.company_id) AS followers_count
      FROM company_posts cp
      INNER JOIN recruiters r ON r.id = cp.company_id
      LEFT JOIN company_network cn ON cn.company_id = cp.company_id AND cn.user_id = ?
      LEFT JOIN company_followers cf ON cf.company_id = cp.company_id AND cf.user_id = ?
      LEFT JOIN post_likes pl ON pl.post_id = cp.id AND pl.user_id = ?
      WHERE cp.company_id = ? AND UPPER(cp.status) = 'ACTIVE'
      ORDER BY cp.created_at DESC, cp.id DESC
    `,
    [
      normalizedViewerId,
      normalizedViewerId,
      normalizedViewerId,
      normalizedViewerId,
      normalizedViewerId,
      normalizedCompanyId,
    ],
  );

  return attachPostMedia(rows);
};

export const updateRecruiterPost = async ({ postId, recruiterId, caption, mediaItems }) => {
  await ensureCompanyPostTables();
  await getPostForRecruiter(postId, recruiterId);

  const updates = ['caption = ?'];
  const values = [caption || ''];
  const shouldUpdateMedia = mediaItems !== undefined;
  const normalizedMedia = shouldUpdateMedia ? normalizeMediaItems(mediaItems) : [];
  const firstMedia = normalizedMedia[0] || {};
  if (shouldUpdateMedia) {
    updates.push('media_url = ?', 'media_type = ?');
    values.push(firstMedia.mediaUrl || null, firstMedia.mediaType || null);
  }

  await pool.query(
    `UPDATE company_posts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
    [...values, normalizeId(postId, 'post id')],
  );

  if (shouldUpdateMedia) {
    await pool.query('DELETE FROM company_post_media WHERE post_id = ?', [normalizeId(postId, 'post id')]);
    await insertPostMedia(postId, normalizedMedia);
  }

  return getRecruiterPostById(postId);
};

export const deleteRecruiterPost = async ({ postId, recruiterId }) => {
  await ensureCompanyPostTables();
  await getPostForRecruiter(postId, recruiterId);
  await pool.query(`UPDATE company_posts SET status = 'DELETED', updated_at = NOW() WHERE id = ?`, [
    normalizeId(postId, 'post id'),
  ]);
  return { deleted: true };
};

export const getUserFeed = async ({ userId, limit = 8, offset = 0 }) => {
  await ensureCompanyPostTables();
  const normalizedUserId = normalizeId(userId, 'user id');
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [rows] = await pool.query(
    `
      SELECT cp.*, r.company, r.company_name, r.company_logo,
        CASE WHEN cn.id IS NOT NULL OR cf.id IS NOT NULL THEN 1 ELSE 0 END AS following,
        CASE WHEN pl.id IS NOT NULL THEN 1 ELSE 0 END AS liked,
        (SELECT COUNT(*) FROM post_likes likes WHERE likes.post_id = cp.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments comments WHERE comments.post_id = cp.id) AS comment_count,
        (SELECT COUNT(*) FROM company_post_views views WHERE views.post_id = cp.id) AS view_count
      FROM company_posts cp
      INNER JOIN recruiters r ON r.id = cp.company_id
      LEFT JOIN company_network cn ON cn.company_id = cp.company_id AND cn.user_id = ?
      LEFT JOIN company_followers cf ON cf.company_id = cp.company_id AND cf.user_id = ?
      LEFT JOIN post_likes pl ON pl.post_id = cp.id AND pl.user_id = ?
      WHERE UPPER(cp.status) = 'ACTIVE'
      ORDER BY cp.created_at DESC, cp.id DESC
      LIMIT ? OFFSET ?
    `,
    [normalizedUserId, normalizedUserId, normalizedUserId, safeLimit, safeOffset],
  );

  return attachPostMedia(rows);
};

export const markCompanyPostViewed = async ({ postId, userId }) => {
  await ensureCompanyPostTables();
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedUserId = normalizeId(userId, 'user id');

  const [posts] = await pool.query(
    `
      SELECT cp.id, cp.media_type, cp.media_url,
        SUM(CASE WHEN cpm.media_type LIKE 'video%' OR cpm.media_url REGEXP '\\\\.(mp4|webm|mov|m4v|ogg)(\\\\?|#|$)' THEN 1 ELSE 0 END) AS video_media_count
      FROM company_posts cp
      LEFT JOIN company_post_media cpm ON cpm.post_id = cp.id
      WHERE cp.id = ? AND UPPER(cp.status) = 'ACTIVE'
      GROUP BY cp.id
      LIMIT 1
    `,
    [normalizedPostId],
  );

  if (!posts.length) throw new ApiError(404, 'Post not found');
  if (!isVideoMedia(posts[0].media_type, posts[0].media_url) && !Number(posts[0].video_media_count || 0)) {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS view_count FROM company_post_views WHERE post_id = ?`,
      [normalizedPostId],
    );
    return { viewed: false, view_count: Number(countRows?.[0]?.view_count || 0) };
  }

  await pool.query(
    `INSERT IGNORE INTO company_post_views (post_id, user_id) VALUES (?, ?)`,
    [normalizedPostId, normalizedUserId],
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS view_count FROM company_post_views WHERE post_id = ?`,
    [normalizedPostId],
  );

  return { viewed: true, view_count: Number(countRows?.[0]?.view_count || 0) };
};

export const togglePostLike = async ({ postId, userId }) => {
  await ensureCompanyPostTables();
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedUserId = normalizeId(userId, 'user id');

  const [existing] = await pool.query(
    'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1',
    [normalizedPostId, normalizedUserId],
  );

  if (existing.length) {
    await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [normalizedPostId, normalizedUserId]);
    return { liked: false };
  }

  await pool.query('INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)', [
    normalizedPostId,
    normalizedUserId,
  ]);
  return { liked: true };
};

export const addPostComment = async ({ postId, userId, comment, authorRole = 'USER', parentCommentId = null }) => {
  await ensureCompanyPostTables();
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedAuthorRole = normalizeCommentAuthorRole(authorRole);
  const normalizedParentCommentId = parentCommentId ? normalizeId(parentCommentId, 'parent comment id') : null;
  const trimmed = String(comment || '').trim();
  if (!trimmed) throw new ApiError(400, 'Comment is required');

  if (normalizedParentCommentId) {
    const [parentRows] = await pool.query(
      'SELECT id FROM post_comments WHERE id = ? AND post_id = ? LIMIT 1',
      [normalizedParentCommentId, normalizedPostId],
    );
    if (!parentRows.length) throw new ApiError(404, 'Parent comment not found');
  }

  const [result] = await pool.query(
    'INSERT INTO post_comments (post_id, user_id, author_role, parent_comment_id, comment) VALUES (?, ?, ?, ?, ?)',
    [normalizedPostId, normalizedUserId, normalizedAuthorRole, normalizedParentCommentId, trimmed],
  );

  return {
    id: String(result.insertId),
    post_id: String(normalizedPostId),
    user_id: String(normalizedUserId),
    author_role: normalizedAuthorRole,
    parent_comment_id: normalizedParentCommentId ? String(normalizedParentCommentId) : null,
    comment: trimmed,
  };
};

export const deletePostComment = async ({ postId, commentId, userId, authorRole = 'USER' }) => {
  await ensureCompanyPostTables();
  const normalizedPostId = normalizeId(postId, 'post id');
  const normalizedCommentId = normalizeId(commentId, 'comment id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedAuthorRole = normalizeCommentAuthorRole(authorRole);

  const [rows] = await pool.query(
    'SELECT id, user_id, author_role FROM post_comments WHERE id = ? AND post_id = ? LIMIT 1',
    [normalizedCommentId, normalizedPostId],
  );

  if (!rows.length) throw new ApiError(404, 'Comment not found');
  if (String(rows[0].user_id) !== String(normalizedUserId) || normalizeCommentAuthorRole(rows[0].author_role) !== normalizedAuthorRole) {
    throw new ApiError(403, 'You can delete only your own comment');
  }

  await pool.query('DELETE FROM post_comments WHERE (id = ? OR parent_comment_id = ?) AND post_id = ? AND user_id = ? AND author_role = ?', [
    normalizedCommentId,
    normalizedCommentId,
    normalizedPostId,
    normalizedUserId,
    normalizedAuthorRole,
  ]);

  return { deleted: true };
};

export const getPostComments = async (postId) => {
  await ensureCompanyPostTables();
  const [rows] = await pool.query(
    `
      SELECT
        pc.id,
        pc.post_id,
        pc.user_id,
        pc.author_role,
        pc.parent_comment_id,
        pc.comment,
        pc.created_at,
        pc.updated_at,
        CASE
          WHEN pc.author_role = 'RECRUITER' THEN COALESCE(r.company_name, r.company, r.name, 'Recruiter')
          ELSE COALESCE(u.name, 'User')
        END AS user_name,
        (SELECT COUNT(*) FROM post_comment_likes pcl WHERE pcl.comment_id = pc.id) AS like_count
      FROM post_comments pc
      LEFT JOIN users u ON u.id = pc.user_id
      LEFT JOIN recruiters r ON r.id = pc.user_id
      WHERE pc.post_id = ?
      ORDER BY COALESCE(pc.parent_comment_id, pc.id) ASC, pc.parent_comment_id IS NOT NULL ASC, pc.created_at ASC
    `,
    [normalizeId(postId, 'post id')],
  );
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    post_id: String(row.post_id),
    user_id: String(row.user_id),
    author_role: normalizeCommentAuthorRole(row.author_role),
    parent_comment_id: row.parent_comment_id != null ? String(row.parent_comment_id) : null,
    like_count: Number(row.like_count || 0),
  }));
};

export const togglePostCommentLike = async ({ commentId, userId, authorRole = 'USER' }) => {
  await ensureCompanyPostTables();
  const normalizedCommentId = normalizeId(commentId, 'comment id');
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedAuthorRole = normalizeCommentAuthorRole(authorRole);

  const [comments] = await pool.query('SELECT id FROM post_comments WHERE id = ? LIMIT 1', [normalizedCommentId]);
  if (!comments.length) throw new ApiError(404, 'Comment not found');

  const [existing] = await pool.query(
    'SELECT id FROM post_comment_likes WHERE comment_id = ? AND user_id = ? AND author_role = ? LIMIT 1',
    [normalizedCommentId, normalizedUserId, normalizedAuthorRole],
  );

  let liked = false;
  if (existing.length) {
    await pool.query(
      'DELETE FROM post_comment_likes WHERE comment_id = ? AND user_id = ? AND author_role = ?',
      [normalizedCommentId, normalizedUserId, normalizedAuthorRole],
    );
  } else {
    await pool.query(
      'INSERT IGNORE INTO post_comment_likes (comment_id, user_id, author_role) VALUES (?, ?, ?)',
      [normalizedCommentId, normalizedUserId, normalizedAuthorRole],
    );
    liked = true;
  }

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS like_count FROM post_comment_likes WHERE comment_id = ?',
    [normalizedCommentId],
  );

  return { liked, like_count: Number(countRows?.[0]?.like_count || 0) };
};

export const followCompanyForFeed = async ({ userId, companyId }) => {
  await ensureCompanyPostTables();
  await pool.query('INSERT IGNORE INTO company_network (user_id, company_id) VALUES (?, ?)', [
    normalizeId(userId, 'user id'),
    normalizeId(companyId, 'company id'),
  ]);
  await pool.query('INSERT IGNORE INTO company_followers (user_id, company_id) VALUES (?, ?)', [
    normalizeId(userId, 'user id'),
    normalizeId(companyId, 'company id'),
  ]);
  return { following: true };
};

export const unfollowCompanyForFeed = async ({ userId, companyId }) => {
  await ensureCompanyPostTables();
  await pool.query('DELETE FROM company_network WHERE user_id = ? AND company_id = ?', [
    normalizeId(userId, 'user id'),
    normalizeId(companyId, 'company id'),
  ]);
  await pool.query('DELETE FROM company_followers WHERE user_id = ? AND company_id = ?', [
    normalizeId(userId, 'user id'),
    normalizeId(companyId, 'company id'),
  ]);
  return { following: false };
};

export const getPulseUpdates = async (userId) => {
  await ensureCompanyPostTables();
  const [rows] = await pool.query(
    `SELECT * FROM pulse_updates WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [normalizeId(userId, 'user id')],
  );
  return rows.map((row) => ({ ...row, id: String(row.id), user_id: String(row.user_id), is_read: Boolean(row.is_read) }));
};

export const markPulseUpdateRead = async ({ userId, updateId }) => {
  await ensureCompanyPostTables();
  await pool.query('UPDATE pulse_updates SET is_read = 1 WHERE id = ? AND user_id = ?', [
    normalizeId(updateId, 'pulse update id'),
    normalizeId(userId, 'user id'),
  ]);
  return { read: true };
};

export const createRecruiterStatus = async ({ recruiterId, caption, mediaUrl, mediaType }) => {
  await ensureCompanyStatusTables();
  if (!mediaUrl) throw new ApiError(400, 'Status media is required');
  if (!['image', 'video'].includes(String(mediaType || '').toLowerCase())) {
    throw new ApiError(400, 'Status media type is required');
  }

  const company = await getRecruiterCompany(recruiterId);
  const [result] = await pool.query(
    `
      INSERT INTO company_statuses (recruiter_id, company_id, caption, media_url, media_type, status, expires_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', DATE_ADD(NOW(), INTERVAL 24 HOUR))
    `,
    [normalizeId(recruiterId, 'recruiter id'), company.id, caption || '', mediaUrl, mediaType],
  );

  return getCompanyStatusById({ statusId: result.insertId });
};

export const listRecruiterStatuses = async (recruiterId) => {
  await ensureCompanyStatusTables();
  const [rows] = await pool.query(
    `
      SELECT cs.*, r.company, r.company_name, r.company_logo,
        0 AS following,
        0 AS viewed,
        COUNT(csv.id) AS view_count
      FROM company_statuses cs
      INNER JOIN recruiters r ON r.id = cs.company_id
      LEFT JOIN company_status_views csv ON csv.status_id = cs.id
      WHERE cs.recruiter_id = ? AND cs.status <> 'DELETED'
      GROUP BY cs.id
      ORDER BY cs.created_at DESC
    `,
    [normalizeId(recruiterId, 'recruiter id')],
  );
  return rows.map(normalizeStatus);
};

export const deleteRecruiterStatus = async ({ statusId, recruiterId }) => {
  await ensureCompanyStatusTables();
  await getStatusForRecruiter(statusId, recruiterId);
  await pool.query(`UPDATE company_statuses SET status = 'DELETED', updated_at = NOW() WHERE id = ?`, [
    normalizeId(statusId, 'status id'),
  ]);
  return { deleted: true };
};

export const getRecruiterStatusViews = async ({ statusId, recruiterId }) => {
  await ensureCompanyStatusTables();
  await getStatusForRecruiter(statusId, recruiterId);

  const [rows] = await pool.query(
    `
      SELECT
        csv.id,
        csv.viewed_at,
        u.id AS user_id,
        u.name,
        u.email,
        u.profile_photo
      FROM company_status_views csv
      INNER JOIN users u ON u.id = csv.user_id
      WHERE csv.status_id = ?
      ORDER BY csv.viewed_at DESC
    `,
    [normalizeId(statusId, 'status id')],
  );

  return rows.map((row) => ({
    id: String(row.id),
    user_id: row.user_id != null ? String(row.user_id) : null,
    name: row.name || 'TrueHire user',
    email: row.email || '',
    profile_photo: row.profile_photo || null,
    viewed_at: row.viewed_at,
  }));
};

export const getUserStatuses = async ({ userId }) => {
  await ensureCompanyStatusTables();
  const normalizedUserId = normalizeId(userId, 'user id');
  const [rows] = await pool.query(
    `
      SELECT cs.*, r.company, r.company_name, r.company_logo,
        CASE WHEN cn.id IS NOT NULL OR cf.id IS NOT NULL THEN 1 ELSE 0 END AS following,
        CASE WHEN csv.id IS NOT NULL THEN 1 ELSE 0 END AS viewed
      FROM company_statuses cs
      INNER JOIN recruiters r ON r.id = cs.company_id
      LEFT JOIN company_network cn ON cn.company_id = cs.company_id AND cn.user_id = ?
      LEFT JOIN company_followers cf ON cf.company_id = cs.company_id AND cf.user_id = ?
      LEFT JOIN company_status_views csv ON csv.status_id = cs.id AND csv.user_id = ?
      WHERE UPPER(cs.status) = 'ACTIVE' AND cs.expires_at >= NOW()
      ORDER BY following DESC, cs.created_at DESC
      LIMIT 50
    `,
    [normalizedUserId, normalizedUserId, normalizedUserId],
  );
  return rows.map(normalizeStatus);
};

export const getCompanyStatusById = async ({ statusId, userId = null }) => {
  await ensureCompanyStatusTables();
  const normalizedStatusId = normalizeId(statusId, 'status id');
  const normalizedUserId = userId ? normalizeId(userId, 'user id') : null;
  const [rows] = await pool.query(
    `
      SELECT cs.*, r.company, r.company_name, r.company_logo,
        CASE WHEN ? IS NOT NULL AND (cn.id IS NOT NULL OR cf.id IS NOT NULL) THEN 1 ELSE 0 END AS following,
        CASE WHEN ? IS NOT NULL AND csv.id IS NOT NULL THEN 1 ELSE 0 END AS viewed
      FROM company_statuses cs
      INNER JOIN recruiters r ON r.id = cs.company_id
      LEFT JOIN company_network cn ON cn.company_id = cs.company_id AND cn.user_id = ?
      LEFT JOIN company_followers cf ON cf.company_id = cs.company_id AND cf.user_id = ?
      LEFT JOIN company_status_views csv ON csv.status_id = cs.id AND csv.user_id = ?
      WHERE cs.id = ? AND UPPER(cs.status) = 'ACTIVE' AND cs.expires_at >= NOW()
      LIMIT 1
    `,
    [normalizedUserId, normalizedUserId, normalizedUserId, normalizedUserId, normalizedUserId, normalizedStatusId],
  );

  if (!rows.length) throw new ApiError(404, 'Status not found');
  return normalizeStatus(rows[0]);
};

export const markCompanyStatusViewed = async ({ statusId, userId }) => {
  await ensureCompanyStatusTables();
  const status = await getCompanyStatusById({ statusId, userId });
  await pool.query(
    `INSERT IGNORE INTO company_status_views (status_id, user_id) VALUES (?, ?)`,
    [normalizeId(status.id, 'status id'), normalizeId(userId, 'user id')],
  );
  return { viewed: true };
};
