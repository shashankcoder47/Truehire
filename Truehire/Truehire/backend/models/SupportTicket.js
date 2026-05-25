const { pool } = require('../config/database');

class SupportTicket {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.recruiter_id = data.recruiter_id;
    this.type = data.type;
    this.subject = data.subject;
    this.description = data.description;
    this.status = data.status || 'open';
    this.priority = data.priority || 'medium';
    this.assigned_to = data.assigned_to;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new support ticket
  static async create(ticketData) {
    const {
      user_id,
      recruiter_id,
      type,
      subject,
      description,
      priority
    } = ticketData;

    const query = `
      INSERT INTO support_tickets (
        user_id, recruiter_id, type, subject, description, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      user_id || null,
      recruiter_id || null,
      type,
      subject,
      description,
      priority || 'medium'
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find ticket by ID
  static async findById(id) {
    const query = 'SELECT * FROM support_tickets WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new SupportTicket(rows[0]) : null;
  }

  // Get all tickets (admin only)
  static async findAll(limit = 10, offset = 0, filters = {}) {
    let query = `SELECT st.*, u.name as user_name, u.email as user_email, r.name as recruiter_name, r.email as recruiter_email, a.name as assigned_admin_name FROM support_tickets st LEFT JOIN users u ON st.user_id = u.id LEFT JOIN recruiters r ON st.recruiter_id = r.id LEFT JOIN admins a ON st.assigned_to = a.id`;
    const values = [];

    const conditions = [];
    if (filters.status) {
      conditions.push('st.status = ?');
      values.push(filters.status);
    }
    if (filters.type) {
      conditions.push('st.type = ?');
      values.push(filters.type);
    }
    if (filters.priority) {
      conditions.push('st.priority = ?');
      values.push(filters.priority);
    }
    if (filters.assigned_to !== undefined) {
      if (filters.assigned_to === null) {
        conditions.push('st.assigned_to IS NULL');
      } else {
        conditions.push('st.assigned_to = ?');
        values.push(filters.assigned_to);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY st.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  // Update ticket
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE support_tickets SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Assign ticket to admin
  static async assign(id, adminId) {
    const query = 'UPDATE support_tickets SET assigned_to = ?, status = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, [adminId, 'in_progress', id]);
    return result.affectedRows > 0;
  }

  // Close ticket
  static async close(id) {
    const query = 'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, ['closed', id]);
    return result.affectedRows > 0;
  }

  // Get ticket statistics
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
        COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned_tickets
      FROM support_tickets
    `;
    const [rows] = await pool.execute(query);
    return rows[0];
  }

  // Get tickets by user
  static async findByUser(userId, limit = null, offset = 0) {
    let query = 'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC';
    const values = [userId];

    if (limit !== null) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new SupportTicket(row));
  }

  // Get tickets by recruiter
  static async findByRecruiter(recruiterId, limit = null, offset = 0) {
    let query = 'SELECT * FROM support_tickets WHERE recruiter_id = ? ORDER BY created_at DESC';
    const values = [recruiterId];

    if (limit !== null) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new SupportTicket(row));
  }

  // Get ticket JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      recruiter_id: this.recruiter_id,
      type: this.type,
      subject: this.subject,
      description: this.description,
      status: this.status,
      priority: this.priority,
      assigned_to: this.assigned_to,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = SupportTicket;
