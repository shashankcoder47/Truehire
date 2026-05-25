const { pool } = require("../config/database");

const forbiddenResponse = (res) =>
  res.status(403).json({
    success: false,
    message: "Only users can save companies."
  });

const invalidCompanyIdResponse = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid company id."
  });

const parseCompanyId = (rawCompanyId) => {
  const companyId = Number.parseInt(rawCompanyId, 10);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
};

const ensureSavedCompaniesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_companies (
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

const tableExists = async (tableName) => {
  const [[row]] = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName]
  );
  return Number(row?.count || 0) > 0;
};

const validateCompanyExists = async (companyId) => {
  let foundInCompanies = false;

  try {
    const hasCompaniesTable = await tableExists("companies");
    if (hasCompaniesTable) {
      const [[companyRow]] = await pool.query("SELECT id FROM companies WHERE id = ? LIMIT 1", [companyId]);
      foundInCompanies = Boolean(companyRow);
    }
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE" && error.code !== "ER_BAD_TABLE_ERROR") {
      throw error;
    }
  }

  if (foundInCompanies) {
    return true;
  }

  // Fallback for deployments where companies are represented by recruiters records.
  const [[recruiterRow]] = await pool.query("SELECT id FROM recruiters WHERE id = ? LIMIT 1", [companyId]);
  return Boolean(recruiterRow);
};

const buildSavedCompaniesQuery = async () => {
  const hasCompaniesTable = await tableExists("companies");
  if (hasCompaniesTable) {
    return `
      SELECT
        sc.id AS saved_company_id,
        sc.user_id,
        sc.company_id,
        sc.created_at AS saved_at,
        COALESCE(c.id, r.id) AS id,
        r.recruiter_id,
        COALESCE(c.company_name, r.company_name) AS company_name,
        COALESCE(c.industry, r.industry) AS industry,
        COALESCE(c.company_size, r.company_size) AS company_size,
        COALESCE(c.company_logo, r.company_logo) AS company_logo,
        COALESCE(c.website, r.website) AS website,
        COALESCE(c.short_overview, r.short_overview) AS short_overview
      FROM saved_companies sc
      LEFT JOIN companies c ON c.id = sc.company_id
      LEFT JOIN recruiters r ON r.id = sc.company_id
      WHERE sc.user_id = ?
        AND (c.id IS NOT NULL OR r.id IS NOT NULL)
      ORDER BY sc.created_at DESC
    `;
  }

  return `
    SELECT
      sc.id AS saved_company_id,
      sc.user_id,
      sc.company_id,
      sc.created_at AS saved_at,
      r.id,
      r.recruiter_id,
      r.company_name,
      r.industry,
      r.company_size,
      r.company_logo,
      r.website,
      r.short_overview
    FROM saved_companies sc
    INNER JOIN recruiters r ON r.id = sc.company_id
    WHERE sc.user_id = ?
    ORDER BY sc.created_at DESC
  `;
};

exports.saveCompany = async (req, res) => {
  try {
    await ensureSavedCompaniesTable();

    if (req.user?.role !== "user") {
      return forbiddenResponse(res);
    }

    const userId = req.user.id;
    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      return invalidCompanyIdResponse(res);
    }

    const exists = await validateCompanyExists(companyId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Company not found."
      });
    }

    await pool.query(
      `
        INSERT INTO saved_companies (user_id, company_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE id = id
      `,
      [userId, companyId]
    );

    return res.json({
      success: true,
      message: "Company saved successfully.",
      data: { companyId }
    });
  } catch (error) {
    console.error("Save company error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving company."
    });
  }
};

exports.unsaveCompany = async (req, res) => {
  try {
    await ensureSavedCompaniesTable();

    if (req.user?.role !== "user") {
      return forbiddenResponse(res);
    }

    const userId = req.user.id;
    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      return invalidCompanyIdResponse(res);
    }

    const exists = await validateCompanyExists(companyId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Company not found."
      });
    }

    await pool.query(
      `
        DELETE FROM saved_companies
        WHERE user_id = ? AND company_id = ?
      `,
      [userId, companyId]
    );

    return res.json({
      success: true,
      message: "Company removed from saved list.",
      data: { companyId }
    });
  } catch (error) {
    console.error("Unsave company error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing saved company."
    });
  }
};

exports.getSavedCompanies = async (req, res) => {
  try {
    await ensureSavedCompaniesTable();

    if (req.user?.role !== "user") {
      return forbiddenResponse(res);
    }

    const userId = req.user.id;
    const listQuery = await buildSavedCompaniesQuery();
    const [rows] = await pool.query(listQuery, [userId]);

    const companies = (rows || []).map((row) => ({
      ...row,
      id: row.id || row.company_id,
      company_id: row.company_id
    }));

    return res.json({
      success: true,
      message: "Saved companies fetched successfully.",
      data: companies
    });
  } catch (error) {
    console.error("Get saved companies error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching saved companies."
    });
  }
};

exports.checkCompanySaved = async (req, res) => {
  try {
    await ensureSavedCompaniesTable();

    if (req.user?.role !== "user") {
      return forbiddenResponse(res);
    }

    const userId = req.user.id;
    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      return invalidCompanyIdResponse(res);
    }

    const exists = await validateCompanyExists(companyId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Company not found."
      });
    }

    const [[savedRow]] = await pool.query(
      `
        SELECT id
        FROM saved_companies
        WHERE user_id = ? AND company_id = ?
        LIMIT 1
      `,
      [userId, companyId]
    );

    return res.json({
      success: true,
      message: "Saved company status fetched successfully.",
      data: { saved: Boolean(savedRow) }
    });
  } catch (error) {
    console.error("Check company saved error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while checking saved company status."
    });
  }
};
