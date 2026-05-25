const { pool } = require('../config/database');

class Notification {
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // 'email', 'push', 'announcement'
    this.title = data.title;
    this.message = data.message;
    this.recipient_type = data.recipient_type; // 'all', 'users', 'recruiters', 'specific'
    this.recipient_ids = data.recipient_ids ? JSON.parse(data.recipient_ids) : [];
    this.status = data.status || 'draft';
    this.sent_at = data.sent_at;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new notification
  static async create(notificationData) {
    const { type, title, message, recipient_type, recipient_ids, status, created_by } = notificationData;

    const query = `
      INSERT INTO notifications (type, title, message, recipient_type, recipient_ids, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      type,
      title,
      message,
      recipient_type,
      recipient_ids ? JSON.stringify(recipient_ids) : null,
      status || 'draft',
      created_by
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find notification by ID
  static async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Notification(rows[0]) : null;
  }

  // Get all notifications
  static async findAll(limit = null, offset = 0) {
    let query = 'SELECT * FROM notifications ORDER BY created_at DESC';
    const values = [];

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Notification(row));
  }

  // Update notification
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE notifications SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete notification
  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Mark as sent
  static async markAsSent(id) {
    const query = 'UPDATE notifications SET status = ?, sent_at = NOW(), updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, ['sent', id]);
    return result.affectedRows > 0;
  }

  // Get notifications by type
  static async findByType(type, limit = null, offset = 0) {
    let query = 'SELECT * FROM notifications WHERE type = ? ORDER BY created_at DESC';
    const values = [type];

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Notification(row));
  }

  // Get notification statistics
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_notifications,
        COUNT(CASE WHEN type = 'email' THEN 1 END) as email_notifications,
        COUNT(CASE WHEN type = 'announcement' THEN 1 END) as announcement_notifications
      FROM notifications
    `;
    const [rows] = await pool.execute(query);
    return rows[0];
  }

  // Get notification JSON
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      recipient_type: this.recipient_type,
      recipient_ids: this.recipient_ids,
      status: this.status,
      sent_at: this.sent_at,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Notification;
