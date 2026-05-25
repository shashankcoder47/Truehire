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

CREATE TABLE IF NOT EXISTS job_recommendation_emails (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_job_recommendation_email (user_id, job_id)
);

DELETE st FROM support_tickets st LEFT JOIN recruiters r ON r.id = st.recruiter_id WHERE st.recruiter_id IS NOT NULL AND r.id IS NULL;
DELETE jv FROM job_views jv LEFT JOIN jobs j ON j.id = jv.job_id WHERE j.id IS NULL;
DELETE jre FROM job_recommendation_emails jre LEFT JOIN jobs j ON j.id = jre.job_id WHERE j.id IS NULL;

DROP TRIGGER IF EXISTS bd_recruiter_msg_attachments;
CREATE TRIGGER bd_recruiter_msg_attachments BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM application_message_attachments WHERE message_id IN (SELECT id FROM application_messages WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id) OR conversation_id IN (SELECT id FROM application_conversations WHERE recruiter_id = OLD.id OR job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id)) OR application_id IN (SELECT id FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id)));

DROP TRIGGER IF EXISTS bd_recruiter_app_messages;
CREATE TRIGGER bd_recruiter_app_messages BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM application_messages WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id) OR conversation_id IN (SELECT id FROM application_conversations WHERE recruiter_id = OLD.id OR job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id)) OR application_id IN (SELECT id FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id));

DROP TRIGGER IF EXISTS bd_recruiter_app_conversations;
CREATE TRIGGER bd_recruiter_app_conversations BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM application_conversations WHERE recruiter_id = OLD.id OR job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id) OR application_id IN (SELECT id FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id));

DROP TRIGGER IF EXISTS bd_recruiter_intro_videos;
CREATE TRIGGER bd_recruiter_intro_videos BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM introduction_videos WHERE recruiter_id = OLD.id OR job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id) OR application_id IN (SELECT id FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id));

DROP TRIGGER IF EXISTS bd_recruiter_user_notifications;
CREATE TRIGGER bd_recruiter_user_notifications BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM user_notifications WHERE application_id IN (SELECT id FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id));

DROP TRIGGER IF EXISTS bd_recruiter_notifications;
CREATE TRIGGER bd_recruiter_notifications BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM recruiter_notifications WHERE recruiter_id = OLD.id OR application_id IN (SELECT id FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id));

DROP TRIGGER IF EXISTS bd_recruiter_saved_jobs;
CREATE TRIGGER bd_recruiter_saved_jobs BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM saved_jobs WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id);

DROP TRIGGER IF EXISTS bd_recruiter_job_views;
CREATE TRIGGER bd_recruiter_job_views BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM job_views WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id);

DROP TRIGGER IF EXISTS bd_recruiter_job_recommend_emails;
CREATE TRIGGER bd_recruiter_job_recommend_emails BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM job_recommendation_emails WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id);

DROP TRIGGER IF EXISTS bd_recruiter_applications;
CREATE TRIGGER bd_recruiter_applications BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id);

DROP TRIGGER IF EXISTS bd_recruiter_job_applications;
CREATE TRIGGER bd_recruiter_job_applications BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = OLD.id);

DROP TRIGGER IF EXISTS bd_recruiter_support_tickets;
CREATE TRIGGER bd_recruiter_support_tickets BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM support_tickets WHERE recruiter_id = OLD.id;

DROP TRIGGER IF EXISTS bd_recruiter_jobs;
CREATE TRIGGER bd_recruiter_jobs BEFORE DELETE ON recruiters FOR EACH ROW DELETE FROM jobs WHERE recruiter_id = OLD.id;
