const { pool } = require('../config/database');

class RecruiterNotification {
  constructor(data = {}) {
    this.id = data.id;
    this.recruiterId = data.recruiter_id;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.applicationId = data.application_id;
    this.isRead = Boolean(data.is_read);
    this.createdAt = data.created_at;
  }

  toJSON() {
    return {
      id: this.id,
      recruiterId: this.recruiterId,
      type: this.type,
      title: this.title,
      message: this.message,
      applicationId: this.applicationId,
      isRead: this.isRead,
      createdAt: this.createdAt
    };
  }

  static async create({ recruiterId, type, title, message, applicationId = null }) {
    const query = `
      INSERT INTO recruiter_notifications (
        recruiter_id,
        type,
        title,
        message,
        application_id,
        is_read,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `;
    const values = [recruiterId, type, title, message, applicationId];
    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  static async findByRecruiterId(recruiterId) {
    const query = `
      SELECT *
      FROM recruiter_notifications
      WHERE recruiter_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [recruiterId]);
    return rows.map((row) => new RecruiterNotification(row));
  }

  static async countUnread(recruiterId) {
    const query = `
      SELECT COUNT(*) AS unread_count
      FROM recruiter_notifications
      WHERE recruiter_id = ? AND is_read = 0
    `;
    const [rows] = await pool.execute(query, [recruiterId]);
    return rows[0]?.unread_count || 0;
  }

  static async markAsRead(id, recruiterId) {
    const query = `
      UPDATE recruiter_notifications
      SET is_read = 1
      WHERE id = ? AND recruiter_id = ?
    `;
    const [result] = await pool.execute(query, [id, recruiterId]);
    return result.affectedRows > 0;
  }
}

module.exports = RecruiterNotification;
