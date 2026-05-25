const { pool } = require('../config/database');

class ResetToken {
  static async create({ token, userId, userType, email }) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const query = `
      INSERT INTO reset_tokens (token, user_id, user_type, email, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [token, userId, userType, email, expiresAt];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Error creating reset token:', error);
      throw error;
    }
  }

  static async findValid(token) {
    const query = `
      SELECT * FROM reset_tokens
      WHERE token = ? AND expires_at > NOW()
    `;

    try {
      const [rows] = await pool.execute(query, [token]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding reset token:', error);
      throw error;
    }
  }

  static async findOne({ token, userId, userType, expiresAt }) {
    const query = `
      SELECT * FROM reset_tokens
      WHERE token = ? AND user_id = ? AND user_type = ? AND expires_at > ?
    `;

    try {
      const [rows] = await pool.execute(query, [token, userId, userType, expiresAt]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding reset token:', error);
      throw error;
    }
  }

  static async delete(token) {
    const query = 'DELETE FROM reset_tokens WHERE token = ?';

    try {
      await pool.execute(query, [token]);
    } catch (error) {
      console.error('Error deleting reset token:', error);
      throw error;
    }
  }

  static async deleteExpired() {
    const query = 'DELETE FROM reset_tokens WHERE expires_at <= NOW()';

    try {
      await pool.execute(query);
    } catch (error) {
      console.error('Error deleting expired tokens:', error);
      throw error;
    }
  }
}

module.exports = ResetToken;
