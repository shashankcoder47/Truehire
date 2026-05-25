const { pool } = require("../config/database");

const ensureReviewsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      rating TINYINT NOT NULL,
      review_message TEXT NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      job_title VARCHAR(255) NULL,
      company_name VARCHAR(255) NULL,
      profile_image MEDIUMTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_user_id (user_id)
    )
  `);
};

exports.getReviews = async (req, res) => {
  try {
    await ensureReviewsTable();

    const [rows] = await pool.query(
      `
        SELECT
          id,
          rating,
          review_message,
          user_name,
          job_title,
          company_name,
          profile_image,
          created_at
        FROM user_reviews
        ORDER BY created_at DESC
        LIMIT 100
      `
    );

    res.json({
      success: true,
      reviews: rows
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews."
    });
  }
};

exports.createReview = async (req, res) => {
  let connection;
  try {
    await ensureReviewsTable();

    const userId = Number(req.user?.id || 0) || null;
    const rating = Number(req.body?.rating);
    const reviewMessage = String(req.body?.review_message || "").trim();
    const userName = String(req.body?.user_name || "").trim();
    const jobTitle = String(req.body?.job_title || "").trim();
    const companyName = String(req.body?.company_name || "").trim();
    const profileImage = req.body?.profile_image ? String(req.body.profile_image) : null;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5."
      });
    }

    if (!reviewMessage) {
      return res.status(400).json({
        success: false,
        message: "Review message is required."
      });
    }

    if (!userName) {
      return res.status(400).json({
        success: false,
        message: "User name is required."
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Keep only one latest review per user.
    await connection.query(
      `
        DELETE FROM user_reviews
        WHERE user_id = ?
      `,
      [userId]
    );

    const [result] = await connection.query(
      `
        INSERT INTO user_reviews (
          user_id,
          rating,
          review_message,
          user_name,
          job_title,
          company_name,
          profile_image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        Math.round(rating),
        reviewMessage,
        userName,
        jobTitle || null,
        companyName || null,
        profileImage
      ]
    );

    const [[created]] = await connection.query(
      `
        SELECT
          id,
          user_id,
          rating,
          review_message,
          user_name,
          job_title,
          company_name,
          profile_image,
          created_at
        FROM user_reviews
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    await connection.commit();
    connection.release();
    connection = null;

    res.status(201).json({
      success: true,
      review: created
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (_) {
        // ignore rollback errors
      }
    }
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating review."
    });
  }
};
