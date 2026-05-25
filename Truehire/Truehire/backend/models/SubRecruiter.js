const { pool } = require('../config/database');

class SubRecruiter {
  constructor(data) {
    this.id = data.id;
    this.recruiter_id = data.recruiter_id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'sub-recruiter';
    this.status = data.status || 'Active';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Find sub-recruiter by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM sub_recruiters WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] ? new SubRecruiter(rows[0]) : null;
  }

  // Find sub-recruiter by ID
  static async findById(id) {
    const query = 'SELECT * FROM sub_recruiters WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new SubRecruiter(rows[0]) : null;
  }

  // Get sub-recruiter profile (without password)
  toJSON() {
    const { password, ...subRecruiter } = this;
    return subRecruiter;
  }
}

module.exports = SubRecruiter;
