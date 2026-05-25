const { pool } = require("../config/database");

exports.getCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        recruiter_id,
        company_name,
        industry,
        company_size,
        company_logo,
        website,
        short_overview,
        detailed_description
      FROM recruiters
    `);

    res.json({
      success: true,
      companies: rows
    });

  } catch (error) {
    const safeFallbackCodes = [
      "ER_BAD_FIELD_ERROR",
      "ER_NO_SUCH_TABLE",
      "ER_BAD_TABLE_ERROR",
      "ECONNREFUSED"
    ];

    if (!safeFallbackCodes.includes(error.code)) {
      console.error("Error fetching companies:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching companies."
      });
    }

    try {
      const [fallbackRows] = await pool.query(`
        SELECT
          id,
          recruiter_id,
          COALESCE(company_name, company) AS company_name,
          NULL AS industry,
          NULL AS company_size,
          NULL AS company_logo,
          NULL AS website,
          NULL AS short_overview,
          NULL AS detailed_description
        FROM recruiters
      `);

      return res.json({
        success: true,
        companies: fallbackRows
      });
    } catch (fallbackError) {
      if (!safeFallbackCodes.includes(fallbackError.code)) {
        console.error("Error fetching fallback companies:", fallbackError);
      }
      return res.json({
        success: true,
        companies: []
      });
    }
  }
};

exports.getCompanyRatingsSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        company_id,
        AVG(rating) AS average_rating,
        COUNT(*) AS ratings_count
      FROM company_ratings
      GROUP BY company_id
    `);

    res.json({
      success: true,
      ratings: rows
    });
  } catch (error) {
    console.error("Error fetching company ratings:", error);
    if (error.code === "ER_NO_SUCH_TABLE" || error.code === "ER_BAD_TABLE_ERROR") {
      return res.json({
        success: true,
        ratings: []
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching company ratings."
    });
  }
};

exports.getUserCompanyRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `
        SELECT company_id, rating
        FROM company_ratings
        WHERE user_id = ?
      `,
      [userId]
    );

    res.json({
      success: true,
      ratings: rows
    });
  } catch (error) {
    console.error("Error fetching user company ratings:", error);
    if (error.code === "ER_NO_SUCH_TABLE" || error.code === "ER_BAD_TABLE_ERROR") {
      return res.json({
        success: true,
        ratings: []
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching user ratings."
    });
  }
};

const ensureCompanyRatingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_company_user (company_id, user_id),
      INDEX idx_company (company_id),
      INDEX idx_user (user_id)
    )
  `);
};

exports.rateCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = parseInt(req.params.id, 10);
    const rating = parseInt(req.body.rating, 10);

    if (!companyId || Number.isNaN(companyId)) {
      return res.status(400).json({ success: false, message: "Invalid company id." });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    await ensureCompanyRatingsTable();

    await pool.query(
      `
        INSERT INTO company_ratings (company_id, user_id, rating)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = NOW()
      `,
      [companyId, userId, rating]
    );

    const [[summary]] = await pool.query(
      `
        SELECT AVG(rating) AS average_rating, COUNT(*) AS ratings_count
        FROM company_ratings
        WHERE company_id = ?
      `,
      [companyId]
    );

    res.json({
      success: true,
      rating: rating,
      average_rating: summary?.average_rating || 0,
      ratings_count: summary?.ratings_count || 0
    });
  } catch (error) {
    console.error("Error saving company rating:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving rating."
    });
  }
};
