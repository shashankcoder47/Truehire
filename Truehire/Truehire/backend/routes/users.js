// module.exports = router;
const express = require('express');
const User = require('../models/User');
const WorkExperience = require('../models/WorkExperience');
const Education = require('../models/Education');
const { pool } = require('../config/database');
const { verifyToken, requireUser } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/upload');

const router = express.Router();

const ensureUserSettingsColumns = async (pool) => {
  const statements = [
    "ALTER TABLE users ADD COLUMN email_notifications TINYINT(1) DEFAULT 1",
    "ALTER TABLE users ADD COLUMN job_alerts TINYINT(1) DEFAULT 1",
    "ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL",
    "ALTER TABLE users ADD COLUMN last_login_device VARCHAR(255) NULL",
    "ALTER TABLE users ADD COLUMN login_type VARCHAR(50) NULL",
    "ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL",
    "ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL"
  ];

  for (const sql of statements) {
    try {
      await pool.execute(sql);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }
  }
};

const ensureUserProfileColumns = async (pool) => {
  const statements = [
    "ALTER TABLE users ADD COLUMN date_of_birth DATE NULL",
    "ALTER TABLE users ADD COLUMN secondary_skills JSON NULL",
    "ALTER TABLE users ADD COLUMN soft_skills JSON NULL",
    "ALTER TABLE users ADD COLUMN languages_known JSON NULL",
    "ALTER TABLE users ADD COLUMN projects JSON NULL",
    "ALTER TABLE users ADD COLUMN certifications JSON NULL",
    "ALTER TABLE users ADD COLUMN current_salary DECIMAL(10,2) NULL",
    "ALTER TABLE users ADD COLUMN expected_salary DECIMAL(10,2) NULL",
    "ALTER TABLE users ADD COLUMN salary_confidential BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(500) NULL",
    "ALTER TABLE users ADD COLUMN github_url VARCHAR(500) NULL",
    "ALTER TABLE users ADD COLUMN portfolio_url VARCHAR(500) NULL",
    "ALTER TABLE users ADD COLUMN hobbies_interests TEXT NULL",
    "ALTER TABLE users ADD COLUMN relocated BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(50) NULL"
  ];

  for (const sql of statements) {
    try {
      await pool.execute(sql);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }
  }
};

const parseArrayLike = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed && typeof parsed === 'object') return Object.values(parsed).filter(Boolean);
      } catch (_) {
        // fall through
      }
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'object') return Object.values(value).filter(Boolean);
  return [];
};

const hasProfileValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed === '[]' || trimmed === '{}') return false;
    return true;
  }
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
};

const calculateApplicationProfileCompletion = (profile = {}) => {
  const sections = [
    {
      weight: 20,
      fields: [
        profile.name,
        profile.email,
        profile.contact_number,
        profile.current_location,
        profile.profile_photo
      ]
    },
    {
      weight: 20,
      fields: [
        profile.professional_summary,
        parseArrayLike(profile.core_skills),
        parseArrayLike(profile.languages_known)
      ]
    },
    {
      weight: 20,
      fields: [
        parseArrayLike(profile.projects),
        parseArrayLike(profile.certifications)
      ]
    },
    {
      weight: 10,
      fields: [
        profile.hobbies_interests
      ]
    },
    {
      weight: 10,
      fields: [
        profile.relocated
      ]
    },
    {
      weight: 20,
      fields: [
        profile.current_salary,
        profile.expected_salary,
        parseArrayLike(profile.soft_skills)
      ]
    }
  ];

  let total = 0;
  for (const section of sections) {
    const filled = section.fields.filter(hasProfileValue).length;
    total += (filled / section.fields.length) * section.weight;
  }

  return Math.max(0, Math.min(100, Math.round(total)));
};

router.get('/public', verifyToken, requireUser, async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
    const search = String(req.query.search || '').trim().toLowerCase();

    const [allRows] = await pool.query(
      `
        SELECT id, name, email
        FROM users
        ORDER BY id DESC
      `
    );

    const rows = (Array.isArray(allRows) ? allRows : [])
      .filter((item) => Number(item.id) !== Number(req.user.id))
      .filter((item) => {
        if (!search) return true;
        const haystack = `${item.name || ''} ${item.email || ''}`.toLowerCase();
        return haystack.includes(search);
      })
      .slice(0, limit);

    return res.json({
      success: true,
      users: rows
    });
  } catch (error) {
    console.error('Get public users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      code: process.env.NODE_ENV !== 'production' ? error.code : undefined
    });
  }
});

router.get('/public/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userJson = user.toJSON();
    const publicProfile = {
      id: userJson.id,
      name: userJson.name,
      email: userJson.email,
      current_location: userJson.current_location || '',
      professional_summary: userJson.professional_summary || '',
      core_skills: userJson.core_skills || '',
      secondary_skills: userJson.secondary_skills || '',
      languages_known: userJson.languages_known || '',
      soft_skills: userJson.soft_skills || '',
      profile_photo: userJson.profile_photo || null,
      linkedin_url: userJson.linkedin_url || '',
      github_url: userJson.github_url || '',
      portfolio_url: userJson.portfolio_url || '',
      hobbies_interests: userJson.hobbies_interests || ''
    };

    return res.json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    console.error('Get public user profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   ⭐⭐ USER APPLICATIONS ROUTE
   MUST COME BEFORE ANY ROUTE WITH '/:id'
---------------------------------------------------------- */
router.get('/applications', verifyToken, requireUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        a.id AS applicationId,
        a.job_id AS jobId,
        a.name,
        a.email,
        a.phone,
        a.location,
        a.experience_level,
        a.current_salary,
        a.expected_salary,
        a.notice_period,
        a.additional_comments,
        a.resume_path,
        a.applied_at,
        j.title AS jobTitle,
        j.company AS company,
        j.location AS jobLocation
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `;

    let rows = [];
    try {
      [rows] = await req.db.pool.execute(sql, [userId]);
    } catch (err) {
      if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_TABLE_ERROR') {
        throw err;
      }
    }

    res.json({
      success: true,
      applications: rows
    });

  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
/* ---------------------------------------------------------
   GET ALL USERS (Admin Only) with SAFE Pagination
---------------------------------------------------------- */
/* ---------------------------------------------------------
   GET ALL USERS (Admin Only) with Raw SQL Pagination
---------------------------------------------------------- */
/* ---------------------------------------------------------
   GET ALL USERS (Admin Only) — RAW SQL FIX
---------------------------------------------------------- */
router.get(
  '/',
  verifyToken,
  require('../middleware/auth').requireAdmin,
  async (req, res) => {
    try {
      console.log("🔥 USERS API HIT");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      console.log("📌 Pagination:", { page, limit, offset });

      /* ------------------------------
         RAW SQL FOR USERS
      ------------------------------ */
      const userSQL = `
        SELECT id, name, email, role, status
        FROM users
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `;

      const [users] = await req.db.pool.execute(userSQL, [limit, offset]);

      /* ------------------------------
         RAW SQL FOR COUNT
      ------------------------------ */
      const countSQL = `SELECT COUNT(*) AS total FROM users`;
      const [[{ total }]] = await req.db.pool.execute(countSQL);

      console.log("🔥 Users Found:", users.length);

      return res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        error: null,
      });

    } catch (error) {
      console.error("❌ GET USERS ERROR:", error);
      return res.status(500).json({
        users: [],
        pagination: null,
        error: error.message,
      });
    }
  }
);





/* ---------------------------------------------------------
   GET USER BY ID
   ⚠️ MUST COME AFTER /applications
---------------------------------------------------------- */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.params.id === 'profile' || req.params.id === 'settings') return next();
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role !== 'admin' && req.user.id != req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   UPDATE USER
---------------------------------------------------------- */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.params.id === 'profile' || req.params.id === 'settings') return next();
    if (req.user.role !== 'admin' && req.user.id != req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = req.body;
    delete updateData.password;
    delete updateData.email;

    const success = await User.update(req.params.id, updateData);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await User.findById(req.params.id);
    res.json({
      message: 'User updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   DELETE USER
---------------------------------------------------------- */
router.delete('/:id', verifyToken, require('../middleware/auth').requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === 'profile' || req.params.id === 'settings') return next();
    const success = await User.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   PROFILE ROUTES
---------------------------------------------------------- */
router.get('/profile/me', verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserProfileColumns(req.db.pool);
    const profile = await User.getCompleteProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    const normalizeArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.filter(Boolean);
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
          } catch (error) {
            return [];
          }
        }
        return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
      }
      if (typeof value === 'object') {
        return Object.values(value).filter(Boolean);
      }
      return [];
    };

    const normalizeString = (value) => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    const normalizeDate = (value) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    };

    const normalizedProfile = {
      ...profile,
      secondary_skills: normalizeArray(profile.secondary_skills),
      languages_known: normalizeArray(profile.languages_known),
      soft_skills: normalizeArray(profile.soft_skills),
      projects: normalizeArray(profile.projects),
      certifications: normalizeArray(profile.certifications),
      date_of_birth: normalizeDate(profile.date_of_birth),
      linkedin_url: normalizeString(profile.linkedin_url),
      github_url: normalizeString(profile.github_url),
      portfolio_url: normalizeString(profile.portfolio_url),
      hobbies_interests: normalizeString(profile.hobbies_interests),
      relocated: Boolean(
        profile.relocated ??
        profile.open_to_relocation ??
        false
      )
    };

    const applicationProfileCompletion = calculateApplicationProfileCompletion(normalizedProfile);
    normalizedProfile.profile_complete = applicationProfileCompletion;
    normalizedProfile.profileCompleteness = Math.max(
      Number(normalizedProfile.profileCompleteness || 0),
      applicationProfileCompletion
    );

    res.json({ user: normalizedProfile });
  } catch (error) {
    console.error('Get profile error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ message: 'Failed to load profile', error: error.message });
  }
});

// Upload / Update profile photo (multipart)
router.put('/profile/photo', verifyToken, requireUser, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const publicUrl = `/uploads/${req.file.filename}`;

    const success = await User.update(req.user.id, { profile_photo: publicUrl });
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await User.findById(req.user.id);
    res.json({
      message: 'Profile photo updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile/me', verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserProfileColumns(req.db.pool);
    const allowedFields = new Set([
      'name',
      'contact_number',
      'current_location',
      'professional_summary',
      'core_skills',
      'date_of_birth',
      'secondary_skills',
      'languages_known',
      'soft_skills',
      'projects',
      'certifications',
      'current_salary',
      'expected_salary',
      'salary_confidential',
      'linkedin_url',
      'github_url',
      'portfolio_url',
      'hobbies_interests',
      'relocated',
      'profile_visibility',
      'profile_photo'
    ]);

    const toNullableNumber = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const toJsonText = (value) => {
      if (value === null || value === undefined) return null;
      if (Array.isArray(value) || typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch (error) {
          return null;
        }
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            return JSON.stringify(parsed);
          } catch (error) {
            // fall through to comma list
          }
        }
        const list = trimmed.split(',').map((item) => item.trim()).filter(Boolean);
        return JSON.stringify(list);
      }
      return JSON.stringify([value]);
    };

    const normalizeDate = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        const ddmmyyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (ddmmyyyy) {
          return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
        }
        const ddmmyyyySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (ddmmyyyySlash) {
          return `${ddmmyyyySlash[3]}-${ddmmyyyySlash[2]}-${ddmmyyyySlash[1]}`;
        }
      }
      return value;
    };

    const rawBody = req.body || {};
    const updateData = {};

    Object.keys(rawBody).forEach((key) => {
      if (!allowedFields.has(key)) return;
      updateData[key] = rawBody[key];
    });

    delete updateData.password;
    delete updateData.email;

    if (updateData.date_of_birth !== undefined) {
      updateData.date_of_birth = normalizeDate(updateData.date_of_birth);
    }

    if (updateData.secondary_skills !== undefined) {
      updateData.secondary_skills = toJsonText(updateData.secondary_skills);
    }

    if (updateData.soft_skills !== undefined) {
      updateData.soft_skills = toJsonText(updateData.soft_skills);
    }

    if (updateData.languages_known !== undefined) {
      updateData.languages_known = toJsonText(updateData.languages_known);
    }

    if (updateData.projects !== undefined) {
      updateData.projects = toJsonText(updateData.projects);
    }

    if (updateData.certifications !== undefined) {
      updateData.certifications = toJsonText(updateData.certifications);
    }

    if (updateData.current_salary !== undefined) {
      updateData.current_salary = toNullableNumber(updateData.current_salary);
    }

    if (updateData.expected_salary !== undefined) {
      updateData.expected_salary = toNullableNumber(updateData.expected_salary);
    }

    if (updateData.salary_confidential !== undefined) {
      updateData.salary_confidential = updateData.salary_confidential ? 1 : 0;
    }

    if (updateData.relocated !== undefined) {
      updateData.relocated = updateData.relocated ? 1 : 0;
    }

    if (updateData.profile_visibility !== undefined) {
      const normalizedVisibility = String(updateData.profile_visibility || '').trim().toLowerCase();
      if (normalizedVisibility === 'public') {
        updateData.profile_visibility = 'Public';
      } else if (normalizedVisibility === 'recruiter only' || normalizedVisibility === 'recruiter_only') {
        updateData.profile_visibility = 'Recruiter Only';
      } else if (normalizedVisibility === 'private') {
        updateData.profile_visibility = 'Private';
      }
    }

    if (Object.keys(updateData).length > 0) {
      const success = await User.update(req.user.id, updateData);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    const updatedUser = await User.getCompleteProfile(req.user.id);
    const applicationProfileCompletion = calculateApplicationProfileCompletion(updatedUser || {});
    if (Number(updatedUser?.profile_complete || 0) !== applicationProfileCompletion) {
      await User.update(req.user.id, { profile_complete: applicationProfileCompletion });
    }

    const responseUser = {
      ...(updatedUser || {}),
      profile_complete: applicationProfileCompletion,
      profileCompleteness: Math.max(
        Number(updatedUser?.profileCompleteness || 0),
        applicationProfileCompletion
      )
    };

    res.json({
      message: 'Profile updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Update profile error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      bodyKeys: Object.keys(req.body || {})
    });
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

router.get('/settings', verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserSettingsColumns(req.db.pool);
    const [rows] = await req.db.pool.execute(
      `
        SELECT email_notifications, job_alerts, last_login_at, last_login_device, login_type, password
        FROM users
        WHERE id = ?
      `,
      [req.user.id]
    );

    const settings = rows && rows[0] ? rows[0] : {};
    res.json({
      success: true,
      settings: {
        email_notifications: settings.email_notifications !== null ? Boolean(settings.email_notifications) : true,
        job_alerts: settings.job_alerts !== null ? Boolean(settings.job_alerts) : true,
        last_login_at: settings.last_login_at || null,
        last_login_device: settings.last_login_device || null,
        login_type: settings.login_type || null,
        loginType: settings.login_type || null,
        password: settings.password ? true : null
      }
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
});

router.put('/settings', verifyToken, requireUser, async (req, res) => {
  try {
    await ensureUserSettingsColumns(req.db.pool);
    const emailNotifications = req.body.email_notifications;
    const jobAlerts = req.body.job_alerts;

    const updates = {};
    if (emailNotifications !== undefined) {
      updates.email_notifications = emailNotifications ? 1 : 0;
    }
    if (jobAlerts !== undefined) {
      updates.job_alerts = jobAlerts ? 1 : 0;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No settings to update' });
    }

    await req.db.pool.execute(
      `UPDATE users SET ${Object.keys(updates).map((key) => `${key} = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`,
      [...Object.values(updates), req.user.id]
    );

    res.json({
      success: true,
      settings: {
        email_notifications: updates.email_notifications !== undefined ? Boolean(updates.email_notifications) : undefined,
        job_alerts: updates.job_alerts !== undefined ? Boolean(updates.job_alerts) : undefined
      }
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating settings' });
  }
});

router.put('/settings/password', verifyToken, requireUser, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isGoogleOnly = user.login_type === 'google' && !user.password;

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
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, hashedPassword);
    if (isGoogleOnly) {
      await User.update(req.user.id, { login_type: 'google+password' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password' });
  }
});

/* ---------------------------------------------------------
   WORK EXPERIENCE ROUTES
---------------------------------------------------------- */
router.get('/work-experience', verifyToken, requireUser, async (req, res) => {
  try {
    const workExperience = await WorkExperience.findByUserId(req.user.id);
    res.json({ workExperience });
  } catch (error) {
    console.error('Error fetching work experience:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/work-experience', verifyToken, requireUser, async (req, res) => {
  try {
    const workData = { ...req.body, user_id: req.user.id };
    const id = await WorkExperience.create(workData);
    res.status(201).json({ id, message: 'Work experience added successfully' });
  } catch (error) {
    console.error('Error creating work experience:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/work-experience/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await WorkExperience.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Work experience not found' });
    }
    res.json({ message: 'Work experience updated successfully' });
  } catch (error) {
    console.error('Error updating work experience:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/work-experience/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await WorkExperience.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Work experience not found' });
    }
    res.json({ message: 'Work experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting work experience:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   EDUCATION ROUTES
---------------------------------------------------------- */
router.get('/education', verifyToken, requireUser, async (req, res) => {
  try {
    const education = await Education.findByUserId(req.user.id);
    res.json({ education });
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/education', verifyToken, requireUser, async (req, res) => {
  try {
    const educationData = { ...req.body, user_id: req.user.id };
    const id = await Education.create(educationData);
    res.status(201).json({ id, message: 'Education added successfully' });
  } catch (error) {
    console.error('Error creating education:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/education/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await Education.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Education not found' });
    }
    res.json({ message: 'Education updated successfully' });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/education/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await Education.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Education not found' });
    }
    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   PROJECT ROUTES
---------------------------------------------------------- */
router.get('/projects', verifyToken, requireUser, async (req, res) => {
  try {
    const projects = await Project.findByUserId(req.user.id);
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/projects', verifyToken, requireUser, async (req, res) => {
  try {
    const projectData = { ...req.body, user_id: req.user.id };
    const id = await Project.create(projectData);
    res.status(201).json({ id, message: 'Project added successfully' });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/projects/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await Project.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/projects/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await Project.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------------------------------------------------
   CERTIFICATION ROUTES
---------------------------------------------------------- */
router.get('/certifications', verifyToken, requireUser, async (req, res) => {
  try {
    const certifications = await Certification.findByUserId(req.user.id);
    res.json({ certifications });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/certifications', verifyToken, requireUser, async (req, res) => {
  try {
    const certificationData = { ...req.body, user_id: req.user.id };
    const id = await Certification.create(certificationData);
    res.status(201).json({ id, message: 'Certification added successfully' });
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/certifications/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await Certification.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json({ message: 'Certification updated successfully' });
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/certifications/:id', verifyToken, requireUser, async (req, res) => {
  try {
    const success = await Certification.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
