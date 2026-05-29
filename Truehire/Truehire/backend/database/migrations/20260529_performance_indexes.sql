SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'application_messages' AND index_name = 'idx_app_messages_application_created'),
  'SELECT 1',
  'ALTER TABLE application_messages ADD INDEX idx_app_messages_application_created (application_id, created_at, id)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'application_messages' AND index_name = 'idx_app_messages_conversation_created'),
  'SELECT 1',
  'ALTER TABLE application_messages ADD INDEX idx_app_messages_conversation_created (conversation_id, created_at, id)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'application_messages' AND index_name = 'idx_app_messages_receiver_unread'),
  'SELECT 1',
  'ALTER TABLE application_messages ADD INDEX idx_app_messages_receiver_unread (receiver_id, receiver_role, read_status)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'job_applications' AND index_name = 'idx_job_applications_job_applied'),
  'SELECT 1',
  'ALTER TABLE job_applications ADD INDEX idx_job_applications_job_applied (job_id, applied_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'job_applications' AND index_name = 'idx_job_applications_user_applied'),
  'SELECT 1',
  'ALTER TABLE job_applications ADD INDEX idx_job_applications_user_applied (user_id, applied_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'jobs' AND index_name = 'idx_jobs_recruiter_created'),
  'SELECT 1',
  'ALTER TABLE jobs ADD INDEX idx_jobs_recruiter_created (recruiter_id, created_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'jobs' AND index_name = 'idx_jobs_status_created'),
  'SELECT 1',
  'ALTER TABLE jobs ADD INDEX idx_jobs_status_created (status, created_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'notifications' AND index_name = 'idx_notifications_status_created'),
  'SELECT 1',
  'ALTER TABLE notifications ADD INDEX idx_notifications_status_created (status, created_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_notifications' AND index_name = 'idx_user_notifications_user_created'),
  'SELECT 1',
  'ALTER TABLE user_notifications ADD INDEX idx_user_notifications_user_created (user_id, created_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_notifications' AND index_name = 'idx_user_notifications_user_status_created'),
  'SELECT 1',
  'ALTER TABLE user_notifications ADD INDEX idx_user_notifications_user_status_created (user_id, status, created_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_direct_messages' AND index_name = 'idx_udm_pair_created'),
  'SELECT 1',
  'ALTER TABLE user_direct_messages ADD INDEX idx_udm_pair_created (sender_id, receiver_id, created_at)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_direct_conversation_messages' AND index_name = 'idx_direct_message_conversation_created'),
  'SELECT 1',
  'ALTER TABLE user_direct_conversation_messages ADD INDEX idx_direct_message_conversation_created (conversation_id, created_at, id)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
