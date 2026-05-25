CREATE TABLE IF NOT EXISTS company_statuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  recruiter_id BIGINT NOT NULL,
  company_id BIGINT NOT NULL,
  media_url VARCHAR(1000) NOT NULL,
  media_type VARCHAR(30) NOT NULL,
  caption TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_statuses_company_created (company_id, created_at),
  INDEX idx_company_statuses_recruiter_id (recruiter_id),
  INDEX idx_company_statuses_active_expiry (status, expires_at, created_at)
);

CREATE TABLE IF NOT EXISTS company_status_views (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  status_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT NOT NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_company_status_view_user (status_id, user_id),
  INDEX idx_company_status_views_status_id (status_id),
  INDEX idx_company_status_views_user_id (user_id)
);
