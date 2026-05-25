const { pool } = require('../config/database');

class SMSSettings {
  constructor(data) {
    this.id = data.id;
    this.provider = data.provider;
    this.api_key = data.api_key;
    this.api_secret = data.api_secret;
    this.sender_id = data.sender_id;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new SMS settings
  static async create(settingsData) {
    const {
      provider,
      api_key,
      api_secret,
      sender_id,
      is_active
    } = settingsData;

    const query = `
      INSERT INTO sms_settings (
        provider, api_key, api_secret, sender_id, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      provider,
      api_key,
      api_secret || null,
      sender_id || null,
      is_active !== undefined ? is_active : true
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find settings by ID
  static async findById(id) {
    const query = 'SELECT * FROM sms_settings WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new SMSSettings(rows[0]) : null;
  }

  // Get active settings
  static async getActive() {
    const query = 'SELECT * FROM sms_settings WHERE is_active = TRUE LIMIT 1';
    const [rows] = await pool.execute(query);
    return rows[0] ? new SMSSettings(rows[0]) : null;
  }

  // Get all settings
  static async findAll() {
    const query = 'SELECT * FROM sms_settings ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows.map(row => new SMSSettings(row));
  }

  // Update settings
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE sms_settings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete settings
  static async delete(id) {
    const query = 'DELETE FROM sms_settings WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id) {
    const query = 'UPDATE sms_settings SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Set as active (deactivate others)
  static async setActive(id) {
    // First, deactivate all settings
    await pool.execute('UPDATE sms_settings SET is_active = FALSE, updated_at = NOW()');

    // Then activate the specified one
    const query = 'UPDATE sms_settings SET is_active = TRUE, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Test SMS sending (placeholder - implement based on provider)
  async testSMS(phoneNumber, message) {
    // This would implement actual SMS sending logic based on the provider
    // For now, just return a mock response
    console.log(`Testing SMS to ${phoneNumber}: ${message}`);

    // Mock implementation - replace with actual provider API calls
    switch (this.provider.toLowerCase()) {
      case 'twilio':
        // Implement Twilio SMS sending
        return { success: true, message: 'SMS sent via Twilio' };

      case 'aws-sns':
        // Implement AWS SNS SMS sending
        return { success: true, message: 'SMS sent via AWS SNS' };

      case 'nexmo':
        // Implement Nexmo SMS sending
        return { success: true, message: 'SMS sent via Nexmo' };

      default:
        return { success: false, message: 'Unknown provider' };
    }
  }

  // Get settings JSON (without sensitive data)
  toJSON() {
    return {
      id: this.id,
      provider: this.provider,
      sender_id: this.sender_id,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Get full settings JSON (with sensitive data - admin only)
  toFullJSON() {
    return {
      id: this.id,
      provider: this.provider,
      api_key: this.api_key,
      api_secret: this.api_secret,
      sender_id: this.sender_id,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = SMSSettings;
