const { pool } = require('../config/database');

class Education {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.qualification = data.qualification;
    this.degree = data.degree;
    this.field_of_study = data.field_of_study;
    this.college_name = data.college_name;
    this.year_of_passing = data.year_of_passing;
    this.percentage = data.percentage;
    this.cgpa = data.cgpa;
    this.certificate_file = data.certificate_file;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new education
  static async create(educationData) {
    const query = `
      INSERT INTO education (user_id, qualification, degree, field_of_study, college_name, year_of_passing, percentage, cgpa, certificate_file, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [
      educationData.user_id,
      educationData.qualification,
      educationData.degree,
      educationData.field_of_study,
      educationData.college_name,
      educationData.year_of_passing,
      educationData.percentage,
      educationData.cgpa,
      educationData.certificate_file
    ]);
    return result.insertId;
  }

  // Get all education for a user
  static async findByUserId(userId) {
    const query = 'SELECT * FROM education WHERE user_id = ? ORDER BY year_of_passing DESC';
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new Education(row));
  }

  // Update education
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE education SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete education
  static async delete(id) {
    const query = 'DELETE FROM education WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get education by ID
  static async findById(id) {
    const query = 'SELECT * FROM education WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Education(rows[0]) : null;
  }
}

module.exports = Education;
