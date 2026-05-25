const { pool } = require("../config/database");

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const buildPairKey = (firstUserId, secondUserId) => {
  const a = Number(firstUserId);
  const b = Number(secondUserId);
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return `${low}:${high}`;
};

const ensureConnectionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_connections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sender_id (sender_id),
      INDEX idx_receiver_id (receiver_id),
      INDEX idx_status (status)
    )
  `);
};

const userExists = async (userId) => {
  const [[row]] = await pool.query("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  return Boolean(row);
};

exports.sendConnectionRequest = async (req, res) => {
  try {
    await ensureConnectionsTable();

    const senderId = toPositiveInt(req.user?.id);
    const receiverId = toPositiveInt(
      req.body?.receiver_id ?? req.body?.receiverId ?? req.body?.userId
    );

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Valid receiver_id is required."
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a connection request to yourself."
      });
    }

    const receiverFound = await userExists(receiverId);
    if (!receiverFound) {
      return res.status(404).json({
        success: false,
        message: "Receiver user not found."
      });
    }

    const [[existingConnection]] = await pool.query(
      `
        SELECT id, sender_id, receiver_id, status
        FROM user_connections
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY id DESC
        LIMIT 1
      `,
      [senderId, receiverId, receiverId, senderId]
    );

    if (existingConnection) {
      const normalizedExistingStatus = String(existingConnection.status || "").toLowerCase();

      if (normalizedExistingStatus === "accepted") {
        return res.status(409).json({
          success: false,
          message: "You are already connected with this user."
        });
      }

      if (normalizedExistingStatus === "pending") {
        return res.status(409).json({
          success: false,
          message: "A connection request is already pending."
        });
      }

      return res.status(409).json({
        success: false,
        message: "Duplicate connection request is not allowed."
      });
    }

    let insertResult;
    const pairKey = buildPairKey(senderId, receiverId);
    try {
      const [result] = await pool.query(
        `
          INSERT INTO user_connections (sender_id, receiver_id, status, pair_key)
          VALUES (?, ?, 'pending', ?)
        `,
        [senderId, receiverId, pairKey]
      );
      insertResult = result;
    } catch (insertError) {
      // Support deployments where existing schema has status enum case variants/defaults.
      if (insertError.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
        const [fallbackResult] = await pool.query(
          `
            INSERT INTO user_connections (sender_id, receiver_id, pair_key)
            VALUES (?, ?, ?)
          `,
          [senderId, receiverId, pairKey]
        );
        insertResult = fallbackResult;
      } else {
        throw insertError;
      }
    }

    return res.status(201).json({
      success: true,
      message: "Connection request sent successfully.",
      data: {
        id: insertResult.insertId,
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending"
      }
    });
  } catch (error) {
    console.error("sendConnectionRequest error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A connection request already exists for this user pair."
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while sending connection request.",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
      code: process.env.NODE_ENV !== "production" ? error.code : undefined
    });
  }
};

exports.acceptConnectionRequest = async (req, res) => {
  try {
    await ensureConnectionsTable();

    const requestId = toPositiveInt(req.params?.id);
    const currentUserId = toPositiveInt(req.user?.id);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Valid connection request id is required."
      });
    }

    const [[requestRow]] = await pool.query(
      "SELECT id, sender_id, receiver_id, status FROM user_connections WHERE id = ? LIMIT 1",
      [requestId]
    );

    if (!requestRow) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found."
      });
    }

    if (Number(requestRow.receiver_id) !== Number(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can accept this request."
      });
    }

    const normalizedStatus = String(requestRow.status || "").toLowerCase();
    if (normalizedStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This request is already ${normalizedStatus || requestRow.status}.`
      });
    }

    await pool.query("UPDATE user_connections SET status = 'accepted' WHERE id = ?", [requestId]);

    return res.json({
      success: true,
      message: "Connection request accepted.",
      data: {
        id: requestRow.id,
        sender_id: requestRow.sender_id,
        receiver_id: requestRow.receiver_id,
        status: "accepted"
      }
    });
  } catch (error) {
    console.error("acceptConnectionRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while accepting connection request."
    });
  }
};

exports.rejectConnectionRequest = async (req, res) => {
  try {
    await ensureConnectionsTable();

    const requestId = toPositiveInt(req.params?.id);
    const currentUserId = toPositiveInt(req.user?.id);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Valid connection request id is required."
      });
    }

    const [[requestRow]] = await pool.query(
      "SELECT id, sender_id, receiver_id, status FROM user_connections WHERE id = ? LIMIT 1",
      [requestId]
    );

    if (!requestRow) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found."
      });
    }

    if (Number(requestRow.receiver_id) !== Number(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can reject this request."
      });
    }

    const normalizedStatus = String(requestRow.status || "").toLowerCase();
    if (normalizedStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This request is already ${normalizedStatus || requestRow.status}.`
      });
    }

    await pool.query("UPDATE user_connections SET status = 'rejected' WHERE id = ?", [requestId]);

    return res.json({
      success: true,
      message: "Connection request rejected.",
      data: {
        id: requestRow.id,
        sender_id: requestRow.sender_id,
        receiver_id: requestRow.receiver_id,
        status: "rejected"
      }
    });
  } catch (error) {
    console.error("rejectConnectionRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting connection request."
    });
  }
};

exports.getUserConnections = async (req, res) => {
  try {
    await ensureConnectionsTable();

    const currentUserId = toPositiveInt(req.user?.id);
    const [rows] = await pool.query(
      `
        SELECT
          uc.id,
          uc.status,
          uc.created_at,
          CASE WHEN uc.sender_id = ? THEN uc.receiver_id ELSE uc.sender_id END AS user_id,
          u.name,
          u.email
        FROM user_connections uc
        INNER JOIN users u
          ON u.id = CASE WHEN uc.sender_id = ? THEN uc.receiver_id ELSE uc.sender_id END
        WHERE (uc.sender_id = ? OR uc.receiver_id = ?)
          AND LOWER(uc.status) = 'accepted'
        ORDER BY uc.created_at DESC
      `,
      [currentUserId, currentUserId, currentUserId, currentUserId]
    );

    return res.json({
      success: true,
      message: "Connections fetched successfully.",
      data: rows
    });
  } catch (error) {
    console.error("getUserConnections error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user connections."
    });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    await ensureConnectionsTable();

    const currentUserId = toPositiveInt(req.user?.id);
    const [rows] = await pool.query(
      `
        SELECT
          uc.id,
          uc.sender_id,
          uc.receiver_id,
          uc.status,
          uc.created_at,
          u.name AS sender_name,
          u.email AS sender_email
        FROM user_connections uc
        INNER JOIN users u ON u.id = uc.sender_id
        WHERE uc.receiver_id = ?
          AND LOWER(uc.status) = 'pending'
        ORDER BY uc.created_at DESC
      `,
      [currentUserId]
    );

    return res.json({
      success: true,
      message: "Pending connection requests fetched successfully.",
      data: rows
    });
  } catch (error) {
    console.error("getPendingRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching pending requests."
    });
  }
};

exports.getConnectionStatus = async (req, res) => {
  try {
    await ensureConnectionsTable();

    const currentUserId = toPositiveInt(req.user?.id);
    const targetUserId = toPositiveInt(req.params?.userId);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Valid target user id is required."
      });
    }

    if (Number(currentUserId) === Number(targetUserId)) {
      return res.json({
        success: true,
        message: "Connection status fetched successfully.",
        data: { status: "self", requestId: null }
      });
    }

    const [[row]] = await pool.query(
      `
        SELECT id, sender_id, receiver_id, status
        FROM user_connections
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY id DESC
        LIMIT 1
      `,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (!row) {
      return res.json({
        success: true,
        message: "Connection status fetched successfully.",
        data: { status: "none", requestId: null }
      });
    }

    let normalizedStatus = String(row.status || "").toLowerCase();
    if (normalizedStatus === "accepted") {
      normalizedStatus = "connected";
    } else if (normalizedStatus === "pending") {
      normalizedStatus =
        Number(row.sender_id) === Number(currentUserId)
          ? "pending_outgoing"
          : "pending_incoming";
    }

    return res.json({
      success: true,
      message: "Connection status fetched successfully.",
      data: {
        status: normalizedStatus,
        requestId: row.id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id
      }
    });
  } catch (error) {
    console.error("getConnectionStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching connection status."
    });
  }
};
