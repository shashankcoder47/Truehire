CREATE TABLE IF NOT EXISTS company_followers (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  company_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_company (user_id, company_id),
  INDEX idx_company_followers_user_id (user_id),
  INDEX idx_company_followers_company_id (company_id),
  CONSTRAINT fk_company_followers_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_company_followers_company
    FOREIGN KEY (company_id) REFERENCES recruiters(id) ON DELETE CASCADE
);
