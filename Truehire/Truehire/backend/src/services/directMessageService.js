import { pool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

const DIRECT_MESSAGE_EDIT_WINDOW_MINUTES = 2;

const toId = (value, label = 'id') => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ApiError(400, `Invalid ${label}`);
  return parsed;
};

export const ensureDirectMessageTables = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_direct_conversations (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user1_id BIGINT NOT NULL,
      user1_type VARCHAR(30) NOT NULL DEFAULT 'USER',
      user2_id BIGINT NOT NULL,
      user2_type VARCHAR(30) NOT NULL DEFAULT 'USER',
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_direct_conversation_typed_pair (user1_id, user1_type, user2_id, user2_type),
      KEY idx_direct_conversation_user1 (user1_id),
      KEY idx_direct_conversation_user2 (user2_id)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_direct_conversation_messages (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      conversation_id BIGINT NOT NULL,
      sender_id BIGINT NOT NULL,
      sender_type VARCHAR(30) NOT NULL DEFAULT 'USER',
      receiver_id BIGINT NOT NULL,
      receiver_type VARCHAR(30) NOT NULL DEFAULT 'USER',
      message TEXT NOT NULL,
      reply_to_message_id BIGINT NULL DEFAULT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      edited_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_direct_message_reply_to (reply_to_message_id),
      KEY idx_direct_message_conversation (conversation_id),
      KEY idx_direct_message_conversation_created (conversation_id, created_at, id),
      KEY idx_direct_message_receiver_read (receiver_id, is_read),
      KEY idx_direct_message_created (created_at)
    )
  `);
  try {
    await pool.execute(`
      ALTER TABLE user_direct_conversation_messages
      ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL
    `);
  } catch (error) {
    if (error?.code !== 'ER_DUP_FIELDNAME') throw error;
  }
  const columnStatements = [
    `ALTER TABLE user_direct_conversations ADD COLUMN user1_type VARCHAR(30) NOT NULL DEFAULT 'USER' AFTER user1_id`,
    `ALTER TABLE user_direct_conversations ADD COLUMN user2_type VARCHAR(30) NOT NULL DEFAULT 'USER' AFTER user2_id`,
    `ALTER TABLE user_direct_conversation_messages ADD COLUMN sender_type VARCHAR(30) NOT NULL DEFAULT 'USER' AFTER sender_id`,
    `ALTER TABLE user_direct_conversation_messages ADD COLUMN receiver_type VARCHAR(30) NOT NULL DEFAULT 'USER' AFTER receiver_id`,
    `ALTER TABLE user_direct_conversation_messages ADD COLUMN reply_to_message_id BIGINT NULL DEFAULT NULL AFTER message`,
  ];
  for (const statement of columnStatements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error?.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
  try {
    await pool.execute('ALTER TABLE user_direct_conversations DROP INDEX uniq_direct_conversation_pair');
  } catch (error) {
    if (error?.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw error;
  }
  try {
    await pool.execute('ALTER TABLE user_direct_conversations ADD UNIQUE KEY uniq_direct_conversation_typed_pair (user1_id, user1_type, user2_id, user2_type)');
  } catch (error) {
    if (error?.code !== 'ER_DUP_KEYNAME') throw error;
  }
  try {
    await pool.execute('ALTER TABLE user_direct_conversation_messages ADD KEY idx_direct_message_reply_to (reply_to_message_id)');
  } catch (error) {
    if (error?.code !== 'ER_DUP_KEYNAME') throw error;
  }
  try {
    await pool.execute('ALTER TABLE user_direct_conversation_messages ADD KEY idx_direct_message_conversation_created (conversation_id, created_at, id)');
  } catch (error) {
    if (error?.code !== 'ER_DUP_KEYNAME') throw error;
  }
};

const normalizeParticipantType = (type) => {
  const normalized = String(type || 'USER').trim().toUpperCase();
  return normalized === 'RECRUITER' ? 'RECRUITER' : 'USER';
};

const normalizeTypedPair = (first, second) => {
  const a = { id: toId(first.id, 'participant id'), type: normalizeParticipantType(first.type) };
  const b = { id: toId(second.id, 'participant id'), type: normalizeParticipantType(second.type) };
  return `${a.type}:${a.id}` <= `${b.type}:${b.id}` ? [a, b] : [b, a];
};

export const getOrCreateDirectConversation = async (currentUserId, otherUserId) => {
  const current = toId(currentUserId, 'current user id');
  const other = toId(otherUserId, 'user id');
  if (current === other) throw new ApiError(400, 'You cannot message yourself');
  await ensureDirectMessageTables();

  const [users] = await pool.execute(
    `SELECT id, role FROM users WHERE id IN (?, ?)`,
    [current, other],
  );
  if (users.length !== 2 || users.some((user) => String(user.role).toUpperCase() !== 'USER')) {
    throw new ApiError(404, 'User not found');
  }

  const [left, right] = normalizeTypedPair(
    { id: current, type: 'USER' },
    { id: other, type: 'USER' },
  );
  await pool.execute(
    `INSERT IGNORE INTO user_direct_conversations (user1_id, user1_type, user2_id, user2_type) VALUES (?, ?, ?, ?)`,
    [left.id, left.type, right.id, right.type],
  );
  const [rows] = await pool.execute(
    `SELECT id, user1_id, user1_type, user2_id, user2_type, created_at, updated_at
     FROM user_direct_conversations
     WHERE user1_id = ? AND user1_type = ? AND user2_id = ? AND user2_type = ?
     LIMIT 1`,
    [left.id, left.type, right.id, right.type],
  );
  return rows[0];
};

export const getOrCreateCompanyDirectConversation = async (userId, recruiterId) => {
  const current = toId(userId, 'user id');
  const recruiter = toId(recruiterId, 'recruiter id');
  await ensureDirectMessageTables();

  const [[userRows], [recruiterRows]] = await Promise.all([
    pool.execute(`SELECT id FROM users WHERE id = ? LIMIT 1`, [current]),
    pool.execute(`SELECT id FROM recruiters WHERE id = ? LIMIT 1`, [recruiter]),
  ]);

  if (!userRows.length) throw new ApiError(404, 'User not found');
  if (!recruiterRows.length) throw new ApiError(404, 'Recruiter not found');

  const [left, right] = normalizeTypedPair(
    { id: current, type: 'USER' },
    { id: recruiter, type: 'RECRUITER' },
  );
  await pool.execute(
    `INSERT IGNORE INTO user_direct_conversations (user1_id, user1_type, user2_id, user2_type) VALUES (?, ?, ?, ?)`,
    [left.id, left.type, right.id, right.type],
  );
  const [rows] = await pool.execute(
    `SELECT id, user1_id, user1_type, user2_id, user2_type, created_at, updated_at
     FROM user_direct_conversations
     WHERE user1_id = ? AND user1_type = ? AND user2_id = ? AND user2_type = ?
     LIMIT 1`,
    [left.id, left.type, right.id, right.type],
  );
  return rows[0];
};

const assertConversationAccess = async (conversationId, userId, actorType = 'USER') => {
  const conversation = await getDirectConversation(conversationId, userId, actorType);
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  return conversation;
};

const getConversationParticipant = (conversation, actorId, actorType = 'USER') => {
  const actor = toId(actorId, 'user id');
  const type = normalizeParticipantType(actorType);
  const isUser1 = Number(conversation.user1_id) === actor && normalizeParticipantType(conversation.user1_type) === type;
  const isUser2 = Number(conversation.user2_id) === actor && normalizeParticipantType(conversation.user2_type) === type;

  if (isUser1) {
    return {
      senderId: Number(conversation.user1_id),
      senderType: normalizeParticipantType(conversation.user1_type),
      receiverId: Number(conversation.user2_id),
      receiverType: normalizeParticipantType(conversation.user2_type),
    };
  }

  if (isUser2) {
    return {
      senderId: Number(conversation.user2_id),
      senderType: normalizeParticipantType(conversation.user2_type),
      receiverId: Number(conversation.user1_id),
      receiverType: normalizeParticipantType(conversation.user1_type),
    };
  }

  return null;
};

export const getDirectConversation = async (conversationId, userId, actorType = 'USER') => {
  const type = normalizeParticipantType(actorType);
  await ensureDirectMessageTables();
  const [rows] = await pool.execute(
    `SELECT id, user1_id, user1_type, user2_id, user2_type, created_at, updated_at
     FROM user_direct_conversations
     WHERE id = ? AND ((user1_id = ? AND user1_type = ?) OR (user2_id = ? AND user2_type = ?))
     LIMIT 1`,
    [toId(conversationId, 'conversation id'), toId(userId, 'user id'), type, toId(userId, 'user id'), type],
  );
  return rows[0] || null;
};

export const listDirectConversations = async (userId, actorType = 'USER') => {
  const current = toId(userId, 'user id');
  const type = normalizeParticipantType(actorType);
  await ensureDirectMessageTables();
  const [rows] = await pool.execute(
    `SELECT
       c.id,
       c.user1_id,
       c.user1_type,
       c.user2_id,
       c.user2_type,
       c.updated_at,
       CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id,
       CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_type ELSE c.user1_type END AS other_user_type,
       CASE
         WHEN CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_type ELSE c.user1_type END = 'RECRUITER'
         THEN recruiter_other.name
         ELSE user_other.name
       END AS other_user_name,
       CASE
         WHEN CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_type ELSE c.user1_type END = 'RECRUITER'
         THEN recruiter_other.company_logo
         ELSE user_other.profile_photo
       END AS other_user_photo,
       latest.message AS last_message,
       latest.created_at AS last_message_at,
       (
         SELECT COUNT(*)
         FROM user_direct_conversation_messages m
         WHERE m.conversation_id = c.id AND m.receiver_id = ? AND m.receiver_type = ? AND m.is_read = 0
       ) AS unread_count
     FROM user_direct_conversations c
     LEFT JOIN users user_other
       ON user_other.id = CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_id ELSE c.user1_id END
      AND CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_type ELSE c.user1_type END = 'USER'
     LEFT JOIN recruiters recruiter_other
       ON recruiter_other.id = CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_id ELSE c.user1_id END
      AND CASE WHEN c.user1_id = ? AND c.user1_type = ? THEN c.user2_type ELSE c.user1_type END = 'RECRUITER'
     LEFT JOIN user_direct_conversation_messages latest
       ON latest.id = (
         SELECT m2.id
         FROM user_direct_conversation_messages m2
         WHERE m2.conversation_id = c.id
         ORDER BY m2.created_at DESC, m2.id DESC
         LIMIT 1
       )
     WHERE (c.user1_id = ? AND c.user1_type = ?) OR (c.user2_id = ? AND c.user2_type = ?)
     ORDER BY COALESCE(latest.created_at, c.updated_at) DESC`,
    [
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
      current, type,
    ],
  );
  return rows.map((row) => ({
    id: String(row.id),
    otherUser: {
      id: String(row.other_user_id),
      type: String(row.other_user_type || 'USER').toLowerCase(),
      name: row.other_user_name,
      profilePhoto: row.other_user_photo,
    },
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at || row.updated_at,
    unreadCount: Number(row.unread_count || 0),
  }));
};

export const listDirectMessages = async (conversationId, userId, actorType = 'USER', options = {}) => {
  await assertConversationAccess(conversationId, userId, actorType);
  const limit = Math.min(Math.max(Number.parseInt(options.limit, 10) || 30, 1), 100);
  const beforeMessageId = options.beforeMessageId ? toId(options.beforeMessageId, 'before message id') : null;
  const beforeClause = beforeMessageId ? 'AND m.id < ?' : '';
  const params = beforeMessageId
    ? [toId(conversationId, 'conversation id'), beforeMessageId, limit]
    : [toId(conversationId, 'conversation id'), limit];
  const [rows] = await pool.execute(
    `SELECT
       m.id,
       m.conversation_id,
       m.sender_id,
       m.sender_type,
       m.receiver_id,
       m.receiver_type,
       m.message,
       m.reply_to_message_id,
       m.is_read,
       m.edited_at,
       m.created_at,
       replied.id AS replied_id,
       replied.sender_id AS replied_sender_id,
       replied.sender_type AS replied_sender_type,
       replied.message AS replied_message
     FROM user_direct_conversation_messages m
     LEFT JOIN user_direct_conversation_messages replied
       ON replied.id = m.reply_to_message_id AND replied.conversation_id = m.conversation_id
     WHERE m.conversation_id = ?
       ${beforeClause}
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT ?`,
    params,
  );
  return rows.reverse().map((row) => ({
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderId: String(row.sender_id),
    senderType: String(row.sender_type || 'USER').toLowerCase(),
    receiverId: String(row.receiver_id),
    receiverType: String(row.receiver_type || 'USER').toLowerCase(),
    message: row.message,
    replyToMessageId: row.reply_to_message_id ? String(row.reply_to_message_id) : null,
    replyTo: row.replied_id ? {
      id: String(row.replied_id),
      senderId: String(row.replied_sender_id),
      senderType: String(row.replied_sender_type || 'USER').toLowerCase(),
      message: row.replied_message,
    } : null,
    isRead: Boolean(row.is_read),
    editedAt: row.edited_at,
    createdAt: row.created_at,
  }));
};

export const sendDirectMessage = async ({ conversationId, senderId, senderType = 'USER', message, replyToMessageId = null }) => {
  const actorType = normalizeParticipantType(senderType);
  const conversation = await assertConversationAccess(conversationId, senderId, actorType);
  const trimmed = String(message || '').trim();
  if (!trimmed) throw new ApiError(400, 'Message cannot be empty');
  const participant = getConversationParticipant(conversation, senderId, actorType);
  if (!participant) throw new ApiError(404, 'Conversation not found');
  const replyId = replyToMessageId ? toId(replyToMessageId, 'reply message id') : null;

  if (replyId) {
    const [replyRows] = await pool.execute(
      `SELECT id
       FROM user_direct_conversation_messages
       WHERE id = ? AND conversation_id = ?
       LIMIT 1`,
      [replyId, toId(conversationId, 'conversation id')],
    );
    if (replyRows.length === 0) throw new ApiError(404, 'Reply message not found');
  }

  const [result] = await pool.execute(
    `INSERT INTO user_direct_conversation_messages (conversation_id, sender_id, sender_type, receiver_id, receiver_type, message, reply_to_message_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      toId(conversationId, 'conversation id'),
      participant.senderId,
      participant.senderType,
      participant.receiverId,
      participant.receiverType,
      trimmed,
      replyId,
    ],
  );
  await pool.execute(`UPDATE user_direct_conversations SET updated_at = NOW() WHERE id = ?`, [toId(conversationId, 'conversation id')]);
  return {
    id: String(result.insertId),
    conversationId: String(conversationId),
    senderId: String(participant.senderId),
    senderType: participant.senderType.toLowerCase(),
    receiverId: String(participant.receiverId),
    receiverType: participant.receiverType.toLowerCase(),
    message: trimmed,
    replyToMessageId: replyId ? String(replyId) : null,
    isRead: false,
  };
};

export const markDirectMessagesRead = async (conversationId, userId, actorType = 'USER') => {
  const type = normalizeParticipantType(actorType);
  await assertConversationAccess(conversationId, userId, type);
  const [result] = await pool.execute(
    `UPDATE user_direct_conversation_messages
     SET is_read = 1
     WHERE conversation_id = ? AND receiver_id = ? AND receiver_type = ? AND is_read = 0`,
    [toId(conversationId, 'conversation id'), toId(userId, 'user id'), type],
  );
  return Number(result.affectedRows || 0);
};

export const updateDirectMessage = async ({ conversationId, messageId, userId, actorType = 'USER', message }) => {
  const type = normalizeParticipantType(actorType);
  await assertConversationAccess(conversationId, userId, type);
  const trimmed = String(message || '').trim();
  if (!trimmed) throw new ApiError(400, 'Message cannot be empty');

  const [messageRows] = await pool.execute(
    `SELECT id, TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age_seconds
     FROM user_direct_conversation_messages
     WHERE id = ? AND conversation_id = ? AND sender_id = ? AND sender_type = ?
     LIMIT 1`,
    [
      toId(messageId, 'message id'),
      toId(conversationId, 'conversation id'),
      toId(userId, 'user id'),
      type,
    ],
  );

  if (messageRows.length === 0) throw new ApiError(404, 'Message not found');

  const ageSeconds = Number(messageRows[0].age_seconds);
  if (!Number.isFinite(ageSeconds) || ageSeconds >= DIRECT_MESSAGE_EDIT_WINDOW_MINUTES * 60) {
    throw new ApiError(403, 'Messages can only be edited within 2 minutes');
  }

  const [result] = await pool.execute(
    `UPDATE user_direct_conversation_messages
     SET message = ?, edited_at = NOW()
     WHERE id = ? AND conversation_id = ? AND sender_id = ? AND sender_type = ?`,
    [
      trimmed,
      toId(messageId, 'message id'),
      toId(conversationId, 'conversation id'),
      toId(userId, 'user id'),
      type,
    ],
  );

  if (Number(result.affectedRows || 0) === 0) throw new ApiError(404, 'Message not found');
  await pool.execute(`UPDATE user_direct_conversations SET updated_at = NOW() WHERE id = ?`, [toId(conversationId, 'conversation id')]);

  return { id: String(messageId), message: trimmed, editedAt: new Date().toISOString() };
};

export const deleteDirectMessage = async ({ conversationId, messageId, userId, actorType = 'USER' }) => {
  const type = normalizeParticipantType(actorType);
  await assertConversationAccess(conversationId, userId, type);
  const [result] = await pool.execute(
    `DELETE FROM user_direct_conversation_messages
     WHERE id = ? AND conversation_id = ? AND sender_id = ? AND sender_type = ?`,
    [
      toId(messageId, 'message id'),
      toId(conversationId, 'conversation id'),
      toId(userId, 'user id'),
      type,
    ],
  );

  if (Number(result.affectedRows || 0) === 0) throw new ApiError(404, 'Message not found');
  await pool.execute(`UPDATE user_direct_conversations SET updated_at = NOW() WHERE id = ?`, [toId(conversationId, 'conversation id')]);
  return true;
};
