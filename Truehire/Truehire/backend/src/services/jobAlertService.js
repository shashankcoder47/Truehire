import { pool } from '../config/database.js';
import { sendWeeklyJobAlertEmail } from './emailService.js';

const ACTIVE_JOB_STATUSES = new Set(['active', 'open', 'published']);

const normalizeSkill = (skill) =>
  String(skill || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\.(?=js\b)/g, '');

const parseSkills = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(normalizeSkill).filter(Boolean);

  const rawValue = String(value).trim();
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) return parsed.map(normalizeSkill).filter(Boolean);
  } catch (_error) {
    // Fall back to delimiter parsing below.
  }

  return rawValue
    .split(/[,|;\n\r]+/)
    .map(normalizeSkill)
    .filter(Boolean);
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const collectUserSkills = (user) =>
  unique([
    ...parseSkills(user.core_skills),
    ...parseSkills(user.secondary_skills),
    ...parseSkills(user.soft_skills),
  ]);

const collectJobSkills = (job) => parseSkills(job.skills_required || job.required_skills);

const skillsMatch = (userSkills, jobSkills) => {
  if (!userSkills.length || !jobSkills.length) return false;

  return userSkills.some((userSkill) =>
    jobSkills.some((jobSkill) => userSkill === jobSkill || userSkill.includes(jobSkill) || jobSkill.includes(userSkill)),
  );
};

const getWeekStartDate = (date = new Date()) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().slice(0, 10);
};

export const ensureWeeklyJobAlertLogTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_job_alert_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      week_start_date DATE NOT NULL,
      job_count INT NOT NULL DEFAULT 0,
      sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_weekly_job_alert_user_week (user_id, week_start_date),
      INDEX idx_weekly_job_alert_sent_at (sent_at)
    )
  `);
};

export const getJobAlertPreference = async (userId) => {
  const [rows] = await pool.query(
    'SELECT job_alerts FROM users WHERE id = ? LIMIT 1',
    [Number(userId)],
  );

  return {
    job_alerts: rows[0]?.job_alerts !== null && rows[0]?.job_alerts !== undefined ? Boolean(rows[0].job_alerts) : true,
    job_alert_enabled: rows[0]?.job_alerts !== null && rows[0]?.job_alerts !== undefined ? Boolean(rows[0].job_alerts) : true,
  };
};

export const getUserNotificationSettings = async (userId) => {
  const [rows] = await pool.query(
    `
      SELECT email_notifications, job_alerts, last_login_at, last_login_device, login_type, password
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [Number(userId)],
  );

  const settings = rows[0] || {};

  return {
    email_notifications:
      settings.email_notifications !== null && settings.email_notifications !== undefined
        ? Boolean(settings.email_notifications)
        : true,
    job_alerts:
      settings.job_alerts !== null && settings.job_alerts !== undefined
        ? Boolean(settings.job_alerts)
        : true,
    job_alert_enabled:
      settings.job_alerts !== null && settings.job_alerts !== undefined
        ? Boolean(settings.job_alerts)
        : true,
    last_login_at: settings.last_login_at || null,
    last_login_device: settings.last_login_device || null,
    loginType: settings.login_type || null,
    password: settings.password ? true : null,
  };
};

export const updateUserNotificationSettings = async (userId, payload) => {
  const updates = {};

  if (payload.email_notifications !== undefined) {
    updates.email_notifications = Boolean(payload.email_notifications);
  }

  const nextJobAlerts = payload.job_alert_enabled ?? payload.job_alerts;
  if (nextJobAlerts !== undefined) {
    updates.job_alerts = Boolean(nextJobAlerts);
  }

  const entries = Object.entries(updates);
  if (!entries.length) return getUserNotificationSettings(userId);

  await pool.query(
    `
      UPDATE users
      SET ${entries.map(([key]) => `${key} = ?`).join(', ')}, updated_at = NOW()
      WHERE id = ?
    `,
    [...entries.map(([, value]) => value), Number(userId)],
  );

  return getUserNotificationSettings(userId);
};

export const updateJobAlertPreference = async (userId, enabled) => {
  await pool.query(
    'UPDATE users SET job_alerts = ?, updated_at = NOW() WHERE id = ?',
    [Boolean(enabled), Number(userId)],
  );

  return getJobAlertPreference(userId);
};

export const fetchUsersWithJobAlertsEnabled = async () => {
  const [users] = await pool.query(`
    SELECT id, name, email, core_skills, secondary_skills, soft_skills
    FROM users
    WHERE email IS NOT NULL
      AND email <> ''
      AND COALESCE(job_alerts, TRUE) = TRUE
      AND (status IS NULL OR UPPER(status) = 'ACTIVE')
  `);

  return users;
};

export const fetchActiveNonExpiredJobs = async () => {
  const [jobs] = await pool.query(`
    SELECT
      id,
      title,
      company AS company_name,
      location,
      skills_required,
      application_deadline,
      status,
      created_at
    FROM jobs
    WHERE application_deadline >= CURDATE()
      AND status IS NOT NULL
  `);

  return jobs.filter((job) => ACTIVE_JOB_STATUSES.has(String(job.status || '').trim().toLowerCase()));
};

export const findMatchingJobsForUser = (user, jobs) => {
  const userSkills = collectUserSkills(user);

  return jobs.filter((job) => skillsMatch(userSkills, collectJobSkills(job)));
};

export const getWeeklyJobMatchesForUser = async (userId) => {
  const [users] = await pool.query(
    `
      SELECT id, name, email, core_skills, secondary_skills, soft_skills
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [Number(userId)],
  );

  if (!users.length) return [];

  const activeJobs = await fetchActiveNonExpiredJobs();
  return findMatchingJobsForUser(users[0], activeJobs);
};

const reserveWeeklyAlertSend = async (userId, weekStartDate, jobCount) => {
  const [result] = await pool.query(
    `
      INSERT IGNORE INTO weekly_job_alert_logs (user_id, week_start_date, job_count)
      VALUES (?, ?, ?)
    `,
    [Number(userId), weekStartDate, jobCount],
  );

  return result.affectedRows === 1;
};

export const sendWeeklyJobAlerts = async ({ now = new Date(), logger = console } = {}) => {
  await ensureWeeklyJobAlertLogTable();

  const weekStartDate = getWeekStartDate(now);
  const [users, activeJobs] = await Promise.all([
    fetchUsersWithJobAlertsEnabled(),
    fetchActiveNonExpiredJobs(),
  ]);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  logger.info?.(`[job-alerts] Starting weekly job alert run for ${users.length} users and ${activeJobs.length} active jobs.`);

  for (const user of users) {
    const matchingJobs = findMatchingJobsForUser(user, activeJobs);

    if (!matchingJobs.length) {
      skipped += 1;
      continue;
    }

    const reserved = await reserveWeeklyAlertSend(user.id, weekStartDate, matchingJobs.length);
    if (!reserved) {
      skipped += 1;
      continue;
    }

    try {
      await sendWeeklyJobAlertEmail({
        to: user.email,
        userName: user.name,
        jobs: matchingJobs,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      logger.error?.(`[job-alerts] Failed to send weekly alert to user ${user.id}:`, error);
    }
  }

  const summary = { sent, skipped, failed, activeJobs: activeJobs.length, users: users.length };
  logger.info?.('[job-alerts] Weekly job alert run completed:', summary);
  return summary;
};
