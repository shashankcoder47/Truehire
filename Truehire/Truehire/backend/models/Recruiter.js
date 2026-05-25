const { pool } = require('../config/database');

class Recruiter {
  constructor(data) {
    this.id = data.id;
    this.recruiter_id = data.recruiter_id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.company = data.company;
    this.google_id = data.google_id;
    this.login_type = data.login_type;

    // Company info
    this.company_name = data.company_name;
    this.company_type = data.company_type;
    this.category = data.category;
    this.industry = data.industry;
    this.company_size = data.company_size;
    this.year_founded = data.year_founded;
    this.official_email = data.official_email;
    this.phone_number = data.phone_number;
    this.website = data.website;
    this.headquarters_location = data.headquarters_location;
    this.short_overview = data.short_overview;
    this.detailed_description = data.detailed_description;
    this.company_logo = data.company_logo;
    this.company_image = data.company_image || data.company_logo || null;
    this.linkedin = data.linkedin;
    this.instagram = data.instagram;
    this.facebook = data.facebook;
    this.company_profile_complete = data.company_profile_complete || false;
    this.phone_verified = data.phone_verified || false;
    this.phone_verified_at = data.phone_verified_at;
    this.onboarding_step = data.onboarding_step || null;
    this.onboarding_completed_at = data.onboarding_completed_at;

    this.company_created_at = data.company_created_at;
    this.company_updated_at = data.company_updated_at;

    // System fields
    this.role = data.role || 'recruiter';
    this.status = data.status || 'Active';
    this.approval_status = data.approval_status || 'Approved';
    this.approval_rejection_reason = data.approval_rejection_reason || null;
    this.approval_reviewed_at = data.approval_reviewed_at || null;
    this.approval_reviewed_by = data.approval_reviewed_by || null;
    this.profile_complete = data.profile_complete || false;
    this.job_post_limit = data.job_post_limit || 5;
    this.subscription_status = data.subscription_status || 'Free';
    this.subscription_expiry = data.subscription_expiry;
    this.is_premium = data.is_premium ?? (this.subscription_status === 'Premium');
    this.premium_expiry = data.premium_expiry || null;
    this.premium_expiry_at = data.premium_expiry_at || null;

    try {
      this.sub_recruiters = data.sub_recruiters
        ? JSON.parse(data.sub_recruiters)
        : [];
    } catch (error) {
      console.error("Error parsing sub_recruiters:", error);
      this.sub_recruiters = [];
    }

    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // ------------------------------------------------
  // ID Generator
  // ------------------------------------------------
  static generateRecruiterId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `REC${timestamp}${random}`;
  }

  // ------------------------------------------------
  // Create Recruiter
  // ------------------------------------------------
  static async create(recruiterData) {
    const {
      name,
      email,
      password,
      company,
      role = "recruiter",
      googleId,
      loginType,
      approvalStatus
    } = recruiterData;
    const normalizedLoginTypeRaw = String(loginType || '').trim().toUpperCase();
    const normalizedLoginType =
      normalizedLoginTypeRaw === 'GOOGLE'
        ? 'GOOGLE'
        : 'EMAIL';
    const recruiterId = this.generateRecruiterId();

    const columns = ["recruiter_id", "name", "email", "password", "company", "role", "created_at", "updated_at"];
    const values = [recruiterId, name, email, password || null, company || null, role, "NOW()", "NOW()"];

    if (googleId !== undefined) {
      columns.push("google_id");
      values.push(googleId);
    }
    columns.push("login_type");
    values.push(normalizedLoginType);
    if (approvalStatus !== undefined) {
      columns.push("approval_status");
      values.push(approvalStatus);
    }

    const placeholders = columns.map((column) => (column === "created_at" || column === "updated_at" ? "NOW()" : "?"));
    const filteredValues = values.filter((value, index) => !["created_at", "updated_at"].includes(columns[index]));

    const query = `
      INSERT INTO recruiters (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
    `;

    const [result] = await pool.execute(query, filteredValues);

    return result.insertId;
  }

  // ------------------------------------------------
  // Find by Email
  // ------------------------------------------------
  static async findByEmail(email) {
    const query = "SELECT * FROM recruiters WHERE email = ?";
    const [rows] = await pool.execute(query, [email]);
    return rows[0] ? new Recruiter(rows[0]) : null;
  }

  // ------------------------------------------------
  // Find by ID
  // ------------------------------------------------
  static async findById(id) {
    const query = "SELECT * FROM recruiters WHERE id = ?";
    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? new Recruiter(rows[0]) : null;
  }

  // ------------------------------------------------
  // Find All
  // ------------------------------------------------
  static async findAll() {
    const query =
      "SELECT id, name, email, company, role, profile_complete, created_at FROM recruiters";
    const [rows] = await pool.execute(query);
    return rows.map((row) => new Recruiter(row));
  }

  // ------------------------------------------------
  // FIXED: Update Recruiter (Safe Allowed Fields Only)
  // ------------------------------------------------
  static async update(id, updateData) {
    try {
      // Only allow fields that exist in DB
      const allowedFields = [
        "name",
        "google_id",
        "login_type",
        "company_name",
        "company_type",
        "category",
        "industry",
        "company_size",
        "year_founded",
        "official_email",
        "phone_number",
        "website",
        "headquarters_location",
        "short_overview",
        "detailed_description",
        "company_logo",
        "company_image",
        "linkedin",
        "instagram",
        "facebook",
        "role",
        "status",
        "approval_status",
        "approval_rejection_reason",
        "approval_reviewed_at",
        "approval_reviewed_by",
        "profile_complete",
        "company_profile_complete",
        "phone_verified",
        "phone_verified_at",
        "onboarding_step",
        "onboarding_completed_at"
      ];

      const fields = [];
      const values = [];

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        console.warn("Update failed: No valid fields received.");
        return false;
      }

      values.push(id);

      const query = `
        UPDATE recruiters 
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating recruiter:", error);
      return false;
    }
  }

  // ------------------------------------------------
  // Delete Recruiter
  // ------------------------------------------------
  static async delete(id) {
    const query = "DELETE FROM recruiters WHERE id = ?";
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  // ------------------------------------------------
  // Update Password
  // ------------------------------------------------
  static async updatePassword(recruiterId, hashedPassword) {
    const query = "UPDATE recruiters SET password = ? WHERE id = ?";
    const [result] = await pool.execute(query, [hashedPassword, recruiterId]);
    return result.affectedRows > 0;
  }

  // ------------------------------------------------
  // Sub-Recruiters
  // ------------------------------------------------
  static async addSubRecruiter(recruiterId, subRecruiterData) {
    const recruiter = await this.findById(recruiterId);
    if (!recruiter) return false;

    const countQuery =
      "SELECT COUNT(*) as count FROM sub_recruiters WHERE recruiter_id = ?";
    const [countRows] = await pool.execute(countQuery, [recruiterId]);
    if (countRows[0].count >= 3) {
      throw new Error("Maximum 3 sub-recruiters allowed per company");
    }

    // Attempt insert with full column set if available; progressively fall back when columns are missing
    let result;
    try {
      const query = `
        INSERT INTO sub_recruiters 
        (recruiter_id, name, email, password, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'sub-recruiter', 'Active', NOW(), NOW())
      `;

      [result] = await pool.execute(query, [
        recruiterId,
        subRecruiterData.name,
        subRecruiterData.email,
        subRecruiterData.password,
      ]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        try {
          // Fallback without role/status/updated_at
          const fallbackQuery = `
            INSERT INTO sub_recruiters 
            (recruiter_id, name, email, password, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `;
          [result] = await pool.execute(fallbackQuery, [
            recruiterId,
            subRecruiterData.name,
            subRecruiterData.email,
            subRecruiterData.password,
          ]);
        } catch (innerErr) {
          if (innerErr.code === 'ER_BAD_FIELD_ERROR') {
            // Final fallback: minimal columns only
            const minimalQuery = `
              INSERT INTO sub_recruiters (recruiter_id, name, email, password)
              VALUES (?, ?, ?, ?)
            `;
            [result] = await pool.execute(minimalQuery, [
              recruiterId,
              subRecruiterData.name,
              subRecruiterData.email,
              subRecruiterData.password,
            ]);
          } else {
            throw innerErr;
          }
        }
      } else {
        throw err;
      }
    }

    return result.insertId;
  }

  static async removeSubRecruiter(recruiterId, subRecruiterId) {
    const query =
      "DELETE FROM sub_recruiters WHERE id = ? AND recruiter_id = ?";
    const [result] = await pool.execute(query, [
      subRecruiterId,
      recruiterId,
    ]);
    return result.affectedRows > 0;
  }

  static async findSubRecruiterByEmail(companyId, email) {
    const query =
      "SELECT * FROM sub_recruiters WHERE recruiter_id = ? AND email = ?";
    const [rows] = await pool.execute(query, [companyId, email]);
    return rows[0] || null;
  }

  // ------------------------------------------------
  // Jobs Posting Limit
  // ------------------------------------------------
  static isSubscriptionExpired(expiry) {
    if (!expiry) return false;
    const expiryDate = new Date(expiry);
    if (Number.isNaN(expiryDate.getTime())) return false;
    expiryDate.setHours(23, 59, 59, 999);
    return Date.now() > expiryDate.getTime();
  }

  static isPremiumExpired(expiry) {
    if (!expiry) return false;
    const expiryDate = new Date(expiry);
    if (Number.isNaN(expiryDate.getTime())) return false;
    return Date.now() > expiryDate.getTime();
  }

  static isPremiumActive(recruiter) {
    if (!recruiter) return false;
    if (recruiter.is_premium && !this.isPremiumExpired(recruiter.premium_expiry_at || recruiter.premium_expiry)) {
      return true;
    }
    if (recruiter.subscription_status === 'Premium' && !this.isSubscriptionExpired(recruiter.subscription_expiry)) {
      return true;
    }
    return false;
  }

  static async refreshSubscriptionStatus(recruiterId) {
    const recruiter = await this.findById(recruiterId);
    if (!recruiter) return null;

    const premiumExpiry =
      recruiter.premium_expiry_at || recruiter.premium_expiry || recruiter.subscription_expiry;

    const isPremiumExpired =
      (recruiter.is_premium || recruiter.subscription_status === 'Premium') &&
      (this.isPremiumExpired(premiumExpiry) || this.isSubscriptionExpired(recruiter.subscription_expiry));

    if (!isPremiumExpired) return recruiter;

    const fallbackLimit = 5;
    await pool.execute(
      `
        UPDATE recruiters
        SET subscription_status = 'Expired',
            job_post_limit = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [fallbackLimit, recruiterId]
    );

    try {
      await pool.execute(
        `
          UPDATE recruiters
          SET is_premium = 0,
              premium_expiry = ?,
              premium_expiry_at = ?,
              updated_at = NOW()
          WHERE id = ?
        `,
        [recruiter.subscription_expiry || null, recruiter.subscription_expiry || null, recruiterId]
      );
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR' && error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    return await this.findById(recruiterId);
  }

  static async decrementJobPostLimit(recruiterId) {
    const query = `
      UPDATE recruiters 
      SET job_post_limit = job_post_limit - 1, updated_at = NOW() 
      WHERE id = ? AND job_post_limit > 0
    `;
    const [result] = await pool.execute(query, [recruiterId]);
    return result.affectedRows > 0;
  }

  static async canPostJob(recruiterId) {
    const recruiter = await this.refreshSubscriptionStatus(recruiterId);
    return recruiter
      ? recruiter.job_post_limit > 0 || this.isPremiumActive(recruiter)
      : false;
  }

  // ------------------------------------------------
  // JSON Output
  // ------------------------------------------------
  toJSON() {
    const { password, ...recruiter } = this;
    return recruiter;
  }
}

module.exports = Recruiter;
