const { pool } = require('../config/database');

class Resume {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.file_name = data.file_name;
    this.file_path = data.file_path;
    this.file_size = data.file_size;
    this.file_type = data.file_type;
    this.visibility = data.visibility || 'private';
    this.download_count = data.download_count || 0;
    this.is_featured = data.is_featured || false;
    this.flagged = data.flagged || false;
    this.flag_reason = data.flag_reason;
    this.uploaded_at = data.uploaded_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new resume
  static async create(resumeData) {
    const {
      user_id,
      file_name,
      file_path,
      file_size,
      file_type,
      visibility
    } = resumeData;

    const query = `
      INSERT INTO resumes (
        user_id, file_name, file_path, file_size, file_type,
        visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      user_id,
      file_name,
      file_path,
      file_size,
      file_type,
      visibility || 'private'
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find resume by ID
  static async findById(id) {
    const query = 'SELECT * FROM resumes WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Resume(rows[0]) : null;
  }

  // Get resumes by user
  static async findByUser(userId) {
    const query = 'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new Resume(row));
  }

  // Get all resumes (admin only)
  static async findAll(limit = null, offset = 0) {
    let query = `
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM resumes r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    const values = [];

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Resume(row));
  }

  // Search resumes
  static async search(searchTerm, filters = {}, limit = null, offset = 0) {
    let query = `
      SELECT r.*, u.name as user_name, u.email as user_email, u.core_skills, u.secondary_skills
      FROM resumes r
      JOIN users u ON r.user_id = u.id
      WHERE r.flagged = FALSE
    `;
    const values = [];

    if (searchTerm) {
      query += ` AND (
        u.name LIKE ? OR
        u.email LIKE ? OR
        u.core_skills LIKE ? OR
        u.secondary_skills LIKE ? OR
        r.file_name LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      values.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (filters.visibility) {
      query += ' AND r.visibility = ?';
      values.push(filters.visibility);
    }

    if (filters.file_type) {
      query += ' AND r.file_type = ?';
      values.push(filters.file_type);
    }

    if (filters.flagged !== undefined) {
      query += ' AND r.flagged = ?';
      values.push(filters.flagged);
    }

    query += ' ORDER BY r.created_at DESC';

    if (limit !== null) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Resume(row));
  }

  // Update resume
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE resumes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete resume
  static async delete(id) {
    const query = 'DELETE FROM resumes WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Flag resume
  static async flag(id, reason) {
    const query = 'UPDATE resumes SET flagged = TRUE, flag_reason = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [reason, id]);
    return result.affectedRows > 0;
  }

  // Unflag resume
  static async unflag(id) {
    const query = 'UPDATE resumes SET flagged = FALSE, flag_reason = NULL, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Increment download count
  static async incrementDownloadCount(id) {
    const query = 'UPDATE resumes SET download_count = download_count + 1, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get resume statistics
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_resumes,
        COUNT(CASE WHEN visibility = 'public' THEN 1 END) as public_resumes,
        COUNT(CASE WHEN flagged = TRUE THEN 1 END) as flagged_resumes,
        SUM(download_count) as total_downloads,
        COUNT(DISTINCT user_id) as unique_users
      FROM resumes
    `;
    const [rows] = await pool.execute(query);
    return rows[0];
  }

  // Get resume JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      file_name: this.file_name,
      file_path: this.file_path,
      file_size: this.file_size,
      file_type: this.file_type,
      visibility: this.visibility,
      download_count: this.download_count,
      is_featured: this.is_featured,
      flagged: this.flagged,
      flag_reason: this.flag_reason,
      uploaded_at: this.uploaded_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Resume;
