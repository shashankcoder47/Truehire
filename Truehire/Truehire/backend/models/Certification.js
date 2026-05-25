const { pool } = require('../config/database');

class Certification {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name || data.certification_name;
    this.issuing_organization = data.issuing_organization;
    this.issue_date = data.issue_date;
    this.expiry_date = data.expiry_date;
    this.credential_id = data.credential_id;
    this.credential_url = data.credential_url;
    this.certificate_file = data.certificate_file;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new certification
  static async create(certificationData) {
    const query = `
      INSERT INTO certifications (user_id, certification_name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [
      certificationData.user_id,
      certificationData.name,
      certificationData.issuing_organization,
      certificationData.issue_date,
      certificationData.expiry_date,
      certificationData.credential_id,
      certificationData.credential_url
    ]);
    return result.insertId;
  }

  // Get all certifications for a user
  static async findByUserId(userId) {
    const query = 'SELECT * FROM certifications WHERE user_id = ? ORDER BY issue_date DESC';
    const [rows] = await pool.execute(query, [userId]);
    return rows.map(row => new Certification(row));
  }

  // Update certification
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      if (key === 'name') {
        fields.push('certification_name = ?');
        values.push(updateData[key]);
      } else {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    values.push(id);

    const query = `UPDATE certifications SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete certification
  static async delete(id) {
    const query = 'DELETE FROM certifications WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get certification by ID
  static async findById(id) {
    const query = 'SELECT * FROM certifications WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Certification(rows[0]) : null;
  }
}

module.exports = Certification;
