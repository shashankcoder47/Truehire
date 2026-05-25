// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const multer = require('multer');
// const Job = require('../models/Job');
// const Recruiter = require('../models/Recruiter');
// const { verifyToken, requireRecruiter } = require('../middleware/auth');
// const { sendJobAlertEmail } = require('../utils/email');

// const router = express.Router();

// /* -------------------------
//    Multer setup for resume uploads
// --------------------------*/
// const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase();
//     const filename = `${Date.now()}-${base}${ext}`;
//     cb(null, filename);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: function (req, file, cb) {
//     const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error('Only PDF, DOC, DOCX files are allowed'));
//   }
// });

// /* ---------------------------------------------------
//    USER APPLICATION LIST - MUST COME BEFORE "/:id"
//    Uses job_applications + jobs
// --------------------------------------------------- */
// router.get('/user/applications', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const sql = `
//       SELECT 
//         ja.id,
//         ja.job_id,
//         ja.status,
//         ja.applied_at,
//         j.title AS job_title,
//         j.company AS company_name,
//         j.location AS job_location,
//         j.salary_min,
//         j.salary_max,
//         j.salary_currency
//       FROM job_applications ja
//       LEFT JOIN jobs j ON j.id = ja.job_id
//       WHERE ja.user_id = ?
//       ORDER BY ja.applied_at DESC
//     `;

//     const [rows] = await req.db.pool.execute(sql, [userId]);

//     const applications = rows.map(app => {
//       const currency = app.salary_currency || 'USD';
//       const salaryMin = app.salary_min != null ? app.salary_min : '-';
//       const salaryMax = app.salary_max != null ? app.salary_max : '-';

//       return {
//         id: app.id,
//         jobId: app.job_id,
//         jobTitle: app.job_title || 'Job',
//         company: app.company_name || 'Company',
//         location: app.job_location || 'Remote',
//         salary: `${currency} ${salaryMin} - ${salaryMax}`,
//         status: app.status || 'Under Review',
//         appliedDate: app.applied_at ? new Date(app.applied_at).toDateString() : '',
//         applicationId: `APP-${app.id}`
//       };
//     });

//     res.json({ applications });
//   } catch (error) {
//     console.error('User Applications Fetch Error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------------------------------------------------
//    WITHDRAW USER APPLICATION
// --------------------------------------------------- */
// router.delete('/user/applications/:applicationId', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const applicationId = req.params.applicationId;

//     // Find the job_id for related cleanup
//     const [rows] = await req.db.pool.execute(
//       'SELECT job_id FROM job_applications WHERE id = ? AND user_id = ?',
//       [applicationId, userId]
//     );

//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Application not found' });
//     }

//     const jobId = rows[0].job_id;

//     // Delete from job_applications
//     const [deleteResult] = await req.db.pool.execute(
//       'DELETE FROM job_applications WHERE id = ? AND user_id = ?',
//       [applicationId, userId]
//     );

//     // Also delete the detailed application record if present (ignore if legacy table missing)
//     try {
//       await req.db.pool.execute(
//         'DELETE FROM applications WHERE job_id = ? AND user_id = ?',
//         [jobId, userId]
//       );
//     } catch (err) {
//       if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_TABLE_ERROR') {
//         throw err;
//       }
//     }

//     // Decrement job applications count only if a row was removed
//     if (deleteResult.affectedRows > 0) {
//       try { await req.db.pool.execute(
//         'UPDATE jobs SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = ?',
//         [jobId]
//       ); } catch (e) {}
//     }

//     return res.json({ success: true, message: 'Application withdrawn successfully' });
//   } catch (error) {
//     console.error('Withdraw application error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// /* ---------------------------------------------------
//    GET ALL JOBS (PUBLIC)
// --------------------------------------------------- */
// router.get('/', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page || '1', 10);
//     const limit = parseInt(req.query.limit || '10', 10);
//     const offset = (page - 1) * limit;

//     const jobs = await Job.findActive(limit, offset);

//     res.json({
//       jobs: jobs.map(j => j.toJSON()),
//       pagination: {
//         page,
//         limit,
//         total: jobs.length
//       }
//     });
//   } catch (error) {
//     console.error('Get jobs error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------------------------------------------------
//    GET JOBS FOR CURRENT RECRUITER
// --------------------------------------------------- */
// router.get('/recruiter/my-jobs', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const recruiterId = (req.user.role === 'sub-recruiter' && req.user.mainRecruiterId)
//       ? req.user.mainRecruiterId
//       : req.user.id;

//     const jobs = await Job.findByRecruiter(recruiterId);

//     res.json({
//       success: true,
//       jobs: jobs.map(job => job.toJSON())
//     });
//   } catch (error) {
//     console.error('Get recruiter jobs error:', error);
//     res.status(500).json({ success: false, message: 'Server error fetching recruiter jobs' });
//   }
// });

// /* ---------------------------------------------------
//    APPLY FOR JOB (USER ONLY)
// --------------------------------------------------- */
// router.post('/:id/apply', verifyToken, upload.single('resume'), async (req, res) => {
//   try {
//     const jobId = req.params.id;
//     const userId = req.user.id;
//     const {
//       name,
//       email,
//       phone,
//       location,
//       experience_level,
//       current_salary,
//       expected_salary,
//       notice_period,
//       additionalComments
//     } = req.body;

//     const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : null;
//     const toNumber = (value) => {
//       if (value === undefined || value === null || value === '') return null;
//       const num = Number(value);
//       return Number.isFinite(num) ? num : null;
//     };

//     const job = await Job.findById(jobId);
//     if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
//     if (job.status !== 'Active') {
//       return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
//     }

//     const applicationSql = `
//       INSERT INTO applications (
//         job_id, user_id, name, email, phone, location,
//         experience_level, current_salary, expected_salary,
//         notice_period, additional_comments, resume_path, applied_at
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
//       ON DUPLICATE KEY UPDATE
//         user_id = VALUES(user_id),
//         name = VALUES(name),
//         email = VALUES(email),
//         phone = VALUES(phone),
//         location = VALUES(location),
//         experience_level = VALUES(experience_level),
//         current_salary = VALUES(current_salary),
//         expected_salary = VALUES(expected_salary),
//         notice_period = VALUES(notice_period),
//         additional_comments = VALUES(additional_comments),
//         resume_path = COALESCE(VALUES(resume_path), resume_path),
//         applied_at = VALUES(applied_at)
//     `;

//     const applicationParams = [
//       jobId,
//       userId,
//       (name || '').trim(),
//       (email || '').trim(),
//       (phone || '').trim(),
//       (location || '').trim(),
//       experience_level || null,
//       toNumber(current_salary),
//       toNumber(expected_salary),
//       notice_period || null,
//       additionalComments || null,
//       resumePath
//     ];

//     // Save the detailed application if the legacy table exists; otherwise continue with the primary job_applications insert.
//     let applicationResult = {};
//     try {
//       [applicationResult] = await req.db.pool.execute(applicationSql, applicationParams);
//     } catch (err) {
//       if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_TABLE_ERROR') {
//         console.warn('applications table missing, skipping detailed application insert');
//         applicationResult.insertId = null;
//       } else {
//         throw err;
//       }
//     }

//     const sql = `
//       INSERT INTO job_applications (job_id, user_id, status, notes, applied_at)
//       VALUES (?, ?, 'Applied', ?, NOW())
//       ON DUPLICATE KEY UPDATE
//         status = VALUES(status),
//         notes = VALUES(notes),
//         applied_at = NOW()
//     `;

//     const params = [
//       jobId,
//       userId,
//       additionalComments || null
//     ];

//     const [jobApplicationResult] = await req.db.pool.execute(sql, params);

//     const isNewJobApplication = jobApplicationResult.affectedRows === 1;
//     if (isNewJobApplication) {
//       try { await Job.incrementApplications(jobId); } catch (e) {}
//     }

//     res.json({
//       success: true,
//       message: 'Application submitted successfully',
//       application_id: applicationResult.insertId || jobApplicationResult.insertId
//     });
//   } catch (error) {
//     console.error('Apply job error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// /* ---------------------------------------------------
//    GET JOB BY ID
// --------------------------------------------------- */
// router.get('/:id', async (req, res) => {
//   try {
//     const job = await Job.findById(req.params.id);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     await Job.incrementViews(req.params.id);
//     res.json({ job: job.toJSON() });
//   } catch (error) {
//     console.error('Get job error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------------------------------------------------
//    CREATE JOB (RECRUITER)
// --------------------------------------------------- */
// router.post('/', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const recruiterId = req.user.id;

//     const canPost = await Recruiter.canPostJob(recruiterId);
//     if (!canPost) {
//       return res.status(403).json({
//         message: 'Job posting limit reached.',
//         action_required: 'subscription_upgrade'
//       });
//     }

//     const jobData = { ...req.body, recruiter_id: recruiterId };

//     const jobId = await Job.create(jobData);
//     const recruiter = await Recruiter.findById(recruiterId);

//     if (recruiter.job_post_limit > 0) {
//       await Recruiter.decrementJobPostLimit(recruiterId);
//     }

//     const job = await Job.findById(jobId);

//     res.status(201).json({
//       message: 'Job created successfully',
//       job: job.toJSON()
//     });
//   } catch (error) {
//     console.error('Create job error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------------------------------------------------
//    UPDATE JOB (RECRUITER)
// --------------------------------------------------- */
// router.put('/:id', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const job = await Job.findById(req.params.id);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     if (job.recruiter_id != req.user.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     const success = await Job.update(req.params.id, req.body);
//     if (!success) return res.status(404).json({ message: 'Job not found' });

//     const updatedJob = await Job.findById(req.params.id);

//     res.json({
//       message: 'Job updated successfully',
//       job: updatedJob.toJSON()
//     });
//   } catch (error) {
//     console.error('Update job error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------------------------------------------------
//    DELETE JOB (RECRUITER)
// --------------------------------------------------- */
// router.delete('/:id', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const job = await Job.findById(req.params.id);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     if (job.recruiter_id != req.user.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     const success = await Job.delete(req.params.id);
//     if (!success) return res.status(404).json({ message: 'Job not found' });

//     res.json({ message: 'Job deleted successfully' });
//   } catch (error) {
//     console.error('Delete job error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // /* ---------------------------------------------------
// //    GET JOB APPLICATIONS (RECRUITER)
// // --------------------------------------------------- */
// // router.get('/:id/applications', verifyToken, requireRecruiter, async (req, res) => {
// //   try {
// //     const jobId = req.params.id;
// //     const job = await Job.findById(jobId);
// //     if (!job) return res.status(404).json({ message: 'Job not found' });

// //     // Allow sub-recruiters to view their main recruiter's jobs
// //     const requesterRecruiterId = req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
// //       ? req.user.mainRecruiterId
// //       : req.user.id;

// //     if (String(job.recruiter_id) !== String(requesterRecruiterId)) {
// //       return res.status(403).json({ message: 'Access denied' });
// //     }

// //     let applications = [];
// //     try {
// //       const runQuery = async (includeRegistration = true) => {
// //         const baseSelect = `
// //           SELECT
// //             ja.id,
// //             ja.job_id,
// //             ja.user_id,
// //             ja.status,
// //             ja.notes,
// //             ja.applied_at,
// //             ja.updated_at,
// //             u.name AS candidate_name,
// //             u.email AS candidate_email
// //             ${includeRegistration ? ', u.registration_number AS candidate_registration' : ''}
// //           FROM job_applications ja
// //           LEFT JOIN users u ON ja.user_id = u.id
// //           WHERE ja.job_id = ?
// //           ORDER BY ja.applied_at DESC
// //         `;
// //         const [rows] = await req.db.pool.execute(baseSelect, [jobId]);
// //         return rows.map(row => ({
// //           id: row.id,
// //           job_id: row.job_id,
// //           user_id: row.user_id,
// //           status: row.status,
// //           notes: row.notes,
// //           applied_at: row.applied_at,
// //           updated_at: row.updated_at,
// //           name: row.candidate_name,
// //           email: row.candidate_email,
// //           registration_number: includeRegistration ? row.candidate_registration : null
// //         }));
// //       };

// //       try {
// //         applications = await runQuery(true);
// //       } catch (innerErr) {
// //         if (innerErr.code === 'ER_BAD_FIELD_ERROR') {
// //           applications = await runQuery(false);
// //         } else {
// //           throw innerErr;
// //         }
// //       }
// //     } catch (err) {
// //       const benignCodes = ['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'];
// //       if (!benignCodes.includes(err.code)) {
// //         console.error('Get job applications query error:', err);
// //         throw err;
// //       }
// //       applications = [];
// //     }

// //     res.json({
// //       job: { ...job.toJSON(), applications }
// //     });
// //   } catch (error) {
// //     console.error('Get job applications error:', error);
// //     res.status(500).json({ message: 'Server error fetching job applications' });
// //   }
// // });

// module.exports = router;
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const Job = require('../models/Job');
const Recruiter = require('../models/Recruiter');
const User = require('../models/User');

const { verifyToken, verifyTokenOptional, requireRecruiter } = require('../middleware/auth');
const { sendJobAlertEmail, sendNewJobPostedEmail, sendEmail } = require('../utils/email');
const RecruiterNotification = require('../models/RecruiterNotification');

const router = express.Router();

const ensureFavouriteCompaniesTable = async (req) => {
  await req.db.pool.execute(`
    CREATE TABLE IF NOT EXISTS favourite_companies (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      company_id BIGINT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_company (user_id, company_id),
      INDEX idx_user (user_id),
      INDEX idx_company (company_id)
    )
  `);
};

const ensureUserNotificationsTable = async (req) => {
  await req.db.pool.execute(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      application_id INT NULL,
      message TEXT NOT NULL,
      metadata JSON NULL,
      status ENUM('unread','read') DEFAULT 'unread',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_notifications_user_id (user_id),
      INDEX idx_user_notifications_application_id (application_id)
    )
  `);
};

const notifyFavouriteCompanyFollowersForNewJob = async (req, payload = {}) => {
  const companyId = Number.parseInt(payload.companyId, 10);
  const jobId = Number.parseInt(payload.jobId, 10);
  const companyName = (payload.companyName || 'Company').trim();
  const jobTitle = (payload.jobTitle || 'New Job').trim();
  const excludeUserId = payload.excludeUserId ? Number.parseInt(payload.excludeUserId, 10) : null;

  if (!Number.isFinite(companyId) || !Number.isFinite(jobId)) return;

  await ensureFavouriteCompaniesTable(req);
  await ensureUserNotificationsTable(req);

  const [followers] = await req.db.pool.execute(
    `
      SELECT user_id
      FROM favourite_companies
      WHERE company_id = ?
    `,
    [companyId]
  );

  let recipientIds = (followers || [])
    .map((row) => Number.parseInt(row.user_id, 10))
    .filter((id) => Number.isFinite(id));

  if (Number.isFinite(excludeUserId)) {
    recipientIds = recipientIds.filter((id) => id !== excludeUserId);
  }

  if (recipientIds.length === 0) return;

  const title = `New job from ${companyName}`;
  const message = `${companyName} posted: ${jobTitle}`;
  const metadata = JSON.stringify({
    type: 'FAV_COMPANY_NEW_JOB',
    title,
    message,
    entityType: 'JOB',
    entityId: jobId,
    companyId,
    companyName,
    jobTitle
  });

  const valuesClause = recipientIds.map(() => '(?, NULL, ?, ?, \'unread\', NOW(), NOW())').join(', ');
  const params = [];

  recipientIds.forEach((userId) => {
    params.push(userId, message, metadata);
  });

  try {
    const notificationValuesClause = recipientIds
      .map(() => '(?, \'FAV_COMPANY_NEW_JOB\', ?, ?, \'JOB\', ?, 0, NOW())')
      .join(', ');
    const notificationParams = [];

    recipientIds.forEach((userId) => {
      notificationParams.push(userId, title, message, jobId);
    });

    await req.db.pool.execute(
      `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          is_read,
          created_at
        )
        VALUES ${notificationValuesClause}
      `,
      notificationParams
    );
  } catch (error) {
    // Compatibility fallback: many deployments still use user_notifications as the user notification feed.
  }

  await req.db.pool.execute(
    `
      INSERT INTO user_notifications (
        user_id,
        application_id,
        message,
        metadata,
        status,
        created_at,
        updated_at
      )
      VALUES ${valuesClause}
    `,
    params
  );
};

const toBoolean = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1' || value === 1;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const parsePositiveInteger = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number) || number <= 0) return null;
  return number;
};

const trimString = (value) => (typeof value === 'string' ? value.trim() : value);
const isValidDate = (value) => {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = new Date(trimmed);
  return !Number.isNaN(parsed.getTime());
};

const normalizeDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const datePart = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const findActiveDuplicateJobForRecruiter = async (req, jobPayload) => {
  const deadlineDate = normalizeDateOnly(jobPayload.application_deadline);

  const [rows] = await req.db.pool.execute(
    `
      SELECT id
      FROM jobs
      WHERE recruiter_id = ?
        AND LOWER(TRIM(COALESCE(title, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(company, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(location, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(employment_type, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(experience_level, ''))) = LOWER(TRIM(?))
        AND salary_min <=> ?
        AND salary_max <=> ?
        AND LOWER(TRIM(COALESCE(description, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(requirements, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(benefits, ''))) = LOWER(TRIM(?))
        AND LOWER(TRIM(COALESCE(skills_required, ''))) = LOWER(TRIM(?))
        AND (
          (? IS NULL AND application_deadline IS NULL) OR
          (? IS NOT NULL AND DATE(application_deadline) = ?)
        )
        AND (
          application_deadline IS NULL OR DATE(application_deadline) >= CURDATE()
        )
      ORDER BY id DESC
      LIMIT 1
    `,
    [
      jobPayload.recruiter_id,
      jobPayload.title || '',
      jobPayload.company || '',
      jobPayload.location || '',
      jobPayload.employment_type || '',
      jobPayload.experience_level || '',
      jobPayload.salary_min,
      jobPayload.salary_max,
      jobPayload.description || '',
      jobPayload.requirements || '',
      jobPayload.benefits || '',
      jobPayload.skills_required || '',
      deadlineDate,
      deadlineDate,
      deadlineDate
    ]
  );

  return rows?.[0] || null;
};

const isValidEmail = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const normalizeEnumToken = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseEnumValuesFromColumnType = (columnType) => {
  if (!columnType || typeof columnType !== 'string') return [];
  const match = columnType.match(/^enum\((.*)\)$/i);
  if (!match || !match[1]) return [];

  return match[1]
    .split(',')
    .map((segment) => segment.trim().replace(/^'/, '').replace(/'$/, '').replace(/\\'/g, "'"))
    .filter(Boolean);
};

const EXPERIENCE_CANONICAL_ALIASES = {
  ENTRY_LEVEL: ['ENTRY_LEVEL', 'Entry Level', 'Entry', 'Fresher', 'Junior'],
  INTERNSHIP_LEVEL: ['INTERNSHIP_LEVEL', 'Internship Level', 'Internship', 'Intern'],
  MID_LEVEL: ['MID_LEVEL', 'Mid Level', 'Mid'],
  SENIOR_LEVEL: ['SENIOR_LEVEL', 'Senior Level', 'Senior'],
  EXECUTIVE_LEVEL: ['EXECUTIVE_LEVEL', 'Executive Level', 'Executive']
};

const STATUS_CANONICAL_ALIASES = {
  DRAFT: ['DRAFT', 'Draft'],
  OPEN: ['OPEN', 'Open', 'Active'],
  CLOSED: ['CLOSED', 'Closed', 'Expired', 'Inactive'],
  PAUSED: ['PAUSED', 'Paused']
};

const EMPLOYMENT_TYPE_DISPLAY = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Internship'
};

const getBodyValue = (body, ...keys) => {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
      return body[key];
    }
  }
  return undefined;
};

const isJobOpenForApplications = (status) => {
  const token = normalizeEnumToken(status);
  return token === 'OPEN' || token === 'ACTIVE';
};

const isDeadlinePassed = (applicationDeadline) => {
  if (!applicationDeadline) return false;
  const deadline = new Date(applicationDeadline);
  if (Number.isNaN(deadline.getTime())) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  return deadlineDate < todayStart;
};

const canonicalizeExperienceLevel = (value) => {
  const token = normalizeEnumToken(value || 'MID_LEVEL');
  if (token === 'FRESHER' || token === 'JUNIOR') return 'ENTRY_LEVEL';
  if (token === 'INTERNSHIP' || token === 'INTERN') return 'INTERNSHIP_LEVEL';
  if (token === 'MID' || token === 'MIDDLE') return 'MID_LEVEL';
  if (token === 'SENIOR') return 'SENIOR_LEVEL';
  if (token === 'EXECUTIVE') return 'EXECUTIVE_LEVEL';
  return token || 'MID_LEVEL';
};

const canonicalizeStatus = (value) => {
  const token = normalizeEnumToken(value || 'OPEN');
  if (token === 'ACTIVE' || token === 'OPENED') return 'OPEN';
  if (token === 'INACTIVE' || token === 'EXPIRED') return 'CLOSED';
  return token || 'OPEN';
};

const normalizeEmploymentType = (value) => {
  const token = normalizeEnumToken(value || 'FULL_TIME');
  return EMPLOYMENT_TYPE_DISPLAY[token] || trimString(value) || 'Full-time';
};

const resolveEnumValue = (canonicalValue, allowedValues, aliasesMap) => {
  if (!Array.isArray(allowedValues) || allowedValues.length === 0) return null;

  const candidates = [
    canonicalValue,
    ...(aliasesMap[canonicalValue] || [])
  ].filter(Boolean);

  const directMatch = candidates.find((candidate) => allowedValues.includes(candidate));
  if (directMatch) return directMatch;

  const allowedByToken = new Map(
    allowedValues.map((allowed) => [normalizeEnumToken(allowed), allowed])
  );

  for (const candidate of candidates) {
    const token = normalizeEnumToken(candidate);
    if (allowedByToken.has(token)) {
      return allowedByToken.get(token);
    }
  }

  return null;
};

let jobsEnumCache = { loadedAt: 0, data: null };
const JOB_ENUM_CACHE_TTL_MS = 60 * 1000;
let jobApplicationsEnumCache = { loadedAt: 0, values: [] };
const JOB_APPLICATIONS_ENUM_CACHE_TTL_MS = 60 * 1000;

const getJobsEnumDefinitions = async (req) => {
  const now = Date.now();
  if (jobsEnumCache.data && now - jobsEnumCache.loadedAt < JOB_ENUM_CACHE_TTL_MS) {
    return jobsEnumCache.data;
  }

  try {
    const [rows] = await req.db.pool.execute(
      `
        SELECT COLUMN_NAME, COLUMN_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'jobs'
          AND COLUMN_NAME IN ('experience_level', 'status')
      `
    );

    const enumData = {
      experience_level: [],
      status: []
    };

    for (const row of rows || []) {
      const values = parseEnumValuesFromColumnType(row.COLUMN_TYPE);
      if (row.COLUMN_NAME === 'experience_level') enumData.experience_level = values;
      if (row.COLUMN_NAME === 'status') enumData.status = values;
    }

    jobsEnumCache = { loadedAt: now, data: enumData };
    return enumData;
  } catch (error) {
    return {
      experience_level: [],
      status: []
    };
  }
};

const getJobApplicationsStatusEnumValues = async (req) => {
  const now = Date.now();
  if (
    Array.isArray(jobApplicationsEnumCache.values) &&
    jobApplicationsEnumCache.values.length > 0 &&
    now - jobApplicationsEnumCache.loadedAt < JOB_APPLICATIONS_ENUM_CACHE_TTL_MS
  ) {
    return jobApplicationsEnumCache.values;
  }

  try {
    const [rows] = await req.db.pool.execute(
      `
        SELECT COLUMN_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'job_applications'
          AND COLUMN_NAME = 'status'
      `
    );

    const values = parseEnumValuesFromColumnType(rows?.[0]?.COLUMN_TYPE || '');
    jobApplicationsEnumCache = { loadedAt: now, values };
    return values;
  } catch (error) {
    return [];
  }
};

/* -------------------------
   Multer setup for resume uploads
--------------------------*/
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/\s+/g, '-')
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF, DOC, DOCX files are allowed'));
  }
});

const companyLogoDir = path.join(__dirname, '..', 'uploads', 'company-logos');
if (!fs.existsSync(companyLogoDir)) {
  fs.mkdirSync(companyLogoDir, { recursive: true });
}

const companyLogoStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, companyLogoDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const base = path.basename(file.originalname || 'company-logo', ext)
      .replace(/[^a-z0-9-_]/gi, '-')
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const companyLogoUpload = multer({
  storage: companyLogoStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PNG, JPG, JPEG, WEBP, SVG files are allowed for company logo'));
  }
});

const introVideoDir = path.join(__dirname, '..', 'uploads', 'introduction-videos');
if (!fs.existsSync(introVideoDir)) {
  fs.mkdirSync(introVideoDir, { recursive: true });
}

const introVideoStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, introVideoDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const safeExt = ext || '.mp4';
    const applicationId = req.params.applicationId || 'app';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `intro-${applicationId}-${uniqueSuffix}${safeExt}`);
  }
});

const introVideoAllowedTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

const introVideoUpload = multer({
  storage: introVideoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (introVideoAllowedTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only MP4, MOV, or WebM videos are allowed'));
  }
});

/* ---------------------------------------------------
   USER APPLICATION LIST
--------------------------------------------------- */
router.get('/user/applications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        ja.id,
        ja.job_id,
        ja.status,
        ja.applied_at,
        ja.total_view_seconds,
        j.title AS job_title,
        j.company AS company_name,
        j.location AS job_location,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        iv.id AS intro_video_id,
        iv.file_path AS intro_video_path,
        iv.uploaded_at AS intro_video_uploaded_at
      FROM job_applications ja
      LEFT JOIN jobs j ON j.id = ja.job_id
      LEFT JOIN introduction_videos iv ON iv.application_id = ja.id
      WHERE ja.user_id = ?
      ORDER BY ja.applied_at DESC
    `;

    let rows;
    try {
      [rows] = await req.db.pool.execute(sql, [userId]);
    } catch (err) {
      if (['ER_BAD_FIELD_ERROR', 'ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(err.code)) {
        const fallbackSql = `
          SELECT 
            ja.id,
            ja.job_id,
            ja.status,
            ja.applied_at,
            j.title AS job_title,
            j.company AS company_name,
            j.location AS job_location,
            j.salary_min,
            j.salary_max,
            j.salary_currency
          FROM job_applications ja
          LEFT JOIN jobs j ON j.id = ja.job_id
          WHERE ja.user_id = ?
          ORDER BY ja.applied_at DESC
        `;
        [rows] = await req.db.pool.execute(fallbackSql, [userId]);
      } else {
        throw err;
      }
    }

    const applications = rows.map(app => {
      const normalizedStatus = (app.status || '').toLowerCase();
      const isShortlisted = normalizedStatus === 'shortlisted';
      const hasIntroVideo = Boolean(app.intro_video_id);
      const videoStatus = isShortlisted ? (hasIntroVideo ? 'Video Uploaded' : 'Video Pending') : null;

      return {
        id: app.id,
        jobId: app.job_id,
        jobTitle: app.job_title || 'Job',
        company: app.company_name || 'Company',
        location: app.job_location || 'Remote',
        salary: `${app.salary_currency || 'INR'} ${app.salary_min ?? '-'} - ${app.salary_max ?? '-'}`,
        status: app.status || 'Under Review',
        appliedDate: app.applied_at ? new Date(app.applied_at).toDateString() : '',
        applicationId: `APP-${app.id}`,
        viewTimeSeconds: app.total_view_seconds ?? 0,
        videoStatus,
        videoUploadedAt: app.intro_video_uploaded_at || null
      };
    });

    res.json({ applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   WITHDRAW USER APPLICATION
--------------------------------------------------- */
router.delete('/user/applications/:applicationId', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const [[row]] = await req.db.pool.execute(
      'SELECT job_id FROM job_applications WHERE id = ? AND user_id = ?',
      [applicationId, userId]
    );
    if (!row) return res.status(404).json({ message: 'Application not found' });

    await req.db.pool.execute(
      'DELETE FROM job_applications WHERE id = ? AND user_id = ?',
      [applicationId, userId]
    );

    try {
      await req.db.pool.execute(
        'DELETE FROM applications WHERE job_id = ? AND user_id = ?',
        [row.job_id, userId]
      );
    } catch {}

    await req.db.pool.execute(
      'UPDATE jobs SET applications_count = GREATEST(applications_count - 1,0) WHERE id = ?',
      [row.job_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/user/applications/:applicationId/introduction-video',
  verifyToken,
  introVideoUpload.single('video'),
  async (req, res) => {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const cleanupFile = () => {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Intro video cleanup failed:', cleanupError);
        }
      }
    };

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video uploaded' });
      }

      const durationSeconds = Number(req.body?.durationSeconds || req.body?.duration_seconds || 0);
      if (Number.isFinite(durationSeconds) && durationSeconds > 90) {
        cleanupFile();
        return res.status(400).json({ success: false, message: 'Video must be 90 seconds or less' });
      }

      const [rows] = await req.db.pool.execute(
        `
          SELECT
            ja.id,
            ja.status,
            ja.user_id,
            ja.job_id,
            j.title AS job_title,
            j.recruiter_id,
            r.email AS recruiter_email,
            r.name AS recruiter_name,
            u.name AS user_name,
            u.email AS user_email
          FROM job_applications ja
          LEFT JOIN jobs j ON ja.job_id = j.id
          LEFT JOIN recruiters r ON j.recruiter_id = r.id
          LEFT JOIN users u ON ja.user_id = u.id
          WHERE ja.id = ? AND ja.user_id = ?
        `,
        [applicationId, userId]
      );

      if (!rows || rows.length === 0) {
        cleanupFile();
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const application = rows[0];
      const isShortlisted = (application.status || '').toLowerCase() === 'shortlisted';
      if (!isShortlisted) {
        cleanupFile();
        return res.status(400).json({ success: false, message: 'Only shortlisted applications can upload a video' });
      }

      const [existing] = await req.db.pool.execute(
        'SELECT id FROM introduction_videos WHERE application_id = ? LIMIT 1',
        [applicationId]
      );
      if (existing && existing.length > 0) {
        cleanupFile();
        return res.status(409).json({ success: false, message: 'An introduction video is already uploaded' });
      }

      const publicPath = `/uploads/introduction-videos/${req.file.filename}`;
      await req.db.pool.execute(
        `
          INSERT INTO introduction_videos (
            application_id,
            user_id,
            job_id,
            recruiter_id,
            file_name,
            file_path,
            file_size,
            duration_seconds,
            uploaded_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        `,
        [
          applicationId,
          userId,
          application.job_id,
          application.recruiter_id,
          req.file.originalname,
          publicPath,
          req.file.size,
          Number.isFinite(durationSeconds) && durationSeconds > 0 ? Math.round(durationSeconds) : null
        ]
      );

      if (application.recruiter_email) {
        const recruiterSubject = `New introduction video uploaded for ${application.job_title || 'a role'}`;
        const recruiterHtml = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
            <p>Hi ${application.recruiter_name || 'Recruiter'},</p>
            <p>${application.user_name || 'A candidate'} has uploaded an introduction video for <strong>${application.job_title || 'your role'}</strong>.</p>
            <p>Log in to TrueHire to review the video in the candidate application.</p>
            <p style="margin-top:20px;font-size:12px;color:#6b7280;">TrueHire · Building careers with purpose</p>
          </div>
        `;

        try {
          await sendEmail(application.recruiter_email, recruiterSubject, recruiterHtml);
        } catch (emailError) {
          console.error('Recruiter intro video email failed:', emailError);
        }
      }

      try {
        await RecruiterNotification.create({
          recruiterId: application.recruiter_id,
          type: 'VIDEO_UPLOADED',
          title: 'Intro Video Uploaded ??',
          message: `${application.user_name || 'A candidate'} has uploaded an introduction video for the role of ${application.job_title || 'this role'}.`,
          applicationId
        });
      } catch (notificationError) {
        console.error('Recruiter video notification failed:', notificationError);
      }

      return res.json({
        success: true,
        applicationId,
        status: 'uploaded',
        video: {
          fileName: req.file.originalname,
          filePath: publicPath,
          fileSize: req.file.size,
          durationSeconds: Number.isFinite(durationSeconds) ? Math.round(durationSeconds) : null
        }
      });
    } catch (error) {
      console.error('Upload introduction video error:', error);
      cleanupFile();
      return res.status(500).json({ success: false, message: 'Failed to upload introduction video' });
    }
  }
);

/* ---------------------------------------------------
   GET ALL JOBS (PUBLIC)
--------------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    await Job.expirePastDeadlineJobs();

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;

    const jobs = await Job.findActive(limit, offset);
    const jobIds = jobs.map((job) => Number(job.id)).filter((id) => Number.isFinite(id));
    const viewsMap = await Job.getViewCountsByJobIds(jobIds);

    res.json({
      jobs: jobs.map((j) => {
        const data = j.toJSON();
        const count = viewsMap.get(Number(j.id));
        return {
          ...data,
          views_count: Number.isFinite(count) ? count : Number(data.views_count || 0)
        };
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
/* ---------------------------------------------------
//    GET JOBS FOR CURRENT RECRUITER
// --------------------------------------------------- */
router.get('/recruiter/my-jobs', verifyToken, requireRecruiter, async (req, res) => {
   try {
    await Job.expirePastDeadlineJobs();

    const recruiterId = (req.user.role === 'sub-recruiter' && req.user.mainRecruiterId)
     ? req.user.mainRecruiterId
      : req.user.id;

   const recruiterRecord = await Recruiter.findById(recruiterId).catch(() => null);
   const recruiterKeys = [recruiterId];
   if (recruiterRecord?.recruiter_id && String(recruiterRecord.recruiter_id) !== String(recruiterId)) {
     recruiterKeys.push(recruiterRecord.recruiter_id);
   }

   let jobs = [];
   if (recruiterKeys.length === 1) {
     jobs = await Job.findByRecruiter(recruiterId);
   } else {
     const placeholders = recruiterKeys.map(() => '?').join(',');
     const [rows] = await req.db.pool.execute(
       `SELECT *
        FROM jobs
        WHERE recruiter_id IN (${placeholders})
          AND status <> 'Expired'
          AND (application_deadline IS NULL OR DATE(application_deadline) >= CURDATE())
        ORDER BY created_at DESC`,
       recruiterKeys
     );
     jobs = rows.map(row => new Job(row));
   }

   const jobIds = jobs.map((job) => Number(job.id)).filter((id) => Number.isFinite(id));
   const viewsMap = await Job.getViewCountsByJobIds(jobIds);

   res.json({
      success: true,
      jobs: jobs.map((job) => {
        const payload = job.toJSON();
        const count = viewsMap.get(Number(job.id));
        return {
          ...payload,
          views_count: Number.isFinite(count) ? count : Number(payload.views_count || 0)
        };
      })
    });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching recruiter jobs' });
  }
});
/* ---------------------------------------------------
   APPLY FOR JOB (USER)
--------------------------------------------------- */
router.post('/:id/apply', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;
    const {
      name,
      email,
      phone,
      location,
      experience_level,
      current_salary,
      expected_salary,
      notice_period,
      additionalComments,
      additional_comments,
      coverLetter
    } = req.body;

    const job = await Job.findById(jobId);
    if (!job || !isJobOpenForApplications(job.status) || isDeadlinePassed(job.application_deadline)) {
      return res.status(400).json({ message: 'Job not available' });
    }

    if (Number.isFinite(job.max_applicants) && job.max_applicants > 0) {
      const [[countRow]] = await req.db.pool.execute(
        'SELECT COUNT(*) AS total FROM job_applications WHERE job_id = ?',
        [jobId]
      );
      const totalApplications = Number(countRow?.total || 0);
      if (totalApplications >= job.max_applicants) {
        return res.status(400).json({
          message: 'Application limit reached for this job'
        });
      }
    }

    const userProfile = await User.getCompleteProfile(userId);
    const profileCompleteness = Math.max(
      Number(userProfile?.profile_complete || 0),
      Number(userProfile?.profileCompleteness || 0)
    );
    if (!Number.isFinite(profileCompleteness) || profileCompleteness < 80) {
      return res.status(400).json({
        message: 'Please complete your profile (minimum 80%) before applying for jobs'
      });
    }

    const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : null;
    const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');
    const toNullableNumber = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const match = String(value).match(/[\d,.]+/);
      if (!match) return null;
      const cleaned = match[0].replace(/,/g, '');
      const num = Number(cleaned);
      return Number.isFinite(num) ? num : null;
    };

    const applicationName = sanitizeString(name);
    const applicationEmail = sanitizeString(email);
    const applicationPhone = sanitizeString(phone);
    const applicationLocation = sanitizeString(location);
    const applicationExperience = sanitizeString(experience_level);
    const applicationNoticePeriod = sanitizeString(notice_period);
    const applicationComments = sanitizeString(
      additionalComments || additional_comments || coverLetter
    ) || null;
    const currentSalary = toNullableNumber(current_salary);
    const expectedSalary = toNullableNumber(expected_salary);

    const applicationSql = `
      INSERT INTO applications (
        job_id, user_id, name, email, phone, location,
        experience_level, current_salary, expected_salary,
        notice_period, additional_comments, resume_path, applied_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        location = VALUES(location),
        experience_level = VALUES(experience_level),
        current_salary = VALUES(current_salary),
        expected_salary = VALUES(expected_salary),
        notice_period = VALUES(notice_period),
        additional_comments = COALESCE(VALUES(additional_comments), additional_comments),
        resume_path = COALESCE(VALUES(resume_path), resume_path),
        applied_at = VALUES(applied_at)
    `;

    const applicationParams = [
      jobId,
      userId,
      applicationName || null,
      applicationEmail || null,
      applicationPhone || null,
      applicationLocation || null,
      applicationExperience || null,
      currentSalary,
      expectedSalary,
      applicationNoticePeriod || null,
      applicationComments,
      resumePath
    ];

    const allowedApplicationStatuses = await getJobApplicationsStatusEnumValues(req);
    const normalizedStatusLookup = new Map(
      (allowedApplicationStatuses || []).map((status) => [normalizeEnumToken(status), status])
    );
    const appliedStatus =
      normalizedStatusLookup.get('APPLIED_AWAITING_RECRUITER_RESPONSE') ||
      normalizedStatusLookup.get('APPLIED') ||
      normalizedStatusLookup.get('PENDING') ||
      allowedApplicationStatuses[0] ||
      'APPLIED';

    const jobApplicationSql = `
      INSERT INTO job_applications (
        job_id,
        user_id,
        status,
        notes,
        applied_at,
        smart_timer_started_at,
        smart_suggestion_triggered,
        recruiter_last_action_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW(), 0, NULL)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        notes = COALESCE(VALUES(notes), notes),
        applied_at = NOW(),
        smart_timer_started_at = NOW(),
        smart_suggestion_triggered = 0,
        recruiter_last_action_at = NULL
    `;

    const jobApplicationParams = [
      jobId,
      userId,
      appliedStatus,
      applicationComments
    ];

    let applicationResult;
    let jobApplicationResult;
    const connection = await req.db.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [[lockedJobRow]] = await connection.execute(
        'SELECT id, max_applicants FROM jobs WHERE id = ? FOR UPDATE',
        [jobId]
      );

      if (!lockedJobRow) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Job not found' });
      }

      const limit = Number(lockedJobRow.max_applicants);
      if (Number.isFinite(limit) && limit > 0) {
        const [[countRow]] = await connection.execute(
          'SELECT COUNT(*) AS total FROM job_applications WHERE job_id = ?',
          [jobId]
        );
        const totalApplications = Number(countRow?.total || 0);
        if (totalApplications >= limit) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: 'Application limit reached for this job' });
        }
      }

      try {
        [applicationResult] = await connection.execute(applicationSql, applicationParams);
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_TABLE_ERROR') {
          console.warn('applications table missing, skipping detailed application insert');
        } else {
          throw err;
        }
      }

      [jobApplicationResult] = await connection.execute(jobApplicationSql, jobApplicationParams);

      const isNewJobApplication = jobApplicationResult.affectedRows === 1;
      if (isNewJobApplication) {
        await connection.execute(
          'UPDATE jobs SET applications_count = applications_count + 1 WHERE id = ?',
          [jobId]
        );
      }

      await connection.commit();
      connection.release();
    } catch (transactionErr) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Apply job rollback error:', rollbackErr);
      }
      connection.release();
      throw transactionErr;
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application_id: applicationResult?.insertId || jobApplicationResult.insertId || null
    });
  } catch (err) {
    const dbMessage = err?.sqlMessage || err?.message || 'Unknown database error';

    if (
      err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
      err.code === 'ER_WARN_DATA_OUT_OF_RANGE' ||
      err.code === 'ER_WARN_DATA_TRUNCATED' ||
      err.code === 'ER_DATA_TOO_LONG'
    ) {
      return res.status(400).json({
        message: 'Invalid application field value',
        details: dbMessage
      });
    }

    console.error('Apply job error:', {
      code: err?.code,
      message: dbMessage,
      stack: err?.stack,
      jobId: req.params?.id,
      userId: req.user?.id
    });
    res.status(500).json({
      message: 'Server error',
      details: dbMessage
    });
  }
});

/* ---------------------------------------------------
   GET JOB BY ID
--------------------------------------------------- */
router.get('/:id', async (req, res) => {
  try {
    await Job.expirePastDeadlineJobs();

    const job = await Job.findById(req.params.id);
    if (!job || !isJobOpenForApplications(job.status) || isDeadlinePassed(job.application_deadline)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Note: View tracking is now handled separately via POST /:id/view
    const viewsCount = await Job.getViewCount(job.id);
    res.json({
      job: {
        ...job.toJSON(),
        views_count: viewsCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   RECORD JOB VIEW (UNIQUE USER TRACKING)
--------------------------------------------------- */
router.post('/:jobId/view', verifyTokenOptional, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.id || null;
    const isAuthenticated = Boolean(req.user && userId);
    const isUserRole = role === 'user';

    const deviceFingerprintHeader = req.header('x-device-fingerprint');
    const headerFingerprint =
      typeof deviceFingerprintHeader === 'string' && deviceFingerprintHeader.trim()
        ? deviceFingerprintHeader.trim()
        : null;

    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : null);
    const viewerIp =
      forwardedIp ||
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '0.0.0.0';

    const guestFingerprint = headerFingerprint || `ip:${viewerIp}`;

    console.log('[job-view] incoming', {
      jobId,
      role,
      userId,
      fingerprint: isAuthenticated ? null : guestFingerprint,
      ip: viewerIp
    });

    if (isAuthenticated && !isUserRole) {
      const viewsCount = await Job.getViewCount(jobId);
      return res.json({
        counted: false,
        views_count: viewsCount
      });
    }

    try {
      const result = await Job.recordUniqueView({
        jobId,
        userId: isAuthenticated && isUserRole ? userId : null,
        viewerFingerprint: isAuthenticated && isUserRole ? null : guestFingerprint,
        viewerIp
      });

      console.log('[job-view] insert result', {
        jobId,
        affectedRows: result.insertAffectedRows,
        counted: result.counted
      });

      console.log('[job-view] final count', {
        jobId,
        counted: result.counted,
        views_count: result.viewsCount
      });

      return res.json({
        counted: result.counted,
        views_count: result.viewsCount
      });
    } catch (trackError) {
      console.error('Record job view tracking failed:', trackError);
      const viewsCount = await Job.getViewCount(jobId);
      return res.json({
        counted: false,
        views_count: viewsCount
      });
    }
  } catch (error) {
    console.error('Record job view error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   CREATE JOB (RECRUITER)
--------------------------------------------------- */
router.post('/', verifyToken, requireRecruiter, companyLogoUpload.single('company_logo'), async (req, res) => {
  const recruiterId =
    req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;

  try {
    const recruiter = await Recruiter.refreshSubscriptionStatus(recruiterId);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const uploadedCompanyLogoPath = req.file ? `/uploads/company-logos/${req.file.filename}` : null;
    if (uploadedCompanyLogoPath) {
      try {
        await Recruiter.update(recruiterId, {
          company_logo: uploadedCompanyLogoPath,
          company_image: uploadedCompanyLogoPath
        });
      } catch (logoUpdateError) {
        console.error('Failed to update recruiter company logo:', logoUpdateError);
      }
    }

    const canPost =
      recruiter.job_post_limit > 0 || Recruiter.isPremiumActive(recruiter);

    if (!canPost) {
      return res.status(403).json({
        message: 'Job posting limit reached',
        code: 'JOB_POST_LIMIT_EXCEEDED'
      });
    }

    const enumDefinitions = await getJobsEnumDefinitions(req);
    const canonicalExperienceLevel = canonicalizeExperienceLevel(
      getBodyValue(req.body, 'experience_level', 'experienceLevel')
    );
    const canonicalStatus = canonicalizeStatus(req.body.status || 'OPEN');

    const resolvedExperienceLevel =
      resolveEnumValue(
        canonicalExperienceLevel,
        enumDefinitions.experience_level,
        EXPERIENCE_CANONICAL_ALIASES
      ) || canonicalExperienceLevel;

    const resolvedStatus =
      resolveEnumValue(canonicalStatus, enumDefinitions.status, STATUS_CANONICAL_ALIASES) ||
      canonicalStatus;

    const jobPayload = {
      recruiter_id: recruiterId,
      title: trimString(req.body.title),
      company: trimString(req.body.company),
      company_logo: uploadedCompanyLogoPath || recruiter.company_logo || null,
      location: trimString(req.body.location),
      employment_type: normalizeEmploymentType(
        getBodyValue(req.body, 'employment_type', 'employmentType', 'type')
      ),
      experience_level: resolvedExperienceLevel,
      salary_min: parseNumber(getBodyValue(req.body, 'salary_min', 'salaryMin')),
      salary_max: parseNumber(getBodyValue(req.body, 'salary_max', 'salaryMax')),
      salary_currency: trimString(getBodyValue(req.body, 'salary_currency', 'salaryCurrency')) || 'INR',
      description: trimString(req.body.description),
      requirements: trimString(req.body.requirements) || null,
      benefits: trimString(req.body.benefits) || null,
      skills_required: trimString(getBodyValue(req.body, 'skills_required', 'skillsRequired', 'category')) || null,
      max_applicants: parsePositiveInteger(getBodyValue(req.body, 'max_applicants', 'maxApplicants')),
      application_deadline: trimString(getBodyValue(req.body, 'application_deadline', 'applicationDue', 'deadline')) || null,
      status: resolvedStatus,
      is_featured: toBoolean(getBodyValue(req.body, 'is_featured', 'isFeatured')),
      is_urgent: toBoolean(getBodyValue(req.body, 'is_urgent', 'isUrgent'))
    };
    const contactEmail = trimString(getBodyValue(req.body, 'contact_email', 'contactEmail'));

    const missingFields = [
      { key: 'title', label: 'Title' },
      { key: 'company', label: 'Company' },
      { key: 'location', label: 'Location' },
      { key: 'description', label: 'Description' }
    ].filter(field => !jobPayload[field.key]);
    if (!contactEmail) {
      missingFields.push({ label: 'Contact Email' });
    }

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing required job details',
        missing: missingFields.map(field => field.label)
      });
    }

    if (!isValidEmail(contactEmail)) {
      return res.status(400).json({
        message: 'Invalid contact email'
      });
    }

    const validEmploymentTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
    if (!validEmploymentTypes.includes(jobPayload.employment_type)) {
      return res.status(400).json({
        message: 'Invalid employment type',
        allowed: validEmploymentTypes
      });
    }

    if (
      enumDefinitions.experience_level.length > 0 &&
      !enumDefinitions.experience_level.includes(jobPayload.experience_level)
    ) {
      return res.status(400).json({
        message: 'Invalid experience level',
        allowed: enumDefinitions.experience_level
      });
    }

    if (
      enumDefinitions.status.length > 0 &&
      !enumDefinitions.status.includes(jobPayload.status)
    ) {
      return res.status(400).json({
        message: 'Invalid job status',
        allowed: enumDefinitions.status
      });
    }

    if (!isValidDate(jobPayload.application_deadline)) {
      return res.status(400).json({
        message: 'Invalid application deadline date'
      });
    }

    if (
      jobPayload.salary_min !== null &&
      jobPayload.salary_max !== null &&
      jobPayload.salary_min > jobPayload.salary_max
    ) {
      return res.status(400).json({
        message: 'Invalid salary range: minimum salary cannot be greater than maximum salary'
      });
    }

    const requestedMaxApplicants = getBodyValue(req.body, 'max_applicants', 'maxApplicants');
    if (
      requestedMaxApplicants !== undefined &&
      requestedMaxApplicants !== null &&
      requestedMaxApplicants !== '' &&
      jobPayload.max_applicants === null
    ) {
      return res.status(400).json({
        message: 'Invalid maximum applicants value. Enter a whole number greater than 0.'
      });
    }

    const activeDuplicateJob = await findActiveDuplicateJobForRecruiter(req, jobPayload);
    if (activeDuplicateJob) {
      return res.status(409).json({
        message: 'You have already posted this job. The previous posting is still active until the deadline.',
        code: 'DUPLICATE_ACTIVE_JOB'
      });
    }

    // Idempotency guard: prevent rapid duplicate inserts from accidental double-submit/retry.
    try {
      const [recentRows] = await req.db.pool.execute(
        `
          SELECT *
          FROM jobs
          WHERE recruiter_id = ?
            AND title = ?
            AND company = ?
            AND location = ?
            AND description = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)
          ORDER BY id DESC
          LIMIT 1
        `,
        [
          recruiterId,
          jobPayload.title,
          jobPayload.company,
          jobPayload.location,
          jobPayload.description
        ]
      );

      if (Array.isArray(recentRows) && recentRows.length > 0) {
        const existingJob = new Job(recentRows[0]);
        return res.status(201).json({
          message: 'Job created successfully',
          job: existingJob.toJSON()
        });
      }
    } catch (dedupeError) {
      console.warn('Duplicate job guard check skipped:', dedupeError?.code || dedupeError?.message);
    }

    const jobId = await Job.create(jobPayload);

    if (recruiter.job_post_limit > 0) {
      await Recruiter.decrementJobPostLimit(recruiterId);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.error('Job created but could not be retrieved', { jobId, payload: jobPayload });
      return res.status(500).json({ message: 'Job created but could not be fetched' });
    }

    try {
      const companyName = recruiter.company_name || recruiter.company || job.company || 'Company';
      const excludeUserId = req.user?.role === 'user' ? req.user.id : null;
      await notifyFavouriteCompanyFollowersForNewJob(req, {
        companyId: recruiter.id,
        companyName,
        jobId: job.id,
        jobTitle: job.title,
        excludeUserId
      });
    } catch (notifyError) {
      console.error('Failed to notify favourite company followers:', notifyError);
    }

    const emails = await User.getAllUserEmails().catch(error => {
      console.error('Failed to load user emails for job alert:', error);
      return [];
    });

    if (emails.length > 0) {
      sendNewJobPostedEmail(emails, job).catch(err =>
        console.error('Job alert email failure:', err)
      );
    }

    res.status(201).json({
      message: 'Job created successfully',
      job: job.toJSON()
    });
  } catch (err) {
    const dbMessage = err?.sqlMessage || err?.message || 'Unknown database error';

    if (
      err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
      err.code === 'ER_WARN_DATA_OUT_OF_RANGE' ||
      err.code === 'ER_WARN_DATA_TRUNCATED'
    ) {
      return res.status(400).json({
        message: 'Invalid job field value',
        details: dbMessage
      });
    }

    console.error('Create job error:', {
      recruiterId,
      code: err.code,
      error: dbMessage,
      stack: err.stack,
      body: {
        title: req.body?.title,
        company: req.body?.company,
        location: req.body?.location,
        is_urgent: req.body?.is_urgent
      }
    });
    res.status(500).json({
      message: 'Unable to create job. Please try again.',
      details: dbMessage
    });
  }
});

/* ---------------------------------------------------
   UPDATE JOB (RECRUITER)
--------------------------------------------------- */
router.put('/:id', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.recruiter_id != req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hasDeadlineField = Object.prototype.hasOwnProperty.call(req.body, 'application_deadline');
    if (hasDeadlineField) {
      const rawDeadline = req.body.application_deadline;
      const newDeadline = typeof rawDeadline === 'string' ? rawDeadline.trim() : rawDeadline;
      const currentDeadline = job.application_deadline
        ? (job.application_deadline instanceof Date
            ? job.application_deadline.toISOString().slice(0, 10)
            : job.application_deadline.toString().slice(0, 10))
        : null;

      if (!newDeadline || newDeadline !== currentDeadline) {
        req.body.deadline_notification_sent_at = null;
      }
    }

    const success = await Job.update(req.params.id, req.body);
    if (!success) return res.status(404).json({ message: 'Job not found' });

    const updatedJob = await Job.findById(req.params.id);

    res.json({
      message: 'Job updated successfully',
      job: updatedJob.toJSON()
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/* ---------------------------------------------------
   DELETE JOB (RECRUITER)
--------------------------------------------------- */
router.delete('/:id', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.recruiter_id != req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const success = await Job.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'Job not found' });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------
   GET JOB APPLICATIONS (RECRUITER)
--------------------------------------------------- */
router.get('/:id/applications', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const recruiterId =
      req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
        ? req.user.mainRecruiterId
        : req.user.id;

    const recruiterRecord = await Recruiter.findById(recruiterId).catch(() => null);
    const recruiterMatches = new Set([String(recruiterId)]);
    if (recruiterRecord?.recruiter_id) {
      recruiterMatches.add(String(recruiterRecord.recruiter_id));
    }

    if (!recruiterMatches.has(String(job.recruiter_id)))
      return res.status(403).json({ message: 'Access denied' });

    const runQuery = async ({ includeDetails = true, includeIntroVideo = true } = {}) => {
      const sql = `
        SELECT
          ja.*,
          u.name AS candidateName,
          u.email AS candidateEmail
          ${includeDetails ? `,
          a.name AS detailed_name,
          a.email AS detailed_email,
          a.phone AS phone,
          a.location AS location,
          a.experience_level AS experience_level,
          a.current_salary AS current_salary,
          a.expected_salary AS expected_salary,
          a.notice_period AS notice_period,
          a.additional_comments AS additional_comments,
          a.resume_path AS resume_path,
          a.applied_at AS detailed_applied_at
          ` : ''}
          ${includeIntroVideo ? `,
          iv.file_path AS intro_video_url,
          iv.duration_seconds AS intro_video_duration_seconds,
          iv.uploaded_at AS intro_video_uploaded_at
          ` : ''}
        FROM job_applications ja
        LEFT JOIN users u ON u.id = ja.user_id
        ${includeDetails ? 'LEFT JOIN applications a ON a.job_id = ja.job_id AND a.user_id = ja.user_id' : ''}
        ${includeIntroVideo ? 'LEFT JOIN introduction_videos iv ON iv.application_id = ja.id' : ''}
        WHERE ja.job_id = ?
        ORDER BY ja.applied_at DESC
      `;
      const [rows] = await req.db.pool.execute(sql, [job.id]);
      return rows;
    };

    let applications = [];
    try {
      applications = await runQuery({ includeDetails: true, includeIntroVideo: true });
    } catch (queryErr) {
      const attempts = [
        { includeDetails: true, includeIntroVideo: false },
        { includeDetails: false, includeIntroVideo: false }
      ];
      let lastErr = queryErr;
      let recovered = false;
      for (const attempt of attempts) {
        try {
          applications = await runQuery(attempt);
          recovered = true;
          break;
        } catch (retryErr) {
          lastErr = retryErr;
        }
      }
      if (!recovered) throw lastErr;
    }

    res.json({ job: { ...job.toJSON(), applications } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

