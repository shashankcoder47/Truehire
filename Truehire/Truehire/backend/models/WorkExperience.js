const { pool } = require('../config/database');

class WorkExperience {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.company_name = data.company_name;
    this.job_title = data.job_title;
    this.employment_type = data.employment_type;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.is_current = data.is_current || false;
    this.location = data.location;
    this.job_description = data.job_description;
    this.achievements = data.achievements;
    this.technologies_used = data.technologies_used;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new work experience
  static async create(workData) {
    const query = `
      INSERT INTO work_experience (user_id, company_name, job_title, employment_type, start_date, end_date, is_current, location, job_description, achievements, technologies_used, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [
      workData.user_id,
      workData.company_name,
      workData.job_title,
      workData.employment_type,
      workData.start_date,
      workData.end_date,
      workData.is_current || false,
      workData.location,
      workData.job_description,
      workData.achievements,
      workData.technologies_used
    ]);
    return result.insertId;
  }

  // Get all work experiences for a user
  static async findByUserId(userId) {
    const query = 'SELECT * FROM work_experience WHERE user_id = ? ORDER BY start_date DESC';
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new WorkExperience(row));
  }

  // Update work experience
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE work_experience SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete work experience
  static async delete(id) {
    const query = 'DELETE FROM work_experience WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get work experience by ID
  static async findById(id) {
    const query = 'SELECT * FROM work_experience WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new WorkExperience(rows[0]) : null;
  }
}

module.exports = WorkExperience;
