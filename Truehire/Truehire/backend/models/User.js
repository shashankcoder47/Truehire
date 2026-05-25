
// // module.exports = User;
// const { pool } = require('../config/database');

// class User {
//   constructor(data) {
//     this.id = data.id;
//     this.name = data.name;
//     this.email = data.email;
//     this.password = data.password;
//     this.role = data.role || 'user';
//     this.status = data.status;
//     this.profile_complete = data.profile_complete || 0;
//     this.contact_number = data.contact_number;
//     this.current_location = data.current_location;
//     this.professional_summary = data.professional_summary;
//     this.core_skills = data.core_skills;
//     this.linkedin_url = data.linkedin_url;
//     this.github_url = data.github_url;
//     this.portfolio_url = data.portfolio_url;
//     this.profile_photo = data.profile_photo;
//     this.created_at = data.created_at;
//     this.updated_at = data.updated_at;
//   }

//   // ------------------------------
//   // CREATE USER (FIXED)
//   // ------------------------------
//   static async create(userData) {
//     const { name, email, password, role = 'user' } = userData;

//     const query = `
//       INSERT INTO users (name, email, password, role, created_at, updated_at)
//       VALUES (?, ?, ?, ?, NOW(), NOW())
//     `;

//     const [result] = await pool.execute(query, [name, email, password, role]);
//     return result.insertId;
//   }

//   // ------------------------------
//   // FIND BY EMAIL
//   // ------------------------------
//   static async findByEmail(email) {
//     const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
//     return rows[0] ? new User(rows[0]) : null;
//   }

//   // ------------------------------
//   // FIND BY ID
//   // ------------------------------
//   static async findById(id) {
//     const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
//     return rows[0] ? new User(rows[0]) : null;
//   }

//   // ------------------------------
//   // GET ALL USERS
//   // ------------------------------
//   static async findAll() {
//     const query = `
//       SELECT id, name, email, role, status, profile_complete, created_at
//       FROM users
//     `;
//     const [rows] = await pool.execute(query);
//     return rows.map(row => new User(row));
//   }

// static async findAndCountAll({ limit = 10, offset = 0 }) {

//   // Use ONLY columns you know exist
//   const query = `
//     SELECT id, name, email
//     FROM users
//     ORDER BY id DESC
//     LIMIT ? OFFSET ?
//   `;

//   const countQuery = `SELECT COUNT(*) AS total FROM users`;

//   const [[countRow]] = await pool.execute(countQuery);
//   const [rows] = await pool.execute(query, [limit, offset]);

//   return {
//     rows: rows.map(row => new User(row)),
//     count: countRow.total
//   };
// }



//   // ------------------------------
//   // UPDATE USER
//   // ------------------------------
//   static async update(id, updateData) {
//     const fields = [];
//     const values = [];

//     Object.keys(updateData).forEach(key => {
//       fields.push(`${key} = ?`);
//       values.push(updateData[key]);
//     });

//     values.push(id);

//     const query = `
//       UPDATE users
//       SET ${fields.join(', ')}, updated_at = NOW()
//       WHERE id = ?
//     `;

//     const [result] = await pool.execute(query, values);
//     return result.affectedRows > 0;
//   }

//   // ------------------------------
//   // DELETE USER
//   // ------------------------------
//   static async delete(id) {
//     const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//     return result.affectedRows > 0;
//   }

//   // ------------------------------
//   // UPDATE PASSWORD
//   // ------------------------------
//   static async updatePassword(userId, hashedPassword) {
//     try {
//       const [result] = await pool.execute(
//         'UPDATE users SET password = ? WHERE id = ?',
//         [hashedPassword, userId]
//       );
//       return result.affectedRows > 0;
//     } catch (error) {
//       console.error('Error updating password:', error);
//       throw error;
//     }
//   }

//   // ------------------------------
//   // SANITIZE OUTPUT
//   // ------------------------------
//   toJSON() {
//     const { password, ...userWithoutPassword } = this;
//     return userWithoutPassword;
//   }

//   // ------------------------------
//   // PROFILE COMPLETENESS CALCULATION
//   // (unchanged)
//   // ------------------------------
//   static calculateProfileCompleteness(userData) {
//     const sections = {
//       basicInfo: {
//         fields: ['name', 'email', 'contact_number', 'current_location', 'profile_photo'],
//         weight: 10
//       },
//       professionalSummary: {
//         fields: ['resume_headline', 'professional_summary', 'key_highlights', 'resume_file'],
//         weight: 10
//       },
//       workExperience: {
//         fields: ['employment_status', 'total_experience_years', 'total_experience_months'],
//         weight: 15
//       },
//       education: {
//         fields: ['highest_qualification', 'degree', 'college_name', 'year_of_passing'],
//         weight: 10
//       },
//       skills: {
//         fields: ['core_skills', 'secondary_skills', 'tools_technologies'],
//         weight: 15
//       },
//       projects: { fields: ['projects'], weight: 10 },
//       certifications: { fields: ['certifications'], weight: 5 },
//       careerPreferences: {
//         fields: ['desired_job_role', 'preferred_locations', 'preferred_employment_type', 'expected_salary_range'],
//         weight: 10
//       },
//       socialPresence: {
//         fields: ['personal_website', 'linkedin_url', 'github_url'],
//         weight: 5
//       },
//       personality: {
//         fields: ['languages_known', 'hobbies_interests', 'soft_skills'],
//         weight: 5
//       }
//     };

//     let totalCompleteness = 0;

//     for (const section of Object.values(sections)) {
//       const filledFields = section.fields.filter(field => {
//         const value = userData[field];
//         if (Array.isArray(value)) return value.length > 0;
//         if (typeof value === 'string') return value.trim().length > 0;
//         return value !== null && value !== undefined;
//       });

//       totalCompleteness += (filledFields.length / section.fields.length) * section.weight;
//     }

//     return Math.min(Math.round(totalCompleteness), 100);
//   }

//   // ------------------------------
//   // FULL PROFILE WITH RELATIONS
//   // ------------------------------
//   static async getCompleteProfile(userId) {
//     const user = await User.findById(userId);
//     if (!user) return null;

//     const [workExperience, education, projects, certifications] = await Promise.all([
//       require('./WorkExperience').findByUserId(userId),
//       require('./Education').findByUserId(userId),
//       require('./Project').findByUserId(userId),
//       require('./Certification').findByUserId(userId)
//     ]);

//     const profileData = user.toJSON();
//     profileData.workExperience = workExperience;
//     profileData.education = education;
//     profileData.projects = projects;
//     profileData.certifications = certifications;

//     profileData.profileCompleteness = User.calculateProfileCompleteness(profileData);

//     return profileData;
//   }
// }

// module.exports = User;
// module.exports = User;
const { pool } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'user';
    this.status = data.status;
    this.profile_complete = data.profile_complete || 0;
    this.date_of_birth = data.date_of_birth;
    this.contact_number = data.contact_number;
    this.current_location = data.current_location;
    this.professional_summary = data.professional_summary;
    this.core_skills = data.core_skills;
    this.secondary_skills = data.secondary_skills;
    this.languages_known = data.languages_known;
    this.soft_skills = data.soft_skills;
    this.projects = data.projects;
    this.certifications = data.certifications;
    this.current_salary = data.current_salary;
    this.expected_salary = data.expected_salary;
    this.salary_confidential = data.salary_confidential;
    this.hobbies_interests = data.hobbies_interests;
    this.relocated = data.relocated ?? data.open_to_relocation;
    this.profile_photo = data.profile_photo;
    this.google_id = data.google_id;
    this.login_type = data.login_type;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // ------------------------------
  // CREATE USER (FIXED)
  // ------------------------------
  static async create(userData) {
    const { name, email, password, role = 'user', googleId, loginType } = userData;
    const normalizedLoginTypeRaw = String(loginType || '').trim().toUpperCase();
    const normalizedLoginType =
      normalizedLoginTypeRaw === 'GOOGLE'
        ? 'GOOGLE'
        : 'EMAIL';

    const columns = ['name', 'email', 'password', 'role', 'created_at', 'updated_at'];
    const values = [name, email, password || null, role, 'NOW()', 'NOW()'];

    if (googleId !== undefined) {
      columns.push('google_id');
      values.push(googleId);
    }
    columns.push('login_type');
    values.push(normalizedLoginType);

    const placeholders = columns.map(column => (column === 'created_at' || column === 'updated_at' ? 'NOW()' : '?'));
    const filteredValues = values.filter((value, index) => !['created_at', 'updated_at'].includes(columns[index]));

    const query = `
      INSERT INTO users (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;

    const [result] = await pool.execute(query, filteredValues);
    return result.insertId;
  }

  // ------------------------------
  // FIND BY EMAIL
  // ------------------------------
  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] ? new User(rows[0]) : null;
  }

  // ------------------------------
  // FIND BY ID
  // ------------------------------
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] ? new User(rows[0]) : null;
  }

  // ------------------------------
  // GET ALL USERS
  // ------------------------------
  static async findAll() {
    const query = `
      SELECT id, name, email, role, status, profile_complete, created_at
      FROM users
    `;
    const [rows] = await pool.execute(query);
    return rows.map(row => new User(row));
  }

  static async findAndCountAll({ limit = 10, offset = 0 }) {
    const query = `
      SELECT id, name, email
      FROM users
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(*) AS total FROM users`;

    const [[countRow]] = await pool.execute(countQuery);
    const [rows] = await pool.execute(query, [limit, offset]);

    return {
      rows: rows.map(row => new User(row)),
      count: countRow.total
    };
  }

  // ------------------------------
  // ✅ NEW METHOD (ONLY ADDITION)
  // GET ALL USER EMAILS (FOR JOB ALERT)
  // ------------------------------
  static async getAllUserEmails() {
    const query = `
      SELECT email FROM users
      WHERE role = 'user'
        AND status = 'Active'
        AND email IS NOT NULL
    `;
    const [rows] = await pool.execute(query);
    return rows.map(row => row.email);
  }

  // ------------------------------
  // UPDATE USER
  // ------------------------------
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // ------------------------------
  // DELETE USER
  // ------------------------------
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // ------------------------------
  // UPDATE PASSWORD
  // ------------------------------
  static async updatePassword(userId, hashedPassword) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // ------------------------------
  // SANITIZE OUTPUT
  // ------------------------------
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // ------------------------------
  // PROFILE COMPLETENESS CALCULATION
  // (unchanged)
  // ------------------------------
  static calculateProfileCompleteness(userData) {
    const sections = {
      basicInfo: {
        fields: ['name', 'email', 'contact_number', 'current_location', 'profile_photo'],
        weight: 10
      },
      professionalSummary: {
        fields: ['resume_headline', 'professional_summary', 'key_highlights', 'resume_file'],
        weight: 10
      },
      workExperience: {
        fields: ['employment_status', 'total_experience_years', 'total_experience_months'],
        weight: 15
      },
      education: {
        fields: ['highest_qualification', 'degree', 'college_name', 'year_of_passing'],
        weight: 10
      },
      skills: {
        fields: ['core_skills', 'secondary_skills', 'tools_technologies'],
        weight: 15
      },
      projects: { fields: ['projects'], weight: 10 },
      certifications: { fields: ['certifications'], weight: 5 },
      careerPreferences: {
        fields: ['desired_job_role', 'preferred_locations', 'preferred_employment_type', 'expected_salary_range'],
        weight: 10
      },
      socialPresence: {
        fields: ['personal_website', 'linkedin_url', 'github_url'],
        weight: 5
      },
      personality: {
        fields: ['languages_known', 'hobbies_interests', 'soft_skills'],
        weight: 5
      }
    };

    let totalCompleteness = 0;

    for (const section of Object.values(sections)) {
      const filledFields = section.fields.filter(field => {
        const value = userData[field];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return value !== null && value !== undefined;
      });

      totalCompleteness += (filledFields.length / section.fields.length) * section.weight;
    }

    return Math.min(Math.round(totalCompleteness), 100);
  }

  // ------------------------------
  // FULL PROFILE WITH RELATIONS
  // ------------------------------
  static async getCompleteProfile(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const safeLoad = async (loader, fallback) => {
      try {
        return await loader();
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_TABLE_ERROR') {
          return fallback;
        }
        throw error;
      }
    };

    const [workExperience, education] = await Promise.all([
      safeLoad(() => require('./WorkExperience').findByUserId(userId), []),
      safeLoad(() => require('./Education').findByUserId(userId), [])
    ]);

    const profileData = user.toJSON();
    profileData.workExperience = workExperience;
    profileData.education = education;
    profileData.profileCompleteness = User.calculateProfileCompleteness(profileData);

    return profileData;
  }
}

module.exports = User;
