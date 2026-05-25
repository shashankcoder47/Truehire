const { pool } = require('../config/database');

class Job {
  constructor(data) {
    this.id = data.id;
    this.recruiter_id = data.recruiter_id;
    this.title = data.title || data.job_title;
    this.company = data.company || data.company_name;
    this.company_name = data.company_name || data.company || data.company_name;
    this.company_logo = data.company_logo;
    this.location = data.location;
    this.employment_type = data.employment_type || data.job_type;
    this.experience_level = data.experience_level;
    this.salary_min = data.salary_min;
    this.salary_max = data.salary_max;
    this.salary_currency = data.salary_currency || 'USD';
    this.description = data.description || data.job_description;
    this.requirements = data.requirements || data.job_requirements;
    this.benefits = data.benefits;
    this.skills_required = data.skills_required;
    this.application_deadline = data.application_deadline;
    this.status = data.status || 'Active';
    this.is_featured = data.is_featured || false;
    this.is_urgent = data.is_urgent || false;
    this.views_count = data.views_count || 0;
    this.applications_count = data.applications_count || 0;
    this.max_applicants = data.max_applicants != null ? Number(data.max_applicants) : null;
    this.deadline_notification_sent_at = data.deadline_notification_sent_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new job
  static async create(jobData) {
    const {
      recruiter_id, title, company, location, employment_type, experience_level,
      salary_min, salary_max, salary_currency, description, requirements,
      benefits, skills_required, application_deadline, status, is_featured, is_urgent, company_logo,
      max_applicants
    } = jobData;

    const query = `
      INSERT INTO jobs (
        recruiter_id, title, company, location, employment_type, experience_level,
        salary_min, salary_max, salary_currency, description, requirements,
        benefits, skills_required, application_deadline, status, is_featured, is_urgent, company_logo, max_applicants,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      recruiter_id, title, company, location, employment_type, experience_level,
      salary_min, salary_max, salary_currency, description, requirements,
      benefits, skills_required, application_deadline, status || 'Active', is_featured || false,
      is_urgent || false, company_logo || null, max_applicants
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      // Backward compatibility for older schemas that do not include is_urgent.
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }

      const fallbackQuery = `
        INSERT INTO jobs (
          recruiter_id, title, company, location, employment_type, experience_level,
          salary_min, salary_max, salary_currency, description, requirements,
          benefits, skills_required, application_deadline, status, is_featured, max_applicants,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const fallbackValues = [
        recruiter_id, title, company, location, employment_type, experience_level,
        salary_min, salary_max, salary_currency, description, requirements,
        benefits, skills_required, application_deadline, status || 'Active', is_featured || false, max_applicants
      ];

      try {
        const [result] = await pool.execute(fallbackQuery, fallbackValues);
        return result.insertId;
      } catch (fallbackError) {
        // Legacy schema compatibility: old jobs table used job_title/company_name/job_description/job_requirements/job_type.
        if (fallbackError.code !== 'ER_BAD_FIELD_ERROR') {
          throw fallbackError;
        }

        const legacyQuery = `
          INSERT INTO jobs (
            recruiter_id, job_title, company_name, location, job_type, experience_level,
            salary_min, salary_max, salary_currency, job_description, job_requirements,
            skills_required, application_deadline, status, is_featured,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const legacyValues = [
          recruiter_id, title, company, location, employment_type, experience_level,
          salary_min, salary_max, salary_currency, description, requirements,
          skills_required, application_deadline, status || 'Active', is_featured || false
        ];

        const [result] = await pool.execute(legacyQuery, legacyValues);
        return result.insertId;
      }
    }
  }

  
  // Find job by ID
  static async findById(id) {
    const query = 'SELECT * FROM jobs WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Job(rows[0]) : null;
  }

  static async expirePastDeadlineJobs() {
    const query = `
      UPDATE jobs
      SET status = 'Expired', updated_at = NOW()
      WHERE status IN ('OPEN', 'Active')
        AND application_deadline IS NOT NULL
        AND DATE(application_deadline) < CURDATE()
    `;

    try {
      await pool.execute(query);
    } catch (error) {
      // Some legacy schemas may not support "Expired" enum values.
      const toleratedCodes = [
        'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
        'ER_WARN_DATA_TRUNCATED',
        'WARN_DATA_TRUNCATED'
      ];
      if (!toleratedCodes.includes(error?.code)) {
        throw error;
      }
    }
  }

  // Get jobs by recruiter
  static async findByRecruiter(recruiterId, limit = null, offset = 0) {
    await this.expirePastDeadlineJobs();

    let query = `
      SELECT *
      FROM jobs
      WHERE recruiter_id = ?
        AND status <> 'Expired'
        AND (application_deadline IS NULL OR DATE(application_deadline) >= CURDATE())
      ORDER BY created_at DESC
    `;
    const values = [recruiterId];

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Job(row));
  }

  // Get all active jobs (for homepage)
  static async findActive(limit = 10, offset = 0) {
    await this.expirePastDeadlineJobs();

    const activeStatuses = ['OPEN', 'Active'];
    const statusPlaceholders = activeStatuses.map(() => '?').join(', ');
    const primaryQuery = `
      SELECT
        j.*,
        r.company_name,
        COALESCE(j.company_logo, r.company_logo) AS company_logo
      FROM jobs j
      LEFT JOIN recruiters r ON j.recruiter_id = r.id
      WHERE j.status IN (${statusPlaceholders})
        AND (j.application_deadline IS NULL OR DATE(j.application_deadline) >= CURDATE())
      ORDER BY j.created_at DESC
    `;
    const fallbackQuery = `
      SELECT
        j.*,
        j.company AS company_name,
        NULL AS company_logo
      FROM jobs j
      WHERE j.status IN (${statusPlaceholders})
        AND (j.application_deadline IS NULL OR DATE(j.application_deadline) >= CURDATE())
      ORDER BY j.created_at DESC
    `;
    const values = [...activeStatuses];

    try {
      const [rows] = await pool.execute(primaryQuery, values);
      return rows.map(row => new Job(row));
    } catch (error) {
      const retriableCodes = ['ER_BAD_FIELD_ERROR', 'ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR', 'ECONNREFUSED'];
      if (!retriableCodes.includes(error.code)) {
        throw error;
      }

      try {
        const [rows] = await pool.execute(fallbackQuery, values);
        return rows.map(row => new Job(row));
      } catch (fallbackError) {
        if (retriableCodes.includes(fallbackError.code) || fallbackError.code === 'ECONNREFUSED') {
          return [];
        }
        throw fallbackError;
      }
    }
  }

  static async findDeadlineReminders() {
    const query = `
      SELECT *
      FROM jobs
      WHERE status IN ('OPEN', 'Active')
        AND application_deadline IS NOT NULL
        AND DATE(application_deadline) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND (deadline_notification_sent_at IS NULL OR DATE(deadline_notification_sent_at) < CURDATE())
    `;
    const [rows] = await pool.execute(query);
    return rows.map(row => new Job(row));
  }

  static async markDeadlineReminderSent(jobId) {
    const query = `
      UPDATE jobs
      SET deadline_notification_sent_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(query, [jobId]);
  }

  static async resetDeadlineReminder(jobId) {
    const query = `
      UPDATE jobs
      SET deadline_notification_sent_at = NULL, updated_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(query, [jobId]);
  }

  // Search jobs
  static async search(searchTerm, filters = {}, limit = null, offset = 0) {
    await this.expirePastDeadlineJobs();

    let query = 'SELECT * FROM jobs WHERE status IN (?, ?) AND (application_deadline IS NULL OR DATE(application_deadline) >= CURDATE())';
    const values = ['OPEN', 'Active'];

    if (searchTerm) {
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR skills_required LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      values.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (filters.location && Array.isArray(filters.location) && filters.location.length > 0) {
      // Handle multiple locations
      const placeholders = filters.location.map(() => '?').join(',');
      query += ` AND location IN (${placeholders})`;
      values.push(...filters.location);
    } else if (filters.location && typeof filters.location === 'string' && filters.location.trim() !== '') {
      query += ' AND location LIKE ?';
      values.push(`%${filters.location}%`);
    }

    if (filters.employment_type && Array.isArray(filters.employment_type) && filters.employment_type.length > 0) {
      // Handle multiple employment types
      const placeholders = filters.employment_type.map(() => '?').join(',');
      query += ` AND employment_type IN (${placeholders})`;
      values.push(...filters.employment_type);
    } else if (filters.employment_type && typeof filters.employment_type === 'string' && filters.employment_type.trim() !== '') {
      query += ' AND employment_type = ?';
      values.push(filters.employment_type);
    } else if (filters.employment_type && typeof filters.employment_type === 'string' && filters.employment_type.trim() === '') {
      // Skip empty string
    }

    if (filters.experience_level && filters.experience_level.trim() !== '') {
      query += ' AND experience_level = ?';
      values.push(filters.experience_level);
    }

    if (filters.salary_min && !isNaN(parseFloat(filters.salary_min))) {
      query += ' AND salary_max >= ?';
      values.push(parseFloat(filters.salary_min));
    }

    if (filters.salary_max && !isNaN(parseFloat(filters.salary_max))) {
      query += ' AND salary_min <= ?';
      values.push(parseFloat(filters.salary_max));
    }

    query += ' ORDER BY created_at DESC';

    if (limit !== null && limit !== undefined) {
      query += ' LIMIT ?';
      values.push(limit);
      if (offset !== null && offset !== undefined) {
        query += ' OFFSET ?';
        values.push(offset);
      }
    }

    const [rows] = await pool.execute(query, values);
    return rows.map(row => new Job(row));
  }

  // Update job
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id);

    const query = `UPDATE jobs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // Delete job
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lock the row so parallel deletes/updates do not race.
      const [jobRows] = await connection.execute(
        'SELECT id FROM jobs WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!jobRows.length) {
        await connection.rollback();
        connection.release();
        return false;
      }

      const optionalDeletes = [
        // Legacy detailed application records
        'DELETE FROM applications WHERE job_id = ?',
        // Messaging and notifications that may exist in mixed schemas
        'DELETE FROM application_message_attachments WHERE message_id IN (SELECT id FROM application_messages WHERE job_id = ?)',
        'DELETE FROM application_messages WHERE job_id = ?',
        'DELETE FROM application_conversations WHERE job_id = ?',
        'DELETE FROM user_notifications WHERE application_id IN (SELECT id FROM job_applications WHERE job_id = ?)',
        'DELETE FROM recruiter_notifications WHERE application_id IN (SELECT id FROM job_applications WHERE job_id = ?)',
        // Core job relations
        'DELETE FROM job_applications WHERE job_id = ?',
        'DELETE FROM job_views WHERE job_id = ?'
      ];

      for (const sql of optionalDeletes) {
        try {
          await connection.execute(sql, [id]);
        } catch (error) {
          // Ignore missing legacy tables/columns and continue cleanup.
          const benignCodes = ['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR', 'ER_BAD_FIELD_ERROR'];
          if (!benignCodes.includes(error.code)) {
            throw error;
          }
        }
      }

      const [result] = await connection.execute('DELETE FROM jobs WHERE id = ?', [id]);
      await connection.commit();
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {}
      connection.release();
      throw error;
    }
  }

  // Record unique view for authenticated user or guest.
  // counted=true only when INSERT creates a new row (affectedRows === 1).
  static async recordUniqueView({ jobId, userId = null, viewerFingerprint = null, viewerIp = null }) {
    try {
      const safeFingerprint = typeof viewerFingerprint === 'string' ? viewerFingerprint.trim() : null;
      const safeIp = typeof viewerIp === 'string' ? viewerIp.trim() : null;

      let insertResult;
      let resolvedFingerprint = safeFingerprint;
      if (userId) {
        try {
          const insertSql = `
            INSERT INTO job_views (job_id, user_id, viewer_ip, viewer_fingerprint)
            VALUES (?, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE id = id
          `;
          [insertResult] = await pool.execute(insertSql, [jobId, userId, safeIp]);
        } catch (error) {
          if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
          const legacyInsertSql = `
            INSERT INTO job_views (job_id, user_id, viewer_ip, device_fingerprint)
            VALUES (?, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE id = id
          `;
          [insertResult] = await pool.execute(legacyInsertSql, [jobId, userId, safeIp]);
        }
      } else {
        resolvedFingerprint = safeFingerprint || `ip:${safeIp || 'unknown'}`;
        try {
          const insertSql = `
            INSERT INTO job_views (job_id, user_id, viewer_ip, viewer_fingerprint)
            VALUES (?, NULL, ?, ?)
            ON DUPLICATE KEY UPDATE id = id
          `;
          [insertResult] = await pool.execute(insertSql, [jobId, safeIp, resolvedFingerprint]);
        } catch (error) {
          if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
          const legacyInsertSql = `
            INSERT INTO job_views (job_id, user_id, viewer_ip, device_fingerprint)
            VALUES (?, NULL, ?, ?)
            ON DUPLICATE KEY UPDATE id = id
          `;
          [insertResult] = await pool.execute(legacyInsertSql, [jobId, safeIp, resolvedFingerprint]);
        }
      }

      const insertAffectedRows = Number(insertResult?.affectedRows || 0);
      const counted = insertAffectedRows === 1;

      if (counted) {
        try {
          await pool.execute('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?', [jobId]);
        } catch (updateError) {
          // Allow view tracking to work even if the views_count column is missing in legacy DBs.
          if (updateError.code !== 'ER_BAD_FIELD_ERROR') {
            throw updateError;
          }
        }
      }

      const viewsCount = await this.getViewCount(jobId);
      return {
        counted,
        viewsCount,
        insertAffectedRows,
        resolvedFingerprint
      };
    } catch (error) {
      console.error('Error recording unique view:', error);
      throw error;
    }
  }

  // Get view count for a job
  static async getViewCount(jobId) {
    try {
      const query = 'SELECT views_count FROM jobs WHERE id = ?';
      const [rows] = await pool.execute(query, [jobId]);
      return rows[0] ? rows[0].views_count : 0;
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }

      const [fallbackRows] = await pool.execute(
        'SELECT COUNT(*) AS views_count FROM job_views WHERE job_id = ?',
        [jobId]
      );
      return Number(fallbackRows?.[0]?.views_count || 0);
    }
  }

  static async getViewCountsByJobIds(jobIds = []) {
    const normalized = Array.from(new Set((jobIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id))));
    if (!normalized.length) return new Map();

    try {
      const placeholders = normalized.map(() => '?').join(', ');
      const [rows] = await pool.execute(
        `SELECT id AS job_id, views_count FROM jobs WHERE id IN (${placeholders})`,
        normalized
      );
      const map = new Map();
      for (const row of rows) {
        map.set(Number(row.job_id), Number(row.views_count || 0));
      }
      return map;
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }

      const placeholders = normalized.map(() => '?').join(', ');
      const [rows] = await pool.execute(
        `SELECT job_id, COUNT(*) AS views_count
         FROM job_views
         WHERE job_id IN (${placeholders})
         GROUP BY job_id`,
        normalized
      );

      const map = new Map();
      for (const id of normalized) map.set(id, 0);
      for (const row of rows) {
        map.set(Number(row.job_id), Number(row.views_count || 0));
      }
      return map;
    }
  }

  // Legacy method for backward compatibility (deprecated)
  static async incrementViews(id) {
    const query = 'UPDATE jobs SET views_count = views_count + 1 WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Increment applications count
  static async incrementApplications(id) {
    const query = 'UPDATE jobs SET applications_count = applications_count + 1 WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // Get job statistics for recruiter
  static async getRecruiterStats(recruiterId) {
    const query = `
      SELECT
        COUNT(*) as total_jobs,
        SUM(views_count) as total_views,
        SUM(applications_count) as total_applications,
        COUNT(CASE WHEN status IN ('OPEN', 'Active') THEN 1 END) as active_jobs
      FROM jobs WHERE recruiter_id = ?
    `;
    const [rows] = await pool.execute(query, [recruiterId]);
    return rows[0];
  }

  // Get job with applications
  static async findByIdWithApplications(id) {
    const jobQuery = 'SELECT * FROM jobs WHERE id = ?';
    const applicationsQuery = `
      SELECT
        ja.*,
        u.name,
        u.email,
        u.registration_number
      FROM job_applications ja
      LEFT JOIN users u ON ja.user_id = u.id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
    `;

    const [jobRows] = await pool.execute(jobQuery, [id]);

    let applicationRows = [];
    try {
      const [rows] = await pool.execute(applicationsQuery, [id]);
      applicationRows = rows;
    } catch (err) {
      // If the job_applications table is missing or any other issue occurs,
      // fall back to an empty applications list instead of failing the request.
      const benignCodes = ['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'];
      if (!benignCodes.includes(err.code)) {
        console.error('findByIdWithApplications error:', err.message);
      }
      applicationRows = [];
    }

    if (!jobRows[0]) return null;

    const job = new Job(jobRows[0]);
    job.applications = applicationRows;

    return job;
  }

  // Get job JSON (without sensitive data)
  toJSON() {
    return {
      id: this.id,
      recruiter_id: this.recruiter_id,
      title: this.title,
      company: this.company,
      company_name: this.company_name,
      company_logo: this.company_logo,
      location: this.location,
      employment_type: this.employment_type,
      experience_level: this.experience_level,
      salary_min: this.salary_min,
      salary_max: this.salary_max,
      salary_currency: this.salary_currency,
      description: this.description,
      requirements: this.requirements,
      benefits: this.benefits,
      skills_required: this.skills_required,
      application_deadline: this.application_deadline,
      status: this.status,
      is_featured: this.is_featured,
      is_urgent: this.is_urgent,
      views_count: this.views_count,
      applications_count: this.applications_count,
      max_applicants: this.max_applicants,
      deadline_notification_sent_at: this.deadline_notification_sent_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Job;
