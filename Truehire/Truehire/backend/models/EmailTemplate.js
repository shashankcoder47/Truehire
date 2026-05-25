const { pool } = require('../config/database');

class EmailTemplate {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.subject = data.subject;
    this.body = data.body;
    this.variables = data.variables;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new email template
  static async create(templateData) {
    const {
      name,
      subject,
      body,
      variables,
      is_active
    } = templateData;

    const query = `
      INSERT INTO email_templates (
        name, subject, body, variables, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      name,
      subject,
      body,
      variables ? JSON.stringify(variables) : null,
      is_active !== undefined ? is_active : true
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find template by ID
  static async findById(id) {
    const query = 'SELECT * FROM email_templates WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    if (rows[0]) {
      rows[0].variables = rows[0].variables ? JSON.parse(rows[0].variables) : null;
      return new EmailTemplate(rows[0]);
    }
    return null;
  }

  // Get all templates
  static async findAll(activeOnly = false) {
    let query = 'SELECT * FROM email_templates';
    const values = [];

    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }

    query += ' ORDER BY name';

    const [rows] = await pool.execute(query, values);
    return rows.map(row => {
      row.variables = row.variables ? JSON.parse(row.variables) : null;
      return new EmailTemplate(row);
    });
  }

  // Find template by name
  static async findByName(name) {
    const query = 'SELECT * FROM email_templates WHERE name = ? AND is_active = TRUE';
    const [rows] = await pool.execute(query, [name]);
    if (rows[0]) {
      rows[0].variables = rows[0].variables ? JSON.parse(rows[0].variables) : null;
      return new EmailTemplate(rows[0]);
    }
    return null;
  }

  // Update template
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key === 'variables') {
        fields.push(`${key} = ?`);
        values.push(updateData[key] ? JSON.stringify(updateData[key]) : null);
      } else {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    values.push(id);

    const query = `UPDATE email_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete template
  static async delete(id) {
    const query = 'DELETE FROM email_templates WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id) {
    const query = 'UPDATE email_templates SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Search templates
  static async search(searchTerm) {
    const query = 'SELECT * FROM email_templates WHERE name LIKE ? ORDER BY name';
    const values = [`%${searchTerm}%`];

    const [rows] = await pool.execute(query, values);
    return rows.map(row => {
      row.variables = row.variables ? JSON.parse(row.variables) : null;
      return new EmailTemplate(row);
    });
  }

  // Render template with variables
  render(variables = {}) {
    let subject = this.subject;
    let body = this.body;

    // Replace variables in subject and body
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return {
      subject,
      body
    };
  }

  // Get template JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      subject: this.subject,
      body: this.body,
      variables: this.variables,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = EmailTemplate;
