SET @add_job_alerts_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN job_alerts TINYINT(1) DEFAULT 1',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'job_alerts'
);

PREPARE add_job_alerts_column_stmt FROM @add_job_alerts_column;
EXECUTE add_job_alerts_column_stmt;
DEALLOCATE PREPARE add_job_alerts_column_stmt;

CREATE TABLE IF NOT EXISTS weekly_job_alert_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  week_start_date DATE NOT NULL,
  job_count INT NOT NULL DEFAULT 0,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_weekly_job_alert_user_week (user_id, week_start_date),
  INDEX idx_weekly_job_alert_sent_at (sent_at)
);
