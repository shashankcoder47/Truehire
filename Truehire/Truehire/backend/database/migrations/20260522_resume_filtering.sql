SET @jobs_min_experience_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'jobs'
    AND COLUMN_NAME = 'min_experience_years'
);

SET @jobs_min_experience_sql := IF(
  @jobs_min_experience_missing,
  'ALTER TABLE jobs ADD COLUMN min_experience_years DECIMAL(4,1) NULL AFTER skills_required',
  'SELECT 1'
);

PREPARE jobs_min_experience_stmt FROM @jobs_min_experience_sql;
EXECUTE jobs_min_experience_stmt;
DEALLOCATE PREPARE jobs_min_experience_stmt;

SET @jobs_match_percentage_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'jobs'
    AND COLUMN_NAME = 'match_percentage'
);

SET @jobs_match_percentage_sql := IF(
  @jobs_match_percentage_missing,
  'ALTER TABLE jobs ADD COLUMN match_percentage INT NOT NULL DEFAULT 0 AFTER min_experience_years',
  'SELECT 1'
);

PREPARE jobs_match_percentage_stmt FROM @jobs_match_percentage_sql;
EXECUTE jobs_match_percentage_stmt;
DEALLOCATE PREPARE jobs_match_percentage_stmt;

SET @apps_match_score_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND COLUMN_NAME = 'match_score'
);

SET @apps_match_score_sql := IF(
  @apps_match_score_missing,
  'ALTER TABLE applications ADD COLUMN match_score INT NULL AFTER resume_path',
  'SELECT 1'
);

PREPARE apps_match_score_stmt FROM @apps_match_score_sql;
EXECUTE apps_match_score_stmt;
DEALLOCATE PREPARE apps_match_score_stmt;

SET @apps_matched_skills_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND COLUMN_NAME = 'matched_skills'
);

SET @apps_matched_skills_sql := IF(
  @apps_matched_skills_missing,
  'ALTER TABLE applications ADD COLUMN matched_skills TEXT NULL AFTER match_score',
  'SELECT 1'
);

PREPARE apps_matched_skills_stmt FROM @apps_matched_skills_sql;
EXECUTE apps_matched_skills_stmt;
DEALLOCATE PREPARE apps_matched_skills_stmt;

SET @apps_missing_skills_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND COLUMN_NAME = 'missing_skills'
);

SET @apps_missing_skills_sql := IF(
  @apps_missing_skills_missing,
  'ALTER TABLE applications ADD COLUMN missing_skills TEXT NULL AFTER matched_skills',
  'SELECT 1'
);

PREPARE apps_missing_skills_stmt FROM @apps_missing_skills_sql;
EXECUTE apps_missing_skills_stmt;
DEALLOCATE PREPARE apps_missing_skills_stmt;

SET @apps_match_status_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND COLUMN_NAME = 'match_status'
);

SET @apps_match_status_sql := IF(
  @apps_match_status_missing,
  'ALTER TABLE applications ADD COLUMN match_status VARCHAR(30) NOT NULL DEFAULT ''MATCHED'' AFTER missing_skills',
  'SELECT 1'
);

PREPARE apps_match_status_stmt FROM @apps_match_status_sql;
EXECUTE apps_match_status_stmt;
DEALLOCATE PREPARE apps_match_status_stmt;

SET @apps_match_status_index_missing := (
  SELECT COUNT(*) = 0
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND INDEX_NAME = 'idx_app_match_status'
);

SET @apps_match_status_index_sql := IF(
  @apps_match_status_index_missing,
  'ALTER TABLE applications ADD KEY idx_app_match_status (match_status)',
  'SELECT 1'
);

PREPARE apps_match_status_index_stmt FROM @apps_match_status_index_sql;
EXECUTE apps_match_status_index_stmt;
DEALLOCATE PREPARE apps_match_status_index_stmt;
