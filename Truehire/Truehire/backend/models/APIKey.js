const { pool } = require('../config/database');
const crypto = require('crypto');

class APIKey {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.api_key = data.api_key;
    this.api_secret = data.api_secret;
    this.permissions = data.permissions;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Generate API key and secret
  static generateCredentials() {
    const apiKey = 'tk_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');
    return { apiKey, apiSecret };
  }

  // Create a new API key
  static async create(keyData) {
    const {
      name,
      permissions,
      is_active
    } = keyData;

    const { apiKey, apiSecret } = this.generateCredentials();

    const query = `
      INSERT INTO api_keys (
        name, api_key, api_secret, permissions, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      name,
      apiKey,
      apiSecret,
      permissions ? JSON.stringify(permissions) : JSON.stringify(['read']),
      is_active !== undefined ? is_active : true
    ];

    const [result] = await pool.execute(query, values);
    return {
      id: result.insertId,
      api_key: apiKey,
      api_secret: apiSecret
    };
  }

  // Find key by API key
  static async findByKey(apiKey) {
    const query = 'SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE';
    const [rows] = await pool.execute(query, [apiKey]);
    if (rows[0]) {
      rows[0].permissions = rows[0].permissions ? JSON.parse(rows[0].permissions) : [];
      return new APIKey(rows[0]);
    }
    return null;
  }

  // Find key by ID
  static async findById(id) {
    const query = 'SELECT * FROM api_keys WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    if (rows[0]) {
      rows[0].permissions = rows[0].permissions ? JSON.parse(rows[0].permissions) : [];
      return new APIKey(rows[0]);
    }
    return null;
  }

  // Get all API keys
  static async findAll() {
    const query = 'SELECT * FROM api_keys ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows.map(row => {
      row.permissions = row.permissions ? JSON.parse(row.permissions) : [];
      return new APIKey(row);
    });
  }

  // Update API key
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key === 'permissions') {
        fields.push(`${key} = ?`);
        values.push(updateData[key] ? JSON.stringify(updateData[key]) : JSON.stringify([]));
      } else {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    values.push(id);

    const query = `UPDATE api_keys SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete API key
  static async delete(id) {
    const query = 'DELETE FROM api_keys WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id) {
    const query = 'UPDATE api_keys SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Regenerate secret
  static async regenerateSecret(id) {
    const newSecret = crypto.randomBytes(32).toString('hex');
    const query = 'UPDATE api_keys SET api_secret = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [newSecret, id]);
    return result.affectedRows > 0 ? newSecret : null;
  }

  // Validate permissions
  hasPermission(permission) {
    return this.permissions && this.permissions.includes(permission);
  }

  // Check if key has any of the required permissions
  hasAnyPermission(requiredPermissions) {
    if (!this.permissions) return false;
    return requiredPermissions.some(perm => this.permissions.includes(perm));
  }

  // Get key JSON (without secret)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      api_key: this.api_key,
      permissions: this.permissions,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Get full key JSON (with secret - admin only)
  toFullJSON() {
    return {
      id: this.id,
      name: this.name,
      api_key: this.api_key,
      api_secret: this.api_secret,
      permissions: this.permissions,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = APIKey;
