const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const User = require('../models/User');
const Recruiter = require('../models/Recruiter');
const Job = require('../models/Job');
// const Notification = require('../models/Notification');
// const Payment = require('../models/Payment');
// const Resume = require('../models/Resume');
const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const FRONTEND_URL = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');

async function cleanupUserOwnedSocialData(connection, userId) {
  await connection.execute('DELETE FROM post_comment_likes WHERE user_id = ? AND author_role = ?', [userId, 'USER']);
  await connection.execute('DELETE FROM post_comments WHERE user_id = ? AND author_role = ?', [userId, 'USER']);
  await connection.execute('DELETE FROM company_post_views WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM post_likes WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM company_followers WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM company_network WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM company_status_views WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM pulse_updates WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM weekly_job_alert_logs WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM user_direct_messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
  await connection.execute('DELETE FROM favourite_notifications WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM job_recommendation_emails WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM work_experience WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM education WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM support_tickets WHERE user_id = ?', [userId]);
  await connection.execute('DELETE FROM job_views WHERE user_id = ?', [userId]);
  await connection.execute(
    'DELETE FROM user_post_comment_likes WHERE user_id = ? OR comment_id IN (SELECT id FROM user_post_comments WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?))',
    [userId, userId, userId]
  );
  await connection.execute(
    'DELETE FROM user_post_comments WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    [userId, userId]
  );
  await connection.execute(
    'DELETE FROM user_post_likes WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    [userId, userId]
  );
  await connection.execute(
    'DELETE FROM user_post_shares WHERE user_id = ? OR post_id IN (SELECT id FROM user_posts WHERE user_id = ?)',
    [userId, userId]
  );
  await connection.execute('DELETE FROM user_post_media WHERE post_id IN (SELECT id FROM user_posts WHERE user_id = ?)', [userId]);
  await connection.execute('DELETE FROM user_posts WHERE user_id = ?', [userId]);
  await connection.execute(
    'DELETE FROM user_direct_conversation_messages WHERE sender_id = ? OR receiver_id = ? OR conversation_id IN (SELECT id FROM user_direct_conversations WHERE user1_id = ? OR user2_id = ?)',
    [userId, userId, userId, userId]
  );
  await connection.execute('DELETE FROM user_direct_conversations WHERE user1_id = ? OR user2_id = ?', [userId, userId]);
}

async function cleanupRecruiterOwnedSocialData(connection, recruiterId) {
  await connection.execute('DELETE FROM post_comment_likes WHERE user_id = ? AND author_role = ?', [recruiterId, 'RECRUITER']);
  await connection.execute('DELETE FROM post_comments WHERE user_id = ? AND author_role = ?', [recruiterId, 'RECRUITER']);
  await connection.execute('DELETE FROM company_status_views WHERE status_id IN (SELECT id FROM company_statuses WHERE recruiter_id = ? OR company_id = ?)', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM company_statuses WHERE recruiter_id = ? OR company_id = ?', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM company_post_views WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM post_likes WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?))', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM post_comments WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM company_post_media WHERE post_id IN (SELECT id FROM company_posts WHERE recruiter_id = ? OR company_id = ?)', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM company_posts WHERE recruiter_id = ? OR company_id = ?', [recruiterId, recruiterId]);
  await connection.execute('DELETE FROM company_followers WHERE company_id = ?', [recruiterId]);
  await connection.execute('DELETE FROM company_network WHERE company_id = ?', [recruiterId]);
  await connection.execute('DELETE FROM saved_companies WHERE company_id = ?', [recruiterId]);
  await connection.execute('DELETE FROM favourite_companies WHERE company_id = ?', [recruiterId]);
  await connection.execute('DELETE FROM support_tickets WHERE recruiter_id = ?', [recruiterId]);
  await connection.execute('DELETE FROM job_views WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = ?)', [recruiterId]);
  await connection.execute('DELETE FROM job_recommendation_emails WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = ?)', [recruiterId]);
  await connection.execute('DELETE FROM reset_tokens WHERE user_id = ? AND user_type = ?', [recruiterId, 'RECRUITER']);
}

// All admin routes require token verification and admin authentication
router.use(verifyToken);
router.use(requireAdmin);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const ensureRecruiterApprovalColumns = async () => {
  const statements = [
    "ALTER TABLE recruiters ADD COLUMN approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING'",
    "ALTER TABLE recruiters ADD COLUMN approval_rejection_reason VARCHAR(255) NULL",
    "ALTER TABLE recruiters ADD COLUMN approval_reviewed_at DATETIME NULL",
    "ALTER TABLE recruiters ADD COLUMN approval_reviewed_by INT NULL",
    "ALTER TABLE recruiters MODIFY COLUMN approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING'"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
};

const normalizeApprovalStatus = (rawStatus) => {
  const value = String(rawStatus || '').trim().toUpperCase();
  if (!value) return { normalized: 'PENDING', isKnownInput: true };

  if (['APPROVED', 'ACCEPTED', 'SUCCESS', 'ACTIVE'].includes(value)) {
    return { normalized: 'APPROVED', isKnownInput: true };
  }
  if (['REJECTED', 'DECLINED', 'FAILED'].includes(value)) {
    return { normalized: 'REJECTED', isKnownInput: true };
  }
  if (value === 'PENDING') {
    return { normalized: 'PENDING', isKnownInput: true };
  }

  return { normalized: 'PENDING', isKnownInput: false };
};

const ensureRecruiterVerificationTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS recruiter_verification_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recruiter_id INT NOT NULL,
      doc_type VARCHAR(100) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      company_image VARCHAR(500) NULL,
      status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
      rejection_reason VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      reviewed_at DATETIME NULL,
      INDEX idx_recruiter (recruiter_id)
    )
  `);

  // Keep doc_type flexible across environments.
  try {
    await pool.execute(`
      ALTER TABLE recruiter_verification_documents
      MODIFY COLUMN doc_type VARCHAR(100) NOT NULL
    `);
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') {
      throw error;
    }
  }

  try {
    await pool.execute(`
      ALTER TABLE recruiter_verification_documents
      ADD COLUMN company_image VARCHAR(500) NULL
    `);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      throw error;
    }
  }
};

const buildApprovalEmail = ({ name, company }) => `
  <div style="background:#f4f6fb;padding:32px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:24px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:24px;">Recruiter Account Approved</h1>
        <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">TrueHire Recruiter Portal</p>
      </div>
      <div style="padding:28px;color:#1f2937;">
        <p style="margin:0 0 12px;font-size:16px;">Hi ${name || 'Recruiter'},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Your recruiter account${company ? ` for <strong>${company}</strong>` : ''} has been approved.
          You can now log in and access the platform.
        </p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${FRONTEND_URL}/recruiter-login" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#16a34a;color:#fff;text-decoration:none;font-weight:600;">
            Log in to TrueHire
          </a>
        </div>
        <p style="margin:0;font-size:13px;color:#6b7280;">If you have any questions, reply to this email and our team will help.</p>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding:16px;text-align:center;font-size:12px;color:#94a3b8;background:#f9fafb;">
        &copy; ${new Date().getFullYear()} TrueHire. All rights reserved.
      </div>
    </div>
  </div>
`;

const buildRejectionEmail = ({ name, company, reason }) => `
  <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#ef4444,#f97316);padding:24px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:24px;">Recruiter Account Update</h1>
        <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">TrueHire Recruiter Portal</p>
      </div>
      <div style="padding:28px;color:#1f2937;">
        <p style="margin:0 0 12px;font-size:16px;">Hi ${name || 'Recruiter'},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">
          We reviewed your recruiter application${company ? ` for <strong>${company}</strong>` : ''} and were unable to approve it at this time.
        </p>
        ${reason ? `<div style="margin:16px 0;padding:12px;border-radius:12px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;font-size:14px;"><strong>Reason:</strong> ${reason}</div>` : ''}
        <p style="margin:0;font-size:13px;color:#6b7280;">If you believe this is a mistake, please contact support for assistance.</p>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding:16px;text-align:center;font-size:12px;color:#94a3b8;background:#f9fafb;">
        &copy; ${new Date().getFullYear()} TrueHire. All rights reserved.
      </div>
    </div>
  </div>
`;

// Get admin dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get total users count
    const [userResult] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const totalUsers = userResult[0].count;

    // Get total recruiters count
    const [recruiterResult] = await pool.execute('SELECT COUNT(*) as count FROM recruiters');
    const totalRecruiters = recruiterResult[0].count;

    // Get total jobs count
    const [jobResult] = await pool.execute('SELECT COUNT(*) as count FROM jobs');
    const totalJobs = jobResult[0].count;

    // Get total applications count
    const [applicationResult] = await pool.execute('SELECT COUNT(*) as count FROM job_applications');
    const totalApplications = applicationResult[0]?.count || 0;

    // Get recent users (last 5)
    const [recentUsers] = await pool.execute(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get recent recruiters (last 5)
    const [recentRecruiters] = await pool.execute(`
      SELECT id, name, email, company, created_at
      FROM recruiters
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: {
        totalUsers,
        totalRecruiters,
        totalJobs,
        totalApplications
      },
      recentUsers,
      recentRecruiters
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only) with filtering
// NOTE: Keep this query limited to columns that actually exist in the users table
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      registration_date_from,
      registration_date_to
    } = req.query;

    const parsedPage = Number.parseInt(page, 10) || 1;
    const parsedLimit = Number.parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    const whereConditions = [];
    const values = [];

    // Build WHERE conditions safely
    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('role = ?');
      values.push(role);
    }

    if (status) {
      whereConditions.push('status = ?');
      values.push(status);
    }

    if (registration_date_from && registration_date_to) {
      whereConditions.push('DATE(created_at) BETWEEN ? AND ?');
      values.push(registration_date_from, registration_date_to);
    }

    const whereClause =
      whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // PRIMARY QUERY (NO LIMIT PLACEHOLDERS)
    const primaryQuery = `
      SELECT id, name, email, role, status
      FROM users
      ${whereClause}
      ORDER BY id DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `;

    console.log("SQL (users):", primaryQuery);
    console.log("Params:", values);

    let users = [];
    let countResult = [{ total: 0 }];

    try {
      // Main fetch
      [users] = await pool.execute(primaryQuery, values);

      // Count query (still safe)
      const countQuery = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
      [countResult] = await pool.execute(countQuery, values);

    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('Users fallback due to missing columns:', err.message);

        const fallbackQuery = `
          SELECT id, name, email
          FROM users
          ${whereClause}
          ORDER BY id DESC
          LIMIT ${parsedLimit} OFFSET ${offset}
        `;

        [users] = await pool.execute(fallbackQuery, values);

        const countQuery = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
        [countResult] = await pool.execute(countQuery, values);

      } else {
        throw err;
      }
    }

    const total = countResult[0]?.total || 0;

    res.json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        status: u.status || 'Active',
        created_at: u.created_at || new Date().toISOString(),
        registration_number: u.registration_number || null,
        profile_complete: u.profile_complete ?? null,
        email_verified: u.email_verified ?? null
      })),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit) || 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);

    res.json({
      users: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 1 },
      error: 'Failed to load users'
    });
  }
});


// Get all recruiters (admin only) with filtering
router.get('/recruiters', async (req, res) => {
  try {
    await ensureRecruiterApprovalColumns();
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    let where = [];
    let values = [];

    // Recruiter list should include only admin-approved recruiters.
    where.push("approval_status = 'APPROVED'");

    if (req.query.search) {
      where.push("(name LIKE ? OR email LIKE ? OR company LIKE ?)");
      values.push(
        `%${req.query.search}%`,
        `%${req.query.search}%`,
        `%${req.query.search}%`
      );
    }

    if (req.query.status) {
      where.push("status = ?");
      values.push(req.query.status);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // 🚨 FIX: REMOVE ? PLACEHOLDERS FROM LIMIT & OFFSET
    const sql = `
      SELECT id, name, email, company, status, approval_status, created_at
      FROM recruiters
      ${whereClause}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log("SQL:", sql);
    console.log("Values:", values);

    const [recruiters] = await pool.execute(sql, values);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM recruiters
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countSql, values);

    res.json({
      recruiters,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error("Get recruiters error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Recruiter approval queue (admin only)
router.get('/recruiter-approvals', async (req, res) => {
  try {
    await ensureRecruiterApprovalColumns();
    await ensureRecruiterVerificationTable();

    const {
      status = 'Pending Approval',
      search = '',
      page = 1,
      limit = 10
    } = req.query;

    const normalizeApprovalStatusFilter = (rawStatus) => {
      const value = String(rawStatus || '').trim().toLowerCase();
      if (!value || value === 'all') {
        return null;
      }

      if (['pending approval', 'pending', 'under review', 'under_review', 'in review'].includes(value)) {
        return ['PENDING'];
      }
      if (['approved', 'approve'].includes(value)) {
        return ['APPROVED'];
      }
      if (['rejected', 'reject'].includes(value)) {
        return ['REJECTED'];
      }

      return [normalizeApprovalStatus(rawStatus).normalized];
    };

    const parsedPage = Number.parseInt(page, 10) || 1;
    const parsedLimit = Number.parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    const whereConditions = [];
    const values = [];
    const normalizedStatuses = normalizeApprovalStatusFilter(status);
    if (normalizedStatuses && normalizedStatuses.length > 0) {
      const placeholders = normalizedStatuses.map(() => '?').join(', ');
      whereConditions.push(`approval_status IN (${placeholders})`);
      values.push(...normalizedStatuses);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR company LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let recruiters = [];
    let countResult = [{ total: 0 }];

    try {
      const sql = `
        SELECT id, name, email, official_email, company, company_name, created_at, approval_status, approval_rejection_reason
        FROM recruiters
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${parsedLimit} OFFSET ${offset}
      `;

      [recruiters] = await pool.execute(sql, values);
      [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM recruiters ${whereClause}`, values);
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackSql = `
          SELECT id, name, email, company, created_at, approval_status, approval_rejection_reason
          FROM recruiters
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ${parsedLimit} OFFSET ${offset}
        `;
        [recruiters] = await pool.execute(fallbackSql, values);
        [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM recruiters ${whereClause}`, values);
      } else {
        throw error;
      }
    }

    if (!recruiters.length) {
      return res.json({
        recruiters: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          pages: 1
        }
      });
    }

    const recruiterIds = recruiters.map((recruiter) => recruiter.id);
    const placeholders = recruiterIds.map(() => '?').join(',');
    const [documents] = await pool.execute(
      `
        SELECT id, recruiter_id, doc_type, file_path, status, rejection_reason, created_at
        FROM recruiter_verification_documents
        WHERE recruiter_id IN (${placeholders})
        ORDER BY created_at DESC
      `,
      recruiterIds
    );

    const docsByRecruiter = documents.reduce((acc, doc) => {
      if (!acc[doc.recruiter_id]) {
        acc[doc.recruiter_id] = [];
      }
      acc[doc.recruiter_id].push(doc);
      return acc;
    }, {});

    const enrichedRecruiters = recruiters.map((recruiter) => ({
      ...recruiter,
      documents: docsByRecruiter[recruiter.id] || []
    }));

    const total = countResult[0]?.total || 0;

    res.json({
      recruiters: enrichedRecruiters,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit) || 1
      }
    });
  } catch (error) {
    console.error('Get recruiter approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject recruiter (admin only)
router.put('/recruiters/:id/approval', async (req, res) => {
  try {
    await ensureRecruiterApprovalColumns();

    const { id } = req.params;
    const { status, reason } = req.body || {};
    const mapped = normalizeApprovalStatus(status);
    console.log('[approval_status] admin update mapping', {
      recruiterId: id,
      rawStatus: status ?? null,
      mappedStatus: mapped.normalized
    });

    if (!status || !mapped.isKnownInput) {
      return res.status(400).json({ message: 'Invalid approval status' });
    }
    const normalizedStatus = mapped.normalized;

    const rejectionReason = normalizedStatus === 'REJECTED'
      ? String(reason || '').trim()
      : null;

    if (normalizedStatus === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const [result] = await pool.execute(
      `
        UPDATE recruiters
        SET approval_status = ?,
            approval_rejection_reason = ?,
            approval_reviewed_at = NOW(),
            approval_reviewed_by = ?
        WHERE id = ?
      `,
      [normalizedStatus, rejectionReason, req.user.id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const recruiter = await Recruiter.findById(id);
    if (recruiter && recruiter.email) {
      const company = recruiter.company_name || recruiter.company || '';
      try {
        if (normalizedStatus === 'APPROVED') {
          await sendEmail(
            recruiter.email,
            'Your TrueHire recruiter account is approved',
            buildApprovalEmail({ name: recruiter.name, company })
          );
        } else {
          await sendEmail(
            recruiter.email,
            'Your TrueHire recruiter account update',
            buildRejectionEmail({ name: recruiter.name, company, reason: rejectionReason })
          );
        }
      } catch (emailError) {
        console.error('Recruiter approval email failed:', emailError);
      }
    }

    res.json({
      message: 'Recruiter approval status updated successfully',
      approval_status: normalizedStatus
    });
  } catch (error) {
    console.error('Update recruiter approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});





// Get all jobs (admin only) with filtering
router.get('/jobs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      job_type,
      job_status,
      posted_date_from,
      posted_date_to,
      experience_level,
      location,
      category,
      recruiter
    } = req.query;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    let whereConditions = [];
    let values = [];

    const [jobColumns] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs'
    `);
    const availableColumns = new Set((jobColumns || []).map((c) => c.COLUMN_NAME));
    const companyColumn = availableColumns.has('company_name')
      ? 'company_name'
      : (availableColumns.has('company') ? 'company' : null);
    const hasRequirements = availableColumns.has('requirements');

    // Build WHERE conditions (only with columns that exist)
    if (keyword) {
      if (hasRequirements) {
        whereConditions.push('(j.title LIKE ? OR j.description LIKE ? OR j.requirements LIKE ?)');
        values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      } else {
        whereConditions.push('(j.title LIKE ? OR j.description LIKE ?)');
        values.push(`%${keyword}%`, `%${keyword}%`);
      }
    }

    if (job_type && availableColumns.has('employment_type')) {
      whereConditions.push('j.employment_type = ?');
      values.push(job_type);
    }

    if (job_status && availableColumns.has('status')) {
      whereConditions.push('j.status = ?');
      values.push(job_status);
    }

    if (posted_date_from && posted_date_to && availableColumns.has('created_at')) {
      whereConditions.push('DATE(j.created_at) BETWEEN ? AND ?');
      values.push(posted_date_from, posted_date_to);
    }

    if (experience_level && availableColumns.has('experience_level')) {
      whereConditions.push('j.experience_level = ?');
      values.push(experience_level);
    }

    if (location && availableColumns.has('location')) {
      whereConditions.push('j.location LIKE ?');
      values.push(`%${location}%`);
    }

    if (category && availableColumns.has('category')) {
      whereConditions.push('j.category = ?');
      values.push(category);
    }

    if (recruiter && companyColumn) {
      whereConditions.push(`j.${companyColumn} LIKE ?`);
      values.push(`%${recruiter}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get filtered jobs with application count - simplified query
    const [jobs] = await pool.execute(`
  SELECT j.*, ${companyColumn ? `j.${companyColumn}` : "''"} as company_name, COUNT(ja.id) as application_count
  FROM jobs j
  LEFT JOIN job_applications ja ON j.id = ja.job_id
  ${whereClause}
  GROUP BY j.id
  ORDER BY j.created_at DESC
  LIMIT ${parsedLimit} OFFSET ${offset}
`, values);


    // Convert BigInt values to regular numbers for JSON serialization
    const processedJobs = jobs.map(job => ({
      ...job,
      id: Number(job.id),
      recruiter_id: job.recruiter_id ? Number(job.recruiter_id) : null,
      salary_min: job.salary_min ? Number(job.salary_min) : null,
      salary_max: job.salary_max ? Number(job.salary_max) : null,
      application_count: Number(job.application_count)
    }));

    // Debug: Log the jobs result
    console.log('Jobs query result:', { jobsCount: jobs.length, firstJob: jobs[0], whereClause, values });

    // Get total count for pagination - simplified
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM jobs j ${whereClause}
    `, values);

    const total = countResult[0].total;

    const response = {
      jobs: processedJobs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    };

    console.log('Jobs API response object created successfully:', { jobsCount: jobs.length, total, pagination: response.pagination });

    try {
      res.json(response);
      console.log('Jobs API response sent successfully');
    } catch (jsonError) {
      console.error('Error sending JSON response:', jsonError);
      throw jsonError;
    }
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update user status (admin only)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recruiter status (admin only)
router.put('/recruiters/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE recruiters SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.json({ message: 'Recruiter status updated successfully' });
  } catch (error) {
    console.error('Update recruiter status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (!Array.isArray(users) || users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const [jobApplications] = await connection.execute(
      'SELECT id, job_id FROM job_applications WHERE user_id = ?',
      [id]
    );
    const [applications] = await connection.execute(
      'SELECT id FROM applications WHERE user_id = ?',
      [id]
    );

    const jobApplicationIds = jobApplications.map((application) => application.id);
    const applicationIds = applications.map((application) => application.id);
    const jobIds = [...new Set(jobApplications.map((application) => application.job_id).filter(Boolean))];

    if (jobIds.length > 0 || jobApplicationIds.length > 0) {
      const conversationParams = [id];
      let conversationQuery = 'SELECT id FROM application_conversations WHERE user_id = ?';

      if (jobApplicationIds.length > 0) {
        const jobApplicationPlaceholders = jobApplicationIds.map(() => '?').join(', ');
        conversationQuery += ` OR application_id IN (${jobApplicationPlaceholders})`;
        conversationParams.push(...jobApplicationIds);
      }

      const [conversations] = await connection.execute(conversationQuery, conversationParams);
      const conversationIds = conversations.map((conversation) => conversation.id);

      const messageConditions = [];
      const messageParams = [];

      if (jobApplicationIds.length > 0) {
        messageConditions.push(`application_id IN (${jobApplicationIds.map(() => '?').join(', ')})`);
        messageParams.push(...jobApplicationIds);
      }
      if (conversationIds.length > 0) {
        messageConditions.push(`conversation_id IN (${conversationIds.map(() => '?').join(', ')})`);
        messageParams.push(...conversationIds);
      }
      if (jobIds.length > 0) {
        messageConditions.push(`job_id IN (${jobIds.map(() => '?').join(', ')})`);
        messageParams.push(...jobIds);
      }

      if (messageConditions.length > 0) {
        const [messages] = await connection.execute(
          `SELECT id FROM application_messages WHERE ${messageConditions.join(' OR ')}`,
          messageParams
        );
        const messageIds = messages.map((message) => message.id);

        if (messageIds.length > 0) {
          await connection.execute(
            `DELETE FROM application_message_attachments WHERE message_id IN (${messageIds.map(() => '?').join(', ')})`,
            messageIds
          );
          await connection.execute(
            `DELETE FROM application_messages WHERE id IN (${messageIds.map(() => '?').join(', ')})`,
            messageIds
          );
        }
      }

      if (conversationIds.length > 0) {
        await connection.execute(
          `DELETE FROM application_conversations WHERE id IN (${conversationIds.map(() => '?').join(', ')})`,
          conversationIds
        );
      }

      const introVideoConditions = ['user_id = ?'];
      const introVideoParams = [id];

      if (jobApplicationIds.length > 0) {
        introVideoConditions.push(`application_id IN (${jobApplicationIds.map(() => '?').join(', ')})`);
        introVideoParams.push(...jobApplicationIds);
      }

      await connection.execute(
        `DELETE FROM introduction_videos WHERE ${introVideoConditions.join(' OR ')}`,
        introVideoParams
      );
    } else {
      await connection.execute('DELETE FROM introduction_videos WHERE user_id = ?', [id]);
    }

    if (applicationIds.length > 0) {
      const applicationPlaceholders = applicationIds.map(() => '?').join(', ');
      await connection.execute(
        `DELETE FROM user_notifications WHERE application_id IN (${applicationPlaceholders})`,
        applicationIds
      );
      await connection.execute(
        `DELETE FROM recruiter_notifications WHERE application_id IN (${applicationPlaceholders})`,
        applicationIds
      );
      await connection.execute(
        `DELETE FROM applications WHERE id IN (${applicationPlaceholders})`,
        applicationIds
      );
    }

    await connection.execute('DELETE FROM user_notifications WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM resumes WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM company_ratings WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM certifications WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM projects WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM saved_jobs WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM saved_companies WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM favourite_companies WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM user_connections WHERE sender_id = ? OR receiver_id = ?', [id, id]);
    await connection.execute('DELETE FROM user_direct_messages WHERE sender_id = ? OR receiver_id = ?', [id, id]);
    await connection.execute('DELETE FROM reset_tokens WHERE user_id = ?', [id]);
    await connection.execute('DELETE FROM user_reviews WHERE user_id = ?', [id]);
    await cleanupUserOwnedSocialData(connection, id);

    if (jobApplicationIds.length > 0) {
      const jobApplicationPlaceholders = jobApplicationIds.map(() => '?').join(', ');
      await connection.execute(
        `DELETE FROM job_applications WHERE id IN (${jobApplicationPlaceholders})`,
        jobApplicationIds
      );
    }

    if (jobIds.length > 0) {
      for (const jobId of jobIds) {
        const deletedCount = jobApplications.filter((application) => application.job_id === jobId).length;
        await connection.execute(
          'UPDATE jobs SET applications_count = GREATEST(applications_count - ?, 0) WHERE id = ?',
          [deletedCount, jobId]
        );
      }
    }

    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Delete recruiter (admin only)
router.delete('/recruiters/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [recruiters] = await connection.execute('SELECT id FROM recruiters WHERE id = ?', [id]);
    if (!Array.isArray(recruiters) || recruiters.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const [jobs] = await connection.execute('SELECT id FROM jobs WHERE recruiter_id = ?', [id]);
    const jobIds = jobs.map((job) => job.id);

    if (jobIds.length > 0) {
      const jobPlaceholders = jobIds.map(() => '?').join(', ');

      const [jobApplications] = await connection.execute(
        `SELECT id FROM job_applications WHERE job_id IN (${jobPlaceholders})`,
        jobIds
      );
      const [applications] = await connection.execute(
        `SELECT id FROM applications WHERE job_id IN (${jobPlaceholders})`,
        jobIds
      );

      const jobApplicationIds = jobApplications.map((application) => application.id);
      const applicationIds = applications.map((application) => application.id);

      const messageIdQuery = `
        SELECT id
        FROM application_messages
        WHERE job_id IN (${jobPlaceholders})
      `;
      const [messages] = await connection.execute(messageIdQuery, jobIds);
      const messageIds = messages.map((message) => message.id);

      if (messageIds.length > 0) {
        const messagePlaceholders = messageIds.map(() => '?').join(', ');
        await connection.execute(
          `DELETE FROM application_message_attachments WHERE message_id IN (${messagePlaceholders})`,
          messageIds
        );
      }

      await connection.execute(
        `DELETE FROM application_messages WHERE job_id IN (${jobPlaceholders})`,
        jobIds
      );
      await connection.execute(
        `DELETE FROM application_conversations WHERE recruiter_id = ? OR job_id IN (${jobPlaceholders})`,
        [id, ...jobIds]
      );
      await connection.execute(
        `DELETE FROM introduction_videos WHERE recruiter_id = ? OR job_id IN (${jobPlaceholders})`,
        [id, ...jobIds]
      );
      await connection.execute(
        `DELETE FROM saved_jobs WHERE job_id IN (${jobPlaceholders})`,
        jobIds
      );
      await connection.execute(
        `DELETE FROM job_views WHERE job_id IN (${jobPlaceholders})`,
        jobIds
      );
      await connection.execute(
        `DELETE FROM job_recommendation_emails WHERE job_id IN (${jobPlaceholders})`,
        jobIds
      );

      if (applicationIds.length > 0) {
        const applicationPlaceholders = applicationIds.map(() => '?').join(', ');
        await connection.execute(
          `DELETE FROM user_notifications WHERE application_id IN (${applicationPlaceholders})`,
          applicationIds
        );
        await connection.execute(
          `DELETE FROM recruiter_notifications WHERE recruiter_id = ? OR application_id IN (${applicationPlaceholders})`,
          [id, ...applicationIds]
        );
        await connection.execute(
          `DELETE FROM applications WHERE id IN (${applicationPlaceholders})`,
          applicationIds
        );
      } else {
        await connection.execute(
          'DELETE FROM recruiter_notifications WHERE recruiter_id = ?',
          [id]
        );
      }

      if (jobApplicationIds.length > 0) {
        const jobApplicationPlaceholders = jobApplicationIds.map(() => '?').join(', ');
        await connection.execute(
          `DELETE FROM job_applications WHERE id IN (${jobApplicationPlaceholders})`,
          jobApplicationIds
        );
      }

      await connection.execute(
        `DELETE FROM jobs WHERE id IN (${jobPlaceholders})`,
        jobIds
      );
    } else {
      await connection.execute(
        'DELETE FROM recruiter_notifications WHERE recruiter_id = ?',
        [id]
      );
      await connection.execute(
        'DELETE FROM introduction_videos WHERE recruiter_id = ?',
        [id]
      );
    }

    await connection.execute('DELETE FROM recruiter_activity_logs WHERE recruiter_id = ?', [id]);
    await connection.execute('DELETE FROM recruiter_subscriptions WHERE recruiter_id = ?', [id]);
    await connection.execute('DELETE FROM recruiter_verification_documents WHERE recruiter_id = ?', [id]);
    await connection.execute('DELETE FROM payments WHERE recruiter_id = ?', [id]);
    await connection.execute('DELETE FROM company_ratings WHERE company_id = ?', [id]);
    await connection.execute('DELETE FROM companies WHERE recruiter_id = ?', [id]);
    await connection.execute('DELETE FROM sub_recruiters WHERE recruiter_id = ?', [id]);
    await cleanupRecruiterOwnedSocialData(connection, id);

    const [result] = await connection.execute('DELETE FROM recruiters WHERE id = ?', [id]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.json({ message: 'Recruiter deleted successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Delete recruiter error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Delete job (admin only)
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const success = await Job.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all applications (admin only) with filtering
router.get('/applications', async (req, res) => {
  try {
    const {
      status,
      applied_date_from,
      applied_date_to,
      page = 1,
      limit = 10
    } = req.query;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    let whereConditions = [];
    let values = [];

    // Build WHERE conditions
    if (status) {
      whereConditions.push("ja.status = ?");
      values.push(status);
    }

    if (applied_date_from && applied_date_to) {
      whereConditions.push("DATE(ja.applied_at) BETWEEN ? AND ?");
      values.push(applied_date_from, applied_date_to);
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // MAIN QUERY — FIXED COLUMN NAMES
    const query = `
      SELECT 
        ja.*, 
        j.title AS job_title,
        j.company AS company,
        u.name AS user_name,
        u.email AS user_email,
        r.name AS recruiter_name,
        ja.applied_at AS applied_at
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN users u ON ja.user_id = u.id
      JOIN recruiters r ON j.recruiter_id = r.id
      ${whereClause}
      ORDER BY ja.applied_at DESC
      LIMIT ${parsedLimit} OFFSET ${offset}
    `;

    console.log("SQL (applications):", query);
    console.log("Params:", values);

    const [applications] = await pool.execute(query, values);

    // COUNT QUERY
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM job_applications ja
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, values);

    const total = countResult[0]?.total || 0;

    return res.json({
      applications,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });

  } catch (error) {
    // --- FALLBACK MODE ---
    if (error.code === "ER_NO_SUCH_TABLE" || error.code === "ER_BAD_TABLE_ERROR") {
      console.warn("job_applications missing. Using legacy `applications` table...");
      return handleLegacyApplications(req, res);
    }

    console.error("Get applications error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});



// Update application status (admin only)
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete application (admin only)
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM job_applications WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get analytics data (admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // User registration trends
    const [userTrends] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // Recruiter registration trends
    const [recruiterTrends] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM recruiters
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // Job posting trends
    const [jobTrends] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM jobs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // Application trends
    const [applicationTrends] = await pool.execute(`
      SELECT DATE(ja.applied_at) as date, COUNT(*) as count
      FROM job_applications ja
      WHERE ja.applied_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(ja.applied_at)
      ORDER BY date
    `, [days]);

    // Top recruiters by job posts
    const [topRecruiters] = await pool.execute(`
      SELECT r.name, r.company, COUNT(j.id) as job_count
      FROM recruiters r
      LEFT JOIN jobs j ON r.id = j.recruiter_id
      GROUP BY r.id, r.name, r.company
      ORDER BY job_count DESC
      LIMIT 10
    `);

    // Application status distribution
    const [statusDistribution] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM job_applications
      GROUP BY status
    `);

    res.json({
      trends: {
        users: userTrends,
        recruiters: recruiterTrends,
        jobs: jobTrends,
        applications: applicationTrends
      },
      topRecruiters,
      statusDistribution
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload banner image (admin only)
router.post('/banners', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { title, display_order = 0 } = req.body;
    const uploaded_by = req.user.id;

    const [result] = await pool.execute(`
      INSERT INTO banner_images (title, image_path, image_url, display_order, uploaded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      title,
      req.file.path,
      `/uploads/${req.file.filename}`,
      display_order,
      uploaded_by
    ]);

    res.status(201).json({
      message: 'Banner image uploaded successfully',
      bannerId: result.insertId
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get banner images (admin only)
router.get('/banners', async (req, res) => {
  try {
    const [banners] = await pool.execute(`
      SELECT bi.*, a.name as uploaded_by_name
      FROM banner_images bi
      LEFT JOIN admins a ON bi.uploaded_by = a.id
      ORDER BY bi.display_order, bi.created_at DESC
    `);

    res.json({ banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete banner image (admin only)
router.delete('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get banner info first to delete file
    const [banners] = await pool.execute('SELECT image_path FROM banner_images WHERE id = ?', [id]);
    if (banners.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(banners[0].image_path)) {
      fs.unlinkSync(banners[0].image_path);
    }

    // Delete from database
    await pool.execute('DELETE FROM banner_images WHERE id = ?', [id]);

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get super admin count (regular admin only - for Super Admin creation tab)
router.get('/super-admin-count', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT COUNT(*) as count FROM super_admins');
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get super admin count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all super admins (regular admin only)
router.get('/super-admins', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status
    } = req.query;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    let whereConditions = [];
    let values = [];

    // Build WHERE conditions
    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('status = ?');
      values.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get filtered super admins
    const [superAdmins] = await pool.execute(`
      SELECT id, name, email, status, last_login, created_at
      FROM super_admins
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, values);

    // Get total count for pagination
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM super_admins ${whereClause}
    `, values);

    const total = countResult[0].total;

    res.json({
      superAdmins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get super admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update super admin status (regular admin only)
router.put('/super-admins/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE super_admins SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Super Admin not found' });
    }

    res.json({ message: 'Super Admin status updated successfully' });
  } catch (error) {
    console.error('Update super admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete super admin (regular admin only)
router.delete('/super-admins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this is the last super admin
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM super_admins');
    const totalSuperAdmins = countResult[0].count;

    if (totalSuperAdmins <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last Super Admin account' });
    }

    const [result] = await pool.execute('DELETE FROM super_admins WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Super Admin not found' });
    }

    res.json({ message: 'Super Admin deleted successfully' });
  } catch (error) {
    console.error('Delete super admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create super admin account (regular admin only - for Super Admin creation tab)
router.post('/create-super-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check current super admin count
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM super_admins');
    const currentCount = countResult[0].count;

    if (currentCount >= 2) {
      return res.status(400).json({ message: 'Maximum number of Super Admin accounts reached' });
    }

    // Check if email already exists in super_admins table
    const existingSuperAdmin = await SuperAdmin.findByEmail(email);
    if (existingSuperAdmin) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create super admin account using SuperAdmin model
    const adminId = await SuperAdmin.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword
    });

    res.status(201).json({
      message: 'Super Admin created successfully',
      adminId
    });
  } catch (error) {
    console.error('Create super admin error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Super Admin Routes - Admin Management
// Get all admins (super admin only)
router.get('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, role, status, last_login, created_at FROM admins';
    const values = [];
    let whereConditions = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('status = ?');
      values.push(status);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const [admins] = await pool.execute(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM admins';
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    const [countResult] = await pool.execute(countQuery, values.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new admin (super admin only)
router.post('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminId = await Admin.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: 'Admin created successfully',
      adminId
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update admin role (super admin only)
router.put('/admins/:id/role', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent super admin from demoting themselves
    if (id == req.user.id && role !== 'super_admin') {
      return res.status(400).json({ message: 'Cannot change your own super admin role' });
    }

    const updated = await Admin.update(id, { role });

    if (!updated) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin role updated successfully' });
  } catch (error) {
    console.error('Update admin role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin status (super admin only)
router.put('/admins/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Prevent super admin from deactivating themselves
    if (id == req.user.id && status === 'Inactive') {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const updated = await Admin.update(id, { status });

    if (!updated) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin status updated successfully' });
  } catch (error) {
    console.error('Update admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete admin (super admin only)
router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent super admin from deleting themselves
    if (id == req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const deleted = await Admin.delete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
