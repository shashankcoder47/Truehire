const { pool } = require('../config/database');

class Payment {
  constructor(data) {
    this.id = data.id;
    this.recruiter_id = data.recruiter_id;
    this.plan_id = data.plan_id;
    this.amount = data.amount;
    this.currency = data.currency || 'USD';
    this.payment_method = data.payment_method;
    this.transaction_id = data.transaction_id;
    this.status = data.status || 'pending';
    this.description = data.description;
    this.invoice_url = data.invoice_url;
    this.paid_at = data.paid_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new payment
  static async create(paymentData) {
    const {
      recruiter_id,
      plan_id,
      amount,
      currency,
      payment_method,
      transaction_id,
      status,
      description
    } = paymentData;

    const query = `
      INSERT INTO payments (
        recruiter_id, plan_id, amount, currency, payment_method,
        transaction_id, status, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      recruiter_id,
      plan_id,
      amount,
      currency || 'USD',
      payment_method,
      transaction_id,
      status || 'pending',
      description
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  // Find payment by ID
  static async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Payment(rows[0]) : null;
  }

  // Get payments by recruiter
  static async findByRecruiter(recruiterId, limit = null, offset = 0) {
    let query = 'SELECT * FROM payments WHERE recruiter_id = ? ORDER BY created_at DESC';
    const values = [recruiterId];

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Payment(row));
  }

  // Get all payments
  static async findAll(limit = null, offset = 0) {
    let query = 'SELECT * FROM payments ORDER BY created_at DESC';
    const values = [];

    if (limit !== null) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Payment(row));
  }

  // Update payment
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE payments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Mark payment as completed
  static async markAsCompleted(id, transactionId = null) {
    const query = 'UPDATE payments SET status = ?, paid_at = NOW(), transaction_id = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await pool.execute(query, ['completed', transactionId, id]);
    return result.affectedRows > 0;
  }

  // Get payment statistics
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        AVG(amount) as average_payment
      FROM payments
    `;
    const [rows] = await pool.execute(query);
    return rows[0];
  }

  // Get payments by date range
  static async findByDateRange(startDate, endDate) {
    const query = 'SELECT * FROM payments WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, [startDate, endDate]);
    return rows.map(row => new Payment(row));
  }

  // Get payment JSON
  toJSON() {
    return {
      id: this.id,
      recruiter_id: this.recruiter_id,
      plan_id: this.plan_id,
      amount: this.amount,
      currency: this.currency,
      payment_method: this.payment_method,
      transaction_id: this.transaction_id,
      status: this.status,
      description: this.description,
      invoice_url: this.invoice_url,
      paid_at: this.paid_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Payment;
