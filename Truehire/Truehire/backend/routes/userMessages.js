const express = require("express");
const { pool } = require("../config/database");
const { verifyToken, requireUser } = require("../middleware/auth");

const router = express.Router();

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const ensureUserDirectMessagesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_direct_messages (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      sender_id BIGINT NOT NULL,
      receiver_id BIGINT NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_udm_sender (sender_id),
      INDEX idx_udm_receiver (receiver_id),
      INDEX idx_udm_pair (sender_id, receiver_id),
      INDEX idx_udm_created_at (created_at)
    )
  `);
};

const userExists = async (userId) => {
  const [[row]] = await pool.query("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  return Boolean(row);
};

router.get("/conversations", verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserDirectMessagesTable();
    const currentUserId = toPositiveInt(req.user?.id);

    const [rows] = await pool.query(
      `
        SELECT
          t.other_user_id AS userId,
          u.name AS name,
          u.email AS email,
          t.last_message AS lastMessage,
          t.last_message_at AS lastMessageAt,
          COALESCE(unread.unread_count, 0) AS unreadCount
        FROM (
          SELECT
            CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
            MAX(id) AS last_message_id
          FROM user_direct_messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
        ) pairs
        INNER JOIN user_direct_messages t2 ON t2.id = pairs.last_message_id
        INNER JOIN (
          SELECT
            id,
            CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
            message AS last_message,
            created_at AS last_message_at
          FROM user_direct_messages
        ) t ON t.id = t2.id
        INNER JOIN users u ON u.id = t.other_user_id
        LEFT JOIN (
          SELECT sender_id AS other_user_id, COUNT(*) AS unread_count
          FROM user_direct_messages
          WHERE receiver_id = ? AND is_read = 0
          GROUP BY sender_id
        ) unread ON unread.other_user_id = t.other_user_id
        ORDER BY t.last_message_at DESC
      `,
      [
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId
      ]
    );

    return res.json({ success: true, conversations: rows });
  } catch (error) {
    console.error("Fetch user conversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching user conversations."
    });
  }
});

router.get("/:userId", verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserDirectMessagesTable();
    const currentUserId = toPositiveInt(req.user?.id);
    const targetUserId = toPositiveInt(req.params?.userId);

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }
    if (Number(currentUserId) === Number(targetUserId)) {
      return res.status(400).json({ success: false, message: "Cannot open self chat." });
    }

    const exists = await userExists(targetUserId);
    if (!exists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [messages] = await pool.query(
      `
        SELECT
          id,
          sender_id AS senderId,
          receiver_id AS receiverId,
          message,
          is_read AS isRead,
          created_at AS createdAt
        FROM user_direct_messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC, id ASC
      `,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    return res.json({ success: true, messages });
  } catch (error) {
    console.error("Fetch user chat messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching messages."
    });
  }
});

router.post("/:userId", verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserDirectMessagesTable();
    const senderId = toPositiveInt(req.user?.id);
    const receiverId = toPositiveInt(req.params?.userId);
    const message = String(req.body?.message || "").trim();

    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }
    if (Number(senderId) === Number(receiverId)) {
      return res.status(400).json({ success: false, message: "Cannot message yourself." });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const exists = await userExists(receiverId);
    if (!exists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [result] = await pool.query(
      `
        INSERT INTO user_direct_messages (sender_id, receiver_id, message, is_read)
        VALUES (?, ?, ?, 0)
      `,
      [senderId, receiverId, message]
    );

    const [[row]] = await pool.query(
      `
        SELECT
          id,
          sender_id AS senderId,
          receiver_id AS receiverId,
          message,
          is_read AS isRead,
          created_at AS createdAt
        FROM user_direct_messages
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: "Message sent.", data: row });
  } catch (error) {
    console.error("Send user message error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error sending message."
    });
  }
});

router.post("/:userId/read", verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserDirectMessagesTable();
    const currentUserId = toPositiveInt(req.user?.id);
    const targetUserId = toPositiveInt(req.params?.userId);
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    await pool.query(
      `
        UPDATE user_direct_messages
        SET is_read = 1
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `,
      [targetUserId, currentUserId]
    );

    return res.json({ success: true, message: "Messages marked as read." });
  } catch (error) {
    console.error("Mark user messages read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error marking messages read."
    });
  }
});

module.exports = router;
