// // module.exports = router;
// const express = require('express');
// const Recruiter = require('../models/Recruiter');
// const { verifyToken, requireRecruiter, generateToken } = require('../middleware/auth');
// const bcrypt = require('bcryptjs');
// const { pool } = require('../config/database');
// const multer = require('multer');
// const path = require('path');

// const router = express.Router();

// /* ⭐⭐⭐ PUBLIC ROUTE (NO TOKEN REQUIRED) ⭐⭐⭐
//    Fetch all companies from recruiters table
// */
// router.get('/companies', async (req, res) => {
//   try {
//     const query = `
//       SELECT 
//         recruiter_id AS id,
//         company_name,
//         industry,
//         company_size,
//         company_logo,
//         website,
//         short_overview
//       FROM recruiters
//     `;

//     const [rows] = await pool.execute(query);
//     res.json({ success: true, companies: rows });

//   } catch (error) {
//     console.error('Companies fetch error:', error);
//     res.status(500).json({ message: 'Server error fetching companies' });
//   }
// });

// // ===================== EXISTING ROUTES BELOW (UNCHANGED) =====================

// // Configure multer for logo uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/logos/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'logo-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'));
//     }
//   }
// });

// // Get all recruiters (admin only)
// router.get('/', verifyToken, require('../middleware/auth').requireAdmin, async (req, res) => {
//   try {
//     const recruiters = await Recruiter.findAll();
//     res.json({ recruiters });
//   } catch (error) {
//     console.error('Get recruiters error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get recruiter by ID
// router.get('/:id', verifyToken, async (req, res) => {
//   try {
//     const recruiter = await Recruiter.findById(req.params.id);
//     if (!recruiter) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     if (req.user.role !== 'admin' && req.user.id != req.params.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     res.json({ recruiter: recruiter.toJSON() });
//   } catch (error) {
//     console.error('Get recruiter error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update recruiter profile
// router.put('/:id', verifyToken, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin' && req.user.id != req.params.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     const updateData = req.body;
//     delete updateData.password;
//     delete updateData.email;

//     const success = await Recruiter.update(req.params.id, updateData);
//     if (!success) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     const updatedRecruiter = await Recruiter.findById(req.params.id);
//     res.json({
//       message: 'Recruiter updated successfully',
//       recruiter: updatedRecruiter.toJSON()
//     });
//   } catch (error) {
//     console.error('Update recruiter error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete recruiter (admin only)
// router.delete('/:id', verifyToken, require('../middleware/auth').requireAdmin, async (req, res) => {
//   try {
//     const success = await Recruiter.delete(req.params.id);
//     if (!success) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     res.json({ message: 'Recruiter deleted successfully' });
//   } catch (error) {
//     console.error('Delete recruiter error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get current recruiter's profile
// router.get('/profile/me', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const recruiter = await Recruiter.findById(req.user.id);
//     if (!recruiter) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     res.json({ recruiter: recruiter.toJSON() });
//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update current recruiter's profile
// router.put('/profile/me', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const updateData = req.body;
//     delete updateData.password;
//     delete updateData.email;

//     const success = await Recruiter.update(req.user.id, updateData);
//     if (!success) {
//       return res.status(500).json({ message: 'Failed to update profile' });
//     }

//     const updatedRecruiter = await Recruiter.findById(req.user.id);
//     res.json({
//       message: 'Profile updated successfully',
//       recruiter: updatedRecruiter.toJSON()
//     });
//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({ message: 'Failed to update profile' });
//   }
// });

// // Upload company logo
// router.post('/profile/logo', verifyToken, requireRecruiter, upload.single('logo'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     const logoUrl = `/uploads/logos/${req.file.filename}`;

//     const success = await Recruiter.update(req.user.id, { company_logo: logoUrl });
//     if (!success) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     res.json({
//       message: 'Logo uploaded successfully',
//       logoUrl: logoUrl
//     });
//   } catch (error) {
//     console.error('Logo upload error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Add sub-recruiter
// router.post('/sub-recruiters', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'Name, email, and password are required' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const subRecruiterData = {
//       name: name.trim(),
//       email: email.trim().toLowerCase(),
//       password: hashedPassword
//     };

//     const success = await Recruiter.addSubRecruiter(req.user.id, subRecruiterData);
//     if (!success) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     res.status(201).json({ message: 'Sub-recruiter added successfully' });
//   } catch (error) {
//     if (error.message === 'Maximum 3 sub-recruiters allowed per company') {
//       return res.status(400).json({ message: error.message });
//     }
//     console.error('Add sub-recruiter error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Remove sub-recruiter
// router.delete('/:id/sub-recruiters/:subRecruiterId', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     if (req.user.id != req.params.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     const success = await Recruiter.removeSubRecruiter(req.params.id, req.params.subRecruiterId);
//     if (!success) {
//       return res.status(404).json({ message: 'Recruiter or sub-recruiter not found' });
//     }

//     res.json({ message: 'Sub-recruiter removed successfully' });
//   } catch (error) {
//     console.error('Remove sub-recruiter error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get sub-recruiters
// router.get('/:id/sub-recruiters', verifyToken, requireRecruiter, async (req, res) => {
//   try {
//     if (req.user.id != req.params.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     const query = 'SELECT id, name, email, role, status, created_at FROM sub_recruiters WHERE recruiter_id = ?';
//     const [rows] = await pool.execute(query, [req.params.id]);

//     res.json({ sub_recruiters: rows });
//   } catch (error) {
//     console.error('Get sub-recruiters error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Authenticate sub-recruiter
// router.post('/sub-recruiter/login', async (req, res) => {
//   try {
//     const { companyEmail, subRecruiterEmail, password } = req.body;

//     if (!companyEmail || !subRecruiterEmail || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     const recruiter = await Recruiter.findByEmail(companyEmail.trim().toLowerCase());
//     if (!recruiter) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const subRecruiter = await Recruiter.findSubRecruiterByEmail(recruiter.id, subRecruiterEmail.trim().toLowerCase());
//     if (!subRecruiter) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const isValidPassword = await bcrypt.compare(password, subRecruiter.password);
//     if (!isValidPassword) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const subRecruiterUser = {
//       id: recruiter.id,
//       subRecruiterId: subRecruiter.id,
//       email: subRecruiter.email,
//       role: 'sub-recruiter',
//       company: recruiter.company,
//       mainRecruiterId: recruiter.id
//     };
//     const token = generateToken(subRecruiterUser);

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: recruiter.id,
//         subRecruiterId: subRecruiter.id,
//         name: subRecruiter.name,
//         email: subRecruiter.email,
//         role: 'sub-recruiter',
//         company: recruiter.company
//       }
//     });
//   } catch (error) {
//     console.error('Sub-recruiter login error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;
const express = require('express');
const Recruiter = require('../models/Recruiter');
const { verifyToken, requireRecruiter, generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { sendEmail, sendOTPEmail } = require('../utils/email');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otp');
const UserNotification = require('../models/UserNotification');
const RecruiterNotification = require('../models/RecruiterNotification');

const router = express.Router();

const ensureRecruiterSettingsColumns = async () => {
  const statements = [
    "ALTER TABLE recruiters ADD COLUMN login_type VARCHAR(50) NULL",
    "ALTER TABLE recruiters ADD COLUMN google_id VARCHAR(255) NULL",
    "ALTER TABLE recruiters MODIFY COLUMN password VARCHAR(255) NULL"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
};

const ensureRecruiterPhoneColumns = async () => {
  const statements = [
    "ALTER TABLE recruiters ADD COLUMN phone_number VARCHAR(20) NULL",
    "ALTER TABLE recruiters ADD COLUMN phone_verified TINYINT(1) DEFAULT 0",
    "ALTER TABLE recruiters ADD COLUMN phone_verified_at DATETIME NULL"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
};

const ensureRecruiterOnboardingColumns = async () => {
  const statements = [
    "ALTER TABLE recruiters ADD COLUMN onboarding_step INT NULL",
    "ALTER TABLE recruiters ADD COLUMN onboarding_completed_at DATETIME NULL"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
};

const ensureRecruiterCategoryColumn = async () => {
  try {
    await pool.execute("ALTER TABLE recruiters ADD COLUMN category VARCHAR(150) NULL AFTER company_type");
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error;
  }
};

const markRecruiterAction = async (applicationId) => {
  try {
    await pool.execute(
      'UPDATE job_applications SET recruiter_last_action_at = NOW() WHERE id = ?',
      [applicationId]
    );
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') {
      throw error;
    }
  }
};

const normalizeActivityType = (value) => (value || '').toString().trim().toLowerCase();
const ALLOWED_ACTIVITY_TYPES = new Set([
  'view',
  'shortlist',
  'reject',
  'message',
  'interview update'
]);

const ensureRecruiterPremiumColumns = async () => {
  const statements = [
    "ALTER TABLE recruiters ADD COLUMN is_premium TINYINT(1) DEFAULT 0",
    "ALTER TABLE recruiters ADD COLUMN premium_expiry DATE NULL",
    "ALTER TABLE recruiters ADD COLUMN premium_expiry_at DATETIME NULL"
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
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

  // Backward compatibility: older environments may have doc_type as ENUM.
  // Keep it as VARCHAR so new document types (e.g., Company Image) can be inserted.
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

const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes > 0 && remainder > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ${remainder} second${remainder === 1 ? '' : 's'}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${remainder} second${remainder === 1 ? '' : 's'}`;
};

const normalizeDurationSeconds = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
};

const allowedRejectionReasons = [
  'Skills mismatch',
  'Experience level does not meet job requirements',
  'Poor resume quality or formatting issues',
  'Missing required keywords (ATS screening)',
  'Lack of relevant projects or portfolio',
  'Incomplete or low-quality profile',
  'Weak or missing cover letter',
  'Cultural or team fit concerns',
  'Salary, location, or availability mismatch',
  'Position closed or an internal candidate selected'
];

const normalizeRejectionReason = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return allowedRejectionReasons.includes(trimmed) ? trimmed : null;
};

const getRecruiterIdFromRequest = (req) => (
  req.user?.role === 'sub-recruiter' && req.user?.mainRecruiterId
    ? req.user.mainRecruiterId
    : req.user.id
);

const ensureConversationForApplication = async ({ applicationId, jobId, recruiterId, userId }) => {
  const [rows] = await pool.execute(
    'SELECT id FROM application_conversations WHERE application_id = ? LIMIT 1',
    [applicationId]
  );
  if (rows[0]?.id) {
    return rows[0].id;
  }

  const [createdConversation] = await pool.execute(
    `
      INSERT INTO application_conversations (
        application_id,
        job_id,
        recruiter_id,
        user_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `,
    [applicationId, jobId, recruiterId, userId]
  );

  return createdConversation.insertId;
};

const createSystemMessage = async ({ applicationId, jobId, recruiterId, userId, message }) => {
  const conversationId = await ensureConversationForApplication({
    applicationId,
    jobId,
    recruiterId,
    userId
  });

  const [messageResult] = await pool.execute(
    `
      INSERT INTO application_messages (
        conversation_id,
        application_id,
        job_id,
        sender_id,
        sender_role,
        receiver_id,
        receiver_role,
        message,
        read_status,
        read_at,
        created_at
      )
      VALUES (?, ?, ?, 0, 'system', ?, 'user', ?, 'read', NOW(), NOW())
    `,
    [conversationId, applicationId, jobId, userId, message]
  );

  await pool.execute(
    `
      UPDATE application_conversations
      SET last_message_id = ?, last_message_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `,
    [messageResult.insertId, conversationId]
  );

  return messageResult.insertId;
};

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay credentials missing');
    error.code = 'RAZORPAY_CONFIG_MISSING';
    throw error;
  }

  const payload = JSON.stringify({
    amount,
    currency,
    receipt,
    payment_capture: 1,
    notes: notes || {}
  });

  const options = {
    hostname: 'api.razorpay.com',
    path: '/v1/orders',
    method: 'POST',
    auth: `${keyId}:${keySecret}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (response.statusCode >= 400) {
            const error = new Error(parsed.error?.description || 'Razorpay order failed');
            error.details = parsed;
            return reject(error);
          }
          return resolve(parsed);
        } catch (parseError) {
          return reject(parseError);
        }
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
};

/* ⭐⭐⭐ PUBLIC ROUTE (NO TOKEN REQUIRED) ⭐⭐⭐ */
router.get('/companies', async (req, res) => {
  try {
    await ensureRecruiterCategoryColumn();
    const query = `
      SELECT 
        id,
        recruiter_id,
        company_name,
        category,
        industry,
        company_size,
        company_logo,
        website,
        short_overview,
        detailed_description
      FROM recruiters
      WHERE approval_status = 'APPROVED'
    `;

    const [rows] = await pool.execute(query);
    res.json({ success: true, companies: rows });

  } catch (error) {
    const safeFallbackCodes = [
      'ER_BAD_FIELD_ERROR',
      'ER_NO_SUCH_TABLE',
      'ER_BAD_TABLE_ERROR',
      'ECONNREFUSED'
    ];

    if (!safeFallbackCodes.includes(error.code)) {
      console.error('Companies fetch error:', error);
      return res.status(500).json({ message: 'Server error fetching companies' });
    }

    try {
      const [rows] = await pool.execute(`
        SELECT
          id,
          recruiter_id,
          COALESCE(company_name, company) AS company_name,
          NULL AS category,
          NULL AS industry,
          NULL AS company_size,
          NULL AS company_logo,
          NULL AS website,
          NULL AS short_overview,
          NULL AS detailed_description
        FROM recruiters
        WHERE approval_status = 'APPROVED'
      `);

      return res.json({ success: true, companies: rows });
    } catch (fallbackError) {
      if (!safeFallbackCodes.includes(fallbackError.code)) {
        console.error('Companies fallback fetch error:', fallbackError);
      }
      return res.json({ success: true, companies: [] });
    }
  }
});

/* ===================== FILE UPLOAD SETUP ===================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/verification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `verification-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const verificationUpload = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';
    if (isImage || isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or image files are allowed'));
    }
  }
});

/* ===================== ADMIN ROUTES ===================== */

router.get('/', verifyToken, require('../middleware/auth').requireAdmin, async (req, res) => {
  try {
    const recruiters = await Recruiter.findAll();
    res.json({ recruiters });
  } catch (error) {
    console.error('Get recruiters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== MUST COME BEFORE /:id ROUTES ===================== */

// Get current recruiter's profile
router.get('/profile/me', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterOnboardingColumns();
    await ensureRecruiterPhoneColumns();
    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.json({ recruiter: recruiter.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/premium/order', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterPremiumColumns();
    const recruiterId = getRecruiterIdFromRequest(req);
    const recruiter = await Recruiter.findById(recruiterId);

    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }

    const rawAmount = Number(process.env.RAZORPAY_PREMIUM_AMOUNT || 499);
    const amountInPaise = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) : 49900;
    const currency = process.env.RAZORPAY_PREMIUM_CURRENCY || 'INR';
    const receipt = `premium-${recruiterId}-${Date.now()}`;
    const notes = { recruiterId: String(recruiterId), email: recruiter.email || '' };

    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt,
      notes
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || currency,
      recruiter: {
        id: recruiter.id,
        name: recruiter.name || recruiter.company || '',
        email: recruiter.email || ''
      }
    });
  } catch (error) {
    console.error('Create premium order error:', error);
    const message =
      error.code === 'RAZORPAY_CONFIG_MISSING'
        ? 'Payment gateway not configured'
        : 'Unable to initiate payment';
    res.status(500).json({ success: false, message });
  }
});

router.post('/premium/verify', verifyToken, requireRecruiter, async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Premium activation now occurs only after Razorpay webhook confirmation.'
  });
});

// Recruiter settings (password/login type)
router.get('/settings', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterSettingsColumns();
    const [rows] = await pool.execute(
      `
        SELECT login_type, password
        FROM recruiters
        WHERE id = ?
      `,
      [req.user.id]
    );

    const settings = rows && rows[0] ? rows[0] : {};
    res.json({
      success: true,
      settings: {
        loginType: settings.login_type || null,
        password: settings.password ? true : null
      }
    });
  } catch (error) {
    console.error('Recruiter settings fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
});

router.put('/settings/password', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterSettingsColumns();
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }

    const isGoogleOnly = recruiter.login_type === 'google' && !recruiter.password;

    if (isGoogleOnly) {
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
      }
    } else {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Current, new, and confirmation passwords are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
      }

      const isMatch = await bcrypt.compare(currentPassword, recruiter.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Recruiter.updatePassword(req.user.id, hashedPassword);
    if (isGoogleOnly) {
      await Recruiter.update(req.user.id, { login_type: 'google+password' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Recruiter password update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password' });
  }
});

// Send OTP for recruiter phone verification (OTP delivered to registered email)
router.post('/phone/send-otp', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterPhoneColumns();
    const phone = String(req.body?.phone || '').trim();

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!/^[0-9+()\-\s]{8,20}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const recruiter = await Recruiter.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const otp = generateOTP();
    const otpKey = `recruiter:${req.user.id}:phone:${phone}`;
    storeOTP(otpKey, otp);
    await sendOTPEmail(recruiter.email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP for recruiter phone number
router.post('/phone/verify-otp', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterPhoneColumns();
    const phone = String(req.body?.phone || '').trim();
    const otp = String(req.body?.otp || '').trim();

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const otpKey = `recruiter:${req.user.id}:phone:${phone}`;
    const otpResult = verifyOTP(otpKey, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.execute(
      'UPDATE recruiters SET phone_number = ?, phone_verified = 1, phone_verified_at = NOW() WHERE id = ?',
      [phone, req.user.id]
    );

    const updatedRecruiter = await Recruiter.findById(req.user.id);
    res.json({
      message: 'Phone verified successfully',
      recruiter: updatedRecruiter ? updatedRecruiter.toJSON() : null
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

const allowedVerificationDocs = new Set([
  'GST Certificate',
  'CIN',
  'Shop & Establishment Certificate',
  'MSME / Udyam Registration',
  'Incorporation Certificate',
  'Company PAN',
  'Company Image'
]);

const parseEnumValues = (columnType = '') => {
  const match = String(columnType).match(/^enum\((.*)\)$/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((token) => token.trim().replace(/^'/, '').replace(/'$/, ''))
    .filter(Boolean);
};

const resolveDocTypeForSchema = async (requestedDocType) => {
  try {
    const [rows] = await pool.execute(`SHOW COLUMNS FROM recruiter_verification_documents LIKE 'doc_type'`);
    const columnType = rows?.[0]?.Type || '';
    const enumValues = parseEnumValues(columnType);

    if (!enumValues.length) {
      return requestedDocType;
    }

    if (enumValues.includes(requestedDocType)) {
      return requestedDocType;
    }

    if (requestedDocType === 'Company Image') {
      if (enumValues.includes('Incorporation Certificate')) return 'Incorporation Certificate';
      if (enumValues.includes('Company PAN')) return 'Company PAN';
      return enumValues[0];
    }

    return enumValues.includes('Company PAN') ? 'Company PAN' : enumValues[0];
  } catch (error) {
    console.warn('Could not resolve doc_type compatibility, using requested value:', error?.message || error);
    return requestedDocType;
  }
};

// Get recruiter verification documents and status
router.get('/verification', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterVerificationTable();
    const [documents] = await pool.execute(
      `SELECT id, doc_type, file_path, company_image, status, rejection_reason, created_at, updated_at
       FROM recruiter_verification_documents
       WHERE recruiter_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    let status = 'Pending';
    if (documents.some(doc => doc.status === 'Verified')) {
      status = 'Verified';
    } else if (documents.some(doc => doc.status === 'Rejected')) {
      status = 'Rejected';
    }

    res.json({
      status,
      hasDocuments: documents.length > 0,
      documents
    });
  } catch (error) {
    console.error('Get verification documents error:', error);
    res.status(500).json({ message: 'Failed to load verification documents' });
  }
});

// Upload recruiter verification document
router.post('/verification', verifyToken, requireRecruiter, verificationUpload.single('document'), async (req, res) => {
  try {
    await ensureRecruiterVerificationTable();
    const requestedDocType = String(req.body?.doc_type || '').trim();

    if (!requestedDocType) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    if (!allowedVerificationDocs.has(requestedDocType)) {
      return res.status(400).json({ message: 'Unsupported document type' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Document file is required' });
    }

    const docType = await resolveDocTypeForSchema(requestedDocType);
    const publicPath = `/uploads/verification/${req.file.filename}`;
    const companyImagePath = requestedDocType === 'Company Image' ? publicPath : null;

    const [result] = await pool.execute(
      `INSERT INTO recruiter_verification_documents
       (recruiter_id, doc_type, file_path, company_image, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Pending', NOW(), NOW())`,
      [req.user.id, docType, publicPath, companyImagePath]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: result.insertId,
        doc_type: docType,
        requested_doc_type: requestedDocType,
        file_path: publicPath,
        company_image: companyImagePath,
        status: 'Pending'
      }
    });
  } catch (error) {
    console.error('Upload verification document error:', error);
    res.status(500).json({ message: 'Failed to upload document' });
  }
});

// Get applications across all jobs owned by current recruiter
router.get('/applications', verifyToken, requireRecruiter, async (req, res) => {
  try {
    // Sub-recruiters should see applications for their main recruiter
    const recruiterId = req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;

    const recruiterRecord = await Recruiter.findById(recruiterId).catch(() => null);
    const recruiterKeys = [recruiterId];
    if (recruiterRecord?.recruiter_id && String(recruiterRecord.recruiter_id) !== String(recruiterId)) {
      recruiterKeys.push(recruiterRecord.recruiter_id);
    }

    // Get the recruiter's job ids first to ensure we only pull matching applications.
    // Use recruiterKeys to support legacy jobs that stored recruiter_id as the string identifier.
    const jobPlaceholders = recruiterKeys.map(() => '?').join(',');
    const [jobRows] = await pool.execute(
      `SELECT id FROM jobs WHERE recruiter_id IN (${jobPlaceholders})`,
      recruiterKeys
    );

    if (!jobRows || jobRows.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    const jobIdList = jobRows.map(row => row.id);
    const placeholders = jobIdList.map(() => '?').join(',');

    let applications = [];
    try {
      const runQuery = async (opts = { includeRegistration: true, includeDetails: true, includeIntroVideo: true }) => {
        const { includeRegistration, includeDetails, includeIntroVideo } = opts;
        const sqlJobApplications = `
          SELECT
            ja.id AS applicationId,
            ja.job_id AS jobId,
            ja.user_id AS userId,
            ja.status AS status,
            ja.applied_at AS appliedAt,
            ja.notes AS notes,
            u.name AS candidateName,
            u.email AS candidateEmail
            ${includeRegistration ? ', u.registration_number AS candidateReg' : ''}
            ,
            j.title AS jobTitle,
            j.company AS jobCompany,
            j.location AS jobLocation
            ${includeIntroVideo ? `,
            iv.file_path AS introVideoUrl,
            iv.duration_seconds AS introVideoDurationSeconds,
            iv.uploaded_at AS introVideoUploadedAt
            ` : ''}
            ${includeDetails ? `,
            a.id AS detailedId,
            a.name AS detailedName,
            a.email AS detailedEmail,
            a.phone AS phone,
            a.location AS applicantLocation,
            a.experience_level AS experienceLevel,
            a.current_salary AS currentSalary,
            a.expected_salary AS expectedSalary,
            a.notice_period AS noticePeriod,
            a.additional_comments AS additionalComments,
            a.resume_path AS resumePath,
            a.applied_at AS detailedAppliedAt
            ` : ''}
          FROM job_applications ja
          LEFT JOIN users u ON ja.user_id = u.id
          LEFT JOIN jobs j ON ja.job_id = j.id
          ${includeIntroVideo ? 'LEFT JOIN introduction_videos iv ON iv.application_id = ja.id' : ''}
          ${includeDetails ? 'LEFT JOIN applications a ON a.job_id = ja.job_id AND a.user_id = ja.user_id' : ''}
          WHERE ja.job_id IN (${placeholders})
          ORDER BY ja.applied_at DESC
        `;

        const [rowsJa] = await pool.execute(sqlJobApplications, jobIdList);
        return rowsJa.map(row => ({
          applicationId: row.applicationId,
          jobId: row.jobId,
          userId: row.userId,
          status: row.status,
          appliedAt: row.detailedAppliedAt || row.appliedAt,
          notes: row.additionalComments || row.notes,
          candidateName: row.detailedName || row.candidateName,
          candidateEmail: row.detailedEmail || row.candidateEmail,
          candidateReg: includeRegistration ? row.candidateReg : null,
          jobTitle: row.jobTitle,
          jobCompany: row.jobCompany,
          jobLocation: row.jobLocation,
          phone: row.phone || null,
          location: row.applicantLocation || row.jobLocation || null,
          experience_level: row.experienceLevel || null,
          current_salary: row.currentSalary || null,
          expected_salary: row.expectedSalary || null,
          notice_period: row.noticePeriod || null,
          additional_comments: row.additionalComments || row.notes || null,
          resume_path: row.resumePath || null,
          intro_video_url: row.introVideoUrl || null,
          intro_video_duration_seconds: row.introVideoDurationSeconds || null,
          intro_video_uploaded_at: row.introVideoUploadedAt || null
        }));
      };

      try {
        applications = await runQuery({ includeRegistration: true, includeDetails: true, includeIntroVideo: true });
      } catch (innerErr) {
        const errMessage = String(innerErr?.sqlMessage || innerErr?.message || '');
        const introTableMissing = errMessage.includes('introduction_videos');
        const retryWithIntro = !introTableMissing;

        let recovered = false;
        const retryAttempts = [
          { includeRegistration: false, includeDetails: true, includeIntroVideo: retryWithIntro },
          { includeRegistration: false, includeDetails: true, includeIntroVideo: false },
          { includeRegistration: false, includeDetails: false, includeIntroVideo: retryWithIntro },
          { includeRegistration: false, includeDetails: false, includeIntroVideo: false }
        ];

        for (const attempt of retryAttempts) {
          try {
            applications = await runQuery(attempt);
            recovered = true;
            break;
          } catch (retryErr) {
            innerErr = retryErr;
          }
        }

        if (!recovered) {
          throw innerErr;
        }
      }
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_TABLE_ERROR') {
        throw err;
      }
      applications = [];
    }

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Get recruiter applications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// Get applicant profile for a specific application owned by current recruiter
router.get('/applications/:id/profile', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId = getRecruiterIdFromRequest(req);

  const normalizeJsonArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (error) {
          return [];
        }
      }
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const runProfileQuery = async ({ includeApplicationDetails = true } = {}) => {
    const detailsSelect = includeApplicationDetails
      ? `,
          a.resume_path AS resumePath,
          a.additional_comments AS additionalComments,
          a.applied_at AS detailedAppliedAt
        `
      : `,
          NULL AS resumePath,
          NULL AS additionalComments,
          NULL AS detailedAppliedAt
        `;

    const detailsJoin = includeApplicationDetails
      ? 'LEFT JOIN applications a ON a.job_id = ja.job_id AND a.user_id = ja.user_id'
      : '';

    const [rows] = await pool.execute(
      `
        SELECT
          ja.id AS applicationId,
          ja.job_id AS jobId,
          ja.user_id AS userId,
          ja.status AS applicationStatus,
          ja.applied_at AS appliedAt,
          j.title AS jobTitle,
          j.company AS jobCompany,
          j.location AS jobLocation
          ${detailsSelect},
          u.*
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        LEFT JOIN users u ON ja.user_id = u.id
        ${detailsJoin}
        WHERE ja.id = ? AND j.recruiter_id = ?
        LIMIT 1
      `,
      [applicationId, recruiterId]
    );

    return rows;
  };

  try {
    let rows = [];

    try {
      rows = await runProfileQuery({ includeApplicationDetails: true });
    } catch (error) {
      const isRecoverable =
        error?.code === 'ER_BAD_FIELD_ERROR' ||
        error?.code === 'ER_NO_SUCH_TABLE' ||
        error?.code === 'ER_BAD_TABLE_ERROR';
      if (!isRecoverable) throw error;
      rows = await runProfileQuery({ includeApplicationDetails: false });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const row = rows[0];
    if (!row.userId || !row.id) {
      return res.status(404).json({ success: false, message: 'Applicant profile not found' });
    }

    const applicant = {
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      contact_number: row.contact_number || null,
      current_location: row.current_location || null,
      professional_summary: row.professional_summary || null,
      core_skills: row.core_skills || null,
      secondary_skills: normalizeJsonArray(row.secondary_skills),
      languages_known: normalizeJsonArray(row.languages_known),
      soft_skills: normalizeJsonArray(row.soft_skills),
      projects: normalizeJsonArray(row.projects),
      certifications: normalizeJsonArray(row.certifications),
      current_salary: row.current_salary ?? null,
      expected_salary: row.expected_salary ?? null,
      salary_confidential: Boolean(row.salary_confidential),
      linkedin_url: row.linkedin_url || null,
      github_url: row.github_url || null,
      portfolio_url: row.portfolio_url || null,
      hobbies_interests: row.hobbies_interests || null,
      relocated: Boolean(row.relocated),
      profile_photo: row.profile_photo || null,
      profile_complete: row.profile_complete ?? 0,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    };

    const application = {
      applicationId: row.applicationId,
      jobId: row.jobId || null,
      userId: row.userId || null,
      status: row.applicationStatus || 'Applied',
      appliedAt: row.detailedAppliedAt || row.appliedAt || null,
      jobTitle: row.jobTitle || null,
      jobCompany: row.jobCompany || null,
      jobLocation: row.jobLocation || null,
      resume_path: row.resumePath || null,
      additional_comments: row.additionalComments || null
    };

    return res.json({ success: true, application, applicant });
  } catch (error) {
    console.error('Get applicant profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching applicant profile' });
  }
});

// Delete an application owned by current recruiter
router.delete('/applications/:id', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId = req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
    ? req.user.mainRecruiterId
    : req.user.id;

  try {
    // Verify application belongs to a job owned by this recruiter
    const [rows] = await pool.execute(
      `
        SELECT ja.job_id AS jobId, ja.user_id AS userId
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.recruiter_id = ?
      `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { jobId, userId } = rows[0];

    const [deleteResult] = await pool.execute(
      'DELETE FROM job_applications WHERE id = ?',
      [applicationId]
    );

    // Clean up detailed application if table exists
    try {
      await pool.execute(
        'DELETE FROM applications WHERE job_id = ? AND user_id = ?',
        [jobId, userId]
      );
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_TABLE_ERROR') {
        throw err;
      }
    }

    // Decrement applications count when a row was removed
    if (deleteResult.affectedRows > 0) {
      try {
        await pool.execute(
          'UPDATE jobs SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = ?',
          [jobId]
        );
      } catch (err) {
        // non-fatal
      }
    }

    return res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete recruiter application error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting application' });
  }
});

router.post('/applications/:id/record-view', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId =
    req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;

  try {
    const [rows] = await pool.execute(
      `
        SELECT ja.user_id AS userId,
               ja.job_id AS jobId
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.recruiter_id = ?
      `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];

    await markRecruiterAction(applicationId);

    await UserNotification.create({
      userId: application.userId,
      applicationId,
      message: 'A recruiter viewed your application.',
      metadata: {
        type: 'APPLICATION_VIEWED',
        title: 'Application viewed',
        jobId: application.jobId,
        viewedAt: new Date().toISOString()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Record application view error:', error);
    res.status(500).json({ success: false, message: 'Server error recording view' });
  }
});

router.post('/applications/:id/record-view-time', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId =
    req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;
  const durationSeconds = normalizeDurationSeconds(req.body?.seconds || req.body?.durationSeconds);

  if (!durationSeconds) {
    return res.json({ success: true, ignored: true });
  }

  try {
    const [rows] = await pool.execute(
      `
        SELECT ja.user_id AS userId,
               ja.job_id AS jobId
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.recruiter_id = ?
      `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];

    try {
      await pool.execute(
        `
          UPDATE job_applications
          SET total_view_seconds = COALESCE(total_view_seconds, 0) + ?
          WHERE id = ?
        `,
        [durationSeconds, applicationId]
      );
    } catch (updateError) {
      if (updateError.code !== 'ER_BAD_FIELD_ERROR') {
        throw updateError;
      }
    }

    await markRecruiterAction(applicationId);

    await UserNotification.create({
      userId: application.userId,
      applicationId,
      message: `A recruiter spent ${formatDuration(durationSeconds)} reviewing your application.`,
      metadata: { jobId: application.jobId, seconds: durationSeconds }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Record application view time error:', error);
    res.status(500).json({ success: false, message: 'Server error recording view time' });
  }
});

router.post('/applications/:id/record-resume-download', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId =
    req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;

  try {
    const [rows] = await pool.execute(
      `
        SELECT ja.user_id AS userId,
               ja.job_id AS jobId
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.recruiter_id = ?
      `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];

    await markRecruiterAction(applicationId);

    await UserNotification.create({
      userId: application.userId,
      applicationId,
      message: 'A recruiter downloaded your resume.',
      metadata: { jobId: application.jobId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Record resume download error:', error);
    res.status(500).json({ success: false, message: 'Server error recording resume download' });
  }
});

router.post('/applications/:id/record-activity', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId =
    req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;
  const activityType = normalizeActivityType(req.body?.type);

  if (!ALLOWED_ACTIVITY_TYPES.has(activityType)) {
    return res.status(400).json({ success: false, message: 'Unsupported activity type' });
  }

  try {
    const [rows] = await pool.execute(
      `
        SELECT ja.user_id AS userId,
               ja.job_id AS jobId
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.recruiter_id = ?
      `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];

    await markRecruiterAction(applicationId);

    if (activityType === 'interview update') {
      await createSystemMessage({
        applicationId,
        jobId: application.jobId,
        recruiterId,
        userId: application.userId,
        message: 'Interview scheduled'
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Record application activity error:', error);
    res.status(500).json({ success: false, message: 'Server error recording activity' });
  }
});

router.get('/notifications', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const recruiterId = getRecruiterIdFromRequest(req);
    const [notifications, unreadCount] = await Promise.all([
      RecruiterNotification.findByRecruiterId(recruiterId),
      RecruiterNotification.countUnread(recruiterId)
    ]);

    res.json({
      success: true,
      notifications: notifications.map(notification => notification.toJSON()),
      unreadCount
    });
  } catch (error) {
    console.error('Fetch recruiter notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

router.patch('/notifications/:id/read', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const recruiterId = getRecruiterIdFromRequest(req);
    const notificationId = req.params.id;

    const updated = await RecruiterNotification.markAsRead(notificationId, recruiterId);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await RecruiterNotification.countUnread(recruiterId);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Mark recruiter notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

router.put('/applications/:id/reject', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId =
    req.user.role === 'sub-recruiter' && req.user.mainRecruiterId
      ? req.user.mainRecruiterId
      : req.user.id;
  const rejectionReason = normalizeRejectionReason(req.body?.reason);

  try {
    const [rows] = await pool.execute(
      `
        SELECT ja.user_id AS userId,
               ja.job_id AS jobId
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.recruiter_id = ?
      `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];

    try {
      await pool.execute(
        `
          UPDATE job_applications
          SET status = 'Rejected',
              rejection_reason = ?
          WHERE id = ?
        `,
        [rejectionReason, applicationId]
      );
    } catch (updateError) {
      if (updateError.code === 'ER_BAD_FIELD_ERROR') {
        await pool.execute(
          `
            UPDATE job_applications
            SET status = 'Rejected'
            WHERE id = ?
          `,
          [applicationId]
        );
      } else {
        throw updateError;
      }
    }

    await markRecruiterAction(applicationId);

    const reasonMessage = rejectionReason
      ? `Your application was rejected due to ${rejectionReason.toLowerCase()}.`
      : 'Your application was rejected.';

    await UserNotification.create({
      userId: application.userId,
      applicationId,
      message: reasonMessage,
      metadata: { jobId: application.jobId, reason: rejectionReason }
    });

    await createSystemMessage({
      applicationId,
      jobId: application.jobId,
      recruiterId,
      userId: application.userId,
      message: 'Application rejected'
    });

    res.json({ success: true, status: 'Rejected', rejectionReason });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting application' });
  }
});

router.put('/applications/:id/shortlist', verifyToken, requireRecruiter, async (req, res) => {
  const applicationId = req.params.id;
  const recruiterId = getRecruiterIdFromRequest(req);

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        ja.user_id AS userId,
        ja.job_id AS jobId,
        ja.status,
        j.title,
        u.email,
        u.name
      FROM job_applications ja
      INNER JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN users u ON ja.user_id = u.id
      WHERE ja.id = ? AND j.recruiter_id = ?
    `,
      [applicationId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = rows[0];
    if ((application.status || '').toLowerCase() === 'shortlisted') {
      return res.status(400).json({ success: false, message: 'Applicant already shortlisted' });
    }

    const [updateResult] = await pool.execute(
      'UPDATE job_applications SET status = ? WHERE id = ?',
      ['shortlisted', applicationId]
    );

    if (!updateResult || updateResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to shortlist applicant' });
    }

    await markRecruiterAction(applicationId);

    if (application.email) {
      const frontendBase = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
      const nextStepsPath = `/applications?applicationId=${applicationId}`;
      const loginRedirectUrl = `${frontendBase}/login?next=${encodeURIComponent(nextStepsPath)}`;
      const subject = `You're shortlisted for ${application.title || 'a role'} on TrueHire`;
      const html = `
        <div style="background:#f4f6fb;padding:32px 16px;font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.15);border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 32px;color:#fff;text-align:center;">
              <p style="letter-spacing:0.3em;font-size:12px;margin:0;text-transform:uppercase;opacity:0.8;">TrueHire Recruiter Studio</p>
              <h1 style="margin:12px 0 0;font-size:24px;">You're shortlisted!</h1>
            </div>
            <div style="padding:32px 36px;color:#1f2937;">
              <p style="margin:0 0 12px;font-size:16px;">Hi ${application.name || 'Candidate'},</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                Congratulations — you are now <strong style="color:#4f46e5;">shortlisted</strong> for the role of
                <span style="font-weight:600;color:#111827;">${application.title || 'this opportunity'}</span>.
                Our recruiter is preparing the next steps and will reach out soon.
              </p>
              <div style="margin:24px 0;">
                <a href="${loginRedirectUrl}"
                  style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:999px;background:linear-gradient(120deg,#4f46e5,#10b981);color:#fff;font-weight:600;text-decoration:none;box-shadow:0 10px 20px rgba(79,70,229,0.3);">
                  View next steps
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </a>
              </div>
              <p style="margin:0;font-size:14px;color:#6b7280;">If you need any help, reply to this message and our team will assist you.</p>
            </div>
            <div style="border-top:1px solid #e5e7eb;padding:20px 36px;background:#f9fafb;color:#6b7280;font-size:12px;">
              <p style="margin:0;">TrueHire · Building careers with purpose</p>
              <p style="margin:4px 0 0;">&copy; ${new Date().getFullYear()} TrueHire. All rights reserved.</p>
            </div>
          </div>
        </div>
      `;

      try {
        await sendEmail(application.email, subject, html);
      } catch (emailError) {
        console.error('Shortlist email failed:', emailError);
      }
    }

    try {
      const notificationMessage = `Congratulations — you are now shortlisted for the role of ${application.title || 'this opportunity'}. Our recruiter is preparing the next steps and will reach out soon.`;
      await UserNotification.create({
        userId: application.userId,
        applicationId,
        message: notificationMessage,
        metadata: {
          type: 'shortlisted',
          title: "You've been shortlisted 🎉",
          jobTitle: application.title || null,
          jobId: application.jobId || null,
          actions: {
            primary: {
              label: 'Upload Introduction Video',
              href: `/applications?applicationId=${applicationId}`
            },
            secondary: {
              label: 'View Next Steps',
              href: application.jobId ? `/jobs/${application.jobId}` : '/applications'
            }
          },
          highlight: {
            title: '🎥 Tell us about yourself',
            body: 'Please upload a short introduction video (30–90 seconds) to help the recruiter know you better.'
          }
        }
      });
    } catch (notificationError) {
      console.error('Shortlist notification failed:', notificationError);
    }

    try {
      await RecruiterNotification.create({
        recruiterId,
        type: 'SHORTLISTED',
        title: 'Candidate Shortlisted',
        message: `You shortlisted ${application.name || 'a candidate'} for ${application.title || 'this role'}.`,
        applicationId
      });
    } catch (notificationError) {
      console.error('Recruiter shortlist notification failed:', notificationError);
    }

    await createSystemMessage({
      applicationId,
      jobId: application.jobId,
      recruiterId,
      userId: application.userId,
      message: 'Recruiter shortlisted you'
    });

    res.json({
      success: true,
      applicationId,
      status: 'shortlisted',
      message: 'Applicant has been shortlisted'
    });
  } catch (error) {
    console.error('Recruiter shortlist error:', error);
    res.status(500).json({ success: false, message: 'Server error shortlisting applicant' });
  }
});
// Update current recruiter profile
router.put('/profile/me', verifyToken, requireRecruiter, async (req, res) => {
  try {
    await ensureRecruiterOnboardingColumns();
    await ensureRecruiterPhoneColumns();
    await ensureRecruiterCategoryColumn();
    const updateData = req.body;
    delete updateData.password;
    delete updateData.email;

    const success = await Recruiter.update(req.user.id, updateData);
    if (!success) {
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    const updatedRecruiter = await Recruiter.findById(req.user.id);

    res.json({
      message: 'Profile updated successfully',
      recruiter: updatedRecruiter.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Upload company logo
router.post('/profile/logo', verifyToken, requireRecruiter, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const [columns] = await req.db.pool.execute('SHOW COLUMNS FROM recruiters');
    const existingColumns = new Set((columns || []).map((column) => String(column.Field || '').toLowerCase()));
    const updateData = {};

    if (existingColumns.has('company_logo')) {
      updateData.company_logo = logoUrl;
    }
    if (existingColumns.has('company_image')) {
      updateData.company_image = logoUrl;
    }
    if (Object.keys(updateData).length === 0) {
      updateData.company_logo = logoUrl;
    }

    const success = await Recruiter.update(req.user.id, updateData);
    if (!success) return res.status(404).json({ message: 'Recruiter not found' });

    res.json({
      message: 'Logo uploaded successfully',
      logoUrl,
      ...updateData
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== SUB-RECRUITER ROUTES ===================== */

router.post('/sub-recruiters', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    // Only primary recruiters can add sub-recruiters
    if (req.user.role === 'sub-recruiter') {
      return res.status(403).json({ message: 'Sub-recruiters cannot add other sub-recruiters' });
    }

    const recruiterId = (req.user.role === 'sub-recruiter' && req.user.mainRecruiterId)
      ? req.user.mainRecruiterId
      : req.user.id;

    if (!recruiterId) {
      return res.status(400).json({ message: 'Recruiter context missing' });
    }

    const recruiterRecord = await Recruiter.findById(recruiterId);
    if (!recruiterRecord) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const subRecruiterData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    };

    const success = await Recruiter.addSubRecruiter(recruiterId, subRecruiterData);
    if (!success) return res.status(404).json({ message: 'Recruiter not found' });

    res.status(201).json({ message: 'Sub-recruiter added successfully' });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A sub-recruiter with this email already exists' });
    }
    if (error.message === 'Maximum 3 sub-recruiters allowed per company')
      return res.status(400).json({ message: error.message });

    console.error('Add sub-recruiter error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code });
  }
});

router.delete('/:id/sub-recruiters/:subRecruiterId', verifyToken, requireRecruiter, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' || req.user.id != req.params.id)
      return res.status(403).json({ message: 'Access denied' });

    const success = await Recruiter.removeSubRecruiter(req.params.id, req.params.subRecruiterId);
    if (!success) return res.status(404).json({ message: 'Not found' });

    res.json({ message: 'Sub-recruiter removed successfully' });

  } catch (error) {
    console.error('Remove sub-recruiter error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code });
  }
});

router.get('/:id/sub-recruiters', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const requesterMainId = (req.user.role === 'sub-recruiter' && req.user.mainRecruiterId)
      ? req.user.mainRecruiterId
      : req.user.id;

    if (String(requesterMainId) !== String(req.params.id))
      return res.status(403).json({ message: 'Access denied' });

    let rows;
    try {
      const query = 'SELECT id, name, email, status, created_at FROM sub_recruiters WHERE recruiter_id = ?';
      [rows] = await pool.execute(query, [req.params.id]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackQuery = 'SELECT id, name, email FROM sub_recruiters WHERE recruiter_id = ?';
        [rows] = await pool.execute(fallbackQuery, [req.params.id]);
      } else {
        throw err;
      }
    }

    res.json({ sub_recruiters: rows });

  } catch (error) {
    console.error('Get sub-recruiters error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code });
  }
});

/* ================================================================
   ⭐ MOVE THESE TWO ROUTES TO THE VERY BOTTOM (FIX APPLIED)
   ================================================================ */

// Get recruiter by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id);
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });

    if (req.user.role !== 'admin' && req.user.id != req.params.id)
      return res.status(403).json({ message: 'Access denied' });

    res.json({ recruiter: recruiter.toJSON() });

  } catch (error) {
    console.error('Get recruiter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recruiter by ID
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id != req.params.id)
      return res.status(403).json({ message: 'Access denied' });

    const updateData = req.body;
    delete updateData.password;
    delete updateData.email;

    const success = await Recruiter.update(req.params.id, updateData);
    if (!success) return res.status(404).json({ message: 'Recruiter not found' });

    const updatedRecruiter = await Recruiter.findById(req.params.id);

    res.json({
      message: 'Recruiter updated successfully',
      recruiter: updatedRecruiter.toJSON()
    });

  } catch (error) {
    console.error('Update recruiter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== EXPORT ROUTER ===================== */

module.exports = router;
