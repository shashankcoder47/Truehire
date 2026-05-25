const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verifyToken, requireAuth } = require('../middleware/auth');
const { pool } = require('../config/database');
const UserNotification = require('../models/UserNotification');
const RecruiterNotification = require('../models/RecruiterNotification');
const { sendEmail } = require('../utils/email');

const router = express.Router();

const isRecruiterRole = (role) => role === 'recruiter' || role === 'sub-recruiter';
const isUserRole = (role) => role === 'user';

const getRecruiterIdFromRequest = (req) => (
  req.user?.role === 'sub-recruiter' && req.user?.mainRecruiterId
    ? req.user.mainRecruiterId
    : req.user.id
);

const normalizeEnumToken = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseEnumValuesFromColumnType = (columnType) => {
  if (!columnType || typeof columnType !== 'string') return [];
  const match = columnType.match(/^enum\((.*)\)$/i);
  if (!match || !match[1]) return [];

  return match[1]
    .split(',')
    .map((segment) => segment.trim().replace(/^'/, '').replace(/'$/, '').replace(/\\'/g, "'"))
    .filter(Boolean);
};

let messagingSchemaCache = { loadedAt: 0, config: null };
const MESSAGING_SCHEMA_CACHE_TTL_MS = 60 * 1000;

const buildReadStatusConfig = (columnType) => {
  const type = String(columnType || '').toLowerCase();
  if (type.startsWith('tinyint') || type.startsWith('int') || type.startsWith('bigint')) {
    return { unreadValue: 0, readValue: 1 };
  }

  const enumValues = parseEnumValuesFromColumnType(columnType);
  if (enumValues.length === 0) {
    return { unreadValue: 'unread', readValue: 'read' };
  }

  const byToken = new Map(enumValues.map((value) => [normalizeEnumToken(value), value]));
  return {
    unreadValue:
      byToken.get('UNREAD') ||
      byToken.get('PENDING') ||
      enumValues[0],
    readValue:
      byToken.get('READ') ||
      byToken.get('SEEN') ||
      enumValues[Math.min(1, enumValues.length - 1)] ||
      enumValues[0]
  };
};

const getMessagingSchemaConfig = async () => {
  const now = Date.now();
  if (
    messagingSchemaCache.config &&
    now - messagingSchemaCache.loadedAt < MESSAGING_SCHEMA_CACHE_TTL_MS
  ) {
    return messagingSchemaCache.config;
  }

  const [rows] = await pool.execute(
    `
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'application_messages'
        AND COLUMN_NAME IN ('sender_role', 'receiver_role', 'pinned_by_role', 'read_status')
    `
  );

  const roleValues = {
    sender_role: [],
    receiver_role: [],
    pinned_by_role: []
  };
  let readStatusConfig = { unreadValue: 'unread', readValue: 'read' };

  for (const row of rows || []) {
    if (row.COLUMN_NAME === 'sender_role') {
      roleValues.sender_role = parseEnumValuesFromColumnType(row.COLUMN_TYPE);
    } else if (row.COLUMN_NAME === 'receiver_role') {
      roleValues.receiver_role = parseEnumValuesFromColumnType(row.COLUMN_TYPE);
    } else if (row.COLUMN_NAME === 'pinned_by_role') {
      roleValues.pinned_by_role = parseEnumValuesFromColumnType(row.COLUMN_TYPE);
    } else if (row.COLUMN_NAME === 'read_status') {
      readStatusConfig = buildReadStatusConfig(row.COLUMN_TYPE);
    }
  }

  const config = { roleValues, ...readStatusConfig };
  messagingSchemaCache = { loadedAt: now, config };
  return config;
};

const resolveRoleForDb = (role, allowedValues = []) => {
  if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
    return normalizeEnumToken(role).toLowerCase();
  }

  const byToken = new Map(allowedValues.map((value) => [normalizeEnumToken(value), value]));
  const requestedToken = normalizeEnumToken(role);
  if (byToken.has(requestedToken)) return byToken.get(requestedToken);

  if (requestedToken === 'SUB_RECRUITER' && byToken.has('RECRUITER')) {
    return byToken.get('RECRUITER');
  }
  if (requestedToken === 'RECRUITER' && byToken.has('SUB_RECRUITER')) {
    return byToken.get('SUB_RECRUITER');
  }

  return allowedValues[0];
};

const normalizeRoleForResponse = (value) => {
  const token = normalizeEnumToken(value);
  if (token === 'SUPER_ADMIN') return 'super_admin';
  if (token === 'SUB_RECRUITER') return 'sub-recruiter';
  return token.toLowerCase();
};

const normalizeReadStatusForResponse = (value, readValue) => {
  if (value === null || value === undefined) return 'unread';
  if (typeof value === 'number') return value === Number(readValue) ? 'read' : 'unread';
  const token = normalizeEnumToken(value);
  if (token === normalizeEnumToken(readValue)) return 'read';
  if (token === 'READ' || token === 'SEEN') return 'read';
  return 'unread';
};

const fetchApplicationContext = async (applicationId) => {
  const query = `
    SELECT
      ja.id AS applicationId,
      ja.job_id AS jobId,
      ja.user_id AS userId,
      ja.status AS applicationStatus,
      j.title AS jobTitle,
      j.company AS jobCompany,
      j.location AS jobLocation,
      j.recruiter_id AS recruiterId,
      u.name AS userName,
      u.email AS userEmail,
      u.email_notifications AS userEmailNotifications,
      u.resume_file AS userResumeFile,
      u.core_skills AS userCoreSkills,
      u.total_experience_years AS userExperienceYears,
      u.total_experience_months AS userExperienceMonths,
      r.name AS recruiterName,
      r.email AS recruiterEmail,
      a.resume_path AS applicationResumePath,
      a.experience_level AS applicationExperienceLevel,
      a.current_salary AS applicationCurrentSalary,
      a.expected_salary AS applicationExpectedSalary,
      a.notice_period AS applicationNoticePeriod
    FROM job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    JOIN users u ON u.id = ja.user_id
    JOIN recruiters r ON r.id = j.recruiter_id
    LEFT JOIN applications a ON a.job_id = ja.job_id AND a.user_id = ja.user_id
    WHERE ja.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(query, [applicationId]);
  return rows[0] || null;
};

const ensureMessageAccess = (req, application) => {
  if (!application) {
    return { ok: false, status: 404, message: 'Application not found' };
  }

  if (isUserRole(req.user?.role)) {
    if (Number(application.userId) !== Number(req.user.id)) {
      return { ok: false, status: 403, message: 'Access denied' };
    }
    return { ok: true, role: 'user' };
  }

  if (isRecruiterRole(req.user?.role)) {
    const recruiterId = getRecruiterIdFromRequest(req);
    if (Number(application.recruiterId) !== Number(recruiterId)) {
      return { ok: false, status: 403, message: 'Access denied' };
    }
    return { ok: true, role: 'recruiter' };
  }

  return { ok: false, status: 403, message: 'Access denied' };
};

const buildMessageNotification = (application, senderRole) => {
  if (senderRole === 'recruiter') {
    return {
      userMessage: `New message from ${application.recruiterName || 'a recruiter'} about ${application.jobTitle || 'your application'}.`,
      recruiterMessage: `${application.userName || 'A candidate'} sent a message about ${application.jobTitle || 'an application'}.`
    };
  }

  return {
    userMessage: `New message from ${application.recruiterName || 'a recruiter'} about ${application.jobTitle || 'your application'}.`,
    recruiterMessage: `${application.userName || 'A candidate'} sent a message about ${application.jobTitle || 'an application'}.`
  };
};

const uploadDir = path.join(__dirname, '..', 'uploads', 'message-attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedAttachmentTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
]);

const attachmentStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'attachment', ext).replace(/\s+/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext || ''}`);
  }
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (allowedAttachmentTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only PDF, DOC, DOCX, PNG, or JPG files are allowed'));
  }
});

const buildEmailPayload = ({ recipientName, senderName, jobTitle, jobCompany, applicationId }) => {
  const subject = `New message about ${jobTitle || 'your application'} on TrueHire`;
  const title = jobTitle || 'your application';
  const company = jobCompany || 'TrueHire';
  const sender = senderName || 'TrueHire';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <p style="margin:0 0 10px;">Hi ${recipientName || 'there'},</p>
      <p style="margin:0 0 10px;">You have a new message from <strong>${sender}</strong> about <strong>${title}</strong> at ${company}.</p>
      <p style="margin:0 0 16px;">Open your TrueHire inbox to reply.</p>
      <p style="margin:0;font-size:12px;color:#6b7280;">Application ID: ${applicationId}</p>
    </div>
  `;
  return { subject, html };
};

router.get('/conversations', verifyToken, requireAuth, async (req, res) => {
  try {
    if (!isUserRole(req.user?.role) && !isRecruiterRole(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const isUser = isUserRole(req.user.role);
    const ownerField = isUser ? 'user_id' : 'recruiter_id';
    const receiverRole = isUser ? 'user' : 'recruiter';
    const receiverId = isUser ? req.user.id : getRecruiterIdFromRequest(req);
    const messagingSchema = await getMessagingSchemaConfig();
    const receiverRoleDb = resolveRoleForDb(receiverRole, messagingSchema.roleValues.receiver_role);

    const query = `
      SELECT
        c.id AS conversationId,
        c.application_id AS applicationId,
        c.job_id AS jobId,
        c.user_id AS userId,
        c.recruiter_id AS recruiterId,
        c.last_message_at AS lastMessageAt,
        m.message AS lastMessage,
        m.sender_role AS lastSenderRole,
        ja.status AS applicationStatus,
        j.title AS jobTitle,
        j.company AS jobCompany,
        j.location AS jobLocation,
        u.name AS userName,
        r.name AS recruiterName,
        COALESCE(unread.unread_count, 0) AS unreadCount
      FROM application_conversations c
      JOIN job_applications ja ON ja.id = c.application_id
      JOIN jobs j ON j.id = c.job_id
      JOIN users u ON u.id = c.user_id
      JOIN recruiters r ON r.id = c.recruiter_id
      LEFT JOIN application_messages m ON m.id = c.last_message_id
      LEFT JOIN (
        SELECT application_id, COUNT(*) AS unread_count
        FROM application_messages
        WHERE receiver_id = ? AND receiver_role = ? AND read_status = ?
        GROUP BY application_id
      ) unread ON unread.application_id = c.application_id
      WHERE c.${ownerField} = ?
      ORDER BY c.last_message_at DESC, c.updated_at DESC
    `;

    const [rows] = await pool.execute(query, [
      receiverId,
      receiverRoleDb,
      messagingSchema.unreadValue,
      receiverId
    ]);
    const normalizedRows = rows.map((row) => ({
      ...row,
      lastSenderRole: normalizeRoleForResponse(row.lastSenderRole),
      unreadCount: Number(row.unreadCount || 0)
    }));
    const totalUnread = normalizedRows.reduce((sum, row) => sum + Number(row.unreadCount || 0), 0);

    res.json({ conversations: normalizedRows, totalUnread });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

router.get('/conversations/:applicationId', verifyToken, requireAuth, async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const [conversationRows] = await pool.execute(
      'SELECT * FROM application_conversations WHERE application_id = ? LIMIT 1',
      [applicationId]
    );
    const conversation = conversationRows[0] || null;

    const [messages] = await pool.execute(
      `
        SELECT
          id,
          conversation_id AS conversationId,
          application_id AS applicationId,
          job_id AS jobId,
          sender_id AS senderId,
          sender_role AS senderRole,
          receiver_id AS receiverId,
          receiver_role AS receiverRole,
          message,
          read_status AS readStatus,
          read_at AS readAt,
          is_pinned AS isPinned,
          pinned_at AS pinnedAt,
          pinned_by_role AS pinnedByRole,
          pinned_by_id AS pinnedById,
          created_at AS createdAt
        FROM application_messages
        WHERE application_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [applicationId]
    );
    const messagingSchema = await getMessagingSchemaConfig();

    let attachmentsByMessage = new Map();
    if (messages.length > 0) {
      const messageIds = messages.map((msg) => msg.id);
      const [attachments] = await pool.query(
        `
          SELECT
            id,
            message_id AS messageId,
            file_path AS filePath,
            file_name AS fileName,
            file_type AS fileType,
            file_size AS fileSize,
            created_at AS createdAt
          FROM application_message_attachments
          WHERE message_id IN (?)
          ORDER BY created_at ASC
        `,
        [messageIds]
      );
      attachmentsByMessage = attachments.reduce((map, attachment) => {
        if (!map.has(attachment.messageId)) {
          map.set(attachment.messageId, []);
        }
        map.get(attachment.messageId).push(attachment);
        return map;
      }, new Map());
    }

    const messagesWithAttachments = messages.map((message) => ({
      ...message,
      senderRole: normalizeRoleForResponse(message.senderRole),
      receiverRole: normalizeRoleForResponse(message.receiverRole),
      pinnedByRole: normalizeRoleForResponse(message.pinnedByRole),
      readStatus: normalizeReadStatusForResponse(message.readStatus, messagingSchema.readValue),
      attachments: attachmentsByMessage.get(message.id) || []
    }));

    res.json({ conversation, application, messages: messagesWithAttachments });
  } catch (error) {
    console.error('Fetch conversation error:', error);
    res.status(500).json({ message: 'Server error fetching conversation' });
  }
});

router.post(
  '/conversations/:applicationId/messages',
  verifyToken,
  requireAuth,
  attachmentUpload.array('attachments', 5),
  async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const messageText = String(req.body?.message || '').trim();
    if (!messageText) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const application = await fetchApplicationContext(applicationId);
    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const isUser = access.role === 'user';
    const senderRole = isUser ? 'user' : 'recruiter';
    const receiverRole = isUser ? 'recruiter' : 'user';
    const senderId = isUser ? req.user.id : getRecruiterIdFromRequest(req);
    const receiverId = isUser ? application.recruiterId : application.userId;
    const messagingSchema = await getMessagingSchemaConfig();
    const senderRoleDb = resolveRoleForDb(senderRole, messagingSchema.roleValues.sender_role);
    const receiverRoleDb = resolveRoleForDb(receiverRole, messagingSchema.roleValues.receiver_role);

    const [existingConversation] = await pool.execute(
      'SELECT id FROM application_conversations WHERE application_id = ? LIMIT 1',
      [applicationId]
    );
    let conversationId = existingConversation[0]?.id || null;

    if (!conversationId) {
      const [createdConversation] = await pool.execute(
        `
          INSERT INTO application_conversations (
            application_id,
            job_id,
            recruiter_id,
            user_id,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `,
        [application.applicationId, application.jobId, application.recruiterId, application.userId]
      );
      conversationId = createdConversation.insertId;
    }

    const [messageResult] = await pool.execute(
      `
        INSERT INTO application_messages (
          conversation_id,
          application_id,
          job_id,
          sender_id,
          sender_role,
          receiver_id,
          receiver_role,
          message,
          read_status,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        conversationId,
        application.applicationId,
        application.jobId,
        senderId,
        senderRoleDb,
        receiverId,
        receiverRoleDb,
        messageText,
        messagingSchema.unreadValue
      ]
    );

    await pool.execute(
      `
        UPDATE application_conversations
        SET last_message_id = ?, last_message_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
      [messageResult.insertId, conversationId]
    );

    const attachments = Array.isArray(req.files) ? req.files : [];
    const messageAttachments = [];
    if (attachments.length > 0) {
      const attachmentRows = attachments.map((file) => ([
        messageResult.insertId,
        `/uploads/message-attachments/${file.filename}`,
        file.originalname,
        file.mimetype,
        file.size
      ]));
      await pool.query(
        `
          INSERT INTO application_message_attachments (
            message_id,
            file_path,
            file_name,
            file_type,
            file_size
          )
          VALUES ?
        `,
        [attachmentRows]
      );

      messageAttachments.push(
        ...attachments.map((file) => ({
          filePath: `/uploads/message-attachments/${file.filename}`,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size
        }))
      );
    }

    const notificationMessages = buildMessageNotification(application, senderRole);
    try {
      if (receiverRole === 'user') {
        await UserNotification.create({
          userId: receiverId,
          applicationId: application.applicationId,
          message: notificationMessages.userMessage,
          metadata: {
            type: 'MESSAGE',
            jobId: application.jobId,
            jobTitle: application.jobTitle,
            applicationId: application.applicationId,
            senderRole
          }
        });
      } else {
        await RecruiterNotification.create({
          recruiterId: receiverId,
          type: 'MESSAGE',
          title: 'New candidate message',
          message: notificationMessages.recruiterMessage,
          applicationId: application.applicationId
        });
      }
    } catch (notificationError) {
      console.error('Message notification failed:', notificationError);
    }

    const [conversationRows] = await pool.execute(
      `
        SELECT
          user_unread_email_sent_at AS userUnreadEmailSentAt,
          recruiter_unread_email_sent_at AS recruiterUnreadEmailSentAt
        FROM application_conversations
        WHERE id = ?
        LIMIT 1
      `,
      [conversationId]
    );
    const conversationMeta = conversationRows[0] || {};
    if (receiverRole === 'user') {
      const allowEmail = application.userEmail && application.userEmailNotifications !== 0;
      if (allowEmail && !conversationMeta.userUnreadEmailSentAt) {
        const payload = buildEmailPayload({
          recipientName: application.userName,
          senderName: application.recruiterName,
          jobTitle: application.jobTitle,
          jobCompany: application.jobCompany,
          applicationId: application.applicationId
        });
        try {
          await sendEmail(application.userEmail, payload.subject, payload.html);
          await pool.execute(
            'UPDATE application_conversations SET user_unread_email_sent_at = NOW() WHERE id = ?',
            [conversationId]
          );
        } catch (emailError) {
          console.error('User message email failed:', emailError);
        }
      }
    } else if (receiverRole === 'recruiter') {
      if (application.recruiterEmail && !conversationMeta.recruiterUnreadEmailSentAt) {
        const payload = buildEmailPayload({
          recipientName: application.recruiterName,
          senderName: application.userName,
          jobTitle: application.jobTitle,
          jobCompany: application.jobCompany,
          applicationId: application.applicationId
        });
        try {
          await sendEmail(application.recruiterEmail, payload.subject, payload.html);
          await pool.execute(
            'UPDATE application_conversations SET recruiter_unread_email_sent_at = NOW() WHERE id = ?',
            [conversationId]
          );
        } catch (emailError) {
          console.error('Recruiter message email failed:', emailError);
        }
      }
    }

    res.status(201).json({
      message: {
        id: messageResult.insertId,
        conversationId,
        applicationId: application.applicationId,
        jobId: application.jobId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        message: messageText,
        readStatus: 'unread',
        readAt: null,
        isPinned: 0,
        pinnedAt: null,
        pinnedByRole: null,
        pinnedById: null,
        createdAt: new Date().toISOString(),
        attachments: messageAttachments
      }
    });
  } catch (error) {
    const dbMessage = error?.sqlMessage || error?.message || 'Unknown server error';
    console.error('Send message error:', { code: error?.code, message: dbMessage, stack: error?.stack });
    res.status(500).json({ message: 'Server error sending message', details: dbMessage });
  }
});

router.post('/conversations/:applicationId/read', verifyToken, requireAuth, async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const isUser = access.role === 'user';
    const receiverRole = isUser ? 'user' : 'recruiter';
    const receiverId = isUser ? req.user.id : getRecruiterIdFromRequest(req);
    const messagingSchema = await getMessagingSchemaConfig();
    const receiverRoleDb = resolveRoleForDb(receiverRole, messagingSchema.roleValues.receiver_role);

    const [conversationRows] = await pool.execute(
      'SELECT id, last_message_id AS lastMessageId FROM application_conversations WHERE application_id = ? LIMIT 1',
      [applicationId]
    );
    const conversation = conversationRows[0] || null;

    await pool.execute(
      `
        UPDATE application_messages
        SET read_status = ?, read_at = NOW()
        WHERE application_id = ? AND receiver_id = ? AND receiver_role = ? AND read_status = ?
      `,
      [
        messagingSchema.readValue,
        applicationId,
        receiverId,
        receiverRoleDb,
        messagingSchema.unreadValue
      ]
    );

    if (conversation?.lastMessageId) {
      const updateSeenQuery = isUser
        ? `
            UPDATE application_conversations
            SET user_last_seen_message_id = ?, user_seen_at = NOW(), updated_at = NOW()
            WHERE id = ?
          `
        : `
            UPDATE application_conversations
            SET recruiter_last_seen_message_id = ?, recruiter_seen_at = NOW(), updated_at = NOW()
            WHERE id = ?
          `;
      await pool.execute(updateSeenQuery, [conversation.lastMessageId, conversation.id]);
    }

    if (receiverRole === 'user') {
      await pool.execute(
        'UPDATE application_conversations SET user_unread_email_sent_at = NULL WHERE application_id = ?',
        [applicationId]
      );
    } else {
      await pool.execute(
        'UPDATE application_conversations SET recruiter_unread_email_sent_at = NULL WHERE application_id = ?',
        [applicationId]
      );
    }

    const [[applicationUnread]] = await pool.execute(
      `
        SELECT COUNT(*) AS unreadCount
        FROM application_messages
        WHERE application_id = ? AND receiver_id = ? AND receiver_role = ? AND read_status = ?
      `,
      [applicationId, receiverId, receiverRoleDb, messagingSchema.unreadValue]
    );

    const [[totalUnread]] = await pool.execute(
      `
        SELECT COUNT(*) AS unreadCount
        FROM application_messages
        WHERE receiver_id = ? AND receiver_role = ? AND read_status = ?
      `,
      [receiverId, receiverRoleDb, messagingSchema.unreadValue]
    );

    res.json({
      success: true,
      unreadCount: Number(applicationUnread?.unreadCount || 0),
      totalUnread: Number(totalUnread?.unreadCount || 0)
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error updating read status' });
  }
});

router.post('/conversations/:applicationId/pins', verifyToken, requireAuth, async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const messageId = Number(req.body?.messageId);
    if (!Number.isFinite(messageId)) {
      return res.status(400).json({ message: 'Invalid message id' });
    }

    const shouldPin = Boolean(req.body?.pinned);

    const application = await fetchApplicationContext(applicationId);
    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const [messageRows] = await pool.execute(
      `
        SELECT
          id,
          conversation_id AS conversationId,
          application_id AS applicationId,
          sender_role AS senderRole,
          is_pinned AS isPinned
        FROM application_messages
        WHERE id = ? AND application_id = ?
        LIMIT 1
      `,
      [messageId, applicationId]
    );
    const targetMessage = messageRows[0] || null;
    if (!targetMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (normalizeEnumToken(targetMessage.senderRole) === 'SYSTEM') {
      return res.status(400).json({ message: 'System messages cannot be pinned' });
    }

    if (shouldPin && !targetMessage.isPinned) {
      const [[pinCountRow]] = await pool.execute(
        `
          SELECT COUNT(*) AS pinnedCount
          FROM application_messages
          WHERE conversation_id = ? AND is_pinned = 1
        `,
        [targetMessage.conversationId]
      );
      if (Number(pinCountRow?.pinnedCount || 0) >= 3) {
        return res.status(400).json({ message: 'Only 3 pinned messages are allowed per conversation' });
      }
    }

    if (shouldPin) {
      const pinnedById = access.role === 'user' ? req.user.id : getRecruiterIdFromRequest(req);
      const messagingSchema = await getMessagingSchemaConfig();
      const pinnedByRoleDb = resolveRoleForDb(access.role, messagingSchema.roleValues.pinned_by_role);
      await pool.execute(
        `
          UPDATE application_messages
          SET is_pinned = 1,
              pinned_at = NOW(),
              pinned_by_role = ?,
              pinned_by_id = ?
          WHERE id = ?
        `,
        [pinnedByRoleDb, pinnedById, messageId]
      );
    } else {
      await pool.execute(
        `
          UPDATE application_messages
          SET is_pinned = 0,
              pinned_at = NULL,
              pinned_by_role = NULL,
              pinned_by_id = NULL
          WHERE id = ?
        `,
        [messageId]
      );
    }

    const [[updatedMessage]] = await pool.execute(
      `
        SELECT
          id,
          is_pinned AS isPinned,
          pinned_at AS pinnedAt,
          pinned_by_role AS pinnedByRole,
          pinned_by_id AS pinnedById
        FROM application_messages
        WHERE id = ?
      `,
      [messageId]
    );

    res.json({
      success: true,
      message: {
        ...updatedMessage,
        pinnedByRole: normalizeRoleForResponse(updatedMessage?.pinnedByRole)
      }
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ message: 'Server error updating pin status' });
  }
});

router.patch('/conversations/:applicationId/notes', verifyToken, requireAuth, async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isFinite(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await fetchApplicationContext(applicationId);
    const access = ensureMessageAccess(req, application);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }
    if (access.role !== 'recruiter') {
      return res.status(403).json({ message: 'Recruiter access required.' });
    }

    const notes = req.body?.notes;
    await pool.execute(
      `
        UPDATE application_conversations
        SET recruiter_notes = ?, updated_at = NOW()
        WHERE application_id = ?
      `,
      [notes || null, applicationId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update recruiter notes error:', error);
    res.status(500).json({ message: 'Server error updating notes' });
  }
});

module.exports = router;
