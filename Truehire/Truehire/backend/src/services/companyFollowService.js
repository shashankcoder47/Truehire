import { pool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';
import { ensureUserFollowsTable } from './followService.js';

const normalizeId = (value, label) => {
  if (value === null || value === undefined || value === '') {
    throw new ApiError(400, `${label} is required`);
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return String(id);
};

const normalizeCompany = (company) => ({
  id: String(company.id),
  company_id: String(company.id),
  company_name: company.company_name || company.company || 'Unnamed company',
  company: company.company || company.company_name || 'Unnamed company',
  industry: company.industry || null,
  company_size: company.company_size || null,
  company_logo: company.company_logo || null,
  website: company.website || null,
  headquarters_location: company.headquarters_location || null,
  short_overview: company.short_overview || null,
  detailed_description: company.detailed_description || null,
  follower_count: Number(company.follower_count || 0),
  followed_at: company.followed_at || null,
});

const normalizeCompanyFollower = (user) => ({
  id: String(user.id),
  name: user.name || 'TrueHire user',
  email: user.email || null,
  profileImage: user.profile_photo || null,
  desiredJobRole: user.desired_job_role || null,
  currentLocation: user.current_location || null,
  followedAt: user.followed_at || null,
});

export const ensureCompanyFollowersTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS company_followers (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      company_id BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_company (user_id, company_id),
      INDEX idx_company_followers_user_id (user_id),
      INDEX idx_company_followers_company_id (company_id),
      CONSTRAINT fk_company_followers_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_company_followers_company
        FOREIGN KEY (company_id) REFERENCES recruiters(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
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
};

export const getCompanyById = async (companyId) => {
  const normalizedCompanyId = normalizeId(companyId, 'company id');

  const [rows] = await pool.execute(
    `SELECT
       id,
       company,
       company_name,
       industry,
       company_size,
       company_logo,
       website,
       headquarters_location,
       short_overview,
       detailed_description
     FROM recruiters
     WHERE id = ?
     LIMIT 1`,
    [normalizedCompanyId],
  );

  return rows?.[0] || null;
};

export const requireCompany = async (companyId) => {
  const company = await getCompanyById(companyId);

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  return company;
};

export const getFollowerCount = async (companyId) => {
  await ensureCompanyFollowersTable();

  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM company_followers WHERE company_id = ?',
    [normalizeId(companyId, 'company id')],
  );

  return Number(rows?.[0]?.total || 0);
};

export const getFollowStatus = async (userId, companyId) => {
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedCompanyId = normalizeId(companyId, 'company id');

  await ensureCompanyFollowersTable();
  await requireCompany(normalizedCompanyId);

  const [rows] = await pool.execute(
    'SELECT id FROM company_followers WHERE user_id = ? AND company_id = ? LIMIT 1',
    [normalizedUserId, normalizedCompanyId],
  );

  return {
    following: rows.length > 0,
    followerCount: await getFollowerCount(normalizedCompanyId),
  };
};

export const followCompany = async (userId, companyId) => {
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedCompanyId = normalizeId(companyId, 'company id');

  await ensureCompanyFollowersTable();
  await requireCompany(normalizedCompanyId);

  try {
    await pool.execute(
      'INSERT INTO company_followers (user_id, company_id) VALUES (?, ?)',
      [normalizedUserId, normalizedCompanyId],
    );
    await pool.execute(
      'INSERT IGNORE INTO company_network (user_id, company_id) VALUES (?, ?)',
      [normalizedUserId, normalizedCompanyId],
    );
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'You are already following this company');
    }
    throw error;
  }

  return {
    following: true,
    followerCount: await getFollowerCount(normalizedCompanyId),
  };
};

export const unfollowCompany = async (userId, companyId) => {
  const normalizedUserId = normalizeId(userId, 'user id');
  const normalizedCompanyId = normalizeId(companyId, 'company id');

  await ensureCompanyFollowersTable();

  const [result] = await pool.execute(
    'DELETE FROM company_followers WHERE user_id = ? AND company_id = ?',
    [normalizedUserId, normalizedCompanyId],
  );
  await pool.execute(
    'DELETE FROM company_network WHERE user_id = ? AND company_id = ?',
    [normalizedUserId, normalizedCompanyId],
  );

  if (Number(result?.affectedRows || 0) === 0) {
    throw new ApiError(404, 'You are not following this company');
  }

  return {
    following: false,
    followerCount: await getFollowerCount(normalizedCompanyId),
  };
};

export const getFollowedCompaniesForUser = async (userId) => {
  const normalizedUserId = normalizeId(userId, 'user id');

  await ensureCompanyFollowersTable();

  const [companies] = await pool.execute(
    `SELECT
       r.id,
       r.company,
       r.company_name,
       r.industry,
       r.company_size,
       r.company_logo,
       r.website,
       r.headquarters_location,
       r.short_overview,
       r.detailed_description,
       cf.created_at AS followed_at,
       follower_counts.follower_count
     FROM company_followers cf
     INNER JOIN recruiters r ON r.id = cf.company_id
     LEFT JOIN (
       SELECT company_id, COUNT(*) AS follower_count
       FROM company_followers
       GROUP BY company_id
     ) follower_counts ON follower_counts.company_id = r.id
     WHERE cf.user_id = ?
     ORDER BY cf.created_at DESC`,
    [normalizedUserId],
  );

  const [jobs] = await pool.execute(
    `SELECT
       j.id,
       j.recruiter_id,
       j.title,
       j.company,
       j.location,
       j.employment_type,
       j.salary_min,
       j.salary_max,
       j.salary_currency,
       j.created_at
     FROM jobs j
     INNER JOIN company_followers cf ON cf.company_id = j.recruiter_id
     WHERE cf.user_id = ?
       AND COALESCE(UPPER(j.status), 'OPEN') = 'OPEN'
     ORDER BY j.created_at DESC
     LIMIT 12`,
    [normalizedUserId],
  );

  let notifications = [];
  try {
    const [notificationRows] = await pool.execute(
      `SELECT id, user_id, application_id, message, metadata, status, created_at, updated_at
       FROM user_notifications
       WHERE user_id = ?
         AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.type')) = 'COMPANY_FOLLOW_JOB'
       ORDER BY created_at DESC
       LIMIT 12`,
      [normalizedUserId],
    );
    notifications = notificationRows;
  } catch (error) {
    if (!['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(error?.code)) {
      throw error;
    }
  }

  return {
    companies: companies.map(normalizeCompany),
    latestJobs: jobs.map((job) => ({
      ...job,
      id: String(job.id),
      recruiter_id: job.recruiter_id != null ? String(job.recruiter_id) : null,
      salary_min: job.salary_min != null ? Number(job.salary_min) : null,
      salary_max: job.salary_max != null ? Number(job.salary_max) : null,
    })),
    notifications: notifications.map((notification) => ({
      ...notification,
      id: String(notification.id),
      user_id: notification.user_id != null ? String(notification.user_id) : null,
      application_id: notification.application_id != null ? String(notification.application_id) : null,
      metadata: (() => {
        if (!notification.metadata || typeof notification.metadata !== 'string') {
          return notification.metadata || null;
        }
        try {
          return JSON.parse(notification.metadata);
        } catch (_error) {
          return null;
        }
      })(),
    })),
  };
};

export const getCompanyFollowersForRecruiter = async (recruiterId) => {
  const normalizedRecruiterId = normalizeId(recruiterId, 'recruiter id');

  await ensureCompanyFollowersTable();
  await requireCompany(normalizedRecruiterId);

  const [rows] = await pool.execute(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.profile_photo,
       u.desired_job_role,
       u.current_location,
       MAX(f.followed_at) AS followed_at
     FROM (
       SELECT user_id, created_at AS followed_at
       FROM company_followers
       WHERE company_id = ?
       UNION ALL
       SELECT user_id, created_at AS followed_at
       FROM company_network
       WHERE company_id = ?
     ) f
     INNER JOIN users u ON u.id = f.user_id
     GROUP BY u.id, u.name, u.email, u.profile_photo, u.desired_job_role, u.current_location
     ORDER BY followed_at DESC`,
    [normalizedRecruiterId, normalizedRecruiterId],
  );

  return rows.map(normalizeCompanyFollower);
};

export const getCompanyFollowingForRecruiter = async (recruiterId) => {
  const normalizedRecruiterId = normalizeId(recruiterId, 'recruiter id');

  await ensureUserFollowsTable();

  const [rows] = await pool.execute(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.profile_photo,
       u.desired_job_role,
       u.current_location,
       uf.created_at AS followed_at
     FROM user_follows uf
     INNER JOIN users u ON u.id = uf.following_id
     WHERE uf.follower_id = ?
     ORDER BY uf.created_at DESC`,
    [normalizedRecruiterId],
  );

  return rows.map(normalizeCompanyFollower);
};
