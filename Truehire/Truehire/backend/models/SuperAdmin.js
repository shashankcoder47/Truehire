const { pool } = require('../config/database');

class SuperAdmin {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.status = data.status || 'Active';
    this.last_login = data.last_login;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new super admin
  static async create(superAdminData) {
    const { name, email, password } = superAdminData;
    const query = `
      INSERT INTO super_admins (name, email, password, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [name, email, password]);
    return result.insertId;
  }

  // Find super admin by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM super_admins WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] ? new SuperAdmin(rows[0]) : null;
  }

  // Find super admin by ID
  static async findById(id) {
    const query = 'SELECT * FROM super_admins WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new SuperAdmin(rows[0]) : null;
  }

  // Get all super admins
  static async findAll() {
    const query = 'SELECT id, name, email, status, last_login, created_at FROM super_admins';
    const [rows] = await pool.execute(query);
    return rows.map(row => new SuperAdmin(row));
  }

  // Update super admin
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE super_admins SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Update last login
  static async updateLastLogin(id) {
    try {
      const query = 'UPDATE super_admins SET last_login = NOW() WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      // If last_login column doesn't exist, skip the update
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('last_login')) {
        console.log('Last login column not found, skipping update');
        return true; // Return true to indicate no error
      }
      throw error;
    }
  }

  // Delete super admin
  static async delete(id) {
    const query = 'DELETE FROM super_admins WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Update super admin password
  static async updatePassword(superAdminId, hashedPassword) {
    try {
      const query = 'UPDATE super_admins SET password = ? WHERE id = ?';
      const [result] = await pool.execute(query, [hashedPassword, superAdminId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating super admin password:', error);
      throw error;
    }
  }

  // Get super admin profile (without password)
  toJSON() {
    const { password, ...superAdmin } = this;
    return superAdmin;
  }
}

module.exports = SuperAdmin;
