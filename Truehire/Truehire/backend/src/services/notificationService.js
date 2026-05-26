import { pool } from '../config/database.js';
import { ensureCompanyFollowersTable } from './companyFollowService.js';
import { hasEmailConfig, sendFollowedCompanyJobEmail } from '../utils/email.js';

const statusCache = {
  loadedAt: 0,
  unread: 'UNREAD',
  read: 'READ',
};

const databaseId = (value) => Number(value);

const parseMetadata = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

const normalizeNotification = (notification) => ({
  id: String(notification.id),
  userId: notification.user_id != null ? String(notification.user_id) : null,
  applicationId: notification.application_id != null ? String(notification.application_id) : null,
  message: notification.message,
  metadata: parseMetadata(notification.metadata),
  status: String(notification.status || '').toLowerCase(),
  createdAt: notification.created_at,
  updatedAt: notification.updated_at,
});

export const getUserNotificationStatusValues = async () => {
  const now = Date.now();
  if (now - statusCache.loadedAt < 60_000) {
    return statusCache;
  }

  try {
    const [rows] = await pool.execute(
      `SELECT COLUMN_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'user_notifications'
         AND COLUMN_NAME = 'status'
       LIMIT 1`,
    );

    const columnType = rows?.[0]?.COLUMN_TYPE || '';
    const match = String(columnType).match(/^enum\((.*)\)$/i);
    const values = match?.[1]
      ? match[1].split(',').map((value) => value.trim().replace(/^'/, '').replace(/'$/, ''))
      : [];
    const byToken = new Map(values.map((value) => [
      String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      value,
    ]));

    statusCache.loadedAt = now;
    statusCache.unread = byToken.get('UNREAD') || values[0] || 'UNREAD';
    statusCache.read = byToken.get('READ') || values[Math.min(1, values.length - 1)] || 'READ';
  } catch (_error) {
    statusCache.loadedAt = now;
  }

  return statusCache;
};

export const ensureUserNotificationsTable = async () => {
  const { unread } = await getUserNotificationStatusValues();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      application_id BIGINT UNSIGNED NULL,
      message TEXT NOT NULL,
      metadata JSON NULL,
      status VARCHAR(20) NOT NULL DEFAULT '${unread}',
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_notifications_user_id (user_id),
      INDEX idx_user_notifications_application_id (application_id),
      INDEX idx_user_notifications_status (status)
    )
  `);
};

export const createNewJobPostedNotifications = async (job) => {
  if (!job?.id || !job?.recruiter_id) {
    return {
      users: 0,
      created: 0,
      emailed: 0,
      emailFailed: 0,
    };
  }

  await ensureCompanyFollowersTable();
  await ensureUserNotificationsTable();

  const { unread } = await getUserNotificationStatusValues();
  const companyId = databaseId(job.recruiter_id);
  const jobId = String(job.id);
  const title = String(job.title || 'New Job').trim();
  const company = String(job.company || 'A company you follow').trim();
  const location = String(job.location || '').trim();
  const message = `${company} posted a new job: ${title}`;
  const metadata = JSON.stringify({
    type: 'COMPANY_FOLLOW_JOB',
    title: 'New job from followed company',
    message,
    entityType: 'JOB',
    entityId: jobId,
    jobId,
    jobTitle: title,
    companyId,
    companyName: company,
    location,
  });

  const [recipientRows] = await pool.execute(
    `SELECT u.id, u.name, u.email
     FROM company_followers cf
     INNER JOIN users u ON u.id = cf.user_id
     WHERE cf.company_id = ?
       AND u.email IS NOT NULL
       AND u.email <> ''
       AND COALESCE(UPPER(u.status), 'ACTIVE') = 'ACTIVE'
       AND NOT EXISTS (
         SELECT 1
         FROM user_notifications existing
         WHERE existing.user_id = cf.user_id
           AND JSON_UNQUOTE(JSON_EXTRACT(existing.metadata, '$.type')) = 'COMPANY_FOLLOW_JOB'
           AND JSON_UNQUOTE(JSON_EXTRACT(existing.metadata, '$.jobId')) = ?
       )`,
    [companyId, jobId],
  );

  const [result] = await pool.execute(
    `INSERT INTO user_notifications (
       user_id,
       application_id,
       message,
       metadata,
       status,
       created_at,
       updated_at
     )
     SELECT cf.user_id, NULL, ?, CAST(? AS JSON), ?, NOW(), NOW()
     FROM company_followers cf
     INNER JOIN users u ON u.id = cf.user_id
     WHERE cf.company_id = ?
       AND COALESCE(UPPER(u.status), 'ACTIVE') = 'ACTIVE'
       AND NOT EXISTS (
         SELECT 1
         FROM user_notifications existing
         WHERE existing.user_id = cf.user_id
           AND JSON_UNQUOTE(JSON_EXTRACT(existing.metadata, '$.type')) = 'COMPANY_FOLLOW_JOB'
           AND JSON_UNQUOTE(JSON_EXTRACT(existing.metadata, '$.jobId')) = ?
       )`,
    [message, metadata, unread, companyId, jobId],
  );

  let emailed = 0;
  let emailFailed = 0;

  if (hasEmailConfig && recipientRows.length > 0) {
    const emailResults = await Promise.allSettled(
      recipientRows.map((user) =>
        sendFollowedCompanyJobEmail({
          to: user.email,
          name: user.name,
          job: {
            ...job,
            id: jobId,
            companyId,
            title,
            company,
            location,
          },
        }),
      ),
    );

    emailed = emailResults.filter((item) => item.status === 'fulfilled').length;
    emailFailed = emailResults.length - emailed;

    if (emailFailed > 0) {
      console.error('Some followed-company job emails failed:', {
        jobId,
        failed: emailFailed,
      });
    }
  } else if (!hasEmailConfig) {
    console.warn('Skipped followed-company job emails because EMAIL_USER/EMAIL_PASS are not configured.');
  }

  const [userCountRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM company_followers WHERE company_id = ?',
    [companyId],
  );

  return {
    users: Number(userCountRows?.[0]?.total || 0),
    created: Number(result?.affectedRows || 0),
    emailed,
    emailFailed,
  };
};

export const getNotificationsForUser = async (userId) => {
  await ensureUserNotificationsTable();

  const [rows] = await pool.execute(
    `SELECT id, user_id, application_id, message, metadata, status, created_at, updated_at
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 100`,
    [databaseId(userId)],
  );

  return rows.map(normalizeNotification);
};

export const countUnreadNotificationsForUser = async (userId) => {
  await ensureUserNotificationsTable();
  const { unread } = await getUserNotificationStatusValues();

  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS unread_count FROM user_notifications WHERE user_id = ? AND status = ?',
    [databaseId(userId), unread],
  );

  return Number(rows?.[0]?.unread_count || 0);
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const { read } = await getUserNotificationStatusValues();

  const [result] = await pool.execute(
    'UPDATE user_notifications SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
    [read, databaseId(notificationId), databaseId(userId)],
  );

  return Number(result?.affectedRows || 0) > 0;
};

export const markAllNotificationsAsRead = async (userId) => {
  const { unread, read } = await getUserNotificationStatusValues();

  const [result] = await pool.execute(
    'UPDATE user_notifications SET status = ?, updated_at = NOW() WHERE user_id = ? AND status = ?',
    [read, databaseId(userId), unread],
  );

  return Number(result?.affectedRows || 0);
};

export const clearNotificationsForUser = async (userId) => {
  const [result] = await pool.execute(
    'DELETE FROM user_notifications WHERE user_id = ?',
    [databaseId(userId)],
  );

  return Number(result?.affectedRows || 0);
};

const insertUserNotification = async ({ userId, applicationId = null, message, metadata = null }) => {
  await ensureUserNotificationsTable();
  const { unread } = await getUserNotificationStatusValues();
  const serializedMetadata = metadata ? JSON.stringify(metadata) : null;
  const query = `INSERT INTO user_notifications (
     user_id,
     application_id,
     message,
     metadata,
     status,
     created_at,
     updated_at
   )
   VALUES (?, ?, ?, CAST(? AS JSON), ?, NOW(), NOW())
   RETURNING id`;

  try {
    const [result] = await pool.execute(query, [
      databaseId(userId),
      applicationId == null ? null : databaseId(applicationId),
      message,
      serializedMetadata,
      unread,
    ]);
    return result.insertId;
  } catch (error) {
    if (error?.code !== 'ER_NO_REFERENCED_ROW_2') {
      throw error;
    }

    const [fallbackResult] = await pool.execute(query, [
      databaseId(userId),
      null,
      message,
      serializedMetadata,
      unread,
    ]);
    return fallbackResult.insertId;
  }
};

export const createApplicationViewedNotification = async ({ userId, applicationId, jobId }) => (
  insertUserNotification({
    userId,
    applicationId,
    message: 'A recruiter viewed your application.',
    metadata: {
      type: 'APPLICATION_VIEWED',
      title: 'Application viewed',
      jobId: jobId != null ? String(jobId) : null,
      viewedAt: new Date().toISOString(),
    },
  })
);

export const createApplicationViewTimeNotification = async ({ userId, applicationId, jobId, seconds }) => {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  const duration = minutes > 0 && remainder > 0
    ? `${minutes} minute${minutes === 1 ? '' : 's'} ${remainder} second${remainder === 1 ? '' : 's'}`
    : minutes > 0
      ? `${minutes} minute${minutes === 1 ? '' : 's'}`
      : `${remainder} second${remainder === 1 ? '' : 's'}`;

  return insertUserNotification({
    userId,
    applicationId,
    message: `A recruiter spent ${duration} reviewing your application.`,
    metadata: {
      type: 'APPLICATION_VIEW_TIME',
      title: 'Application review time',
      jobId: jobId != null ? String(jobId) : null,
      seconds: totalSeconds,
    },
  });
};

export const createFriendRequestNotification = async ({ receiverId, senderId, senderName, requestId }) => {
  await ensureUserNotificationsTable();
  const { unread } = await getUserNotificationStatusValues();

  const message = `${senderName || 'Someone'} sent you a friend request.`;
  const metadata = JSON.stringify({
    type: 'FRIEND_REQUEST',
    title: 'New friend request',
    requestId: String(requestId),
    senderId: String(senderId),
    senderName: senderName || 'TrueHire user',
  });

  await pool.execute(
    `INSERT INTO user_notifications (
       user_id,
       application_id,
       message,
       metadata,
       status,
       created_at,
       updated_at
     )
     VALUES (?, NULL, ?, CAST(? AS JSON), ?, NOW(), NOW())`,
    [databaseId(receiverId), message, metadata, unread],
  );
};

export const createFriendRequestAcceptedNotification = async ({ senderId, receiverId, receiverName, requestId }) => {
  await ensureUserNotificationsTable();
  const { unread } = await getUserNotificationStatusValues();
  const message = `${receiverName || 'A user'} accepted your friend request.`;
  const metadata = JSON.stringify({
    type: 'FRIEND_REQUEST_ACCEPTED',
    title: 'Friend request accepted',
    requestId: String(requestId),
    acceptedById: String(receiverId),
    acceptedByName: receiverName || 'TrueHire user',
  });
  await pool.execute(
    `INSERT INTO user_notifications (user_id, application_id, message, metadata, status, created_at, updated_at)
     VALUES (?, NULL, ?, CAST(? AS JSON), ?, NOW(), NOW())`,
    [databaseId(senderId), message, metadata, unread],
  );
};

export const createFollowBackNotification = async ({ receiverId, senderId, senderName, requestId }) => {
  await ensureUserNotificationsTable();
  const { unread } = await getUserNotificationStatusValues();
  const message = `You are now connected with ${senderName || 'a user'}. Follow back to see their updates.`;
  const metadata = JSON.stringify({
    type: 'FOLLOW_BACK',
    title: 'Follow back',
    requestId: String(requestId),
    targetUserId: String(senderId),
    targetUserName: senderName || 'TrueHire user',
  });
  await pool.execute(
    `INSERT INTO user_notifications (user_id, application_id, message, metadata, status, created_at, updated_at)
     VALUES (?, NULL, ?, CAST(? AS JSON), ?, NOW(), NOW())`,
    [databaseId(receiverId), message, metadata, unread],
  );
};

export const createDirectMessageNotification = async ({ receiverId, senderId, senderName, conversationId }) => {
  await ensureUserNotificationsTable();
  const { unread } = await getUserNotificationStatusValues();
  const message = `${senderName || 'Someone'} sent you a message.`;
  const metadata = JSON.stringify({
    type: 'DIRECT_MESSAGE',
    title: 'New message',
    senderId: String(senderId),
    senderName: senderName || 'TrueHire user',
    conversationId: String(conversationId),
  });
  await pool.execute(
    `INSERT INTO user_notifications (user_id, application_id, message, metadata, status, created_at, updated_at)
     VALUES (?, NULL, ?, CAST(? AS JSON), ?, NOW(), NOW())`,
    [databaseId(receiverId), message, metadata, unread],
  );
};
