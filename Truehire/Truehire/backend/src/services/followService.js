import { pool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

const toId = (value, label = 'user id') => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ApiError(400, `Invalid ${label}`);
  return parsed;
};

export const ensureUserFollowsTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_follows (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      follower_id BIGINT NOT NULL,
      following_id BIGINT NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_follows_pair (follower_id, following_id),
      KEY idx_user_follows_follower (follower_id),
      KEY idx_user_follows_following (following_id),
      CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user_follows_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

export const followUser = async (followerId, followingId) => {
  const follower = toId(followerId, 'follower id');
  const following = toId(followingId, 'following id');
  if (follower === following) throw new ApiError(400, 'You cannot follow yourself');
  await ensureUserFollowsTable();

  const [users] = await pool.execute(
    `SELECT id, role FROM users WHERE id IN (?, ?)`,
    [follower, following],
  );
  if (users.length !== 2 || users.some((user) => String(user.role).toUpperCase() !== 'USER')) {
    throw new ApiError(404, 'User not found');
  }

  await pool.execute(
    'INSERT IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)',
    [follower, following],
  );
  return { following: true };
};

export const getFollowStatus = async (followerId, followingId) => {
  const follower = toId(followerId, 'follower id');
  const following = toId(followingId, 'following id');
  await ensureUserFollowsTable();
  const [rows] = await pool.execute(
    'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
    [follower, following],
  );
  return { following: rows.length > 0 };
};

export const getFollowStats = async (userId) => {
  const id = toId(userId);
  await ensureUserFollowsTable();
  const [[followers], [following]] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS total FROM user_follows WHERE following_id = ?', [id]),
    pool.execute('SELECT COUNT(*) AS total FROM user_follows WHERE follower_id = ?', [id]),
  ]);
  let followedCompaniesCount = 0;

  try {
    const [[followedCompanies]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM company_followers WHERE user_id = ?',
      [id],
    );
    followedCompaniesCount = Number(followedCompanies?.[0]?.total || 0);
  } catch (error) {
    if (!['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(error?.code)) {
      throw error;
    }
  }

  const followingUsersCount = Number(following?.[0]?.total || 0);
  return {
    followersCount: Number(followers?.[0]?.total || 0),
    followingCount: followingUsersCount + followedCompaniesCount,
    followingUsersCount,
    followedCompaniesCount,
  };
};

const serializeFollowUser = (user) => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  profileImage: user.profile_photo,
  desiredJobRole: user.desired_job_role,
  currentLocation: user.current_location,
  viewerFollowing: Boolean(Number(user.viewer_following || 0)),
});

export const getFollowList = async (userId, type, viewerId = null) => {
  const id = toId(userId);
  const listType = type === 'followers' ? 'followers' : 'following';
  const normalizedViewerId = viewerId == null ? null : toId(viewerId, 'viewer id');
  await ensureUserFollowsTable();

  const joinColumn = listType === 'followers' ? 'uf.follower_id' : 'uf.following_id';
  const whereColumn = listType === 'followers' ? 'uf.following_id' : 'uf.follower_id';
  const [rows] = await pool.execute(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.profile_photo,
       u.desired_job_role,
       u.current_location,
       CASE
         WHEN ? IS NULL THEN 0
         ELSE EXISTS (
           SELECT 1
           FROM user_follows viewer_follows
           WHERE viewer_follows.follower_id = ?
             AND viewer_follows.following_id = u.id
         )
       END AS viewer_following
     FROM user_follows uf
     INNER JOIN users u ON u.id = ${joinColumn}
     WHERE ${whereColumn} = ?
     ORDER BY uf.created_at DESC`,
    [normalizedViewerId, normalizedViewerId, id],
  );

  return rows.map(serializeFollowUser);
};
