const { pool } = require('../config/database');

class Project {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.description = data.description;
    this.technologies_used = data.technologies_used;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.role_responsibility = data.role_responsibility;
    this.achievements = data.achievements;
    this.github_link = data.github_link;
    this.live_link = data.live_link;
    this.screenshots = data.screenshots;
    this.is_featured = data.is_featured || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new project
  static async create(projectData) {
    const query = `
      INSERT INTO projects (user_id, title, description, technologies_used, start_date, end_date, role_responsibility, achievements, github_link, live_link, screenshots, is_featured, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [
      projectData.user_id,
      projectData.title,
      projectData.description,
      projectData.technologies_used,
      projectData.start_date,
      projectData.end_date,
      projectData.role_responsibility,
      projectData.achievements,
      projectData.github_link,
      projectData.live_link,
      projectData.screenshots,
      projectData.is_featured || false
    ]);
    return result.insertId;
  }

  // Get all projects for a user
  static async findByUserId(userId) {
    const query = 'SELECT * FROM projects WHERE user_id = ? ORDER BY start_date DESC';
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new Project(row));
  }

  // Update project
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete project
  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get project by ID
  static async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Project(rows[0]) : null;
  }

  // Get featured projects for a user
  static async findFeaturedByUserId(userId) {
    const query = 'SELECT * FROM projects WHERE user_id = ? AND is_featured = true ORDER BY start_date DESC';
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new Project(row));
  }
}

module.exports = Project;
