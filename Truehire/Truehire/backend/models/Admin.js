const { pool } = require('../config/database');

class Admin {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'admin';
    this.status = data.status || 'Active';
    this.last_login = data.last_login;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new admin
  static async create(adminData) {
    const { name, email, password, role = 'admin' } = adminData;
    const query = `
      INSERT INTO admins (name, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [name, email, password, role]);
    return result.insertId;
  }

  // Find admin by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM admins WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] ? new Admin(rows[0]) : null;
  }

  // Find admin by ID
  static async findById(id) {
    const query = 'SELECT * FROM admins WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Admin(rows[0]) : null;
  }

  // Get all admins
  static async findAll() {
    const query = 'SELECT id, name, email, role, status, last_login, created_at FROM admins';
    const [rows] = await pool.execute(query);
    return rows.map(row => new Admin(row));
  }

  // Update admin
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE admins SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Update last login
  static async updateLastLogin(id) {
    try {
      const query = 'UPDATE admins SET last_login = NOW() WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      // If last_login column doesn't exist, skip the update
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('last_login')) {
        console.log('Last login column not found, skipping update');
        return true; // Return true to indicate no error
      }
      throw error; // Re-throw other errors
    }
  }

  // Delete admin
  static async delete(id) {
    const query = 'DELETE FROM admins WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Update admin password
  static async updatePassword(adminId, hashedPassword) {
    try {
      const query = 'UPDATE admins SET password = ? WHERE id = ?';
      const [result] = await pool.execute(query, [hashedPassword, adminId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating admin password:', error);
      throw error;
    }
  }

  // Get admin profile (without password)
  toJSON() {
    const { password, ...admin } = this;
    return admin;
  }
}

module.exports = Admin;
