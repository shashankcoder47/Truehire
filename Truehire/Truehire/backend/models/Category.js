const { pool } = require('../config/database');

class Category {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.description = data.description;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new category
  static async create(categoryData) {
    const {
      type,
      name,
      description,
      is_active
    } = categoryData;

    const query = `
      INSERT INTO categories (
        type, name, description, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      type,
      name,
      description || null,
      is_active !== undefined ? is_active : true
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find category by ID
  static async findById(id) {
    const query = 'SELECT * FROM categories WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Category(rows[0]) : null;
  }

  // Get all categories
  static async findAll(type = null, activeOnly = false) {
    let query = 'SELECT * FROM categories';
    const values = [];

    const conditions = [];
    if (type) {
      conditions.push('type = ?');
      values.push(type);
    }
    if (activeOnly) {
      conditions.push('is_active = TRUE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY type, name';

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Category(row));
  }

  // Get categories by type
  static async findByType(type) {
    const query = 'SELECT * FROM categories WHERE type = ? AND is_active = TRUE ORDER BY name';
    const [rows] = await pool.execute(query, [type]);
    return rows.map(row => new Category(row));
  }

  // Update category
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete category
  static async delete(id) {
    const query = 'DELETE FROM categories WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id) {
    const query = 'UPDATE categories SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get category statistics
  static async getStats() {
    const query = `
      SELECT
        type,
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive
      FROM categories
      GROUP BY type
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  // Search categories
  static async search(searchTerm, type = null) {
    let query = 'SELECT * FROM categories WHERE name LIKE ?';
    const values = [`%${searchTerm}%`];

    if (type) {
      query += ' AND type = ?';
      values.push(type);
    }

    query += ' ORDER BY name';

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Category(row));
  }

  // Get category JSON
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Category;
