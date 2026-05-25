const { pool } = require('../config/database');

class UserNotification {
  static statusCache = {
    loadedAt: 0,
    unread: 'unread',
    read: 'read'
  };

  static async getStatusValues() {
    const now = Date.now();
    if (now - UserNotification.statusCache.loadedAt < 60 * 1000) {
      return UserNotification.statusCache;
    }

    try {
      const [rows] = await pool.execute(
        `
          SELECT COLUMN_TYPE
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'user_notifications'
            AND COLUMN_NAME = 'status'
          LIMIT 1
        `
      );
      const columnType = rows?.[0]?.COLUMN_TYPE || '';
      const match = String(columnType).match(/^enum\((.*)\)$/i);
      const values = match?.[1]
        ? match[1].split(',').map((s) => s.trim().replace(/^'/, '').replace(/'$/, ''))
        : [];

      const byToken = new Map(values.map((value) => [
        String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        value
      ]));
      const unread = byToken.get('UNREAD') || values[0] || 'unread';
      const read = byToken.get('READ') || values[Math.min(1, values.length - 1)] || 'read';

      UserNotification.statusCache = { loadedAt: now, unread, read };
      return UserNotification.statusCache;
    } catch (_) {
      return UserNotification.statusCache;
    }
  }

  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id;
    this.applicationId = data.application_id;
    this.message = data.message;
    this.metadata = this.parseMetadata(data.metadata);
    this.status = data.status;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  parseMetadata(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      applicationId: this.applicationId,
      message: this.message,
      metadata: this.metadata,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static async create({ userId, applicationId = null, message, metadata = null }) {
    const statusValues = await UserNotification.getStatusValues();
    const query = `
      INSERT INTO user_notifications (user_id, application_id, message, metadata, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      userId,
      applicationId,
      message,
      metadata ? JSON.stringify(metadata) : null,
      statusValues.unread
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      if (error?.code !== 'ER_NO_REFERENCED_ROW_2') {
        throw error;
      }

      // Some deployments link user_notifications.application_id to a different table.
      // Retry without application_id to avoid breaking primary message flow.
      const fallbackValues = [
        userId,
        null,
        message,
        metadata ? JSON.stringify(metadata) : null,
        statusValues.unread
      ];
      const [fallbackResult] = await pool.execute(query, fallbackValues);
      return fallbackResult.insertId;
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT *
      FROM user_notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new UserNotification(row));
  }

  static async countUnread(userId) {
    const statusValues = await UserNotification.getStatusValues();
    const query = `
      SELECT COUNT(*) AS unread_count
      FROM user_notifications
      WHERE user_id = ? AND status = ?
    `;
    const [rows] = await pool.execute(query, [userId, statusValues.unread]);
    return rows[0]?.unread_count || 0;
  }

  static async markAsRead(id, userId) {
    const statusValues = await UserNotification.getStatusValues();
    const query = `
      UPDATE user_notifications
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await pool.execute(query, [statusValues.read, id, userId]);
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId) {
    const statusValues = await UserNotification.getStatusValues();
    const query = `
      UPDATE user_notifications
      SET status = ?, updated_at = NOW()
      WHERE user_id = ? AND status = ?
    `;
    const [result] = await pool.execute(query, [statusValues.read, userId, statusValues.unread]);
    return result.affectedRows;
  }

  static async deleteAllForUser(userId) {
    const query = `
      DELETE FROM user_notifications
      WHERE user_id = ?
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows;
  }
}

module.exports = UserNotification;
