const { pool } = require("../config/database");

const parseCompanyId = (rawCompanyId) => {
  const companyId = Number.parseInt(rawCompanyId, 10);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
};

const ensureFavouriteCompaniesTable = async () => {
  await pool.query(`
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

const ensureFavouriteNotificationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS favourite_notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      type ENUM('FAV_COMPANY_NEW_JOB') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      entity_type ENUM('JOB','COMPANY') DEFAULT 'JOB',
      entity_id BIGINT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_read (user_id, is_read),
      INDEX idx_created (created_at)
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
  const hasCompaniesTable = await tableExists("companies");

  if (hasCompaniesTable) {
    const [[companyRow]] = await pool.query("SELECT id FROM companies WHERE id = ? LIMIT 1", [companyId]);
    foundInCompanies = Boolean(companyRow);
  }

  if (foundInCompanies) {
    return true;
  }

  const [[recruiterRow]] = await pool.query("SELECT id FROM recruiters WHERE id = ? LIMIT 1", [companyId]);
  return Boolean(recruiterRow);
};

const buildFavouriteCompaniesQuery = async () => {
  const hasCompaniesTable = await tableExists("companies");
  if (hasCompaniesTable) {
    return `
      SELECT
        fc.id AS favourite_id,
        fc.user_id,
        fc.company_id,
        fc.created_at AS favourited_at,
        COALESCE(c.id, r.id) AS id,
        r.recruiter_id,
        COALESCE(c.company_name, r.company_name) AS company_name,
        COALESCE(c.industry, r.industry) AS industry,
        COALESCE(c.company_size, r.company_size) AS company_size,
        COALESCE(c.company_logo, r.company_logo) AS company_logo,
        COALESCE(c.website, r.website) AS website,
        COALESCE(c.short_overview, r.short_overview) AS short_overview
      FROM favourite_companies fc
      LEFT JOIN companies c ON c.id = fc.company_id
      LEFT JOIN recruiters r ON r.id = fc.company_id
      WHERE fc.user_id = ?
        AND (c.id IS NOT NULL OR r.id IS NOT NULL)
      ORDER BY fc.created_at DESC
    `;
  }

  return `
    SELECT
      fc.id AS favourite_id,
      fc.user_id,
      fc.company_id,
      fc.created_at AS favourited_at,
      r.id,
      r.recruiter_id,
      r.company_name,
      r.industry,
      r.company_size,
      r.company_logo,
      r.website,
      r.short_overview
    FROM favourite_companies fc
    INNER JOIN recruiters r ON r.id = fc.company_id
    WHERE fc.user_id = ?
    ORDER BY fc.created_at DESC
  `;
};

const getCompanyDisplayName = async (companyId) => {
  const hasCompaniesTable = await tableExists("companies");
  if (hasCompaniesTable) {
    const [[companyRow]] = await pool.query(
      "SELECT company_name FROM companies WHERE id = ? LIMIT 1",
      [companyId]
    );
    if (companyRow?.company_name) return companyRow.company_name;
  }

  const [[recruiterRow]] = await pool.query(
    "SELECT company_name, company FROM recruiters WHERE id = ? LIMIT 1",
    [companyId]
  );
  return recruiterRow?.company_name || recruiterRow?.company || "Company";
};

exports.favouriteCompany = async (req, res) => {
  try {
    await ensureFavouriteCompaniesTable();
    await ensureFavouriteNotificationsTable();

    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company id." });
    }

    const companyExists = await validateCompanyExists(companyId);
    if (!companyExists) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    const [insertResult] = await pool.query(
      `
        INSERT IGNORE INTO favourite_companies (user_id, company_id)
        VALUES (?, ?)
      `,
      [req.user.id, companyId]
    );

    // Create one notification only when the favourite is newly created.
    if (insertResult?.affectedRows > 0) {
      const companyName = await getCompanyDisplayName(companyId);
      await pool.query(
        `
          INSERT INTO favourite_notifications
            (user_id, type, title, message, entity_type, entity_id, is_read, created_at)
          VALUES
            (?, 'FAV_COMPANY_NEW_JOB', ?, ?, 'COMPANY', ?, 0, NOW())
        `,
        [
          req.user.id,
          `Company added to favourites`,
          `${companyName} was added to your favourites.`,
          companyId
        ]
      );
    }

    return res.json({
      success: true,
      favourited: true
    });
  } catch (error) {
    console.error("Favourite company error:", error);
    return res.status(500).json({ success: false, message: "Server error favouriting company." });
  }
};

exports.unfavouriteCompany = async (req, res) => {
  try {
    await ensureFavouriteCompaniesTable();

    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company id." });
    }

    const companyExists = await validateCompanyExists(companyId);
    if (!companyExists) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    await pool.query(
      `
        DELETE FROM favourite_companies
        WHERE user_id = ? AND company_id = ?
      `,
      [req.user.id, companyId]
    );

    return res.json({
      success: true,
      favourited: false
    });
  } catch (error) {
    console.error("Unfavourite company error:", error);
    return res.status(500).json({ success: false, message: "Server error unfavouriting company." });
  }
};

exports.checkFavouriteCompany = async (req, res) => {
  try {
    await ensureFavouriteCompaniesTable();

    const companyId = parseCompanyId(req.params.companyId);
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company id." });
    }

    const companyExists = await validateCompanyExists(companyId);
    if (!companyExists) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    const [[row]] = await pool.query(
      `
        SELECT id
        FROM favourite_companies
        WHERE user_id = ? AND company_id = ?
        LIMIT 1
      `,
      [req.user.id, companyId]
    );

    return res.json({
      success: true,
      favourited: Boolean(row)
    });
  } catch (error) {
    console.error("Check favourite company error:", error);
    return res.status(500).json({ success: false, message: "Server error checking favourite status." });
  }
};

exports.getFavouriteCompanies = async (req, res) => {
  try {
    await ensureFavouriteCompaniesTable();

    const query = await buildFavouriteCompaniesQuery();
    const [rows] = await pool.query(query, [req.user.id]);

    const companies = (rows || []).map((row) => ({
      ...row,
      id: row.id || row.company_id,
      company_id: row.company_id
    }));

    return res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error("Get favourite companies error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching favourite companies." });
  }
};
