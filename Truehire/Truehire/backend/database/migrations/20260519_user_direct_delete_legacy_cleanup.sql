CREATE TABLE IF NOT EXISTS user_direct_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_udm_sender (sender_id),
  INDEX idx_udm_receiver (receiver_id),
  INDEX idx_udm_pair (sender_id, receiver_id),
  INDEX idx_udm_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS favourite_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(30) DEFAULT 'JOB',
  entity_id BIGINT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_read (user_id, is_read),
  INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS job_recommendation_emails (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_job_recommendation_email (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS work_experience (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  company_name VARCHAR(200) NULL,
  job_title VARCHAR(200) NULL,
  employment_type VARCHAR(100) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  is_current TINYINT(1) DEFAULT 0,
  location VARCHAR(200) NULL,
  job_description TEXT NULL,
  achievements TEXT NULL,
  technologies_used TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_work_experience_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS education (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  qualification VARCHAR(200) NULL,
  degree VARCHAR(200) NULL,
  field_of_study VARCHAR(200) NULL,
  college_name VARCHAR(200) NULL,
  year_of_passing INT NULL,
  percentage DECIMAL(5,2) NULL,
  cgpa DECIMAL(4,2) NULL,
  certificate_file VARCHAR(500) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_education_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  recruiter_id BIGINT NULL,
  type VARCHAR(100) NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to BIGINT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_support_tickets_user_id (user_id),
  INDEX idx_support_tickets_recruiter_id (recruiter_id)
);

CREATE TABLE IF NOT EXISTS job_views (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  viewer_ip VARCHAR(100) NULL,
  viewer_fingerprint VARCHAR(255) NULL,
  device_fingerprint VARCHAR(255) NULL,
  viewed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_views_job_id (job_id),
  INDEX idx_job_views_user_id (user_id)
);

DELETE udm FROM user_direct_messages udm LEFT JOIN users s ON s.id = udm.sender_id LEFT JOIN users r ON r.id = udm.receiver_id WHERE s.id IS NULL OR r.id IS NULL;
DELETE fn FROM favourite_notifications fn LEFT JOIN users u ON u.id = fn.user_id WHERE u.id IS NULL;
DELETE jre FROM job_recommendation_emails jre LEFT JOIN users u ON u.id = jre.user_id WHERE u.id IS NULL;
DELETE we FROM work_experience we LEFT JOIN users u ON u.id = we.user_id WHERE u.id IS NULL;
DELETE edu FROM education edu LEFT JOIN users u ON u.id = edu.user_id WHERE u.id IS NULL;
DELETE st FROM support_tickets st LEFT JOIN users u ON u.id = st.user_id WHERE st.user_id IS NOT NULL AND u.id IS NULL;
DELETE jv FROM job_views jv LEFT JOIN users u ON u.id = jv.user_id WHERE jv.user_id IS NOT NULL AND u.id IS NULL;

DROP TRIGGER IF EXISTS bd_user_legacy_direct_messages;
CREATE TRIGGER bd_user_legacy_direct_messages BEFORE DELETE ON users FOR EACH ROW DELETE FROM user_direct_messages WHERE sender_id = OLD.id OR receiver_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_favourite_notifications;
CREATE TRIGGER bd_user_favourite_notifications BEFORE DELETE ON users FOR EACH ROW DELETE FROM favourite_notifications WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_job_recommend_emails;
CREATE TRIGGER bd_user_job_recommend_emails BEFORE DELETE ON users FOR EACH ROW DELETE FROM job_recommendation_emails WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_work_experience;
CREATE TRIGGER bd_user_work_experience BEFORE DELETE ON users FOR EACH ROW DELETE FROM work_experience WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_education;
CREATE TRIGGER bd_user_education BEFORE DELETE ON users FOR EACH ROW DELETE FROM education WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_support_tickets;
CREATE TRIGGER bd_user_support_tickets BEFORE DELETE ON users FOR EACH ROW DELETE FROM support_tickets WHERE user_id = OLD.id;

DROP TRIGGER IF EXISTS bd_user_job_views;
CREATE TRIGGER bd_user_job_views BEFORE DELETE ON users FOR EACH ROW DELETE FROM job_views WHERE user_id = OLD.id;
