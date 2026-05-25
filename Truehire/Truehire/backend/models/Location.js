const { pool } = require('../config/database');

class Location {
  constructor(data) {
    this.id = data.id;
    this.country = data.country;
    this.state = data.state;
    this.city = data.city;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new location
  static async create(locationData) {
    const {
      country,
      state,
      city,
      is_active
    } = locationData;

    const query = `
      INSERT INTO locations (
        country, state, city, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      country,
      state || null,
      city,
      is_active !== undefined ? is_active : true
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find location by ID
  static async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Location(rows[0]) : null;
  }

  // Get all locations
  static async findAll(activeOnly = false, country = null) {
    let query = 'SELECT * FROM locations';
    const values = [];

    const conditions = [];
    if (activeOnly) {
      conditions.push('is_active = TRUE');
    }
    if (country) {
      conditions.push('country = ?');
      values.push(country);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY country, state, city';

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Location(row));
  }

  // Get locations by country
  static async findByCountry(country) {
    const query = 'SELECT * FROM locations WHERE country = ? AND is_active = TRUE ORDER BY state, city';
    const [rows] = await pool.execute(query, [country]);
    return rows.map(row => new Location(row));
  }

  // Get unique countries
  static async getCountries() {
    const query = 'SELECT DISTINCT country FROM locations WHERE is_active = TRUE ORDER BY country';
    const [rows] = await pool.execute(query);
    return rows.map(row => row.country);
  }

  // Update location
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE locations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete location
  static async delete(id) {
    const query = 'DELETE FROM locations WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id) {
    const query = 'UPDATE locations SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Search locations
  static async search(searchTerm) {
    const query = `
      SELECT * FROM locations
      WHERE (city LIKE ? OR state LIKE ? OR country LIKE ?) AND is_active = TRUE
      ORDER BY country, state, city
    `;
    const searchPattern = `%${searchTerm}%`;
    const values = [searchPattern, searchPattern, searchPattern];

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Location(row));
  }

  // Get location statistics
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_locations,
        COUNT(DISTINCT country) as total_countries,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_locations,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_locations
      FROM locations
    `;
    const [rows] = await pool.execute(query);
    return rows[0];
  }

  // Get location JSON
  toJSON() {
    return {
      id: this.id,
      country: this.country,
      state: this.state,
      city: this.city,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Location;
